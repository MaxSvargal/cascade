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