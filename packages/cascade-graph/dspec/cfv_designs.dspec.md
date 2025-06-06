// cfv_designs.dspec

design cfv_designs.CoreArchitecture {
    title: "CascadeFlowVisualizer Core Architecture"
    description: "Defines the architectural philosophy and key technical decisions for the library."
    responsibilities: [
        "Provide a React-based visualization and interaction layer for Cascade DSL V1.1.",
        "Prioritize extensibility through consumer-provided renderers and callbacks.",
        "Manage DSL module loading, parsing, and an internal representation.",
        "Generate graph data for visualization by React Flow.",
        "Utilize ELK.js for automated graph layout.",
        "Employ Jotai for state management.",
        "Support real-time execution streaming for debugging and testing."
    ]
    applies_policies: [
        cfv_policies.Arch_ReactFlowElkjsFoundation,
        cfv_policies.Arch_ModuleCentric,
        cfv_policies.Arch_ComponentSchemasUpfront,
        cfv_policies.Arch_EditingTradeoffsV1,
        cfv_policies.Arch_SubflowsNavigableNodes,
        cfv_policies.Arch_TraceOverlaysStateDriven, // For batch trace
        cfv_policies.Arch_StreamingTraceUpdates,   // For real-time trace
        cfv_policies.Arch_ExternalContextVarParsing,
        cfv_policies.Arch_JotaiStateManagement,
        cfv_policies.Arch_ExternalizeVisualsAndBehavior,
        cfv_policies.Arch_FunctionalPuritySideEffectIsolation
    ]
    source: "CascadeFlowVisualizer Library Specification, Section II, and new architectural decisions"
}

design cfv_designs.CascadeFlowVisualizerComponent {
    title: "<CascadeFlowVisualizer /> React Component"
    description: "The main entry point and encompassing React component for the library. Manages overall UI structure and orchestrates internal services."
    part_of: cfv_designs.CoreArchitecture
    api_contract_model: cfv_models.CascadeFlowVisualizerProps
    responsibilities: [
        "Initialize and manage the multi-pane UI layout (Sidebars, Main Canvas).",
        "Receive and propagate props to internal services and Jotai state.",
        "Orchestrate module loading via cfv_designs.ModuleRegistryService.",
        "Coordinate graph data generation via cfv_designs.GraphBuilderService.",
        "Integrate with ELK.js for layout via cfv_designs.LayoutService.",
        "Handle user interactions and delegate to appropriate services (Navigation, Selection, Inspector).",
        "Manage different operational modes (design, trace, test_result).",
        "Orchestrate real-time execution streaming via cfv_designs.ClientExecutionStreamHandler and cfv_designs.DebugTestTabService actions."
    ]
    dependencies: [
        cfv_designs.ModuleRegistryService,
        cfv_designs.GraphBuilderService,
        cfv_designs.LayoutService,
        cfv_designs.SelectionService,
        cfv_designs.InspectorStateService,
        cfv_designs.NavigationStateService,
        cfv_designs.TraceListService,
        cfv_designs.ClientExecutionStreamHandler, // For managing SSE connection
        cfv_designs.DebugTestTabService // For initiating streaming execution
    ]
    fulfills: [
        cfv_requirements.UILayout_IdeLikeStructure,
        cfv_requirements.FR1_ModuleManagement,
        cfv_requirements.FR2_GraphDataGeneration,
        cfv_requirements.FR3_GraphRendering_ConsumerProvided,
        cfv_requirements.FR4_NavigationAndInteraction,
        cfv_requirements.FR5_InformationDisplay_ConsolidatedInspector,
        cfv_requirements.FR6_Layout_ELKjs,
        cfv_requirements.FR7_Editing_ViaPropertiesTab,
        cfv_requirements.FR8_Debugging_ViaDebugTestTab, // Covers batch trace
        cfv_requirements.FR9_PropertyTesting_ViaDebugTestTab,
        cfv_requirements.FR10_StateSynchronization,
        cfv_requirements.FR11_ErrorHandlingAndFeedback,
        cfv_requirements.FR12_EnhancedStreamingExecution // Client-side coordination
    ]
    source: "CascadeFlowVisualizer Library Specification, Section VI.A, and new requirements"
}

// --- Internal Services (Conceptual Designs) ---

