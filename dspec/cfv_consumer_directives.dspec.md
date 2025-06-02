// cfv_consumer_directives.dspec
// Provides directives and best practice guidance for applications consuming the CascadeFlowVisualizer library.

directive cfv_consumer_directives.CustomNodeRendering {
    title: "Directive for Implementing Custom Node Renderers"
    target_tool: "HumanDeveloper_React_CascadeVisualizerConsumer" // Indicates guidance for human developers
    description: "Provides best practices and expected patterns for creating custom node components to be used with the `customNodeTypes` prop of CascadeFlowVisualizer."
    default_language: "TypeScriptReact"

    node_data_access: {
        // Guidance on accessing fields from the 'data' prop passed to custom node components.
        // e.g., Node<cfv_models.StepNodeData>, Node<cfv_models.SubFlowInvokerNodeData>, etc.
        core_fields_to_utilize: [
            "data.label: string (for display)",
            "data.dslObject: any (original DSL snippet, useful for context or advanced display)",
            "data.resolvedComponentFqn: string (e.g., 'StdLib:HttpCall')",
            "data.componentSchema: cfv_models.ComponentSchema | null (for understanding config/ports)",
            "data.isNamedComponent: boolean",
            "data.contextVarUsages: string[] (list of context variables used)",
            "data.error: cfv_models.NodeError | undefined (for visual error indication on the node)"
        ],
        trace_mode_fields: [
            "data.executionStatus: cfv_models.ExecutionStatusEnum (for styling based on SUCCESS/FAILURE/SKIPPED)",
            "data.executionDurationMs: number (for display)",
            "data.executionInputData: any (available for tooltip or condensed display)",
            "data.executionOutputData: any"
        ],
        subflow_invoker_specific_fields: [
            "data.invokedFlowFqn: string (for creating navigation links/buttons)"
        ]
    }

    visual_error_indication_pattern: {
        recommendation: "If `data.error` is present, visually distinguish the node (e.g., red border, error icon). Tooltip on hover should display `data.error.message`."
    }

    visual_trace_status_pattern: {
        recommendation: "Use `data.executionStatus` to apply distinct styles: e.g., green for SUCCESS, red for FAILURE, gray for SKIPPED. Consider animations for RUNNING."
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
    title: "Directive for Implementing Custom Edge Renderers"
    target_tool: "HumanDeveloper_React_CascadeVisualizerConsumer"
    description: "Provides best practices for creating custom edge components for `customEdgeTypes`."
    default_language: "TypeScriptReact"

    edge_data_access: {
        // Guidance on accessing fields from the 'data' prop passed to custom edge components.
        // e.g., Edge<cfv_models.FlowEdgeData>, Edge<cfv_models.SystemEdgeData>
        flow_edge_fields: [
            "data.type: 'dataFlow' | 'controlFlow' (for distinct styling)",
            "data.isExecutedPath: boolean (in trace/test_result mode, for highlighting active paths)"
        ],
        system_edge_fields: [
            "data.type: 'invocationEdge' | 'triggerLinkEdge'"
        ]
    }

    visual_styling_pattern: {
        recommendation: "Style 'dataFlow' edges differently from 'controlFlow' edges (e.g., solid vs. dashed). Highlight edges where `data.isExecutedPath` is true."
    }
}

directive cfv_consumer_directives.InspectorTabImplementation {
    title: "Directive for Implementing Consolidated Inspector Tab Renderers"
    target_tool: "HumanDeveloper_React_CascadeVisualizerConsumer"
    description: "Guidance for implementing the consolidated inspector tab architecture with better separation of concerns."
    default_language: "TypeScriptReact"

    common_props_usage: {
        selectedElement: "Access `selectedElement: cfv_models.SelectedElement | null` to get context. Check `selectedElement.sourceType` and `selectedElement.data` for specific content.",
        moduleRegistry: "Use `moduleRegistry: cfv_models.IModuleRegistry` for synchronous lookups: `getLoadedModule`, `getComponentSchema`, `resolveComponentTypeInfo` etc. Do not attempt to modify registry state directly."
    }

    properties_tab_guidance: {
        // For renderInspectorPropertiesTab - Component-level configuration editor
        purpose: "Interactive form-based editor for component configurations, with live YAML preview.",
        actions_usage: "Use `actions: cfv_models.InspectorPropertiesActions` to trigger saves. Call `actions.requestSave(newConfigValue, pathToConfig)`.",
        form_generation: "Consider using libraries like `@rjsf/core` with `selectedElement.data.componentSchema.configSchema` to dynamically generate forms for `config` blocks.",
        state_management: "Manage local form state within your tab component. Only call `requestSave` on explicit user action (e.g., Save button click).",
        yaml_preview: "Show live YAML preview of changes before saving. Use split-pane layout with form on left, YAML preview on right.",
        context_variables: "Display and allow editing of context variable usages found in `selectedElement.data.contextVarUsages`.",
        validation: "Validate form inputs against `componentSchema.configSchema` and show validation errors inline."
    }

    source_tab_guidance: {
        // For renderInspectorSourceTab - Full module YAML source viewer
        purpose: "Read-only viewer showing full module YAML context, not just selected element.",
        content_scope: "Display the complete module YAML that contains the selected element, with the selected element highlighted.",
        highlighting: "Highlight the selected element's section within the full module YAML for context.",
        navigation: "Provide navigation within the YAML (line numbers, search, folding) for large modules.",
        diff_view: "When in editing mode, show diff between original and modified YAML.",
        export_options: "Provide options to copy YAML sections or export the full module."
    }

    data_flow_tab_guidance: {
        // For renderInspectorDataFlowTab - Flow-level data analysis and debugging
        purpose: "Flow-level data analysis, execution debugging, and performance monitoring.",
        data_props: "Receives `currentFlowFqn: string | null`, `traceData: FlowExecutionTrace | null`, and `actions: FlowDataAnalysisActions`.",
        execution_overview: "Show flow execution summary: status, duration, step count, success/failure rates.",
        step_timeline: "Display step execution timeline with start/end times and durations.",
        data_lineage: "Visualize data flow between steps, showing how data transforms through the flow.",
        performance_analysis: "Show critical path analysis, bottlenecks, and performance metrics.",
        error_analysis: "Display detailed error information for failed executions with stack traces.",
        comparison_tools: "Use `actions.compareExecutions` to compare multiple trace executions.",
        data_inspection: "Show input/output data for each step with JSON/YAML formatting and search.",
        execution_replay: "Provide step-by-step execution replay with data state at each step."
    }

    testing_tab_guidance: {
        // For renderInspectorTestingTab - Property testing interface
        purpose: "Comprehensive property testing interface for flow validation and quality assurance.",
        test_case_management: "Create, edit, and manage test cases for the current flow.",
        template_generation: "Generate test case templates for common scenarios (happy path, error handling, performance).",
        test_execution: "Use `actions.runTestCase(testCase: cfv_models.FlowTestCase)` to trigger test execution via `props.onRunTestCase`.",
        assertion_builder: "Provide UI for building test assertions with JMESPath selectors and comparison operators.",
        mock_configuration: "Allow configuration of component mocks for isolated testing.",
        test_results: "Display test execution results with pass/fail status and detailed assertion outcomes.",
        coverage_analysis: "Show test coverage metrics for flow paths and component configurations.",
        regression_testing: "Support regression testing by comparing results across test runs."
    }

    migration_guidance: {
        // For migrating from old tab structure
        deprecated_tabs: "The following tabs are deprecated: DataIOTab, ContextVarsTab, TestDefinitionTab, AssertionResultsTab.",
        migration_path: {
            DataIOTab: "Functionality moved to DataFlowTab with enhanced flow-level analysis.",
            ContextVarsTab: "Context variables now shown in PropertiesTab alongside component configuration.",
            TestDefinitionTab: "Functionality consolidated into TestingTab with enhanced test management.",
            AssertionResultsTab: "Assertion results now shown in TestingTab alongside test definitions."
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
        error_handling: "Display clear error messages and recovery options for failed operations."
    }
}

directive cfv_consumer_directives.CallbackPropHandling {
    title: "Directive for Handling Library Callback Props"
    target_tool: "HumanDeveloper_React_CascadeVisualizerConsumer"
    description: "Best practices for implementing and managing props like `requestModule`, `onSaveModule`, `fetchTraceList`, `onRunTestCase` in the consuming application."

    requestModule_implementation: {
        // For props.requestModule
        return_value: "Ensure the Promise resolves to `cfv_models.RequestModuleResult` or `null`. Handle errors gracefully (e.g., network errors) and consider returning `null` or throwing an error that `onModuleLoadError` can catch.",
        caching: "Consider implementing client-side caching of module content in the host application to avoid redundant requests for the same FQN if appropriate."
    }

    onSaveModule_implementation: {
        // For props.onSaveModule
        persistence: "The consuming application is responsible for actually persisting the `newContent` (e.g., saving to a file, sending to a backend API).",
        feedback_to_visualizer: "If the save operation can fail, the Promise should reject or return `false`. The visualizer does not inherently provide UI feedback for save success/failure beyond the Promise resolution; the host app may need to.",
        optimistic_updates: "For a smoother UX, the host application might optimistically update the `initialModules` prop immediately and then handle potential save failures, or wait for `onSaveModule` to resolve."
    }

    fetchTraceList_implementation: {
        // For props.fetchTraceList
        return_value: "Ensure the Promise resolves to `cfv_models.HistoricalFlowInstanceSummary[]`."
    }

    onRunTestCase_implementation: {
        // For props.onRunTestCase
        execution_logic: "The host application is responsible for taking the `FlowTestCase`, executing the target flow (potentially in a sandboxed environment or against a test runtime), and returning a `cfv_models.TestRunResult`."
    }
}