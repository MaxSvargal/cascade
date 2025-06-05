// cfv_requirements.dspec
// Refined according to DefinitiveSpec methodology with qualified names and stable IDs
// Defines functional requirements for the CascadeFlowVisualizer library.
// Updated for consolidated inspector, streaming execution, and architectural alignment.

// --- Derived from Section III: UI Layout ---

requirement cfv_requirements.UILayout_IdeLikeStructure {
    id: "CFV_REQ_UI_001"
    title: "IDE-like Three-Pane Layout Structure"
    description: "The visualizer provides an IDE-like interface with Left Sidebar (module/flow navigation), Main Canvas (graph visualization), and Right Sidebar (inspector/editor). This layout supports efficient workflow for understanding, navigating, and editing Cascade DSL flows."
    priority: "Critical"
    status: "Accepted"
    fulfills_part_of: [cfv_overview.CorePurpose]
    applies_policies: [cfv_policies.Arch_ExternalizeVisualsAndBehavior]
    source: "CascadeFlowVisualizer Library Specification, Section III.A"
    acceptance_criteria: [
        "Given the visualizer is rendered,",
        "Then it should display a three-pane layout with clearly defined Left Sidebar, Main Canvas, and Right Sidebar areas.",
        "And the layout should be responsive and maintain usability across different screen sizes.",
        "And each pane should have distinct, well-defined responsibilities for navigation, visualization, and inspection respectively."
    ]
}

requirement cfv_requirements.UILayout_LeftSidebar_ModuleList {
    id: "CFV_REQ_UI_LS_001"
    title: "Left Sidebar: Module and Flow List with Collapsible Sections"
    description: "The Left Sidebar displays a hierarchical list of loaded modules (cfv_models.DslModuleRepresentation) and their contained flows. Modules are collapsible by default. Only error status indicators are shown for modules."
    priority: "High"
    status: "Accepted"
    fulfills_part_of: [cfv_requirements.UILayout_IdeLikeStructure]
    source: "CascadeFlowVisualizer Library Specification, Section III.B and FR14_ModuleListCollapsible"
    acceptance_criteria: [
        "Given modules are loaded,",
        "Then the Left Sidebar should display a list of modules, collapsed by default.",
        "And modules should be expandable to show their flows.",
        "And only modules with errors (status 'error' in cfv_models.DslModuleRepresentation) should show an error indicator.",
        "And flows within each module should be listed as navigable items.",
        "And clicking on a flow should trigger navigation to Flow Detail view for that flow."
    ]
}

requirement cfv_requirements.UILayout_LeftSidebar_TraceList {
    id: "CFV_REQ_UI_LS_002"
    title: "Left Sidebar: Historical Trace List"
    description: "When props.fetchTraceList is provided, the Left Sidebar can display a list of historical flow execution traces (cfv_models.HistoricalFlowInstanceSummary) for debugging purposes."
    priority: "Medium"
    status: "Accepted"
    fulfills_part_of: [cfv_requirements.UILayout_IdeLikeStructure]
    source: "CascadeFlowVisualizer Library Specification, Section III.B"
    acceptance_criteria: [
        "Given props.fetchTraceList is provided and returns trace summaries,",
        "Then the Left Sidebar should display a list of historical flow runs.",
        "And each trace item should be rendered using props.renderFlowRunListItem if provided.",
        "And selecting a trace should trigger appropriate callbacks to load trace data (host app updates props.traceData and props.mode).",
        "And the trace list should support filtering and sorting by flow, status, and timestamp."
    ]
}