design cfv_designs.ModuleRegistryService {
    title: "ModuleRegistryService (Jotai Atoms & Effects)"
    description: "Manages loading, parsing, and providing access to DSL modules and component schemas. Implements cfv_models.IModuleRegistry. Enhanced with advanced resolution and error management."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Store and manage loaded cfv_models.DslModuleRepresentations.",
        "Store and manage cfv_models.ComponentSchemas.",
        "Handle asynchronous module loading requests (`props.requestModule`) with comprehensive error handling (props.onModuleLoadError).",
        "Parse module content (YAML) and extract definitions, with detailed error reporting and validation.",
        "Resolve component types, flow definitions, named components, and context definitions across modules, respecting imports and aliases recursively.",
        "Provide synchronous access to loaded data for other services and UI components via cfv_models.IModuleRegistry.",
        "Manage loading states and prevent duplicate requests for modules."
    ]
    exposes_interface: cfv_models.IModuleRegistry
    dependencies: [ // Abstracted dependencies, concrete libs in directives
        "AbstractYamlParser", // for yaml.parse
        "props.requestModule",
        "props.onModuleLoadError",
        "props.componentSchemas"
    ]
    source: "CascadeFlowVisualizer Library Specification, Section VII.1 and EnhancedModuleRegistryService design"
}

design cfv_designs.GraphBuilderService {
    title: "GraphBuilderService (Jotai Derived Atoms / Pure Functions)"
    description: "Transforms DSL data from cfv_designs.ModuleRegistryService and other state (mode, traceData) into React Flow `nodes` and `edges`. Supports advanced features and ExternalServiceAdapter nodes."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Generate node and edge data for Flow Detail View (cfv_models.StepNodeData, cfv_models.TriggerEntryPointNodeData, cfv_models.SubFlowInvokerNodeData).",
        "Generate node and edge data for System Overview View (cfv_models.SystemGraphNodeData, cfv_models.SystemEdgeData).",
        "Incorporate trace/test execution data overlays onto graph data (using cfv_designs.TraceVisualizationService logic).",
        "Resolve component references and validate step configurations against schemas (from cfv_designs.ModuleRegistryService).",
        "Identify context variable usages using `props.parseContextVariables`.",
        "Detect and handle Integration.ExternalServiceAdapter nodes with proper component resolution and data for dynamic sizing.",
        "Generate enhanced edge data with distinct types for data dependency, execution order, error routing, and control flow (cfv_models.FlowEdgeData.dependencyType)."
    ]
    dependencies: [
        cfv_designs.ModuleRegistryService,
        cfv_designs.LayoutService, // For applying layout after generation
        cfv_designs.TraceVisualizationService, // For overlay logic
        "props.parseContextVariables",
        "props.traceData" // For batch trace overlay
    ]
    exposes_interface: {
        generateFlowDetailGraphData: "Signature: (params: cfv_models.GenerateFlowDetailParams) => Promise<cfv_models.GraphData>",
        generateSystemOverviewGraphData: "Signature: (moduleRegistry: cfv_models.IModuleRegistry, parseContextVarsFn: cfv_models.Function, useAutoLayout?: boolean) => Promise<cfv_models.GraphData>"
    }
    source: "CascadeFlowVisualizer Library Specification, Section VII.2 and EnhancedGraphBuilderService design"
}

design cfv_designs.LayoutService {
    title: "LayoutService (Enhanced ELK.js Integration)"
    description: "Advanced automatic graph layout service using ELK.js with multiple algorithms, intelligent node sizing, and specialized support for wide nodes (e.g., Integration.ExternalServiceAdapter, SubFlowInvoker)."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Provide multiple layout algorithms (layered, force, etc. via cfv_models.LayoutAlgorithmEnum).",
        "Calculate content-based node sizing with configurable limits, including dynamic sizing for SubFlowInvoker and ExternalServiceAdapter nodes.",
        "Apply algorithm-specific optimizations and spacing configurations.",
        "Provide layout presets for different use cases (flowDetail, systemOverview, compact).",
        "Handle layout failures gracefully with fallback to manual positioning.",
        "Calculate adaptive spacing with dual width compensation for wide nodes to prevent overlaps (as per cfv_internal_code.LayoutServiceWidthCompensation logic).",
        "Special handling for Integration.ExternalServiceAdapter nodes including dynamic sizing based on content.",
        "Optimize spacing for fork nodes and ensure proper vertical alignment (as per cfv_internal_code.LayoutServiceEnhancedSpacing logic)."
    ]
    dependencies: [
        cfv_designs.GraphBuilderService, // For node data needed for sizing
        "AbstractELKEngine", // ELK.js library
        "props.elkOptions"
    ]
    exposes_interface: {
        layoutNodes: "Signature: async (nodes: cfv_models.ReactFlowNode[], edges: cfv_models.ReactFlowEdge[], options?: cfv_models.LayoutOptions) => Promise<{ nodes: cfv_models.ReactFlowNode[]; edges: cfv_models.ReactFlowEdge[] }>",
        calculateNodeSizeWithStyling: "Signature: (node: cfv_models.ReactFlowNode, sizeOptions: cfv_models.NodeSizeOptions) => { width: number; height: number; style: object }", // From cfv_internal_code.LayoutService_ContentBasedSizing
        calculateAdaptiveSpacingWithWidthCompensation: "Signature: (nodes: cfv_models.ReactFlowNode[], baseSpacing: cfv_models.LayoutSpacing) => cfv_models.LayoutSpacing", // From cfv_internal_code.LayoutServiceWidthCompensation
        getLayoutPresets: "Signature: () => Record<string, cfv_models.LayoutOptions>" // From cfv_internal_code.LayoutService_LayoutPresets
    }
    source: "Enhanced implementation with dual width compensation and ExternalServiceAdapter support. Integrates logic from cfv_internal_code.LayoutService* specs."
}

