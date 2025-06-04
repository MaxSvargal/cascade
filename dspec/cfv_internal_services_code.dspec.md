// cfv_internal_services_code.dspec
// Defines internal service implementations for the CascadeFlowVisualizer library.
// These services provide core functionality for flow simulation, YAML reconstruction, 
// trace visualization, and enhanced layout management.

// --- FLOW SIMULATION SERVICE ---

service FlowSimulationService {
    description: "Provides realistic flow execution simulation with proper data propagation and component execution"
    
    method simulateFlowExecution {
        signature: `
            simulateFlowExecution(
                flowFqn: string,
                triggerInput: any,
                targetStepId?: string,
                moduleRegistry: IModuleRegistry,
                componentSchemas: Record<string, ComponentSchema>,
                executionOptions?: FlowExecutionOptions
            ): Promise<FlowSimulationResult>
        `
        
        implementation: `
            FUNCTION simulateFlowExecution(flowFqn, triggerInput, targetStepId, moduleRegistry, componentSchemas, executionOptions) {
                // Get flow definition from module registry
                DECLARE flowDef = CALL moduleRegistry.getFlowDefinition WITH flowFqn
                IF NOT flowDef THEN
                    THROW new Error("Flow not found: " + flowFqn)
                END_IF
                
                // Initialize execution context
                DECLARE executionContext = {
                    flowFqn: flowFqn,
                    executionId: 'sim-' + Math.random().toString(36).substr(2, 9),
                    startTime: new Date().toISOString(),
                    triggerInput: triggerInput,
                    stepResults: new Map(),
                    contextVariables: new Map(),
                    executionLog: [],
                    errors: []
                }
                
                // Load context variables from module
                DECLARE moduleContext = CALL moduleRegistry.getModuleContext WITH flowDef.moduleFqn
                FOR_EACH contextVar IN moduleContext.contextVariables
                    ASSIGN executionContext.contextVariables.set(contextVar.name, contextVar.value)
                END_FOR
                
                // Execute trigger - CRITICAL: trigger must produce proper output data
                DECLARE triggerResult = CALL ComponentExecutionService.executeTrigger WITH flowDef.trigger, triggerInput, executionContext
                ASSIGN executionContext.stepResults.set('trigger', triggerResult)
                
                // Execute steps in order until target step (or all steps)
                DECLARE stepsToExecute = targetStepId ? 
                    CALL getStepsUpToTarget WITH flowDef.steps, targetStepId :
                    flowDef.steps
                
                FOR_EACH step IN stepsToExecute
                    TRY {
                        // CRITICAL: Resolve input data from previous step outputs
                        DECLARE stepInput = CALL resolveStepInput WITH step, executionContext
                        DECLARE stepResult = CALL ComponentExecutionService.executeStep WITH step, stepInput, executionContext, componentSchemas
                        ASSIGN executionContext.stepResults.set(step.id, stepResult)
                        
                        // Log execution with proper data lineage
                        ASSIGN executionContext.executionLog.push({
                            stepId: step.id,
                            timestamp: new Date().toISOString(),
                            input: stepInput,
                            output: stepResult,
                            duration: stepResult.executionTime || 0,
                            dataLineage: stepInput.inputSources
                        })
                        
                        // Break if this is the target step
                        IF step.id EQUALS targetStepId THEN
                            BREAK
                        END_IF
                    } CATCH error {
                        ASSIGN executionContext.errors.push({
                            stepId: step.id,
                            error: error.message,
                            timestamp: new Date().toISOString()
                        })
                        
                        // Stop execution on error unless configured to continue
                        IF NOT executionOptions?.continueOnError THEN
                            BREAK
                        END_IF
                    }
                END_FOR
                
                // Build final result with proper data propagation
                DECLARE finalResult = {
                    executionId: executionContext.executionId,
                    flowFqn: flowFqn,
                    success: executionContext.errors.length === 0,
                    startTime: executionContext.startTime,
                    endTime: new Date().toISOString(),
                    triggerInput: triggerInput,
                    finalOutput: CALL getFinalOutput WITH executionContext,
                    stepResults: Object.fromEntries(executionContext.stepResults),
                    executionLog: executionContext.executionLog,
                    errors: executionContext.errors,
                    contextVariables: Object.fromEntries(executionContext.contextVariables),
                    resolvedStepInputs: CALL buildResolvedInputsMap WITH executionContext
                }
                
                RETURN finalResult
            }
        `
    }
    
    method resolveStepInput {
        signature: `resolveStepInput(step: FlowStep, executionContext: ExecutionContext): ResolvedStepInput`
        
        implementation: `
            FUNCTION resolveStepInput(step, executionContext) {
                DECLARE resolvedInput = {}
                DECLARE inputSources = []
                
                // Process inputs_map to resolve data sources - CRITICAL: must handle all DSL patterns
                IF step.inputs_map IS_DEFINED THEN
                    FOR_EACH inputKey, inputSource IN step.inputs_map
                        DECLARE resolvedValue = null
                        DECLARE sourceInfo = null
                        
                        IF inputSource.startsWith('trigger.') THEN
                            // Resolve from trigger output - CRITICAL: trigger must have proper outputData
                            DECLARE triggerResult = executionContext.stepResults.get('trigger')
                            DECLARE triggerPath = inputSource.substring(8) // Remove 'trigger.'
                            ASSIGN resolvedValue = CALL getNestedValue WITH triggerResult.outputData, triggerPath
                            ASSIGN sourceInfo = { type: 'trigger', path: triggerPath }
                            
                        ELSE_IF inputSource.startsWith('steps.') THEN
                            // Resolve from previous step output - CRITICAL: handle "steps.stepId.outputs.field" pattern
                            DECLARE stepsMatch = inputSource.match(/^steps\.([^.]+)\.(.+)$/)
                            IF stepsMatch THEN
                                DECLARE sourceStepId = stepsMatch[1]
                                DECLARE outputPath = stepsMatch[2]
                                DECLARE stepResult = executionContext.stepResults.get(sourceStepId)
                                
                                IF stepResult AND stepResult.outputData THEN
                                    // Handle "outputs.field" pattern specifically
                                    IF outputPath.startsWith('outputs.') THEN
                                        DECLARE actualPath = outputPath.substring(8) // Remove 'outputs.'
                                        ASSIGN resolvedValue = CALL getNestedValue WITH stepResult.outputData, actualPath
                                    ELSE
                                        // Direct field access for backward compatibility
                                        ASSIGN resolvedValue = CALL getNestedValue WITH stepResult.outputData, outputPath
                                    END_IF
                                    ASSIGN sourceInfo = { type: 'step', stepId: sourceStepId, path: outputPath }
                                ELSE
                                    LOG "Warning: Source step " + sourceStepId + " not found or has no output data"
                                    ASSIGN resolvedValue = null
                                    ASSIGN sourceInfo = { type: 'step', stepId: sourceStepId, path: outputPath, error: 'step_not_found' }
                                END_IF
                            ELSE
                                LOG "Warning: Invalid steps expression format: " + inputSource
                                ASSIGN resolvedValue = null
                                ASSIGN sourceInfo = { type: 'step', error: 'invalid_format', expression: inputSource }
                            END_IF
                            
                        ELSE_IF inputSource.startsWith('context.') THEN
                            // Resolve from context variables
                            DECLARE contextKey = inputSource.substring(8) // Remove 'context.'
                            ASSIGN resolvedValue = executionContext.contextVariables.get(contextKey)
                            ASSIGN sourceInfo = { type: 'context', key: contextKey }
                            
                        ELSE
                            // Direct value or literal
                            ASSIGN resolvedValue = inputSource
                            ASSIGN sourceInfo = { type: 'literal', value: inputSource }
                        END_IF
                        
                        ASSIGN resolvedInput[inputKey] = resolvedValue
                        ASSIGN inputSources.push({
                            inputKey: inputKey,
                            sourceExpression: inputSource,
                            resolvedValue: resolvedValue,
                            sourceInfo: sourceInfo
                        })
                    END_FOR
                ELSE
                    // No inputs_map, use trigger output as default input
                    DECLARE triggerResult = executionContext.stepResults.get('trigger')
                    ASSIGN resolvedInput = triggerResult?.outputData || {}
                    ASSIGN inputSources.push({
                        inputKey: 'default',
                        sourceExpression: 'trigger',
                        resolvedValue: triggerResult?.outputData,
                        sourceInfo: { type: 'trigger', path: null }
                    })
                END_IF
                
                RETURN {
                    stepId: step.id,
                    resolvedInput: resolvedInput,
                    inputSources: inputSources
                }
            }
        `
    }
}

