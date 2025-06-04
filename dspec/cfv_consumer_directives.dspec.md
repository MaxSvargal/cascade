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
        recommendation: "CRITICAL: Only display execution status when `data.executionStatus` is defined. In design mode (no trace data), nodes should have clean styling with light themed backgrounds and subtle borders - no status indicators, no 'Not Executed' badges, no execution-related UI elements. Use `data.executionStatus` to apply distinct styles with light pastel backgrounds and subtle colored borders: light green background with green border for SUCCESS, light red background with red border for FAILURE, light gray background with gray border for SKIPPED, light amber background with amber border for RUNNING, light themed background with themed border for PENDING. Node types should maintain their color identity: steps use blue/gray theme, triggers use green theme, sub-flow invokers use purple theme. Borders should be 1px solid with subtle colors from popular palettes (e.g., Tailwind CSS colors). Consider subtle animations for RUNNING state. Nodes without executionStatus should appear in clean design mode with light themed backgrounds and minimal borders."
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
                run_flow_from_trigger: "Button to execute the entire `props.currentFlowFqn` using provided/generated trigger input. Calls `props.actions.simulateFlowExecution(props.currentFlowFqn, null, triggerInputData)`. CRITICAL: Execution results must update the visualizer nodes with execution status and data. Nodes should show SUCCESS/FAILURE/RUNNING states, NOT reset to 'not executed'. ENHANCED: Execution now uses natural timing based on component configuration - async components (HttpCall, SubFlowInvoker, WaitForDuration) use realistic durations, sync components (Fork, Validator, MapData) use minimal delays. ENHANCED: Fork components enable parallel execution of downstream branches, and multiple components with same run_after dependency execute in parallel.",
                run_flow_up_to_step: "Button to simulate execution up to the `props.selectedElement` (if it's a step). Calls `props.actions.simulateFlowExecution(props.currentFlowFqn, props.selectedElement.id, triggerInputData)`. CRITICAL: Execution results must update the visualizer nodes with execution status and data. Nodes should show SUCCESS/FAILURE/RUNNING states, NOT reset to 'not executed'. ENHANCED: Supports parallel execution for fork branches and run_after dependencies with natural component timing.",
                run_selected_step: "Button to execute only the `props.selectedElement` (if it's a step) with provided `inputData` and its `dslConfig`. Calls `props.actions.runDebugStep(props.currentFlowFqn, props.selectedElement.id, stepInputData, stepDslConfig)`. CRITICAL: Execution results must update the visualizer nodes with execution status and data. Nodes should show SUCCESS/FAILURE/RUNNING states, NOT reset to 'not executed'.",
                execution_state_management: "All execution actions must propagate results back to the main visualizer to update node execution states. Nodes should start with no execution status in design mode and only show execution status after debug/test execution. Execution status should be SUCCESS, FAILURE, RUNNING, SKIPPED, or PENDING - never 'not executed'. ENHANCED: Final step in flow execution is guaranteed to show SUCCESS/FAILURE status upon completion.",
                natural_timing_features: "ENHANCED: Execution timing is now based on component configuration and type. Synchronous components (Fork: 5-20ms, Validator: 10-50ms, MapData: 20-100ms) use minimal delays. Async components (HttpCall: uses config.timeoutMs * 0.7, SubFlowInvoker: 1000-5000ms, WaitForDuration: uses config.durationMs) use realistic durations. Fork components enable parallel execution of downstream branches.",
                parallel_execution_support: "ENHANCED: Multiple components that run_after the same component execute in parallel. Fork components automatically trigger parallel execution of all downstream branches. Dependency analysis ensures proper execution order while maximizing parallelization opportunities."
            },
            
            results_display: {
                trace_visualization: "If `props.traceData` (from a full run or simulation) is available, display it. This might involve highlighting paths on the main graph or showing a summary here.",
                step_i_o_data: "For a selected step after execution/simulation, display its `executionInputData` and `executionOutputData` (from `cfv_models.FlowSimulationResult.resolvedStepInputs`/`simulatedStepOutputs` or `cfv_models.StepExecutionTrace`). Use `react-json-view`.",
                logs: "Display logs from `cfv_models.FlowExecutionTrace.steps[].logs` or `cfv_models.StepExecutionTrace.logs`.",
                errors: "Clearly display any `cfv_models.ExecutionError` from results.",
                timing_information: "ENHANCED: Display execution timing information including component type (sync/async), actual execution duration, and parallel execution indicators for fork branches."
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
            enhanced_actions_dependency: "Requires `props.actions: cfv_models.UnifiedDebugTestActions`
        }
    }
}

