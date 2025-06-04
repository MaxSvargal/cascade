// cfv_designs.dspec
// Defines architectural design, key components, and internal services for CascadeFlowVisualizer.

design cfv_designs.CoreArchitecture {
    title: "CascadeFlowVisualizer Core Architecture"
    description: "Defines the architectural philosophy and key technical decisions for the library."
    responsibilities: [
        "Provide a React-based visualization and interaction layer for Cascade DSL V1.1.",
        "Prioritize extensibility through consumer-provided renderers and callbacks.",
        "Manage DSL module loading, parsing, and an internal representation.",
        "Generate graph data for visualization by React Flow.",
        "Utilize ELK.js for automated graph layout.",
        "Employ Jotai for state management."
    ]
    applies_policies: [
        cfv_policies.Arch_ReactFlowElkjsFoundation,
        cfv_policies.Arch_ModuleCentric,
        cfv_policies.Arch_ComponentSchemasUpfront,
        cfv_policies.Arch_EditingTradeoffsV1,
        cfv_policies.Arch_SubflowsNavigableNodes,
        cfv_policies.Arch_TraceOverlaysStateDriven,
        cfv_policies.Arch_ExternalContextVarParsing,
        cfv_policies.Arch_JotaiStateManagement,
        cfv_policies.Arch_ExternalizeVisualsAndBehavior,
        cfv_policies.Arch_FunctionalPuritySideEffectIsolation
    ]
    source: "CascadeFlowVisualizer Library Specification, Section II"
}

design cfv_designs.CascadeFlowVisualizerComponent {
    title: "<CascadeFlowVisualizer /> React Component"
    description: "The main entry point and encompassing React component for the library. Manages overall UI structure and orchestrates internal services."
    part_of: cfv_designs.CoreArchitecture
    api_contract_model: cfv_models.CascadeFlowVisualizerProps // Links to the props model
    responsibilities: [
        "Initialize and manage the multi-pane UI layout (Sidebars, Main Canvas).",
        "Receive and propagate props to internal services and Jotai state.",
        "Orchestrate module loading via ModuleRegistryService.",
        "Coordinate graph data generation via GraphBuilderService.",
        "Integrate with ELK.js for layout via LayoutService.",
        "Handle user interactions and delegate to appropriate services (Navigation, Selection, Inspector).",
        "Manage different operational modes (design, trace, test_result)."
    ]
    dependencies: [
        cfv_designs.ModuleRegistryService,
        cfv_designs.GraphBuilderService,
        cfv_designs.LayoutService,
        cfv_designs.SelectionService,
        cfv_designs.InspectorStateService,
        cfv_designs.NavigationStateService,
        cfv_designs.TraceListService
    ]
    fulfills: [
        cfv_requirements.UILayout_IdeLikeStructure,
        cfv_requirements.FR1_ModuleManagement,
        cfv_requirements.FR2_GraphDataGeneration,
        cfv_requirements.FR3_GraphRendering_ConsumerProvided,
        cfv_requirements.FR4_NavigationAndInteraction,
        cfv_requirements.FR5_InformationDisplay_ConsumerProvided,
        cfv_requirements.FR6_Layout_ELKjs,
        cfv_requirements.FR7_Editing_V1Scope,
        cfv_requirements.FR8_Debugging_TraceVisualization,
        cfv_requirements.FR9_PropertyTestingInterface,
        cfv_requirements.FR10_StateSynchronization,
        cfv_requirements.FR11_ErrorHandlingAndFeedback
    ]
    source: "CascadeFlowVisualizer Library Specification, Section VI.A"
}

// --- Internal Services (Conceptual Designs) ---

design cfv_designs.ModuleRegistryService {
    title: "ModuleRegistryService (Jotai Atoms & Effects)"
    description: "Manages loading, parsing, and providing access to DSL modules and component schemas. Implements IModuleRegistry."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Store and manage loaded DslModuleRepresentations.",
        "Store and manage ComponentSchemas.",
        "Handle asynchronous module loading requests (`props.requestModule`).",
        "Parse module content and extract definitions.",
        "Resolve component types, flow definitions, named components, and context definitions across modules, respecting imports.",
        "Provide synchronous access to loaded data for other services and UI components."
    ]
    exposes_interface: cfv_models.IModuleRegistry
    source: "CascadeFlowVisualizer Library Specification, Section VII.1"
}

design cfv_designs.GraphBuilderService {
    title: "GraphBuilderService (Jotai Derived Atoms / Pure Functions)"
    description: "Transforms DSL data from ModuleRegistryService and other state (mode, traceData) into React Flow `nodes` and `edges`."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Generate node and edge data for Flow Detail View (steps, triggers, sub-flow invokers).",
        "Generate node and edge data for System Overview View (flows, external triggers, invocations).",
        "Incorporate trace/test execution data overlays onto graph data.",
        "Resolve component references and validate step configurations against schemas.",
        "Identify context variable usages using `props.parseContextVariables`."
    ]
    dependencies: [cfv_designs.ModuleRegistryService, "props.parseContextVariables"]
    source: "CascadeFlowVisualizer Library Specification, Section VII.2"
}

