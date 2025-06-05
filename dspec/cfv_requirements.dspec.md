// cfv_requirements.dspec
// Refined according to DefinitiveSpec methodology with qualified names and stable IDs
// Defines functional requirements for the CascadeFlowVisualizer library.

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
    title: "Left Sidebar: Module and Flow List"
    description: "The Left Sidebar displays a hierarchical list of loaded modules (cfv_models.DslModuleRepresentation) and their contained flows, with status indicators and navigation capabilities."
    priority: "High"
    status: "Accepted"
    fulfills_part_of: [cfv_requirements.UILayout_IdeLikeStructure]
    source: "CascadeFlowVisualizer Library Specification, Section III.B"
    acceptance_criteria: [
        "Given modules are loaded via props.initialModules or props.requestModule,",
        "Then the Left Sidebar should display a list of modules with their FQNs.",
        "And each module should show its loading status (cfv_models.DslModuleStatusEnum).",
        "And flows within each module should be listed as navigable items.",
        "And clicking on a flow should trigger navigation to Flow Detail view for that flow.",
        "And error states should be clearly indicated with appropriate visual styling."
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
        "And selecting a trace should trigger appropriate callbacks to load trace data.",
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
        "Then the Main Canvas should display the flow's internal structure (trigger, steps, data/control flow).",
        "And all graph elements should be interactive (selectable, potentially draggable).",
        "And the graph should be automatically laid out using ELK.js via cfv_designs.LayoutService.",
        "And trace overlays should be applied when props.mode is 'trace' and props.traceData is provided."
    ]
}

requirement cfv_requirements.UILayout_RightSidebar_ConsolidatedInspector {
    id: "CFV_REQ_UI_RSI_001"
    title: "Right Sidebar: Consolidated Inspector & Editor"
    description: `
        The Right Sidebar provides context-sensitive information and interaction capabilities for the currently selected element.
        It features three primary tabs: Source, Properties, and Debug & Test.
        The content of these tabs is rendered by consumer-provided functions passed via props
        (props.renderInspectorSourceTab, props.renderInspectorPropertiesTab, props.renderInspectorDebugTestTab),
        to whom the library passes relevant data and action callbacks (cfv_models.InspectorSourceTabProps, cfv_models.InspectorPropertiesTabProps, cfv_models.InspectorDebugTestTabProps).
    `
    priority: "High"
    status: "Accepted"
    fulfills_part_of: [cfv_requirements.UILayout_IdeLikeStructure]
    applies_policies: [cfv_policies.Arch_ExternalizeVisualsAndBehavior]
    source: "CascadeFlowVisualizer Library Specification, Section III.C & Consolidated Tab Architecture Directive"
    acceptance_criteria: [
        "Given the visualizer is rendered and an element (e.g., a step node) is selected,",
        "Then the Right Sidebar should be visible.",
        "And the 'Source' tab should be available and active by default, displaying the module's YAML content and highlighting the selected element.",
        "And if the selected element has configurable properties (e.g., a step's 'config' block), the 'Properties' tab should be available, allowing schema-driven form-based editing of these properties.",
        "And if a flow, trigger, or step is selected, the 'Debug & Test' tab should be available, providing interfaces for flow simulation, step input/output inspection, and test case management."
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
        "Then appropriate error messages should be displayed in the Left Sidebar module list.",
        "And detailed error information should be available in the Right Sidebar when the module is selected.",
        "And errors should be visually distinguished from normal content with appropriate styling.",
        "And loading states should be clearly indicated during asynchronous operations."
    ]
}

// --- NEW LAYOUT AND STYLING REQUIREMENTS ---

requirement cfv_requirements.FR12_LeftToRightFlowLayout {
    title: "FR12: Left-to-Right Flow Layout"
    description: "Flow Detail graphs must render with left-to-right orientation by default. Triggers appear on the left, steps flow from left to right, and final outputs appear on the right."
    priority: "High"
    status: "Accepted"
    source: "User Requirements - Enhanced Layout"
    acceptance_criteria: [
        "Given a flow is displayed in Flow Detail view",
        "Then the trigger node should appear on the left side",
        "And step nodes should be arranged from left to right in execution order",
        "And the layout should use ELK.js with 'RIGHT' direction configuration"
    ]
}

requirement cfv_requirements.FR13_ImprovedNodeStyling {
    title: "FR13: Improved Node Styling and Background Handling"
    description: "Node components must properly handle styling so that backgrounds are contained within node boundaries and visual elements are properly positioned."
    priority: "High"
    status: "Accepted"
    source: "User Requirements - Enhanced Styling"
    acceptance_criteria: [
        "Given a node is rendered",
        "Then the background styling should be contained within the node boundaries",
        "And text and visual elements should be properly positioned within the node",
        "And node borders and shadows should render correctly"
    ]
}

