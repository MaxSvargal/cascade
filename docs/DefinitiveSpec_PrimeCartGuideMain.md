# PrimeCart E-Commerce App: A DefinitiveSpec User Guide

**Welcome to the PrimeCart DefinitiveSpec Guide!**

This guide demonstrates how to use DefinitiveSpec and the conceptual DefinitiveSpec Tools for VS Code to specify key aspects of the "PrimeCart" e-commerce application, a platform built primarily with TypeScript. We will cover everything from high-level requirements to detailed API contracts, data models, behavioral specifications (including state machines, interactions, and formal models), operational policies, and test cases.

This guide also illustrates how DSpec artifacts are designed to be effectively utilized by **LLM-based co-pilots** for specification assistance and by **AI implementation agents** for robust code generation, with humans focusing on review and validation of intent. These practices are integral to the broader **Definitive Development Methodology (DDM)**, which provides a structured, iterative approach to software development. Core DDM principles, its lifecycle, and other related concepts are detailed in the Appendices of this document (not included in this rendering).

**Target Audience:** Developers, QAs, Product Owners, and Architects working on the PrimeCart application using DefinitiveSpec and, ideally, within the Definitive Development Methodology (DDM), leveraging AI tooling.

**Prerequisites:**

*   VS Code installed.
*   "DefinitiveSpec Tools for VS Code" extension installed (conceptual for this guide).
*   Basic understanding of e-commerce concepts.
*   (For Formal Modeling section) Conceptual familiarity with TLA+ or similar formal methods.
*   Familiarity with the Definitive Development Methodology (DDM) is beneficial (see Appendices, not included here).

---

## Chapter 1: Project Setup & Core Requirements (Illustrating DDM Stage 1: Inception)

### 1.1. Setting Up the PrimeCart Specs Project

1.  Create a project folder: `primecart-specs`.
2.  Open it in VS Code.
3.  We'll organize specs into files like `users.dspec`, `products.dspec`, `orders.dspec`, `checkout.dspec`, `interactions.dspec`, `shared_policies.dspec`, `directives.dspec`, `infra.dspec`.
    *   **DDM Note:** In a full DDM setup, these `.dspec` files would be stored, versioned, and managed by the **Specification Hub (ISE)**, which maintains the crucial link graph between all specifications. The ISE resolves artifact names (e.g., `UserRegistration`) to globally qualified names (e.g., `users.UserRegistration`) for unique identification and linking.

### 1.2. Defining Core User Requirements (`users.dspec`)

Let's start with user registration and login, key outputs of the DDM's Inception stage.

```definitive_spec
// users.dspec
// Defines requirements, data models, APIs, and core logic for user management.

requirement UserRegistration {
    // Qualified Name (resolved by ISE): users.UserRegistration
    // id: "PC_REQ_USER_001" // Optional: Retain if this specific ID is used by external systems (e.g., Jira).
    title: "New User Account Registration"
    description: `
        **Goal:** Enable new visitors to create a PrimeCart account.
        **User Story:** As a new visitor to PrimeCart, I want to be able to register for an account using my email and a secure password, so that I can make purchases and track my orders.
        **Core Functionality:**
        1. Accept user input: email, password, password confirmation.
        2. Validate input according to defined rules (email format, password strength - see users.UserRegistrationPayload).
        3. Ensure email uniqueness within the system.
        4. Securely store user credentials according to NFR.SecurePasswordHashing and NFR.PiiFieldEncryption policies (defined in policies.PrimeCartDataSecurityNFRs).
        5. Provide clear feedback on success or failure of the registration attempt.
        6. Trigger a confirmation email upon successful registration (see events.UserRegistered).
        **Business Value:** Essential for acquiring new customers and enabling e-commerce transactions.
    `
    priority: "High"
    status: "Accepted"
    acceptance_criteria: [
        "Given I am on the registration page",
        "When I enter a unique email 'newuser@example.com'",
        "And I enter a strong password 'ValidPass123!' (matching users.UserRegistrationPayload.password constraints)",
        "And I confirm the password 'ValidPass123!'",
        "And I click the 'Register' button",
        "Then my account should be created successfully",
        "And I should be redirected to the login page or my account dashboard",
        "And I should receive an email confirming my registration."
    ]
    source: "Product Roadmap Q1 - User Features"
    // PGT Hint: This detailed description aids LLMs in understanding scope when drafting linked APIs or code specs.
}

requirement UserLogin {
    // Qualified Name: users.UserLogin
    title: "Existing User Login"
    description: `
        **Goal:** Allow registered users to access their PrimeCart accounts.
        **User Story:** As a registered PrimeCart user, I want to log in with my email and password, so that I can access my account, view past orders, and make new purchases.
        **Core Functionality:**
        1. Accept user credentials: email and password.
        2. Validate credentials against stored, secured user data.
        3. Establish a secure session upon successful authentication.
        4. Provide clear feedback on success or failure.
    `
    priority: "High"
    status: "Accepted"
    acceptance_criteria: [
        "Given I am a registered user with email 'user@example.com' and password 'Pass123!'",
        "And I am on the login page",
        "When I enter my email 'user@example.com' and password 'Pass123!'",
        "And I click the 'Login' button",
        "Then I should be successfully authenticated",
        "And I should be redirected to my account dashboard.",
        "And a new session token should be issued."
    ]
    source: "Product Roadmap Q1 - User Features"
}
```
*   **Tooling Tip:** Use autocompletion for attributes like `priority` and `status`. The (conceptual) DefinitiveSpec Tools LDE highlights Gherkin keywords in `acceptance_criteria`.
*   **DDM Note:** The **Prompt Generation Toolkit (PGT)** could assist a Specification Author in drafting these requirements and acceptance criteria.

---

## Chapter 2: Designing the User Service (Illustrating DDM Stage 2: Design & Detailed Specification)

Now, let's design the components, data models, and APIs for user management. This aligns with the DDM's Design and Detailed Specification stage.

### 2.1. User Service Design Component (`users.dspec`)

```definitive_spec
// users.dspec (continued)

design UserService { // This 'design' artifact represents a logical component or microservice.
    // Qualified Name: users.UserService
    title: "User Management Component"
    description: `
        This logical component is responsible for all aspects of user account management,
        including registration, authentication, profile management, and password recovery.
        It interacts with an abstract User Data Store (e.g., designs.UserDataStore, if defined in a designs.dspec)
        and utilizes shared security components (e.g., designs.PasswordHasher).
    `
    responsibilities: [
        "Handle new user registrations (see users.HandleUserRegistration).",
        "Authenticate existing users (see users.HandleUserLogin).",
        "Store and manage user profile data securely, adhering to NFR.PiiFieldEncryption.",
        "Manage user sessions and JWT generation."
    ]
    fulfills: [users.UserRegistration, users.UserLogin] // Referencing by qualified name
    // dependencies: [designs.UserDataStore, designs.PasswordHasher, designs.NotificationService] // Example dependencies
    // SVS Rule: `fulfills` and `dependencies` must link to existing, valid qualified artifact names.
}
```
*   **DDM Note:** Attributes like `fulfills` and `dependencies` are crucial for the DDM principle of **Structure and Interconnectivity**, managed by the ISE.

### 2.2. Data Models for User Operations (`users.dspec`)

We'll align our `model` constraints with JSON Schema concepts, ensuring **Precision and Unambiguity** (DDM Principle).

