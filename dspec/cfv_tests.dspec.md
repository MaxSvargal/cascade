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

// --- NEW TESTS FOR ENHANCED FEATURES ---

test cfv_tests.LayoutService_LeftToRightOrientation {
    title: "Test: Left-to-Right Layout Orientation"
    description: "Verifies that flows are rendered with left-to-right orientation by default."
    verifies_requirement: [cfv_requirements.FR12_LeftToRightFlowLayout, cfv_requirements.FR6_Layout_ELKjs]
    type: "Integration"
    priority: "High"
    test_location: {
        language: "TypeScript",
        framework: "Vitest",
        filepath: "tests/integration/layout_orientation.spec.ts",
        test_case_id_in_file: "should_render_flows_left_to_right"
    }
    preconditions: [
        "A flow with trigger and multiple steps is loaded.",
        "ELK.js layout is enabled."
    ]
    steps: [
        "Given a flow with trigger -> step1 -> step2 -> step3 is displayed",
        "When the layout is applied",
        "Then the trigger node should have the smallest x-coordinate",
        "And step nodes should be arranged with increasing x-coordinates",
        "And the layout direction should be 'RIGHT'"
    ]
    expected_result: "Flow elements are arranged from left to right in execution order."
}

test cfv_tests.SystemOverview_FlowNavigation {
    title: "Test: System Overview Flow Node Navigation"
    description: "Verifies that clicking on flow nodes in System Overview navigates to Flow Detail view."
    verifies_requirement: [cfv_requirements.FR14_SystemOverviewNavigation]
    type: "E2E"
    priority: "High"
    test_location: {
        language: "TypeScript",
        framework: "Playwright",
        filepath: "tests/e2e/system_overview_navigation.spec.ts",
        test_case_id_in_file: "should_navigate_to_flow_detail_on_flow_node_click"
    }
    preconditions: [
        "Multiple flows are loaded in the visualizer.",
        "System Overview mode is active."
    ]
    steps: [
        "Given the visualizer is in System Overview mode",
        "And multiple flow nodes are visible",
        "When a specific flow node is clicked",
        "Then the visualizer should switch to Flow Detail mode",
        "And the clicked flow should be displayed in detail",
        "And the URL or navigation state should reflect the selected flow"
    ]
    expected_result: "Clicking flow nodes in System Overview successfully navigates to Flow Detail view."
}

test cfv_tests.NodeStyling_BackgroundContainment {
    title: "Test: Node Background Styling Containment"
    description: "Verifies that node backgrounds are properly contained within node boundaries."
    verifies_requirement: [cfv_requirements.FR13_ImprovedNodeStyling]
    type: "Visual"
    priority: "Medium"
    test_location: {
        language: "TypeScript",
        framework: "Playwright",
        filepath: "tests/visual/node_styling.spec.ts",
        test_case_id_in_file: "should_contain_backgrounds_within_node_boundaries"
    }
    preconditions: [
        "Nodes with various background styles are rendered.",
        "Visual regression testing is configured."
    ]
    steps: [
        "Given nodes with different background colors and styles are displayed",
        "When the nodes are rendered",
        "Then backgrounds should not extend beyond node boundaries",
        "And text should be properly positioned within nodes",
        "And borders and shadows should render correctly"
    ]
    expected_result: "Node styling is properly contained and visually correct."
}

// --- TESTS FOR NEW SERVICES ---

test cfv_tests.FlowSimulationService_CompleteFlowExecution {
    title: "Unit Test: FlowSimulationService - Complete Flow Execution"
    description: "Verifies that FlowSimulationService can execute a complete flow with proper data propagation."
    verifies_code: [cfv_internal_services_code.FlowSimulationService_SimulateFlowExecution]
    type: "Unit"
    priority: "Critical"
    test_location: {
        language: "TypeScript",
        framework: "Vitest",
        filepath: "tests/unit/flow_simulation_service.spec.ts",
        test_case_id_in_file: "should_execute_complete_flow_with_data_propagation"
    }
    preconditions: [
        "FlowSimulationService is instantiated with mocked dependencies.",
        "A test flow with trigger and multiple steps is available.",
        "Component schemas are mocked for realistic output generation."
    ]
    data_inputs: {
        flowFqn: "com.example.test.UserRegistrationFlow",
        triggerInput: "{ userData: { email: 'test@example.com', age: 25, country: 'US' } }"
    }
    steps: [
        "When simulateFlowExecution is called with data_inputs",
        "Then the result should be a FlowSimulationResult object",
        "And result.success should be true",
        "And result.stepResults should contain results for all executed steps",
        "And result.executionLog should contain execution timeline entries",
        "And data should propagate correctly between steps based on inputs_map"
    ]
    expected_result: "Complete flow execution with proper data propagation and realistic component outputs."
}