// --- COMPONENT EXECUTION SERVICE ---

service ComponentExecutionService {
    description: "Handles execution simulation for different component types with realistic data generation"
    
    method executeTrigger {
        signature: `executeTrigger(trigger: any, triggerInput: any, executionContext: ExecutionContext): StepExecutionResult`
        
        implementation: `
            FUNCTION executeTrigger(trigger, triggerInput, executionContext) {
                // CRITICAL: Trigger must produce proper outputData that can be consumed by steps
                DECLARE outputData = triggerInput
                
                // Enhance trigger output based on trigger type
                IF trigger.type EQUALS 'StdLib.Trigger:Http' THEN
                    // HTTP triggers provide body, headers, query params
                    ASSIGN outputData = {
                        body: triggerInput.body || triggerInput,
                        headers: triggerInput.headers || {},
                        query: triggerInput.query || {},
                        method: trigger.config?.method || 'POST',
                        path: trigger.config?.path || '/api/trigger'
                    }
                ELSE_IF trigger.type EQUALS 'StdLib.Trigger:EventBus' THEN
                    // Event triggers provide event data
                    ASSIGN outputData = {
                        eventType: triggerInput.eventType || 'unknown',
                        eventData: triggerInput.eventData || triggerInput,
                        timestamp: new Date().toISOString(),
                        source: triggerInput.source || 'system'
                    }
                ELSE
                    // Generic trigger - pass through input data
                    ASSIGN outputData = triggerInput
                END_IF
                
                RETURN {
                    stepId: 'trigger',
                    componentType: trigger.type,
                    inputData: triggerInput,
                    outputData: outputData,
                    executionTime: 0,
                    timestamp: new Date().toISOString(),
                    success: true
                }
            }
        `
    }
    
    method executeStep {
        signature: `executeStep(step: FlowStep, stepInput: ResolvedStepInput, executionContext: ExecutionContext, componentSchemas: Record<string, ComponentSchema>): StepExecutionResult`
        
        implementation: `
            FUNCTION executeStep(step, stepInput, executionContext, componentSchemas) {
                DECLARE startTime = performance.now()
                
                // Get component schema for this step
                DECLARE componentSchema = componentSchemas[step.component_ref] || null
                
                // Execute component with resolved input - CRITICAL: must produce realistic outputs
                DECLARE componentResult = CALL simulateComponentExecution WITH 
                    step.component_ref, 
                    stepInput.resolvedInput, 
                    step.config,
                    componentSchema
                
                DECLARE endTime = performance.now()
                
                // Build execution result with proper metadata
                DECLARE executionResult = {
                    stepId: step.id,
                    componentType: step.component_ref,
                    inputData: stepInput.resolvedInput,
                    outputData: componentResult,
                    executionTime: endTime - startTime,
                    timestamp: new Date().toISOString(),
                    success: true,
                    inputSources: stepInput.inputSources
                }
                
                RETURN executionResult
            }
        `
    }
    
    method simulateComponentExecution {
        signature: `simulateComponentExecution(componentType: string, inputData: any, config: any, componentSchema?: ComponentSchema): any`
        
        implementation: `
            FUNCTION simulateComponentExecution(componentType, inputData, config, componentSchema) {
                // CRITICAL: Generate realistic outputs that can be consumed by downstream steps
                // ENHANCED: Use component configuration to determine execution timing and async behavior
                SWITCH componentType
                    CASE 'StdLib:JsonSchemaValidator'
                        // CRITICAL: Validator must output validData that downstream steps can use
                        // TIMING: Synchronous component - minimal delay (10-50ms)
                        DECLARE validatedData = inputData?.data || inputData
                        RETURN {
                            isValid: true,
                            validData: validatedData, // This is what downstream steps should reference
                            validationResult: {
                                passed: true,
                                errors: [],
                                schema: config?.schema,
                                validatedFields: Object.keys(validatedData || {})
                            },
                            executionTiming: {
                                isAsync: false,
                                estimatedDurationMs: Math.random() * 40 + 10 // 10-50ms for validation
                            }
                        }
                    
                    CASE 'StdLib:Fork'
                        // CRITICAL: Fork must create separate outputs for each branch
                        // TIMING: Synchronous component - very fast (5-20ms)
                        DECLARE forkOutputs = {}
                        IF config?.outputNames IS_DEFINED THEN
                            FOR_EACH outputName IN config.outputNames
                                ASSIGN forkOutputs[outputName] = inputData // Each branch gets copy of input data
                            END_FOR
                        ELSE
                            // Default fork behavior
                            ASSIGN forkOutputs.default = inputData
                        END_IF
                        RETURN {
                            branches: forkOutputs,
                            executionTiming: {
                                isAsync: false,
                                estimatedDurationMs: Math.random() * 15 + 5, // 5-20ms for fork
                                enablesParallelExecution: true // CRITICAL: Fork enables parallel downstream execution
                            }
                        }
                    
                    CASE 'StdLib:MapData'
                        // CRITICAL: Apply actual data transformations based on expression
                        // TIMING: Synchronous component - fast (20-100ms)
                        RETURN {
                            mappedData: CALL evaluateMapDataExpression WITH config.expression, inputData,
                            executionTiming: {
                                isAsync: false,
                                estimatedDurationMs: Math.random() * 80 + 20 // 20-100ms for data mapping
                            }
                        }
                    
                    CASE 'StdLib:HttpCall'
                        // CRITICAL: HTTP calls must return response structure
                        // TIMING: Async component - use config timeout or default (500-3000ms)
                        DECLARE timeoutMs = config?.timeoutMs || (Math.random() * 2500 + 500)
                        RETURN {
                            status: 200,
                            response: {
                                body: CALL generateHttpResponseBody WITH componentType, inputData, config,
                                headers: { 'content-type': 'application/json' },
                                status: 200
                            },
                            requestData: inputData,
                            requestConfig: config,
                            executionTiming: {
                                isAsync: true,
                                estimatedDurationMs: timeoutMs * 0.7, // Use 70% of timeout as realistic duration
                                configuredTimeoutMs: timeoutMs
                            }
                        }
                    
                    CASE 'StdLib:SubFlowInvoker'
                        // CRITICAL: SubFlow invokers must return result structure
                        // TIMING: Async component - depends on invoked flow complexity (1000-5000ms)
                        DECLARE estimatedDuration = Math.random() * 4000 + 1000
                        RETURN {
                            result: {
                                status: 'completed',
                                data: inputData,
                                flowFqn: config?.flowName,
                                executionId: 'subflow-' + Math.random().toString(36).substr(2, 9)
                            },
                            success: true,
                            executionTiming: {
                                isAsync: true,
                                estimatedDurationMs: estimatedDuration
                            }
                        }
                    
                    CASE 'StdLib:WaitForDuration'
                        // CRITICAL: Wait components use configured duration
                        // TIMING: Async component - use exact configured duration
                        DECLARE waitDuration = config?.durationMs || 1000
                        RETURN {
                            data: inputData, // Pass through input data
                            executionTiming: {
                                isAsync: true,
                                estimatedDurationMs: waitDuration,
                                isWaitComponent: true
                            }
                        }
                    
                    CASE 'StdLib:Join'
                        // CRITICAL: Join components wait for multiple inputs
                        // TIMING: Async component - depends on slowest input + timeout
                        DECLARE joinTimeout = config?.timeoutMs || 10000
                        RETURN {
                            aggregatedData: inputData,
                            joinConfig: config,
                            executionTiming: {
                                isAsync: true,
                                estimatedDurationMs: joinTimeout * 0.5, // Assume inputs arrive within 50% of timeout
                                requiresMultipleInputs: true,
                                configuredTimeoutMs: joinTimeout
                            }
                        }
                    
                    DEFAULT
                        // Generic component execution
                        // TIMING: Default to synchronous with moderate delay (100-500ms)
                        DECLARE defaultDuration = Math.random() * 400 + 100
                        RETURN {
                            result: inputData,
                            success: true,
                            timestamp: new Date().toISOString(),
                            componentType: componentType,
                            executionTiming: {
                                isAsync: false,
                                estimatedDurationMs: defaultDuration
                            }
                        }
                END_SWITCH
            }
        `
    }
    
    method evaluateMapDataExpression {
        signature: `evaluateMapDataExpression(expression: string, inputData: any): any`
        
        implementation: `
            FUNCTION evaluateMapDataExpression(expression, inputData) {
                // CRITICAL: Handle common expression patterns from casino example
                IF expression.includes('canProceed') THEN
                    // Handle compliance evaluation
                    RETURN {
                        canProceed: inputData.jurisdictionAllowed !== false && 
                                   inputData.onSanctionsList !== true && 
                                   inputData.ageEligible !== false,
                        complianceFlags: {
                            jurisdiction: inputData.jurisdictionAllowed !== false,
                            sanctions: inputData.onSanctionsList !== true,
                            age: inputData.ageEligible !== false
                        },
                        riskLevel: (inputData.jurisdictionAllowed !== false && 
                                   inputData.onSanctionsList !== true && 
                                   inputData.ageEligible !== false) ? 'low' : 'high'
                    }
                ELSE_IF expression.includes('age') AND expression.includes('isEligible') THEN
                    // Handle age verification
                    DECLARE age = inputData?.dateOfBirth ? 
                        Math.floor((Date.now() - new Date(inputData.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 25
                    RETURN {
                        age: age,
                        isEligible: age >= 18,
                        jurisdiction: inputData?.country || 'US'
                    }
                ELSE_IF expression.includes('userTier') THEN
                    // Handle tier classification
                    DECLARE totalDeposits = inputData?.totalLifetimeDeposits || 0
                    DECLARE tier = totalDeposits >= 250000 ? 'platinum' :
                                  totalDeposits >= 50000 ? 'gold' :
                                  totalDeposits >= 10000 ? 'silver' :
                                  totalDeposits >= 1000 ? 'bronze' : 'standard'
                    RETURN {
                        userTier: tier,
                        originalData: inputData
                    }
                ELSE
                    // Generic transformation - enhance input data
                    RETURN {
                        result: inputData,
                        processed: true,
                        timestamp: new Date().toISOString()
                    }
                END_IF
            }
        `
    }
    
    method generateHttpResponseBody {
        signature: `generateHttpResponseBody(componentType: string, inputData: any, config: any): any`
        
        implementation: `
            FUNCTION generateHttpResponseBody(componentType, inputData, config) {
                // Generate realistic HTTP response bodies based on URL patterns
                IF config?.url?.includes('jurisdiction-check') THEN
                    RETURN {
                        allowed: inputData?.country !== 'RESTRICTED',
                        jurisdiction: inputData?.country || 'US',
                        restrictions: [],
                        checkId: 'jur-' + Math.random().toString(36).substr(2, 9)
                    }
                ELSE_IF config?.url?.includes('sanctions-screening') THEN
                    RETURN {
                        flagged: false, // Simulate clean screening
                        riskScore: 0.1,
                        screeningId: 'san-' + Math.random().toString(36).substr(2, 9),
                        lastUpdated: new Date().toISOString()
                    }
                ELSE_IF config?.url?.includes('/users') AND config?.method === 'POST' THEN
                    RETURN {
                        userId: 'user-' + Math.random().toString(36).substr(2, 9),
                        status: 'active',
                        createdAt: new Date().toISOString(),
                        profile: inputData?.userData || inputData
                    }
                ELSE
                    // Generic HTTP response
                    RETURN {
                        success: true,
                        data: inputData,
                        timestamp: new Date().toISOString()
                    }
                END_IF
            }
        `
    }

    // ENHANCED: New method for parallel execution handling
    method executeStepsInParallel {
        signature: `executeStepsInParallel(parallelSteps: FlowStep[], executionContext: ExecutionContext, componentSchemas: Record<string, ComponentSchema>): Promise<StepExecutionResult[]>`
        
        implementation: `
            FUNCTION executeStepsInParallel(parallelSteps, executionContext, componentSchemas) {
                // CRITICAL: Execute multiple steps concurrently for fork branches and run_after groups
                DECLARE parallelPromises = []
                
                FOR_EACH step IN parallelSteps
                    DECLARE stepPromise = ASYNC_FUNCTION() {
                        // Resolve input data for this step
                        DECLARE stepInput = CALL resolveStepInput WITH step, executionContext
                        
                        // Get component timing information
                        DECLARE componentResult = CALL simulateComponentExecution WITH 
                            step.component_ref, 
                            stepInput.resolvedInput, 
                            step.config,
                            componentSchemas[step.component_ref]
                        
                        DECLARE executionTiming = componentResult.executionTiming || { isAsync: false, estimatedDurationMs: 100 }
                        
                        // Set step to RUNNING status
                        CALL updateStepStatus WITH step.step_id, 'RUNNING', executionContext
                        
                        // Wait for component execution time
                        AWAIT delay(executionTiming.estimatedDurationMs)
                        
                        // Build execution result
                        DECLARE executionResult = {
                            stepId: step.step_id,
                            componentType: step.component_ref,
                            inputData: stepInput.resolvedInput,
                            outputData: componentResult,
                            executionTime: executionTiming.estimatedDurationMs,
                            timestamp: new Date().toISOString(),
                            success: true,
                            inputSources: stepInput.inputSources
                        }
                        
                        // Set step to SUCCESS status
                        CALL updateStepStatus WITH step.step_id, 'SUCCESS', executionContext
                        
                        RETURN executionResult
                    }
                    
                    ADD_TO parallelPromises stepPromise()
                END_FOR
                
                // Wait for all parallel steps to complete
                DECLARE results = AWAIT Promise.all(parallelPromises)
                RETURN results
            }
        `
    }

    // ENHANCED: New method for dependency analysis and execution ordering
    method analyzeDependenciesAndExecute {
        signature: `analyzeDependenciesAndExecute(steps: FlowStep[], executionContext: ExecutionContext, componentSchemas: Record<string, ComponentSchema>): Promise<void>`
        
        implementation: `
            FUNCTION analyzeDependenciesAndExecute(steps, executionContext, componentSchemas) {
                // CRITICAL: Analyze step dependencies and execute in proper order with parallelization
                DECLARE dependencyGraph = CALL buildDependencyGraph WITH steps
                DECLARE executionQueue = []
                DECLARE completedSteps = new Set(['trigger']) // Trigger is always completed first
                
                WHILE completedSteps.size < steps.length + 1 // +1 for trigger
                    // Find steps that can execute now (all dependencies completed)
                    DECLARE readySteps = []
                    FOR_EACH step IN steps
                        IF NOT completedSteps.has(step.step_id) THEN
                            DECLARE dependencies = CALL getStepDependencies WITH step, dependencyGraph
                            DECLARE allDependenciesMet = true
                            
                            FOR_EACH dependency IN dependencies
                                IF NOT completedSteps.has(dependency) THEN
                                    ASSIGN allDependenciesMet = false
                                    BREAK
                                END_IF
                            END_FOR
                            
                            IF allDependenciesMet THEN
                                ADD_TO readySteps step
                            END_IF
                        END_IF
                    END_FOR
                    
                    IF readySteps.length IS_ZERO THEN
                        THROW new Error("Circular dependency detected or no steps ready to execute")
                    END_IF
                    
                    // Execute ready steps in parallel
                    DECLARE stepResults = AWAIT executeStepsInParallel(readySteps, executionContext, componentSchemas)
                    
                    // Mark steps as completed
                    FOR_EACH result IN stepResults
                        ADD_TO completedSteps result.stepId
                        ASSIGN executionContext.stepResults.set(result.stepId, result)
                    END_FOR
                END_WHILE
            }
        `
    }

    // ENHANCED: New method for proper flow completion handling
    method completeFlowExecution {
        signature: `completeFlowExecution(executionContext: ExecutionContext, targetStepId?: string): FlowExecutionTrace`
        
        implementation: `
            FUNCTION completeFlowExecution(executionContext, targetStepId) {
                // CRITICAL: Properly complete flow execution and update final step status
                DECLARE allSteps = Array.from(executionContext.stepResults.values())
                DECLARE flowStatus = 'COMPLETED'
                
                // Check if any step failed
                FOR_EACH stepResult IN allSteps
                    IF stepResult.success IS_FALSE THEN
                        ASSIGN flowStatus = 'FAILED'
                        BREAK
                    END_IF
                END_FOR
                
                // Find the final step (last executed step or target step)
                DECLARE finalStep = null
                IF targetStepId IS_DEFINED THEN
                    ASSIGN finalStep = executionContext.stepResults.get(targetStepId)
                ELSE
                    // Find the step with the latest timestamp
                    DECLARE latestTimestamp = ''
                    FOR_EACH stepResult IN allSteps
                        IF stepResult.timestamp > latestTimestamp THEN
                            ASSIGN latestTimestamp = stepResult.timestamp
                            ASSIGN finalStep = stepResult
                        END_IF
                    END_FOR
                END_IF
                
                // CRITICAL: Ensure final step status is properly set
                IF finalStep IS_NOT_NULL THEN
                    IF flowStatus EQUALS 'COMPLETED' AND finalStep.success THEN
                        // Final step should show SUCCESS status
                        ASSIGN finalStep.status = 'SUCCESS'
                    ELSE_IF flowStatus EQUALS 'FAILED' THEN
                        // Final step should show FAILURE status if flow failed
                        ASSIGN finalStep.status = 'FAILURE'
                    END_IF
                    
                    // Update the step in execution context
                    ASSIGN executionContext.stepResults.set(finalStep.stepId, finalStep)
                END_IF
                
                // Build final execution trace
                DECLARE executionTrace = {
                    traceId: executionContext.executionId,
                    flowFqn: executionContext.flowFqn,
                    status: flowStatus,
                    startTime: executionContext.startTime,
                    endTime: new Date().toISOString(),
                    durationMs: Date.now() - new Date(executionContext.startTime).getTime(),
                    triggerData: executionContext.triggerInput,
                    steps: allSteps.map(stepResult => ({
                        stepId: stepResult.stepId,
                        componentFqn: stepResult.componentType,
                        status: stepResult.success ? 'SUCCESS' : 'FAILURE',
                        startTime: stepResult.timestamp,
                        endTime: stepResult.timestamp,
                        durationMs: stepResult.executionTime,
                        inputData: stepResult.inputData,
                        outputData: stepResult.outputData
                    }))
                }
                
                RETURN executionTrace
            }
        `
    }
}

