version: "4.33"
date: "2023-11-05"
vision: "To be the canonical toolkit for building sophisticated reactive applications, integrations, and cloud platform services on the Cascade Platform. StdLib aims to cover 90-95% of common requirements by offering robust implementations of core workflow primitives, data transformation, reliability patterns, stateful entities, reactive stream operators, SaaS platform infrastructure components, common integration protocols (via plugins), and observability/auditing, leveraging the Cascade Core Runtime."

production_business_requirements:
  - "Comprehensive Patterns: Cover EIPs, orchestration, Actor model, parallel processing, stream manipulation, SaaS needs, external integrations (plugins)."
  - "Abstraction: Hide low-level complexity behind well-defined component interfaces."
  - "Reliability & Resilience: Production-grade components for error handling, retries, idempotency, circuit breakers, DLQ, state management."
  - "Performance: Efficient implementation, leveraging Core's async nature."
  - "Composability: Seamlessly wireable components in DSL."
  - "Configurability: Flexible configuration options."
  - "Observability: Full integration with Core tracing, logging, metrics."
  - "Testability: Components easily testable in isolation and integrated."

core_principles:
  - "Composition over Syntax"
  - "Leverage Core Capabilities (ComponentRuntimeAPI)"
  - "Clear Contracts (config, inputs, outputs)"
  - "Stateless Preferred, Stateful Explicit"
  - "Configuration by Convention"
  - "Interface-Based Design (internally)"
  - "Plugin-Based Extensibility"
  - "Security by Design"
  - "Runtime Validation (config and inputs against schemas)"
  - "Required API Documentation"
  - "State Machine Documentation"

notes:
  naming_convention: "Namespace:ComponentName (e.g., Data:Query)"
  versioning_note: "Flows should ideally reference components with explicit versions (e.g., StdLib:HttpCall:4.33) or depend on StdLib version for the flow."
  conceptual_runtime_apis_note: "Required Runtime APIs list conceptual functions."

global_schemas:
  StandardErrorStructure:
    $id: "#/definitions/schemas/StandardErrorStructure"
    type: object
    properties:
      type:
        type: string
        description: "Category.ComponentName.SpecificErrorType (e.g., 'HttpCall.TimeoutError', 'AdapterError')"
      message:
        type: string
        description: "Human-readable error message."
      code:
        type: string
        description: "Optional internal/external code (e.g., HTTP status code)."
      details:
        type: ["object", "null"]
        description: "Optional, component-specific non-sensitive details."
        additionalProperties: true
      timestamp:
        type: string
        format: date-time
        description: "ISO 8601 timestamp (added by Core)."
    required: ["type", "message", "timestamp"]
  HttpResponse:
    $id: "#/definitions/schemas/HttpResponse"
    type: object
    properties:
      statusCode: { type: integer }
      headers:
        type: object
        additionalProperties: { type: string }
      body:
        description: "Response body. Object if JSON, otherwise string (Base64 for binary)."
        oneOf:
          - { type: object, additionalProperties: true }
          - { type: array }
          - { type: string }
          - { type: "null" }
    required: ["statusCode", "headers"]
  SqsMessage: # Kept for SQS plugin reference
    $id: "#/definitions/schemas/SqsMessage"
    type: object
    properties:
      body: { type: string }
      parsedBody: { description: "Optional: Core attempts JSON parse of body." }
      attributes: { type: object, description: "Standard SQS attributes." }
      messageAttributes: { type: object, description: "Custom SQS message attributes." }
      metadata:
        type: object
        properties:
          MessageId: { type: string }
          ReceiptHandle: { type: string }
          MD5OfBody: { type: string }
          QueueUrl: { type: string }
          Region: { type: string }
        required: ["MessageId", "ReceiptHandle", "MD5OfBody"]
    required: ["body", "metadata"]
  HttpTriggerRequest:
    $id: "#/definitions/schemas/HttpTriggerRequest"
    type: object
    properties:
      path: { type: string, description: "Actual request path." }
      method: { type: string, description: "HTTP method used." }
      headers:
        type: object
        additionalProperties: { type: string }
        description: "Request headers."
      queryParameters:
        type: object
        additionalProperties: { type: ["string", "array"], items: { type: string } }
        description: "Parsed query parameters."
      body:
        description: "Request body. Object if JSON, string otherwise (Base64 for binary). Null if no body."
        oneOf:
          - { type: object, additionalProperties: true }
          - { type: array }
          - { type: string }
          - { type: "null" }
      principal: # Added by Core after successful authentication middleware
        type: ["object", "null"]
        description: "Authenticated principal details, if applicable. Structure depends on auth method."
        properties:
          id: { type: string }
          type: { type: string, description: "e.g., 'user', 'apiKey', 'service_account'" }
          claims: { type: object, additionalProperties: true, description: "Additional claims/attributes from token/auth provider." }
        required: ["id", "type"]
    required: ["path", "method", "headers"]
  ScheduledTriggerPayload:
    $id: "#/definitions/schemas/ScheduledTriggerPayload"
    type: object
    properties:
      triggerTime:
        type: string
        format: date-time
        description: "Actual ISO 8601 timestamp when the trigger fired."
      scheduledTime:
        type: string
        format: date-time
        description: "ISO 8601 timestamp for which the execution was scheduled."
      payload:
        type: any
        description: "The initialPayload configured for the trigger, if any."
    required: ["triggerTime", "scheduledTime"]
  StreamTriggerMessage: # Output for StreamTrigger with batchSize=1
    $id: "#/definitions/schemas/StreamTriggerMessage"
    type: object
    properties:
      message: # This mirrors StreamIngestor's output
        type: any
        description: "Consumed message payload, processed according to StreamIngestor's outputFormat."
      metadata: # This mirrors StreamIngestor's output
        type: object
        description: "Source-specific metadata (e.g., Kafka offset, SQS receiptHandle). Structure per plugin. For Manual ack."
    required: ["message"] # metadata might be optional depending on ingestor
  StreamTriggerBatch: # Output for StreamTrigger with batchSize > 1
    $id: "#/definitions/schemas/StreamTriggerBatch"
    type: object
    properties:
      messages:
        type: array
        items: { $ref: "#/definitions/schemas/StreamTriggerMessage#/properties/message" } # Array of message payloads
      metadataList:
        type: array
        items: { $ref: "#/definitions/schemas/StreamTriggerMessage#/properties/metadata" } # Array of corresponding metadata
    required: ["messages"]
  EventBusTriggerPayload:
    $id: "#/definitions/schemas/EventBusTriggerPayload"
    type: object
    properties:
      event:
        type: object
        properties:
          id: { type: string, description: "Unique ID of the event." }
          type: { type: string, description: "Type of the event (e.g., 'user.created')." }
          source: { type: string, description: "Originator of the event." }
          timestamp: { type: string, format: date-time, description: "ISO 8601 timestamp of event creation." }
          payload: { type: any, description: "The actual event data." }
        required: ["id", "type", "source", "timestamp", "payload"]
    required: ["event"]

