// cfv_policies.dspec
// Refined according to DefinitiveSpec methodology with qualified names and stable IDs
// Defines Non-Functional Requirements (NFRs) and key architectural decisions as policies.

// --- Architectural Philosophy & Key Decisions as Policies (from Section II) ---
policy cfv_policies.Arch_ReactFlowElkjsFoundation {
    id: "CFV_POL_ARCH_001"
    title: "React Flow + ELK.js Foundation"
    nfr UseReactFlowAndElkjs {
        id: "CFV_NFR_ARCH_001"
        statement: "Leverage the React Flow library for core graph rendering and basic interactions. Utilize ELK.js (via elkjs/lib/elk.bundled.js or a suitable React integration like @hiso/elkjs-worker) for automatic, sophisticated graph layout. ELK.js is the sole supported primary layout algorithm."
        verification_method: "Code review for library usage; Visual inspection of layout quality and responsiveness."
        source: "CascadeFlowVisualizer Library Specification, Section II"
        applies_to: [cfv_designs.LayoutService, cfv_designs.CascadeFlowVisualizerComponent]
    }
}

policy cfv_policies.Arch_ModuleCentric {
    id: "CFV_POL_ARCH_002"
    title: "Module-Centric Architecture"
    nfr ModuleAwareness {
        id: "CFV_NFR_ARCH_002"
        statement: "The library is fundamentally aware of Cascade DSL modules (identified by FQN). It manages loading (via props.requestModule), parsing (YAML), and resolving definitions (flows, components, context, imports) across multiple modules, respecting `imports` and aliases. All internal references use qualified names resolved by cfv_designs.ModuleRegistryService."
        verification_method: "Test cases involving multi-module DSLs (cfv_models.DslModuleInput) with various import scenarios (direct, aliased, transitive)."
        source: "CascadeFlowVisualizer Library Specification, Section II"
        applies_to: [cfv_designs.ModuleRegistryService, cfv_designs.GraphBuilderService]
    }
}

policy cfv_policies.Arch_ComponentSchemasUpfront {
    id: "CFV_POL_ARCH_003"
    title: "Component Schemas Provided Upfront"
    nfr PreloadedSchemas {
        id: "CFV_NFR_ARCH_003"
        statement: "All known component JSON Schemas (cfv_models.ComponentSchema for `configSchema`, `inputSchema`, `outputSchema`, `triggerConfigSchema`, `triggerOutputSchema`) are provided initially via `props.componentSchemas`. The library will not fetch schemas on demand. Schema resolution by cfv_designs.ModuleRegistryService is synchronous and predictable based on component FQNs."
        verification_method: "API contract review (cfv_models.CascadeFlowVisualizerProps); Test cases ensuring no on-demand schema fetching."
        source: "CascadeFlowVisualizer Library Specification, Section II"
        applies_to: [cfv_designs.ModuleRegistryService, cfv_models.CascadeFlowVisualizerProps]
    }
}

policy cfv_policies.Arch_EditingTradeoffsV1 {
    id: "CFV_POL_ARCH_004"
    title: "V1 Editing Preservation Trade-offs (YAML Reconstruction)"
    nfr EditingDataPreservation {
        id: "CFV_NFR_ARCH_004"
        statement: "When reconstructing YAML via cfv_designs.YamlReconstructionService for `props.onSaveModule`: Order of elements in YAML sequences will be preserved. Order of keys in YAML mappings might be canonicalized (e.g., alphabetized). Comments and nuanced YAML formatting (e.g., specific line breaks, custom tags) are likely to be lost or altered in V1 editing due to reliance on standard YAML parsing/stringification libraries. Focus is on semantic correctness of the DSL structure."
        verification_method: "Testing of save/load cycles for YAML element order; Documentation of formatting limitations for cfv_models.SaveModulePayload.newContent."
        source: "CascadeFlowVisualizer Library Specification, Section II"
        applies_to: [cfv_designs.YamlReconstructionService, cfv_models.SaveModulePayload]
    }
}

policy cfv_policies.Arch_SubflowsNavigableNodes {
    id: "CFV_POL_ARCH_005"
    title: "Sub-flows Rendered as Navigable Nodes"
    nfr SubflowVisualization {
        id: "CFV_NFR_ARCH_005"
        statement: "Steps invoking sub-flows (e.g., component_ref: 'StdLib:SubFlowInvoker' or a named component of this type) will be rendered as distinct, single nodes (cfv_models.SubFlowInvokerNodeData). These nodes provide summary information (invokedFlowFqn) and act as navigation points to the sub-flow's detail view. No inline rendering of sub-flow steps within the parent flow graph."
        verification_method: "Visual inspection; Test cases for sub-flow navigation interaction (cfv_interactions.UserNavigatesToSubFlow)."
        source: "CascadeFlowVisualizer Library Specification, Section II"
        applies_to: [cfv_designs.GraphBuilderService, cfv_models.SubFlowInvokerNodeData]
    }
}

