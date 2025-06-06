// Generated TypeScript models from cfv_models.dspec.md
// This file is auto-generated - do not edit manually

import React from 'react';

// --- Core & Module Related Types ---

export interface DslModuleInput {
  /** Fully Qualified Name of the module. */
  fqn: string;
  /** Raw YAML content of the module. */
  content: string;
}

export interface RequestModuleResult {
  /** FQN of the loaded module. */
  fqn: string;
  /** Raw YAML content of the loaded module. */
  content: string;
}

export interface SaveModulePayload {
  /** FQN of the module to save. */
  fqn: string;
  /** New full YAML content of the module. */
  newContent: string;
  /** Optional path to the specific config that was changed, for context. */
  pathToConfig?: (string | number)[];
  /** Optional old value of the specific config, for context. */
  oldConfigValue?: any;
  /** Optional new value of the specific config, for context. */
  newConfigValue?: any;
}

export type SelectedElementSourceEnum = 
  | 'flowNode' 
  | 'flowEdge' 
  | 'systemFlowNode' 
  | 'systemTriggerNode' 
  | 'moduleListItem' 
  | 'flowListItem' 
  | 'namedComponentListItem' 
  | 'triggerListItem' 
  | 'traceListItem';

export interface SelectedElement {
  sourceType: SelectedElementSourceEnum;
  /** React Flow node/edge ID or FQN/ID for list items. */
  id: string;
  /** Associated data: React Flow node/edge object, DslModuleRepresentation, FlowDefinition summary, etc. */
  data?: any;
  /** FQN of the module this element belongs to (if applicable). */
  moduleFqn?: string;
  /** FQN of the flow this element belongs to (if applicable). */
  flowFqn?: string;
  /** Step ID if the element is a step or related to a step. */
  stepId?: string;
}

// --- Inspector Tab Related Models (Consolidated Architecture) ---
export interface InspectorPropertiesActions {
  /** Call to request saving changes to a part of the selected element's configuration. Signature: (newConfigValue: any, pathToConfig: (string | number)[]) => void */
  requestSave: (newConfigValue: any, pathToConfig: (string | number)[]) => void;
}

export interface UnifiedDebugTestActions {
  // Debugging Actions
  /** Simulate complete flow execution from trigger through all steps up to target step, resolving actual data. Signature: (flowFqn: string, targetStepId?: string, triggerInputData?: any, options?: ExecutionOptions) => Promise<FlowSimulationResult> */
  simulateFlowExecution: (flowFqn: string, targetStepId?: string, triggerInputData?: any, options?: ExecutionOptions) => Promise<FlowSimulationResult>;
  /** Resolve and display the input data that would be passed to a selected step if the flow were executed up to that point. Signature: (flowFqn: string, stepId: string, triggerInputData?: any, options?: ExecutionOptions) => Promise<ResolvedStepInput> */
  resolveStepInputData: (flowFqn: string, stepId: string, triggerInputData?: any, options?: ExecutionOptions) => Promise<ResolvedStepInput>;
  /** Execute a single selected step with provided or resolved input data and its DSL config. Signature: (flowFqn: string, stepId: string, inputData: any, componentConfig: any, options?: ExecutionOptions) => Promise<StepExecutionTrace> */
  runDebugStep: (flowFqn: string, stepId: string, inputData: any, componentConfig: any, options?: ExecutionOptions) => Promise<StepExecutionTrace>;
  // Test Case Actions
  /** Execute a defined test case. Signature: (testCase: FlowTestCase) => Promise<TestRunResult> */
  runTestCase: (testCase: FlowTestCase) => Promise<TestRunResult>;
  /** Generate a template for a new test case. Signature: (flowFqn: string, scenarioType: 'happyPath' | 'errorCase' | 'custom') => FlowTestCase */
  generateTestCaseTemplate: (flowFqn: string, scenarioType: 'happyPath' | 'errorCase' | 'custom') => FlowTestCase;
  // Data Generation & Validation (for test input forms)
  /** Generates sample input data based on a component's input schema. Signature: (componentSchema: ComponentSchema, scenarioType: 'happyPath' | 'empty' | 'fullOptional') => any */
  generateSchemaBasedInput: (componentSchema: ComponentSchema, scenarioType: 'happyPath' | 'empty' | 'fullOptional') => any;
  /** Validates provided data against a JSON schema. Signature: (data: any, schema: JsonSchemaObject) => ValidationResult */
  validateDataAgainstSchema: (data: any, schema: JsonSchemaObject) => ValidationResult;
  // Execution State Management
  /** Update the visualizer with execution results to show node states. Signature: (flowFqn: string, executionResults: FlowSimulationResult | FlowExecutionTrace) => void */
  updateExecutionState: (flowFqn: string, executionResults: FlowSimulationResult | FlowExecutionTrace) => void;
  /** Resolve trigger input data based on trigger configuration and schema. Signature: (triggerConfig: any, triggerSchema?: ComponentSchema, dataType?: 'happy_path' | 'fork_paths' | 'error_cases') => any */
  resolveTriggerInputData: (triggerConfig: any, triggerSchema?: ComponentSchema, dataType?: 'happy_path' | 'fork_paths' | 'error_cases') => any;
  /** Propagate data flow from trigger to target step. Signature: (flowFqn: string, triggerData: any) => Promise<Record<string, any>> */
  propagateDataFlow: (flowFqn: string, triggerData: any) => Promise<Record<string, any>>;
  /** Analyze input mapping between step configuration and available data. Signature: (stepConfig: any, availableData: Record<string, any>) => InputMapping[] */
  analyzeInputMapping: (stepConfig: any, availableData: Record<string, any>) => InputMapping[];
  /** Simulate data flow from trigger to target step. Signature: (flowFqn: string, triggerData: any, targetStepId?: string) => Promise<Record<string, any>> */
  simulateDataFlow: (flowFqn: string, triggerData: any, targetStepId?: string) => Promise<Record<string, any>>;
  /** Collect execution logs from each step. Signature: (executionId: string) => Promise<StepLog[]> */
  collectStepLogs: (executionId: string) => Promise<StepLog[]>;
  /** Export execution results for analysis. Signature: (executionResult: ExecutionResult, format: 'json' | 'yaml' | 'csv') => string */
  exportExecutionResults: (executionResult: ExecutionResult, format: 'json' | 'yaml' | 'csv') => string;
  /** Generate input data based on component schema and data type. Signature: (targetId: string, dataType: 'happy_path' | 'fork_paths' | 'error_cases', componentSchema?: ComponentSchema) => any */
  generateSchemaBasedInputData: (targetId: string, dataType: 'happy_path' | 'fork_paths' | 'error_cases', componentSchema?: ComponentSchema) => any;
  /** Resolve data lineage from trigger to selected step. Signature: (stepId: string, flowFqn: string) => Promise<DataLineageResult> */
  resolveDataLineage: (stepId: string, flowFqn: string) => Promise<DataLineageResult>;
  /** Validate input data against component input schema. Signature: (inputData: any, componentSchema: ComponentSchema) => ValidationResult */
  validateInputAgainstSchema: (inputData: any, componentSchema: ComponentSchema) => ValidationResult;
  /** Execute flow/step for debugging with current configuration. Signature: (targetId: string, inputData: any, executionOptions?: ExecutionOptions) => Promise<ExecutionResult> */
  runDebugExecution: (targetId: string, inputData: any, executionOptions?: ExecutionOptions) => Promise<ExecutionResult>;
}

