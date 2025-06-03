## Cascade Core Runtime: Detailed Architecture Document V1.0

**1. Introduction & Vision**

Cascade Core is the foundational execution engine of the Cascade Platform. It embodies the principle of **Radical Simplification** by providing a minimal, abstract, and highly extensible runtime for executing reactive workflows defined by the Cascade DSL.

**Vision:** To be a stable, high-performance, event-driven "abstract machine" that understands the *structure* of reactive flows (graphs, data dependencies) but delegates all specific *behavior* to pluggable extensions (Components, Triggers, Conditions). It provides the essential orchestration, state management hooks, and scheduling capabilities needed to run these flows reliably and efficiently, exposing a clear API for higher-level systems like the Cascade Server.

**Production Business Requirements:**

*   **High Throughput & Low Latency:** Execute numerous concurrent flow instances efficiently.
*   **Reliability:** Ensure flow instances can be reliably suspended, persisted, and resumed (e.g., for waits, retries, crash recovery).
*   **Scalability:** Designed to scale horizontally by running multiple Core instances (state management needs to support this).
*   **Extensibility:** Allow seamless integration of new behaviors without modifying the Core engine itself.
*   **Observability:** Provide hooks for detailed logging, tracing, and metrics across flow execution.
*   **Resource Efficiency:** Minimal overhead beyond the execution of the components themselves.
*   **Security:** Provide mechanisms for sandboxing or isolating component execution (e.g., via WASM).

**2. Key Concepts & Terminology**

*   **DSL Structure:** The internal, parsed representation of a `FlowDefinition` (nodes, edges, component references, trigger/condition types).
*   **Flow Instance:** A single, stateful execution of a `FlowDefinition`, initiated by a `Trigger`. Each instance has a unique ID and maintains its execution state.
*   **Step Instance:** A specific invocation of a `Component` logic within a `FlowInstance`.
*   **Data Packet:** The unit of data flowing between `StepInstances`. The Core Runtime facilitates the routing of these packets based on the flow graph.
*   **Execution State:** The current status of a `FlowInstance` (e.g., Running, Suspended, WaitingForTimer, WaitingForEvent, Completed, Failed). Includes outputs of completed steps.
*   **Component Instance:** The runtime representation of a specific component's logic (e.g., loaded WASM module, registered Rust function pointer). The Core manages its lifecycle per step execution.
*   **Extension Points:** Defined interfaces for plugging in new `Component`, `Trigger`, and `Condition` implementations.
*   **Runtime Interface (API):** The primary API exposed by the Core for external systems (like Cascade Server) to manage definitions and executions.
*   **Component Runtime API:** The API provided *by* the Core *to* executing Component instances, allowing them to get inputs, return outputs, potentially access state, timers, or logging.
*   **State Store:** A pluggable backend (e.g., Redis, Postgres, In-Memory) used for persisting `FlowInstance` state.
*   **Timer Service:** A pluggable service for scheduling future resumption of `FlowInstances` (e.g., for delays, timeouts, retries).
*   **Component Loader:** Responsible for finding and loading the executable logic for a given `Component` type.

**3. High-Level Architecture Diagram**

