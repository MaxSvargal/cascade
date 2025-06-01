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
    title: "Directive for Implementing Inspector Tab Renderers"
    target_tool: "HumanDeveloper_React_CascadeVisualizerConsumer"
    description: "Guidance for `renderInspectorPropertiesTab`, `renderInspectorDataIOTab`, etc."
    default_language: "TypeScriptReact"

    common_props_usage: {
        selectedElement: "Access `selectedElement: cfv_models.SelectedElement | null` to get context. Check `selectedElement.sourceType` and `selectedElement.data` for specific content.",
        moduleRegistry: "Use `moduleRegistry: cfv_models.IModuleRegistry` for synchronous lookups: `getLoadedModule`, `getComponentSchema`, `resolveComponentTypeInfo` etc. Do not attempt to modify registry state directly."
    }

    properties_tab_guidance: {
        // For renderInspectorPropertiesTab
        actions_usage: "Use `actions: cfv_models.InspectorPropertiesActions` to trigger saves. Call `actions.requestSave(newConfigValue, pathToConfig)`.",
        form_generation: "Consider using libraries like `@rjsf/core` with `selectedElement.data.componentSchema.configSchema` to dynamically generate forms for `config` blocks.",
        state_management: "Manage local form state within your tab component. Only call `requestSave` on explicit user action (e.g., Save button click)."
    }

    data_io_tab_guidance: {
        // For renderInspectorDataIOTab
        data_prop: "Receives `selectedStepTrace: cfv_models.StepExecutionTrace | null`. Display `inputData` and `outputData` (or `errorData`) from this trace."
    }

    test_definition_tab_guidance: {
        // For renderInspectorTestDefinitionTab
        actions_usage: "Use `actions.runTestCase(testCase: cfv_models.FlowTestCase)` to trigger test execution via `props.onRunTestCase`."
        state_management: "Manage the draft `FlowTestCase` object state locally within your tab component."
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