// --- YAML RECONSTRUCTION SERVICE ---

service YamlReconstructionService {
    description: "Reconstructs YAML content from module representations for save operations"
    
    method reconstructModuleYaml {
        signature: `reconstructModuleYaml(moduleRep: DslModuleRepresentation): string`
        
        implementation: `
            FUNCTION reconstructModuleYaml(moduleRep) {
                DECLARE yamlBuilder = new YamlBuilder()
                
                // Add module header
                CALL yamlBuilder.addComment WITH "Module: " + moduleRep.fqn
                CALL yamlBuilder.addComment WITH "Generated: " + new Date().toISOString()
                CALL yamlBuilder.addNewLine
                
                // Add imports section
                IF moduleRep.parsedContent.imports AND moduleRep.parsedContent.imports.length > 0 THEN
                    CALL yamlBuilder.addSection WITH "imports", moduleRep.parsedContent.imports
                    CALL yamlBuilder.addNewLine
                END_IF
                
                // Add context variables section
                IF moduleRep.parsedContent.contextVariables AND Object.keys(moduleRep.parsedContent.contextVariables).length > 0 THEN
                    CALL yamlBuilder.addSection WITH "contextVariables", moduleRep.parsedContent.contextVariables
                    CALL yamlBuilder.addNewLine
                END_IF
                
                // Add named components section
                IF moduleRep.parsedContent.namedComponents AND Object.keys(moduleRep.parsedContent.namedComponents).length > 0 THEN
                    CALL yamlBuilder.addSection WITH "namedComponents", moduleRep.parsedContent.namedComponents
                    CALL yamlBuilder.addNewLine
                END_IF
                
                // Add flows section
                IF moduleRep.parsedContent.flows AND Object.keys(moduleRep.parsedContent.flows).length > 0 THEN
                    CALL yamlBuilder.addSection WITH "flows", moduleRep.parsedContent.flows
                END_IF
                
                RETURN yamlBuilder.toString()
            }
        `
    }
    
    method updateConfigurationInYaml {
        signature: `updateConfigurationInYaml(originalYaml: string, pathToConfig: string[], newConfigValue: any): string`
        
        implementation: `
            FUNCTION updateConfigurationInYaml(originalYaml, pathToConfig, newConfigValue) {
                // Parse original YAML to AST for precise editing
                DECLARE yamlAst = CALL parseYamlToAst WITH originalYaml
                
                // Navigate to the configuration path
                DECLARE targetNode = yamlAst
                FOR_EACH pathSegment IN pathToConfig
                    IF targetNode[pathSegment] IS_DEFINED THEN
                        ASSIGN targetNode = targetNode[pathSegment]
                    ELSE
                        THROW new Error("Configuration path not found: " + pathToConfig.join('.'))
                    END_IF
                END_FOR
                
                // Update the configuration value while preserving formatting
                CALL updateAstNode WITH targetNode, newConfigValue
                
                // Reconstruct YAML from AST
                DECLARE updatedYaml = CALL astToYaml WITH yamlAst, {
                    preserveComments: true,
                    preserveFormatting: true,
                    indentSize: 2
                }
                
                RETURN updatedYaml
            }
        `
    }
}