design cfv_designs.LayoutService {
    title: "LayoutService (Enhanced ELK.js Integration)"
    description: "Advanced automatic graph layout service using ELK.js with multiple algorithms and intelligent node sizing."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Provide multiple layout algorithms (layered, force, mrtree, radial, disco).",
        "Calculate content-based node sizing with configurable limits.",
        "Apply algorithm-specific optimizations and spacing configurations.",
        "Provide layout presets for different use cases (flowDetail, systemOverview, compact).",
        "Handle layout failures gracefully with fallback to manual positioning."
    ]
    dependencies: [
        cfv_designs.GraphBuilderService,
        "elkjs/lib/elk.bundled.js",
        "props.elkOptions"
    ]
    exposes_interface: {
        layoutNodes: "async (nodes: Node[], edges: Edge[], options?: LayoutOptions) => Promise<{ nodes: Node[]; edges: Edge[] }>",
        calculateNodeSize: "(node: Node) => { width: number; height: number }",
        layoutPresets: "Record<string, LayoutOptions>"
    }
    source: "Enhanced implementation with advanced ELK.js features"
}

design cfv_designs.SelectionService {
    title: "SelectionService (Jotai Atoms & Event Handlers)"
    description: "Manages the currently selected element in the UI (graph node/edge, list item)."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Maintain `selectedElementAtom` state.",
        "Update `selectedElementAtom` based on user interactions (clicks).",
        "Invoke `props.onElementSelect` callback with the new selection."
    ]
    source: "CascadeFlowVisualizer Library Specification, Section VII.4"
}

design cfv_designs.InspectorStateService {
    title: "InspectorStateService (Jotai Atoms & Selectors)"
    description: "Manages state and data for the Right Sidebar inspector tabs and handles save operations."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Prepare data slices for consumer-rendered inspector tabs based on selected element and mode.",
        "Provide `InspectorPropertiesActions` (including `requestSave`) to property tab renderer.",
        "Handle `requestSave` by reconstructing module YAML and invoking `props.onSaveModule`."
    ]
    dependencies: [cfv_designs.SelectionService, cfv_designs.ModuleRegistryService, "props.onSaveModule"]
    source: "CascadeFlowVisualizer Library Specification, Section VII.5"
}

design cfv_designs.NavigationStateService {
    title: "NavigationStateService (Jotai Atoms & Actions)"
    description: "Manages the visualizer's internal navigation state (current view, selected flow)."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Maintain atoms for `currentMode`, `currentFlowFqn`, `systemViewActive`.",
        "Provide actions to update navigation state (e.g., `navigateToFlow`).",
        "Invoke `props.onViewChange` callback on navigation state changes."
    ]
    source: "CascadeFlowVisualizer Library Specification, Section VII.6"
}

design cfv_designs.TraceListService {
    title: "TraceListService (Jotai Atoms & Effects)"
    description: "Manages fetching and displaying the list of historical flow runs."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Maintain `traceListSummariesAtom`.",
        "Invoke `props.fetchTraceList` to populate the list.",
        "Facilitate selection of a trace, leading to updates in `props.traceData` and `props.mode` by the host application."
    ]
    dependencies: ["props.fetchTraceList", "props.renderFlowRunListItem"]
    source: "CascadeFlowVisualizer Library Specification, Section VII.7"
}

// --- Enhanced Services (New Implementations) ---

design cfv_designs.TraceVisualizationService {
    title: "TraceVisualizationService (Execution Trace Overlays)"
    description: "Enhances graph elements with execution trace data, critical path analysis, and performance metrics."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Enhance nodes with trace overlay data (execution status, timing, data summaries).",
        "Enhance edges with execution path information and data flow details.",
        "Calculate critical path through execution based on duration analysis.",
        "Apply trace-based styling for visual differentiation of execution states.",
        "Provide execution order visualization and performance metrics overlay.",
        "Extract and display error details for failed executions."
    ]
    dependencies: [
        cfv_designs.GraphBuilderService,
        "props.traceData"
    ]
    exposes_interface: {
        enhanceNodesWithTrace: "(nodes: Node[], traceData: FlowExecutionTrace, options?: TraceVisualizationOptions) => Node[]",
        enhanceEdgesWithTrace: "(edges: Edge[], traceData: FlowExecutionTrace, options?: TraceVisualizationOptions) => Edge[]",
        calculateCriticalPath: "(traceData: FlowExecutionTrace) => Set<string>"
    }
    source: "New implementation for advanced trace visualization"
}

design cfv_designs.InspectorTabSelectionBehavior {
    title: "Inspector Tab Selection Behavior"
    description: "Defines the behavior for inspector tab selection with manual-only tab switching to prevent flickering and preserve user intent."
    part_of: cfv_designs.InspectorStateService
    responsibilities: [
        "Maintain user's active tab selection as persistent state.",
        "Only change tabs when user explicitly clicks on a tab.",
        "Never auto-switch tabs based on component selection or changes.",
        "Preserve tab state across all component switches and navigation.",
        "Handle tab availability gracefully without forced switching."
    ]
    behavioral_rules: [
        "NEVER auto-switch tabs for any reason",
        "ONLY change tabs on explicit user tab click",
        "ALWAYS preserve user's tab choice across component changes",
        "ALWAYS maintain tab state across navigation and mode changes",
        "GRACEFULLY handle unavailable tabs by showing empty state"
    ]
    tab_availability_rules: [
        "Source tab: Available when any element is selected",
        "Properties tab: Available when element has configurable schema",
        "Debug & Test tab: Available when flow context exists or element is executable"
    ]
    implementation_approach: [
        "Use simple atom state for active tab (default: 'source')",
        "Only update atom on manual tab click via switchInspectorTabAtom",
        "Show tab content only when tab is both active AND available",
        "Show 'not available' message when active tab is unavailable for current element",
        "No automatic tab selection logic - purely manual control"
    ]
    user_experience: [
        "User clicks Source tab -> always shows Source tab (if available)",
        "User clicks Properties tab -> always shows Properties tab (if available)", 
        "User clicks Debug & Test tab -> always shows Debug & Test tab (if available)",
        "User selects different component -> tab stays the same, content updates",
        "If current tab not available for element -> show 'not available' message"
    ]
    source: "Simplified tab behavior to prevent flickering and preserve user intent"
}

