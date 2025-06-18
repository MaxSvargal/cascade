// Core types for Cascade Client Library
// These types are shared between the client and test server

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

export type ExecutionStatusEnum = 'SUCCESS' | 'FAILURE' | 'SKIPPED' | 'RUNNING' | 'PENDING';
export type FlowExecutionStatusEnum = 'COMPLETED' | 'FAILED' | 'RUNNING' | 'TERMINATED' | 'PENDING';

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

export interface ExecutionOptions {
  useMocks?: boolean;
  /** Signature: (stepId: string, componentFqn: string) => MockedComponentResponse | null */
  mockProvider?: (stepId: string, componentFqn: string) => MockedComponentResponse | null;
  timeoutMs?: number;
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

export interface JsonSchemaObject {
  [key: string]: any;
}

export interface TriggerRuntimeContext {
  /** Type of trigger that generated this context. */
  triggerType: string;
  /** Configuration used to set up the trigger. */
  triggerConfig: any;
  /** Standardized runtime data provided to the flow (conforms to triggerOutputSchema). */
  runtimeData: any;
  /** Timestamp when the trigger was activated. */
  activationTimestamp: string;
  /** Additional metadata about the trigger activation. */
  metadata?: {
    /** Original external event that activated the trigger. */
    originalEvent?: any;
    /** Processing information (authentication, validation results, etc.). */
    processingInfo?: any;
  };
}

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
}

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
  /** DEPRECATED: Use triggerContext instead. Data that triggered the flow execution (from trigger.outputSchema). */
  triggerData?: any;
  /** Complete trigger runtime context including type, config, and standardized output data. */
  triggerContext?: TriggerRuntimeContext;
  /** Initial context state. */
  initialContext?: Record<string, any>;
  /** Final context state. */
  finalContext?: Record<string, any>;
  /** Execution traces for all steps in execution order. */
  steps: StepExecutionTrace[];
  /** Overall flow error if the flow itself failed outside a specific step. */
  flowError?: ExecutionError;
}

// Client configuration types
export interface CascadeClientConfig {
  /** Whether to use test server instead of real API */
  useTestServer: boolean;
  /** Base URL for production API (default: '/api/execution') */
  apiBaseUrl?: string;
  /** Component schemas for test server */
  componentSchemas?: Record<string, ComponentSchema>;
  /** Request timeout in milliseconds */
  timeoutMs?: number;
}

// Unified request interface for the client
export interface CascadeExecutionRequest {
  action: 'flow' | 'step' | 'status' | 'cancel';
  executionId?: string;
  // Flow execution
  flowDefinition?: any;
  triggerInput?: any;
  executionOptions?: any;
  targetStepId?: string;
  // Step execution
  stepDefinition?: any;
  inputData?: any;
  componentConfig?: any;
  // Cancellation
  reason?: string;
} 