test cfv_tests.FlowSimulationService_StepInputResolution {
    title: "Unit Test: FlowSimulationService - Step Input Resolution"
    description: "Verifies that step inputs are correctly resolved from trigger outputs, previous steps, and context variables."
    verifies_code: [cfv_internal_services_code.FlowSimulationService_ResolveStepInput]
    type: "Unit"
    priority: "High"
    test_location: {
        language: "TypeScript",
        framework: "Vitest",
        filepath: "tests/unit/flow_simulation_service.spec.ts",
        test_case_id_in_file: "should_resolve_step_inputs_from_multiple_sources"
    }
    preconditions: [
        "A step with complex inputs_map referencing trigger, previous steps, and context variables.",
        "Execution context with populated step results and context variables."
    ]
    data_inputs: {
        step: "{ id: 's2', inputs_map: { userData: 'trigger.userData', processedData: 'step.s1.result', apiKey: 'context.API_KEY' } }",
        executionContext: "Mock execution context with trigger result, s1 result, and context variables"
    }
    steps: [
        "When resolveStepInput is called with data_inputs",
        "Then the result should contain resolvedInput with all mapped values",
        "And inputSources should show the source of each resolved value",
        "And validation should be performed against component schema if available"
    ]
    expected_result: "Step inputs are correctly resolved from all specified sources with proper validation."
}

test cfv_tests.YamlReconstructionService_ModuleReconstruction {
    title: "Unit Test: YamlReconstructionService - Module YAML Reconstruction"
    description: "Verifies that YAML can be reconstructed from module representations while preserving structure."
    verifies_code: [cfv_internal_services_code.YamlReconstructionService_ReconstructModuleYaml]
    type: "Unit"
    priority: "High"
    test_location: {
        language: "TypeScript",
        framework: "Vitest",
        filepath: "tests/unit/yaml_reconstruction_service.spec.ts",
        test_case_id_in_file: "should_reconstruct_yaml_from_module_representation"
    }
    preconditions: [
        "A DslModuleRepresentation with parsed content including imports, context variables, named components, and flows."
    ]
    data_inputs: {
        moduleRep: "Mock DslModuleRepresentation with complete parsed content structure"
    }
    steps: [
        "When reconstructModuleYaml is called with data_inputs.moduleRep",
        "Then the result should be valid YAML string",
        "And the YAML should contain all sections from the original module",
        "And the structure should be properly formatted with correct indentation",
        "And comments should be preserved where applicable"
    ]
    expected_result: "Valid YAML is reconstructed that matches the original module structure."
}

test cfv_tests.YamlReconstructionService_ConfigurationUpdate {
    title: "Unit Test: YamlReconstructionService - Configuration Update in YAML"
    description: "Verifies that specific configuration values can be updated in YAML while preserving formatting."
    verifies_code: [cfv_internal_services_code.YamlReconstructionService_UpdateConfigurationInYaml]
    type: "Unit"
    priority: "High"
    test_location: {
        language: "TypeScript",
        framework: "Vitest",
        filepath: "tests/unit/yaml_reconstruction_service.spec.ts",
        test_case_id_in_file: "should_update_configuration_preserving_formatting"
    }
    preconditions: [
        "Original YAML with component configuration.",
        "Path to specific configuration value.",
        "New configuration value to update."
    ]
    data_inputs: {
        originalYaml: "YAML string with component configuration",
        pathToConfig: "['flows', 0, 'steps', 1, 'config', 'timeout']",
        newConfigValue: "5000"
    }
    steps: [
        "When updateConfigurationInYaml is called with data_inputs",
        "Then the result should be updated YAML string",
        "And the specific configuration value should be updated",
        "And other formatting and structure should be preserved",
        "And comments should remain intact"
    ]
    expected_result: "Configuration is updated while preserving YAML formatting and structure."
}