```
+---------------------------------+       +--------------------------------+
| External System (e.g., Cascade    |------>|      Runtime Interface (API)   |
| Server)                         |<------| (Defines Core capabilities)    |
+---------------------------------+       +--------------------------------+
                                                       |
                                                       V
+-----------------------------------------------------------------------------+
|                            Cascade Core Runtime Engine                          |
|                                                                             |
| +-----------------+  +-------------------+  +-----------------------------+ |
| | DSL Parser &    |  | Flow Instance Mgr |  | Execution Scheduler         | |
| | Validator       |  | (Manages Lifecycles|  | (Determines ready steps)    | |
| +-------^---------+  +---------^---------+  +-------------^---------------+ |
|         |                      |                          |                 |
|         | (Definition)         | (State Ops)              | (Execution Ops) |
|         |                      |                          |                 |
| +-------v---------+  +---------v---------+  +-------------v---------------+ |
| | Flow Definition |  | Flow Instance     |  | Step Executor               | |
| | Registry        |  | State             |  |  - Data Mapper              | |
| +-----------------+  | (In-Memory/Cache) |  |  - Condition Evaluator      | |
|                      +---------^---------+  |  - Component Invoker        | |
|                                |            +-------------^---------------+ |
| +-----------------+            | (Persist/Load)           | (Load/Execute)  |
| | Trigger Manager |            |                          |                 |
| | (Handles Trigger|  +---------v---------+  +-------------v---------------+ |
| | Implementations)|  | State Store       |  | Component Loader/Registry   | |
| +-------^---------+  | (Pluggable I/F)   |  | (Pluggable I/F, e.g., WASM) | |
|         |            +-------------------+  +-----------------------------+ |
|         | (Start Flow)                                                      |
| +-------v---------+  +-------------------+                                  |
| | Timer Service   |<-| Scheduling Hooks  |                                  |
| | (Pluggable I/F) |->| (For Wait/Retry)  |                                  |
| +-----------------+  +-------------------+                                  |
|                                                                             |
| +-------------------------------------------------------------------------+ |
| |                   Component Runtime API Provider                          | |
| | (Exposes Inputs, Outputs, State, Timers, Logging to Components)           | |
| +-------------------------------------------------------------------------+ |
|                                                                             |
+-----------------------------------------------------------------------------+
```

**4. Core Abstractions (Interfaces)**

*   **`RuntimeInterface`** (API for External Systems):
    *   `deploy_definition(definition: ParsedFlowDefinition) -> Result<()>`
    *   `undeploy_definition(flow_id: FlowId) -> Result<()>`
    *   `trigger_flow(flow_id: FlowId, trigger_data: DataPacket) -> Result<FlowInstanceId>`
    *   `resume_flow_with_event(correlation_id: CorrelationId, event_data: DataPacket) -> Result<()>` // For WaitForExternalEvent
    *   `resume_flow_from_timer(flow_instance_id: FlowInstanceId) -> Result<()>` // For WaitForDuration/Timestamp
    *   `get_flow_instance_state(id: FlowInstanceId) -> Result<Option<FlowInstanceState>>`
    *   `list_definitions() -> Result<Vec<FlowId>>`
    *   `list_instances(flow_id: Option<FlowId>, status: Option<ExecutionStatus>) -> Result<Vec<FlowInstanceSummary>>`
*   **`ComponentRuntimeAPI`** (API for Components):
    *   `get_input(input_name: &str) -> Result<DataPacket>`
    *   `get_config() -> Result<Value>` // Access component's own config from DSL
    *   `set_output(output_name: &str, data: DataPacket, is_error: bool) -> Result<()>`
    *   `log(level: LogLevel, message: String)`
    *   `get_state() -> Result<Option<DataPacket>>` // For stateful components
    *   `set_state(state: DataPacket) -> Result<()>` // For stateful components
    *   `schedule_timer(delay_ms: u64) -> Result<TimerId>` // Requests Core to schedule wakeup
    *   `create_correlation_id() -> CorrelationId` // For WaitForExternalEvent
    *   `emit_metric(name: String, value: f64, tags: HashMap<String, String>)`
    *   *(Trace context propagation likely handled implicitly by Core)*
*   **`StateStore`** (Pluggable):
    *   `save_instance_state(state: &FlowInstanceState) -> Result<()>`
    *   `load_instance_state(id: FlowInstanceId) -> Result<Option<FlowInstanceState>>`
    *   `delete_instance_state(id: FlowInstanceId) -> Result<()>`
    *   `find_instances_by_correlation(correlation_id: CorrelationId) -> Result<Vec<FlowInstanceId>>`
*   **`TimerService`** (Pluggable):
    *   `schedule_resume(flow_instance_id: FlowInstanceId, resume_at: Timestamp) -> Result<TimerId>`
    *   `cancel_timer(timer_id: TimerId) -> Result<()>`
