// cfv_code_trace_visualization.dspec.md
// Internal code specifications for Trace Visualization logic (cfv_designs.TraceVisualizationService).

code cfv_code.TraceVisualizationService_EnhanceNodesWithTrace {
    title: "Enhance React Flow Nodes with Trace Data Overlays"
    part_of_design: cfv_designs.TraceVisualizationService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/TraceVisualizationServiceLogic.ts",
        entry_point_name: "enhanceNodesWithTrace",
        entry_point_type: "function"
    }
    signature: "(params: { nodes: cfv_models.ReactFlowNode[], traceData: cfv_models.FlowExecutionTrace, options?: cfv_models.TraceVisualizationOptions }) => cfv_models.ReactFlowNode[]"
    detailed_behavior: `
        // Based on original cfv_internal_code.TraceVisualizationService_EnhanceNodes
        // Human Review Focus: Correct correlation of trace data to nodes, application of status and timing.
        // AI Agent Target: Generate function to map trace data onto node data.

        DECLARE originalNodes = params.nodes
        DECLARE traceData = params.traceData
        DECLARE options = params.options OR {}

        // Create a map of step traces for quick lookup
        DECLARE stepTraceMap AS Map<String, cfv_models.StepExecutionTrace>
        CREATE_INSTANCE Map ASSIGN_TO stepTraceMap
        IF traceData.steps IS_PRESENT THEN
            FOR_EACH stepTrace IN traceData.steps
                CALL stepTraceMap.set WITH { key: stepTrace.stepId, value: stepTrace }
            END_FOR
        END_IF

        // Optional: Calculate critical path if requested (simplified: not implemented in this DSpec)
        // DECLARE criticalPathStepIds = options.highlightCriticalPath ? (CALL cfv_code.TraceVisualizationService_CalculateCriticalPath WITH { traceData: traceData }) : (CREATE_INSTANCE Set)

        DECLARE enhancedNodes AS List<cfv_models.ReactFlowNode> = []
        FOR_EACH node IN originalNodes
            DECLARE newHombreData = { ...node.data } // Start with existing node data, create new object

            IF node.id EQUALS 'trigger' THEN // Special handling for trigger node
                ASSIGN newHombreData.executionStatus = traceData.status === 'COMPLETED' ? 'SUCCESS' : (traceData.status === 'FAILED' ? 'FAILURE' : traceData.status)
                ASSIGN newHombreData.executionDurationMs = traceData.durationMs
                ASSIGN newHombreData.executionInputData = null // Triggers receive external events, not flow data
                
                // REFINED: Use new triggerContext if available, fallback to legacy triggerData
                IF traceData.triggerContext IS_PRESENT THEN
                    ASSIGN newHombreData.executionOutputData = traceData.triggerContext.runtimeData
                    ASSIGN newHombreData.triggerConfig = traceData.triggerContext.triggerConfig
                    ASSIGN newHombreData.triggerType = traceData.triggerContext.triggerType
                ELSE_IF traceData.triggerData IS_PRESENT THEN
                ASSIGN newHombreData.executionOutputData = traceData.triggerData
                END_IF
                // IF options.highlightCriticalPath AND (CALL criticalPathStepIds.has WITH { value: node.id }) THEN ASSIGN newHombreData.isCriticalPath = true END_IF
            ELSE
                DECLARE stepTrace = CALL stepTraceMap.get WITH { key: node.id } // Assuming node.id is stepId
                IF stepTrace IS_PRESENT THEN
                    ASSIGN newHombreData.executionStatus = stepTrace.status
                    ASSIGN newHombreData.executionDurationMs = stepTrace.durationMs
                    ASSIGN newHombreData.executionInputData = stepTrace.inputData
                    ASSIGN newHombreData.executionOutputData = stepTrace.outputData
                    IF stepTrace.errorData IS_PRESENT THEN
                        // Map stepTrace.errorData (any) to cfv_models.NodeError if structure differs
                        // For now, assume direct assignment or a simple mapping
                        IF TYPE_OF stepTrace.errorData IS 'string' THEN
                             CREATE_INSTANCE cfv_models.NodeError WITH { message: stepTrace.errorData } ASSIGN_TO newHombreData.error
                        ELSE IF TYPE_OF stepTrace.errorData IS 'object' AND stepTrace.errorData.message IS_PRESENT THEN
                             CREATE_INSTANCE cfv_models.NodeError WITH { ...stepTrace.errorData } ASSIGN_TO newHombreData.error
                        END_IF
                    END_IF
                    // IF options.highlightCriticalPath AND (CALL criticalPathStepIds.has WITH { value: node.id }) THEN ASSIGN newHombreData.isCriticalPath = true END_IF
                ELSE
                    // If no trace for a step, it might be SKIPPED or PENDING implicitly, or simply not executed.
                    // The initial state from GraphBuilder should be clean. This function primarily adds execution data.
                    // If the flow itself failed before this step, it might be considered SKIPPED.
                    // This logic can be complex. For now, if no explicit trace, no execution status overlay.
                    ASSIGN newHombreData.executionStatus = undefined // Or 'SKIPPED' if flow trace indicates it didn't run
                END_IF
            END_IF
            ADD { ...node, data: newHombreData } TO enhancedNodes
        END_FOR
        RETURN_VALUE enhancedNodes
    `
    dependencies: [
        "cfv_models.ReactFlowNode", "cfv_models.FlowExecutionTrace", "cfv_models.TraceVisualizationOptions",
        "cfv_models.StepExecutionTrace", "cfv_models.NodeError",
        "cfv_code.TraceVisualizationService_CalculateCriticalPath" // If used
    ]
}