requirement cfv_requirements.UILayout_MainCanvas {
    id: "CFV_REQ_UI_MC_001"
    title: "Main Canvas: Graph Visualization Area"
    description: "The Main Canvas displays interactive flow graphs using React Flow, with automatic layout via cfv_designs.LayoutService and support for both System Overview and Flow Detail views."
    priority: "Critical"
    status: "Accepted"
    fulfills_part_of: [cfv_requirements.UILayout_IdeLikeStructure]
    applies_policies: [cfv_policies.Arch_ReactFlowElkjsFoundation]
    source: "CascadeFlowVisualizer Library Specification, Section III.C"
    acceptance_criteria: [
        "Given the visualizer is in System Overview mode,",
        "Then the Main Canvas should display flows as nodes with trigger and invocation relationships.",
        "Given the visualizer is in Flow Detail mode for a specific flow,",
        "Then the Main Canvas should display the flow's internal structure (trigger, steps, data/control flow edges with distinct styling).",
        "And all graph elements should be interactive (selectable, potentially draggable).",
        "And the graph should be automatically laid out using ELK.js via cfv_designs.LayoutService (defaulting to left-to-right for flows).",
        "And trace overlays should be applied when props.mode is 'trace' and props.traceData is provided, or when streaming updates are received."
    ]
}

requirement cfv_requirements.UILayout_RightSidebar_ConsolidatedInspector {
    id: "CFV_REQ_UI_RSI_001"
    title: "Right Sidebar: Consolidated Inspector & Editor (Source, Properties, Debug & Test)"
    description: `
        The Right Sidebar provides context-sensitive information and interaction capabilities for the currently selected element.
        It features three primary tabs: Source, Properties, and Debug & Test.
        The content of these tabs is rendered by consumer-provided functions (props.renderInspectorSourceTab, props.renderInspectorPropertiesTab, props.renderInspectorDebugTestTab),
        to whom the library passes relevant data and action callbacks (cfv_models.InspectorSourceTabProps, cfv_models.InspectorPropertiesTabProps, cfv_models.InspectorDebugTestTabProps).
        Tab switching is manual-only by user click, preserving user intent.
    `
    priority: "Critical"
    status: "Accepted"
    fulfills_part_of: [cfv_requirements.UILayout_IdeLikeStructure]
    applies_policies: [cfv_policies.Arch_ExternalizeVisualsAndBehavior]
    source: "CascadeFlowVisualizer Library Specification, Section III.C & Consolidated Tab Architecture Directive & cfv_designs.InspectorTabSelectionBehavior"
    acceptance_criteria: [
        "Given the visualizer is rendered and an element (e.g., a step node) is selected,",
        "Then the Right Sidebar should be visible.",
        "And the 'Source' tab should be available and active by default.",
        "And consumer-provided render functions for Source, Properties, and Debug & Test tabs are called with their respective correct props models.",
        "And tab visibility adheres to rules in cfv_consumer_directives.InspectorTabImplementation.tab_priority_and_defaults.visibility_rules.",
        "And tab switching only occurs on explicit user click on a tab button.",
        "And the active tab state is preserved across element selections and navigations."
    ]
}

requirement cfv_requirements.UILayout_ErrorDisplay {
    id: "CFV_REQ_UI_ERR_001"
    title: "Error Display and User Feedback"
    description: "The visualizer provides clear, contextual error messages and loading states for module loading failures, parsing errors, and other operational issues."
    priority: "High"
    status: "Accepted"
    fulfills_part_of: [cfv_requirements.UILayout_IdeLikeStructure]
    source: "CascadeFlowVisualizer Library Specification, Section III.D"
    acceptance_criteria: [
        "Given a module fails to load or parse,",
        "Then appropriate error messages should be displayed in the Left Sidebar module list (e.g., an error icon).",
        "And detailed error information (from cfv_models.DslModuleRepresentation.errors) should be accessible, e.g., via the Source tab when the module is selected.",
        "And errors on graph nodes (node.data.error) should be visually indicated by the custom node renderer.",
        "And loading states should be clearly indicated during asynchronous operations (module loading, execution streaming)."
    ]
}

// --- Derived from Section IV: Functional Requirements (FR) ---

