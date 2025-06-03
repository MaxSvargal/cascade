// cfv_models.dspec
// Refined according to DefinitiveSpec methodology with qualified names and stable IDs
// Defines data models (TypeScript interfaces and types) for CascadeFlowVisualizer props and internal structures.
// Updated to reflect all implemented features including layout service, trace visualization, test case management, and YAML reconstruction.

// --- Core & Module Related Types ---
model cfv_models.DslModuleInput {
    id: "CFV_MOD_DSL_001"
    description: "Input structure for providing a DSL module to the visualizer."
    fqn: String { required: true; description: "Fully Qualified Name of the module." }
    content: String { required: true; description: "Raw YAML content of the module." }
}

model cfv_models.RequestModuleResult {
    id: "CFV_MOD_REQ_001"
    description: "Result structure when a module is requested via `props.requestModule`."
    fqn: String { required: true; description: "FQN of the loaded module." }
    content: String { required: true; description: "Raw YAML content of the loaded module." }
}

model cfv_models.SaveModulePayload {
    id: "CFV_MOD_SAVE_001"
    description: "Payload for saving a modified module via `props.onSaveModule`."
    fqn: String { required: true; description: "FQN of the module to save." }
    newContent: String { required: true; description: "New full YAML content of the module." }
    pathToConfig?: List<cfv_models.StringOrNumber> { description: "Optional path to the specific config that was changed, for context." }
    oldConfigValue?: cfv_models.Any { description: "Optional old value of the specific config, for context." }
    newConfigValue?: cfv_models.Any { description: "Optional new value of the specific config, for context." }
}

model cfv_models.SelectedElementSourceEnum {
    id: "CFV_MOD_SEL_001"
    description: "Enum defining the source of a selected UI element."
    type: String
    constraints: "enum:['flowNode', 'flowEdge', 'systemFlowNode', 'systemTriggerNode', 'moduleListItem', 'flowListItem', 'namedComponentListItem', 'triggerListItem', 'traceListItem']"
}

model cfv_models.SelectedElement {
    id: "CFV_MOD_SEL_002"
    description: "Represents a currently selected element in the UI."
    sourceType: cfv_models.SelectedElementSourceEnum { required: true; }
    id: String { required: true; description: "React Flow node/edge ID or FQN/ID for list items." }
    data?: cfv_models.Any { description: "Associated data: React Flow node/edge object, DslModuleRepresentation, FlowDefinition summary, etc. Type varies by sourceType."}
    moduleFqn?: String { description: "FQN of the module this element belongs to (if applicable)." }
    flowFqn?: String { description: "FQN of the flow this element belongs to (if applicable)." }
    stepId?: String { description: "Step ID if the element is a step or related to a step." }
}

// --- Inspector Tab Related Models (Consolidated Architecture) ---
model cfv_models.InspectorPropertiesActions {
    id: "CFV_MOD_INSP_001"
    description: "Actions available to the consumer-rendered Properties inspector tab."
    requestSave: cfv_models.Function {
        required: true;
        description: "Call to request saving changes to a part of the selected element's configuration. Signature: (newConfigValue: any, pathToConfig: (string | number)[]) => void";
    }
}

model cfv_models.UnifiedDebugTestActions {
    id: "CFV_MOD_DEBUG_001"
    description: "Actions available for the enhanced unified debug/test interface."
    // Debugging Actions
    simulateFlowExecution: cfv_models.Function {
        required: true;
        description: "Simulate complete flow execution from trigger through all steps up to target step, resolving actual data. Signature: (flowFqn: string, targetStepId?: string, triggerInputData?: any, options?: cfv_models.ExecutionOptions) => Promise<cfv_models.FlowSimulationResult>";
    }
    resolveStepInputData: cfv_models.Function {
        required: true;
        description: "Resolve and display the input data that would be passed to a selected step if the flow were executed up to that point. Signature: (flowFqn: string, stepId: string, triggerInputData?: any, options?: cfv_models.ExecutionOptions) => Promise<cfv_models.ResolvedStepInput>";
    }
    runDebugStep: cfv_models.Function {
        required: true;
        description: "Execute a single selected step with provided or resolved input data and its DSL config. Signature: (flowFqn: string, stepId: string, inputData: any, componentConfig: any, options?: cfv_models.ExecutionOptions) => Promise<cfv_models.StepExecutionTrace>";
    }
    // Test Case Actions
    runTestCase: cfv_models.Function {
        required: true;
        description: "Execute a defined test case. Signature: (testCase: cfv_models.FlowTestCase) => Promise<cfv_models.TestRunResult>";
    }
    generateTestCaseTemplate: cfv_models.Function {
        required: true;
        description: "Generate a template for a new test case. Signature: (flowFqn: string, scenarioType: 'happyPath' | 'errorCase' | 'custom') => cfv_models.FlowTestCase";
    }
    // Data Generation & Validation (for test input forms)
    generateSchemaBasedInput: cfv_models.Function {
        required: true;
        description: "Generates sample input data based on a component's input schema. Signature: (componentSchema: cfv_models.ComponentSchema, scenarioType: 'happyPath' | 'empty' | 'fullOptional') => cfv_models.Any";
    }
    validateDataAgainstSchema: cfv_models.Function {
        required: true;
        description: "Validates provided data against a JSON schema. Signature: (data: cfv_models.Any, schema: cfv_models.JsonSchemaObject) => cfv_models.ValidationResult";
    }
}