*   **`ComponentLoader`** (Pluggable):
    *   `load(component_type: &str) -> Result<Box<dyn ComponentExecutor>>` // Returns an executable instance
*   **`TriggerExecutor`** (Interface for Trigger Implementations):
    *   `start(config: Value, callback: TriggerCallback) -> Result<()>` // Callback invokes `RuntimeInterface.trigger_flow`
    *   `stop() -> Result<()>`
*   **`ConditionEvaluator`** (Interface for Condition Implementations):
    *   `evaluate(config: Value, context: &ExecutionContext) -> Result<bool>`
*   **`ComponentExecutor`** (Interface for Component Implementations):
    *   `execute(api: &dyn ComponentRuntimeAPI) -> Result<()>` // Component logic uses the API to get inputs/set outputs

**5. Major Flows**

*   **DSL Definition Deployment:**
    1.  **External System:** Calls `RuntimeInterface.deploy_definition` with `ParsedFlowDefinition`.
    2.  **Core (Flow Definition Registry):** Stores the definition, making it available for execution. Validates references against known/loaded component types.
    3.  **Core (Trigger Manager):** If the definition includes a `Trigger`, loads the corresponding `TriggerExecutor`, calls its `start` method, passing the trigger config and a callback to `RuntimeInterface.trigger_flow`.

*   **Flow Instance Execution:**
    1.  **Trigger / External System:** Invokes `RuntimeInterface.trigger_flow` (directly or via Trigger callback).
    2.  **Core (Flow Instance Manager):** Creates a new `FlowInstance` with a unique ID, initial state (Running), and stores the trigger data. Persists initial state via `StateStore`.
    3.  **Core (Execution Scheduler):** Determines the initial set of ready steps (those with no `run_after` dependencies). Schedules them for execution.
    4.  **Core (Step Executor):** For each scheduled step:
        *   Resolves `DataReference`s in `inputs_map` using trigger/previous step outputs (Data Mapper).
        *   Evaluates the `condition` using the `ConditionEvaluator` for that type. If false, marks step as Skipped, triggers downstream evaluation.
        *   If condition true:
            *   Loads the `Component` implementation using `ComponentLoader`.
            *   Creates `ComponentRuntimeAPI` instance for this step context.
            *   Invokes the `ComponentExecutor.execute`, passing the API.
    5.  **Component:** Executes its logic using the `ComponentRuntimeAPI` (gets inputs, calls external services, sets outputs, potentially sets state or requests timers).
    6.  **Core (Step Executor):** Receives outputs (or error) from the component. Updates `FlowInstance` state with step outputs.
    7.  **Core (Execution Scheduler):** Evaluates downstream steps that depend on the completed step. If dependencies are met, schedules them.
    8.  **Core (Flow Instance Manager / State Store):** Persists the updated `FlowInstance` state.
    9.  **Repeat:** Continues scheduling and executing steps until no more steps are ready.
    10. **End State:** If flow completes, updates `FlowInstance` status to Completed. If a step fails irrecoverably, status becomes Failed.

*   **Handling "Wait" States:**
    1.  **Component (e.g., `StdLib:WaitForDuration`):** Calls `ComponentRuntimeAPI.schedule_timer(delay)`.
    2.  **Core:** Calls `TimerService.schedule_resume`.
    3.  **Core (Flow Instance Manager):** Updates `FlowInstance` status to `WaitingForTimer`. Persists state. *Execution for this instance pauses.*
    4.  **TimerService:** At the scheduled time, notifies the Core Runtime.
    5.  **Core:** Receives notification, calls `RuntimeInterface.resume_flow_from_timer`.
    6.  **Core (Flow Instance Manager):** Loads the `FlowInstance` state from `StateStore`. Sets status back to `Running`.
    7.  **Core (Execution Scheduler):** Treats the waiting step as "completed" and evaluates/schedules downstream steps.

**6. Technology Stack Summary**

