// cfv_requirements.dspec
// Defines functional requirements for the CascadeFlowVisualizer library.

// --- Derived from Section III: UI Layout ---

requirement cfv_requirements.UILayout_IdeLikeStructure {
    title: "IDE-Like Multi-Pane UI Structure"
    description: "The visualizer must present a multi-pane interface: Left Sidebar (Navigation & Discovery), Main Canvas (Visualization Area), Right Sidebar (Inspector & Editor), and a conceptual Error Display Area."
    priority: "High"
    status: "Accepted"
    source: "CascadeFlowVisualizer Library Specification, Section III"
    acceptance_criteria: [
        "Given the visualizer is rendered",
        "Then a Left Sidebar, Main Canvas, and Right Sidebar should be visible.",
        "And interactions in one pane should contextually update other panes as specified."
    ]
}

requirement cfv_requirements.UILayout_LeftSidebar_ModulesList {
    title: "Left Sidebar: Modules List"
    description: "Display all loaded modules by FQN. Expandable to show a summary of defined Named Components and Context Variables. Indicates module errors visually."
    priority: "High"
    status: "Accepted"
    fulfills_part_of: [cfv_requirements.UILayout_IdeLikeStructure]
    source: "CascadeFlowVisualizer Library Specification, Section III.A.1"
}

requirement cfv_requirements.UILayout_LeftSidebar_FlowsList {
    title: "Left Sidebar: Flows List"
    description: "Display all loaded flows by FQN. Clicking a flow navigates the Main Canvas to its 'Flow Detail View'."
    priority: "High"
    status: "Accepted"
    fulfills_part_of: [cfv_requirements.UILayout_IdeLikeStructure]
    source: "CascadeFlowVisualizer Library Specification, Section III.A.2"
}

requirement cfv_requirements.UILayout_LeftSidebar_NamedComponentsList {
    title: "Left Sidebar: Named Components List (Global)"
    description: "Display all loaded NamedComponentDefinitions from all modules, grouped by module FQN. Clicking shows definition in Right Sidebar."
    priority: "Medium"
    status: "Accepted"
    fulfills_part_of: [cfv_requirements.UILayout_IdeLikeStructure]
    source: "CascadeFlowVisualizer Library Specification, Section III.A.3"
}

requirement cfv_requirements.UILayout_LeftSidebar_TriggersList {
    title: "Left Sidebar: Triggers List (Global)"
    description: "List all trigger definitions across loaded modules, showing type, config, and flow FQN. Clicking navigates to flow's Detail View."
    priority: "Medium"
    status: "Accepted"
    fulfills_part_of: [cfv_requirements.UILayout_IdeLikeStructure]
    source: "CascadeFlowVisualizer Library Specification, Section III.A.4"
}

requirement cfv_requirements.UILayout_LeftSidebar_FlowRunsHistoryList {
    title: "Left Sidebar: Flow Runs/History List"
    description: "List historical flow instances. Clicking loads trace data and switches to 'trace' mode. List item content is customizable via props."
    priority: "High"
    status: "Accepted"
    fulfills_part_of: [cfv_requirements.UILayout_IdeLikeStructure]
    source: "CascadeFlowVisualizer Library Specification, Section III.A.5"
}

requirement cfv_requirements.UILayout_MainCanvas {
    title: "Main Canvas: Visualization Area"
    description: "Display 'System Overview Graph' or 'Flow Detail Graph' (Design, Trace, or Test Result Mode). Includes React Flow controls. Empty states handled by consumer."
    priority: "High"
    status: "Accepted"
    fulfills_part_of: [cfv_requirements.UILayout_IdeLikeStructure]
    source: "CascadeFlowVisualizer Library Specification, Section III.B"
}

requirement cfv_requirements.UILayout_RightSidebar_Inspector {
    title: "Right Sidebar: Inspector & Editor"
    description: "Context-sensitive display for selected elements. Tab content rendered by consumer functions (Properties/Config, Source, Data I/O, Context Vars, Test Definition, Assertion Results)."
    priority: "High"
    status: "Accepted"
    fulfills_part_of: [cfv_requirements.UILayout_IdeLikeStructure]
    source: "CascadeFlowVisualizer Library Specification, Section III.C"
}