model cfv_models.DslModuleRepresentation {
    id: "CFV_MOD_DSL_002"
    description: "Internal representation of a loaded DSL module."
    fqn: String { required: true; }
    rawContent: String { required: true; }
    parsedContent?: cfv_models.DslParsedContent { description: "Parsed YAML as a JavaScript object." }
    definitions?: cfv_models.DslModuleDefinitions { description: "Extracted definitions from the module." }
    imports?: List<cfv_models.DslModuleImportItem>
    errors?: List<cfv_models.DslModuleErrorItem> { description: "Errors from parsing or validation." }
    status: cfv_models.DslModuleStatusEnum { required: true; }
}

model cfv_models.DslParsedContent {
    id: "CFV_MOD_DSL_003"
    description: "Parsed YAML content structure of a DSL module."
    dsl_version: String { required: true }
    namespace: String { required: true }
    imports?: List<cfv_models.DslModuleImportItem>
    definitions?: cfv_models.DslModuleDefinitions
    flows?: List<cfv_models.FlowDefinitionDsl>
    components?: List<cfv_models.ComponentDefinitionDsl>
}

model cfv_models.FlowDefinitionDsl { 
    id: "CFV_MOD_FLOW_001"
    description: "Raw DSL flow definition object."
    type: "Object" 
}

model cfv_models.ComponentDefinitionDsl { 
    id: "CFV_MOD_COMP_001"
    description: "Raw DSL component definition object."
    type: "Object" 
}

model cfv_models.DslModuleDefinitions {
    id: "CFV_MOD_DSL_004"
    description: "Extracted definitions from a DSL module."
    context: List<cfv_models.ContextDefinitionDsl> { required: true; }
    components: List<cfv_models.ComponentDefinitionDsl> { required: true; }
    flows: List<cfv_models.FlowDefinitionDsl> { required: true; }
}

model cfv_models.ContextDefinitionDsl { 
    id: "CFV_MOD_CTX_001"
    description: "Raw DSL context definition object."
    type: "Object" 
}

model cfv_models.DslModuleImportItem {
    id: "CFV_MOD_IMP_001"
    description: "Import declaration within a DSL module."
    namespace: String { required: true; }
    as?: String
    version?: String
}

model cfv_models.DslModuleErrorItem {
    id: "CFV_MOD_ERR_001"
    description: "Error information for module parsing or validation issues."
    message: String { required: true; }
    path?: List<cfv_models.StringOrNumber> { description: "Path within the YAML/JSON structure where the error occurred." }
    severity?: cfv_models.ErrorSeverityEnum { default: "error" }
    details?: cfv_models.Any
}

model cfv_models.StringOrNumber {
    id: "CFV_MOD_UTIL_001"
    description: "Union type for string or number values."
    type: "Union<String, Number>"
}

model cfv_models.ErrorSeverityEnum {
    id: "CFV_MOD_ERR_002"
    description: "Severity levels for errors and warnings."
    type: String
    constraints: "enum:['error', 'warning', 'info']"
}

model cfv_models.DslModuleStatusEnum {
    id: "CFV_MOD_STAT_001"
    description: "Loading status of a DSL module."
    type: String
    constraints: "enum:['unloaded', 'loading', 'loaded', 'error', 'partially_loaded']"
}

// --- Layout Service Types ---
model cfv_models.LayoutOptions {
    id: "CFV_MOD_LAY_001"
    description: "Configuration options for ELK.js automatic graph layout."
    algorithm?: cfv_models.LayoutAlgorithmEnum { default: "layered"; description: "Layout algorithm to use." }
    direction?: cfv_models.LayoutDirectionEnum { default: "RIGHT"; description: "Primary layout direction." }
    spacing?: cfv_models.LayoutSpacing { description: "Spacing configuration between elements." }
    nodeSize?: cfv_models.NodeSizeOptions { description: "Node sizing configuration." }
    edgeRouting?: String { description: "ELK edge routing strategy, e.g., 'ORTHOGONAL', 'POLYLINE', 'SPLINES'."}
}

