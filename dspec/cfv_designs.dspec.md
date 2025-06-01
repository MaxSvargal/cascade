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
    title: "LayoutService (Integrates elkjs-reactflow)"
    description: "Applies ELK.js layout algorithm to generated graph data."
    part_of: cfv_designs.CascadeFlowVisualizerComponent
    responsibilities: [
        "Consume `nodes` and `edges` from GraphBuilderService.",
        "Utilize ELK.js (via `elkjs-reactflow` or direct integration) to compute layout positions.",
        "Apply `props.elkOptions` for layout customization."
    ]
    dependencies: [cfv_designs.GraphBuilderService, "props.elkOptions"]
    source: "CascadeFlowVisualizer Library Specification, Section VII.3"
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