// --- TRACE VISUALIZATION SERVICE ---

service TraceVisualizationService {
    description: "Provides trace data visualization and overlay functionality"
    
    method applyTraceOverlay {
        signature: `applyTraceOverlay(nodes: Node[], edges: Edge[], traceData: FlowTraceData): { nodes: Node[], edges: Edge[] }`
        
        implementation: `
            FUNCTION applyTraceOverlay(nodes, edges, traceData) {
                DECLARE enhancedNodes = []
                DECLARE enhancedEdges = []
                
                // Enhance nodes with trace data
                FOR_EACH node IN nodes
                    DECLARE nodeTrace = CALL findTraceForNode WITH node.id, traceData
                    DECLARE enhancedNode = {
                        ...node,
                        data: {
                            ...node.data,
                            executionStatus: nodeTrace?.status || 'not_executed',
                            executionTime: nodeTrace?.executionTime,
                            executionTimestamp: nodeTrace?.timestamp,
                            executionError: nodeTrace?.error,
                            executionOutput: nodeTrace?.output,
                            executionInput: nodeTrace?.input,
                            traceId: nodeTrace?.traceId
                        }
                    }
                    ASSIGN enhancedNodes.push(enhancedNode)
                END_FOR
                
                // Enhance edges with execution flow data
                FOR_EACH edge IN edges
                    DECLARE edgeTrace = CALL findTraceForEdge WITH edge.source, edge.target, traceData
                    DECLARE enhancedEdge = {
                        ...edge,
                        data: {
                            ...edge.data,
                            wasExecuted: edgeTrace?.wasExecuted || false,
                            executionOrder: edgeTrace?.executionOrder,
                            dataFlow: edgeTrace?.dataFlow
                        }
                    }
                    ASSIGN enhancedEdges.push(enhancedEdge)
                END_FOR
                
                RETURN { nodes: enhancedNodes, edges: enhancedEdges }
            }
        `
    }
    
    method generateExecutionTimeline {
        signature: `generateExecutionTimeline(traceData: FlowTraceData): ExecutionTimelineItem[]`
        
        implementation: `
            FUNCTION generateExecutionTimeline(traceData) {
                DECLARE timeline = []
                
                // Sort trace entries by timestamp
                DECLARE sortedEntries = traceData.executionLog.sort((a, b) => 
                    new Date(a.timestamp) - new Date(b.timestamp)
                )
                
                FOR_EACH entry IN sortedEntries
                    DECLARE timelineItem = {
                        id: entry.stepId || entry.traceId,
                        timestamp: entry.timestamp,
                        stepId: entry.stepId,
                        stepName: entry.stepName || entry.stepId,
                        status: entry.status,
                        duration: entry.executionTime || 0,
                        input: entry.input,
                        output: entry.output,
                        error: entry.error,
                        componentType: entry.componentType
                    }
                    ASSIGN timeline.push(timelineItem)
                END_FOR
                
                RETURN timeline
            }
        `
    }
}