```definitive_spec
// users.dspec (continued)

model UserRegistrationPayload {
    // Qualified Name: users.UserRegistrationPayload
    description: "Data payload for new user registration. Constraints are enforced by API gateway/framework based on these definitions."
    email: String {
        description: "User's email address. Must be unique system-wide.";
        format: "email";
        required: true;
        maxLength: 254;
    }
    password: String {
        description: "User's desired password. Must meet strength requirements.";
        minLength: 12;
        // Example: At least 1 uppercase, 1 lowercase, 1 digit, 1 special character.
        pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).{12,}$";
        required: true;
        pii_category: "Credentials"; // Hint for NFR.PiiFieldEncryption policy (though hashing is primary for passwords)
    }
    password_confirm: String {
        description: "Confirmation of the password. Must match 'password' field.";
        required: true;
        // Business rule for matching 'password' is handled in `code` spec, not directly as a schema constraint here.
    }
    full_name?: String {
        maxLength: 100;
        pii_category: "ContactInfo"; // Hint for NFR.PiiFieldEncryption policy
    }
}

model UserLoginPayload {
    // Qualified Name: users.UserLoginPayload
    description: "Data payload for user login."
    email: String { format: "email"; required: true; }
    password: String { required: true; }
}

model UserProfileResponse {
    // Qualified Name: users.UserProfileResponse
    description: "Represents a user's profile data returned by the API or used in events."
    user_id: String { format: "uuid"; description: "Unique identifier for the user."; required: true; }
    email: String { format: "email"; required: true; pii_category: "ContactInfo"; }
    full_name?: String { pii_category: "ContactInfo"; }
    registration_date: DateTime { required: true; }
    last_login_date?: DateTime
    is_email_verified: Boolean { required: true; default: false; }
}

// Assume a shared_models.dspec or policies.dspec for truly global models like ErrorResponseMessage
model ErrorResponseMessage {
    // Qualified Name: users.ErrorResponseMessage (or better: shared_models.ErrorResponseMessage)
    description: "Standard error response structure for failed API operations."
    error_code: String { description: "A machine-readable error code (e.g., from policies.ErrorCatalog)."; required: true; }
    message: String { description: "A human-readable error message."; required: true; }
    details?: List<String> { description: "Optional additional details about the error."; }
    // PGT Hint: Ensure `error_code` aligns with defined error types in policies.ErrorCatalog.
}

// --- Standardized API Result Models ---
model UserRegistrationSuccessData {
    // Qualified Name: users.UserRegistrationSuccessData
    description: "Data returned upon successful user registration."
    user: users.UserProfileResponse { required: true; }
    // SVS Rule: All fields must conform to their model definitions.
}

model UserRegistrationResult {
    // Qualified Name: users.UserRegistrationResult
    description: "Outcome of a user registration attempt. Represents a discriminated union based on 'status'."
    status: enum {"success", "failure"} { required: true; description: "Discriminator for the result type." }
    success_data?: users.UserRegistrationSuccessData { description: "Present if status is 'success'."; }
    error_data?: users.ErrorResponseMessage { description: "Present if status is 'failure'."; }
    // SVS Rule: Based on 'status', exactly one of 'success_data' or 'error_data' MUST be present.
}

model AuthSuccessData {
    // Qualified Name: users.AuthSuccessData
    description: "Data returned upon successful authentication."
    session_token: String { description: "JWT session token."; required: true; }
    user: users.UserProfileResponse { required: true; }
}

model AuthResult {
    // Qualified Name: users.AuthResult
    description: "Outcome of a user login attempt. Represents a discriminated union based on 'status'."
    status: enum {"success", "failure"} { required: true; }
    success_data?: users.AuthSuccessData
    error_data?: users.ErrorResponseMessage
    // SVS Rule: Discriminated union consistency check.
}

// Internal Data Store Model (example, not directly exposed via API)
model UserEntity {
    // Qualified Name: users.UserEntity
    description: "Internal representation of a user in the data store."
    user_id: String { format: "uuid"; required: true; primary_key: true; } // Hint for ORM
    email: String { format: "email"; required: true; unique: true; pii_category: "ContactInfo"; }
    hashed_password: String { required: true; pii_category: "Credentials_Internal"; }
    full_name?: String { pii_category: "ContactInfo"; }
    registration_date: DateTime { required: true; }
    last_login_date?: DateTime
    is_email_verified: Boolean { required: true; default: false; }
    // Other internal fields: version, created_at, updated_at etc.
}
```
*   **Tooling Tip:** The LDE can provide autocompletion for JSON Schema-aligned constraint keywords. `required: true` clearly marks mandatory fields.
*   **DDM Note:** These `model` artifacts can be used by the **Specification Validation Suite (SVS)** for schema validation and by AI tools (guided by `directive`s) for generating TypeScript interfaces or validation code.

### 2.3. APIs for User Service (`users.dspec`)

```definitive_spec
// users.dspec (continued)

api RegisterUser { // Qualified Name: users.RegisterUser
    title: "Register New User"
    summary: "Creates a new user account."
    operationId: "registerUser"
    description: "Endpoint for new user registration. Adheres to global API policies for error handling and security."
    part_of: users.UserService // Links to the design component by qualified name
    path: "/users/register"
    version: "1.0.0"
    method: "POST"
    tags: ["UserManagement", "Authentication"]
    request_model: users.UserRegistrationPayload
    response_model: users.UserRegistrationResult // Standardized result model
    // Expected HTTP Statuses (Conceptual - LLM/Directive infers from response_model.status)
    // success_status_codes_map: { "success": 201 }
    // error_status_codes_map: { "failure": [400, 409, 500] } // Based on error_data.error_code
    // security_scheme: [policies.ApiSecurity.PublicAccess] // Link to a security scheme definition
    // SVS Rule: `request_model` and `response_model` must be valid, qualified model names.
}

api LoginUser { // Qualified Name: users.LoginUser
    title: "Login Existing User"
    summary: "Authenticates an existing user and returns a session token."
    operationId: "loginUser"
    part_of: users.UserService
    version: "1.0.0"
    path: "/users/login"
    method: "POST"
    tags: ["UserManagement", "Authentication"]
    request_model: users.UserLoginPayload
    response_model: users.AuthResult // Standardized result model
    // PGT Hint: LLM can use `request_model` and `response_model` to generate client/server stubs and API documentation.
}
```

---

## Chapter 3: Specifying Core Logic (Illustrating DDM Stage 2: Detailed Specification)

Let's define the `code` artifact for handling user registration. This detailed behavioral specification is key for the LLM Implementation Agent.

### 3.1. User Registration Code Specification (`users.dspec`)

```definitive_spec
// users.dspec (continued)

code HandleUserRegistration { // Qualified Name: users.HandleUserRegistration
    title: "Core Logic for User Registration Process"
    description: "Implements the business logic for registering a new user, including validation, data persistence, and event emission."
    implements_api: users.RegisterUser // Links to the API contract this code fulfills
    part_of_design: users.UserService // Links to the logical design component

    language: "TypeScript" // Target language for LLM Implementation Agent

    implementation_location: {
        filepath: "primecart-app/src/core/user_management/handlers/registration_handler.ts",
        // For TS, entry_point_name often matches exported function/class method.
        entry_point_type: "function", // e.g., "class_method", "module_export"
        entry_point_name: "handleUserRegistrationLogic" // Name of the function/method in the file
        // SVS Rule: `filepath` should be a valid path format relative to project root.
        // IDE Agent: Can use this to link directly to the code and detect drift.
    }

    signature: "async (payload: users.UserRegistrationPayload): Promise<users.UserRegistrationResult>"
    preconditions: [
        "Input `payload` has passed schema validation against users.UserRegistrationPayload (performed by API framework).",
        "payload.password matches payload.password_confirm (specific business rule validated by this logic unit)."
        // Dependencies like UserDataStore, PasswordHasher, EventPublisher are available/injected based on `dependencies` list and directives.
    ]
    postconditions: [
        "If successful, a new user record reflecting the payload is created in the User Data Store.",
        "If successful, users.UserRegistrationResult with status 'success' and correct users.UserRegistrationSuccessData is returned.",
        "If email already exists, users.UserRegistrationResult with status 'failure' and error_code 'PC_ERR_USER_EMAIL_IN_USE' is returned. No user is created.",
        "If password hashing fails, users.UserRegistrationResult with status 'failure' and error_code 'PC_ERR_INTERNAL_SERVER' is returned.",
        "If database persistence fails, users.UserRegistrationResult with status 'failure' and error_code 'PC_ERR_DATABASE' is returned.",
        "If successful, events.UserRegistered (assuming events.dspec for event definitions) is emitted with the new user's profile."
    ]
    // Optional hint if specific NFRs beyond global policies need emphasis for this unit.
    // applies_nfrs: [NFR.PiiHandlingForUserRegistration] // Abstract NFR identifier, e.g., policies.DataSecurityNFRs.PiiFieldEncryption

    detailed_behavior: `
        // LLM Implementation Agent Target: Translate this focused business logic into TypeScript.
        // Assume standard API error handling, logging, and initial payload validation are applied by directives/framework.
        // Human Review Focus: Correctness of this core registration sequence, data handling, and adherence to pre/postconditions.

        // 1. Specific Business Rule Validation (Password Confirmation)
        //    (Schema validation for password strength, email format etc. is assumed to be handled by the API framework
        //     based on users.UserRegistrationPayload constraints before this logic unit is invoked).
        IF payload.password NOT_EQUALS payload.password_confirm THEN
            RETURN_ERROR policies.ErrorCatalog.ValidationFailed WITH { // Assuming shared_policies.dspec is 'policies' module
                message: "Passwords do not match.",
                details: ["password_confirm field must match password field."]
            }
        END_IF

        // 2. Check Email Uniqueness
        DECLARE existingUser AS OPTIONAL users.UserEntity // UserEntity is the internal data store model, defined in users.dspec
        // 'DataStore.Users' is an abstract representation of the users' collection/table.
        // The directive for data operations will map this to specific ORM/DB client calls.
        RETRIEVE users.UserEntity FROM DataStore.Users WHERE { email: payload.email } ASSIGN_TO existingUser

        IF existingUser IS_PRESENT THEN
            // 'ErrorCatalog.EmailAlreadyInUse' should be a defined error in policies.ErrorCatalog.
            RETURN_ERROR policies.ErrorCatalog.EmailAlreadyInUse
        END_IF

        // 3. Prepare User Entity for Persistence
        DECLARE hashedPassword AS String
        // 'Security.PasswordHasher.Hash' is an abstract call.
        // The directive for 'Security.PasswordHasher.Hash' specifies the hashing library and parameters (see directives.PrimeCart_TypeScript_ImplementationDirectives).
        CALL Security.PasswordHasher.Hash WITH { password: payload.password } RETURNING hashedPassword
            ON_FAILURE RETURN_ERROR policies.ErrorCatalog.InternalServerError WITH { message: "Password hashing failed due to an internal error." }

        DECLARE newUserEntity AS users.UserEntity
        // The LLM/Directive will apply PII encryption to 'email' and 'full_name' fields if
        // 'users.UserEntity' fields are marked as PII and an NFR.PiiFieldEncryption policy (e.g. policies.DataSecurityNFRs.PiiFieldEncryption) is active.
        CREATE_INSTANCE users.UserEntity WITH {
            email: payload.email,
            hashed_password: hashedPassword,
            full_name: payload.full_name,
            registration_date: System.CurrentUTCDateTime, // Abstract system utility
            is_email_verified: false
            // user_id will be generated by DataStore upon persistence
        } ASSIGN_TO newUserEntity

        // 4. Persist User
        PERSIST newUserEntity TO DataStore.Users
            ON_FAILURE RETURN_ERROR policies.ErrorCatalog.DatabaseError WITH { message: "Failed to save new user to the database." }
            // This also populates newUserEntity.user_id (or equivalent) from the database.

        // 5. Post-Registration Actions: Emit Event
        DECLARE userProfileForEvent AS users.UserProfileResponse
        // Map persistent entity to response/event model.
        // LLM/Directive handles this mapping, e.g. by property names or explicit mapping rules if defined.
        CREATE_INSTANCE users.UserProfileResponse FROM newUserEntity ASSIGN_TO userProfileForEvent
            // Example mapping if fields differ significantly:
            // WITH_MAPPING { user_id: newUserEntity.user_id, email: newUserEntity.email, registration_date: newUserEntity.registration_date, full_name: newUserEntity.full_name, is_email_verified: newUserEntity.is_email_verified }

        // 'events.UserRegistered' is a defined `event` spec (assuming events.dspec).
        // The directive for 'EMIT_EVENT' specifies event bus/messaging system usage.
        EMIT_EVENT events.UserRegistered WITH { payload: userProfileForEvent } // Assuming events.dspec and event UserRegistered

        // 6. Construct and Return Success Response
        DECLARE successDataPayload AS users.UserRegistrationSuccessData
        CREATE_INSTANCE users.UserRegistrationSuccessData WITH { user: userProfileForEvent } ASSIGN_TO successDataPayload
        RETURN_SUCCESS successDataPayload // This implicitly creates users.UserRegistrationResult with status 'success'
    `
    // escape_hatch: "src/custom_parts/user_registration_override.ts#complexLegacyLogic"
    // Use if a specific part of the behavior is too complex for DSpec pseudocode and exists in well-tested legacy code.

    throws_errors: [ // References to error types defined in policies.ErrorCatalog.
        policies.ErrorCatalog.ValidationFailed,
        policies.ErrorCatalog.EmailAlreadyInUse,
        policies.ErrorCatalog.InternalServerError,
        policies.ErrorCatalog.DatabaseError
    ]
    dependencies: [ // Abstract dependencies; directives map these to concrete libraries/services.
        "Abstract.UserDataStore",       // For RETRIEVE, PERSIST
        "Abstract.PasswordHasher",      // For CALL Security.PasswordHasher.Hash
        "Abstract.EventPublisher",      // For EMIT_EVENT
        "Abstract.SystemDateTimeProvider" // For System.CurrentUTCDateTime
    ]
    // SVS Rule: `implements_api` must link to an existing API. `signature` return type must match API's `response_model`.
    // SVS Rule: All qualified names (e.g. users.ModelName, policies.ErrorName, events.EventName) must be valid, defined artifact identifiers.
}
```
*   **DDM Note:** The `detailed_behavior` exemplifies **Precision and Unambiguity** for the LLM. The PGT can help draft this from higher-level specs. Human review focuses on the logical flow and adherence to contracts.