design cfv_designs.YamlReconstructionService {
    title: "YamlReconstructionService (Module Save Operations)"
    description: "Reconstructs YAML content from DSL module representations and handles configuration changes for save operations."
    part_of: cfv_designs.InspectorStateService
    responsibilities: [
        "Reconstruct valid YAML content from parsed DSL module representations.",
        "Apply configuration changes to module representations with path-based updates.",
        "Create save payloads with validation and error handling.",
        "Preserve YAML structure and formatting where possible.",
        "Validate reconstructed YAML against original module structure."
    ]
    dependencies: [
        cfv_designs.ModuleRegistryService,
        "yaml.stringify",
        "yaml.parse"
    ]
    exposes_interface: {
        reconstructModuleYaml: "(moduleRep: DslModuleRepresentation, options?: ReconstructionOptions) => string",
        applyConfigChanges: "(moduleRep: DslModuleRepresentation, pathToConfig: (string | number)[], newConfigValue: any) => DslModuleRepresentation",
        createSavePayload: "(moduleRep: DslModuleRepresentation, options?: ReconstructionOptions) => SaveModulePayload",
        validateReconstructedYaml: "(original: DslModuleRepresentation, reconstructed: string) => { isValid: boolean; errors: string[] }"
    }
    source: "New implementation for YAML round-trip editing"
}

design cfv_designs.TestCaseService {
    title: "TestCaseService (Property Testing Management)"
    description: "Manages flow test case definitions, validation, and execution interface for property testing."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Generate test case templates for flows (happy path, error handling, performance).",
        "Create test cases from templates with customization options.",
        "Validate test case definitions against flow structures and schemas.",
        "Generate mock responses for common component types.",
        "Evaluate test assertions against execution results.",
        "Provide test execution simulation and result validation."
    ]
    dependencies: [
        cfv_designs.ModuleRegistryService,
        "props.onRunTestCase"
    ]
    exposes_interface: {
        generateTestCaseTemplates: "(flowFqn: string, moduleRegistry: IModuleRegistry) => TestCaseTemplate[]",
        createTestCaseFromTemplate: "(template: TestCaseTemplate, flowFqn: string, customizations?: Partial<FlowTestCase>) => FlowTestCase",
        validateTestCase: "(testCase: FlowTestCase, moduleRegistry: IModuleRegistry) => { isValid: boolean; errors: string[] }",
        generateMockResponses: "(flowFqn: string, moduleRegistry: IModuleRegistry) => MockedComponentResponse[]",
        evaluateAssertions: "(assertions: TestCaseAssertion[], testResult: any) => AssertionResult[]"
    }
    source: "New implementation for comprehensive test case management"
}

design cfv_designs.EnhancedGraphBuilderService {
    title: "GraphBuilderService (Enhanced with Advanced Features)"
    description: "Enhanced graph builder service with automatic layout integration, trace visualization, and advanced node/edge generation."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Generate enhanced node data with trace overlays and execution status.",
        "Create specialized node types (StepNode, TriggerNode, SubFlowInvokerNode, SystemFlowNode, SystemTriggerNode).",
        "Generate enhanced edge data with execution path information.",
        "Integrate automatic layout application with ELK.js.",
        "Apply trace visualization enhancements when trace data is available.",
        "Support multiple graph generation modes (design, trace, test_result).",
        "Handle component resolution with import-aware lookup.",
        "Generate system overview graphs with flow relationships and invocations."
    ]
    dependencies: [
        cfv_designs.ModuleRegistryService,
        cfv_designs.LayoutService,
        cfv_designs.TraceVisualizationService,
        "props.parseContextVariables",
        "props.traceData"
    ]
    exposes_interface: {
        generateFlowDetailGraphData: "(params: GenerateFlowDetailParams) => Promise<GraphData>",
        generateSystemOverviewGraphData: "(moduleRegistry: IModuleRegistry, parseContextVarsFn: (value: string) => string[], useAutoLayout?: boolean) => Promise<GraphData>"
    }
    source: "Enhanced implementation with advanced features and integrations"
}

design cfv_designs.EnhancedModuleRegistryService {
    title: "ModuleRegistryService (Enhanced with Advanced Resolution)"
    description: "Enhanced module registry service with comprehensive component resolution, import handling, and error management."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Manage DSL module loading with comprehensive error handling.",
        "Parse YAML content with detailed error reporting and validation.",
        "Resolve component references across modules with import awareness.",
        "Handle module imports and aliases with recursive loading.",
        "Provide synchronous access to loaded data through IModuleRegistry interface.",
        "Support component schema integration and validation.",
        "Manage loading states and prevent duplicate requests."
    ]
    dependencies: [
        "yaml.parse",
        "props.requestModule",
        "props.onModuleLoadError",
        "props.componentSchemas"
    ]
    exposes_interface: cfv_models.IModuleRegistry
    enhanced_features: [
        "Import-aware component resolution",
        "Recursive module loading for dependencies",
        "Comprehensive error handling and reporting",
        "Component schema integration",
        "Loading state management"
    ]
    source: "Enhanced implementation with advanced module management"
}

