// cfv_models.dspec
// Defines data models (TypeScript interfaces and types) for CascadeFlowVisualizer props and internal structures.

// --- Core & Module Related Types ---
model cfv_models.DslModuleInput {
    description: "Input structure for providing a DSL module to the visualizer."
    fqn: String { required: true; description: "Fully Qualified Name of the module." }
    content: String { required: true; description: "Raw YAML content of the module." }
}

model cfv_models.RequestModuleResult {
    description: "Result structure when a module is requested via `props.requestModule`."
    fqn: String { required: true; description: "FQN of the loaded module." }
    content: String { required: true; description: "Raw YAML content of the loaded module." }
}

model cfv_models.SaveModulePayload {
    description: "Payload for saving a modified module via `props.onSaveModule`."
    fqn: String { required: true; description: "FQN of the module to save." }
    newContent: String { required: true; description: "New full YAML content of the module." }
}

model cfv_models.SelectedElementSourceEnum {
    description: "Enum defining the source of a selected UI element."
    type: String
    constraints: "enum:['flowNode', 'flowEdge', 'systemFlowNode', 'systemTriggerNode', 'moduleListItem', 'flowListItem', 'namedComponentListItem', 'triggerListItem', 'traceListItem']"
}

model cfv_models.SelectedElement {
    description: "Represents a currently selected element in the UI."
    sourceType: cfv_models.SelectedElementSourceEnum { required: true; }
    id: String { required: true; description: "React Flow node/edge ID or FQN/ID for list items." }
    data?: cfv_models.Any { description: "Associated data: React Flow node/edge object, DslModuleRepresentation, FlowDefinition summary, etc."}
    moduleFqn?: String { description: "FQN of the module this element belongs to." }
}

model cfv_models.InspectorPropertiesActions {
    description: "Actions available to the consumer-rendered Properties/Config inspector tab."
    requestSave: cfv_models.Function {
        required: true;
        description: "Call to request saving changes to a part of the selected element's configuration. Signature: (newConfigValue: any, pathToConfig: (string | number)[]) => void";
    }
}

model cfv_models.DslModuleRepresentation {
    description: "Internal representation of a loaded DSL module."
    fqn: String { required: true; }
    rawContent: String { required: true; }
    parsedContent?: Object { description: "Parsed YAML as a JavaScript object." }
    definitions?: cfv_models.DslModuleDefinitions { description: "Extracted definitions from the module." }
    imports?: List<cfv_models.DslModuleImportItem>
    errors?: List<cfv_models.DslModuleErrorItem> { description: "Errors from parsing or validation." }
    status: cfv_models.DslModuleStatusEnum { required: true; }
}
    model cfv_models.DslModuleDefinitions {
        context: List<cfv_models.Any> { required: true; }
        components: List<cfv_models.Any> { required: true; }
        flows: List<cfv_models.Any> { required: true; }
    }
    model cfv_models.DslModuleImportItem {
        alias?: String
        fqn: String { required: true; }
        version?: String
    }
    model cfv_models.DslModuleErrorItem {
        message: String { required: true; }
        path?: List<cfv_models.StringOrNumber>
        // Other error details can be added as Any
    }
    model cfv_models.StringOrNumber {
        type: "Union<String, Number>"
    }
    model cfv_models.DslModuleStatusEnum {
        type: String
        constraints: "enum:['unloaded', 'loading', 'loaded', 'error']"
    }


// --- Node & Edge Data Payloads (Conceptual) ---
model cfv_models.BaseNodeData {
    description: "Base data common to many node types. This model's fields are incorporated into specific node data models."
    label: String { required: true; }
    dslObject?: cfv_models.Any { description: "Raw DSL definition snippet for this element." }
    resolvedComponentFqn?: String { description: "Fully resolved FQN of the component type." }
    componentSchema?: cfv_models.ComponentSchema { description: "JSON schema for the component, if available." }
    isNamedComponent?: Boolean
    contextVarUsages?: List<String> { description: "Context variable names used." }
    error?: cfv_models.NodeError { description: "Error info if this element has a validation/resolution error." }
}
    model cfv_models.NodeError {
        message: String { required: true; }
        details?: cfv_models.Any
        isFatal?: Boolean
    }

