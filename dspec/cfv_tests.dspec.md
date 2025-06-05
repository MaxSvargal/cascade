// cfv_tests.dspec

test cfv_tests.ModuleLoading_SingleModule {
    title: "Test: Load and Display a Single Valid DSL Module"
    description: "Verifies that the visualizer can correctly load, parse, and display a single valid Cascade DSL V1.1 module provided via `initialModules`."
    verifies_requirement: [cfv_requirements.FR1_ModuleManagement, cfv_requirements.FR1_1_InitialModuleLoading, cfv_requirements.FR2_GraphDataGeneration] // Broadened requirement link
    type: "Integration"
    priority: "Critical"
    test_location: {
        language: "TypeScript",
        framework: "JestPlaywright",
        filepath: "tests/integration/module_loading.spec.ts",
        test_case_id_in_file: "should_load_and_display_single_valid_module"
    }
    preconditions: [
        "A valid Cascade DSL V1.1 module string is prepared."
    ]
    data_inputs: {
        initialModules: "[{ fqn: 'com.example.test', content: 'dsl_version: \"1.1\"\\nnamespace: com.example.test\\nflows:\\n  - name: MyFlow\\n    trigger: { type: T1 }\\n    steps:\\n      - step_id: s1\\n        component_ref: C1' }]"
    }
    steps: [
        "Given the CascadeFlowVisualizer is rendered with `initialModules` (from data_inputs)",
        "And with basic consumer-provided node/edge renderers and inspector tabs",
        "When the visualizer finishes loading",
        "Then the 'com.example.test' module should be listed in the Modules List (Left Sidebar).",
        "And the 'com.example.test.MyFlow' flow should be listed in the Flows List (Left Sidebar).",
        "And selecting 'com.example.test.MyFlow' should display its graph in the Main Canvas.",
        "And the graph should contain a trigger node and a step node 's1'."
    ]
    expected_result: "The single module and its flow are correctly parsed and visualized. No errors are reported for the module."
}

test cfv_tests.Editing_SaveConfigChange_ViaPropertiesTab { // Renamed for clarity
    title: "Test: Edit and Save a Step's Configuration via Properties Tab"
    description: "Verifies that a step's configuration can be edited via the Properties tab and saved, triggering the `onSaveModule` callback with updated YAML."
    verifies_requirement: [cfv_requirements.FR7_Editing_ViaPropertiesTab]
    type: "Integration"
    priority: "High"
    test_location: {
        language: "TypeScript",
        framework: "JestPlaywright",
        filepath: "tests/integration/editing.spec.ts",
        test_case_id_in_file: "should_edit_and_save_step_config_via_properties_tab"
    }
    preconditions: [
        "Visualizer loaded with a simple flow containing a step 's1' with initial config '{ initialParam: \"value1\" }'.",
        "`isEditingEnabled` prop is true.",
        "Consumer's `renderInspectorPropertiesTab` provides an input to edit `config.initialParam` and a save button triggering `actions.requestSave`."
    ]
    steps: [
        "Given the visualizer is loaded and flow is displayed",
        "When step 's1' is selected in the Main Canvas",
        "And the 'Properties' tab in the Right Sidebar is active",
        "And its 'initialParam' in the form is changed to 'newValue2'",
        "And the 'Save' button in the Properties tab is clicked (invoking `actions.requestSave`)",
        "Then the `props.onSaveModule` prop callback should be invoked.",
        "And the `newContent` in the callback payload should reflect the YAML with 's1.config.initialParam' as 'newValue2'."
    ]
    expected_result: "`props.onSaveModule` is called with the correctly modified YAML content for the module."
}