// --- Component Design Enhancements ---

design cfv_designs.EnhancedNodeComponents {
    title: "Enhanced Node Component Library"
    description: "Comprehensive set of React components for rendering different types of flow nodes with advanced features."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Render step nodes with execution status styling and error display.",
        "Render trigger nodes with distinct visual styling.",
        "Render sub-flow invoker nodes with navigation capabilities.",
        "Render system flow nodes for overview visualization.",
        "Render system trigger nodes for system-level triggers.",
        "Support trace overlay visualization with execution timing and status.",
        "Provide consistent styling and interaction patterns."
    ]
    components: [
        "StepNode: Standard flow step with execution status",
        "TriggerNode: Flow trigger entry point",
        "SubFlowInvokerNode: Sub-flow invocation with navigation",
        "SystemFlowNode: System overview flow representation",
        "SystemTriggerNode: System overview trigger representation"
    ]
    source: "Enhanced implementation with comprehensive node types"
}

design cfv_designs.EnhancedEdgeComponents {
    title: "Enhanced Edge Component Library"
    description: "Comprehensive set of React components for rendering different types of flow edges with advanced features."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Render flow edges with data/control flow differentiation.",
        "Render system edges with invocation/trigger styling.",
        "Support trace overlay visualization with execution path highlighting.",
        "Provide visual indicators for executed vs. non-executed paths.",
        "Support critical path highlighting with enhanced styling."
    ]
    components: [
        "FlowEdge: Flow detail edges with data/control flow styling",
        "SystemEdge: System overview edges with invocation/trigger styling"
    ]
    source: "Enhanced implementation with comprehensive edge types"
}

// --- Integration Design ---

design cfv_designs.EnhancedCascadeFlowVisualizerComponent {
    title: "Enhanced <CascadeFlowVisualizer /> React Component"
    description: "Fully enhanced main component with all advanced features integrated."
    part_of: cfv_designs.CoreArchitecture
    api_contract_model: cfv_models.CascadeFlowVisualizerProps
    responsibilities: [
        "Integrate all enhanced services (Layout, TraceVisualization, TestCase, YamlReconstruction).",
        "Provide comprehensive IDE-like interface with advanced features.",
        "Support multiple visualization modes with seamless switching.",
        "Handle save operations with YAML reconstruction and validation.",
        "Provide test case management and execution interface.",
        "Support advanced layout options and automatic positioning.",
        "Integrate trace visualization with critical path analysis.",
        "Provide comprehensive error handling and user feedback."
    ]
    dependencies: [
        cfv_designs.EnhancedModuleRegistryService,
        cfv_designs.EnhancedGraphBuilderService,
        cfv_designs.LayoutService,
        cfv_designs.TraceVisualizationService,
        cfv_designs.YamlReconstructionService,
        cfv_designs.TestCaseService,
        cfv_designs.SelectionService,
        cfv_designs.InspectorStateService,
        cfv_designs.NavigationStateService,
        cfv_designs.TraceListService
    ]
    enhanced_features: [
        "Multi-algorithm automatic layout with ELK.js",
        "Advanced trace visualization with critical path analysis",
        "Comprehensive test case management and validation",
        "YAML round-trip editing with save functionality",
        "Enhanced node and edge components with rich data display",
        "Professional UI/UX with mode switching and demo controls",
        "Comprehensive error handling and loading states",
        "Performance optimizations and efficient graph generation"
    ]
    fulfills: [
        cfv_requirements.UILayout_IdeLikeStructure,
        cfv_requirements.FR1_ModuleManagement,
        cfv_requirements.FR2_GraphDataGeneration,
        cfv_requirements.FR3_GraphRendering_ConsumerProvided,
        cfv_requirements.FR4_NavigationAndInteraction,
        cfv_requirements.FR5_InformationDisplay_ConsumerProvided,
        cfv_requirements.FR6_Layout_ELKjs,
        cfv_requirements.FR7_Editing_V1Scope,
        cfv_requirements.FR8_Debugging_TraceVisualization,
        cfv_requirements.FR9_PropertyTestingInterface,
        cfv_requirements.FR10_StateSynchronization,
        cfv_requirements.FR11_ErrorHandlingAndFeedback
    ]
    source: "Enhanced implementation with all advanced features integrated"
}

design cfv_designs.EnhancedSystemOverviewLayoutService {
    title: "Enhanced System Overview Layout Service"
    description: "Advanced layout service specifically optimized for system overview with trigger positioning and cascade flow arrangement."
    part_of: cfv_designs.CoreArchitecture
    responsibilities: [
        "Position trigger nodes above their corresponding flow nodes",
        "Arrange flows horizontally from left to right",
        "Implement cascade positioning for connected flows (top to bottom)",
        "Optimize spacing for trigger-to-flow and flow-to-flow relationships",
        "Support hierarchical layout for complex flow dependencies"
    ]
    dependencies: [
        cfv_designs.LayoutService,
        cfv_designs.GraphBuilderService
    ]
    exposes_interface: {
        layoutSystemOverview: "async (nodes: Node[], edges: Edge[], options?: SystemOverviewLayoutOptions) => Promise<{ nodes: Node[]; edges: Edge[] }>",
        calculateTriggerPositions: "(flowNodes: Node[], triggerNodes: Node[]) => { [triggerId: string]: Position }",
        arrangeCascadeFlows: "(flowNodes: Node[], invocationEdges: Edge[]) => Node[]"
    }
    source: "Enhanced implementation for system overview layout optimization"
}

