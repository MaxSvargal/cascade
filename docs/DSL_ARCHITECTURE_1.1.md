**Patch for "Cascade YAML DSL: Detailed Architecture Document V1.0"**

**Document Title Change:** Cascade YAML DSL: Detailed Architecture Document V1.0

**Section 1. Introduction & Vision (Minor Additions):**

*   After "...declarative 'wiring' of the system.", add: "It also supports defining reusable, configured component instances (Named Components) and managing default, overridable context variables directly within the DSL, enhancing maintainability and environment-specific configurations."
*   Under "Production Business Requirements," add:
    *   **Reusability & DRY:** Facilitate the definition and reuse of common component configurations and context values to minimize redundancy.
    *   **Environment Agility:** Allow configurations to be sensitive to runtime environments through context variables and overrides.

**Section 2. Key Concepts & Terminology (DSL Elements) - MAJOR CHANGES:**

*   **`dsl_version`:** Change example to `"1.0"`.
*   **`namespace`:** (NEW, Optional, Top-Level) Specifies a unique global namespace (e.g., `"com.my_org.module"`) for all entities defined within this DSL file (`components`, `flows`, `context`). If omitted, a runtime-defined default applies. Used for FQN resolution.
*   **`definitions`:** (Required, Top-Level)
*   **`definitions.context`:** (NEW, Optional List) Defines reusable `ContextVariableDefinition`s.
*   **`definitions.components`:** (Optional List) Defines reusable **`NamedComponentDefinition`**s (formerly just `Component Definition`).
*   **`definitions.flows`:** (Unchanged)
*   **`ContextVariableDefinition`:** (NEW, Object in `context` list)
    *   `name`: Unique identifier within the `namespace` (string).
    *   `value`: Default value (any YAML type).
    *   `type`: Optional JSON Schema type or custom type string for `value` validation.
    *   `description`: Optional string.
    *   `sensitive`: Optional boolean (default `false`).
*   **`NamedComponentDefinition`:** (REVISED `Component Definition`)
    *   `name`: Unique identifier within the `namespace` (string, kebab-case recommended).
    *   `type`: **Primary Extension Point**. Identifier linking to the base component's implementation (string, e.g., `StdLib:HttpCall`).
    *   `config`: (Optional) The **base or default configuration** for this named instance (map). Can use `{{context...}}` and `{{secrets...}}`.
    *   `description`: Optional string.
    *   *Remove `inputs`, `outputs`, `state_schema` from here.* These are defined by the base `type` (e.g., in the StdLib specification for that type). The Named Component Definition *inherits* the ports and state schema of its base `type`. Its purpose is to provide a reusable *configuration* of that type.
