// cfv_consumer_directives.dspec
// Refined according to DefinitiveSpec methodology with qualified names and stable IDs
// Provides directives and best practice guidance for applications consuming the CascadeFlowVisualizer library.

directive cfv_consumer_directives.CustomNodeRendering {
    id: "CFV_DIR_NODE_001"
    title: "Directive for Implementing Custom Node Renderers"
    target_tool: "HumanDeveloper_React_CascadeVisualizerConsumer"
    description: "Provides best practices and expected patterns for creating custom node components to be used with the `customNodeTypes` prop of CascadeFlowVisualizer."
    default_language: "TypeScriptReact"

    node_data_access: {
        core_fields_to_utilize: [
            "data.label: string (for display)",
            "data.dslObject: any (original DSL snippet, useful for context or advanced display)",
            "data.resolvedComponentFqn: string (e.g., 'StdLib:HttpCall')",
            "data.componentSchema: cfv_models.ComponentSchema | null (for understanding config/ports)",
            "data.isNamedComponent: boolean",
            "data.namedComponentFqn?: string (if applicable)",
            "data.contextVarUsages: string[] (list of context variables used)",
            "data.error: cfv_models.NodeError | undefined (for visual error indication on the node)"
        ],
        trace_mode_fields: [
            "data.executionStatus?: cfv_models.ExecutionStatusEnum (for styling based on SUCCESS/FAILURE/SKIPPED/RUNNING/PENDING)",
            "data.executionDurationMs?: number (for display)",
            "data.executionInputData?: any (available for tooltip or condensed display)",
            "data.executionOutputData?: any"
        ],
        subflow_invoker_specific_fields: [
            "data.invokedFlowFqn: string (for creating navigation links/buttons, specific to cfv_models.SubFlowInvokerNodeData)"
        ]
    }

    visual_error_indication_pattern: {
        recommendation: "If `data.error` is present, visually distinguish the node (e.g., red border, error icon). Tooltip on hover should display `data.error.message`."
    }

    visual_trace_status_pattern: {
        recommendation: "Use `data.executionStatus` to apply distinct styles: e.g., green for SUCCESS, red for FAILURE, gray for SKIPPED, blue for RUNNING, yellow for PENDING. Consider animations for RUNNING."
    }

    react_flow_integration: {
        handles_and_connections: "Ensure `Handle` components from React Flow are correctly positioned for expected data/control flow edges if not using auto-layout edges.",
        selection_handling: "Leverage `props.selected` (passed by React Flow) to apply selection styling."
    }

    performance_considerations: {
        memoization: "Use `React.memo` for custom node components to prevent unnecessary re-renders, especially if they perform complex calculations or have many internal states."
    }
}

directive cfv_consumer_directives.CustomEdgeRendering {
    id: "CFV_DIR_EDGE_001"
    title: "Directive for Implementing Custom Edge Renderers"
    target_tool: "HumanDeveloper_React_CascadeVisualizerConsumer"
    description: "Provides best practices for creating custom edge components for `customEdgeTypes`."
    default_language: "TypeScriptReact"

    edge_data_access: {
        flow_edge_fields: [
            "data.type: 'dataFlow' | 'controlFlow' (for distinct styling, from cfv_models.FlowEdgeTypeEnum)",
            "data.isExecutedPath?: boolean (in trace/test_result mode, for highlighting active paths)",
            "data.sourceHandle?: string (specific output handle on source node)",
            "data.targetHandle?: string (specific input handle on target node)"
        ],
        system_edge_fields: [
            "data.type: 'invocationEdge' | 'triggerLinkEdge' (from cfv_models.SystemEdgeTypeEnum)"
        ]
    }

    visual_styling_pattern: {
        recommendation: "Style 'dataFlow' edges differently from 'controlFlow' edges (e.g., solid vs. dashed). Highlight edges where `data.isExecutedPath` is true with enhanced styling (e.g., thicker line, different color)."
    }
}