model cfv_models.LayoutAlgorithmEnum {
    id: "CFV_MOD_LAY_002"
    description: "Available ELK.js layout algorithms."
    type: String
    constraints: "enum:['layered', 'force', 'mrtree', 'radial', 'disco', 'rectpacking', 'stress']"
}

model cfv_models.LayoutDirectionEnum {
    id: "CFV_MOD_LAY_003"
    description: "Layout direction options."
    type: String
    constraints: "enum:['DOWN', 'UP', 'RIGHT', 'LEFT']"
}

model cfv_models.LayoutSpacing {
    id: "CFV_MOD_LAY_004"
    description: "Spacing configuration for layout elements."
    nodeNode?: Number { description: "Spacing between nodes." }
    edgeNode?: Number { description: "Spacing between edges and nodes." }
    edgeEdge?: Number { description: "Spacing between edges." }
    layerSpacing?: Number { description: "Spacing between layers (for layered algorithm)." }
}

model cfv_models.NodeSizeOptions {
    id: "CFV_MOD_LAY_005"
    description: "Node sizing configuration options."
    width?: Number { description: "Default node width." }
    height?: Number { description: "Default node height." }
    calculateFromContent?: Boolean { description: "Whether to calculate size based on content." }
    minWidth?: Number { description: "Minimum node width." }
    maxWidth?: Number { description: "Maximum node width." }
    minHeight?: Number { description: "Minimum node height." }
    maxHeight?: Number { description: "Maximum node height." }
    padding?: cfv_models.NodePadding { description: "Internal padding for node content." }
}

model cfv_models.NodePadding {
    id: "CFV_MOD_LAY_006"
    description: "Padding configuration for node content."
    top?: Number { description: "Top padding in pixels." }
    right?: Number { description: "Right padding in pixels." }
    bottom?: Number { description: "Bottom padding in pixels." }
    left?: Number { description: "Left padding in pixels." }
}

// --- Node & Edge Data Payloads (Enhanced) ---
model cfv_models.BaseNodeData {
    id: "CFV_MOD_NODE_001"
    description: "Base data common to many node types."
    label: String { required: true; }
    dslObject?: cfv_models.Any { description: "Raw DSL definition snippet for this element." }
    resolvedComponentFqn?: String { description: "Fully resolved FQN of the component type (e.g., StdLib:HttpCall)." }
    componentSchema?: cfv_models.ComponentSchema { description: "JSON schema for the component, if available." }
    isNamedComponent?: Boolean { description: "True if this node represents a Named Component Definition." }
    namedComponentFqn?: String { description: "FQN if this is a named component instance (e.g. mymodule.MyNamedHttpCall)." }
    contextVarUsages?: List<String> { description: "Context variable names used (e.g., '{{context.varName}}')." }
    error?: cfv_models.NodeError { description: "Error info if this element has a validation/resolution error." }
    // Fields for trace/debug mode, populated by GraphBuilderService from traceData or simulation results
    executionStatus?: cfv_models.ExecutionStatusEnum
    executionDurationMs?: Number
    executionInputData?: cfv_models.Any { description: "Actual input data passed during execution/simulation." }
    executionOutputData?: cfv_models.Any { description: "Actual output data from execution/simulation." }
}

model cfv_models.NodeError {
    id: "CFV_MOD_NODE_002"
    description: "Error information for node validation or resolution issues."
    message: String { required: true; }
    type: String { description: "e.g., 'SchemaValidationError', 'ResolutionError', 'ContextVarError'." }
    details?: cfv_models.Any
    isFatal?: Boolean { default: false }
}

model cfv_models.ExecutionStatusEnum {
    id: "CFV_MOD_EXEC_001"
    description: "Execution status values for steps and flows."
    type: String
    constraints: "enum:['SUCCESS', 'FAILURE', 'SKIPPED', 'RUNNING', 'PENDING']"
}

model cfv_models.StepNodeData {
    id: "CFV_MOD_NODE_003"
    description: "Data specific to flow step nodes in Flow Detail view. Inherits from BaseNodeData."
    // All fields from cfv_models.BaseNodeData implicitly included.
    stepId: String { required: true; }
}

model cfv_models.SubFlowInvokerNodeData {
    id: "CFV_MOD_NODE_004"
    description: "Data specific to SubFlowInvoker nodes. Inherits from StepNodeData."
    // All fields from cfv_models.StepNodeData implicitly included.
    invokedFlowFqn: String { required: true; }
}