---
## Chapter 3A: Specifying Inter-Component Interactions (Illustrating DDM Stage 2)

The PrimeCart system involves collaborations between different logical components. The `interaction` specification helps model these sequenced exchanges.

### 3A.1. PrimeCart Tool Call Processing Interaction (`interactions.dspec`)

This example, while not directly part of core e-commerce, illustrates how DSpec can model complex internal workflows, such as if PrimeCart used an internal LLM agent for advanced tasks (e.g., dynamic query generation, spec analysis).

```definitive_spec
// interactions.dspec
// Defines protocols for collaborations between multiple PrimeCart components.
// Human Review Focus: Correctness of sequence, component responsibilities, and message content.
// PGT Hint: Use this to generate skeletons for implementing components' roles in the interaction.

interaction PrimeCart_ProcessLlmToolCall {
    // Qualified Name: interactions.PrimeCart_ProcessLlmToolCall
    title: "Sequence for PrimeCart Processing an LLM Tool Call Request"
    description: `
        Details the message exchange when a core logic component (e.g., LlmGenerationLogic)
        processes a tool call request from an LLM, sends it to an orchestration component,
        awaits execution and result, and then prepares to continue interaction with the LLM.
    `
    components: [ // These are logical components, ideally linking to qualified `design` artifact names
        designs.LlmGenerationLogic,       // e.g., from a designs.dspec file or similar
        designs.TaskOrchestrationLogic,
        designs.ProductAnalysisToolExecutor, // Example specific tool executor component
        designs.LlmExternalInterface        // Abstract component representing the LLM client
    ]

    message_types: [ // These MUST link to qualified `model` names
        models.LlmToolCallRequestFromAgent, // Payload from LLM with tool name and args (e.g. from a shared models.dspec)
        models.InternalExecuteToolCommand,    // Standardized command for orchestration
        models.InternalToolExecutionResult,   // Standardized result from executor to orchestrator
        models.FinalToolCallResultToAgent     // Standardized result from orchestrator back to generation logic
    ]

    initial_component: designs.LlmGenerationLogic
    // SVS Rule: All `components` and `message_types` must reference valid, qualified artifact names.

    steps: [
        {
            step_id: "S1_LLM_REQUESTS_TOOL"
            component: designs.LlmGenerationLogic
            description: "designs.LlmExternalInterface has provided a models.LlmToolCallRequestFromAgent to designs.LlmGenerationLogic."
            // Presumed input from LlmExternalInterface: tool_request: models.LlmToolCallRequestFromAgent
        },
        {
            step_id: "S2_PREPARE_INTERNAL_COMMAND"
            component: designs.LlmGenerationLogic
            action: "Construct `models.InternalExecuteToolCommand` based on S1.tool_request.tool_name and S1.tool_request.tool_arguments."
            // Output (internal state for next step): internal_command: models.InternalExecuteToolCommand
        },
        {
            step_id: "S3_DISPATCH_TO_ORCHESTRATION"
            component: designs.LlmGenerationLogic
            sends_message: {
                to: designs.TaskOrchestrationLogic
                message_name: "ExecuteTool" // Logical message/method name for orchestration service
                payload_model: models.InternalExecuteToolCommand // Explicit model link
                delivery: "sync_request_reply" // Expects a response in this interaction flow
                // SVS Rule: `to` component must be in `components` list. `payload_model` must be in `message_types`.
            }
            // implemented_by_code: code_units.LlmGenerationLogic.DispatchToolCommand (optional link to specific code spec, e.g. from a code.dspec) // Note: If DispatchToolCommand is a code spec associated with designs.LlmGenerationLogic, its qualified name might be designs.LlmGenerationLogic.DispatchToolCommand
        },
        {
            step_id: "S4_ORCHESTRATION_RECEIVES_AND_DELEGATES"
            component: designs.TaskOrchestrationLogic
            description: "Receives ExecuteTool message. Identifies target tool executor based on S3.payload_model.tool_name."
            action: "Deserialize S3.payload_model.tool_arguments. Route to the appropriate SpecificToolExecutor (e.g., designs.ProductAnalysisToolExecutor)."
            // This step might involve a lookup or factory pattern.
            sends_message: { // This is a conceptual send to a dynamically determined executor
                to_dynamic_target_from_context: "resolved_tool_executor_component_id" // Placeholder for dynamic routing logic
                message_name: "ExecuteSpecificToolAction" // Generic message for any tool executor
                payload_model: models.InternalExecuteToolCommand // Or a subset specific to the tool
            }
        },
        {
            step_id: "S5_EXECUTOR_PERFORMS_ACTION"
            component: designs.ProductAnalysisToolExecutor // Example, actual component is dynamic from S4
            description: "Executes the specific tool logic (e.g., analyze product data based on provided arguments)."
            action: "Perform tool logic. This is detailed in the `code` spec for this executor (e.g., code_units.ProductAnalysisToolExecutor.Execute)."
            // Presumed output (internal state): raw_tool_output_or_error
        },
        {
            step_id: "S6_EXECUTOR_RETURNS_RESULT_TO_ORCHESTRATION"
            component: designs.ProductAnalysisToolExecutor // Example
            sends_message: {
                to: designs.TaskOrchestrationLogic
                message_name: "SpecificToolActionCompleted"
                payload_model: models.InternalToolExecutionResult // Contains raw output or error info from the tool
            }
        },
        {
            step_id: "S7_ORCHESTRATION_PACKAGES_FINAL_RESULT"
            component: designs.TaskOrchestrationLogic
            description: "Receives S6.SpecificToolActionCompleted. Packages it into models.FinalToolCallResultToAgent."
            action: "Construct models.FinalToolCallResultToAgent (with status 'success'/'failure', result data/error message) based on S6.payload_model."
            // Output (internal state): final_result_package: models.FinalToolCallResultToAgent
        },
        {
            step_id: "S8_ORCHESTRATION_RETURNS_PACKAGED_RESULT_TO_GENERATION"
            component: designs.TaskOrchestrationLogic
            // This is the reply to the S3 message.
            sends_reply_for_message_from_step: "S3_DISPATCH_TO_ORCHESTRATION"
            with_payload_model: models.FinalToolCallResultToAgent // Refers to S7.final_result_package
        },
        {
            step_id: "S9_GENERATION_LOGIC_PROCESSES_TOOL_RESULT"
            component: designs.LlmGenerationLogic
            // Receives reply from S8.
            guard: "S8.with_payload_model.status == 'success'" // Assuming FinalToolCallResultToAgent has a status
            description: "Processes successful tool result. Prepares result for the LLM agent."
            action: "Format S8.with_payload_model.data as a new ChatMessage (role: tool) for designs.LlmExternalInterface."
            next_step: "S10_CONTINUE_LLM_INTERACTION_WITH_TOOL_OUTPUT"
        },
        {
            step_id: "S9_ERR_GENERATION_LOGIC_HANDLES_TOOL_FAILURE"
            component: designs.LlmGenerationLogic
            guard: "S8.with_payload_model.status == 'failure'"
            description: "Handles tool execution failure reported by orchestration."
            action: "Log error. Format S8.with_payload_model.error_message as a ChatMessage (role: tool, indicating error) for designs.LlmExternalInterface."
            next_step: "S10_CONTINUE_LLM_INTERACTION_WITH_TOOL_OUTPUT" // Still continue, but LLM knows tool failed
        },
        {
            step_id: "S10_CONTINUE_LLM_INTERACTION_WITH_TOOL_OUTPUT"
            component: designs.LlmGenerationLogic
            description: "Calls designs.LlmExternalInterface with updated conversation history including the tool's output or error message."
            is_endpoint: true // For this specific interaction diagram.
        }
    ]
    // SVS Rule: All `next_step` IDs must be valid `step_id`s. Graph should be complete (all paths end in `is_endpoint: true`).
    // SVS Rule: `sends_reply_for_message_from_step` must refer to a valid preceding step that used `sync_request_reply`.
}
```