requirement cfv_requirements.FR1_ModuleManagement {
    id: "CFV_REQ_FR1_001"
    title: "FR1: Module Management and Loading"
    description: "The library manages loading, parsing, and maintaining Cascade DSL modules (cfv_models.DslModuleInput) with their definitions, imports, and cross-module references via cfv_designs.ModuleRegistryService."
    priority: "Critical"
    status: "Accepted"
    fulfills_part_of: [cfv_overview.CorePurpose]
    applies_policies: [cfv_policies.Arch_ModuleCentric, cfv_policies.Arch_ComponentSchemasUpfront]
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR1"
}

requirement cfv_requirements.FR1_1_InitialModuleLoading {
    id: "CFV_REQ_FR1_1_001"
    title: "FR1.1: Initial Module Loading"
    part_of: cfv_requirements.FR1_ModuleManagement
    description: "Load and parse modules provided via props.initialModules on component mount, storing them as cfv_models.DslModuleRepresentation instances."
    priority: "Critical"
    status: "Accepted"
    acceptance_criteria: [
        "Given props.initialModules contains valid cfv_models.DslModuleInput entries,",
        "Then each module should be parsed and stored as cfv_models.DslModuleRepresentation.",
        "And parsing errors should be captured in the DslModuleRepresentation.errors field.",
        "And successfully parsed modules should have status 'loaded'.",
        "And failed modules should have status 'error' with detailed error information."
    ]
}

requirement cfv_requirements.FR1_2_OnDemandModuleLoading {
    id: "CFV_REQ_FR1_2_001"
    title: "FR1.2: On-Demand Module Loading"
    part_of: cfv_requirements.FR1_ModuleManagement
    description: "Load additional modules on-demand via props.requestModule when referenced by imports or navigation actions."
    priority: "High"
    status: "Accepted"
    acceptance_criteria: [
        "Given a module references another module via imports that is not yet loaded,",
        "Then props.requestModule should be called with the referenced module's FQN.",
        "And the loading process should be tracked with appropriate status updates in cfv_models.DslModuleRepresentation.status.",
        "And loading failures should be handled gracefully with error reporting via props.onModuleLoadError."
    ]
}

requirement cfv_requirements.FR2_GraphDataGeneration {
    id: "CFV_REQ_FR2_001"
    title: "FR2: Graph Data Generation"
    description: "Transform parsed DSL data into React Flow nodes and edges via cfv_designs.GraphBuilderService, supporting both System Overview and Flow Detail views with trace overlays and enhanced edge types."
    priority: "Critical"
    status: "Accepted"
    fulfills_part_of: [cfv_overview.CorePurpose]
    applies_policies: [cfv_policies.Arch_TraceOverlaysStateDriven, cfv_policies.Arch_SubflowsNavigableNodes]
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR2 & cfv_consumer_directives.GraphVisualization"
}

requirement cfv_requirements.FR2_1_SystemOverviewGeneration {
    id: "CFV_REQ_FR2_1_001"
    title: "FR2.1: System Overview Graph Generation"
    part_of: cfv_requirements.FR2_GraphDataGeneration
    description: "Generate system-level graph showing flows as nodes (cfv_models.SystemGraphNodeData) with trigger sources and invocation relationships (cfv_models.SystemEdgeData)."
    priority: "High"
    status: "Accepted"
    acceptance_criteria: [
        "Given multiple loaded modules with flows,",
        "Then a system overview graph should be generated showing each flow as a node.",
        "And external trigger sources should be represented as separate nodes.",
        "And sub-flow invocation relationships should be shown as edges between flow nodes.",
        "And the graph should use cfv_models.SystemGraphNodeData and cfv_models.SystemEdgeData structures."
    ]
}