model cfv_models.TriggerEntryPointNodeData {
    id: "CFV_MOD_NODE_005"
    description: "Data specific to the trigger entry point node in Flow Detail view. Inherits from BaseNodeData."
    // All fields from cfv_models.BaseNodeData implicitly included.
    triggerType: String { required: true; description: "e.g., 'StdLib.Trigger:Http', 'com.custom.MyTrigger'."}
}

model cfv_models.SystemGraphNodeData {
    id: "CFV_MOD_NODE_006"
    description: "Data specific to nodes in the System Overview graph. Inherits from BaseNodeData."
    // All fields from cfv_models.BaseNodeData implicitly included.
    fqn: String { required: true; description: "FQN of the flow or unique ID for the external trigger source." }
    nodeCategory: cfv_models.SystemNodeCategoryEnum { required: true; }
}

model cfv_models.SystemNodeCategoryEnum {
    id: "CFV_MOD_NODE_007"
    description: "Categories for system overview nodes."
    type: String
    constraints: "enum:['flow', 'externalTrigger']"
}

model cfv_models.FlowEdgeData {
    id: "CFV_MOD_EDGE_001"
    description: "Data specific to edges in the Flow Detail view."
    type: cfv_models.FlowEdgeTypeEnum { required: true; }
    sourceHandle?: String { description: "Specific output handle on source node." }
    targetHandle?: String { description: "Specific input handle on target node." }
    isExecutedPath?: Boolean { default: false; description: "Indicates if this edge was traversed in a trace/simulation." }
}

model cfv_models.FlowEdgeTypeEnum {
    id: "CFV_MOD_EDGE_002"
    description: "Types of edges in flow detail view."
    type: String
    constraints: "enum:['dataFlow', 'controlFlow']"
}

model cfv_models.SystemEdgeData {
    id: "CFV_MOD_EDGE_003"
    description: "Data specific to edges in the System Overview graph."
    type: cfv_models.SystemEdgeTypeEnum { required: true; }
}

model cfv_models.SystemEdgeTypeEnum {
    id: "CFV_MOD_EDGE_004"
    description: "Types of edges in system overview."
    type: String
    constraints: "enum:['invocationEdge', 'triggerLinkEdge']"
}

// --- Component Schema ---
model cfv_models.ComponentSchema {
    id: "CFV_MOD_SCHEMA_001"
    description: "Represents the schema for a component type."
    fqn: String { required: true; description: "FQN of the component type (e.g., StdLib:HttpCall)." }
    configSchema?: cfv_models.JsonSchemaObject { description: "JSON Schema for the 'config' block." }
    inputSchema?: cfv_models.JsonSchemaObject { description: "JSON Schema describing the expected input data structure for the component's primary data input port." }
    outputSchema?: cfv_models.JsonSchemaObject { description: "JSON Schema describing the data structure of the component's primary success output port." }
    errorOutputSchema?: cfv_models.JsonSchemaObject { description: "JSON Schema for the data structure on the error output port (often StandardErrorStructure)." }
    // For trigger components:
    triggerConfigSchema?: cfv_models.JsonSchemaObject { description: "JSON Schema for the trigger's 'config' block in a flow definition." }
    triggerOutputSchema?: cfv_models.JsonSchemaObject { description: "JSON Schema for the data structure the trigger provides to the flow (trigger.*)." }
}

model cfv_models.JsonSchemaObject { 
    id: "CFV_MOD_SCHEMA_002"
    description: "Represents a JSON Schema definition object."
    type: "Object"
}

// --- Trace & Execution Types (Enhanced) ---
model cfv_models.StepExecutionTrace {
    id: "CFV_MOD_TRACE_001"
    description: "Execution trace data for a single step."
    stepId: String { required: true; }
    componentFqn: String { required: true; description: "Actual component FQN executed." }
    status: cfv_models.ExecutionStatusEnum { required: true; }
    startTime: String { required: true; description: "ISO timestamp of step start." }
    endTime?: String { description: "ISO timestamp of step completion." }
    durationMs?: Number { description: "Step execution duration in milliseconds." }
    inputData?: cfv_models.Any { description: "Input data provided to the step's primary input." }
    outputData?: cfv_models.Any { description: "Output data produced by the step's primary success output." }
    errorData?: cfv_models.Any { description: "Data produced on the step's error output." }
    resolvedConfig?: cfv_models.Any { description: "Resolved configuration used for execution." }
    logs?: List<cfv_models.StepLog> { description: "Logs emitted by this step during execution."}
}

