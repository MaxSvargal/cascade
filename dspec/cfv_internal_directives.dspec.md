// cfv_internal_directives.dspec.md
// Directives for the CascadeFlowVisualizer (CFV) TypeScript/React/Jotai AI Implementation Agent.
// Refined for clarity and alignment with refactored services.

directive CFV_TypeScript_React_Jotai_Generator_Directives {
    target_tool: "CFV_TypeScript_React_Jotai_Generator_v1.0"
    description: "Directives for generating CFV library code using TypeScript, React, and Jotai."
    default_language: "TypeScriptReact"

    // --- Global Project Settings ---
    global_settings: {
        output_base_path: "./src" // Relative to project root where DSpecs are
        models_output_path: "./src/models/cfv_models_generated.ts" // Where generated TypeScript interfaces from cfv_models.dspec go
        // Suggests organizing atoms and service logic by the design artifact they belong to
        state_atoms_output_path_template: "./src/state/{{DesignArtifactName}}Atoms.ts" // e.g., ./src/state/ModuleRegistryServiceAtoms.ts
        services_output_path_template: "./src/services/{{DesignArtifactName}}Logic.ts" // e.g., ./src/services/ModuleRegistryServiceLogic.ts
        components_output_path_prefix: "./src/components/" // e.g., ./src/components/CascadeFlowVisualizer.tsx
        default_prettier_config_path?: ".prettierrc.js" // Optional: for code formatting
    }

    // --- TypeScript Model Generation (from cfv_models.dspec) ---
    model_generation: {
        // For 'model cfv_models.DslModuleInput { fqn: String { required: true } ... }'
        // Generates TypeScript interfaces.
        interface_prefix: "" // No prefix like 'I' for interfaces by default
        enum_generation_style: "string_union" // 'SUCCESS' | 'FAILURE' rather than TypeScript enums
        date_time_type: "string" // How 'DateTime' DSpec type is mapped
        any_type_mapping: "any"  // How 'cfv_models.Any' is mapped
        function_type_mapping: { // How 'cfv_models.Function' is mapped
            // The 'description' attribute of a cfv_models.Function field should contain its signature for the LLM
            // Example: description: "Signature: (fqn: String) => Promise<cfv_models.RequestModuleResult | null>";
            // LLM Agent will parse this description to generate the TS function type.
            template: "({{parsed_params_from_description}}) => {{parsed_return_type_from_description}}"
        }
        // SVS Rule: Models referenced in function signatures (e.g., cfv_models.RequestModuleResult) must exist.
    }

    // --- Jotai State Management Patterns ---
    jotai_patterns: {
        // For 'state_atom MyAtom { type: "string"; initial_value: "test"; ... }'
        DEFINE_PRIMITIVE_ATOM: {
            template: "export const {{atomName}}Atom = atom<{{atomType}}>({{initialValue}});",
            imports: ["import { atom } from 'jotai';"]
        },
        // For atoms derived from other atoms. Getter logic comes from detailed_behavior.
        DEFINE_DERIVED_ATOM_READ_ONLY: {
            template: "export const {{atomName}}Atom = atom(get => { /* AI Agent inserts getter_logic from detailed_behavior */ {{getter_logic}} });",
            imports: ["import { atom } from 'jotai';"]
        },
        DEFINE_DERIVED_ATOM_READ_WRITE: {
            template: "export const {{atomName}}Atom = atom(get => { /* {{getter_logic}} */ }, (get, set, {{update_arg_name}}: {{update_arg_type}}) => { /* {{setter_logic}} */ });",
            imports: ["import { atom } from 'jotai';"]
        },
        // For 'READ_ATOM myAtom' in detailed_behavior
        READ_ATOM: {
            template: "get({{atomName}}Atom)" // Used within a Jotai getter/setter context
        },
        // For 'WRITE_ATOM myAtom WITH newValue' in detailed_behavior
        WRITE_ATOM: {
            template: "set({{atomName}}Atom, {{valueToWrite}})" // Used within a Jotai setter context or effect
        },
        // For 'USE_ATOM myAtom' in detailed_behavior of a React component
        USE_ATOM_HOOK: {
            template: "const [{{atomName}}, set{{atomName | capitalize}}] = useAtom({{atomName}}Atom);",
            imports: ["import { useAtom } from 'jotai';"]
        },
        USE_SET_ATOM_HOOK: {
            template: "const set{{atomName | capitalize}} = useSetAtom({{atomName}}Atom);",
            imports: ["import { useSetAtom } from 'jotai';"]
        },
        USE_ATOM_VALUE_HOOK: {
            template: "const {{atomName}} = useAtomValue({{atomName}}Atom);",
            imports: ["import { useAtomValue } from 'jotai';"]
        }
    }

    // --- React Component Generation Patterns ---
    react_component_structure: {
        // For 'code MyComponent { language: "TypeScriptReact"; signature: "React.FC<MyComponentProps>"; ... }'
        default_functional_component_shell: {
            template: |
                import React from 'react';
                /* AI Agent inserts other necessary imports based on detailed_behavior and directives */
                {{additional_imports}}

                interface {{componentName}}Props {
                    /* AI Agent populates with props derived from signature or linked cfv_models.XYZProps */
                    {{props_interface_content}}
                }

                const {{componentName}}: React.FC<{{componentName}}Props> = (props) => {
                    /* AI Agent inserts hooks and logic from detailed_behavior */
                    {{hooks_and_logic_content}}

                    return (
                        <>
                            {/* AI Agent inserts JSX from detailed_behavior or further directives */}
                            {{jsx_content}}
                        </>
                    );
                };

                export default React.memo({{componentName}});
            default_imports: ["import React from 'react';"] // Base import
        },
        jsx_rendering: {
            component_tag_template: "<{{componentName}} {{props}} />",
            html_tag_template: "<{{tagName}} {{attributes}}>{{children}}</{{tagName}}>"
        },
        use_effect_hook: {
            template: |
                React.useEffect(() => {
                    {{effect_logic}}
                    {{#if cleanupFn_logic}}
                    return () => {
                        {{cleanupFn_logic}}
                    };
                    {{/if}}
                }, [{{dependency_array_expression}}]);
            imports: ["import React from 'react';"]
        },
        use_callback_hook: {
            template: "const {{callbackName}} = React.useCallback(({{callback_args}}) => { {{callback_logic}} }, [{{dependency_array_expression}}]);",
            imports: ["import React from 'react';"]
        },
        use_memo_hook: {
            template: "const {{memoizedValueName}} = React.useMemo(() => { {{calculation_logic}} }, [{{dependency_array_expression}}]);",
            imports: ["import React from 'react';"]
        },
        use_ref_hook: { // Added for USE_REF_HOOK pseudocode
            template: "const {{refName}}Ref = React.useRef<{{refType}}>({{initial_value}});", // Assuming refType can be inferred or specified
            imports: ["import React from 'react';"]
        }
    }

    // --- Abstract Call Implementations (e.g., for props callbacks, external libraries) ---
    abstract_call_implementations: {
        // Props Callbacks
        "props.requestModule": {
            call_template: "await props.requestModule({{fqn}});", // Parameter name 'fqn' from CALL ... WITH { fqn: ... }
        },
        "props.onSaveModule": {
            call_template: "await props.onSaveModule({{payload}});", // Parameter name 'payload'
        },
        "props.parseContextVariables": {
            call_template: "props.parseContextVariables({{value}});", // Parameter name 'value'
        },
        "props.onViewChange": {
            call_template: "props.onViewChange({{viewPayload}});"
        },
        "props.onElementSelect": {
            call_template: "props.onElementSelect({{selectedElement}});"
        },
        "props.onModuleLoadError": {
            call_template: "props.onModuleLoadError({{fqn}}, {{error}});"
        },

        // Abstracted Internal Service Calls (Examples)
        "AbstractModuleRegistry.getLoadedModule": {
            call_template: "{{registryInstance}}.getLoadedModule({{fqn}});", // Assumes registryInstance is in scope
            // This directive might be used if ModuleRegistryService methods are called from other services.
            // Actual implementation of ModuleRegistryService itself would directly manipulate atoms.
        },
        "AbstractYamlParser.parse": {
            library_import: "import { parse as yamlParse } from 'yaml';",
            call_template: "yamlParse({{content}});", // Parameter 'content'
        },
        "AbstractYamlSerializer.stringify": {
            library_import: "import { stringify as yamlStringify } from 'yaml';",
            call_template: "yamlStringify({{jsObject}}, { indent: 2 });", // Parameter 'jsObject'
        },
        "AbstractELKEngine.layout": {
            library_import: "import ELK from 'elkjs/lib/elk.bundled.js';\nconst elk = new ELK();", // Example setup
            // This is a complex one, might involve a helper function.
            call_template: "await elk.layout({{elkGraphInput}});", // Parameter 'elkGraphInput'
            // The Agent might need a sub-directive or more detailed pattern for setting up ELK if not global like this.
        },
        "PerformanceAPI.now": { // For performance.now()
            call_template: "performance.now()"
        },
        "SystemTime.now": { // For new Date()
            call_template: "new Date()"
        },
        "SystemTime.toISOString": { // For date.toISOString()
            call_template: "{{date}}.toISOString()" // Parameter 'date'
        },
        "GlobalTimers.setTimeout": { // For setTimeout
            call_template: "setTimeout({{callback}}, {{delayMs}})"
        },
        "GlobalTimers.clearTimeout": { // For clearTimeout
            call_template: "clearTimeout({{timeoutId}})"
        },
        "ReactFlowAPI.useReactFlow": { // For React Flow's useReactFlow hook
             // This is a hook, so its usage is more complex than a simple call.
             // The AI agent would need to understand that `USE_CALL ReactFlowAPI.useReactFlow().fitView`
             // implies the component is within ReactFlowProvider and `useReactFlow` is called at the top.
            info: "This is a React hook. The AI agent should ensure useReactFlow() is called appropriately within the component.",
            call_template_for_method: "reactFlowInstance.{{methodName}}({{args}})" // e.g. reactFlowInstance.fitView(...)
        },
        "AbstractLogger.logWarning": {
             call_template: "console.warn({{message}});" // Simple console log for now
        },
        "AbstractLogger.logError": {
             call_template: "console.error({{message}});"
        },
         "AbstractLogger.logInfo": {
             call_template: "console.log({{message}});"
        }
        // SVS Rule: All parameters in call_template (e.g., {{moduleFqn}}) must be resolvable from the detailed_behavior CALL arguments.
    }

    // --- NFR Implementation Patterns ---
    nfr_implementation_patterns: {
        PERFORMANCE_CRITICAL_COMPONENT_MEMOIZATION: {
            info: "Ensure React.memo is used for the component shell. For functions passed as props or defined within, use React.useCallback. For derived data/objects, use React.useMemo. These should be explicitly requested via USE_CALLBACK_HOOK or USE_MEMO_HOOK in detailed_behavior for critical paths."
        }
    }

    // --- General Logic & Error Handling ---
    error_handling_patterns: {
        CONSTRUCT_ERROR_OBJECT: { // Generic error object structure for internal errors
            template: "{ errorType: '{{type}}', message: {{message_expression}}, details: {{details_object_expression}} }"
        },
        THROW_ERROR_STATEMENT: { // For THROW_ERROR pseudocode
            template: "throw new Error({{message_expression}});", // Simple Error, can be enhanced
        },
        WRAP_IN_TRY_CATCH: { // If detailed_behavior specifies TRY ... CATCH_ERROR
            template: |
                try {
                    {{try_block_content}}
                } catch (error: any) {
                    /* AI Agent inserts catch_block_content from detailed_behavior */
                    {{catch_block_content}}
                    /* Default if no catch_block_content: */
                    /* console.error("An unexpected error occurred in {{CodeSpecName}}:", error); */
                    /* throw error; // Re-throw by default if not handled */
                }
        }
    }
}