requirement cfv_requirements.FR2_2_FlowDetailViewNodeGeneration {
    id: "CFV_REQ_FR2_2_001"
    title: "FR2.2: Flow Detail View Node Generation"
    part_of: cfv_requirements.FR2_GraphDataGeneration
    description: "Generate Trigger (cfv_models.TriggerEntryPointNodeData), Step (cfv_models.StepNodeData), and Sub-flow Invoker (cfv_models.SubFlowInvokerNodeData) nodes for Flow Detail View. Node data must include: DSL object, resolvedComponentFqn, componentSchema, contextVarUsages, potential validation errors (node.data.error). In 'trace' or 'test_result' mode, or during streaming execution, node data must also include executionStatus, executionDurationMs, executionInputData, executionOutputData from the provided trace/test result or stream."
    priority: "Critical"
    status: "Accepted"
    acceptance_criteria: [
        "Given a flow is selected for detail view,",
        "Then trigger, step, and sub-flow invoker nodes should be generated with appropriate data structures.",
        "And each node should include resolved component information and schema references.",
        "And context variable usages should be identified using props.parseContextVariables.",
        "And trace data should be overlaid when available in trace or test_result modes or via streaming updates."
    ]
}

requirement cfv_requirements.FR2_3_FlowDetailViewEdgeGeneration {
    id: "CFV_REQ_FR2_3_001"
    title: "FR2.3: Flow Detail View Edge Generation with Enhanced Types"
    part_of: cfv_requirements.FR2_GraphDataGeneration
    description: "Generate edges (cfv_models.FlowEdgeData) with distinct `dependencyType` based on DSL: 'dataDependency' (from inputs_map), 'executionOrderDependency' (from run_after), 'errorRouting' (from outputs_map), and 'controlFlow' (implicit). In 'trace' or 'test_result' mode, or during streaming, edges must be marked with 'isExecutedPath' if traversed."
    priority: "Critical"
    status: "Accepted"
    source: "FR2, cfv_consumer_directives.GraphVisualization"
    acceptance_criteria: [
        "Given a flow with steps having inputs_map, run_after, and outputs_map configurations,",
        "Then appropriate edges with distinct `dependencyType` should be generated.",
        "And edges should use cfv_models.FlowEdgeData structure with proper type classification.",
        "And execution path information should be included when trace data is available or streamed."
    ]
}

requirement cfv_requirements.FR3_GraphRendering_ConsumerProvided {
    id: "CFV_REQ_FR3_001"
    title: "FR3: Graph Rendering (Consumer Provided)"
    description: "Delegate actual rendering of nodes and edges to consumer-provided React components via props.customNodeTypes and props.customEdgeTypes, following guidance in cfv_consumer_directives.dspec.md."
    priority: "Critical"
    status: "Accepted"
    fulfills_part_of: [cfv_overview.CorePurpose]
    applies_policies: [cfv_policies.Arch_ExternalizeVisualsAndBehavior]
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR3"
    acceptance_criteria: [
        "Given props.customNodeTypes and props.customEdgeTypes are provided,",
        "Then the library should use these custom components for rendering graph elements.",
        "And the library should pass appropriate data structures (cfv_models.BaseNodeData derivatives, cfv_models.FlowEdgeData, etc.) to these components.",
        "And custom renderers should receive all necessary data for visual styling and interaction as per cfv_consumer_directives."
    ]
}

requirement cfv_requirements.FR4_NavigationAndInteraction {
    id: "CFV_REQ_FR4_001"
    title: "FR4: Navigation and Interaction"
    description: "Manage navigation state (cfv_designs.NavigationStateService) and element selection (cfv_designs.SelectionService) with appropriate callbacks to the host application. Includes SubFlowInvoker double-click navigation and System Overview node navigation."
    priority: "High"
    status: "Accepted"
    fulfills_part_of: [cfv_overview.CorePurpose]
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR4, FR14_SystemOverviewNavigation, cfv_consumer_directives.SubFlowInvokerNavigation"
    acceptance_criteria: [
        "Given user interactions with graph elements or navigation controls,",
        "Then appropriate navigation state changes should be managed internally.",
        "And props.onViewChange should be called when navigation state changes.",
        "And props.onElementSelect should be called when elements are selected.",
        "And double-clicking a SubFlowInvoker node navigates to the invoked flow.",
        "And clicking a flow node in System Overview navigates to its Flow Detail view."
    ]
}

