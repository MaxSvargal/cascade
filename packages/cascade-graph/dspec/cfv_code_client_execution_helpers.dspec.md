// cfv_code_client_execution_helpers.dspec.md
// Internal code specifications for client-side execution/simulation helpers.

code cfv_code.InternalFlowSimulation_SimulateFlowExecution {
    title: "Internal Client-Side: Simulate Complete Flow Execution (Simplified for Debug Tab)"
    part_of_design: cfv_designs.InternalFlowSimulationLogic // Grouping design
    language: "TypeScript"
    implementation_location: {
        filepath: "services/ClientFlowSimulationLogic.ts",
        entry_point_name: "simulateFlowExecutionClientSide",
        entry_point_type: "async_function"
    }
    signature: `(params: {
        flowFqn: string,
        triggerInput: any,
        targetStepId?: string,
        moduleRegistry: cfv_models.IModuleRegistry,
        // componentSchemas: Record<string, cfv_models.ComponentSchema>, // Schemas accessed via moduleRegistry
        executionOptions?: cfv_models.ExecutionOptions
    }) => Promise<cfv_models.FlowSimulationResult>`
    detailed_behavior: \`
        // This is a SIMPLIFIED client-side simulation, primarily for supporting `resolveStepInputData`
        // or basic UI previews for the Debug & Test tab. Complex execution is server-side.
        // Based on original cfv_internal_services_code.FlowSimulationService.simulateFlowExecution

        DECLARE flowFqn = params.flowFqn
        DECLARE triggerInput = params.triggerInput
        DECLARE targetStepId = params.targetStepId
        DECLARE moduleRegistry = params.moduleRegistry
        DECLARE executionOptions = params.executionOptions

        DECLARE flowDef = CALL moduleRegistry.getFlowDefinitionDsl WITH { flowFqn: flowFqn }
        IF flowDef IS_NULL THEN
            THROW_ERROR "Flow not found: " + flowFqn
        END_IF

        DECLARE executionContext AS cfv_models.ExecutionContext
        CREATE_INSTANCE cfv_models.ExecutionContext WITH {
            flowFqn: flowFqn,
            executionId: "client-sim-" + (CALL Math.random).toString(),
            startTime: (CALL SystemTime.toISOString WITH { date: (CALL SystemTime.now) }),
            triggerInput: triggerInput,
            stepResults: (CREATE_INSTANCE Map), // Map<string, cfv_models.StepSimulationResult>
            contextVariables: (CREATE_INSTANCE Map), // Map<string, any>
            executionLog: [],
            errors: []
        } ASSIGN_TO executionContext

        // Load initial context variables from flowDef.context if present
        IF flowDef.context IS_PRESENT THEN
            FOR_EACH key, value IN flowDef.context
                CALL executionContext.contextVariables.set WITH { key: key, value: value }
            END_FOR
        END_IF

        // Simulate trigger execution
        DECLARE triggerSimResult = CALL cfv_code.InternalComponentExecution_SimulateTrigger WITH { triggerDef: flowDef.trigger, triggerInput: triggerInput, context: executionContext, moduleRegistry: moduleRegistry }
        CALL executionContext.stepResults.set WITH { key: 'trigger', value: triggerSimResult }
        // Apply context changes from trigger output if any (though triggers usually don't modify flow context vars directly)

        DECLARE stepsToExecute AS List<cfv_models.FlowStepDsl> = []
        IF flowDef.steps IS_PRESENT THEN
            IF targetStepId IS_PRESENT THEN
                FOR_EACH step IN flowDef.steps
                    ADD step TO stepsToExecute
                    IF step.step_id EQUALS targetStepId THEN BREAK END_IF
                END_FOR
            ELSE
                ASSIGN stepsToExecute = flowDef.steps
            END_IF
        END_IF

        FOR_EACH step IN stepsToExecute
            TRY
                // Check step condition if present (simplified: assume true if not present)
                IF step.condition IS_PRESENT THEN
                    // TODO: Implement simplified client-side condition evaluation if needed.
                    // For now, assume condition passes for client simulation.
                    CALL AbstractLogger.logInfo WITH { message: "Step " + step.step_id + " has condition: " + step.condition + " (evaluation skipped in client sim)" }
                END_IF

                DECLARE stepResolvedInput = CALL cfv_code.InternalFlowSimulation_ResolveStepInput WITH { step: step, executionContext: executionContext, moduleRegistry: moduleRegistry }
                DECLARE stepSimResult = CALL cfv_code.InternalComponentExecution_SimulateStep WITH { step: step, stepInput: stepResolvedInput, context: executionContext, moduleRegistry: moduleRegistry }
                CALL executionContext.stepResults.set WITH { key: step.step_id, value: stepSimResult }

                // Apply context changes from step outputs_map (simplified)
                IF step.outputs_map IS_PRESENT THEN
                    FOR_EACH outputMapping IN (step.outputs_map AS List<any>) // Assuming outputs_map can be list for context
                        IF outputMapping.target AND outputMapping.target.startsWith("context.") THEN
                            DECLARE contextVarName = outputMapping.target.substring(8)
                            DECLARE sourceValue = CALL GetNestedValueUtility.get WITH { obj: stepSimResult.outputData, path: outputMapping.source }
                            CALL executionContext.contextVariables.set WITH { key: contextVarName, value: sourceValue }
                        END_IF
                    END_FOR
                END_IF

                IF step.step_id EQUALS targetStepId THEN BREAK END_IF
            CATCH_ERROR e
                CALL AbstractLogger.logError WITH { message: "Client sim error for step " + step.step_id + ": " + e.message }
                ADD { message: e.message, stepId: step.step_id, errorType: "StepSimulationError" } TO executionContext.errors
                IF executionOptions?.continueOnError IS_FALSE THEN BREAK END_IF
            END_TRY
        END_FOR

        DECLARE finalSimResult AS cfv_models.FlowSimulationResult
        CREATE_INSTANCE cfv_models.FlowSimulationResult WITH {
            flowFqn: flowFqn,
            targetStepId: targetStepId,
            status: (executionContext.errors.length > 0 ? 'FAILED' : 'COMPLETED'),
            triggerInputData: triggerInput,
            stepResults: Object.fromEntries(executionContext.stepResults),
            finalContextState: Object.fromEntries(executionContext.contextVariables),
            errors: executionContext.errors,
            executionId: executionContext.executionId,
            startTime: executionContext.startTime,
            endTime: (CALL SystemTime.toISOString WITH { date: (CALL SystemTime.now) })
            // dataLineage, executionLog, finalInputData can be populated if needed
        } ASSIGN_TO finalSimResult
        RETURN_VALUE finalSimResult
    \`
    dependencies: [
        "cfv_models.IModuleRegistry", "cfv_models.ExecutionOptions", "cfv_models.FlowSimulationResult",
        "cfv_models.ExecutionContext", "cfv_models.FlowStepDsl", "cfv_models.StepSimulationResult",
        "cfv_code.InternalComponentExecution_SimulateTrigger",
        "cfv_code.InternalFlowSimulation_ResolveStepInput",
        "cfv_code.InternalComponentExecution_SimulateStep",
        "Math.random", "SystemTime.now", "SystemTime.toISOString",
        "AbstractLogger.logInfo", "AbstractLogger.logError",
        "GetNestedValueUtility.get"
    ]
}

code cfv_code.InternalFlowSimulation_ResolveStepInput {
    title: "Internal Client-Side: Resolve Step Input Data (Simplified)"
    part_of_design: cfv_designs.InternalFlowSimulationLogic
    language: "TypeScript"
    implementation_location: {
        filepath: "services/ClientFlowSimulationLogic.ts",
        entry_point_name: "resolveStepInputClientSide",
        entry_point_type: "function"
    }
    signature: \`(params: {
        step: cfv_models.FlowStepDsl,
        executionContext: cfv_models.ExecutionContext,
        moduleRegistry: cfv_models.IModuleRegistry
    }) => cfv_models.ResolvedStepInput\`
    detailed_behavior: \`
        // Based on original cfv_internal_services_code.FlowSimulationService.resolveStepInput
        // Simplified for client-side needs (e.g., populating Debug & Test tab forms).
        DECLARE step = params.step
        DECLARE executionContext = params.executionContext
        DECLARE moduleRegistry = params.moduleRegistry
        DECLARE resolvedInputData AS cfv_models.Any = {}
        DECLARE inputSources AS List<cfv_models.Any> = []

        IF step.inputs_map IS_PRESENT THEN
            FOR_EACH inputKey, sourceExpression IN step.inputs_map
                DECLARE resolvedValue = null
                DECLARE sourceInfo = { type: 'unknown', expression: sourceExpression, inputKey: inputKey }

                IF TYPE_OF sourceExpression IS 'string' THEN
                    IF sourceExpression.startsWith('trigger.') THEN
                        DECLARE triggerResult = CALL executionContext.stepResults.get WITH { key: 'trigger' }
                        DECLARE triggerPath = CALL sourceExpression.substring WITH { start: 8 } // "trigger.".length
                        // REFINED: Trigger output data is the standardized format, not the original external event
                        ASSIGN resolvedValue = triggerResult ? (CALL GetNestedValueUtility.get WITH { obj: triggerResult.outputData, path: triggerPath }) : null
                        ASSIGN sourceInfo.type = 'triggerOutput'
                        ASSIGN sourceInfo.path = triggerPath
                        ASSIGN sourceInfo.description = 'Data from trigger standardized output (trigger.' + triggerPath + ')'
                    ELSE_IF sourceExpression.startsWith('steps.') THEN
                        DECLARE stepsMatch = CALL RegExpAPI.match WITH { text: sourceExpression, pattern: /^steps\\.([^.]+)\\.(outputs\\.)?(.+)$/ }
                        IF stepsMatch IS_PRESENT THEN
                            DECLARE sourceStepId = stepsMatch[1]
                            DECLARE dataPath = stepsMatch[3] // Path after 'outputs.' or directly field name
                            DECLARE sourceStepResult = CALL executionContext.stepResults.get WITH { key: sourceStepId }
                            IF sourceStepResult IS_PRESENT AND sourceStepResult.outputData IS_PRESENT THEN
                                ASSIGN resolvedValue = CALL GetNestedValueUtility.get WITH { obj: sourceStepResult.outputData, path: dataPath }
                                ASSIGN sourceInfo.type = 'previousStepOutput'; ASSIGN sourceInfo.id = sourceStepId; ASSIGN sourceInfo.path = dataPath
                            ELSE
                                ASSIGN sourceInfo.error = 'step_not_found_or_no_output'
                            END_IF
                        ELSE
                            ASSIGN sourceInfo.error = 'invalid_steps_expression'
                        END_IF
                    ELSE_IF sourceExpression.startsWith('context.') THEN
                        DECLARE contextKey = CALL sourceExpression.substring WITH { start: 8 } // "context.".length
                        ASSIGN resolvedValue = CALL executionContext.contextVariables.get WITH { key: contextKey }
                        ASSIGN sourceInfo.type = 'contextVariable'; ASSIGN sourceInfo.id = contextKey
                    ELSE
                        // Attempt to parse as JSON if it looks like a structured literal
                        TRY
                            ASSIGN resolvedValue = JSON.parse(sourceExpression)
                            ASSIGN sourceInfo.type = 'literal_json'
                        CATCH_ERROR jsonError
                            ASSIGN resolvedValue = sourceExpression // Treat as string literal
                            ASSIGN sourceInfo.type = 'literal_string'
                        END_TRY
                    END_IF
                ELSE // Not a string, so it's a direct literal value (number, boolean, object)
                    ASSIGN resolvedValue = sourceExpression
                    ASSIGN sourceInfo.type = 'literal_value'
                END_IF
                ASSIGN resolvedInputData[inputKey] = resolvedValue
                ADD { ...sourceInfo, resolvedValue: resolvedValue } TO inputSources
            END_FOR
        ELSE // Default: if no inputs_map, and it's the first step, consider trigger output as input.
            IF executionContext.stepResults.size EQUALS 1 AND CALL executionContext.stepResults.has WITH {key: 'trigger'} THEN // Only trigger executed so far
                DECLARE triggerRes = CALL executionContext.stepResults.get WITH { key: 'trigger' }
                ASSIGN resolvedInputData = triggerRes.outputData OR {}
                ADD { type: 'triggerOutput', expression: 'trigger', inputKey: '_default', resolvedValue: resolvedInputData } TO inputSources
            END_IF
        END_IF

        DECLARE componentInfo = CALL moduleRegistry.resolveComponentTypeInfo WITH { componentRef: step.component_ref, currentModuleFqn: executionContext.flowFqn }
        DECLARE componentSchema = null
        IF componentInfo IS_PRESENT THEN
             ASSIGN componentSchema = CALL moduleRegistry.getComponentSchema WITH { componentTypeFqn: componentInfo.baseType }
        END_IF

        DECLARE resolvedStepInputResult AS cfv_models.ResolvedStepInput
        CREATE_INSTANCE cfv_models.ResolvedStepInput WITH {
            stepId: step.step_id,
            flowFqn: executionContext.flowFqn,
            componentFqn: componentInfo?.baseType OR step.component_ref,
            componentSchema: componentSchema,
            actualInputData: resolvedInputData,
            dslConfig: step.config,
            availableContext: Object.fromEntries(executionContext.contextVariables),
            inputSources: inputSources
        } ASSIGN_TO resolvedStepInputResult
        RETURN_VALUE resolvedStepInputResult
    \`
    dependencies: [
        "cfv_models.FlowStepDsl", "cfv_models.ExecutionContext", "cfv_models.ResolvedStepInput", "cfv_models.IModuleRegistry",
        "GetNestedValueUtility.get",
        "RegExpAPI.match",
        "JSON.parse"
    ]
}

code cfv_code.InternalComponentExecution_SimulateTrigger {
    title: "Internal Client-Side: Simulate Trigger Execution for Client UI"
    part_of_design: cfv_designs.InternalComponentExecutionLogic
    language: "TypeScript"
    implementation_location: {
        filepath: "services/ClientComponentSimulationLogic.ts",
        entry_point_name: "simulateTriggerClientSide",
        entry_point_type: "function"
    }
    signature: "(params: { triggerDef: cfv_models.TriggerDefinitionDsl, triggerInput: cfv_models.Any, context: cfv_models.ExecutionContext, moduleRegistry: cfv_models.IModuleRegistry }) => cfv_models.StepSimulationResult"
    detailed_behavior: \`
        // REFINED: Triggers are entry points that convert external events into standardized flow contexts.
        // The triggerInput represents the EXTERNAL EVENT data (e.g., HTTP request, scheduled time, event payload).
        // The trigger's job is to convert this into a STANDARDIZED OUTPUT that the flow can reliably use.
        
        DECLARE triggerDef = params.triggerDef
        DECLARE externalEventData = params.triggerInput // This is the external event data
        DECLARE standardizedOutput = {} // This will be the standardized output for the flow

        // Attempt to get schema for structured output generation
        DECLARE triggerSchema = CALL params.moduleRegistry.getComponentSchema WITH { componentTypeFqn: triggerDef.type }
        
        IF triggerSchema.triggerOutputSchema IS_PRESENT THEN
            // Generate sample data based on triggerOutputSchema (the standardized output format)
            ASSIGN standardizedOutput = CALL cfv_code.InternalDataGeneration_GenerateDataFromSchema WITH { schema: triggerSchema.triggerOutputSchema, scenario: 'happyPath' }
            
            // Merge/override with actual external event data where it makes sense
            // This simulates how a real trigger would process the external event into the standard format
            IF TYPE_OF standardizedOutput IS 'object' AND TYPE_OF externalEventData IS 'object' THEN
                // For simulation, we can merge external data into the standard structure
                // In reality, triggers would have specific logic to map external events to standard format
                ASSIGN standardizedOutput = { ...standardizedOutput, ...externalEventData }
            END_IF
        ELSE
            // Fallback: Use trigger-specific logic to create standardized output
            SWITCH triggerDef.type
                CASE 'StdLib.Trigger:Http'
                    // HTTP triggers standardize HTTP requests into HttpTriggerRequest format
                    CREATE_INSTANCE cfv_models.Any WITH {
                        path: triggerDef.config?.path OR '/api/trigger',
                        method: triggerDef.config?.method OR 'POST',
                        headers: externalEventData.headers OR {},
                        queryParameters: externalEventData.queryParameters OR {},
                        body: externalEventData.body OR externalEventData, // If externalEventData is simple, assume it's the body
                        principal: externalEventData.principal OR null // Authentication info if available
                    } ASSIGN_TO standardizedOutput
                    BREAK
                CASE 'StdLib.Trigger:Scheduled'
                    // Scheduled triggers provide timing info and configured payload
                    CREATE_INSTANCE cfv_models.Any WITH {
                        triggerTime: (CALL SystemTime.toISOString WITH { date: (CALL SystemTime.now) }),
                        scheduledTime: externalEventData.scheduledTime OR (CALL SystemTime.toISOString WITH { date: (CALL SystemTime.now) }),
                        payload: triggerDef.config?.initialPayload OR externalEventData
                    } ASSIGN_TO standardizedOutput
                    BREAK
                CASE 'StdLib.Trigger:EventBus'
                    // EventBus triggers standardize events into EventBusTriggerPayload format
                    CREATE_INSTANCE cfv_models.Any WITH {
                        event: {
                            id: externalEventData.id OR "sim-event-" + (CALL Math.random).toString(),
                            type: externalEventData.type OR "simulated.event",
                            source: externalEventData.source OR "client-simulation",
                            timestamp: (CALL SystemTime.toISOString WITH { date: (CALL SystemTime.now) }),
                            payload: externalEventData.payload OR externalEventData
                        }
                    } ASSIGN_TO standardizedOutput
                    BREAK
                CASE 'StdLib.Trigger:Manual'
                    // Manual triggers pass through the provided data as initialData
                    CREATE_INSTANCE cfv_models.Any WITH {
                        initialData: externalEventData
                    } ASSIGN_TO standardizedOutput
                    BREAK
                DEFAULT
                    // Generic fallback for unknown trigger types
                    ASSIGN standardizedOutput = { triggerData: externalEventData, triggerType: triggerDef.type }
                    BREAK
            END_SWITCH
        END_IF

        DECLARE result AS cfv_models.StepSimulationResult
        CREATE_INSTANCE cfv_models.StepSimulationResult WITH {
            stepId: 'trigger',
            componentFqn: triggerDef.type,
            inputData: externalEventData, // The external event data that came into the trigger
            outputData: standardizedOutput,  // The standardized data provided by the trigger TO THE FLOW
            executionTime: 0, // Triggers typically have minimal processing time
            timestamp: (CALL SystemTime.toISOString WITH { date: (CALL SystemTime.now) }),
            simulationSuccess: true
        } ASSIGN_TO result
        RETURN_VALUE result
    \`
    dependencies: [
        "cfv_models.TriggerDefinitionDsl", "cfv_models.ExecutionContext", "cfv_models.StepSimulationResult", "cfv_models.IModuleRegistry",
        "cfv_code.InternalDataGeneration_GenerateDataFromSchema",
        "SystemTime.now", "SystemTime.toISOString", "Math.random"
    ]
}

code cfv_code.InternalComponentExecution_SimulateStep {
    title: "Internal Client-Side: Simulate Step Execution for Client UI (Mock/Simplified)"
    part_of_design: cfv_designs.InternalComponentExecutionLogic
    language: "TypeScript"
    implementation_location: {
        filepath: "services/ClientComponentSimulationLogic.ts",
        entry_point_name: "simulateStepClientSide",
        entry_point_type: "function"
    }
    signature: "(params: { step: cfv_models.FlowStepDsl, stepInput: cfv_models.ResolvedStepInput, context: cfv_models.ExecutionContext, moduleRegistry: cfv_models.IModuleRegistry }) => cfv_models.StepSimulationResult"
    detailed_behavior: \`
        // Simplified client-side simulation. Focus on generating plausible output for UI/form purposes.
        DECLARE step = params.step
        DECLARE resolvedInputData = params.stepInput.actualInputData
        DECLARE config = step.config
        DECLARE componentInfo = CALL params.moduleRegistry.resolveComponentTypeInfo WITH { componentRef: step.component_ref, currentModuleFqn: params.context.flowFqn }
        DECLARE componentFqn = componentInfo?.baseType OR step.component_ref
        DECLARE componentSchema = componentInfo ? (CALL params.moduleRegistry.getComponentSchema WITH { componentTypeFqn: componentFqn }) : null

        DECLARE simulatedOutput = CALL cfv_code.InternalDataGeneration_SimulateComponentExecutionForClient WITH {
            componentType: componentFqn,
            inputData: resolvedInputData,
            config: config,
            componentSchema: componentSchema
        }

        DECLARE result AS cfv_models.StepSimulationResult
        CREATE_INSTANCE cfv_models.StepSimulationResult WITH {
            stepId: step.step_id,
            componentFqn: componentFqn,
            inputData: resolvedInputData,
            outputData: simulatedOutput.payload, // Assuming SimulateComponentExecutionForClient returns {payload, executionTiming}
            executionTime: (simulatedOutput.executionTiming.estimatedDurationMs OR 10),
            timestamp: (CALL SystemTime.toISOString WITH { date: (CALL SystemTime.now) }),
            simulationSuccess: true,
            inputSources: params.stepInput.inputSources
        } ASSIGN_TO result
        RETURN_VALUE result
    \`
    dependencies: [
        "cfv_models.FlowStepDsl", "cfv_models.ResolvedStepInput", "cfv_models.ExecutionContext", "cfv_models.StepSimulationResult", "cfv_models.IModuleRegistry",
        "cfv_code.InternalDataGeneration_SimulateComponentExecutionForClient",
        "SystemTime.now", "SystemTime.toISOString"
    ]
}

code cfv_code.InternalDataGeneration_SimulateComponentExecutionForClient {
    title: "Internal Client-Side: Simulate Component Output Payload for UI/Forms"
    part_of_design: cfv_designs.InternalDataGenerationLogic
    language: "TypeScript"
    implementation_location: {
        filepath: "services/ClientDataGenerationLogic.ts",
        entry_point_name: "simulateComponentExecutionPayloadForClient",
        entry_point_type: "function"
    }
    signature: "(params: { componentType: string, inputData: any, config: any, componentSchema?: cfv_models.ComponentSchema }) => { payload: any, executionTiming: { isAsync: boolean, estimatedDurationMs: number, enablesParallelExecution?: boolean } }"
    detailed_behavior: \`
        // Primary goal: generate plausible output data for client-side use cases (e.g., populating next step's input form).
        // It SHOULD use componentSchema.outputSchema to generate data if possible.

        DECLARE componentType = params.componentType
        DECLARE inputData = params.inputData
        DECLARE config = params.config
        DECLARE componentSchema = params.componentSchema
        DECLARE outputPayload = {}

        IF componentSchema.outputSchema IS_PRESENT THEN
            ASSIGN outputPayload = CALL cfv_code.InternalDataGeneration_GenerateDataFromSchema WITH { schema: componentSchema.outputSchema, scenario: 'happyPath' }
        ELSE
            SWITCH componentType // Fallback for common components without explicit output schemas for client sim
                CASE 'StdLib:Fork'
                    DECLARE forkOutputs = {}
                    IF config.outputNames IS_PRESENT AND IS_ARRAY config.outputNames THEN
                        FOR_EACH outputName IN config.outputNames
                            ASSIGN forkOutputs[outputName] = inputData // Fork typically duplicates input
                        END_FOR
                    ELSE // Fallback if outputNames is missing or malformed
                        ASSIGN forkOutputs.default_output = inputData
                    END_IF
                    ASSIGN outputPayload = { branches: forkOutputs }
                    BREAK
                CASE 'StdLib:JsonSchemaValidator'
                    ASSIGN outputPayload = { isValid: true, validData: (inputData.data OR inputData), errors: [] }
                    BREAK
                CASE 'StdLib:HttpCall'
                    ASSIGN outputPayload = { response: { status: 200, body: { message: "Simulated HTTP OK" }, headers: {} } }
                    BREAK
                CASE 'StdLib:SubFlowInvoker'
                    ASSIGN outputPayload = { subFlowResult: { success: true, data: inputData }, status: 'completed' }
                    BREAK
                DEFAULT
                    ASSIGN outputPayload = { result: inputData, message: "Simulated client-side output for " + componentType }
                    BREAK
            END_SWITCH
        END_IF

        DECLARE timingInfo = { isAsync: false, estimatedDurationMs: 10, enablesParallelExecution: false }
        IF componentType.includes("HttpCall") OR componentType.includes("SubFlowInvoker") OR componentType.includes("WaitForDuration") THEN
            ASSIGN timingInfo.isAsync = true
            DECLARE duration = config?.timeoutMs OR config?.durationMs OR 500
            ASSIGN timingInfo.estimatedDurationMs = (TYPE_OF duration IS 'number' ? duration * 0.5 : 500)
        END_IF
        IF componentType.includes("Fork") THEN
            ASSIGN timingInfo.enablesParallelExecution = true
        END_IF

        RETURN_VALUE { payload: outputPayload, executionTiming: timingInfo }
    \`
    dependencies: ["cfv_code.InternalDataGeneration_GenerateDataFromSchema", "cfv_models.ComponentSchema"]
}

code cfv_code.InternalDataGeneration_GenerateDataFromSchema {
    title: "Internal: Generate Data from JSON Schema (Happy Path or Empty)"
    part_of_design: cfv_designs.InternalDataGenerationLogic
    language: "TypeScript"
    implementation_location: {
        filepath: "services/ClientDataGenerationLogic.ts",
        entry_point_name: "generateDataFromSchema",
        entry_point_type: "function"
    }
    signature: "(params: { schema: cfv_models.JsonSchemaObject, scenario: 'happyPath' | 'empty' }) => any"
    detailed_behavior: \`
        // Recursive function. For 'happyPath', generates plausible values. For 'empty', minimal valid structure.
        DECLARE schema = params.schema
        DECLARE scenario = params.scenario

        IF schema.default IS_PRESENT AND scenario EQUALS 'happyPath' THEN RETURN_VALUE schema.default END_IF
        IF schema.const IS_PRESENT THEN RETURN_VALUE schema.const END_IF
        IF schema.examples IS_PRESENT AND schema.examples.length > 0 AND scenario EQUALS 'happyPath' THEN RETURN_VALUE schema.examples[0] END_IF
        IF schema.enum IS_PRESENT AND schema.enum.length > 0 THEN RETURN_VALUE schema.enum[0] END_IF


        SWITCH schema.type
            CASE 'object'
                DECLARE obj = {}
                IF schema.properties IS_PRESENT THEN
                    FOR_EACH propName, propSchema IN schema.properties
                        IF scenario EQUALS 'happyPath' OR (scenario EQUALS 'empty' AND schema.required AND schema.required.includes(propName)) THEN
                            ASSIGN obj[propName] = CALL cfv_code.InternalDataGeneration_GenerateDataFromSchema WITH { schema: propSchema, scenario: scenario }
                        END_IF
                    END_FOR
                END_IF
                RETURN_VALUE obj
            CASE 'array'
                IF scenario EQUALS 'empty' AND (schema.minItems IS_NULL OR schema.minItems EQUALS 0) THEN RETURN_VALUE [] END_IF
                DECLARE arr = []
                DECLARE itemCount = (scenario EQUALS 'happyPath' ? (schema.minItems OR 1) : (schema.minItems OR 0))
                IF schema.items IS_PRESENT AND itemCount > 0 THEN // Assuming 'items' is single schema for array elements
                    FOR i FROM 1 TO itemCount
                        ADD (CALL cfv_code.InternalDataGeneration_GenerateDataFromSchema WITH { schema: schema.items, scenario: scenario }) TO arr
                    END_FOR
                END_IF
                RETURN_VALUE arr
            CASE 'string'
                IF schema.format EQUALS 'date-time' THEN RETURN_VALUE (CALL SystemTime.toISOString WITH { date: (CALL SystemTime.now) }) END_IF
                IF schema.format EQUALS 'date' THEN RETURN_VALUE (CALL SystemTime.toISOString WITH { date: (CALL SystemTime.now) }).substring(0,10) END_IF
                IF schema.pattern IS_PRESENT AND scenario EQUALS 'happyPath' THEN RETURN_VALUE "matching_pattern_value" END_IF // Placeholder for regex generation
                RETURN_VALUE (scenario EQUALS 'happyPath' ? "sample_string" : "")
            CASE 'number'
            CASE 'integer'
                RETURN_VALUE (schema.minimum OR 0)
            CASE 'boolean'
                RETURN_VALUE (scenario EQUALS 'happyPath' ? true : false) // Or schema.default if present
            CASE 'null'
                RETURN_VALUE null
            DEFAULT // Includes cases with multiple types, or no type (any)
                IF schema.anyOf IS_PRESENT AND schema.anyOf.length > 0 THEN
                    RETURN_VALUE CALL cfv_code.InternalDataGeneration_GenerateDataFromSchema WITH { schema: schema.anyOf[0], scenario: scenario }
                END_IF
                IF schema.oneOf IS_PRESENT AND schema.oneOf.length > 0 THEN
                    RETURN_VALUE CALL cfv_code.InternalDataGeneration_GenerateDataFromSchema WITH { schema: schema.oneOf[0], scenario: scenario }
                END_IF
                RETURN_VALUE (scenario EQUALS 'happyPath' ? { generated_any_value: true } : null)
        END_SWITCH
    \`
    dependencies: ["cfv_models.JsonSchemaObject", "SystemTime.now", "SystemTime.toISOString"] // Recursive call to self
}


// Stubs for ComponentSchemaService and TestCaseService helpers
code cfv_code.ComponentSchemaService_GenerateRjsfSchema {
    title: "Generate RJSF Compatible Schema from JSON Schema"
    part_of_design: cfv_designs.ComponentSchemaService // Or cfv_designs.InternalComponentSchemaLogic
    language: "TypeScript"
    implementation_location: { filepath: "services/ComponentSchemaServiceLogic.ts", entry_point_name: "generateRjsfSchema" }
    signature: "(params: { jsonSchema: cfv_models.JsonSchemaObject }) => { schema: cfv_models.JsonSchemaObject, uiSchema?: cfv_models.Any }"
    detailed_behavior: `
        // Stub: This would involve transforming the input jsonSchema and potentially creating a uiSchema
        // for use with React JSON Schema Form (@rjsf/core).
        DECLARE rjsfSchema = { ...params.jsonSchema } // Basic pass-through for now
        DECLARE uiSchema = {} // Placeholder for UI hints
        // Example: if jsonSchema has 'format: "date-time"', add 'ui:widget: "datetime"' to uiSchema for that field.
        RETURN_VALUE { schema: rjsfSchema, uiSchema: uiSchema }
    `
    dependencies: ["cfv_models.JsonSchemaObject", "cfv_models.Any"]
}

code cfv_code.TestCaseService_GenerateTemplateClientSide {
    title: "Client-Side: Generate FlowTestCase Template"
    part_of_design: cfv_designs.TestCaseService // Or cfv_designs.InternalTestCaseLogic
    language: "TypeScript"
    implementation_location: { filepath: "services/ClientTestCaseLogic.ts", entry_point_name: "generateTestCaseTemplateClientSide" }
    signature: "(params: { flowFqn: string, scenarioType: 'happyPath' | 'errorCase' | 'custom', moduleRegistry: cfv_models.IModuleRegistry }) => cfv_models.FlowTestCase"
    detailed_behavior: `
        // Stub: Generates a basic cfv_models.FlowTestCase structure.
        DECLARE flowDef = CALL params.moduleRegistry.getFlowDefinitionDsl WITH { flowFqn: params.flowFqn }
        DECLARE triggerInputSchema = null
        IF flowDef.trigger IS_PRESENT THEN
            DECLARE triggerComponentSchema = CALL params.moduleRegistry.getComponentSchema WITH { componentTypeFqn: flowDef.trigger.type }
            IF triggerComponentSchema.triggerOutputSchema IS_PRESENT THEN
                ASSIGN triggerInputSchema = triggerComponentSchema.triggerOutputSchema
            END_IF
        END_IF

        DECLARE triggerInputSample = {}
        IF triggerInputSchema IS_PRESENT THEN
            ASSIGN triggerInputSample = CALL cfv_code.InternalDataGeneration_GenerateDataFromSchema WITH { schema: triggerInputSchema, scenario: (params.scenarioType EQUALS 'errorCase' ? 'empty' : 'happyPath') }
        END_IF

        DECLARE testCase AS cfv_models.FlowTestCase
        CREATE_INSTANCE cfv_models.FlowTestCase WITH {
            id: "tc-" + (CALL Math.random).toString(),
            flowFqn: params.flowFqn,
            name: params.scenarioType + " test for " + params.flowFqn,
            triggerInput: triggerInputSample,
            assertions: [
                { id: "assert-status", targetPath: "status", expectedValue: (params.scenarioType EQUALS 'errorCase' ? "FAILED" : "COMPLETED"), comparison: "equals" }
            ]
        } ASSIGN_TO testCase
        RETURN_VALUE testCase
    `
    dependencies: [
        "cfv_models.FlowTestCase", "cfv_models.IModuleRegistry",
        "cfv_code.InternalDataGeneration_GenerateDataFromSchema",
        "Math.random"
    ]
}