// --- ENHANCED LAYOUT SERVICE ---

service EnhancedLayoutService {
    description: "Provides multiple layout algorithms with improved positioning and styling"
    
    method applyLayoutAlgorithm {
        signature: `applyLayoutAlgorithm(nodes: Node[], edges: Edge[], algorithm: LayoutAlgorithm, options?: LayoutOptions): Promise<{ nodes: Node[], edges: Edge[] }>`
        
        implementation: `
            FUNCTION applyLayoutAlgorithm(nodes, edges, algorithm, options = {}) {
                SWITCH algorithm
                    CASE 'elk-layered'
                        RETURN CALL applyElkLayeredLayout WITH nodes, edges, options
                    CASE 'elk-force'
                        RETURN CALL applyElkForceLayout WITH nodes, edges, options
                    CASE 'dagre'
                        RETURN CALL applyDagreLayout WITH nodes, edges, options
                    CASE 'hierarchical'
                        RETURN CALL applyHierarchicalLayout WITH nodes, edges, options
                    DEFAULT
                        RETURN CALL applyElkLayeredLayout WITH nodes, edges, options
                END_SWITCH
            }
        `
    }
    
    method applyElkLayeredLayout {
        signature: `applyElkLayeredLayout(nodes: Node[], edges: Edge[], options: LayoutOptions): Promise<{ nodes: Node[], edges: Edge[] }>`
        
        implementation: `
            FUNCTION applyElkLayeredLayout(nodes, edges, options) {
                DECLARE elkOptions = {
                    'elk.algorithm': 'layered',
                    'elk.direction': options.direction || 'RIGHT',
                    'elk.spacing.nodeNode': options.nodeSpacing || 80,
                    'elk.layered.spacing.nodeNodeBetweenLayers': options.layerSpacing || 100,
                    'elk.spacing.edgeNode': options.edgeSpacing || 40,
                    'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
                    'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
                    'elk.layered.cycleBreaking.strategy': 'GREEDY'
                }
                
                // Convert to ELK format
                DECLARE elkGraph = CALL convertToElkGraph WITH nodes, edges, elkOptions
                
                // Apply ELK layout
                DECLARE layoutedGraph = AWAIT elk.layout(elkGraph)
                
                // Convert back to React Flow format
                DECLARE { layoutedNodes, layoutedEdges } = CALL convertFromElkGraph WITH layoutedGraph
                
                RETURN { nodes: layoutedNodes, edges: layoutedEdges }
            }
        `
    }
    
    method optimizeNodePositions {
        signature: `optimizeNodePositions(nodes: Node[], edges: Edge[]): Node[]`
        
        implementation: `
            FUNCTION optimizeNodePositions(nodes, edges) {
                DECLARE optimizedNodes = []
                
                FOR_EACH node IN nodes
                    DECLARE optimizedNode = {
                        ...node,
                        position: CALL calculateOptimalPosition WITH node, nodes, edges
                    }
                    ASSIGN optimizedNodes.push(optimizedNode)
                END_FOR
                
                RETURN optimizedNodes
            }
        `
    }
}