requirement cfv_requirements.FR5_InformationDisplay_ConsolidatedInspector {
    id: "CFV_REQ_FR5_001"
    title: "FR5: Information Display & Inspection (Consolidated Inspector Tabs)"
    description: "The library manages Right Sidebar visibility and the `selectedElement` state (cfv_models.SelectedElement). Consumer-provided render functions (props.renderInspectorSourceTab, props.renderInspectorPropertiesTab, props.renderInspectorDebugTestTab) populate the content of the respective tabs. The library passes appropriate data models (cfv_models.InspectorSourceTabProps, cfv_models.InspectorPropertiesTabProps, cfv_models.InspectorDebugTestTabProps) containing the selected element's data, access to the cfv_models.IModuleRegistry, and relevant action callbacks to these render functions."
    priority: "Critical"
    status: "Accepted"
    fulfills_part_of: [cfv_overview.CorePurpose, cfv_requirements.UILayout_RightSidebar_ConsolidatedInspector]
    applies_policies: [cfv_policies.Arch_ExternalizeVisualsAndBehavior]
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR5 & Consolidated Tab Architecture"
    acceptance_criteria: [
        "Given an element is selected,",
        "Then the Right Sidebar should be visible with appropriate tab content based on cfv_designs.InspectorTabSelectionBehavior.",
        "And consumer render functions should receive correctly populated props (cfv_models.InspectorSourceTabProps, cfv_models.InspectorPropertiesTabProps, cfv_models.InspectorDebugTestTabProps).",
        "And each tab should have access to the module registry for data resolution and actions for interactions."
    ]
}

requirement cfv_requirements.FR6_Layout_ELKjs {
    id: "CFV_REQ_FR6_001"
    title: "FR6: Layout (ELK.js with Enhanced Spacing)"
    description: "Provide automatic graph layout using ELK.js via cfv_designs.LayoutService with configurable algorithms and spacing options (cfv_models.LayoutOptions). Layout should default to left-to-right for flows and handle wide nodes gracefully with enhanced spacing compensation."
    priority: "High"
    status: "Accepted"
    fulfills_part_of: [cfv_overview.CorePurpose]
    applies_policies: [cfv_policies.Arch_ReactFlowElkjsFoundation]
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR6 and cfv_internal_code.LayoutServiceWidthCompensation"
    acceptance_criteria: [
        "Given graph data is generated,",
        "Then ELK.js should be used to automatically position nodes and route edges.",
        "And layout options should be configurable via props.elkOptions.",
        "And Flow Detail views should default to a 'RIGHT' (left-to-right) direction.",
        "And System Overview layout should position triggers appropriately relative to flows.",
        "And layout should incorporate width compensation for wide nodes to prevent overlaps."
    ]
}

requirement cfv_requirements.FR7_Editing_ViaPropertiesTab {
    id: "CFV_REQ_FR7_001"
    title: "FR7: Editing via Properties Tab (V1 Scope)"
    description: "If props.isEditingEnabled is true, the consumer-rendered 'Properties' tab (props.renderInspectorPropertiesTab) allows editing of an element's `config` block. The tab receives cfv_models.InspectorPropertiesActions including `requestSave(newConfigValue, pathToConfig)`. Invoking `requestSave` triggers internal YAML reconstruction (cfv_designs.YamlReconstructionService) and then calls props.onSaveModule with cfv_models.SaveModulePayload."
    priority: "High"
    status: "Accepted"
    fulfills_part_of: [cfv_overview.CorePurpose, cfv_requirements.UILayout_RightSidebar_ConsolidatedInspector]
    applies_policies: [cfv_policies.Arch_EditingTradeoffsV1]
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR7 & Consolidated Tab Architecture"
    acceptance_criteria: [
        "Given props.isEditingEnabled is true and a configurable element is selected,",
        "Then the Properties tab should allow schema-driven editing of the element's configuration.",
        "And calling actions.requestSave should trigger YAML reconstruction and props.onSaveModule.",
        "And the save operation should preserve semantic correctness of the DSL structure.",
        "And save failures should be handled gracefully with appropriate error feedback."
    ]
}