requirement cfv_requirements.FR14_SystemOverviewNavigation {
    title: "FR14: System Overview Flow Navigation"
    description: "In System Overview mode, clicking on a flow node must navigate to that flow's Detail View. The navigation should update the current view mode and selected flow."
    priority: "High"
    status: "Accepted"
    source: "User Requirements - Enhanced Navigation"
    acceptance_criteria: [
        "Given the visualizer is in System Overview mode",
        "When a flow node is clicked",
        "Then the visualizer should switch to Flow Detail mode",
        "And the clicked flow should be displayed in detail",
        "And the navigation state should be updated accordingly"
    ]
}

requirement cfv_requirements.FR15_SystemOverviewLeftToRightLayout {
    title: "FR15: System Overview Left-to-Right Layout"
    description: "System Overview graphs must render with left-to-right orientation. Triggers should appear on the left/top, flows in the center, and invocation relationships should flow from left to right."
    priority: "High"
    status: "Accepted"
    source: "User Requirements - Enhanced Layout"
    acceptance_criteria: [
        "Given the System Overview is displayed",
        "Then trigger nodes should appear on the left or top",
        "And flow nodes should be arranged in the center",
        "And invocation edges should flow from left to right",
        "And the overall layout should be left-to-right oriented"
    ]
}

requirement cfv_requirements.FR16_ComplexExampleSupport {
    title: "FR16: Complex Example Support (Casino Platform)"
    description: "The visualizer must support complex, real-world examples like a casino platform (stake.com style) with multiple interconnected flows, external integrations, and sophisticated business logic."
    priority: "Medium"
    status: "Accepted"
    source: "User Requirements - Complex Examples"
    acceptance_criteria: [
        "Given a complex casino platform DSL is loaded",
        "Then all flows should be properly parsed and displayed",
        "And complex component relationships should be visualized correctly",
        "And the system should handle multiple modules with imports",
        "And performance should remain acceptable with 50+ nodes"
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
        "And the loading process should be tracked with appropriate status updates.",
        "And loading failures should be handled gracefully with error reporting via props.onModuleLoadError."
    ]
}

requirement cfv_requirements.FR2_GraphDataGeneration {
    id: "CFV_REQ_FR2_001"
    title: "FR2: Graph Data Generation"
    description: "Transform parsed DSL data into React Flow nodes and edges via cfv_designs.GraphBuilderService, supporting both System Overview and Flow Detail views with trace overlays."
    priority: "Critical"
    status: "Accepted"
    fulfills_part_of: [cfv_overview.CorePurpose]
    applies_policies: [cfv_policies.Arch_TraceOverlaysStateDriven, cfv_policies.Arch_SubflowsNavigableNodes]
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR2"
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
    description: "Generate Trigger (cfv_models.TriggerEntryPointNodeData), Step (cfv_models.StepNodeData), and Sub-flow Invoker (cfv_models.SubFlowInvokerNodeData) nodes for Flow Detail View. Node data must include: DSL object, resolvedComponentFqn, componentSchema, contextVarUsages, potential validation errors (node.data.error). In 'trace' or 'test_result' mode, node data must also include executionStatus, executionDurationMs, executionInputData, executionOutputData from the provided trace/test result."
    priority: "Critical"
    status: "Accepted"
    acceptance_criteria: [
        "Given a flow is selected for detail view,",
        "Then trigger, step, and sub-flow invoker nodes should be generated with appropriate data structures.",
        "And each node should include resolved component information and schema references.",
        "And context variable usages should be identified using props.parseContextVariables.",
        "And trace data should be overlaid when available in trace or test_result modes."
    ]
}

requirement cfv_requirements.FR2_3_FlowDetailViewEdgeGeneration {
    id: "CFV_REQ_FR2_3_001"
    title: "FR2.3: Flow Detail View Edge Generation"
    part_of: cfv_requirements.FR2_GraphDataGeneration
    description: "Generate 'dataFlow' (from inputs_map) and 'controlFlow' (from run_after) edges (cfv_models.FlowEdgeData). In 'trace' or 'test_result' mode, edges must be marked with 'isExecutedPath' if traversed."
    priority: "High"
    status: "Accepted"
    acceptance_criteria: [
        "Given a flow with steps that have inputs_map and run_after configurations,",
        "Then appropriate dataFlow and controlFlow edges should be generated.",
        "And edges should use cfv_models.FlowEdgeData structure with proper type classification.",
        "And execution path information should be included when trace data is available."
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
        "And the library should pass appropriate data structures (cfv_models.BaseNodeData, cfv_models.FlowEdgeData, etc.) to these components.",
        "And custom renderers should receive all necessary data for visual styling and interaction."
    ]
}

requirement cfv_requirements.FR4_NavigationAndInteraction {
    id: "CFV_REQ_FR4_001"
    title: "FR4: Navigation and Interaction"
    description: "Manage navigation state (cfv_designs.NavigationStateService) and element selection (cfv_designs.SelectionService) with appropriate callbacks to the host application."
    priority: "High"
    status: "Accepted"
    fulfills_part_of: [cfv_overview.CorePurpose]
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR4"
    acceptance_criteria: [
        "Given user interactions with graph elements or navigation controls,",
        "Then appropriate navigation state changes should be managed internally.",
        "And props.onViewChange should be called when navigation state changes.",
        "And props.onElementSelect should be called when elements are selected.",
        "And navigation should support both System Overview and Flow Detail views."
    ]
}