test cfv_tests.ComponentSchemaService_SchemaRetrieval {
    title: "Unit Test: ComponentSchemaService - Component Schema Retrieval"
    description: "Verifies that component schemas are correctly retrieved for both standard library and named components."
    verifies_code: [cfv_internal_services_code.ComponentSchemaService_GetComponentSchema]
    type: "Unit"
    priority: "High"
    test_location: {
        language: "TypeScript",
        framework: "Vitest",
        filepath: "tests/unit/component_schema_service.spec.ts",
        test_case_id_in_file: "should_retrieve_schemas_for_different_component_types"
    }
    preconditions: [
        "ComponentSchemaService with mocked standard library and named component schemas."
    ]
    data_inputs: {
        stdLibComponent: "StdLib:DataTransform",
        namedComponent: "kyc.DocumentVerification"
    }
    steps: [
        "When getComponentSchema is called with stdLibComponent",
        "Then the result should contain inputSchema, outputSchema, and configSchema",
        "When getComponentSchema is called with namedComponent",
        "Then the result should contain schemas for the named component",
        "And schemas should be in proper JSON Schema format"
    ]
    expected_result: "Correct schemas are retrieved for both standard library and named components."
}

test cfv_tests.DataGenerationService_TestDataGeneration {
    title: "Unit Test: DataGenerationService - Test Data Generation"
    description: "Verifies that realistic test data is generated based on schemas and scenarios."
    verifies_code: [cfv_internal_services_code.DataGenerationService_GenerateTestData]
    type: "Unit"
    priority: "Medium"
    test_location: {
        language: "TypeScript",
        framework: "Vitest",
        filepath: "tests/unit/data_generation_service.spec.ts",
        test_case_id_in_file: "should_generate_realistic_test_data_for_scenarios"
    }
    preconditions: [
        "Component schema with complex input structure including objects, arrays, and primitives."
    ]
    data_inputs: {
        schema: "JSON Schema for user registration input",
        scenarios: "['happy_path', 'edge_case', 'error_case']"
    }
    steps: [
        "For each scenario in data_inputs.scenarios",
        "When generateTestData is called with schema and scenario",
        "Then the result should conform to the schema structure",
        "And the data should be appropriate for the scenario type",
        "And happy_path data should use valid, realistic values",
        "And error_case data should include invalid values for testing"
    ]
    expected_result: "Appropriate test data is generated for each scenario type."
}

// --- TESTS FOR CONSOLIDATED INSPECTOR TABS ---

test cfv_tests.ConsolidatedInspectorTabs_TabSwitching {
    title: "E2E Test: Consolidated Inspector Tabs - Tab Switching"
    description: "Verifies that the three consolidated inspector tabs (Source, Properties, Debug & Test) switch correctly."
    verifies_requirement: [cfv_requirements.FR20_ConsolidatedInspectorTabs]
    type: "E2E"
    priority: "High"
    test_location: {
        language: "TypeScript",
        framework: "Playwright",
        filepath: "tests/e2e/consolidated_inspector_tabs.spec.ts",
        test_case_id_in_file: "should_switch_between_consolidated_tabs"
    }
    preconditions: [
        "A flow with components is loaded and displayed.",
        "A component step is selected to activate the inspector."
    ]
    steps: [
        "Given a component step is selected",
        "Then the Source tab should be active by default",
        "And the Source tab should display the full module YAML with syntax highlighting",
        "When the Properties tab is clicked",
        "Then the Properties tab should become active",
        "And a schema-driven form should be displayed for component configuration",
        "When the Debug & Test tab is clicked",
        "Then the Debug & Test tab should become active",
        "And input forms and execution controls should be displayed"
    ]
    expected_result: "All three consolidated tabs switch correctly and display appropriate content."
}

test cfv_tests.SourceTab_YamlDisplayAndHighlighting {
    title: "E2E Test: Source Tab - YAML Display and Element Highlighting"
    description: "Verifies that the Source tab displays complete module YAML with syntax highlighting and element highlighting."
    verifies_requirement: [cfv_requirements.FR21_1_SourceTabAsDefault, cfv_requirements.FR21_2_SyntaxHighlightedYAML]
    type: "E2E"
    priority: "High"
    test_location: {
        language: "TypeScript",
        framework: "Playwright",
        filepath: "tests/e2e/source_tab.spec.ts",
        test_case_id_in_file: "should_display_highlighted_yaml_with_element_selection"
    }
    preconditions: [
        "A module with flows and components is loaded.",
        "The Source tab is active."
    ]
    steps: [
        "Given a component step is selected",
        "When the Source tab is displayed",
        "Then the complete module YAML should be visible",
        "And syntax highlighting should be applied using highlight.js",
        "And line numbers should be displayed",
        "And the selected element should be highlighted within the YAML",
        "And copy functionality should be available"
    ]
    expected_result: "Source tab displays professionally formatted YAML with proper highlighting and navigation."
}