*   **Language:** Rust
*   **Asynchronous Runtime:** Tokio (or async-std)
*   **Component Execution (Recommended):** WASM Runtime (e.g., Wasmtime) for sandboxing and polyglot components. Direct Rust function calls for trusted/native components.

**7. Benefits & Trade-offs**

*   **Benefits:**
    *   Minimal, stable core resistant to churn.
    *   High degree of extensibility.
    *   Clear separation between orchestration logic and business/integration logic.
    *   Enables independent development and deployment of components.
    *   Can be optimized for pure execution path performance.
*   **Trade-offs:**
    *   Core provides minimal built-in functionality; heavy reliance on component libraries (like StdLib).
    *   Requires robust implementations for pluggable services (State Store, Timers).
    *   Debugging might require tracing across Core and Component boundaries.
    *   Effective usage depends on well-designed component APIs and implementations.

---

## Cascade Core Runtime: Technical Documentation (DDD Approach) V1.0

**1. Bounded Contexts**

*   **Flow Definition Management (Core Internal):** Manages the internal representation and lifecycle of parsed flow structures.
*   **Flow Execution Orchestration:** The heart of the runtime; manages `FlowInstance` lifecycles, scheduling, and step execution coordination.
*   **Component Management & Execution:** Handles loading, executing, and providing APIs to component implementations.
*   **State Management:** Abstract interaction layer with persistent storage for flow instance state.
*   **Scheduling & Timers:** Abstract interaction layer with time-based event scheduling.
*   **Trigger Management:** Manages the lifecycle and invocation of trigger implementations.

**2. Context: Flow Execution Orchestration**

*   **Overview:** Responsible for running instances of defined flows based on triggers or external commands.
*   **Aggregates:**
    *   **`FlowInstance`:**
        *   **Root:** `FlowInstance` (identified by `FlowInstanceId`).
        *   **State:** `id`, `flow_definition_id`, `status` (`Running`, `Suspended`, `WaitingForTimer`, `WaitingForEvent`, `Completed`, `Failed`), `step_outputs` (map `StepId` -> `DataPacket`), `pending_timers` (map `StepId` -> `TimerId`), `correlation_data` (map `StepId` -> `CorrelationId`), `start_time`, `end_time`, `last_updated`.
        *   **Behavior:** `start()`, `complete_step(StepId, outputs)`, `fail_step(StepId, error)`, `suspend_for_timer(StepId, TimerId)`, `suspend_for_event(StepId, CorrelationId)`, `resume()`, `complete()`, `fail()`.
        *   **Invariants:** Status transitions are valid. Outputs only stored for completed steps.
*   **Value Objects:** `FlowInstanceId`, `StepId`, `DataPacket`, `ExecutionStatus`, `TimerId`, `CorrelationId`.
*   **Domain Events:**
    *   `FlowInstanceCreated` (id, flow_id)
    *   `StepExecutionScheduled` (instance_id, step_id)
    *   `StepExecutionStarted` (instance_id, step_id)
    *   `StepCompleted` (instance_id, step_id, outputs)
    *   `StepFailed` (instance_id, step_id, error)
    *   `FlowInstanceSuspended` (id, reason: Timer/Event)
    *   `FlowInstanceResumed` (id)
    *   `FlowInstanceCompleted` (id)
    *   `FlowInstanceFailed` (id, error)
*   **Repositories (Interfaces):**
    *   **`FlowInstanceRepository`:** (Corresponds to `StateStore` interface) `save(FlowInstance)`, `find_by_id(FlowInstanceId) -> Option<FlowInstance>`, `find_by_correlation(CorrelationId) -> Vec<FlowInstance>`, `delete(FlowInstanceId)`.
*   **Domain Services:**
    *   **`ExecutionScheduler`:** `determine_ready_steps(FlowInstance, completed_step_id: Option<StepId>) -> Vec<StepId>`. Analyzes dependencies based on `FlowDefinition` and current `FlowInstance` state.