// --- COMPONENT SCHEMA SERVICE ---

service ComponentSchemaService {
    description: "Manages component schemas for input/output validation and form generation"
    
    method getComponentSchema {
        signature: `getComponentSchema(componentType: string): ComponentSchema | null`
        
        implementation: `
            FUNCTION getComponentSchema(componentType) {
                // Check if it's a standard library component
                IF componentType.startsWith('StdLib:') THEN
                    RETURN CALL getStdLibComponentSchema WITH componentType
                ELSE
                    // Check if it's a named component
                    RETURN CALL getNamedComponentSchema WITH componentType
                END_IF
            }
        `
    }
    
    method generateFormSchema {
        signature: `generateFormSchema(componentSchema: ComponentSchema): JSONSchema`
        
        implementation: `
            FUNCTION generateFormSchema(componentSchema) {
                DECLARE formSchema = {
                    type: 'object',
                    properties: {},
                    required: []
                }
                
                // Convert component config schema to JSON Schema format
                IF componentSchema.configSchema THEN
                    ASSIGN formSchema.properties = componentSchema.configSchema.properties || {}
                    ASSIGN formSchema.required = componentSchema.configSchema.required || []
                END_IF
                
                // Add UI schema hints for better form rendering
                DECLARE uiSchema = CALL generateUISchema WITH componentSchema
                
                RETURN { schema: formSchema, uiSchema: uiSchema }
            }
        `
    }
    
    method validateAgainstSchema {
        signature: `validateAgainstSchema(data: any, schema: JSONSchema): ValidationResult`
        
        implementation: `
            FUNCTION validateAgainstSchema(data, schema) {
                TRY {
                    // Use Zod or Ajv for validation
                    DECLARE validator = CALL createValidator WITH schema
                    DECLARE isValid = validator.validate(data)
                    
                    RETURN {
                        isValid: isValid,
                        errors: validator.errors || [],
                        validatedData: isValid ? data : null
                    }
                } CATCH error {
                    RETURN {
                        isValid: false,
                        errors: [{ message: error.message, path: [] }],
                        validatedData: null
                    }
                }
            }
        `
    }
}

