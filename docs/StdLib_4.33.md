# Cascade Standard Component Library (StdLib): Detailed Architecture Document V4.33 - Complete Specification

**Version:** 4.33
**Date:** 2023-11-05

**1. Introduction & Vision**

The Cascade Standard Component Library (StdLib) V4.33 is a comprehensive collection of pre-built, reusable `Component` implementations designed to run on the Cascade Core Runtime. It provides high-level abstractions and patterns commonly found in business process automation, actor systems, reactive stream processing, and SaaS platform infrastructure.

**Vision:** To be the **canonical toolkit** for building sophisticated reactive applications, integrations, and cloud platform services on the Cascade Platform. StdLib aims to cover 90-95% of common requirements by offering robust implementations of:

*   Core workflow primitives
*   Data transformation and enrichment
*   Reliability and error handling patterns
*   Stateful entities (Actor model)
*   Reactive stream operators
*   SaaS platform infrastructure components
*   Common integration protocols (via core components like `HttpCall` and abstract components with plugins)
*   Observability and auditing

This allows developers to focus on domain-specific logic, composing complex behaviors from these reliable, well-tested building blocks within the minimal core DSL. StdLib leverages the full potential of the Cascade Core's extensibility, state, and timer mechanisms.

**Production Business Requirements:**

*   **Comprehensive Patterns:** Cover a wide range of integration (EIPs), orchestration (Saga, Process), stateful entities (Actor model), parallel processing, stream manipulation, SaaS platform needs, and external system integrations (primarily via plugins).
*   **Abstraction:** Hide the low-level complexity of implementing patterns and integrations behind well-defined component interfaces.
*   **Reliability & Resilience:** Provide production-grade components for error handling, retries, idempotency, circuit breakers, DLQ processing, and robust state management.
*   **Performance:** Implement components efficiently, utilizing Core's async nature and minimizing overhead.
*   **Composability:** Ensure all components, including higher-level ones, are designed to be wired together seamlessly in the DSL.
*   **Configurability:** Offer flexible configuration options for adapting patterns to specific needs.
*   **Observability:** Fully integrate with Core's tracing, logging, and metrics.
*   **Testability:** Components should be easily testable in isolation and in integrated flows.

**New in V3.2:** Introduction of abstract components designed to bridge the gap between the DSL and specialized, pluggable implementations for complex logic execution, diverse integrations, stream ingestion, secure operations, and business rule evaluation. These components (`Execution.SandboxRunner`, `Integration.ExternalServiceAdapter`, `Integration.StreamIngestor`, `Crypto.SecureExecutor`, `Execution.RuleEngine`) rely heavily on the Core's `ComponentLoader`, secure configuration/secrets management, and potentially sandboxing/security features to load and execute specific backend implementations referenced in their configuration. This promotes extensibility while keeping the core StdLib focused on patterns.

**Updated in V4:** Clarified the plugin-based architecture. The abstract components provide *integration points* for custom logic implemented as plugins/adapters/modules. The StdLib defines the *patterns*, while the plugins provide the *specific implementations*. This allows for clear separation of concerns, increased flexibility, and improved security. Added interface specifications for key components. Unified documentation structure for comprehensive testing and LLM fine-tuning. Defined a **Standard Error Structure**.

**Updated in V4.1:** Ensured consistent DSL example syntax (`step_id`, `inputs_map`, `outputs_map`) across all sections. Added explicit "(NEW in V3.2)" marker to abstract components introduced in that version. Minor textual refinements.

**Updated in V4.2:** Refined the Saga pattern implementation. The original `StdLib:SagaCoordinator` (which mixed inline definition and external references) is now focused *solely* on native, inline Saga definitions within the Cascade flow. A new component, `StdLib:ExternalWorkflowCoordinator`, has been introduced to handle interactions with external workflow/Saga engines (like AWS Step Functions, Temporal) via dedicated adapter plugins. This provides clearer separation of concerns and better aligns component responsibilities.

**Updated in V4.3:** Implemented significant strictness and explicitness improvements across the specification:
*   **Stricter Typing:** Mandated JSON Schema definitions for complex object types in `config`, `inputs`, and `outputs`. Introduced more specific primitive type names (e.g., `ISO8601Timestamp`, `PositiveInteger`). Defined `StandardErrorStructure` centrally using JSON Schema and referenced it via `$ref`.
*   **Explicit Behaviors:** Made implicit interactions explicit, notably:
    *   Wrapper components (`RetryWrapper`, `CircuitBreaker`) now have explicit input ports for signals from wrapped components, requiring explicit `outputs_map` wiring.
    *   Clarified `ActorRouter` behavior to use an explicit runtime call (`send_to_actor` conceptual API) instead of implicit routing.
*   **Documented Dependencies:** Added `Required Runtime APIs` section to each component, listing conceptual Core Runtime API functions needed (e.g., `get_state`, `set_timer`, `get_secret`, `component_loader_load`, `sandbox_execute`).
*   **State Machines:** Added brief state machine descriptions for relevant components (`CircuitBreaker`, `Join`).
*   **Plugin Specification:** Significantly tightened Section 4, detailing interface contracts (conceptual signatures), configuration schema requirements, capability declaration/enforcement, and testing/security responsibilities for plugin developers.
*   **Sandboxing:** Explicitly stated the requirement for secure sandboxing when evaluating user-provided expressions.
*   **General Clarity:** Added notes on versioning, naming conventions, and mandated runtime validation.

**Updated in V4.31 (Merge):** Consolidated V4.1 + V4.2 Patch + V4.3 Patch into a single document. Ensured logical consistency between changes (e.g., explicit wiring examples for RetryWrapper/DlqPublisher align with updated component contracts).

**Updated in V4.32 (Slimming & Plugin Focus):**
*   **Deprecated Specific Integrations:** Removed several technology-specific integration components (`KafkaPublisher`, `SqsPublisher`, `SqsReceiver`, `GrpcCall`, `SftpTransfer`, `DataMapper`, `Data:Query`, `Data:Execute`, `Platform:AuditLog`) from the core StdLib specification.
*   **Emphasized Plugin Model:** These functionalities are now expected to be provided by plugins implementing the relevant abstract StdLib component interfaces (`Integration.ExternalServiceAdapter`, `Integration.StreamIngestor`). This makes the core StdLib lighter and less dependent on specific external SDKs.
*   **Plugin Requirements Document:** Noted the existence of a separate document specifying the requirements for plugins replacing the deprecated components.
*   **Example Updates:** Updated examples (like `Reliability.DlqPublisher` and Example Flow 2) to reflect the use of abstract components instead of the now-deprecated specific components.
*   **Vision Refinement:** Refined the vision to emphasize achieving broad coverage through a combination of core StdLib components *and* readily available, well-defined plugins/extensions.

**Updated in V4.33 (Merge):** Consolidated V4.31 base and V4.32 patch changes into a single document.

**2. Core Principles**

*   **Composition over Syntax:** Complex patterns (Actors, Processes) are realized by composing StdLib components in the DSL, not via new DSL keywords.
*   **Leverage Core Capabilities:** Components make full use of the `ComponentRuntimeAPI`, relying on the Core for state persistence, timer scheduling, correlation, etc. Dependencies on Core features are explicitly noted.
*   **Clear Contracts:** Each component has a well-defined `config`, `inputs`, and `outputs` contract. This is crucial for testability and predictability.
*   **Stateless Preferred, Stateful Explicit:** Most components aim to be stateless; stateful components clearly document their state requirements and reliance on Core persistence.
*   **Configuration by Convention:** Common settings (data source names, auth provider references) are defined as platform conventions to reduce boilerplate.
*   **Interface-Based Design:** Favor interface-based implementations (e.g., for payment processors, database access) internally where multiple external providers could be supported.
*   **Plugin-Based Extensibility:** Abstract components rely on pluggable implementations for core logic, enabling custom integrations and specialized functionalities without modifying the StdLib itself. The interaction between the StdLib component (the host) and the plugin (the implementation) follows a defined contract.
*   **Security by Design:** All components, especially those handling sensitive data, must be designed and tested with security as a primary concern (input validation, credential handling, least privilege).
*   **(V4.3)** **Runtime Validation:** The Core Runtime *must* validate component `config` blocks against their defined schemas (where provided) before flow instantiation. It *should* also perform runtime validation of component `inputs` against their schemas upon execution where feasible.
*   **(V4.3)** **Required API Documentation:** Each component explicitly lists the conceptual Core Runtime APIs it depends on.
*   **(V4.3)** **State Machine Documentation:** Relevant stateful components include brief descriptions of their state transitions.

**3. Component Categories & Key Components**

**Note on Naming:** All components are identified by their fully qualified `type` using a `Namespace:ComponentName` structure (e.g., `Data:Query`, `Reliability:RetryWrapper`). Namespaces categorize components logically. Adding new namespaces requires definition within the StdLib specification process.

**Note on Versioning:** This specification defines StdLib V4.33. Flow definitions should ideally reference components with explicit versions (e.g., `StdLib:HttpCall:4.33`) if the Core Runtime supports this, or implicitly depend on the StdLib version declared for the flow. StdLib components maintain backward compatibility within minor versions where possible.

**Note on Conceptual Runtime APIs:** The `Required Runtime APIs` listed for components represent the *conceptual functions* needed from the Core Runtime's `ComponentRuntimeAPI`. Actual function names and signatures in the implementation may vary slightly but must provide the described capability.

**Standard Error Structure:**

All StdLib components and their associated plugins that can produce errors *must* output an `error` object with the following structure (marked with `is_error_path=true` in the flow definition).

**(Centrally Defined Schema)**
```json
{
  "$id": "#/definitions/schemas/StandardErrorStructure",
  "type": "object",
  "properties": {
    "type": { "type": "string", "description": "Category.ComponentName.SpecificErrorType (e.g., 'HttpCall.TimeoutError', 'JsonSchemaValidator.ValidationError', 'AdapterError', 'SecureExecutorError.PluginError')" },
    "message": { "type": "string", "description": "Human-readable error message describing the cause." },
    "code": { "type": "string", "description": "Optional internal/external code (e.g., HTTP status code, database error code)." },
    "details": { "type": ["object", "null"], "description": "Optional, component-specific non-sensitive details (e.g., validation failures array).", "additionalProperties": true },
    "timestamp": {
        "type": "string",
        "format": "date-time",
        "description": "ISO 8601 timestamp (added by Core)."
      }
  },
  "required": ["type", "message", "timestamp"]
}
```

The `type` field allows for easy identification of the error category, component, and specific type. The `message` field provides a human-readable explanation. The `code` field offers a machine-readable identifier. The `details` field can contain additional non-sensitive information. Error outputs facilitate explicit error handling paths in the DSL.

**3.1 Execution & Logic Components:**

*   **`StdLib:MapData`**
    *   **Purpose:** Transforms input data using an expression language.
    *   **Config:**
        *   `expression` (`ExpressionString`, required): The transformation expression. The expression *must* be evaluated by the Core Runtime within a secure, isolated sandbox.
        *   `language` (`enum("JMESPath", "JsonPointer")`, optional, default: "JMESPath"): The expression language.
    *   **Inputs:**
        *   `data` (any, required): The input data to transform.
    *   **Outputs:**
        *   `result` (any): The data after applying the transformation expression.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error if the expression is invalid or evaluation fails.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: "MapData.ExpressionError"
    *   **Required Runtime APIs:**
        *   `sandbox_execute_expression(language, expression, data_context)`
    *   **Testing Considerations:**
        *   **Unit Tests:** Verify correct transformation results for various inputs and valid/invalid expressions for each supported `language`. Test edge cases like null/empty inputs, complex nested structures.
    *   **Security Considerations:** Ensure expression languages are sandboxed and cannot access sensitive system resources or arbitrary code execution. Validate the `expression` input against allowed syntax/patterns.
    *   **Example DSL:**
        ```yaml
        - step_id: map-user-data
          component_ref: StdLib:MapData
          config:
            language: JMESPath
            expression: "{ id: user.id, name: user.profile.firstName, isAdmin: has_permission('admin') }"
          inputs_map:
            data: "steps.prev_step.outputs.userData"
        ```

*   **`StdLib:FilterData`**
    *   **Purpose:** Routes data to different outputs based on a boolean expression evaluation.
    *   **Config:**
        *   `expression` (`BooleanExpressionString`, required): The boolean expression to evaluate. The expression *must* be evaluated by the Core Runtime within a secure, isolated sandbox.
        *   `language` (`enum("JMESPath", "JsonPointer")`, optional, default: "JMESPath"): The expression language.
        *   `matchOutput` (`OutputPortNameString`, optional, default: "matchOutput"): The name of the output port for data matching the expression.
        *   `noMatchOutput` (`OutputPortNameString`, optional, default: "noMatchOutput"): The name of the output port for data not matching the expression.
    *   **Inputs:**
        *   `data` (any, required): The input data to filter.
    *   **Outputs:**
        *   `matchOutput` (any): Data that evaluated to true. Port name determined by `config.matchOutput`.
        *   `noMatchOutput` (any): Data that evaluated to false. Port name determined by `config.noMatchOutput`.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error if expression is invalid or eval fails (e.g., non-boolean result).
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: "FilterData.ExpressionError"
    *   **Required Runtime APIs:**
        *   `sandbox_execute_expression(language, expression, data_context)`
    *   **Testing Considerations:**
        *   **Unit Tests:** Verify correct routing for various inputs and expressions evaluating to true/false/error. Test complex boolean logic.
    *   **Security Considerations:** Same as `MapData` regarding expression language sandboxing.
    *   **Example DSL:**
        ```yaml
        - step_id: filter-approved
          component_ref: StdLib:FilterData
          config:
            expression: "status == 'approved'"
            matchOutput: approvedData
            noMatchOutput: rejectedData
          inputs_map:
            data: "steps.prev_step.outputs.application"
          # Downstream steps will connect to outputs.approvedData or outputs.rejectedData
        ```

*   **`StdLib:Switch`**
    *   **Purpose:** Routes data to one of several explicitly named output ports based on a sequence of conditional expressions. Evaluates conditions in order; the first one that evaluates to true determines the output.
    *   **Config:**
        *   `cases` (array, required): List defining conditions and outputs.
            *   `schema`:
                ```json
                {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "conditionExpression": { "type": "string", "description": "Boolean expression. Must be evaluated in sandbox." },
                      "language": { "type": "string", "enum": ["JMESPath", "JsonPointer"], "default": "JMESPath" },
                      "outputName": { "type": "string", "description": "Target output port name." }
                    },
                    "required": ["conditionExpression", "outputName"]
                  }
                }
                ```
        *   `defaultOutputName` (`OutputPortNameString`, optional, default: "defaultOutput"): Output port name if no cases match.
    *   **Inputs:**
        *   `data` (any, required): The input data used for condition evaluation.
    *   **Outputs:**
        *   Dynamically defined output ports matching `outputName`s from `cases` and `defaultOutputName`. Each port outputs the input `data`.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error if any `conditionExpression` is invalid or evaluation fails.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: "Switch.ConditionError"
    *   **Required Runtime APIs:**
        *   `sandbox_execute_expression(language, expression, data_context)`
    *   **Testing Considerations:**
        *   **Unit Tests:** Verify correct routing based on condition order and input data. Test default output.
    *   **Security Considerations:** Same as `MapData` regarding expression language sandboxing.
    *   **Example DSL:**
        ```yaml
        - step_id: route-by-country
          component_ref: StdLib:Switch
          config:
            cases:
              - conditionExpression: "country == 'US'"
                outputName: routeToUSProcessor
              - conditionExpression: "country == 'CA'"
                outputName: routeToCAProcessor
            defaultOutputName: routeToInternationalProcessor
          inputs_map:
            data: "steps.prev_step.outputs.order"
           # Downstream steps connect to outputs.routeToUSProcessor etc.
        ```

*   **`StdLib:Fork`**
    *   **Purpose:** Duplicates the input data and emits it on multiple output ports concurrently, allowing parallel processing branches in the flow.
    *   **Config:**
        *   `outputNames` (list<`OutputPortNameString`>, required): A list of names for the output ports.
    *   **Inputs:**
        *   `data` (any, required): The input data to duplicate.
    *   **Outputs:**
        *   Dynamically defined output ports matching the `outputNames`. Each port emits a copy of the input `data`.
    *   **Required Runtime APIs:**
        *   Core Runtime must inherently support components emitting on multiple ports to start parallel branches. No specific API call *by the component* is needed for the fork itself.
    *   **Testing Considerations:**
        *   **Unit Tests:** Verify data copies on specified outputs (mock Core concurrency).
        *   **Integration Tests:** Verify parallel execution behavior (requires Core concurrency testing features).
    *   **Example DSL:**
        ```yaml
        - step_id: fork-processing
          component_ref: StdLib:Fork
          config:
            outputNames: ["processBranchA", "processBranchB"]
          inputs_map:
            data: "trigger.payload"
          # Downstream steps connect to outputs.processBranchA and outputs.processBranchB
        ```