code cfv_code.TraceVisualizationService_EnhanceEdgesWithTrace {
    title: "Enhance React Flow Edges with Trace Data"
    part_of_design: cfv_designs.TraceVisualizationService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/TraceVisualizationServiceLogic.ts",
        entry_point_name: "enhanceEdgesWithTrace",
        entry_point_type: "function"
    }
    signature: "(params: { edges: cfv_models.ReactFlowEdge[], traceData: cfv_models.FlowExecutionTrace, options?: cfv_models.TraceVisualizationOptions }) => cfv_models.ReactFlowEdge[]"
    detailed_behavior: `
        // Human Review Focus: Correctly identifying executed paths.
        // AI Agent Target: Generate function to mark edges as executed.

        DECLARE originalEdges = params.edges
        DECLARE traceData = params.traceData
        DECLARE options = params.options OR {}

        // Create a set of executed step pairs (sourceId -> targetId) for quick lookup
        DECLARE executedStepTransitions AS Set<String>
        CREATE_INSTANCE Set ASSIGN_TO executedStepTransitions
        IF traceData.steps IS_PRESENT AND traceData.steps.length > 0 THEN
            // Mark trigger to first executed step(s)
            DECLARE firstExecutedSteps = traceData.steps.filter(s => s.executionOrder === 1 OR (s.executionOrder === undefined AND s.startTime)) // executionOrder might not always be 1 for first
            FOR_EACH firstStep IN firstExecutedSteps
                CALL executedStepTransitions.add WITH { value: "trigger=>" + firstStep.stepId }
            END_FOR

            // Mark step-to-step transitions
            // This requires knowing the execution order or deriving it.
            // traceData.steps is now a List, so it's ordered.
            FOR i FROM 0 TO traceData.steps.length - 2
                DECLARE currentStep = traceData.steps[i]
                DECLARE nextStep = traceData.steps[i+1]
                // This simple sequential check might not cover all branching/parallel scenarios correctly.
                // A robust solution would analyze dependencies and actual execution flow.
                // For now, assume if currentStep and nextStep in trace are connected by an edge, it's executed.
                // This also doesn't account for data dependencies if they don't match execution order.
                IF currentStep.status EQUALS 'SUCCESS' THEN // Only consider path if source step succeeded
                    CALL executedStepTransitions.add WITH { value: currentStep.stepId + "=>" + nextStep.stepId }
                END_IF
            END_FOR
        END_IF

        DECLARE enhancedEdges AS List<cfv_models.ReactFlowEdge> = []
        FOR_EACH edge IN originalEdges
            DECLARE newEdgeData = { ...edge.data }
            DECLARE transitionKey = edge.source + "=>" + edge.target
            IF (CALL executedStepTransitions.has WITH { value: transitionKey }) THEN
                ASSIGN newEdgeData.isExecutedPath = true
            ELSE
                ASSIGN newEdgeData.isExecutedPath = false
            END_IF
            // Optional: Add styling hints based on options.criticalPathColor etc.
            ADD { ...edge, data: newEdgeData } TO enhancedEdges
        END_FOR
        RETURN_VALUE enhancedEdges
    `
    dependencies: [
        "cfv_models.ReactFlowEdge", "cfv_models.FlowExecutionTrace", "cfv_models.TraceVisualizationOptions"
    ]
}

code cfv_code.TraceVisualizationService_CalculateCriticalPath {
    title: "Calculate Critical Path from Flow Execution Trace"
    part_of_design: cfv_designs.TraceVisualizationService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/TraceVisualizationServiceLogic.ts",
        entry_point_name: "calculateCriticalPath",
        entry_point_type: "function"
    }
    signature: "(params: { traceData: cfv_models.FlowExecutionTrace }) => Set<string>" // Returns set of step IDs
    detailed_behavior: `
        // Based on original cfv_internal_code.TraceVisualizationService_CriticalPath
        // Human Review Focus: Correct algorithm for identifying the critical path.
        // AI Agent Target: Implement critical path calculation.

        // This is a simplified critical path: just longest duration steps.
        // A true critical path analysis requires a graph of dependencies and timings.
        DECLARE traceData = params.traceData
        DECLARE criticalPathStepIds AS Set<string>
        CREATE_INSTANCE Set ASSIGN_TO criticalPathStepIds

        IF traceData.steps IS_NULL OR traceData.steps.length EQUALS 0 THEN
            RETURN_VALUE criticalPathStepIds
        END_IF

        // Sort steps by duration in descending order
        DECLARE sortedSteps = [...traceData.steps].sort((a, b) => (b.durationMs OR 0) - (a.durationMs OR 0))

        // Consider top N steps or top X% as critical (simplified approach)
        DECLARE criticalCount = CALL Math.max WITH { values: [1, (CALL Math.ceil WITH { value: sortedSteps.length * 0.2 })] } // Top 20%, at least 1

        FOR i FROM 0 TO criticalCount -1
            IF sortedSteps[i] IS_PRESENT THEN
                CALL criticalPathStepIds.add WITH { value: sortedSteps[i].stepId }
            END_IF
        END_FOR
        RETURN_VALUE criticalPathStepIds
    `
    dependencies: [
        "cfv_models.FlowExecutionTrace",
        "Math.max", "Math.ceil"
    ]
}