design cfv_designs.ComponentEditDialogService {
    title: "Component Configuration Edit Dialog Service"
    description: "Service for managing component configuration edit dialogs with form generation and validation."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Generate dynamic forms based on component schemas",
        "Handle component configuration editing workflows",
        "Validate configuration changes against schemas",
        "Integrate with save operations for configuration updates",
        "Provide modal dialog management for edit operations"
    ]
    dependencies: [
        cfv_designs.ModuleRegistryService,
        cfv_designs.YamlReconstructionService,
        "react-hook-form",
        "@rjsf/core"
    ]
    exposes_interface: {
        openEditDialog: "(stepId: string, componentConfig: any, componentSchema: ComponentSchema) => void",
        closeEditDialog: "() => void",
        saveConfiguration: "(stepId: string, newConfig: any) => Promise<boolean>",
        validateConfiguration: "(config: any, schema: ComponentSchema) => { isValid: boolean; errors: string[] }"
    }
    source: "New implementation for component configuration editing"
}

design cfv_designs.DebuggingInterfaceService {
    title: "Debugging Interface Service"
    description: "Comprehensive debugging interface for trace visualization, execution analysis, and performance monitoring."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Provide debugging mode UI with trace visualization",
        "Display step-by-step execution details with timing information",
        "Highlight critical paths and performance bottlenecks",
        "Show error details and stack traces for failed executions",
        "Enable data inspection for inputs and outputs at each step",
        "Integrate with trace data overlays on graph visualization"
    ]
    dependencies: [
        cfv_designs.TraceVisualizationService,
        cfv_designs.GraphBuilderService,
        "props.traceData"
    ]
    exposes_interface: {
        enableDebuggingMode: "(traceData: FlowExecutionTrace) => void",
        showStepDetails: "(stepId: string) => void",
        highlightCriticalPath: "(traceData: FlowExecutionTrace) => void",
        inspectStepData: "(stepId: string, dataType: 'input' | 'output') => void"
    }
    source: "New implementation for comprehensive debugging interface"
}

design cfv_designs.PropertyTestingInterfaceService {
    title: "Property Testing Interface Service"
    description: "Comprehensive property testing interface with test case generation, execution monitoring, and result validation."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Generate default test cases for flows (happy path, error handling, performance)",
        "Provide test case editor with input templates and assertion builders",
        "Execute test cases with step-by-step monitoring",
        "Display test results with expected vs actual comparisons",
        "Integrate with standard library APIs for tracing and monitoring",
        "Support test case templates and customization"
    ]
    dependencies: [
        cfv_designs.TestCaseService,
        cfv_designs.ModuleRegistryService,
        "props.onRunTestCase"
    ]
    exposes_interface: {
        generateTestCases: "(flowFqn: string) => TestCaseTemplate[]",
        createTestCase: "(template: TestCaseTemplate, customizations?: Partial<FlowTestCase>) => FlowTestCase",
        executeTestCase: "(testCase: FlowTestCase) => Promise<TestRunResult>",
        showTestResults: "(testResult: TestRunResult) => void",
        compareResults: "(expected: any, actual: any) => ComparisonResult"
    }
    source: "New implementation for comprehensive property testing interface"
}

design cfv_designs.CollapsibleModuleListService {
    title: "Collapsible Module List Service"
    description: "Enhanced module list component with collapsible sections and improved status indicators."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Manage module list expansion/collapse state",
        "Show only essential status information (errors only)",
        "Provide hierarchical view of modules and their flows",
        "Support search and filtering of modules and flows",
        "Optimize space usage in left sidebar"
    ]
    dependencies: [
        cfv_designs.ModuleRegistryService,
        cfv_designs.NavigationStateService
    ]
    exposes_interface: {
        toggleModuleExpansion: "(moduleFqn: string) => void",
        expandAllModules: "() => void",
        collapseAllModules: "() => void",
        filterModules: "(searchTerm: string) => void"
    }
    source: "Enhanced implementation for improved module list UI"
}

// --- CONSOLIDATED INSPECTOR TAB DESIGNS ---

design cfv_designs.ConsolidatedInspectorTabsService {
    title: "Consolidated Inspector Tabs Service"
    description: "Manages the three consolidated inspector tabs: Source, Properties, and Debug & Test with enhanced functionality."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Manage tab state and switching between Source, Properties, and Debug & Test tabs",
        "Coordinate data flow between tabs and maintain consistency",
        "Handle tab-specific loading states and error handling",
        "Provide unified interface for tab content rendering",
        "Support tab-specific actions and operations"
    ]
    dependencies: [
        cfv_designs.SourceTabService,
        cfv_designs.PropertiesTabService,
        cfv_designs.DebugTestTabService,
        cfv_designs.InspectorStateService
    ]
    exposes_interface: {
        switchToTab: "(tabId: 'source' | 'properties' | 'debug-test') => void",
        getCurrentTab: "() => string",
        getTabData: "(tabId: string) => any",
        refreshTabContent: "(tabId: string) => void"
    }
    source: "New consolidated inspector tab architecture"
}

