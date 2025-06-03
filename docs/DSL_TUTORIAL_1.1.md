**Appendix: Guide for Generating Cascade DSL V1.0**

**Objective:** This guide instructs an LLM on how to generate syntactically correct, semantically valid, maintainable, and best-practice compliant Cascade YAML DSL (`dsl_version: "1.0"`). The LLM should aim to translate natural language requests into this DSL, leveraging provided context (RAG) where available.

**Core Philosophy of Cascade DSL:** Radical Simplification & Composition.
*   The DSL primarily defines **structure, wiring, and reusable configurations**.
*   Complex behavior resides in **Components** (identified by `type`).
*   Reusability of configured components is achieved via **Named Component Definitions** (`definitions.components`).
*   Environment-specific values are handled by **Context Variables** (`definitions.context`).
*   Modularity and dependency management are handled by **Namespaces** and **Imports**.

**Key DSL V1.0 Concepts to Master for Generation:**

**1. Top-Level Structure & Mandatory Metadata:**

*   **`dsl_version: "1.0"`:**
    *   **Instruction:** ALWAYS include this line at the very beginning of any generated DSL document.
*   **`namespace: "com.your_org.domain.module"`:**
    *   **Instruction:** ALWAYS include this. Define a unique, descriptive, hierarchical namespace (using dots, e.g., `com.my_company.project_name.specific_module`). This namespace provides a global unique prefix for all entities defined in this file (`context`, `components`, `flows`).
*   **`imports:` (Optional List of Objects):**
    *   **Purpose:** To declare dependencies on other Cascade DSL modules (namespaces) and make their defined entities (Named Components, Context Variables) accessible.
    *   **Structure per import item:**
        *   `namespace:` (Required String) The FQN of the module being imported (e.g., `"com.example.shared_utilities"`).
        *   `as:` (Optional String) A short alias for the imported namespace. If provided, referenced entities from this import will use `alias.entity_name`. If omitted, use the full FQN.
        *   `version:` (Optional String, but **HIGHLY RECOMMENDED for production/sharable modules**). A semantic version constraint for the imported module (e.g., `"1.2.3"`, `"~1.2.0"`, `">=1.0 <2.0"`). The runtime uses this to resolve the correct module version. *If the user request implies a specific version or a shared/stable module, include this.*
    *   **Instruction:** If the request involves using components or context variables defined elsewhere (and this information is available in RAG or explicitly stated), generate an appropriate `imports` section.
*   **`definitions:` (Required Object):**
    *   The container for `context` and `components`.
*   **`flows:` (Optional List):**
    *   The container for `FlowDefinition` objects.

**2. `definitions.context` (Context Variables):**

*   **Purpose:** Define *non-sensitive*, default configuration parameters that might vary by environment or be reused across multiple component configurations within the same module (or even exposed for import by other modules).
*   **Structure:** A list of `ContextVariableDefinition` objects. Each definition:
    *   `name:` (Required String) Short name, unique within the file's `namespace`. The FQN is `<namespace>.<name>`.
    *   `value:` (Required Any) Default value (any YAML type: string, number, boolean, list, map).
    *   `type:` (Optional String) JSON Schema type (e.g., "string", "integer") or custom type for validation.
    *   `description:` (Optional String) Human-readable explanation.
    *   `sensitive:` (Optional Boolean, default: `false`) Indicates the *value itself* might be sensitive. **Prefer `{{secrets...}}` for truly sensitive data.** If a context variable holds a secret *path*, mark this `true`.
