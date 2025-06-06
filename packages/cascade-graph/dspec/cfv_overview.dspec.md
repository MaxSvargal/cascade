// cfv_overview.dspec.md
// Refined according to DefinitiveSpec methodology with qualified names and stable IDs

requirement cfv_overview.CorePurpose {
    id: "CFV_REQ_CORE_001"
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
    id: "CFV_DES_LIB_001"
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
    fulfills: [cfv_overview.CorePurpose]
    applies_policies: [
        cfv_policies.Arch_ReactFlowElkjsFoundation,
        cfv_policies.Arch_ModuleCentric,
        cfv_policies.Arch_ExternalizeVisualsAndBehavior
    ]
    tags: ["React", "Visualization", "CascadeDSL", "Library", "DeveloperTool"]
    source: "CascadeFlowVisualizer Library Specification, refined with DefinitiveSpec methodology"
}

design cfv_overview.TriggerArchitecture {
    id: "CFV_DES_TRIGGER_001"
    title: "Trigger Architecture and Data Flow"
    description: `
        Triggers in the Cascade DSL are entry points that convert external events into standardized 
        flow execution contexts. This architecture ensures predictable data flow and reliable 
        component integration across different trigger types.
    `
    key_concepts: [
        "Trigger Configuration vs Runtime Data: Triggers have two distinct data aspects - configuration (how to set up the trigger) and runtime data (standardized output provided to the flow).",
        "External Event Processing: Triggers receive external events (HTTP requests, scheduled times, event bus messages) and convert them into standardized formats.",
        "Standardized Output Schemas: Each trigger type provides a predictable output schema (triggerOutputSchema) that flows can reliably reference via 'trigger.*' expressions.",
        "Configuration-Driven Behavior: Trigger behavior is determined by configuration (paths, schedules, event patterns) rather than runtime input data."
    ]
    data_flow_pattern: `
        External Event → Trigger Processing → Standardized Output → Flow Execution
        
        1. External Event Arrives: HTTP request, scheduled time, event publication, manual execution
        2. Trigger Processing: Authentication, validation, filtering, transformation to standard format
        3. Standardized Output: Predictable data structure conforming to triggerOutputSchema
        4. Flow Context: Trigger output becomes available as 'trigger.*' in flow expressions
    `
    trigger_types: [
        "HTTP Triggers: Convert HTTP requests into HttpTriggerRequest format with path, method, headers, body, principal",
        "Scheduled Triggers: Provide timing information and configured payload in ScheduledTriggerPayload format",
        "EventBus Triggers: Standardize events into EventBusTriggerPayload with event metadata and payload",
        "Manual Triggers: Pass through provided data as initialData for programmatic flow execution",
        "Stream Triggers: Process streaming messages into StreamTriggerMessage or StreamTriggerBatch formats"
    ]
    schema_distinction: `
        - configSchema: Defines the structure for configuring the trigger (e.g., HTTP path/method, CRON expression)
        - inputSchema: Defines the structure of external event data the trigger receives (e.g., HTTP request structure, event bus message format)
        - outputSchema: Defines the standardized data structure the trigger provides to the flow at runtime
    `
    implementation_notes: [
        "Triggers receive external events as inputs (not from other flow steps)",
        "inputSchema defines the structure of external event data triggers expect to receive",
        "outputSchema defines the standardized format triggers provide to flows",
        "configSchema defines how triggers should be configured to receive external events",
        "Client-side simulation focuses on generating plausible standardized output for UI/testing purposes"
    ]
    fulfills: [cfv_overview.CorePurpose]
    tags: ["Triggers", "DataFlow", "Architecture", "CascadeDSL"]
    source: "Trigger Architecture Summary and stdlib.yml.md specifications"
}