---

## Chapter 4: Behavioral Specifications - Order Checkout FSM (Illustrating DDM Stage 2)

### 4.1. Checkout Process FSM (`checkout.dspec`)

```definitive_spec
// checkout.dspec

behavior CheckoutProcess { // Qualified Name: checkout.CheckoutProcess
    title: "Manages the state transitions of the order checkout process."

    fsm MainCheckoutFSM {
        // Qualified Name: checkout.CheckoutProcess.MainFSM
        description: `
            Models the customer's journey through the PrimeCart checkout process,
            from adding items to the cart to successful order placement or abandonment.
            This FSM helps ensure all steps are handled correctly and edge cases considered.
            Human Review Focus: Logical state flow, completeness of states and transitions.
            LLM Hint: Can be used to generate state handling logic or validate interaction sequences.
        `
        initial: CartNotEmpty // Assumes cart is populated before checkout 'officially' starts

        states: [
            CartNotEmpty { description: "User has items in cart and initiates checkout." },
            ShippingAddressProvided { description: "User has provided or confirmed shipping address." },
            PaymentMethodSelected { description: "User has selected a payment method." },
            PaymentProcessing { description: "Payment is being processed with the gateway." },
            OrderConfirmed { description: "Payment successful, order placed." },
            PaymentFailed { description: "Payment attempt failed." },
            CheckoutAbandoned { description: "User abandoned the checkout process." }
        ]

        transitions: [
            { from: CartNotEmpty, event: "ProceedToShipping", to: ShippingAddressProvided,
              // realized_by_interaction: interactions.InitiateShippingStep (optional link to an interaction spec)
            },
            { from: CartNotEmpty, event: "UserAbandons", to: CheckoutAbandoned },

            { from: ShippingAddressProvided, event: "ProceedToPaymentSelection", to: PaymentMethodSelected },
            { from: ShippingAddressProvided, event: "UserAbandons", to: CheckoutAbandoned },
            { from: ShippingAddressProvided, event: "ChangeShippingAddress", to: ShippingAddressProvided },

            { from: PaymentMethodSelected, event: "ConfirmAndPay", to: PaymentProcessing, guard: "PaymentMethodIsValid",
              // realized_by_interaction: interactions.ProcessPayment // Links to an interaction spec that handles payment
              action: "TriggerPaymentProcessing" // Abstract action name, implemented by linked interaction/code
            },
            { from: PaymentMethodSelected, event: "PaymentMethodInvalid", to: PaymentMethodSelected, action: "DisplayPaymentError" },
            { from: PaymentMethodSelected, event: "UserAbandons", to: CheckoutAbandoned },
            { from: PaymentMethodSelected, event: "ChangePaymentMethod", to: PaymentMethodSelected },

            { from: PaymentProcessing, event: "PaymentGatewaySuccess", to: OrderConfirmed,
              action: ["CreateOrderRecord", "SendOrderConfirmationEmailViaEvent", "DecrementStock"], // More specific action names
              // on_entry_triggers_interaction: interactions.NotifyOrderConfirmed (example for SendOrderConfirmationEmailViaEvent)
            },
            { from: PaymentProcessing, event: "PaymentGatewayFailure", to: PaymentFailed, action: "LogPaymentFailureDetails" },
            { from: PaymentProcessing, event: "PaymentTimeout", to: PaymentFailed, action: "NotifyUserOfTimeout" },

            { from: PaymentFailed, event: "RetryPayment", to: PaymentMethodSelected, guard: "RetryAttemptsRemaining > 0" },
            { from: PaymentFailed, event: "UserAbandons", to: CheckoutAbandoned }
        ]
    }
}
```
*   **Tooling Tip:** The DefinitiveSpec Tools would help validate that `initial`, `from`, and `to` states exist and might offer visualization.
*   **DDM Note:** This FSM supports **Executability and Verifiability**, as it can be used for model-based testing or even to generate state handling code.

---

## Chapter 5: Formal Model for Inventory Consistency (TLA+) (Illustrating DDM Stage 2 & High-Assurance)

PrimeCart needs strong guarantees about inventory consistency during concurrent purchases. We'll outline a `formal_model` for this, assuming an external TLA+ specification. This is particularly relevant for systems with **High-Assurance Requirements** (DDM Applicability).

### 5.1. Inventory Consistency Formal Model (`products.dspec`)

```definitive_spec
// products.dspec

behavior InventoryManagement { // Qualified Name: products.InventoryManagement
    title: "Behaviors related to product inventory."

    formal_model InventoryAtomicityAndConsistency {
        // Qualified Name: products.InventoryManagement.InventoryAtomicityAndConsistency
        language: "TLA+"
        path: "formal_models/inventory_consistency.tla" // Path to the .tla file
        description: `
            A TLA+ specification modeling the concurrent operations of checking stock,
            reserving stock during checkout, and decrementing stock upon order confirmation.
            The model aims to prove that stock levels are never negative and that reservations
            are handled atomically to prevent overselling.
        `
        verifies_code: [ // Links to qualified code spec names
            code_units.ProductService.CheckStockLogic,  // Assuming these code specs exist
            code_units.ProductService.ReserveStockLogic,
            code_units.ProductService.CommitStockReductionLogic
        ]
        verification_tool: "TLC Model Checker v2.17"
        verification_properties: [
            "SafetyInvariant_StockNonNegative: Stock[product] >= 0 for all products.",
            "SafetyInvariant_ReservationAtomicity: Reservations do not interleave incorrectly leading to oversell.",
            "Liveness_OrderEventuallyProcessedOrReservationReleased: If stock is available and payment succeeds, an order is eventually confirmed or its stock reservation is released."
        ]
        verification_status: "Verified (as of 2023-11-15, for model parameters up to 3 concurrent users, 5 products)"
        spec_content: \`\`\`tla_summary
            // This is a summary, actual TLA+ is in inventory_consistency.tla
            ----------------------------- MODULE Inventory -----------------------------
            EXTENDS Naturals, FiniteSets, TLC, Sequences

            VARIABLES stock,      \* Current stock level for each product: productID |-> Nat
                      reservations \* Active reservations: productID |-> Seq of reservationIDs

            (* --- Invariants --- *)
            StockNonNegative == \A p \in DOMAIN stock: stock[p] >= 0

            (* --- Actions --- *)
            CheckStock(prod, qty) == /\ stock[prod] >= qty
                                   /\UNCHANGED <<stock, reservations>>

            ReserveStock(prod, qty, resID) ==
                /\ stock[prod] >= qty
                /\ stock' = [stock EXCEPT ![prod] = stock[prod] - qty]
                /\ reservations' = [reservations EXCEPT ![prod] = Append(reservations[prod], resID)]

            (* ... Other actions like CommitReservation, CancelReservation ... *)
            =============================================================================
        \`\`\`
    }
}
```
*   **Workflow with TLA+ (DDM Stages 2-4):**
    1.  (Stage 2) Specification Author drafts this `formal_model` artifact.
    2.  (Stage 2/3) Formal methods expert writes/updates `inventory_consistency.tla`.
    3.  (Stage 4) Expert runs TLC model checker externally as part of verification.
    4.  (Stage 3/5) Expert updates `verification_status` and `verification_properties` in this `.dspec` file based on results. Feedback loops may refine the TLA+ model or related `code` specs.
    5.  The `spec_content` here serves as a quick reference/summary within DefinitiveSpec, managed by the ISE.