directive cfv_consumer_directives.SubFlowInvokerNavigation {
    id: "CFV_DIR_NAV_001"
    title: "Directive for SubFlowInvoker Double-Click Navigation"
    target_tool: "HumanDeveloper_React_CascadeVisualizerConsumer"
    description: "Provides guidance for implementing double-click navigation functionality on SubFlowInvoker nodes to switch to the invoked flow."
    default_language: "TypeScriptReact"

    implementation_pattern: {
        event_handling: "Implement onNodeDoubleClick handler in the main CascadeFlowVisualizer component that checks if the double-clicked node is of type 'subFlowInvokerNode'.",
        navigation_logic: "Extract the `invokedFlowFqn` from the node's data and attempt to load the target flow module. If the module is not loaded, use the `requestModule` callback to load it.",
        fallback_behavior: "If the target flow cannot be loaded, provide user feedback (e.g., toast notification) indicating the flow is not available.",
        visual_indication: "SubFlowInvoker nodes should have visual indicators (e.g., navigation arrow, cursor pointer, tooltip) to indicate they are navigable.",
        flow_fqn_resolution: "The `invokedFlowFqn` should be populated from the correct source during graph generation: for named components, use the component definition's `config.flowName`; for direct references, use the step's `config.flowName`. If `config.flowName` contains a simple flow name (e.g., 'MyFlow'), it should be resolved to a full FQN by combining with the current module's namespace (e.g., 'com.casino.core.MyFlow').",
        named_component_handling: "CRITICAL: For named SubFlowInvoker components (e.g., 'invokeEvaluateUserTierFlow'), the flowName must be extracted from the component definition's config, not the step's config. The step references the named component by name, but the actual flowName is stored in the named component definition."
    }

    integration_requirements: {
        node_data_access: "Access `data.invokedFlowFqn` from SubFlowInvokerNodeData to determine the target flow.",
        module_loading: "Use the existing `requestModule` prop callback to load the target flow module if not already loaded.",
        view_switching: "Update the current view to display the target flow after successful loading.",
        config_field_mapping: "The GraphBuilderService should populate `invokedFlowFqn` from the correct source: for named components (e.g., 'invokeEvaluateUserTierFlow'), extract `flowName` from the component definition's config; for direct StdLib:SubFlowInvoker references, extract `flowName` from the step's config. The `flowName` field is the correct field name according to the StdLib:SubFlowInvoker component schema.",
        component_resolution: "Use moduleRegistry.resolveComponentTypeInfo() to determine if a step references a named component or direct component type. Check componentInfo.isNamedComponent and componentInfo.componentDefinition to access the correct config source."
    }

    error_handling: {
        missing_flow_name: "If `step.config.flowName` is undefined or empty, set `invokedFlowFqn` to 'unknown' and log a warning.",
        invalid_flow_fqn: "If the resolved flow FQN is invalid or the target flow doesn't exist, provide clear user feedback.",
        module_load_failure: "If `requestModule` fails to load the target module, display an error message and optionally retry."
    }

    user_experience: {
        loading_states: "Show loading indicators while modules are being loaded.",
        navigation_feedback: "Provide visual feedback when navigation is successful (e.g., highlight the newly loaded flow).",
        accessibility: "Ensure double-click navigation is accessible via keyboard (e.g., Enter key on focused node)."
    }
}