design cfv_designs.SelectionService {
    title: "SelectionService (Jotai Atoms & Event Handlers)"
    description: "Manages the currently selected element in the UI (graph node/edge, list item)."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Maintain `selectedElementAtom` state (cfv_models.SelectedElement).",
        "Update `selectedElementAtom` based on user interactions (clicks on nodes, edges, list items).",
        "Invoke `props.onElementSelect` callback with the new selection."
    ]
    source: "CascadeFlowVisualizer Library Specification, Section VII.4"
}

design cfv_designs.InspectorStateService {
    title: "InspectorStateService (Jotai Atoms & Selectors)"
    description: "Manages state and data for the Right Sidebar consolidated inspector tabs (Source, Properties, Debug & Test) and handles save operations."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Prepare data slices (cfv_models.InspectorSourceTabProps, cfv_models.InspectorPropertiesTabProps, cfv_models.InspectorDebugTestTabProps) for consumer-rendered inspector tabs based on selected element and mode.",
        "Provide `cfv_models.InspectorPropertiesActions` (including `requestSave`) to property tab renderer.",
        "Handle `requestSave` by invoking cfv_designs.YamlReconstructionService and then `props.onSaveModule`.",
        "Manage active tab state and visibility rules for the consolidated inspector (as per cfv_designs.InspectorTabSelectionBehavior)."
    ]
    dependencies: [
        cfv_designs.SelectionService,
        cfv_designs.ModuleRegistryService,
        cfv_designs.YamlReconstructionService, // For save operations
        "props.onSaveModule"
    ]
    source: "CascadeFlowVisualizer Library Specification, Section VII.5 and Consolidated Inspector Architecture"
}

design cfv_designs.NavigationStateService {
    title: "NavigationStateService (Jotai Atoms & Actions)"
    description: "Manages the visualizer's internal navigation state (current view, selected flow)."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Maintain atoms for `currentMode` (cfv_models.VisualizerModeEnum), `currentFlowFqn` (String), `systemViewActive` (Boolean).",
        "Provide actions to update navigation state (e.g., `navigateToFlow(flowFqn)`).",
        "Invoke `props.onViewChange` callback on navigation state changes with cfv_models.ViewChangePayload."
    ]
    source: "CascadeFlowVisualizer Library Specification, Section VII.6"
}

design cfv_designs.TraceListService {
    title: "TraceListService (Jotai Atoms & Effects)"
    description: "Manages fetching and displaying the list of historical flow runs."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Maintain `traceListSummariesAtom` (List<cfv_models.HistoricalFlowInstanceSummary>).",
        "Invoke `props.fetchTraceList` to populate the list.",
        "Facilitate selection of a trace, leading to updates in `props.traceData` and `props.mode` by the host application."
    ]
    dependencies: ["props.fetchTraceList", "props.renderFlowRunListItem"]
    source: "CascadeFlowVisualizer Library Specification, Section VII.7"
}

// --- Enhanced Services (Implementations) ---

design cfv_designs.TraceVisualizationService {
    title: "TraceVisualizationService (Execution Trace Overlays)"
    description: "Enhances graph elements with execution trace data, critical path analysis, and performance metrics. This service provides logic used by GraphBuilderService."
    part_of: cfv_designs.CascadeFlowVisualizerComponent // Conceptually used by GraphBuilder
    responsibilities: [
        "Provide logic to enhance nodes with trace overlay data (execution status, timing, data summaries) based on cfv_models.FlowExecutionTrace.",
        "Provide logic to enhance edges with execution path information and data flow details.",
        "Provide logic to calculate critical path through execution based on duration analysis.",
        "Define trace-based styling application rules for visual differentiation (used by consumer renderers)."
    ]
    dependencies: [
        "props.traceData" // Directly or indirectly via GraphBuilderService
    ]
    exposes_interface: {
        enhanceNodesWithTrace: "Signature: (nodes: cfv_models.ReactFlowNode[], traceData: cfv_models.FlowExecutionTrace, options?: cfv_models.TraceVisualizationOptions) => cfv_models.ReactFlowNode[]", // Node type implies cfv_models.EnhancedNodeData or similar
        enhanceEdgesWithTrace: "Signature: (edges: cfv_models.ReactFlowEdge[], traceData: cfv_models.FlowExecutionTrace, options?: cfv_models.TraceVisualizationOptions) => cfv_models.ReactFlowEdge[]",
        calculateCriticalPath: "Signature: (traceData: cfv_models.FlowExecutionTrace) => Set<string>"
    }
    source: "New implementation for advanced trace visualization. Logic from cfv_internal_code.TraceVisualizationService* specs integrated here."
}