components:
  # 3.1 Execution & Logic Components
  - type: StdLib:MapData
    purpose: "Transforms input data using an expression language."
    config:
      expression: { type: ExpressionString, required: true, description: "Transformation expression (sandboxed)." }
      language: { type: string, enum: ["JMESPath", "JsonPointer"], default: "JMESPath", description: "Expression language." }
    inputs:
      data: { type: any, required: true, description: "Input data to transform." }
    outputs:
      result: { type: any, description: "Transformed data." }
      error:
        is_error_path: true
        description: "Error if expression is invalid or evaluation fails."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["MapData.ExpressionError"]
    required_runtime_apis: ["sandbox_execute_expression(language, expression, data_context)"]
    testing_considerations: "Verify transformations, edge cases, invalid expressions for each language."
    security_considerations: "Sandbox expression languages. Validate expression input."

  - type: StdLib:FilterData
    purpose: "Routes data based on a boolean expression evaluation."
    config:
      expression: { type: BooleanExpressionString, required: true, description: "Boolean expression (sandboxed)." }
      language: { type: string, enum: ["JMESPath", "JsonPointer"], default: "JMESPath", description: "Expression language." }
      matchOutput: { type: OutputPortNameString, default: "matchOutput", description: "Output port name for true evaluation." }
      noMatchOutput: { type: OutputPortNameString, default: "noMatchOutput", description: "Output port name for false evaluation." }
    inputs:
      data: { type: any, required: true, description: "Input data to filter." }
    outputs: # Dynamically named based on config.matchOutput and config.noMatchOutput
      matchOutput: { type: any, description: "Data that evaluated to true." } # Name determined by config.matchOutput
      noMatchOutput: { type: any, description: "Data that evaluated to false." } # Name determined by config.noMatchOutput
      error:
        is_error_path: true
        description: "Error if expression is invalid or eval fails (non-boolean)."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["FilterData.ExpressionError"]
    required_runtime_apis: ["sandbox_execute_expression(language, expression, data_context)"]
    testing_considerations: "Verify routing for true/false/error expressions. Test complex boolean logic."
    security_considerations: "Sandbox expression languages."

  - type: StdLib:Switch
    purpose: "Routes data to one of several output ports based on ordered conditional expressions."
    config:
      cases:
        type: array
        required: true
        description: "List defining conditions and output port names."
        schema:
          type: array
          items:
            type: object
            properties:
              conditionExpression: { type: string, description: "Boolean expression (sandboxed)." }
              language: { type: string, enum: ["JMESPath", "JsonPointer"], default: "JMESPath" }
              outputName: { type: string, description: "Target output port name." }
            required: ["conditionExpression", "outputName"]
      defaultOutputName: { type: OutputPortNameString, default: "defaultOutput", description: "Output port if no cases match." }
    inputs:
      data: { type: any, required: true, description: "Input data for condition evaluation." }
    outputs: # Dynamically defined output ports matching outputName from cases and defaultOutputName.
      # ExamplePortName: { type: any, description: "Input data, if condition for this port matched." }
      error:
        is_error_path: true
        description: "Error if any conditionExpression is invalid or evaluation fails."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["Switch.ConditionError"]
    required_runtime_apis: ["sandbox_execute_expression(language, expression, data_context)"]
    testing_considerations: "Verify routing based on condition order, input data, default output."
    security_considerations: "Sandbox expression languages."

  - type: StdLib:Fork
    purpose: "Duplicates input data and emits it on multiple output ports concurrently."
    config:
      outputNames: { type: "list<OutputPortNameString>", required: true, description: "List of names for output ports." }
    inputs:
      data: { type: any, required: true, description: "Input data to duplicate." }
    outputs: # Dynamically defined output ports matching outputNames.
      # ExampleOutputName1: { type: any, description: "Copy of input data." }
      # ExampleOutputName2: { type: any, description: "Copy of input data." }
    required_runtime_apis: ["Core Runtime concurrent multi-port emission support."]
    testing_considerations: "Unit: Verify data copies. Integration: Verify parallel execution."

  - type: StdLib:Join
    purpose: "Waits for data on all configured input ports, aggregates, and emits."
    config:
      inputNames: { type: "list<InputPortNameString>", required: true, description: "List of input port names to wait for." }
      aggregationMode: { type: string, enum: ["Map", "List", "Combine"], default: "Map", description: "How to aggregate data." }
      timeoutMs: { type: PositiveInteger, description: "Max time in ms to wait. Error on timeout." }
    inputs: # Dynamically defined input ports matching inputNames.
      # ExampleInputName1: { type: any }
      # ExampleInputName2: { type: any }
    outputs:
      aggregatedData: { type: ["object", "list"], description: "Combined data based on aggregationMode." }
      error:
        is_error_path: true
        description: "Error if timeout reached or aggregation fails."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["Join.TimeoutError", "Join.AggregationError"]
    required_runtime_apis: ["get_state()", "set_state()", "set_timer()", "clear_timer()", "Core Runtime reliable multi-input triggering."]
    state_machine: "Maintains internal state for received inputs per port. Emits on all inputs received or timeout."
    testing_considerations: "Mock inputs, test aggregation modes, timeouts. Integration with Fork."

  - type: StdLib:NoOp
    purpose: "Passes input data directly to output. Useful for structuring, debugging."
    config: null
    inputs:
      data: { type: any, required: true, description: "Any input data." }
    outputs:
      data: { type: any, description: "Input data, unchanged." }
    required_runtime_apis: []
    testing_considerations: "Verify output identical to input."

  - type: StdLib:FailFlow
    purpose: "Terminates the current flow instance immediately and marks it as failed."
    config:
      errorMessageExpression: { type: ExpressionString, required: true, description: "Expression for error message (sandboxed)." }
      language: { type: string, enum: ["JMESPath", "JsonPointer"], default: "JMESPath" }
    inputs:
      data: { type: any, description: "Context data for errorMessageExpression." }
    outputs: [] # Terminates flow
    required_runtime_apis: ["sandbox_execute_expression(language, expression, data_context)", "fail_flow(errorMessage)"]
    testing_considerations: "Integration: Verify flow fails, error message recorded. Test expression."
    security_considerations: "Ensure errorMessageExpression sandboxed, prevent injection/sensitive data exposure."

  - type: Execution.SandboxRunner
    new_in_version: "3.2"
    purpose: "Executes custom, potentially untrusted code (e.g., WASM) in a secure sandbox via a plugin."
    config:
      runtime: { type: string, enum: ["WASM"], required: true, description: "Sandbox environment type plugin." }
      codeRef: { type: ResourceIdentifierString, required: true, description: "Reference to code artifact plugin." }
      entrypoint: { type: FunctionNameString, description: "Function name in codeRef (e.g., _start for WASM)." }
      timeoutMs: { type: PositiveInteger, default: 1000, description: "Max execution time in ms." }
      memoryLimitMb: { type: PositiveInteger, default: 64, description: "Max memory in MB." }
      allowedCapabilities: { type: "list<CapabilityString>", default: ["log", "get_input", "set_output"], description: "Allowed ComponentRuntimeAPI features." }
    inputs:
      data: { type: any, required: true, description: "Input data for plugin code." }
    outputs:
      result: { type: any, description: "Data returned by plugin code." }
      error:
        is_error_path: true
        description: "Error during sandboxed execution (timeout, crash, capability violation, load error)."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["SandboxError.Timeout", "SandboxError.ExecutionFailed", "SandboxError.CapabilityViolation", "SandboxError.CodeLoadError"]
    required_runtime_apis: ["component_loader_load(codeRef)", "sandbox_execute(runtime, code, entrypoint, data, timeoutMs, memoryLimitMb, allowedCapabilities)", "log"]
    testing_considerations: "Unit: Test component logic (mock sandbox). Integration: Requires sandboxing runtime. Test WASM plugins, timeouts, memory, capabilities. Plugin logic tested separately."
    security_considerations: "Relies on Core sandboxing and capability enforcement. Load codeRef from trusted sources, verify integrity. Validate inputs."

  - type: Execution.RuleEngine
    new_in_version: "3.2"
    purpose: "Evaluates input data against business rules using a pluggable rule engine."
    config:
      engineType: { type: PluginIdentifierString, required: true, description: "Rule engine plugin identifier." }
      engineConfig: { type: object, required: true, description: "Plugin-specific config (contains/references ruleset). Structure per plugin schema. Use Core Secrets." }
      decisionPoint: { type: RuleEntryPointString, description: "Entry point in rule set (if plugin supports)." }
    inputs:
      facts: { type: object, required: true, description: "Input data/context for rule evaluation." }
    outputs:
      result: { type: any, description: "Outcome from rule engine. Structure per plugin." }
      error:
        is_error_path: true
        description: "Error during rule engine execution (syntax, loading, runtime, config)."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["RuleEngineError.ConfigError", "RuleEngineError.EvaluationError", "RuleEngineError.PluginError"]
    required_runtime_apis: ["component_loader_load(engineType)", "get_secret()", "Plugin uses its allowed Runtime API subset."]
    testing_considerations: "Unit: Test component logic (mock plugin). Integration: Requires rule engine plugins. Test with different engines, facts, invalid rules. Plugin logic tested separately."
    security_considerations: "Trust rule sources. Plugins validate rules and declare capabilities. Use Core Secrets for sensitive engineConfig."

  # 3.2 Reliability & Error Handling
  - type: Reliability.RetryWrapper
    purpose: "Retries execution of a downstream component/sub-flow on error. Requires explicit wiring."
    config:
      maxRetries: { type: NonNegativeInteger, required: true, description: "Max retry attempts after initial failure." }
      delayMs: { type: NonNegativeInteger, required: true, description: "Base delay before first retry." }
      backoffMultiplier: { type: NonNegativeNumber, default: 1.0, description: "Multiplier for exponential backoff (>= 1.0)." }
      retryableErrorTypes: { type: "list<ErrorTypeString>", description: "List of error 'type' strings that trigger retry. All if omitted." }
      name: { type: IdentifierString, description: "Descriptive name for observability/state key." }
    inputs: # Explicit wiring required
      trigger: { type: any, required: true, description: "Data for first attempt. Stored in state." }
      wrappedOutput: { type: any, description: "MUST connect from wrapped component's success output." }
      wrappedError: { type: object, description: "MUST connect from wrapped component's error output. Schema: StandardErrorStructure." }
    outputs:
      attemptData: { type: any, description: "Emits trigger data for each attempt. MUST wire to wrapped component input." }
      result: { type: any, description: "Successful output from wrapped component after retries." }
      error:
        is_error_path: true
        description: "Final error if retries fail or error not retryable. Includes retry details."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" } # details augmented
        error_types: ["RetryWrapper.MaxRetriesExceeded", "RetryWrapper.NonRetryableError"]
    required_runtime_apis: ["get_state()", "set_state()", "set_timer()", "log()"]
    testing_considerations: "Mock downstream. Verify retries, delays, backoff, retryableErrorTypes, attemptData, state."

  - type: Reliability.CircuitBreaker
    purpose: "Protects downstream from repeated failures by opening the circuit. Requires explicit wiring."
    behavior: "State machine: CLOSED <-> OPEN -> HALF_OPEN -> CLOSED/OPEN. Trips on failureThreshold. Resets on success or resetTimeoutMs."
    config:
      name: { type: IdentifierString, required: true, description: "Unique identifier for circuit state persistence." }
      failureThreshold: { type: PositiveInteger, required: true, description: "Consecutive failures to trip to OPEN." }
      resetTimeoutMs: { type: PositiveInteger, required: true, description: "Duration OPEN before HALF_OPEN." }
      rollingWindowSeconds: { type: PositiveInteger, description: "(Future) Window for rate-based tripping."}
      minimumRequests: { type: PositiveInteger, default: 1, description: "(Future) Min requests for rate-based tripping."}
    inputs: # Explicit wiring required
      request: { type: any, required: true, description: "Data for the request." }
      successSignal: { type: any, description: "MUST connect from wrapped component's success output." }
      failureSignal: { type: object, description: "MUST connect from wrapped component's error output. Schema: StandardErrorStructure." }
    outputs:
      allowed_request: { type: any, description: "Emits input 'request' if circuit Closed or Half-Open. MUST wire to wrapped component." }
      rejected_error:
        is_error_path: true
        description: "Emits error if circuit is OPEN."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["CircuitBreaker.OpenCircuitError"]
    required_runtime_apis: ["get_state()", "set_state()", "set_timer()", "clear_timer()", "log()"]
    state_machine: "CLOSED (allows requests, counts failures) -> OPEN (rejects, waits resetTimeoutMs) -> HALF_OPEN (allows one test request) -> CLOSED/OPEN."
    testing_considerations: "Mock Core state/timers. Simulate requests/signals. Verify state transitions, failure counts, timeouts, outputs."

  - type: Reliability.IdempotentReceiver
    purpose: "Ensures input data processed only once within a scope/TTL based on extracted ID."
    config:
      idExpression: { type: ExpressionString, required: true, description: "Expression to extract unique ID string (sandboxed)." }
      language: { type: string, enum: ["JMESPath", "JsonPointer"], default: "JMESPath" }
      scope: { type: string, enum: ["global", "flow", "tenant"], default: "global", description: "Uniqueness scope. 'tenant' requires Core tenant context." }
      ttlSeconds: { type: PositiveInteger, description: "TTL for ID state. Default: infinite. Requires Core state TTL." }
    inputs:
      data: { type: any, required: true, description: "Input data packet." }
    outputs:
      processed: { type: any, description: "Emits 'data' if ID is new or expired." }
      duplicate:
        is_error_path: true # Logical condition, not system error by default.
        type: any
        description: "Emits 'data' if ID seen recently (within TTL)."
        error_types: ["IdempotentReceiver.Duplicate"] # This is a conceptual error type for branching
      error:
        is_error_path: true
        description: "Error on expression failure or state issue."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["IdempotentReceiver.ExpressionError", "IdempotentReceiver.StateError"]
    required_runtime_apis: ["sandbox_execute_expression()", "get_state(key)", "set_state(key, value, ttlSeconds)", "get_tenant_context()"]
    testing_considerations: "Mock Core state. Verify routing (ID uniqueness, scope, TTL). Test invalid idExpression."

  - type: Reliability.DlqPublisher
    purpose: "Routes input data to a DLQ by invoking another publisher component (typically ExternalServiceAdapter with plugin)."
    config:
      publisherComponent: { type: StepIdString, required: true, description: "step_id of downstream publisher component (e.g., Integration.ExternalServiceAdapter)." }
      publisherDataInput: { type: InputPortNameString, default: "requestData", description: "Input port name on publisherComponent for DLQ message." }
    inputs:
      data: { type: any, required: true, description: "Data payload for DLQ (original message + error details)." }
      publisherSuccess: { type: any, description: "MUST connect from publisherComponent's success output." }
      publisherError: { type: object, description: "MUST connect from publisherComponent's error output. Schema: StandardErrorStructure." }
    outputs:
      success: { type: any, description: "Emitted if underlying publisher succeeds. Echoes publisherSuccess." }
      error:
        is_error_path: true
        description: "Emitted if underlying publisher fails. Echoes publisherError."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" } # Error from underlying publisher
        error_types: ["DlqPublisher.PublishError"] # Wrapper error type
    required_runtime_apis: ["Core Runtime step-to-step communication and result routing."]
    testing_considerations: "Unit: Mock publisherComponent. Verify data routing, success/error echoing. Integration: Requires DLQ sink and configured publisher (adapter). Test actual publication and underlying publisher success/failure."

  # 3.3 Integration Components
  - type: StdLib:HttpCall
    purpose: "Makes an outgoing HTTP request."
    config:
      url: { type: ["URLString", "ExpressionString"], required: true, description: "Target URL (sandboxed if expression)." }
      method: { type: string, enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"], default: "GET" }
      headers: { type: ["object", "ExpressionString"], description: "Request headers. Values support {{secrets.my_secret}}. Sandboxed if expression." }
      bodyExpression: { type: ExpressionString, description: "Expression for request body (sandboxed). If omitted, input 'data' used." }
      bodyLanguage: { type: string, enum: ["JMESPath", "JsonPointer"], default: "JMESPath" }
      contentType: { type: ContentTypeString, default: "application/json", description: "Content-Type header for request body." }
      queryParameters: { type: ["object", "ExpressionString"], description: "URL query parameters. Sandboxed if expression." }
      timeoutMs: { type: PositiveInteger, default: 5000, description: "Request timeout in ms." }
      followRedirects: { type: boolean, default: false, description: "Whether to follow HTTP 3xx redirects." }
    inputs:
      data: { type: any, description: "Context for expressions and default request body." }
    outputs:
      response:
        description: "HTTP response details (status < 400)."
        schema: { $ref: "#/definitions/schemas/HttpResponse" }
      error:
        is_error_path: true
        description: "Error on network/timeout/expression failure, or response status >= 400. Includes response in details."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" } # details includes HttpResponse
        error_types: ["HttpCall.NetworkError", "HttpCall.TimeoutError", "HttpCall.BadResponseStatus", "HttpCall.ExpressionError"]
    required_runtime_apis: ["get_secret()", "sandbox_execute_expression()", "network_http_request(...)", "log()"]
    testing_considerations: "Unit: Mock HTTP client. Verify request, response/error mapping, timeout. Integration: Use mock HTTP server. Verify calls, error handling."
    security_considerations: "Use Core Secrets. Validate URL (SSRF - Core allowlists). Validate input 'data'. Restrict hosts. Sandbox expressions."

  - type: Integration.ExternalServiceAdapter
    new_in_version: "3.2"
    purpose: "Generic interface to diverse external systems (APIs, DBs, etc.) via pluggable adapters."
    config:
      adapterType: { type: PluginIdentifierString, required: true, description: "Adapter plugin identifier (e.g., KafkaAdapter, PostgresSqlAdapter)." }
      adapterConfig: { type: object, required: true, description: "Plugin-specific config. Structure per plugin schema. Use Core Secrets." }
      operation: { type: OperationNameString, required: true, description: "Logical action defined by plugin (e.g., GetUser, Publish, Query)." }
    inputs:
      requestData: { type: any, required: true, description: "Data payload for the operation, per plugin definition." }
    outputs:
      responseData: { type: any, description: "Parsed/structured data from external service via plugin, per operation." }
      error:
        is_error_path: true
        description: "Error from interaction (network, protocol, business, config). Mapped by plugin to StandardErrorStructure."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["AdapterError.PluginError", "AdapterError.ServiceError.NotFound", "AdapterError.ConfigError"] # Examples, defined by plugin
    required_runtime_apis: ["component_loader_load(adapterType)", "get_secret()", "Plugin uses its allowed Runtime API subset (e.g., network, log, state, timers, filesystem)."]
    testing_considerations: "Unit: Test component (mock plugin). Integration: Requires adapter plugins & external service/mock. Test interactions. Plugin logic tested separately."
    security_considerations: "Use Core Secrets in adapterConfig. Plugins declare capabilities. Restrict network. Validate inputs in plugin. Map errors securely. Constrain file paths."
    note_v4_32_plus: "Primary way for external system interactions (Kafka, SQS, gRPC, SFTP, DBs, APIs), replacing deprecated specific components."

  - type: Integration.StreamIngestor
    new_in_version: "3.2"
    purpose: "Consumes messages from a continuous data stream source (Kafka, SQS, etc.) via a pluggable adapter. Primarily for Triggers."
    config:
      sourceType: { type: PluginIdentifierString, required: true, description: "Stream source adapter plugin identifier (e.g., KafkaConsumer, SqsConsumer)." }
      sourceConfig: { type: object, required: true, description: "Plugin-specific config. Structure per plugin schema. Use Core Secrets." }
      outputFormat: { type: string, enum: ["Raw", "JsonParsed", "AvroDecoded"], default: "JsonParsed", description: "Hint for output processing." }
      ackMode: { type: string, enum: ["AutoOnSuccess", "Manual", "None"], default: "AutoOnSuccess", description: "Message acknowledgement behavior." }
    inputs: {} # Control inputs if used mid-flow
    outputs: # As Trigger Output or Component Output
      message: { type: any, description: "Consumed message payload, processed by outputFormat." }
      metadata: { type: object, description: "Source-specific metadata (e.g., Kafka offset, SQS receiptHandle). Structure per plugin. For Manual ack." }
      error: # Reported via Core Trigger monitoring or component error output
        is_error_path: true
        description: "Error during connection/consumption/processing. Mapped by plugin."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["StreamIngestorError.PluginError", "StreamIngestorError.ConnectionError", "StreamIngestorError.DeserializationError"] # Examples
    required_runtime_apis: ["component_loader_load(sourceType)", "get_secret()", "trigger_flow() (if trigger)", "get_state() / set_state() (plugin might use)", "Plugin uses allowed Runtime API subset. Core/Plugin handles ack."]
    testing_considerations: "Unit: Test component (mock plugin). Integration: Requires ingestor plugins & stream source/mock. Test connection, reception, outputFormat, ackMode. Test with AckMessage. Plugin logic tested separately."
    security_considerations: "Use Core Secrets. Plugins declare capabilities. Restrict network. Validate payloads in plugin. Correct error/ack logic."
    note_v4_32_plus: "Primary way for consuming from streams (Kafka, SQS, Kinesis), replacing deprecated specific components."

  - type: Integration.AckMessage
    new_in_version: "3.2 Concept"
    purpose: "Explicitly ACKs/NACKs a message from StreamIngestor with ackMode: Manual."
    config: null
    inputs:
      ackInfo: { type: object, required: true, description: "Metadata from StreamIngestor's 'metadata' port." }
      ackDecision: { type: string, enum: ["ACK", "NACK"], required: true, description: "Acknowledge or negatively acknowledge." }
    outputs:
      success:
        description: "True if ACK/NACK successfully communicated to source via originating plugin."
        schema: { type: boolean, const: true }
      error:
        is_error_path: true
        description: "Error if ACK/NACK operation fails (invalid ackInfo, communication error, expired handle)."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["AckMessage.OperationError", "AckMessage.InvalidAckInfo", "AckMessage.PluginError"] # Examples
    required_runtime_apis: ["correlate_and_call_plugin_method(ackInfo, 'performAck', ackDecision)", "log()"]
    testing_considerations: "Integration: Test with StreamIngestor (ackMode: Manual). Verify ackInfo, ACK/NACK decisions, effect on source system. Test errors."
    security_considerations: "Prevent ackInfo tampering. Secure Core correlation mechanism."

  # 3.4 Data Handling & Transformation
  - type: StdLib:JsonSchemaValidator
    purpose: "Validates input data against a JSON Schema definition."
    config:
      schema: { type: JsonSchemaObject, required: true, description: "JSON Schema object for validation (inline or $ref if Core supports)." }
    inputs:
      data: { type: any, required: true, description: "Input data to validate." }
    outputs:
      validData: { type: any, description: "Original input 'data' if conforms to schema." }
      error:
        is_error_path: true
        description: "Validation failed. 'details' contains array of validation errors. Also schema load/parse errors."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" } # details is array of validation errors
        error_types: ["JsonSchemaValidator.ValidationError", "JsonSchemaValidator.SchemaError"]
    required_runtime_apis: ["json_schema_validate(schema, data)"]
    testing_considerations: "Verify validation results for valid/invalid data against different schemas. Test schema parsing errors. Check 'details'."
    security_considerations: "Robust validation library. Overly complex schemas could be perf issue (ReDoS-like)."

  - type: StdLib:DataSerializer
    purpose: "Converts in-memory data structure to serialized byte representation."
    config:
      format: { type: string, enum: ["json", "protobuf", "avro", "xml", "yaml"], required: true, description: "Target serialization format." }
      schemaRef: { type: ResourceIdentifierString, description: "Schema reference (e.g., .proto, .avsc) for Protobuf/Avro." }
      contentType: { type: ContentTypeString, description: "Suggested Content-Type for resulting bytes." }
    inputs:
      data: { type: any, required: true, description: "In-memory data structure to serialize." }
    outputs:
      bytes: { type: bytes, description: "Serialized data as raw bytes." }
      contentType: { type: string, description: "Determined contentType." }
      error:
        is_error_path: true
        description: "Error during serialization (incompatible data, schema load failure)."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["DataSerializer.SerializationError", "DataSerializer.SchemaLoadError", "DataSerializer.UnsupportedFormat"]
    required_runtime_apis: ["resource_loader_read(schemaRef)", "data_serializer_serialize(format, schemaContent, data)", "log()"]
    testing_considerations: "Verify serialization for different formats, valid inputs. Test schema validation. Test errors. Verify contentType."

  - type: StdLib:DataDeserializer
    purpose: "Converts serialized byte representation to in-memory data structure."
    config:
      format: { type: string, enum: ["json", "protobuf", "avro", "xml", "yaml"], required: true, description: "Source byte format." }
      schemaRef: { type: ResourceIdentifierString, description: "Schema reference (e.g., .proto, .avsc) for Protobuf/Avro." }
    inputs:
      bytes: { type: bytes, required: true, description: "Byte data to deserialize." }
      contentType: { type: ContentTypeString, description: "Content-Type hint. May influence format detection." }
    outputs:
      data: { type: any, description: "Deserialized data structure." }
      error:
        is_error_path: true
        description: "Error during deserialization (malformed bytes, incompatible schema, schema load)."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["DataDeserializer.DeserializationError", "DataDeserializer.SchemaLoadError", "DataDeserializer.UnsupportedFormat"]
    required_runtime_apis: ["resource_loader_read(schemaRef)", "data_deserializer_deserialize(format, schemaContent, bytes, contentTypeHint)", "log()"]
    testing_considerations: "Verify deserialization for formats, valid inputs. Test schema validation. Test errors. Test contentType hint."

  - type: Data:Transform
    purpose: "Generic data transformation using inline code (JS, Python) or templating, sandboxed."
    config:
      language: { type: string, enum: ["javascript", "python", "template"], required: true, description: "Transformation language/type." }
      code: { type: CodeString, description: "Inline code snippet (JS/Python). Sandboxed. Required if language is js/py." }
      template: { type: TemplateString, description: "Inline template content. Required if language is template." }
      templateEngine: { type: string, enum: ["Handlebars", "Liquid", "Jinja2"], description: "Template engine. Required if language is template." }
    inputs:
      data: { type: any, required: true, description: "Input data for code/template context." }
    outputs:
      result: { type: any, description: "Result from transformation code or template rendering." }
      error:
        is_error_path: true
        description: "Error during code/template execution (syntax, runtime, engine)."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["Data.Transform.CodeError", "Data.Transform.TemplateError", "Data.Transform.SandboxError"]
    required_runtime_apis: ["sandbox_execute_code(language, code, dataContext)", "template_render(engine, template, dataContext)", "log()"]
    testing_considerations: "Verify execution of simple code/templates. Test input access, output. Test invalid code/templates, runtime errors."
    security_considerations: "Critical: robust Core sandboxing for 'code'. Secure template engines. Validate input 'data'."

  # 3.5 State Management & Long-Running Processes
  - type: StdLib:WaitForDuration
    purpose: "Pauses flow execution for a specified duration."
    config:
      durationMs: { type: ["PositiveInteger", "ExpressionString"], required: true, description: "Wait duration in ms (sandboxed if expression)." }
      durationLanguage: { type: string, enum: ["JMESPath", "JsonPointer"], default: "JMESPath" }
    inputs:
      data: { type: any, description: "Input data preserved during wait, emitted on completion. Context for durationMs expression." }
    outputs:
      data: { type: any, description: "Original input 'data' emitted after duration." }
      error:
        is_error_path: true
        description: "Error evaluating durationMs or internal timer/state error."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["WaitForDuration.ExpressionError", "WaitForDuration.StateError"]
    required_runtime_apis: ["sandbox_execute_expression()", "set_timer(durationMs, stateToPreserve)", "set_state() / get_state() (implicit by Core)"]
    testing_considerations: "Integration: Requires Core state/timers. Verify suspend/resume, duration, data preservation. Test expressions, errors."

  - type: StdLib:WaitForTimestamp
    purpose: "Pauses flow execution until a specific future timestamp."
    config:
      timestampExpression: { type: ["ExpressionString", "ISO8601Timestamp", "PositiveInteger"], required: true, description: "Absolute future timestamp (ISO8601, epoch ms, or sandboxed expression yielding one)." }
      language: { type: string, enum: ["JMESPath", "JsonPointer"], default: "JMESPath" }
    inputs:
      data: { type: any, required: true, description: "Input data preserved during wait, emitted on completion. Context for timestampExpression." }
    outputs:
      data: { type: any, description: "Original input 'data' emitted after timestamp." }
      error:
        is_error_path: true
        description: "Error if timestampExpression fails, invalid format, past time, or internal timer/state error."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["WaitForTimestamp.ExpressionError", "WaitForTimestamp.InvalidTimestamp", "WaitForTimestamp.StateError"]
    required_runtime_apis: ["sandbox_execute_expression()", "parse_timestamp()", "set_timer_at(absoluteTimestamp, stateToPreserve)", "set_state() / get_state() (implicit by Core)"]
    testing_considerations: "Integration: Requires Core state/timers. Verify suspend/resume accuracy, timestamp formats, expressions. Test errors, data preservation."

  - type: StdLib:WaitForExternalEvent
    purpose: "Pauses flow, waiting for an external event via Core event correlation."
    config:
      correlationIdExpression: { type: ExpressionString, required: true, description: "Expression for unique correlation ID string (sandboxed)." }
      language: { type: string, enum: ["JMESPath", "JsonPointer"], default: "JMESPath" }
      timeoutMs: { type: PositiveInteger, description: "Max wait time in ms. Error on timeout. Default: infinite." }
      eventType: { type: EventTypeString, description: "Optional: Filter events by type, addition to correlationId." }
    inputs:
      data: { type: any, required: true, description: "Input data preserved during wait. Context for correlationIdExpression." }
    outputs:
      eventData: { type: any, description: "Payload from matching external event." }
      preservedData: { type: any, description: "Original input 'data' preserved during wait." }
      error:
        is_error_path: true
        description: "Error if correlationIdExpression fails, timeout, or internal state/subscription error."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["WaitForExternalEvent.ExpressionError", "WaitForExternalEvent.Timeout", "WaitForExternalEvent.StateError", "WaitForExternalEvent.SubscriptionError"]
    required_runtime_apis: ["sandbox_execute_expression()", "event_subscribe(correlationId, eventType)", "set_timer()", "clear_timer()", "set_state() / get_state()", "Core event bus/correlation mechanism."]
    testing_considerations: "Integration: Requires Core state, timers, event correlation. Simulate event arrival, verify resumption, data. Test timeout, invalid expression."
    security_considerations: "Ensure correlationId uniqueness/unguessability. Core validates external event source if possible."

  - type: StdLib:SagaCoordinator
    refined_in_version: "4.2"
    purpose: "Orchestrates Sagas defined natively in config with forward/compensation steps. Manages state, triggers compensation."
    config:
      compensationMethod: { type: string, enum: ["BackwardRecovery", "ForwardRecovery"], default: "BackwardRecovery" }
      steps:
        type: "list<SagaStepDefinition>"
        required: true
        description: "Ordered sequence of Saga steps."
        schema: # SagaStepDefinition (conceptual)
          type: array
          items:
            type: object
            properties:
              stepName: { type: IdentifierString, required: true }
              forward: # ComponentInvocationDefinition
                type: object
                required: true
                properties:
                  component_ref: { type: ComponentRefString, required: true }
                  inputs_map: { type: object, description: "Map saga.startData/saga.context to component inputs." }
                  outputs_map: { type: object, description: "Map component success output to saga.context." }
              compensation: # ComponentInvocationDefinition
                type: object
                properties:
                  component_ref: { type: ComponentRefString, required: true } # Required for BackwardRecovery
                  inputs_map: { type: object, description: "Map saga.startData/saga.context/saga.error to component inputs." }
                  outputs_map: { type: object, description: "Map component success output to saga.context (less common)." }
    inputs:
      startSaga: { type: object, required: true, description: "Input data to initiate Saga. Accessible via saga.startData." }
    outputs: # SagaResultObject schema common fields: status, sagaName?, instanceId?, startData, finalContext, failedStep?, failureError?, compensationDetails?
      sagaCompleted: { type: SagaResultObject, description: "All forward steps succeeded. status: COMPLETED." }
      sagaCompensated: { type: SagaResultObject, description: "Forward step failed, compensations succeeded. status: COMPENSATED." }
      sagaFailed:
        is_error_path: true
        description: "Forward step failed AND compensation failed (unrecoverable). status: FAILED."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" } # Extended with SagaResultObject fields
        error_types: ["SagaCoordinator.CompensationFailed", "SagaCoordinator.DefinitionError", "SagaCoordinator.InternalError"]
    required_runtime_apis: ["get_state()", "set_state()", "execute_component(component_ref, inputs)", "log()"]
    testing_considerations: "Integration: Mock/implement forward/compensation components. Test success, compensated, failed scenarios. Context propagation."
    use_case: "Natively defined Sagas within Cascade flow. Self-contained."

  - type: StdLib:ExternalWorkflowCoordinator
    new_in_version: "4.2"
    purpose: "Interacts (initiates, monitors, signals) with externally defined/executed workflows/Sagas (AWS StepFunctions, Temporal) via plugins."
    config:
      engineType: { type: PluginIdentifierString, required: true, description: "External engine adapter plugin ID (e.g., AWS_StepFunctions, Temporal)." }
      engineConfig: { type: object, required: true, description: "Plugin-specific config. Structure per plugin schema. Use Core Secrets." }
      operation: { type: OperationNameString, required: true, description: "Action for plugin (e.g., StartExecution, SignalWorkflow)." }
      definitionIdentifier: { type: ["ResourceIdentifierString", "ExpressionString"], required_for_start_ops: true, description: "External workflow definition ID (e.g., ARN, Workflow Type). Sandboxed if expression." }
      executionParameters: { type: ["object", "ExpressionString"], description: "Input payload for external workflow. Sandboxed if expression." }
      waitForCompletion: { type: boolean, default: false, description: "Block flow until external workflow completes? Requires plugin support." }
      timeoutMs: { type: PositiveInteger, description: "Timeout if waitForCompletion is true." }
      parametersLanguage: { type: string, enum: ["JMESPath", "JsonPointer"], default: "JMESPath" }
    inputs:
      triggerData: { type: object, description: "Context for config expressions." }
    outputs:
      executionReference: { type: object, description: "Info identifying external execution (e.g., { executionArn: ... }). Schema per plugin." }
      result: { type: any, description: "Final result from external workflow (if waitForCompletion=true & success). Structure per plugin." }
      error:
        is_error_path: true
        description: "Error interacting with external engine (API fail, auth, timeout, external fail). Mapped by plugin."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["ExternalWorkflowCoordinator.PluginError", "ExternalWorkflowCoordinator.EngineError.NotFound", "ExternalWorkflowCoordinator.Timeout", "ExternalWorkflowCoordinator.ExecutionFailed", "ExternalWorkflowCoordinator.ConfigError", "ExternalWorkflowCoordinator.ExpressionError"] # Examples
    required_runtime_apis: ["component_loader_load(engineType)", "get_secret()", "sandbox_execute_expression()", "Plugin uses allowed API subset (network, timers, state, log)."]
    testing_considerations: "Unit: Mock plugin. Integration: Requires plugin & external engine/mock. Test operations, waitForCompletion, params, results, errors."
    use_case: "Integrate Cascade with external workflow systems (StepFunctions, Temporal, etc.)."

  - type: StdLib:SubFlowInvoker
    purpose: "Starts a new instance of another Flow definition. Optionally waits for completion."
    config:
      flowName: { type: ["FlowNameString", "ExpressionString"], required: true, description: "Target Flow definition name. Sandboxed if expression." }
      waitForCompletion: { type: boolean, default: false, description: "Pause and wait for sub-flow completion? Requires Core event correlation." }
      timeoutMs: { type: PositiveInteger, description: "Max wait time if waitForCompletion=true. Error on timeout." }
      parametersLanguage: { type: string, enum: ["JMESPath", "JsonPointer"], default: "JMESPath" }
    inputs:
      initialData: { type: any, required: true, description: "Initial trigger data for sub-flow." }
      contextData: { type: any, description: "Context for flowName expression evaluation." }
    outputs:
      subFlowInstanceId: { type: string, description: "Unique instance ID of started sub-flow. Emitted immediately." }
      result: { type: any, description: "Final output from sub-flow's success (if waitForCompletion=true & success)." }
      error:
        is_error_path: true
        description: "Error starting sub-flow, or sub-flow failed/timed out (if waitForCompletion=true)."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["SubFlowInvoker.FlowStartError", "SubFlowInvoker.FlowFailed", "SubFlowInvoker.Timeout", "SubFlowInvoker.ExpressionError", "SubFlowInvoker.CorrelationError"]
    required_runtime_apis: ["sandbox_execute_expression()", "flow_start(flowName, initialData)", "event_subscribe(correlationId) (if waiting)", "set_timer() (if waiting)", "clear_timer()", "set_state() / get_state() (if waiting)", "log()"]
    testing_considerations: "Integration: Requires Core flow invocation. Test simple invoke, waitForCompletion (success, fail, timeout)."

  - type: StdLib:ProcessVariableManager
    purpose: "Sets/gets variables within the current flow instance's persistent state scope."
    config:
      operation: { type: string, enum: ["SET", "GET"], required: true }
      variableName: { type: VariableNameString, required: true, description: "Name of the process variable." }
      valueExpression: { type: ExpressionString, required_if_set: true, description: "Expression for value to set (sandboxed)." }
      language: { type: string, enum: ["JMESPath", "JsonPointer"], default: "JMESPath" }
    inputs:
      data: { type: any, required: true, description: "Context for valueExpression (SET) or pass-through (GET)." }
    outputs:
      value: { type: any, description: "Retrieved value if operation is GET. Absent if not found (error)." }
      success: { type: boolean, description: "True if operation is SET and variable set successfully." }
      error:
        is_error_path: true
        description: "Error evaluating valueExpression, state error, or variable not found (GET)."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["ProcessVariableManager.ExpressionError", "ProcessVariableManager.StateError", "ProcessVariableManager.VariableNotFound"]
    required_runtime_apis: ["sandbox_execute_expression()", "get_flow_variable(variableName)", "set_flow_variable(variableName, value)", "log()"]
    testing_considerations: "Integration: Requires Core flow-scoped state. Test SET then GET (across resume). Test GET non-existent. Test expression."

  # 3.6 Stateful Patterns (Actor Model Primitives)
  - type: StdLib:ActorShell
    purpose: "Represents a stateful entity (Actor). Manages state, processes messages via logic component, ensures sequential processing per actor ID."
    config:
      actorLogicComponent: { type: ComponentRefString, required: true, description: "Ref to Cascade component for actor's message handling logic." }
      stateScope: { type: string, enum: ["FlowInstance", "GlobalById"], required: true, description: "State management scope." }
      initialState: { type: object, description: "Default state if none exists." }
      stateTTLSeconds: { type: PositiveInteger, description: "TTL for actor state. Default: infinite." }
    inputs:
      message: { type: any, required: true, description: "Message payload for this actor." }
      actorId: { type: ActorIdString, required_if_global_scope: true, description: "Unique ID for actor if stateScope is GlobalById." }
    outputs:
      reply: { type: any, description: "Data from success output of actorLogicComponent." }
      stateUpdated: { type: boolean, description: "True if actor state successfully updated." }
      error:
        is_error_path: true
        description: "Error in state load/save, or actorLogicComponent failed."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["ActorShell.StateError", "ActorShell.LogicComponentError", "ActorShell.ConfigError"]
    required_runtime_apis: ["get_state(key)", "set_state(key, value, ttlSeconds)", "execute_component(actorLogicComponent, inputs)", "Core serialized execution per actorId (if GlobalById).", "log()"]
    testing_considerations: "Integration: Requires Core state (locking/serialization). Mock/implement actorLogicComponent. Test messages, state load/update, scope, TTL, errors, sequential processing."
    security_considerations: "If GlobalById, ensure actorId unguessable. Trust actorLogicComponent or sandbox it. Secure Core state."

  - type: StdLib:ActorRouter
    revised_in_version: "4.3"
    purpose: "Extracts actor ID, uses Core API (send_to_actor) to dispatch message to actor instance (e.g., ActorShell). No direct wiring."
    config:
      actorIdExpression: { type: ExpressionString, required: true, description: "Expression to extract target actor ID (sandboxed)." }
      language: { type: string, enum: ["JMESPath", "JsonPointer"], default: "JMESPath" }
      targetActorType: { type: ComponentTypeString, default: "StdLib:ActorShell", description: "Expected type of target actor component." }
      deliveryMode: { type: string, enum: ["FireAndForget", "RequestReply"], default: "FireAndForget" }
      requestReplyTimeoutMs: { type: PositiveInteger, description: "Timeout if deliveryMode is RequestReply." }
    inputs:
      message: { type: any, required: true, description: "Incoming message with actor ID and data for actor." }
    outputs:
      deliveryStatus: { type: object, description: "On successful send_to_actor call (for FireAndForget). May include { actorId: ... }." }
      reply: { type: any, description: "Reply from target actor (if RequestReply & success)." }
      error:
        is_error_path: true
        description: "Error in ID extraction, send_to_actor API call, or Request-Reply (timeout, actor error)."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["ActorRouter.ExpressionError", "ActorRouter.RoutingError", "ActorRouter.RequestReplyTimeout", "ActorRouter.ActorErrorResponse"]
    required_runtime_apis: ["sandbox_execute_expression()", "send_to_actor(actorId, messagePayload, deliveryMode, targetActorType)", "event_subscribe() / set_timer() / clear_timer() (if RequestReply)", "log()"]
    testing_considerations: "Unit: Verify ID extraction. Mock send_to_actor API. Integration: Requires Core actor routing & target actors. Verify message delivery. Test FireAndForget, RequestReply (replies, timeouts, actor errors)."
    security_considerations: "Message integrity. Validate actorIdExpression. Core routing layer permissions. Sandbox expression."

  # 3.7 Reactive Stream Processing
  - type: StdLib:SplitList
    purpose: "Takes an input array, emits each element as a separate output sequentially. Emits completion signal after last."
    config:
      listExpression: { type: ExpressionString, default: "@", description: "JMESPath expression for array from input 'data' (sandboxed). Default is input 'data' itself." }
      language: { type: string, enum: ["JMESPath"], default: "JMESPath" }
      itemOutputName: { type: OutputPortNameString, default: "item", description: "Output port name for individual elements." }
      completionOutputName: { type: OutputPortNameString, default: "processingComplete", description: "Output port name for completion signal." }
    inputs:
      data: { type: any, required: true, description: "Input data containing list (or the list itself)." }
    outputs:
      # itemOutputName: { type: any, description: "Each element of the list." } # Name by config.itemOutputName
      # completionOutputName: # Name by config.completionOutputName
      #   type: object
      #   description: "Signal object after last item."
      #   schema: { type: object, properties: { complete: {type: boolean, const: true}, itemCount: {type: integer}}, required: [complete, itemCount]}
      error:
        is_error_path: true
        description: "Error if listExpression fails or resolved value not an array."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["SplitList.ExpressionError", "SplitList.InvalidInput"]
    required_runtime_apis: ["sandbox_execute_expression()", "Core Runtime sequential multi-output emission support."]
    testing_considerations: "Verify item emission, completion signal (itemCount). Test listExpression. Test non-array inputs."

  - type: StdLib:AggregateItems
    purpose: "Collects items into a list, emits on completion condition (count, signal, timeout, size)."
    config:
      itemInputName: { type: InputPortNameString, default: "item", description: "Input port for individual items." }
      completionInputName: { type: InputPortNameString, description: "Input port for explicit completion signal." }
      expectedCount: { type: PositiveInteger, description: "Emit when this many items received." }
      timeoutMs: { type: PositiveInteger, description: "Emit after this period of inactivity." }
      maxSize: { type: PositiveInteger, description: "Emit when buffer reaches this size." }
      completionMode: { type: string, enum: ["Any", "All"], default: "Any", description: "Emit on any/all conditions met." }
      aggregateOutputName: { type: OutputPortNameString, default: "aggregatedList", description: "Output port for aggregated list." }
    inputs:
      # itemInputName: { type: any } # Name by config.itemInputName
      # completionInputName: { type: any } # Name by config.completionInputName, optional
    outputs:
      # aggregateOutputName: { type: array, description: "List of collected items." } # Name by config.aggregateOutputName
      error:
        is_error_path: true
        description: "Error (e.g., initial timeout, state issue, config conflict)."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["AggregateItems.TimeoutError", "AggregateItems.StateError", "AggregateItems.ConfigError"]
    required_runtime_apis: ["get_state()", "set_state()", "set_timer()", "clear_timer()", "Core Runtime multi-port input handling."]
    testing_considerations: "Integration: Requires Core state/timers. Test aggregation by signal, count, timeout, size. Test completionMode. Verify buffer state."

  - type: StdLib:MergeStreams
    purpose: "Forwards data from any configured input port to a single output. No order guarantee."
    config:
      inputNames: { type: "list<InputPortNameString>", required: true, description: "List of input port names to merge." }
      mergedOutputName: { type: OutputPortNameString, default: "mergedOutput", description: "Single output port name." }
    inputs: # Dynamically defined input ports matching inputNames.
      # ExampleInput1: { type: any }
    outputs:
      # mergedOutputName: { type: any, description: "Data packet from one of the inputs." } # Name by config.mergedOutputName
    required_runtime_apis: []
    testing_considerations: "Simulate inputs on different ports. Verify each emitted once on mergedOutputName."

  - type: StdLib:ZipStreams
    purpose: "Combines packets from multiple input streams pairwise. Waits for one on each, emits combined object."
    config:
      inputNames: { type: "list<InputPortNameString>", required: true, description: "Ordered list of input port names to zip." }
      zippedOutputName: { type: OutputPortNameString, default: "zippedOutput", description: "Output port for combined object." }
      timeoutMs: { type: PositiveInteger, description: "Max time to wait for all inputs in a cycle. Error on timeout." }
    inputs: # Dynamically defined input ports matching inputNames.
    outputs:
      # zippedOutputName: # Name by config.zippedOutputName
      #   type: object
      #   description: "Object with keys=inputNames, values=data packets for completed cycle."
      #   schema: { type: object, properties: { /* inputNames as keys */ }, required: [/* all inputNames */] }
      error:
        is_error_path: true
        description: "Error if timeout for cycle or internal state error."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["ZipStreams.TimeoutError", "ZipStreams.StateError"]
    required_runtime_apis: ["get_state()", "set_state()", "set_timer()", "clear_timer()"]
    testing_considerations: "Integration: Requires Core state/timers. Simulate inputs, verify zipped output. Test out-of-order, duplicates, timeout."

  - type: StdLib:DebounceInput
    purpose: "Emits only the last item received after a specified period of inactivity."
    config:
      debounceMs: { type: NonNegativeInteger, required: true, description: "Inactivity period in ms before emitting." }
      emitOnFirst: { type: boolean, default: false, description: "Emit first item immediately, then debounce." }
      debouncedOutputName: { type: OutputPortNameString, default: "debouncedData" }
    inputs:
      data: { type: any, required: true, description: "Input stream of data packets." }
    outputs:
      # debouncedOutputName: { type: any, description: "Data packet after debounce (or first if emitOnFirst)." } # Name by config.debouncedOutputName
      error:
        is_error_path: true
        description: "Internal state or timer error."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["DebounceInput.StateError"]
    required_runtime_apis: ["set_timer()", "clear_timer()", "set_state() / get_state()"]
    testing_considerations: "Integration: Requires Core state/timers. Simulate rapid bursts, verify last emitted after debounceMs. Test emitOnFirst. Test single inputs."

  - type: StdLib:BufferInput
    purpose: "Collects items, emits list when size or time threshold reached."
    config:
      maxSize: { type: PositiveInteger, description: "Emit when buffer contains this many items." }
      maxWaitMs: { type: PositiveInteger, description: "Emit this ms after first item added, if maxSize not reached." }
      bufferOutputName: { type: OutputPortNameString, default: "bufferedList" }
      note: "At least one of maxSize or maxWaitMs must be configured."
    inputs:
      data: { type: any, required: true, description: "Input stream to buffer." }
    outputs:
      # bufferOutputName: { type: array, description: "List of buffered data packets." } # Name by config.bufferOutputName
      error:
        is_error_path: true
        description: "Internal state or timer error."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["BufferInput.StateError"]
    required_runtime_apis: ["get_state()", "set_state()", "set_timer()", "clear_timer()"]
    testing_considerations: "Integration: Requires Core state/timers. Test maxSize trigger, maxWaitMs trigger. Test with both. Verify buffer clear. Test empty buffer."

  - type: StdLib:ThrottleInput
    purpose: "Limits rate of data forwarding using shaping (delaying) or dropping."
    config:
      ratePerSecond: { type: PositiveNumber, required: true, description: "Max average packets/sec (can be fractional)." }
      mode: { type: string, enum: ["Shaping", "Dropping"], default: "Shaping" }
      burstSize: { type: PositiveInteger, default: 1, description: "Max burst size (token bucket capacity)." }
      throttledOutputName: { type: OutputPortNameString, default: "throttledData" }
      droppedOutputName: { type: OutputPortNameString, default: "droppedData", description: "Output for dropped packets (if mode=Dropping)." }
    inputs:
      data: { type: any, required: true, description: "Input stream of data packets." }
    outputs:
      # throttledOutputName: { type: any, description: "Packets emitted according to rate limit." }
      # droppedOutputName: { type: any, description: "Discarded packets (if mode=Dropping)." }
      error:
        is_error_path: true
        description: "Internal state, timer, or configuration error."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["ThrottleInput.StateError"]
    required_runtime_apis: ["get_state()", "set_state()", "set_timer()", "get_current_time()"]
    testing_considerations: "Integration: Requires Core state/timers. Send input > rate. Verify Shaping output rate. Verify Dropping mode (droppedOutputName, throttledData rate). Test fractional rate, burstSize."

  - type: Streams:Window
    purpose: "Groups incoming data into time-based windows (Tumbling, Sliding, Session)."
    config:
      windowType: { type: string, enum: ["Tumbling", "Sliding", "Session"], required: true }
      windowSize: { type: DurationString, required_if_tumbling_sliding: true, description: "Window duration (e.g., '5s', '1m')." }
      slideInterval: { type: DurationString, required_if_sliding: true, description: "How often new sliding window starts." }
      sessionGap: { type: DurationString, required_if_session: true, description: "Inactivity period to close session window." }
      windowOutputName: { type: OutputPortNameString, default: "window" }
    inputs:
      data: { type: any, required: true, description: "Input stream. Core associates timestamp." }
    outputs:
      # windowOutputName: # Name by config.windowOutputName
      #   type: object
      #   description: "Object with window details and collected items."
      #   schema:
      #     type: object
      #     properties:
      #       windowStart: { type: string, format: "date-time" }
      #       windowEnd: { type: string, format: "date-time" }
      #       items: { type: array }
      #     required: ["windowStart", "windowEnd", "items"]
      error:
        is_error_path: true
        description: "Error in config, state, or timers."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["Streams.Window.ConfigError", "Streams.Window.StateError", "Streams.Window.TimerError"]
    required_runtime_apis: ["get_state()", "set_state()", "set_timer()", "clear_timer()", "get_current_time()", "Core time context for data."]
    testing_considerations: "Integration: Requires Core state/timers, time control. Test Tumbling, Sliding, Session windows with data. Test late data, empty windows."

  # 3.8 Observability & Auditing
  - type: StdLib:Logger
    purpose: "Writes diagnostic logs to Core Runtime's logging system."
    config:
      level: { type: string, enum: ["DEBUG", "INFO", "WARN", "ERROR"], default: "INFO" }
      messageExpression: { type: ExpressionString, required: true, description: "Expression for string/object to log (sandboxed)." }
      language: { type: string, enum: ["JMESPath", "JsonPointer"], default: "JMESPath" }
    inputs:
      data: { type: any, description: "Context for messageExpression." }
    outputs: [] # None
    required_runtime_apis: ["sandbox_execute_expression()", "log(level, message)"]
    testing_considerations: "Unit: Mock 'log' API. Verify level, evaluated message. Integration: Verify log message in Core's sink with context."

  - type: StdLib:AuditLogger
    purpose: "Writes structured business-level audit events to Core's audit log sink."
    config:
      eventType: { type: AuditEventTypeString, required: true, description: "Structured ID for audit event type." }
      eventDetailsExpression: { type: ExpressionString, description: "Expression for JSON object of non-sensitive details (sandboxed). Default: input 'data'." }
      language: { type: string, enum: ["JMESPath", "JsonPointer"], default: "JMESPath" }
      userIdExpression: { type: ExpressionString, description: "Expression for user ID (sandboxed). Core may inject." }
      resourceIdExpression: { type: ExpressionString, description: "Expression for primary resource ID (sandboxed)." }
      outcome: { type: string, enum: ["Success", "Failure", "Attempt"], default: "Success" }
    inputs:
      data: { type: any, required: true, description: "Context for expressions and default event details." }
    outputs: [] # None
    required_runtime_apis: ["sandbox_execute_expression()", "audit_log(eventType, userId, resourceId, outcome, details)"]
    testing_considerations: "Unit: Mock 'audit_log' API. Verify evaluated params. Integration: Requires Core audit log infra. Verify structured events in sink."
    security_considerations: "Critical for security/compliance. Use consistently. Secure audit sink. Avoid logging sensitive data in details. Sandbox expressions."

  - type: StdLib:MetricsEmitter
    purpose: "Emits custom metrics (counters, gauges, histograms) to Core's metrics system."
    config:
      metricName: { type: MetricNameString, required: true, description: "Metric name (e.g., app_requests_total)." }
      metricType: { type: string, enum: ["counter", "gauge", "histogram", "summary"], required: true }
      valueExpression: { type: ExpressionString, description: "Expression for numeric value (sandboxed). Default 1 for counter. Required for others." }
      language: { type: string, enum: ["JMESPath", "JsonPointer"], default: "JMESPath" }
      labelsExpression: { type: ExpressionString, description: "Expression for JSON object of key-value string labels (sandboxed)." }
      labelsLanguage: { type: string, enum: ["JMESPath", "JsonPointer"], default: "JMESPath" }
      histogramBuckets: { type: "list<float>", description: "Required if metricType=histogram. Upper bounds of buckets." }
    inputs:
      data: { type: any, required: true, description: "Context for valueExpression and labelsExpression." }
    outputs: [] # None
    required_runtime_apis: ["sandbox_execute_expression()", "emit_metric(type, name, value, labels, buckets)"]
    testing_considerations: "Unit: Mock 'emit_metric' API. Verify params, expressions, types. Integration: Requires Core metrics infra. Verify metrics in sink."
    security_considerations: "Avoid sensitive info in names/labels. Mind label cardinality. Sandbox expressions."

  # 3.9 SaaS Platform Components
  - type: Security.Authenticate
    purpose: "Authenticates users/service tokens via configurable providers/plugins."
    config:
      providerType: { type: ["enum('Jwt', 'ApiKey', 'Database', 'ExternalOidc')", "PluginIdentifierString"], required: true, description: "Auth method or plugin." }
      providerConfig: { type: object, required: true, description: "Provider-specific config. Structure per provider/plugin schema. Use Core Secrets." }
      credentialsLocation: { type: string, enum: ["InputData", "HttpHeaders"], default: "InputData", description: "Where to find credentials in input 'data'." }
    inputs:
      data: { type: object, required: true, description: "Input with credentials or HTTP headers." }
    outputs:
      userId: { type: string, description: "Authenticated user/principal ID on success." }
      claims: { type: object, description: "Additional verified claims/attributes." }
      error:
        is_error_path: true
        description: "Authentication failed (invalid creds, expired token, provider error, config)."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["Security.Authenticate.InvalidCredentials", "Security.Authenticate.TokenExpired", "Security.Authenticate.ProviderError", "Security.Authenticate.ConfigError", "Security.Authenticate.PluginError"]
    required_runtime_apis: ["get_secret()", "execute_component() (if delegating)", "crypto_verify_jwt() / crypto_hash_password() (if built-in)", "component_loader_load() (if plugins)", "network APIs (via plugin for OIDC)", "log()"]
    testing_considerations: "Unit: Mock providers/plugins. Test configs, valid/invalid creds for each type. Verify outputs. Integration: Requires providers/plugin envs. Test end-to-end."
    security_considerations: "Critical. Secure credential/secret handling. Rate limit externally. Secure providers/plugins. Validate inputs/configs. Constant-time compares."

  - type: Security.Authorize
    purpose: "Performs authorization checks based on principal, action, resource."
    config:
      policySourceType: { type: ["enum('Static', 'Opa', 'DatabaseLookup')", "PluginIdentifierString"], required: true, description: "How decisions are made." }
      policySourceConfig: { type: object, required: true, description: "Config for policySourceType. Structure per type/plugin schema. Use Core Secrets." }
      inputDataExpression: { type: ExpressionString, description: "JMESPath to construct/transform input 'data' for policy eval (sandboxed)." }
    inputs:
      data:
        type: object
        required: true
        description: "Context for auth decision (principal, action, resource)."
        # properties:
        #   principal: { type: object, properties: { id: string, roles: "list<string>", permissions: "list<string>" } }
        #   action: { type: string }
        #   resource: { type: object, properties: { type: string, id: string, attributes: object } }
    outputs:
      authorized: { type: object, description: "Emits original input 'data' if granted." }
      error:
        is_error_path: true
        description: "Authorization denied or error during check."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["Security.Authorize.Unauthorized", "Security.Authorize.ConfigError", "Security.Authorize.ExpressionError", "Security.Authorize.PermissionSourceError", "Security.Authorize.PluginError"]
    required_runtime_apis: ["sandbox_execute_expression()", "execute_component() (if delegating)", "opa_query() (if OPA/plugin)", "component_loader_load() (if plugins)", "get_secret()", "log()"]
    testing_considerations: "Unit: Mock policy source. Test configs, decisions for principal/action/resource. Integration: Requires policy source. Test end-to-end decisions, errors."
    security_considerations: "Critical. Secure policy source. Validate inputs/configs. Correct policy interpretation. Sandbox expressions. Avoid logging sensitive context."

  - type: Billing.ProcessPayment # Abstract Component
    purpose: "Processes payments via external payment gateway plugins (Stripe, PayPal, etc.)."
    config:
      gatewayType: { type: PluginIdentifierString, required: true, description: "Payment gateway plugin ID (e.g., StripeAdapter)." }
      gatewayConfig: { type: object, required: true, description: "Plugin-specific config (API keys, etc.). Structure per plugin schema. Use Core Secrets." }
    inputs:
      amount: { type: PositiveNumber, required: true, description: "Amount in smallest currency unit (cents)." }
      currency: { type: CurrencyCodeString, required: true, description: "ISO 4217 currency code (USD, EUR)." }
      paymentMethodId: { type: string, required: true, description: "Token/ID for payment method." }
      orderId: { type: string, description: "Internal order/transaction ID." }
      customerDetails: { type: object, description: "Customer info (name, email, address). Structure per gateway/plugin." }
      metadata: { type: object, description: "Additional key-value metadata for gateway." }
    outputs:
      result:
        description: "Result of payment processing."
        schema: # Schema defined by plugin, example:
          type: object
          properties:
            transactionId: { type: string, description: "Gateway's unique transaction ID." }
            status: { type: string, enum: ["succeeded", "pending", "failed", "requires_action"], description: "Final or intermediate status." }
            gatewayResponse: { type: object, description: "Raw/parsed gateway response." }
            nextAction: { type: object, description: "Details if further action needed (e.g., 3DS redirect)." }
          required: ["transactionId", "status"]
      error:
        is_error_path: true
        description: "Payment failed (gateway error, invalid method, insufficient funds, config). Mapped by plugin."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["Billing.ProcessPayment.GatewayError", "Billing.ProcessPayment.CardDeclined", "Billing.ProcessPayment.ConfigError", "Billing.ProcessPayment.PluginError"] # Examples
    required_runtime_apis: ["component_loader_load(gatewayType)", "get_secret()", "Plugin uses declared capabilities (network, log)."]
    testing_considerations: "Unit: Mock plugin. Test success, failures, inputs, outputs. Integration: Requires gateway test env. Test end-to-end. NEVER use live credentials."
    security_considerations: "Highly sensitive. Core Secrets for API keys. Secure plugin data handling (PCI DSS). Log outcomes/IDs, NOT raw payment details. Secure communication. Restrict access."

  - type: Billing.ManageSubscription # Abstract Component
    purpose: "Manages subscription lifecycle (create, cancel, update) via billing platform plugins."
    config:
      platformType: { type: PluginIdentifierString, required: true, description: "Billing platform plugin ID (e.g., StripeBillingAdapter)." }
      platformConfig: { type: object, required: true, description: "Plugin-specific config. Structure per plugin schema. Use Core Secrets." }
      operation: { type: string, enum: ["CREATE", "CANCEL", "UPDATE", "GET", "LIST_PLANS"], required: true }
    inputs:
      subscriptionData: { type: object, required: true, description: "Data for the operation. Structure per operation/plugin." }
    outputs:
      result:
        description: "Result of subscription operation."
        schema: # Schema defined by plugin, depends on operation. Example for GET/CREATE:
          type: object
          properties:
            subscriptionId: { type: string }
            status: { type: string } # "active", "canceled", etc.
            planId: { type: string }
            customerId: { type: string }
            currentPeriodStart: { type: string, format: "date-time" }
            currentPeriodEnd: { type: string, format: "date-time" }
      error:
        is_error_path: true
        description: "Subscription operation failed (API error, invalid input, config). Mapped by plugin."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["Billing.ManageSubscription.PlatformError", "Billing.ManageSubscription.NotFound", "Billing.ManageSubscription.InvalidOperation", "Billing.ManageSubscription.PluginError"] # Examples
    required_runtime_apis: ["component_loader_load(platformType)", "get_secret()", "Plugin uses declared capabilities (network, log)."]
    testing_considerations: "Unit: Mock plugin. Test operations, inputs, outputs. Integration: Requires platform test env. Test lifecycle ops. NEVER use live credentials."
    security_considerations: "Core Secrets for API keys. Log outcomes/IDs, not sensitive details. Secure communication. Restrict access."

  - type: Communication.SendEmail # Abstract Component
    purpose: "Sends email via external email delivery service plugins (SendGrid, SES, etc.)."
    config:
      serviceType: { type: PluginIdentifierString, required: true, description: "Email service plugin ID (e.g., SendGridAdapter)." }
      serviceConfig: { type: object, required: true, description: "Plugin-specific config. Structure per plugin schema. Use Core Secrets." }
      fromAddress: { type: ["EmailString", "ExpressionString"], required: true, description: "'From' email address (sandboxed if expression)." }
      defaultFromName: { type: string, description: "Default 'From' name." }
    inputs:
      toAddresses: { type: ["EmailString", "list<EmailString>", "ExpressionString"], required: true, description: "Recipients (sandboxed if expression)." }
      ccAddresses: { type: ["EmailString", "list<EmailString>", "ExpressionString"], description: "CC recipients (sandboxed if expression)." }
      bccAddresses: { type: ["EmailString", "list<EmailString>", "ExpressionString"], description: "BCC recipients (sandboxed if expression)." }
      subject: { type: ["string", "ExpressionString"], required: true, description: "Email subject (sandboxed if expression)." }
      bodyHtml: { type: ["string", "ExpressionString"], description: "HTML email body (sandboxed if expression). Required if no bodyText/templateId." }
      bodyText: { type: ["string", "ExpressionString"], description: "Plain text email body (sandboxed if expression)." }
      templateId: { type: ["string", "ExpressionString"], description: "Service template ID (sandboxed if expression)." }
      templateData: { type: ["object", "ExpressionString"], description: "Key-value data for template merge (sandboxed if expression)." }
      attachments:
        type: "list<AttachmentObject>"
        description: "List of attachments."
        schema: # AttachmentObject conceptual schema
          type: array
          items: { type: object, properties: { filename: string, contentType: string, content: ["bytes", "ExpressionString"] } } # content base64 or expression
      data: { type: object, description: "Context for all expression inputs." }
    outputs:
      result:
        description: "Result of email send attempt."
        schema: # Schema defined by plugin, example:
          type: object
          properties:
            messageId: { type: string, description: "Optional: Provider's message ID." }
            status: { type: string, enum: ["queued", "sent"], description: "Status from service API." }
          required: ["status"]
      error:
        is_error_path: true
        description: "Email send failed (API error, auth, invalid address, template, expression). Mapped by plugin."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["Communication.SendEmail.ServiceError", "Communication.SendEmail.InvalidAddress", "Communication.SendEmail.TemplateNotFound", "Communication.SendEmail.PluginError", "Communication.SendEmail.ExpressionError"] # Examples
    required_runtime_apis: ["component_loader_load(serviceType)", "get_secret()", "sandbox_execute_expression()", "Plugin uses declared capabilities (network, log)."]
    testing_considerations: "Unit: Mock plugin. Test content vs. templates, recipients, attachments, expressions. Integration: Requires service test env or mock server. Verify email generation. AVOID real external addresses."
    security_considerations: "Core Secrets for API keys. Validate recipients. Sanitize user content in subject/body. Cautious with template data. Sandbox expressions. Monitor bounces/complaints."

  - type: Communication.SendNotification # Abstract Component
    purpose: "Sends notifications via different channels (Email, SMS, Push, Slack) using plugins or routing."
    config:
      channel: { type: ["enum('Email', 'SMS', 'Push', 'Slack')", "ExpressionString"], required: true, description: "Target channel (sandboxed if expression)." }
      serviceType: { type: ["PluginIdentifierString", "ExpressionString"], description: "Specific service plugin ID for channel (e.g., TwilioAdapter). Sandboxed if expression." }
      serviceConfig: { type: ["object", "ExpressionString"], description: "Plugin/channel-specific config. Use Core Secrets. Sandboxed if expression." }
      templateId: { type: ["string", "ExpressionString"], description: "Template ID for service/channel (sandboxed if expression)." }
    inputs:
      recipient: { type: ["any", "ExpressionString"], required: true, description: "Recipient ID (email, phone, token, webhook). Structure per channel. Sandboxed if expression." }
      message: { type: ["string", "object", "ExpressionString"], required: true, description: "Message content payload. Structure per channel. Sandboxed if expression." }
      data: { type: object, description: "Context for all expression inputs." }
    outputs:
      result:
        description: "Result of notification send."
        schema: # Schema by underlying plugin/component, example:
          type: object
          properties:
            deliveryId: { type: string, description: "Optional: Provider's delivery/message ID." }
            status: { type: string, enum: ["queued", "sent", "..."] }
          required: ["status"]
      error:
        is_error_path: true
        description: "Notification send failed. Mapped by underlying component/plugin."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["Communication.SendNotification.ChannelError", "Communication.SendNotification.ServiceError", "Communication.SendNotification.PluginError", "Communication.SendNotification.ExpressionError"] # Examples
    required_runtime_apis: ["component_loader_load() (if dynamic plugins)", "get_secret()", "sandbox_execute_expression()", "execute_component() (if wrapping)"]
    testing_considerations: "Unit: Mock underlying components/plugins per channel. Test routing. Verify params. Test expressions. Integration: Requires test envs for services. Test end-to-end per channel. AVOID real recipients."
    security_considerations: "Core Secrets. Validate recipients. Sanitize message content per channel. Rate limits/costs. Sandbox expressions."

  - type: Platform.QuotaCheck
    purpose: "Checks if proposed action would exceed usage quota for a scope. Reads current usage/limit."
    config:
      quotaType: { type: QuotaTypeString, required: true, description: "Quota identifier (e.g., api_calls_per_month)." }
      scopeType: { type: string, enum: ["account", "project", "user"], required: true, description: "Entity level for quota." }
      limitSource: { type: string, enum: ["Config", "KvStore"], default: "Config", description: "Where to find quota limit." }
      limitValue: { type: PositiveInteger, required_if_limitSource_Config: true, description: "Static quota limit." }
      limitKeyExpression: { type: ExpressionString, required_if_limitSource_KvStore: true, description: "Expression for KV store key for limit (sandboxed)." }
      usageSource: { type: string, enum: ["KvStore"], required: true, description: "Where to find current usage." }
      usageKeyExpression: { type: ExpressionString, required: true, description: "Expression for KV store key for usage (sandboxed)." }
      language: { type: string, enum: ["JMESPath", "JsonPointer"], default: "JMESPath" }
    inputs:
      data: { type: object, required: true, description: "Input with scope ID for key expressions." }
      incrementBy: { type: PositiveInteger, default: 1, description: "Amount usage would increase. 0 to check current usage." }
    outputs:
      pass: { type: object, description: "Emitted if currentUsage + incrementBy <= limit. Contains input 'data'." }
      currentUsage: { type: integer, description: "Current usage from usageSource." }
      limit: { type: integer, description: "Effective limit from limitSource." }
      error:
        is_error_path: true
        description: "Quota exceeded or error accessing storage/limit/config/expression."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" } # details includes usage/limit/incrementBy if OverQuota
        error_types: ["Platform.QuotaCheck.OverQuota", "Platform.QuotaCheck.ConfigError", "Platform.QuotaCheck.ExpressionError", "Platform.QuotaCheck.StorageError", "Platform.QuotaCheck.LimitSourceError"]
    required_runtime_apis: ["kv_get(key)", "sandbox_execute_expression()", "log()"]
    testing_considerations: "Unit: Mock kv_get. Test usage below/at/above limit (with incrementBy). Test static/dynamic limits. Test key expressions. Integration: Requires test KV store. Populate usage/limits. Verify."
    security_considerations: "Prevent KV key manipulation. Restrict KV access. Trustworthy limitSource. Sandbox expressions. Separate component increments usage."

  - type: AI.Generate # Abstract Component
    purpose: "Generates text, code, etc., using a configured LLM via a plugin."
    config:
      llmType: { type: PluginIdentifierString, required: true, description: "LLM integration plugin ID (e.g., OpenAIAdapter)." }
      llmConfig: { type: object, required: true, description: "Plugin-specific config (model, API key secret ref, etc.). Structure per plugin schema. Use Core Secrets." }
      promptExpression: { type: ExpressionString, required: true, description: "Expression for final prompt string/object (sandboxed)." }
      language: { type: string, enum: ["JMESPath", "JsonPointer"], default: "JMESPath" }
      generationParameters: { type: object, description: "Parameters for LLM generation (temperature, max_tokens, etc.). Structure per LLM/plugin." }
    inputs:
      data: { type: object, required: true, description: "Context for promptExpression." }
    outputs:
      modelAnswer: { type: ["string", "object"], description: "Generated content from LLM." }
      usage:
        type: object
        description: "Token usage info, if provided by plugin/LLM."
        schema: # Example schema
          type: object
          properties:
            promptTokens: { type: integer }
            completionTokens: { type: integer }
            totalTokens: { type: integer }
      error:
        is_error_path: true
        description: "Error during prompt eval, LLM communication, or response processing. Mapped by plugin."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["AI.Generate.ExpressionError", "AI.Generate.PluginError", "AI.Generate.ServiceError.RateLimit", "AI.Generate.ServiceError.ContentFiltered", "AI.Generate.ConfigError"] # Examples
    required_runtime_apis: ["component_loader_load(llmType)", "get_secret()", "sandbox_execute_expression()", "Plugin uses declared capabilities (network, log)."]
    testing_considerations: "Unit: Mock plugin. Test config, promptExpression, params, outputs. Integration: Requires LLM service. Verify generation. Test params, errors. Focus on integration, not LLM quality."
    security_considerations: "Core Secrets for API keys. CAREFUL with sensitive data in prompts. Prevent prompt injection. Data privacy. Content filtering. Sandbox promptExpression. Monitor costs."

  # 3.10 Cryptography Components
  - type: Crypto.SecureExecutor
    new_in_version: "3.2"
    purpose: "Performs sensitive crypto ops (sign, encrypt/decrypt, verify) via secure backend plugin. Uses key IDs, not raw keys."
    config:
      executorType: { type: PluginIdentifierString, required: true, description: "Secure execution backend plugin ID (e.g., VaultTransitEngineAdapter, AwsKmsAdapter)." }
      executorConfig: { type: object, required: true, description: "Plugin-specific config. Structure per plugin schema. Use Core Secrets." }
      operation: { type: OperationNameString, required: true, description: "Logical crypto operation (e.g., SignEcdsaSha256, EncryptAesGcm)." }
      keyIdentifier: { type: ["KeyIdentifierString", "ExpressionString"], required: true, description: "Key ID in secure backend (NOT key material). Sandboxed if expression." }
    inputs:
      payload: { type: ["string", "bytes", "ExpressionString"], required: true, description: "Data input for operation (format per operation). Sandboxed if expression." }
      parameters: { type: ["object", "ExpressionString"], description: "Additional params for operation (e.g., signature for verify, AAD). Structure per plugin/op. Sandboxed if expression." }
    outputs:
      result: { type: ["string", "bytes", "boolean"], description: "Outcome of crypto operation (format per operation)." }
      error:
        is_error_path: true
        description: "Error during secure operation (plugin comm, backend error, invalid key/payload, verify fail - distinct from result:false). Mapped by plugin."
        schema: { $ref: "#/definitions/schemas/StandardErrorStructure" }
        error_types: ["SecureExecutorError.PluginError", "SecureExecutorError.BackendError.AccessDenied", "SecureExecutorError.InvalidKey", "SecureExecutorError.InvalidInput", "SecureExecutorError.ConfigError", "SecureExecutorError.ExpressionError"] # Examples
    required_runtime_apis: ["component_loader_load(executorType)", "get_secret()", "sandbox_execute_expression()", "Plugin uses declared capabilities (network, log)."]
    testing_considerations: "Unit: Mock plugin. Test config, inputs, outputs for ops. Integration: Requires secure backend (test KMS/Vault). Provision test keys. Test ops, results, errors. Security Tests: Config security, input validation, no key exposure, backend access policies."
    security_considerations: "Critical. Core Secrets for auth. NEVER handle raw private keys. Secure keyIdentifier. Restrict network. Trusted plugin source. Audit ops. Strong algorithms. Sandbox expressions."

standard_triggers:
  - type: StdLib.Trigger:Http
    purpose: "Initiates a flow via an HTTP request to a configured endpoint."
    config_schema:
      type: object
      properties:
        path:
          type: string
          description: "HTTP path prefix for this trigger (e.g., '/api/v1/orders'). Must be unique."
          pattern: "^/" # Must start with a slash
        method:
          type: string
          enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]
          description: "HTTP method to listen for."
        authentication: # Optional authentication middleware config
          type: object
          description: "Configuration for authentication middleware (e.g., API Key, JWT). Processed by Core before triggering."
          # Example (conceptual - details defined by Core auth middleware capabilities):
          # properties:
          #   type: { type: string, enum: ["ApiKey", "JwtValidator", "None"] }
          #   # ApiKey specific:
          #   apiKeyHeader: { type: string, description: "Header name for API Key." }
          #   apiKeyValueSource: { type: string, description: "Secret ARN or path to where keys are stored/managed by Core."}
          #   # JwtValidator specific:
          #   jwtValidatorConfigRef: { type: string, description: "Reference to a globally defined JWT validator configuration." }
          #   # ... other auth types
          additionalProperties: true
        requestSchema:
          type: object # JSON Schema
          description: "Optional JSON Schema to validate the incoming request body (if applicable for method). Rejection occurs before flow trigger."
        responseConfig:
          type: object
          description: "Configuration for mapping flow completion/error to HTTP response. Handled by Core."
          properties:
            successStatusCode:
              type: integer
              default: 200 # Or 201 for POST, 202 for async, etc. Core might infer.
              description: "HTTP status code for successful flow completion."
            errorStatusCode:
              type: integer
              default: 500
              description: "Default HTTP status code if flow fails or an unhandled error occurs. Can be overridden by flow's error output."
            # How flow output maps to response body.
            # If flow emits structured error, Core might map it to response.
            # If flow emits success with data, Core uses that data.
            # This section could be more complex, e.g., bodyExpression: "flow.output.result"
            # For now, assume Core has a default behavior of returning flow's direct output (or error).
            successBodyExpression: { type: ExpressionString, description: "JMESPath/JsonPointer expression evaluated against flow's final output data to form the success response body. Default: entire output."}
            errorBodyExpression: { type: ExpressionString, description: "JMESPath/JsonPointer expression evaluated against flow's error object to form the error response body. Default: StandardErrorStructure."}
          additionalProperties: true
        timeoutMs:
          type: PositiveInteger
          default: 30000 # e.g., 30 seconds for synchronous response
          description: "Maximum time Core will wait for the flow to complete for a synchronous HTTP response. If exceeded, a timeout response is sent (e.g., 504 Gateway Timeout), but the flow may continue asynchronously if designed so."
      required: ["path", "method"]
    output_to_flow_schema:
      $ref: "#/definitions/schemas/HttpTriggerRequest"
    notes: "Core handles request parsing, optional validation, authentication, and response mapping. The flow receives HttpTriggerRequest."

  - type: StdLib.Trigger:Scheduled
    purpose: "Initiates a flow based on a CRON schedule."
    config_schema:
      type: object
      properties:
        cronExpression:
          type: string
          description: "CRON expression defining the schedule (e.g., '0 * * * *' for every hour at minute 0)."
          # Add pattern for basic cron validation if desired
        timezone:
          type: string
          description: "Timezone for the CRON expression (e.g., 'America/New_York', 'UTC'). Defaults to Core's default timezone if not specified."
        initialPayload:
          type: any
          description: "Optional static JSON-compatible payload to be sent to the flow on each trigger."
      required: ["cronExpression"]
    output_to_flow_schema:
      $ref: "#/definitions/schemas/ScheduledTriggerPayload"
    notes: "Core's scheduler manages CRON parsing and timely execution."

  - type: StdLib.Trigger:Stream
    purpose: "Initiates a flow for messages consumed from a streaming source via a configured Integration.StreamIngestor component."
    config_schema:
      type: object
      properties:
        ingestorComponentRef:
          type: string # This should be a ComponentRefString (FQN or defined name)
          description: "Reference to a Named Component Definition of type 'Integration.StreamIngestor' that is configured for a specific stream source (e.g., Kafka, SQS)."
        batchSize:
          type: PositiveInteger
          default: 1
          description: "Maximum number of messages to batch together for a single flow instance. If > 1, output_to_flow_schema will be StreamTriggerBatch."
        # errorHandling for the ingestor listener itself, not individual message processing errors (those are for the flow to handle)
        errorHandling:
          type: object
          properties:
            strategy:
              type: string
              enum: ["LogAndContinue", "StopListener", "RetryThenStop"] # Core defines available strategies
              default: "LogAndContinue"
            maxRetries: # Relevant for RetryThenStop
              type: NonNegativeInteger
              default: 3
            retryDelayMs: # Relevant for RetryThenStop
              type: NonNegativeInteger
              default: 1000
          description: "Configuration for how the Core TriggerManager handles errors from the underlying StreamIngestor component (e.g., connection loss)."
      required: ["ingestorComponentRef"]
    output_to_flow_schema: # This needs to be conditional based on batchSize. DSL doesn't directly support this.
                           # The documentation should explain: if batchSize=1, schema is StreamTriggerMessage, else StreamTriggerBatch.
                           # For formal schema, we might need to define a oneOf or rely on documentation.
      oneOf:
        - $ref: "#/definitions/schemas/StreamTriggerMessage"
        - $ref: "#/definitions/schemas/StreamTriggerBatch"
    notes: |
      The flow receives data based on the 'batchSize'.
      If batchSize is 1, the payload is StreamTriggerMessage.
      If batchSize > 1, the payload is StreamTriggerBatch.
      Acknowledgement (ACK/NACK) of messages depends on the 'ackMode' configured in the referenced Integration.StreamIngestor and subsequent use of Integration.AckMessage component in the flow.
      The referenced Integration.StreamIngestor component must be defined in the `definitions.components` section of the DSL.

  - type: StdLib.Trigger:EventBus
    purpose: "Initiates a flow when a matching event is published to the internal Core event bus."
    config_schema:
      type: object
      properties:
        eventTypePattern:
          type: string
          description: "Pattern to match event types (e.g., 'user.created', 'order.*.processed'). Core defines pattern syntax (e.g., simple glob, regex subset)."
        filterExpression:
          type: ExpressionString # e.g., JMESPath or JsonPointer
          description: "Optional expression (e.g., JMESPath) evaluated against the event's payload to further filter events. Flow triggers only if expression evaluates to true. Sandboxed."
        filterLanguage:
          type: string
          enum: ["JMESPath", "JsonPointer"]
          default: "JMESPath"
      required: ["eventTypePattern"]
    output_to_flow_schema:
      $ref: "#/definitions/schemas/EventBusTriggerPayload"
    notes: "Core's event bus handles event routing and filtering."

  - type: StdLib.Trigger:Manual # Conceptual trigger, not directly configured in `trigger:` block of DSL.
    purpose: "Represents flows initiated programmatically via Core API (e.g., trigger_flow) or by components like StdLib:SubFlowInvoker."
    config_schema:
      type: object
      description: "Configuration is implicit: the 'initialData' provided at invocation time."
      properties:
        initialData:
          type: any
          description: "The data payload provided when the flow is manually triggered."
    output_to_flow_schema:
      type: any # The schema is the schema of the initialData itself.
    notes: "This trigger type is not specified in a flow's 'trigger' configuration block. It's the type associated with direct invocations."

