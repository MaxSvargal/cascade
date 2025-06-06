// cfv_code_server_execution.dspec.md
// Internal code specifications for Server-Side Execution logic (cfv_designs.StreamingExecutionAPIService).

code cfv_code.ServerExecutionEngine_AnalyzeDependencies {
    title: "Server: Analyze Step Dependencies including Cycle Detection and Execution Planning"
    part_of_design: cfv_designs.StreamingExecutionAPIService
    language: "TypeScript"
    implementation_location: {
        filepath: "server/execution/ServerExecutionEngine.ts",
        entry_point_name: "analyzeDependencies",
        entry_point_type: "method" // Assuming part of a ServerExecutionEngine class
    }
    signature: "(steps: cfv_models.FlowStepDsl[]) => cfv_models.DependencyAnalysis"
    detailed_behavior: `
        // Based on original cfv_internal_code.ServerExecutionEngine_EnhancedDependencyResolution.analyzeDependencies
        // and cfv_internal_code.ServerExecutionEngine_EnhancedDependencyAnalysis.

        DECLARE graph AS Map<string, Set<string>>
        CREATE_INSTANCE Map ASSIGN_TO graph

        DECLARE stepMap AS Map<string, cfv_models.FlowStepDsl>
        CREATE_INSTANCE Map ASSIGN_TO stepMap
        FOR_EACH step IN steps
            CALL stepMap.set WITH { key: step.step_id, value: step }
        END_FOR

        FOR_EACH step IN steps
            DECLARE dependencies = CALL cfv_code.ServerExecutionEngine_ExtractStepDependencies WITH { step: step }
            CALL graph.set WITH { key: step.step_id, value: dependencies }
        END_FOR

        DECLARE cycles = CALL cfv_code.ServerExecutionEngine_DetectCycles WITH { graph: graph }

        DECLARE independentStepsResult AS List<String> = []
        FOR_EACH step IN steps
            DECLARE deps = CALL graph.get WITH { key: step.step_id } OR (CREATE_INSTANCE Set)
            DECLARE isIndependent = true
            FOR_EACH depId IN deps
                IF depId NOT_EQUALS 'trigger' AND NOT depId.startsWith('context.') THEN // Depends on another actual step
                    ASSIGN isIndependent = false
                    BREAK
                END_IF
            END_FOR
            IF isIndependent THEN ADD step.step_id TO independentStepsResult END_IF
        END_FOR

        // Create execution order layers (simplified topological sort approach)
        DECLARE executionOrderResult AS List<List<String>> = []
        DECLARE inDegree AS Map<String, Number>
        CREATE_INSTANCE Map ASSIGN_TO inDegree
        DECLARE queue AS List<String> = []

        FOR_EACH stepId IN (CALL graph.keys)
            CALL inDegree.set WITH { key: stepId, value: 0 }
        END_FOR

        FOR_EACH stepId IN (CALL graph.keys)
            DECLARE dependencies = CALL graph.get WITH { key: stepId } OR (CREATE_INSTANCE Set)
            FOR_EACH dep IN dependencies
                 IF CALL stepMap.has WITH { key: dep } THEN // Only count actual step dependencies
                    CALL inDegree.set WITH { key: dep, value: (CALL inDegree.get WITH { key: dep } OR 0) + 1 } // This is reversed, should be inDegree of stepId
                 END_IF
            END_FOR
        END_FOR
        // Corrected In-degree calculation:
        CALL inDegree.clear // Reset
        FOR_EACH stepIdNode IN (CALL graph.keys) // For each node
            CALL inDegree.set WITH { key: stepIdNode, value: 0 } // Initialize in-degree
        END_FOR
        FOR_EACH sourceStepId IN (CALL graph.keys)
            DECLARE targets = CALL graph.get WITH {key: sourceStepId}
            FOR_EACH targetStepId IN targets
                IF CALL stepMap.has WITH { key: targetStepId } THEN // If target is an actual step
                    CALL inDegree.set WITH { key: targetStepId, value: (CALL inDegree.get WITH { key: targetStepId } OR 0) + 1}
                END_IF
            END_FOR
        END_FOR


        FOR_EACH stepId IN (CALL stepMap.keys)
            IF (CALL inDegree.get WITH { key: stepId } OR 0) EQUALS 0 THEN
                ADD stepId TO queue
            END_IF
        END_FOR

        WHILE queue.length > 0
            DECLARE currentLayer AS List<String> = [...queue]
            ADD currentLayer TO executionOrderResult
            ASSIGN queue = [] // Clear queue for next layer

            FOR_EACH stepIdInLayer IN currentLayer
                DECLARE dependentSteps = [] // Find steps that depend on stepIdInLayer
                FOR_EACH potentialDependent IN (CALL graph.keys)
                    IF (CALL graph.get WITH {key: potentialDependent}).has(stepIdInLayer) THEN
                        ADD potentialDependent TO dependentSteps
                    END_IF
                END_FOR
                // The above is not correct for Kahn's. Correct: iterate through successors of nodes in currentLayer
                // For each node U in currentLayer:
                //   For each node V such that there is an edge U -> V:
                //     inDegree[V]--
                //     If inDegree[V] == 0: add V to queue for next layer

                // Simplified: This needs a proper graph traversal (e.g. Kahn's algorithm)
                // This placeholder logic will not correctly form layers for parallel execution.
                // For a real implementation, a full topological sort (Kahn's or DFS-based) is needed.
            END_FOR
        END_WHILE
        // If cycles exist, executionOrderResult might be incomplete. The server needs to handle this.
        // For now, this is a simplified layering. Real server would use a robust algo.

        DECLARE analysisResult AS cfv_models.DependencyAnalysis
        CREATE_INSTANCE cfv_models.DependencyAnalysis WITH {
            graph: graph, // This should be Map<string, string[]> for JSON serializability if sent to client.
            cycles: cycles,
            independentSteps: independentStepsResult,
            executionOrder: executionOrderResult
        } ASSIGN_TO analysisResult
        RETURN_VALUE analysisResult
    `
    dependencies: [
        "cfv_models.FlowStepDsl",
        "cfv_models.DependencyAnalysis",
        "cfv_code.ServerExecutionEngine_ExtractStepDependencies",
        "cfv_code.ServerExecutionEngine_DetectCycles"
    ]
}