design cfv_designs.SourceTabService {
    title: "Source Tab Service"
    description: "Manages the Source tab with full module YAML display, syntax highlighting, and element highlighting."
    part_of: cfv_designs.ConsolidatedInspectorTabsService
    responsibilities: [
        "Display complete module YAML source with syntax highlighting",
        "Highlight selected element within the YAML context",
        "Provide line numbers and professional code editor styling",
        "Support copy and export functionality",
        "Handle large YAML files with performance optimization"
    ]
    dependencies: [
        cfv_designs.ModuleRegistryService,
        "highlight.js",
        "react-syntax-highlighter"
    ]
    exposes_interface: {
        displayModuleSource: "(moduleFqn: string, selectedElementPath?: string[]) => void",
        highlightElement: "(elementPath: string[]) => void",
        copySource: "() => void",
        exportSource: "(format: 'yaml' | 'json') => void"
    }
    api_contract: {
        renderInspectorSourceTab: "Required consumer function for rendering source tab content"
    }
    source: "New source tab implementation with enhanced YAML display"
}

design cfv_designs.PropertiesTabService {
    title: "Properties Tab Service - Primary Component Configuration Editor"
    description: "The ONLY interface for component configuration editing. Manages the Properties tab with schema-driven form generation for all component configuration editing needs. This tab replaces any separate edit dialogs or modals."
    part_of: cfv_designs.ConsolidatedInspectorTabsService
    responsibilities: [
        "Serve as the primary and only interface for editing component configurations",
        "Generate dynamic forms from component schemas using @rjsf/core",
        "Pre-populate forms with current configuration values from selected elements",
        "Validate configuration changes using component schemas in real-time",
        "Provide live YAML preview of configuration changes",
        "Handle all save operations with proper error handling and validation",
        "Support both step node configurations and named component definitions",
        "Eliminate need for separate edit dialogs or modals"
    ]
    design_principles: [
        "Single source of truth for component configuration editing",
        "No separate edit dialogs - all editing happens in this tab",
        "Schema-driven forms ensure consistency and validation",
        "Real-time preview and validation for immediate feedback"
    ]
    dependencies: [
        cfv_designs.ComponentSchemaService,
        cfv_designs.YamlReconstructionService,
        cfv_designs.SchemaBasedFormGenerationService,
        "@rjsf/core",
        "zod"
    ]
    exposes_interface: {
        generateConfigForm: "(componentType: string, currentConfig: any) => JSONSchema",
        validateConfig: "(config: any, schema: ComponentSchema) => ValidationResult",
        previewYamlChanges: "(newConfig: any) => string",
        saveConfiguration: "(stepId: string, newConfig: any) => Promise<boolean>",
        isConfigurable: "(selectedElement: SelectedElement) => boolean"
    }
    api_contract: {
        renderInspectorPropertiesTab: "Required consumer function for rendering ALL component configuration editing",
        requestSave: "Required consumer function for handling ALL save operations"
    }
    interaction_flow: [
        "User clicks on step node or component",
        "If element has configurable schema, Properties tab becomes available",
        "User switches to Properties tab to edit configuration",
        "Form is generated from component schema with current values",
        "User edits configuration with real-time validation",
        "User saves changes through requestSave action",
        "Changes are applied via YamlReconstructionService"
    ]
    source: "Consolidated properties tab implementation - the only component editing interface"
}

design cfv_designs.DebugTestTabService {
    title: "Debug & Test Tab Service"
    description: "Manages the unified Debug & Test tab with flow simulation, input forms, and comprehensive testing interface."
    part_of: cfv_designs.ConsolidatedInspectorTabsService
    responsibilities: [
        "Provide schema-based input forms for flow and component testing",
        "Execute flow simulation from selected steps with realistic data resolution",
        "Display comprehensive execution results with logs and data flow",
        "Manage test case creation, execution, and results",
        "Support random data generation for different testing scenarios",
        "Show execution timeline with performance metrics"
    ]
    dependencies: [
        cfv_designs.FlowSimulationService,
        cfv_designs.TestCaseService,
        cfv_designs.DataGenerationService,
        cfv_designs.ComponentSchemaService,
        "@rjsf/core"
    ]
    exposes_interface: {
        generateInputForm: "(selectedElement: SelectedElement) => JSONSchema",
        resolveInputData: "(selectedElement: SelectedElement) => ResolvedStepInput",
        executeFromStep: "(stepId: string, inputData: any) => Promise<FlowSimulationResult>",
        generateTestData: "(schema: JSONSchema, scenario: TestScenario) => any",
        createTestCase: "(flowFqn: string, testData: TestCaseData) => TestCase",
        executeTestCase: "(testCase: TestCase) => Promise<TestExecutionResult>"
    }
    api_contract: {
        renderInspectorDebugTestTab: "Required consumer function for rendering debug & test tab content"
    }
    source: "New unified debug & test tab implementation"
}