model cfv_models.FlowExecutionTrace {
    id: "CFV_MOD_TRACE_002"
    description: "Complete execution trace for a flow instance."
    traceId: String { required: true; description: "Unique identifier for this trace." }
    flowFqn: String { required: true; description: "FQN of the executed flow." }
    instanceId?: String { description: "Instance identifier for this execution." }
    status: cfv_models.FlowExecutionStatusEnum { required: true; }
    startTime: String { required: true; description: "ISO timestamp of flow start." }
    endTime?: String { description: "ISO timestamp of flow completion." }
    durationMs?: Number { description: "Total flow execution duration in milliseconds." }
    triggerData?: cfv_models.Any { description: "Data that triggered the flow execution (from trigger.outputSchema)." }
    initialContext?: Record<String, cfv_models.Any> { description: "Initial context state." }
    finalContext?: Record<String, cfv_models.Any> { description: "Final context state." }
    steps: List<cfv_models.StepExecutionTrace> { required: true; description: "Execution traces for all steps in execution order." }
    flowError?: cfv_models.ExecutionError { description: "Overall flow error if the flow itself failed outside a specific step."}
}

model cfv_models.FlowExecutionStatusEnum {
    id: "CFV_MOD_TRACE_003"
    description: "Overall flow execution status values."
    type: String
    constraints: "enum:['COMPLETED', 'FAILED', 'RUNNING', 'TERMINATED', 'PENDING']"
}

model cfv_models.HistoricalFlowInstanceSummary {
    id: "CFV_MOD_TRACE_004"
    description: "Summary information for a historical flow execution."
    id: String { required: true; description: "Typically traceId or instanceId." }
    flowFqn: String { required: true; }
    startTime: String { required: true; }
    status: String { required: true; description: "e.g., 'COMPLETED', 'FAILED'." }
}

// --- Property Testing Types (Enhanced for Debug & Test Tab) ---
model cfv_models.TestCaseAssertion {
    id: "CFV_MOD_TEST_001"
    description: "Assertion definition for flow test cases."
    id: String { required: true; description: "Unique ID for the assertion within the test case."}
    description?: String
    targetPath: String { required: true; description: "JMESPath to data in step output, finalContext, or flowError." }
    expectedValue: cfv_models.Any
    comparison: cfv_models.AssertionComparisonEnum { required: true; }
    isEnabled?: Boolean { default: true }
}

model cfv_models.AssertionComparisonEnum {
    id: "CFV_MOD_TEST_002"
    description: "Comparison operators for test assertions."
    type: String
    constraints: "enum:['equals', 'notEquals', 'contains', 'notContains', 'startsWith', 'endsWith', 'matchesRegex', 'isGreaterThan', 'isLessThan', 'isDefined', 'isNotDefined', 'isEmpty', 'isNotEmpty']"
}

model cfv_models.MockedComponentResponse {
    id: "CFV_MOD_TEST_003"
    description: "Mock response configuration for component testing."
    stepIdPattern: String { required: true; description: "Regex or ID of step(s) to mock." }
    outputData?: cfv_models.Any { description: "Data to return as output." }
    errorData?: cfv_models.Any { description: "Error to simulate." }
    delayMs?: Number { description: "Simulated execution delay." }
}

model cfv_models.FlowTestCase {
    id: "CFV_MOD_TEST_004"
    description: "Complete test case definition for a flow."
    id: String { required: true; description: "Unique ID for the test case."}
    flowFqn: String { required: true; }
    description?: String { description: "Human-readable test description." }
    triggerInput: cfv_models.Any { required: true; description: "Input data for the flow trigger. Should conform to trigger's output schema." }
    initialContext?: Record<String, cfv_models.Any> { description: "Initial context variable values." }
    componentMocks?: List<cfv_models.MockedComponentResponse>
    assertions: List<cfv_models.TestCaseAssertion> { required: true; }
    tags?: List<String>
}

model cfv_models.AssertionResult {
    id: "CFV_MOD_TEST_005"
    description: "Result of evaluating a test assertion."
    assertionId: String { required: true; }
    targetPath: String { required: true; }
    expectedValue: cfv_models.Any { required: true; }
    comparison: String { required: true; }
    actualValue?: cfv_models.Any { description: "Actual value found during test execution." }
    passed: Boolean { required: true; description: "Whether the assertion passed." }
    message?: String { description: "Human-readable result message." }
}

model cfv_models.TestRunResult {
    id: "CFV_MOD_TEST_006"
    description: "Complete result of executing a flow test case."
    testCase: cfv_models.FlowTestCase { required: true; }
    passed: Boolean { required: true; description: "Overall test pass/fail status." }
    trace?: cfv_models.FlowExecutionTrace { description: "Execution trace from the test run." }
    assertionResults: List<cfv_models.AssertionResult> { required: true; }
    error?: String { description: "Error message if test run failed globally." }
}

// --- Simulation & Resolved Data Models (for Debug & Test Tab) ---
model cfv_models.ExecutionOptions {
    id: "CFV_MOD_SIM_001"
    description: "Options for flow/step execution."
    useMocks?: Boolean { default: false }
    mockProvider?: cfv_models.Function { description: "Signature: (stepId: string, componentFqn: string) => MockedComponentResponse | null" }
}

