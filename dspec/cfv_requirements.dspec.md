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

requirement cfv_requirements.FR19_ConsolidatedInspectorTabs {
    title: "FR19: Consolidated Inspector Tab Architecture"
    description: "Implement consolidated inspector tabs with better separation of concerns between component-level and flow-level functionality."
    priority: "High"
    status: "Accepted"
    source: "Architectural improvement - consolidating overlapping inspector functionality"
    
    sub_requirements: [
        cfv_requirements.FR19_1_PropertiesTabEnhancement,
        cfv_requirements.FR19_2_SourceTabRedesign,
        cfv_requirements.FR19_3_DataFlowTabConsolidation,
        cfv_requirements.FR19_4_TestingTabConsolidation,
        cfv_requirements.FR19_5_FieldNamingStandardization
    ]
}
    requirement cfv_requirements.FR19_1_PropertiesTabEnhancement {
        title: "FR19.1: Enhanced Properties Tab for Component Configuration"
        part_of: cfv_requirements.FR19_ConsolidatedInspectorTabs
        description: "Properties tab should be an interactive form-based editor with live YAML preview for component configurations."
        priority: "High"; status: "Accepted"; source: "Inspector tab consolidation";
        acceptance_criteria: [
            "Interactive form generation from component schema",
            "Live YAML preview of configuration changes",
            "Context variable editing and validation",
            "Inline validation with error display",
            "Split-pane layout with form and preview"
        ]
    }
    requirement cfv_requirements.FR19_2_SourceTabRedesign {
        title: "FR19.2: Source Tab for Full Module Context"
        part_of: cfv_requirements.FR19_ConsolidatedInspectorTabs
        description: "Source tab should show full module YAML context with selected element highlighting, not just the selected element."
        priority: "Medium"; status: "Accepted"; source: "Inspector tab consolidation";
        acceptance_criteria: [
            "Display complete module YAML content",
            "Highlight selected element within full context",
            "Provide YAML navigation (line numbers, search, folding)",
            "Show diff view when in editing mode",
            "Export and copy functionality for YAML sections"
        ]
    }
    requirement cfv_requirements.FR19_3_DataFlowTabConsolidation {
        title: "FR19.3: Data Flow Tab for Flow-Level Analysis"
        part_of: cfv_requirements.FR19_ConsolidatedInspectorTabs
        description: "Consolidate debugging and data I/O functionality into a comprehensive flow-level data analysis tab."
        priority: "High"; status: "Accepted"; source: "Inspector tab consolidation";
        acceptance_criteria: [
            "Flow execution overview with status and performance metrics",
            "Step execution timeline with duration analysis",
            "Data lineage visualization between steps",
            "Critical path analysis and bottleneck identification",
            "Detailed error analysis with stack traces",
            "Execution comparison tools for multiple traces",
            "Step-by-step data inspection with formatting",
            "Execution replay functionality"
        ]
    }
    requirement cfv_requirements.FR19_4_TestingTabConsolidation {
        title: "FR19.4: Testing Tab for Comprehensive Property Testing"
        part_of: cfv_requirements.FR19_ConsolidatedInspectorTabs
        description: "Consolidate test definition and assertion results into a comprehensive property testing interface."
        priority: "High"; status: "Accepted"; source: "Inspector tab consolidation";
        acceptance_criteria: [
            "Test case creation and management interface",
            "Test template generation for common scenarios",
            "Assertion builder with JMESPath selectors",
            "Component mock configuration",
            "Test execution with detailed results",
            "Test coverage analysis and reporting",
            "Regression testing support",
            "Test result comparison and history"
        ]
    }
    requirement cfv_requirements.FR19_5_FieldNamingStandardization {
        title: "FR19.5: Standardize Field Naming Conventions"
        part_of: cfv_requirements.FR19_ConsolidatedInspectorTabs
        description: "Standardize field naming conventions across all trace and execution data structures."
        priority: "Medium"; status: "Accepted"; source: "Inspector tab consolidation";
        acceptance_criteria: [
            "Use consistent field names: inputData/outputData in StepExecutionTrace",
            "Use consistent field names: executionInputData/executionOutputData in node data",
            "Update all documentation to reflect standardized naming",
            "Ensure backward compatibility during transition",
            "Provide migration guide for field name changes"
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