design cfv_designs.YamlReconstructionService {
    title: "YamlReconstructionService (Module Save Operations)"
    description: "Reconstructs YAML content from DSL module representations and handles configuration changes for save operations. Used by InspectorStateService."
    part_of: cfv_designs.InspectorStateService // Logically part of the save workflow
    responsibilities: [
        "Reconstruct valid YAML content from parsed cfv_models.DslModuleRepresentations.",
        "Apply configuration changes to module representations with path-based updates.",
        "Create cfv_models.SaveModulePayload with validation and error handling.",
        "Preserve YAML structure and formatting where possible (respecting cfv_policies.Arch_EditingTradeoffsV1)."
    ]
    dependencies: [
        cfv_designs.ModuleRegistryService,
        "AbstractYamlParser", // For yaml.parse
        "AbstractYamlSerializer" // For yaml.stringify
    ]
    exposes_interface: {
        reconstructModuleYaml: "Signature: (moduleRep: cfv_models.DslModuleRepresentation, options?: cfv_models.ReconstructionOptions) => string",
        applyConfigChangesToRepresentation: "Signature: (moduleRep: cfv_models.DslModuleRepresentation, pathToConfig: (string | number)[], newConfigValue: any) => cfv_models.DslModuleRepresentation", // Renamed for clarity
        createSavePayload: "Signature: (moduleRep: cfv_models.DslModuleRepresentation, originalPathToConfig?: (string | number)[], originalNewConfigValue?: any, options?: cfv_models.ReconstructionOptions) => cfv_models.SaveModulePayload" // Updated to allow passing original change context
    }
    source: "New implementation for YAML round-trip editing. Logic from cfv_internal_code.YamlReconstructionService* specs integrated here."
}

design cfv_designs.TestCaseService { // Client-side helper, distinct from server-side execution
    title: "TestCaseService (Client-Side Test Definition Helpers)"
    description: "Client-side service for managing flow test case definitions, primarily for template generation and validation. Actual execution is via props.onRunTestCase which might involve server-side calls."
    part_of: cfv_designs.CascadeFlowVisualizerComponent // Used by DebugTestTab
    responsibilities: [
        "Generate cfv_models.FlowTestCase templates for flows (happy path, error handling, performance).",
        "Validate cfv_models.FlowTestCase definitions against flow structures and schemas (from cfv_designs.ModuleRegistryService and cfv_designs.ComponentSchemaService).",
        "Provide helper functions for test assertion evaluation if needed by consumer (though actual evaluation might be server-side)."
    ]
    dependencies: [
        cfv_designs.ModuleRegistryService,
        cfv_designs.ComponentSchemaService, // For schema validation
        "props.onRunTestCase" // For triggering actual execution
    ]
    exposes_interface: {
        generateTestCaseTemplates: "Signature: (flowFqn: string, moduleRegistry: cfv_models.IModuleRegistry) => cfv_models.FlowTestCase[]", // Simplified template type
        validateTestCase: "Signature: (testCase: cfv_models.FlowTestCase, moduleRegistry: cfv_models.IModuleRegistry, componentSchemaService: cfv_models.IComponentSchemaService) => { isValid: boolean; errors: string[] }",
        evaluateAssertionsLocally: "Signature: (assertions: cfv_models.TestCaseAssertion[], testResultData: cfv_models.Any) => cfv_models.AssertionResult[]" // Optional local evaluation
    }
    source: "New implementation for comprehensive test case management. Logic from cfv_internal_code.TestCaseService* specs integrated here."
}


// --- CONSOLIDATED INSPECTOR TAB DESIGNS ---

design cfv_designs.ConsolidatedInspectorTabsService { // This is more of a conceptual grouping for the tab designs
    title: "Consolidated Inspector Tabs Conceptual Grouping"
    description: "Groups the designs for the three consolidated inspector tabs: Source, Properties, and Debug & Test. Actual state management is by cfv_designs.InspectorStateService."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    dependencies: [
        cfv_designs.SourceTabService,
        cfv_designs.PropertiesTabService,
        cfv_designs.DebugTestTabService,
        cfv_designs.InspectorStateService
    ]
    source: "New consolidated inspector tab architecture"
}