model cfv_models.StepNodeData {
    description: "Data specific to flow step nodes in Flow Detail view. Incorporates fields from BaseNodeData."
    // Fields from cfv_models.BaseNodeData
    label: String { required: true; }
    dslObject?: cfv_models.Any { description: "Raw DSL definition snippet for this element." }
    resolvedComponentFqn?: String { description: "Fully resolved FQN of the component type." }
    componentSchema?: cfv_models.ComponentSchema { description: "JSON schema for the component, if available." }
    isNamedComponent?: Boolean
    contextVarUsages?: List<String> { description: "Context variable names used." }
    error?: cfv_models.NodeError { description: "Error info if this element has a validation/resolution error." }
    // Fields specific to StepNodeData
    stepId: String { required: true; }
    executionStatus?: cfv_models.ExecutionStatusEnum
    executionDurationMs?: Number
    executionInputData?: cfv_models.Any
    executionOutputData?: cfv_models.Any
}
    model cfv_models.ExecutionStatusEnum {
        type: String
        constraints: "enum:['SUCCESS', 'FAILURE', 'SKIPPED', 'RUNNING']"
    }

model cfv_models.SubFlowInvokerNodeData {
    description: "Data specific to SubFlowInvoker nodes. Incorporates fields from StepNodeData."
    // Fields from cfv_models.StepNodeData (which includes BaseNodeData)
    label: String { required: true; }
    dslObject?: cfv_models.Any { description: "Raw DSL definition snippet for this element." }
    resolvedComponentFqn?: String { description: "Fully resolved FQN of the component type." }
    componentSchema?: cfv_models.ComponentSchema { description: "JSON schema for the component, if available." }
    isNamedComponent?: Boolean
    contextVarUsages?: List<String> { description: "Context variable names used." }
    error?: cfv_models.NodeError { description: "Error info if this element has a validation/resolution error." }
    stepId: String { required: true; }
    executionStatus?: cfv_models.ExecutionStatusEnum
    executionDurationMs?: Number
    executionInputData?: cfv_models.Any
    executionOutputData?: cfv_models.Any
    // Fields specific to SubFlowInvokerNodeData
    invokedFlowFqn: String { required: true; }
}

model cfv_models.TriggerEntryPointNodeData {
    description: "Data specific to the trigger entry point node in Flow Detail view. Incorporates fields from BaseNodeData."
    // Fields from cfv_models.BaseNodeData
    label: String { required: true; }
    dslObject?: cfv_models.Any { description: "Raw DSL definition snippet for this element." }
    resolvedComponentFqn?: String { description: "Fully resolved FQN of the component type." }
    componentSchema?: cfv_models.ComponentSchema { description: "JSON schema for the component, if available." }
    isNamedComponent?: Boolean
    contextVarUsages?: List<String> { description: "Context variable names used." }
    error?: cfv_models.NodeError { description: "Error info if this element has a validation/resolution error." }
    // Fields specific to TriggerEntryPointNodeData
    triggerType: String { required: true; }
}

model cfv_models.SystemGraphNodeData {
    description: "Data specific to nodes in the System Overview graph. Incorporates fields from BaseNodeData."
    // Fields from cfv_models.BaseNodeData
    label: String { required: true; }
    dslObject?: cfv_models.Any { description: "Raw DSL definition snippet for this element." }
    resolvedComponentFqn?: String { description: "Fully resolved FQN of the component type." }
    componentSchema?: cfv_models.ComponentSchema { description: "JSON schema for the component, if available." }
    isNamedComponent?: Boolean
    contextVarUsages?: List<String> { description: "Context variable names used." }
    error?: cfv_models.NodeError { description: "Error info if this element has a validation/resolution error." }
    // Fields specific to SystemGraphNodeData
    fqn: String { required: true; description: "FQN of the flow or unique ID for the trigger source." }
}

model cfv_models.BaseEdgeData {
    description: "Base data for edges. This model's fields are incorporated into specific edge data models."
    // Common edge properties if any (currently none defined here)
}

model cfv_models.FlowEdgeData {
    description: "Data specific to edges in the Flow Detail view. Incorporates fields from BaseEdgeData."
    // Fields from cfv_models.BaseEdgeData (currently none)
    // Fields specific to FlowEdgeData
    type: cfv_models.FlowEdgeTypeEnum { required: true; }
    sourceStepId?: String
    targetStepId: String { required: true; }
    isExecutedPath?: Boolean { description: "Indicates if this edge was traversed in a trace." }
}
    model cfv_models.FlowEdgeTypeEnum {
        type: String
        constraints: "enum:['dataFlow', 'controlFlow']"
    }

model cfv_models.SystemEdgeData {
    description: "Data specific to edges in the System Overview graph. Incorporates fields from BaseEdgeData."
    // Fields from cfv_models.BaseEdgeData (currently none)
    // Fields specific to SystemEdgeData
    type: cfv_models.SystemEdgeTypeEnum { required: true; }
}
    model cfv_models.SystemEdgeTypeEnum {
        type: String
        constraints: "enum:['invocationEdge', 'triggerLinkEdge']"
    }