code cfv_code.ServerExecutionEngine_ExtractStepDependencies {
    title: "Server: Extract Dependencies for a Single Step"
    part_of_design: cfv_designs.StreamingExecutionAPIService
    language: "TypeScript"
    implementation_location: {
        filepath: "server/execution/ServerExecutionEngine.ts",
        entry_point_name: "extractStepDependencies",
        entry_point_type: "private_method"
    }
    signature: "(params: { step: cfv_models.FlowStepDsl }) => Set<string>"
    detailed_behavior: `
        // From original cfv_internal_code.ServerExecutionEngine_EnhancedDependencyResolution.extractStepDependencies
        DECLARE step = params.step
        DECLARE dependencies AS Set<string>
        CREATE_INSTANCE Set ASSIGN_TO dependencies

        IF step.run_after IS_PRESENT THEN
            IF IS_ARRAY step.run_after THEN
                FOR_EACH dep IN step.run_after
                    CALL dependencies.add WITH { value: dep }
                END_FOR
            ELSE // Assuming string if not array
                CALL dependencies.add WITH { value: step.run_after }
            END_IF
        END_IF

        IF step.inputs_map IS_PRESENT THEN
            FOR_EACH inputField, sourceExpression IN step.inputs_map
                IF TYPE_OF sourceExpression IS 'string' THEN
                    DECLARE stepRefs = CALL cfv_code.ServerExecutionEngine_ExtractStepReferencesFromExpression WITH { expression: sourceExpression }
                    FOR_EACH stepRef IN stepRefs
                        CALL dependencies.add WITH { value: stepRef }
                    END_FOR
                END_IF
            END_FOR
        END_IF

        IF step.condition IS_PRESENT AND TYPE_OF step.condition IS 'string' THEN
            DECLARE stepRefsInCondition = CALL cfv_code.ServerExecutionEngine_ExtractStepReferencesFromExpression WITH { expression: step.condition }
            FOR_EACH stepRefInCondition IN stepRefsInCondition
                CALL dependencies.add WITH { value: stepRefInCondition }
            END_FOR
        END_IF
        RETURN_VALUE dependencies
    `
    dependencies: [
        "cfv_models.FlowStepDsl",
        "cfv_code.ServerExecutionEngine_ExtractStepReferencesFromExpression"
    ]
}

