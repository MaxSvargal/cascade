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
        
        1. External Event Arrives: Standard HTTP request, scheduled time, event publication, manual execution
        2. Trigger Processing: Parse URL/headers/body, apply DSL configuration, validate, transform to standard format
        3. Standardized Output: Predictable data structure conforming to triggerOutputSchema (parsed queryParameters, normalized headers, processed body)
        4. Flow Context: Trigger output becomes available as 'trigger.*' in flow expressions
        
        Example for HTTP Trigger:
        Input: { url: "https://api.com/users?source=web", method: "POST", headers: {...}, body: {...} }
        Config: { path: "/users", method: "POST", requestSchema: {...} }
        Output: { path: "/users", method: "POST", queryParameters: {source: "web"}, headers: {...}, body: {...} }
    `
    trigger_types: [
        "HTTP Triggers: Process raw HTTP requests (url, headers, body) into standardized HttpTriggerRequest format (path, method, queryParameters, body, principal)",
        "Scheduled Triggers: Convert timing events into ScheduledTriggerPayload format with triggerTime, scheduledTime, and configured payload",
        "EventBus Triggers: Transform event bus messages into EventBusTriggerPayload with standardized event metadata and payload",
        "Manual Triggers: Process initial data into standardized format with initialData field for programmatic flow execution",
        "Stream Triggers: Convert streaming messages into StreamTriggerMessage or StreamTriggerBatch formats with message and metadata"
    ]
    schema_distinction: `
        - configSchema: Defines the structure for configuring the trigger (e.g., HTTP path/method, CRON expression, authentication settings)
        - inputSchema: Defines the structure of raw external event data the trigger receives (e.g., raw HTTP request with url/headers/body, raw event bus message)
        - outputSchema: Defines the standardized, processed data structure the trigger provides to the flow (e.g., parsed path/queryParameters/principal for HTTP)
        - Key insight: inputSchema ≠ outputSchema - triggers transform raw external data into standardized flow-ready formats
    `
    implementation_notes: [
        "Triggers receive standard external events as inputs and transform them into standardized outputs using DSL configuration",
        "inputSchema defines the structure of standard external event data (e.g., HTTP request with url/method/headers/body)",
        "outputSchema defines the processed, standardized format provided to flows (e.g., parsed path/queryParameters/normalized headers/processed body)",
        "configSchema defines how triggers should be configured (path patterns, method constraints, request schemas, authentication rules)",
        "Triggers act as data adapters: Standard External Data + DSL Config → Processing/Validation → Standardized Flow Data",
        "Client-side simulation should demonstrate the input + config → output transformation process",
        "CRITICAL: For HTTP triggers, URL parsing extracts path and queryParameters from the url field in input data",
        "Input data represents standard external event format, output data represents parsed and standardized flow context",
        "Configuration influences how input is processed (e.g., path patterns, body parsing rules, header normalization)",
        "Query parameters are extracted from URL string and converted to key-value object in output",
        "Headers are normalized to lowercase keys for consistency in output",
        "Body is parsed based on content-type header and configuration rules"
    ]
    fulfills: [cfv_overview.CorePurpose]
    tags: ["Triggers", "DataFlow", "Architecture", "CascadeDSL"]
    source: "Trigger Architecture Summary and stdlib.yml.md specifications"
}