// --- Component Schema ---
model cfv_models.ComponentSchema {
    description: "Represents the schema for a component type."
    fqn: String { required: true; description: "FQN of the component type." }
    configSchema?: Object { description: "JSON Schema for the 'config' block." }
    inputSchema?: Object { description: "JSON Schema describing input ports/data structure." }
    outputSchema?: Object { description: "JSON Schema describing output ports/data structure." }
}

// --- Trace & Debugging Types ---
model cfv_models.StepExecutionTrace {
    description: "Trace data for a single step execution."
    stepId: String { required: true; }
    status: cfv_models.ExecutionStatusEnum { required: true; }
    startTime?: String { format: "date-time" }
    endTime?: String { format: "date-time" }
    durationMs?: Number
    inputData?: cfv_models.Any
    outputData?: cfv_models.Any
    resolvedConfig?: cfv_models.Any
    contextBefore?: Object // Record<string, any>
    contextAfter?: Object  // Record<string, any>
}

model cfv_models.FlowExecutionTrace {
    description: "Detailed execution log data for a flow instance."
    traceId: String { required: true; }
    flowFqn: String { required: true; }
    instanceId?: String
    status: cfv_models.FlowExecutionStatusEnum { required: true; }
    startTime: String { required: true; format: "date-time" }
    endTime?: String { format: "date-time" }
    durationMs?: Number
    triggerData?: cfv_models.Any
    initialContext?: Object // Record<string, any>
    finalContext?: Object   // Record<string, any>
    steps: List<cfv_models.StepExecutionTrace> { required: true; }
}
    model cfv_models.FlowExecutionStatusEnum {
        type: String
        constraints: "enum:['COMPLETED', 'FAILED', 'RUNNING', 'TERMINATED']"
    }

model cfv_models.HistoricalFlowInstanceSummary {
    description: "Summary information for a historical flow instance, for list display."
    id: String { required: true; description: "Typically traceId or instanceId." }
    flowFqn: String { required: true; }
    startTime: String { required: true; format: "date-time" }
    status: String { required: true; description: "e.g., 'COMPLETED', 'FAILED'." }
    // Other summary fields can be added as Any
}

// --- Property Testing Types ---
model cfv_models.TestCaseAssertion {
    description: "Defines an assertion for a property test case."
    // Based on provided library spec, details are "as before", so assuming:
    targetPath: String { required: true; description: "JMESPath to data in step output or context." }
    expectedValue: cfv_models.Any { required: true; description: "Expected value or pattern." }
    comparison: String { required: true; default: "equals"; description: "e.g., 'equals', 'contains', 'matchesRegex'." }
}
model cfv_models.MockedComponentResponse {
    description: "Defines a mocked response for a component in a test case."
    // Assuming:
    stepIdPattern: String { required: true; description: "Regex or ID of step(s) to mock." }
    outputData?: cfv_models.Any { description: "Data to return as output." }
    errorData?: cfv_models.Any { description: "Error to simulate." }
    delayMs?: Number
}
model cfv_models.FlowTestCase {
    description: "Defines a property test case for a flow."
    // Assuming:
    flowFqn: String { required: true; }
    description?: String
    triggerInput: cfv_models.Any { required: true; }
    contextOverrides?: Object // Record<string, any>
    componentMocks?: List<cfv_models.MockedComponentResponse>
    assertions: List<cfv_models.TestCaseAssertion> { required: true; }
}
model cfv_models.AssertionResult {
    description: "Result of a single assertion execution. Incorporates fields from TestCaseAssertion."
    // Fields from cfv_models.TestCaseAssertion
    targetPath: String { required: true; description: "JMESPath to data in step output or context." }
    expectedValue: cfv_models.Any { required: true; description: "Expected value or pattern." }
    comparison: String { required: true; default: "equals"; description: "e.g., 'equals', 'contains', 'matchesRegex'." }
    // Fields specific to AssertionResult
    actualValue?: cfv_models.Any
    passed: Boolean { required: true; }
    message?: String
}
model cfv_models.TestRunResult {
    description: "Overall result of a test case execution."
    // Assuming:
    testCase: cfv_models.FlowTestCase { required: true; }
    passed: Boolean { required: true; }
    trace?: cfv_models.FlowExecutionTrace
    assertionResults: List<cfv_models.AssertionResult> { required: true; }
    error?: String { description: "Error message if test run failed globally." }
}