directive cfv_consumer_directives.RefinedNodeStyling {
    id: "CFV_DIR_STYLE_001"
    title: "Directive for Refined Node Styling with Light Pastel Backgrounds"
    target_tool: "HumanDeveloper_React_CascadeVisualizerConsumer"
    description: "Provides guidance for implementing the refined node styling approach using light pastel backgrounds, subtle borders, and enhanced shadows."
    default_language: "TypeScriptReact"

    design_principles: {
        clean_design_mode: "In design mode (no execution status), nodes should have light themed backgrounds with subtle 1px borders. Each node type maintains its color identity: steps use blue-gray theme, triggers use green theme, sub-flow invokers use purple theme.",
        execution_mode_styling: "In debug/execution mode, nodes should use light pastel backgrounds with subtle colored borders based on execution status. Success uses light green background with green border, failure uses light red with red border, running uses light amber with amber border.",
        color_palette: "Use popular color palettes (e.g., Tailwind CSS colors) for consistency and professional appearance. Avoid bright or harsh colors in favor of subtle, easy-on-the-eyes tones.",
        shadow_enhancement: "Use enhanced shadows for better visual hierarchy: default shadow '0 4px 12px rgba(0, 0, 0, 0.15)' and selected shadow '0 6px 20px rgba(59, 130, 246, 0.4)'."
    }

    implementation_guidelines: {
        border_specifications: "Use 1px solid borders with subtle colors. Avoid thick borders (2px+) or dashed borders for cleaner appearance.",
        background_colors: "Apply light pastel backgrounds that complement the border colors. Examples: '#F8FAFC' for steps, '#F7FEF7' for triggers, '#FDFCFF' for sub-flow invokers.",
        status_indicators: "Remove 'ready' or 'not executed' status badges. Only show execution status when actual execution data is available.",
        transition_effects: "Use smooth CSS transitions 'all 0.2s ease' for state changes and hover effects."
    }

    color_specifications: {
        success_state: "Background: '#F0FDF4', Border: '#22C55E' (subtle green)",
        failure_state: "Background: '#FEF2F2', Border: '#EF4444' (subtle red)",
        running_state: "Background: '#FFFBEB', Border: '#F59E0B' (subtle amber)",
        skipped_state: "Background: '#F8FAFC', Border: '#94A3B8' (subtle gray)",
        step_node_default: "Background: '#F8FAFC', Border: '#E2E8F0' (blue-gray theme)",
        trigger_node_default: "Background: '#F7FEF7', Border: '#D1FAE5' (green theme)",
        subflow_node_default: "Background: '#FDFCFF', Border: '#E9D5FF' (purple theme)"
    }
}