---

## Chapter 6: Operational Policies (`shared_policies.dspec`) (Illustrating DDM Stage 2)

We'll define some shared operational policies, which act as cross-cutting specifications.

```definitive_spec
// shared_policies.dspec (Or simply policies.dspec)
// Tooling Note: Artifacts here referenced as e.g. policies.GlobalAPIPolicies.ErrorCatalog
```

### 6.1. Standard Error Handling and Catalog

```definitive_spec
// policies.dspec (continued)

policy GlobalAPIPolicies { // Qualified Name: policies.GlobalAPIPolicies
    title: "Global policies applicable to all PrimeCart APIs."

    error_catalog PrimeCartErrorCatalog { // Qualified Name: policies.GlobalAPIPolicies.ErrorCatalog
        description: "Central catalog of standard error types, their typical HTTP mappings, and log levels for PrimeCart APIs. Used by `RETURN_ERROR` in `code` specs."

        define ValidationFailed {
            // Qualified Name: policies.GlobalAPIPolicies.ErrorCatalog.ValidationFailed
            error_code: "PC_ERR_VALIDATION" // Standardized error code
            http_status: 400
            log_level: "Info"
            default_message_template: "Input validation failed. See 'details' for specific errors."
        }
        define EmailAlreadyInUse {
            error_code: "PC_ERR_USER_EMAIL_IN_USE"
            http_status: 409 // Conflict
            log_level: "Warn"
            default_message_template: "The email address provided is already associated with an existing account."
        }
        define NotFound {
            error_code: "PC_ERR_NOT_FOUND"
            http_status: 404
            log_level: "Warn"
            default_message_template: "The resource you requested ('{resource_type}' with ID '{resource_id}') could not be found."
        }
        define UnauthorizedAccess {
            error_code: "PC_ERR_UNAUTHORIZED"
            http_status: 401
            log_level: "Warn"
            default_message_template: "You are not authenticated to access this resource."
        }
        define ForbiddenAccess {
            error_code: "PC_ERR_FORBIDDEN"
            http_status: 403
            log_level: "Warn"
            default_message_template: "You do not have permission to perform this action on this resource."
        }
        define InternalServerError {
            error_code: "PC_ERR_INTERNAL_SERVER"
            http_status: 500
            log_level: "Error"
            default_message_template: "An unexpected internal error occurred. Please try again later. Trace ID: {trace_id}."
            is_retryable: false
        }
        define DatabaseError {
            error_code: "PC_ERR_DATABASE"
            http_status: 500 // Or 503 if appropriate
            log_level: "Error"
            default_message_template: "A database operation failed. Please try again later. Trace ID: {trace_id}."
        }
        // SVS Rule: All `error_code`s must be unique. `http_status` should be valid.
    }
}
```

### 6.2. Application Logging Policy

```definitive_spec
// policies.dspec (continued)

policy ApplicationMonitoringPolicies { // Qualified Name: policies.ApplicationMonitoringPolicies
    title: "Policies for application logging and monitoring."

    logging PrimeCartLogging { // Qualified Name: policies.ApplicationMonitoringPolicies.PrimeCartLogging
        default_level: "Info" // For production, might be "Warn"
        format: "JSON" // LLM/Directive uses this to structure log output.
        pii_fields_to_mask: [ // LLM/Directive uses this for automatic PII redaction in logs
            "user.email", "user.password", "payment.card_number",
            "address.street_line1", "customer.phone_number"
            // These are conceptual paths; actual masking might rely on pii_category on model fields.
        ]

        // Defines structured log events. LLM can be instructed by directives to emit these.
        event UserRegistered {
            // Qualified Name: policies.ApplicationMonitoringPolicies.PrimeCartLogging.UserRegistered
            level: "Info"
            message_template: "New user registered: ID '{userId}', Email (Masked): '{userEmailMasked}'."
            fields: ["userId", "userEmailMasked"] // Fields expected in the structured log
        }
        event OrderPlaced {
            level: "Info"
            message_template: "Order '{orderId}' placed successfully by user '{userId}' for total '{orderTotal}'."
            fields: ["orderId", "userId", "orderTotal", "itemCount"]
        }
        event CriticalPaymentGatewayError {
            level: "Error"
            message_template: "Critical error communicating with payment gateway. Gateway: '{gatewayName}', Error: '{gatewayError}', Trace: '{paymentTraceId}'."
            fields: ["gatewayName", "gatewayError", "paymentTraceId", "orderAttemptId"]
            alert_on_occurrence: true // Custom attribute for alerting integration
        }
    }
}
```

### 6.3. Basic Security Policy (Example)

```definitive_spec
// policies.dspec (continued)

policy CoreSecurityPolicies { // Qualified Name: policies.CoreSecurityPolicies
    title: "Core security policies for PrimeCart."

    security WebApplicationSecurity { // Qualified Name: policies.CoreSecurityPolicies.WebApplicationSecurity
        authentication_scheme MainSessionAuth {
            // Qualified Name: policies.CoreSecurityPolicies.WebApplicationSecurity.MainSessionAuth
            type: "JWT-Cookie"
            details: `
                Session managed via secure, HttpOnly, SameSite=Strict cookies containing a JWT.
                JWT signed with ES256, issuer 'primecart.com', audience 'primecart.com/api'.
                Token lifetime: 1 hour, refreshable up to 24 hours.
            `
            // LLM/Directive for API generation uses this to set up auth middleware for APIs referencing this scheme.
        }

        authorization_rule CustomerOrderAccess {
            actor_role: "Customer"
            resource_pattern: "/orders/{orderId}" // Applies to APIs matching this path
            permissions: ["READ"]
            conditions: "jwt.sub == order.customerId" // Pseudocode for condition evaluated by auth middleware
            description: "Customers can only view their own orders."
        }

        data_protection_measure PasswordStorage {
            data_category: "UserCredentials"
            protection_method: "Hashing via NFR.SecurePasswordHashing policy." // Links to NFR
        }

        input_validation_standard GeneralInputValidation {
            description: "All user-supplied input must be validated against defined schemas (`model` specs) by the API framework before processing by core logic."
            applies_to_apis: ["*"] // Wildcard or list of qualified API names
        }
    }
}
```

### 6.4. NFR Policies (Conceptual)

```definitive_spec
// policies.dspec (continued)

policy PrimeCartDataSecurityNFRs { // Qualified Name: policies.PrimeCartDataSecurityNFRs
    title: "Data Security Non-Functional Requirements Policies"
    description: "Defines policies for handling sensitive data within PrimeCart. LLM Implementation Agent consults these when processing relevant models/code, guided by directives."

    nfr PiiFieldEncryption { // Qualified Name: policies.PrimeCartDataSecurityNFRs.PiiFieldEncryption (or just NFR.PiiFieldEncryption if NFRs have global unique names)
        statement: "All data fields identified as PII (e.g., via `pii_category` attribute on model fields) must be encrypted at rest using AES-256 GCM and in transit using TLS 1.3+."
        // Scope: Applies to any model field with a `pii_category` attribute (e.g., users.UserRegistrationPayload.email).
        // Implementation: LLM applies encryption/decryption logic (defined in a `directive` like directives.PrimeCart_TypeScript_ImplementationDirectives.nfr_implementation_patterns.PII_FIELD_ENCRYPTION)
        // during `CREATE_INSTANCE`, `PERSIST`, and `RETRIEVE` operations involving such fields.
        verification_method: "Code review of PII handling logic generated; Data-at-rest validation; Penetration testing."
    }

    nfr SecurePasswordHashing { // Qualified Name: policies.PrimeCartDataSecurityNFRs.SecurePasswordHashing (or NFR.SecurePasswordHashing)
        statement: "User passwords must be hashed using a strong, adaptive hashing algorithm (e.g., bcrypt with cost factor >= 12, or Argon2id)."
        // Implementation: `CALL Security.PasswordHasher.Hash` in `code` specs defers to a directive
        // that specifies the exact library and parameters (see directives.PrimeCart_TypeScript_ImplementationDirectives.abstract_call_implementations).
        verification_method: "Review of PasswordHasher's directive and configuration; Sample hash verification."
    }
}

policy PrimeCartPerformanceNFRs { // Qualified Name: policies.PrimeCartPerformanceNFRs
    title: "Performance Non-Functional Requirements Policies"

    nfr ProductReadPathCaching { // Qualified Name: policies.PrimeCartPerformanceNFRs.ProductReadPathCaching (or NFR.ProductReadPathCaching)
        statement: "Frequently read product data must be cached to reduce database load and improve API response times."
        // Scope: Applies to `code` specs implementing APIs tagged with 'ProductReadHighVolume' (example tag).
        // Implementation: LLM, guided by a 'CachingDirective' (e.g., directives.PrimeCart_TypeScript_ImplementationDirectives.nfr_implementation_patterns.READ_THROUGH_CACHE_WRAPPER),
        // wraps relevant code logic.
        target_operations_tagged: ["ProductReadHighVolume"] // `code` specs can have `tags`
        metrics: {
            p95_latency_target_ms: 150,
            cache_hit_ratio_target: 0.85
        }
        default_cache_ttl_seconds: 60
    }
}
```