*   **`StdLib:Join`**
    *   **Purpose:** Waits for data to arrive on all its configured input ports (typically originating from branches downstream of a `Fork`), aggregates the data, and emits it on a single output port.
    *   **Behavior:** Maintains internal state to store received data for each input port within the current execution context. Emits `aggregatedData` when data has arrived on all `inputNames` or emits `error` if `timeoutMs` is reached first. Operates like a barrier synchronization point.
    *   **Config:**
        *   `inputNames` (list<`InputPortNameString`>, required): A list of names for the input ports to wait for.
        *   `aggregationMode` (`enum("Map", "List", "Combine")`, optional, default: "Map"): How to aggregate received data. "Map" creates `{inputName: data}`; "List" creates `[data1, data2]`; "Combine" attempts object merge.
        *   `timeoutMs` (`PositiveInteger`, optional): Maximum time in milliseconds to wait for all inputs. If reached, an error is emitted.
    *   **Inputs:**
        *   Dynamically defined input ports matching `inputNames`.
    *   **Outputs:**
        *   `aggregatedData` (object | list): The combined data based on `aggregationMode`. Schema depends on `aggregationMode`.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error if timeout reached or aggregation fails.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: One of ["Join.TimeoutError", "Join.AggregationError"]
    *   **Required Runtime APIs:**
        *   `get_state()` # To retrieve previously arrived inputs
        *   `set_state()` # To store newly arrived inputs
        *   `set_timer()` # For timeoutMs
        *   `clear_timer()` # If all inputs arrive before timeout
        *   Core Runtime must provide a mechanism to reliably trigger the Join component's execution only when all expected `inputNames` have received data for a given logical execution context OR the timeout occurs.
    *   **Testing Considerations:**
        *   **Unit Tests:** Requires mocking receiving data on multiple inputs and testing the aggregation logic for different `aggregationMode`s. Test timeout scenarios.
        *   **Integration Tests:** Verify correct synchronization and aggregation when wired with upstream `Fork` and other components. (Requires Core's concurrency and timer testing features).
    *   **Example DSL:**
        ```yaml
        - step_id: join-branches
          component_ref: StdLib:Join
          config:
            inputNames: ["resultA", "resultB"]
            aggregationMode: Map
            timeoutMs: 10000
          inputs_map: # Assume resultA comes from step-branch-a, resultB from step-branch-b
             resultA: "steps.step-branch-a.outputs.finalResult"
             resultB: "steps.step-branch-b.outputs.finalResult"
          # run_after: implicit based on inputs_map
        ```

*   **`StdLib:NoOp`**
    *   **Purpose:** Simply passes the input data directly to the output. Useful for flow structuring, debugging, or as a placeholder.
    *   **Config:** None.
    *   **Inputs:**
        *   `data` (any, required): Any input data.
    *   **Outputs:**
        *   `data` (any): The input data, unchanged.
    *   **Required Runtime APIs:** None.
    *   **Testing Considerations:**
        *   **Unit Tests:** Verify output data is identical to input data.
    *   **Example DSL:**
        ```yaml
        - step_id: placeholder-step
          component_ref: StdLib:NoOp
          inputs_map:
            data: "trigger.payload"
        ```

*   **`StdLib:FailFlow`**
    *   **Purpose:** Terminates the current flow instance immediately and marks it as failed.
    *   **Config:**
        *   `errorMessageExpression` (`ExpressionString`, required): An expression defining the error message. Can reference input `data`. The expression *must* be evaluated by the Core Runtime within a secure, isolated sandbox.
        *   `language` (`enum("JMESPath", "JsonPointer")`, optional, default: "JMESPath"): Expression language for `errorMessageExpression`.
    *   **Inputs:**
        *   `data` (any, optional): Context data available for `errorMessageExpression`.
    *   **Outputs:** (None - terminates flow execution).
    *   **Required Runtime APIs:**
        *   `sandbox_execute_expression(language, expression, data_context)`
        *   `fail_flow(errorMessage)`
    *   **Testing Considerations:**
        *   **Integration Tests:** Verify that executing this component causes the flow instance to transition to a 'Failed' state and that the generated error message is correctly recorded. Test `errorMessageExpression` evaluation.
    *   **Security Considerations:** Ensure the `errorMessageExpression` cannot be used for injection or exposing sensitive data by mistake. Ensure sandbox evaluation.
    *   **Example DSL:**
        ```yaml
        - step_id: fail-on-invalid-input
          component_ref: StdLib:FailFlow
          config:
            errorMessageExpression: "'Invalid input provided: ' & data.validationError"
          inputs_map:
            data: "steps.validate-input.outputs.errorDetails"
        ```

*   **`Execution.SandboxRunner`** (NEW in V3.2)
    *   **Purpose:** Executes custom, potentially untrusted code within a secure, isolated environment (typically WASM). Delegates execution to a plugin.
    *   **Config:**
        *   `runtime` (`enum("WASM")`, required): Specifies the sandbox environment type plugin.
        *   `codeRef` (`ResourceIdentifierString`, required): Reference to the code artifact plugin (e.g., path/URL/hash of a WASM module).
        *   `entrypoint` (`FunctionNameString`, optional): The specific function name to call within the `codeRef`. Defaults vary by runtime (e.g., `"_start"` for WASM).
        *   `timeoutMs` (`PositiveInteger`, optional, default: `1000`): Maximum execution time in milliseconds.
        *   `memoryLimitMb` (`PositiveInteger`, optional, default: `64`): Maximum memory allocation for the sandbox instance in megabytes.
        *   `allowedCapabilities` (list<`CapabilityString`>, optional, default: `["log", "get_input", "set_output"]`): Explicit list of `ComponentRuntimeAPI` features the plugin code can access. Checked against plugin metadata.
    *   **Inputs:**
        *   `data` (any, required): Input data passed to the plugin code's entrypoint, typically serialized.
    *   **Outputs:**
        *   `result` (any): Data returned by the successful execution of the plugin code.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error during sandboxed code execution (timeout, crash, disallowed capability, code loading, internal sandbox error).
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: One of ["SandboxError.Timeout", "SandboxError.ExecutionFailed", "SandboxError.CapabilityViolation", "SandboxError.CodeLoadError"]
    *   **Required Runtime APIs:**
        *   `component_loader_load(codeRef)` # To get the plugin code
        *   `sandbox_execute(runtime, code, entrypoint, data, timeoutMs, memoryLimitMb, allowedCapabilities)` # Core sandbox execution
        *   `log` # Sandbox itself might log internal errors
    *   **Testing Considerations:**
        *   **Unit Tests:** Test StdLib component logic: config passing, error mapping (mock sandbox host).
        *   **Integration Tests:** Requires a Core Runtime with sandboxing enabled. Test execution of simple WASM plugins, verify timeouts, memory limits, and capability enforcement. Test with modules that produce errors or violate constraints. *Detailed logic within the WASM module itself is tested separately by the plugin developer.*
    *   **Security Considerations:** *Crucially, the security relies on the Core Runtime's sandboxing implementation and the strict enforcement of `allowedCapabilities`.* The component itself facilitates this by providing the configuration interface. Ensure code artifacts (`codeRef`) are loaded from trusted sources and their integrity is verified (e.g., by hash). Validate inputs.
    *   **Example DSL:**
        ```yaml
        - step_id: run-custom-logic
          component_ref: Execution.SandboxRunner
          config:
            runtime: WASM
            codeRef: "file://./plugins/risk_calculator.wasm"
            entrypoint: "calculate_risk"
            timeoutMs: 500
            allowedCapabilities: ["log"] # Minimal capabilities
          inputs_map:
            data: "{ transactionAmount: 1500, userHistory: {...} }"
        ```

*   **`Execution.RuleEngine`** (NEW in V3.2)
    *   **Purpose:** Evaluates input data ("facts") against a set of configurable business rules using a pluggable rule engine.
    *   **Config:**
        *   `engineType` (`PluginIdentifierString`, required): Identifier for the rule engine plugin implementation (e.g., "SimpleJsonLogic", "DroolsAdapter").
        *   `engineConfig` (object, required): Configuration specific to the chosen `engineType` plugin (contains/references ruleset). Structure defined by the plugin's configuration schema. May contain secret refs.
        *   `decisionPoint` (`RuleEntryPointString`, optional): Specifies a particular entry point within the rule set (if supported by plugin).
    *   **Inputs:**
        *   `facts` (object, required): The input data/context object for rule evaluation.
    *   **Outputs:**
        *   `result` (any): The outcome produced by the rule engine evaluation. Structure defined by plugin.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error during rule engine execution (rule syntax, loading, runtime, config error).
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: One of ["RuleEngineError.ConfigError", "RuleEngineError.EvaluationError", "RuleEngineError.PluginError"]
    *   **Required Runtime APIs:**
        *   `component_loader_load(engineType)` # To load the plugin adapter
        *   `get_secret()` # For secrets in engineConfig
        *   Plugin will use its allowed subset of the Runtime API (e.g., `log`) passed during execution.
    *   **Testing Considerations:**
        *   **Unit Tests:** Test StdLib component logic: plugin loading, config/input passing, error mapping (mock plugin).
        *   **Integration Tests:** Requires a Core Runtime with registered rule engine plugins. Test execution with different `engineType`s and various `facts`. Test scenarios with invalid rules, rule execution errors, and plugin failures. *Detailed rule evaluation logic is tested separately by the plugin developer.*
    *   **Security Considerations:** Ensure rule sources are trusted. Plugins should validate rules. Ensure plugins declare necessary capabilities. Use Core Secrets for sensitive `engineConfig`.
    *   **Example DSL:**
        ```yaml
        - step_id: evaluate-fraud-rules
          component_ref: Execution.RuleEngine
          config:
            engineType: SimpleJsonLogic # Plugin ID
            engineConfig: # Inline rules for this example
              "if":
                - { ">": [{"var": "transaction.amount"}, 1000] }
                - "HighValue"
                - "StandardValue"
          inputs_map:
            facts: "steps.prev_step.outputs.transactionDetails"
        ```

**3.2 Reliability & Error Handling:**

*   **`Reliability.RetryWrapper`**
    *   **Purpose:** Retries execution of a downstream component or sub-flow on error based on a configurable policy. Requires explicit wiring from the wrapped component's outputs back to this component's inputs.
    *   **Config:**
        *   `maxRetries` (`NonNegativeInteger`, required): Max retry attempts after initial failure.
        *   `delayMs` (`NonNegativeInteger`, required): Base delay before first retry.
        *   `backoffMultiplier` (`NonNegativeNumber`, optional, default: 1.0): Multiplier for exponential backoff (>= 1.0).
        *   `retryableErrorTypes` (list<`ErrorTypeString`>, optional): List of error `type` strings (from Standard Error Structure) that trigger retry. If omitted or empty, all errors are retryable.
        *   `name` (`IdentifierString`, optional): Descriptive name for observability/state key.
    *   **Inputs:** (Explicit)
        *   `trigger` (any, required): Data that initiates the first execution attempt of the wrapped logic. Provided via `inputs_map` to this step. Stored in state for retries.
        *   `wrappedOutput` (any, optional): MUST be connected via `outputs_map` from the *success* output of the wrapped component. Receives the result of a successful attempt.
        *   `wrappedError` (object, optional): MUST be connected via `outputs_map` from the *error* output of the wrapped component. Receives the error from a failed attempt. Schema must conform to `StandardErrorStructure`.
    *   **Outputs:**
        *   `attemptData` (any): Emits the `trigger` data each time an attempt should be made (initial + retries). This MUST be wired to the wrapped component's relevant input.
        *   `result` (any): The successful output (`wrappedOutput`) from the wrapped component after retries succeed.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: The final error (`wrappedError`) if all retries fail or error is not retryable. Includes retry details in `details`.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" } # Augments standard error with retry info in details
            *   `errorType`: One of ["RetryWrapper.MaxRetriesExceeded", "RetryWrapper.NonRetryableError"]
    *   **Required Runtime APIs:**
        *   `get_state()` # To retrieve retry count, original trigger data
        *   `set_state()` # To store retry count, original trigger data
        *   `set_timer()` # To schedule next retry
        *   `log()` # For logging retry attempts
    *   **Testing Considerations:**
        *   **Unit Tests:** Mock downstream component (success/fail). Verify retry attempts, delays, backoff, `retryableErrorTypes` logic, `attemptData` emission, state management.
    *   **Example DSL:**
        ```yaml
        # RetryWrapper step definition
        - step_id: retry-http-call
          component_ref: Reliability.RetryWrapper
          config:
            maxRetries: 3
            delayMs: 500
            backoffMultiplier: 2.0
            retryableErrorTypes: ["HttpCall.NetworkError", "HttpCall.TimeoutError"]
          inputs_map:
            trigger: "trigger.payload" # Data to pass to the first attempt, stored in state

        # Wrapped Component (HttpCall)
        - step_id: make-http-call
          component_ref: StdLib:HttpCall
          config: { url: "'https://api.example.com/resource'", method: GET }
          inputs_map:
            # Receives data for EACH attempt (initial + retries) from the RetryWrapper's 'attemptData' output
            data: "steps.retry-http-call.outputs.attemptData"
          outputs_map: # Connect outputs back to RetryWrapper's INPUT ports
            response: "steps.retry-http-call.inputs.wrappedOutput"
            error: "steps.retry-http-call.inputs.wrappedError"
          run_after: [retry-http-call] # Logically runs after the wrapper initiates an attempt via attemptData

        # Handle final success (after retries)
        - step_id: handle-success
          component_ref: StdLib:Logger # Example handler
          inputs_map:
            data: "steps.retry-http-call.outputs.result" # Final successful result from wrapper
          run_after: [retry-http-call] # Runs only if RetryWrapper emits 'result'

        # Handle final failure (after retries)
        - step_id: handle-failure
          component_ref: StdLib:FailFlow # Example handler
          inputs_map:
            data: "steps.retry-http-call.outputs.error" # Final error object from wrapper
          config: { errorMessageExpression: "'API call failed after retries: ' & data.message" }
          run_after: [retry-http-call] # Runs only if RetryWrapper emits 'error'
        ```

*   **`Reliability.CircuitBreaker`**
    *   **Purpose:** Protects a downstream component from repeated failures by "opening" the circuit. Requires explicit wiring from the wrapped component's outputs back to this component's inputs.
    *   **Behavior:** Operates as a state machine (CLOSED <-> OPEN -> HALF_OPEN -> CLOSED/OPEN) based on success/failure signals and timeouts.
        *   **CLOSED:** Allows requests. Counts consecutive failures. Trips to OPEN on `failureThreshold`. Resets failure count on success.
        *   **OPEN:** Rejects requests immediately (`rejected_error`). Stays OPEN for `resetTimeoutMs`. Transitions to HALF_OPEN after timeout.
        *   **HALF_OPEN:** Allows one test request. If success, transitions to CLOSED (resets failures). If failure, transitions back to OPEN (restarts `resetTimeoutMs`).
    *   **Config:**
        *   `name` (`IdentifierString`, required): Unique identifier for circuit state persistence. Used as state key prefix.
        *   `failureThreshold` (`PositiveInteger`, required): Consecutive failures (in CLOSED state) to trip to OPEN state.
        *   `resetTimeoutMs` (`PositiveInteger`, required): Duration circuit stays OPEN before transitioning to HALF_OPEN.
        *   `rollingWindowSeconds` (`PositiveInteger`, optional): (Future consideration) Window duration for rate-based tripping (alternative mode).
        *   `minimumRequests` (`PositiveInteger`, optional, default: 1): (Future consideration) Min requests in window for rate-based tripping.
    *   **Inputs:** (Explicit)
        *   `request` (any, required): Data for the request. Provided via `inputs_map` to this step.
        *   `successSignal` (any, optional): MUST be connected via `outputs_map` from the *success* output of the wrapped component. Signals successful execution.
        *   `failureSignal` (object, optional): MUST be connected via `outputs_map` from the *error* output of the wrapped component. Signals failed execution. Schema must conform to `StandardErrorStructure`.
    *   **Outputs:**
        *   `allowed_request` (any): Emits the input `request` if circuit is Closed or Half-Open allows test. This MUST be wired to the wrapped component's input.
        *   `rejected_error`:
            *   `is_error_path`: true
            *   `description`: Emits error if circuit is OPEN.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: "CircuitBreaker.OpenCircuitError"
    *   **Required Runtime APIs:**
        *   `get_state()` # To retrieve current state (CLOSED/OPEN/HALF_OPEN), failure count/timestamps
        *   `set_state()` # To update state
        *   `set_timer()` # For resetTimeoutMs
        *   `clear_timer()` # Potentially if manually reset
        *   `log()` # For state transitions
    *   **Testing Considerations:**
        *   **Unit Tests:** Mock Core state/timers, simulate requests/signals. Verify state transitions, failure counting, timeouts, outputs.
    *   **Example DSL:**
        ```yaml
        # CircuitBreaker step definition
        - step_id: cb-wrapper
          component_ref: Reliability.CircuitBreaker
          config:
            name: ExternalServiceCircuit
            failureThreshold: 3
            resetTimeoutMs: 60000
          inputs_map:
            request: "trigger.payload" # Original request data

        # Wrapped Component (HttpCall)
        - step_id: call-external-service
          component_ref: StdLib:HttpCall
          config: { url: "'https://api.example.com/data'", method: GET }
          inputs_map:
            # Receives request data ONLY IF CircuitBreaker allows it via 'allowed_request' output
            data: "steps.cb-wrapper.outputs.allowed_request"
          outputs_map: # Signal outcome back to CircuitBreaker's INPUT ports
            response: "steps.cb-wrapper.inputs.successSignal"
            error: "steps.cb-wrapper.inputs.failureSignal"
          run_after: [cb-wrapper] # Logically runs after CB emits allowed_request

        # Handle circuit rejection (when CB emits rejected_error)
        - step_id: handle-cb-rejection
          component_ref: StdLib:Logger
          inputs_map:
            data: "steps.cb-wrapper.outputs.rejected_error"
          run_after: [cb-wrapper] # Runs only if CB emits rejected_error
        ```

*   **`Reliability.IdempotentReceiver`**
    *   **Purpose:** Ensures input data is processed only once within a scope and TTL based on an extracted ID.
    *   **Config:**
        *   `idExpression` (`ExpressionString`, required): Expression to extract the unique idempotency ID string. Evaluated in sandbox.
        *   `language` (`enum("JMESPath", "JsonPointer")`, optional, default: "JMESPath"): Expression language.
        *   `scope` (`enum("global", "flow", "tenant")`, optional, default: "global"): Uniqueness scope. "tenant" requires tenant context from Core.
        *   `ttlSeconds` (`PositiveInteger`, optional): Time-to-live for the ID state in seconds. Default: infinite. Requires Core state TTL support.
    *   **Inputs:**
        *   `data` (any, required): The input data packet containing the potential ID.
    *   **Outputs:**
        *   `processed` (any): Emits `data` if the extracted ID is new (or expired).
        *   `duplicate` (any, is_error_path=true): Emits `data` if the extracted ID has been seen recently (within TTL). Considered a logical condition, not a system error by default, but routed via error path for conditional branching. Type: `IdempotentReceiver.Duplicate`.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error on expression failure or state management issue.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: One of ["IdempotentReceiver.ExpressionError", "IdempotentReceiver.StateError"]
    *   **Required Runtime APIs:**
        *   `sandbox_execute_expression(language, expression, data_context)`
        *   `get_state(key)` # Key derived from scope and extracted ID
        *   `set_state(key, value, ttlSeconds)` # Key derived, value might be timestamp or flag
        *   `get_tenant_context()` # If scope is "tenant"
    *   **Testing Considerations:**
        *   **Unit Tests:** Mock Core state. Verify routing based on ID uniqueness, scope, TTL. Test invalid `idExpression`.
    *   **Example DSL:**
        ```yaml
        - step_id: check-idempotency
          component_ref: Reliability.IdempotentReceiver
          config:
            idExpression: "headers.'X-Request-ID'" # Extract ID from header
            scope: global
            ttlSeconds: 86400 # 1 day
          inputs_map:
            data: "trigger.payload" # Check payload based on header ID
          # Downstream steps connect to outputs.processed or outputs.duplicate/error
        ```

*   **`Reliability.DlqPublisher`**
    *   **Purpose:** Routes input data to a configured Dead Letter Queue by invoking another publisher component. Facilitates separation of DLQ logic.
    *   **Config:**
        *   `publisherComponent` (`StepIdString`, required): The `step_id` of the downstream component instance responsible for the actual publishing. **In V4.32+, this is typically expected to be an `Integration.ExternalServiceAdapter` step configured with the appropriate plugin (e.g., KafkaAdapter, SqsAdapter).**
        *   `publisherDataInput` (`InputPortNameString`, optional, default: "requestData"): The name of the input port on the `publisherComponent` to send the DLQ message to. Adjusted default to match `ExternalServiceAdapter` convention.
    *   **Inputs:**
        *   `data` (any, required): The data payload to publish to the DLQ. Should typically include the original message and error details.
        *   `publisherSuccess` (any, optional): MUST be connected via `outputs_map` from the *success* output of the component referenced by `publisherComponent`.
        *   `publisherError` (object, optional): MUST be connected via `outputs_map` from the *error* output of the component referenced by `publisherComponent`. Schema must conform to `StandardErrorStructure`.
    *   **Outputs:**
        *   `success` (any): Emitted if the underlying publisher component succeeds. Echoes the `publisherSuccess` input.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Emitted if the underlying publisher fails. Echoes the `publisherError` input.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" } # Error from the underlying publisher
            *   `errorType`: "DlqPublisher.PublishError" # Wrapper error type indicates the DLQ publish itself failed
    *   **Required Runtime APIs:**
        *   Core Runtime implicitly handles routing the `data` input to the specified `publisherComponent`'s configured input port (`publisherDataInput`) and routing the results (`publisherSuccess`/`publisherError`) back to this component's inputs. No specific API call needed by DlqPublisher itself for this routing, but Core needs robust step-to-step communication.
    *   **Testing Considerations:**
        *   **Unit Tests:** Mock the downstream `publisherComponent`. Verify `data` is routed correctly to the mock. Verify `success`/`error` outputs echo the mocked results provided to `publisherSuccess`/`publisherError` inputs.
        *   **Integration Tests:** Requires test DLQ sink and configured publisher component (likely an adapter). Verify data routing and actual publication to DLQ. Test cases where the underlying publisher succeeds and fails.
    *   **Example DSL (Updated for V4.32+ Plugin Model):**
        ```yaml
        - step_id: process-data
          # ... processing logic ...
          outputs_map:
            error: "steps.dlq-sender.inputs.data" # Send error to DlqPublisher

        - step_id: dlq-sender
          component_ref: Reliability.DlqPublisher
          config:
            publisherComponent: "dlq-adapter-publisher" # Refers to the ExternalServiceAdapter step
            publisherDataInput: "requestData" # Target input on adapter
          inputs_map:
            data: "{ original_data: ..., error_details: ... }"
          run_after: [process-data]

        # Use ExternalServiceAdapter with a Kafka plugin for actual publishing
        - step_id: dlq-adapter-publisher
          component_ref: Integration.ExternalServiceAdapter
          config:
            adapterType: KafkaAdapter # Plugin ID for Kafka
            adapterConfig: { bootstrapServers: "{{secrets.kafka_brokers}}", topic: "my-app-dlq" } # Plugin config
            operation: Publish # Operation defined by KafkaAdapter plugin
          inputs_map:
             # Receives DLQ message from dlq-sender
             requestData: "steps.dlq-sender.inputs.data"
          outputs_map: # Echo results back TO dlq-sender's INPUT ports
             responseData: "steps.dlq-sender.inputs.publisherSuccess" # Assuming plugin outputs responseData on success
             error: "steps.dlq-sender.inputs.publisherError"
          run_after: [dlq-sender]

        # Optional: Handle success/failure of the DLQ publish itself
        - step_id: log-dlq-success
          component_ref: StdLib:Logger
          inputs_map: { data: "steps.dlq-sender.outputs.success" }
          run_after: [dlq-sender]
        - step_id: log-dlq-failure
          component_ref: StdLib:Logger
          inputs_map: { data: "steps.dlq-sender.outputs.error" }
          run_after: [dlq-sender]
        ```

**3.3 Integration Components:**

**(Note V4.32):** Several specific integration components previously listed here (`KafkaPublisher`, `SqsPublisher`, `SqsReceiver`, `GrpcCall`, `SftpTransfer`) have been removed from the core StdLib. Their functionality is now provided by dedicated plugins used with the abstract components `Integration.ExternalServiceAdapter` and `Integration.StreamIngestor`. Refer to the "Cascade Standard Component Library: Required Plugin Specifications (Post V4.31 Slimming)" document (or equivalent platform documentation) for details on available plugins.

**(Central Schema Definition for HttpResponse)**
```json
{
  "$id": "#/definitions/schemas/HttpResponse",
  "type": "object",
  "properties": {
    "statusCode": { "type": "integer" },
    "headers": {
      "type": "object",
      "additionalProperties": { "type": "string" }
    },
    "body": {
      "description": "Response body. Object if valid JSON and Content-Type suggests it, otherwise string (potentially Base64 for binary).",
      "oneOf": [
        { "type": "object", "additionalProperties": true },
        { "type": "array" },
        { "type": "string" },
        { "type": "null" }
      ]
    }
  },
  "required": ["statusCode", "headers"]
}
```

*   **`StdLib:HttpCall`**
    *   **Purpose:** Makes an outgoing HTTP request. (Remains a core StdLib component).
    *   **Config:**
        *   `url` (`URLString` | `ExpressionString`, required): Target URL. Expression evaluated in sandbox.
        *   `method` (`enum("GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS")`, optional, default: "GET"): HTTP method.
        *   `headers` (object | `ExpressionString`, optional): Request headers. Keys are strings, values are strings. Values support secret interpolation `{{secrets.my_secret}}`. Expression evaluated in sandbox must yield object.
        *   `bodyExpression` (`ExpressionString`, optional): Expression for request body. Evaluated in sandbox. If omitted, input `data` is used directly (typically JSON serialized by runtime based on `contentType`).
        *   `bodyLanguage` (`enum("JMESPath", "JsonPointer")`, optional, default: "JMESPath"): Language for `bodyExpression`.
        *   `contentType` (`ContentTypeString`, optional, default: "application/json"): `Content-Type` header for request body.
        *   `queryParameters` (object | `ExpressionString`, optional): URL query parameters. Keys are strings, values are strings or list of strings. Expression evaluated in sandbox must yield object.
        *   `timeoutMs` (`PositiveInteger`, optional, default: 5000): Request timeout in milliseconds.
        *   `followRedirects` (boolean, optional, default: false): Whether to follow HTTP 3xx redirects.
    *   **Inputs:**
        *   `data` (any, optional): Context for expressions and default request body.
    *   **Outputs:**
        *   `response`:
            *   `description`: Contains HTTP response details. Status codes < 400.
            *   `schema`: { "$ref": "#/definitions/schemas/HttpResponse" }
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error on network/timeout/expression failure, or response status code >= 400. Includes response details in `details`.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" } # details includes HttpResponse schema
            *   `errorType`: One of ["HttpCall.NetworkError", "HttpCall.TimeoutError", "HttpCall.BadResponseStatus", "HttpCall.ExpressionError"]
    *   **Required Runtime APIs:**
        *   `get_secret()`
        *   `sandbox_execute_expression()` # For url, headers, body, queryParams expressions
        *   `network_http_request(method, url, headers, queryParams, body, timeoutMs, followRedirects)`
        *   `log()`
    *   **Testing Considerations:**
        *   **Unit Tests:** Mock HTTP client. Verify request construction, response/error mapping, timeout handling.
        *   **Integration Tests:** Use mock HTTP server. Verify calls, error handling (network, status codes).
    *   **Security Considerations:** Use Core Secrets for credentials. Validate `url` (SSRF risk - Core should enforce allowlists). Validate input `data` if used in expressions. Restrict allowed hosts via Core config. Sandbox expressions.
    *   **Example DSL:**
        ```yaml
        - step_id: call-api
          component_ref: StdLib:HttpCall
          config:
            url: "'https://api.service.com/users/' & trigger.userId"
            method: GET
            headers: { Authorization: "'Bearer {{secrets.api_token}}'" }
            timeoutMs: 3000
          inputs_map: {} # No specific data needed if URL built from trigger
        ```

*   **`Integration.ExternalServiceAdapter`** (NEW in V3.2)
    *   **Purpose:** Generic interface to diverse external systems (APIs, databases, custom protocols) via pluggable adapters. Abstract StdLib component acts as host.
    *   **Config:**
        *   `adapterType` (`PluginIdentifierString`, required): Identifier for the adapter plugin (e.g., "HttpJsonRestApiV1", "KafkaAdapter", "SqsAdapter", "PostgresSqlAdapter", "SftpAdapter"). Loaded via Core ComponentLoader.
        *   `adapterConfig` (object, required): Plugin-specific config (e.g., base URL, auth secrets, WSDL ref, Kafka brokers, SQS queue URL, DB connection info ref). Structure defined by the plugin's configuration schema. Use Core Secrets.
        *   `operation` (`OperationNameString`, required): Logical action defined by the plugin (e.g., "GetUserBalance", "Publish", "Query", "Execute", "UploadFile"). Checked against plugin metadata if provided. Passed to plugin's execution function.
    *   **Inputs:**
        *   `requestData` (any, required): Data payload for the `operation`, structured per plugin definition for that operation (e.g., Kafka message, SQS message body/attributes, SQL statement/params, file content/metadata). Passed to plugin's execution function.
    *   **Outputs:**
        *   `responseData` (any): Parsed/structured data returned by the external service via the plugin, specific to the `operation` (e.g., Kafka delivery report, SQS message ID, query results, execution status).
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error from interaction (network, protocol, business error, config error). Mapped by plugin to StandardErrorStructure.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: Defined by plugin, prefixed for clarity (e.g., "AdapterError.PluginError", "AdapterError.ServiceError.NotFound", "AdapterError.ConfigError").
    *   **Required Runtime APIs:**
        *   `component_loader_load(adapterType)` # Core loads the specified plugin
        *   `get_secret()` # Used by Core or plugin for adapterConfig secrets
        *   Plugin will use its allowed subset of the Runtime API (e.g., `network_http_request`, `log`, `get_state`, `set_timer`, `filesystem_read`/`filesystem_write` if needed and declared) passed during execution. Core invokes the plugin's execution method.
    *   **Testing Considerations:**
        *   **Unit Tests:** Test StdLib component logic: plugin loading, config/input passing to mock plugin, error mapping from mock plugin.
        *   **Integration Tests:** Requires a Core Runtime with registered adapter plugins and potentially access to the actual external service or a mock of it. Test interactions with different `adapterType` plugins and various `operation`s. Verify request/response data mapping and error handling as defined by the plugin. *Detailed integration logic is tested separately by the plugin developer.*
    *   **Security Considerations:** Use Core Secrets in `adapterConfig`. Plugins *must* declare capabilities required (network, state, filesystem, etc.). Restrict network access via Core policies. Validate inputs within plugin. Ensure plugin maps errors correctly, avoiding sensitive data leaks. Ensure file paths (if used by plugins like SFTP) are constrained.
    *   **Example DSL:** (Using adapter for a generic external API)
        ```yaml
        - step_id: get-user-balance
          component_ref: Integration.ExternalServiceAdapter
          config:
            adapterType: "MyGamingProviderWalletAdapter" # Plugin ID
            adapterConfig: { baseUrl: "https://wallet.provider.com/api", apiKeySecret: "gaming_api_key" }
            operation: "GetBalance" # Logical operation defined by the adapter plugin
          inputs_map:
            # Structure required by the 'GetBalance' operation of this specific plugin
            requestData: { userId: trigger.userId, currency: "USD" }
        ```
    *   **Note V4.32+:** This component is now the primary way to interact with external systems like Kafka, SQS, gRPC, SFTP, databases (SQL, NoSQL), and other APIs, replacing the specific components deprecated in V4.32. Relies on loading the appropriate `adapterType` plugin.

*   **`Integration.StreamIngestor`** (NEW in V3.2 - Primarily for Triggers)
    *   **Purpose:** Consumes messages from a continuous data stream source (Kafka, SQS, Kinesis, etc.) via a pluggable adapter. Primarily used as a Trigger source but could potentially be controlled mid-flow.
    *   **Config:**
        *   `sourceType` (`PluginIdentifierString`, required): Identifier for the stream source adapter plugin (e.g., "KafkaConsumer", "SqsConsumer", "KinesisConsumer"). Loaded via Core ComponentLoader.
        *   `sourceConfig` (object, required): Plugin-specific config (e.g., brokers/topic/groupId, queue URL, stream ARN/shardIterators). Structure defined by plugin schema. Use Core Secrets.
        *   `outputFormat` (`enum("Raw", "JsonParsed", "AvroDecoded")`, optional, default: "JsonParsed"): Hint for output processing by the plugin/runtime. "AvroDecoded" might require schema registry config in `sourceConfig`.
        *   `ackMode` (`enum("AutoOnSuccess", "Manual", "None")`, optional, default: "AutoOnSuccess"): Message acknowledgement behavior.
            *   `AutoOnSuccess`: Core/Plugin ACKs automatically after downstream flow completes successfully.
            *   `Manual`: Flow must explicitly call `Integration.AckMessage`. Requires `metadata` output containing necessary ack info (e.g., `receiptHandle`, offset).
            *   `None`: No acknowledgement performed (use with caution).
    *   **Inputs:** (Control inputs like `start`/`stop` if used mid-flow, not standard message processing).
    *   **Outputs (as Trigger Output or Component Output - Core handles trigger mechanism):**
        *   `message` (any): Consumed message payload, processed according to `outputFormat`.
        *   `metadata` (object): Source-specific metadata (e.g., Kafka offset/partition/key, SQS receiptHandle/messageId, Kinesis sequenceNumber). Structure defined by plugin. Contains necessary info for `Integration.AckMessage` if `ackMode` is "Manual".
        *   `error`: (Reported via Core Trigger monitoring or component error output if run mid-flow)
            *   `is_error_path`: true
            *   `description`: Error during connection/consumption/processing (e.g., connection lost, deserialization failure). Mapped by plugin.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: Defined by plugin (e.g., "StreamIngestorError.PluginError", "StreamIngestorError.ConnectionError", "StreamIngestorError.DeserializationError").
    *   **Required Runtime APIs:**
        *   `component_loader_load(sourceType)` # Core loads the plugin
        *   `get_secret()` # For secrets in sourceConfig
        *   `trigger_flow()` (if used as trigger, passing message/metadata)
        *   `get_state()` / `set_state()` # Plugin might use this for offset management, etc. (must declare capability)
        *   Plugin will use its allowed subset of Runtime API (e.g., network, log). Core manages the trigger loop or component lifecycle. Core/Plugin handles acknowledgement based on `ackMode` and flow outcome/explicit AckMessage call.
    *   **Testing Considerations:**
        *   **Unit Tests:** Test StdLib component logic: plugin loading, config passing, lifecycle (if applicable), error mapping (mock plugin).
        *   **Integration Tests:** Requires a Core Runtime with registered ingestor plugins and access to the actual stream source or a mock. Verify connection, message reception, `outputFormat` processing, and acknowledgement based on `ackMode`. Test connection failures, message processing errors within the plugin. Test interaction with `Integration.AckMessage`. *Detailed stream protocol handling is tested separately by the plugin developer.*
    *   **Security Considerations:** Use Core Secrets in `sourceConfig`. Plugins must declare capabilities. Restrict network access. Validate raw payloads within plugin. Ensure correct error handling/acknowledgement logic to prevent data loss or duplicate processing.
    *   **Note V4.32+:** This component is now the primary way to consume from streaming sources like Kafka, SQS, Kinesis, etc., replacing specific receiver components deprecated in V4.32. Relies on loading the appropriate `sourceType` plugin. Can be used as a trigger source.

*   **`Integration.AckMessage`** (NEW in V3.2 Concept)
    *   **Purpose:** Explicitly acknowledges (ACKs) or negatively acknowledges (NACKs) a message received via `Integration.StreamIngestor` when `ackMode` is set to "Manual".
    *   **Config:** None.
    *   **Inputs:**
        *   `ackInfo` (object, required): Metadata object received from the `Integration.StreamIngestor` output (`metadata` port). This object contains the necessary identifiers (e.g., SQS `receiptHandle`, Kafka offset/partition/topic, Kinesis sequenceNumber) for the originating plugin to perform the ACK/NACK. Schema depends on the `StreamIngestor` source plugin.
        *   `ackDecision` (`enum("ACK", "NACK")`, required): Whether to acknowledge ("ACK") or negatively acknowledge ("NACK") the message. "NACK" typically makes the message visible again for reprocessing according to the source system's rules.
    *   **Outputs:**
        *   `success`:
            *   `description`: True if the acknowledgement/NACK operation was successfully communicated to the source system via the originating ingestor plugin. Does not guarantee the operation's final effect, just successful communication.
            *   `schema`: { "type": "boolean", "const": true }
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error if the ACK/NACK operation fails (e.g., invalid `ackInfo`, communication error with the source system via the plugin, receipt handle expired).
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: "AckMessage.OperationError" or potentially more specific from plugin (e.g., "AckMessage.InvalidAckInfo", "AckMessage.PluginError").
    *   **Required Runtime APIs:**
        *   `correlate_and_call_plugin_method(ackInfo, "performAck", ackDecision)` # Conceptual API - Core Runtime needs to identify the specific `StreamIngestor` plugin instance associated with the `ackInfo` (likely via internal correlation established when the message was initially delivered) and invoke a method (e.g., `performAck`) on that plugin instance, passing the `ackInfo` and `ackDecision`.
        *   `log()`
    *   **Testing Considerations:**
        *   **Integration Tests:** Must be tested in conjunction with `Integration.StreamIngestor` configured with `ackMode: "Manual"`.
            *   Verify `StreamIngestor` outputs correct `ackInfo` in its `metadata`.
            *   Verify wiring `Integration.AckMessage` correctly sends ACK/NACK decisions.
            *   Verify interaction with the source system: ACKed messages are removed/committed; NACKed messages become available again (requires observing the source message queue/stream).
            *   Test error conditions (e.g., invalid `ackInfo`, expired receipt handle).
    *   **Security Considerations:** Ensure `ackInfo` cannot be tampered with between `StreamIngestor` and `AckMessage`. The Core's correlation mechanism must be secure, ensuring only the flow processing a specific message can ACK/NACK it.

**(Central Schema Definition for SqsMessage - Kept for reference if SQS plugins use it)**
```json
{
  "$id": "#/definitions/schemas/SqsMessage",
  "type": "object",
  "properties": {
    "body": { "type": "string" }, // Raw body
    "parsedBody": { "description": "Optional: Core attempts JSON parse of body. Null on failure." },
    "attributes": { "type": "object", "description": "Standard SQS attributes requested." },
    "messageAttributes": { "type": "object", "description": "Custom SQS message attributes requested." },
    "metadata": {
      "type": "object",
      "properties": {
        "MessageId": { "type": "string" },
        "ReceiptHandle": { "type": "string" }, // Crucial for manual delete/ack/visibility change
        "MD5OfBody": { "type": "string" },
        "QueueUrl": { "type": "string" },
        "Region": { "type": "string" }
      },
      "required": ["MessageId", "ReceiptHandle", "MD5OfBody"]
    }
  },
  "required": ["body", "metadata"]
}
```

**3.4 Data Handling & Transformation:**

**(Note V4.32):** Components `DataMapper`, `Data:Query`, and `Data:Execute` are deprecated and removed from this section. Use `StdLib:MapData`, `Data:Transform`, or `Integration.ExternalServiceAdapter` with appropriate plugins for these functionalities.

*   **`StdLib:JsonSchemaValidator`**
    *   **Purpose:** Validates input data against a JSON Schema definition.
    *   **Config:**
        *   `schema` (`JsonSchemaObject`, required): The JSON Schema object used for validation. Can be inline or potentially referenced via `$ref` if Core supports schema loading.
    *   **Inputs:**
        *   `data` (any, required): The input data to validate.
    *   **Outputs:**
        *   `validData` (any): Emits the original input `data` if it conforms to the schema.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Validation failed. The `details` field contains an array of specific validation error objects (e.g., `{path: "...", message: "..."}`). Also covers errors loading/parsing the schema itself.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" } # `details` field is array of validation errors
            *   `errorType`: One of ["JsonSchemaValidator.ValidationError", "JsonSchemaValidator.SchemaError"]
    *   **Required Runtime APIs:**
        *   `json_schema_validate(schema, data)` # Core needs access to a JSON Schema validation library
    *   **Testing Considerations:**
        *   **Unit Tests:** Verify validation results for various valid/invalid data structures against different schemas (required fields, types, patterns, enums, nesting). Test schema parsing errors. Check `details` field in error output.
    *   **Security Considerations:** While schema definitions are generally safe, overly complex schemas could potentially lead to performance issues (ReDoS-like complexity) in the validation library. Ensure the library used is robust.
    *   **Example DSL:**
        ```yaml
        - step_id: validate-payload
          component_ref: StdLib:JsonSchemaValidator
          config:
            schema:
              type: object
              properties:
                userId: { type: string, format: uuid }
                amount: { type: number, minimum: 0 }
                items: { type: array, minItems: 1, items: { type: string } }
              required: [userId, amount, items]
          inputs_map:
            data: "trigger.payload"
          # Downstream steps connect to outputs.validData or outputs.error
        ```

*   **`StdLib:DataSerializer`**
    *   **Purpose:** Converts an in-memory data structure (object/array) into a serialized byte representation (e.g., JSON string, Protobuf bytes).
    *   **Config:**
        *   `format` (`enum("json", "protobuf", "avro", "xml", "yaml")`, required): Target serialization format. Requires corresponding library/support in Core.
        *   `schemaRef` (`ResourceIdentifierString`, optional): Schema reference (e.g., path to `.proto` or `.avsc` file, registry ID) required by formats like Protobuf or Avro.
        *   `contentType` (`ContentTypeString`, optional): Suggested `Content-Type` header value for the resulting bytes (e.g., "application/protobuf", "application/avro", "application/xml"). If not provided, a default based on `format` may be used (e.g., "application/json").
    *   **Inputs:**
        *   `data` (any, required): The in-memory data structure (object, array) to serialize. Must be compatible with the specified `format` and `schemaRef` if provided.
    *   **Outputs:**
        *   `bytes` (bytes): The serialized data as raw bytes.
        *   `contentType` (string): The determined `contentType` (either from config or default).
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error during serialization (e.g., data incompatible with schema, schema load failure).
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: One of ["DataSerializer.SerializationError", "DataSerializer.SchemaLoadError", "DataSerializer.UnsupportedFormat"]
    *   **Required Runtime APIs:**
        *   `resource_loader_read(schemaRef)` # If schema needed (e.g., for Protobuf, Avro)
        *   `data_serializer_serialize(format, schemaContent, data)` # Conceptual API using appropriate library (JSON stringify, Proto/Avro encoder)
        *   `log()`
    *   **Testing Considerations:**
        *   **Unit Tests:** Verify serialization for different formats (JSON, Proto, etc.) and various valid input structures. Test with schema validation (if applicable). Test error cases (invalid data, missing schema). Verify correct `contentType` output.
    *   **Example DSL:** (Serializing to Protobuf)
        ```yaml
        - step_id: serialize-to-protobuf
          component_ref: StdLib:DataSerializer
          config:
            format: protobuf
            schemaRef: "schemas/user_event.proto" # Reference the schema definition
            contentType: "application/protobuf"
          inputs_map:
            # Assumes 'userEventData' is an object matching the structure in user_event.proto
            data: "steps.prepare-user-event.outputs.userEventData"
        ```

*   **`StdLib:DataDeserializer`**
    *   **Purpose:** Converts a serialized byte representation (e.g., JSON string, Protobuf bytes) into an in-memory data structure (object/array).
    *   **Config:**
        *   `format` (`enum("json", "protobuf", "avro", "xml", "yaml")`, required): Source byte format. Requires corresponding library/support in Core.
        *   `schemaRef` (`ResourceIdentifierString`, optional): Schema reference (e.g., path to `.proto` or `.avsc` file, registry ID) required by formats like Protobuf or Avro.
    *   **Inputs:**
        *   `bytes` (bytes, required): Byte data to deserialize.
        *   `contentType` (`ContentTypeString`, optional): `Content-Type` hint provided with the bytes. May influence `format` detection if ambiguous or potentially override `config.format` (behavior defined by Core).
    *   **Outputs:**
        *   `data` (any): The deserialized data structure (object, array).
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error during deserialization (e.g., malformed input bytes, data incompatible with schema, schema load failure).
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: One of ["DataDeserializer.DeserializationError", "DataDeserializer.SchemaLoadError", "DataDeserializer.UnsupportedFormat"]
    *   **Required Runtime APIs:**
        *   `resource_loader_read(schemaRef)` # If schema needed
        *   `data_deserializer_deserialize(format, schemaContent, bytes, contentTypeHint)` # Conceptual API using appropriate library (JSON parse, Proto/Avro decoder)
        *   `log()`
    *   **Testing Considerations:**
        *   **Unit Tests:** Verify deserialization for different formats using valid byte inputs. Test with schema validation (if applicable). Test error cases (invalid bytes, mismatched schema). Test influence of `contentType` hint.
    *   **Example DSL:** (Deserializing JSON)
        ```yaml
        - step_id: deserialize-json-message
          component_ref: StdLib:DataDeserializer
          config:
            format: json
            # No schemaRef needed for standard JSON
          inputs_map:
            bytes: "trigger.messageBytes" # Assume trigger provides raw bytes
            contentType: "trigger.contentType" # Pass hint if available
        ```

*   **`Data:Transform`**
    *   **Purpose:** Generic data transformation using inline code snippets (JavaScript, Python) or templating engines, executed within a secure sandbox.
    *   **Config:**
        *   `language` (`enum("javascript", "python", "template")`, required): Transformation language/type. Requires corresponding sandbox/engine support in Core.
        *   `code` (`CodeString`, required if `language` is "javascript" or "python"): Inline code snippet. *Must* be executed in a secure sandbox by the Core Runtime. The code typically expects a function (e.g., `transform(data)`) or a context object.
        *   `template` (`TemplateString`, required if `language` is "template"): Inline template content.
        *   `templateEngine` (`enum("Handlebars", "Liquid", "Jinja2")`, required if `language`="template"): Template engine to use. Requires corresponding engine support in Core.
    *   **Inputs:**
        *   `data` (any, required): Input data made available to the code/template context (e.g., as argument to function or root context variable).
    *   **Outputs:**
        *   `result` (any): The result returned by the transformation code or rendered by the template.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error during code compilation/execution or template rendering (syntax error, runtime error, engine error).
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: One of ["Data.Transform.CodeError", "Data.Transform.TemplateError", "Data.Transform.SandboxError"]
    *   **Required Runtime APIs:**
        *   `sandbox_execute_code(language, code, dataContext)` # Securely executes JS/Python
        *   `template_render(engine, template, dataContext)` # Renders template using specified engine
        *   `log()`
    *   **Testing Considerations:**
        *   **Unit Tests:** Verify execution of simple code/templates. Test input data access within the context, output generation. Test invalid code/templates, runtime errors within the snippet.
    *   **Security Considerations:** Critical to have a robust and secure sandboxing mechanism provided by the Core Runtime for executing `code`. Template engines should also be configured securely (e.g., disable file access, limit dangerous filters/tags). Validate input `data` before passing it to potentially complex transformations.
    *   **Example DSL:** (Using JavaScript)
        ```yaml
        - step_id: normalize-address-js
          component_ref: Data:Transform
          config:
            language: javascript
            code: |
              function transform(address) {
                // Example: Basic normalization
                let normalized = { ...address }; // Copy input
                normalized.street = address.street ? address.street.toUpperCase() : null;
                normalized.country = address.country ? address.country.toUpperCase() : 'UNKNOWN';
                // Add more complex logic here
                return normalized;
              }
              // Core Runtime expected to call transform(input.data)
          inputs_map:
            data: "steps.prev_step.outputs.addressObject"
        ```

**3.5 State Management & Long-Running Processes:**

*   **`StdLib:WaitForDuration`**
    *   **Purpose:** Pauses flow execution for a specified duration.
    *   **Config:**
        *   `durationMs` (`PositiveInteger` | `ExpressionString`, required): Wait duration in milliseconds. Expression evaluated in sandbox.
        *   `durationLanguage` (`enum("JMESPath", "JsonPointer")`, optional, default: "JMESPath"): Language for `durationMs` expression.
    *   **Inputs:**
        *   `data` (any, optional): Input data to be preserved during the wait and emitted upon completion. Also used as context for `durationMs` expression.
    *   **Outputs:**
        *   `data` (any): The original input `data` emitted after the duration expires.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error evaluating `durationMs` expression or internal timer/state error.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: One of ["WaitForDuration.ExpressionError", "WaitForDuration.StateError"]
    *   **Required Runtime APIs:**
        *   `sandbox_execute_expression()` # For duration expression
        *   `set_timer(durationMs, stateToPreserve)` # Core schedules resumption
        *   `set_state()` / `get_state()` # Core implicitly uses state to store `data` and timer context
    *   **Testing Considerations:**
        *   **Integration Tests:** Requires Core state/timers. Verify flow suspends and resumes after the correct duration. Verify `data` is preserved. Test different durations, including expressions. Test expression errors.
    *   **Example DSL:**
        ```yaml
        - step_id: wait-for-downstream-system
          component_ref: StdLib:WaitForDuration
          config:
            durationMs: 15000 # Wait for 15 seconds
          inputs_map:
            # Preserve some context data during the wait
            data: "{ orderId: steps.start-processing.outputs.orderId, status: 'WAITING' }"
        ```

*   **`StdLib:WaitForTimestamp`**
    *   **Purpose:** Pauses flow execution until a specific future timestamp is reached.
    *   **Config:**
        *   `timestampExpression` (`ExpressionString` | `ISO8601Timestamp` | `PositiveInteger`, required): An absolute future timestamp. Can be provided directly as an ISO 8601 string or epoch milliseconds integer, or as an expression evaluating to one of these. Evaluated in sandbox if expression.
        *   `language` (`enum("JMESPath", "JsonPointer")`, optional, default: "JMESPath"): Language for `timestampExpression`.
    *   **Inputs:**
        *   `data` (any, required): Input data to be preserved during the wait and emitted upon completion. Also used as context for `timestampExpression`.
    *   **Outputs:**
        *   `data` (any): The original input `data` emitted after the specified timestamp is reached.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error if the `timestampExpression` fails, evaluates to an invalid format, or represents a time in the past. Also covers internal timer/state errors.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: One of ["WaitForTimestamp.ExpressionError", "WaitForTimestamp.InvalidTimestamp", "WaitForTimestamp.StateError"]
    *   **Required Runtime APIs:**
        *   `sandbox_execute_expression()` # For timestamp expression
        *   `parse_timestamp()` # Runtime needs to parse the resolved timestamp
        *   `set_timer_at(absoluteTimestamp, stateToPreserve)` # Conceptual API for specific time
        *   `set_state()` / `get_state()` # Core implicitly uses state to store `data` and timer context
    *   **Testing Considerations:**
        *   **Integration Tests:** Requires Core state/timers. Verify suspension and resumption occur accurately at the target timestamp. Test different timestamp formats and expressions. Test error cases (invalid/past timestamp, expression failure). Verify data preservation.
    *   **Example DSL:**
        ```yaml
        - step_id: wait-until-business-hours
          component_ref: StdLib:WaitForTimestamp
          config:
            # Example expression calculating next 9 AM UTC
            timestampExpression: "next_business_day_start_utc('09:00')"
          inputs_map:
            data: "trigger.payload" # Preserve original event data
        ```

*   **`StdLib:WaitForExternalEvent`**
    *   **Purpose:** Pauses flow execution, waiting for a specific external event to be delivered via the Core Runtime's event correlation mechanism. Resumes when an event matching the correlation criteria arrives or a timeout occurs.
    *   **Config:**
        *   `correlationIdExpression` (`ExpressionString`, required): Expression evaluating to the unique correlation ID string. This ID must be present in the external event that resumes the flow. Evaluated in sandbox.
        *   `language` (`enum("JMESPath", "JsonPointer")`, optional, default: "JMESPath"): Language for `correlationIdExpression`.
        *   `timeoutMs` (`PositiveInteger`, optional): Maximum time in milliseconds to wait for the event. If reached before the event arrives, the `error` output (`WaitForExternalEvent.Timeout`) is triggered. Default: infinite (no timeout). Requires Core Timers.
        *   `eventType` (`EventTypeString`, optional): Optionally filter incoming external events by a specific type name, in addition to the `correlationId`. Requires Core support for typed event correlation.
    *   **Inputs:**
        *   `data` (any, required): Input data to be preserved during the wait. Also used as context for `correlationIdExpression`.
    *   **Outputs:**
        *   `eventData` (any): The data payload carried by the matching external event that resumed the flow. Delivered by Core.
        *   `preservedData` (any): The original input `data` that was preserved during the wait.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error if `correlationIdExpression` fails, the `timeoutMs` is reached before an event arrives, or an internal state/subscription error occurs.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: One of ["WaitForExternalEvent.ExpressionError", "WaitForExternalEvent.Timeout", "WaitForExternalEvent.StateError", "WaitForExternalEvent.SubscriptionError"]
    *   **Required Runtime APIs:**
        *   `sandbox_execute_expression()` # For correlationId expression
        *   `event_subscribe(correlationId, eventType)` # Conceptual API: Core registers interest in an event with this ID/type
        *   `set_timer()` # For timeoutMs, if configured
        *   `clear_timer()` # If event arrives before timeout
        *   `set_state()` / `get_state()` # To store preservedData and subscription context
        *   Core Runtime needs an event bus/correlation mechanism to receive external events (e.g., via API call, message queue) and deliver them to waiting flows based on `correlationId` / `eventType`.
    *   **Testing Considerations:**
        *   **Integration Tests:** Requires Core state, timers, and event correlation mechanism.
            *   Verify flow suspension upon execution.
            *   Simulate an external event arriving with the correct `correlationId` (and `eventType` if used); verify flow resumption and correct `eventData`/`preservedData` outputs.
            *   Test the `timeoutMs` scenario; verify the `error` output is triggered correctly.
            *   Test invalid `correlationIdExpression`.
    *   **Security Considerations:** Ensure `correlationId` is unique and not easily guessable if security relies on it. The Core event correlation mechanism should validate the source of external events if possible.
    *   **Example DSL:**
        ```yaml
        - step_id: initiate-manual-approval
          # ... (e.g., send notification with approval link containing orderId) ...
          outputs_map: { result: "steps.wait-for-approval.inputs.data" }

        - step_id: wait-for-approval
          component_ref: StdLib:WaitForExternalEvent
          config:
            # Correlation ID is the order ID expected in the approval event
            correlationIdExpression: "data.orderId"
            timeoutMs: 604800000 # Wait up to 7 days
            eventType: "ManualApprovalResult" # Optional: only listen for this type
          inputs_map:
            # Data contains orderId needed for correlation expression,
            # and other details to preserve
            data: "{ orderId: steps.initiate-manual-approval.outputs.result.orderId, originalRequest: trigger.payload }"
          # Outputs: eventData (payload from approval event), preservedData
        ```

*   **`StdLib:SagaCoordinator`**
    *   **(REFINED in V4.2)** **Purpose:** Orchestrates distributed transactions (Sagas) where the sequence of forward steps and their corresponding compensation steps are **defined directly within this component's configuration using native Cascade DSL constructs.** It manages the Saga state (current step, context) and triggers compensation on failure, relying on Core Runtime for step execution and state persistence.
    *   **Config:**
        *   `compensationMethod` (`enum("BackwardRecovery", "ForwardRecovery")`, optional, default: "BackwardRecovery"):
            *   `BackwardRecovery`: On failure, execute compensation steps in reverse order for all completed forward steps.
            *   `ForwardRecovery`: (Less common) On failure, try to proceed with alternative forward steps to reach a successful end state. Requires more complex `steps` definition (not fully specified here).
        *   `steps` (list<`SagaStepDefinition`>, required): Defines the ordered sequence of Saga steps. Schema for each item in the list (`SagaStepDefinition`):
            *   `stepName` (`IdentifierString`, required): Unique name for this step within the Saga. Used for logging and state tracking.
            *   `forward` (`ComponentInvocationDefinition`, required): Definition of the forward operation. Core Runtime executes this.
                *   `component_ref` (`ComponentRefString`, required): Reference to the Cascade component implementing the forward step's logic.
                *   `inputs_map` (object, optional): Mapping of Saga context/startData to the forward component's inputs. Use `saga.startData` (initial input to coordinator) and `saga.context` (accumulated state). Example: `{ userId: "saga.startData.userId", reservationId: "saga.context.reservationId" }`.
                *   `outputs_map` (object, optional): Mapping of the forward component's *success* output back into the `saga.context` object (e.g., `{ stepOutput: "saga.context.myStepResult" }`). The coordinator updates its state with this context.
            *   `compensation` (`ComponentInvocationDefinition`, optional): Definition of the compensation operation. Required if `compensationMethod` is "BackwardRecovery". Core Runtime executes this on failure.
                *   `component_ref` (`ComponentRefString`, required): Reference to the Cascade component implementing the compensation step's logic.
                *   `inputs_map` (object, optional): Mapping of Saga context/startData/forward step error to the compensation component's inputs. Use `saga.startData`, `saga.context`, and `saga.error` (the StandardErrorStructure from the failed forward step). Example: `{ reservationId: "saga.context.reservationId", failureReason: "saga.error.message" }`.
                *   `outputs_map` (object, optional): Mapping of the compensation component's *success* output back into the `saga.context` (e.g., `{ compensationStatus: "saga.context.myStepCompensationStatus" }`). Less common, but allows tracking compensation outcome.
    *   **Inputs:**
        *   `startSaga` (object, required): Input data object to initiate the Saga. Accessible within step mappings via `saga.startData`. The coordinator maintains a `saga.context` object internally, initialized as empty or potentially with `startData`.
    *   **Outputs:** (`SagaResultObject` schema includes common fields: `status`, `sagaName?`, `instanceId?`, `startData`, `finalContext`, `failedStep?`, `failureError?`, `compensationDetails?`)
        *   `sagaCompleted` (`SagaResultObject`): Emitted when all forward steps complete successfully. Contains `status: "COMPLETED"`, `startData`, and the final `context`.
        *   `sagaCompensated` (`SagaResultObject`): Emitted when a forward step fails and all necessary compensations complete successfully. Contains `status: "COMPENSATED"`, `startData`, the final `context` after compensation, `failedStep` (name), and the `failureError` (StandardErrorStructure) from the failed forward step.
        *   `sagaFailed`:
             * `is_error_path`: true
             * `description`: Emitted if a forward step fails AND its corresponding compensation step also fails (unrecoverable).
             * `schema`: `SagaResultObject` extending `StandardErrorStructure`. Contains `status: "FAILED"`, `startData`, `context` at time of failure, `failedStep`, `failureError`, `failedCompensationStep` (name), `compensationError`.
             * `errorType`: One of ["SagaCoordinator.CompensationFailed", "SagaCoordinator.DefinitionError", "SagaCoordinator.InternalError"]
    *   **Required Runtime APIs:**
        *   `get_state()` # Track saga progress (current step index, saga context)
        *   `set_state()` # Update saga progress after each step/compensation
        *   `execute_component(component_ref, inputs)` # Core executes the forward/compensation steps defined in config, handling input/output mapping based on SagaCoordinator's interpretation of `inputs_map`/`outputs_map`.
        *   `log()` # Log step execution, failures, compensations.
    *   **Testing Considerations:**
        *   **Integration Tests:** Requires Core state/orchestration. Mock or implement the components referenced in `forward` and `compensation` steps. Test various scenarios:
            *   All forward steps succeed.
            *   Forward step fails, compensation succeeds.
            *   Forward step fails, compensation fails.
            *   Failure on different steps in the sequence.
            *   Verify `saga.context` propagation between steps.
            *   Test `compensationMethod` variations if applicable.
    *   **Use Case:** Defining Saga logic natively within the Cascade flow definition, especially for simpler or flow-specific Sagas where external orchestration engines are overkill. Provides a fully self-contained Saga implementation within the platform.
    *   **Example DSL:**
        ```yaml
        - step_id: coordinate-native-order-saga
          component_ref: StdLib:SagaCoordinator
          config:
            compensationMethod: BackwardRecovery
            steps:
              - stepName: ReserveInventory
                forward:
                  component_ref: comp-reserve-inventory # Assumes component definition exists elsewhere
                  inputs_map:
                    productId: "saga.startData.productId"
                    quantity: "saga.startData.quantity"
                  outputs_map:
                    # Map output 'reservationId' from comp-reserve-inventory to saga context
                    reservationId: "saga.context.inventoryReservationId"
                compensation:
                  component_ref: comp-release-inventory
                  inputs_map:
                    # Use context saved by forward step for compensation
                    reservationId: "saga.context.inventoryReservationId"
              - stepName: ProcessPayment
                forward:
                  component_ref: comp-process-payment
                  inputs_map:
                    amount: "saga.startData.amount"
                    customerId: "saga.startData.customerId"
                    # Could also use context: inventoryReservationId: "saga.context.inventoryReservationId"
                  outputs_map:
                    transactionId: "saga.context.paymentTransactionId"
                    paymentStatus: "saga.context.paymentStatus"
                compensation:
                  component_ref: comp-refund-payment
                  inputs_map:
                    transactionId: "saga.context.paymentTransactionId"
                    # Pass original error if needed: originalError: "saga.error"
          inputs_map:
            # Map trigger data containing order details to startSaga input
            startSaga: "trigger.orderData"
          # Outputs: sagaCompleted, sagaCompensated, sagaFailed (error path)
          # Downstream steps handle these outcomes
        ```

*   **`StdLib:ExternalWorkflowCoordinator`**
    *   **(NEW in V4.2)** **Purpose:** Initiates, monitors, and potentially interacts (signals, queries) with workflows or Sagas that are **defined and executed by external systems or engines** (e.g., AWS Step Functions, Temporal, Azure Logic Apps, Camunda). Acts as a client or adapter to these external systems via specific plugins loaded by Core.
    *   **Config:**
        *   `engineType` (`PluginIdentifierString`, required): Identifier for the external engine adapter plugin to use (e.g., "AWS_StepFunctions", "Temporal", "AzureLogicApps", "CustomHttpWorkflow"). Core uses this to load the correct plugin.
        *   `engineConfig` (object, required): Configuration specific to the chosen `engineType` plugin (e.g., API endpoints, authentication secrets refs, region, namespace). Structure defined by the plugin's configuration schema. Use Core Secrets for sensitive values.
        *   `operation` (`OperationNameString`, required): The action to perform via the plugin (e.g., "StartExecution", "StartWorkflow", "SignalWorkflow", "GetExecutionStatus", "TerminateWorkflow"). Defined and implemented by the plugin.
        *   `definitionIdentifier` (`ResourceIdentifierString` | `ExpressionString`, required for start operations): Identifier for the specific workflow/state machine definition in the external system (e.g., Step Functions ARN, Temporal Workflow Type/ID, Logic App Workflow ID). Expression evaluated in sandbox using `triggerData`.
        *   `executionParameters` (object | `ExpressionString`, optional): Parameters or input payload to pass to the external workflow execution, structured according to the target engine and plugin definition. Expression evaluated in sandbox using `triggerData`.
        *   `waitForCompletion` (boolean, optional, default: false): Whether this component should wait (block the flow) for the external workflow to complete before producing its primary output (`result` or `error` reflecting external failure). Requires plugin support for polling or callbacks.
        *   `timeoutMs` (`PositiveInteger`, optional): Timeout in milliseconds *only if* `waitForCompletion` is true. If timeout occurs while waiting, triggers error output.
        *   `parametersLanguage` (`enum("JMESPath", "JsonPointer")`, optional, default: "JMESPath"): Language for evaluating expressions in `definitionIdentifier` and `executionParameters`.
    *   **Inputs:**
        *   `triggerData` (object, optional): Context data used for evaluating expressions in the config (`definitionIdentifier`, `executionParameters`).
    *   **Outputs:**
        *   `executionReference` (object): Information identifying the initiated or interacted-with external execution (e.g., `{ executionArn: "..." }`, `{ workflowId: "...", runId: "..." }`). Emitted immediately (unless `waitForCompletion` is true and it succeeds/fails quickly). Schema defined by plugin based on `engineType`.
        *   `result` (any): The final result payload returned by the external workflow, *only if* `waitForCompletion` is true and the external workflow completes *successfully*. Structure depends on the external engine and plugin mapping.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error occurred during interaction with the external engine. This could be an API call failure, authentication error, definition not found, timeout while waiting (`waitForCompletion`=true), or an explicit failure status reported by the external engine (`waitForCompletion`=true). Mapped by the plugin to StandardErrorStructure.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" } # `details` might contain engine-specific error info.
            *   `errorType`: Defined by plugin, e.g., ["ExternalWorkflowCoordinator.PluginError", "ExternalWorkflowCoordinator.EngineError.NotFound", "ExternalWorkflowCoordinator.Timeout", "ExternalWorkflowCoordinator.ExecutionFailed", "ExternalWorkflowCoordinator.ConfigError", "ExternalWorkflowCoordinator.ExpressionError"].
    *   **Required Runtime APIs:**
        *   `component_loader_load(engineType)` # Core loads the plugin
        *   `get_secret()` # For secrets in engineConfig
        *   `sandbox_execute_expression()` # For config expressions
        *   Plugin uses its allowed Runtime API subset (e.g., `network_http_request` to call engine API, `set_timer`/`clear_timer` for polling if `waitForCompletion`=true, `log`, potentially `get_state`/`set_state` for complex polling). Core invokes plugin's operation method.
    *   **Testing Considerations:**
        *   **Unit Tests:** Test component logic: config parsing, expression evaluation, plugin loading, input/output mapping by mocking the loaded plugin interface.
        *   **Integration Tests:** Requires Core Runtime with the relevant adapter plugin registered. Needs access to the target external engine (or a well-behaved mock). Test different `operation`s (`StartExecution`, `SignalWorkflow`, etc.). Test `waitForCompletion` (true/false) behavior, including success, external failure, and timeout scenarios. Verify parameter passing and result/error mapping.
    *   **Use Case:** Integrating Cascade flows with existing external workflow systems (Step Functions, Temporal, etc.), leveraging specialized engines for complex, long-running, or externally managed orchestration logic while using Cascade for the surrounding integration, event handling, and simpler sub-tasks.
    *   **Example DSL:** (Starting AWS Step Functions Execution)
        ```yaml
        - step_id: start-sfn-order-workflow
          component_ref: StdLib:ExternalWorkflowCoordinator
          config:
            engineType: AWS_StepFunctions # Plugin ID registered in Core
            engineConfig: { region: "us-east-1" } # Assumes AWS credentials configured globally via Core
            operation: StartExecution
            definitionIdentifier: # ARN of the Step Function state machine
              expression: "'arn:aws:states:us-east-1:123456789012:stateMachine:' & triggerData.workflowName"
            executionParameters: # Input payload for the Step Function, using triggerData
              expression: "{ orderId: triggerData.orderId, customerId: triggerData.customerId, items: triggerData.items }"
            waitForCompletion: true
            timeoutMs: 300000 # 5 minutes timeout for the external execution
            parametersLanguage: JMESPath
          inputs_map:
            triggerData: "trigger.payload" # Provide context for expressions
          # Outputs: outputs.executionReference (always if successful start), outputs.result (if waitForCompletion=true & success), outputs.error
        ```

*   **`StdLib:SubFlowInvoker`**
    *   **Purpose:** Starts a new instance of another `Flow` definition managed within the same Cascade deployment. Can optionally wait for the sub-flow to complete.
    *   **Config:**
        *   `flowName` (`FlowNameString` | `ExpressionString`, required): Name of the target `Flow` definition to invoke. Expression evaluated in sandbox.
        *   `waitForCompletion` (boolean, optional, default: false): If true, the invoker pauses and waits for the sub-flow to reach a terminal state (Completed or Failed). Requires Core event correlation mechanism to receive completion/failure events from the sub-flow.
        *   `timeoutMs` (`PositiveInteger`, optional): Maximum wait time in milliseconds *only if* `waitForCompletion` is true. If the sub-flow doesn't complete within this time, the `error` output (`SubFlowInvoker.Timeout`) is triggered. Requires Core Timers.
        *   `parametersLanguage` (`enum("JMESPath", "JsonPointer")`, optional, default: "JMESPath"): Language for `flowName` expression.
    *   **Inputs:**
        *   `initialData` (any, required): The data payload to be passed as the initial trigger data to the sub-flow instance.
        *   `contextData` (any, optional): Context data used *only* for evaluating the `flowName` expression, if it's dynamic.
    *   **Outputs:**
        *   `subFlowInstanceId` (string): The unique instance ID of the newly started sub-flow. Emitted immediately after successful invocation, regardless of `waitForCompletion`.
        *   `result` (any): The final output data produced by the sub-flow's terminal "success" step, *only if* `waitForCompletion` is true and the sub-flow completes successfully. Relies on Core event correlation to retrieve this result.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error occurred starting the sub-flow, or the sub-flow failed (`waitForCompletion`=true), or the timeout was reached (`waitForCompletion`=true).
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" } # `details` may contain sub-flow error info if applicable.
            *   `errorType`: One of ["SubFlowInvoker.FlowStartError", "SubFlowInvoker.FlowFailed", "SubFlowInvoker.Timeout", "SubFlowInvoker.ExpressionError", "SubFlowInvoker.CorrelationError"]
    *   **Required Runtime APIs:**
        *   `sandbox_execute_expression()` # For flowName expression
        *   `flow_start(flowName, initialData)` # Conceptual API: Core starts a new instance of the specified flow
        *   `event_subscribe(correlationId)` # If waitForCompletion=true, Core subscribes to internal completion/failure event for the subFlowInstanceId
        *   `set_timer()` # If waitForCompletion=true and timeoutMs set
        *   `clear_timer()` # If sub-flow completes before timeout
        *   `set_state()` / `get_state()` # To store context if waiting
        *   `log()`
    *   **Testing Considerations:**
        *   **Integration Tests:** Requires Core flow invocation capability.
            *   Test simple invocation (`waitForCompletion=false`), verify `subFlowInstanceId` output and that sub-flow starts.
            *   Test with `waitForCompletion=true`: verify parent waits; verify `result` output when child succeeds; verify `error` output (`SubFlowInvoker.FlowFailed`) when child fails; verify `error` output (`SubFlowInvoker.Timeout`) when child doesn't finish in time.
    *   **Example DSL:**
        ```yaml
        - step_id: invoke-payment-processing-subflow
          component_ref: StdLib:SubFlowInvoker
          config:
            flowName: "flow-process-payment" # Name of the sub-flow definition
            waitForCompletion: true
            timeoutMs: 60000 # Wait 1 minute for payment sub-flow
          inputs_map:
            # Data to trigger the payment sub-flow
            initialData: "{ orderId: trigger.orderId, amount: trigger.amount, paymentToken: trigger.paymentToken }"
          # Outputs: subFlowInstanceId (always), result (if success), error (if failure/timeout)
        ```

*   **`StdLib:ProcessVariableManager`**
    *   **Purpose:** Sets or gets variables within the persistent state scope *of the current flow instance*. Allows different steps within the same flow instance (even across suspension/resumption) to share data without passing it explicitly through every input/output.
    *   **Config:**
        *   `operation` (`enum("SET", "GET")`, required): Whether to set or get a variable.
        *   `variableName` (`VariableNameString`, required): The name of the process variable (e.g., "customerSegment", "retryAttemptCount").
        *   `valueExpression` (`ExpressionString`, required if `operation` is "SET"): Expression evaluating to the value to set for the variable. Evaluated in sandbox using input `data`.
        *   `language` (`enum("JMESPath", "JsonPointer")`, optional, default: "JMESPath"): Language for `valueExpression`.
    *   **Inputs:**
        *   `data` (any, required): Context data available for evaluating `valueExpression` (for SET) or simply passed through (for GET).
    *   **Outputs:**
        *   `value` (any): The retrieved value if `operation` is "GET". Output is absent if variable not found (triggers `error` instead).
        *   `success` (boolean): Emits `true` if `operation` is "SET" and the variable was set successfully.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error evaluating `valueExpression` (SET), internal state error accessing flow variables, or variable not found during GET operation.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: One of ["ProcessVariableManager.ExpressionError", "ProcessVariableManager.StateError", "ProcessVariableManager.VariableNotFound"]
    *   **Required Runtime APIs:**
        *   `sandbox_execute_expression()` # For valueExpression (SET)
        *   `get_flow_variable(variableName)` # Conceptual API: Core retrieves value from state scoped to current flow instance
        *   `set_flow_variable(variableName, value)` # Conceptual API: Core sets value in state scoped to current flow instance
        *   `log()`
    *   **Testing Considerations:**
        *   **Integration Tests:** Requires Core Runtime support for flow-scoped persistent state distinct from component state.
            *   Test SET operation: verify variable can be retrieved later using GET (potentially after a suspend/resume step like `WaitForDuration`).
            *   Test GET operation: verify correct value retrieval; test GET for a non-existent variable (should trigger `VariableNotFound` error).
            *   Test `valueExpression` evaluation.
    *   **Example DSL:**
        ```yaml
        - step_id: calculate-customer-segment
          # ... logic to determine segment ...
          outputs_map: { result: "steps.set-segment-variable.inputs.data" }

        - step_id: set-segment-variable
          component_ref: StdLib:ProcessVariableManager
          config:
            operation: SET
            variableName: "customerSegment"
            valueExpression: "data.segmentName" # Get segment from previous step's output
          inputs_map:
            data: "steps.calculate-customer-segment.outputs.result"

        # ... other steps, potentially including waits ...

        - step_id: get-segment-for-routing
          component_ref: StdLib:ProcessVariableManager
          config:
            operation: GET
            variableName: "customerSegment"
          inputs_map: {} # No specific input data needed for GET
          # Output 'value' (containing the segment) can be used by next step
          outputs_map: { value: "steps.route-based-on-segment.inputs.segment" }

        - step_id: route-based-on-segment
          # ... switch or filter based on the retrieved segment ...
          inputs_map: { segment: "..." }
        ```

**3.6 Stateful Patterns (Actor Model Primitives):**

*   **`StdLib:ActorShell`**
    *   **Purpose:** Represents a stateful entity (an "Actor"). Manages actor-specific state, processes incoming messages by invoking a specified logic component, and potentially updates the state based on the logic component's output. Ensures sequential processing of messages for a given actor ID.
    *   **Config:**
        *   `actorLogicComponent` (`ComponentRefString`, required): Reference (`step_id` or definition name) of the Cascade component instance that implements the actor's message handling logic. This component receives the actor's current `state` and the incoming `message` as inputs.
        *   `stateScope` (`enum("FlowInstance", "GlobalById")`, required): Determines how actor state is managed.
            *   `FlowInstance`: State is scoped to the current flow instance (useful for temporary, flow-specific actors).
            *   `GlobalById`: State is global and keyed by the `actorId` input. Requires Core's global KV store or equivalent.
        *   `initialState` (object, optional): Default state object used if no state exists for the actor (e.g., on first message for `GlobalById`).
        *   `stateTTLSeconds` (`PositiveInteger`, optional): Time-to-live in seconds for the actor's state after the last update. Requires Core state TTL support. Default: infinite.
    *   **Inputs:**
        *   `message` (any, required): The message payload intended for this actor. Passed as input to the `actorLogicComponent`.
        *   `actorId` (`ActorIdString`, required if `stateScope` is "GlobalById"): The unique identifier for the actor instance. Used to look up/store state.
    *   **Outputs:**
        *   `reply` (any): The data returned by the *success* output of the executed `actorLogicComponent`. Represents the actor's response to the message.
        *   `stateUpdated` (boolean): Emits `true` if the actor's state was successfully updated (typically implies the logic component finished successfully).
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error occurred during state loading/saving, or the `actorLogicComponent` itself failed (emitted an error).
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" } # `details` might contain error from logic component.
            *   `errorType`: One of ["ActorShell.StateError", "ActorShell.LogicComponentError", "ActorShell.ConfigError"]
    *   **Required Runtime APIs:**
        *   `get_state(key)` # Key derived from scope/actorId
        *   `set_state(key, value, ttlSeconds)` # Key derived from scope/actorId
        *   `execute_component(actorLogicComponent, inputs)` # Core executes the logic component, providing state+message as input.
        *   Core needs to ensure serialized execution per `actorId` if `stateScope` is `GlobalById` to prevent race conditions on state updates. This might involve locking or queueing mechanisms managed by Core.
        *   `log()`
    *   **Testing Considerations:**
        *   **Integration Tests:** Requires Core state management (and potentially locking/serialization). Mock or implement the `actorLogicComponent`.
            *   Test sending messages, verify state loading (`initialState` on first message).
            *   Verify state updates based on logic component's output.
            *   Test behavior with different `stateScope` values.
            *   Test state `ttlSeconds` if configured.
            *   Test error handling (state errors, logic component errors).
            *   Verify sequential processing for the same `actorId` (requires Core support testing).
    *   **Security Considerations:** If using `GlobalById`, ensure `actorId` cannot be easily manipulated to access unintended state. Ensure `actorLogicComponent` is trusted or runs in a sandbox if applicable. Secure Core state storage.
    *   **Example DSL:** (Illustrative - assumes `user-logic-processor` component exists)
        ```yaml
        # ActorShell instance definition (might be part of a larger flow or triggered)
        - step_id: user-actor-shell-instance
          component_ref: StdLib:ActorShell
          config:
            actorLogicComponent: "user-logic-processor" # ID of the logic component step/def
            stateScope: GlobalById
            initialState: { visitCount: 0, status: "NEW" }
            stateTTLSeconds: 7776000 # 90 days
          inputs_map:
            # These inputs would typically be routed here by an ActorRouter or trigger
            message: "input.messagePayload" # The message for the actor
            actorId: "input.targetUserId"  # The ID for state lookup
          # Outputs: reply, stateUpdated, error
        ```

*   **`StdLib:ActorRouter`**
    *   **(REVISED in V4.3)** **Purpose:** Extracts an actor ID from an incoming message and uses a Core Runtime API (`send_to_actor`) to dispatch the message to the appropriate actor instance (typically managed by an `StdLib:ActorShell`). Does *not* directly wire outputs to the actor shell.
    *   **Config:**
        *   `actorIdExpression` (`ExpressionString`, required): Expression to extract the target actor ID string from the input `message`. Evaluated in sandbox.
        *   `language` (`enum("JMESPath", "JsonPointer")`, optional, default: "JMESPath"): Language for `actorIdExpression`.
        *   `targetActorType` (`ComponentTypeString`, optional, default: "StdLib:ActorShell"): Specifies the expected type of the target actor component. Core might use this for validation or routing lookup.
        *   `deliveryMode` (`enum("FireAndForget", "RequestReply")`, optional, default: "FireAndForget"):
            *   `FireAndForget`: Component completes after successfully calling the `send_to_actor` API. Does not wait for the actor to process the message.
            *   `RequestReply`: (Requires significant Core support) Component waits for a `reply` from the target actor's logic component. Involves Core correlation mechanisms.
        *   `requestReplyTimeoutMs` (`PositiveInteger`, optional): Timeout in milliseconds *only if* `deliveryMode` is "RequestReply". Triggers error if no reply received.
    *   **Inputs:**
        *   `message` (any, required): Incoming message payload containing the actor ID and data for the actor.
    *   **Outputs:**
        *   `deliveryStatus` (object): Emitted on successful invocation of the runtime `send_to_actor` API (primarily for `FireAndForget`). May include `{ actorId: "..." }`.
        *   `reply` (any): The reply payload received back from the target actor, *only if* `deliveryMode` is "RequestReply" and the actor successfully processed and replied within the timeout.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error occurred during actor ID extraction, invoking the runtime `send_to_actor` API (e.g., actor type mismatch, routing failure), or during Request-Reply (timeout or actor returned an error).
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: One of ["ActorRouter.ExpressionError", "ActorRouter.RoutingError", "ActorRouter.RequestReplyTimeout", "ActorRouter.ActorErrorResponse"]
    *   **Required Runtime APIs:**
        *   `sandbox_execute_expression()` # For actorIdExpression
        *   `send_to_actor(actorId, messagePayload, deliveryMode, targetActorType)` # Conceptual API: Core handles locating/activating actor instance and delivering the message. Core manages serialization guarantees if needed.
        *   `event_subscribe()` / `set_timer()` / `clear_timer()` # If deliveryMode is RequestReply, Core uses correlation/timers.
        *   `log()`
    *   **Testing Considerations:**
        *   **Unit Tests:** Verify `actorId` extraction. Mock the `send_to_actor` runtime API and verify it's called with correct parameters. Test output mapping based on mocked API response/callback. Test expression errors.
        *   **Integration Tests:** Requires Core Runtime with actor routing/dispatch mechanism and target actor instances (e.g., `ActorShell`). Verify messages are correctly delivered to the actor identified by the extracted ID. Test `FireAndForget` delivery. If `RequestReply` is supported, test waiting for replies, timeouts, and handling of errors from the actor.
    *   **Security Considerations:** Ensure message integrity before routing. Validate `actorIdExpression` result. The Core routing layer (`send_to_actor`) should enforce permissions if applicable (e.g., can this flow send messages to this type of actor?). Sandbox expression evaluation.
    *   **Example DSL:**
        ```yaml
        # Example Trigger receiving messages destined for user actors
        # trigger: { type: KafkaTrigger, ..., output_name: kafkaMessage }

        - step_id: route-to-user-actor
          component_ref: StdLib:ActorRouter
          config:
            # Extract userId from the Kafka message key or payload
            actorIdExpression: "message.key"
            language: JMESPath
            targetActorType: "StdLib:ActorShell" # Explicitly target shells
            deliveryMode: FireAndForget # Just send, don't wait for reply
          inputs_map:
            # The message contains the payload for the actor
            message: "trigger.kafkaMessage" # Assume trigger provides key/payload
          # Outputs: deliveryStatus (on success), error
          # No direct wiring to the actor shell instance needed here.
        ```

**3.7 Reactive Stream Processing:**

*   **`StdLib:SplitList`**
    *   **Purpose:** Takes an input array (list) and emits each element as a separate output event/packet sequentially. Emits a completion signal after the last element.
    *   **Config:**
        *   `listExpression` (`ExpressionString`, optional, default: "@"): JMESPath expression to select the array from the input `data`. Default `@` assumes the input `data` *is* the array. Evaluated in sandbox.
        *   `language` (`enum("JMESPath")`, optional, default: "JMESPath"): Language for `listExpression`.
        *   `itemOutputName` (`OutputPortNameString`, optional, default: "item"): Name of the output port where individual list elements are emitted.
        *   `completionOutputName` (`OutputPortNameString`, optional, default: "processingComplete"): Name of the output port where a signal is emitted *after* the last item.
    *   **Inputs:**
        *   `data` (any, required): Input data containing the list (or the list itself) used for `listExpression`.
    *   **Outputs:**
        *   `itemOutputName` (any): Each element of the resolved list, emitted sequentially.
        *   `completionOutputName` (object): A simple signal object emitted once after the last item. Schema: `{ "type": "object", "properties": { "complete": { "type": "boolean", "const": true }, "itemCount": {"type": "integer"} }, "required": ["complete", "itemCount"] }`.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error if `listExpression` fails or the resolved value is not an array.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: One of ["SplitList.ExpressionError", "SplitList.InvalidInput"]
    *   **Required Runtime APIs:**
        *   `sandbox_execute_expression()` # For listExpression
        *   Core Runtime must handle the sequential emission of multiple outputs from a single component execution and trigger downstream steps accordingly.
    *   **Testing Considerations:**
        *   **Unit Tests:** Verify correct emission of items for various input arrays (empty, single item, multiple items). Verify `completionOutputName` signal emission (including `itemCount`). Test `listExpression`. Test non-array inputs (should produce error).
    *   **Example DSL:**
        ```yaml
        - step_id: split-order-items
          component_ref: StdLib:SplitList
          config:
            listExpression: "items" # Select the 'items' array from input data
            itemOutputName: orderItem # Rename output port
          inputs_map:
            data: "trigger.payload" # Assume payload is { orderId: ..., items: [...] }
          # Downstream steps connect to outputs.orderItem (triggered for each item)
          # and outputs.processingComplete (triggered once at the end)
        ```

*   **`StdLib:AggregateItems`**
    *   **Purpose:** Collects individual input items into a list (buffer). Emits the aggregated list when a specified completion condition is met (e.g., number of items received, explicit completion signal, timeout, buffer size). Requires state to hold the buffer between input arrivals.
    *   **Config:**
        *   `itemInputName` (`InputPortNameString`, optional, default: "item"): Name of the input port that receives individual items to aggregate.
        *   `completionInputName` (`InputPortNameString`, optional): Name of the input port that receives an explicit signal (e.g., from `SplitList.completionOutputName`) to finalize and emit the current buffer, regardless of other conditions.
        *   `expectedCount` (`PositiveInteger`, optional): Emit the buffer when exactly this many items have been received via `itemInputName`. Resets buffer/count afterwards.
        *   `timeoutMs` (`PositiveInteger`, optional): Emit the buffer after this period of inactivity (no items received on `itemInputName`). The timer typically starts/restarts when an item arrives.
        *   `maxSize` (`PositiveInteger`, optional): Emit the buffer when the number of items collected reaches this size. Resets buffer afterwards.
        *   `completionMode` (`enum("Any", "All")`, optional, default: "Any"):
            *   `Any`: Emit the buffer as soon as *any* of the configured conditions (`completionInputName`, `expectedCount`, `timeoutMs`, `maxSize`) are met.
            *   `All`: (Less common) Emit only when *all* applicable conditions are met (e.g., `expectedCount` AND `timeoutMs` have passed).
        *   `aggregateOutputName` (`OutputPortNameString`, optional, default: "aggregatedList"): Name of the output port where the aggregated list is emitted.
    *   **Inputs:**
        *   `itemInputName` (any): Items to aggregate. Port name determined by `config.itemInputName`. Arrives potentially multiple times.
        *   `completionInputName` (any, optional): Completion signal. Port name determined by `config.completionInputName`. Arrives once per aggregation cycle.
    *   **Outputs:**
        *   `aggregateOutputName` (array): The list containing the items collected since the last emission.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error occurred, e.g., initial timeout before any items arrived (if applicable based on config), state management issue, configuration conflict.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: One of ["AggregateItems.TimeoutError", "AggregateItems.StateError", "AggregateItems.ConfigError"]
    *   **Required Runtime APIs:**
        *   `get_state()` # To retrieve current buffer, item count, potentially timer start time
        *   `set_state()` # To store updated buffer, count
        *   `set_timer()` # For timeoutMs
        *   `clear_timer()` # When aggregation completes or timer needs reset
        *   Core Runtime needs to handle components receiving inputs on multiple ports over time and trigger execution appropriately.
    *   **Testing Considerations:**
        *   **Integration Tests:** Requires Core state/timers.
            *   Test aggregation based on `completionInputName`.
            *   Test aggregation based on `expectedCount`.
            *   Test aggregation based on `timeoutMs`.
            *   Test aggregation based on `maxSize`.
            *   Test combinations based on `completionMode`.
            *   Verify buffer state is correctly managed between emissions. Test empty list scenarios.
    *   **Example DSL:** (Aggregating results after SplitList)
        ```yaml
        # Assume step-process-item runs for each item from step-split-items
        - step_id: step-aggregate-item-results
          component_ref: StdLib:AggregateItems
          config:
            itemInputName: singleItemResult # Wire processing result here
            completionInputName: allItemsProcessed # Wire completion signal here
            # Aggregate when the completion signal arrives
            completionMode: Any # Default, but explicit here
            aggregateOutputName: processedItemsList
          inputs_map:
            singleItemResult: "steps.step-process-item.outputs.result"
            allItemsProcessed: "steps.step-split-items.outputs.processingComplete"
        ```

*   **`StdLib:MergeStreams`**
    *   **Purpose:** Forwards data packets arriving on any of its configured input ports to a single output port, effectively merging multiple streams. Order of emission depends on arrival time and Core scheduling, no order guarantee is provided.
    *   **Config:**
        *   `inputNames` (list<`InputPortNameString`>, required): List of names for the input ports to merge data from.
        *   `mergedOutputName` (`OutputPortNameString`, optional, default: "mergedOutput"): Name of the single output port where all received packets are emitted.
    *   **Inputs:**
        *   Dynamically defined input ports matching `inputNames`. Component executes each time data arrives on any of these ports.
    *   **Outputs:**
        *   `mergedOutputName` (any): Emits the data packet that arrived on one of the `inputNames`.
    *   **Required Runtime APIs:** None (Core handles input dispatch triggering component execution).
    *   **Testing Considerations:**
        *   **Unit Tests:** Simulate receiving data packets on different input ports. Verify that each packet is emitted exactly once on the `mergedOutputName`. Order is not tested.
    *   **Example DSL:**
        ```yaml
        - step_id: merge-alerts
          component_ref: StdLib:MergeStreams
          config:
            inputNames: ["highPriorityAlert", "lowPriorityAlert"]
            mergedOutputName: anyAlert
          inputs_map:
            highPriorityAlert: "steps.process-critical.outputs.alert"
            lowPriorityAlert: "steps.process-standard.outputs.alert"
          # Downstream step connects to outputs.anyAlert
        ```

*   **`StdLib:ZipStreams`**
    *   **Purpose:** Combines packets from multiple input streams pairwise. Waits until it receives one packet on *each* of its configured input ports for a given "cycle", then emits a single combined object containing the data from that cycle. Requires state to hold packets arrived so far in the current cycle.
    *   **Config:**
        *   `inputNames` (list<`InputPortNameString`>, required): Ordered list of names for the input ports to zip. Order might be relevant for future list-based output modes.
        *   `zippedOutputName` (`OutputPortNameString`, optional, default: "zippedOutput"): Name of the output port for the combined object.
        *   `timeoutMs` (`PositiveInteger`, optional): Maximum time to wait for a packet to arrive on *all* `inputNames` to complete the current cycle (timer usually starts when the *first* packet for a new cycle arrives). If reached, an error is emitted, and any data collected for the current incomplete cycle is discarded.
    *   **Inputs:**
        *   Dynamically defined input ports matching `inputNames`. Component executes on each input arrival, checks if cycle complete.
    *   **Outputs:**
        *   `zippedOutputName` (object): An object where keys are the `inputNames` and values are the corresponding data packets received for the completed cycle. Schema: `{ "type": "object", "properties": { /* inputNames as keys with 'any' type */ }, "required": [/* all inputNames */] }`.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error if `timeoutMs` is reached before data arrives on all inputs for the current cycle, or an internal state error occurs.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: One of ["ZipStreams.TimeoutError", "ZipStreams.StateError"]
    *   **Required Runtime APIs:**
        *   `get_state()` # Store received packets per input for the current cycle
        *   `set_state()` # Update state on packet arrival, clear on cycle completion/timeout
        *   `set_timer()` # For timeoutMs
        *   `clear_timer()` # On cycle completion
        *   Core Runtime needs to handle input arrivals triggering stateful component logic.
    *   **Testing Considerations:**
        *   **Integration Tests:** Requires Core state/timers.
            *   Simulate packets arriving on all inputs; verify correct `zippedOutputName` object emission.
            *   Simulate packets arriving out of order; verify it still waits for one of each.
            *   Test receiving duplicate packets on one input before others arrive (should typically buffer only the first for the cycle).
            *   Test the `timeoutMs` scenario.
    *   **Example DSL:** (Combining user profile parts fetched in parallel)
        ```yaml
        - step_id: zip-user-profile
          component_ref: StdLib:ZipStreams
          config:
            inputNames: ["basicInfo", "addressInfo", "prefsInfo"]
            zippedOutputName: fullProfile
            timeoutMs: 3000 # Max 3 sec to get all parts
          inputs_map:
            basicInfo: "steps.fetch-basic-info.outputs.result"
            addressInfo: "steps.fetch-address.outputs.result"
            prefsInfo: "steps.fetch-prefs.outputs.result"
          # Downstream step connects to outputs.fullProfile
        ```

*   **`StdLib:DebounceInput`**
    *   **Purpose:** Filters an input stream by emitting only the *last* item received after a specified period of inactivity ("quiet time") has passed. Useful for handling bursts of events (e.g., UI input, sensor readings) where only the final state after settling is needed.
    *   **Config:**
        *   `debounceMs` (`NonNegativeInteger`, required): The period of inactivity (in milliseconds) required before the last received item is emitted. The internal timer is reset every time a new item arrives.
        *   `emitOnFirst` (boolean, optional, default: false): If true, emits the *first* item received immediately, then starts the debounce logic (subsequent items within `debounceMs` are ignored, only the last one after the quiet period is emitted).
        *   `debouncedOutputName` (`OutputPortNameString`, optional, default: "debouncedData"): Name of the output port.
    *   **Inputs:**
        *   `data` (any, required): The input stream of data packets.
    *   **Outputs:**
        *   `debouncedOutputName` (any): The data packet emitted after the debounce period (or the first one if `emitOnFirst` is true).
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Internal state or timer error.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: "DebounceInput.StateError"
    *   **Required Runtime APIs:**
        *   `set_timer()` # Reset timer on each input arrival to schedule potential future emission
        *   `clear_timer()` # If a new item arrives before the timer fires
        *   `set_state()` / `get_state()` # To store the latest pending data item
    *   **Testing Considerations:**
        *   **Integration Tests:** Requires Core state/timers.
            *   Simulate rapid bursts of input; verify only the last item is emitted after `debounceMs` passes since the last item in the burst.
            *   Test with `emitOnFirst=true`.
            *   Test single inputs (should be emitted after `debounceMs`).
    *   **Example DSL:**
        ```yaml
        - step_id: debounce-window-resize-events
          component_ref: StdLib:DebounceInput
          config:
            debounceMs: 250 # Wait for 250ms of no resize events
            debouncedOutputName: finalDimensions
          inputs_map:
            data: "trigger.windowResizeEvent" # Trigger emits {width: ..., height: ...}
          # Downstream step connects to outputs.finalDimensions
        ```

*   **`StdLib:BufferInput`**
    *   **Purpose:** Collects incoming data packets into a list (buffer) and emits the entire list when either a size threshold (`maxSize`) or a time threshold (`maxWaitMs`) is reached.
    *   **Config:**
        *   `maxSize` (`PositiveInteger`, optional): Emit the buffer when it contains this many items.
        *   `maxWaitMs` (`PositiveInteger`, optional): Emit the buffer this many milliseconds after the *first* item was added to the current buffer, even if `maxSize` is not reached.
        *   `bufferOutputName` (`OutputPortNameString`, optional, default: "bufferedList"): Name of the output port where the list of buffered items is emitted.
        *   **Note:** At least one of `maxSize` or `maxWaitMs` *must* be configured. If both are set, the buffer is emitted when *either* condition is met first.
    *   **Inputs:**
        *   `data` (any, required): The input stream of data packets to buffer.
    *   **Outputs:**
        *   `bufferOutputName` (array): A list containing the data packets collected since the last emission.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Internal state or timer error.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: "BufferInput.StateError"
    *   **Required Runtime APIs:**
        *   `get_state()` # Store current buffer list, item count, potentially first item timestamp
        *   `set_state()` # Add item to buffer, clear buffer on emission
        *   `set_timer()` # To trigger emission based on maxWaitMs
        *   `clear_timer()` # If buffer emitted due to maxSize before timer fires
    *   **Testing Considerations:**
        *   **Integration Tests:** Requires Core state/timers.
            *   Test emission based on `maxSize` trigger.
            *   Test emission based on `maxWaitMs` trigger.
            *   Test with both configured: verify emission occurs when the first threshold is met.
            *   Verify buffer is cleared after emission. Test empty buffer scenarios (e.g., timeout with no items).
    *   **Example DSL:** (Buffering logs for batch sending)
        ```yaml
        - step_id: buffer-log-entries
          component_ref: StdLib:BufferInput
          config:
            maxSize: 50
            maxWaitMs: 5000 # Send logs every 5s or when buffer hits 50
            bufferOutputName: logBatch
          inputs_map:
            data: "steps.format-log-entry.outputs.entry" # Stream of formatted entries
          # Downstream step connects to outputs.logBatch to send the batch
        ```

*   **`StdLib:ThrottleInput`**
    *   **Purpose:** Limits the rate at which data packets are forwarded downstream, using either shaping (delaying) or dropping excess packets. Implemented typically using a token bucket algorithm.
    *   **Config:**
        *   `ratePerSecond` (`PositiveNumber`, required): The maximum average number of packets allowed to pass per second. Can be fractional (e.g., 0.5 means 1 packet every 2 seconds).
        *   `mode` (`enum("Shaping", "Dropping")`, optional, default: "Shaping"):
            *   `Shaping`: Excess packets are buffered and delayed, emitted later to maintain the average `ratePerSecond`. Requires state for buffer and timers for delayed emission.
            *   `Dropping`: Excess packets (arriving when no tokens are available) are discarded immediately. May output dropped items on `droppedOutputName`.
        *   `burstSize` (`PositiveInteger`, optional, default: 1): The maximum number of packets that can be sent in a short burst, exceeding `ratePerSecond` momentarily (token bucket capacity). Often defaults to 1 or a small multiple of the rate.
        *   `throttledOutputName` (`OutputPortNameString`, optional, default: "throttledData"): Name of the output port for packets that are allowed through (potentially after delay in Shaping mode).
        *   `droppedOutputName` (`OutputPortNameString`, optional, default: "droppedData"): Name of the output port where dropped packets are emitted *only if* `mode` is "Dropping".
    *   **Inputs:**
        *   `data` (any, required): The input stream of data packets.
    *   **Outputs:**
        *   `throttledData` (any): Data packets emitted according to the rate limit.
        *   `droppedData` (any, optional): Discarded data packets (only emitted if `mode` is "Dropping").
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Internal state, timer, or configuration error.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: "ThrottleInput.StateError"
    *   **Required Runtime APIs:**
        *   `get_state()` # Store token count, last emission time, potentially shaping buffer
        *   `set_state()` # Update state on arrival/emission
        *   `set_timer()` # To schedule next emission (Shaping) or potentially replenish tokens periodically
        *   `get_current_time()` # For rate calculation
    *   **Testing Considerations:**
        *   **Integration Tests:** Requires Core state/timers.
            *   Send input packets at a rate higher than `ratePerSecond`.
            *   Verify in "Shaping" mode that output rate matches `ratePerSecond` over time (with initial burst potential).
            *   Verify in "Dropping" mode that excess packets are emitted on `droppedOutputName` and `throttledData` rate matches `ratePerSecond`.
            *   Test fractional `ratePerSecond`. Test `burstSize`.
    *   **Example DSL:** (Rate limiting API calls)
        ```yaml
        - step_id: throttle-outgoing-api-calls
          component_ref: StdLib:ThrottleInput
          config:
            ratePerSecond: 10 # Allow max 10 calls/sec on average
            burstSize: 5 # Allow short burst of 5 calls
            mode: Shaping # Buffer and delay excess calls
            throttledOutputName: allowedApiCall
          inputs_map:
            data: "steps.prepare-api-call.outputs.request" # Stream of prepared requests
          # Downstream HTTP call step connects to outputs.allowedApiCall
        ```

*   **`Streams:Window`** (Time-Based Windowing)
    *   **Purpose:** Groups incoming data packets into windows based on time. Emits the collection of items belonging to each window when the window closes.
    *   **Config:**
        *   `windowType` (`enum("Tumbling", "Sliding", "Session")`, required):
            *   `Tumbling`: Fixed-size, non-overlapping windows (e.g., 1-minute windows: 0-1, 1-2, 2-3).
            *   `Sliding`: Fixed-size, overlapping windows (e.g., 1-minute windows sliding every 10 seconds: 0:00-1:00, 0:10-1:10, 0:20-1:20).
            *   `Session`: Windows based on activity gaps. A window closes after a period of inactivity (`sessionGap`).
        *   `windowSize` (`DurationString`, required for Tumbling/Sliding): The duration of each window (e.g., "5s", "1m", "2h"). Format: `<number><unit>`, unit = s, m, h, d.
        *   `slideInterval` (`DurationString`, optional): Required only if `windowType`="Sliding". Specifies how often a new window starts (e.g., "10s"). Must be <= `windowSize`.
        *   `sessionGap` (`DurationString`, optional): Required only if `windowType`="Session". The period of inactivity (no incoming data) after which the current session window closes (e.g., "30s").
        *   `windowOutputName` (`OutputPortNameString`, optional, default: "window"): Name of the output port where window results are emitted.
    *   **Inputs:**
        *   `data` (any, required): The input stream of data packets. Assumed to have an implicit or explicit timestamp associated by Core or the data itself for window assignment (Core needs to provide time context).
    *   **Outputs:**
        *   `windowOutputName` (object): An object emitted when a window closes, containing the window details and the items collected within it.
            *   `schema`:
                ```json
                {
                  "type": "object",
                  "properties": {
                    "windowStart": { "type": "string", "format": "date-time", "description": "ISO8601 timestamp of window start." },
                    "windowEnd": { "type": "string", "format": "date-time", "description": "ISO8601 timestamp of window end." },
                    "items": { "type": "array", "description": "List of data packets belonging to this window." }
                  }, "required": ["windowStart", "windowEnd", "items"]
                }
                ```
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error related to configuration, internal state management, or timer issues.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: One of ["Streams.Window.ConfigError", "Streams.Window.StateError", "Streams.Window.TimerError"]
    *   **Core Dependency:** Core persistent state (to store items per active window), Core Timers (to trigger window closing), accurate time source accessible by Core. Core needs to associate timestamps with arriving data for correct window assignment.
    *   **Required Runtime APIs:**
        *   `get_state()` # Store items per active window ID
        *   `set_state()` # Add items to window, clear on emission
        *   `set_timer()` # To trigger window emissions based on type/size/gap
        *   `clear_timer()` # For session windows potentially
        *   `get_current_time()` # For assigning items and closing windows
    *   **Testing Considerations:**
        *   **Integration Tests:** Requires Core state/timers and time control/simulation.
            *   Test `Tumbling` windows: send data, verify non-overlapping windows with correct items are emitted at `windowSize` intervals.
            *   Test `Sliding` windows: verify overlapping windows with correct items are emitted at `slideInterval` intervals.
            *   Test `Session` windows: send bursts of data with gaps; verify windows close after `sessionGap` and contain correct items.
            *   Test scenarios with late-arriving data (may be dropped or handled depending on Core config). Test empty windows.
    *   **Example DSL:** (Calculating average sensor reading over 5-minute tumbling windows)
        ```yaml
        - step_id: tumbling-sensor-window
          component_ref: Streams:Window
          config:
            windowType: Tumbling
            windowSize: "5m"
            windowOutputName: sensorWindow
          inputs_map:
            data: "trigger.sensorReading" # Assume trigger provides { value: ..., timestamp: ... }

        - step_id: calculate-window-average
          component_ref: Data:Transform # Or a dedicated aggregate component
          config:
            language: javascript
            code: |
              function calculateAvg(windowData) {
                if (!windowData || !windowData.items || windowData.items.length === 0) {
                  return { start: windowData.windowStart, end: windowData.windowEnd, avg: null };
                }
                const sum = windowData.items.reduce((acc, item) => acc + item.value, 0);
                return {
                  start: windowData.windowStart,
                  end: windowData.windowEnd,
                  avg: sum / windowData.items.length
                };
              }
              // Core calls calculateAvg(input.data)
          inputs_map:
            data: "steps.tumbling-sensor-window.outputs.sensorWindow"
        ```

**3.8 Observability & Auditing:**

**(Note V4.32):** Component `Platform:AuditLog` is deprecated and removed from this section. Use `StdLib:AuditLogger` directly.

*   **`StdLib:Logger`**
    *   **Purpose:** Writes diagnostic logs to the Core Runtime's logging system. Useful for debugging and tracing flow execution.
    *   **Config:**
        *   `level` (`enum("DEBUG", "INFO", "WARN", "ERROR")`, optional, default: "INFO"): Log level severity. Core may filter logs based on its configuration.
        *   `messageExpression` (`ExpressionString`, required): Expression evaluating to the string or object to be logged. Evaluated in sandbox using input `data`.
        *   `language` (`enum("JMESPath", "JsonPointer")`, optional, default: "JMESPath"): Language for `messageExpression`.
    *   **Inputs:**
        *   `data` (any, optional): Context data made available for `messageExpression`.
    *   **Outputs:** (None). Component completes after logging.
    *   **Required Runtime APIs:**
        *   `sandbox_execute_expression()` # For messageExpression
        *   `log(level, message)` # Core API to write the log entry, adding context (flow ID, step ID, timestamp)
    *   **Testing Considerations:**
        *   **Unit Tests:** Mock the `log` runtime API. Verify it's called with the correct level and the evaluated message from `messageExpression`. Test expression evaluation with different inputs.
        *   **Integration Tests:** Execute a flow containing the Logger step. Verify that the log message appears correctly formatted in the Core Runtime's configured log output/sink, including expected contextual information.
    *   **Example DSL:**
        ```yaml
        - step_id: log-processing-start
          component_ref: StdLib:Logger
          config:
            level: INFO
            messageExpression: "'Starting processing for order ID: ' & data.orderId"
          inputs_map:
            data: "trigger.payload" # Use trigger payload data in message
        ```

*   **`StdLib:AuditLogger`**
    *   **Purpose:** Writes structured business-level audit events to a dedicated audit log stream/sink managed by the Core Runtime. Used for security, compliance, and tracking significant business actions.
    *   **Config:**
        *   `eventType` (`AuditEventTypeString`, required): A structured identifier for the type of audit event (e.g., "User.Login.Success", "Order.Payment.Failure", "Permissions.Updated"). Follow consistent naming conventions.
        *   `eventDetailsExpression` (`ExpressionString`, optional): Expression evaluating to a JSON object containing relevant, non-sensitive details about the event. Evaluated in sandbox. Default: the entire input `data` object.
        *   `language` (`enum("JMESPath", "JsonPointer")`, optional, default: "JMESPath"): Language for expressions.
        *   `userIdExpression` (`ExpressionString`, optional): Expression evaluating to the ID of the user performing the action. Evaluated in sandbox. Core might inject this automatically based on auth context.
        *   `resourceIdExpression` (`ExpressionString`, optional): Expression evaluating to the ID of the primary resource involved. Evaluated in sandbox.
        *   `outcome` (`enum("Success", "Failure", "Attempt")`, optional, default: "Success"): Indicates the outcome of the audited action.
    *   **Inputs:**
        *   `data` (any, required): Context data available for evaluating expressions and providing default event details.
    *   **Outputs:** (None). Component completes after logging the audit event.
    *   **Required Runtime APIs:**
        *   `sandbox_execute_expression()` # For details, userId, resourceId expressions
        *   `audit_log(eventType, userId, resourceId, outcome, details)` # Conceptual API: Core writes structured event to dedicated audit sink, adding context (timestamp, flow ID, principal).
    *   **Testing Considerations:**
        *   **Unit Tests:** Mock the `audit_log` runtime API. Verify it's called with correctly evaluated parameters (`eventType`, `details`, `userId`, etc.). Test expression evaluations.
        *   **Integration Tests:** Requires Core audit logging infrastructure configured with a test sink. Execute flows and verify that the expected structured audit events appear in the sink with correct fields and context.
    *   **Security Considerations:** Critical for security and compliance. Use consistently for significant events. Ensure the audit sink is secure and tamper-evident. Avoid logging overly sensitive data (like passwords, full credit card numbers) directly in `eventDetails` unless absolutely necessary and compliant with regulations; use references or tokens instead. Sandbox expression evaluation.
    *   **Example DSL:**
        ```yaml
        - step_id: audit-permission-change
          component_ref: StdLib:AuditLogger
          config:
            eventType: "User.Permission.Granted"
            # userIdExpression might be automatically added by Core from auth context
            resourceIdExpression: "data.targetUserId" # User whose permissions changed
            outcome: Success
            eventDetailsExpression: "{ permission: data.permissionGranted, grantedBy: data.adminUserId }"
          inputs_map:
            # Assumes previous step outputted details of the change
            data: "steps.grant-permission.outputs.result"
        ```

*   **`StdLib:MetricsEmitter`**
    *   **Purpose:** Emits custom metrics (counters, gauges, histograms, summaries) to the Core Runtime's metrics system, allowing monitoring of business or operational KPIs.
    *   **Config:**
        *   `metricName` (`MetricNameString`, required): Name of the metric. Follow naming conventions (e.g., Prometheus style: `app_requests_total`, `payment_amount_usd`).
        *   `metricType` (`enum("counter", "gauge", "histogram", "summary")`, required): Type of metric.
            *   `counter`: A cumulative metric that only increases (e.g., total requests).
            *   `gauge`: A value that can go up or down (e.g., active users, queue size).
            *   `histogram`: Tracks distribution of values in configurable buckets (e.g., request latency). Requires `histogramBuckets`.
            *   `summary`: Tracks distribution using quantiles (e.g., request latency). Client-side calculation.
        *   `valueExpression` (`ExpressionString`, optional): Expression evaluating to the numeric value to record. Evaluated in sandbox. Default is `1` for `counter`. Required for `gauge`, `histogram`, `summary`.
        *   `language` (`enum("JMESPath", "JsonPointer")`, optional, default: "JMESPath"): Language for `valueExpression`.
        *   `labelsExpression` (`ExpressionString`, optional): Expression yielding a JSON object of key-value string pairs (labels/tags) to associate with the metric observation. Evaluated in sandbox. Example: `{ status_code: "response.statusCode", method: "request.method" }`.
        *   `labelsLanguage` (`enum("JMESPath", "JsonPointer")`, optional, default: "JMESPath"): Language for `labelsExpression`.
        *   `histogramBuckets` (list<`float`>, optional): Required only if `metricType` is "histogram". Defines the upper bounds of the buckets (e.g., `[0.1, 0.5, 1, 5]` for seconds).
    *   **Inputs:**
        *   `data` (any, required): Context data available for evaluating `valueExpression` and `labelsExpression`.
    *   **Outputs:** (None). Component completes after emitting the metric.
    *   **Required Runtime APIs:**
        *   `sandbox_execute_expression()` # For value, labels expressions
        *   `emit_metric(type, name, value, labels, buckets)` # Conceptual API: Core records the metric via its configured metrics backend adapter (e.g., Prometheus client, OpenTelemetry SDK).
    *   **Testing Considerations:**
        *   **Unit Tests:** Mock the `emit_metric` runtime API. Verify it's called with the correct type, name, evaluated value, and labels. Test expression evaluations. Test different metric types.
        *   **Integration Tests:** Requires Core metrics infrastructure configured with a test sink (e.g., Prometheus). Execute flows and verify the metrics appear in the sink with correct names, values, and labels.
    *   **Security Considerations:** Avoid putting sensitive information directly in metric names or label values. Be mindful of label cardinality (too many unique label combinations can overload metrics backends). Sandbox expression evaluation.
    *   **Example DSL:** (Counting processed messages by type)
        ```yaml
        - step_id: emit-message-processed-metric
          component_ref: StdLib:MetricsEmitter
          config:
            metricName: "app_messages_processed_total"
            metricType: counter
            # Value defaults to 1 for counter
            labelsExpression: "{ message_type: data.type, status: 'success' }" # Labels from input data
          inputs_map:
            # Assumes previous step provided message details including 'type'
            data: "steps.process-message.outputs.result"
        ```

**3.9 SaaS Platform Components:**

*   **`Security.Authenticate`**
    *   **Purpose:** Authenticates users or service tokens based on credentials provided in the input, using various configurable providers (potentially via plugins).
    *   **Config:**
        *   `providerType` (`enum("Jwt", "ApiKey", "Database", "ExternalOidc")` | `PluginIdentifierString`, required): Specifies the authentication method or a plugin handling a custom method.
        *   `providerConfig` (object, required): Configuration specific to the chosen `providerType`. Structure defined by the internal logic or the loaded plugin's schema. *Must* use Core Secrets for sensitive values (keys, client secrets). Examples:
            *   `Jwt`: `{ "publicKeySecretRef": "jwt_verify_key", "userIdClaim": "sub", "issuer": "urn:my-app", "audience": "api://my-app" }`
            *   `ApiKey`: `{ "apiKeyHeader": "X-API-Key", "validationComponentRef": "step-validate-api-key" }` (Delegates validation)
            *   `Database`: `{ "usernameField": "email", "passwordField": "password", "userLookupComponentRef": "step-lookup-user", "passwordVerifyComponentRef": "step-verify-hash" }` (Delegates lookup and verification)
            *   `ExternalOidc`: `{ "discoveryUrl": "https://idp.example.com/.well-known/openid-configuration", "clientIdSecretRef": "oidc_client_id", "clientSecretSecretRef": "oidc_client_secret" }` (Requires OIDC plugin/library)
            *   `Plugin`: `{ /* Plugin specific config */ }`
        *   `credentialsLocation` (`enum("InputData", "HttpHeaders")`, optional, default: "InputData"): Specifies where the component should look for credentials (e.g., token, username/password) within its `data` input. If "HttpHeaders", assumes relevant headers (e.g., `Authorization`) are parsed into the `data` object by the trigger/previous step.
    *   **Inputs:**
        *   `data` (object, required): Input data containing credentials (e.g., `{ token: "..." }`, `{ username: "...", password: "..." }`) or HTTP headers, depending on `credentialsLocation` and `providerType`.
    *   **Outputs:**
        *   `userId` (string): The authenticated user or principal identifier on success.
        *   `claims` (object, optional): Additional verified claims or attributes obtained during authentication (e.g., from JWT payload, user profile lookup).
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Authentication failed (e.g., invalid credentials, expired token, provider error, configuration issue).
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: One of ["Security.Authenticate.InvalidCredentials", "Security.Authenticate.TokenExpired", "Security.Authenticate.ProviderError", "Security.Authenticate.ConfigError", "Security.Authenticate.PluginError"]
    *   **Required Runtime APIs:**
        *   `get_secret()` # For providerConfig secrets
        *   Potentially `execute_component()` (if delegating parts like DB lookup via `validationComponentRef` or `userLookupComponentRef`)
        *   Potentially `crypto_verify_jwt()`, `crypto_hash_password()` (if JWT/password hashing is built-in vs. delegated)
        *   Potentially `component_loader_load()` (if using plugins for `providerType`)
        *   Potentially network APIs (if interacting with external IdP for OIDC) via plugin
        *   `log()`
    *   **Testing Considerations:**
        *   **Unit Tests:** Mock provider logic/delegated components/plugins. Test config parsing. Test valid/invalid credential scenarios for each supported `providerType`. Verify correct `userId`/`claims` or `error` output. Test secret handling.
        *   **Integration Tests:** Requires access to configured providers (e.g., actual JWT keys, test DB users, mock OIDC provider) or plugin test environments. Test end-to-end authentication flows.
    *   **Security Considerations:** Critical security component. Handle all credentials and secrets securely. Implement rate limiting externally if exposed. Ensure underlying providers/plugins/delegated components are secure. Validate all inputs and configurations strictly. Use constant-time comparisons for secrets/tokens where appropriate.
    *   **Example DSL:** (JWT Authentication)
        ```yaml
        - step_id: authenticate-request-jwt
          component_ref: Security.Authenticate
          config:
            providerType: Jwt
            providerConfig:
              publicKeySecretRef: "api_jwt_verify_public_key" # Secret name in Core
              userIdClaim: "sub" # Standard subject claim for user ID
              issuer: "urn:my-issuer" # Expected issuer
              audience: "my-api-audience" # Expected audience
            credentialsLocation: HttpHeaders # Expect Authorization: Bearer <token> in data.headers
          inputs_map:
            # Assumes trigger/previous step parsed headers into trigger.request.headers
            data: "trigger.request"
          # Outputs: userId, claims (JWT payload), error
        ```

*   **`Security.Authorize`**
    *   **Purpose:** Performs authorization checks based on the authenticated principal (user/service), the action being attempted, and the target resource. Determines if the principal has the required permissions.
    *   **Config:**
        *   `policySourceType` (`enum("Static", "Opa", "DatabaseLookup")` | `PluginIdentifierString`, required): Specifies how authorization decisions are made.
            *   `Static`: Simple check based on required permissions/roles defined directly in config. Core provides basic logic.
            *   `Opa`: Delegates decision to an Open Policy Agent (OPA) instance. Requires OPA integration/plugin.
            *   `DatabaseLookup`: Delegates check to a database query component (typically an `ExternalServiceAdapter` with a DB plugin).
            *   `Plugin`: Uses a custom authorization plugin.
        *   `policySourceConfig` (object, required): Configuration specific to the `policySourceType`. Use Core Secrets if needed. Examples:
            *   `Static`: `{ "requiredPermission": "workspace:read", "allowRoles": ["admin", "editor"] }` (Core evaluates against input `data.principal.permissions`/`data.principal.roles`)
            *   `Opa`: `{ "opaQuery": "data.myapp.authz.allow", "opaInputExpression": "{ principal: data.principal, action: data.action, resource: data.resource }" }` (Input structure sent to OPA)
            *   `DatabaseLookup`: `{ "lookupComponentRef": "step-check-db-permission", "lookupInputExpression": "{ userId: data.principal.id, permission: data.action, resourceId: data.resource.id }" }` (Input for the lookup component)
            *   `Plugin`: `{ /* Plugin specific config */ }`
        *   `inputDataExpression` (`ExpressionString`, optional): JMESPath expression to construct/transform the input `data` before passing it to the policy evaluation logic (Static, OPA, DB, Plugin). Useful for shaping the context. Evaluated in sandbox.
    *   **Inputs:**
        *   `data` (object, required): Input context containing information needed for the authorization decision. Typically includes:
            *   `principal`: { `id`: string, `roles`: list<string>, `permissions`: list<string>, ... } (from `Security.Authenticate`)
            *   `action`: string (e.g., "read", "update", "delete")
            *   `resource`: { `type`: string, `id`: string, `attributes`: {...}, ... }
            *   (Structure can be customized based on policy needs, potentially shaped by `inputDataExpression`)
    *   **Outputs:**
        *   `authorized` (object): Emits the original input `data` (or a subset) if authorization is granted. Allows flow to proceed.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Authorization was denied by the policy, or an error occurred during the check (config error, expression error, policy source communication error).
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" } # `details` might include policy evaluation info if available and safe.
            *   `errorType`: One of ["Security.Authorize.Unauthorized", "Security.Authorize.ConfigError", "Security.Authorize.ExpressionError", "Security.Authorize.PermissionSourceError", "Security.Authorize.PluginError"]
    *   **Required Runtime APIs:**
        *   `sandbox_execute_expression()` # For inputDataExpression and potentially expressions within policySourceConfig
        *   Potentially `execute_component()` (if delegating via `lookupComponentRef`)
        *   Potentially `opa_query()` (if OPA is integrated directly by Core or via plugin)
        *   Potentially `component_loader_load()` (if using plugins)
        *   `get_secret()` # If policySourceConfig needs secrets
        *   `log()`
    *   **Testing Considerations:**
        *   **Unit Tests:** Mock policy source logic (OPA, DB lookup, plugin). Test config parsing. Test authorization decisions (allow/deny) for various combinations of principal, action, resource based on mocked policy. Test expression evaluation.
        *   **Integration Tests:** Requires access to the configured policy source (test OPA instance, test DB, plugin test environment). Test end-to-end authorization decisions for representative scenarios. Test error handling from the policy source.
    *   **Security Considerations:** Critical security enforcement point. Ensure policy source is secure and trusted. Validate all inputs and configurations strictly. Ensure evaluation logic correctly interprets policies. Sandbox expression evaluation. Avoid logging sensitive context data.
    *   **Example DSL:** (Using Static policy source)
        ```yaml
        - step_id: authorize-document-read
          component_ref: Security.Authorize
          config:
            policySourceType: Static
            policySourceConfig:
              # Requires the user to have EITHER the specific permission OR be an admin
              requiredPermission: "'document:read:' & data.resource.id" # Specific permission needed
              # allowRoles: ["admin"] # Alternative: allow if user has 'admin' role
            # inputDataExpression: # Optional: Reshape input if needed, here assume input data is already structured
          inputs_map:
            # Assumes authenticate step provides principal, trigger provides action/resource
            data: "{ principal: steps.authenticate.outputs.claims, action: 'read', resource: trigger.documentMetadata }"
          # Outputs: authorized (contains input 'data'), error (if denied or error)
        ```

*   **`Billing.ProcessPayment`** (Abstract Component)
    *   **Purpose:** Processes payments by integrating with external payment gateways (Stripe, PayPal, Adyen, etc.) via specific plugins. Provides a standard interface for payment operations.
    *   **Config:**
        *   `gatewayType` (`PluginIdentifierString`, required): Identifier for the payment gateway plugin (e.g., "StripeAdapter", "PayPalAdapter"). Core loads the corresponding plugin.
        *   `gatewayConfig` (object, required): Configuration specific to the loaded plugin (e.g., API keys, endpoint URLs, webhook secrets). Structure defined by plugin schema. *Must* use Core Secrets for API keys/secrets.
    *   **Inputs:**
        *   `amount` (`PositiveNumber`, required): Amount to charge, in the smallest currency unit (e.g., cents).
        *   `currency` (`CurrencyCodeString`, required): ISO 4217 currency code (e.g., "USD", "EUR").
        *   `paymentMethodId` (string, required): Token or identifier representing the payment method (e.g., Stripe PaymentMethod ID, PayPal order ID). Provided by frontend integration.
        *   `orderId` (string, optional): Your internal identifier for the transaction/order.
        *   `customerDetails` (object, optional): Customer information (name, email, address). Structure may vary by gateway/plugin.
        *   `metadata` (object, optional): Additional key-value metadata to pass to the gateway.
    *   **Outputs:**
        *   `result`:
            * `description`: Result of the payment processing attempt.
            * `schema`: # Schema defined by plugin, typically includes:
                ```json
                {
                  "type": "object",
                  "properties": {
                    "transactionId": { "type": "string", "description": "Gateway's unique transaction ID." },
                    "status": { "type": "string", "enum": ["succeeded", "pending", "failed", "requires_action"], "description": "Final or intermediate status." },
                    "gatewayResponse": { "type": "object", "description": "Raw or parsed response from the gateway for details/debugging." },
                    "nextAction": { "type": "object", "description": "Details if further action is needed (e.g., 3DS redirect URL)." }
                  }, "required": ["transactionId", "status"]
                }
                ```
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Payment processing failed (e.g., gateway error, invalid payment method, insufficient funds, configuration error). Mapped by plugin.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" } # `details` might contain gateway error code/message.
            *   `errorType`: Defined by plugin (e.g., "Billing.ProcessPayment.GatewayError", "Billing.ProcessPayment.CardDeclined", "Billing.ProcessPayment.ConfigError", "Billing.ProcessPayment.PluginError").
    *   **Required Runtime APIs:** Delegates primarily to the loaded plugin via `Integration.ExternalServiceAdapter` pattern.
        *   `component_loader_load(gatewayType)`
        *   `get_secret()`
        *   Plugin uses its declared capabilities (typically `network`, `log`). Core invokes plugin's payment processing method.
    *   **Testing Considerations:**
        *   **Unit Tests:** Mock the payment gateway plugin. Test successful payments, various failure scenarios (declines, errors), input validation, output mapping based on mock responses.
        *   **Integration Tests:** Requires access to payment gateway's *test* environment. Use test card numbers and scenarios provided by the gateway. Verify end-to-end payment processing, including success, declines, errors, and handling of 3DS/next actions if applicable. **Never use live credentials or real payment methods in tests.**
    *   **Security Considerations:** Highly sensitive component. Use Core Secrets exclusively for API keys/secrets in `gatewayConfig`. Ensure plugin handles data securely (PCI DSS compliance is often relevant). Log transaction outcomes and IDs, but **avoid logging raw payment method details (full card numbers, CVV)**. Restrict access to this component and its configuration. Ensure secure communication (TLS) with the gateway.
    *   **Example DSL:**
        ```yaml
        - step_id: process-payment-with-stripe
          component_ref: Billing.ProcessPayment
          config:
            gatewayType: StripeAdapter # Plugin ID registered in Core
            gatewayConfig: { apiKeySecret: "stripe_secret_key" } # Secret name
          inputs_map:
            amount: "trigger.orderData.amountInCents" # Amount in cents
            currency: "trigger.orderData.currency" # e.g., "USD"
            paymentMethodId: "trigger.paymentMethodId" # From frontend Stripe Elements/SDK
            orderId: "trigger.orderData.orderId"
            customerDetails: "{ email: trigger.customerEmail }" # Example customer info
            metadata: "{ internal_order_ref: trigger.orderData.orderId }"
          # Outputs: result (with transactionId, status, etc.), error
        ```

*   **`Billing.ManageSubscription`** (Abstract Component)
    *   **Purpose:** Manages subscription lifecycle actions (create, cancel, update, retrieve) by integrating with external billing platforms (Stripe Billing, Chargebee, Recurly, etc.) via specific plugins.
    *   **Config:**
        *   `platformType` (`PluginIdentifierString`, required): Identifier for the billing platform plugin (e.g., "StripeBillingAdapter", "ChargebeeAdapter"). Core loads the plugin.
        *   `platformConfig` (object, required): Configuration specific to the loaded plugin (e.g., API keys, endpoint URLs). Structure defined by plugin schema. Use Core Secrets.
        *   `operation` (`enum("CREATE", "CANCEL", "UPDATE", "GET", "LIST_PLANS")`, required): The subscription management action to perform. Defined and implemented by the plugin.
    *   **Inputs:**
        *   `subscriptionData` (object, required): Data payload required for the specific `operation`. Structure varies significantly based on the operation and platform plugin (e.g., for CREATE: `customerId`, `planId`, `paymentMethodId`; for CANCEL: `subscriptionId`; for UPDATE: `subscriptionId`, `newPlanId` or `quantity`).
    *   **Outputs:**
        *   `result`:
            * `description`: Result of the subscription management operation.
            * `schema`: # Schema defined by plugin, depends on operation. Examples:
                *   GET/CREATE/UPDATE: Subscription details object
                    ```json
                    {
                      "type": "object",
                      "properties": {
                        "subscriptionId": { "type": "string" },
                        "status": { "type": "string" }, // e.g., "active", "canceled", "past_due"
                        "planId": { "type": "string" },
                        "customerId": { "type": "string" },
                        "currentPeriodStart": { "type": "string", "format": "date-time" },
                        "currentPeriodEnd": { "type": "string", "format": "date-time" },
                        // ... other platform-specific details
                      }
                    }
                    ```
                *   CANCEL: Confirmation object `{ subscriptionId: "...", status: "canceled" }`
                *   LIST_PLANS: Array of plan objects `[ { planId: "...", name: "...", ... } ]`
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Subscription operation failed (e.g., platform API error, invalid input, configuration error). Mapped by plugin.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" } # `details` might contain platform error info.
            *   `errorType`: Defined by plugin (e.g., "Billing.ManageSubscription.PlatformError", "Billing.ManageSubscription.NotFound", "Billing.ManageSubscription.InvalidOperation", "Billing.ManageSubscription.PluginError").
    *   **Required Runtime APIs:** Delegates primarily to the loaded plugin via `Integration.ExternalServiceAdapter` pattern.
        *   `component_loader_load(platformType)`
        *   `get_secret()`
        *   Plugin uses its declared capabilities (typically `network`, `log`). Core invokes plugin's subscription management method.
    *   **Testing Considerations:**
        *   **Unit Tests:** Mock the billing platform plugin. Test each `operation` with various `subscriptionData` inputs. Verify correct output mapping for success and error scenarios based on mock responses.
        *   **Integration Tests:** Requires access to the billing platform's *test* environment. Test end-to-end lifecycle operations (create, update, cancel, get). Verify subscription states and details in the test platform match expected outcomes. **Never use live credentials or modify real subscriptions in tests.**
    *   **Security Considerations:** Use Core Secrets exclusively for API keys in `platformConfig`. Log operation outcomes and relevant IDs, but avoid logging sensitive customer or payment details unless strictly necessary and compliant. Ensure plugin communicates securely (TLS) with the platform. Restrict access.
    *   **Example DSL:** (Creating a Stripe subscription)
        ```yaml
        - step_id: create-stripe-subscription
          component_ref: Billing.ManageSubscription
          config:
            platformType: StripeBillingAdapter # Plugin ID
            platformConfig: { apiKeySecret: "stripe_secret_key" }
            operation: CREATE
          inputs_map:
            # Structure required by StripeBillingAdapter's CREATE operation
            subscriptionData:
              customerId: "steps.find-or-create-customer.outputs.customerId" # From previous step
              items: # Stripe requires items array
                - price: "trigger.selectedPlanId" # Price ID from Stripe
              # Optional: payment_behavior, default_payment_method, etc.
        ```

*   **`Communication.SendEmail`** (Abstract Component)
    *   **Purpose:** Sends email by integrating with external email delivery services (SendGrid, Mailgun, AWS SES, etc.) via specific plugins.
    *   **Config:**
        *   `serviceType` (`PluginIdentifierString`, required): Identifier for the email service plugin (e.g., "SendGridAdapter", "SesAdapter"). Core loads the plugin.
        *   `serviceConfig` (object, required): Configuration specific to the loaded plugin (e.g., API key, region, domain). Structure defined by plugin schema. Use Core Secrets.
        *   `fromAddress` (`EmailString` | `ExpressionString`, required): The "From" email address. Expression evaluated in sandbox.
        *   `defaultFromName` (string, optional): Default "From" name if not part of `fromAddress`.
    *   **Inputs:**
        *   `toAddresses` (`EmailString` | list<`EmailString`> | `ExpressionString`, required): Single recipient email, list of emails, or expression evaluating to one of these.
        *   `ccAddresses` (`EmailString` | list<`EmailString`> | `ExpressionString`, optional): CC recipients.
        *   `bccAddresses` (`EmailString` | list<`EmailString`> | `ExpressionString`, optional): BCC recipients.
        *   `subject` (`string` | `ExpressionString`, required): Email subject line. Expression evaluated in sandbox.
        *   `bodyHtml` (`string` | `ExpressionString`, optional): HTML content of the email body. Required if `bodyText` and `templateId` are not provided. Expression evaluated in sandbox.
        *   `bodyText` (`string` | `ExpressionString`, optional): Plain text content of the email body. Recommended for multipart emails. Expression evaluated in sandbox.
        *   `templateId` (`string` | `ExpressionString`, optional): ID of a pre-defined template within the email service. If used, `subject`/`bodyHtml`/`bodyText` might be ignored or used as fallbacks depending on the service/plugin.
        *   `templateData` (object | `ExpressionString`, optional): Key-value data to merge into the `templateId` (e.g., `{ "firstName": "...", "orderLink": "..." }`). Structure depends on the template. Expression evaluated in sandbox.
        *   `attachments` (list<`AttachmentObject`>, optional): List of attachments. Schema for `AttachmentObject`: `{ "filename": string, "contentType": string, "content": bytes | ExpressionString }` (content is base64 encoded bytes or expression yielding it).
        *   `data` (object, optional): Context data available for evaluating all expression inputs (`toAddresses`, `subject`, `bodyHtml`, `bodyText`, `templateId`, `templateData`, attachment content).
    *   **Outputs:**
        *   `result`:
             * `description`: Result of the email send attempt.
             * `schema`: # Schema defined by plugin, typically includes:
                 ```json
                 {
                   "type": "object",
                   "properties": {
                     "messageId": { "type": "string", "description": "Optional: Provider's unique message ID, if available immediately." },
                     "status": { "type": "string", "enum": ["queued", "sent"], "description": "Status reported by the service API call (might not mean delivered)." }
                   }, "required": ["status"]
                 }
                 ```
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Email send failed (e.g., service API error, authentication failure, invalid address, template not found, expression error). Mapped by plugin.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" } # `details` might contain service error info.
            *   `errorType`: Defined by plugin (e.g., "Communication.SendEmail.ServiceError", "Communication.SendEmail.InvalidAddress", "Communication.SendEmail.TemplateNotFound", "Communication.SendEmail.PluginError", "Communication.SendEmail.ExpressionError").
    *   **Required Runtime APIs:** Delegates primarily to the loaded plugin via `Integration.ExternalServiceAdapter` pattern.
        *   `component_loader_load(serviceType)`
        *   `get_secret()`
        *   `sandbox_execute_expression()` # For evaluating various inputs
        *   Plugin uses its declared capabilities (typically `network`, `log`). Core invokes plugin's email sending method.
    *   **Testing Considerations:**
        *   **Unit Tests:** Mock the email service plugin. Test sending with direct content vs. templates. Test single/multiple recipients (To, CC, BCC). Test attachments. Verify input passing and output/error mapping based on mock responses. Test expression evaluation.
        *   **Integration Tests:** Requires access to the email service's *test* environment or a mock email server (like MailHog/Mailtrap). Verify emails are generated correctly with expected content, headers, recipients, and attachments. **Avoid sending test emails to real external addresses.**
    *   **Security Considerations:** Use Core Secrets for API keys in `serviceConfig`. Carefully validate recipient addresses to prevent abuse. Sanitize any user-generated content used in `subject`, `bodyHtml`, or `bodyText` to prevent injection attacks (e.g., header injection, HTML/script injection if not intended). Be cautious with template data. Sandbox expression evaluation. Monitor for bounces and complaints.
    *   **Example DSL:** (Using SendGrid Template)
        ```yaml
        - step_id: send-order-confirmation-email
          component_ref: Communication.SendEmail
          config:
            serviceType: SendGridAdapter # Plugin ID
            serviceConfig: { apiKeySecret: "sendgrid_api_key" }
            fromAddress: "'My Shop <orders@my-shop.example.com>'"
          inputs_map:
            toAddresses: "trigger.customer.email"
            templateId: "d-abc123xyz..." # SendGrid Dynamic Template ID
            # Data for the SendGrid template's variables
            templateData:
              expression: > # JMESPath expression to shape template data
                {
                  firstName: trigger.customer.firstName,
                  orderId: trigger.order.id,
                  totalAmount: format_currency(trigger.order.total, trigger.order.currency),
                  items: trigger.order.items[*].{ name: name, quantity: quantity }
                }
            data: "trigger" # Provide trigger data as context for expression
        ```

*   **`Communication.SendNotification`** (Abstract Component - Potential Wrapper)
    *   **Purpose:** Sends notifications via different channels (e.g., Email, SMS, Push Notification, Slack) potentially by routing to more specific components or using a multi-channel plugin. Could wrap `Communication.SendEmail` or delegate to other specific components/plugins.
    *   **Config:**
        *   `channel` (`enum("Email", "SMS", "Push", "Slack")` | `ExpressionString`, required): Target communication channel. Expression allows dynamic routing.
        *   `serviceType` (`PluginIdentifierString` | `ExpressionString`, optional): Identifier for the specific service plugin *for the chosen channel* (e.g., "TwilioAdapter" for SMS, "FcmAdapter" for Push). Might be determined implicitly by channel or require explicit config.
        *   `serviceConfig` (object | `ExpressionString`, optional): Plugin/channel-specific configuration. Use Core Secrets. Structure defined by target plugin/channel logic. Expression evaluated in sandbox.
        *   `templateId` (`string` | `ExpressionString`, optional): Template ID specific to the service/channel.
    *   **Inputs:**
        *   `recipient` (any | `ExpressionString`, required): Recipient identifier (e.g., email address, phone number E.164, push token, Slack webhook URL/channel ID). Structure depends on channel. Expression evaluated in sandbox.
        *   `message` (string | object | `ExpressionString`, required): Message content payload. Structure depends heavily on channel (e.g., string for SMS, object for Push payload, object for Slack blocks). Expression evaluated in sandbox.
        *   `data` (object, optional): Context data available for evaluating expression inputs (`channel`, `serviceType`, `serviceConfig`, `recipient`, `message`, `templateId`).
    *   **Outputs:**
        *   `result`:
            * `description`: Result of the notification send attempt.
            * `schema`: # Schema defined by underlying plugin/component, typically includes:
                ```json
                {
                  "type": "object",
                  "properties": {
                    "deliveryId": { "type": "string", "description": "Optional: Provider's unique delivery/message ID." },
                    "status": { "type": "string", "enum": ["queued", "sent", "..."], "description": "Status reported by service." }
                  }, "required": ["status"]
                }
                ```
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Notification send failed (e.g., channel error, service API error, invalid recipient, config error, expression error). Mapped by underlying component/plugin.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" }
            *   `errorType`: Defined by underlying component/plugin (e.g., "Communication.SendNotification.ChannelError", "Communication.SendNotification.ServiceError", "Communication.SendNotification.PluginError", "Communication.SendNotification.ExpressionError").
    *   **Required Runtime APIs:** Delegates to underlying components/plugins (like `Communication.SendEmail`, `TwilioAdapter` plugin, etc.).
        *   `component_loader_load()` # If using dynamic plugins
        *   `get_secret()`
        *   `sandbox_execute_expression()` # For evaluating inputs
        *   Potentially `execute_component()` if wrapping other StdLib components.
    *   **Testing Considerations:**
        *   **Unit Tests:** Mock the underlying components/plugins for each channel. Test routing logic based on `channel` input. Verify correct parameters are passed to the mocked downstream component/plugin. Test expression evaluation.
        *   **Integration Tests:** Requires test environments/accounts for each supported notification service (e.g., test email service, Twilio test credentials, FCM test setup). Test end-to-end sending for each channel. **Avoid sending to real external recipients.**
    *   **Security Considerations:** Use Core Secrets for credentials. Validate recipient identifiers. Sanitize message content appropriately for each channel to prevent injection attacks. Be mindful of rate limits and costs associated with different channels/services. Sandbox expression evaluation.
    *   **Example DSL:** (Sending an SMS via Twilio - assumes Twilio plugin exists)
        ```yaml
        - step_id: send-shipping-alert-sms
          component_ref: Communication.SendNotification
          config:
            channel: SMS
            serviceType: TwilioAdapter # Plugin ID for Twilio
            serviceConfig:
              accountSidSecret: "twilio_account_sid"
              authTokenSecret: "twilio_auth_token"
              fromNumber: "{{secrets.twilio_from_number}}" # From number configured in secrets
          inputs_map:
            recipient: "trigger.userProfile.phoneNumber" # E.164 format phone number
            # Simple string message for SMS
            message: "'Your order ' & trigger.orderId & ' has shipped! Track here: ' & trigger.trackingLink"
            data: "trigger" # Context for message expression
        ```

*   **`Platform.QuotaCheck`**
    *   **Purpose:** Checks if a proposed action would exceed a defined usage quota for a given scope (e.g., API calls per user per month). Typically reads current usage and limit from a KV store or configuration source. Often used before performing a rate-limited action.
    *   **Config:**
        *   `quotaType` (`QuotaTypeString`, required): Identifier for the specific quota being checked (e.g., "api_calls_per_month", "storage_gb").
        *   `scopeType` (`enum("account", "project", "user")`, required): The entity level at which the quota applies.
        *   `limitSource` (`enum("Config", "KvStore")`, optional, default: "Config"): Where to find the quota limit.
        *   `limitValue` (`PositiveInteger`, required if `limitSource`="Config"): The static quota limit.
        *   `limitKeyExpression` (`ExpressionString`, required if `limitSource`="KvStore"): Expression evaluating to the KV store key where the limit is stored. Evaluated in sandbox.
        *   `usageSource` (`enum("KvStore")`, required): Where to find the current usage count. Currently only KvStore assumed.
        *   `usageKeyExpression` (`ExpressionString`, required): Expression evaluating to the KV store key where the current usage count is stored. Key often includes `quotaType` and the scope ID. Evaluated in sandbox.
        *   `language` (`enum("JMESPath", "JsonPointer")`, optional, default: "JMESPath"): Language for key/limit expressions.
    *   **Inputs:**
        *   `data` (object, required): Input data containing the scope identifier (e.g., `{ accountId: "..." }` or `{ userId: "..." }`) needed for key expressions, and potentially context for limit expression.
        *   `incrementBy` (`PositiveInteger`, optional, default: 1): The amount the usage *would* increase by if the action is allowed. Used to check `currentUsage + incrementBy <= limit`. Defaults to 1 for simple checks. Set to 0 to just check current usage against limit without proposed increment.
    *   **Outputs:**
        *   `pass` (object): Emitted if `currentUsage + incrementBy <= limit`. Contains the input `data` object.
        *   `currentUsage` (integer): The current usage value retrieved from the `usageSource`.
        *   `limit` (integer): The effective limit retrieved from `limitSource`.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Quota would be exceeded (`Platform.QuotaCheck.OverQuota`), or an error occurred during configuration, expression evaluation, or accessing the storage/limit source.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" } # `details` includes `currentUsage`, `limit`, `incrementBy` if OverQuota.
            *   `errorType`: One of ["Platform.QuotaCheck.OverQuota", "Platform.QuotaCheck.ConfigError", "Platform.QuotaCheck.ExpressionError", "Platform.QuotaCheck.StorageError", "Platform.QuotaCheck.LimitSourceError"]
    *   **Required Runtime APIs:**
        *   `kv_get(key)` # To read current usage and potentially limit
        *   `sandbox_execute_expression()` # For key and limit expressions
        *   `log()`
    *   **Testing Considerations:**
        *   **Unit Tests:** Mock the `kv_get` API. Test scenarios where usage is below, at, and above the limit (considering `incrementBy`). Test static limits (`limitValue`) and dynamic limits (`limitKeyExpression`). Test expression evaluation for keys. Verify correct output (`pass` or `error`) and associated data (`currentUsage`, `limit`).
        *   **Integration Tests:** Requires a test KV store configured. Populate usage and limit keys. Verify end-to-end check logic for different scenarios.
    *   **Security Considerations:** Ensure KV store keys cannot be manipulated by user input (construct keys server-side using validated scope IDs). Restrict access to the KV store. Ensure the source of quota limits (`limitSource`) is trustworthy. Sandbox expression evaluation. *Note: This component typically only checks; a separate component/step is needed to actually increment the usage count in the KV store after the action succeeds.*
    *   **Example DSL:** (Checking API calls per account, limit stored in KV)
        ```yaml
        - step_id: check-account-api-quota
          component_ref: Platform.QuotaCheck
          config:
            quotaType: api_calls_per_day
            scopeType: account
            limitSource: KvStore
            limitKeyExpression: "'limits:account:' & data.accountId & ':api_calls_per_day'"
            usageSource: KvStore
            usageKeyExpression: "'usage:account:' & data.accountId & ':api_calls_per_day'"
            language: JMESPath
          inputs_map:
            # Assumes auth context provides accountId
            data: "{ accountId: steps.authenticate.outputs.claims.accountId }"
            incrementBy: 1 # Check if allowing 1 more call is okay
          # Outputs: pass (contains input data), currentUsage, limit, error (if over quota etc.)
        ```

*   **`AI.Generate`** (Abstract Component)
    *   **Purpose:** Generates text, code, or other content using a configured Large Language Model (LLM) accessed via a specific plugin.
    *   **Config:**
        *   `llmType` (`PluginIdentifierString`, required): Identifier for the LLM integration plugin (e.g., "OpenAIAdapter", "AnthropicAdapter", "VertexAIAdapter"). Core loads the plugin.
        *   `llmConfig` (object, required): Configuration specific to the loaded plugin (e.g., model name like "gpt-4", API key secret ref, endpoint URL, project ID). Structure defined by plugin schema. Use Core Secrets.
        *   `promptExpression` (`ExpressionString`, required): Expression evaluating to the final prompt string or structured prompt object (e.g., list of messages for chat models) to be sent to the LLM. Evaluated in sandbox using input `data`.
        *   `language` (`enum("JMESPath", "JsonPointer")`, optional, default: "JMESPath"): Language for `promptExpression`.
        *   `generationParameters` (object, optional): Parameters controlling the LLM's generation process (e.g., `temperature`, `max_tokens`, `top_p`, `stop_sequences`). Structure and allowed values depend on the specific LLM and plugin.
    *   **Inputs:**
        *   `data` (object, required): Context data available for evaluating `promptExpression`.
    *   **Outputs:**
        *   `modelAnswer` (string | object): The generated content from the LLM. Usually a string, but could be an object if the model returns structured data (e.g., JSON mode).
        *   `usage` (object, optional): Information about token usage for the request, if provided by the plugin/LLM.
            * `description`: Token usage details.
            * `schema`: # Typically defined by plugin, e.g.,
                ```json
                {
                  "type": "object",
                  "properties": {
                    "promptTokens": { "type": "integer" },
                    "completionTokens": { "type": "integer" },
                    "totalTokens": { "type": "integer" }
                  }
                }
                ```
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error occurred during prompt evaluation, communicating with the LLM service, or processing the response (e.g., API error, content filtering, rate limit, config error). Mapped by plugin.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" } # `details` might contain LLM service error info.
            *   `errorType`: Defined by plugin (e.g., "AI.Generate.ExpressionError", "AI.Generate.PluginError", "AI.Generate.ServiceError.RateLimit", "AI.Generate.ServiceError.ContentFiltered", "AI.Generate.ConfigError").
    *   **Required Runtime APIs:** Delegates primarily to the loaded plugin via `Integration.ExternalServiceAdapter` pattern.
        *   `component_loader_load(llmType)`
        *   `get_secret()`
        *   `sandbox_execute_expression()` # For promptExpression
        *   Plugin uses its declared capabilities (typically `network`, `log`). Core invokes plugin's generation method.
    *   **Testing Considerations:**
        *   **Unit Tests:** Mock the LLM plugin. Test config parsing, `promptExpression` evaluation, input passing to mock plugin, output/error mapping based on mock responses. Test handling of `generationParameters`.
        *   **Integration Tests:** Requires access to the LLM service (potentially with a dedicated test key/project). Verify successful generation for simple prompts. Test different `generationParameters`. Test error handling (e.g., invalid API key, rate limits - may be hard to reliably trigger). **Focus on integration, not the quality of LLM output.**
    *   **Security Considerations:** Use Core Secrets for API keys in `llmConfig`. Be extremely cautious about including sensitive data in prompts sent to external LLM services. Filter or sanitize user input used in prompts to prevent prompt injection attacks. Be aware of potential data privacy implications of the LLM service used. Consider content filtering provided by the service or implement input/output filtering. Sandbox `promptExpression` evaluation. Monitor costs associated with token usage.
    *   **Example DSL:** (Generating a summary using OpenAI)
        ```yaml
        - step_id: generate-text-summary
          component_ref: AI.Generate
          config:
            llmType: OpenAIAdapter # Plugin ID
            llmConfig:
              apiKeySecret: "openai_api_key"
              model: "gpt-3.5-turbo-instruct" # Or a chat model like "gpt-4"
            promptExpression: "'Summarize the following text in one paragraph:\n\n' & data.longText"
            language: JMESPath
            generationParameters:
              max_tokens: 150
              temperature: 0.5
          inputs_map:
            # Assumes previous step provided text to summarize
            data: "{ longText: steps.fetch-document.outputs.content }"
          # Outputs: modelAnswer (the summary string), usage, error
        ```

**3.10 Cryptography Components:**

*   **`Crypto.SecureExecutor`** (NEW in V3.2)
    *   **Purpose:** Performs sensitive cryptographic operations (e.g., signing data, encrypting/decrypting data, verifying signatures) by delegating to a secure backend via a specific plugin. Uses key identifiers, not raw keys.
    *   **Config:**
        *   `executorType` (`PluginIdentifierString`, required): Identifier for the secure execution backend plugin (e.g., "VaultTransitEngineAdapter", "AwsKmsAdapter", "AzureKeyVaultAdapter"). Core loads the plugin.
        *   `executorConfig` (object, required): Configuration specific to the loaded plugin (e.g., KMS endpoint URL, Vault address, authentication secret refs). Structure defined by plugin schema. Use Core Secrets.
        *   `operation` (`OperationNameString`, required): Logical cryptographic operation defined and supported by the plugin (e.g., "SignEcdsaSha256", "VerifyRsaPkcs1Sha512", "EncryptAesGcm", "DecryptAesGcm", "GenerateDataKey").
        *   `keyIdentifier` (`KeyIdentifierString` | `ExpressionString`, required): The identifier (name, alias, ARN, path) of the key within the secure backend that the plugin should use for the operation. *This is NOT the key material itself.* Expression evaluated in sandbox.
    *   **Inputs:**
        *   `payload` (string | bytes | `ExpressionString`, required): The data input for the operation. Format depends on the `operation`:
            *   For signing: Typically the base64 encoded hash of the data to be signed.
            *   For verification: Typically the original data hash (base64) and the signature (base64). Often passed in `parameters`.
            *   For encryption: Typically the base64 encoded plaintext.
            *   For decryption: Typically the base64 encoded ciphertext.
            Expression evaluated in sandbox.
        *   `parameters` (object | `ExpressionString`, optional): Additional parameters required by the specific `operation` (e.g., signature value for verification, encryption context/AAD, initialization vector/nonce). Structure defined by plugin/operation. Expression evaluated in sandbox.
    *   **Outputs:**
        *   `result` (string | bytes | boolean): The outcome of the cryptographic operation. Format depends on the `operation`:
            *   Signing: Base64 encoded signature.
            *   Verification: Boolean (`true` if valid, `false` if invalid).
            *   Encryption: Base64 encoded ciphertext.
            *   Decryption: Base64 encoded plaintext.
        *   `error`:
            *   `is_error_path`: true
            *   `description`: Error occurred during the secure operation (e.g., plugin communication error, backend error, invalid key identifier, invalid payload/parameters, verification failure - distinct from boolean false result). Mapped by plugin.
            *   `schema`: { "$ref": "#/definitions/schemas/StandardErrorStructure" } # `details` might contain backend error codes.
            *   `errorType`: Defined by plugin (e.g., "SecureExecutorError.PluginError", "SecureExecutorError.BackendError.AccessDenied", "SecureExecutorError.InvalidKey", "SecureExecutorError.InvalidInput", "SecureExecutorError.ConfigError", "SecureExecutorError.ExpressionError"). Note: Signature verification failure results in `result: false`, not an error output unless the operation itself failed.
    *   **Required Runtime APIs:** Delegates primarily to the loaded plugin via `Integration.ExternalServiceAdapter` pattern.
        *   `component_loader_load(executorType)`
        *   `get_secret()` # For executorConfig secrets
        *   `sandbox_execute_expression()` # For keyIdentifier, payload, parameters expressions
        *   Plugin uses its declared capabilities (potentially `network` to reach HSM/KMS, `log`). Core invokes plugin's crypto operation method.
    *   **Testing Considerations:**
        *   **Unit Tests:** Mock the secure executor plugin. Test config parsing, input passing (payload, parameters, keyId) to mock plugin, output/error mapping based on mock responses for various operations (sign, encrypt, decrypt, verify). Test expression evaluation.
        *   **Integration Tests:** Requires access to the configured secure backend (e.g., test KMS instance, local Vault dev server).
            *   Provision test keys in the backend.
            *   Test successful execution of supported operations (sign, encrypt, decrypt, verify) using the correct `keyIdentifier`.
            *   Verify results are correct (e.g., decrypt(encrypt(data)) == data, verify(sign(data)) == true).
            *   Test error conditions (invalid key ID, insufficient permissions in backend, invalid payload/signature).
        *   **Security Tests:** Focus on configuration security, input validation within the plugin (if applicable), and ensuring no key material is ever exposed. Test access control policies in the backend.
    *   **Security Considerations:** Critical security component. Use Core Secrets exclusively for authentication details in `executorConfig`. **Never handle raw private keys in the flow.** Ensure the `keyIdentifier` cannot be controlled by untrusted input if multiple keys exist. Restrict network access if plugin requires it. Ensure plugin is obtained from a trusted source. Audit all cryptographic operations via `StdLib:AuditLogger` or equivalent. Use strong, appropriate algorithms and key types configured in the backend. Sandbox expression evaluation.
    *   **Example DSL:** (Signing a document hash using AWS KMS)
        ```yaml
        - step_id: sign-document-hash-with-kms
          component_ref: Crypto.SecureExecutor
          config:
            executorType: AwsKmsAdapter # Plugin ID
            executorConfig:
              region: "us-east-1"
              # Assumes Core provides AWS credentials via IAM role or secrets
            operation: "SignEcdsaSha256" # Operation defined by the plugin
            keyIdentifier: "alias/my-signing-key" # KMS Key Alias
          inputs_map:
            # Payload is the base64 encoded SHA256 hash
            payload: "steps.calculate-hash.outputs.base64Hash"
            # parameters: {} # No extra params needed for this KMS sign op typically
          # Outputs: result (base64 signature), error
        ```

**4. Plugin Specification (General)**
**(REVISED in V4.3)**

This section describes the *common requirements* for all plugins that extend the functionality of abstract StdLib components like `Execution.SandboxRunner`, `Integration.ExternalServiceAdapter`, `Integration.StreamIngestor`, `Crypto.SecureExecutor`, `Execution.RuleEngine`, `StdLib:ExternalWorkflowCoordinator`, `Billing.ProcessPayment`, `Communication.SendEmail`, `AI.Generate`, etc. Plugins provide the concrete implementations behind the abstract component interfaces.

1.  **Purpose:** Plugins encapsulate specific external integrations (databases, APIs, streams, cloud services), algorithms (rule engines, sandboxed code), or secure operations (crypto backends). They are loaded and invoked by their corresponding abstract StdLib components based on configuration (e.g., `adapterType`, `engineType`, `llmType`). Plugins allow extending Cascade's capabilities without modifying the core runtime or StdLib. They are *not* directly wired into the DSL themselves; the abstract StdLib component acts as the host/interface.

2.  **Target Component:** Each plugin *must* be designed to work with a specific abstract StdLib component (e.g., `Integration.ExternalServiceAdapter`) and target compatible versions of the StdLib/Core Runtime. The plugin's metadata declares this target.

3.  **Interface Contract:** Plugins *must* implement a defined interface expected by their host StdLib component. While the exact function signatures vary by implementation language (e.g., WASM export names), the *logical* contract is consistent:
    *   **Initialization (Optional but Recommended):** Plugins may have an initialization function called once upon loading or first use. It receives the plugin-specific configuration (e.g., `adapterConfig`, `engineConfig`) parsed from the host component's config, and a restricted `ComponentRuntimeAPI` subset containing capabilities declared in metadata (like `get_secret`, `log`). This allows pre-computation, client setup, etc. **Conceptual Signature:** `init(config: JsonValue, runtime: RestrictedRuntimeAPI) -> Result<(), PluginError>`
    *   **Execution Function:** Plugins *must* expose a main execution function (e.g., `execute`, `handle_message`, `invoke_operation`, `generate`, `send`) that is called by the host component. It receives the relevant input payload (`requestData`, `facts`, `payload`, prompt, message etc.) and operation-specific parameters (`operation`, `keyIdentifier`, generation params, etc.) from the host. This function also receives a restricted `ComponentRuntimeAPI` instance scoped to the current execution, allowing access to declared capabilities like logging, state, timers, or network calls *initiated by the plugin*. **Conceptual Signature Example:** `execute(input: JsonValue, params: JsonValue, runtime: RestrictedRuntimeAPI) -> Result<JsonValue, PluginError>` (Params might include `operation`, `keyIdentifier`, etc. Input/output `JsonValue` represents the data payload). Stream ingestors might have different interfaces (`poll`, `ack`).
    *   **State Management:** If a plugin needs to maintain state across invocations (e.g., consumer offsets, internal counters), it *must* use the `ComponentRuntimeAPI` (`get_state`, `set_state`) provided by the Core, declaring the `state` capability in its metadata. State keys must be appropriately namespaced by the plugin to avoid collisions.
    *   **Timers:** If a plugin needs timed execution or delays (e.g., polling in `waitForCompletion`, session gaps, internal timeouts), it *must* use the `ComponentRuntimeAPI` (`set_timer`, `clear_timer`) and declare the `timers` capability.
    *   **Input/Output:** Plugins receive input data (typically deserialized JSON or bytes passed by the host component) and return output data (JSON or bytes) or a structured error upon failure. Clear documentation of expected input/output structures for each supported operation is crucial.
    *   **Error Handling:** Plugins *must* catch their internal errors (network issues, external service errors, parsing failures, logic errors) and map them into the centrally defined *Standard Error Structure*. The `type` field should be specific and ideally prefixed (e.g., `AdapterError.ServiceUnavailable`, `SecureExecutorError.InvalidKeyId`, `PluginError.Internal`). This structure is returned as the error result to the host component, enabling consistent error handling in the flow DSL. **Sensitive details must not be included in the returned error object.**

4.  **Configuration Schema:** Each plugin *must* define the expected structure, types, and validation rules for its specific configuration object (e.g., `adapterConfig`, `engineConfig`). This *must* be provided as a machine-readable schema (JSON Schema recommended) within the plugin's metadata. The schema should clearly document required fields, optional fields, default values, and which fields expect references to Core Secrets (e.g., using a specific property name pattern like `...SecretRef` or a schema annotation like `"format": "secret-ref"`).

5.  **Capabilities:** Plugins *must* declare the specific `ComponentRuntimeAPI` capabilities they require to function in their metadata (e.g., `network`, `secrets`, `kv_get`, `log`, `state`, `timers`, `filesystem_read`, `filesystem_write`). The Core Runtime *must* use this declaration for security policy enforcement (e.g., restricting network access for plugins that don't declare it). A **restricted subset** of the `ComponentRuntimeAPI` is passed to the plugin at runtime, containing only the declared and allowed capabilities. Attempting to use an undeclared or disallowed capability *must* result in a runtime error enforced by the Core.

6.  **Implementation Language & Environment:** Plugins should preferably be implemented in languages compilable to **WASM** (WebAssembly) for security (sandboxing), portability, and performance. Trusted native plugins might be supported by the Core Runtime but require significantly stricter security vetting and platform operator approval due to the lack of inherent sandboxing.

7.  **Deployment & Versioning:** Plugins are deployed and versioned independently of the StdLib and Core Runtime. A Core Runtime plugin registry *must* exist to manage plugin artifacts (e.g., WASM binaries), versions, and metadata. The identifiers used in StdLib component configurations (`adapterType`, `engineType`, etc.) *must* resolve to a specific, compatible plugin version via this registry.

8.  **Metadata:** Each plugin artifact *must* be accompanied by metadata (e.g., a `manifest.json` file within the package) containing at least:
    *   `pluginId` (string, required): A unique identifier for the plugin (e.g., "my-company/aws-kms-adapter"). Used in StdLib component config.
    *   `pluginName` (string, optional): Human-readable name.
    *   `pluginVersion` (string, required): Semantic version (e.g., "1.2.0").
    *   `targetComponent` (string, required): The fully qualified `type` of the abstract StdLib component it extends (e.g., `Integration.ExternalServiceAdapter`).
    *   `compatibility` (object, required): Specifies compatible versions of StdLib and Core Runtime (e.g., `{ "stdlib": ">=4.3 <5.0", "core": ">=1.5 <2.0" }`).
    *   `configurationSchema` (object, required): JSON Schema definition for the plugin's specific configuration object (`adapterConfig`, etc.).
    *   `capabilitiesRequired` (list<string>, required): List of required Core Runtime API capabilities (e.g., `["network", "secrets", "log"]`).
    *   `description` (string, optional): Brief description of the plugin's function.
    *   `operations` (list<object>, optional): For plugins supporting multiple actions, list of supported logical operations with their input/output schemas. E.g., `[{ "name": "SignEcdsaSha256", "inputSchema": {...}, "outputSchema": {...} }, ...]`.
    *   `author` (string, optional): Plugin author/maintainer.
    *   `license` (string, optional): SPDX license identifier.
    *   `support` (string, optional): URL or contact info for support.

9.  **Testing Requirements (for Plugin Developers):** Plugin developers are responsible for rigorous testing:
    *   **Unit Tests:** Test the plugin's core logic in isolation. Mock the `RestrictedRuntimeAPI` to simulate Core interactions (state, secrets, timers, logging) and external dependencies (network calls). Verify input parsing (config and payload), output generation, state transitions, and accurate error mapping to the `StandardErrorStructure`. Test edge cases, invalid inputs, and boundary conditions.
    *   **Integration Tests:** Test the plugin against its real dependencies (e.g., external service test endpoints, test databases, test KMS keys) in a controlled environment. Verify successful interaction, authentication, data exchange, and error handling scenarios specific to the external system.
    *   **Compatibility Tests:** Package the plugin (e.g., compile to WASM) and test that it loads and functions correctly when invoked by the target abstract StdLib component within a compatible Core Runtime version.
    *   **Security Tests:** Implement security by design. Test input validation thoroughly. Test capability enforcement (attempt to use undeclared capabilities via mocked runtime). If handling sensitive data or interacting with secure backends, perform security-focused testing (e.g., dependency scanning, fuzzing where appropriate).

10. **Security Considerations (for Plugin Developers):**
    *   **Least Privilege:** Declare *only* the capabilities absolutely required.
    *   **Input Validation:** Strictly validate all configuration inputs and data payloads received from the host component. Assume inputs can be untrusted.
    *   **Secrets Management:** Use the `get_secret` capability *exclusively* for retrieving sensitive configuration. Never log secrets or embed them in code/config.
    *   **Secure Communication:** Use TLS/SSL with proper certificate validation for all network communication initiated by the plugin.
    *   **Error Handling:** Ensure returned errors (StandardErrorStructure) do not leak sensitive information.
    *   **Resource Management:** Avoid excessive resource consumption (CPU, memory, network bandwidth). Implement internal timeouts if necessary for external calls.
    *   **Dependency Security:** Keep third-party libraries used within the plugin up-to-date and scan them for vulnerabilities.
    *   **Code Integrity:** Ensure the plugin artifact (WASM binary) can be built deterministically and its integrity verified (e.g., via checksums managed by the plugin registry).

**5. Example Flows (Illustrative)**

These examples demonstrate how StdLib components, including the abstract components leveraging plugins, can be composed in the DSL.

**Example Flow 1: Simple API Call with Retry (DSL V1.0 - V4.31 compatible)**

```yaml
dsl_version: "1.0" # Assumes DSL is stable, component contracts updated
definitions:
  components:
    # Assume StdLib component types are implicitly known or defined elsewhere
    - name: StdLib:HttpCall
    - name: Reliability.RetryWrapper
    - name: StdLib:Logger
    - name: StdLib:FailFlow

  flows:
    - name: flow-retry-api-call-explicit
      description: Makes an API call and retries on specific errors using explicit wiring.
      trigger:
        type: ManualTrigger
        output_name: triggerData # Expects { targetUrl: "...", someInput: "..." }

      steps:
        # 1. Define the Retry Policy
        - step_id: retry-policy
          component_ref: Reliability.RetryWrapper
          config:
            maxRetries: 2
            delayMs: 1000
            backoffMultiplier: 1.5
            retryableErrorTypes: ["HttpCall.NetworkError", "HttpCall.TimeoutError", "HttpCall.BadResponseStatus"]
          inputs_map:
            trigger: "trigger.triggerData" # Data for first attempt, stored in state

        # 2. The Wrapped HTTP Call
        - step_id: call-the-api
          component_ref: StdLib:HttpCall
          config:
            method: POST
            contentType: "application/json"
          inputs_map:
            # Use the attemptData output from RetryWrapper for each attempt
            data: "steps.retry-policy.outputs.attemptData"
            # Extract URL from attemptData (which holds original trigger data)
            url: "steps.retry-policy.outputs.attemptData.targetUrl"
          outputs_map: # Connect outputs back explicitly to RetryWrapper's INPUTS
            response: "steps.retry-policy.inputs.wrappedOutput" # Target success input port
            error: "steps.retry-policy.inputs.wrappedError"     # Target error input port
          run_after: [retry-policy] # Logically runs after retry-policy emits attemptData

        # 3. Log Final Success
        - step_id: log-success
          component_ref: StdLib:Logger
          config: { level: INFO, messageExpression: "'API call succeeded: ' & dump(data.response)" }
          inputs_map:
            data: "{ response: steps.retry-policy.outputs.result }" # Final result from wrapper
          run_after: [retry-policy] # Runs only if retry-policy outputs 'result'

        # 4. Handle Final Failure
        - step_id: handle-failure
          component_ref: StdLib:FailFlow
          config:
            errorMessageExpression: "'API call failed permanently: ' & data.type & ' - ' & data.message"
          inputs_map:
            data: "steps.retry-policy.outputs.error" # Final error from wrapper
          run_after: [retry-policy] # Runs only if retry-policy outputs 'error'
```

**Example Flow 2: E-commerce Order Item Fulfillment Step (DSL V1.0 - Updated for V4.33 Plugin Model)**
*This example uses `Integration.ExternalServiceAdapter` for both stock check and inventory update, demonstrating plugin usage.*

```yaml
dsl_version: "1.0"
definitions:
  components:
    # Define component types used - assume StdLib types known
    - name: StdLib:SplitList
    - name: Integration.ExternalServiceAdapter # Used for stock check AND inventory update
    - name: StdLib:MapData
    - name: StdLib:AggregateItems
    - name: StdLib:Logger
    - name: StdLib:FailFlow

  flows:
    - name: flow-order-item-fulfillment-v433
      description: Processes individual order items for fulfillment using DSL V1.0 components (V4.33 spec with plugins).
      trigger:
        type: ManualTrigger # Placeholder
        output_name: orderData # Expects { orderId: "...", items: [ {id: 'A', qty: 1}, ... ] }

      steps:
        # 1. Split the list of order items
        - step_id: step-split-items
          component_ref: StdLib:SplitList
          config: { listExpression: "items", itemOutputName: "item" }
          inputs_map:
            data: "trigger.orderData"

        # --- Per-Item Processing Branch ---

        # 2. Check stock using an Adapter Plugin
        - step_id: step-check-stock
          component_ref: Integration.ExternalServiceAdapter
          config:
            adapterType: InventoryServiceHttpAdapter # Plugin ID for Stock Service
            adapterConfig: { baseUrl: "{{secrets.inventory_svc_url}}" } # Config for the plugin
            operation: CheckStock # Operation defined by the plugin
          inputs_map:
             # Input structure expected by the 'CheckStock' operation of the plugin
            requestData: "{ sku: steps.step-split-items.outputs.item.id, quantityNeeded: steps.step-split-items.outputs.item.qty }"
          run_after: [step-split-items] # Depends on each 'item' output

        # 3. Reserve Inventory (using ExternalServiceAdapter with SQL plugin) if stock check succeeded
        - step_id: step-reserve-inventory # Now uses Adapter
          component_ref: Integration.ExternalServiceAdapter
          config:
            adapterType: PostgresSqlAdapter # Example DB Plugin ID
            adapterConfig: { dataSourceName: "inventory_db_write" } # Plugin uses Core datasource config
            operation: Execute # DB Plugin defines 'Execute' operation
          inputs_map:
            # requestData structure defined by PostgresSqlAdapter for 'Execute'
            requestData:
              statement: "UPDATE inventory SET reserved_count = reserved_count + :qty WHERE sku = :sku AND (available_count - reserved_count) >= :qty"
              parameters: "{ sku: steps.step-check-stock.outputs.responseData.sku, qty: steps.step-split-items.outputs.item.qty }"
              options: { returnAffectedCount: true } # Ask plugin to return count
          run_after: [step-check-stock] # Runs only if step-check-stock outputs responseData

        # 4. Map successful reservation result
        - step_id: step-map-reservation-success
          component_ref: StdLib:MapData
          config:
            # Assuming plugin returns { affectedCount: 1 } in responseData on success
            expression: "{ itemId: data.sku, reserved: true, message: 'Inventory reserved' }"
          inputs_map:
            # Check affectedCount from Adapter's responseData to confirm success
            # Filter: only proceed if affectedCount > 0 (simplified logic - may need refinement based on exact plugin output)
            data: "steps.step-reserve-inventory.outputs.responseData[?affectedCount > `0`].{sku: steps.step-reserve-inventory.inputs.requestData.parameters.sku} | [0]"
          run_after: [step-reserve-inventory] # Runs only if step-reserve-inventory outputs responseData

        # 5. Map stock check error result
        - step_id: step-map-stock-error
          component_ref: StdLib:MapData
          config:
            expression: "{ itemId: data.itemId, reserved: false, message: 'Stock check failed: ' & data.error.message }"
          inputs_map:
            data: "{ itemId: steps.step-split-items.outputs.item.id, error: steps.step-check-stock.outputs.error }"
          run_after: [step-check-stock] # Runs only if stock check errors

        # 6. Map inventory reservation error/failure result
        - step_id: step-map-reservation-error
          component_ref: StdLib:MapData
          config:
            # Handle DB adapter error OR failure to reserve (affectedCount = 0 in responseData)
            expression: "{ itemId: data.itemId, reserved: false, message: data.error ? ('Inventory update failed: ' & data.error.message) : 'Insufficient stock for reservation' }"
          inputs_map:
            # Trigger on DB adapter error OR on success output where affectedCount == 0
            # Logic combining error path and success path checking affectedCount is complex in DSL V1, simplified here
            data: # This mapping likely needs refinement based on exact plugin output structure for errors vs. logical failures
              - "steps.step-reserve-inventory.outputs.error.{itemId: steps.step-reserve-inventory.inputs.requestData.parameters.sku, error: @}" # Map error
              # Map the success case where affectedCount is 0 (requires parsing responseData)
              # - "steps.step-reserve-inventory.outputs.responseData[?affectedCount == `0`].{itemId: steps.step-reserve-inventory.inputs.requestData.parameters.sku} | [0]"
          run_after: [step-reserve-inventory] # Runs if reserve step outputs error OR responseData

        # --- Aggregation ---

        # 7. Aggregate results from all item branches
        - step_id: step-aggregate-results
          component_ref: StdLib:AggregateItems
          config:
            itemInputName: itemOutcome
            completionInputName: allItemsSplit
            aggregateOutputName: itemResultsList
          inputs_map:
            # Collect results from all possible outcomes of the item processing branch
            itemOutcome: [
                "steps.step-map-reservation-success.outputs.result",
                "steps.step-map-stock-error.outputs.result",
                "steps.step-map-reservation-error.outputs.result"
              ]
            allItemsSplit: "steps.step-split-items.outputs.processingComplete"
          run_after: [step-map-reservation-success, step-map-stock-error, step-map-reservation-error] # Wait for all possible item outcomes

        # 8. Handle Aggregation Error -> Fail Flow
        - step_id: step-handle-aggregation-error
          component_ref: StdLib:FailFlow
          config: { errorMessageExpression: "'Aggregation failed: ' & data.message" }
          inputs_map:
            data: "steps.step-aggregate-results.outputs.error"
          run_after: [step-aggregate-results]

        # 9. Log Aggregated Results (If Aggregation Succeeded)
        - step_id: step-log-aggregated-results
          component_ref: StdLib:Logger
          config: { level: INFO, messageExpression: "'Item processing results: ' & dump(data)" }
          inputs_map:
            data: "steps.step-aggregate-results.outputs.itemResultsList"
          run_after: [step-aggregate-results]

        # ... subsequent steps analyzing the itemResultsList (e.g., proceed only if all 'reserved' are true) ...
```