requirement cfv_requirements.FR5_InformationDisplay_ConsolidatedInspector {
    id: "CFV_REQ_FR5_001"
    title: "FR5: Information Display & Inspection (Consolidated Inspector Tabs)"
    description: "The library manages Right Sidebar visibility and the `selectedElement` state (cfv_models.SelectedElement). Consumer-provided render functions (props.renderInspectorSourceTab, props.renderInspectorPropertiesTab, props.renderInspectorDebugTestTab) populate the content of the respective tabs. The library passes appropriate data models (cfv_models.InspectorSourceTabProps, cfv_models.InspectorPropertiesTabProps, cfv_models.InspectorDebugTestTabProps) containing the selected element's data, access to the cfv_models.IModuleRegistry, and relevant action callbacks to these render functions."
    priority: "Critical"
    status: "Accepted"
    fulfills_part_of: [cfv_overview.CorePurpose]
    applies_policies: [cfv_policies.Arch_ExternalizeVisualsAndBehavior]
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR5 & Consolidated Tab Architecture"
    acceptance_criteria: [
        "Given an element is selected,",
        "Then the Right Sidebar should be visible with appropriate tab content.",
        "And consumer render functions should receive properly structured props with element data and actions.",
        "And the library should manage tab visibility and switching logic.",
        "And each tab should have access to the module registry for data resolution."
    ]
}

requirement cfv_requirements.FR6_Layout_ELKjs {
    id: "CFV_REQ_FR6_001"
    title: "FR6: Layout (ELK.js)"
    description: "Provide automatic graph layout using ELK.js via cfv_designs.LayoutService with configurable algorithms and spacing options (cfv_models.LayoutOptions)."
    priority: "High"
    status: "Accepted"
    fulfills_part_of: [cfv_overview.CorePurpose]
    applies_policies: [cfv_policies.Arch_ReactFlowElkjsFoundation]
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR6"
    acceptance_criteria: [
        "Given graph data is generated,",
        "Then ELK.js should be used to automatically position nodes and route edges.",
        "And layout options should be configurable via props.elkOptions.",
        "And the layout should be optimized for readability and flow comprehension.",
        "And layout should handle both System Overview and Flow Detail graph types appropriately."
    ]
}

requirement cfv_requirements.FR7_Editing_ViaPropertiesTab {
    id: "CFV_REQ_FR7_001"
    title: "FR7: Editing via Properties Tab (V1 Scope)"
    description: "If props.isEditingEnabled is true, the consumer-rendered 'Properties' tab (props.renderInspectorPropertiesTab) should allow editing of an element's `config` block (or other designated editable parts of its `dslObject`). The tab receives cfv_models.InspectorPropertiesActions which includes `requestSave(newConfigValue, pathToConfig)`. Invoking `requestSave` triggers internal YAML reconstruction (cfv_designs.YamlReconstructionService) and then calls props.onSaveModule with cfv_models.SaveModulePayload."
    priority: "High"
    status: "Accepted"
    fulfills_part_of: [cfv_overview.CorePurpose]
    applies_policies: [cfv_policies.Arch_EditingTradeoffsV1]
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR7 & Consolidated Tab Architecture"
    acceptance_criteria: [
        "Given props.isEditingEnabled is true and a configurable element is selected,",
        "Then the Properties tab should provide editing capabilities for the element's configuration.",
        "And calling actions.requestSave should trigger YAML reconstruction and props.onSaveModule.",
        "And the save operation should preserve semantic correctness of the DSL structure.",
        "And save failures should be handled gracefully with appropriate error feedback."
    ]
}

requirement cfv_requirements.FR8_Debugging_ViaDebugTestTab {
    id: "CFV_REQ_FR8_001"
    title: "FR8: Debugging & Trace Visualization via Debug & Test Tab"
    description: "When props.mode is 'trace' and props.traceData (cfv_models.FlowExecutionTrace) is provided, the library enables debugging capabilities. Graph elements are overlaid with execution status/data. The consumer-rendered 'Debug & Test' tab (props.renderInspectorDebugTestTab) receives props.traceData and cfv_models.UnifiedDebugTestActions to display detailed trace information (step I/O, logs, errors) and potentially trigger further debug actions. The Left Sidebar can list historical runs (props.fetchTraceList, props.renderFlowRunListItem)."
    priority: "Critical"
    status: "Accepted"
    fulfills_part_of: [cfv_overview.CorePurpose]
    applies_policies: [cfv_policies.Arch_TraceOverlaysStateDriven]
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR8 & Consolidated Tab Architecture"
    acceptance_criteria: [
        "Given props.mode is 'trace' and props.traceData is provided,",
        "Then graph elements should display execution overlays (status, timing, etc.).",
        "And the Debug & Test tab should provide detailed trace inspection capabilities.",
        "And historical trace lists should be available when props.fetchTraceList is provided.",
        "And trace data should be properly structured and accessible for debugging workflows."
    ]
}