---

## Chapter 7: Infrastructure & Deployment Specs (`infra.dspec`)

### 7.1. Application Configuration Schema

```definitive_spec
// infra.dspec

infra PrimeCartSetup { // Qualified Name: infra.PrimeCartSetup
    title: "Configuration and deployment specifications for PrimeCart."

    configuration MainAppConfig { // Qualified Name: infra.PrimeCartSetup.MainAppConfig
        description: "Core configuration schema for the PrimeCart application services. LLM uses this to understand available config keys when processing `GET_CONFIG` in `detailed_behavior`."

        NODE_ENV: String {
            default: "development";
            constraints: "enum:['development', 'test', 'production']";
            description: "Node environment mode.";
        }
        PORT: Integer { default: 3000; description: "Application listening port."; }

        DATABASE_URL: String {
            required: true;
            description: "Primary PostgreSQL database connection URL.";
            sensitive: true; // Indicates this should be handled as a secret by deployment tools and config access patterns.
        }
        REDIS_URL: String { required: true; description: "Redis connection URL for caching and sessions."; sensitive: true; }

        JWT_SECRET_KEY: String { required: true; description: "Secret key for signing JWTs."; sensitive: true; }
        JWT_EXPIRATION_MINUTES: Integer { default: 60; }

        LOG_LEVEL: String { default: "INFO"; constraints: "enum:['DEBUG', 'INFO', 'WARN', 'ERROR']"; } // Links to policies.ApplicationMonitoringPolicies.PrimeCartLogging

        PAYMENT_GATEWAY_API_KEY: String { required: true; description: "API Key for Stripe/PayPal."; sensitive: true; }
        PAYMENT_GATEWAY_ENDPOINT: String { required: true; format: "uri"; }

        EMAIL_SERVICE_PROVIDER: String { default: "SES"; constraints:"enum:['SES', 'SendGrid']"; }
        EMAIL_API_KEY: String { required: true; sensitive: true; }
        EMAIL_FROM_ADDRESS: String { required: true; format: "email"; }

        // Example config for NFR.SecurePasswordHashing bcrypt cost factor
        SecurityConfig.BcryptCostFactor: Integer { default: 12; description: "Cost factor for bcrypt password hashing."}
    }
}
```

### 7.2. Production Deployment Plan (Conceptual)

```definitive_spec
// infra.dspec (continued)

infra PrimeCartSetup {

    deployment ProductionK8sDeployment { // Qualified Name: infra.PrimeCartSetup.ProductionK8sDeployment
        environment_name: "Production"
        target_platform: "AWS EKS (Kubernetes)"
        description: "Deployment plan for PrimeCart services on Production Kubernetes cluster."

        service UserServiceDeployment {
            image_repository: "primecart/user-service"
            image_tag_source: "git_commit_sha"
            replicas_min: 3
            auto_scale_cpu_target: 70 // Percentage
            replicas_max: 10
            cpu_request: "500m"
            memory_request: "1Gi"
            configuration_used: [infra.PrimeCartSetup.MainAppConfig] // Links to the configuration schema
            // env_variables_from_secrets: Would be derived by deployment tools from MainAppConfig.sensitive fields.
            health_check: { path: "/healthz"; port: 3000; initial_delay_seconds: 30; period_seconds: 10; }
        }

        service ProductServiceDeployment { /* ... similar details ... */ }
        service OrderServiceDeployment { /* ... similar details ... */ }

        global_dependencies: ["RDS_PostgreSQL_Instance", "Elasticache_Redis_Cluster", "AWS_SES_Configuration"]
        ingress_controller: "AWS ALB Ingress Controller"
        dns_records: ["primecart.com -> ALB_Endpoint", "api.primecart.com -> ALB_Endpoint"]

        monitoring_setup: `
            - Prometheus for metrics collection.
            - Grafana for dashboards (linked to Prometheus).
            - CloudWatch Logs for application log aggregation (see policies.ApplicationMonitoringPolicies.PrimeCartLogging).
            - PagerDuty integration for critical alerts from policies.ApplicationMonitoringPolicies.PrimeCartLogging event definitions.
        `
        backup_strategy: "Daily RDS snapshots, retained for 30 days. Point-in-time recovery enabled."
        rollback_procedure: `
            1. Identify problematic deployment version via \`kubectl get deployments\`.
            2. Execute \`kubectl rollout undo deployment/<service-name>\` to revert to previous revision.
            3. Monitor service health, logs, and key business metrics via Grafana and CloudWatch.
            4. If rollback fails or issues persist, escalate to L2 support and initiate incident response plan (IRP-001).
        `
    }
}
```

---

## Chapter 8: Tool Directives (`directives.dspec`) (Illustrating DDM Stage 2/4)

These `directive` artifacts guide automated tools, such as AI code generators or documentation builders, bridging specification to implementation (DDM Principle: AI as an Automated Generator).

```definitive_spec
// directives.dspec
// Human Review Focus: Correctness of these directives is CRUCIAL for generating good code.
// These are the "implementation strategy" for the LLM Implementation Agent.

directive PrimeCart_TypeScript_ImplementationDirectives {
    // Qualified Name: directives.PrimeCart_TypeScript_ImplementationDirectives
    // This target_tool ID implies a sophisticated LLM agent + associated logic/templates.
    target_tool: "PrimeCart_TS_Express_TypeORM_Generator_v1.2"
    description: "Directives guiding the LLM Implementation Agent for the PrimeCart TypeScript, Express, and TypeORM stack."
    default_language: "TypeScript"

    // --- API and Model Generation ---
    api_generation: {
        server_stub_output_path: "./generated/server/ts/controllers", // Relative to project root
        generate_interfaces_for_models: true, // From 'model' artifacts
        date_time_format_preference: "ISO8601_UTC", // For serializing/deserializing date/time types
        // Instructs LLM on standard Express handler structure & boilerplate
        default_api_handler_structure: {
            framework: "Express",
            base_controller_class?: "BasePrimeCartController", // Optional base class
            // LLM automatically applies these based on linked policies and models:
            request_validation_middleware: "auto_from_request_model_constraints", // e.g., using Joi or class-validator
            response_serialization: "auto_to_response_model_structure_handling_ApiResult", // Handles users.UserRegistrationResult status mapping to HTTP codes
            error_handling_middleware: "global_error_handler_linked_to_policies.GlobalAPIPolicies.PrimeCartErrorCatalog",
            logging_middleware: "entry_exit_trace_for_all_routes_linked_to_policies.ApplicationMonitoringPolicies.PrimeCartLogging",
            authentication_middleware_lookup: "based_on_api_security_scheme_attribute" // e.g., from policies.CoreSecurityPolicies
        }
    }

    // --- Core Logic & Data Operation Patterns (for `detailed_behavior` keywords) ---
    data_operation_patterns: {
        // For 'PERSIST entity TO DataStore.LogicalName'
        PERSIST: {
            // LLM uses LogicalName (e.g., DataStore.Users) to find corresponding TypeORM repository.
            // Assumes repository (e.g., UserRepository, derived from model name UserEntity linked to DataStore.Users)
            // is injected or accessible via a data context.
            template: "await this.{{LogicalName | toRepositoryName}}.save({{entityVariable}});",
            transaction_management: "implicit_per_handler_if_not_specified_on_code_spec" // Default behavior
        },
        // For 'RETRIEVE ModelName FROM DataStore.LogicalName WHERE {criteria}'
        RETRIEVE_SINGLE: {
            template: "await this.{{LogicalName | toRepositoryName}}.findOneBy({{criteriaObject}});",
        },
        RETRIEVE_MULTIPLE: {
            template: "await this.{{LogicalName | toRepositoryName}}.findBy({{criteriaObject}});",
        }
        // SVS Rule: Templates should be valid for the target_tool's capabilities.
    }

    abstract_call_implementations: {
        // For 'CALL Security.PasswordHasher.Hash WITH {password}'
        "Security.PasswordHasher.Hash": { // Matches abstract call target in detailed_behavior
            library_import: "import { hashPassword } from 'common-utils/auth/password-utils';",
            call_template: "await hashPassword({{password}});", // Assuming async
            // Parameters for the actual hashing library (e.g. bcrypt cost factor)
            // are sourced from the referenced infra.SecurityConfig.BcryptCostFactor.
            config_ref_for_params: "infra.PrimeCartSetup.MainAppConfig.SecurityConfig.BcryptCostFactor"
        },
        // For 'EMIT_EVENT events.EventName WITH {payload}'
        "EMIT_EVENT": {
            library_import: "import { eventEmitter } from 'app-services/event-bus';",
            call_template: "eventEmitter.emit('{{events.EventName | toEventString}}', {{payload}});",
        },
        // For 'System.CurrentUTCDateTime'
        "System.CurrentUTCDateTime": {
            call_template: "new Date();" // Or a more robust UTC date library like 'date-fns-tz'
        }
    }

    // --- NFR Implementation Patterns ---
    nfr_implementation_patterns: {
        // Corresponds to NFR policy policies.PrimeCartDataSecurityNFRs.PiiFieldEncryption
        PII_FIELD_ENCRYPTION: { // Triggered if a model field has `pii_category` and NFR policy is active
            library_import: "import { piiEncrypt, piiDecrypt } from 'common-utils/security/encryption';",
            // Applied by LLM when creating model instances or before PERSIST
            encrypt_template: "piiEncrypt({{fieldValueToEncrypt}}, '{{qualifiedModelName}}.{{fieldName}}')", // Context for key derivation/management
            // Applied by LLM on RETRIEVE if data needs to be decrypted for use/display
            decrypt_template: "piiDecrypt({{fieldValueToDecrypt}}, '{{qualifiedModelName}}.{{fieldName}}')"
        },
        // Corresponds to NFR policy policies.PrimeCartPerformanceNFRs.ProductReadPathCaching
        READ_THROUGH_CACHE_WRAPPER: { // Applied if code spec has `tags: ["ProductReadHighVolume"]`
            // Assumes a 'this.cacheService' is injected, typed by 'Abstract.ICacheService'
            cache_service_property: "this.cacheService",
            wrapper_template: `
                const cacheKey = \`primecart:{{qualified_code_spec_name}}:{{function_args_hash}}\`; // LLM generates suitable key based on context
                const ttl = {{policies.PrimeCartPerformanceNFRs.ProductReadPathCaching.default_cache_ttl_seconds}}; // Value from NFR policy
                let cachedData = await {{cache_service_property}}.get(cacheKey);
                if (cachedData !== null && cachedData !== undefined) {
                    // LLM/Directive: Insert log call for cache hit based on policies.ApplicationMonitoringPolicies.PrimeCartLogging
                    return cachedData;
                }
                // LLM/Directive: Insert log call for cache miss
                const freshData = await {{original_function_call_placeholder}}; // LLM replaces this with the actual call being wrapped
                if (freshData !== null && freshData !== undefined) {
                    await {{cache_service_property}}.set(cacheKey, freshData, ttl);
                }
                return freshData;
            `
        }
    }
}