model cfv_models.FlowSimulationResult {
    id: "CFV_MOD_SIM_002"
    description: "Result of simulating flow execution up to a target step, or full flow."
    flowFqn: String { required: true; }
    targetStepId?: String { description: "If simulating up to a specific step." }
    status: cfv_models.FlowExecutionStatusEnum { required: true }
    triggerInputData: cfv_models.Any { required: true }
    resolvedStepInputs: Record<String, cfv_models.Any> { description: "Keyed by stepId, the fully resolved input data for each executed/evaluated step."}
    simulatedStepOutputs: Record<String, cfv_models.Any> { description: "Keyed by stepId, the simulated output data for each executed step." }
    finalContextState?: Record<String, cfv_models.Any>
    dataLineage?: cfv_models.DataLineageResult { description: "Detailed data flow paths." }
    errors?: List<cfv_models.ExecutionError>
}

model cfv_models.ResolvedStepInput {
    id: "CFV_MOD_SIM_003"
    description: "Resolved input data for a step, ready for display or execution."
    stepId: String { required: true; }
    flowFqn: String { required: true; }
    componentFqn: String { required: true; }
    componentSchema?: cfv_models.ComponentSchema
    actualInputData: cfv_models.Any { description: "The data that WOULD be passed to the component's primary input." }
    dslConfig: cfv_models.Any { description: "The component's config block from the DSL." }
    availableContext?: Record<String, cfv_models.Any>
}

model cfv_models.DataLineageResult {
    id: "CFV_MOD_SIM_004"
    description: "Detailed data lineage for a flow or up to a step."
    flowFqn: String { required: true }
    paths: List<cfv_models.DataLineagePath>
}

model cfv_models.DataLineagePath {
    id: "CFV_MOD_SIM_005"
    description: "Individual data lineage path showing data flow."
    targetStepId: String { required: true }
    targetInputField: String { required: true }
    source: cfv_models.InputDataSource { required: true }
    transformationExpression?: String { description: "The inputs_map expression used."}
}

model cfv_models.InputDataSource {
    id: "CFV_MOD_SIM_006"
    description: "Source of input data for a step."
    sourceType: cfv_models.InputSourceTypeEnum { required: true; }
    id: String { description: "stepId, contextVarName, or 'trigger'." }
    dataPath?: String { description: "JMESPath from source's output (e.g., 'result.user.id')." }
    valuePreview?: cfv_models.Any
}

model cfv_models.InputSourceTypeEnum {
    id: "CFV_MOD_SIM_007"
    description: "Types of input data sources."
    type: String
    constraints: "enum:['previousStepOutput', 'contextVariable', 'triggerOutput', 'constantValue', 'expression']"
}

model cfv_models.ValidationResult {
    id: "CFV_MOD_VAL_001"
    description: "Result of validating data against a JSON schema."
    isValid: Boolean { required: true; }
    errors?: List<cfv_models.ValidationError>
    warnings?: List<cfv_models.ValidationWarning>
    processedData?: cfv_models.Any { description: "Data after applying defaults or coercions, if any." }
}

model cfv_models.ValidationError {
    id: "CFV_MOD_VAL_002"
    description: "Validation error details."
    fieldPath: String { required: true; description: "JSON path to the field with error." }
    message: String { required: true; description: "Error message." }
    expectedType?: String { description: "Expected data type." }
    actualValue?: cfv_models.Any { description: "Actual value that caused the error." }
    schemaRule?: String { description: "Schema rule that was violated." }
}

model cfv_models.ValidationWarning {
    id: "CFV_MOD_VAL_003"
    description: "Validation warning details."
    fieldPath: String { required: true; description: "JSON path to the field with warning." }
    message: String { required: true; description: "Warning message." }
    suggestion?: String { description: "Suggested fix for the warning." }
}

model cfv_models.ExecutionError {
    id: "CFV_MOD_EXEC_002"
    description: "Detailed execution error information."
    errorType: String { required: true; description: "Type of error (e.g., 'ValidationError', 'TimeoutError')." }
    message: String { required: true; }
    stepId?: String { description: "Step where the error occurred." }
    stackTrace?: String { description: "Error stack trace." }
    context?: cfv_models.Any { description: "Additional error context." }
    timestamp: String { required: true; }
}

model cfv_models.StepLog {
    id: "CFV_MOD_LOG_001"
    description: "Log entry from step execution."
    stepId: String { required: true; }
    timestamp: String { required: true; }
    level: String { required: true; description: "Log level: 'debug', 'info', 'warn', 'error'" }
    message: String { required: true; }
    data?: cfv_models.Any { description: "Additional log data" }
}