export type DslModuleStatusEnum = 'unloaded' | 'loading' | 'loaded' | 'error' | 'partially_loaded';

export type StringOrNumber = string | number;

export type ErrorSeverityEnum = 'error' | 'warning' | 'info';

export interface DslModuleErrorItem {
  message: string;
  /** Path within the YAML/JSON structure where the error occurred. */
  path?: StringOrNumber[];
  severity?: ErrorSeverityEnum;
  details?: any;
}

export interface DslModuleImportItem {
  namespace: string;
  as?: string;
  version?: string;
}

export interface DslModuleDefinitions {
  context: any[];
  components: any[];
  flows: any[];
}

export interface DslModuleRepresentation {
  fqn: string;
  rawContent: string;
  /** Parsed YAML as a JavaScript object. */
  parsedContent?: any;
  /** Extracted definitions from the module. */
  definitions?: DslModuleDefinitions;
  imports?: DslModuleImportItem[];
  /** Errors from parsing or validation. */
  errors?: DslModuleErrorItem[];
  status: DslModuleStatusEnum;
}

// --- Layout Service Types ---
export type LayoutAlgorithmEnum = 'layered' | 'force' | 'mrtree' | 'radial' | 'disco' | 'rectpacking' | 'stress';

export type LayoutDirectionEnum = 'DOWN' | 'UP' | 'RIGHT' | 'LEFT';

export interface LayoutSpacing {
  /** Spacing between nodes. */
  nodeNode?: number;
  /** Spacing between edges and nodes. */
  edgeNode?: number;
  /** Spacing between edges. */
  edgeEdge?: number;
  /** Spacing between layers (for layered algorithm). */
  layerSpacing?: number;
}

export interface NodePadding {
  /** Top padding in pixels. */
  top?: number;
  /** Right padding in pixels. */
  right?: number;
  /** Bottom padding in pixels. */
  bottom?: number;
  /** Left padding in pixels. */
  left?: number;
}

export interface NodeSizeOptions {
  /** Default node width. */
  width?: number;
  /** Default node height. */
  height?: number;
  /** Whether to calculate size based on content. */
  calculateFromContent?: boolean;
  /** Minimum node width. */
  minWidth?: number;
  /** Maximum node width. */
  maxWidth?: number;
  /** Minimum node height. */
  minHeight?: number;
  /** Maximum node height. */
  maxHeight?: number;
  /** Internal padding for node content. */
  padding?: NodePadding;
}

export interface LayoutOptions {
  /** Layout algorithm to use. */
  algorithm?: LayoutAlgorithmEnum;
  /** Primary layout direction. */
  direction?: LayoutDirectionEnum;
  /** Spacing configuration between elements. */
  spacing?: LayoutSpacing;
  /** Node sizing configuration. */
  nodeSize?: NodeSizeOptions;
  /** ELK edge routing strategy, e.g., 'ORTHOGONAL', 'POLYLINE', 'SPLINES'. */
  edgeRouting?: string;
}

// --- Node & Edge Data Payloads (Enhanced) ---
export interface NodeError {
  message: string;
  /** e.g., 'SchemaValidationError', 'ResolutionError', 'ContextVarError'. */
  type?: string;
  details?: any;
  isFatal?: boolean;
}

export type ExecutionStatusEnum = 'SUCCESS' | 'FAILURE' | 'SKIPPED' | 'RUNNING' | 'PENDING';