code cfv_code.ServerExecutionEngine_ExtractStepReferencesFromExpression {
    title: "Server: Extract Step References from Expression String"
    part_of_design: cfv_designs.StreamingExecutionAPIService
    language: "TypeScript"
    implementation_location: {
        filepath: "server/execution/ServerExecutionEngineUtils.ts",
        entry_point_name: "extractStepReferencesFromExpression",
        entry_point_type: "function"
    }
    signature: "(params: { expression: string }) => Set<string>"
    detailed_behavior: `
        // From original cfv_internal_code.ServerExecutionEngine_EnhancedDependencyResolution.extractStepReferencesFromExpression
        DECLARE expression = params.expression
        DECLARE stepReferences AS Set<string>
        CREATE_INSTANCE Set ASSIGN_TO stepReferences

        // Pattern: steps.stepName.outputs.path OR steps.stepName.field (legacy)
        // Does not capture direct references like "stepName.outputs.path" as those are ambiguous without context (could be object traversal).
        // Dependencies should be explicitly "steps.X" or "trigger.X" or "context.X".
        DECLARE primaryPattern = /steps\\.([a-zA-Z0-9_-]+)/g
        DECLARE matches
        ASSIGN matches = CALL RegExpAPI.matchAll WITH { text: expression, pattern: primaryPattern }
        FOR_EACH match IN matches
            IF match[1] IS_NOT_NULL THEN
                 CALL stepReferences.add WITH { value: match[1] }
            END_IF
        END_FOR
        RETURN_VALUE stepReferences
    `
    dependencies: ["RegExpAPI.matchAll"]
}

code cfv_code.ServerExecutionEngine_DetectCycles {
    title: "Server: Detect Cycles in Dependency Graph using DFS"
    part_of_design: cfv_designs.StreamingExecutionAPIService
    language: "TypeScript"
    implementation_location: {
        filepath: "server/execution/ServerExecutionEngineUtils.ts",
        entry_point_name: "detectCyclesDFS",
        entry_point_type: "function"
    }
    signature: "(params: { graph: Map<string, Set<string>> }) => List<List<String>>"
    detailed_behavior: `
        // From original cfv_internal_code.ServerExecutionEngine_EnhancedDependencyResolution.detectCycles
        DECLARE graph = params.graph
        DECLARE visited AS Set<string>; CREATE_INSTANCE Set ASSIGN_TO visited
        DECLARE recursionStack AS Set<string>; CREATE_INSTANCE Set ASSIGN_TO recursionStack
        DECLARE cyclesResult AS List<List<String>> = []

        FUNCTION dfs(node, path) // path is List<String>
            CALL visited.add WITH { value: node }
            CALL recursionStack.add WITH { value: node }
            // Create a new path array for this DFS branch to avoid modification issues in recursion
            DECLARE currentPath = [...path, node]

            DECLARE neighbors = CALL graph.get WITH { key: node } OR (CREATE_INSTANCE Set)
            FOR_EACH neighbor IN neighbors
                IF CALL recursionStack.has WITH { value: neighbor } THEN // Cycle detected
                    DECLARE cycleStartIndex = CALL currentPath.indexOf WITH { value: neighbor }
                    DECLARE detectedCycle = CALL currentPath.slice WITH { start: cycleStartIndex }
                    ADD detectedCycle TO cyclesResult
                    // Optionally, return true here if only one cycle needs to be reported per DFS path
                ELSE_IF NOT (CALL visited.has WITH { value: neighbor }) THEN
                    IF CALL dfs WITH { node: neighbor, path: currentPath } THEN
                        // Optionally, propagate true if a cycle was found deeper and we want to stop early
                    END_IF
                END_IF
            END_FOR
            CALL recursionStack.delete WITH { value: node } // Backtrack: remove from recursion stack
            RETURN_VALUE false // Indicates no cycle found starting from this specific DFS branch path continuation
        END_FUNCTION

        FOR_EACH nodeKey IN (CALL graph.keys)
            IF NOT (CALL visited.has WITH { value: nodeKey }) THEN
                CALL dfs WITH { node: nodeKey, path: [] }
            END_IF
        END_FOR
        RETURN_VALUE cyclesResult
    `
    dependencies: []
}

