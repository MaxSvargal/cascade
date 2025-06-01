// cfv_policies.dspec
// Defines Non-Functional Requirements (NFRs) and key architectural decisions as policies.

// --- Architectural Philosophy & Key Decisions as Policies (from Section II) ---
policy cfv_policies.Arch_ReactFlowElkjsFoundation {
    title: "React Flow + elkjs-reactflow Foundation"
    nfr UseReactFlowAndElkjs {
        statement: "Leverage the React Flow library for core graph rendering and basic interactions, and `elkjs-reactflow` for automatic, sophisticated graph layout using the ELK (Eclipse Layout Kernel) algorithm. ELK.js is the sole supported layout algorithm."
        verification_method: "Code review for library usage; Visual inspection of layout."
        source: "CascadeFlowVisualizer Library Specification, Section II"
    }
}

policy cfv_policies.Arch_ModuleCentric {
    title: "Module-Centric Architecture"
    nfr ModuleAwareness {
        statement: "The library is fundamentally aware of Cascade DSL modules (`namespace`). It manages loading, parsing, and resolving definitions across multiple modules, respecting `imports` and aliases."
        verification_method: "Test cases involving multi-module DSLs with imports."
        source: "CascadeFlowVisualizer Library Specification, Section II"
    }
}

policy cfv_policies.Arch_ComponentSchemasUpfront {
    title: "Component Schemas Provided Upfront"
    nfr PreloadedSchemas {
        statement: "All known component JSON Schemas (for `config`, `inputs`, `outputs`) are provided initially via a prop (`props.componentSchemas`). The library will not fetch schemas on demand. Schema resolution is synchronous and predictable."
        verification_method: "API contract review; Test cases ensuring no on-demand schema fetching."
        source: "CascadeFlowVisualizer Library Specification, Section II"
    }
}

policy cfv_policies.Arch_EditingTradeoffsV1 {
    title: "V1 Editing Preservation Trade-offs"
    nfr EditingDataPreservation {
        statement: "Order of elements in YAML sequences will be preserved during editing. Order of keys in YAML mappings might be canonicalized. Comments and nuanced YAML formatting are likely to be lost or altered in V1 editing for a simpler initial implementation."
        verification_method: "Testing of save/load cycles for YAML element order; Documentation of formatting limitations."
        source: "CascadeFlowVisualizer Library Specification, Section II"
    }
}

policy cfv_policies.Arch_SubflowsNavigableNodes {
    title: "Sub-flows Rendered as Navigable Nodes"
    nfr SubflowVisualization {
        statement: "Steps invoking sub-flows (`StdLib:SubFlowInvoker`) will be rendered as distinct, single nodes. These nodes provide summary information and act as navigation points. No inline rendering of sub-flow steps."
        verification_method: "Visual inspection; Test cases for sub-flow navigation."
        source: "CascadeFlowVisualizer Library Specification, Section II"
    }
}

policy cfv_policies.Arch_TraceOverlaysStateDriven {
    title: "Trace Overlays are State-Driven"
    nfr TraceDisplayMethod {
        statement: "Visualization of execution traces is not real-time streaming but a distinct display mode. The visualizer re-renders with trace data when `props.traceData` changes."
        verification_method: "Testing trace display updates based on prop changes."
        source: "CascadeFlowVisualizer Library Specification, Section II"
    }
}

policy cfv_policies.Arch_ExternalContextVarParsing {
    title: "Externalized Context Variable Parsing"
    nfr ContextVarParsingDelegation {
        statement: "Identification of context variable usages within DSL strings is delegated to an external utility function provided via `props.parseContextVariables`."
        verification_method: "API contract review; Test cases using the prop function."
        source: "CascadeFlowVisualizer Library Specification, Section II"
    }
}

policy cfv_policies.Arch_JotaiStateManagement {
    title: "Jotai for State Management"
    nfr UseJotai {
        statement: "Utilize Jotai for global and shared state within the library, promoting atomicity, granular reactivity, and reduced complexity."
        verification_method: "Code review for Jotai usage patterns."
        source: "CascadeFlowVisualizer Library Specification, Section II"
    }
}

policy cfv_policies.Arch_ExternalizeVisualsAndBehavior {
    title: "Externalization of Visuals & Behavior"
    nfr CoreResponsibilityFocus {
        statement: "Library's core responsibility is parsing DSL, building graph data, managing layout, selection, and editing workflows. Rendering of specific node/edge types and inspector content is delegated to consumer via props."
        verification_method: "API contract review demonstrating extensive use of render props and customization props."
        source: "CascadeFlowVisualizer Library Specification, Section II"
    }
}

policy cfv_policies.Arch_FunctionalPuritySideEffectIsolation {
    title: "Functional Purity & Side Effect Isolation"
    nfr CodeDesignPrinciples {
        statement: "Core graph building and data transformation logic are designed as pure functions where possible. Side effects are managed at the component's boundaries."
        verification_method: "Code review of key data transformation services."
        source: "CascadeFlowVisualizer Library Specification, Section II"
    }
}


// --- Non-Functional Requirements (from Section V) ---
policy cfv_policies.NFRs {
    title: "Non-Functional Requirements for CascadeFlowVisualizer"

    nfr NFR1_Performance {
        statement: "Render flows of moderate complexity (50-100 nodes) smoothly. Module loading, parsing, processing, layout, and state updates must be efficient."
        metrics: {
            target_render_time_moderate_flow_ms: 500, // Example metric
            target_layout_time_moderate_flow_ms: 300  // Example metric
        }
        verification_method: "Performance testing with sample complex flows; Profiling of rendering and state updates."
        source: "CascadeFlowVisualizer Library Specification, Section V.NFR1"
    }

    nfr NFR2_Extensibility {
        statement: "The library must be highly extensible via consumer-provided React components for nodes/edges, inspector tabs, and callbacks for actions/data fetching."
        verification_method: "Review of API design for extensibility points; Creation of example customizations."
        source: "CascadeFlowVisualizer Library Specification, Section V.NFR2"
    }

    nfr NFR3_Maintainability {
        statement: "Codebase should be well-structured, TypeScript, internally documented, and reasonably easy to debug/extend."
        verification_method: "Code reviews; Static analysis; Developer feedback."
        source: "CascadeFlowVisualizer Library Specification, Section V.NFR3"
    }

    nfr NFR4_Reactivity {
        statement: "Visualization must reactively update to changes in input props or internal state changes from user interaction."
        verification_method: "Test cases for various prop and state change scenarios ensuring UI updates."
        source: "CascadeFlowVisualizer Library Specification, Section V.NFR4"
    }

    nfr NFR5_TypeScript {
        statement: "Library must be written in TypeScript with clear, comprehensive, and accurate type definitions for its public API and key internal structures."
        verification_method: "Type checking during build; Review of exported type definitions."
        source: "CascadeFlowVisualizer Library Specification, Section V.NFR5"
    }

    nfr NFR6_Accessibility {
        statement: "Library's own shell UI components should strive for WCAG AA compliance (keyboard navigation, screen reader compatibility, color contrast)."
        verification_method: "Accessibility audits (manual and automated tools) on library shell components."
        source: "CascadeFlowVisualizer Library Specification, Section V.NFR6"
    }
}