requirement cfv_requirements.FR8_Debugging_ViaDebugTestTab {
    id: "CFV_REQ_FR8_001"
    title: "FR8: Debugging & Trace Visualization via Debug & Test Tab"
    description: "The consumer-rendered 'Debug & Test' tab (props.renderInspectorDebugTestTab) provides comprehensive debugging capabilities. It receives cfv_models.UnifiedDebugTestActions to initiate server-side streaming executions. When props.traceData (cfv_models.FlowExecutionTrace) is provided (either from batch load or updated by streaming), graph elements are overlaid with execution status/data. The tab displays detailed trace information (step I/O, logs, errors). The Left Sidebar can list historical runs (props.fetchTraceList, props.renderFlowRunListItem)."
    priority: "Critical"
    status: "Accepted"
    fulfills_part_of: [cfv_overview.CorePurpose, cfv_requirements.UILayout_RightSidebar_ConsolidatedInspector, cfv_requirements.FR12_EnhancedStreamingExecution]
    applies_policies: [cfv_policies.Arch_TraceOverlaysStateDriven, cfv_policies.Arch_StreamingTraceUpdates]
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR8 & Consolidated Tab Architecture & FR12"
    acceptance_criteria: [
        "Given the Debug & Test tab is active,",
        "Then consumer can use actions from cfv_models.UnifiedDebugTestActions to initiate flow/step execution.",
        "And execution triggers server-side streaming, with UI updates (node status, data) driven by received events.",
        "And if props.traceData is provided (batch or from stream), graph elements display execution overlays.",
        "And the Debug & Test tab allows inspection of step I/O, logs, and errors from props.traceData.",
        "And historical trace lists are available when props.fetchTraceList is provided."
    ]
}

requirement cfv_requirements.FR9_PropertyTesting_ViaDebugTestTab {
    id: "CFV_REQ_FR9_001"
    title: "FR9: Property Testing via Debug & Test Tab"
    description: "The consumer-rendered 'Debug & Test' tab (props.renderInspectorDebugTestTab) provides an interface for property testing. It receives cfv_models.UnifiedDebugTestActions (including `runTestCase` and `generateTestCaseTemplate`). Consumers can build UI to define/manage cfv_models.FlowTestCase instances. Execution is triggered via actions.runTestCase (which calls props.onRunTestCase, leading to server-side streaming). The resulting cfv_models.TestRunResult (including `assertionResults` and optionally a `trace`) is passed back via props.testResultData for display."
    priority: "High"
    status: "Accepted"
    fulfills_part_of: [cfv_overview.CorePurpose, cfv_requirements.UILayout_RightSidebar_ConsolidatedInspector, cfv_requirements.FR12_EnhancedStreamingExecution]
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR9 & Consolidated Tab Architecture & FR12"
    acceptance_criteria: [
        "Given the Debug & Test tab is active,",
        "Then it should provide interfaces for test case creation (using `generateTestCaseTemplate`) and management.",
        "And test execution should be triggered via actions.runTestCase, leading to server-side streaming.",
        "And test results (props.testResultData) should be displayed with detailed assertion outcomes and linked trace.",
        "And test execution should update graph overlays based on the streamed trace."
    ]
}

requirement cfv_requirements.FR10_StateSynchronization {
    id: "CFV_REQ_FR10_001"
    title: "FR10: State Synchronization"
    description: "Maintain synchronization between internal Jotai state and external props, ensuring reactive updates and consistent state management across the library."
    priority: "High"
    status: "Accepted"
    fulfills_part_of: [cfv_overview.CorePurpose]
    applies_policies: [cfv_policies.Arch_JotaiStateManagement, cfv_policies.NFRs_General.NFR4_Reactivity]
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR10"
    acceptance_criteria: [
        "Given props change (e.g., props.mode, props.traceData),",
        "Then internal state should update reactively.",
        "And UI should re-render appropriately to reflect state changes.",
        "And state updates should be efficient and not cause unnecessary re-renders.",
        "And external callbacks should be invoked when internal state changes affect external concerns."
    ]
}