export interface BaseNodeData {
  label: string;
  /** Raw DSL definition snippet for this element. */
  dslObject?: any;
  /** Fully resolved FQN of the component type (e.g., StdLib:HttpCall). */
  resolvedComponentFqn?: string;
  /** JSON schema for the component, if available. */
  componentSchema?: ComponentSchema;
  /** True if this node represents a Named Component Definition. */
  isNamedComponent?: boolean;
  /** FQN if this is a named component instance (e.g. mymodule.MyNamedHttpCall). */
  namedComponentFqn?: string;
  /** Context variable names used (e.g., '{{context.varName}}'). */
  contextVarUsages?: string[];
  /** Error info if this element has a validation/resolution error. */
  error?: NodeError;
  // Fields for trace/debug mode, populated by GraphBuilderService from traceData or simulation results
  // CRITICAL: These fields should ONLY be populated when trace data is available or after debug/test execution
  // In design mode without trace data, these fields should be undefined/null to show clean nodes
  /** Only populated when trace data is available or after execution. */
  executionStatus?: ExecutionStatusEnum;
  /** Only populated when trace data is available or after execution. */
  executionDurationMs?: number;
  /** Actual input data passed during execution/simulation. Only populated when trace data is available. */
  executionInputData?: any;
  /** Actual output data from execution/simulation. Only populated when trace data is available. */
  executionOutputData?: any;
}

export interface StepNodeData extends BaseNodeData {
  stepId: string;
}

export interface SubFlowInvokerNodeData extends StepNodeData {
  invokedFlowFqn: string;
}

export interface TriggerEntryPointNodeData extends BaseNodeData {
  /** e.g., 'StdLib.Trigger:Http', 'com.custom.MyTrigger'. */
  triggerType: string;
}

export type SystemNodeCategoryEnum = 'flow' | 'externalTrigger';

export interface SystemGraphNodeData extends BaseNodeData {
  /** FQN of the flow or unique ID for the external trigger source. */
  fqn: string;
  nodeCategory: SystemNodeCategoryEnum;
  /** Whether this node can be clicked to navigate to the flow. */
  navigatable?: boolean;
  /** Callback function to handle flow navigation. */
  onFlowNodeClick?: (flowFqn: string) => void;
  /** Target flow FQN for navigation. */
  targetFlowFqn?: string;
}

export type FlowEdgeTypeEnum = 'dataFlow' | 'controlFlow' | 'executionOrderDependency' | 'dataDependency' | 'errorRouting' | 'combinedDependency';

export interface FlowEdgeData {
  type: FlowEdgeTypeEnum;
  /** Specific output handle on source node. */
  sourceHandle?: string;
  /** Specific input handle on target node. */
  targetHandle?: string;
  /** Indicates if this edge was traversed in a trace/simulation. */
  isExecutedPath?: boolean;
  /** Source step ID for the edge. */
  sourceStepId?: string;
  /** Target step ID for the edge. */
  targetStepId?: string;
  /** Target input field name for data dependency edges. */
  targetInputKey?: string;
}

export type SystemEdgeTypeEnum = 'invocationEdge' | 'triggerLinkEdge';

export interface SystemEdgeData {
  type: SystemEdgeTypeEnum;
}

// --- Component Schema ---
export interface JsonSchemaObject {
  [key: string]: any;
}

export interface ComponentSchema {
  /** FQN of the component type (e.g., StdLib:HttpCall). */
  fqn: string;
  /** JSON Schema for the 'config' block. */
  configSchema?: JsonSchemaObject;
  /** JSON Schema describing the expected input data structure for the component's primary data input port. */
  inputSchema?: JsonSchemaObject;
  /** JSON Schema describing the data structure of the component's primary success output port. */
  outputSchema?: JsonSchemaObject;
  /** JSON Schema for the data structure on the error output port (often StandardErrorStructure). */
  errorOutputSchema?: JsonSchemaObject;
  // For trigger components:
  /** JSON Schema for the trigger's 'config' block in a flow definition. */
  triggerConfigSchema?: JsonSchemaObject;
  /** JSON Schema for the data structure the trigger provides to the flow (trigger.*). */
  triggerOutputSchema?: JsonSchemaObject;
}

// --- Trace & Execution Types (Enhanced) ---
export interface StepExecutionTrace {
  stepId: string;
  /** Actual component FQN executed. */
  componentFqn: string;
  status: ExecutionStatusEnum;
  /** ISO timestamp of step start. */
  startTime: string;
  /** ISO timestamp of step completion. */
  endTime?: string;
  /** Step execution duration in milliseconds. */
  durationMs?: number;
  /** Input data provided to the step's primary input. */
  inputData?: any;
  /** Output data produced by the step's primary success output. */
  outputData?: any;
  /** Data produced on the step's error output. */
  errorData?: any;
  /** Resolved configuration used for execution. */
  resolvedConfig?: any;
  /** Logs emitted by this step during execution. */
  logs?: StepLog[];
}

export type FlowExecutionStatusEnum = 'COMPLETED' | 'FAILED' | 'RUNNING' | 'TERMINATED' | 'PENDING';

export interface FlowExecutionTrace {
  /** Unique identifier for this trace. */
  traceId: string;
  /** FQN of the executed flow. */
  flowFqn: string;
  /** Instance identifier for this execution. */
  instanceId?: string;
  status: FlowExecutionStatusEnum;
  /** ISO timestamp of flow start. */
  startTime: string;
  /** ISO timestamp of flow completion. */
  endTime?: string;
  /** Total flow execution duration in milliseconds. */
  durationMs?: number;
  /** Data that triggered the flow execution (from trigger.outputSchema). */
  triggerData?: any;
  /** Initial context state. */
  initialContext?: Record<string, any>;
  /** Final context state. */
  finalContext?: Record<string, any>;
  /** Execution traces for all steps in execution order. */
  steps: StepExecutionTrace[];
  /** Overall flow error if the flow itself failed outside a specific step. */
  flowError?: ExecutionError;
}