policy cfv_policies.Arch_TraceOverlaysStateDriven {
    id: "CFV_POL_ARCH_006"
    title: "Trace Overlays are State-Driven"
    nfr TraceDisplayMethod {
        id: "CFV_NFR_ARCH_006"
        statement: "Visualization of execution traces (cfv_models.FlowExecutionTrace) is a distinct display mode (`props.mode = 'trace'`). The visualizer re-renders the graph with trace data overlays (executionStatus, durationMs, etc. on cfv_models.BaseNodeData and cfv_models.FlowEdgeData) when `props.traceData` changes. No real-time streaming of trace events is supported in V1."
        verification_method: "Testing trace display updates based on `props.traceData` changes; Visual inspection of overlays."
        source: "CascadeFlowVisualizer Library Specification, Section II"
        applies_to: [cfv_designs.TraceVisualizationService, cfv_models.BaseNodeData, cfv_models.FlowEdgeData]
    }
}

policy cfv_policies.Arch_ExternalContextVarParsing {
    id: "CFV_POL_ARCH_007"
    title: "Externalized Context Variable Parsing"
    nfr ContextVarParsingDelegation {
        id: "CFV_NFR_ARCH_007"
        statement: "Identification of context variable usages (e.g., '{{context.varName}}') within DSL strings (like in `StdLib:MapData` expressions or `StdLib:HttpCall` URL templates) is delegated to an external utility function provided via `props.parseContextVariables`. The library passes the string value and expects an array of identified context variable names."
        verification_method: "API contract review (cfv_models.CascadeFlowVisualizerProps); Test cases using the prop function with various DSL string patterns."
        source: "CascadeFlowVisualizer Library Specification, Section II"
        applies_to: [cfv_models.CascadeFlowVisualizerProps, cfv_designs.GraphBuilderService]
    }
}

policy cfv_policies.Arch_JotaiStateManagement {
    id: "CFV_POL_ARCH_008"
    title: "Jotai for State Management"
    nfr UseJotai {
        id: "CFV_NFR_ARCH_008"
        statement: "Utilize Jotai for global and shared state within the library (e.g., selectedElementAtom, currentFlowFqnAtom, moduleRegistryAtoms). Promote atomicity, granular reactivity, and reduced complexity in state updates and propagation."
        verification_method: "Code review of Jotai usage patterns (atom definitions, useAtom, useSetAtom, useAtomValue) as guided by cfv_internal_directives.dspec.md."
        source: "CascadeFlowVisualizer Library Specification, Section II"
        applies_to: [cfv_internal_directives.CFV_TypeScript_React_Jotai_Generator_Directives]
    }
}

policy cfv_policies.Arch_ExternalizeVisualsAndBehavior {
    id: "CFV_POL_ARCH_009"
    title: "Externalization of Visuals & Behavior (Consumer-Provided Renderers)"
    nfr CoreResponsibilityFocus {
        id: "CFV_NFR_ARCH_009"
        statement: "The library's core responsibility is parsing DSL (cfv_models.DslModuleInput), building graph data (nodes and edges for React Flow), managing layout (via cfv_designs.LayoutService), selection (cfv_designs.SelectionService), and editing workflows (cfv_designs.InspectorStateService). Rendering of specific node/edge types (`props.customNodeTypes`, `props.customEdgeTypes`) and inspector tab content (`props.renderInspectorSourceTab`, `props.renderInspectorPropertiesTab`, `props.renderInspectorDebugTestTab`) is delegated to consumer-provided React components."
        verification_method: "API contract review (cfv_models.CascadeFlowVisualizerProps) demonstrating extensive use of render props and customization props. Test with default and custom renderers."
        source: "CascadeFlowVisualizer Library Specification, Section II"
        applies_to: [cfv_models.CascadeFlowVisualizerProps, cfv_consumer_directives.InspectorTabImplementation]
    }
}

policy cfv_policies.Arch_FunctionalPuritySideEffectIsolation {
    id: "CFV_POL_ARCH_010"
    title: "Functional Purity & Side Effect Isolation"
    nfr CodeDesignPrinciples {
        id: "CFV_NFR_ARCH_010"
        statement: "Core graph building (cfv_designs.GraphBuilderService) and data transformation logic (e.g., within cfv_designs.ModuleRegistryService parsing) are designed as pure functions where possible. Side effects (e.g., Jotai atom updates, invoking prop callbacks like `props.requestModule` or `props.onSaveModule`) are managed at the component's boundaries or within Jotai atom effects/async actions."
        verification_method: "Code review of key data transformation services and Jotai atom definitions."
        source: "CascadeFlowVisualizer Library Specification, Section II"
        applies_to: [cfv_designs.GraphBuilderService, cfv_designs.ModuleRegistryService]
    }
}