model cfv_models.StepSimulationResult {
    id: "CFV_MOD_SIM_008"
    description: "Simulation result for a single step."
    stepId: String { required: true; }
    componentFqn: String { required: true; }
    inputData: cfv_models.Any { required: true; description: "Input data provided to the step." }
    outputData: cfv_models.Any { required: true; description: "Output data generated by the step." }
    contextChanges: Record<String, cfv_models.Any> { required: true; description: "Changes made to context by this step." }
    executionOrder: Number { required: true; }
    simulationSuccess: Boolean { required: true; }
    error?: String { description: "Error message if simulation failed for this step." }
}

// --- IModuleRegistry (Interface) ---
model cfv_models.ResolvedComponentInfo {
    id: "CFV_MOD_REG_001"
    description: "Information about a resolved component reference."
    baseType: String { required: true; description: "Base component type FQN (e.g. StdLib:HttpCall)." }
    componentDefinition?: cfv_models.ComponentDefinitionDsl { description: "The NamedComponent DSL if applicable." }
    sourceModuleFqn: String { required: true; description: "FQN of the module where the component was defined." }
    isNamedComponent: Boolean { required: true; description: "Whether this is a Named Component." }
}

model cfv_models.IModuleRegistry {
    id: "CFV_MOD_REG_002"
    description: "Interface for accessing loaded module data and resolving references."
    getLoadedModule: cfv_models.Function {
        required: true;
        description: "Signature: (fqn: string) => cfv_models.DslModuleRepresentation | null";
    }
    getAllLoadedModules: cfv_models.Function {
        required: true;
        description: "Signature: () => cfv_models.DslModuleRepresentation[]";
    }
    resolveComponentTypeInfo: cfv_models.Function {
        required: true;
        description: "Signature: (componentRef: string, currentModuleFqn: string) => cfv_models.ResolvedComponentInfo | null";
    }
    getComponentSchema: cfv_models.Function {
        required: true;
        description: "Signature: (componentTypeFqn: string) => cfv_models.ComponentSchema | null";
    }
    getFlowDefinitionDsl: cfv_models.Function {
        required: true;
        description: "Signature: (flowFqn: string) => cfv_models.FlowDefinitionDsl | null";
    }
    getNamedComponentDefinitionDsl: cfv_models.Function {
        required: true;
        description: "Signature: (namedComponentFqn: string) => cfv_models.ComponentDefinitionDsl | null";
    }
    getContextDefinition: cfv_models.Function {
        required: true;
        description: "Signature: (contextFqn: string) => cfv_models.ContextDefinitionDsl | null";
    }
}

// --- Main Component Props (CascadeFlowVisualizerProps) ---
model cfv_models.VisualizerModeEnum {
    id: "CFV_MOD_MODE_001"
    description: "Operating modes for the visualizer."
    type: String
    constraints: "enum:['design', 'trace', 'test_result']"
}

model cfv_models.DesignViewModeEnum {
    id: "CFV_MOD_MODE_002"
    description: "View modes within design mode."
    type: String
    constraints: "enum:['systemOverview', 'flowDetail']"
}

model cfv_models.DesignDataProps {
    id: "CFV_MOD_MODE_003"
    description: "Configuration for design mode visualization."
    initialViewMode?: cfv_models.DesignViewModeEnum
    initialFlowFqn?: String
}

model cfv_models.ViewChangePayload {
    id: "CFV_MOD_VIEW_001"
    description: "Payload for view change events."
    mode: cfv_models.VisualizerModeEnum { required: true; }
    currentFlowFqn?: String
    systemViewActive: Boolean { required: true; }
}

model cfv_models.FlowRunListItemActions {
    id: "CFV_MOD_LIST_001"
    description: "Actions available for flow run list items."
    selectTrace: cfv_models.Function {
        required: true;
        description: "Signature: (traceIdOrInstanceId: string) => void";
    }
}

// Props for the new Inspector Tabs
model cfv_models.InspectorSourceTabProps {
    id: "CFV_MOD_INSP_002"
    description: "Props passed to the consumer-rendered Source inspector tab."
    selectedElement: cfv_models.SelectedElement { required: true }
    moduleRegistry: cfv_models.IModuleRegistry { required: true }
}

model cfv_models.InspectorPropertiesTabProps {
    id: "CFV_MOD_INSP_003"
    description: "Props passed to the consumer-rendered Properties inspector tab."
    selectedElement: cfv_models.SelectedElement { required: true }
    actions: cfv_models.InspectorPropertiesActions { required: true }
    moduleRegistry: cfv_models.IModuleRegistry { required: true }
}

