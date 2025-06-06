code cfv_code.GraphBuilderService_GenerateFlowDetailGraphData {
    title: "Generate Flow Detail Graph Data with Trace Integration and SubFlowInvoker Handling"
    part_of_design: cfv_designs.GraphBuilderService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/GraphBuilderServiceLogic.ts",
        entry_point_name: "generateFlowDetailGraphData",
        entry_point_type: "function" // Assuming it's a pure function or uses passed-in state accessors
    }
    signature: "(params: { flowFqn: string, moduleRegistry: cfv_models.IModuleRegistry, parseContextVarsFn: cfv_models.CascadeFlowVisualizerProps['parseContextVariables'], componentSchemas: Record<string, cfv_models.ComponentSchema>, traceData?: cfv_models.FlowExecutionTrace, elkInstance?: any, layoutService?: cfv_designs.LayoutService, layoutOptions?: cfv_models.LayoutOptions, useAutoLayout?: boolean }) => Promise<cfv_models.GraphData>"
    // Note: Added moduleRegistry, parseContextVarsFn, componentSchemas, traceData, elkInstance, layoutService, layoutOptions, useAutoLayout to params for clarity.
    // The original `cfv_internal_code.GraphBuilderService_GenerateFlowDetailGraphData` had these implicitly.
    detailed_behavior: `
        // Human Review Focus: Node type detection, trace data correlation, edge generation logic, SubFlowInvoker.invokedFlowFqn resolution.
        // AI Agent Target: Generate React Flow nodes and edges from DSL flow definition.

        DECLARE flowDefinition = CALL params.moduleRegistry.getFlowDefinitionDsl WITH { flowFqn: params.flowFqn }
        IF flowDefinition IS_NULL THEN
            CALL AbstractLogger.logWarning WITH { message: "Flow definition not found for FQN: " + params.flowFqn }
            RETURN_VALUE { nodes: [], edges: [] }
        END_IF

        DECLARE nodes AS List<cfv_models.ReactFlowNode> = []
        DECLARE edges AS List<cfv_models.ReactFlowEdge> = []

        // 1. Generate trigger node
        IF flowDefinition.trigger IS_PRESENT THEN
            DECLARE triggerComponentSchema = CALL params.moduleRegistry.getComponentSchema WITH { componentTypeFqn: flowDefinition.trigger.type }
            DECLARE triggerNodeData AS cfv_models.TriggerEntryPointNodeData
            CREATE_INSTANCE cfv_models.TriggerEntryPointNodeData WITH {
                label: flowDefinition.trigger.type, // Or a more user-friendly label
                triggerType: flowDefinition.trigger.type,
                dslObject: flowDefinition.trigger,
                resolvedComponentFqn: flowDefinition.trigger.type,
                componentSchema: triggerComponentSchema,
                contextVarUsages: CALL params.parseContextVarsFn WITH { value: JSON.stringify(flowDefinition.trigger) }
            } ASSIGN_TO triggerNodeData

            // REFINED: Handle trigger execution data from trace
            IF params.traceData IS_PRESENT THEN
                // Triggers are successful if the flow started (they don't have their own failure states typically)
                ASSIGN triggerNodeData.executionStatus = "SUCCESS"
                ASSIGN triggerNodeData.executionInputData = null // Triggers receive external events, not flow data
                
                // Use new triggerContext if available, fallback to legacy triggerData
                IF params.traceData.triggerContext IS_PRESENT THEN
                    ASSIGN triggerNodeData.executionOutputData = params.traceData.triggerContext.runtimeData
                    ASSIGN triggerNodeData.triggerConfig = params.traceData.triggerContext.triggerConfig
                ELSE_IF params.traceData.triggerData IS_PRESENT THEN
                    ASSIGN triggerNodeData.executionOutputData = params.traceData.triggerData
                END_IF
            END_IF

            ADD { id: "trigger", type: "triggerNode", position: { x: 0, y: 0 }, data: triggerNodeData } TO nodes
        END_IF

        // 2. Generate step nodes
        IF flowDefinition.steps IS_PRESENT THEN
            FOR_EACH step IN flowDefinition.steps WITH index
                DECLARE componentInfo = CALL params.moduleRegistry.resolveComponentTypeInfo WITH { componentRef: step.component_ref, currentModuleFqn: flowDefinition.moduleFqn OR params.flowFqn }
                DECLARE stepComponentSchema = componentInfo ? (CALL params.moduleRegistry.getComponentSchema WITH { componentTypeFqn: componentInfo.baseType }) : null

                DECLARE baseStepNodeData AS cfv_models.StepNodeData
                CREATE_INSTANCE cfv_models.StepNodeData WITH {
                    label: step.step_id,
                    stepId: step.step_id,
                    dslObject: step,
                    resolvedComponentFqn: componentInfo?.baseType,
                    componentSchema: stepComponentSchema,
                    isNamedComponent: componentInfo?.isNamedComponent,
                    namedComponentFqn: componentInfo?.isNamedComponent ? step.component_ref : undefined,
                    contextVarUsages: CALL params.parseContextVarsFn WITH { value: JSON.stringify(step) }
                } ASSIGN_TO baseStepNodeData

                IF params.traceData IS_PRESENT AND params.traceData.steps IS_PRESENT THEN
                    DECLARE stepTrace = params.traceData.steps.find(t => t.stepId === step.step_id)
                    IF stepTrace IS_PRESENT THEN
                        ASSIGN baseStepNodeData.executionStatus = stepTrace.status
                        ASSIGN baseStepNodeData.executionDurationMs = stepTrace.durationMs
                        ASSIGN baseStepNodeData.executionInputData = stepTrace.inputData
                        ASSIGN baseStepNodeData.executionOutputData = stepTrace.outputData
                        IF stepTrace.errorData IS_PRESENT THEN // Assuming errorData in StepExecutionTrace can be NodeError
                            ASSIGN baseStepNodeData.error = stepTrace.errorData
                        END_IF
                    END_IF
                END_IF

                DECLARE nodeType = "stepNode" // Default
                DECLARE finalNodeData = baseStepNodeData

                // Handle SubFlowInvoker specific logic
                IF componentInfo?.baseType EQUALS "StdLib:SubFlowInvoker" THEN
                    ASSIGN nodeType = "subFlowInvokerNode"
                    DECLARE invokedFlowName = step.config?.flowName
                    DECLARE resolvedInvokedFlowFqn = "unknown"

                    IF componentInfo.isNamedComponent AND componentInfo.componentDefinition?.config?.flowName IS_PRESENT THEN
                        // Named component's definition provides the flowName
                        ASSIGN invokedFlowName = componentInfo.componentDefinition.config.flowName
                    END_IF

                    IF invokedFlowName IS_PRESENT AND TYPE_OF invokedFlowName IS 'string' AND invokedFlowName IS_NOT_EMPTY THEN
                        IF invokedFlowName.includes(".") THEN // Assume it's already an FQN
                            ASSIGN resolvedInvokedFlowFqn = invokedFlowName
                        ELSE // Resolve relative to current module's namespace
                            DECLARE currentModuleNamespace = (flowDefinition.moduleFqn OR params.flowFqn).substring(0, (flowDefinition.moduleFqn OR params.flowFqn).lastIndexOf('.'))
                            ASSIGN resolvedInvokedFlowFqn = currentModuleNamespace + "." + invokedFlowName
                        END_IF
                    ELSE
                        CALL AbstractLogger.logWarning WITH { message: "SubFlowInvoker step '" + step.step_id + "' in flow '" + params.flowFqn + "' has missing, empty, or invalid 'flowName' in its config or named component definition." }
                        IF baseStepNodeData.error IS_UNDEFINED THEN
                            CREATE_INSTANCE cfv_models.NodeError WITH { message: "SubFlowInvoker 'flowName' is missing or invalid." } ASSIGN_TO baseStepNodeData.error
                        END_IF
                    END_IF

                    DECLARE subFlowInvokerData AS cfv_models.SubFlowInvokerNodeData
                    CREATE_INSTANCE cfv_models.SubFlowInvokerNodeData WITH { ...baseStepNodeData, invokedFlowFqn: resolvedInvokedFlowFqn } ASSIGN_TO subFlowInvokerData
                    ASSIGN finalNodeData = subFlowInvokerData
                END_IF

                ADD { id: step.step_id, type: nodeType, position: { x: 0, y: (index + 1) * 100 }, data: finalNodeData } TO nodes
            END_FOR
        END_IF

        // 3. Generate edges based on inputs_map, run_after, outputs_map (Simplified for brevity, detailed logic needed)
        // Example for run_after:
        IF flowDefinition.steps IS_PRESENT THEN
            FOR_EACH step IN flowDefinition.steps
                IF step.run_after IS_PRESENT THEN
                    FOR_EACH precursorStepId IN step.run_after
                        ADD { id: "edge-" + precursorStepId + "-" + step.step_id + "-runafter", source: precursorStepId, target: step.step_id, data: { type: 'executionOrderDependency', dependencyType: 'execution_order_dependency' } } TO edges
                    END_FOR
                END_IF
                // Example for inputs_map -> dataDependency (simplified)
                IF step.inputs_map IS_PRESENT THEN
                    FOR_EACH targetInputKey, sourceExpression IN step.inputs_map
                        IF TYPE_OF sourceExpression IS 'string' AND sourceExpression.startsWith("steps.") THEN
                             DECLARE sourceStepIdMatch = CALL RegExpAPI.match WITH { text: sourceExpression, pattern: /^steps\\.([^.]+)\\./ }
                             IF sourceStepIdMatch IS_PRESENT THEN
                                DECLARE sourceStepId = sourceStepIdMatch[1]
                                ADD { id: "edge-" + sourceStepId + "-" + step.step_id + "-" + targetInputKey + "-data", source: sourceStepId, target: step.step_id, targetHandle: targetInputKey, data: { type: 'dataDependency', dependencyType: 'data_dependency', targetInputKey: targetInputKey, dataPath: sourceExpression } } TO edges
                             END_IF
                        END_IF
                    END_FOR
                END_IF
                // Implicit trigger to first step(s) if no explicit run_after or inputs_map from trigger
                IF nodes.length > 0 AND nodes[0].id EQUALS "trigger" THEN
                     IF NOT step.run_after AND NOT (step.inputs_map AND Object.values(step.inputs_map).some(val => val.startsWith("trigger."))) THEN
                        // This logic needs refinement to correctly identify first steps
                        // For now, connecting trigger to all steps that don't have explicit precursors for simplicity.
                        // A more robust approach would be to find steps with no incoming run_after or data dependencies.
                        IF NOT edges.some(e => e.target === step.step_id) THEN // Very naive check
                             ADD { id: "edge-trigger-" + step.step_id + "-control", source: "trigger", target: step.step_id, data: { type: 'controlFlow', dependencyType: 'control_flow' } } TO edges
                        END_IF
                     END_IF
                END_IF

            END_FOR
        END_IF


        // 4. Apply layout if requested and service available
        IF params.useAutoLayout AND params.layoutService IS_PRESENT AND params.elkInstance IS_PRESENT AND nodes.length > 0 THEN
            TRY
                DECLARE layoutOptionsToUse = params.layoutOptions // Or default from LayoutService presets
                DECLARE layoutedGraph = AWAIT CALL params.layoutService.layoutNodes WITH { nodes: nodes, edges: edges, options: layoutOptionsToUse, elkInstance: params.elkInstance }
                ASSIGN nodes = layoutedGraph.nodes
                ASSIGN edges = layoutedGraph.edges
            CATCH_ERROR e
                CALL AbstractLogger.logError WITH { message: "Auto-layout failed during graph generation: " + e.message }
                // Proceed with unlayouted nodes/edges
            END_TRY
        END_IF

        // 5. Enhance with trace (if not already done by layout or if layout is off)
        // This part is simplified; TraceVisualizationService would handle this.
        // IF params.traceData IS_PRESENT THEN
        //    CALL cfv_code.TraceVisualizationService_EnhanceNodesWithTrace ...
        //    CALL cfv_code.TraceVisualizationService_EnhanceEdgesWithTrace ...
        // END_IF

        RETURN_VALUE { nodes: nodes, edges: edges }
    `
    dependencies: [
        "cfv_models.GraphData",
        "cfv_models.ReactFlowNode",
        "cfv_models.ReactFlowEdge",
        "cfv_models.IModuleRegistry",
        "cfv_models.CascadeFlowVisualizerProps['parseContextVariables']",
        "cfv_models.ComponentSchema",
        "cfv_models.FlowExecutionTrace",
        "cfv_models.LayoutOptions",
        "cfv_models.StepNodeData",
        "cfv_models.SubFlowInvokerNodeData",
        "cfv_models.TriggerEntryPointNodeData",
        "cfv_models.NodeError",
        "cfv_designs.LayoutService", // For the type of layoutService param
        "AbstractLogger.logWarning",
        "AbstractLogger.logError",
        "JSON.stringify",
        "RegExpAPI.match"
    ]
}