test cfv_tests.StreamingExecution_StepStatusUpdate {
    title: "Test: Streaming Execution - Step Status Updates on Graph"
    description: "Verifies that step nodes are visually updated (e.g., color-coded) to reflect their execution status based on real-time streaming events."
    verifies_requirement: [cfv_requirements.FR12_EnhancedStreamingExecution, cfv_requirements.FR8_Debugging_ViaDebugTestTab]
    type: "Integration" // Could be E2E with a mock SSE server
    priority: "Critical"
    test_location: {
        language: "TypeScript",
        framework: "JestPlaywright", // or Vitest with mock EventSource
        filepath: "tests/integration/streaming_execution.spec.ts",
        test_case_id_in_file: "should_update_step_statuses_from_streaming_events"
    }
    preconditions: [
        "Visualizer loaded with a flow having steps 's1', 's2'.",
        "Custom node renderer is configured to change appearance based on `node.data.executionStatus` (PENDING, RUNNING, SUCCESS, FAILURE).",
        "A mock SSE endpoint is set up to send a sequence of cfv_models.StreamingExecutionEvent messages.",
        "The Debug & Test tab is active and an action to trigger streaming execution for the flow is available."
    ]
    data_inputs: { // Sequence of events the mock SSE server will send
        eventSequence: [
            "{ type: 'execution.started', executionId: 'exec-001', data: { flowFqn: 'com.example.streamFlow', flowDefinition: { steps: [{step_id: 's1'}, {step_id: 's2'}] } } }", // Simplified flowDef
            "{ type: 'step.started', executionId: 'exec-001', data: { stepId: 's1', inputData: {}, executionOrder: 1 } }",
            "{ type: 'step.completed', executionId: 'exec-001', data: { stepId: 's1', outputData: { res: 'ok' }, actualDuration: 100 } }",
            "{ type: 'step.started', executionId: 'exec-001', data: { stepId: 's2', inputData: {}, executionOrder: 2 } }",
            "{ type: 'step.failed', executionId: 'exec-001', data: { stepId: 's2', error: { message: 'Simulated Failure' }, actualDuration: 50 } }",
            "{ type: 'execution.failed', executionId: 'exec-001', data: { error: { message: 'Flow failed due to step s2' } } }"
        ]
    }
    steps: [
        "Given the visualizer is loaded and the flow 'com.example.streamFlow' is displayed",
        "And the mock SSE endpoint is ready to send `eventSequence`",
        "When the user triggers flow execution from the Debug & Test tab (which connects to the mock SSE endpoint)",
        "Then the node for step 's1' should initially visually indicate 'PENDING'.",
        "And then the node for step 's1' should visually indicate 'RUNNING'.",
        "And then the node for step 's1' should visually indicate 'SUCCESS'.",
        "And then the node for step 's2' should initially visually indicate 'PENDING' (or directly to 'RUNNING' if events are fast).",
        "And then the node for step 's2' should visually indicate 'RUNNING'.",
        "And then the node for step 's2' should visually indicate 'FAILURE'."
    ]
    expected_result: "Step nodes in the graph correctly reflect their execution status transitions (PENDING -> RUNNING -> SUCCESS/FAILURE) based on streamed events."
}

test cfv_tests.ModuleRegistryService_ResolveComponent_NamedComponentInSameModule {
    title: "Unit Test: ModuleRegistryService.resolveComponentTypeInfo - Named Component in Same Module"
    verifies_code: ["cfv_code.ModuleRegistryService_ResolveComponentTypeInfo"] // Assuming this code spec name after refactoring
    type: "Unit"
    priority: "High"
    test_location: { filepath: "src/services/ModuleRegistryServiceLogic.spec.ts", test_case_id_in_file: "resolveComponentTypeInfo should find named component in same module" }
    preconditions: [
        "ModuleRegistryService logic is set up with Jotai context or as pure functions.",
        "A module 'com.example.test' is loaded into the DslModuleRepresentationsAtom with a NamedComponentDefinition 'MyNamedComp' (type: 'StdLib:ActualType')."
    ]
    data_inputs: { componentRef: "MyNamedComp", currentModuleFqn: "com.example.test" }
    steps: [
        "When resolveComponentTypeInfo logic is called with data_inputs", // Invoking the specific function/logic unit
        "Then the result should be an object cfv_models.ResolvedComponentInfo.",
        "And result.baseType should be 'StdLib:ActualType'.",
        "And result.isNamedComponent should be true.",
        "And result.componentDefinition.name should be 'MyNamedComp'.",
        "And result.sourceModuleFqn should be 'com.example.test'."
    ]
    expected_result: "Correctly resolves to the named component within the same module."
}

test cfv_tests.GraphBuilderService_GenerateFlowDetail_Basic {
    title: "Unit Test: GraphBuilderService.generateFlowDetailGraphData - Basic Flow"
    verifies_code: ["cfv_code.GraphBuilderService_GenerateFlowDetailGraphData"] // Assuming this code spec name
    type: "Unit"
    priority: "Critical"
    test_location: { filepath: "src/services/GraphBuilderServiceLogic.spec.ts", test_case_id_in_file: "generateFlowDetailGraphData should create nodes and edges for a basic flow" }
    preconditions: [
        "GraphBuilderService logic is set up.",
        "Mocked cfv_models.IModuleRegistry providing a simple flow definition for 'com.example.flow.Simple'.",
        "Mocked parseContextVarsFn.",
        "Mocked componentSchemas map."
    ]
    data_inputs: {
        params: "{ flowFqn: 'com.example.flow.Simple', mode: 'design', moduleRegistry: mockModuleRegistry, parseContextVarsFn: mockParseFn, componentSchemas: mockSchemas, useAutoLayout: false }" // Simplified params model
    }
    steps: [
        "When generateFlowDetailGraphData logic is called with data_inputs.params",
        "Then the returned object should be cfv_models.GraphData with 'nodes' and 'edges' arrays.",
        "And 'nodes' array should contain a trigger node and step nodes corresponding to the flow definition.",
        "And 'edges' array should reflect `inputs_map`, `run_after`, and `outputs_map` connections with correct `dependencyType`.",
        "And node data payloads (cfv_models.BaseNodeData derivatives) should contain expected dslObject, resolvedComponentFqn, etc."
    ]
    expected_result: "Correct graph data structure is generated for a basic flow with distinct edge types."
}