export interface HistoricalFlowInstanceSummary {
  /** Typically traceId or instanceId. */
  id: string;
  flowFqn: string;
  startTime: string;
  /** e.g., 'COMPLETED', 'FAILED'. */
  status: string;
}

// --- Property Testing Types (Enhanced for Debug & Test Tab) ---
export type AssertionComparisonEnum = 'equals' | 'notEquals' | 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'matchesRegex' | 'isGreaterThan' | 'isLessThan' | 'isDefined' | 'isNotDefined' | 'isEmpty' | 'isNotEmpty';

export interface TestCaseAssertion {
  /** Unique ID for the assertion within the test case. */
  id: string;
  description?: string;
  /** JMESPath to data in step output, finalContext, or flowError. */
  targetPath: string;
  expectedValue: any;
  comparison: AssertionComparisonEnum;
  isEnabled?: boolean;
}

export interface MockedComponentResponse {
  /** Regex or ID of step(s) to mock. */
  stepIdPattern: string;
  /** Data to return as output. */
  outputData?: any;
  /** Error to simulate. */
  errorData?: any;
  /** Simulated execution delay. */
  delayMs?: number;
}

export interface FlowTestCase {
  /** Unique ID for the test case. */
  id: string;
  flowFqn: string;
  /** Human-readable test description. */
  description?: string;
  /** Input data for the flow trigger. Should conform to trigger's output schema. */
  triggerInput: any;
  /** Initial context variable values. */
  initialContext?: Record<string, any>;
  componentMocks?: MockedComponentResponse[];
  assertions: TestCaseAssertion[];
  tags?: string[];
}

export interface AssertionResult {
  assertionId: string;
  targetPath: string;
  expectedValue: any;
  comparison: string;
  /** Actual value found during test execution. */
  actualValue?: any;
  /** Whether the assertion passed. */
  passed: boolean;
  /** Human-readable result message. */
  message?: string;
}

export interface TestRunResult {
  testCase: FlowTestCase;
  /** Overall test pass/fail status. */
  passed: boolean;
  /** Execution trace from the test run. */
  trace?: FlowExecutionTrace;
  assertionResults: AssertionResult[];
  /** Error message if test run failed globally. */
  error?: string;
}

// --- Simulation & Resolved Data Models (for Debug & Test Tab) ---
export interface ExecutionOptions {
  useMocks?: boolean;
  /** Signature: (stepId: string, componentFqn: string) => MockedComponentResponse | null */
  mockProvider?: (stepId: string, componentFqn: string) => MockedComponentResponse | null;
  timeoutMs?: number;
}

export interface FlowSimulationResult {
  flowFqn: string;
  /** If simulating up to a specific step. */
  targetStepId?: string;
  status: FlowExecutionStatusEnum;
  triggerInputData: any;
  /** Keyed by stepId, the fully resolved input data for each executed/evaluated step. */
  resolvedStepInputs: Record<string, any>;
  /** Keyed by stepId, the simulated output data for each executed step. */
  simulatedStepOutputs: Record<string, any>;
  finalContextState?: Record<string, any>;
  /** Detailed data flow paths. */
  dataLineage?: DataLineageResult;
  errors?: ExecutionError[];
}

export interface ResolvedStepInput {
  stepId: string;
  flowFqn: string;
  componentFqn: string;
  componentSchema?: ComponentSchema;
  /** The data that WOULD be passed to the component's primary input. */
  actualInputData: any;
  /** The component's config block from the DSL. */
  dslConfig: any;
  availableContext?: Record<string, any>;
}

export interface DataLineageResult {
  flowFqn: string;
  paths: DataLineagePath[];
}

export interface DataLineagePath {
  targetStepId: string;
  targetInputField: string;
  source: InputDataSource;
  /** The inputs_map expression used. */
  transformationExpression?: string;
}

export type InputSourceTypeEnum = 'previousStepOutput' | 'contextVariable' | 'triggerOutput' | 'constantValue' | 'expression';

export interface InputDataSource {
  sourceType: InputSourceTypeEnum;
  /** stepId, contextVarName, or 'trigger'. */
  id: string;
  /** JMESPath from source's output (e.g., 'result.user.id'). */
  dataPath?: string;
  valuePreview?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
  /** Data after applying defaults or coercions, if any. */
  processedData?: any;
}

export interface ValidationError {
  /** JSON path to the field with error. */
  fieldPath: string;
  /** Error message. */
  message: string;
  /** Expected data type. */
  expectedType?: string;
  /** Actual value that caused the error. */
  actualValue?: any;
  /** Schema rule that was violated. */
  schemaRule?: string;
}

export interface ValidationWarning {
  /** JSON path to the field with warning. */
  fieldPath: string;
  /** Warning message. */
  message: string;
  /** Suggested fix for the warning. */
  suggestion?: string;
}

export interface ExecutionError {
  /** Type of error (e.g., 'ValidationError', 'TimeoutError'). */
  errorType: string;
  message: string;
  /** Step where the error occurred. */
  stepId?: string;
  /** Error stack trace. */
  stackTrace?: string;
  /** Additional error context. */
  context?: any;
  timestamp: string;
}