design cfv_designs.SourceTabService {
    title: "SourceTabService (Logic for Source Tab Data Preparation)"
    description: "Defines the responsibilities and data flow for the Source tab. Content is rendered by consumer via props.renderInspectorSourceTab."
    part_of: cfv_designs.ConsolidatedInspectorTabsService
    responsibilities: [
        "Prepare cfv_models.InspectorSourceTabProps based on the selected element.",
        "Ensure module content is fetched from cfv_designs.ModuleRegistryService.",
        "Provide guidance (via cfv_consumer_directives) for YAML display, syntax highlighting, and element highlighting."
    ]
    dependencies: [
        cfv_designs.InspectorStateService, // For selected element
        cfv_designs.ModuleRegistryService
    ]
    api_contract_provided_to_consumer: cfv_models.InspectorSourceTabProps
    source: "New source tab implementation logic"
}

design cfv_designs.PropertiesTabService {
    title: "PropertiesTabService (Logic for Properties Tab Data Preparation & Actions)"
    description: "Defines responsibilities for the Properties tab, focusing on schema-driven form generation for component configuration editing. Content rendered by consumer. Replaces separate edit dialogs."
    part_of: cfv_designs.ConsolidatedInspectorTabsService
    responsibilities: [
        "Prepare cfv_models.InspectorPropertiesTabProps based on selected element.",
        "Provide cfv_models.InspectorPropertiesActions (including `requestSave`) for consumer's form.",
        "Ensure component schema (cfv_models.ComponentSchema.configSchema) is available for form generation.",
        "Provide guidance (via cfv_consumer_directives) for form generation, validation, and YAML preview."
    ]
    dependencies: [
        cfv_designs.InspectorStateService, // For selected element & save action orchestration
        cfv_designs.ModuleRegistryService, // For component schemas
        cfv_designs.ComponentSchemaService // For schema access
    ]
    api_contract_provided_to_consumer: cfv_models.InspectorPropertiesTabProps
    source: "Consolidated properties tab implementation logic"
}

design cfv_designs.DebugTestTabService {
    title: "DebugTestTabService (Logic for Debug & Test Tab Data Preparation & Actions)"
    description: "Defines responsibilities for the unified Debug & Test tab, supporting flow simulation, input/output inspection, and test case management. Content rendered by consumer."
    part_of: cfv_designs.ConsolidatedInspectorTabsService
    responsibilities: [
        "Prepare cfv_models.InspectorDebugTestTabProps based on current flow, selected element, and trace/test data.",
        "Provide comprehensive cfv_models.UnifiedDebugTestActions for all debug/test operations.",
        "Coordinate with cfv_designs.FlowSimulationService (client-side) for input resolution and basic simulation if needed.",
        "Coordinate with cfv_designs.ClientExecutionStreamHandler for server-side streaming execution.",
        "Provide guidance (via cfv_consumer_directives) for UI implementation of input forms, results display, etc."
    ]
    dependencies: [
        cfv_designs.InspectorStateService, // For context
        cfv_designs.ModuleRegistryService,
        cfv_designs.ComponentSchemaService,
        cfv_designs.FlowSimulationService, // Client-side simulation helpers
        cfv_designs.TestCaseService,       // Client-side test definition helpers
        cfv_designs.DataGenerationService, // For sample data
        cfv_designs.ClientExecutionStreamHandler // For server-side execution
    ]
    api_contract_provided_to_consumer: cfv_models.InspectorDebugTestTabProps
    source: "New unified debug & test tab implementation logic"
}

