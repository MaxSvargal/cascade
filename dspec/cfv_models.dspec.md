// cfv_models.dspec
// Defines data models (TypeScript interfaces and types) for CascadeFlowVisualizer props and internal structures.
// Updated to reflect all implemented features including layout service, trace visualization, test case management, and YAML reconstruction.

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

// --- Layout Service Types ---
model cfv_models.LayoutOptions {
    description: "Configuration options for ELK.js automatic graph layout."
    algorithm?: cfv_models.LayoutAlgorithmEnum { description: "Layout algorithm to use." }
    direction?: cfv_models.LayoutDirectionEnum { description: "Primary layout direction." }
    spacing?: cfv_models.LayoutSpacing { description: "Spacing configuration between elements." }
    nodeSize?: cfv_models.NodeSizeOptions { description: "Node sizing configuration." }
}
    model cfv_models.LayoutAlgorithmEnum {
        type: String
        constraints: "enum:['layered', 'force', 'mrtree', 'radial', 'disco']"
    }
    model cfv_models.LayoutDirectionEnum {
        type: String
        constraints: "enum:['DOWN', 'UP', 'RIGHT', 'LEFT']"
    }
    model cfv_models.LayoutSpacing {
        nodeNode?: Number { description: "Spacing between nodes." }
        edgeNode?: Number { description: "Spacing between edges and nodes." }
        edgeEdge?: Number { description: "Spacing between edges." }
        layerSpacing?: Number { description: "Spacing between layers (for layered algorithm)." }
    }
    model cfv_models.NodeSizeOptions {
        width?: Number { description: "Default node width." }
        height?: Number { description: "Default node height." }
        calculateFromContent?: Boolean { description: "Whether to calculate size based on content." }
    }

// --- Node & Edge Data Payloads (Enhanced) ---
model cfv_models.BaseNodeData {
    description: "Base data common to many node types. This model's fields are incorporated into specific node data models."
    label: String { required: true; }
    dslObject?: cfv_models.Any { description: "Raw DSL definition snippet for this element." }
    resolvedComponentFqn?: String { description: "Fully resolved FQN of the component type." }
    componentSchema?: cfv_models.ComponentSchema { description: "JSON schema for the component, if available." }
    isNamedComponent?: Boolean
    contextVarUsages?: List<String> { description: "Context variable names used." }
    error?: cfv_models.NodeError { description: "Error info if this element has a validation/resolution error." }
    traceOverlay?: cfv_models.TraceOverlayData { description: "Trace visualization enhancements." }
}
    model cfv_models.NodeError {
        message: String { required: true; }
        details?: cfv_models.Any
        isFatal?: Boolean
    }
    model cfv_models.TraceOverlayData {
        executionOrder?: Number { description: "Order of execution in the trace." }
        startTime?: String { description: "ISO timestamp of execution start." }
        endTime?: String { description: "ISO timestamp of execution end." }
        duration?: Number { description: "Execution duration in milliseconds." }
        status?: cfv_models.ExecutionStatusEnum { description: "Execution status." }
        isOnCriticalPath?: Boolean { description: "Whether this element is on the critical execution path." }
        inputDataSummary?: String { description: "Summary of input data." }
        outputDataSummary?: String { description: "Summary of output data." }
        errorDetails?: String { description: "Error details if execution failed." }
        performanceMetrics?: cfv_models.PerformanceMetrics { description: "Performance metrics for this execution." }
    }
    model cfv_models.PerformanceMetrics {
        cpuTime?: Number { description: "CPU time used in milliseconds." }
        memoryUsage?: Number { description: "Memory usage in bytes." }
        ioOperations?: Number { description: "Number of I/O operations." }
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
    traceOverlay?: cfv_models.TraceOverlayData { description: "Trace visualization enhancements." }
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
    traceOverlay?: cfv_models.TraceOverlayData { description: "Trace visualization enhancements." }
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
    traceOverlay?: cfv_models.TraceOverlayData { description: "Trace visualization enhancements." }
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
    traceOverlay?: cfv_models.TraceOverlayData { description: "Trace visualization enhancements." }
    // Fields specific to SystemGraphNodeData
    fqn: String { required: true; description: "FQN of the flow or unique ID for the trigger source." }
}

model cfv_models.BaseEdgeData {
    description: "Base data for edges. This model's fields are incorporated into specific edge data models."
    traceOverlay?: cfv_models.EdgeTraceOverlayData { description: "Trace visualization enhancements for edges." }
}
    model cfv_models.EdgeTraceOverlayData {
        wasExecuted?: Boolean { description: "Whether this edge was traversed during execution." }
        executionTime?: String { description: "When this edge was traversed." }
        dataTransferred?: cfv_models.Any { description: "Data that flowed through this edge." }
        transferSize?: Number { description: "Size of data transferred in bytes." }
        isOnCriticalPath?: Boolean { description: "Whether this edge is on the critical execution path." }
    }