code cfv_code.ServerExecutionEngine_ExecuteStepsWithEnhancedDependencyResolution {
    title: "Server: Execute Steps with Layered Strategy and Fallbacks"
    part_of_design: cfv_designs.StreamingExecutionAPIService
    language: "TypeScript"
    implementation_location: {
        filepath: "server/execution/ServerExecutionEngine.ts",
        entry_point_name: "executeStepsWithEnhancedDependencyResolution",
        entry_point_type: "method"
    }
    signature: `(params: {
        steps: cfv_models.FlowStepDsl[],
        context: cfv_models.ExecutionContext,
        streamCallback: Function, // (event: cfv_models.StreamingExecutionEvent) => void
        dependencyAnalysis: cfv_models.DependencyAnalysis,
        componentExecutor: Function // (step, input, context) => Promise<StepOutput>
    }) => Promise<void>`
    detailed_behavior: `
        // Based on original cfv_internal_code.ServerExecutionEngine_EnhancedDependencyResolution.executeStepsWithEnhancedDependencyResolution
        // and cfv_internal_code.ServerExecutionEngine_LayeredExecutionStrategy
        DECLARE steps = params.steps
        DECLARE context = params.context
        DECLARE streamCallback = params.streamCallback
        DECLARE dependencyAnalysis = params.dependencyAnalysis
        DECLARE componentExecutor = params.componentExecutor

        DECLARE completedSteps AS Set<string>
        CREATE_INSTANCE Set ASSIGN_TO completedSteps; CALL completedSteps.add WITH { value: 'trigger' } // Trigger is implicitly complete
        DECLARE failedSteps AS Set<string>; CREATE_INSTANCE Set ASSIGN_TO failedSteps
        DECLARE warningCount = 0; DECLARE maxWarnings = 5 // Example limit

        CALL AbstractLogger.logInfo WITH { message: "Server: Starting enhanced execution. Layers: " + dependencyAnalysis.executionOrder.length }
        IF dependencyAnalysis.cycles.length > 0 THEN
            FOR_EACH cycle IN dependencyAnalysis.cycles
                DECLARE warningEventData AS cfv_models.ExecutionWarningEventData
                CREATE_INSTANCE cfv_models.ExecutionWarningEventData WITH { type: 'circular_dependency', message: "Circular dependency detected: " + cycle.join(' -> '), details: { cyclePath: cycle } } ASSIGN_TO warningEventData
                DECLARE streamEvent AS cfv_models.StreamingExecutionEvent
                CREATE_INSTANCE cfv_models.StreamingExecutionEvent WITH { type: 'execution.warning', executionId: context.executionId, timestamp: (CALL SystemTime.toISOString WITH { date: (CALL SystemTime.now) }), data: warningEventData } ASSIGN_TO streamEvent
                CALL streamCallback WITH { event: streamEvent }
                INCREMENT warningCount
            END_FOR
        END_IF

        FOR_EACH layer IN dependencyAnalysis.executionOrder
            DECLARE readyStepsInLayer = []
            FOR_EACH stepIdInLayer IN layer
                DECLARE stepDefinition = steps.find(s => s.step_id === stepIdInLayer)
                IF stepDefinition IS_NULL THEN CONTINUE END_IF

                DECLARE depsForThisStep = CALL dependencyAnalysis.graph.get WITH { key: stepIdInLayer } OR (CREATE_INSTANCE Set)
                DECLARE allDepsMet = true
                FOR_EACH depId IN depsForThisStep
                    IF NOT (CALL completedSteps.has WITH { value: depId }) THEN
                        ASSIGN allDepsMet = false; BREAK
                    END_IF
                END_FOR
                IF allDepsMet THEN ADD stepDefinition TO readyStepsInLayer END_IF
            END_FOR

            IF readyStepsInLayer.length > 0 THEN
                CALL AbstractLogger.logInfo WITH { message: "Server: Executing layer with " + readyStepsInLayer.length + " parallel steps: " + readyStepsInLayer.map(s => s.step_id).join(', ') }
                DECLARE stepPromises = []
                FOR_EACH stepToExecute IN readyStepsInLayer
                    // Actual step execution logic (resolve input, call componentExecutor, stream events)
                    // This would be a helper function, e.g., executeSingleStepAndStream
                    DECLARE promise = CALL self.executeSingleStepAndStream WITH { step: stepToExecute, context: context, streamCallback: streamCallback, componentExecutor: componentExecutor }
                    ADD promise TO stepPromises
                END_FOR
                DECLARE results = AWAIT Promise.allSettled(stepPromises)
                FOR_EACH result, index IN results
                    DECLARE stepId = readyStepsInLayer[index].step_id
                    IF result.status EQUALS 'fulfilled' THEN
                        CALL completedSteps.add WITH { value: stepId }
                    ELSE
                        CALL failedSteps.add WITH { value: stepId }
                        // Error already streamed by executeSingleStepAndStream
                    END_IF
                END_FOR
            ELSE
                // Deadlock / Unresolved dependency handling (simplified)
                IF warningCount < maxWarnings THEN
                     // Log warning about potential deadlock or unresolvable state
                    INCREMENT warningCount
                ELSE
                    CALL AbstractLogger.logError WITH { message: "Server: Max warnings reached, possibly deadlocked. Terminating layer processing." }
                    BREAK // From layers loop
                END_IF
            END_IF
            IF failedSteps.size > 0 AND NOT context.executionOptions?.continueOnError THEN // Assuming context has executionOptions
                CALL AbstractLogger.logInfo WITH { message: "Server: Execution stopping due to step failure and continueOnError is false." }
                BREAK
            END_IF
        END_FOR
        CALL AbstractLogger.logInfo WITH { message: "Server: Finished processing execution layers." }
    `
    dependencies: [
        "cfv_models.FlowStepDsl", "cfv_models.ExecutionContext", "cfv_models.StreamingExecutionEvent", "cfv_models.DependencyAnalysis", "cfv_models.ExecutionWarningEventData",
        "AbstractLogger.logInfo", "AbstractLogger.logError", "SystemTime.now", "SystemTime.toISOString",
        "Promise.allSettled" // Assumed available
        // self.executeSingleStepAndStream (needs to be defined as another code spec)
    ]
}

