// cfv_tests.dspec
// Example test specifications for CascadeFlowVisualizer features.

test cfv_tests.ModuleLoading_SingleModule {
    title: "Test: Load and Display a Single Valid DSL Module"
    description: "Verifies that the visualizer can correctly load, parse, and display a single valid Cascade DSL V1.1 module provided via `initialModules`."
    verifies_requirement: [cfv_requirements.FR1_1_InitialModules, cfv_requirements.FR1_3_InternalModuleRegistry, cfv_requirements.FR2_1_GenerateNodesAndEdges]
    type: "Integration"
    priority: "Critical"
    test_location: {
        language: "TypeScript",
        framework: "JestPlaywright", // Example
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

test cfv_tests.Editing_SaveConfigChange {
    title: "Test: Edit and Save a Step's Configuration"
    description: "Verifies that a step's configuration can be edited via the Inspector and saved, triggering the `onSaveModule` callback with updated YAML."
    verifies_requirement: [cfv_requirements.FR7_Editing_V1Scope]
    type: "Integration"
    priority: "High"
    test_location: {
        language: "TypeScript",
        framework: "JestPlaywright",
        filepath: "tests/integration/editing.spec.ts",
        test_case_id_in_file: "should_edit_and_save_step_config"
    }
    preconditions: [
        "Visualizer loaded with a simple flow containing a step 's1' with initial config '{ initialParam: \"value1\" }'.",
        "`isEditingEnabled` prop is true.",
        "Consumer's `renderInspectorPropertiesTab` provides an input to edit `config.initialParam` and a save button triggering `actions.requestSave`."
    ]
    steps: [
        "Given the visualizer is loaded and flow is displayed",
        "When step 's1' is selected in the Main Canvas",
        "And its 'initialParam' in the Properties tab (Right Sidebar) is changed to 'newValue2'",
        "And the 'Save' button in the Properties tab is clicked",
        "Then the `onSaveModule` prop callback should be invoked.",
        "And the `newContent` in the callback payload should reflect the YAML with 's1.config.initialParam' as 'newValue2'."
    ]
    expected_result: "`onSaveModule` is called with the correctly modified YAML content for the module."
}

test cfv_tests.TraceVisualization_StepStatus {
    title: "Test: Visualize Flow Trace with Step Statuses"
    description: "Verifies that when `traceData` is provided, step nodes are visually updated (e.g., color-coded by custom renderer) to reflect their execution status."
    verifies_requirement: [cfv_requirements.FR8_Debugging_TraceVisualization]
    type: "Integration"
    priority: "Critical"
    test_location: {
        language: "TypeScript",
        framework: "JestPlaywright",
        filepath: "tests/integration/trace_visualization.spec.ts",
        test_case_id_in_file: "should_display_step_statuses_from_trace_data"
    }
    preconditions: [
        "Visualizer loaded with a flow having steps 's1', 's2'.",
        "Custom node renderer is configured to change appearance based on `node.data.executionStatus`."
    ]
    data_inputs: {
        traceData: "{ flowFqn: 'com.example.tracedFlow', steps: [{ stepId: 's1', status: 'SUCCESS' }, { stepId: 's2', status: 'FAILURE' }] }" // Simplified trace
    }
    steps: [
        "Given the visualizer is loaded and `mode` is 'trace'",
        "When `traceData` (from data_inputs) is provided via props",
        "Then the node for step 's1' should visually indicate 'SUCCESS' status.",
        "And the node for step 's2' should visually indicate 'FAILURE' status."
    ]
    expected_result: "Step nodes in the graph correctly reflect their execution status from the trace data, as interpreted by the custom node renderer."
}

// cfv_tests.dspec

test cfv_tests.ModuleLoading_WithImportsAndAlias {
    title: "Test: Load Modules with Imports and Aliases"
    description: "Verifies the visualizer correctly handles `imports` (including aliases) between modules, using `props.requestModule` for dependencies."
    verifies_requirement: [cfv_requirements.FR1_2_RequestAdditionalModules, cfv_requirements.FR1_5_HandleImportsAndAliases]
    type: "Integration" // Could be E2E with Playwright or focused Vitest test with mocked props
    priority: "Critical"
    test_location: {
        language: "TypeScript",
        framework: "Vitest", // Assuming a more focused integration test
        filepath: "tests/integration/module_imports.spec.ts",
        test_case_id_in_file: "should_resolve_imports_and_aliases_correctly"
    }
    preconditions: [
        "The `props.requestModule` function is mocked using Vitest (e.g., `vi.fn()`).",
        "Mocked `props.requestModule` is set up to return specific module content when called with expected FQNs."
    ]
    data_inputs: {
        initialModules: "[{ fqn: 'com.example.main', content: 'dsl_version: \"1.1\"\\nnamespace: com.example.main\\nimports:\\n  - namespace: com.example.shared\\n    as: util\\nflows:\\n  - name: MainFlow\\n    trigger: { type: T1 }\\n    steps:\\n      - step_id: s1\\n        component_ref: util.SharedComponent' }]",
        mockedSharedModuleContent: "'dsl_version: \"1.1\"\\nnamespace: com.example.shared\\ndefinitions:\\n  components:\\n    - name: SharedComponent\\n      type: StdLib:NoOp'"
    }
    steps: [
        "Given the CascadeFlowVisualizer is rendered with `initialModules` (com.example.main) and mocked `props.requestModule`",
        "And `props.requestModule` is configured to return `mockedSharedModuleContent` when called with 'com.example.shared'",
        "When the visualizer processes the 'com.example.main' module",
        "Then `props.requestModule` should have been called with 'com.example.shared'.",
        "And the 'com.example.shared' module should be loaded and available in the internal ModuleRegistry.",
        "And if 'com.example.main.MainFlow' is selected and step 's1' is inspected,",
        "Then its `resolvedComponentFqn` (in `node.data`) should correspond to 'com.example.shared.SharedComponent' (or its base type if `SharedComponent` is a named component)."
    ]
    expected_result: "The import is resolved, the dependent module is loaded via `props.requestModule`, and component references using aliases are correctly resolved. MSW could be used if `requestModule` involved actual network calls in a real app, but for library testing, Vitest mocks are sufficient."
}

test cfv_tests.TraceVisualization_StepStatusAndData {
    title: "Test: Visualize Flow Trace with Step Statuses and I/O Data Inspector"
    description: "Verifies step nodes reflect execution status and the Inspector's Data I/O tab shows correct data when a step is selected in trace mode."
    verifies_requirement: [cfv_requirements.FR8_Debugging_TraceVisualization, cfv_requirements.UILayout_RightSidebar_Inspector]
    type: "E2E"
    priority: "Critical"
    test_location: {
        language: "TypeScript",
        framework: "Playwright",
        filepath: "tests/e2e/trace_visualization_detail.spec.ts",
        test_case_id_in_file: "should_display_step_statuses_and_correct_io_data_in_inspector"
    }
    preconditions: [
        "Visualizer loaded with a flow having steps 's1' (SUCCESS) and 's2' (FAILURE).",
        "Consumer provides `customNodeTypes` that visually distinguish executionStatus.",
        "Consumer provides `renderInspectorDataIOTab` that displays `executionInputData` and `executionOutputData`."
    ]
    data_inputs: {
        initialModuleContent: "'dsl_version: \"1.1\"\\nnamespace: com.example.traced\\nflows:\\n  - name: MyTraceFlow\\n    trigger: { type: T1 }\\n    steps:\\n      - step_id: s1\\n        component_ref: C1\\n      - step_id: s2\\n        component_ref: C2\\n        inputs_map: { in: \"steps.s1.outputs.out\" }'",
        traceData: "{ traceId: 'trace-001', flowFqn: 'com.example.traced.MyTraceFlow', status: 'FAILED', startTime: '2023-01-01T10:00:00Z', steps: [{ stepId: 's1', status: 'SUCCESS', inputData: { initial: true }, outputData: { out: 'hello' } }, { stepId: 's2', status: 'FAILURE', inputData: { in: 'hello' }, outputData: { error: 'Something broke' } }] }"
    }
    steps: [
        "Given the CascadeFlowVisualizer is rendered with the initial module (from `initialModuleContent`)",
        "And `mode` is 'trace' and `traceData` (from `data_inputs`) is provided",
        "When the 'com.example.traced.MyTraceFlow' is displayed",
        "Then the node for step 's1' should visually indicate 'SUCCESS'.",
        "And the node for step 's2' should visually indicate 'FAILURE'.",
        "When step 's1' is selected",
        "Then the 'Data I/O' tab in the Right Sidebar should display inputData: { initial: true } and outputData: { out: 'hello' }.",
        "When step 's2' is selected",
        "Then the 'Data I/O' tab in the Right Sidebar should display inputData: { in: 'hello' } and outputData: { error: 'Something broke' }."
    ]
    expected_result: "Graph nodes visually reflect step statuses. Selecting a step in trace mode populates the Data I/O inspector tab with the correct input and output data from the trace."
}

test cfv_tests.ModuleRegistryService_ResolveComponent_NamedComponentInSameModule {
    title: "Unit Test: ModuleRegistryService.resolveComponentTypeInfo - Named Component in Same Module"
    verifies_code: [cfv_internal_services_code.ModuleRegistryService_ResolveComponentTypeInfo]
    type: "Unit"
    priority: "High"
    test_location: { filepath: "src/services/module_registry_service.spec.ts", test_case_id_in_file: "resolveComponentTypeInfo should find named component in same module" }
    preconditions: [
        "ModuleRegistryService is instantiated.",
        "A module 'com.example.test' is loaded with a NamedComponentDefinition 'MyNamedComp' (type: 'StdLib:ActualType')."
    ]
    data_inputs: { componentRef: "MyNamedComp", currentModuleFqn: "com.example.test" }
    steps: [
        "When resolveComponentTypeInfo is called with data_inputs",
        "Then the result should be an object.",
        "And result.baseType should be 'StdLib:ActualType'.",
        "And result.isNamedComponent should be true.",
        "And result.componentDefinition.name should be 'MyNamedComp'.",
        "And result.sourceModuleFqn should be 'com.example.test'."
    ]
    expected_result: "Correctly resolves to the named component within the same module."
}

test cfv_tests.GraphBuilderService_GenerateFlowDetail_Basic {
    title: "Unit Test: GraphBuilderService.generateFlowDetailGraphData - Basic Flow"
    verifies_code: [cfv_internal_services_code.GraphBuilderService_GenerateFlowDetailGraphData]
    type: "Unit"
    priority: "Critical"
    test_location: { filepath: "src/services/graph_builder_service.spec.ts", test_case_id_in_file: "generateFlowDetailGraphData should create nodes and edges for a basic flow" }
    preconditions: [
        "GraphBuilderService instantiated.",
        "Mocked ModuleRegistry providing a simple flow definition for 'com.example.flow.Simple'.",
        "Mocked parseContextVarsFn.",
        "Mocked componentSchemas."
    ]
    data_inputs: {
        params: "{ flowFqn: 'com.example.flow.Simple', mode: 'design', moduleRegistry: mockModuleRegistry, parseContextVarsFn: mockParseFn, componentSchemas: mockSchemas }"
    }
    steps: [
        "When generateFlowDetailGraphData is called with data_inputs.params",
        "Then the returned object should have 'nodes' and 'edges' arrays.",
        "And 'nodes' array should contain a trigger node and step nodes corresponding to the flow definition.",
        "And 'edges' array should reflect `inputs_map` and `run_after` connections.",
        "And node data payloads should contain expected dslObject, resolvedComponentFqn, etc."
    ]
    expected_result: "Correct graph data structure is generated for a basic flow."
}