export interface StepLog {
  stepId: string;
  timestamp: string;
  /** Log level: 'debug', 'info', 'warn', 'error' */
  level: string;
  message: string;
  /** Additional log data */
  data?: any;
}

export interface StepSimulationResult {
  stepId: string;
  componentFqn: string;
  /** Input data provided to the step. */
  inputData: any;
  /** Output data generated by the step. */
  outputData: any;
  /** Changes made to context by this step. */
  contextChanges: Record<string, any>;
  executionOrder: number;
  simulationSuccess: boolean;
  /** Error message if simulation failed for this step. */
  error?: string;
}

// --- IModuleRegistry (Interface) ---
export interface ResolvedComponentInfo {
  /** Base component type FQN (e.g. StdLib:HttpCall). */
  baseType: string;
  /** The NamedComponent DSL if applicable. */
  componentDefinition?: any;
  /** FQN of the module where the component was defined. */
  sourceModuleFqn: string;
  /** Whether this is a Named Component. */
  isNamedComponent: boolean;
}

export interface IModuleRegistry {
  /** Signature: (fqn: string) => DslModuleRepresentation | null */
  getLoadedModule: (fqn: string) => DslModuleRepresentation | null;
  /** Signature: () => DslModuleRepresentation[] */
  getAllLoadedModules: () => DslModuleRepresentation[];
  /** Signature: (componentRef: string, currentModuleFqn: string) => ResolvedComponentInfo | null */
  resolveComponentTypeInfo: (componentRef: string, currentModuleFqn: string) => ResolvedComponentInfo | null;
  /** Signature: (componentTypeFqn: string) => ComponentSchema | null */
  getComponentSchema: (componentTypeFqn: string) => ComponentSchema | null;
  /** Signature: (flowFqn: string) => any | null */
  getFlowDefinitionDsl: (flowFqn: string) => any | null;
  /** Signature: (namedComponentFqn: string) => any | null */
  getNamedComponentDefinitionDsl: (namedComponentFqn: string) => any | null;
  /** Signature: (contextFqn: string) => any | null */
  getContextDefinition: (contextFqn: string) => any | null;
  // Legacy methods for backward compatibility
  getFlowDefinition: (flowFqn: string) => any | null;
  getNamedComponentDefinition: (componentFqn: string) => any | null;
}

// --- Main Component Props (CascadeFlowVisualizerProps) ---
export type VisualizerModeEnum = 'design' | 'trace' | 'test_result';

export type DesignViewModeEnum = 'systemOverview' | 'flowDetail';

export interface DesignDataProps {
  initialViewMode?: DesignViewModeEnum;
  initialFlowFqn?: string;
}

export interface ViewChangePayload {
  mode: VisualizerModeEnum;
  currentFlowFqn?: string;
  systemViewActive: boolean;
}

export interface FlowRunListItemActions {
  /** Signature: (traceIdOrInstanceId: string) => void */
  selectTrace: (traceIdOrInstanceId: string) => void;
}

// Props for the new Inspector Tabs
export interface InspectorSourceTabProps {
  selectedElement: SelectedElement;
  moduleRegistry: IModuleRegistry;
}

export interface InspectorPropertiesTabProps {
  selectedElement: SelectedElement;
  actions: InspectorPropertiesActions;
  moduleRegistry: IModuleRegistry;
}

export interface InspectorDebugTestTabProps {
  currentFlowFqn: string;
  selectedElement?: SelectedElement;
  traceData?: FlowExecutionTrace;
  testResultData?: TestRunResult;
  actions: UnifiedDebugTestActions;
  moduleRegistry: IModuleRegistry;
}

export interface CascadeFlowVisualizerProps {
  // Core Data & Loading
  initialModules?: DslModuleInput[];
  /** Callback signature: (fqn: string) => Promise<RequestModuleResult | null> */
  requestModule: (fqn: string) => Promise<RequestModuleResult | null>;
  componentSchemas?: Record<string, ComponentSchema>;
  /** Callback signature: (fqn: string, error: Error) => void */
  onModuleLoadError?: (fqn: string, error: Error) => void;
  /** Callback signature: (value: string) => string[] */
  parseContextVariables: (value: string) => string[];

  // Editing
  isEditingEnabled?: boolean;
  /** Callback signature: (payload: SaveModulePayload) => Promise<void | boolean> */
  onSaveModule?: (payload: SaveModulePayload) => Promise<void | boolean>;

  // Mode & Data
  mode: VisualizerModeEnum;
  designData?: DesignDataProps;
  traceData?: FlowExecutionTrace;
  testResultData?: TestRunResult;

  // Callbacks
  /** Callback signature: (view: ViewChangePayload) => void */
  onViewChange?: (view: ViewChangePayload) => void;
  /** Callback signature: (element: SelectedElement | null) => void */
  onElementSelect?: (element: SelectedElement | null) => void;

  // Debugging & Trace Callbacks
  /** Callback signature: (filterOptions?: any) => Promise<HistoricalFlowInstanceSummary[]> */
  fetchTraceList?: (filterOptions?: any) => Promise<HistoricalFlowInstanceSummary[]>;

  // Property Testing Callbacks
  /** Callback signature: (testCase: FlowTestCase) => Promise<TestRunResult | null> */
  onRunTestCase?: (testCase: FlowTestCase) => Promise<TestRunResult | null>;

  // Customization (Renderers)
  customReactFlowProOptions?: any;
  /** React Flow NodeTypes object. */
  customNodeTypes: any;
  /** React Flow EdgeTypes object. */
  customEdgeTypes: any;
  