design cfv_designs.FlowSimulationService { // Client-side version
    title: "FlowSimulationService (Simplified Client-Side for Debugging Support)"
    description: "Provides simplified client-side flow simulation capabilities, primarily for supporting the Debug & Test tab with input data resolution and basic step-level testing. Complex/full execution is delegated to the server-side cfv_designs.StreamingExecutionAPIService."
    part_of: cfv_designs.DebugTestTabService // Logically supports the DebugTestTab
    responsibilities: [
        "Resolve input data for individual steps based on `inputs_map` and current flow context (cfv_models.ResolvedStepInput).",
        "Simulate execution of individual components to generate mock/example output data for UI display or testing forms (cfv_models.StepSimulationResult).",
        "Support basic data lineage resolution to show how a step's input is constructed.",
        "Provide helper functions for the Debug & Test tab to prepare data for display or for initiating more complex server-side execution."
    ]
    dependencies: [
        cfv_designs.ModuleRegistryService,
        cfv_designs.DataGenerationService, // For generating mock data
        cfv_designs.ComponentSchemaService // For understanding component I/O
    ]
    exposes_interface: { // Primarily internal methods used by DebugTestTabService
        resolveStepInputData: "Signature: (flowFqn: string, stepId: string, currentContext: cfv_models.ExecutionContext, moduleRegistry: cfv_models.IModuleRegistry) => Promise<cfv_models.ResolvedStepInput>",
        simulateStepExecutionClientSide: "Signature: (step: cfv_models.FlowStepDsl, resolvedInput: cfv_models.Any, moduleRegistry: cfv_models.IModuleRegistry, componentSchemaService: cfv_models.IComponentSchemaService) => cfv_models.StepSimulationResult"
    }
    architectural_changes: {
        removed_complexity: [
            "Full progressive flow execution with real-time UI updates (now server-side).",
            "Complex dependency graph building and parallel execution (now server-side).",
            "Manual execution trace construction and state management for full traces (now server-side).",
            "Detailed execution context management for entire flow runs (now server-side)."
        ],
        simplified_focus: [
            "Step-level input data resolution for Debug & Test tab forms.",
            "Basic mock output generation for individual components.",
            "Lightweight simulation helpers for UI development tools."
        ],
        server_delegation: [
            "Full flow execution (debug runs, test case runs) is primarily handled by cfv_designs.StreamingExecutionAPIService.",
            "Real-time execution updates are received via cfv_designs.ClientExecutionStreamHandler."
        ]
    }
    source: "Simplified client-side simulation service following FR12/FR23."
}

design cfv_designs.ComponentSchemaService {
    title: "ComponentSchemaService (Schema Access and Utility)"
    description: "Manages access to component schemas and provides utilities for schema-based operations like form generation and validation hints. Used by PropertiesTabService and DebugTestTabService."
    part_of_design: cfv_designs.CascadeFlowVisualizerComponent // Shared utility
    responsibilities: [
        "Provide access to cfv_models.ComponentSchema based on component FQN (via cfv_designs.ModuleRegistryService).",
        "Helper functions to prepare cfv_models.JsonSchemaObject suitable for form generation libraries (e.g., @rjsf/core) from cfv_models.ComponentSchema.configSchema or inputSchema.",
        "Provide hints or transformations for UI schema generation if needed."
        // Actual validation might be done by consumer using libraries like Zod/AJV with the schema provided.
    ]
    dependencies: [
        cfv_designs.ModuleRegistryService
    ]
    exposes_interface: { // Primarily internal methods
        getComponentSchema: "Signature: (componentTypeFqn: string, moduleRegistry: cfv_models.IModuleRegistry) => cfv_models.ComponentSchema | null",
        generateRjsfSchema: "Signature: (jsonSchema: cfv_models.JsonSchemaObject) => { schema: cfv_models.JsonSchemaObject, uiSchema?: cfv_models.Any }" // Example for RJSF
    }
    source: "New schema utility service to support Properties and DebugTest tabs."
}

design cfv_designs.DataGenerationService {
    title: "DataGenerationService (Client-Side Mock Data Generation)"
    description: "Client-side service to generate mock or sample data based on JSON schemas, primarily for populating input forms in the Debug & Test tab."
    part_of_design: cfv_designs.DebugTestTabService // Supports DebugTestTab
    responsibilities: [
        "Generate sample data ('happy path', empty, full optional) based on a cfv_models.JsonSchemaObject.",
        "Respect schema types, formats, enums, and default values when generating data.",
        "Handle nested objects and arrays.",
        "Used by cfv_models.UnifiedDebugTestActions.generateSchemaBasedInput."
    ]
    exposes_interface: { // Primarily internal methods
        generateDataFromSchema: "Signature: (schema: cfv_models.JsonSchemaObject, scenarioType: 'happyPath' | 'empty' | 'fullOptional', includeOptionalFields?: boolean) => cfv_models.Any"
    }
    source: "New data generation service to support DebugTestTab input forms. Logic from cfv_internal_code.FlowSimulationService_SimulateComponentExecution for data generation can be adapted here."
}


// --- NAVIGATION & UI BEHAVIOR DESIGNS ---

design cfv_designs.SubFlowInvokerNavigation {
    id: "CFV_DES_NAV_001" // Matches directive ID for consistency
    title: "SubFlowInvoker Double-Click Navigation Design"
    description: "Design for implementing seamless navigation between flows via SubFlowInvoker nodes, aligning with cfv_consumer_directives.SubFlowInvokerNavigation."
    part_of: cfv_designs.CascadeFlowVisualizerComponent // User interaction on the main canvas
    responsibilities: [
        "Handle `onNodeDoubleClick` events from React Flow.",
        "Check if the double-clicked node is a SubFlowInvoker (type 'subFlowInvokerNode').",
        "Extract `invokedFlowFqn` from `node.data` (cfv_models.SubFlowInvokerNodeData).",
        "Use `props.requestModule` to load the target flow module if not already loaded.",
        "Update `currentFlowFqn` via cfv_designs.NavigationStateService to switch the view.",
        "Provide user feedback for loading states and errors (e.g., target flow not found)."
    ]
    dependencies: [
        cfv_designs.NavigationStateService,
        cfv_designs.ModuleRegistryService, // To check if module is already loaded
        "props.requestModule"
    ]
    key_interactions: [
        "User double-clicks SubFlowInvoker node.",
        "Library resolves target flow FQN.",
        "Library requests module if needed.",
        "Library updates navigation state to display target flow."
    ]
    source: "Derived from cfv_consumer_directives.SubFlowInvokerNavigation and cfv_requirements.FR4_NavigationAndInteraction."
}