directive cfv_consumer_directives.AutoZoomToFit {
    id: "CFV_DIR_ZOOM_001"
    title: "Directive for Automatic Zoom-to-Fit on Flow Load"
    target_tool: "HumanDeveloper_React_CascadeVisualizerConsumer"
    description: "Provides guidance for implementing automatic zoom-to-fit functionality when flows are initially loaded to ensure all nodes are visible on screen."
    default_language: "TypeScriptReact"

    implementation_pattern: {
        trigger_conditions: "Automatically fit view when: 1) A flow is initially loaded, 2) User navigates to a different flow via SubFlowInvoker double-click, 3) User switches between flows in the navigation, 4) Graph data changes significantly (new nodes added/removed).",
        react_flow_integration: "Use React Flow's `fitView()` method from the useReactFlow hook to automatically adjust zoom and pan to show all nodes.",
        timing_considerations: "Execute fitView() after graph layout is complete and nodes are positioned. Use useEffect with dependencies on currentFlowFqn and graph data.",
        animation_settings: "Use smooth animation for better UX: fitView({ duration: 800, padding: 0.1 }) to provide 10% padding around nodes.",
        performance_optimization: "Debounce fitView calls to prevent excessive zoom adjustments during rapid navigation or data updates.",
        width_compensation_awareness: "ENHANCED: The layout service now automatically compensates for wide nodes (e.g., SubFlowInvoker nodes with long FQNs) by adding proper spacing to prevent right-side overlap. Auto-zoom should account for this enhanced spacing."
    }

    integration_requirements: {
        react_flow_hook: "Use useReactFlow() hook to access fitView method within React Flow context.",
        dependency_tracking: "Track changes to currentFlowFqn, graph nodes, and layout completion status.",
        conditional_execution: "Only execute fitView when nodes are present and positioned (avoid empty graphs).",
        user_override: "Respect user's manual zoom/pan actions - only auto-fit on initial load, not during user interaction.",
        enhanced_spacing_support: "ENHANCED: Work with the enhanced layout service that provides proper width compensation for long nodes, ensuring auto-zoom accounts for the additional spacing."
    }

    user_experience: {
        smooth_transitions: "Use animated transitions for zoom changes to provide smooth visual feedback.",
        appropriate_padding: "Maintain 10-15% padding around the graph to ensure nodes aren't touching screen edges.",
        preserve_user_control: "After initial auto-fit, allow user to manually zoom/pan without interference.",
        loading_states: "Coordinate with loading states to ensure fitView occurs after content is ready.",
        wide_node_handling: "ENHANCED: Ensure proper zoom levels for flows with wide nodes (SubFlowInvoker, long labels) by accounting for the enhanced spacing compensation."
    }

    technical_implementation: {
        hook_usage: "const { fitView } = useReactFlow(); within React Flow provider context",
        effect_pattern: "useEffect(() => { if (nodes.length > 0) { setTimeout(() => fitView({ duration: 800, padding: 0.15, minZoom: 0.1, maxZoom: 1.5 }), 100); } }, [currentFlowFqn, nodes.length]);",
        error_handling: "Wrap fitView calls in try-catch to handle cases where React Flow context is not available.",
        timing_delay: "Use small timeout (100ms) to ensure DOM updates are complete before fitting view.",
        zoom_constraints: "Set minZoom to 0.1 for very long flows and increase padding to 15% for better visibility.",
        square_layout_support: "Coordinate with layout service to prefer square-shaped arrangements for long flows.",
        enhanced_width_compensation: "ENHANCED: The layout service now provides proper width compensation for long nodes, ensuring auto-zoom works correctly with the enhanced spacing calculations."
    }
}

directive cfv_consumer_directives.GraphVisualization {
    id: "CFV_DIR_GRAPH_001"
    title: "Directive for Graph Visualization"
    target_tool: "HumanDeveloper_React_CascadeVisualizerConsumer"
    description: "Provides guidance for implementing the refined graph visualization approach."
    default_language: "TypeScriptReact"

    graph_visualization: {
        node_representation: "Each step becomes a React Flow node. Trigger becomes a special trigger node. SubFlowInvoker steps become special sub-flow nodes with navigation capability.",
        edge_generation: "ENHANCED: Edges are generated from four distinct sources with different visual styles: 1) run_after dependencies create purple solid 'execution order' edges showing explicit ordering constraints, 2) inputs_map references create blue dashed 'data dependency' edges showing implicit data flow requirements, 3) outputs_map error routing creates red dashed 'error routing' edges showing conditional error handling paths, 4) trigger connections create standard control flow edges. CRITICAL: Each edge type has distinct visual styling to clearly communicate the different types of dependencies in the workflow.",
        layout_algorithm: "Use ELK.js layered layout for flows with clear sequential structure. Use grid layout for flows with many parallel branches or complex fork patterns.",
        trace_overlay: "When trace data is available, enhance nodes with execution status (SUCCESS/FAILURE/RUNNING) and timing information. Highlight the executed path through the graph.",
        edge_type_styling: "ENHANCED: Different edge types use distinct visual styles: execution order dependencies (purple solid lines with 'execution order' labels), data dependencies (blue dashed lines with input key labels), error routing (red dashed lines with output port labels), control flow (standard gray lines). This visual distinction helps users understand the different types of relationships between steps."
    }
}