*   **`Flow Definition`:** (Unchanged)
*   **`Step Definition`:**
    *   `step_id`: (Unchanged)
    *   `component_ref`: Reference to either:
        1.  A `NamedComponentDefinition` by its `name` (short or FQN).
        2.  A raw base component `type` (e.g., `StdLib:MapData`).
    *   `config`: (NEW/REVISED BEHAVIOR, Optional Map) Step-level configuration.
        *   If `component_ref` points to a `NamedComponentDefinition`, this step `config` is **deep-merged** with (and overlays) the `config` of the Named Component. (Step wins conflicts, arrays are replaced by step's array).
        *   If `component_ref` points to a raw base component `type`, this `config` is used directly to configure the instance of that type. (Required if the type needs config).
        *   Can use `{{context...}}` and `{{secrets...}}`.
    *   `inputs_map`: (Unchanged)
    *   `condition`: (Unchanged)
    *   `run_after`: (Unchanged)
*   **`Data Reference String`:** (Unchanged)
*   **Add `Context Variable Reference String`:** Format `{{context.<FQN_or_short_name>}}` used in `config` string values.
*   **Add `Secret Reference String`:** Format `{{secrets.<path_to_secret_in_store>}}` used in `config` string values.
*   **`Type Identifier`:** (Unchanged)

**Section 3. High-Level Architecture Diagram (Conceptual DSL Structure) - UPDATED:**

```
+-----------------------------------------------------------------+
|                         YAML Document                         |
| +-----------------------------------------------------------+ |
| | dsl_version: "1.0"                                        | |
| | namespace: "com.example.module"                           | |  // NEW
| +-----------------------------------------------------------+ |
| | definitions:                                              | |
| |   context: # List of Context Variable Defs                | |  // NEW
| |     - name: default-timeout                               | |
| |       value: 5000                                         | |
| |   components: # List of Named Component Defs              | |  // REVISED
| |     - name: configured-comp-a                           | |
| |       type: BaseCompAType                               | |
| |       config: { commonSetting: "{{context.default-timeout}}" } | | // Base config
| |     - name: configured-comp-b                           | |
| |       type: BaseCompBType                               | |
| |       config: {...}                                       | |
| |   flows: # List of Flow Defs                             | |
| |     - name: flow-x                                      | |
| |       trigger:                                          | |
| |         type: TrigType                                  | |
| |         config: {...}                                     | |
| |       steps: # List of Step Defs                         | |
| |         - step_id: step-1                               | |
| |           component_ref: configured-comp-a              | |
| |           config: { specificSetting: "override" }       | | // Step config (merged)
| |           inputs_map: { in1: "trigger.trigger" }         | |
| |         - step_id: step-2                               | |
| |           component_ref: StdLib:RawTypeExample          | | // Direct type ref
| |           config: { neededParam: 123 }                  | | // Full config here
| |           inputs_map: { inX: "steps.step-1.outputs.out1" } | |
| +-----------------------------------------------------------+ |
+-----------------------------------------------------------------+
```

**Section 4. Core Abstractions (DSL Elements) - REVISED:**

*   **`NamedComponentDefinition`:** (Replaces `Component Definition` abstraction) Abstracting a reusable, *configured instance* of a base component type. Its primary role is to provide a shareable configuration.
*   **`ContextVariableDefinition`:** (NEW) Abstracting a named, default-valued configuration parameter, scoped and overridable.
*   **Configuration Merging:** (NEW Concept) Abstracting the process by which a step's specific configuration is combined with a referenced Named Component's base configuration.
*   **Namespace:** (NEW Concept) Abstracting a logical grouping and unique identification scope for defined entities.

**Section 5. Major Flows (DSL Usage Lifecycle) - UPDATES to Parsing & Validation:**

*   **Parsing & Validation:**
    *   (Add) Parse top-level `namespace` string.
    *   (Add) Parse `definitions.context` and validate `ContextVariableDefinition`s (uniqueness of FQN, type vs. value).
    *   (Update) `definitions.components` now parses `NamedComponentDefinition`s. Validate `name` (FQN uniqueness), `type` (must be known base type), and its `config` block against the schema of the base `type` (after context/secret placeholders are conceptually noted).
    *   (Update) When validating `StepDefinition.component_ref`:
        *   Try to resolve it as a `NamedComponentDefinition` FQN first.
        *   If not found, try to resolve it as a raw base component `type`.
        *   If neither, it's an error.
    *   (Update) When validating `StepDefinition.config`:
        *   If referencing a `NamedComponentDefinition`, the step `config` is optional. If present, it's conceptually merged. The *final merged config* must be valid against the base `type`'s schema.
        *   If referencing a raw base `type`, the step `config` is usually required and directly validated against the base `type`'s schema.
    *   (Add) Validate `Context Variable Reference Strings` (`{{context...}}`) and `Secret Reference Strings` (`{{secrets...}}`) for basic syntax and ensure referenced context variables are resolvable (at least to a definition, actual value comes at runtime).
    *   (Add) Detect circular dependencies in `definitions.context`.
*   **Runtime Interpretation:**
    *   (Add) At startup/load time, the Core Runtime loads all `definitions.context` from all DSL files to form a "base context layer." It then loads an "override context layer" from environment/platform sources.
    *   (Add) Before instantiating a component for a step, the runtime resolves its *effective configuration*:
        1.  Identify base config (from referenced Named Component or empty if raw type).
        2.  Identify step overlay config (from step's `config` block).
        3.  Perform deep merge (objects merged, arrays replaced by step's, step scalars win).
        4.  Perform `{{context...}}` and `{{secrets...}}` substitution in all string values of the merged config using the effective layered context and secret store.
        5.  The resulting fully resolved config object is used to instantiate the component.

**Section 7. Benefits & Trade-offs - UPDATES:**

*   **Benefits:**
    *   (Add) **Enhanced Reusability (DRY):** Named Component Definitions allow common configurations to be defined once and reused, significantly reducing redundancy.
    *   (Add) **Improved Maintainability:** Centralized common configurations in Named Component Definitions and context variables simplify updates.
    *   (Add) **Environment Agility:** Context variables and runtime overrides allow DSLs to adapt to different environments without code changes.
    *   (Add) **Clear Abstraction:** Named Components provide meaningful abstractions over raw types (e.g., `userServiceApiClient` vs. a generic `StdLib:HttpCall`).
*   **Trade-offs:**
    *   (Update Verbosity): "Defining complex logic requires wiring... (mitigated by StdLib, custom components, *and now Named Component Definitions*)."
    *   (Add) **Configuration Merge Complexity:** The deep merge logic for configurations, while powerful, adds a layer of behavior to understand (though it's a common pattern).
    *   (Add) **Namespace Management:** Requires users to manage and use namespaces correctly for FQN resolution in larger systems.

---

**Technical Documentation (DDD Approach) V1.0 - UPDATES:**

**Section 1. Bounded Context: Flow Structure Definition:**

*   (Update Overview): "...static structure and configuration... It also includes definitions for reusable configured component instances (`NamedComponentDefinition`) and default context variables (`ContextVariableDefinition`)."

**Section 2. Aggregates:**

*   **`DslDocument`:**
    *   (Update State): `dsl_version`, `namespace?`, `definitions` (containing `ContextVariableDefinition`s, `NamedComponentDefinition`s, and `FlowDefinition`s).
    *   (Update Invariant): `namespace`, if present, must be a valid FQN string.
*   **`ContextVariableDefinition`** (NEW Aggregate Root within `definitions.context`)
    *   **Identity:** `name` (FQN derived from `namespace` and `name`).
    *   **State:** `name`, `value`, `type?`, `description?`, `sensitive?`.
    *   **Invariant:** `name` and `value` are required. `value` must conform to `type` if specified. FQN must be unique.
*   **`NamedComponentDefinition`** (REVISED, Root within `definitions.components`, formerly `ComponentDefinition`)
    *   **Identity:** `name` (FQN derived from `namespace` and `name`).
    *   **State:** `name`, `description?`, `type` (base component type), `config?` (base config object).
    *   *Remove `inputs`, `outputs`, `state_schema` as direct state.* These are properties of the resolved base `type`.
    *   **Invariants:** `name` and `type` are required. `type` must refer to a known base component type. `config`, if present, must be a valid configuration structure (placeholders noted for later resolution). FQN must be unique.
*   **`FlowDefinition`:**
    *   (Update Identity): `name` (FQN derived from `namespace` and `name`).
    *   (Update Invariant): FQN must be unique.

**Section 3. Entities:**

*   **`InputDefinition` / `OutputDefinition`:** These are no longer direct entities under `NamedComponentDefinition` in the DSL structure itself. They are properties of the base `type` that a `NamedComponentDefinition` refers to. The DSL validator would look up the base type's port definitions when validating `inputs_map` in a step.
*   **`StepDefinition`:**
    *   (Update State): `step_id`, `description?`, `component_ref` (string - FQN or short name for Named Component, or FQN for raw type), `config?` (overlay config object), `inputs_map?`, `condition?`, `run_after?`.
    *   (Update Invariants): `component_ref` must resolve to either a defined `NamedComponentDefinition` (by FQN) or a known base component `type`. The *effective (merged and resolved)* config must be valid for the resolved base component type.

**Section 4. Value Objects:**

*   Add `Namespace`: String (FQN).
*   Add `ContextVariablePath`, `SecretPath`: Strings used in `{{...}}`.
*   `ComponentName` now refers to the `name` of a `NamedComponentDefinition`. `ComponentTypeIdentifier` refers to the base `type`.

**Section 5. Domain Events:**

*   Add `ContextVariableDefined` (fqn: String, value: Any, type: Option<String>)
*   Add `NamedComponentDefined` (fqn: String, base_type: String, base_config: Option<Object>)
*   Add `ContextResolutionFailed` (path: String, step_id: Option<String>, component_definition_name: Option<String>)
*   Add `SecretResolutionFailed` (path: String, ...)
*   Update `ComponentReferenceNotFound` to clarify if it's a Named Component FQN or a base type FQN.

**Section 6. Domain Services:**

*   **`DefinitionValidator`:**
    *   (Add) Validate `definitions.context` (uniqueness, type/value consistency, circular refs).
    *   (Add) Validate `definitions.components` (uniqueness of Named Component FQNs, `type` is known, base `config` is structurally valid for `type` before placeholder resolution).
    *   (Add) Validate `component_ref` resolution in steps.
*   **`EffectiveConfigResolver` (NEW Domain Service - Conceptual):**
    *   Takes a step's `component_ref`, its inline `config?`, the registry of `NamedComponentDefinition`s, the layered `ContextVariableRegistry`, and the `SecretStoreInterface`.
    *   Performs:
        1.  Lookup of Named Component's base config (if applicable).
        2.  Deep merge of step config onto base config.
        3.  Substitution of `{{context...}}` and `{{secrets...}}` placeholders.
    *   Returns the final, fully resolved config object for component instantiation, or errors.

This V1.0 DSL Architecture provides a solid, extensible foundation. It balances the desire for LLM-friendly simplicity with the practical needs of production systems (DRY, maintainability, environment configuration, hot reloading).

---

You're right, pushing for essential modularity and some key advanced patterns earlier can significantly accelerate the platform's utility and prevent architectural roadblocks later. If the goal is a "production-ready system right now" (even for an initial advanced version), robust sharing and some common complex patterns are highly desirable.

Let's refine the specs for **DSL V1.0** (instead of V1.0, to signify these added capabilities from the outset) and adjust the StdLib patch accordingly. This will be a more ambitious but also more complete initial offering.

---

**Refined: Cascade YAML DSL: Detailed Architecture Document V1.0**
*(Incorporating Modularity and placeholder for Advanced StdLib Patterns)*

**1. Introduction & Vision (Update)**

The Cascade YAML DSL V1.0 is the primary interface for defining reactive workflows. It builds upon the "Radical Simplification & Composition" philosophy by providing a minimal, stable, declarative format, and now explicitly includes mechanisms for **modular design and sharing of definitions** across different DSL files and namespaces. This version also anticipates the need for StdLib components that address more sophisticated workflow patterns.

**Vision:** (Largely the same, but add emphasis on modularity) "...The DSL remains focused purely on the declarative 'wiring' and abstract definition of the system, supported by a robust mechanism for creating and sharing reusable **modules** of component blueprints and context variables. Its simplicity, regularity, and modularity are key..."

**Section 2. Key Concepts & Terminology (DSL Elements) - ADDITIONS/REFINEMENTS for V1.0:**

*   **`dsl_version`:** (Required) Example: `"1.0"`.
*   **`namespace`:** (Required, Top-Level) Specifies a unique global FQN for all entities defined within this DSL file. *Making this required promotes good practice from the start.*
*   **`imports`:** (NEW, Optional List, Top-Level) Defines dependencies on other DSL modules/namespaces.
    *   **Import Item (Object in `imports` list):**
        *   `namespace` (string, required): The FQN of the namespace to import (e.g., `"com.my_org.shared.common_components"`).
        *   `as` (string, optional): An alias for the imported namespace. If not provided, entities are referenced by their full FQN.
        *   `version` (string, optional): A semantic version string for the imported module (e.g., `"1.2.3"`, `">=1.0.0 <2.0.0"`). The runtime uses this for resolving the correct module version from a registry or source. *If omitted, implies "latest compatible" or a project-level lock, TBD by runtime implementation details.*
*   **`definitions.context`:** (Unchanged from previous V1.0 refined proposal)
*   **`definitions.components`:** (Now explicitly "Blueprints/Named Component Definitions")
    *   `name`: Still unique within its *own* `namespace`.
*   **`definitions.flows`:** (Unchanged)
*   **`StepDefinition.component_ref`:**
    *   Now explicitly resolves considering `imports`.
    *   Can be:
        1.  Short name (if `name` in `definitions.components` of current file's `namespace`).
        2.  `alias.name` (if imported with an alias).
        3.  Full FQN (e.g., `com.imported_namespace.component_name`).
        4.  Raw base component `type` FQN (e.g., `StdLib:HttpCall`).
*   **`Context Variable Reference String`:** `{{context.<alias_or_FQN>.<variable_name>}}` or `{{context.<short_name_if_in_same_namespace>}}`.

**Section 3. High-Level Architecture Diagram - UPDATED for V1.0 (Illustrating Imports):**

```
+-----------------------------------------------------------------+
|                         YAML Document (A)                     |
| +-----------------------------------------------------------+ |
| | dsl_version: "1.0"                                        | |
| | namespace: "com.example.serviceA"                         | |
| | imports:                                                  | | // NEW
| |   - namespace: "com.example.shared"                       | |
| |     as: shared                                            | |
| |     version: "1.0.0"                                      | |
| +-----------------------------------------------------------+ |
| | definitions:                                              | |
| |   context: [...]                                          | |
| |   components: [...]                                       | |
| |   flows:                                                  | |
| |     - name: flow-in-A                                     | |
| |       steps:                                              | |
| |         - step_id: use-shared-comp                        | |
| |           component_ref: shared.common-component          | | // Uses imported
| |           config: {...}                                     | |
| |         - step_id: use-local-comp                         | |
| |           component_ref: local-component-in-A             | | // Uses local
| |           config: {...}                                     | |
| +-----------------------------------------------------------+ |
+-----------------------------------------------------------------+
        | Resolves & Loads (potentially from a Module Registry)
        V
+-----------------------------------------------------------------+
|                         YAML Document (Shared)                  |
| +-----------------------------------------------------------+ |
| | dsl_version: "1.0"                                        | |
| | namespace: "com.example.shared"                           | |
| +-----------------------------------------------------------+ |
| | definitions:                                              | |
| |   components:                                             | |
| |     - name: common-component                              | |
| |       type: StdLib:SomeType                               | |
| |       config: { default_param: "{{context.globalDefault}}" } | |
| +-----------------------------------------------------------+ |
+-----------------------------------------------------------------+
```

**Section 5. Major Flows (DSL Usage Lifecycle) - UPDATES to Parsing & Validation for V1.0:**

*   **Parsing & Validation:**
    *   (Add) Parse `imports` section.
    *   (Add) The runtime's `DefinitionLoader` (or similar service) is responsible for resolving and loading imported modules (based on `namespace` and `version`) from a **Module Registry** or a configured source path. This is a significant new runtime capability. Circular dependencies between modules must be detected and reported.
    *   (Update) When validating `component_ref` or context variable paths, the validator must consider the imported namespaces and their aliases.
    *   (Add) Version compatibility checks for imported modules.
*   **Runtime Interpretation:**
    *   (Add) The effective context for a flow/component might now be composed of context variables from its own namespace *and* potentially from imported/global namespaces (resolution rules needed, e.g., local namespace overrides imported/global). For V1.0, let's keep it simple: `{{context...}}` must use an FQN or an alias to be unambiguous if variables with the same short name exist across namespaces. Local short names resolve to the current file's namespace.

---

**Refined: Cascade Standard Component Library (StdLib): DSL Enhancement Patch V4.34 (aligned with DSL V1.0)**

*(The StdLib patch version (e.g., V4.34) refers to the version of the StdLib component *specifications* and their expected interaction with the DSL. The DSL itself now has a version, V1.0.)*

**1. Introduction & Vision (StdLib Addendum for V4.34, targeting DSL V1.0)**

This StdLib V4.34 specification is designed to be used with **Cascade DSL V1.0**. It assumes the DSL's support for namespaces, context variables, named component definitions (in `definitions.components`), and the new `imports` mechanism for modularity.

**StdLib V4.34 aims to include initial implementations or refined specifications for more sophisticated workflow patterns, such as:** (These are placeholders; actual implementation would be detailed)

*   **`StdLib:SagaCoordinator` (Refined for V4.34):** Further refinements to its internal step definition and compensation logic, potentially allowing blueprint references for forward/compensation steps.
*   **`StdLib:HumanTaskNotifier` (NEW Conceptual Component for V4.34):**
    *   **Purpose:** Manages the notification aspect of a human task. Sends a notification (e.g., via `Communication.SendNotification` blueprint) and can create a correlation ID for a `StdLib:WaitForExternalEvent` step that would pause the flow awaiting human action.
    *   **Config:** Notification blueprint ref, data for notification, correlation ID expression.
*   **`StdLib:StatefulStreamProcessor` (NEW Conceptual Abstract Component for V4.34):**
    *   **Purpose:** A more generic base for stateful stream operations (beyond simple windowing or buffering), potentially using plugins for custom aggregation logic, stateful mapping, or joins over time with fine-grained state management.
    *   **Config:** Plugin type, plugin config, state TTL, checkpointing strategy.
    *   This would be a more advanced building block than `Streams:Window` or `StdLib:BufferInput`.

**3. DSL Specification Changes (Summary for StdLib Docs)**

*   StdLib component examples and documentation will now use DSL V1.0 syntax, including:
    *   `namespace` declarations.
    *   Use of `definitions.context` for common configurable values.
    *   Definition of reusable StdLib component setups in `definitions.components` (as Named Components).
    *   References to these Named Components in flow steps, demonstrating `config` overlay.
    *   Illustrative use of `imports` if examples involve cross-module concerns.

**4. Core Runtime Requirements (StdLib Perspective for V4.34 with DSL V1.0)**

*   The Core Runtime must fully support DSL V1.0 parsing, validation, context layering, FQN resolution (including for imports from a Module Registry), and the defined configuration merge strategy for Named Components.
*   **Module Registry / Resolver:** A crucial new piece of infrastructure. The runtime needs to locate and load versioned DSL modules (which are essentially DSL files themselves, identified by their `namespace` and `version`). This could be:
    *   Filesystem-based (paths mapped to namespaces).
    *   Git-repository based.
    *   A dedicated artifact registry service.
*   **Support for Advanced StdLib State:** The runtime's state persistence and timer mechanisms must be robust enough to support more complex stateful components like a refined `SagaCoordinator` or a `StatefulStreamProcessor`.

**5. StdLib Component Specification Document Updates**

*   All examples will be updated to DSL V1.0.
*   New sections for `StdLib:HumanTaskNotifier` and `StdLib:StatefulStreamProcessor` (or similar advanced patterns) will be added, detailing their `type`, `config` schema, `inputs`, `outputs`, and reliance on runtime features. Their examples will showcase how they are defined as Named Components and used in flows.

---

**Impact and Justification for Including Modularity & Advanced Patterns Now (in DSL V1.0 / StdLib V4.34):**

*   **Modularity (`imports`):**
    *   **Why now:** Real-world systems are rarely monolithic. The ability to define shared, common infrastructure (e.g., `com.my_org.shared.logging_components`, `com.my_org.shared.auth_components`) and import them is fundamental to avoiding massive duplication across different service/domain DSL files. Waiting for V2.0 would mean V1.x users would quickly hit a wall in terms of organizing larger projects.
    *   **Complexity:** Adds the need for a Module Registry/Resolver and versioning considerations. This is non-trivial but essential for scalability.
*   **Advanced Workflow Patterns (Saga, Human Task Primitives):**
    *   **Why now:** Many business processes involve these. Providing even basic StdLib support for these patterns from an early stage makes the platform much more compelling for a wider range of use cases. Otherwise, users would have to build these complex patterns from very raw primitives, which is error-prone and time-consuming.
    *   **Complexity:** These components often have more complex internal logic and state management requirements for the Core Runtime.

**Balancing Act for V1.0:**

*   The **Module Registry** is the biggest new piece of infrastructure required. For an initial V1.0, it could be a simpler implementation (e.g., filesystem layout convention for modules) with the plan to evolve to a more robust registry later.
*   The **Advanced StdLib Components** can start with well-defined interfaces and simpler initial implementations, with more features added over time.

This V1.0 is definitely more ambitious, but it delivers a platform that is significantly more capable and better structured for real-world application development from the get-go. It addresses the "production ready system right now" desire more directly by tackling these essential aspects early. The LLM will benefit from being able to reference and compose these shared, versioned modules.

---

Okay, let's commit to the **`imports` + `version`** approach for DSL V1.0, as it offers better long-term maintainability and aligns with standard dependency management practices, even if it adds a little more complexity than version-in-name. Now, let's tackle how this interacts with namespaces and how it could be stored and resolved in a graph database.

**Do we need namespaces then? YES.**

Even with `imports` handling dependencies and versioning, the top-level `namespace` declaration in each DSL file remains crucial for several reasons:

1.  **Unique Identification of Definitions:** It provides a globally unique identifier (FQN = `<namespace>.<definition_name>`) for every component definition, context variable, and flow defined *within that file*. This is essential for the graph DB to store these as distinct entities without collisions. `my-component` in `com.org.moduleA` is different from `my-component` in `com.org.moduleB`.
2.  **Scope for Local References:** It defines the default scope for resolving short names used in `component_ref` or `{{context...}}` within that same file.
3.  **Identifying the Module Itself:** The `namespace` *is* the canonical identifier for the module that other DSL files will import. The `imports` section uses these FQNs to specify *which module* to import.
4.  **Organization:** It provides a clear organizational structure for grouping related definitions.

So, `namespace` identifies the module/file, and `imports` declares dependencies *between* these uniquely identified modules, specifying version constraints.

---

**Storing and Resolving `imports` + `version` in a Graph DB**

Here's a conceptual model of how this could work in a graph database (like Neo4j, ArangoDB, etc.). We'll define node types and relationships.

**Node Types:**

1.  **`DslModule`**
    *   `fqn`: String (Primary Key, e.g., "com.example.shared_infra") - The namespace.
    *   `version`: String (e.g., "1.0.0", "1.0.0") - Part of the unique identity of a specific module version.
    *   `sourceUri`: String (e.g., file path, git commit hash, registry URL) - Where the DSL definition for this version lives.
    *   `status`: String (e.g., "Active", "Deprecated", "Loading")
    *   *(Other metadata: description, author, timestamp)*
    *   **Uniqueness Constraint:** (`fqn`, `version`)

2.  **`ComponentDefinition`** (Named Component / Blueprint)
    *   `fqn`: String (Primary Key, e.g., "com.example.shared_infra.standardLogger")
    *   `baseType`: String (e.g., "StdLib:Logger") - The underlying component type.
    *   `config`: JSON/Map (The base configuration object, potentially with unresolved `{{context/secrets}}` placeholders).
    *   `description`: String
    *   *(Maybe store parsed parameters if using the explicit parameter blueprint model)*

3.  **`ContextVariable`**
    *   `fqn`: String (Primary Key, e.g., "com.example.shared_infra.defaultTimeout")
    *   `defaultValue`: Any (The default value from DSL).
    *   `type`: String
    *   `description`: String
    *   `sensitive`: Boolean

4.  **`Flow`**
    *   `fqn`: String (Primary Key, e.g., "com.example.app_service.processOrder")
    *   `triggerConfig`: JSON/Map
    *   `description`: String

5.  **`FlowStep`**
    *   `id`: String (Primary Key - composite: `<flow_fqn>#<step_id>`)
    *   `stepId`: String (The short ID within the flow)
    *   `componentRef`: String (The string reference used in the DSL - could be short name, alias.name, or FQN)
    *   `config`: JSON/Map (The *step-specific* config overlay, potentially with placeholders)
    *   `inputsMap`: JSON/Map
    *   `runAfter`: List<String> (List of local `stepId`s)

6.  **`RuntimeOverrideContext`** (Optional, for storing runtime overrides)
    *   `fqn`: String (Primary Key - FQN of the `ContextVariable` it overrides)
    *   `value`: Any (The overriding value)
    *   `source`: String (e.g., "environment", "config-service", "deployment-param")

**Relationship Types:**

1.  **`DEFINED_IN`**
    *   (`ComponentDefinition`) -[:DEFINED_IN]-> (`DslModule`)
    *   (`ContextVariable`) -[:DEFINED_IN]-> (`DslModule`)
    *   (`Flow`) -[:DEFINED_IN]-> (`DslModule`)
2.  **`CONTAINS_STEP`**
    *   (`Flow`) -[:CONTAINS_STEP]-> (`FlowStep`)
3.  **`REFERENCES_COMPONENT`**
    *   (`FlowStep`) -[:REFERENCES_COMPONENT { ref_string: "..." }]-> (`ComponentDefinition`) // Points to the resolved component definition
    *   (`FlowStep`) -[:REFERENCES_COMPONENT_TYPE { type_string: "..." }]-> (`ComponentTypeDefinition`) // Points to a base type if raw type used (Conceptual Node)
4.  **`DEPENDS_ON`** (Crucial for Imports and Versioning)
    *   (`DslModule`) -[:DEPENDS_ON { version_constraint: "1.2.3", alias: "shared" }]-> (`DslModule { fqn: "com.example.shared_infra" }`) // Note: This relates the *consuming module* to the *conceptual dependency module*. The actual version resolution happens next.
5.  **`RESOLVED_DEPENDENCY`** (Connects to the specific version used)
    *   (`DslModule {fqn: "com.consumer", version: "X"}`) -[:RESOLVED_DEPENDENCY { alias: "shared" }]-> (`DslModule {fqn: "com.example.shared_infra", version: "1.2.3"}`)
6.  **`USES_CONTEXT_VAR`**
    *   (`ComponentDefinition`) -[:USES_CONTEXT_VAR { path: "{{context...}}" }]-> (`ContextVariable`)
    *   (`FlowStep`) -[:USES_CONTEXT_VAR { path: "{{context...}}" }]-> (`ContextVariable`) // If step config uses context
7.  **`OVERRIDES_CONTEXT`**
    *   (`RuntimeOverrideContext`) -[:OVERRIDES_CONTEXT]-> (`ContextVariable`)
8.  **`RUNS_AFTER`**
    *   (`FlowStep`) -[:RUNS_AFTER]-> (`FlowStep`) // Representing the `run_after` dependency within a flow

**Resolution Process (Conceptual):**

1.  **Loading a DSL File (`com.example.my_app`, version `A`):**
    *   Create/Update `DslModule {fqn: "com.example.my_app", version: "A"}` node.
    *   Parse `definitions`, create/update `ComponentDefinition`, `ContextVariable`, `Flow`, `FlowStep` nodes, linking them via `DEFINED_IN` and `CONTAINS_STEP`. Store `component_ref` strings on `FlowStep`.
2.  **Resolving Dependencies:**
    *   For each `import` in the file:
        *   Create a `DEPENDS_ON` relationship from the current `DslModule` node to a placeholder representing the target module FQN, storing the `version_constraint` and `alias`.
        *   The **Module Resolver** service (part of the Core Runtime) queries the graph (or an external registry + graph cache) to find the best matching `DslModule` version node that satisfies the `version_constraint` (e.g., find latest `DslModule {fqn: "com.example.shared_infra", version: "1.x.y"}` matching `~1.2.0`).
        *   Once resolved to a specific version (e.g., `1.2.5`), create/update a `RESOLVED_DEPENDENCY` relationship from the consuming module version node to the specific provider module version node (`DslModule {fqn: "com.example.shared_infra", version: "1.2.5"}`). Store the `alias` here too for easy lookup during reference resolution. Recursively load and resolve dependencies of the imported module if not already done. Handle circular dependencies.
3.  **Resolving `component_ref` in a Step (`my_app.myFlow#step1`):**
    *   Get the `componentRef` string from the `FlowStep` node.
    *   Try resolving it as a short name within the current `Flow`'s parent `DslModule`'s namespace. Check for `ComponentDefinition { fqn: "com.example.my_app.<ref_string>" }`.
    *   If not found, check if `ref_string` contains a dot (`.`). If so, parse it as `alias.componentName` or `FQN`.
    *   If `alias.componentName`: Find the `RESOLVED_DEPENDENCY` relationship for the current `DslModule` with the matching `alias`. Get the target (resolved) `DslModule` FQN and version. Look up `ComponentDefinition { fqn: "<resolved_module_fqn>.<componentName>" }`.
    *   If FQN: Look up `ComponentDefinition { fqn: "<ref_string>" }` directly.
    *   If still not found, check if `ref_string` matches a known base `ComponentTypeDefinition` (e.g., `StdLib:HttpCall`).
    *   If resolved to a `ComponentDefinition`, create the `REFERENCES_COMPONENT` relationship. If resolved to a base type, create `REFERENCES_COMPONENT_TYPE`. Handle errors if not resolved.
4.  **Resolving `{{context...}}`:**
    *   Parse the path `fqn.or.alias.path.to.var`.
    *   Resolve the namespace/alias similar to `component_ref` using the `DslModule` and its `RESOLVED_DEPENDENCY` relationships to find the target `ContextVariable` FQN.
    *   Query for a `RuntimeOverrideContext` node overriding the target `ContextVariable` FQN. If found, use its `value`.
    *   If no override, query for the `ContextVariable` node by FQN and use its `defaultValue`.
    *   Track the dependency via `USES_CONTEXT_VAR`.
5.  **Hot Reload Triggering:**
    *   If a `DslModule` node is updated (new version loaded): Find consuming `DslModule`s via incoming `RESOLVED_DEPENDENCY` and potentially trigger their re-resolution if version constraints allow a change.
    *   If a `ComponentDefinition` node is updated: Find `FlowStep`s via incoming `REFERENCES_COMPONENT` and trigger their flow instances for potential reload/update.
    *   If a `ContextVariable` node is updated (DSL default changed): Find dependent `ComponentDefinition`s and `FlowStep`s via incoming `USES_CONTEXT_VAR` and trigger re-evaluation/reload.
    *   If a `RuntimeOverrideContext` node is added/updated/removed: Find the target `ContextVariable` and trigger re-evaluation/reload for its dependents.

**Benefits of this Graph Model:**

*   **Explicit Relationships:** Clearly models dependencies between modules, components, steps, and context.
*   **Impact Analysis:** Easy to query "what uses this component definition?" or "what context variables does this flow depend on?".
*   **Targeted Hot Reloading:** Changes can trigger updates only for directly affected downstream entities by traversing the graph.
*   **Versioning:** Explicitly models module versions and resolved dependencies.
*   **Queryability:** Allows rich querying for platform management, UI displays, etc.

This graph model provides the necessary structure to support the `imports` + `version` mechanism effectively within a dynamic, hot-reloadable runtime. The key additions are the `DslModule` node incorporating versions and the `DEPENDS_ON` / `RESOLVED_DEPENDENCY` relationships.

---

Yes, that's absolutely true. The system has multiple ways for flows to interact or be initiated, and these mechanisms interact with the module system primarily through how they identify the target flow or actor. Let's clarify how Triggers and the Actor Model fit in with the DSL V1.0 (with modules and namespaces).

**1. Triggers (Starting Flows)**

*   **Definition:** Each `Flow` definition has a `trigger` section:
    ```yaml
    namespace: "com.example.service_a"
    # ...
    definitions:
      flows:
        - name: "ProcessIncomingWebhooks" # FQN: com.example.service_a.ProcessIncomingWebhooks
          trigger:
            type: "HttpWebhookTrigger" # A component type implementing trigger logic
            config:
              httpPath: "/webhooks/service-a"
              method: "POST"
              # Potentially uses context for port, etc.
              # port: "{{context.com.example.service_a.webhookPort}}"
            output_name: "webhookEvent"
          steps:
            # ...
    ```
*   **How it works:**
    *   The Core Runtime instantiates Triggers based on the `trigger` definitions found in all loaded and active `Flow` definitions across all modules.
    *   The `trigger.type` determines the trigger's behavior (e.g., listen on an HTTP endpoint, subscribe to a Kafka topic, respond to a timer).
    *   When the trigger condition is met (e.g., HTTP request received), the runtime identifies the corresponding `Flow` definition (using its FQN like `com.example.service_a.ProcessIncomingWebhooks`) and starts a new instance of that flow, passing the trigger data (`webhookEvent`).
*   **Interaction with Modules:**
    *   Triggers are defined *within* a flow, which itself belongs to a specific module (defined by `namespace`).
    *   The uniqueness of the trigger's listener configuration (e.g., HTTP path + method, Kafka topic + consumer group) across the *entire system* is managed by the runtime or underlying infrastructure, potentially informed by the flow's FQN. The runtime needs to ensure it doesn't try to register two triggers listening on the exact same external event source conflictingly.
    *   Modules allow related flows and their triggers to be grouped logically, but the trigger activation itself is a runtime mechanism based on the trigger's configuration, leading to the instantiation of a specific, FQN-identified flow.

**2. Actor Model (`StdLib:ActorShell`, `StdLib:ActorRouter`)**

*   **Concept:** Provides stateful entities (actors) that process messages sequentially. An `ActorShell` typically wraps the logic (often another component or flow), and an `ActorRouter` dispatches messages to the correct shell based on an Actor ID.
*   **Calling Another Flow *via* an Actor (Indirectly):**
    *   You could design an Actor whose logic component (`actorLogicComponent` in `ActorShell`) is `StdLib:SubFlowInvoker`.
    *   When this actor receives a message, its logic (the `SubFlowInvoker`) would start a *new instance* of a target flow.
    ```yaml
    namespace: "com.example.actors"
    definitions:
      components:
        # Defines the actor shell itself
        - name: "orderProcessorActorShell"
          type: "StdLib:ActorShell"
          config:
            actorLogicComponent: "invokeOrderProcessingFlow" # Refers to the SubFlowInvoker defined below
            stateScope: "GlobalById" # State keyed by orderId

        # Defines the SubFlowInvoker used by the actor logic
        - name: "invokeOrderProcessingFlow"
          type: "StdLib:SubFlowInvoker"
          config:
            # Target flow identified by FQN
            flowName: "com.example.order_service.ProcessOrderFlow" # Flow in another module
            waitForCompletion: false # Fire-and-forget subflow start
      # Context variable for the target flow name
      context:
        - name: "orderProcessingFlowFQN"
          value: "com.example.order_service.ProcessOrderFlow"

      flows:
        - name: "RouteToOrderActorFlow" # Example flow using the router
          trigger: #... e.g., Kafka trigger with order events
          steps:
            - step_id: "route_to_actor"
              component_ref: "StdLib:ActorRouter"
              config:
                actorIdExpression: "message.payload.orderId" # Extract actor ID (orderId)
                # Target the specific shell defined above using its FQN
                # This config needs refinement - ActorRouter needs to know WHICH ActorShell definition to implicitly target
                # Option 1: ActorRouter targets a TYPE + ID, runtime finds the Shell instance
                # Option 2: ActorRouter targets a specific Shell DEFINITION + ID (less flexible)
                # Let's assume Option 1 is how StdLib ActorRouter works:
                targetActorType: "StdLib:ActorShell" # Runtime finds/creates shell instance for the ID
              inputs_map:
                # message contains the payload for the target flow (via the actor)
                message: "trigger.kafkaMessage"
    ```
*   **Interaction with Modules:**
    *   The `ActorShell` and `ActorRouter` are typically defined as Named Components within a specific module's DSL (`definitions.components`).
    *   The `StdLib:SubFlowInvoker` (used as the actor's logic) references the target flow using its FQN (`flowName: "com.example.order_service.ProcessOrderFlow"`), which clearly crosses module boundaries.
    *   The `ActorRouter` needs a mechanism to target the correct actor *instance*. Typically, this is done via `actorId` and potentially an `actorType` (like `StdLib:ActorShell`). The runtime manages finding or activating the shell instance associated with that ID, regardless of which module originally defined the shell component itself (though the shell *definition* has an FQN). Actor *instances* with `GlobalById` scope often live conceptually "outside" specific modules, managed globally by the runtime's state mechanism, even if their *defining configuration* resides within a module.

**3. Direct Flow Invocation (`StdLib:SubFlowInvoker`)**

*   **Concept:** Explicitly starts a new instance of another flow from within a step of the current flow.
*   **Definition:**
    ```yaml
    namespace: "com.example.service_b"
    imports:
      - namespace: "com.example.service_a"
        as: serviceA
        version: "1.0"
    definitions:
      components:
        - name: "invokeServiceAFlow"
          type: "StdLib:SubFlowInvoker"
          config:
            flowName: "serviceA.FlowInThatModule" # Reference flow via alias.name or FQN
            waitForCompletion: true
      # ...
      flows:
        - name: "FlowInServiceB"
          steps:
            - step_id: "trigger_subflow"
              component_ref: "invokeServiceAFlow" # Use the named component
              inputs_map:
                initialData: "{ some: 'data', from: 'serviceB' }" # Data for subflow trigger
    ```
*   **Interaction with Modules:**
    *   This is the most direct way modules interact at the flow level.
    *   The `flowName` config in `StdLib:SubFlowInvoker` explicitly uses the FQN (or an alias defined via `imports`) to target a flow defined in another module.
    *   The `imports` section becomes crucial here for managing these cross-module flow dependencies and potentially their versions.

**Summary of How They Work Together with Modules:**

*   **Triggers:** Defined *within* flows in a specific module. Activate flows based on external events or schedules, referencing the flow by its FQN. Runtime ensures listener uniqueness.
*   **Actor Model:** Actor Shells and Routers are often defined as reusable Named Components within modules. Actors can indirectly trigger flows in other modules if their logic component uses `StdLib:SubFlowInvoker` with the target flow's FQN. Actor *state* (for `GlobalById`) might be managed globally by the runtime.
*   **SubFlowInvoker:** Directly invokes flows defined in other modules using FQNs, typically managed via the `imports` mechanism for clarity and versioning.

The module system (namespaces + imports + FQNs) provides the necessary structure to uniquely identify and reference flows and component definitions across different parts of the system, enabling these cross-flow interaction patterns to work reliably. The FQN acts as the global address for these definitional entities.

---

Okay, let's compile the key aspects of the refined Cascade DSL V1.0, including namespaces, context variables, component definitions (blueprints), flows, configuration merging, and the interaction patterns, into a comprehensive guide specifically tailored for an LLM that will be generating this DSL.

This document will serve as a core piece of the "RAG" context provided to the LLM.

---

**LLM Training/Prompting Guide: Generating Cascade DSL V1.0**

**Objective:** Generate syntactically correct, semantically valid, maintainable, and best-practice compliant Cascade YAML DSL (`dsl_version: "1.0"`) based on natural language requests, utilizing provided context (RAG).

**Core Philosophy of Cascade DSL:** Radical Simplification & Composition.
*   The DSL primarily defines **structure and wiring**.
*   Complex behavior resides in **Components** (identified by `type`).
*   Reusability of configured components is achieved via **Named Component Definitions**.
*   Environment-specific values are handled by **Context Variables**.
*   Modularity is managed by **Namespaces** and **Imports**.

**Key DSL V1.0 Concepts to Master:**

**1. Top-Level Structure & Metadata:**

*   **`dsl_version: "1.0"`:** ALWAYS include this at the root.
*   **`namespace: "com.your_org.domain.module"`:** ALWAYS include this. Define a unique, descriptive, hierarchical namespace (using dots) for all definitions within the file. This namespace forms the prefix for the Fully Qualified Name (FQN) of all entities defined in this file.
*   **`imports:` (Optional List):** Use this to declare dependencies on other modules (namespaces) when referencing their defined components or context variables.
    *   `namespace`: (Required) FQN of the module being imported.
    *   `as`: (Optional) A short alias for readability when referencing entities from the imported namespace (e.g., `shared.myComponent`).
    *   `version`: (Optional, but recommended for production) Semantic version constraint (e.g., `"1.2.3"`, `"~1.2.0"`, `">=1.0 <2.0"`) for the imported module. *If omitted, assume "latest compatible" based on runtime policy.*
*   **`definitions:`:** Container for `context` and `components`.
*   **`flows:`:** Container for `flows`.

**2. `definitions.context` (Context Variables):**

*   **Purpose:** Define *non-sensitive*, default configuration parameters that might vary by environment or be reused.
*   **Structure:** List of objects, each with:
    *   `name:` (Required) Short name, unique within the namespace. FQN is `<namespace>.<name>`.
    *   `value:` (Required) Default value (any YAML type: string, number, boolean, list, map).
    *   `type:` (Optional) Schema type for validation (e.g., "string", "integer").
    *   `description:` (Optional) Explanation.
    *   `sensitive:` (Optional, default: false) Mark if the *value itself* might be sensitive (though ideally, sensitive values use `secrets`).
*   **Usage:** Reference these in `config` blocks (in `definitions.components` or `flows.steps.config`) using `{{context.<FQN | alias.name | short_name>}}`. The runtime resolves this against DSL defaults layered with external overrides.
*   **Guideline:** Define context variables for URLs, timeouts, feature flags, topic names, default settings, etc.

**3. `definitions.components` (Named Component Definitions):**

*   **Purpose:** Define reusable, pre-configured instances of base component types (from StdLib or custom). This is the primary way to achieve **DRY** for component setups.
*   **Structure:** List of objects, each with:
    *   `name:` (Required) Short name, unique within the namespace. FQN is `<namespace>.<name>`.
    *   `type:` (Required) FQN of the base component type (e.g., `StdLib:HttpCall`, `com.my_org.custom.MyProcessor`).
    *   `config:` (Optional) The base/default configuration object for this instance. Use `{{context...}}` and `{{secrets...}}` here for externalized values. If omitted, relies on base type defaults and step overrides.
    *   `description:` (Optional) Explanation.
*   **Inheritance:** A Named Component inherits the input/output ports and state schema defined by its base `type`.
*   **Guideline:** Create Named Components for common API clients, database executors, loggers, message publishers/subscribers, configured adapters, etc. Give them meaningful names reflecting their specific purpose (e.g., `inventoryServiceClient`, `auditEventLogger`).

**4. `flows` and `steps`:**

*   **Flows:** Each needs a `name` (unique within namespace), `trigger`, and `steps`.
*   **Steps:** Each needs a `step_id` (unique within flow) and `component_ref`.
*   **`component_ref:` Resolution:**
    1.  Check if it's a short `name` defined in the current file's `definitions.components`.
    2.  Check if it's `alias.name` referencing an imported component definition via `imports`.
    3.  Check if it's an FQN (`com.other_org.module.ComponentName`) matching a component definition loaded from another module.
    4.  Check if it's an FQN matching a raw base component `type` (e.g., `StdLib:MapData`).
    5.  If none match, it's an error.
*   **Step `config:` Block:**
    *   **If `component_ref` points to a Named Component:**
        *   `config` is optional.
        *   If present, it **deep merges** with the Named Component's base `config`.
        *   **Merge Rules:** Step config overlays base config. Objects merge recursively (step keys win). Arrays in the step config *replace* arrays in the base config for the same key. Scalars in the step config replace scalars in the base config.
    *   **If `component_ref` points to a raw base type:**
        *   `config` is required (if the type needs config).
        *   It directly configures the raw type instance. No merge occurs (beyond base type defaults).
    *   Use `{{context...}}` and `{{secrets...}}` where needed.
*   **`inputs_map:`:**
    *   Crucial for data flow. Map component input port names (defined by the base `type`) to data sources.
    *   Data Source Syntax: `"trigger.<trigger_output_name>.<path>"`, `"steps.<step_id>.outputs.<output_port_name>.<path>"`.
    *   Ensure all *required* inputs of the resolved component type are mapped. Check StdLib/custom docs for port names and requirements.
*   **Error Handling:** Look for implicit or explicit error handling requirements. Route a component's `error` output (check its spec for `is_error_path: true` outputs) using `outputs_map` to appropriate handling steps (e.g., a logger, `StdLib:FailFlow`, a dead-letter queue publisher component).
*   **`run_after:`:** Use only when `inputs_map` doesn't sufficiently define execution order (e.g., synchronizing parallel branches before a join, or forcing order for steps with only side-effects).

**5. Secrets:**

*   **NEVER** hardcode sensitive values (API keys, passwords, tokens) in the DSL.
*   ALWAYS use `{{secrets.path.to.secret.in.external.store}}` syntax within `config` string values.
*   The `path.to.secret...` should be a meaningful identifier for the secret in the platform's secret management system.

**6. Interaction Patterns & Advanced StdLib:**

*   **Flow Triggering:** Flows are started by `trigger` definitions or invoked by `StdLib:SubFlowInvoker`.
*   **Inter-Module Invocation:** Use `StdLib:SubFlowInvoker` with the target flow's FQN (often resolved via an alias from `imports`) to call flows in other modules.
    ```yaml
    # In consuming flow:
    - step_id: call_shared_flow
      component_ref: StdLib:SubFlowInvoker
      config:
        flowName: "shared.CommonProcessingFlow" # Using alias 'shared' from imports
        waitForCompletion: true
      inputs_map: { initialData: "..." }
    ```
*   **Actor Model:** Use `StdLib:ActorRouter` to send messages (containing `actorId`) to stateful `StdLib:ActorShell` instances (which might be defined as Named Components). The shell's logic component can perform actions, including calling other flows via `StdLib:SubFlowInvoker` using the target flow's FQN.
*   **Sagas, Human Tasks:** If StdLib V4.34 provides components like `StdLib:SagaCoordinator` or `StdLib:HumanTaskNotifier`, understand their specific configuration and how they manage state and interaction, likely referencing other components or flows by FQN or via Named Component references.

**7. Generation Strategy & Clarification (Gherkin First):**

1.  **Analyze Request:** Understand the desired workflow, inputs, outputs, conditions, error handling, and any non-functional requirements (e.g., retries, idempotency).
2.  **Identify Ambiguity:** Check for missing details (specific names, paths, conditions, error behaviors).
3.  **Generate Gherkin Scenario(s) (Default Step):** Translate understanding into clear Gherkin `Given/When/Then` scenarios. Outline different paths (success, failure). **Explicitly output these scenarios.**
4.  **Ask Clarifying Questions:** Based on ambiguities identified, ask specific questions alongside the Gherkin.
5.  **Await Confirmation:** Wait for user confirmation of the Gherkin and answers to questions. **Do not proceed to DSL without this, unless the request was trivially simple and explicit.**
6.  **Generate DSL V1.0 (Post-Confirmation):**
    *   Translate the *confirmed* Gherkin scenario(s) into DSL.
    *   **Prioritize Reuse:** Check RAG context for existing relevant Named Components or Context Variables in the target namespace or shared namespaces (via `imports`). Use them (`component_ref` to Named Component, `{{context...}}`) before defining new ones or using raw types with full inline config.
    *   Apply all DSL V1.0 syntax and best practices outlined above.
    *   Add YAML comments (`# ...`) to explain non-obvious choices or map DSL steps back to Gherkin steps if helpful.
    *   Output ONLY the valid YAML DSL block.

**Checklist Before Outputting DSL:**

*   [ ] `dsl_version: "1.0"` included?
*   [ ] `namespace: "..."` included and appropriate?
*   [ ] `imports:` section present and correct if cross-namespace refs used? (Version specified?)
*   [ ] Sensible `definitions.context` variables defined for non-sensitive config?
*   [ ] Reusable component setups defined in `definitions.components`?
*   [ ] `flows` have unique names (within namespace)?
*   [ ] `steps` have unique `step_id`s (within flow)?
*   [ ] `component_ref` correctly points to a Named Component OR a raw base type?
*   [ ] Step `config` correctly merges/overlays or is provided fully as needed?
*   [ ] All `{{context...}}` and `{{secrets...}}` references look correct?
*   [ ] `inputs_map` correctly maps all required component inputs using valid Data Reference Strings?
*   [ ] Error handling considered and outputs mapped where necessary?
*   [ ] `run_after` used correctly if needed?
*   [ ] YAML syntax and indentation valid?
*   [ ] Gherkin scenario was confirmed/clarified (unless request was trivial)?

By rigorously following this guide, you can effectively leverage your capabilities and the provided context (RAG) to generate high-quality Cascade DSL V1.0. Remember that clarity, adherence to spec, and leveraging predefined abstractions (`definitions.components`, `definitions.context`) are key to creating maintainable and robust workflow definitions.