  // Consolidated Inspector Tab Renderers (New Architecture)
  /** PRIMARY TAB: Full module YAML source viewer. Signature: (props: InspectorSourceTabProps) => React.ReactNode */
  renderInspectorSourceTab?: (props: InspectorSourceTabProps) => React.ReactNode;
  /** Component-level configuration FORM editor. Signature: (props: InspectorPropertiesTabProps) => React.ReactNode */
  renderInspectorPropertiesTab?: (props: InspectorPropertiesTabProps) => React.ReactNode;
  /** Unified debugging and testing interface. Signature: (props: InspectorDebugTestTabProps) => React.ReactNode */
  renderInspectorDebugTestTab?: (props: InspectorDebugTestTabProps) => React.ReactNode;
  
  /** Signature: (summary: HistoricalFlowInstanceSummary, actions: FlowRunListItemActions, isSelected: boolean) => React.ReactNode */
  renderFlowRunListItem?: (summary: HistoricalFlowInstanceSummary, actions: FlowRunListItemActions, isSelected: boolean) => React.ReactNode;

  // Layout
  /** ELK.js layout configuration options. */
  elkOptions?: LayoutOptions;

  // Styling & Dimensions
  className?: string;
  style?: React.CSSProperties;
  
  // UI Customization Options (New)
  /** Customization options for UI appearance and behavior. */
  uiOptions?: UICustomizationOptions;
}

export interface UICustomizationOptions {
  /** Configuration options for sidebar appearance and behavior. */
  sidebarOptions?: SidebarOptions;
  /** Color theme configuration for the visualizer. */
  colorTheme?: ColorTheme;
  /** Styling options for nodes. */
  nodeStyleOptions?: NodeStyleOptions;
  /** Styling options for edges. */
  edgeStyleOptions?: EdgeStyleOptions;
  /** Configuration for user interaction behavior. */
  interactionOptions?: InteractionOptions;
}

export interface SidebarOptions {
  /** Default width of left sidebar in pixels. */
  defaultLeftWidth?: number;
  /** Default width of right sidebar in pixels. */
  defaultRightWidth?: number;
  /** Minimum sidebar width in pixels. */
  minWidth?: number;
  /** Maximum sidebar width in pixels. */
  maxWidth?: number;
  /** Whether sidebars can be resized. */
  resizable?: boolean;
  /** Whether sidebars can be collapsed. */
  collapsible?: boolean;
}

export interface ColorTheme {
  /** Primary accent color. */
  primaryColor?: string;
  /** Secondary accent color. */
  secondaryColor?: string;
  /** Color configuration for different node types and states. */
  nodeColors?: NodeColors;
  /** Color configuration for different edge types and states. */
  edgeColors?: EdgeColors;
  /** Main background color. */
  backgroundColor?: string;
  /** Sidebar background color. */
  sidebarBackgroundColor?: string;
}

export interface NodeColors {
  /** Color for successful execution. */
  successColor?: string;
  /** Color for failed execution. */
  failureColor?: string;
  /** Color for running execution. */
  runningColor?: string;
  /** Color for skipped execution. */
  skippedColor?: string;
  /** Color for not executed nodes. */
  notExecutedColor?: string;
  /** Default color for step nodes. */
  stepNodeColor?: string;
  /** Default color for trigger nodes. */
  triggerNodeColor?: string;
  /** Default color for sub-flow invoker nodes. */
  subFlowInvokerColor?: string;
  /** Registry of component-specific colors using perceptually uniform OKLCH color space. */
  componentColors?: ComponentColorRegistry;
}

export interface ComponentColorRegistry {
  // Data Processing Components (Blue-Cyan range: 180-240°)
  /** Primary color for data processing components (MapData, FilterData, JsonSchemaValidator). */
  dataProcessingColor?: string;
  /** Background color for data processing components. */
  dataProcessingBackgroundColor?: string;
  /** Accent color for data processing components. */
  dataProcessingAccentColor?: string;

  // Control Flow Components (Purple range: 270-330°)
  /** Primary color for control flow components (Fork, Switch, MergeStreams). */
  controlFlowColor?: string;
  /** Background color for control flow components. */
  controlFlowBackgroundColor?: string;
  /** Accent color for control flow components. */
  controlFlowAccentColor?: string;

  // External Communication Components (Orange-Red range: 0-60°)
  /** Primary color for communication components (HttpCall, SendEmail, SendNotification). */
  communicationColor?: string;
  /** Background color for communication components. */
  communicationBackgroundColor?: string;
  /** Accent color for communication components. */
  communicationAccentColor?: string;

  // Integration Components (Teal-Green range: 120-180°)
  /** Primary color for integration components (ExternalServiceAdapter). */
  integrationColor?: string;
  /** Background color for integration components. */
  integrationBackgroundColor?: string;
  /** Accent color for integration components. */
  integrationAccentColor?: string;

  // Security Components (Red-Pink range: 330-30°)
  /** Primary color for security components (Authorize). */
  securityColor?: string;
  /** Background color for security components. */
  securityBackgroundColor?: string;
  /** Accent color for security components. */
  securityAccentColor?: string;

  // Flow Control Components (Yellow-Green range: 60-120°)
  /** Primary color for flow control components (SubFlowInvoker, FailFlow). */
  flowControlColor?: string;
  /** Background color for flow control components. */
  flowControlBackgroundColor?: string;
  /** Accent color for flow control components. */
  flowControlAccentColor?: string;

  // Validation Components (Magenta range: 300-360°)
  /** Primary color for validation components (JsonSchemaValidator when used for validation). */
  validationColor?: string;
  /** Background color for validation components. */
  validationBackgroundColor?: string;
  /** Accent color for validation components. */
  validationAccentColor?: string;
}

