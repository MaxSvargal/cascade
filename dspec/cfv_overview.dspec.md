// cfv_overview.dspec.md
// Refined according to DefinitiveSpec methodology with qualified names and stable IDs

requirement cfv_overview.CorePurpose {
    id: "CFV_REQ_CORE_001" // Added stable ID for reference
    title: "Core Purpose of CascadeFlowVisualizer Library"
    description: `
        The CascadeFlowVisualizer is a React-based library designed to provide an interactive,
        IDE-like visual environment for working with Cascade DSL V1.1 documents.
        Its primary goals are to:
        1. Enable users to intuitively understand the structure, data flow, control flow, and context variable usage within individual flows defined in Cascade DSL.
        2. Visualize relationships and dependencies between different flows and modules in a larger system specified using Cascade DSL.
        3. Facilitate inspection and (V1 scope) editing of DSL configurations using dynamically generated forms based on component schemas (cfv_models.ComponentSchema).
        4. Provide robust debugging capabilities by visualizing historical flow execution traces (cfv_models.FlowExecutionTrace), including step statuses, resolved inputs, and actual outputs.
        5. Support property testing by allowing users to define, execute, and visualize test cases (cfv_models.FlowTestCase) against flow definitions.
        6. Offer clear navigation across a distributed system of interconnected flows defined in multiple modules (cfv_models.DslModuleInput).
        7. Be highly extensible through consumer-provided renderers for UI elements (nodes, edges, inspector tabs) and callbacks for external operations.
    `
    priority: "Critical"
    status: "Accepted"
    source: "CascadeFlowVisualizer Library Specification, Section I"
    tags: ["core", "purpose", "requirements"]
}

design cfv_overview.LibraryDefinition {
    id: "CFV_DES_LIB_001" // Added stable ID
    title: "CascadeFlowVisualizer Library"
    description: "A React-based library for visualizing, editing, debugging, and testing Cascade DSL V1.1 flows and systems."
    responsibilities: [
        "Visualizing Cascade DSL flows and system overviews according to defined layout policies (cfv_policies.Arch_ReactFlowElkjsFoundation).",
        "Managing Cascade DSL modules (cfv_models.DslModuleInput) and their definitions, including parsing and import resolution via cfv_designs.ModuleRegistryService.",
        "Facilitating inspection and schema-driven editing of DSL configurations through cfv_models.InspectorPropertiesTabProps.",
        "Displaying flow execution traces (cfv_models.FlowExecutionTrace) for debugging and analysis via cfv_models.InspectorDebugTestTabProps.",
        "Providing an interface for defining and running property tests (cfv_models.FlowTestCase) against flows through cfv_models.UnifiedDebugTestActions.",
        "Orchestrating interactions between internal services (cfv_designs.ModuleRegistryService, cfv_designs.GraphBuilderService, cfv_designs.LayoutService, etc.) and consumer-provided components/callbacks."
    ]
    fulfills: [cfv_overview.CorePurpose] // Using qualified name
    applies_policies: [
        cfv_policies.Arch_ReactFlowElkjsFoundation,
        cfv_policies.Arch_ModuleCentric,
        cfv_policies.Arch_ExternalizeVisualsAndBehavior
    ]
    tags: ["React", "Visualization", "CascadeDSL", "Library", "DeveloperTool"]
    source: "CascadeFlowVisualizer Library Specification, refined with DefinitiveSpec methodology"
}