*   **Application Services (Implementing `RuntimeInterface`):**
    *   `DefaultRuntimeService`: Coordinates interactions between aggregates, repositories, and domain services to fulfill API calls like `trigger_flow`, `resume_flow_*`.

**3. Context: Component Management & Execution**

*   **Overview:** Loads component code and executes it within the context of a step.
*   **Aggregates:**
    *   **`ComponentImplementation`:** (Conceptual) Represents the loaded, executable code for a component type. Could be a WASM module instance, a function pointer, etc. Managed by the `ComponentLoader`.
*   **Entities:** `StepExecutionContext` (Provides inputs, config, and `ComponentRuntimeAPI` access for a single step execution).
*   **Repositories (Interfaces):**
    *   **`ComponentRepository`:** (Corresponds to `ComponentLoader` interface) `find_executable(component_type: &str) -> Result<Box<dyn ComponentExecutor>>`.
*   **Domain Services:**
    *   **`StepExecutorService`:** Orchestrates a single step's execution: gets executable from repository, creates context, calls `ComponentExecutor.execute`, handles results/errors.
    *   **`DataMapperService`:** Resolves `DataReference` values within the `StepExecutionContext`.
    *   **`ConditionEvaluationService`:** Loads and executes `ConditionEvaluator` implementations.
*   **Application Services:** None directly; services used internally by `FlowExecutionOrchestration`.

**4. Context: State Management**

*   **Overview:** Provides an abstraction over persistent storage for `FlowInstance` state.
*   **Aggregates:** None (Manages `FlowInstance` state persistence).
*   **Repositories (Interfaces):** `StateStore` (as defined in Core Architecture).
*   **Infrastructure:** Concrete implementations like `RedisStateStore`, `PostgresStateStore`, `InMemoryStateStore`.

**5. Context: Scheduling & Timers**

*   **Overview:** Provides an abstraction for scheduling time-based events (flow instance resumption).
*   **Aggregates:** None (Manages external timer scheduling).
*   **Repositories (Interfaces):** `TimerService` (as defined in Core Architecture).
*   **Infrastructure:** Concrete implementations using system timers, external queues (like Redis ZSETs), or dedicated scheduling services.

**6. Context: Trigger Management**

*   **Overview:** Manages the activation and lifecycle of different trigger types.
*   **Aggregates:** None (Manages `TriggerExecutor` instances).
*   **Repositories (Interfaces):** `TriggerRepository` (Conceptual): `find_executor(trigger_type: &str) -> Result<Box<dyn TriggerExecutor>>`.
*   **Application Services:** `TriggerCoordinatorService` (Called during `deploy_definition`): Loads trigger executors, calls `start`, manages lifecycle.

---

## Standard Component Library (StdLib): Detailed Architecture Document V1.0

**1. Introduction & Vision**

The Cascade Standard Component Library (StdLib) provides a curated set of pre-built, reusable `Component` implementations designed to run on the Cascade Core Runtime. It addresses common patterns and integrations required in typical reactive workflows.

**Vision:** To accelerate development on the Cascade Platform by providing robust, well-tested, and composable building blocks for ~80% of common tasks, allowing users to focus on unique business logic rather than reimplementing foundational patterns like retries, transformations, or standard I/O. StdLib components strictly adhere to the `ComponentExecutor` and `ComponentRuntimeAPI` interfaces provided by Cascade Core.

**Production Business Requirements:**

*   **Coverage:** Address common enterprise integration patterns (EIPs), flow control, error handling, and basic data manipulation.
*   **Reliability:** Components implementing patterns like retries or circuit breakers must be robust and configurable.
*   **Performance:** Components should be efficient and avoid unnecessary resource consumption. I/O components must use non-blocking operations.
*   **Composability:** Designed to be easily wired together in the DSL to create complex behaviors (e.g., error routing, conditional logic).
*   **Configurability:** Offer sufficient configuration options via the DSL `config` block to adapt to various use cases.
*   **Observability:** Integrate seamlessly with Core's logging, tracing, and metrics facilities.