export interface EdgeColors {
  /** Color for data flow edges (pastel green). */
  dataFlowColor?: string;
  /** Color for control flow edges. */
  controlFlowColor?: string;
  /** Color for invocation edges. */
  invocationEdgeColor?: string;
  /** Color for trigger link edges. */
  triggerLinkEdgeColor?: string;
  /** Color for executed paths. */
  executedPathColor?: string;
  /** Color for not executed paths. */
  notExecutedPathColor?: string;
}

export interface NodeStyleOptions {
  /** Default border width in pixels. */
  defaultBorderWidth?: number;
  /** Border width for selected nodes. */
  selectedBorderWidth?: number;
  /** Border width for not executed nodes. */
  notExecutedBorderWidth?: number;
  /** Default border style. */
  defaultBorderStyle?: string;
  /** Border style for not executed nodes. */
  notExecutedBorderStyle?: string;
  /** Opacity for not executed nodes. */
  notExecutedOpacity?: number;
  /** Whether to show node shadows. */
  enableShadows?: boolean;
  /** Shadow color for nodes. */
  shadowColor?: string;
}

export interface EdgeStyleOptions {
  /** Default edge stroke width. */
  defaultStrokeWidth?: number;
  /** Stroke width for selected edges. */
  selectedStrokeWidth?: number;
  /** Whether to use dashed lines for data flow edges. */
  useDashedLines?: boolean;
  /** Dash pattern for dashed edges. */
  dashPattern?: string;
  /** Whether to show labels on edges. */
  showEdgeLabels?: boolean;
  /** Font size for edge labels. */
  edgeLabelFontSize?: number;
}

export interface InteractionOptions {
  /** Enable double-click navigation for SubFlowInvoker nodes. */
  enableDoubleClickNavigation?: boolean;
  /** Enable hover effects on nodes and edges. */
  enableHoverEffects?: boolean;
  /** Enable multi-selection of nodes. */
  multiSelectEnabled?: boolean;
  /** Enable animations for state changes. */
  enableAnimations?: boolean;
  /** Animation duration in milliseconds. */
  animationDuration?: number;
}

// --- Interaction Message Models ---
export interface FlowSelectedEventMsg {
  /** The FQN of the selected flow. */
  flowFqn: string;
}

export interface NavigationStateChangedMsg {
  /** The FQN of the current flow, if any. */
  currentFlowFqn?: string;
  /** Identifier for the current view, e.g., 'flowDetail', 'systemOverview'. */
  viewName: string;
}

export interface StepNodeClickedEventMsg {
  /** The ID of the clicked React Flow node. */
  nodeId: string;
  /** Summary or key identifying data of the clicked step node. Full data available via React Flow selection. */
  stepData_summary: any;
}

export interface SelectedElementChangedMsg {
  /** The newly selected element, or null if deselected. */
  element: SelectedElement;
}

export interface ConfigEditActionMsg {
  /** The new configuration value. */
  newConfigValue: any;
  /** Path to the configuration property being edited. */
  pathToConfig: StringOrNumber[];
}

// --- Legacy Types for Backward Compatibility ---
export interface ExecutionResult {
  executionId: string;
  status: 'SUCCESS' | 'FAILURE' | 'SKIPPED' | 'RUNNING';
  /** ISO timestamp of execution start. */
  startTime: string;
  /** ISO timestamp of execution completion. */
  endTime?: string;
  /** Total execution duration. */
  durationMs?: number;
  /** Full execution trace if available. */
  trace?: FlowExecutionTrace;
  /** Single step trace for step-level execution. */
  stepTrace?: StepExecutionTrace;
  /** Execution logs from all steps. */
  logs: StepLog[];
  /** Output from the last executed step. */
  finalOutput?: any;
  /** Error message if execution failed. */
  error?: string;
  /** Detailed error information. */
  errorDetails?: ExecutionError;
}

export interface DataLineage {
  targetStepId: string;
  flowFqn: string;
  /** Ordered list of steps from trigger to target. */
  dataPath: DataLineageStep[];
  /** All available input data at the target step. */
  availableInputs: Record<string, any>;
  /** Context variables available at the target step. */
  contextVariables: Record<string, any>;
  /** How inputs are mapped from previous steps. */
  inputMappings: InputMapping[];
}

export interface DataLineageStep {
  stepId: string;
  /** Type of step (trigger, component, subflow). */
  stepType: string;
  /** Component FQN if this is a component step. */
  componentFqn?: string;
  /** Output schema of this step. */
  outputSchema?: ComponentSchema;
  /** Actual or example output data from this step. */
  outputData?: any;
  /** Order of execution in the flow. */
  executionOrder: number;
}

export interface InputMapping {
  /** Field name in the target step's input. */
  targetInputField: string;
  sourceType: 'previousStep' | 'contextVariable' | 'triggerData' | 'constant';
  /** Source step ID if sourceType is 'previousStep'. */
  sourceStepId?: string;
  /** Field name in the source step's output. */
  sourceOutputField?: string;
  /** Context variable name if sourceType is 'contextVariable'. */
  contextVariableName?: string;
  /** Default value if no source is available. */
  defaultValue?: any;
  /** Transformation rule applied to the source data. */
  transformationRule?: string;
  /** Whether this input field is required by the component schema. */
  isRequired: boolean;
}