requirement cfv_requirements.UILayout_ErrorDisplay {
    title: "Error Display Area (Conceptual)"
    description: "Module errors indicated in Modules List. Step errors included in node.data.error and visualized by custom node renderers. Global errors are a future consideration."
    priority: "Medium"
    status: "Accepted"
    fulfills_part_of: [cfv_requirements.UILayout_IdeLikeStructure]
    source: "CascadeFlowVisualizer Library Specification, Section III.D"
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
    title: "FR1: Module Management & Loading"
    description: "Handles loading, parsing, and resolving definitions across multiple Cascade DSL modules, respecting imports and aliases, and managing errors."
    priority: "Critical"
    status: "Accepted"
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR1"
}
    requirement cfv_requirements.FR1_1_InitialModules {
        title: "FR1.1: Accept Initial Modules via Props"
        part_of: cfv_requirements.FR1_ModuleManagement
        description: "Accept an initial set of modules via `props.initialModules`."
        priority: "Critical"; status: "Accepted"; source: "IV.FR1.1";
    }
    requirement cfv_requirements.FR1_2_RequestAdditionalModules {
        title: "FR1.2: Asynchronously Request Additional Modules"
        part_of: cfv_requirements.FR1_ModuleManagement
        description: "Utilize `props.requestModule` to asynchronously request and load additional modules by FQN."
        priority: "Critical"; status: "Accepted"; source: "IV.FR1.2";
    }
    requirement cfv_requirements.FR1_3_InternalModuleRegistry {
        title: "FR1.3: Maintain Internal Registry of Loaded Modules"
        part_of: cfv_requirements.FR1_ModuleManagement
        description: "Maintain an internal registry (`DslModuleRepresentation`) storing raw content, parsed structure, definitions, imports, and errors for each module."
        priority: "Critical"; status: "Accepted"; source: "IV.FR1.3";
    }
    requirement cfv_requirements.FR1_4_DynamicModuleUpdates {
        title: "FR1.4: Support Dynamic Updates to Module Context"
        part_of: cfv_requirements.FR1_ModuleManagement
        description: "Support dynamic updates if `props.initialModules` changes, triggering re-processing and re-rendering."
        priority: "High"; status: "Accepted"; source: "IV.FR1.4";
    }
    requirement cfv_requirements.FR1_5_HandleImportsAndAliases {
        title: "FR1.5: Correctly Handle DSL Imports and Aliases"
        part_of: cfv_requirements.FR1_ModuleManagement
        description: "Correctly handle `imports` declared within DSL files, using `props.requestModule` and managing aliases."
        priority: "Critical"; status: "Accepted"; source: "IV.FR1.5";
    }
    requirement cfv_requirements.FR1_6_DetectCircularDependencies {
        title: "FR1.6: Detect and Indicate Circular Module Dependencies"
        part_of: cfv_requirements.FR1_ModuleManagement
        description: "Detect circular dependencies between modules during import resolution and visually indicate such errors."
        priority: "High"; status: "Accepted"; source: "IV.FR1.6";
    }
    requirement cfv_requirements.FR1_7_UsePreloadedComponentSchemas {
        title: "FR1.7: Utilize Pre-loaded Component JSON Schemas"
        part_of: cfv_requirements.FR1_ModuleManagement
        description: "Utilize component schemas from `props.componentSchemas` for synchronous schema lookups."
        priority: "Critical"; status: "Accepted"; source: "IV.FR1.7";
    }

requirement cfv_requirements.FR2_GraphDataGeneration {
    title: "FR2: Graph Data Generation"
    description: "Generate React Flow `nodes` and `edges` data structures for current view and mode, including detailed data payloads and error information."
    priority: "Critical"
    status: "Accepted"
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR2"
}
    requirement cfv_requirements.FR2_1_GenerateNodesAndEdges {
        title: "FR2.1: Generate React Flow Nodes and Edges"
        part_of: cfv_requirements.FR2_GraphDataGeneration
        description: "Generate React Flow `nodes` and `edges` data structures as plain JavaScript objects for the current view."
        priority: "Critical"; status: "Accepted"; source: "IV.FR2.1";
    }
    requirement cfv_requirements.FR2_2_FlowDetailViewNodeGeneration {
        title: "FR2.2: Flow Detail View Node Generation"
        part_of: cfv_requirements.FR2_GraphDataGeneration
        description: "Generate Trigger, Step, and Sub-flow Invoker nodes for Flow Detail View, with appropriate `type` and `data` (DSL object, resolved component info, schema, context usages, errors, trace overlays)."
        priority: "Critical"; status: "Accepted"; source: "IV.FR2.2";
    }
    requirement cfv_requirements.FR2_3_FlowDetailViewEdgeGeneration {
        title: "FR2.3: Flow Detail View Edge Generation"
        part_of: cfv_requirements.FR2_GraphDataGeneration
        description: "Generate dataFlow and controlFlow edges based on `inputs_map` and `run_after`. Include trace overlay data if applicable."
        priority: "Critical"; status: "Accepted"; source: "IV.FR2.3";
    }
    requirement cfv_requirements.FR2_4_SystemOverviewNodeGeneration {
        title: "FR2.4: System Overview View Node Generation"
        part_of: cfv_requirements.FR2_GraphDataGeneration
        description: "Generate systemFlowNode and systemTriggerNode nodes for System Overview View."
        priority: "High"; status: "Accepted"; source: "IV.FR2.4";
    }
    requirement cfv_requirements.FR2_5_SystemOverviewEdgeGeneration {
        title: "FR2.5: System Overview View Edge Generation"
        part_of: cfv_requirements.FR2_GraphDataGeneration
        description: "Generate trigger-to-flow and flow-to-sub-flow (invocation) edges for System Overview View."
        priority: "High"; status: "Accepted"; source: "IV.FR2.5";
    }
    requirement cfv_requirements.FR2_6_ResolveComponentRefs {
        title: "FR2.6: Resolve Component References Across Modules"
        part_of: cfv_requirements.FR2_GraphDataGeneration
        description: "Correctly resolve `component_ref` (to Named Component Definitions or raw types) across all loaded modules, considering namespaces and import aliases."
        priority: "Critical"; status: "Accepted"; source: "IV.FR2.6";
    }
    requirement cfv_requirements.FR2_7_ParseContextVariablesUsage {
        title: "FR2.7: Identify Context Variable Usages via Prop Function"
        part_of: cfv_requirements.FR2_GraphDataGeneration
        description: "Use `props.parseContextVariables` function to identify context variable usages in DSL strings and include this in `node.data`."
        priority: "High"; status: "Accepted"; source: "IV.FR2.7";
    }