**2. Key Concepts & Terminology**

*   **StdLib Component:** A specific component implementation provided by this library (e.g., `StdLib:HttpCall`, `StdLib:MapData`). Identified by a `type` typically prefixed with `StdLib:`.
*   **Component Contract:** Each StdLib component clearly defines its `config` structure, expected `inputs`, and possible `outputs` (including error outputs).
*   **Runtime Dependency:** Certain StdLib components require specific Cascade Core capabilities (e.g., `StdLib:RetryWrapper` needs Timers, `StdLib:IdempotentReceiver` needs State).

**3. High-Level Architecture Diagram**

```
+-----------------------------------------------------------------------------+
|                            Cascade Core Runtime Engine                          |
| +-----------------------------+        +---------------------------------+  |
| | Component Loader/Registry   |<-------| Standard Component Library (Jar |  |
| | (Loads component logic)     |        | / WASM Bundle / Code Modules)   |  |
| +-------------^---------------+        |  +---------------------------+  |  |
|               | (Execute)              |  | type: StdLib:HttpCall     |  |  |
|               |                        |  | type: StdLib:MapData      |  |  |
| +-------------v---------------+        |  | type: StdLib:RetryWrapper |  |  |
| | Step Executor               |        |  | type: StdLib:FilterData   |  |  |
| |  - Component Invoker        |        |  | type: StdLib:DlqPublisher |  |  |
| +-------------^---------------+        |  | ...                       |  |  |
|               | (Use API)              |  +---------------------------+  |  |
| +-------------v---------------+        +---------------------------------+  |
| | Component Runtime API Provider|                                           |
| | (Provides Core capabilities)|                                           |
| +-----------------------------+                                           |
+-----------------------------------------------------------------------------+
       |         ^
(State, Timers)  | (Inputs/Outputs)
       |         |
+------v---------v------+
| StdLib Component Impl |
| (e.g., HttpCall Logic)|
+-----------------------+
```

**4. Core Abstractions Leveraged**

StdLib components *implement* the `ComponentExecutor` interface and *consume* the `ComponentRuntimeAPI` provided by Cascade Core. They do not define new core abstractions but rather provide concrete logic within the existing framework.

**5. Major Flows (Illustrative Use Cases)**

*   **Simple Data Transformation:**
    1.  DSL defines Step A (`StdLib:HttpCall`) -> Step B (`StdLib:MapData`).
    2.  Core executes Step A. `HttpCall` uses `ComponentRuntimeAPI` to get config (URL) and inputs, makes HTTP call, uses `set_output` for `responseBody`.
    3.  Core executes Step B. `MapData` uses `ComponentRuntimeAPI` to get config (mapping expression) and input (`steps.A.outputs.responseBody`), performs transformation, uses `set_output` for `result`.

*   **Retry Pattern:**
    1.  DSL defines Step X (e.g., `StdLib:DatabaseWrite`) -> Step Err (`StdLib:Logger`). Step X also routes its error output (`is_error_path: true`) to Step R (`StdLib:RetryWrapper`). Step R routes its `data` input to Step X (forming a loop for retry) and its `finalError` output to Step Err.
    2.  Core executes Step X, it fails, producing output on `error`.
    3.  Core routes `error` data to Step R's `data` input.
    4.  Core executes Step R. `RetryWrapper` logic checks retry policy (from config). If attempts remain:
        *   Calculates backoff delay.
        *   Calls `ComponentRuntimeAPI.schedule_timer(delay)`.
        *   *Implicitly* signals Core to suspend and route original `data` back to Step X upon resume. (This routing needs careful Core design or specific RetryWrapper output conventions).
    5.  Core resumes after timer, re-executes Step X.
    6.  If retries exhaust, Step R produces output on `finalError`.
    7.  Core routes `finalError` data to Step Err.

**6. Technology Stack Summary**

*   **Language:** Rust (preferred for performance and direct integration with Core).
*   **Distribution:** Could be compiled directly into Core (if trusted), distributed as separate Rust crates, or compiled to WASM modules loaded by the Core's `ComponentLoader`.