code cfv_code.GraphBuilderService_GenerateSystemOverviewGraphData {
    title: "Generate System Overview Graph Data"
    part_of_design: cfv_designs.GraphBuilderService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/GraphBuilderServiceLogic.ts",
        entry_point_name: "generateSystemOverviewGraphData",
        entry_point_type: "function"
    }
    signature: "(params: { moduleRegistry: cfv_models.IModuleRegistry, parseContextVarsFn: cfv_models.CascadeFlowVisualizerProps['parseContextVariables'], componentSchemas: Record<string, cfv_models.ComponentSchema>, elkInstance?: any, layoutService?: cfv_designs.LayoutService, layoutOptions?: cfv_models.LayoutOptions, useAutoLayout?: boolean }) => Promise<cfv_models.GraphData>"
    detailed_behavior: `
        // Human Review Focus: Correctly identifying all flows, their triggers, and inter-flow invocations.
        // AI Agent Target: Generate nodes and edges for system overview.

        DECLARE nodes AS List<cfv_models.ReactFlowNode> = []
        DECLARE edges AS List<cfv_models.ReactFlowEdge> = []
        DECLARE allModules = CALL params.moduleRegistry.getAllLoadedModules

        DECLARE flowFqnToNodeIdMap AS Map<String, String>
        CREATE_INSTANCE Map ASSIGN_TO flowFqnToNodeIdMap

        // 1. Create nodes for all flows
        FOR_EACH moduleRep IN allModules
            IF moduleRep.definitions.flows IS_PRESENT THEN
                FOR_EACH flowDef IN moduleRep.definitions.flows
                    DECLARE flowFqn = moduleRep.fqn + "." + flowDef.name // Construct FQN
                    DECLARE flowNodeId = "sys-flow-" + flowFqn
                    CALL flowFqnToNodeIdMap.set WITH { key: flowFqn, value: flowNodeId }

                    DECLARE flowNodeData AS cfv_models.SystemGraphNodeData
                    CREATE_INSTANCE cfv_models.SystemGraphNodeData WITH {
                        label: flowDef.name,
                        fqn: flowFqn,
                        nodeCategory: 'flow',
                        dslObject: flowDef
                        // Other BaseNodeData fields can be populated if useful (e.g., contextVarUsages for the whole flow)
                    } ASSIGN_TO flowNodeData
                    ADD { id: flowNodeId, type: "systemFlowNode", position: { x: 0, y: 0 }, data: flowNodeData } TO nodes
                END_FOR
            END_IF
        END_FOR

        // 2. Create nodes for external triggers and edges to flows
        //    This requires analyzing flowDef.trigger for each flow.
        //    If a trigger is not another flow (e.g., HTTP, Kafka), create an externalTrigger node.
        //    This part is complex and depends on how triggers are defined and resolved.
        //    For simplicity, this stub assumes trigger information is available.

        // 3. Create edges for SubFlowInvocations
        FOR_EACH moduleRep IN allModules
            IF moduleRep.definitions.flows IS_PRESENT THEN
                FOR_EACH flowDef IN moduleRep.definitions.flows
                    DECLARE invokingFlowFqn = moduleRep.fqn + "." + flowDef.name
                    DECLARE invokingFlowNodeId = CALL flowFqnToNodeIdMap.get WITH { key: invokingFlowFqn }

                    IF flowDef.steps IS_PRESENT AND invokingFlowNodeId IS_PRESENT THEN
                        FOR_EACH step IN flowDef.steps
                            DECLARE componentInfo = CALL params.moduleRegistry.resolveComponentTypeInfo WITH { componentRef: step.component_ref, currentModuleFqn: moduleRep.fqn }
                            IF componentInfo?.baseType EQUALS "StdLib:SubFlowInvoker" THEN
                                DECLARE invokedFlowName = step.config?.flowName
                                IF componentInfo.isNamedComponent AND componentInfo.componentDefinition?.config?.flowName IS_PRESENT THEN
                                    ASSIGN invokedFlowName = componentInfo.componentDefinition.config.flowName
                                END_IF

                                IF invokedFlowName IS_PRESENT AND TYPE_OF invokedFlowName IS 'string' AND invokedFlowName IS_NOT_EMPTY THEN
                                    DECLARE resolvedInvokedFlowFqn
                                    IF invokedFlowName.includes(".") THEN
                                        ASSIGN resolvedInvokedFlowFqn = invokedFlowName
                                    ELSE
                                        DECLARE currentModuleNamespace = moduleRep.fqn.substring(0, moduleRep.fqn.lastIndexOf('.'))
                                        ASSIGN resolvedInvokedFlowFqn = currentModuleNamespace + "." + invokedFlowName
                                    END_IF

                                    DECLARE invokedFlowNodeId = CALL flowFqnToNodeIdMap.get WITH { key: resolvedInvokedFlowFqn }
                                    IF invokedFlowNodeId IS_PRESENT THEN
                                        ADD { id: "sys-edge-" + invokingFlowNodeId + "-" + invokedFlowNodeId, source: invokingFlowNodeId, target: invokedFlowNodeId, data: { type: 'invocationEdge' } } TO edges
                                    ELSE
                                        CALL AbstractLogger.logWarning WITH { message: "System Overview: Invoked flow " + resolvedInvokedFlowFqn + " not found for edge generation." }
                                    END_IF
                                END_IF
                            END_IF
                        END_FOR
                    END_IF
                END_FOR
            END_IF
        END_FOR

        // 4. Apply layout if requested
        IF params.useAutoLayout AND params.layoutService IS_PRESENT AND params.elkInstance IS_PRESENT AND nodes.length > 0 THEN
            TRY
                DECLARE layoutOptionsToUse = params.layoutOptions // Or default from LayoutService presets for system view
                DECLARE layoutedGraph = AWAIT CALL params.layoutService.layoutNodes WITH { nodes: nodes, edges: edges, options: layoutOptionsToUse, elkInstance: params.elkInstance }
                RETURN_VALUE layoutedGraph
            CATCH_ERROR e
                CALL AbstractLogger.logError WITH { message: "System Overview: Auto-layout failed: " + e.message }
            END_TRY
        END_IF

        RETURN_VALUE { nodes: nodes, edges: edges }
    `
    dependencies: [
        "cfv_models.GraphData",
        "cfv_models.ReactFlowNode",
        "cfv_models.ReactFlowEdge",
        "cfv_models.IModuleRegistry",
        "cfv_models.SystemGraphNodeData",
        "cfv_models.SystemEdgeData",
        "AbstractLogger.logWarning",
        "AbstractLogger.logError"
    ]
}