test cfv_tests.DebugTestTab_InputDataResolutionForForm {
    title: "Test: Debug & Test Tab - Input Data Resolution for Step Form"
    description: "Verifies that the Debug & Test tab, when a step is selected, can use `actions.resolveStepInputData` to get data for populating an input form."
    verifies_requirement: [cfv_requirements.FR8_Debugging_ViaDebugTestTab, cfv_requirements.FR23_ClientCodeCleanupAndSimplification] // Verifies client-side helper still works
    type: "Integration"
    priority: "High"
    test_location: {
        language: "TypeScript",
        framework: "Vitest", // Testing the action call and its expected result
        filepath: "tests/integration/debug_test_tab_actions.spec.ts",
        test_case_id_in_file: "should_resolve_step_input_data_for_form_population"
    }
    preconditions: [
        "Visualizer is loaded with a flow: Trigger -> s1 (outputs {val: 'dataFromS1'}) -> s2 (inputs_map: {in_s2: 'steps.s1.outputs.val'}).",
        "The Debug & Test tab is conceptually active.",
        "`props.actions.resolveStepInputData` is implemented by the library to use client-side simulation (e.g., via cfv_designs.FlowSimulationService)."
    ]
    data_inputs: {
        flowFqn: "com.example.myFlow",
        stepIdToSelect: "s2",
        triggerInputForSim: "{}"
    }
    steps: [
        "Given the flow is loaded",
        "When `props.actions.resolveStepInputData` is called for step 's2' with trigger input data_inputs.triggerInputForSim",
        "Then the promise should resolve with a cfv_models.ResolvedStepInput object.",
        "And resolvedStepInput.actualInputData should be { in_s2: 'dataFromS1' }.",
        "And resolvedStepInput.stepId should be 's2'.",
        "And resolvedStepInput.componentSchema should be available if s2 has a schema."
    ]
    expected_result: "`actions.resolveStepInputData` correctly resolves the input for the selected step using client-side logic, suitable for form display."
}

// Tests from cfv_internal_services_code.dspec.md can be adapted to target the new cfv_code.* specs
// e.g., FlowSimulationService_CompleteFlowExecution -> cfv_code.InternalFlowSimulation_SimulateFlowExecution

test cfv_tests.InternalFlowSimulation_CompleteFlowExecution {
    title: "Unit Test: InternalFlowSimulationLogic - Complete Flow Execution"
    description: "Verifies that the internal flow simulation logic can execute a complete flow with proper data propagation."
    verifies_code: ["cfv_code.InternalFlowSimulation_SimulateFlowExecution"]
    type: "Unit"
    priority: "Critical"
    test_location: {
        language: "TypeScript",
        framework: "Vitest",
        filepath: "tests/unit/InternalFlowSimulationLogic.spec.ts",
        test_case_id_in_file: "should_execute_complete_flow_with_data_propagation"
    }
    preconditions: [
        "InternalFlowSimulation_SimulateFlowExecution function is available.",
        "Mocked cfv_models.IModuleRegistry providing a test flow.",
        "Mocked componentSchemas map.",
        "Mocked cfv_code.InternalComponentExecution_ExecuteTrigger and cfv_code.InternalComponentExecution_ExecuteStep."
    ]
    data_inputs: {
        flowFqn: "com.example.test.UserRegistrationFlow",
        triggerInput: "{ userData: { email: 'test@example.com', age: 25, country: 'US' } }"
    }
    steps: [
        "When InternalFlowSimulation_SimulateFlowExecution is called with data_inputs and mocked dependencies",
        "Then the result should be a cfv_models.FlowSimulationResult object",
        "And result.success should be true (or as expected for the test flow)",
        "And result.stepResults should contain results for all executed steps",
        "And data should propagate correctly between steps based on inputs_map"
    ]
    expected_result: "Complete flow execution simulation with proper data propagation and component outputs."
}