plugin_specification:
  purpose: "Encapsulate external integrations, algorithms, or secure operations. Loaded by abstract StdLib components."
  target_component: "Each plugin targets a specific abstract StdLib component and compatible StdLib/Core versions."
  interface_contract:
    initialization:
      description: "Optional. Called once on load/first use. Receives plugin-specific config and restricted ComponentRuntimeAPI."
      conceptual_signature: "init(config: JsonValue, runtime: RestrictedRuntimeAPI) -> Result<(), PluginError>"
    execution_function:
      description: "Main function called by host. Receives input payload, operation params, and scoped restricted ComponentRuntimeAPI."
      conceptual_signature_example: "execute(input: JsonValue, params: JsonValue, runtime: RestrictedRuntimeAPI) -> Result<JsonValue, PluginError>"
    state_management: "Must use ComponentRuntimeAPI (get_state, set_state) and declare 'state' capability if needed."
    timers: "Must use ComponentRuntimeAPI (set_timer, clear_timer) and declare 'timers' capability if needed."
    input_output: "Receive deserialized JSON/bytes, return JSON/bytes or structured error. Document I/O structures per operation."
    error_handling: "Catch internal errors, map to StandardErrorStructure. 'type' field specific, prefixed (e.g., AdapterError.ServiceUnavailable). No sensitive details in error."
  configuration_schema: "Must define expected structure/types/validation for its config object (e.g., adapterConfig) as machine-readable schema (JSON Schema recommended). Document required, optional, defaults, secret refs."
  capabilities: "Must declare required ComponentRuntimeAPI capabilities in metadata (network, secrets, kv_get, log, state, timers, filesystem_read/write). Core enforces policy based on this. Restricted API subset passed to plugin."
  implementation_language_environment: "Preferably WASM for security, portability, performance. Trusted native plugins require stricter vetting."
  deployment_versioning: "Deployed/versioned independently. Core plugin registry manages artifacts, versions, metadata. Identifiers in StdLib config resolve to specific plugin version."
  metadata:
    description: "Each plugin artifact accompanied by metadata (e.g., manifest.json)."
    fields:
      pluginId: { type: string, required: true, description: "Unique ID (e.g., my-company/aws-kms-adapter)." }
      pluginName: { type: string, description: "Human-readable name." }
      pluginVersion: { type: string, required: true, description: "Semantic version (e.g., 1.2.0)." }
      targetComponent: { type: string, required: true, description: "Fully qualified type of abstract StdLib component extended." }
      compatibility: { type: object, required: true, description: "Compatible StdLib/Core versions (e.g., { stdlib: '>=4.3 <5.0', core: '>=1.5 <2.0' })." }
      configurationSchema: { type: object, required: true, description: "JSON Schema for plugin's config object." }
      capabilitiesRequired: { type: "list<string>", required: true, description: "List of required Core Runtime API capabilities." }
      description: { type: string, description: "Brief plugin function description." }
      operations: { type: "list<object>", description: "For multi-action plugins, list of ops with input/output schemas." }
      author: { type: string, description: "Plugin author/maintainer." }
      license: { type: string, description: "SPDX license identifier." }
      support: { type: string, description: "URL or contact for support." }
  testing_requirements_for_developers:
    unit_tests: "Test core logic in isolation. Mock RestrictedRuntimeAPI and external dependencies. Verify input parsing, output, state, error mapping. Edge cases."
    integration_tests: "Test against real dependencies (test endpoints, DBs, KMS keys) in controlled environment. Verify interaction, auth, data exchange, errors."
    compatibility_tests: "Package plugin (e.g., WASM). Test load and function with target StdLib component in compatible Core."
    security_tests: "Security by design. Input validation. Capability enforcement. Dependency scanning, fuzzing if appropriate."
  security_considerations_for_developers:
    least_privilege: "Declare only required capabilities."
    input_validation: "Strictly validate all config and data payloads. Assume untrusted inputs."
    secrets_management: "Use 'get_secret' exclusively. Never log/embed secrets."
    secure_communication: "TLS/SSL with cert validation for network calls."
    error_handling: "Returned errors (StandardErrorStructure) must not leak sensitive info."
    resource_management: "Avoid excessive resource consumption. Internal timeouts for external calls."
    dependency_security: "Keep third-party libs updated, scan for vulnerabilities."
    code_integrity: "Ensure deterministic build and verifiable integrity (checksums)."