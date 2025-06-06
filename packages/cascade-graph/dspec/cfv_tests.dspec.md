// cfv_tests.dspec.md
// Test specifications for the CascadeFlowVisualizer library.

test cfv_tests.ModuleLoading_SingleModule {
    title: "Test: Load and Display a Single Valid DSL Module"
    description: "Verifies that the visualizer can correctly load, parse, and display a single valid Cascade DSL V1.1 module provided via `initialModules`."
    verifies_requirement: [cfv_requirements.FR1_ModuleManagement, cfv_requirements.FR1_1_InitialModuleLoading, cfv_requirements.FR2_GraphDataGeneration]
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

test cfv_tests.Editing_SaveConfigChange_ViaPropertiesTab {
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
    type: "Integration"
    priority: "Critical"
    test_location: {
        language: "TypeScript",
        framework: "JestPlaywright",
        filepath: "tests/integration/streaming_execution.spec.ts",
        test_case_id_in_file: "should_update_step_statuses_from_streaming_events"
    }
    preconditions: [
        "Visualizer loaded with a flow having steps 's1', 's2'.",
        "Custom node renderer is configured to change appearance based on `node.data.executionStatus` (PENDING, RUNNING, SUCCESS, FAILURE).",
        "A mock SSE endpoint is set up to send a sequence of cfv_models.StreamingExecutionEvent messages.",
        "The Debug & Test tab is active and an action to trigger streaming execution for the flow is available."
    ]
    data_inputs: {
        eventSequence: [
            "{ type: 'execution.started', executionId: 'exec-001', timestamp: 't0', data: { flowFqn: 'com.example.streamFlow', triggerInput: {}, flowDefinition: { name: 'streamFlow', steps: [{step_id: 's1', component_ref: 'C1'}, {step_id: 's2', component_ref: 'C2'}] } } }",
            "{ type: 'step.started', executionId: 'exec-001', timestamp: 't1', data: { stepId: 's1', inputData: {}, executionOrder: 1 } }",
            "{ type: 'step.completed', executionId: 'exec-001', timestamp: 't2', data: { stepId: 's1', outputData: { res: 'ok' }, actualDuration: 100 } }",
            "{ type: 'step.started', executionId: 'exec-001', timestamp: 't3', data: { stepId: 's2', inputData: {}, executionOrder: 2 } }",
            "{ type: 'step.failed', executionId: 'exec-001', timestamp: 't4', data: { stepId: 's2', error: { message: 'Simulated Failure' }, actualDuration: 50 } }",
            "{ type: 'execution.failed', executionId: 'exec-001', timestamp: 't5', data: { error: { message: 'Flow failed due to step s2' } } }"
        ]
    }
    steps: [
        "Given the visualizer is loaded and the flow 'com.example.streamFlow' is displayed",
        "And the mock SSE endpoint is ready to send `eventSequence`",
        "When the user triggers flow execution from the Debug & Test tab (which connects to the mock SSE endpoint)",
        "Then the node for step 's1' should initially visually indicate 'PENDING' (after 'execution.started' event).",
        "And then the node for step 's1' should visually indicate 'RUNNING' (after 'step.started' for s1).",
        "And then the node for step 's1' should visually indicate 'SUCCESS' (after 'step.completed' for s1).",
        "And the node for step 's2' should initially visually indicate 'PENDING' (after 'execution.started' event).",
        "And then the node for step 's2' should visually indicate 'RUNNING' (after 'step.started' for s2).",
        "And then the node for step 's2' should visually indicate 'FAILURE' (after 'step.failed' for s2)."
    ]
    expected_result: "Step nodes in the graph correctly reflect their execution status transitions (PENDING -> RUNNING -> SUCCESS/FAILURE) based on streamed events."
}

test cfv_tests.ModuleRegistryService_ResolveComponent_NamedComponentInSameModule {
    title: "Unit Test: ModuleRegistryService.resolveComponentTypeInfo - Named Component in Same Module"
    verifies_code: ["cfv_code.ModuleRegistryService_ProcessSingleModuleInput"] // Indirectly tests resolution logic within ProcessSingleModuleInput or a dedicated resolver
    description: "Verifies that resolveComponentTypeInfo (as part of ModuleRegistry's IModuleRegistry interface) correctly resolves a named component defined within the same module."
    type: "Unit" // Testing the logical unit responsible for resolution, likely part of ModuleRegistryServiceLogic
    priority: "High"
    test_location: { filepath: "src/services/ModuleRegistryServiceLogic.spec.ts", test_case_id_in_file: "resolveComponentTypeInfo_should_find_named_component_in_same_module" }
    preconditions: [
        "ModuleRegistryService logic is set up (e.g., using mock Jotai atoms or direct function calls).",
        "A DslModuleRepresentation for 'com.example.test' is prepared, containing a NamedComponentDefinition: { name: 'MyNamedComp', type: 'StdLib:ActualType', config: { p: 1 } } in its definitions.components list.",
        "This module representation is effectively 'loaded' (e.g., by populating a mock DslModuleRepresentationsAtom)."
    ]
    data_inputs: {
        moduleContent: "dsl_version: \"1.1\"\nnamespace: com.example.test\ndefinitions:\n  components:\n    - name: MyNamedComp\n      type: StdLib:ActualType\n      config:\n        param: value",
        componentRef: "MyNamedComp",
        currentModuleFqn: "com.example.test"
    }
    steps: [
        "Given ModuleRegistryService is initialized",
        "And module 'com.example.test' with content from `data_inputs.moduleContent` is processed and loaded (simulating ProcessSingleModuleInput)",
        "When `IModuleRegistry.resolveComponentTypeInfo` is called with `componentRef`='MyNamedComp' and `currentModuleFqn`='com.example.test'",
        "Then the result should be a cfv_models.ResolvedComponentInfo object.",
        "And result.baseType should be 'StdLib:ActualType'.",
        "And result.isNamedComponent should be true.",
        "And result.componentDefinition.name should be 'MyNamedComp'.",
        "And result.componentDefinition.config.param should be 'value'.",
        "And result.sourceModuleFqn should be 'com.example.test'."
    ]
    expected_result: "Correctly resolves to the named component within the same module, including its definition."
}

test cfv_tests.GraphBuilderService_GenerateFlowDetail_Basic {
    title: "Unit Test: GraphBuilderService.generateFlowDetailGraphData - Basic Flow"
    verifies_code: ["cfv_code.GraphBuilderService_GenerateFlowDetailGraphData"]
    type: "Unit"
    priority: "Critical"
    test_location: { filepath: "src/services/GraphBuilderServiceLogic.spec.ts", test_case_id_in_file: "generateFlowDetailGraphData_should_create_nodes_and_edges_for_basic_flow" }
    preconditions: [
        "GraphBuilderService logic is set up.",
        "Mocked cfv_models.IModuleRegistry providing a simple flow definition for 'com.example.flow.Simple' (trigger T, step s1 (C1), step s2 (C2) run_after s1, step s3 (C3) inputs_map {in: 'steps.s1.outputs.out'}).",
        "Mocked parseContextVarsFn.",
        "Mocked componentSchemas map (for T, C1, C2, C3)."
    ]
    data_inputs: {
        params: "{ flowFqn: 'com.example.flow.Simple', moduleRegistry: mockModuleRegistry, parseContextVarsFn: mockParseFn, componentSchemas: mockSchemas, useAutoLayout: false }"
    }
    steps: [
        "When generateFlowDetailGraphData logic is called with data_inputs.params",
        "Then the returned object should be cfv_models.GraphData with 'nodes' and 'edges' arrays.",
        "And 'nodes' array should contain a trigger node ('T') and step nodes 's1', 's2', 's3'.",
        "And 'edges' array should contain an edge from 's1' to 's2' with dependencyType 'execution_order_dependency'.",
        "And 'edges' array should contain an edge from 's1' to 's3' with dependencyType 'data_dependency' and targetInputKey 'in'.",
        "And node data payloads should contain expected dslObject, resolvedComponentFqn, etc."
    ]
    expected_result: "Correct graph data structure is generated for a basic flow with distinct edge types."
}


test cfv_tests.DebugTestTab_InputDataResolutionForForm {
    title: "Test: Debug & Test Tab - Input Data Resolution for Step Form"
    description: "Verifies that the Debug & Test tab, when a step is selected, can use `actions.resolveStepInputData` to get data for populating an input form."
    verifies_requirement: [cfv_requirements.FR8_Debugging_ViaDebugTestTab, cfv_requirements.FR23_ClientCodeCleanupAndSimplification]
    type: "Integration" // Tests the action provided by the library
    priority: "High"
    test_location: {
        language: "TypeScript",
        framework: "Vitest",
        filepath: "tests/integration/debug_test_tab_actions.spec.ts",
        test_case_id_in_file: "should_resolve_step_input_data_for_form_population"
    }
    preconditions: [
        "Visualizer is conceptually loaded (mocked library context providing UnifiedDebugTestActions).",
        "A flow definition: Trigger (outputs {initVal: 'fromTrigger'}) -> s1 (outputs {val: 'dataFromS1'}) -> s2 (inputs_map: {in_s2_step: 'steps.s1.outputs.val', in_s2_trigger: 'trigger.initVal'}).",
        "The `resolveStepInputData` action is implemented by the library to use client-side simulation (e.g., cfv_code.InternalFlowSimulation_ResolveStepInput)."
    ]
    data_inputs: {
        flowFqn: "com.example.myFlow",
        stepIdToSelect: "s2",
        triggerInputForSim: "{ initVal: 'testTrigger' }" // REFINED: This represents the STANDARDIZED OUTPUT that the trigger provides to the flow (conforming to triggerOutputSchema), not the external event data that the trigger receives.
    }
    steps: [
        "Given the flow definition is available via a mock IModuleRegistry",
        "When `actions.resolveStepInputData(flowFqn, stepIdToSelect, triggerInputForSim)` is called",
        "Then the promise should resolve with a cfv_models.ResolvedStepInput object.",
        "And resolvedStepInput.actualInputData should be { in_s2_step: 'dataFromS1', in_s2_trigger: 'testTrigger' }.",
        "And resolvedStepInput.stepId should be 's2'.",
        "And resolvedStepInput.inputSources should reflect the origins of 'in_s2_step' and 'in_s2_trigger'."
    ]
    expected_result: "`actions.resolveStepInputData` correctly resolves the input for the selected step using client-side logic."
}

test cfv_tests.ModuleRegistryService_ProcessSingleModuleInput_InvalidYAML {
    title: "Unit Test: ModuleRegistryService_ProcessSingleModuleInput - Invalid YAML"
    verifies_code: ["cfv_code.ModuleRegistryService_ProcessSingleModuleInput"]
    description: "Verifies that ProcessSingleModuleInput correctly handles invalid YAML content, populates errors in DslModuleRepresentation, and sets module status to 'error'."
    type: "Unit"
    priority: "High"
    test_location: { filepath: "src/services/ModuleRegistryServiceLogic.spec.ts", test_case_id_in_file: "processSingleModuleInput_should_handle_invalid_yaml" }
    preconditions: [
        "ModuleRegistryService_ProcessSingleModuleInput function is available.",
        "Mocked Jotai get/set functions.",
        "Mocked props (e.g., for componentSchemas, though not directly used for parsing error)."
    ]
    data_inputs: {
        moduleInput: "{ fqn: 'com.example.badyaml', content: 'key: value\\n  badlyIndentedKey: anotherValue\\nkey2:' }" // Invalid YAML
    }
    steps: [
        "When cfv_code.ModuleRegistryService_ProcessSingleModuleInput is called with `data_inputs.moduleInput`, mocked Jotai functions, and props",
        "Then the returned cfv_models.DslModuleRepresentation object should not be null.",
        "And its `status` property should be 'error'.",
        "And its `errors` array should contain at least one error item.",
        "And the error item message should indicate a YAML parsing failure."
    ]
    expected_result: "The function correctly identifies invalid YAML, sets module status to 'error', and records parsing error details."
}

test cfv_tests.LayoutService_CalculateAdaptiveSpacing_WideNodes {
    title: "Unit Test: LayoutService_CalculateAdaptiveSpacing - Wide Nodes Compensation"
    verifies_code: ["cfv_code.LayoutService_CalculateAdaptiveSpacingWithWidthCompensation"]
    description: "Verifies that calculateAdaptiveSpacingWithWidthCompensation correctly applies width compensation to layerSpacing when wide nodes are present."
    type: "Unit"
    priority: "Medium"
    test_location: { filepath: "src/services/LayoutServiceLogic.spec.ts", test_case_id_in_file: "calculateAdaptiveSpacing_should_compensate_for_wide_nodes" }
    preconditions: [
        "cfv_code.LayoutService_CalculateAdaptiveSpacingWithWidthCompensation function is available."
    ]
    data_inputs: {
        nodes_normal: "[{ id: 'n1', width: 150, data:{label:'n1'} }, { id: 'n2', width: 160, data:{label:'n2'} }]", // Using conceptual width property
        nodes_wide: "[{ id: 'n1', width: 150, data:{label:'n1'} }, { id: 'n2', width: 350, data:{label:'n2_very_wide'} }]",
        baseSpacing: "{ nodeNode: 80, edgeNode: 20, layerSpacing: 100, edgeEdge: 10 }"
    }
    steps: [
        "When cfv_code.LayoutService_CalculateAdaptiveSpacingWithWidthCompensation is called with `nodes_normal` and `baseSpacing`",
        "Then the returned `layerSpacing` (Result A) should be close to `baseSpacing.layerSpacing` (allowing for minor adaptive adjustments but minimal width compensation).",
        "When cfv_code.LayoutService_CalculateAdaptiveSpacingWithWidthCompensation is called with `nodes_wide` and `baseSpacing`",
        "Then the returned `layerSpacing` (Result B) should be significantly greater than Result A's `layerSpacing` due to width compensation for the 350px node."
    ]
    expected_result: "Adaptive spacing logic correctly increases layerSpacing to compensate for wide nodes, preventing overlaps."
}

test cfv_tests.ServerExecutionEngine_DetectCycles_SimpleCycle {
    title: "Unit Test: ServerExecutionEngine_DetectCycles - Simple Cycle Detection"
    verifies_code: ["cfv_code.ServerExecutionEngine_DetectCycles"]
    description: "Verifies that DetectCycles correctly identifies a simple (A->B->A) circular dependency in a given graph."
    type: "Unit"
    priority: "High"
    test_location: { filepath: "src/server/execution/ServerExecutionEngineUtils.spec.ts", test_case_id_in_file: "detectCyclesDFS_should_find_simple_cycle" }
    preconditions: [
        "cfv_code.ServerExecutionEngine_DetectCycles function is available."
    ]
    data_inputs: {
        graph: "new Map([['A', new Set(['B'])], ['B', new Set(['A'])]])" // A -> B, B -> A
    }
    steps: [
        "When cfv_code.ServerExecutionEngine_DetectCycles is called with `data_inputs.graph`",
        "Then the returned list of cycles should not be empty.",
        "And it should contain a cycle path like ['A', 'B'] or ['B', 'A'] (order within path might vary based on traversal start)."
    ]
    expected_result: "The function correctly identifies the simple cycle A->B->A."
}

test cfv_tests.ServerExecutionEngine_ExtractStepReferences_ComplexExpression {
    title: "Unit Test: ServerExecutionEngine_ExtractStepReferences - Complex Expression"
    verifies_code: ["cfv_code.ServerExecutionEngine_ExtractStepReferencesFromExpression"]
    description: "Verifies correct extraction of multiple, distinct step references from a complex expression string."
    type: "Unit"
    priority: "Medium"
    test_location: { filepath: "src/server/execution/ServerExecutionEngineUtils.spec.ts", test_case_id_in_file: "extractStepReferences_should_handle_complex_expressions" }
    preconditions: [
        "cfv_code.ServerExecutionEngine_ExtractStepReferencesFromExpression function is available."
    ]
    data_inputs: {
        expression: "'Value from stepA: ' + steps.stepA.outputs.value + ', and from stepB: ' + steps.stepB.result + ' also steps.stepA.other'"
    }
    steps: [
        "When cfv_code.ServerExecutionEngine_ExtractStepReferencesFromExpression is called with `data_inputs.expression`",
        "Then the returned Set of step IDs should contain 'stepA' and 'stepB'.",
        "And the size of the Set should be 2."
    ]
    expected_result: "The function correctly extracts all unique step references ('stepA', 'stepB') from the expression."
}

test cfv_tests.ModuleRegistryService_Interface_GetFlowDefinition {
    title: "Integration Test: ModuleRegistryService - IModuleRegistry.getFlowDefinitionDsl"
    verifies_design: ["cfv_designs.ModuleRegistryService"]
    description: "Verifies that IModuleRegistry.getFlowDefinitionDsl returns the correct flow DSL object after a module containing it has been loaded."
    type: "Integration" // Tests the service's exposed interface after internal state change
    priority: "High"
    test_location: { filepath: "src/services/ModuleRegistryService.integration.spec.ts", test_case_id_in_file: "IModuleRegistry_getFlowDefinitionDsl_should_return_correct_flow" }
    preconditions: [
        "A ModuleRegistryService instance (or its Jotai atom-based equivalent) is set up.",
        "A module 'com.example.flows' containing a flow 'MyTestFlow' has been successfully loaded (e.g., via initialModules or requestAndProcessModule)."
    ]
    data_inputs: {
        moduleFqn: "com.example.flows",
        flowName: "MyTestFlow",
        flowDslSnippet: "{ name: 'MyTestFlow', trigger: { type: 'T' }, steps: [{ step_id: 's1', component_ref: 'C' }] }" // The DSL of the flow
    }
    steps: [
        "Given the ModuleRegistryService is initialized and module `data_inputs.moduleFqn` (containing `data_inputs.flowDslSnippet`) is loaded",
        "When `IModuleRegistry.getFlowDefinitionDsl` is called with flow FQN 'com.example.flows.MyTestFlow'",
        "Then the returned object should deeply match `data_inputs.flowDslSnippet` (plus any processing additions like moduleFqn).",
        "And if called with a non-existent flow FQN, it should return null."
    ]
    expected_result: "The getFlowDefinitionDsl method of the IModuleRegistry interface correctly retrieves flow definitions from loaded modules."
}

test cfv_tests.ClientStreamHandler_HandleEvents_PendingState {
    title: "Unit Test: ClientExecutionStreamHandler_HandleStreamingEvent - execution.started Sets Pending"
    verifies_code: ["cfv_code.ClientExecutionStreamHandler_HandleStreamingEvent"]
    description: "Verifies that HandleStreamingEvent, upon receiving an 'execution.started' event, correctly initializes the FlowExecutionTrace and sets all defined steps to 'PENDING' status."
    type: "Unit"
    priority: "Critical"
    test_location: { filepath: "src/services/ClientExecutionStreamHandlerLogic.spec.ts", test_case_id_in_file: "handleStreamingEvent_execution_started_should_set_pending_states" }
    preconditions: [
        "cfv_code.ClientExecutionStreamHandler_HandleStreamingEvent function is available."
    ]
    data_inputs: {
        executionStartedEvent: "{ type: 'execution.started', executionId: 'exec-123', timestamp: 'ts0', data: { flowFqn: 'com.example.flow', triggerInput: {}, flowDefinition: { name: 'MyFlow', steps: [{step_id: 's1', component_ref: 'C1'}, {step_id: 's2', component_ref: 'C2'}] } } }"
    }
    steps: [
        "Given an initial `currentTrace` is null",
        "When cfv_code.ClientExecutionStreamHandler_HandleStreamingEvent is called with `data_inputs.executionStartedEvent` and null `currentTrace`",
        "Then the returned `FlowExecutionTrace` should not be null.",
        "And its `status` should be 'RUNNING'.",
        "And its `steps` map should contain entries for 's1' and 's2'.",
        "And `newTrace.steps.get('s1').status` should be 'PENDING'.",
        "And `newTrace.steps.get('s2').status` should be 'PENDING'."
    ]
    expected_result: "An 'execution.started' event correctly initializes the trace and sets all steps from the provided flow definition to 'PENDING' status."
}

test cfv_tests.YamlReconstruction_SemanticPreservation {
    title: "Test: YAML Reconstruction - Semantic Correctness vs. Formatting/Comments"
    verifies_policy: ["cfv_policies.Arch_EditingTradeoffsV1"]
    verifies_code: ["cfv_code.YamlReconstructionService_ReconstructModuleYaml", "cfv_code.YamlReconstructionService_ApplyConfigChangesToRepresentation"]
    description: "Verifies that YAML reconstruction preserves semantic correctness (data structure and values) even if comments and specific formatting are lost, and key order in mappings might be canonicalized."
    type: "Integration"
    priority: "Medium"
    test_location: { filepath: "src/services/YamlReconstructionService.integration.spec.ts", test_case_id_in_file: "yaml_reconstruction_should_preserve_semantics_not_formatting" }
    preconditions: [
        "YamlReconstructionService logic (applyConfigChangesToRepresentation, reconstructModuleYaml) is available.",
        "Mocked AbstractYamlParser and AbstractYamlSerializer."
    ]
    data_inputs: {
        initialYaml: "dsl_version: \"1.1\"\nnamespace: com.example.format\n# This is a comment\nflows:\n  - name: MyFlow # Flow comment\n    trigger: { type: T1 }\n    # Step comment\n    steps:\n      - step_id: s1\n        component_ref: C1\n        config:\n          paramB: valueB # unsorted key\n          paramA: valueA\n",
        pathToChange: "['flows', 0, 'steps', 0, 'config', 'paramA']",
        newValue: "newValueA"
    }
    steps: [
        "Given the `initialYaml` is parsed into a DslModuleRepresentation (ModuleRepA) using AbstractYamlParser.",
        "When `applyConfigChangesToRepresentation` is called with ModuleRepA, `pathToChange`, and `newValue` to get ModuleRepB.",
        "And `reconstructModuleYaml` is called with ModuleRepB to get `reconstructedYaml`.",
        "And `reconstructedYaml` is parsed again using AbstractYamlParser into a new DslParsedContent (ParsedReconstructed).",
        "Then the semantic content of ParsedReconstructed (ignoring comment nodes and exact key order in maps if library canonicalizes) should match the semantic content of ModuleRepB.parsedContent.",
        "And specifically, ParsedReconstructed.flows[0].steps[0].config.paramA should be 'newValueA'.",
        "And ParsedReconstructed.flows[0].steps[0].config.paramB should be 'valueB'.",
        "And it is expected that comments from `initialYaml` are NOT present in `reconstructedYaml`.",
        "And it is expected that the key order in `reconstructedYaml` for s1.config might be ['paramA', 'paramB'] (alphabetical)."
    ]
    expected_result: "Semantic data structure and values are correctly preserved and updated through YAML reconstruction, even if comments and original formatting/key order are altered."
}