// --- Non-Functional Requirements (from Section V) ---
policy cfv_policies.NFRs_General {
    id: "CFV_POL_NFR_001"
    title: "Non-Functional Requirements for CascadeFlowVisualizer"

    nfr NFR1_Performance {
        id: "CFV_NFR_PERF_001"
        statement: "Render flows of moderate complexity (e.g., 50-100 nodes, 50-150 edges) smoothly. Module loading, parsing, processing, graph generation (cfv_designs.GraphBuilderService), layout (cfv_designs.LayoutService), and state updates (Jotai) must be efficient to ensure interactive performance."
        metrics: {
            target_initial_load_and_render_time_moderate_flow_ms: 1000, // From cfv_models.DslModuleInput to first render
            target_layout_time_moderate_flow_ms: 500,  // ELK.js layout computation
            target_interaction_feedback_ms: 200 // e.g., selecting a node and inspector updating
        }
        verification_method: "Performance testing with sample complex flows (like casinoPlatformExample.ts). Profiling of React rendering, Jotai updates, and ELK.js layout execution using browser dev tools and React Profiler."
        source: "CascadeFlowVisualizer Library Specification, Section V.NFR1"
        applies_to: [cfv_designs.GraphBuilderService, cfv_designs.LayoutService, cfv_designs.ModuleRegistryService]
    }

    nfr NFR2_Extensibility {
        id: "CFV_NFR_EXT_001"
        statement: "The library must be highly extensible via consumer-provided React components for nodes (`props.customNodeTypes`), edges (`props.customEdgeTypes`), inspector tabs (`props.renderInspector*Tab`), and callbacks for actions/data fetching (`props.requestModule`, `props.onSaveModule`, `props.onRunTestCase`, etc.). See cfv_consumer_directives.dspec.md for guidance."
        verification_method: "Review of API design (cfv_models.CascadeFlowVisualizerProps) for extensibility points. Creation of example customizations (e.g., custom node displaying additional DSL info, custom inspector tab)."
        source: "CascadeFlowVisualizer Library Specification, Section V.NFR2"
        applies_to: [cfv_models.CascadeFlowVisualizerProps, cfv_consumer_directives.InspectorTabImplementation]
    }

    nfr NFR3_Maintainability {
        id: "CFV_NFR_MAIN_001"
        statement: "Codebase should be well-structured (following cfv_designs.dspec.md), written in TypeScript, internally documented (TSDoc for public APIs and key functions), and reasonably easy to debug/extend by developers familiar with React, Jotai, and TypeScript. Adherence to cfv_internal_directives.dspec.md for AI-generated code is expected."
        verification_method: "Code reviews; Static analysis (ESLint, TypeScript strict mode); Cyclomatic complexity checks; Developer feedback during extension or bug fixing."
        source: "CascadeFlowVisualizer Library Specification, Section V.NFR3"
        applies_to: [cfv_internal_directives.CFV_TypeScript_React_Jotai_Generator_Directives]
    }

    nfr NFR4_Reactivity {
        id: "CFV_NFR_REACT_001"
        statement: "Visualization must reactively update to changes in input props (e.g., `props.initialModules`, `props.mode`, `props.traceData`) or internal state changes from user interaction (e.g., node selection, sidebar navigation), driven by Jotai state updates."
        verification_method: "Test cases (cfv_tests.dspec.md) for various prop and state change scenarios ensuring UI updates correctly and efficiently."
        source: "CascadeFlowVisualizer Library Specification, Section V.NFR4"
        applies_to: [cfv_designs.CascadeFlowVisualizerComponent, cfv_designs.SelectionService]
    }

    nfr NFR5_TypeScript {
        id: "CFV_NFR_TS_001"
        statement: "Library must be written in TypeScript with clear, comprehensive, and accurate type definitions (cfv_models.dspec.md) for its public API (cfv_models.CascadeFlowVisualizerProps and related models) and key internal structures. Strict TypeScript compiler options should be enabled."
        verification_method: "Type checking during build (`tsc --noEmit`); Review of exported type definitions for clarity and correctness; dts-lint tests if applicable."
        source: "CascadeFlowVisualizer Library Specification, Section V.NFR5"
        applies_to: [cfv_models.CascadeFlowVisualizerProps, cfv_internal_directives.CFV_TypeScript_React_Jotai_Generator_Directives]
    }

    nfr NFR6_Accessibility_Shell {
        id: "CFV_NFR_A11Y_001"
        statement: "The library's own shell UI components (e.g., sidebars, tab structures provided by the visualizer itself, if any, before consumer renderers take over) should strive for WCAG AA compliance (keyboard navigation, ARIA attributes for roles and states, color contrast for default theme elements). Consumer-provided renderers are the responsibility of the consumer for their own accessibility."
        verification_method: "Accessibility audits (manual and automated tools like Axe) on library shell components. Keyboard navigation testing."
        source: "CascadeFlowVisualizer Library Specification, Section V.NFR6"
        applies_to: [cfv_designs.CascadeFlowVisualizerComponent]
    }
}