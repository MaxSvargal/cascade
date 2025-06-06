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
        purpose: "Enhanced interactive form-based editor for a selected element's `config` block using advanced schema-driven form generation with modern styling and comprehensive validation.",
        
        enhanced_form_generation: {
            libraries: "Use @rjsf/core (React JSON Schema Form) with @rjsf/validator-ajv8 for robust form generation from component schemas. Apply @rjsf/mui or custom themes for modern styling.",
            validation_libraries: "Use Zod for runtime validation and type safety of form data, combined with @rjsf/validator-ajv8 for schema validation.",
            schema_integration: "Use `props.selectedElement.data.componentSchema.configSchema` (for steps) or `props.selectedElement.data.componentSchema.triggerConfigSchema` (for triggers) to generate comprehensive forms for the `config` block.",
            ui_schema_generation: "Generate intelligent UI schemas with appropriate widgets (text, number, select, textarea, date-time, etc.) based on JSON schema properties, formats, and constraints."
        },
        
        enhanced_form_features: {
            field_types: "Support all JSON schema types with appropriate form controls: string (text/textarea/select), number (numeric input with validation), boolean (checkbox/toggle), object (nested forms), array (dynamic lists with add/remove).",
            validation_display: "Show real-time validation with inline error messages, field-level warnings, and success indicators. Use color coding and icons for validation states.",
            default_values: "Pre-populate forms with current configuration values from `props.selectedElement.data.dslObject.config` and apply schema defaults for missing fields.",
            conditional_fields: "Support conditional field display based on schema dependencies and oneOf/anyOf constructs.",
            help_text: "Display schema descriptions, examples, and help text for each field to guide users."
        },
        
        modern_styling: {
            design_system: "Apply consistent design system with proper spacing, typography, and color schemes. Use card-based layouts for grouped fields.",
            responsive_layout: "Ensure forms are responsive and work well in sidebar layouts with proper field sizing and spacing.",
            accessibility: "Include proper ARIA labels, keyboard navigation, and screen reader support for all form elements.",
            visual_hierarchy: "Use clear visual hierarchy with section headers, field grouping, and proper spacing between form elements."
        },
        
        state_management: "Manage local form state with React Hook Form or similar for complex form state, debounced validation, and optimistic updates.",
        save_workflow: "On explicit user 'Save' action, call `props.actions.requestSave(newConfigValue, pathToConfig)` with comprehensive validation and error handling. Show save progress and success/error states.",
        yaml_preview: "Provide optional YAML preview of current form state with syntax highlighting and proper formatting."
    }

    debug_test_tab_guidance: {
        // Props received: cfv_models.InspectorDebugTestTabProps (currentFlowFqn, selectedElement?, traceData?, testResultData?, actions, moduleRegistry)
        purpose: "Comprehensive debugging and testing interface for the `props.currentFlowFqn` or `props.selectedElement` within that flow with enhanced data management."

        enhanced_data_sections: {
            layout: "Sequential vertical layout without tabs - display all three data sections one after another for better visibility and workflow",
            input_data_section: {
                purpose: "Display and edit input data for the selected step/trigger based on component input schema",
                schema_integration: "Use component.inputSchema to generate realistic test data and validate input format",
                data_generation: "Provide schema-based data generation buttons with ReactFlow node palette colors",
                validation: "Real-time validation against input schema with clear error display"
            },
            configuration_data_section: {
                purpose: "Display and edit configuration data from the selected element's config block",
                schema_integration: "Use component.configSchema to validate configuration format and structure",
                data_source: "Load from selectedElement.data.dslObject.config and allow editing",
                validation: "Real-time validation against config schema with clear error display"
            },
            output_data_section: {
                purpose: "Display expected or actual output data based on component output schema and execution results",
                schema_integration: "Use component.outputSchema to generate realistic expected output data",
                data_generation: "Generate mock output data based on schema when no execution results available",
                execution_integration: "Update with actual output data after step execution",
                read_only: "Display-only section that updates based on schema or execution results"
            }
        },

        trigger_data_handling: {
            input_data: "For trigger elements, generate input data based on trigger.inputSchema from flow definition, not component schema",
            output_data: "For trigger elements, generate output data based on trigger.outputSchema or default trigger output structure",
            configuration_data: "For trigger elements, show trigger configuration from flow definition trigger block"
        },

        styling_consistency: {
            button_colors: "Use ReactFlow node palette colors for data generation buttons - success green (#10B981), warning orange (#F59E0B), error red (#EF4444)",
            primary_buttons: "Style execution and action buttons to match ReactFlow node styling with proper padding, border-radius, and hover states",
            component_info: "Display component information in rows rather than columns for better readability in sidebar layout",
            spacing: "Use consistent 16px spacing between sections, 8px for internal elements"
        },

        data_generation_improvements: {
            schema_based_generation: "Always use appropriate schema (input/config/output) for data generation rather than generic mock data",
            trigger_specific: "For triggers, use flow definition trigger schema rather than component schema",
            output_prediction: "Generate realistic output data based on input data and component behavior patterns",
            error_scenarios: "Generate appropriate error cases based on schema validation rules and component failure modes"
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
        trigger_conditions: "Automatically fit view when: 1) A flow is initially loaded (currentFlowFqn changes), 2) User navigates to a different flow via SubFlowInvoker double-click, 3) User switches between flows in the navigation list, 4) Graph data changes significantly (e.g., new nodes added/removed causing a change in nodes.length), 5) System overview mode is activated with multiple flows and triggers.",
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
        enhanced_spacing_support: "ENHANCED: Be mindful that `cfv_designs.LayoutService` compensates for wide nodes. The auto-zoom may need to use a smaller `minZoom` or larger `padding` for flows that are wide due to this compensation to ensure all content is visible.",
        system_overview_support: "ENHANCED: For system overview mode, use appropriate padding (0.15-0.2) to accommodate horizontal layout with triggers and flows. The 25% increased spacing in system overview requires slightly more padding to ensure all nodes are comfortably visible."
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
        edge_type_styling: "ENHANCED: Custom edge renderers must differentiate edge styles based on `data.type` and `data.dependencyType` as described in `edge_generation`. This visual distinction is critical for user understanding.",
        system_overview_mode: "ENHANCED: System overview uses horizontal layout (LEFT_TO_RIGHT) with specialized SystemFlowNode and SystemTriggerNode components. Triggers use borderless, transparent styling while flows use light borders (#ddd). All connections are horizontal (right-to-left) with 25% increased spacing for better visual separation. SystemEdgeData with 'triggerLinkEdge' and 'invocationEdge' types use dark gray (#555) and orange (#FF9800) colors respectively."
    }
}

