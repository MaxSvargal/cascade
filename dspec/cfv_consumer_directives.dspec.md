// cfv_consumer_directives.dspec.md
// Refined according to DefinitiveSpec methodology with qualified names and stable IDs.
// Provides directives and best practice guidance for applications consuming the CascadeFlowVisualizer library.
// Updated for consolidated inspector tabs, streaming execution, and enhanced edge/node data.

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
        trace_mode_fields: [ // These fields are ONLY populated if trace/execution data is available.
            "data.executionStatus?: cfv_models.ExecutionStatusEnum (for styling based on SUCCESS/FAILURE/SKIPPED/RUNNING/PENDING)",
            "data.executionDurationMs?: number (for display)",
            "data.executionInputData?: any (available for tooltip or condensed display)",
            "data.executionOutputData?: any"
        ],
        subflow_invoker_specific_fields: [ // Specific to cfv_models.SubFlowInvokerNodeData
            "data.invokedFlowFqn: string (for creating navigation links/buttons)"
        ]
    }

    visual_error_indication_pattern: {
        recommendation: "If `data.error` is present, visually distinguish the node (e.g., red border, error icon). Tooltip on hover should display `data.error.message`."
    }

    visual_trace_status_pattern: {
        recommendation: "CRITICAL: Only display execution status indicators (borders, backgrounds, icons) when `data.executionStatus` is defined and not null. In pure design mode (no trace data, no debug execution initiated), nodes should have clean styling with light themed backgrounds and subtle borders as per cfv_consumer_directives.RefinedNodeStyling (e.g., step_node_default). There should be NO 'Not Executed' badges or similar UI elements indicating lack of execution in design mode. When `data.executionStatus` IS defined (e.g., PENDING, RUNNING, SUCCESS, FAILURE, SKIPPED from a debug/test execution), use it to apply distinct styles. Light pastel backgrounds and subtle colored borders are recommended: e.g., light green background with green border for SUCCESS, light red background with red border for FAILURE, light gray background with gray border for SKIPPED, light amber background with amber border for RUNNING. For PENDING, use a neutral but distinct style (e.g., light themed background with a themed border, different from the default design mode idle state). Node types should maintain their base color identity (steps: blue/gray, triggers: green, sub-flow invokers: purple) even when status styling is applied, typically through border color variations or icons. Borders should be 1px solid. Consider subtle animations for RUNNING state. Nodes without `data.executionStatus` must appear in the clean design mode styling."
    }

    react_flow_integration: {
        handles_and_connections: "Ensure `Handle` components from React Flow are correctly positioned for expected data/control flow edges if not using auto-layout edges. Handles should correspond to `sourceHandle` and `targetHandle` specified in `cfv_models.FlowEdgeData`.",
        selection_handling: "Leverage `props.selected` (passed by React Flow) to apply selection styling (e.g., enhanced shadow as per cfv_consumer_directives.RefinedNodeStyling)."
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
        flow_edge_fields: [ // from cfv_models.FlowEdgeData
            "data.type: cfv_models.FlowEdgeTypeEnum (e.g., 'dataFlow', 'controlFlow', 'executionOrderDependency', 'errorRouting', 'dataDependency')",
            "data.isExecutedPath?: boolean (in trace/test_result mode, for highlighting active paths)",
            "data.sourceHandle?: string (specific output handle on source node, e.g., an error port name)",
            "data.targetHandle?: string (specific input handle on target node, e.g., 'data' for main input)",
            "data.dependencyType?: string (e.g., 'data_dependency', 'execution_order', 'error_flow' - for fine-grained styling)",
            "data.dataPath?: string (for data dependency edges, the expression or path)",
            "data.targetInputKey?: string (for data dependency edges, the target input field)"
        ],
        system_edge_fields: [ // from cfv_models.SystemEdgeData
            "data.type: cfv_models.SystemEdgeTypeEnum ('invocationEdge' | 'triggerLinkEdge')"
        ]
    }

    visual_styling_pattern: {
        recommendation: "Style edges based on `data.type` and `data.dependencyType`. For example: 'dataDependency' edges (blue dashed), 'executionOrderDependency' edges (purple solid), 'errorRouting' edges (red dashed), 'controlFlow' edges (standard gray). Highlight edges where `data.isExecutedPath` is true with enhanced styling (e.g., thicker line, brighter color). Edge labels can be derived from `data.targetInputKey` for data dependencies or `data.sourceHandle` for error routing."
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
        visibility_rules: "Source tab: Always visible when an element (node, edge, or list item with module context like cfv_models.SelectedElementSourceEnum.moduleListItem) is selected. Properties tab: Visible for step/trigger nodes that have a `componentSchema.configSchema` or `componentSchema.triggerConfigSchema`. Debug & Test tab: Visible when `props.currentFlowFqn` is set (allowing flow-level operations), or when an executable element (trigger, step) within that flow is selected."
    }

    source_tab_guidance: {
        // Props received: cfv_models.InspectorSourceTabProps (selectedElement, moduleRegistry)
        purpose: "Primary tab showing full module YAML content with syntax highlighting and selected element highlighting.",
        content_scope: "Display the complete `rawContent` of the module identified by `props.selectedElement.moduleFqn` (fetched via `props.moduleRegistry.getLoadedModule(props.selectedElement.moduleFqn)`).",
        syntax_highlighting: "Use highlight.js with YAML syntax highlighting for professional code display.",
        highlighting: "Highlight the section of YAML corresponding to `props.selectedElement.data.dslObject` within the full module content. This might involve parsing `props.selectedElement.data.dslObject` to get line numbers if the DSL object itself doesn't contain them, or using a YAML library that supports source mapping.",
        navigation: "Provide navigation within the YAML (line numbers, search, folding) for large modules.",
        diff_view: "When in editing mode (if library supports it in future), show diff between original and modified YAML.",
        export_options: "Provide options to copy YAML sections or export the full module.",
        implementation_libraries: "Use highlight.js for syntax highlighting, react-highlight or react-syntax-highlighter for React integration.",
        styling: "Use professional code editor styling with proper indentation, line numbers, and syntax colors.",
        implementation_notes: "Use `props.selectedElement.moduleFqn` to fetch module content via `props.moduleRegistry.getLoadedModule(props.selectedElement.moduleFqn).rawContent`. Highlight the section corresponding to `props.selectedElement.data.dslObject`."
    }

    properties_tab_guidance: {
        // Props received: cfv_models.InspectorPropertiesTabProps (selectedElement, actions, moduleRegistry)
        purpose: "Interactive form-based editor for a selected element's `config` block (or other designated editable parts of its `dslObject`), using schema-driven form generation.",
        form_generation_libraries: "Use @rjsf/core (React JSON Schema Form) with @rjsf/validator-ajv8 for form generation from component schemas.",
        validation_libraries: "Use Zod for runtime validation and type safety of form data, or rely on @rjsf/validator-ajv8.",
        schema_integration: "Use `props.selectedElement.data.componentSchema.configSchema` (for steps) or `props.selectedElement.data.componentSchema.triggerConfigSchema` (for triggers) to generate forms for the `config` block. The `dslObject` for a step node is the step definition itself from the DSL.",
        form_structure: "Generate forms with proper field types (text, number, boolean, select, object, array) based on JSON schema.",
        default_values: "Pre-populate form with current configuration values from `props.selectedElement.data.dslObject.config` (or other path as appropriate for the selected element type).",
        validation: "Validate form inputs against the schema using Zod or AJV with @rjsf/validator-ajv8. Show validation errors inline.",
        state_management: "Manage local form state within tab component. React Hook Form can be used for complex form state.",
        save_workflow: "On explicit user 'Save' action, call `props.actions.requestSave(newConfigValue, pathToConfig)`. The `pathToConfig` is relative to the `dslObject` of the `selectedElement`. For a step, to replace the whole config block, use `['config']`. To replace a specific field like `timeout` within config, use `['config', 'timeout']` if `newConfigValue` is just the timeout value, or `['config']` if `newConfigValue` is the entire new config object.",
        yaml_preview: "Show live YAML preview of changes in a collapsible section. Use 'yaml' library to stringify form data.",
        context_variables: "Display (and potentially allow editing if supported by DSL) of context variable usages found in `props.selectedElement.data.contextVarUsages`.",
        ui_layout: "Use clean form layout with proper spacing, labels, help text, and error display.",
        implementation_libraries: "Use @rjsf/core, @rjsf/validator-ajv8, zod (optional), react-hook-form (optional), yaml for implementation.",
        implementation_notes: "Ensure `pathToConfig` is correctly constructed for `props.actions.requestSave`. For editing `step.config.timeout` where `newConfigValue` is the new timeout value, `pathToConfig` would be `['config', 'timeout']`. If replacing the entire `step.config` object, `pathToConfig` is `['config']` and `newConfigValue` is the new config object."
    }

    debug_test_tab_guidance: {
        // Props received: cfv_models.InspectorDebugTestTabProps (currentFlowFqn, selectedElement?, traceData?, testResultData?, actions, moduleRegistry)
        purpose: "Comprehensive debugging and testing interface for the `props.currentFlowFqn` or `props.selectedElement` within that flow."

        debug_section: {
            scope: "Focuses on understanding and executing the *current* flow or a *selected step* within it, potentially using server-side streaming execution.",

            input_data_interface: {
                guidance: "Provide UI for viewing and editing the `triggerInputData` for the current flow (if `props.selectedElement` is the flow or trigger) or the `stepInputData` for a selected step. This data can be sourced from `props.actions.resolveStepInputData` for client-side preparation or used directly with server-side execution actions.",
                form_generation: "If editing, use `props.selectedElement.data.componentSchema.inputSchema` (for steps) or `props.selectedElement.data.componentSchema.triggerOutputSchema` (for triggers, which defines the data structure provided *to* the flow) to generate an input form with `@rjsf/core`. The `props.actions.generateSchemaBasedInput` can be used to get a template.",
                validation: "Validate user-provided input data using `props.actions.validateDataAgainstSchema` before execution."
            },

            component_config_display: { // Renamed from component_config_editing as editing is in PropertiesTab
                guidance: "Display the *actual* `dslConfig` for the selected step (from `props.selectedElement.data.dslObject.config`). This config is implicitly used when `props.actions.runDebugStep` or server-side execution actions are called. Configuration is *edited* in the Properties tab, but *used* here."
            },

            execution_controls: {
                run_flow_from_trigger: "Button to execute the entire `props.currentFlowFqn` using provided/generated trigger input. Calls `props.actions.simulateFlowExecution(props.currentFlowFqn, undefined, triggerInputData)`. CRITICAL: This action now triggers server-side streaming execution. The UI must react to streamed events to update node statuses (PENDING, RUNNING, SUCCESS/FAILURE/SKIPPED) and display data. Nodes should NOT reset to 'not executed'.",
                run_flow_up_to_step: "Button to simulate execution up to the `props.selectedElement` (if it's a step). Calls `props.actions.simulateFlowExecution(props.currentFlowFqn, props.selectedElement.id, triggerInputData)`. CRITICAL: Triggers server-side streaming. UI reacts to streamed events. Supports advanced dependency-aware partial execution.",
                run_selected_step: "Button to execute only the `props.selectedElement` (if it's a step) with provided `stepInputData` and its `dslConfig`. Calls `props.actions.runDebugStep(props.currentFlowFqn, props.selectedElement.id, stepInputData, stepDslConfig)`. CRITICAL: Triggers server-side streaming for the single step. UI reacts to streamed events.",
                execution_state_management: "All execution actions that trigger server-side streaming must result in UI updates driven by the received stream events. The `props.actions.updateExecutionState` callback should be used by the client stream handler to inform the visualizer of the new trace data, which then updates React Flow nodes. Nodes start with no execution status in design mode and only show execution status (PENDING, RUNNING, SUCCESS, FAILURE, SKIPPED) after debug/test execution is initiated and events are received. The client stream handler (part of the host app or visualizer's internal logic using cfv_designs.ClientExecutionStreamHandler) pre-populates all flow steps with PENDING status on 'execution.started' for immediate visual feedback.",
                enhanced_streaming_features: "ENHANCED: Execution uses Server-Sent Events for real-time updates. Server performs comprehensive dependency analysis (including cycle detection as warnings) and layered execution. Client-side stream handler ensures proper React re-rendering via new object references and manages robust connection handling with automatic reconnection.",
                dependency_resolution_features: "ENHANCED: Server-side features include cycle detection (DFS), complex expression parsing for dependencies, and layered execution with fallback strategies for deadlocks.",
                parallel_execution_support: "ENHANCED: Server-side execution supports parallel step processing within dependency layers. Fork components trigger parallel branch execution."
            },

            results_display: {
                trace_visualization: "If `props.traceData` (from a full run, simulation, or streaming execution) is available, the main graph will be updated. This tab can show a summary or specific details.",
                step_i_o_data: "For a selected step after execution/simulation (data available in `props.traceData.steps[stepId].executionInputData / executionOutputData`), display its input and output. Use `react-json-view`.",
                logs: "Display logs from `props.traceData.steps[stepId].logs` if available.",
                errors: "Clearly display any `cfv_models.ExecutionError` from results or `props.traceData.steps[stepId].errorData`.",
                timing_information: "ENHANCED: Display execution timing from `props.traceData` (e.g., `durationMs`), component type (sync/async if available), and parallel execution indicators (if determinable from trace)."
            },

            data_lineage_visualization: {
                guidance: "Optionally, use `props.actions.resolveStepInputData` which returns `cfv_models.ResolvedStepInput` containing `inputSources` information to visualize how a step's input is constructed."
            }
        },

        test_section: {
            scope: "Focuses on managing and running persisted `cfv_models.FlowTestCase` definitions for the `props.currentFlowFqn`.",

            test_case_management: {
                list_display: "Display existing test cases for `props.currentFlowFqn` (host app needs to provide these, perhaps via a new prop or fetched via an action).",
                creation_ui: "UI to create a new `cfv_models.FlowTestCase`. Use `props.actions.generateTestCaseTemplate` to pre-fill. Use schema-based forms for `triggerInput` based on the flow's trigger schema.",
                editing_ui: "UI to edit an existing `cfv_models.FlowTestCase`."
            },

            test_execution_controls: {
                run_single_test_case: "Button to run a selected `cfv_models.FlowTestCase`. Calls `props.actions.runTestCase(testCase)`, which triggers server-side execution and streaming updates. Results update `props.testResultData`.",
                run_all_tests_for_flow: "Button to run all test cases for `props.currentFlowFqn`. Iteratively calls `props.actions.runTestCase`."
            },

            test_results_display: {
                summary: "Display overall pass/fail for test runs from `props.testResultData`.",
                assertion_details: "For each `cfv_models.AssertionResult` in `props.testResultData.assertionResults`, show targetPath, expected, actual, comparison, and passed status.",
                trace_link: "If `props.testResultData.trace` is available, provide a way to view this trace in the visualizer (host app would set `props.traceData` and `props.mode` to 'trace')."
            }
        },

        enhanced_schema_features: { // Features provided by props.actions
            input_structure_generation: "Generate input structure templates from component input schemas with proper data types using `props.actions.generateSchemaBasedInput`.",
            schema_validation: "Validate input data against component schemas with detailed error reporting using `props.actions.validateDataAgainstSchema`.",
            data_type_conversion_guidance: "Handle data type conversion based on schema types (string, number, boolean, object, array) when preparing inputs.",
            nested_object_support: "Support complex nested objects and arrays based on JSON schema structure in forms.",
            required_field_handling: "Visually distinguish between required and optional fields based on schema definitions in forms.",
            default_value_resolution_guidance: "Use schema default values and consider resolving from previous step outputs intelligently when preparing inputs for `runDebugStep` or `simulateFlowExecution`.",
            constraint_based_generation_guidance: "When generating test data, aim to respect schema constraints (min/max values, string patterns, enum values).",
            context_variable_resolution_guidance: "Resolve context variables in input data with proper type handling if preparing inputs client-side."
        },

        integration_requirements: { // These are props passed to the DebugTestTab renderer
            trace_data_dependency: "Debug section relies on `props.traceData: cfv_models.FlowExecutionTrace | null` being updated by the stream handler or host app.",
            test_execution_dependency: "Test section requires `props.actions.runTestCase` callback to be implemented by the host, which then calls the library's internal trigger for server-side execution.",
            flow_context_dependency: "Both sections require `props.currentFlowFqn: string` for flow context.",
            module_registry_dependency: "Uses `props.moduleRegistry: cfv_models.IModuleRegistry` for flow definition and schema lookups.",
            actions_dependency: "Requires `props.actions: cfv_models.UnifiedDebugTestActions`."
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
        event_handling: "Implement `onNodeDoubleClick` handler in the main CascadeFlowVisualizer component that checks if the double-clicked node has `data.invokedFlowFqn` (indicating it's a SubFlowInvoker node or similar navigable node).",
        navigation_logic: "Extract the `invokedFlowFqn` from the node's data (`node.data.invokedFlowFqn`). Attempt to load the target flow module using `props.requestModule` if not already loaded via `moduleRegistry.getLoadedModule`. Upon successful load, update the `currentFlowFqn` (via NavigationStateService) to display the target flow.",
        fallback_behavior: "If the target flow cannot be loaded (e.g., `requestModule` fails or returns null), provide user feedback (e.g., toast notification) indicating the flow is not available.",
        visual_indication: "SubFlowInvoker nodes should have visual indicators (e.g., navigation arrow icon, distinct styling, cursor pointer, tooltip like 'Double-click to open flow {{invokedFlowFqn}}') to indicate they are navigable.",
        flow_fqn_resolution: "The `invokedFlowFqn` field in `cfv_models.SubFlowInvokerNodeData` is populated by the GraphBuilderService. If the DSL's `step.config.flowName` contains a simple flow name (e.g., 'MySubFlow'), it should be resolved to a full FQN by combining with the current module's namespace (e.g., 'com.example.currentModule.MySubFlow'). If `flowName` is already a FQN, it's used directly.",
        named_component_handling: "CRITICAL: For named SubFlowInvoker components (e.g., a step references 'myCompany.utils.InvokeStandardKYC'), the actual `flowName` to invoke is part of the *named component's definition* (e.g., `myCompany.utils.InvokeStandardKYC` is defined as `type: StdLib:SubFlowInvoker, config: { flowName: 'com.subsidiary.kyc.MainKYCFlow' }`). The `GraphBuilderService` must resolve the named component, extract `flowName` from its definition's config, and populate `invokedFlowFqn` in the node data accordingly. The `step.config` for the invoking step might be empty or only contain overrides not relevant to `flowName`."
    }

    integration_requirements: {
        node_data_access: "Access `data.invokedFlowFqn` from `cfv_models.SubFlowInvokerNodeData` to determine the target flow.",
        module_loading: "Use the existing `props.requestModule` callback to load the target flow module if not already loaded.",
        view_switching: "Update the current view (e.g., by changing `currentFlowFqn` state) to display the target flow after successful loading.",
        config_field_mapping: "The GraphBuilderService populates `invokedFlowFqn`. For direct `StdLib:SubFlowInvoker` usage, it uses `step.config.flowName`. For named components that are SubFlowInvokers, it must look up the named component's definition and use the `flowName` from *that component definition's config block*.",
        component_resolution: "Use `moduleRegistry.resolveComponentTypeInfo()` to determine if a step references a named component or a direct component type. Check `componentInfo.isNamedComponent` and access `componentInfo.componentDefinition.config.flowName` if it's a named SubFlowInvoker."
    }

    error_handling: {
        missing_flow_name: "If `step.config.flowName` (for direct usage) or the named component's definition `config.flowName` is undefined or empty, `invokedFlowFqn` should be set to a sentinel value like 'unknown' or be absent, and a warning logged during graph generation. The node should visually indicate it's misconfigured.",
        invalid_flow_fqn: "If the resolved flow FQN is invalid or the target flow doesn't exist (e.g., `requestModule` returns null), provide clear user feedback.",
        module_load_failure: "If `props.requestModule` fails to load the target module, display an error message and optionally allow retry."
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
    description: "Provides guidance for implementing the refined node styling approach using light pastel backgrounds, subtle borders, and enhanced shadows, aligning with `cfv_models.NodeColors`."
    default_language: "TypeScriptReact"

    design_principles: {
        clean_design_mode: "In design mode (no `data.executionStatus`), nodes should have light themed backgrounds with subtle 1px borders. Each node type maintains its color identity: steps use blue-gray theme (cfv_models.NodeColors.stepNodeBackgroundColor, cfv_models.NodeColors.stepNodeColor), triggers use green theme (cfv_models.NodeColors.triggerNodeBackgroundColor, cfv_models.NodeColors.triggerNodeColor), sub-flow invokers use purple theme (cfv_models.NodeColors.subFlowInvokerBackgroundColor, cfv_models.NodeColors.subFlowInvokerColor).",
        execution_mode_styling: "In debug/execution mode (when `data.executionStatus` is defined), nodes should use light pastel backgrounds with subtle colored borders based on execution status. Success uses (cfv_models.NodeColors.successBackgroundColor, cfv_models.NodeColors.successColor), failure uses (cfv_models.NodeColors.failureBackgroundColor, cfv_models.NodeColors.failureColor), running uses (cfv_models.NodeColors.runningBackgroundColor, cfv_models.NodeColors.runningColor), skipped uses (cfv_models.NodeColors.skippedBackgroundColor, cfv_models.NodeColors.skippedColor), pending uses (cfv_models.NodeColors.pendingBackgroundColor, cfv_models.NodeColors.pendingColor).",
        color_palette: "Use colors defined in `cfv_models.NodeColors` or similar popular palettes (e.g., Tailwind CSS colors) for consistency and professional appearance. Avoid bright or harsh colors in favor of subtle, easy-on-the-eyes tones.",
        shadow_enhancement: "Use enhanced shadows for better visual hierarchy: default shadow `props.uiOptions.nodeStyleOptions.defaultShadow` (e.g., '0 4px 12px rgba(0, 0, 0, 0.15)') and selected shadow `props.uiOptions.nodeStyleOptions.selectedShadow` (e.g., '0 6px 20px rgba(59, 130, 246, 0.4)')."
    }

    implementation_guidelines: {
        border_specifications: "Use 1px solid borders with subtle colors from `cfv_models.NodeColors`. Avoid thick borders (2px+) or dashed borders for cleaner appearance.",
        background_colors: "Apply light pastel backgrounds from `cfv_models.NodeColors` that complement the border colors.",
        status_indicators: "CRITICAL: Remove 'ready' or 'not executed' status badges. Only show execution status when actual execution data (`data.executionStatus`) is available and non-null.",
        transition_effects: "Use smooth CSS transitions (e.g., `props.uiOptions.nodeStyleOptions.transitionDuration` like 'all 0.2s ease') for state changes and hover effects."
    }

    // Color specifications are now centralized in cfv_models.NodeColors and accessed via props.uiOptions.colorTheme.nodeColors
}

directive cfv_consumer_directives.AutoZoomToFit {
    id: "CFV_DIR_ZOOM_001"
    title: "Directive for Automatic Zoom-to-Fit on Flow Load"
    target_tool: "HumanDeveloper_React_CascadeVisualizerConsumer"
    description: "Provides guidance for implementing automatic zoom-to-fit functionality when flows are initially loaded to ensure all nodes are visible on screen."
    default_language: "TypeScriptReact"

    implementation_pattern: {
        trigger_conditions: "Automatically fit view when: 1) A flow is initially loaded (currentFlowFqn changes), 2) User navigates to a different flow via SubFlowInvoker double-click, 3) User switches between flows in the navigation list, 4) Graph data changes significantly (e.g., new nodes added/removed causing a change in nodes.length).",
        react_flow_integration: "Use React Flow's `fitView()` method from the `useReactFlow` hook to automatically adjust zoom and pan to show all nodes.",
        timing_considerations: "Execute `fitView()` after graph layout is complete and nodes are positioned. Use `useEffect` with dependencies on `currentFlowFqn` and `nodes.length` (or a layout completion flag if available). A small `setTimeout` (e.g., 100ms) might be needed to ensure DOM updates are complete.",
        animation_settings: "Use smooth animation for better UX: `fitView({ duration: 800, padding: 0.1 })` to provide 10% padding around nodes. Adjust padding for long flows (e.g., 0.15 or 0.2) to prevent nodes from being too small. `minZoom` can be set low (e.g., 0.05 or 0.1) for very large/wide graphs.",
        performance_optimization: "Debounce `fitView` calls if graph data can change very rapidly, though dependency on `currentFlowFqn` and `nodes.length` typically handles this.",
        width_compensation_awareness: "ENHANCED: The layout service (`cfv_designs.LayoutService`) may add extra spacing for wide nodes. Auto-zoom should gracefully handle this, ensuring the view fits the potentially wider graph. Consider increasing padding or adjusting `minZoom` for flows known to have many wide nodes."
    }

    integration_requirements: {
        react_flow_hook: "Use `useReactFlow()` hook to access `fitView` method within React Flow provider context.",
        dependency_tracking: "Track changes to `currentFlowFqn`, `nodes` (specifically `nodes.length` as a proxy for graph change), and potentially a layout completion status flag.",
        conditional_execution: "Only execute `fitView` when nodes are present (`nodes.length > 0`) and positioned (e.g., after layout effect or with a small timeout).",
        user_override: "Auto-fit should primarily occur on initial load or explicit navigation events. It should not interfere with subsequent user-initiated zoom/pan actions. A flag could track if initial fit has occurred for the current flow.",
        enhanced_spacing_support: "ENHANCED: Be mindful that `cfv_designs.LayoutService` compensates for wide nodes. The auto-zoom may need to use a smaller `minZoom` or larger `padding` for flows that are wide due to this compensation to ensure all content is visible."
    }

    user_experience: {
        smooth_transitions: "Use animated transitions for zoom changes for smooth visual feedback.",
        appropriate_padding: "Maintain 10-20% padding around the graph. More padding for wider/longer graphs.",
        preserve_user_control: "After initial auto-fit, allow user to manually zoom/pan without interference.",
        loading_states: "Coordinate with loading states to ensure `fitView` occurs after content is ready and laid out.",
        wide_node_handling: "ENHANCED: Ensure proper zoom levels for flows with wide nodes by allowing more aggressive zoom-out if necessary."
    }

    technical_implementation: {
        hook_usage: "const { fitView } = useReactFlow(); // within React Flow provider context",
        effect_pattern: "useEffect(() => { if (nodes && nodes.length > 0 && !isUserInteractingManualZoom) { setTimeout(() => fitView({ duration: 800, padding: nodes.length > 7 ? 0.15 : 0.1, minZoom: nodes.length > 10 ? 0.05 : 0.1, maxZoom: 1.5 }), 100); } }, [currentFlowFqn, nodes, fitView]); // Add nodes.length to deps if nodes itself is not stable or too frequent. isUserInteractingManualZoom is a conceptual flag.",
        error_handling: "Wrap `fitView` calls in try-catch if React Flow context might not be available, though this is unlikely if structured correctly.",
        timing_delay: "Use small timeout (e.g., 100ms) to ensure DOM updates and layout calculations are complete before fitting view.",
        zoom_constraints: "Set `minZoom` dynamically based on graph size/width. Increase `padding` for very long/wide flows.",
        square_layout_support: "If layout service prefers square-ish arrangements for long flows, auto-zoom should adapt to that aspect ratio."
    }
}

directive cfv_consumer_directives.GraphVisualization {
    id: "CFV_DIR_GRAPH_001"
    title: "Directive for Graph Visualization"
    target_tool: "HumanDeveloper_React_CascadeVisualizerConsumer"
    description: "Provides guidance for implementing the refined graph visualization approach."
    default_language: "TypeScriptReact"

    graph_visualization: {
        node_representation: "Each step becomes a React Flow node. Trigger becomes a special trigger node. SubFlowInvoker steps become special sub-flow nodes with navigation capability. Data for rendering comes from `cfv_models.BaseNodeData` and its derivatives (`StepNodeData`, `SubFlowInvokerNodeData`, `TriggerEntryPointNodeData`).",
        edge_generation: "ENHANCED: Edges are generated by `cfv_designs.GraphBuilderService` from four distinct sources with different `data.dependencyType` and `data.type` (in `cfv_models.FlowEdgeData`): 1) `run_after` dependencies create 'executionOrderDependency' edges (visual: purple solid, labeled 'execution order'), 2) `inputs_map` references create 'dataDependency' edges (visual: blue dashed, labeled with target input key), 3) `outputs_map` error routing creates 'errorRouting' edges (visual: red dashed, labeled with source output port), 4) Implicit trigger-to-first-step connections create 'controlFlow' edges (visual: standard gray). CRITICAL: Each edge type must have distinct visual styling by the consumer's custom edge renderer to clearly communicate the different types of dependencies.",
        layout_algorithm: "Use ELK.js layered layout as configured by `cfv_designs.LayoutService`. For flows with many parallel branches or complex fork patterns, the layout service may use specific ELK configurations or alternative strategies if supported.",
        trace_overlay: "When trace data is available (from `props.traceData` or streaming updates), nodes are enhanced with execution status (SUCCESS/FAILURE/RUNNING/PENDING/SKIPPED) and timing information. Executed paths are highlighted on edges (`data.isExecutedPath`).",
        edge_type_styling: "ENHANCED: Custom edge renderers must differentiate edge styles based on `data.type` and `data.dependencyType` as described in `edge_generation`. This visual distinction is critical for user understanding."
    }
}