test cfv_tests.PropertiesTab_SchemaBasedForms {
    title: "E2E Test: Properties Tab - Schema-Based Form Generation"
    description: "Verifies that the Properties tab generates forms from component schemas and handles validation."
    verifies_requirement: [cfv_requirements.FR21_3_SchemaBasedForms]
    type: "E2E"
    priority: "High"
    test_location: {
        language: "TypeScript",
        framework: "Playwright",
        filepath: "tests/e2e/properties_tab.spec.ts",
        test_case_id_in_file: "should_generate_forms_from_component_schemas"
    }
    preconditions: [
        "A component with configurable properties is selected.",
        "Component schema includes various field types (text, number, boolean, select)."
    ]
    steps: [
        "Given a configurable component is selected",
        "When the Properties tab is displayed",
        "Then a form should be generated based on the component's configSchema",
        "And form fields should match the schema types and constraints",
        "And current configuration values should be pre-populated",
        "When invalid data is entered",
        "Then validation errors should be displayed inline",
        "When valid changes are made and Save is clicked",
        "Then the requestSave callback should be triggered with the new configuration"
    ]
    expected_result: "Properties tab generates functional forms with proper validation and save functionality."
}

test cfv_tests.DebugTestTab_InputFormGeneration {
    title: "E2E Test: Debug & Test Tab - Input Form Generation"
    description: "Verifies that the Debug & Test tab generates input forms based on selected elements and their schemas."
    verifies_requirement: [cfv_requirements.FR22_1_InputFormInterface, cfv_requirements.FR22_2_ContextualInputDisplay]
    type: "E2E"
    priority: "High"
    test_location: {
        language: "TypeScript",
        framework: "Playwright",
        filepath: "tests/e2e/debug_test_tab.spec.ts",
        test_case_id_in_file: "should_generate_contextual_input_forms"
    }
    preconditions: [
        "A flow with trigger and multiple steps is loaded.",
        "Component schemas are available for input resolution."
    ]
    steps: [
        "Given the trigger is selected",
        "When the Debug & Test tab is displayed",
        "Then an input form should be generated based on the trigger schema",
        "And default values should be populated from the trigger configuration",
        "When a step component is selected",
        "Then the input form should be updated based on the component's input schema",
        "And resolved input data should be displayed showing data lineage",
        "And input sources should be clearly indicated (trigger, previous steps, context)"
    ]
    expected_result: "Debug & Test tab generates contextual input forms with proper data resolution and lineage display."
}

test cfv_tests.DebugTestTab_FlowExecution {
    title: "E2E Test: Debug & Test Tab - Flow Execution from Selected Step"
    description: "Verifies that flows can be executed from selected steps with proper input data resolution."
    verifies_requirement: [cfv_requirements.FR22_4_ExecutionFromSelectedStep, cfv_requirements.FR22_5_ComprehensiveResultsDisplay]
    type: "E2E"
    priority: "High"
    test_location: {
        language: "TypeScript",
        framework: "Playwright",
        filepath: "tests/e2e/debug_test_tab.spec.ts",
        test_case_id_in_file: "should_execute_flow_from_selected_step"
    }
    preconditions: [
        "A flow with multiple steps is loaded.",
        "FlowSimulationService is properly configured.",
        "Input data is provided for execution."
    ]
    steps: [
        "Given a step in the middle of the flow is selected",
        "And input data is provided in the Debug & Test tab",
        "When the Run button is clicked",
        "Then flow execution should start from the selected step",
        "And execution results should be displayed with step-by-step details",
        "And execution logs should show timestamps and performance metrics",
        "And output data should be displayed in formatted JSON/YAML",
        "And any errors should be clearly displayed with stack traces"
    ]
    expected_result: "Flow execution works correctly from selected steps with comprehensive results display."
}

test cfv_tests.DebugTestTab_TestCaseManagement {
    title: "E2E Test: Debug & Test Tab - Test Case Creation and Execution"
    description: "Verifies that test cases can be created, managed, and executed within the Debug & Test tab."
    verifies_requirement: [cfv_requirements.FR22_EnhancedDebugTestInterface]
    type: "E2E"
    priority: "Medium"
    test_location: {
        language: "TypeScript",
        framework: "Playwright",
        filepath: "tests/e2e/debug_test_tab.spec.ts",
        test_case_id_in_file: "should_manage_and_execute_test_cases"
    }
    preconditions: [
        "A flow is loaded and selected.",
        "TestCaseService is properly configured."
    ]
    steps: [
        "Given a flow is selected in the Debug & Test tab",
        "When the Create Test Case button is clicked",
        "Then a test case creation form should be displayed",
        "And test input templates should be available",
        "When test case details are filled and saved",
        "Then the test case should be added to the test case list",
        "When the Execute Test button is clicked",
        "Then the test case should be executed",
        "And test results should be displayed with pass/fail status",
        "And assertion results should be clearly shown"
    ]
    expected_result: "Test cases can be created, managed, and executed with proper results display."
}