requirement cfv_requirements.FR3_GraphRendering_ConsumerProvided {
    title: "FR3: Graph Rendering (Consumer Provided)"
    description: "The library passes generated graph data to React Flow; consumers provide custom components for node and edge rendering via props."
    priority: "Critical"
    status: "Accepted"
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR3"
}

requirement cfv_requirements.FR4_NavigationAndInteraction {
    title: "FR4: Navigation & Interaction"
    description: "Support navigation between System Overview and Flow Detail views, sub-flow navigation, and interactions with sidebar lists, with state notification via callbacks."
    priority: "Critical"
    status: "Accepted"
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR4"
}

requirement cfv_requirements.FR5_InformationDisplay_ConsumerProvided {
    title: "FR5: Information Display & Inspection (Consumer Provided Content)"
    description: "Manage Right Sidebar visibility and selected element state. Consumer-provided render functions populate tab content, receiving data and actions."
    priority: "Critical"
    status: "Accepted"
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR5"
}

requirement cfv_requirements.FR6_Layout_ELKjs {
    title: "FR6: Layout (ELK.js)"
    description: "Use `elkjs-reactflow` (or direct ELK.js integration) for automatic graph layout, configurable via `props.elkOptions`. Default to left-to-right orientation for both flow detail and system overview."
    priority: "Critical"
    status: "Accepted"
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR6"
}

requirement cfv_requirements.FR7_Editing_V1Scope {
    title: "FR7: Editing (V1 Scope)"
    description: "Support editing of `config` blocks if `props.isEditingEnabled`. Changes modify in-memory representation. Explicit 'Save' triggers YAML reconstruction and `props.onSaveModule` callback."
    priority: "High"
    status: "Accepted"
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR7"
}

requirement cfv_requirements.FR8_Debugging_TraceVisualization {
    title: "FR8: Debugging & Trace Visualization"
    description: "Accept and display `FlowExecutionTrace` data, overlaying execution status, timings, and I/O on the Flow Detail Graph. Support selection from a historical run list."
    priority: "Critical"
    status: "Accepted"
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR8"
}

requirement cfv_requirements.FR9_PropertyTestingInterface {
    title: "FR9: Property Testing Interface"
    description: "Provide UI for defining `FlowTestCase` (via consumer-rendered tab). Trigger test execution via `props.onRunTestCase`. Display `TestRunResult` including trace and assertion status."
    priority: "High"
    status: "Accepted"
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR9"
}

requirement cfv_requirements.FR10_StateSynchronization {
    title: "FR10: State Synchronization"
    description: "Internal Jotai state must correctly initialize from and react to changes in incoming props."
    priority: "Critical"
    status: "Accepted"
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR10"
}

requirement cfv_requirements.FR11_ErrorHandlingAndFeedback {
    title: "FR11: Error Handling & Feedback"
    description: "Gracefully handle and display DSL parsing errors, unresolved references, schema validation failures, and module loading errors. Provide visual feedback for loading states."
    priority: "High"
    status: "Accepted"
    source: "CascadeFlowVisualizer Library Specification, Section IV.FR11"
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