directive cfv_consumer_directives.InspectorTabImplementation {
    id: "CFV_DIR_INSP_001"
    title: "Directive for Implementing Consolidated Inspector Tab Renderers"
    target_tool: "HumanDeveloper_React_CascadeVisualizerConsumer"
    description: "Guidance for implementing the consolidated inspector tabs: Source, Properties, and Debug & Test, using their respective props (cfv_models.InspectorSourceTabProps, cfv_models.InspectorPropertiesTabProps, cfv_models.InspectorDebugTestTabProps)."
    default_language: "TypeScriptReact"

    tab_priority_and_defaults: {
        default_tab: "Source tab should be the default active tab when an element is selected.",
        tab_order: "Tabs should appear in order: Source, Properties, Debug & Test.",
        visibility_rules: "Source tab: Always visible when an element (node, edge, list item with module context) is selected. Properties tab: Visible for step/trigger nodes that have a `componentSchema.configSchema`. Debug & Test tab: Visible when `props.currentFlowFqn` is set, allowing flow-level operations, or when an executable element (trigger, step) within that flow is selected."
    }

    source_tab_guidance: {
        // Props received: cfv_models.InspectorSourceTabProps (selectedElement, moduleRegistry)
        purpose: "Primary tab showing full module YAML content with syntax highlighting and selected element highlighting.",
        content_scope: "Display the complete `rawContent` of the module identified by `props.selectedElement.moduleFqn` (fetched via `props.moduleRegistry.getLoadedModule`).",
        syntax_highlighting: "Use highlight.js with YAML syntax highlighting for professional code display.",
        highlighting: "Highlight the section of YAML corresponding to `props.selectedElement.data.dslObject` within the full module content. This might involve parsing `props.selectedElement.data.dslObject` to get line numbers if the DSL object itself doesn't contain them, or using a YAML library that supports source mapping.",
        navigation: "Provide navigation within the YAML (line numbers, search, folding) for large modules.",
        diff_view: "When in editing mode, show diff between original and modified YAML.",
        export_options: "Provide options to copy YAML sections or export the full module.",
        implementation_libraries: "Use highlight.js for syntax highlighting, react-highlight for React integration.",
        styling: "Use professional code editor styling with proper indentation, line numbers, and syntax colors.",
        implementation_notes: "Use `props.selectedElement.moduleFqn` to fetch module content via `props.moduleRegistry.getLoadedModule`. Highlight the section corresponding to `props.selectedElement.data.dslObject`."
    }

    properties_tab_guidance: {
        // Props received: cfv_models.InspectorPropertiesTabProps (selectedElement, actions, moduleRegistry)
        purpose: "Interactive form-based editor for a selected element's `config` block (or other designated editable parts of its `dslObject`), using schema-driven form generation.",
        form_generation_libraries: "Use @rjsf/core (React JSON Schema Form) with @rjsf/validator-ajv8 for form generation from component schemas.",
        validation_libraries: "Use Zod for runtime validation and type safety of form data.",
        schema_integration: "Use `props.selectedElement.data.componentSchema.configSchema` to generate forms for the `config` block. The `dslObject` for a step node is the step definition itself from the DSL.",
        form_structure: "Generate forms with proper field types (text, number, boolean, select, object, array) based on JSON schema.",
        default_values: "Pre-populate form with current configuration values from `props.selectedElement.data.dslObject.config` (or other path as appropriate for the selected element type).",
        validation: "Validate form inputs against the `configSchema` using Zod (or AJV with @rjsf/validator-ajv8). Show validation errors inline.",
        state_management: "Manage local form state within tab component. Use React Hook Form for form state management.",
        save_workflow: "On explicit user 'Save' action, call `props.actions.requestSave(newConfigValue, ['config'])`. The `pathToConfig` is relative to the `dslObject` of the `selectedElement`. For a step, this is typically `['config']` to replace the whole config block.",
        yaml_preview: "Show live YAML preview of changes in a collapsible section. Use yaml library to stringify form data.",
        context_variables: "Display and allow editing of context variable usages found in `props.selectedElement.data.contextVarUsages`.",
        ui_layout: "Use clean form layout with proper spacing, labels, help text, and error display.",
        implementation_libraries: "Use @rjsf/core, @rjsf/validator-ajv8, zod, react-hook-form, yaml for implementation.",
        implementation_notes: "Ensure `pathToConfig` is correctly constructed for `requestSave`. For a step node, if editing `step.config.timeout`, `pathToConfig` relative to the step's dslObject would be `['config', 'timeout']`."
    }

    debug_test_tab_guidance: {
        // Props received: cfv_models.InspectorDebugTestTabProps (currentFlowFqn, selectedElement?, traceData?, testResultData?, actions, moduleRegistry)
        purpose: "Comprehensive debugging and testing interface for the `props.currentFlowFqn` or `props.selectedElement` within that flow."
        
        debug_section: {
            scope: "Focuses on understanding and executing the *current* flow or a *selected step* within it.",
            
            input_data_interface: {
                guidance: "Provide UI for viewing and editing the `triggerInputData` for the current flow (if `props.selectedElement` is the flow or trigger) or the `actualInputData` for a selected step. This data can be sourced from `props.actions.resolveStepInputData` or `props.actions.simulateFlowExecution`.",
                form_generation: "If editing, use `props.selectedElement.data.componentSchema.inputSchema` (for steps) or `props.selectedElement.data.componentSchema.triggerOutputSchema` (for triggers) to generate an input form with `@rjsf/core`.",
                validation: "Validate user-provided input data using `props.actions.validateDataAgainstSchema` before execution."
            },
            
            component_config_display: {
                guidance: "Display the *actual* `dslConfig` for the selected step (from `props.selectedElement.data.dslObject.config`). This config is passed to `props.actions.runDebugStep` along with input data. Configuration is *used* in debug, but *edited* in Properties tab."
            },
            
            execution_controls: {
                run_flow_from_trigger: "Button to execute the entire `props.currentFlowFqn` using provided/generated trigger input. Calls `props.actions.simulateFlowExecution(props.currentFlowFqn, null, triggerInputData)`.",
                run_flow_up_to_step: "Button to simulate execution up to the `props.selectedElement` (if it's a step). Calls `props.actions.simulateFlowExecution(props.currentFlowFqn, props.selectedElement.id, triggerInputData)`.",
                run_selected_step: "Button to execute only the `props.selectedElement` (if it's a step) with provided `inputData` and its `dslConfig`. Calls `props.actions.runDebugStep(props.currentFlowFqn, props.selectedElement.id, stepInputData, stepDslConfig)`."
            },
            
            results_display: {
                trace_visualization: "If `props.traceData` (from a full run or simulation) is available, display it. This might involve highlighting paths on the main graph or showing a summary here.",
                step_i_o_data: "For a selected step after execution/simulation, display its `executionInputData` and `executionOutputData` (from `cfv_models.FlowSimulationResult.resolvedStepInputs`/`simulatedStepOutputs` or `cfv_models.StepExecutionTrace`). Use `react-json-view`.",
                logs: "Display logs from `cfv_models.FlowExecutionTrace.steps[].logs` or `cfv_models.StepExecutionTrace.logs`.",
                errors: "Clearly display any `cfv_models.ExecutionError` from results."
            },
            
            data_lineage_visualization: {
                guidance: "Optionally, use `props.actions.resolveStepInputData` which returns `cfv_models.ResolvedStepInput` containing data lineage information to visualize how a step's input is constructed."
            }
        },
        
        test_section: {
            scope: "Focuses on managing and running persisted `cfv_models.FlowTestCase` definitions for the `props.currentFlowFqn`.",
            
            test_case_management: {
                list_display: "Display existing test cases for the `props.currentFlowFqn` (host app needs to provide these, perhaps via a new prop or fetched via an action).",
                creation_ui: "UI to create a new `cfv_models.FlowTestCase`. Use `props.actions.generateTestCaseTemplate` to pre-fill. Use schema-based forms for `triggerInput` based on the flow's trigger schema.",
                editing_ui: "UI to edit an existing `cfv_models.FlowTestCase`."
            },
            
            test_execution_controls: {
                run_single_test_case: "Button to run a selected `cfv_models.FlowTestCase`. Calls `props.actions.runTestCase(testCase)`.",
                run_all_tests_for_flow: "Button to run all test cases for the `props.currentFlowFqn`."
            },
            
            test_results_display: {
                summary: "Display overall pass/fail for test runs.",
                assertion_details: "For each `cfv_models.AssertionResult` in `cfv_models.TestRunResult.assertionResults`, show targetPath, expected, actual, comparison, and passed status.",
                trace_link: "If `cfv_models.TestRunResult.trace` is available, provide a way to view this trace in the visualizer (host app would set `props.traceData` and `props.mode`)."
            }
        },
        
        enhanced_schema_features: {
            input_structure_generation: "Generate input structure templates from component input schemas with proper data types using `props.actions.generateSchemaBasedInput`.",
            schema_validation: "Validate input data against component schemas with detailed error reporting using `props.actions.validateDataAgainstSchema`.",
            data_type_conversion: "Handle data type conversion based on schema types (string, number, boolean, object, array).",
            nested_object_support: "Support complex nested objects and arrays based on JSON schema structure.",
            required_field_handling: "Distinguish between required and optional fields based on schema definitions.",
            default_value_resolution: "Use schema default values and resolve from previous step outputs intelligently.",
            constraint_based_generation: "Generate test data that respects schema constraints (min/max values, string patterns, enum values).",
            context_variable_resolution: "Resolve context variables in input data with proper type handling."
        },
        
        integration_requirements: {
            trace_data_dependency: "Debug section requires `props.traceData: cfv_models.FlowExecutionTrace | null` to be available.",
            test_execution_dependency: "Test section requires `props.actions.runTestCase` callback to be implemented.",
            flow_context_dependency: "Both sections require `props.currentFlowFqn: string | null` for flow context.",
            module_registry_dependency: "Use `props.moduleRegistry: cfv_models.IModuleRegistry` for flow definition and schema lookups.",
            enhanced_actions_dependency: "Requires `props.actions: cfv_models.UnifiedDebugTestActions` with schema-based input resolution capabilities.",
            component_schema_dependency: "Requires access to component schemas for input/output structure resolution."
        },
        
        ui_layout: "Use tabbed layout to separate debug and test sections. Provide schema-driven input forms, execution controls, and comprehensive results display.",
        implementation_libraries: "Use react-json-view for data inspection, monaco-editor for JSON input, recharts for timeline visualization, ajv for schema validation, @rjsf/core for schema-based forms."
    }

    migration_guidance: {
        deprecated_tabs: "The following tabs are deprecated: DataIOTab, ContextVarsTab, TestDefinitionTab, AssertionResultsTab.",
        migration_path: {
            DataIOTab: "Functionality moved to Debug & Test tab debug section with enhanced data inspection.",
            ContextVarsTab: "Context variables now shown in Properties tab alongside component configuration.",
            TestDefinitionTab: "Functionality consolidated into Debug & Test tab test section with enhanced test management.",
            AssertionResultsTab: "Assertion results now shown in Debug & Test tab test section alongside test definitions."
        },
        backward_compatibility: "Legacy tab renderers are still supported but deprecated. Plan migration to new consolidated tabs.",
        feature_parity: "New tabs provide all functionality of deprecated tabs plus enhanced features."
    }

    ui_layout_recommendations: {
        responsive_design: "Design tabs to work well in the 300px right sidebar width.",
        progressive_disclosure: "Use collapsible sections and progressive disclosure for complex information.",
        consistent_styling: "Maintain consistent styling with the main visualizer component.",
        keyboard_navigation: "Support keyboard navigation for accessibility.",
        loading_states: "Show appropriate loading states for async operations (save, test execution).",
        error_handling: "Display clear error messages and recovery options for failed operations.",
        professional_appearance: "Use professional code editor styling, proper typography, and clean layouts."
    }
}