test cfv_tests.SchemaBasedInputResolution_DataLineage {
    title: "Integration Test: Schema-Based Input Resolution with Data Lineage"
    description: "Verifies that input data is correctly resolved based on schemas and data lineage is properly displayed."
    verifies_requirement: [cfv_requirements.FR22_6_SchemaBasedInputResolution]
    type: "Integration"
    priority: "High"
    test_location: {
        language: "TypeScript",
        framework: "Vitest",
        filepath: "tests/integration/schema_input_resolution.spec.ts",
        test_case_id_in_file: "should_resolve_inputs_with_proper_data_lineage"
    }
    preconditions: [
        "A complex flow with multiple steps and data transformations.",
        "Component schemas with detailed input/output specifications.",
        "FlowSimulationService and ComponentSchemaService are properly configured."
    ]
    data_inputs: {
        flow: "Complex user registration flow with KYC, compliance checks, and notifications",
        triggerInput: "Realistic user registration data with nested objects and arrays"
    }
    steps: [
        "Given a complex flow is loaded with the trigger input",
        "When each step is selected in sequence",
        "Then input data should be resolved based on the step's input schema",
        "And data lineage should show how each input field is derived",
        "And trigger data should propagate correctly through the flow",
        "And context variables should be resolved at each step",
        "And data transformations should be applied correctly"
    ]
    expected_result: "Input data is correctly resolved with clear data lineage visualization throughout the flow."
}

// --- PERFORMANCE AND INTEGRATION TESTS ---

test cfv_tests.ComplexExample_CasinoPlatform {
    title: "Integration Test: Complex Casino Platform Example"
    description: "Verifies that the visualizer can handle complex real-world examples like a casino platform with multiple interconnected flows."
    verifies_requirement: [cfv_requirements.FR16_ComplexExampleSupport]
    type: "Integration"
    priority: "Medium"
    test_location: {
        language: "TypeScript",
        framework: "Vitest",
        filepath: "tests/integration/complex_casino_example.spec.ts",
        test_case_id_in_file: "should_handle_complex_casino_platform_flows"
    }
    preconditions: [
        "Casino platform DSL modules with 50+ components and multiple interconnected flows.",
        "Complex business logic including user registration, KYC, game management, payments, and compliance."
    ]
    data_inputs: {
        modules: "Complete casino platform DSL with user management, game flows, payment processing, and compliance modules"
    }
    steps: [
        "Given the complex casino platform modules are loaded",
        "When the System Overview is displayed",
        "Then all flows should be properly parsed and visualized",
        "And complex component relationships should be clearly shown",
        "And performance should remain acceptable with 50+ nodes",
        "When individual flows are inspected",
        "Then all consolidated inspector tabs should work correctly",
        "And flow simulation should work with realistic casino data"
    ]
    expected_result: "Complex casino platform example is fully supported with good performance and functionality."
}

test cfv_tests.Performance_LargeFlowHandling {
    title: "Performance Test: Large Flow Handling"
    description: "Verifies that the visualizer maintains good performance with large flows and complex data structures."
    type: "Performance"
    priority: "Medium"
    test_location: {
        language: "TypeScript",
        framework: "Vitest",
        filepath: "tests/performance/large_flow_handling.spec.ts",
        test_case_id_in_file: "should_maintain_performance_with_large_flows"
    }
    preconditions: [
        "Large flow with 100+ steps and complex data transformations.",
        "Performance monitoring tools configured."
    ]
    performance_criteria: {
        initial_render_time: "< 2 seconds",
        tab_switching_time: "< 500ms",
        flow_simulation_time: "< 5 seconds",
        memory_usage: "< 100MB for large flows"
    }
    steps: [
        "Given a large flow with 100+ steps is loaded",
        "When the flow is initially rendered",
        "Then initial render time should be under 2 seconds",
        "When switching between inspector tabs",
        "Then tab switching should be under 500ms",
        "When executing flow simulation",
        "Then simulation should complete within 5 seconds",
        "And memory usage should remain under 100MB"
    ]
    expected_result: "Good performance is maintained even with large, complex flows."
}
