// cfv_glossary.dspec.md

glossary cfv_glossary.CascadeFlowVisualizerTerms {
    title: "Glossary for CascadeFlowVisualizer Library"
    description: "Defines key terms used in the CascadeFlowVisualizer specifications and documentation."

    term DslModuleRepresentation {
        definition: "The internal data structure within the visualizer that holds all information about a loaded Cascade DSL module, including its raw content, parsed structure, extracted definitions (flows, components, context variables), import declarations, and any parsing or validation errors associated with that module. Referenced as `cfv_models.DslModuleRepresentation`."
    }
    term GraphDataGeneration {
        definition: "The process, typically performed by the `cfv_designs.GraphBuilderService`, of transforming parsed Cascade DSL definitions and other state (like trace data or test results) into the `nodes` and `edges` data structures required by the React Flow library for visualization."
    }
    term ResolvedComponentInfo {
        definition: "An object (`cfv_models.ResolvedComponentInfo`) returned by the `cfv_designs.ModuleRegistryService` that provides details about a `component_ref` found in the DSL. It includes the FQN of the base component type, the original Named Component Definition (if applicable), the FQN of the module where the component was defined, and a flag indicating if it was a Named Component."
    }
    term SystemOverviewGraph {
        definition: "A visualization mode in the Main Canvas that displays a high-level graph of all loaded flows as nodes, their trigger sources, and the invocation relationships (sub-flow calls) between them."
    }
    term FlowDetailGraph {
        definition: "A visualization mode in the Main Canvas that displays the detailed internal structure of a single selected Cascade flow, including its trigger, steps, and the data/control flow connections between them. Can be augmented with trace or test result overlays."
    }
    term ConsumerProvidedRenderer {
        definition: "A React component supplied by the application consuming the CascadeFlowVisualizer library via props (e.g., `customNodeTypes`, `customEdgeTypes`, `renderInspectorPropertiesTab`). These components are responsible for the actual visual rendering of graph elements or inspector tab content, based on data provided by the library."
    }
    term ELKLayoutAlgorithm {
        definition: "The Eclipse Layout Kernel (ELK) algorithm, used via `elkjs-reactflow` or a direct ELK.js integration, to automatically arrange nodes and edges in the graph visualizations for clarity and aesthetic appeal."
    }
    term InspectorPropertiesActions {
        definition: "An object (`cfv_models.InspectorPropertiesActions`) containing callback functions, like `requestSave`, passed by the visualizer to the consumer-rendered 'Properties/Config' tab. These actions allow the consumer's UI to trigger operations within the visualizer, such as saving edited configurations."
    }
    term IModuleRegistry {
        definition: "A TypeScript interface (`cfv_models.IModuleRegistry`) exposed by the visualizer's `cfv_designs.ModuleRegistryService`. It provides methods for consumer-rendered components (e.g., inspector tabs) to synchronously query information about loaded DSL modules, definitions, and component schemas."
    }
}