directive TestDataGeneratorDirectives { // Qualified Name: directives.TestDataGeneratorDirectives
    target_tool: "PrimeCart_TestDataFactory_v0.9"
    description: "Directives for generating synthetic test data based on 'model' specifications."
    // ... (content largely as before, ensuring model references are qualified, e.g., for_model users.UserProfileResponse)
    global_settings: {
        default_row_count: 100
        output_format: "JSON_Lines"
        locale: "en_US"
    }
    for_model users.UserProfileResponse {
        field_overrides: { /* ... */ }
    }
}

directive DocumentationGeneratorDirectives { // Qualified Name: directives.DocumentationGeneratorDirectives
    target_tool: "DefinitiveSpecToHTMLDocs_v0.5"
    // ... (content largely as before, ensure source references are to qualified artifact names)
    output_directory: "./build/docs"
    theme: "primecart_branded"
    generate_api_reference_from: ["users.dspec", "products.dspec", "orders.dspec"] // Files to process
}

// --- CI/CD Pipeline Configuration Directives ---
directive CICDPipelineConfiguratorDirectives { // Qualified Name: directives.CICDPipelineConfiguratorDirectives
    target_tool: "PrimeCart_JenkinsPipelineBuilder_v2.0" // Example CI/CD tool
    description: "Directives for configuring CI/CD pipeline stages for PrimeCart services based on `deployment` specifications."

    // The `for_deployment_service` attribute targets a service *name* as defined within a `deployment` spec.
    // The target_tool is expected to resolve this service name across all known deployment specs.
    // Example: 'UserServiceDeployment' is a service defined within 'infra.PrimeCartSetup.ProductionK8sDeployment'.
    for_deployment_service UserServiceDeployment {
        build_stage: { agent: "ubuntu-latest"; node_version: "18"; build_command: "npm run build"; }
        test_stage: { command: "npm test"; reports_path: "junit.xml"; coverage_tool: "Istanbul"; } // Assuming Node.js typical tools
        deploy_to_staging_stage: { script_path: "cicd/scripts/deploy_to_staging_users.sh"; approval_required: true; }
        security_scan_stage: { tool: "Snyk"; severity_threshold: "High"; fail_build: true; }
    }
    // Further services like ProductServiceDeployment, OrderServiceDeployment would have their own blocks.
}
```

---

## Chapter 9: Test Specifications (`checkout_tests.dspec`) (Illustrating DDM Stage 2/3)

Test specifications are crucial for **Verifiability** (DDM Principle) and are drafted early in the DDM lifecycle.

```definitive_spec
// checkout_tests.dspec
// Test implementations MUST be located as specified by `test_location`.
// Human Review Focus: Test coverage of requirements/code, correctness of steps and expected results.

test CheckoutSuccessEndToEnd {
    // Qualified Name: checkout_tests.CheckoutSuccessEndToEnd
    title: "E2E Test: Successful Order Checkout with Valid Payment"
    description: `
        Verifies the entire checkout flow from adding an item to the cart
        through successful payment and order confirmation.
    `
    verifies_requirement: [reqs.CompleteCheckoutSuccessfully] // Assuming a requirements.dspec and this req name
    verifies_behavior: [checkout.CheckoutProcess.MainFSM] // Links to the FSM's qualified name
    // verifies_fsm_path: [checkout.CheckoutProcess.MainFSM.CartNotEmpty -> checkout.CheckoutProcess.MainFSM.OrderConfirmed] (More specific path coverage)
    type: "E2E"
    priority: "Critical"

    test_location: {
        language: "TypeScript",
        framework: "Playwright", // Example E2E testing framework
        filepath: "primecart-app/tests/e2e/checkout/successful_order.spec.ts",
        // Maps to a test suite or specific test case name within the file for test runners/reporters.
        test_case_id_in_file: "Checkout End-to-End - Successful Payment"
    }

    preconditions: [
        "A registered user 'e2e_user@primecart.com' exists with a valid saved payment method.",
        "Product 'PROD123' is in stock with quantity > 1.",
        "The application and all dependent services (payment gateway, inventory) are operational."
    ]
    steps: [
        "Given I am logged in as 'e2e_user@primecart.com'",
        "And my cart is empty",
        "When I add product 'PROD123' to my cart",
        "And I proceed to checkout",
        "And I confirm my default shipping address",
        "And I select my saved payment method",
        "And I click 'Place Order & Pay'",
        "Then I should see an order confirmation page with a new order ID",
        "And my order status for the new order ID should be 'Confirmed' or 'Processing'",
        "And I should receive an order confirmation email"
    ]
    expected_result: `
        * User successfully navigates the FSM (checkout.CheckoutProcess.MainFSM) from CartNotEmpty to OrderConfirmed.
        * An order record is created in DataStore.Orders with correct items, quantities, and pricing.
        * Inventory for 'PROD123' in DataStore.ProductStock is correctly decremented.
        * Payment is successfully processed via the external payment gateway mock/sandbox.
        * User receives visual confirmation and an email notification matching models.OrderConfirmationEmailPayload (assuming this model exists).
    `
    test_data_setup: "Requires standard E2E test dataset: user 'e2e_user@primecart.com', product 'PROD123' in stock."
    // SVS Rule: `verifies_requirement` and `verifies_behavior` must link to existing qualified names.
    // SVS Rule: `test_location.filepath` should be a valid path.
}