model cfv_models.InspectorDebugTestTabProps {
    id: "CFV_MOD_INSP_004"
    description: "Props passed to the consumer-rendered Debug & Test inspector tab."
    currentFlowFqn: String { required: true }
    selectedElement?: cfv_models.SelectedElement
    traceData?: cfv_models.FlowExecutionTrace
    testResultData?: cfv_models.TestRunResult
    actions: cfv_models.UnifiedDebugTestActions { required: true }
    moduleRegistry: cfv_models.IModuleRegistry { required: true }
}

model cfv_models.CascadeFlowVisualizerProps {
    id: "CFV_MOD_PROPS_001"
    description: "Main props interface for the CascadeFlowVisualizer component. Enhanced with consolidated inspector tabs."
    
    // Core Data & Loading
    initialModules?: List<cfv_models.DslModuleInput>
    requestModule: cfv_models.Function {
        required: true;
        description: "Callback signature: (fqn: string) => Promise<cfv_models.RequestModuleResult | null>";
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
        description: "Callback signature: (filterOptions?: any) => Promise<cfv_models.HistoricalFlowInstanceSummary[]>";
    }

    // Property Testing Callbacks
    onRunTestCase?: cfv_models.Function {
        description: "Callback signature: (testCase: cfv_models.FlowTestCase) => Promise<cfv_models.TestRunResult | null>";
    }

    // Customization (Renderers)
    customReactFlowProOptions?: cfv_models.Any
    customNodeTypes: cfv_models.Any { required: true; description: "React Flow NodeTypes object." }
    customEdgeTypes: cfv_models.Any { required: true; description: "React Flow EdgeTypes object." }
    
    // Consolidated Inspector Tab Renderers (New Architecture)
    renderInspectorSourceTab?: cfv_models.Function {
        description: "PRIMARY TAB: Full module YAML source viewer. Signature: (props: cfv_models.InspectorSourceTabProps) => React.ReactNode";
    }
    renderInspectorPropertiesTab?: cfv_models.Function {
        description: "Component-level configuration FORM editor. Signature: (props: cfv_models.InspectorPropertiesTabProps) => React.ReactNode";
    }
    renderInspectorDebugTestTab?: cfv_models.Function {
        description: "Unified debugging and testing interface. Signature: (props: cfv_models.InspectorDebugTestTabProps) => React.ReactNode";
    }
    
    renderFlowRunListItem?: cfv_models.Function {
        description: "Signature: (summary: cfv_models.HistoricalFlowInstanceSummary, actions: cfv_models.FlowRunListItemActions, isSelected: boolean) => React.ReactNode";
    }

    // Layout
    elkOptions?: cfv_models.LayoutOptions { description: "ELK.js layout configuration options." }

    // Styling & Dimensions
    className?: String
    style?: cfv_models.Any { description: "React.CSSProperties" }
}

// --- Interaction Message Models ---
model cfv_models.FlowSelectedEventMsg {
    id: "CFV_MOD_MSG_001"
    description: "Event message for flow selection."
    flowFqn: String { required: true; description: "The FQN of the selected flow." }
}

model cfv_models.NavigationStateChangedMsg {
    id: "CFV_MOD_MSG_002"
    description: "Event message for navigation state changes."
    currentFlowFqn?: String { description: "The FQN of the current flow, if any." }
    viewName: String { required: true; description: "Identifier for the current view, e.g., 'flowDetail', 'systemOverview'." }
}

model cfv_models.StepNodeClickedEventMsg {
    id: "CFV_MOD_MSG_003"
    description: "Event message for step node clicks."
    nodeId: String { required: true; description: "The ID of the clicked React Flow node." }
    stepData_summary: cfv_models.Any { required: true; description: "Summary or key identifying data of the clicked step node. Full data available via React Flow selection." }
}

model cfv_models.SelectedElementChangedMsg {
    id: "CFV_MOD_MSG_004"
    description: "Event message for element selection changes."
    element: cfv_models.SelectedElement { required: true; description: "The newly selected element, or null if deselected." }
}

model cfv_models.ConfigEditActionMsg {
    id: "CFV_MOD_MSG_005"
    description: "Event message for configuration edit actions."
    newConfigValue: cfv_models.Any { required: true; description: "The new configuration value." }
    pathToConfig: List<cfv_models.StringOrNumber> { required: true; description: "Path to the configuration property being edited." }
}

// --- Helper Types ---
model cfv_models.Any {
    id: "CFV_MOD_UTIL_002"
    description: "Represents any TypeScript type (any)."
    type: "any"
}

model cfv_models.Function {
    id: "CFV_MOD_UTIL_003"
    description: "Represents a TypeScript function type."
    type: "Function"
}