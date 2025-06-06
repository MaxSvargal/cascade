code cfv_code.ClientExecutionStreamHandler_HandleStreamingEvent {
    title: "Client: Handle Single Streaming Execution Event and Update Trace"
    part_of_design: cfv_designs.ClientExecutionStreamHandler
    language: "TypeScript"
    implementation_location: {
        filepath: "services/ClientExecutionStreamHandlerLogic.ts",
        entry_point_name: "handleStreamingEvent",
        entry_point_type: "function"
    }
    signature: "(params: { event: cfv_models.StreamingExecutionEvent, currentTrace: cfv_models.FlowExecutionTrace | null }) => cfv_models.FlowExecutionTrace"
    // Note: flowDefinitionFromStartEvent was removed from signature as event.data should contain it for execution.started
    detailed_behavior: `
        // Based on original cfv_internal_code.ClientExecutionStreamHandler_EnhancedStateManagement.detailed_behavior
        // Ensures new objects/maps are created for React reactivity.

        DECLARE event = params.event
        DECLARE currentTrace = params.currentTrace

        DECLARE newTrace AS cfv_models.FlowExecutionTrace
        IF currentTrace IS_NULL OR event.type EQUALS 'execution.started' THEN
            // Initialize new trace if null or if it's the start of execution
            DECLARE executionStartedData = event.data AS cfv_models.ExecutionStartedEventData
            CREATE_INSTANCE cfv_models.FlowExecutionTrace WITH {
                traceId: event.executionId,
                flowFqn: executionStartedData.flowFqn,
                status: 'RUNNING',
                startTime: event.timestamp,
                steps: (CREATE_INSTANCE Map), // Map<string, cfv_models.StepExecutionTrace>
                lastUpdated: (CALL SystemTime.now).getTime()
            } ASSIGN_TO newTrace

            // REFINED: Handle both new triggerContext and legacy triggerInput
            IF executionStartedData.triggerContext IS_PRESENT THEN
                ASSIGN newTrace.triggerContext = executionStartedData.triggerContext
                ASSIGN newTrace.triggerData = executionStartedData.triggerContext.runtimeData // For backward compatibility
            ELSE_IF executionStartedData.triggerInput IS_PRESENT THEN
                ASSIGN newTrace.triggerData = executionStartedData.triggerInput
            END_IF

            IF executionStartedData.flowDefinition AND executionStartedData.flowDefinition.steps IS_PRESENT THEN
                FOR_EACH stepDef IN executionStartedData.flowDefinition.steps
                    DECLARE stepTracePlaceholder AS cfv_models.StepExecutionTrace
                    CREATE_INSTANCE cfv_models.StepExecutionTrace WITH {
                        stepId: stepDef.step_id,
                        componentFqn: stepDef.component_ref,
                        status: 'PENDING',
                        startTime: null, endTime: null, durationMs: null,
                        inputData: null, outputData: null, executionOrder: null
                    } ASSIGN_TO stepTracePlaceholder
                    CALL newTrace.steps.set WITH { key: stepDef.step_id, value: stepTracePlaceholder }
                END_FOR
            END_IF
        ELSE
            // Create a new trace object based on the current one for immutability
            ASSIGN newTrace = { ...currentTrace }
            ASSIGN newTrace.steps = (CREATE_INSTANCE Map FROM currentTrace.steps) // Ensure steps map is also a new instance
        END_IF

        SWITCH event.type
            CASE 'execution.started'
                // Already handled by initial trace creation if currentTrace was null.
                // If currentTrace was not null, this implies a re-start or an unexpected event.
                // For robustness, re-initialize based on the new event's data.
                DECLARE esData = event.data AS cfv_models.ExecutionStartedEventData
                ASSIGN newTrace.flowFqn = esData.flowFqn
                
                // REFINED: Handle both new triggerContext and legacy triggerInput
                IF esData.triggerContext IS_PRESENT THEN
                    ASSIGN newTrace.triggerContext = esData.triggerContext
                    ASSIGN newTrace.triggerData = esData.triggerContext.runtimeData // For backward compatibility
                ELSE_IF esData.triggerInput IS_PRESENT THEN
                    ASSIGN newTrace.triggerData = esData.triggerInput
                END_IF
                
                ASSIGN newTrace.status = 'RUNNING'
                ASSIGN newTrace.startTime = event.timestamp
                ASSIGN newTrace.endTime = undefined // Clear end time
                ASSIGN newTrace.flowError = undefined // Clear previous errors
                ASSIGN newTrace.steps.clear() // Clear previous steps
                IF esData.flowDefinition AND esData.flowDefinition.steps IS_PRESENT THEN
                    FOR_EACH stepDef IN esData.flowDefinition.steps
                         DECLARE stPlaceholder AS cfv_models.StepExecutionTrace
                         CREATE_INSTANCE cfv_models.StepExecutionTrace WITH { stepId: stepDef.step_id, componentFqn: stepDef.component_ref, status: 'PENDING' } ASSIGN_TO stPlaceholder
                         CALL newTrace.steps.set WITH { key: stepDef.step_id, value: stPlaceholder }
                    END_FOR
                END_IF
                BREAK

            CASE 'step.started'
                DECLARE stepStartedData = event.data AS cfv_models.StepStartedEventData
                DECLARE existingStep = CALL newTrace.steps.get WITH { key: stepStartedData.stepId }
                DECLARE updatedStep AS cfv_models.StepExecutionTrace
                IF existingStep IS_PRESENT THEN
                    CREATE_INSTANCE cfv_models.StepExecutionTrace WITH {
                        ...existingStep,
                        status: 'RUNNING',
                        startTime: event.timestamp,
                        inputData: stepStartedData.inputData,
                        executionOrder: stepStartedData.executionOrder,
                        endTime: null, outputData: null, errorData: null, durationMs: null // Reset fields from previous runs if any
                    } ASSIGN_TO updatedStep
                ELSE // Should ideally not happen if execution.started pre-populates
                    CREATE_INSTANCE cfv_models.StepExecutionTrace WITH {
                        stepId: stepStartedData.stepId,
                        componentFqn: "Unknown (not in flowDef)", // Or fetch from a flowDef lookup
                        status: 'RUNNING',
                        startTime: event.timestamp,
                        inputData: stepStartedData.inputData,
                        executionOrder: stepStartedData.executionOrder
                    } ASSIGN_TO updatedStep
                END_IF
                CALL newTrace.steps.set WITH { key: stepStartedData.stepId, value: updatedStep }
                break

            CASE 'step.completed'
                DECLARE stepCompletedData = event.data AS cfv_models.StepCompletedEventData
                DECLARE existingStep = CALL newTrace.steps.get WITH { key: stepCompletedData.stepId }
                IF existingStep IS_PRESENT THEN
                    DECLARE completedStep AS cfv_models.StepExecutionTrace
                    CREATE_INSTANCE cfv_models.StepExecutionTrace WITH {
                        ...existingStep,
                        status: 'SUCCESS',
                        endTime: event.timestamp,
                        durationMs: stepCompletedData.actualDuration,
                        outputData: stepCompletedData.outputData,
                        errorData: null // Clear any previous error
                    } ASSIGN_TO completedStep
                    CALL newTrace.steps.set WITH { key: stepCompletedData.stepId, value: completedStep }
                END_IF
                BREAK

            CASE 'step.failed'
                DECLARE stepFailedData = event.data AS cfv_models.StepFailedEventData
                DECLARE existingStep = CALL newTrace.steps.get WITH { key: stepFailedData.stepId }
                IF existingStep IS_PRESENT THEN
                    DECLARE failedStep AS cfv_models.StepExecutionTrace
                    CREATE_INSTANCE cfv_models.StepExecutionTrace WITH {
                        ...existingStep,
                        status: 'FAILURE',
                        endTime: event.timestamp,
                        durationMs: stepFailedData.actualDuration,
                        errorData: stepFailedData.error, // errorData is cfv_models.ExecutionError
                        outputData: null // Clear any previous success output
                    } ASSIGN_TO failedStep
                    CALL newTrace.steps.set WITH { key: stepFailedData.stepId, value: failedStep }
                END_IF
                BREAK

            CASE 'execution.completed'
                DECLARE executionCompletedData = event.data AS cfv_models.ExecutionCompletedEventData
                ASSIGN newTrace.status = 'COMPLETED'
                ASSIGN newTrace.endTime = event.timestamp
                ASSIGN newTrace.finalOutput = executionCompletedData.finalOutput
                IF executionCompletedData.totalDuration IS_PRESENT THEN ASSIGN newTrace.durationMs = executionCompletedData.totalDuration END_IF
                ASSIGN newTrace.flowError = undefined // Clear flow error on successful completion
                BREAK

            CASE 'execution.failed'
                DECLARE executionFailedData = event.data AS cfv_models.ExecutionFailedEventData
                ASSIGN newTrace.status = 'FAILED'
                ASSIGN newTrace.endTime = event.timestamp
                ASSIGN newTrace.flowError = executionFailedData.error
                IF executionFailedData.totalDuration IS_PRESENT THEN ASSIGN newTrace.durationMs = executionFailedData.totalDuration END_IF
                break

            CASE 'execution.warning'
                DECLARE warningData = event.data AS cfv_models.ExecutionWarningEventData
                CALL AbstractLogger.logWarning WITH { message: "Execution Warning for " + newTrace.flowFqn + " (ID: " + event.executionId + "): " + warningData.message + " Details: " + JSON.stringify(warningData.details) }
                // Warnings might be stored in the trace if a field is added, e.g., newTrace.warnings.push(warningData)
                BREAK

            DEFAULT
                CALL AbstractLogger.logWarning WITH { message: "ClientStreamHandler: Unknown streaming event type received: " + event.type }
                BREAK
        END_SWITCH

        ASSIGN newTrace.lastUpdated = (CALL SystemTime.now).getTime()
        RETURN_VALUE newTrace
    `
    dependencies: [
        "cfv_models.StreamingExecutionEvent",
        "cfv_models.FlowExecutionTrace",
        "cfv_models.StepExecutionTrace",
        "cfv_models.ExecutionStatusEnum",
        "cfv_models.FlowDefinitionDsl",
        "cfv_models.ExecutionStartedEventData",
        "cfv_models.StepStartedEventData",
        "cfv_models.StepCompletedEventData",
        "cfv_models.StepFailedEventData",
        "cfv_models.ExecutionCompletedEventData",
        "cfv_models.ExecutionFailedEventData",
        "cfv_models.ExecutionWarningEventData",
        "AbstractLogger.logWarning",
        "SystemTime.now",
        "JSON.stringify"
    ]
}