// --- Module Registry Interface (for custom renderers) ---
model cfv_models.IModuleRegistry {
    description: "Interface for accessing loaded module and schema data, provided to custom renderers."
    getLoadedModule: cfv_models.Function {
        required: true;
        description: "Signature: (fqn: String) => cfv_models.DslModuleRepresentation | null";
    }
    getAllLoadedModules: cfv_models.Function {
        required: true;
        description: "Signature: () => List<cfv_models.DslModuleRepresentation>";
    }
    resolveComponentTypeInfo: cfv_models.Function {
        required: true;
        description: "Signature: (componentRef: String, currentModuleFqn: String) => cfv_models.ResolvedComponentInfo | null";
    }
    getComponentSchema: cfv_models.Function {
        required: true;
        description: "Signature: (componentTypeFqn: String) => cfv_models.ComponentSchema | null";
    }
    getFlowDefinition: cfv_models.Function {
        required: true;
        description: "Signature: (flowFqn: String) => cfv_models.Any | null";
    }
    getNamedComponentDefinition: cfv_models.Function {
        required: true;
        description: "Signature: (componentFqn: String) => cfv_models.Any | null";
    }
    getContextDefinition: cfv_models.Function {
        required: true;
        description: "Signature: (contextFqn: String) => cfv_models.Any | null";
    }
}
    model cfv_models.ResolvedComponentInfo {
        baseType: String { required: true; }
        componentDefinition?: cfv_models.Any
        sourceModuleFqn: String { required: true; }
        isNamedComponent: Boolean { required: true; }
    }

// --- Main Component Props ---
model cfv_models.CascadeFlowVisualizerProps {
    description: "Props for the main <CascadeFlowVisualizer /> React component."
    // Core Data & Loading
    initialModules?: List<cfv_models.DslModuleInput>
    requestModule: cfv_models.Function {
        required: true;
        description: "Callback signature: (fqn: String) => Promise<cfv_models.RequestModuleResult | null>";
    }
    componentSchemas?: Object // Record<string, ComponentSchema>
    onModuleLoadError?: cfv_models.Function {
        description: "Callback signature: (fqn: String, error: Error) => void";
    }
    parseContextVariables: cfv_models.Function {
        required: true;
        description: "Callback signature: (value: String) => List<String>";
    }

    // Editing
    isEditingEnabled?: Boolean
    onSaveModule?: cfv_models.Function {
        description: "Callback signature: (payload: cfv_models.SaveModulePayload) => Promise<void | boolean>";
    }

    // Mode & Data
    mode: cfv_models.VisualizerModeEnum { required: true; }
    designData?: cfv_models.DesignDataProps
    traceData?: cfv_models.FlowExecutionTrace
    testResultData?: cfv_models.TestRunResult

    // Callbacks
    onViewChange?: cfv_models.Function {
        description: "Callback signature: (view: cfv_models.ViewChangePayload) => void";
    }
    onElementSelect?: cfv_models.Function {
        description: "Callback signature: (element: cfv_models.SelectedElement | null) => void";
    }

    // Debugging & Trace Callbacks
    fetchTraceList?: cfv_models.Function {
        description: "Callback signature: (filterOptions?: cfv_models.Any) => Promise<List<cfv_models.HistoricalFlowInstanceSummary>>";
    }

    // Property Testing Callbacks
    onRunTestCase?: cfv_models.Function {
        description: "Callback signature: (testCase: cfv_models.FlowTestCase) => Promise<cfv_models.TestRunResult | null>";
    }

    // Customization (Renderers)
    customReactFlowProOptions?: Object // Partial<ReactFlowProps>
    customNodeTypes: Object { required: true; description: "React Flow NodeTypes object." } // NodeTypes
    customEdgeTypes: Object { required: true; description: "React Flow EdgeTypes object." } // EdgeTypes
    renderInspectorPropertiesTab?: cfv_models.Function {
        description: "Signature: (selectedElement: cfv_models.SelectedElement | null, actions: cfv_models.InspectorPropertiesActions, moduleRegistry: cfv_models.IModuleRegistry) => cfv_models.ReactNode";
    }
    renderInspectorSourceTab?: cfv_models.Function {
        description: "Signature: (selectedElement: cfv_models.SelectedElement | null, moduleRegistry: cfv_models.IModuleRegistry) => cfv_models.ReactNode";
    }
    renderInspectorDataIOTab?: cfv_models.Function {
        description: "Signature: (selectedStepTrace: cfv_models.StepExecutionTrace | null, moduleRegistry: cfv_models.IModuleRegistry) => cfv_models.ReactNode";
    }
    renderInspectorContextVarsTab?: cfv_models.Function {
        description: "Signature: (relevantContext: Object | null, selectedElement: cfv_models.SelectedElement | null, moduleRegistry: cfv_models.IModuleRegistry) => cfv_models.ReactNode";
    }
    renderInspectorTestDefinitionTab?: cfv_models.Function {
        description: "Signature: (currentFlowFqn: String | null, actions: cfv_models.TestDefinitionActions, moduleRegistry: cfv_models.IModuleRegistry) => cfv_models.ReactNode";
    }
    renderInspectorAssertionResultsTab?: cfv_models.Function {
        description: "Signature: (assertionResults: List<cfv_models.AssertionResult> | null, moduleRegistry: cfv_models.IModuleRegistry) => cfv_models.ReactNode";
    }
    renderFlowRunListItem?: cfv_models.Function {
        description: "Signature: (summary: cfv_models.HistoricalFlowInstanceSummary, actions: cfv_models.FlowRunListItemActions, isSelected: Boolean) => cfv_models.ReactNode";
    }

    // Layout
    elkOptions?: cfv_models.Any { description: "ELK.js layout configuration options." }

    // Styling & Dimensions
    className?: String
    style?: Object // React.CSSProperties
}
    model cfv_models.VisualizerModeEnum {
        type: String
        constraints: "enum:['design', 'trace', 'test_result']"
    }
    model cfv_models.DesignDataProps {
        initialViewMode?: cfv_models.DesignViewModeEnum
        initialFlowFqn?: String
    }
        model cfv_models.DesignViewModeEnum {
            type: String
            constraints: "enum:['systemOverview', 'flowDetail']"
        }
    model cfv_models.ViewChangePayload {
        mode: cfv_models.VisualizerModeEnum { required: true; }
        currentFlowFqn?: String
        systemViewActive: Boolean { required: true; }
    }
    model cfv_models.TestDefinitionActions {
        runTestCase: cfv_models.Function {
            required: true;
            description: "Signature: (testCase: cfv_models.FlowTestCase) => Promise<cfv_models.TestRunResult | null>";
        }
    }
    model cfv_models.FlowRunListItemActions {
        selectTrace: cfv_models.Function {
            required: true;
            description: "Signature: (traceIdOrInstanceId: String) => void";
        }
    }