design cfv_designs.FlowSimulationService {
    title: "Flow Simulation Service"
    description: "Provides realistic flow execution simulation with proper data propagation and component execution."
    part_of: cfv_designs.DebugTestTabService
    responsibilities: [
        "Execute complete flow simulation from trigger through all steps",
        "Resolve input data for each step based on inputs_map and data lineage",
        "Execute components with realistic output generation based on schemas",
        "Handle context variables and data transformations",
        "Provide execution timeline and performance metrics",
        "Support partial flow execution from selected steps"
    ]
    dependencies: [
        cfv_designs.ModuleRegistryService,
        cfv_designs.ComponentSchemaService,
        cfv_designs.ComponentExecutionService
    ]
    exposes_interface: {
        simulateFlowExecution: "(flowFqn: string, triggerInput: any, targetStepId?: string) => Promise<FlowSimulationResult>",
        resolveStepInput: "(step: FlowStep, executionContext: ExecutionContext) => ResolvedStepInput",
        executeStep: "(step: FlowStep, stepInput: ResolvedStepInput, executionContext: ExecutionContext) => any"
    }
    source: "New flow simulation service for realistic execution testing"
}

design cfv_designs.SchemaBasedFormGenerationService {
    title: "Schema-Based Form Generation Service"
    description: "Generates dynamic forms from JSON schemas with proper validation and UI hints."
    part_of: cfv_designs.PropertiesTabService
    responsibilities: [
        "Convert component schemas to JSON Schema format for form generation",
        "Generate UI schema hints for better form rendering",
        "Handle complex form fields (nested objects, arrays, conditionals)",
        "Provide form validation with real-time error display",
        "Support custom form widgets and field types"
    ]
    dependencies: [
        "@rjsf/core",
        "@rjsf/validator-ajv8",
        "zod"
    ]
    exposes_interface: {
        generateFormSchema: "(componentSchema: ComponentSchema) => { schema: JSONSchema, uiSchema: UISchema }",
        validateFormData: "(data: any, schema: JSONSchema) => ValidationResult",
        generateUISchema: "(componentSchema: ComponentSchema) => UISchema"
    }
    source: "New schema-based form generation service"
}

design cfv_designs.DataLineageVisualizationService {
    title: "Data Lineage Visualization Service"
    description: "Visualizes data flow and lineage in the Debug & Test tab to show how data propagates through the flow."
    part_of: cfv_designs.DebugTestTabService
    responsibilities: [
        "Display data lineage diagrams showing input sources for selected steps",
        "Visualize data transformations between steps",
        "Show context variable usage and resolution",
        "Highlight data dependencies and relationships",
        "Provide interactive data flow exploration"
    ]
    dependencies: [
        cfv_designs.FlowSimulationService,
        "react-flow-renderer"
    ]
    exposes_interface: {
        generateDataLineage: "(stepId: string, executionContext: ExecutionContext) => DataLineageGraph",
        visualizeDataFlow: "(fromStep: string, toStep: string) => DataFlowVisualization",
        showInputSources: "(stepId: string) => InputSourceMapping[]"
    }
    source: "New data lineage visualization service"
}

design cfv_designs.ExecutionResultsDisplayService {
    title: "Execution Results Display Service"
    description: "Displays comprehensive execution results with logs, outputs, and system triggers in the Debug & Test tab."
    part_of: cfv_designs.DebugTestTabService
    responsibilities: [
        "Display execution logs with timestamps and severity levels",
        "Show step outputs with JSON/YAML formatting",
        "Display system triggers generated during execution",
        "Provide execution timeline with performance metrics",
        "Show error details and stack traces for failed executions",
        "Support result export and sharing"
    ]
    dependencies: [
        "react-json-view",
        "highlight.js"
    ]
    exposes_interface: {
        displayExecutionResults: "(simulationResult: FlowSimulationResult) => void",
        showExecutionTimeline: "(executionLog: ExecutionLogEntry[]) => void",
        displayStepOutput: "(stepId: string, output: any) => void",
        exportResults: "(format: 'json' | 'yaml' | 'csv') => void"
    }
    source: "New execution results display service"
}

// --- MIGRATION AND DEPRECATION DESIGNS ---

design cfv_designs.LegacyTabMigrationService {
    title: "Legacy Tab Migration Service"
    description: "Handles migration from old individual tabs to new consolidated tab architecture."
    part_of: cfv_designs.ConsolidatedInspectorTabsService
    responsibilities: [
        "Map legacy tab functionality to new consolidated tabs",
        "Provide backward compatibility during transition period",
        "Handle deprecation warnings and migration guidance",
        "Ensure smooth transition for existing consumers"
    ]
    deprecated_mappings: {
        "renderInspectorDataIOTab": "Functionality moved to Debug & Test tab",
        "renderInspectorContextVarsTab": "Functionality moved to Properties tab",
        "renderInspectorTestDefinitionTab": "Functionality moved to Debug & Test tab",
        "renderInspectorAssertionResultsTab": "Functionality moved to Debug & Test tab"
    }
    migration_timeline: {
        "Phase 1": "Introduce new consolidated tabs alongside legacy tabs",
        "Phase 2": "Add deprecation warnings to legacy tab props",
        "Phase 3": "Remove legacy tab support in next major version"
    }
    source: "Migration support for consolidated inspector tab architecture"
}