directive cfv_consumer_directives.CallbackPropHandling {
    id: "CFV_DIR_CALLBACK_001"
    title: "Directive for Handling Library Callback Props"
    target_tool: "HumanDeveloper_React_CascadeVisualizerConsumer"
    description: "Best practices for implementing and managing props like `requestModule`, `onSaveModule`, `fetchTraceList`, `onRunTestCase` in the consuming application."

    requestModule_implementation: {
        return_value: "Ensure the Promise resolves to `cfv_models.RequestModuleResult` or `null`. Handle errors gracefully (e.g., network errors) and consider returning `null` or throwing an error that `onModuleLoadError` can catch.",
        caching: "Consider implementing client-side caching of module content in the host application to avoid redundant requests for the same FQN if appropriate."
    }

    onSaveModule_implementation: {
        persistence: "The consuming application is responsible for actually persisting the `newContent` from `cfv_models.SaveModulePayload`. The payload also includes `pathToConfig`, `oldConfigValue`, `newConfigValue` if the save was initiated from the Properties tab for a specific config change, allowing for more granular backend updates if supported.",
        feedback_to_visualizer: "If the save operation can fail, the Promise should reject or return `false`. The visualizer does not inherently provide UI feedback for save success/failure beyond the Promise resolution; the host app may need to.",
        optimistic_updates: "For a smoother UX, the host application might optimistically update the `initialModules` prop immediately and then handle potential save failures, or wait for `onSaveModule` to resolve."
    }

    fetchTraceList_implementation: {
        return_value: "Ensure the Promise resolves to `cfv_models.HistoricalFlowInstanceSummary[]`."
    }

    onRunTestCase_implementation: {
        execution_logic: "The host application is responsible for taking the `cfv_models.FlowTestCase` (including `triggerInput`, `initialContext`, and `componentMocks`), executing the target flow (potentially in a sandboxed environment or against a test runtime by loading the DSL and using a Cascade-compatible engine), and returning a `Promise<cfv_models.TestRunResult>`. The result must include detailed `assertionResults` and optionally a `cfv_models.FlowExecutionTrace` of the test run."
    }

    parseContextVariables_implementation: {
        purpose: "Extract context variable names from DSL strings containing template expressions like '{{context.varName}}'.",
        signature: "Function signature: `(value: string) => string[]`",
        implementation_guidance: "Parse the input string to identify context variable references and return an array of variable names. Handle various template syntaxes and edge cases gracefully.",
        example_usage: "Input: 'Hello {{context.userName}}, your balance is {{context.balance}}' should return ['userName', 'balance']."
    }
}