// --- Interaction Message Models (New) ---
model cfv_models.FlowSelectedEventMsg {
    description: "Payload for when a flow is selected during an interaction."
    flowFqn: String { required: true; description: "The FQN of the selected flow." }
}
model cfv_models.NavigationStateChangedMsg {
    description: "Payload for when the navigation state changes during an interaction."
    currentFlowFqn?: String { description: "The FQN of the current flow, if any." }
    viewName: String { required: true; description: "Identifier for the current view, e.g., 'flowDetail', 'systemOverview'." }
}
model cfv_models.StepNodeClickedEventMsg {
    description: "Payload for when a step node is clicked during an interaction."
    nodeId: String { required: true; description: "The ID of the clicked React Flow node." }
    // To keep this message model simpler, we refer to StepNodeData by its type.
    // A full copy could be large. Consumers can use nodeId to get full data if needed from React Flow.
    // For this example, we'll keep it simpler and assume only essential identifying data might be passed.
    // Let's assume the stepData field in the interaction was meant to be more summary-like.
    // For stricter modeling, this would be a dedicated model.
    // Given original intent: stepData: cfv_models.StepNodeData
    stepData_summary: cfv_models.Any { description: "Summary or key identifying data of the clicked step node. Full data available via React Flow selection."}
}
model cfv_models.SelectedElementChangedMsg {
    description: "Payload for when the selected UI element changes during an interaction."
    element: cfv_models.SelectedElement { required: true; description: "The newly selected element, or null if deselected." }
}
model cfv_models.ConfigEditActionMsg {
    description: "Payload for a configuration edit action during an interaction."
    newConfigValue: cfv_models.Any { required: true; description: "The new configuration value." }
    pathToConfig: List<cfv_models.StringOrNumber> { required: true; description: "Path to the configuration property being edited." }
}


// --- General Helper Models ---
model cfv_models.Any { description: "Represents any valid JSON/YAML type." }
model cfv_models.ReactNode { description: "Represents a React Node. Actual structure is React-specific." }
model cfv_models.Function { description: "Represents a JavaScript function type. The 'description' attribute of fields using this type should specify the signature." }