*   **Usage:** Reference these in `config` blocks using `{{context.<path_to_variable>}}`.
    *   `<path_to_variable>` can be:
        *   Short `name` (if defined in the current file's `namespace`).
        *   `alias.name` (if imported from another namespace with an alias).
        *   Full FQN (`com.other_org.module.variable_name`).
*   **Instruction:** If the request mentions configurable parameters (URLs, timeouts, feature flags, topic names, default settings), define them in `definitions.context` and reference them using `{{context...}}`. Check RAG for existing context variables before defining new ones with the same semantic meaning.

**3. `definitions.components` (Named Component Definitions / Blueprints):**

*   **Purpose:** Define reusable, pre-configured instances of base component types (from StdLib or custom types). This is the primary mechanism for **DRY (Don't Repeat Yourself)** and creating meaningful abstractions.
*   **Structure:** A list of `NamedComponentDefinition` objects. Each definition:
    *   `name:` (Required String) Short name, unique within the file's `namespace`. FQN is `<namespace>.<name>`. (Recommend kebab-case: `my-configured-component`).
    *   `type:` (Required String) FQN of the base component type (e.g., `StdLib:HttpCall`, `com.my_org.custom.MyProcessor`, `Integration.ExternalServiceAdapter`).
    *   `config:` (Optional Object) The base/default configuration object for this instance. Use `{{context...}}` and `{{secrets...}}` here for externalized values.
    *   `description:` (Optional String) Human-readable explanation.
*   **Inheritance:** A Named Component inherits the input/output ports and state schema from its base `type` (defined in the StdLib or custom component's specification).
*   **Instruction:** If the request involves using a component multiple times with similar configurations, or if a specific configuration represents a common pattern (e.g., "client for X service", "standard error logger"), define it as a Named Component. Check RAG for existing Named Components before creating new ones.

**4. `flows` and `steps` (The Workflow Graph):**

*   **`FlowDefinition`:**
    *   `name:` (Required String) Short name, unique within the file's `namespace`. FQN is `<namespace>.<name>`.
    *   `trigger:` (Required Object) Defines how the flow starts.
        *   `type:` (Required String) FQN of the trigger component type (e.g., `StdLib:HttpWebhookTrigger`, `Integration.StreamIngestor` used as a trigger).
        *   `config:` (Optional Object) Configuration for the trigger. Use `{{context...}}` and `{{secrets...}}`.
        *   `output_name:` (Optional String, default: `"trigger"`) Name for the trigger's output data accessible in the flow (e.g., `trigger.trigger.payload`).
    *   `steps:` (Required List) A list of `StepDefinition` objects.
*   **`StepDefinition`:**
    *   `step_id:` (Required String) Unique identifier for the step *within the current flow*. (Recommend kebab-case).
    *   `component_ref:` (Required String) Reference to the component to execute. This is resolved by the runtime in the following order:
        1.  Short `name` of a Named Component defined in the current file's `definitions.components`.
        2.  `alias.name` (if an `imports` entry provides the alias for a namespace containing a Named Component with that `name`).
        3.  Full FQN (`com.other_org.module.ComponentName`) of a Named Component defined in another module.
        4.  Full FQN of a raw base component `type` (e.g., `StdLib:MapData`).
        *   **Instruction:** Prioritize using references to Named Components. Use raw types only for very simple, non-reusable steps or if no suitable Named Component exists.
    *   `config:` (Optional Object) Step-specific configuration.
        *   **If `component_ref` is a Named Component:** This `config` is **deep-merged** with (and overlays) the Named Component's base `config`.
            *   **Merge Rules:** Step config overlays base config. Objects are merged recursively (step keys win). **Arrays in the step config *replace* entire arrays in the Named Component's config for the same key.** Scalar values in the step config replace scalars in the base config.
        *   **If `component_ref` is a raw base type:** This `config` is used directly. (Required if the type needs configuration).
        *   **Instruction:** Use `{{context...}}` and `{{secrets...}}` here for dynamic values.
    *   `inputs_map:` (Optional Object) Maps the component's input port names to data sources.
        *   Keys: Input port names defined by the component's base `type` (refer to StdLib/custom component documentation).
        *   Values: `DataReferenceString` (e.g., `"trigger.trigger_output_name.payload.field"`, `"steps.previous_step_id.outputs.output_port_name.some_data"`).
        *   **Instruction:** Ensure all *required* inputs of the resolved component type are mapped. If a component processes a primary data stream, its main input is often named `data` or `requestData`.
    *   `condition:` (Optional Object) Defines a condition for executing the step.
        *   `type:` (Required String) FQN of the condition component type (e.g., `StdLib:JmesPathCondition`, `StdLib:BooleanCondition`).
        *   `config:` (Optional Object) Configuration for the condition.
        *   `inputs_map:` (Optional Object) Data to feed into the condition component.
    *   `run_after:` (Optional List of Strings) Specifies `step_id`s of other steps in the same flow that *must complete* before this step can run.
        *   **Instruction:** Use this *sparingly*, primarily when `inputs_map` doesn't inherently define the order (e.g., to synchronize parallel branches before a join, or for steps with only side-effects where data flow doesn't dictate order).
*   **Error Handling Outputs:**
    *   **Instruction:** Many StdLib components have an `error` output port (check their specs for `is_error_path: true`). If a request implies error handling, ensure these error outputs are explicitly wired in the `steps.outputs_map` of the failing step to subsequent handling steps (e.g., a logger, `StdLib:FailFlow`, or a component that publishes to a Dead Letter Queue).
    ```yaml
    # Example of wiring an error output
    - step_id: "might_fail_step"
      component_ref: "StdLib:HttpCall"
      # ... config and inputs_map ...
      outputs_map: # NEW as per V4.3 explicit wiring for wrappers/handlers
        response: "steps.next_success_step.inputs.apiResponse"
        error: "steps.log_failure_step.inputs.errorData" # Wire error to a logger
    ```

**5. Secrets Handling:**

*   **Instruction:** **NEVER** embed sensitive values (API keys, passwords, tokens, connection strings with credentials) directly in the DSL.
*   ALWAYS use the `{{secrets.path.to.secret.in.external.store}}` syntax within string values in `config` blocks.
*   The `path.to.secret...` should be a meaningful identifier that the runtime can use to look up the actual secret value from a secure secret management system.

**6. Interaction Patterns & Advanced StdLib Components (e.g., V4.34 level):**

*   **Inter-Module Flow Invocation:**
    *   Use `StdLib:SubFlowInvoker`.
    *   The `flowName` in its `config` should be the FQN of the target flow, or an `alias.flowName` if imported.
    *   Specify `waitForCompletion: true` or `false` as needed.
*   **Actor Model:**
    *   Define `StdLib:ActorShell` instances as Named Components, configuring their `actorLogicComponent` (which could be another Named Component, potentially a `StdLib:SubFlowInvoker`).
    *   Use `StdLib:ActorRouter` to dispatch messages. The `actorIdExpression` extracts the ID.
*   **Sagas, Human Tasks, Advanced Stream Processing:**
    *   If the request implies complex orchestration, compensation, human interaction points, or sophisticated stateful stream processing, check RAG for appropriate StdLib components (e.g., `StdLib:SagaCoordinator`, `StdLib:HumanTaskNotifier`, `StdLib:StatefulStreamProcessor`).
    *   Configure these according to their specifications, often involving references to other components or flows by their FQNs or aliased names.

**7. Generation Strategy & Clarification (Gherkin-First Approach):**

*   **Phase 1: Understanding and Clarification via Gherkin (Default for most non-trivial requests)**
    1.  **Analyze Request:** Process the user's natural language request for the workflow.
    2.  **Identify Ambiguity:** If the request is complex, has multiple paths, conditions, or lacks specific details, **DO NOT immediately generate DSL.**
    3.  **Generate Gherkin Scenario(s):** Translate your understanding into Gherkin scenarios. Clearly outline triggers, actions, data inputs/outputs, and expected outcomes for different paths (success, failure).
        *   **Output this Gherkin to the user.**
    4.  **Ask Clarifying Questions:** Based on ambiguities, formulate specific questions alongside the Gherkin.
        *   **Output these questions to the user.**
    5.  **Await Confirmation/Clarification:** Wait for the user to confirm or refine the Gherkin scenarios and answer the questions.
*   **Phase 2: DSL Generation (After Gherkin confirmation or for unambiguous, simple requests)**
    1.  **Condition for Proceeding:** User confirms Gherkin/clarifications OR the initial request was trivially simple and explicit.
    2.  **Generate Cascade DSL V1.0:**
        *   Based on the **confirmed Gherkin scenario(s)**.
        *   Adhere strictly to this V1.0 specification guide.
        *   **Prioritize Reuse:** Check RAG context for existing relevant Named Components or Context Variables in the target `namespace` or in imported shared namespaces. Use them (`component_ref` to Named Component, `{{context...}}`) before defining new ones or using raw types with full inline config.
        *   Add YAML comments (`# ...`) for non-obvious choices or to map DSL steps back to Gherkin steps if helpful.
        *   **Output ONLY the valid YAML DSL block.**

**Checklist Before Outputting DSL V1.0:**

1.  [ ] **`dsl_version: "1.0"`** is the first line.
2.  [ ] A valid, hierarchical **`namespace:`** is defined.
3.  [ ] **`imports:`** section is present and correct if cross-namespace references are used (check for `namespace`, `as` alias if used, `version` if appropriate).
4.  [ ] Reusable, non-sensitive parameters are defined in **`definitions.context`** and referenced via `{{context...}}`.
5.  [ ] Common component configurations are defined as **Named Components** in **`definitions.components`** and referenced via `component_ref`.
6.  [ ] `flows` have unique names (within their namespace).
7.  [ ] `steps` have unique `step_id`s (within their flow).
8.  [ ] `component_ref` correctly points to a resolvable Named Component (local, aliased, FQN) OR a raw base type FQN.
9.  [ ] Step `config` correctly merges/overlays (if Named Component) or is provided fully (if raw type).
10. [ ] All `{{context...}}` references are valid.
11. [ ] All `{{secrets...}}` references are used for actual secrets (no hardcoded secrets).
12. [ ] `inputs_map` correctly wires data, mapping to valid component input ports. All *required* inputs are mapped.
13. [ ] Error handling is considered: error outputs from components are explicitly wired if the scenario implies error management.
14. [ ] `run_after` is used appropriately and only when necessary.
15. [ ] YAML syntax, indentation, and structure are valid.
16. [ ] (If applicable) Gherkin scenario was confirmed/clarified by the user.

By adhering to this guide, the LLM can generate high-quality, maintainable, and robust Cascade DSL V1.0 definitions. The emphasis on modularity (namespaces, imports), reusability (Named Components, Context Variables), and a clear generation strategy (Gherkin-first) is key.