design cfv_designs.AutoZoomToFitService {
    title: "AutoZoomToFitService (React Flow Integration)"
    description: "Automatically adjusts zoom and pan to show all nodes when flows are loaded or navigation occurs, aligning with cfv_consumer_directives.AutoZoomToFit."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Trigger `fitView()` on initial flow load and when `currentFlowFqn` changes.",
        "Coordinate with cfv_designs.LayoutService to ensure layout is complete before fitting.",
        "Use smooth animation and appropriate padding (cfv_models.AutoZoomToFit.animation_settings).",
        "Debounce `fitView()` calls during rapid changes.",
        "Respect user's manual zoom/pan actions after the initial auto-fit.",
        "Account for enhanced spacing for wide nodes from cfv_designs.LayoutService."
    ]
    dependencies: [
        "AbstractReactFlowHook_useReactFlow", // For fitView
        cfv_designs.NavigationStateService, // To track currentFlowFqn changes
        cfv_designs.GraphBuilderService,    // To know when graph data (nodes) is ready
        cfv_designs.LayoutService           // To know when layout is complete
    ]
    source: "Derived from cfv_consumer_directives.AutoZoomToFit."
}

design cfv_designs.InspectorTabSelectionBehavior {
    title: "Inspector Tab Selection Behavior"
    description: "Defines the behavior for inspector tab selection with manual-only tab switching to prevent flickering and preserve user intent. Implemented within cfv_designs.InspectorStateService."
    part_of: cfv_designs.InspectorStateService
    responsibilities: [
        "Maintain user's active tab selection as persistent state (e.g., Jotai atom `activeInspectorTabAtom`).",
        "Only change active tab state when user explicitly clicks on a tab UI element.",
        "Ensure tab selection is preserved across component selections and view navigations.",
        "Render tab content based on current active tab and availability rules for the selected element."
    ]
    behavioral_rules: [
        "Default active tab is 'Source'.",
        "Tab switching is ONLY triggered by direct user click on a tab.",
        "The active tab state persists even if the selected element changes or if the current active tab is not available for the new element (in which case, the tab would show a 'not available' message or be disabled).",
        "Tab availability (visibility/enabled state of tab buttons) is determined by cfv_consumer_directives.InspectorTabImplementation.tab_priority_and_defaults.visibility_rules."
    ]
    source: "User feedback and simplification of tab behavior."
}

// --- SERVER-SIDE STREAMING EXECUTION DESIGNS (FR12) ---

design cfv_designs.StreamingExecutionAPIService { // Server-Side
    title: "StreamingExecutionAPIService (Server-Side Flow Execution)"
    description: "Server-side service responsible for executing Cascade DSL flows with real-time streaming updates via Server-Sent Events (SSE). Implements advanced dependency resolution and expression parsing."
    part_of: cfv_designs.CoreArchitecture // Represents a backend component
    responsibilities: [
        "Receive flow execution requests (including flow definition, trigger input, target step).",
        "Perform comprehensive dependency analysis of the flow steps, including cycle detection.",
        "Execute flow steps in a layered, dependency-aware manner, supporting parallel execution where possible.",
        "Resolve complex input mappings and conditions using advanced expression parsing.",
        "Simulate component execution with realistic timing and data propagation.",
        "Stream execution events (execution.started, step.started, step.completed, step.failed, execution.completed, execution.warning, execution.failed) to the client via SSE.",
        "Handle execution cancellation and timeouts."
    ]
    dependencies: [ // Conceptual server-side dependencies
        "ServerHTTPServer", // For API endpoints
        "ServerSSEService", // For managing SSE connections
        "ServerFlowParser", // If flow definition needs re-parsing/validation on server
        "ServerComponentSimulator" // For simulating individual component logic
    ]
    exposes_interface: { // HTTP API Endpoints
        executeFlow: "POST /api/execution/flow (Request: cfv_models.StreamingExecutionRequest, Response: SSE stream of cfv_models.StreamingExecutionEvent)",
        // Other potential endpoints: cancelExecution, getExecutionStatus
    }
    key_features: [
        "Advanced dependency resolution (cfv_internal_code.ServerExecutionEngine_EnhancedDependencyResolution)",
        "Robust expression parsing (cfv_internal_code.ServerExecutionEngine_EnhancedExpressionResolution)",
        "Layered parallel execution (cfv_internal_code.ServerExecutionEngine_LayeredExecutionStrategy)"
    ]
    source: "Requirement FR12_EnhancedStreamingExecution"
}