export interface StreamingExecutionRequest {
  /** Complete DSL flow definition object */
  flowDefinition: any;
  /** Input data for the flow trigger */
  triggerInput: any;
  /** Execution options with timeout, mocks, etc. */
  executionOptions?: ExecutionOptions;
  /** Optional step ID to execute up to (for partial execution) */
  targetStepId?: string;
  /** Unique execution ID for tracking */
  executionId?: string;
}

export interface StepExecutionRequest {
  /** Step configuration and component reference */
  stepDefinition: any;
  /** Resolved input data for the step */
  inputData: any;
  /** Component configuration object */
  componentConfig: any;
  /** Execution options for the step execution */
  executionOptions?: ExecutionOptions;
}

export type StreamingEventType = 
  | 'execution.started'
  | 'step.started' 
  | 'step.completed'
  | 'step.failed'
  | 'execution.completed'
  | 'execution.failed'
  | 'execution.cancelled'
  | 'execution.warning'
  | 'heartbeat';

export interface StreamingExecutionEvent {
  /** Event type identifier */
  type: StreamingEventType;
  /** Unique execution ID */
  executionId: string;
  /** Event timestamp */
  timestamp: string;
  /** Event sequence number for ordering */
  sequence: number;
  /** Event data payload */
  data: any;
}

export interface ExecutionStartedEvent {
  executionId: string;
  flowFqn: string;
  triggerInput: any;
  totalSteps: number;
  estimatedDuration: number;
}

export interface StepStartedEvent {
  stepId: string;
  componentFqn: string;
  inputData: any;
  estimatedDuration: number;
  executionOrder: number;
}

export interface StepCompletedEvent {
  stepId: string;
  componentFqn: string;
  inputData: any;
  outputData: any;
  actualDuration: number;
  executionOrder: number;
  contextChanges?: Record<string, any>;
}

export interface StepFailedEvent {
  stepId: string;
  componentFqn: string;
  inputData: any;
  error: ExecutionError;
  actualDuration: number;
  executionOrder: number;
}

export interface ExecutionCompletedEvent {
  executionId: string;
  flowFqn: string;
  status: FlowExecutionStatusEnum;
  totalDuration: number;
  stepCount: number;
  successfulSteps: number;
  failedSteps: number;
  finalOutput: any;
  finalContext: Record<string, any>;
}

export interface ExecutionFailedEvent {
  executionId: string;
  flowFqn: string;
  error: ExecutionError;
  totalDuration: number;
  completedSteps: number;
  failedStep?: string;
}

export interface ExecutionWarningEvent {
  warningType: string;
  message: string;
  affectedSteps?: string[];
  timestamp: string;
}

export interface ExecutionStatus {
  executionId: string;
  flowFqn: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep?: string;
  progress: {
    totalSteps: number;
    completedSteps: number;
    currentStepIndex: number;
  };
  startTime: string;
  estimatedEndTime?: string;
  actualEndTime?: string;
}

export interface ExecutionCancellationRequest {
  executionId: string;
  reason?: string;
}

export interface ExecutionCancellationResponse {
  executionId: string;
  cancelled: boolean;
  message: string;
}

// --- Component Styling Types ---
export type ComponentCategoryEnum = 
  | 'dataProcessing' 
  | 'controlFlow' 
  | 'communication' 
  | 'integration' 
  | 'security' 
  | 'flowControl' 
  | 'validation' 
  | 'custom';

export interface ComponentStyleDefinition {
  /** Fully qualified name of the component (e.g., 'StdLib:MapData'). */
  componentFqn: string;
  /** Category for grouping similar components. */
  category: ComponentCategoryEnum;
  /** Human-readable display name for the component. */
  displayName?: string;
  /** Unicode emoji or icon identifier for visual representation. */
  icon?: string;
  /** Brief description of the component's purpose. */
  description?: string;
  
  // Color properties (will be resolved from ComponentColorRegistry based on category)
  /** Override primary color for this specific component. */
  primaryColor?: string;
  /** Override background color for this specific component. */
  backgroundColor?: string;
  /** Override accent color for this specific component. */
  accentColor?: string;
  
  // Visual properties
  /** Border style for the component. */
  borderStyle?: string;
  /** Border width in pixels. */
  borderWidth?: number;
  /** Border radius in pixels. */
  borderRadius?: number;
  
  // Typography
  /** Font size for component text. */
  fontSize?: number;
  /** Font weight for component text. */
  fontWeight?: string;
  
  // Special styling flags
  /** Whether this component should have enhanced visual prominence. */
  isHighPriority?: boolean;
  /** Whether to show configuration preview in the node. */
  showConfigPreview?: boolean;
  /** Maximum lines to show in config preview. */
  maxConfigPreviewLines?: number;
}

export interface ComponentStyleRegistry {
  /** Map of component FQN to style definition. */
  styles: Record<string, ComponentStyleDefinition>;
  /** Default styles for each category. */
  defaultCategoryStyles: Record<string, ComponentStyleDefinition>;
  
  // Methods for style resolution (conceptual - would be implemented in service)
  /** Get style definition for a specific component. Signature: (componentFqn: string) => ComponentStyleDefinition | null */
  getStyleForComponent: (componentFqn: string) => ComponentStyleDefinition | null;
  /** Get default style for a category. Signature: (category: ComponentCategoryEnum) => ComponentStyleDefinition */
  getCategoryStyle: (category: ComponentCategoryEnum) => ComponentStyleDefinition;
  /** Register a new component style. Signature: (style: ComponentStyleDefinition) => void */
  registerComponentStyle: (style: ComponentStyleDefinition) => void;
} 