test UserRegistrationHandler_DuplicateEmail_Integration {
    // Qualified Name: checkout_tests.UserRegistrationHandler_DuplicateEmail_Integration (or better: users_tests.UserRegistrationHandler_DuplicateEmail_Integration)
    title: "Integration Test: User Registration Handler - Duplicate Email"
    description: "Verifies the users.HandleUserRegistration code unit correctly returns an error for duplicate emails, interacting with a mock User Data Store."
    verifies_code: [users.HandleUserRegistration] // Links to the code spec's qualified name
    type: "Integration"
    priority: "Critical"

    test_location: {
        language: "TypeScript",
        framework: "Jest", // Example unit/integration testing framework
        filepath: "primecart-app/srcsrc/core/user_management/handlers/registration_handler.test.ts",
        // Maps to a specific 'it' or 'test' block name within the Jest file.
        test_case_id_in_file: "handleUserRegistrationLogic should return EmailAlreadyInUse error for existing email"
        // PGT Hint: Can generate Jest test skeleton from this spec and the linked users.HandleUserRegistration spec.
    }

    preconditions: [
        "Mock UserDataStore is configured to return an existing user for email 'existing@example.com'.",
        "Mock PasswordHasher and EventPublisher are configured according to their abstract interfaces."
    ]
    steps: [
        "Given the HandleUserRegistrationLogic function (from users.HandleUserRegistration) with mocked dependencies (UserDataStore, PasswordHasher, EventPublisher)",
        "When HandleUserRegistrationLogic is called with payload: { email: 'existing@example.com', password: 'ValidPassword123!', password_confirm: 'ValidPassword123!' }",
        "Then the function should return a users.UserRegistrationResult with status 'failure'",
        "And the returned result.error_data.error_code should be 'PC_ERR_USER_EMAIL_IN_USE' (matching policies.GlobalAPIPolicies.PrimeCartErrorCatalog.EmailAlreadyInUse.error_code)",
        "And the mock UserDataStore's 'save user' method (representing PERSIST) should NOT have been called."
    ]
    expected_result: "The registration attempt is rejected with a users.UserRegistrationResult indicating failure due to duplicate email. No new user is persisted. No event is emitted."
    // SVS Rule: `verifies_code` must link to an existing qualified code spec name. Test steps should align with code spec's behavior, pre/postconditions.
}
```
*   **Tooling Tip:** The LDE provides syntax highlighting for Gherkin keywords within `steps` and `acceptance_criteria`.
*   **DDM Note:** `test` artifacts are **Specifications as the Single Source of Truth** for what needs to be tested. They drive test implementation and can be used by the PGT to help generate test code skeletons.

---

## Chapter 10: AI Co-Piloting & The DDM Lifecycle for PrimeCart

The Definitive Development Methodology (DDM) leverages AI as a co-pilot, primarily through the **Prompt Generation Toolkit (PGT)**, which uses the context from the **Specification Hub (ISE)**, and an **AI Implementation Agent** which translates DSpec into code, guided by `directive`s.

*   **AI Co-Piloting Examples with PGT for PrimeCart:**
    *   **Drafting Test Cases:**
        *   User selects PGT task: "Draft `test` scenarios for `api users.RegisterUser`."
        *   PGT fetches `users.RegisterUser` spec, its `request_model users.UserRegistrationPayload`, `response_model users.UserRegistrationResult`, and linked `requirement users.UserRegistration` from ISE.
        *   PGT generates a rich prompt for an LLM: "Given the PrimeCart `api users.RegisterUser` (specifications below), its request/response models, and the `users.UserRegistration` requirement it fulfills, suggest 5 distinct `test` scenarios in DefinitiveSpec `test` artifact format. Cover valid registration, duplicate email, weak password, mismatched passwords, and server error. Reference errors from `policies.GlobalAPIPolicies.PrimeCartErrorCatalog`."
        *   The Specification Author or QA reviews and refines the LLM's output.
    *   **Suggesting `detailed_behavior` for `code` specs:**
        *   User selects PGT task: "Draft `detailed_behavior` for `code users.HandleUserLogin` implementing `api users.LoginUser`."
        *   PGT fetches `users.LoginUser` (with its path, method, request/response models), `users.HandleUserLogin`'s signature, pre/postconditions, and the `users.UserService` design document.
        *   PGT generates prompt: "For PrimeCart's `code users.HandleUserLogin` (details below), which implements `api users.LoginUser`, draft the `detailed_behavior` using DSpec constrained pseudocode (keywords: RETRIEVE, CALL, RETURN_SUCCESS, RETURN_ERROR etc.). Consider input validation (delegated to framework), querying `DataStore.Users` by email, verifying password via `Security.PasswordVerifier.Verify`, generating a session token via `Security.JwtService.Generate`, updating `last_login_date`, and error handling for 'user not found' or 'invalid credentials' using `policies.GlobalAPIPolicies.PrimeCartErrorCatalog`. Reference relevant `directive`s from `directives.PrimeCart_TypeScript_ImplementationDirectives` for abstract call patterns."
    *   **Identifying Missing Error Conditions:**
        *   User selects PGT task: "Analyze `api orders.PlaceOrder` and its linked `code orders.HandlePlaceOrder` for potential missing error conditions not covered in its `throws_errors` or `policies.GlobalAPIPolicies.PrimeCartErrorCatalog`."
        *   PGT fetches relevant specs and policies to provide context to the LLM.

*   **AI Implementation Agent Process (Conceptual Example for `users.HandleUserRegistration`):**
    1.  **Input:** `code users.HandleUserRegistration` spec, all linked specs (models, policies), and `directive directives.PrimeCart_TypeScript_ImplementationDirectives`.
    2.  **Parsing:** Agent parses the `code` spec, including its `signature`, `implementation_location`, `pre/postconditions`, and the structured `detailed_behavior`.
    3.  **Directive Consultation:** Agent loads the specified `target_tool`'s directives (`directives.PrimeCart_TypeScript_ImplementationDirectives`).
    4.  **Code Generation - Step by Step from `detailed_behavior`:**
        *   Sets up function signature based on `signature` and `implementation_location`.
        *   Applies `default_api_handler_structure` from directives (Express boilerplate, error handling middleware, logging).
        *   Translates `IF payload.password NOT_EQUALS payload.password_confirm THEN RETURN_ERROR...` into TypeScript `if` and error response generation.
        *   Translates `RETRIEVE users.UserEntity FROM DataStore.Users WHERE { email: payload.email }` into a TypeORM `this.userRepository.findOneBy({ email: payload.email })` call, using `data_operation_patterns.RETRIEVE_SINGLE` from directives.
        *   Translates `CALL Security.PasswordHasher.Hash` using the `abstract_call_implementations` for that key.
        *   When processing `CREATE_INSTANCE users.UserEntity`, it checks `users.UserEntity` model for `pii_category` attributes. If `policies.PrimeCartDataSecurityNFRs.PiiFieldEncryption` is active, it applies the `PII_FIELD_ENCRYPTION` pattern from `nfr_implementation_patterns` to relevant fields.
        *   Translates `PERSIST newUserEntity TO DataStore.Users` to `this.userRepository.save(...)`.
        *   Translates `EMIT_EVENT events.UserRegistered` using `abstract_call_implementations`.
        *   Translates `RETURN_SUCCESS successDataPayload` into constructing the `users.UserRegistrationResult` and returning it, which the API framework directive then maps to an HTTP 201.
    5.  **Output:** Generates the TypeScript code into `primecart-app/src/core/user_management/handlers/registration_handler.ts`.
    *   **Human Review:** Focuses on the generated code's fidelity to the `detailed_behavior`'s core logic and ensuring NFRs (like PII encryption) were correctly applied by the agent.

*   **DDM Lifecycle Stages Illustrated with PrimeCart (Simplified):** (See Appendix I for full DDM stage details, not included here)
    1.  **Stage 1: Inception & Initial Requirements Capture:**
        *   Product team drafts initial `requirement`s for PrimeCart (e.g., "Wishlist Feature") in `.dspec` files, assisted by PGT. Stored in ISE.
    2.  **Stage 2: Design and Detailed Specification:**
        *   Architects/dev leads define `design` components (e.g., `designs.WishlistService`), `model`s (`models.WishlistItem`), `api`s (`apis.GetWishlist`), `code` spec skeletons (with structured `detailed_behavior`), `interaction`s, `policy`s (including NFRs), `infra` specs, and initial `test` spec outlines. PGT assists heavily. `Directive`s for the target stack are also drafted or refined. All linked and stored in ISE.
    3.  **Stage 3: Specification Refinement and Validation:**
        *   **Specification Validation Suite (SVS)** runs automated checks (syntax, qualified name resolution, link integrity, schema conformance for `model`s, consistency between `api.response_model` and `code.signature`).
        *   SVS (with PGT) can orchestrate AI-driven reviews for semantic consistency (e.g., "Is `code users.HandlePlaceOrder.detailed_behavior` consistent with `api orders.PlaceOrder.request_model` and `checkout.CheckoutProcess.MainFSM` transitions?").
        *   Human reviews focus on intent and logical correctness. Feedback leads to updates in specs (looping back to Stage 1 or 2 if needed).
    4.  **Stage 4: Automated Generation and Verification Pipeline:**
        *   AI Implementation Agent (guided by `directive`s) generates TypeScript code from `code` specs, integrating NFR logic from policies.
        *   Developers review generated code, implement any `escape_hatch` parts, and integrate.
        *   Automated tests (potentially with skeletons generated from `test` specs) run. Formal verification tools check `formal_model`s.
    5.  **Stage 5: Analysis and Debugging Failures:**
        *   Failures trace back to specs via ISE links.
        *   **IDE Agent** helps compare generated/written code against its source `code` spec.
        *   **Crucially (DDM Principle 8):** If a code fix requires deviating from the current spec due to an unforeseen issue or a better approach discovered during implementation, the developer **updates the relevant specification(s) in the ISE first**. Then, code is regenerated or manually adjusted to align with the *updated* spec.
        *   PGT assists in debugging by providing context from specs: "Test `checkout_tests.InventoryDecrementOnOrder` failed. Here's the test spec, the relevant `code orders.CommitStockReduction` spec, and the `products.InventoryManagement.InventoryAtomicityAndConsistency` formal model summary. Suggest inconsistencies."

---

This guide has demonstrated how DefinitiveSpec can be applied to specify a complex application like PrimeCart. It highlights the interconnectivity of specifications, the role of (conceptual) tooling like the DefinitiveSpec Tools for VS Code, and how different specification artifacts come together. When used within the Definitive Development Methodology (DDM), these specifications become the **single source of truth**, driving development, enabling powerful AI co-piloting and implementation, and leading to higher quality, more verifiable software.

The effective use of the DDM toolset (ISE, PGT, SVS, IDE Agent, AI Implementation Agent) and well-crafted `directive`s are paramount. While this guide primarily focuses on writing `.dspec` artifacts, understanding how these tools interact with the specifications is key to unlocking the full potential of the DDM.

The appendices would provide further details on the DefinitiveSpec language grammar, DDM principles, and other reference materials.