**7. Benefits & Trade-offs**

*   **Benefits:**
    *   Dramatically reduces DSL complexity for common tasks.
    *   Promotes reuse and consistency.
    *   Encapsulates potentially complex logic (e.g., Saga coordination).
    *   Can be optimized and tested independently.
*   **Trade-offs:**
    *   Increases the surface area of the "standard" platform beyond the minimal Core.
    *   Versioning of StdLib needs management.
    *   Users might be tempted to request niche components be added, potentially bloating the library. Requires clear contribution guidelines.

---

## Standard Component Library (StdLib): Technical Documentation (DDD Approach) V1.0

**1. Bounded Context: Standard Components**

*   **Overview:** This context *provides implementations* that fulfill the `ComponentExecutor` interface defined by the Cascade Core. It leverages the Core's infrastructure (State, Timers, Logging) via the `ComponentRuntimeAPI`.
*   **Relationship to Core:** StdLib components are loaded and managed by the Core's `ComponentManagement` context. Their runtime state (if any) is managed within the Core's `FlowExecution` context using the `StateManagement` infrastructure.

**2. Aggregates (Stateful Component Examples)**

While many StdLib components are stateless, some require state managed across invocations within a single `FlowInstance` or even across instances (for components like Circuit Breaker). This state is typically managed *via* the Core's `ComponentRuntimeAPI.set_state/get_state` methods, persisting within the `FlowInstance` state.

*   **`RetryWrapperState`** (Value Object stored within `FlowInstance` state, associated with the RetryWrapper step):
    *   **State:** `current_attempt: u32`, `last_error: Option<DataPacket>`.
*   **`CircuitBreakerState`** (Value Object potentially stored *outside* the flow instance for cross-instance sharing, keyed by component instance identifier):
    *   **State:** `status` (`Closed`, `Open`, `HalfOpen`), `failure_count: u32`, `success_count: u32`, `last_state_change_time: Timestamp`, `open_until: Option<Timestamp>`.
*   **`IdempotencyRecord`** (Value Object stored in a dedicated store, keyed by idempotency key):
    *   **State:** `idempotency_key: String`, `status` (`Processing`, `Completed`), `result: Option<DataPacket>`, `timestamp: Timestamp`.

**3. Domain Services (Component Logic)**

The internal logic of each StdLib component acts as a domain service within the component's execution scope.

*   **`HttpCallService`:** Handles HTTP request building, execution (async I/O), response parsing, error mapping.
*   **`RetryLogicService`:** Encapsulates retry policy evaluation, backoff calculation, interaction with `ComponentRuntimeAPI` for timers/state.
*   **`DataMappingService`:** Parses/compiles mapping expressions (e.g., JMESPath), applies them to input data.
*   **`CircuitBreakerLogic`:** Manages state transitions based on success/failure counts and time, using `ComponentRuntimeAPI` for state access.

**4. Key Component Interactions with Core API (`ComponentRuntimeAPI`)**

*   **`StdLib:MapData`:** `get_input()`, `get_config()`, `set_output()`.
*   **`StdLib:HttpCall`:** `get_input()`, `get_config()`, `set_output()`, `log()`, `emit_metric()`.
*   **`StdLib:RetryWrapper`:** `get_input()`, `get_config()`, `set_output()`, `log()`, `get_state()`, `set_state()`, `schedule_timer()`.
*   **`StdLib:CircuitBreaker`:** `get_input()`, `get_config()`, `set_output()`, `log()`, `emit_metric()`, `get_state()` (potentially needing shared state access mechanism from Core), `set_state()`, `schedule_timer()` (for HalfOpen reset).
*   **`StdLib:WaitForDuration`:** `get_input()`, `get_config()`, `set_output()` (after resume), `schedule_timer()`.

This detailed structure clarifies the roles and responsibilities of the Cascade Core as a minimal engine and the StdLib as a provider of essential, reusable behaviors built upon that core.