requirement cfv_requirements.FR11_ErrorHandlingAndFeedback {
    id: "CFV_REQ_FR11_001"
    title: "FR11: Error Handling and Feedback"
    description: "Provide comprehensive error handling for module loading, parsing, validation, execution (client and server-side), and runtime errors with clear user feedback and recovery options."
    priority: "High"
    status: "Accepted"
    fulfills_part_of: [cfv_overview.CorePurpose]
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR11 & FR12"
    acceptance_criteria: [
        "Given various error conditions (module loading, parsing, validation, execution stream errors),",
        "Then appropriate error messages should be displayed to users contextually (sidebar, inspector, node).",
        "And errors should be categorized by severity and type.",
        "And recovery options (e.g., retry for stream connection) should be provided where possible.",
        "And error states should not prevent the rest of the application from functioning."
    ]
}

requirement cfv_requirements.FR12_EnhancedStreamingExecution {
    id: "CFV_REQ_FR12" // Keep original ID from source file
    title: "Enhanced Streaming Execution with Advanced Dependency Resolution"
    description: "The system must provide sophisticated server-side flow execution with real-time streaming updates (SSE), advanced dependency analysis (cycle detection as warnings, layered execution, parallel processing), robust expression parsing, and comprehensive client-side handling for UI updates and error recovery."
    priority: "Critical" // Upgraded from High due to its impact
    category: "Functional"
    source: "Enhanced streaming execution implementation with advanced dependency resolution"
    acceptance_criteria: [
        "Server execution engine correctly analyzes step dependencies and creates execution order layers.",
        "Circular dependencies are detected and reported as warnings via the stream without halting execution if fallback strategies apply.",
        "Complex input mapping expressions with multiple step references are parsed and resolved correctly by the server.",
        "Steps execute in parallel on the server within dependency layers when constraints are satisfied.",
        "Client receives real-time SSE events (cfv_models.StreamingExecutionEvent types) and updates UI (node statuses, trace data) accordingly.",
        "React components (nodes, inspector) re-render correctly based on new object references created by the client stream handler.",
        "Client handles SSE connection failures gracefully with automatic reconnection attempts (exponential backoff).",
        "Upon 'execution.started' event, all flow steps are visually marked as 'PENDING' on the client.",
        "Server execution uses fallback strategies (e.g., independent step execution) to attempt deadlock resolution.",
        "A comprehensive execution trace (cfv_models.FlowExecutionTrace) is available on the client after execution completion or failure, reflecting the streamed events."
    ]
}

requirement cfv_requirements.FR23_ClientCodeCleanupAndSimplification {
    id: "CFV_REQ_FR23" // Keep original ID
    title: "Client Code Cleanup and Architecture Simplification"
    description: "Simplify client-side architecture by removing redundant full execution simulation logic after implementing server-side streaming execution (FR12), while maintaining essential client-side debugging support (e.g., input data resolution for forms)."
    priority: "Medium"
    category: "Technical Debt"
    source: "Client code cleanup after server-side streaming execution implementation"
    acceptance_criteria: [
        "Client-side services (e.g., cfv_designs.FlowSimulationService) no longer contain logic for full, progressive flow execution simulation.",
        "Client-side simulation is focused on input data resolution (e.g., for cfv_models.UnifiedDebugTestActions.resolveStepInputData) and single-step mock execution if needed for UI previews.",
        "All primary debug/test execution paths in cfv_models.UnifiedDebugTestActions trigger server-side streaming.",
        "No duplicate execution state management or trace construction logic exists on the client; state is primarily derived from server-streamed events.",
        "Design specifications (e.g., cfv_designs.FlowSimulationService) accurately reflect the simplified client architecture.",
        "Public APIs remain stable or have clear deprecation paths if changes are unavoidable."
    ]
}