requirement cfv_requirements.FR9_PropertyTesting_ViaDebugTestTab {
    id: "CFV_REQ_FR9_001"
    title: "FR9: Property Testing via Debug & Test Tab"
    description: "When props.mode is 'design' or 'test_result', the consumer-rendered 'Debug & Test' tab (props.renderInspectorDebugTestTab) provides an interface for property testing. It receives cfv_models.UnifiedDebugTestActions (which includes `runTestCase` and `generateTestCaseTemplate`). Consumers can build UI to define/manage cfv_models.FlowTestCase instances. Execution is triggered via actions.runTestCase (which calls props.onRunTestCase). The resulting cfv_models.TestRunResult (including `assertionResults` and optionally a `trace`) is passed back to the tab for display. If props.mode is 'test_result' and props.testResultData is provided, this result is displayed."
    priority: "High"
    status: "Accepted"
    fulfills_part_of: [cfv_overview.CorePurpose]
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR9 & Consolidated Tab Architecture"
    acceptance_criteria: [
        "Given the Debug & Test tab is active,",
        "Then it should provide interfaces for test case creation and management.",
        "And test execution should be triggered via actions.runTestCase calling props.onRunTestCase.",
        "And test results should be displayed with detailed assertion outcomes.",
        "And test result mode should display provided test results when props.testResultData is available."
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
    description: "Provide comprehensive error handling for module loading, parsing, validation, and runtime errors with clear user feedback and recovery options."
    priority: "High"
    status: "Accepted"
    fulfills_part_of: [cfv_overview.CorePurpose]
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR11"
    acceptance_criteria: [
        "Given various error conditions (module loading failures, parsing errors, validation errors),",
        "Then appropriate error messages should be displayed to users.",
        "And errors should be categorized by severity and type.",
        "And recovery options should be provided where possible.",
        "And error states should not prevent the rest of the application from functioning."
    ]
}

requirement cfv_requirements.FR12_SystemOverviewNavigation {
    title: "System Overview Navigation"
    description: "System overview should support navigation to flow detail views when clicking on flow nodes."
    priority: "High"
    category: "Navigation"
    acceptance_criteria: [
        "Clicking on a flow node in system overview navigates to that flow's detail view",
        "Flow nodes in system overview have visual indicators for navigation capability",
        "Navigation preserves current mode and other state appropriately"
    ]
    source: "User feedback - System Overview navigation missing"
}

requirement cfv_requirements.FR13_SystemOverviewLayout {
    title: "System Overview Layout Optimization"
    description: "System overview should use optimized layout with triggers at top, flows in horizontal lines, and cascade positioning for connected flows."
    priority: "High"
    category: "Layout"
    acceptance_criteria: [
        "Flows are arranged horizontally from left to right",
        "Trigger nodes are positioned above their corresponding flow nodes",
        "Connected flows (via SubFlowInvoker) have cascade positioning from top to bottom",
        "Layout algorithm respects trigger-to-flow and flow-to-flow relationships"
    ]
    source: "User feedback - System Overview layout improvements"
}

requirement cfv_requirements.FR14_ModuleListCollapsible {
    title: "Collapsible Module List"
    description: "Module list in left sidebar should be collapsible by default and remove redundant status indicators."
    priority: "Medium"
    category: "UI/UX"
    acceptance_criteria: [
        "Modules are collapsed by default showing only module names",
        "Modules can be expanded to show flows and other details",
        "Remove '✓ Loaded' status indicators",
        "Show only error indicators when modules have parsing errors"
    ]
    source: "User feedback - Left Sidebar improvements"
}

requirement cfv_requirements.FR15_ComponentEditDialog {
    title: "Component Configuration Edit Dialog"
    description: "Clicking on component nodes should open an edit dialog instead of navigating to system overview."
    priority: "High"
    category: "Editing"
    acceptance_criteria: [
        "Clicking on step nodes opens a configuration edit dialog",
        "Edit dialog shows form fields for all configurable component properties",
        "Edit dialog supports saving changes back to the module",
        "SubFlowInvoker nodes should not navigate to system overview when clicked"
    ]
    source: "User feedback - Flow chart node click behavior"
}

requirement cfv_requirements.FR16_DebuggingInterface {
    title: "Debugging Interface"
    description: "Provide a comprehensive debugging interface for trace visualization and analysis."
    priority: "High"
    category: "Debugging"
    acceptance_criteria: [
        "Debugging mode shows execution traces with step-by-step details",
        "Visual indicators for execution status, timing, and data flow",
        "Critical path highlighting for performance analysis",
        "Error details and stack traces for failed executions",
        "Data inspection for inputs and outputs at each step"
    ]
    source: "User feedback - Missing debugging interface"
}

requirement cfv_requirements.FR17_PropertyTestingInterface {
    title: "Property Testing Interface"
    description: "Provide a comprehensive property testing interface with default test cases and execution monitoring."
    priority: "High"
    category: "Testing"
    acceptance_criteria: [
        "Generate default test cases for flows (happy path, error handling, performance)",
        "Test case editor with input data templates and assertions",
        "Test execution with step-by-step monitoring",
        "Output log review showing status and results for each step",
        "Expected vs actual output comparison for test validation",
        "Integration with standard library APIs for tracing and monitoring"
    ]
    source: "User feedback - Missing property testing interface"
}

requirement cfv_requirements.FR18_YAMLParsingRobustness {
    title: "YAML Parsing Robustness"
    description: "YAML parsing should handle escape sequences and complex patterns correctly."
    priority: "High"
    category: "Parsing"
    acceptance_criteria: [
        "Properly handle regex patterns with escape sequences in YAML",
        "Support complex JSON schema patterns in component configurations",
        "Provide clear error messages for YAML parsing failures",
        "Graceful handling of malformed YAML content"
    ]
    source: "User feedback - YAML parsing errors with escape sequences"
}

requirement cfv_requirements.FR19_ConsolidatedInspectorTabs {
    title: "FR19: Consolidated Inspector Tab Architecture"
    description: "Implement consolidated inspector tabs with better separation of concerns between component-level and flow-level functionality."
    priority: "High"
    status: "Accepted"
    source: "Architectural improvement - consolidating overlapping inspector functionality"
    
    sub_requirements: [
        cfv_requirements.FR19_1_EnableSourceTabRendering,
        cfv_requirements.FR19_2_EnablePropertiesTabRendering,
        cfv_requirements.FR19_3_EnableDebugTestTabRendering
    ]
}

requirement cfv_requirements.FR19_1_EnableSourceTabRendering {
    id: "CFV_REQ_FR19_1_001"
    title: "FR19.1: Enable Source Tab Rendering"
    part_of: cfv_requirements.FR19_ConsolidatedInspectorTabs
    description: "The library must provide the necessary data and context to the props.renderInspectorSourceTab function to enable the consumer to render a full module YAML source view with selected element highlighting. This includes providing selectedElement (cfv_models.SelectedElement) and an cfv_models.IModuleRegistry instance."
    priority: "High"
    status: "Accepted"
    source: "Inspector tab consolidation directive"
    acceptance_criteria: [
        "When an element is selected, props.renderInspectorSourceTab is called with valid selectedElement and moduleRegistry.",
        "The selectedElement.moduleFqn can be used with moduleRegistry.getLoadedModule to retrieve the cfv_models.DslModuleRepresentation containing rawContent and parsedContent.",
        "The selectedElement.data.dslObject provides the specific DSL snippet of the selected element for highlighting purposes."
    ]
}

requirement cfv_requirements.FR19_2_EnablePropertiesTabRendering {
    id: "CFV_REQ_FR19_2_001"
    title: "FR19.2: Enable Properties Tab Rendering for Configuration Editing"
    part_of: cfv_requirements.FR19_ConsolidatedInspectorTabs
    description: "The library must provide necessary data and actions to props.renderInspectorPropertiesTab for schema-driven editing of a selected element's `config` block. This includes selectedElement (with dslObject and componentSchema), cfv_models.IModuleRegistry, and cfv_models.InspectorPropertiesActions (containing `requestSave`)."
    priority: "High"
    status: "Accepted"
    source: "Inspector tab consolidation directive"
    acceptance_criteria: [
        "When a configurable element (e.g., step node) is selected, props.renderInspectorPropertiesTab is called with valid selectedElement (containing dslObject.config and componentSchema.configSchema), actions, and moduleRegistry.",
        "Calling actions.requestSave(newConfig, pathToConfig) triggers the library's internal save workflow (YAML reconstruction and props.onSaveModule)."
    ]
}

requirement cfv_requirements.FR19_3_EnableDebugTestTabRendering {
    id: "CFV_REQ_FR19_3_001"
    title: "FR19.3: Enable Debug & Test Tab Rendering with Comprehensive Actions"
    part_of: cfv_requirements.FR19_ConsolidatedInspectorTabs
    description: "The library must provide necessary data and actions to props.renderInspectorDebugTestTab for flow simulation, step input/output inspection, and test case management. This includes currentFlowFqn, selectedElement (optional), traceData (if applicable), testResultData (if applicable), cfv_models.IModuleRegistry, and cfv_models.UnifiedDebugTestActions."
    priority: "Critical"
    status: "Accepted"
    source: "Inspector tab consolidation directive"
    acceptance_criteria: [
        "When a flow or executable element is selected, props.renderInspectorDebugTestTab is called with appropriate context and a comprehensive cfv_models.UnifiedDebugTestActions object.",
        "The actions.simulateFlowExecution can be called to get a cfv_models.FlowSimulationResult.",
        "The actions.resolveStepInputData can be called to get cfv_models.ResolvedStepInput for a step.",
        "The actions.runDebugStep can be called to execute a single step.",
        "The actions.runTestCase can be called to execute a cfv_models.FlowTestCase."
    ]
}

requirement cfv_requirements.FR20_LegacyTabDeprecation {
    title: "FR20: Legacy Inspector Tab Deprecation"
    description: "Deprecate overlapping inspector tabs while maintaining backward compatibility."
    priority: "Medium"
    status: "Accepted"
    source: "Architectural improvement - removing redundant functionality"
    acceptance_criteria: [
        "Mark legacy tabs as deprecated in documentation",
        "Maintain backward compatibility for existing implementations",
        "Provide clear migration path to new consolidated tabs",
        "Add deprecation warnings in development mode",
        "Plan removal timeline for legacy tabs"
    ]
    deprecated_tabs: [
        "renderInspectorDataIOTab - replaced by renderInspectorDataFlowTab",
        "renderInspectorContextVarsTab - functionality moved to Properties tab",
        "renderInspectorTestDefinitionTab - replaced by renderInspectorTestingTab", 
        "renderInspectorAssertionResultsTab - functionality moved to Testing tab"
    ]
}

requirement cfv_requirements.FR21_ImprovedInspectorArchitecture {
    title: "FR21: Improved Inspector Tab Architecture"
    description: "Implement improved inspector tab architecture with Source as default, Properties with schema-driven forms, and unified Debug & Test functionality."
    priority: "High"
    status: "Accepted"
    source: "User Requirements - Inspector improvements"
    
    sub_requirements: [
        cfv_requirements.FR21_1_SourceTabAsDefault,
        cfv_requirements.FR21_2_SyntaxHighlightedYAML,
        cfv_requirements.FR21_3_SchemaBasedForms,
        cfv_requirements.FR21_4_UnifiedDebugTest
    ]
}
    requirement cfv_requirements.FR21_1_SourceTabAsDefault {
        title: "FR21.1: Source Tab as Default Active Tab"
        part_of: cfv_requirements.FR21_ImprovedInspectorArchitecture
        description: "Source tab should be the default active tab when an element is selected, showing full module YAML context."
        priority: "High"; status: "Accepted"; source: "Inspector tab improvements";
        acceptance_criteria: [
            "Source tab is automatically selected when an element is clicked",
            "Source tab shows complete module YAML content",
            "Selected element is highlighted within the full YAML context",
            "Tab order is: Source, Properties, Debug & Test"
        ]
    }
    requirement cfv_requirements.FR21_2_SyntaxHighlightedYAML {
        title: "FR21.2: Syntax Highlighted YAML Display"
        part_of: cfv_requirements.FR21_ImprovedInspectorArchitecture
        description: "Source tab should use highlight.js for professional YAML syntax highlighting with line numbers and proper styling."
        priority: "High"; status: "Accepted"; source: "Inspector tab improvements";
        acceptance_criteria: [
            "YAML content is syntax highlighted using highlight.js",
            "Line numbers are displayed for navigation",
            "Selected element section is visually highlighted",
            "Professional code editor styling is applied",
            "Copy and export functionality is available"
        ]
    }
    requirement cfv_requirements.FR21_3_SchemaBasedForms {
        title: "FR21.3: Schema-Based Form Generation for Properties"
        part_of: cfv_requirements.FR21_ImprovedInspectorArchitecture
        description: "Properties tab should generate forms dynamically from component schemas using @rjsf/core and validate with Zod."
        priority: "High"; status: "Accepted"; source: "Inspector tab improvements";
        acceptance_criteria: [
            "Forms are generated from component schema configSchema",
            "Form fields match JSON schema types (text, number, boolean, select, etc.)",
            "Current configuration values are pre-populated",
            "Validation is performed using Zod schemas",
            "Inline validation errors are displayed",
            "Live YAML preview shows configuration changes",
            "Save button triggers requestSave action"
        ]
    }
    requirement cfv_requirements.FR21_4_UnifiedDebugTest {
        title: "FR21.4: Unified Debug & Test Tab"
        part_of: cfv_requirements.FR21_ImprovedInspectorArchitecture
        description: "Debug & Test tab should combine execution debugging and test case management in a unified interface."
        priority: "Medium"; status: "Accepted"; source: "Inspector tab improvements";
        acceptance_criteria: [
            "Debug section shows execution traces and step details",
            "Test section provides test case creation and execution",
            "Visual timeline of step execution with performance metrics",
            "JSON/YAML formatted data inspection",
            "Test case templates for common scenarios",
            "Assertion builder with JMESPath selectors",
            "Test execution results with pass/fail status"
        ]
    }

requirement cfv_requirements.FR22_EnhancedDebugTestInterface {
    title: "FR22: Enhanced Debug & Test Interface with Input Forms and Execution"
    description: "Provide comprehensive debug and test interface with input forms, random data generation, and execution from selected steps."
    priority: "High"
    status: "Accepted"
    source: "User Requirements - Enhanced Debug & Test Interface"
    
    sub_requirements: [
        cfv_requirements.FR22_1_InputFormInterface,
        cfv_requirements.FR22_2_ContextualInputDisplay,
        cfv_requirements.FR22_3_RandomDataGeneration,
        cfv_requirements.FR22_4_ExecutionFromSelectedStep,
        cfv_requirements.FR22_5_ComprehensiveResultsDisplay,
        cfv_requirements.FR22_6_SchemaBasedInputResolution
    ]
}
    requirement cfv_requirements.FR22_1_InputFormInterface {
        title: "FR22.1: JSON Input Form Interface"
        part_of: cfv_requirements.FR22_EnhancedDebugTestInterface
        description: "Provide JSON textarea input forms for flow and component testing with validation and formatting."
        priority: "High"; status: "Accepted"; source: "Enhanced Debug & Test Interface";
        acceptance_criteria: [
            "JSON textarea for input data entry with syntax highlighting",
            "Input validation against component/trigger schemas",
            "Auto-formatting and pretty-printing of JSON input",
            "Error highlighting for invalid JSON or schema violations",
            "Template generation for valid input structures"
        ]
    }
    requirement cfv_requirements.FR22_2_ContextualInputDisplay {
        title: "FR22.2: Schema-Based Contextual Input Display"
        part_of: cfv_requirements.FR22_EnhancedDebugTestInterface
        description: "Display schema-driven input forms based on selected element with proper data resolution from flow structure."
        priority: "High"; status: "Accepted"; source: "Enhanced Debug & Test Interface";
        acceptance_criteria: [
            "When trigger is selected, show input form based on trigger schema with default values",
            "When component step is selected, show input form based on component input schema",
            "Resolve default input values from previous step outputs using component output schemas",
            "Use component schema default values when previous step outputs are unavailable",
            "Display input data lineage showing how data flows to selected component",
            "Show context variables available at selected step with their resolved values",
            "Provide input override capabilities for testing scenarios",
            "Generate input structure from component input schema (inputSchema property)",
            "Validate input data against component input schema before execution",
            "Support nested object and array inputs based on JSON schema structure"
        ]
    }
    requirement cfv_requirements.FR22_3_RandomDataGeneration {
        title: "FR22.3: Random Test Data Generation"
        part_of: cfv_requirements.FR22_EnhancedDebugTestInterface
        description: "Generate random test data for different testing scenarios."
        priority: "Medium"; status: "Accepted"; source: "Enhanced Debug & Test Interface";
        acceptance_criteria: [
            "Generate happy path test data based on component schemas",
            "Generate fork path test data for conditional logic testing",
            "Generate error case test data for failure scenario testing",
            "Support custom data generation rules and constraints",
            "Provide data generation templates for common patterns"
        ]
    }
    requirement cfv_requirements.FR22_4_ExecutionFromSelectedStep {
        title: "FR22.4: Execution from Selected Step or Trigger"
        part_of: cfv_requirements.FR22_EnhancedDebugTestInterface
        description: "Execute flow starting from selected step or trigger with provided input data."
        priority: "High"; status: "Accepted"; source: "Enhanced Debug & Test Interface";
        acceptance_criteria: [
            "Run button to execute flow from selected trigger with input data",
            "Run button to execute flow from selected step with resolved input",
            "Support partial flow execution from any step in the flow",
            "Handle step dependencies and context resolution for partial execution",
            "Provide execution options (mock vs real components, timeout settings)"
        ]
    }
    requirement cfv_requirements.FR22_5_ComprehensiveResultsDisplay {
        title: "FR22.5: Comprehensive Execution Results Display"
        part_of: cfv_requirements.FR22_EnhancedDebugTestInterface
        description: "Display comprehensive execution results including logs, outputs, and system triggers."
        priority: "High"; status: "Accepted"; source: "Enhanced Debug & Test Interface";
        acceptance_criteria: [
            "Show execution logs for each step with timestamps and levels",
            "Display output data from the last executed node",
            "Show any system triggers that the flow sends during execution",
            "Provide execution timeline with step durations and status",
            "Display error details and stack traces for failed executions",
            "Show data transformations between steps",
            "Export execution results for analysis and reporting"
        ]
    }
    requirement cfv_requirements.FR22_6_SchemaBasedInputResolution {
        title: "FR22.6: Schema-Based Input Data Resolution"
        part_of: cfv_requirements.FR22_EnhancedDebugTestInterface
        description: "The debug interface must intelligently resolve input data for selected components based on their schemas, flow structure, and data lineage from triggers and previous steps."
        priority: "High"; status: "Accepted"; source: "Enhanced Debug & Test Interface";
        acceptance_criteria: [
            "R22_6_1: Use component `inputSchema` to determine expected input structure and data types",
            "R22_6_2: For trigger nodes, generate input data based on trigger schema and configuration",
            "R22_6_3: For step nodes, resolve input data by mapping from:
              - Trigger output data (for first steps)
              - Previous step output data (based on `inputs_map`)
              - Context variables
              - Schema default values as fallback",
            "R22_6_4: Support real-time data flow simulation where changes to trigger input propagate to dependent steps",
            "R22_6_5: Handle complex data type mapping (object, array, primitive) with proper type conversion",
            "R22_6_6: Generate constraint-compliant test data for different scenarios:
              - Happy path: Valid data within schema constraints
              - Fork paths: Data that triggers different conditional branches
              - Error cases: Invalid data that violates schema constraints",
            "R22_6_7: Validate resolved input data against component schemas with detailed error reporting",
            "R22_6_8: Display data lineage showing how each input field is resolved from the flow structure",
            "Trigger Input Resolution: Parse trigger configuration to determine input structure",
            "For HttpTrigger: Generate realistic HTTP request data (method, path, body, headers)",
            "For EventTrigger: Generate event payload based on eventType",
            "Use trigger schema if available, otherwise infer from configuration",
            "Step Input Resolution: Analyze `inputs_map` to determine data sources",
            "Resolve actual values from trigger/previous step outputs",
            "Apply data transformations as specified in `inputs_map`",
            "Fill missing fields with schema defaults or generated values",
            "Maintain data consistency across the flow execution path"
        ]
    }

requirement cfv_requirements.FR12_EnhancedStreamingExecution {
    id: "CFV_REQ_FR12"
    title: "Enhanced Streaming Execution with Advanced Dependency Resolution"
    description: "The system must provide sophisticated server-side flow execution with real-time streaming updates, advanced dependency analysis, and robust error handling for comprehensive debugging and testing capabilities."
    priority: "High"
    category: "Functional"
    
    detailed_requirements: [
        "Server-side execution engine with comprehensive dependency analysis and cycle detection",
        "Real-time streaming execution updates via Server-Sent Events (SSE)",
        "Advanced expression parsing for complex input mappings with multiple step references",
        "Layered execution strategy with optimal parallel processing within dependency constraints",
        "Circular dependency detection with warning-based handling rather than fatal errors",
        "Multiple fallback strategies for deadlock resolution and execution continuation",
        "Client-side stream handler with proper React state management and object reference handling",
        "Automatic reconnection with exponential backoff and intelligent retry logic",
        "Pre-population of flow steps with PENDING status for immediate visual feedback",
        "Comprehensive error handling with detailed diagnostics and recovery mechanisms"
    ]
    
    acceptance_criteria: [
        "Server execution engine analyzes dependencies and creates execution order layers",
        "Circular dependencies are detected and reported as warnings without stopping execution",
        "Complex expressions with multiple step references are parsed and resolved correctly",
        "Steps execute in parallel within dependency layers when constraints are satisfied",
        "Client receives real-time streaming updates and updates node states properly",
        "React components re-render correctly through proper object reference management",
        "Connection failures are handled gracefully with automatic reconnection",
        "All flow steps show PENDING status immediately when execution starts",
        "Execution continues with fallback strategies when deadlocks are detected",
        "Comprehensive execution summary is provided with detailed step-by-step results"
    ]
    
    technical_specifications: [
        "Use Server-Sent Events (SSE) for real-time streaming communication",
        "Implement Depth-First Search (DFS) algorithm for cycle detection",
        "Support regex-based expression parsing for step reference extraction",
        "Use Promise.allSettled for parallel step execution within layers",
        "Implement exponential backoff for client reconnection strategies",
        "Create new object references for all state updates to trigger React re-renders",
        "Support JSON parsing for complex expression resolution",
        "Provide comprehensive logging for debugging and analysis",
        "Implement graceful degradation for connection and execution failures",
        "Support execution cancellation and cleanup mechanisms"
    ]
    
    integration_points: [
        "Next.js API Routes for server-side execution endpoints",
        "React Flow visualizer for node state updates and visual feedback",
        "Component schema system for realistic execution simulation",
        "Module registry for flow definition and component resolution",
        "Debug test actions service for execution initiation and control",
        "Graph builder service for node data enhancement with execution status"
    ]
    
    performance_requirements: [
        "Streaming updates delivered within 100ms of server-side events",
        "Dependency analysis completed within 500ms for flows with up to 50 steps",
        "Parallel execution of independent steps with minimal coordination overhead",
        "Client reconnection within 5 seconds using exponential backoff",
        "Memory usage optimization through proper cleanup and garbage collection",
        "UI responsiveness maintained during large execution trace processing"
    ]
    
    error_handling_requirements: [
        "Graceful handling of malformed expressions with fallback to original values",
        "Automatic recovery from transient network failures",
        "Detailed error reporting with context and resolution suggestions",
        "Isolation of step failures to prevent cascade effects",
        "Comprehensive logging for debugging complex execution scenarios",
        "User-friendly error messages with actionable guidance"
    ]
    
    source: "Enhanced streaming execution implementation with advanced dependency resolution"
}