// cfv_internal_directives.dspec.md
// Directives for the CascadeFlowVisualizer (CFV) TypeScript/React/Jotai AI Implementation Agent.

directive CFV_TypeScript_React_Jotai_Generator_Directives {
    target_tool: "CFV_TypeScript_React_Jotai_Generator_v1.0"
    description: "Directives for generating CFV library code using TypeScript, React, and Jotai."
    default_language: "TypeScriptReact"

    // --- Global Project Settings ---
    global_settings: {
        output_base_path: "./src" // Relative to project root where DSpecs are
        models_output_path: "./src/models/cfv_models_generated.ts" // Where generated TypeScript interfaces from cfv_models.dspec go
        state_atoms_output_path_prefix: "./src/state/" // e.g., ./src/state/moduleRegistryAtoms.ts
        services_output_path_prefix: "./src/services/" // e.g., ./src/services/moduleRegistryService.ts
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
            default_imports: ["import React from 'react';"]
        },
        // Example: How detailed_behavior "RENDER_JSX <MyChildComponent prop1={localVar} />" is translated
        jsx_rendering: {
            component_tag_template: "<{{componentName}} {{props}} />",
            html_tag_template: "<{{tagName}} {{attributes}}>{{children}}</{{tagName}}>"
        },
        // For 'USE_EFFECT (cleanupFn) => { /* effect_logic */ } WITH_DEPS [dep1, dep2]' in detailed_behavior
        use_effect_hook: {
            template: |
                React.useEffect(() => {
                    {{effect_logic}}
                    {{#if cleanupFn}}
                    return () => {
                        {{cleanupFn_logic}}
                    };
                    {{/if}}
                }, [{{dependency_array_expression}}]);
            imports: ["import React from 'react';"] // Redundant if default_imports used, but good for explicitness
        },
        use_callback_hook: {
            template: "const {{callbackName}} = React.useCallback(({{callback_args}}) => { {{callback_logic}} }, [{{dependency_array_expression}}]);",
            imports: ["import React from 'react';"]
        },
        use_memo_hook: {
            template: "const {{memoizedValueName}} = React.useMemo(() => { {{calculation_logic}} }, [{{dependency_array_expression}}]);",
            imports: ["import React from 'react';"]
        }
    }

    // --- Abstract Call Implementations (e.g., for props callbacks, external libraries) ---
    abstract_call_implementations: {
        // For 'CALL props.requestModule WITH { fqn: moduleFqn } ASSIGN_TO result' in detailed_behavior
        "props.requestModule": { // Matches the abstract call target
            // Assumes `props` is in scope of the generated function
            call_template: "await props.requestModule({{moduleFqn}});",
            // SVS Rule: `props.requestModule` must be a field in the props interface of the component.
        },
        "props.onSaveModule": {
            call_template: "await props.onSaveModule({{payload_variable_name}});",
        },
        "props.parseContextVariables": {
            call_template: "props.parseContextVariables({{string_value_variable_name}});",
        },
        "YamlParser.parse": { // For 'CALL YamlParser.parse WITH { content: rawYaml } ...'
            library_import: "import { parse as yamlParse } from 'yaml';", // Actual library
            call_template: "yamlParse({{rawYaml}});",
        },
        "YamlSerializer.stringify": {
            library_import: "import { stringify as yamlStringify } from 'yaml';",
            call_template: "yamlStringify({{jsObject}}, { indent: 2 });", // Example with options
        },
        "ELKLayoutEngine.layout": { // For 'CALL ELKLayoutEngine.layout WITH { nodes, edges, options } ...'
            library_import: "import ElkWorker from '@hiso/elkjs-worker/dist/elk-worker.min.js?worker';\nimport ELK from 'elkjs/lib/elk.bundled.js';", // Conceptual, actual import might vary
            // This is a complex one, might involve a helper function.
            call_template: "await runElkLayout(elkInstance, {{nodes}}, {{edges}}, {{options}});", // Assumes a helper 'runElkLayout'
            // The Agent might need a sub-directive or more detailed pattern for setting up ELK.
        }
        // SVS Rule: All parameters in call_template (e.g., {{moduleFqn}}) must be resolvable from the detailed_behavior CALL arguments.
    }

    // --- NFR Implementation Patterns ---
    nfr_implementation_patterns: {
        // For 'cfv_policies.NFRs.NFR1_Performance' (e.g., memoization)
        // The `react_component_structure.default_functional_component_shell` already includes React.memo.
        // `use_callback_hook` and `use_memo_hook` are used explicitly in `detailed_behavior` when needed.
        PERFORMANCE_CRITICAL_COMPONENT_MEMOIZATION: { // Triggered if component's code spec has applies_nfrs: [cfv_policies.NFRs.NFR1_Performance]
            // This might just confirm default React.memo usage or add specific logging if profiling is enabled.
            info: "Ensure React.memo is used. For functions within, use React.useCallback. For derived data, use React.useMemo. These should be explicit in detailed_behavior for critical paths."
        }
    }

    // --- General Logic & Error Handling ---
    error_handling_patterns: {
        // For 'RETURN_ERROR_WITH { type: "ModuleNotFound", message: `Module ${fqn} not found` }' in detailed_behavior
        CONSTRUCT_ERROR_OBJECT: { // Generic error object structure
            template: "{ errorType: '{{type}}', message: {{message_expression}}, details: {{details_object_expression}} }"
        },
        // For general try-catch blocks if specified by a policy or code spec attribute
        WRAP_IN_TRY_CATCH: {
            template: |
                try {
                    {{try_block_content}}
                } catch (error: any) {
                    console.error("An unexpected error occurred:", error); // Default logging
                    {{catch_block_content_or_rethrow}}
                }
        }
    }
}