design cfv_designs.ClientExecutionStreamHandler { // Client-Side
    title: "ClientExecutionStreamHandler (Manages SSE and State Updates)"
    description: "Client-side service to establish and manage the SSE connection for flow execution, parse incoming events, and update the visualizer's state for real-time feedback."
    part_of: cfv_designs.CascadeFlowVisualizerComponent // Integrated into the main component or DebugTestTabService
    responsibilities: [
        "Initiate SSE connection to cfv_designs.StreamingExecutionAPIService when a debug/test execution is triggered.",
        "Handle incoming cfv_models.StreamingExecutionEvent messages.",
        "Update internal state (e.g., Jotai atoms for cfv_models.FlowExecutionTrace) based on events, ensuring proper React re-rendering via new object references.",
        "Manage connection lifecycle: open, message, error, close.",
        "Implement robust error handling and automatic reconnection strategies (exponential backoff).",
        "Pre-populate all flow steps with PENDING status upon 'execution.started' event.",
        "Signal cfv_designs.CascadeFlowVisualizerComponent or relevant UI parts to refresh based on new trace data."
    ]
    dependencies: [
        "BrowserEventSourceAPI", // For SSE connection
        "JotaiAtomsForTraceData", // Specific atoms for managing the live trace
        cfv_designs.DebugTestTabService // Likely initiates calls that lead to streaming
    ]
    key_features: [
        "React-friendly state updates (cfv_internal_code.ClientExecutionStreamHandler_EnhancedStateManagement)",
        "Automatic reconnection and event replay (conceptual)"
    ]
    source: "Requirement FR12_EnhancedStreamingExecution"
}

// --- Internal Logic Grouping Designs (New) ---
// These are introduced to group related `code` specs that were previously part of
// monolithic `service` blocks in cfv_internal_services_code.dspec.md or implicit in cfv_internal_code.dspec.md.

design cfv_designs.InternalComponentExecutionLogic {
    title: "Internal Component Execution Logic"
    description: "Groups `code` specifications related to the internal simulation of individual components and triggers. Used by cfv_designs.InternalFlowSimulationLogic."
    part_of: cfv_designs.CascadeFlowVisualizerComponent // Internal logic
}

design cfv_designs.InternalYamlReconstructionLogic {
    title: "Internal YAML Reconstruction Logic"
    description: "Groups `code` specifications for reconstructing YAML from module representations and applying configuration changes. Used by cfv_designs.YamlReconstructionService."
    part_of: cfv_designs.YamlReconstructionService // Internal logic
}

design cfv_designs.InternalTraceVisualizationLogic {
    title: "Internal Trace Visualization Logic"
    description: "Groups `code` specifications for processing trace data and preparing overlays. Used by cfv_designs.TraceVisualizationService."
    part_of: cfv_designs.TraceVisualizationService // Internal logic
}

design cfv_designs.InternalLayoutServiceLogic {
    title: "Internal Layout Service Logic"
    description: "Groups `code` specifications for detailed layout algorithms, spacing calculations, and node sizing. Used by cfv_designs.LayoutService."
    part_of: cfv_designs.LayoutService // Internal logic
}

design cfv_designs.InternalComponentSchemaLogic {
    title: "Internal Component Schema Logic"
    description: "Groups `code` specifications for schema retrieval, form schema generation, and validation. Used by cfv_designs.ComponentSchemaService."
    part_of: cfv_designs.ComponentSchemaService // Internal logic
}

design cfv_designs.InternalTestCaseLogic {
    title: "Internal Test Case Logic"
    description: "Groups `code` specifications for test case template generation, validation, and local assertion evaluation. Used by cfv_designs.TestCaseService."
    part_of: cfv_designs.TestCaseService // Internal logic
}

design cfv_designs.InternalDataGenerationLogic {
    title: "Internal Data Generation Logic"
    description: "Groups `code` specifications for generating test data based on schemas. Used by cfv_designs.DataGenerationService."
    part_of: cfv_designs.DataGenerationService // Internal logic
}

design cfv_designs.InternalGraphBuilderLogic {
    title: "Internal Graph Builder Logic"
    description: "Groups `code` specifications for detailed graph node and edge generation. Used by cfv_designs.GraphBuilderService."
    part_of: cfv_designs.GraphBuilderService // Internal logic
}