model cfv_models.FlowEdgeData {
    description: "Data specific to edges in the Flow Detail view. Incorporates fields from BaseEdgeData."
    // Fields from cfv_models.BaseEdgeData
    traceOverlay?: cfv_models.EdgeTraceOverlayData { description: "Trace visualization enhancements for edges." }
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
    // Fields from cfv_models.BaseEdgeData
    traceOverlay?: cfv_models.EdgeTraceOverlayData { description: "Trace visualization enhancements for edges." }
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

// --- Trace & Execution Types (Enhanced) ---
model cfv_models.StepExecutionTrace {
    description: "Execution trace data for a single step."
    stepId: String { required: true; }
    status: cfv_models.ExecutionStatusEnum { required: true; }
    startTime?: String { description: "ISO timestamp of step start." }
    endTime?: String { description: "ISO timestamp of step completion." }
    durationMs?: Number { description: "Step execution duration in milliseconds." }
    inputData?: cfv_models.Any { description: "Input data provided to the step." }
    outputData?: cfv_models.Any { description: "Output data produced by the step." }
    resolvedConfig?: cfv_models.Any { description: "Resolved configuration used for execution." }
    contextBefore?: Record<String, cfv_models.Any> { description: "Context state before step execution." }
    contextAfter?: Record<String, cfv_models.Any> { description: "Context state after step execution." }
}

model cfv_models.FlowExecutionTrace {
    description: "Complete execution trace for a flow instance."
    traceId: String { required: true; description: "Unique identifier for this trace." }
    flowFqn: String { required: true; description: "FQN of the executed flow." }
    instanceId?: String { description: "Instance identifier for this execution." }
    status: cfv_models.FlowExecutionStatusEnum { required: true; }
    startTime: String { required: true; description: "ISO timestamp of flow start." }
    endTime?: String { description: "ISO timestamp of flow completion." }
    durationMs?: Number { description: "Total flow execution duration in milliseconds." }
    triggerData?: cfv_models.Any { description: "Data that triggered the flow execution." }
    initialContext?: Record<String, cfv_models.Any> { description: "Initial context state." }
    finalContext?: Record<String, cfv_models.Any> { description: "Final context state." }
    steps: List<cfv_models.StepExecutionTrace> { required: true; description: "Execution traces for all steps." }
}
    model cfv_models.FlowExecutionStatusEnum {
        type: String
        constraints: "enum:['COMPLETED', 'FAILED', 'RUNNING', 'TERMINATED']"
    }

model cfv_models.HistoricalFlowInstanceSummary {
    description: "Summary information for a historical flow execution."
    id: String { required: true; description: "Typically traceId or instanceId." }
    flowFqn: String { required: true; }
    startTime: String { required: true; }
    status: String { required: true; description: "e.g., 'COMPLETED', 'FAILED'." }
}

// --- Property Testing Types (New) ---
model cfv_models.TestCaseAssertion {
    description: "Assertion definition for flow test cases."
    targetPath: String { required: true; description: "JMESPath to data in step output or context." }
    expectedValue: cfv_models.Any { required: true; description: "Expected value or pattern." }
    comparison: String { required: true; description: "e.g., 'equals', 'contains', 'matchesRegex'." }
}

model cfv_models.MockedComponentResponse {
    description: "Mock response configuration for component testing."
    stepIdPattern: String { required: true; description: "Regex or ID of step(s) to mock." }
    outputData?: cfv_models.Any { description: "Data to return as output." }
    errorData?: cfv_models.Any { description: "Error to simulate." }
    delayMs?: Number { description: "Simulated execution delay." }
}

model cfv_models.FlowTestCase {
    description: "Complete test case definition for a flow."
    flowFqn: String { required: true; }
    description?: String { description: "Human-readable test description." }
    triggerInput: cfv_models.Any { required: true; description: "Input data for the flow trigger." }
    contextOverrides?: Record<String, cfv_models.Any> { description: "Context variable overrides." }
    componentMocks?: List<cfv_models.MockedComponentResponse> { description: "Component mock configurations." }
    assertions: List<cfv_models.TestCaseAssertion> { required: true; description: "Test assertions to validate." }
}

model cfv_models.AssertionResult {
    description: "Result of evaluating a test assertion."
    targetPath: String { required: true; }
    expectedValue: cfv_models.Any { required: true; }
    comparison: String { required: true; }
    actualValue?: cfv_models.Any { description: "Actual value found during test execution." }
    passed: Boolean { required: true; description: "Whether the assertion passed." }
    message?: String { description: "Human-readable result message." }
}

model cfv_models.TestRunResult {
    description: "Complete result of executing a flow test case."
    testCase: cfv_models.FlowTestCase { required: true; }
    passed: Boolean { required: true; description: "Overall test pass/fail status." }
    trace?: cfv_models.FlowExecutionTrace { description: "Execution trace from the test run." }
    assertionResults: List<cfv_models.AssertionResult> { required: true; }
    error?: String { description: "Error message if test run failed globally." }
}

// --- YAML Reconstruction Types (New) ---
model cfv_models.ReconstructionOptions {
    description: "Options for YAML reconstruction from DSL module representations."
    preserveComments?: Boolean { description: "Whether to preserve comments in reconstructed YAML." }
    indentSize?: Number { description: "Number of spaces for indentation." }
    lineWidth?: Number { description: "Maximum line width for YAML output." }
}

// --- Trace Visualization Types (New) ---
model cfv_models.TraceVisualizationOptions {
    description: "Configuration options for trace visualization enhancements."
    showTimings?: Boolean { description: "Whether to show execution timing information." }
    showDataFlow?: Boolean { description: "Whether to show data flow summaries." }
    highlightCriticalPath?: Boolean { description: "Whether to highlight the critical execution path." }
    showErrorDetails?: Boolean { description: "Whether to show detailed error information." }
    animateExecution?: Boolean { description: "Whether to animate the execution flow." }
}

// --- Module Registry Interface ---
model cfv_models.ResolvedComponentInfo {
    description: "Information about a resolved component reference."
    baseType: String { required: true; description: "Base component type FQN." }
    componentDefinition?: cfv_models.Any { description: "Component definition object." }
    sourceModuleFqn: String { required: true; description: "FQN of the module containing the component." }
    isNamedComponent: Boolean { required: true; description: "Whether this is a named component definition." }
}

model cfv_models.IModuleRegistry {
    description: "Interface for accessing loaded module data and resolving references."
    getLoadedModule: cfv_models.Function {
        required: true;
        description: "Signature: (fqn: string) => DslModuleRepresentation | null";
    }
    getAllLoadedModules: cfv_models.Function {
        required: true;
        description: "Signature: () => DslModuleRepresentation[]";
    }
    resolveComponentTypeInfo: cfv_models.Function {
        required: true;
        description: "Signature: (componentRef: string, currentModuleFqn: string) => ResolvedComponentInfo | null";
    }
    getComponentSchema: cfv_models.Function {
        required: true;
        description: "Signature: (componentTypeFqn: string) => ComponentSchema | null";
    }
    getFlowDefinition: cfv_models.Function {
        required: true;
        description: "Signature: (flowFqn: string) => any | null";
    }
    getNamedComponentDefinition: cfv_models.Function {
        required: true;
        description: "Signature: (componentFqn: string) => any | null";
    }
    getContextDefinition: cfv_models.Function {
        required: true;
        description: "Signature: (contextFqn: string) => any | null";
    }
}

// --- Main Component Props (Enhanced) ---
model cfv_models.VisualizerModeEnum {
    type: String
    constraints: "enum:['design', 'trace', 'test_result']"
}

model cfv_models.DesignViewModeEnum {
    type: String
    constraints: "enum:['systemOverview', 'flowDetail']"
}

model cfv_models.DesignDataProps {
    description: "Configuration for design mode visualization."
    initialViewMode?: cfv_models.DesignViewModeEnum
    initialFlowFqn?: String
}

model cfv_models.ViewChangePayload {
    description: "Payload for view change events."
    mode: cfv_models.VisualizerModeEnum { required: true; }
    currentFlowFqn?: String
    systemViewActive: Boolean { required: true; }
}

model cfv_models.TestDefinitionActions {
    description: "Actions available for test definition management."
    runTestCase: cfv_models.Function {
        required: true;
        description: "Signature: (testCase: FlowTestCase) => Promise<TestRunResult | null>";
    }
}

model cfv_models.FlowRunListItemActions {
    description: "Actions available for flow run list items."
    selectTrace: cfv_models.Function {
        required: true;
        description: "Signature: (traceIdOrInstanceId: string) => void";
    }
}

model cfv_models.CascadeFlowVisualizerProps {
    description: "Main props interface for the CascadeFlowVisualizer component. Enhanced with all implemented features."
    
    // Core Data & Loading
    initialModules?: List<cfv_models.DslModuleInput>
    requestModule: cfv_models.Function {
        required: true;
        description: "Callback signature: (fqn: string) => Promise<RequestModuleResult | null>";
    }
    componentSchemas?: Record<String, cfv_models.ComponentSchema>
    onModuleLoadError?: cfv_models.Function {
        description: "Callback signature: (fqn: string, error: Error) => void";
    }
    parseContextVariables: cfv_models.Function {
        required: true;
        description: "Callback signature: (value: string) => string[]";
    }

    // Editing
    isEditingEnabled?: Boolean
    onSaveModule?: cfv_models.Function {
        description: "Callback signature: (payload: SaveModulePayload) => Promise<void | boolean>";
    }

    // Mode & Data
    mode: cfv_models.VisualizerModeEnum { required: true; }
    designData?: cfv_models.DesignDataProps
    traceData?: cfv_models.FlowExecutionTrace
    testResultData?: cfv_models.TestRunResult

    // Callbacks
    onViewChange?: cfv_models.Function {
        description: "Callback signature: (view: ViewChangePayload) => void";
    }
    onElementSelect?: cfv_models.Function {
        description: "Callback signature: (element: SelectedElement | null) => void";
    }

    // Debugging & Trace Callbacks
    fetchTraceList?: cfv_models.Function {
        description: "Callback signature: (filterOptions?: any) => Promise<HistoricalFlowInstanceSummary[]>";
    }

    // Property Testing Callbacks
    onRunTestCase?: cfv_models.Function {
        description: "Callback signature: (testCase: FlowTestCase) => Promise<TestRunResult | null>";
    }

    // Customization (Renderers)
    customReactFlowProOptions?: cfv_models.Any
    customNodeTypes: cfv_models.Any { required: true; description: "React Flow NodeTypes object." }
    customEdgeTypes: cfv_models.Any { required: true; description: "React Flow EdgeTypes object." }
    renderInspectorPropertiesTab?: cfv_models.Function {
        description: "Signature: (selectedElement: SelectedElement | null, actions: InspectorPropertiesActions, moduleRegistry: IModuleRegistry) => React.ReactNode";
    }
    renderInspectorSourceTab?: cfv_models.Function {
        description: "Signature: (selectedElement: SelectedElement | null, moduleRegistry: IModuleRegistry) => React.ReactNode";
    }
    renderInspectorDataIOTab?: cfv_models.Function {
        description: "Signature: (selectedStepTrace: StepExecutionTrace | null, moduleRegistry: IModuleRegistry) => React.ReactNode";
    }
    renderInspectorContextVarsTab?: cfv_models.Function {
        description: "Signature: (relevantContext: object | null, selectedElement: SelectedElement | null, moduleRegistry: IModuleRegistry) => React.ReactNode";
    }
    renderInspectorTestDefinitionTab?: cfv_models.Function {
        description: "Signature: (currentFlowFqn: string | null, actions: TestDefinitionActions, moduleRegistry: IModuleRegistry) => React.ReactNode";
    }
    renderInspectorAssertionResultsTab?: cfv_models.Function {
        description: "Signature: (assertionResults: AssertionResult[] | null, moduleRegistry: IModuleRegistry) => React.ReactNode";
    }
    renderFlowRunListItem?: cfv_models.Function {
        description: "Signature: (summary: HistoricalFlowInstanceSummary, actions: FlowRunListItemActions, isSelected: boolean) => React.ReactNode";
    }

    // Layout (New)
    elkOptions?: cfv_models.LayoutOptions { description: "ELK.js layout configuration options." }

    // Styling & Dimensions
    className?: String
    style?: cfv_models.Any { description: "React.CSSProperties" }
}

// --- Interaction Message Models ---
model cfv_models.FlowSelectedEventMsg {
    description: "Event message for flow selection."
    flowFqn: String { required: true; description: "The FQN of the selected flow." }
}

model cfv_models.NavigationStateChangedMsg {
    description: "Event message for navigation state changes."
    currentFlowFqn?: String { description: "The FQN of the current flow, if any." }
    viewName: String { required: true; description: "Identifier for the current view, e.g., 'flowDetail', 'systemOverview'." }
}

model cfv_models.StepNodeClickedEventMsg {
    description: "Event message for step node clicks."
    nodeId: String { required: true; description: "The ID of the clicked React Flow node." }
    stepData_summary: cfv_models.Any { required: true; description: "Summary or key identifying data of the clicked step node. Full data available via React Flow selection." }
}

model cfv_models.SelectedElementChangedMsg {
    description: "Event message for element selection changes."
    element: cfv_models.SelectedElement { required: true; description: "The newly selected element, or null if deselected." }
}

model cfv_models.ConfigEditActionMsg {
    description: "Event message for configuration edit actions."
    newConfigValue: cfv_models.Any { required: true; description: "The new configuration value." }
    pathToConfig: List<cfv_models.StringOrNumber> { required: true; description: "Path to the configuration property being edited." }
}

// --- Helper Types ---
model cfv_models.Any {
    description: "Represents any TypeScript type (any)."
    type: "any"
}

model cfv_models.Function {
    description: "Represents a TypeScript function type."
    type: "Function"
}