design cfv_designs.SubFlowInvokerNavigation {
    id: "CFV_DES_NAV_001"
    title: "SubFlowInvoker Double-Click Navigation Design"
    description: "Design for implementing seamless navigation between flows via SubFlowInvoker nodes."
    
    overview: "SubFlowInvoker nodes should provide intuitive navigation to their target flows through double-click interaction, with proper visual indicators and error handling."
    
    components: {
        node_visual_design: {
            description: "SubFlowInvoker nodes display the target flow FQN with navigation indicators",
            visual_elements: [
                "🔗 icon to indicate linkage",
                "⤴ arrow icon to indicate navigation capability", 
                "Hover effects with color changes",
                "Tooltip showing navigation instruction",
                "Cursor pointer to indicate clickability"
            ],
            styling: {
                background_color: "#FAF5FF (light purple)",
                border_color: "#E9D5FF (purple border)",
                hover_background: "#F3E8FF (darker purple on hover)",
                hover_border: "#C4B5FD (darker purple border on hover)",
                text_color: "#8B5CF6 (purple text)",
                font_family: "ui-monospace, monospace",
                padding: "symmetric left/right padding for balanced appearance",
                text_overflow: "ellipsis for long FQNs to maintain single-line display",
                min_width: "200px",
                max_width: "320px"
            }
        },
        
        layout_requirements: {
            description: "Enhanced layout requirements for proper fork handling and spacing",
            fork_alignment: {
                vertical_alignment: "Fork nodes must be aligned in perfect vertical line using advanced ELK configuration",
                spacing_factor: "Increased vertical spacing between fork nodes to accommodate taller SubFlow nodes",
                elk_configuration: "Use inLayerSpacingFactor of 6.0+ for adequate vertical separation with perfect grid alignment",
                advanced_options: "Use NETWORK_SIMPLEX node placement, BALANCED fixed alignment, and IMPROVE_STRAIGHTNESS edge straightening"
            },
            horizontal_spacing: {
                node_to_node: "Reduced horizontal spacing for more compact layout",
                reduction_factor: "50% reduction from current spacing (2x reduction)",
                target_spacing: "20px node-to-node, 5px edge-to-edge, 30px layer spacing",
                consistency_enforcement: "Disable individual spacing overrides and compaction to maintain uniform spacing"
            },
            subflow_specific: {
                height_consideration: "Account for SubFlow nodes being taller than regular step nodes",
                text_handling: "Use CSS text-overflow ellipsis for long FQN display",
                padding_symmetry: "Ensure equal left and right padding for visual balance",
                spacing_uniformity: "Ensure consistent spacing before and after SubFlow nodes"
            },
            advanced_elk_features: {
                compaction_disabled: "Disable post-compaction and connected component compaction to maintain spacing",
                thoroughness_increased: "Use thoroughness level 7 for better layout quality",
                edge_optimization: "Remove unnecessary bendpoints and disable sausage folding for cleaner appearance",
                model_order_consideration: "Consider model order for consistent node placement"
            }
        },
        
        navigation_interaction: {
            description: "Double-click navigation behavior with module loading support",
            trigger_event: "onNodeDoubleClick handler in CascadeFlowVisualizer",
            target_resolution: "Extract invokedFlowFqn from node data",
            module_loading: "Use requestModule callback for unloaded target modules",
            error_handling: "Graceful fallback for unavailable flows",
            visual_feedback: "Loading states and error notifications"
        }
    }
}

design cfv_designs.AutoZoomToFitService {
    title: "Auto Zoom-to-Fit Service (React Flow Integration)"
    description: "Automatically adjusts zoom and pan to show all nodes when flows are loaded or navigation occurs."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Automatically fit view when flows are initially loaded or changed.",
        "Provide smooth animated transitions for zoom changes.",
        "Respect user's manual zoom/pan actions after initial auto-fit.",
        "Handle timing coordination with graph layout completion.",
        "Debounce rapid navigation changes to prevent excessive zoom adjustments.",
        "Adapt zoom settings for long flows vs regular flows."
    ]
    dependencies: [
        "reactflow.useReactFlow",
        cfv_designs.NavigationStateService,
        cfv_designs.GraphBuilderService
    ]
    exposes_interface: {
        autoFitView: "(options?: { duration?: number; padding?: number }) => void",
        enableAutoFit: "() => void",
        disableAutoFit: "() => void"
    }
    behavioral_rules: [
        "Only auto-fit on flow changes, not during user interaction",
        "Use 5% padding for long flows (flows with 8+ nodes) to accommodate wide horizontal layouts",
        "Use 8% padding for regular flows (flows with 7 or fewer nodes)",
        "Apply 800ms animation duration for smooth transitions",
        "Wait 100ms after layout completion before fitting view",
        "Set minZoom to 0.02 for long flows to accommodate very wide layouts",
        "Set minZoom to 0.1 for regular flows",
        "Coordinate with layout service to use enhanced horizontal arrangements for flows with many nodes"
    ]
    enhanced_horizontal_layout_support: {
        threshold: "Flows with more than 7 nodes use enhanced horizontal layout",
        layout_configuration: "Single-line horizontal flow with enhanced spacing",
        spacing_enhancements: "150px node spacing, 200px layer spacing, 40px edge spacing",
        aspect_ratio: "3.0 wide aspect ratio for long flows to maintain readability",
        fork_handling: "Enhanced ELK.js configuration for better fork and parallel path visualization",
        zoom_optimization: "Very aggressive zoom-out (minZoom: 0.02) for very long horizontal flows"
    }
    source: "Enhanced implementation for horizontal layout support with fork handling"
}