directive cfv_consumer_directives.SystemOverviewLayout {
    id: "CFV_DIR_SYSTEM_001"
    title: "Directive for System Overview Layout and Visual Design"
    target_tool: "HumanDeveloper_React_CascadeVisualizerConsumer"
    description: "Comprehensive specifications for implementing the refined system overview layout with horizontal connections, proper node styling, and optimized spacing."
    default_language: "TypeScriptReact"

    layout_orientation: {
        primary_direction: "LEFT_TO_RIGHT (direction: 'RIGHT')",
        connection_pattern: "Horizontal connections between all nodes",
        trigger_to_flow_connection: "Trigger nodes connect from their RIGHT side to the LEFT side of flow nodes",
        flow_to_flow_connection: "Source flows connect from their RIGHT side to the LEFT side of target flows (SubFlowInvoker relationships)",
        handle_specifications: {
            trigger_nodes: "Source handle at Position.Right with id='right'",
            flow_nodes: "Target handle at Position.Left with id='left', Source handle at Position.Right with id='right'",
            edge_specifications: "sourceHandle: 'right', targetHandle: 'left' for all system overview edges"
        }
    }

    node_styling_specifications: {
        trigger_nodes: {
            visual_hierarchy: "Subtle, non-intrusive appearance to emphasize flows over triggers",
            border: "none (borderless design)",
            background: "transparent",
            shadow: "none (completely flat appearance)",
            dimensions: "minHeight: 80px (same as flow nodes), minWidth: 120px, maxWidth: 200px",
            padding: "12px (consistent with flow nodes)",
            typography: {
                title: "fontSize: 14px, fontWeight: bold, color: #2E7D32",
                fqn: "fontSize: 11px, color: #4CAF50",
                context: "fontSize: 10px, color: #666"
            },
            icon: "⚡ prefix for trigger identification"
        },
        flow_nodes: {
            visual_hierarchy: "Primary visual elements with clear definition",
            border: "2px solid #ddd (light gray for subtle definition)",
            border_selected: "2px solid #1976D2 (blue for selection state)",
            background: "white (solid background for content readability)",
            shadow: "0 2px 6px rgba(0,0,0,0.1) (subtle depth)",
            dimensions: "minHeight: 80px, minWidth: 160px, maxWidth: 280px",
            padding: "12px",
            typography: {
                title: "fontSize: 14px, fontWeight: bold, color: #333",
                fqn: "fontSize: 11px, color: #666",
                context: "fontSize: 10px, color: #888"
            },
            icon: "📋 prefix for flow identification",
            navigation_indicator: "→ symbol in top-right corner for navigatable flows"
        }
    }

    edge_styling_specifications: {
        trigger_link_edges: {
            color: "#555 (dark gray instead of green)",
            stroke_width: "2px (default), 4px (selected)",
            style: "solid line",
            label: "triggers (centered on edge)",
            label_color: "#555 (matching edge color)",
            arrow: "ArrowClosed marker in matching color"
        },
        invocation_edges: {
            color: "#FF9800 (orange for flow-to-flow relationships)",
            stroke_width: "2px (default), 4px (selected)", 
            style: "dashed (strokeDasharray: '8,4')",
            label: "invokes (centered on edge)",
            label_color: "#E65100 (darker orange)",
            arrow: "ArrowClosed marker in matching color",
            step_label: "step_id displayed on edge for context"
        }
    }

    spacing_specifications: {
        layout_preset: "systemOverview with enhanced spacing",
        node_to_node_spacing: "125px (increased 25% from 100px for better breathing room)",
        edge_to_node_spacing: "38px (increased 25% from 30px)",
        edge_to_edge_spacing: "19px (increased 25% from 15px)",
        layer_spacing: "100px (reduced from 120px to bring triggers closer to flows)",
        rationale: "25% spacing increase provides better visual separation while reduced layer spacing maintains trigger-flow proximity"
    }

    interaction_specifications: {
        flow_node_navigation: {
            trigger: "Double-click or single-click (configurable)",
            visual_feedback: "Scale transform (1.02x) and enhanced shadow on hover",
            cursor: "pointer for navigatable flows, default for non-navigatable",
            border_highlight: "Blue border (#1976D2) on hover for navigatable flows"
        },
        trigger_node_interaction: {
            hover_effects: "None (minimal interaction to maintain subtle appearance)",
            selection: "Standard React Flow selection highlighting",
            cursor: "default (triggers are informational, not interactive)"
        }
    }

    accessibility_considerations: {
        color_contrast: "All text colors meet WCAG AA standards against their backgrounds",
        visual_hierarchy: "Clear distinction between primary (flows) and secondary (triggers) elements",
        keyboard_navigation: "Standard React Flow keyboard navigation support",
        screen_reader_support: "Semantic HTML structure with appropriate ARIA labels"
    }

    performance_optimizations: {
        memoization: "React.memo for both SystemFlowNode and SystemTriggerNode components",
        layout_caching: "ELK layout results cached based on node/edge configuration",
        handle_optimization: "Specific handle IDs to avoid unnecessary re-renders",
        transition_performance: "CSS transitions limited to transform and box-shadow properties"
    }

    implementation_notes: {
        elk_configuration: "Uses 'layered' algorithm with 'RIGHT' direction and 'ORTHOGONAL' edge routing",
        component_separation: "Distinct components for SystemFlowNode and SystemTriggerNode with different styling approaches",
        edge_routing: "Automatic ELK routing with manual handle specifications for precise connection points",
        responsive_design: "Min/max width constraints ensure proper display across different screen sizes"
    }
}