// --- TEST CASE SERVICE ---

service TestCaseService {
    description: "Manages test case creation, execution, and results"
    
    method createTestCase {
        signature: `createTestCase(flowFqn: string, testData: TestCaseData): TestCase`
        
        implementation: `
            FUNCTION createTestCase(flowFqn, testData) {
                DECLARE testCase = {
                    id: 'test-' + Math.random().toString(36).substr(2, 9),
                    flowFqn: flowFqn,
                    name: testData.name || 'Untitled Test',
                    description: testData.description || '',
                    triggerInput: testData.triggerInput,
                    expectedOutputs: testData.expectedOutputs || {},
                    assertions: testData.assertions || [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    status: 'draft'
                }
                
                RETURN testCase
            }
        `
    }
    
    method executeTestCase {
        signature: `executeTestCase(testCase: TestCase): Promise<TestExecutionResult>`
        
        implementation: `
            FUNCTION executeTestCase(testCase) {
                // Execute the flow with test input
                DECLARE simulationResult = AWAIT FlowSimulationService.simulateFlowExecution(
                    testCase.flowFqn,
                    testCase.triggerInput
                )
                
                // Run assertions
                DECLARE assertionResults = []
                FOR_EACH assertion IN testCase.assertions
                    DECLARE result = CALL evaluateAssertion WITH assertion, simulationResult
                    ASSIGN assertionResults.push(result)
                END_FOR
                
                // Determine overall test result
                DECLARE allPassed = assertionResults.every(r => r.passed)
                
                DECLARE testResult = {
                    testCaseId: testCase.id,
                    executionId: simulationResult.executionId,
                    status: allPassed ? 'passed' : 'failed',
                    executedAt: new Date().toISOString(),
                    simulationResult: simulationResult,
                    assertionResults: assertionResults,
                    summary: {
                        totalAssertions: assertionResults.length,
                        passedAssertions: assertionResults.filter(r => r.passed).length,
                        failedAssertions: assertionResults.filter(r => !r.passed).length
                    }
                }
                
                RETURN testResult
            }
        `
    }
}

// --- DATA GENERATION SERVICE ---

service DataGenerationService {
    description: "Generates test data based on schemas and scenarios"
    
    method generateTestData {
        signature: `generateTestData(schema: JSONSchema, scenario: TestScenario): any`
        
        implementation: `
            FUNCTION generateTestData(schema, scenario) {
                SWITCH scenario
                    CASE 'happy_path'
                        RETURN CALL generateHappyPathData WITH schema
                    CASE 'edge_case'
                        RETURN CALL generateEdgeCaseData WITH schema
                    CASE 'error_case'
                        RETURN CALL generateErrorCaseData WITH schema
                    CASE 'random'
                        RETURN CALL generateRandomData WITH schema
                    DEFAULT
                        RETURN CALL generateHappyPathData WITH schema
                END_SWITCH
            }
        `
    }
    
    method generateHappyPathData {
        signature: `generateHappyPathData(schema: JSONSchema): any`
        
        implementation: `
            FUNCTION generateHappyPathData(schema) {
                IF schema.type EQUALS 'object' THEN
                    DECLARE result = {}
                    FOR_EACH propName, propSchema IN schema.properties
                        ASSIGN result[propName] = CALL generateHappyPathData WITH propSchema
                    END_FOR
                    RETURN result
                    
                ELSE_IF schema.type EQUALS 'array' THEN
                    DECLARE itemSchema = schema.items
                    DECLARE arrayLength = schema.minItems || 2
                    DECLARE result = []
                    FOR i FROM 0 TO arrayLength - 1
                        ASSIGN result.push(CALL generateHappyPathData WITH itemSchema)
                    END_FOR
                    RETURN result
                    
                ELSE_IF schema.type EQUALS 'string' THEN
                    IF schema.format EQUALS 'email' THEN
                        RETURN 'user@example.com'
                    ELSE_IF schema.format EQUALS 'date' THEN
                        RETURN new Date().toISOString().split('T')[0]
                    ELSE
                        RETURN schema.default || 'sample string'
                    END_IF
                    
                ELSE_IF schema.type EQUALS 'number' THEN
                    RETURN schema.default || 42
                    
                ELSE_IF schema.type EQUALS 'boolean' THEN
                    RETURN schema.default || true
                    
                ELSE
                    RETURN schema.default || null
                END_IF
            }
        `
    }
}

// --- GRAPH BUILDER SERVICE ---