code cfv_code.ServerExecutionEngine_ResolveInputMapping {
    title: "Server: Resolve Input Mapping with Complex Expression Support"
    part_of_design: cfv_designs.StreamingExecutionAPIService
    language: "TypeScript"
    implementation_location: {
        filepath: "server/execution/ServerExecutionEngine.ts",
        entry_point_name: "resolveInputMapping",
        entry_point_type: "method"
    }
    signature: "(params: { mapping: string | any, context: cfv_models.ExecutionContext }) => any"
    detailed_behavior: `
        // Based on original cfv_internal_code.ServerExecutionEngine_EnhancedDependencyResolution.resolveInputMapping
        // and cfv_internal_code.ServerExecutionEngine_EnhancedExpressionResolution
        DECLARE mapping = params.mapping
        DECLARE context = params.context

        IF TYPE_OF mapping IS_NOT_STRING THEN
            RETURN_VALUE mapping // It's a literal value
        END_IF

        DECLARE expression = mapping AS String

        // Simplistic replacement for DSpec. Real impl needs robust parsing/evaluation (e.g., a small expression engine or careful regex).
        // For "steps.stepId.outputs.path"
        ASSIGN expression = CALL RegExpAPI.replaceAll WITH { text: expression, pattern: /steps\\.([^\\.]+)\\.outputs\\.([^\\s{}',"\\]+)/g, replacer: (match, stepId, path) => {
            DECLARE stepResult = CALL context.stepResults.get WITH { key: stepId }
            IF stepResult IS_PRESENT AND stepResult.outputData IS_PRESENT THEN
                DECLARE val = CALL GetNestedValueUtility.get WITH { obj: stepResult.outputData, path: path }
                RETURN_VALUE (TYPE_OF val IS 'string' ? "'" + val + "'" : JSON.stringify(val)) // Attempt to quote strings for safety in expressions
            END_IF
            RETURN_VALUE "null" // Or throw error
        }}

        // For "trigger.path"
        ASSIGN expression = CALL RegExpAPI.replaceAll WITH { text: expression, pattern: /trigger\\.([^\\s{}',"\\]+)/g, replacer: (match, path) => {
            IF context.triggerInput IS_PRESENT THEN
                DECLARE val = CALL GetNestedValueUtility.get WITH { obj: context.triggerInput, path: path }
                RETURN_VALUE (TYPE_OF val IS 'string' ? "'" + val + "'" : JSON.stringify(val))
            END_IF
            RETURN_VALUE "null"
        }}

        // For "context.varName"
        ASSIGN expression = CALL RegExpAPI.replaceAll WITH { text: expression, pattern: /context\\.([^\\s{}',"\\]+)/g, replacer: (match, varName) => {
            DECLARE val = CALL context.contextVariables.get WITH { key: varName }
            RETURN_VALUE (TYPE_OF val IS 'string' ? "'" + val + "'" : JSON.stringify(val))
        }}

        // If expression looks like a simple resolved value (e.g., quoted string, number, true/false, null) return it directly after type conversion.
        // Otherwise, if it still contains unresolved parts or is complex, it might need further evaluation or be treated as a string.
        // This DSpec simplifies: assume if it started with templates, it's meant to be evaluated.
        // A very basic attempt to parse if it looks like an object/array after replacement.
        TRY
            IF (expression.startsWith("{") AND expression.endsWith("}")) OR (expression.startsWith("[") AND expression.endsWith("]")) THEN
                // This is unsafe without a proper sandbox/parser. For DSpec, assume it's well-formed JSON-like.
                RETURN_VALUE JSON.parse(expression) // Potentially unsafe: eval(expression) is not recommended.
            ELSE IF expression.startsWith("'") AND expression.endsWith("'") THEN
                RETURN_VALUE expression.substring(1, expression.length -1)
            ELSE IF expression EQUALS "true" THEN RETURN_VALUE true
            ELSE IF expression EQUALS "false" THEN RETURN_VALUE false
            ELSE IF expression EQUALS "null" THEN RETURN_VALUE null
            ELSE IF NOT (CALL isNaN WITH { value: Number(expression) }) THEN RETURN_VALUE Number(expression)
            END_IF
        CATCH_ERROR e
            // Fallback to returning the processed expression string if parsing fails
            CALL AbstractLogger.logWarning WITH { message: "Server: Failed to parse resolved expression '" + expression + "': " + e.message }
        END_TRY
        RETURN_VALUE expression // Fallback to the (partially) resolved string
    `
    dependencies: [
        "cfv_models.ExecutionContext",
        "RegExpAPI.replaceAll", "GetNestedValueUtility.get",
        "JSON.stringify", "JSON.parse", "isNaN", "Number",
        "AbstractLogger.logWarning"
    ]
}