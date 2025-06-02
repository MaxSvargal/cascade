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
  /** FQN of the module this element belongs to. */
  moduleFqn?: string;
}

export interface InspectorPropertiesActions {
  /** Call to request saving changes to a part of the selected element's configuration. Signature: (newConfigValue: any, pathToConfig: (string | number)[]) => void */
  requestSave: (newConfigValue: any, pathToConfig: (string | number)[]) => void;
  /** Execute the current step/flow with current properties for debugging. Signature: (elementId: string, config: any) => Promise<StepExecutionTrace | FlowExecutionTrace> */
  runDebugExecution: (elementId: string, config: any) => Promise<StepExecutionTrace | FlowExecutionTrace>;
}

export interface UnifiedDebugTestActions {
  /** Execute flow/step for debugging with current configuration. Signature: (targetId: string, config?: any) => Promise<ExecutionResult> */
  runDebugExecution: (targetId: string, config?: any) => Promise<ExecutionResult>;
  /** Execute a test case and return results. Signature: (testCase: FlowTestCase) => Promise<TestRunResult> */
  runTestCase: (testCase: FlowTestCase) => Promise<TestRunResult>;
  /** Generate default test case from current flow. Signature: (flowFqn: string, testType: 'happy_path' | 'error_handling' | 'performance') => FlowTestCase */
  generateTestCase: (flowFqn: string, testType: 'happy_path' | 'error_handling' | 'performance') => FlowTestCase;
  /** Collect execution logs from each step. Signature: (executionId: string) => Promise<StepLog[]> */
  collectStepLogs: (executionId: string) => Promise<StepLog[]>;
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

export interface ExecutionResult {
  executionId: string;
  status: ExecutionStatusEnum;
  trace?: FlowExecutionTrace;
  stepTrace?: StepExecutionTrace;
  logs: StepLog[];
  error?: string;
}

export interface FlowDataAnalysisActions {
  /** Analyze data flow between steps. Signature: (sourceStepId: string, targetStepId: string) => DataFlowAnalysis */
  analyzeDataFlow: (sourceStepId: string, targetStepId: string) => DataFlowAnalysis;
  /** Compare data between multiple executions. Signature: (traceIds: string[]) => ExecutionComparison */
  compareExecutions: (traceIds: string[]) => ExecutionComparison;
}

export interface DataFlowAnalysis {
  sourceStepId: string;
  targetStepId: string;
  /** Data that flowed from source to target. */
  dataTransformed?: any;
  /** Path of data transformation (e.g., ['steps.source.outputs.data', 'inputs.targetInput']). */
  transformationPath: string[];
  /** Size of transferred data in bytes. */
  dataSize?: number;
  /** When the data transfer occurred. */
  transferTime?: string;
}

export interface ExecutionComparison {
  traceIds: string[];
  differences: ExecutionDifference[];
  performanceMetrics: PerformanceComparison;
}

export interface ExecutionDifference {
  stepId: string;
  /** Field that differs (e.g., 'inputData', 'outputData', 'status'). */
  field: string;
  /** Values from each execution being compared. */
  values: any[];
}

export interface PerformanceComparison {
  /** Total execution durations for each trace. */
  totalDurations: number[];
  /** Step durations by step ID for each trace. */
  stepDurations: Record<string, number[]>;
  /** Critical path step IDs for each trace. */
  criticalPaths: string[][];
}

export type DslModuleStatusEnum = 'unloaded' | 'loading' | 'loaded' | 'error';

export type StringOrNumber = string | number;

export interface DslModuleErrorItem {
  message: string;
  path?: StringOrNumber[];
}

export interface DslModuleImportItem {
  alias?: string;
  fqn: string;
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
  parsedContent?: object;
  /** Extracted definitions from the module. */
  definitions?: DslModuleDefinitions;
  imports?: DslModuleImportItem[];
  /** Errors from parsing or validation. */
  errors?: DslModuleErrorItem[];
  status: DslModuleStatusEnum;
}

// --- Node & Edge Data Payloads ---

export interface NodeError {
  message: string;
  details?: any;
  isFatal?: boolean;
}

export interface BaseNodeData {
  label: string;
  /** Raw DSL definition snippet for this element. */
  dslObject?: any;
  /** Fully resolved FQN of the component type. */
  resolvedComponentFqn?: string;
  /** JSON schema for the component, if available. */
  componentSchema?: ComponentSchema;
  isNamedComponent?: boolean;
  /** Context variable names used. */
  contextVarUsages?: string[];
  /** Error info if this element has a validation/resolution error. */
  error?: NodeError;
}

export type ExecutionStatusEnum = 'SUCCESS' | 'FAILURE' | 'SKIPPED' | 'RUNNING';

export interface StepNodeData extends BaseNodeData {
  stepId: string;
  executionStatus?: ExecutionStatusEnum;
  executionDurationMs?: number;
  executionInputData?: any;
  executionOutputData?: any;
}

export interface SubFlowInvokerNodeData extends StepNodeData {
  invokedFlowFqn: string;
}

export interface TriggerEntryPointNodeData extends BaseNodeData {
  triggerType: string;
}

export interface SystemGraphNodeData extends BaseNodeData {
  /** FQN of the flow or unique ID for the trigger source. */
  fqn: string;
  /** Whether this node supports navigation (for flow nodes). */
  navigatable?: boolean;
  /** Target flow FQN for navigation (for flow nodes). */
  targetFlowFqn?: string;
  /** Click handler for navigation (for flow nodes). */
  onFlowNodeClick?: (flowFqn: string) => void;
}

export interface BaseEdgeData {
  // Common edge properties if any (currently none defined here)
}

export type FlowEdgeTypeEnum = 'dataFlow' | 'controlFlow';

export interface FlowEdgeData extends BaseEdgeData {
  type: FlowEdgeTypeEnum;
  sourceStepId?: string;
  targetStepId: string;
  /** Indicates if this edge was traversed in a trace. */
  isExecutedPath?: boolean;
}

export type SystemEdgeTypeEnum = 'invocationEdge' | 'triggerLinkEdge';

export interface SystemEdgeData extends BaseEdgeData {
  type: SystemEdgeTypeEnum;
}

// --- Component Schema ---

export interface ComponentSchema {
  /** FQN of the component type. */
  fqn: string;
  /** JSON Schema for the 'config' block. */
  configSchema?: object;
  /** JSON Schema describing input ports/data structure. */
  inputSchema?: object;
  /** JSON Schema describing output ports/data structure. */
  outputSchema?: object;
}

// --- Trace & Debugging Types ---

export interface StepExecutionTrace {
  stepId: string;
  status: ExecutionStatusEnum;
  startTime?: string;
  endTime?: string;
  durationMs?: number;
  inputData?: any;
  outputData?: any;
  resolvedConfig?: any;
  contextBefore?: Record<string, any>;
  contextAfter?: Record<string, any>;
}

export type FlowExecutionStatusEnum = 'COMPLETED' | 'FAILED' | 'RUNNING' | 'TERMINATED';

export interface FlowExecutionTrace {
  traceId: string;
  flowFqn: string;
  instanceId?: string;
  status: FlowExecutionStatusEnum;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  triggerData?: any;
  initialContext?: Record<string, any>;
  finalContext?: Record<string, any>;
  steps: StepExecutionTrace[];
}

export interface HistoricalFlowInstanceSummary {
  /** Typically traceId or instanceId. */
  id: string;
  flowFqn: string;
  startTime: string;
  /** e.g., 'COMPLETED', 'FAILED'. */
  status: string;
}

// --- Property Testing Types ---

export interface TestCaseAssertion {
  /** JMESPath to data in step output or context. */
  targetPath: string;
  /** Expected value or pattern. */
  expectedValue: any;
  /** e.g., 'equals', 'contains', 'matchesRegex'. */
  comparison: string;
}

export interface MockedComponentResponse {
  /** Regex or ID of step(s) to mock. */
  stepIdPattern: string;
  /** Data to return as output. */
  outputData?: any;
  /** Error to simulate. */
  errorData?: any;
  delayMs?: number;
}

export interface FlowTestCase {
  flowFqn: string;
  description?: string;
  triggerInput: any;
  contextOverrides?: Record<string, any>;
  componentMocks?: MockedComponentResponse[];
  assertions: TestCaseAssertion[];
}

export interface AssertionResult extends TestCaseAssertion {
  actualValue?: any;
  passed: boolean;
  message?: string;
}

export interface TestRunResult {
  testCase: FlowTestCase;
  passed: boolean;
  trace?: FlowExecutionTrace;
  assertionResults: AssertionResult[];
  /** Error message if test run failed globally. */
  error?: string;
}

// --- Module Registry Interface ---

export interface ResolvedComponentInfo {
  baseType: string;
  componentDefinition?: any;
  sourceModuleFqn: string;
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
  getFlowDefinition: (flowFqn: string) => any | null;
  /** Signature: (componentFqn: string) => any | null */
  getNamedComponentDefinition: (componentFqn: string) => any | null;
  /** Signature: (contextFqn: string) => any | null */
  getContextDefinition: (contextFqn: string) => any | null;
}

// --- Main Component Props ---

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

export interface TestDefinitionActions {
  /** Signature: (testCase: FlowTestCase) => Promise<TestRunResult | null> */
  runTestCase: (testCase: FlowTestCase) => Promise<TestRunResult | null>;
}

export interface FlowRunListItemActions {
  /** Signature: (traceIdOrInstanceId: string) => void */
  selectTrace: (traceIdOrInstanceId: string) => void;
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
  /** Component-level configuration FORM editor with debug execution. Signature: (selectedElement: SelectedElement | null, actions: InspectorPropertiesActions, moduleRegistry: IModuleRegistry) => React.ReactNode */
  renderInspectorPropertiesTab?: (selectedElement: SelectedElement | null, actions: InspectorPropertiesActions, moduleRegistry: IModuleRegistry) => React.ReactNode;
  /** Full flow DSL source viewer with selected step highlighting. Signature: (currentFlowFqn: string | null, selectedElement: SelectedElement | null, moduleRegistry: IModuleRegistry) => React.ReactNode */
  renderInspectorSourceTab?: (currentFlowFqn: string | null, selectedElement: SelectedElement | null, moduleRegistry: IModuleRegistry) => React.ReactNode;
  /** Unified debugging and testing interface. Combines step logs, test execution, and results. Signature: (currentFlowFqn: string | null, selectedElement: SelectedElement | null, actions: UnifiedDebugTestActions, moduleRegistry: IModuleRegistry) => React.ReactNode */
  renderInspectorDebugTestTab?: (currentFlowFqn: string | null, selectedElement: SelectedElement | null, actions: UnifiedDebugTestActions, moduleRegistry: IModuleRegistry) => React.ReactNode;
  
  // Removed/Deprecated Tab Renderers
  // - renderInspectorDataFlowTab (merged into DebugTest)
  // - renderInspectorTestingTab (merged into DebugTest) 
  // - renderInspectorDataIOTab (removed - redundant with Properties)
  // - renderInspectorContextVarsTab (merged into Properties)
  // - renderInspectorTestDefinitionTab (merged into DebugTest)
  // - renderInspectorAssertionResultsTab (merged into DebugTest)
  
  /** Signature: (summary: HistoricalFlowInstanceSummary, actions: FlowRunListItemActions, isSelected: boolean) => React.ReactNode */
  renderFlowRunListItem?: (summary: HistoricalFlowInstanceSummary, actions: FlowRunListItemActions, isSelected: boolean) => React.ReactNode;

  // Layout
  /** ELK.js layout configuration options. */
  elkOptions?: any;

  // Styling & Dimensions
  className?: string;
  style?: React.CSSProperties;
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