service GraphBuilderService {
    description: "Generates detailed flow graphs and trace data"
    
    method generateFlowDetailGraphData {
        signature: `generateFlowDetailGraphData(params: GenerateFlowDetailParams): Promise<GraphData>`
        
        implementation: `
            FUNCTION generateFlowDetailGraphData(params) {
                DECLARE { flowFqn, mode, moduleRegistry, parseContextVarsFn, componentSchemas, traceData, useAutoLayout } = params
                
                DECLARE flowDefinition = CALL moduleRegistry.getFlowDefinition WITH flowFqn
                IF flowDefinition IS_NULL THEN
                    RETURN_VALUE { nodes: [], edges: [] }
                END_IF
                
                DECLARE nodes = []
                DECLARE edges = []
                
                // 1. Generate trigger node
                IF flowDefinition.trigger IS_DEFINED THEN
                    DECLARE triggerTrace = FIND traceData?.steps WHERE stepId EQUALS 'trigger'
                    DECLARE triggerNodeData = CREATE_TRIGGER_NODE_DATA WITH flowDefinition.trigger, triggerTrace, componentSchemas, parseContextVarsFn
                    PUSH_TO nodes: { id: 'trigger', type: 'triggerNode', position: { x: 0, y: 0 }, data: triggerNodeData }
                END_IF
                
                // 2. Generate step nodes
                IF flowDefinition.steps IS_DEFINED THEN
                    FOR_EACH step, index IN flowDefinition.steps
                        DECLARE stepTrace = FIND traceData?.steps WHERE stepId EQUALS step.step_id
                        DECLARE stepNodeData = CREATE_STEP_NODE_DATA WITH step, stepTrace, componentSchemas, parseContextVarsFn, moduleRegistry, flowFqn
                        
                        IF step.component_ref.includes('SubFlowInvoker') THEN
                            PUSH_TO nodes: { id: step.step_id, type: 'subFlowInvokerNode', position: { x: 0, y: (index + 1) * 100 }, data: stepNodeData }
                        ELSE
                            PUSH_TO nodes: { id: step.step_id, type: 'stepNode', position: { x: 0, y: (index + 1) * 100 }, data: stepNodeData }
                        END_IF
                    END_FOR
                END_IF
                
                // 3. Generate edges based on inputs_map, run_after, AND outputs_map
                IF flowDefinition.steps IS_DEFINED THEN
                    FOR_EACH step IN flowDefinition.steps
                        // 3a. Control flow edges from trigger (for steps without run_after)
                        IF NOT step.run_after OR step.run_after.length EQUALS 0 THEN
                            DECLARE edgeData = { type: 'controlFlow', targetStepId: step.step_id, isExecutedPath: traceData ? true : undefined }
                            PUSH_TO edges: { id: "trigger-${step.step_id}", source: 'trigger', target: step.step_id, type: 'flowEdge', data: edgeData }
                        END_IF
                        
                        // 3b. Control flow edges from run_after
                        IF step.run_after IS_DEFINED AND Array.isArray(step.run_after) THEN
                            FOR_EACH sourceStepId IN step.run_after
                                DECLARE edgeData = { type: 'controlFlow', sourceStepId: sourceStepId, targetStepId: step.step_id, isExecutedPath: traceData ? true : undefined }
                                PUSH_TO edges: { id: "${sourceStepId}-${step.step_id}-control", source: sourceStepId, target: step.step_id, type: 'flowEdge', data: edgeData }
                            END_FOR
                        END_IF
                        
                        // 3c. Data flow edges from inputs_map
                        IF step.inputs_map IS_DEFINED THEN
                            FOR_EACH inputKey, sourceExpression IN step.inputs_map
                                IF typeof sourceExpression EQUALS 'string' AND sourceExpression.startsWith('steps.') THEN
                                    DECLARE match = sourceExpression.match(/steps\.([^.]+)/)
                                    IF match IS_DEFINED THEN
                                        DECLARE sourceStepId = match[1]
                                        DECLARE edgeData = { type: 'dataFlow', sourceStepId: sourceStepId, targetStepId: step.step_id, isExecutedPath: traceData ? true : undefined }
                                        PUSH_TO edges: { id: "${sourceStepId}-${step.step_id}-data-${inputKey}", source: sourceStepId, target: step.step_id, type: 'flowEdge', data: edgeData }
                                    END_IF
                                END_IF
                            END_FOR
                        END_IF
                        
                        // 3d. ENHANCED: Error routing edges from outputs_map
                        IF step.outputs_map IS_DEFINED THEN
                            // Handle both array and object formats for outputs_map
                            IF Array.isArray(step.outputs_map) THEN
                                FOR_EACH outputMapping IN step.outputs_map
                                    IF outputMapping.target AND outputMapping.target.startsWith('steps.') THEN
                                        DECLARE match = outputMapping.target.match(/steps\.([^.]+)\.inputs/)
                                        IF match IS_DEFINED THEN
                                            DECLARE targetStepId = match[1]
                                            DECLARE edgeData = { 
                                                type: 'controlFlow', 
                                                sourceStepId: step.step_id, 
                                                targetStepId: targetStepId, 
                                                sourceHandle: outputMapping.source || 'error',
                                                targetHandle: 'data',
                                                isExecutedPath: traceData ? true : undefined 
                                            }
                                            PUSH_TO edges: { id: "${step.step_id}-${targetStepId}-error-${outputMapping.source || 'error'}", source: step.step_id, target: targetStepId, type: 'flowEdge', data: edgeData }
                                        END_IF
                                    END_IF
                                END_FOR
                            ELSE_IF typeof step.outputs_map EQUALS 'object' THEN
                                FOR_EACH target, source IN step.outputs_map
                                    IF target.startsWith('steps.') THEN
                                        DECLARE match = target.match(/steps\.([^.]+)\.inputs/)
                                        IF match IS_DEFINED THEN
                                            DECLARE targetStepId = match[1]
                                            DECLARE edgeData = { 
                                                type: 'controlFlow', 
                                                sourceStepId: step.step_id, 
                                                targetStepId: targetStepId, 
                                                sourceHandle: source || 'error',
                                                targetHandle: 'data',
                                                isExecutedPath: traceData ? true : undefined 
                                            }
                                            PUSH_TO edges: { id: "${step.step_id}-${targetStepId}-error-${source || 'error'}", source: step.step_id, target: targetStepId, type: 'flowEdge', data: edgeData }
                                        END_IF
                                    END_IF
                                END_FOR
                            END_IF
                        END_IF
                    END_FOR
                END_IF
                
                // 4. Apply automatic layout if requested
                IF useAutoLayout AND nodes.length > 0 THEN
                    TRY
                        DECLARE layouted = CALL layoutNodes WITH nodes, edges, layoutPresets.flowDetail.options
                        
                        // Apply trace enhancements if trace data is available
                        IF traceData IS_DEFINED THEN
                            DECLARE enhancedNodes = CALL enhanceNodesWithTrace WITH layouted.nodes, traceData
                            DECLARE enhancedEdges = CALL enhanceEdgesWithTrace WITH layouted.edges, traceData
                            RETURN_VALUE { nodes: enhancedNodes, edges: enhancedEdges }
                        END_IF
                        
                        RETURN_VALUE layouted
                    CATCH error
                        LOG_WARNING "Auto-layout failed, using manual positions: " + error
                    END_TRY
                END_IF
                
                // Apply trace enhancements even without layout if trace data is available
                IF traceData IS_DEFINED THEN
                    DECLARE enhancedNodes = CALL enhanceNodesWithTrace WITH nodes, traceData
                    DECLARE enhancedEdges = CALL enhanceEdgesWithTrace WITH edges, traceData
                    RETURN_VALUE { nodes: enhancedNodes, edges: enhancedEdges }
                END_IF
                
                RETURN_VALUE { nodes, edges }
            }
        `
    }
}
