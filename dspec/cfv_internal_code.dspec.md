// cfv_internal_code.dspec.md
// Internal code specifications for CascadeFlowVisualizer services and components.

// --- ModuleRegistryService Logic ---

code cfv_internal_code.ModuleRegistryService_SharedAtoms {
    title: "Jotai Atoms for Module Registry State"
    part_of_design: cfv_designs.ModuleRegistryService
    language: "TypeScript" // Not React, just TS for atoms
    implementation_location: { filepath: "state/moduleRegistryAtoms.ts" }
    // This artifact groups atom definitions. The AI agent will use directives to generate them.
    // Example of how individual atoms could be specified for clarity, though directives might infer from usage.

    defines_atom DslModuleRepresentationsAtom {
        description: "Stores all loaded DslModuleRepresentations, keyed by FQN."
        type: "Record<string, cfv_models.DslModuleRepresentation>" // Record<FQN, ModuleData>
        initial_value: "{}"
        // Atom name for directive: DslModuleRepresentations
    }

    defines_atom ComponentSchemasAtom {
        description: "Stores all pre-loaded component schemas, keyed by component FQN."
        type: "Record<string, cfv_models.ComponentSchema>"
        initial_value: "{}" // Populated from props.componentSchemas
        // Atom name for directive: ComponentSchemas
    }

    defines_atom ActiveModuleLoadRequestsAtom {
        description: "Tracks FQNs of modules currently being loaded to prevent duplicate requests."
        type: "Record<string, boolean>" // FQN -> isLoading
        initial_value: "{}"
    }
    // SVS Rule: All types (e.g., cfv_models.DslModuleRepresentation) must be valid qualified names from cfv_models.dspec.
}

code cfv_internal_code.ModuleRegistryService_InitializeFromProps {
    title: "Initialize ModuleRegistryService State from Props"
    part_of_design: cfv_designs.ModuleRegistryService
    language: "TypeScriptReact" // Likely part of a React hook or effect in the main component
    implementation_location: {
        filepath: "hooks/useModuleRegistryInitializer.ts", // Example: a custom hook
        entry_point_name: "useModuleRegistryInitializer",
        entry_point_type: "function_hook"
    }
    signature: "(props: { initialModules?: cfv_models.DslModuleInput[], componentSchemas?: Record<string, cfv_models.ComponentSchema> }) => void"
    // This hook would use set(DslModuleRepresentationsAtom, ...) and set(ComponentSchemasAtom, ...)
    detailed_behavior: `
        // Human Review Focus: Correct initialization logic, props handling.
        // AI Agent Target: Generate a React useEffect hook.

        // 1. Initialize ComponentSchemasAtom from props.componentSchemas
        IF props.componentSchemas IS_DEFINED THEN
            WRITE_ATOM ComponentSchemasAtom WITH props.componentSchemas
        END_IF

        // 2. Process initialModules from props.initialModules
        IF props.initialModules IS_DEFINED THEN
            // This might be complex: loop, parse, update DslModuleRepresentationsAtom.
            // For simplicity here, assume it calls another detailed 'code' spec unit for parsing each module.
            DECLARE initialModuleReps AS Record<string, cfv_models.DslModuleRepresentation> = {}
            FOR_EACH moduleInput IN props.initialModules
                // Conceptual call to a parsing/processing function (which itself would be a 'code' spec)
                CALL self.ProcessSingleModuleInput WITH { moduleInput: moduleInput, isInitialLoad: true } ASSIGN_TO processedModuleRep
                IF processedModuleRep IS_NOT_NULL THEN
                    ASSIGN initialModuleReps[moduleInput.fqn] = processedModuleRep
                END_IF
            END_FOR
            WRITE_ATOM DslModuleRepresentationsAtom WITH initialModuleReps
        END_IF

        // This hook runs once on mount or when relevant props change.
        // USE_EFFECT hook structure implied by entry_point_type: "function_hook" and signature.
        // Dependencies: props.initialModules, props.componentSchemas
    `
    dependencies: [
        "cfv_internal_code.ModuleRegistryService_SharedAtoms.DslModuleRepresentationsAtom",
        "cfv_internal_code.ModuleRegistryService_SharedAtoms.ComponentSchemasAtom",
        "self.ProcessSingleModuleInput" // Reference to another code unit within this service design
    ]
}

code cfv_internal_code.ModuleRegistryService_RequestAndProcessModule {
    title: "Handle Asynchronous Module Request and Processing"
    part_of_design: cfv_designs.ModuleRegistryService
    language: "TypeScript" // Core logic, might be used in a React hook or Jotai atom effect
    implementation_location: {
        filepath: "services/moduleRegistryServiceLogic.ts", // Example utility file
        entry_point_name: "requestAndProcessModule",
        entry_point_type: "async_function"
    }
    signature: "(fqn: string, props: { requestModule: cfv_models.CascadeFlowVisualizerProps['requestModule'], onModuleLoadError?: cfv_models.CascadeFlowVisualizerProps['onModuleLoadError'] }, getAtoms: JotaiGetFunction, setAtoms: JotaiSetFunction) => Promise<cfv_models.DslModuleRepresentation | null>"
    // JotaiGetFunction, JotaiSetFunction are conceptual types for get/set from Jotai context passed in.

    preconditions: [
        "fqn is a valid string.",
        "props.requestModule is a valid function."
    ]
    postconditions: [
        "If module loaded and processed successfully, DslModuleRepresentationsAtom is updated and the representation is returned.",
        "If module already loading (in ActiveModuleLoadRequestsAtom), returns null or existing promise.",
        "If loading/processing fails, DslModuleRepresentationsAtom is updated with error status, onModuleLoadError is called if provided, and null is returned."
    ]
    detailed_behavior: `
        // Human Review Focus: Correct sequencing, error handling, atom updates.
        // AI Agent Target: Generate an async TypeScript function.

        // 1. Check if already loading or loaded
        DECLARE activeLoads = READ_ATOM ActiveModuleLoadRequestsAtom // Using getAtoms
        IF activeLoads[fqn] IS_TRUE THEN
            // Optional: Could return a promise that resolves when loading finishes if concurrent requests for same FQN are possible.
            // For now, simple: prevent re-fetch.
            LOG "Module ${fqn} is already being loaded."
            RETURN_VALUE null
        END_IF

        DECLARE loadedModules = READ_ATOM DslModuleRepresentationsAtom // Using getAtoms
        IF loadedModules[fqn] IS_PRESENT AND loadedModules[fqn].status IS_NOT_ERROR THEN
            RETURN_VALUE loadedModules[fqn]
        END_IF

        // 2. Mark as loading
        WRITE_ATOM ActiveModuleLoadRequestsAtom WITH_FUNCTION (prev => ({ ...prev, [fqn]: true })) // Using setAtoms

        // 3. Request module content
        DECLARE requestedModuleData AS cfv_models.RequestModuleResult | null
        TRY
            CALL props.requestModule WITH { fqn: fqn } ASSIGN_TO requestedModuleData
        CATCH_ERROR e
            LOG "props.requestModule failed for ${fqn}: ${e.message}"
            IF props.onModuleLoadError IS_DEFINED THEN
                CALL props.onModuleLoadError WITH { fqn: fqn, error: e }
            END_IF
            // Update DslModuleRepresentationsAtom with error status
            DECLARE errorRep AS cfv_models.DslModuleRepresentation
            CREATE_INSTANCE cfv_models.DslModuleRepresentation WITH { fqn: fqn, rawContent: "", status: 'error', errors: [{ message: e.message }] } ASSIGN_TO errorRep
            WRITE_ATOM DslModuleRepresentationsAtom WITH_FUNCTION (prev => ({ ...prev, [fqn]: errorRep })) // Using setAtoms
            WRITE_ATOM ActiveModuleLoadRequestsAtom WITH_FUNCTION (prev => ({ ...prev, [fqn]: false })) // Using setAtoms
            RETURN_VALUE null
        END_TRY

        IF requestedModuleData IS_NULL THEN
            LOG "Module ${fqn} not found or props.requestModule returned null."
            // Similar error handling as above, potentially different error message
            IF props.onModuleLoadError IS_DEFINED THEN
                CALL props.onModuleLoadError WITH { fqn: fqn, error: CREATE_INSTANCE Error WITH { message: "Module not found by host."} }
            END_IF
            DECLARE notFoundRep AS cfv_models.DslModuleRepresentation
            CREATE_INSTANCE cfv_models.DslModuleRepresentation WITH { fqn: fqn, rawContent: "", status: 'error', errors: [{ message: "Module not found by host." }] } ASSIGN_TO notFoundRep
            WRITE_ATOM DslModuleRepresentationsAtom WITH_FUNCTION (prev => ({ ...prev, [fqn]: notFoundRep }))
            WRITE_ATOM ActiveModuleLoadRequestsAtom WITH_FUNCTION (prev => ({ ...prev, [fqn]: false }))
            RETURN_VALUE null
        END_IF

        // 4. Process the loaded module content (delegate to another 'code' unit)
        DECLARE finalModuleRep AS cfv_models.DslModuleRepresentation | null
        // ProcessSingleModuleInput would handle parsing, extracting definitions, imports resolution (recursively calling this fn for imports)
        CALL self.ProcessSingleModuleInput WITH { moduleInput: requestedModuleData, isInitialLoad: false, getAtoms: getAtoms, setAtoms: setAtoms, props: props } ASSIGN_TO finalModuleRep
            // Note: ProcessSingleModuleInput will update DslModuleRepresentationsAtom internally.

        // 5. Unmark as loading
        WRITE_ATOM ActiveModuleLoadRequestsAtom WITH_FUNCTION (prev => ({ ...prev, [fqn]: false }))

        RETURN_VALUE finalModuleRep
    `
    dependencies: [
        "cfv_internal_code.ModuleRegistryService_SharedAtoms.DslModuleRepresentationsAtom",
        "cfv_internal_code.ModuleRegistryService_SharedAtoms.ActiveModuleLoadRequestsAtom",
        "self.ProcessSingleModuleInput", // Assumed to be another code spec
        "props.requestModule", // From signature
        "props.onModuleLoadError" // From signature
    ]
    throws_errors: [ /* Implicitly handles errors from props.requestModule or parsing */ ]
}


// --- Main CascadeFlowVisualizer Component Logic (Simplified Example) ---

code cfv_internal_code.CascadeFlowVisualizerComponent_Main {
    title: "Main <CascadeFlowVisualizer /> React Component"
    part_of_design: cfv_designs.CascadeFlowVisualizerComponent
    language: "TypeScriptReact"
    implementation_location: { filepath: "components/CascadeFlowVisualizer.tsx", entry_point_name: "CascadeFlowVisualizer" }
    // Signature derived from cfv_models.CascadeFlowVisualizerProps
    signature: "React.FC<cfv_models.CascadeFlowVisualizerProps>"
    applies_nfrs: [cfv_policies.NFRs.NFR1_Performance, cfv_policies.NFRs.NFR4_Reactivity]

    detailed_behavior: `
        // Human Review Focus: Correct props usage, Jotai integration, overall component structure.
        // AI Agent Target: Generate the main React component.

        // 1. Initialize internal state and services from props
        //    - CALL cfv_internal_code.ModuleRegistryService_InitializeFromProps HOOK WITH { initialModules: props.initialModules, componentSchemas: props.componentSchemas }
        //    - (Similar initialization for other services like SelectionService, NavigationStateService atoms based on props.mode, props.designData etc.)

        // 2. Setup derived state atoms (e.g., for current graph nodes/edges)
        //    - DEFINE_DERIVED_ATOM_READ_ONLY currentGraphDataAtom WITH_GETTER_LOGIC
        //        currentFlowFqn = READ_ATOM currentFlowFqnAtom
        //        mode = props.mode
        //        IF currentFlowFqn AND mode IS 'design' THEN
        //            CALL cfv_internal_code.GraphBuilderService.generateFlowDetailGraphData WITH { fqn: currentFlowFqn, ... } ASSIGN_TO graphData
        //            RETURN graphData
        //        ELSE_IF mode IS 'systemOverview' THEN
        //            CALL cfv_internal_code.GraphBuilderService.generateSystemOverviewGraphData WITH { ... } ASSIGN_TO graphData
        //            RETURN graphData
        //        ELSE_IF mode IS 'trace' AND props.traceData IS_PRESENT THEN
        //            CALL cfv_internal_code.GraphBuilderService.generateFlowDetailGraphData WITH { fqn: props.traceData.flowFqn, trace: props.traceData, ... } ASSIGN_TO graphData
        //            RETURN graphData
        //        ELSE
        //            RETURN { nodes: [], edges: [] } // Empty graph
        //        END_IF
        //    END_DEFINE_ATOM

        // 3. Setup effect for props.onViewChange
        //    - READ_ATOM currentFlowFqnAtom ASSIGN_TO currentFlowFqnForEffect
        //    - READ_ATOM systemViewActiveAtom ASSIGN_TO systemViewActiveForEffect
        //    - USE_EFFECT () => {
        //        IF props.onViewChange IS_DEFINED THEN
        //            CALL props.onViewChange WITH { mode: props.mode, currentFlowFqn: currentFlowFqnForEffect, systemViewActive: systemViewActiveForEffect }
        //        END_IF
        //      } WITH_DEPS [props.mode, currentFlowFqnForEffect, systemViewActiveForEffect, props.onViewChange]


        // 4. Render UI Layout (Conceptual JSX structure)
        //    RENDER_JSX
        //    <div className={props.className} style={props.style}>
        //        <LeftSidebarComponent>
        //            <ModulesListRenderer /> // Uses DslModuleRepresentationsAtom
        //            <FlowsListRenderer />   // Uses loaded flow definitions
        //            // ... other list renderers
        //        </LeftSidebarComponent>
        //        <MainCanvasComponent>
        //            // ReactFlowProvider and ReactFlow instance
        //            // nodes={currentGraphData.nodes}, edges={currentGraphData.edges}
        //            // nodeTypes={props.customNodeTypes}, edgeTypes={props.customEdgeTypes}
        //            // onNodeClick={handleNodeClick -> updates selectedElementAtom via SelectionService logic}
        //            // elkOptions={props.elkOptions} -> passed to ELKLayoutEngine
        //        </MainCanvasComponent>
        //        <RightSidebarComponent>
        //            // Tabs rendered using props.renderInspectorXYZTab functions
        //            // Pass selectedElementAtom data, moduleRegistry interface, and actions objects to tabs
        //        </RightSidebarComponent>
        //    </div>

        // SVS Rule: All atom names must correspond to defined 'defines_atom' in relevant 'code' specs or be implicitly defined by directives.
        // SVS Rule: All service calls (e.g., GraphBuilderService.generateFlowDetailGraphData) must correspond to valid 'code' spec qualified names.
    `
    dependencies: [ // High-level dependencies, more granular ones in detailed_behavior
        "cfv_internal_code.ModuleRegistryService_InitializeFromProps",
        "cfv_internal_code.GraphBuilderService_GenerateFlowDetailGraphData", // Example
        "cfv_internal_code.GraphBuilderService_GenerateSystemOverviewGraphData", // Example
        "cfv_internal_code.SelectionService_HandleNodeClick", // Example
        "cfv_internal_code.ModuleRegistryService_SharedAtoms.currentFlowFqnAtom", // Example atom
        "cfv_internal_code.NavigationStateService_SharedAtoms.systemViewActiveAtom" // Example atom
    ]
}

// --- Layout Service Logic (New) ---

code cfv_internal_code.LayoutService_AutomaticLayout {
    title: "ELK.js Automatic Graph Layout Service"
    part_of_design: cfv_designs.LayoutService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/layoutService.ts",
        entry_point_name: "layoutNodes",
        entry_point_type: "async_function"
    }
    signature: "(nodes: Node[], edges: Edge[], options?: cfv_models.LayoutOptions) => Promise<{ nodes: Node[]; edges: Edge[] }>"
    
    detailed_behavior: `
        // Human Review Focus: ELK.js integration, layout algorithm configuration, node sizing.
        // AI Agent Target: Generate automatic graph layout using ELK.js with left-to-right defaults.

        // 1. Validate inputs and set defaults with left-to-right orientation
        IF nodes.length IS_ZERO THEN
            RETURN_VALUE { nodes, edges }
        END_IF
        
        DECLARE defaultLayoutOptions = {
            algorithm: "layered",
            direction: "RIGHT", // Default to left-to-right
            spacing: {
                nodeNode: 80,
                edgeNode: 20,
                edgeEdge: 10,
                layerSpacing: 100
            },
            nodeSize: {
                width: 200,
                height: 80,
                calculateFromContent: true,
                minWidth: 150,
                maxWidth: 300,
                minHeight: 60,
                maxHeight: 120,
                padding: { top: 8, right: 12, bottom: 8, left: 12 }
            },
            nodeStyle: {
                containBackground: true,
                borderRadius: 8,
                borderWidth: 1,
                shadowEnabled: true,
                textAlignment: "center"
            }
        }
        
        DECLARE layoutOptions = MERGE_OBJECTS(defaultLayoutOptions, options)
        
        // 2. Calculate node sizes based on content if enabled
        IF layoutOptions.nodeSize.calculateFromContent IS_TRUE THEN
            FOR_EACH node IN nodes
                DECLARE calculatedSize = CALL calculateNodeSizeWithStyling WITH node, layoutOptions.nodeSize
                ASSIGN node.style = MERGE_OBJECTS(node.style, calculatedSize, layoutOptions.nodeStyle)
            END_FOR
        END_IF
        
        // 3. Convert React Flow format to ELK format
        DECLARE elkNodes = MAP nodes TO elkNode FORMAT WITH layoutOptions
        DECLARE elkEdges = MAP edges TO elkEdge FORMAT
        
        // 4. Configure ELK layout options based on algorithm and direction
        DECLARE elkLayoutOptions = BUILD_ELK_OPTIONS_WITH_DIRECTION(layoutOptions)
        
        // 5. Execute ELK layout
        TRY
            DECLARE layoutedGraph = AWAIT elk.layout WITH elkGraph AND elkLayoutOptions
            DECLARE layoutedNodes = APPLY_ELK_POSITIONS_TO_REACT_FLOW_NODES(layoutedGraph, nodes)
            RETURN_VALUE { nodes: layoutedNodes, edges }
        CATCH_ERROR error
            LOG "ELK layout failed, using original positions: ${error}"
            RETURN_VALUE { nodes, edges }
        END_TRY
    `
    dependencies: [
        "elkjs/lib/elk.bundled.js",
        "reactflow.Node",
        "reactflow.Edge"
    ]
}

code cfv_internal_code.LayoutService_ContentBasedSizing {
    title: "Enhanced Content-Based Node Sizing with Styling"
    part_of_design: cfv_designs.LayoutService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/layoutService.ts",
        entry_point_name: "calculateNodeSizeWithStyling",
        entry_point_type: "function"
    }
    signature: "(node: Node, sizeOptions: cfv_models.NodeSizeOptions) => { width: number; height: number; style: object }"
    
    detailed_behavior: `
        // Calculate node dimensions based on content with enhanced styling support
        DECLARE baseWidth = sizeOptions.width OR 200
        DECLARE baseHeight = sizeOptions.height OR 80
        DECLARE padding = sizeOptions.padding OR { top: 8, right: 12, bottom: 8, left: 12 }
        
        IF node.data?.label IS_DEFINED THEN
            // Calculate text dimensions
            DECLARE textLength = node.data.label.length
            DECLARE estimatedTextWidth = textLength * 8 + padding.left + padding.right
            DECLARE calculatedWidth = MAX(baseWidth, estimatedTextWidth)
            
            // Calculate height based on content
            DECLARE calculatedHeight = baseHeight + padding.top + padding.bottom
            IF node.data?.resolvedComponentFqn THEN calculatedHeight += 20
            IF node.data?.executionStatus THEN calculatedHeight += 20
            IF node.data?.error THEN calculatedHeight += 20
            IF node.data?.invokedFlowFqn THEN calculatedHeight += 20
            
            // Apply min/max constraints
            DECLARE finalWidth = CLAMP(calculatedWidth, sizeOptions.minWidth OR 150, sizeOptions.maxWidth OR 300)
            DECLARE finalHeight = CLAMP(calculatedHeight, sizeOptions.minHeight OR 60, sizeOptions.maxHeight OR 120)
            
            // Generate styling that contains background within boundaries
            DECLARE nodeStyle = {
                width: finalWidth,
                height: finalHeight,
                padding: `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`,
                boxSizing: "border-box",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center"
            }
            
            RETURN_VALUE {
                width: finalWidth,
                height: finalHeight,
                style: nodeStyle
            }
        END_IF
        
        RETURN_VALUE { 
            width: baseWidth, 
            height: baseHeight,
            style: {
                width: baseWidth,
                height: baseHeight,
                padding: `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`,
                boxSizing: "border-box"
            }
        }
    `
}

code cfv_internal_code.LayoutService_LayoutPresets {
    title: "Layout Presets for Different View Types"
    part_of_design: cfv_designs.LayoutService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/layoutService.ts",
        entry_point_name: "layoutPresets",
        entry_point_type: "constant"
    }
    signature: "Record<string, cfv_models.LayoutOptions>"
    
    detailed_behavior: `
        // Define layout presets optimized for different visualization modes
        DECLARE layoutPresets = {
            flowDetail: {
                algorithm: "layered",
                direction: "RIGHT", // Left-to-right flow
                spacing: {
                    nodeNode: 80,
                    edgeNode: 20,
                    layerSpacing: 120
                },
                nodeSize: {
                    calculateFromContent: true,
                    minWidth: 180,
                    maxWidth: 280,
                    padding: { top: 12, right: 16, bottom: 12, left: 16 }
                }
            },
            systemOverview: {
                algorithm: "layered",
                direction: "RIGHT", // Left-to-right system flow
                spacing: {
                    nodeNode: 100,
                    edgeNode: 30,
                    layerSpacing: 150
                },
                nodeSize: {
                    calculateFromContent: true,
                    minWidth: 200,
                    maxWidth: 300,
                    padding: { top: 16, right: 20, bottom: 16, left: 20 }
                }
            },
            compact: {
                algorithm: "layered",
                direction: "RIGHT",
                spacing: {
                    nodeNode: 60,
                    edgeNode: 15,
                    layerSpacing: 80
                },
                nodeSize: {
                    calculateFromContent: true,
                    minWidth: 120,
                    maxWidth: 200,
                    padding: { top: 8, right: 12, bottom: 8, left: 12 }
                }
            }
        }
        
        RETURN_VALUE layoutPresets
    `
}

// --- Trace Visualization Service Logic (New) ---

code cfv_internal_code.TraceVisualizationService_EnhanceNodes {
    title: "Enhance Nodes with Trace Data Overlays"
    part_of_design: cfv_designs.TraceVisualizationService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/traceVisualizationService.ts",
        entry_point_name: "enhanceNodesWithTrace",
        entry_point_type: "function"
    }
    signature: "(nodes: Node[], traceData: cfv_models.FlowExecutionTrace, options?: cfv_models.TraceVisualizationOptions) => Node<EnhancedNodeData>[]"
    
    detailed_behavior: `
        // Human Review Focus: Trace data correlation, critical path calculation, styling enhancements.
        // AI Agent Target: Generate trace-enhanced node data.

        // 1. Calculate critical path if requested
        DECLARE criticalPath = SET<string>()
        IF options.highlightCriticalPath IS_TRUE THEN
            ASSIGN criticalPath = CALL calculateCriticalPath WITH traceData
        END_IF
        
        // 2. Enhance each node with trace overlay
        RETURN_VALUE MAP nodes TO enhancedNode WHERE
            DECLARE stepTrace = FIND traceData.steps WHERE step.stepId EQUALS node.id
            
            IF stepTrace IS_NULL THEN
                RETURN_VALUE node
            END_IF
            
            DECLARE traceOverlay = BUILD_TRACE_OVERLAY(stepTrace, options, criticalPath)
            DECLARE enhancedStyle = GET_TRACE_BASED_STYLING(stepTrace, traceOverlay)
            
            RETURN_VALUE {
                ...node,
                data: { ...node.data, traceOverlay },
                style: { ...node.style, ...enhancedStyle }
            }
        END_MAP
    `
    dependencies: [
        "cfv_models.FlowExecutionTrace",
        "cfv_models.TraceVisualizationOptions"
    ]
}

code cfv_internal_code.TraceVisualizationService_CriticalPath {
    title: "Calculate Critical Path Through Execution"
    part_of_design: cfv_designs.TraceVisualizationService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/traceVisualizationService.ts",
        entry_point_name: "calculateCriticalPath",
        entry_point_type: "function"
    }
    signature: "(traceData: cfv_models.FlowExecutionTrace) => Set<string>"
    
    detailed_behavior: `
        // Find the longest execution path by duration
        DECLARE stepsByDuration = SORT traceData.steps BY durationMs DESCENDING
        
        // Add the top 20% longest-running steps to critical path
        DECLARE criticalCount = MAX(1, CEIL(stepsByDuration.length * 0.2))
        DECLARE criticalPath = SET<string>()
        
        FOR i FROM 0 TO criticalCount
            ADD stepsByDuration[i].stepId TO criticalPath
        END_FOR
        
        RETURN_VALUE criticalPath
    `
}

// --- YAML Reconstruction Service Logic (New) ---

code cfv_internal_code.YamlReconstructionService_ReconstructModule {
    title: "Reconstruct YAML Content from DSL Module Representation"
    part_of_design: cfv_designs.YamlReconstructionService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/yamlReconstructionService.ts",
        entry_point_name: "reconstructModuleYaml",
        entry_point_type: "function"
    }
    signature: "(moduleRep: cfv_models.DslModuleRepresentation, options?: cfv_models.ReconstructionOptions) => string"
    
    detailed_behavior: `
        // Human Review Focus: YAML structure preservation, configuration merging, error handling.
        // AI Agent Target: Generate valid YAML from module representation.

        // 1. Validate input
        IF moduleRep.parsedContent IS_NULL THEN
            THROW_ERROR "Module has no parsed content to reconstruct from"
        END_IF
        
        // 2. Return original if no modifications
        IF moduleRep.definitions IS_NULL AND moduleRep.rawContent IS_DEFINED THEN
            RETURN_VALUE moduleRep.rawContent
        END_IF
        
        // 3. Build YAML structure
        DECLARE yamlStructure = {
            dsl_version: moduleRep.parsedContent.dsl_version OR "1.1",
            namespace: moduleRep.parsedContent.namespace OR moduleRep.fqn
        }
        
        // 4. Add imports if present
        IF moduleRep.imports AND moduleRep.imports.length > 0 THEN
            ASSIGN yamlStructure.imports = MAP moduleRep.imports TO importObj
        END_IF
        
        // 5. Add definitions if present
        IF moduleRep.definitions IS_DEFINED THEN
            ASSIGN yamlStructure.definitions = BUILD_DEFINITIONS_OBJECT(moduleRep.definitions)
        END_IF
        
        // 6. Add flows if present
        IF moduleRep.definitions?.flows AND moduleRep.definitions.flows.length > 0 THEN
            ASSIGN yamlStructure.flows = moduleRep.definitions.flows
        END_IF
        
        // 7. Convert to YAML string
        TRY
            RETURN_VALUE yamlStringify(yamlStructure, options)
        CATCH_ERROR error
            THROW_ERROR "Failed to reconstruct YAML: ${error.message}"
        END_TRY
    `
    dependencies: [
        "yaml.stringify",
        "cfv_models.DslModuleRepresentation",
        "cfv_models.ReconstructionOptions"
    ]
}

code cfv_internal_code.YamlReconstructionService_ApplyConfigChanges {
    title: "Apply Configuration Changes to Module Representation"
    part_of_design: cfv_designs.YamlReconstructionService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/yamlReconstructionService.ts",
        entry_point_name: "applyConfigChanges",
        entry_point_type: "function"
    }
    signature: "(moduleRep: cfv_models.DslModuleRepresentation, pathToConfig: (string | number)[], newConfigValue: any) => cfv_models.DslModuleRepresentation"
    
    detailed_behavior: `
        // Deep clone the module representation
        DECLARE updatedRep = DEEP_CLONE(moduleRep)
        
        // Navigate to the target path and update the value
        DECLARE current = updatedRep.parsedContent
        
        FOR i FROM 0 TO pathToConfig.length - 2
            DECLARE key = pathToConfig[i]
            IF current[key] IS_UNDEFINED THEN
                ASSIGN current[key] = {}
            END_IF
            ASSIGN current = current[key]
        END_FOR
        
        DECLARE finalKey = pathToConfig[pathToConfig.length - 1]
        ASSIGN current[finalKey] = newConfigValue
        
        // Also update the definitions if applicable
        IF updatedRep.definitions IS_DEFINED THEN
            APPLY_CHANGES_TO_DEFINITIONS(updatedRep.definitions, pathToConfig, newConfigValue)
        END_IF
        
        RETURN_VALUE updatedRep
    `
}

// --- Test Case Service Logic (New) ---

code cfv_internal_code.TestCaseService_GenerateTemplates {
    title: "Generate Test Case Templates for a Flow"
    part_of_design: cfv_designs.TestCaseService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/testCaseService.ts",
        entry_point_name: "generateTestCaseTemplates",
        entry_point_type: "function"
    }
    signature: "(flowFqn: string, moduleRegistry: cfv_models.IModuleRegistry) => TestCaseTemplate[]"
    
    detailed_behavior: `
        // Human Review Focus: Test case generation logic, assertion templates, mock configurations.
        // AI Agent Target: Generate comprehensive test case templates.

        DECLARE flowDefinition = CALL moduleRegistry.getFlowDefinition WITH flowFqn
        IF flowDefinition IS_NULL THEN
            RETURN_VALUE []
        END_IF
        
        DECLARE templates = []
        
        // 1. Happy path test
        ADD_TO templates {
            name: "Happy Path",
            description: "Test successful execution with valid inputs",
            triggerInputTemplate: CALL generateTriggerInputTemplate WITH flowDefinition.trigger,
            commonAssertions: [
                { targetPath: "status", expectedValue: "COMPLETED", comparison: "equals" }
            ]
        }
        
        // 2. Error handling test
        ADD_TO templates {
            name: "Error Handling",
            description: "Test error handling with invalid inputs",
            triggerInputTemplate: CALL generateInvalidInputTemplate WITH flowDefinition.trigger,
            commonAssertions: [
                { targetPath: "status", expectedValue: "FAILED", comparison: "equals" }
            ]
        }
        
        // 3. Performance test (if flow has multiple steps)
        IF flowDefinition.steps AND flowDefinition.steps.length > 3 THEN
            ADD_TO templates {
                name: "Performance",
                description: "Test execution performance within acceptable limits",
                triggerInputTemplate: CALL generateTriggerInputTemplate WITH flowDefinition.trigger,
                commonAssertions: [
                    { targetPath: "durationMs", expectedValue: 5000, comparison: "lessThan" }
                ]
            }
        END_IF
        
        RETURN_VALUE templates
    `
    dependencies: [
        "cfv_models.IModuleRegistry",
        "cfv_models.FlowTestCase"
    ]
}

code cfv_internal_code.TestCaseService_ValidateTestCase {
    title: "Validate Test Case Definition"
    part_of_design: cfv_designs.TestCaseService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/testCaseService.ts",
        entry_point_name: "validateTestCase",
        entry_point_type: "function"
    }
    signature: "(testCase: cfv_models.FlowTestCase, moduleRegistry: cfv_models.IModuleRegistry) => { isValid: boolean; errors: string[] }"
    
    detailed_behavior: `
        DECLARE errors = []
        
        // Check if flow exists
        DECLARE flowDefinition = CALL moduleRegistry.getFlowDefinition WITH testCase.flowFqn
        IF flowDefinition IS_NULL THEN
            ADD_TO errors "Flow not found: ${testCase.flowFqn}"
            RETURN_VALUE { isValid: false, errors }
        END_IF
        
        // Validate trigger input structure
        IF testCase.triggerInput IS_NULL THEN
            ADD_TO errors "Trigger input is required"
        END_IF
        
        // Validate assertions
        IF testCase.assertions IS_NULL OR testCase.assertions.length IS_ZERO THEN
            ADD_TO errors "At least one assertion is required"
        ELSE
            FOR_EACH assertion, index IN testCase.assertions
                IF assertion.targetPath IS_NULL THEN
                    ADD_TO errors "Assertion ${index + 1}: targetPath is required"
                END_IF
                IF assertion.expectedValue IS_UNDEFINED THEN
                    ADD_TO errors "Assertion ${index + 1}: expectedValue is required"
                END_IF
                IF assertion.comparison IS_NULL THEN
                    ADD_TO errors "Assertion ${index + 1}: comparison method is required"
                END_IF
            END_FOR
        END_IF
        
        // Validate component mocks
        IF testCase.componentMocks IS_DEFINED THEN
            FOR_EACH mock, index IN testCase.componentMocks
                IF mock.stepIdPattern IS_NULL THEN
                    ADD_TO errors "Mock ${index + 1}: stepIdPattern is required"
                END_IF
            END_FOR
        END_IF
        
        RETURN_VALUE {
            isValid: errors.length IS_ZERO,
            errors
        }
    `
}

code cfv_internal_code.TestCaseService_EvaluateAssertions {
    title: "Evaluate Test Assertions Against Results"
    part_of_design: cfv_designs.TestCaseService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/testCaseService.ts",
        entry_point_name: "evaluateAssertions",
        entry_point_type: "function"
    }
    signature: "(assertions: cfv_models.TestCaseAssertion[], testResult: any) => cfv_models.AssertionResult[]"
    
    detailed_behavior: `
        RETURN_VALUE MAP assertions TO assertionResult WHERE
            DECLARE actualValue = CALL getValueAtPath WITH testResult, assertion.targetPath
            DECLARE passed = CALL evaluateComparison WITH actualValue, assertion.expectedValue, assertion.comparison
            
            RETURN_VALUE {
                ...assertion,
                actualValue,
                passed,
                message: passed ? "Assertion passed" : "Expected ${assertion.expectedValue}, got ${actualValue}"
            }
        END_MAP
    `
}

// --- Flow Simulation Service Logic (New) ---

code cfv_internal_code.FlowSimulationService_SimulateFlowExecution {
    title: "Simulate Complete Flow Execution Up to Target Step"
    part_of_design: cfv_designs.TestCaseService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/flowSimulationService.ts",
        entry_point_name: "simulateFlowExecution",
        entry_point_type: "async_function"
    }
    signature: "(flowFqn: string, targetStepId: string, moduleRegistry: cfv_models.IModuleRegistry, triggerData?: any) => Promise<cfv_models.FlowSimulationResult>"
    
    detailed_behavior: `
        // Human Review Focus: Complete flow simulation with proper data propagation through all steps.
        // AI Agent Target: Generate realistic flow execution simulation that propagates actual data.

        // 1. Get flow definition and validate inputs
        DECLARE flowDef = CALL moduleRegistry.getFlowDefinition WITH flowFqn
        IF flowDef IS_NULL THEN
            THROW_ERROR "Flow not found: ${flowFqn}"
        END_IF
        
        // 2. Generate trigger data if not provided
        IF triggerData IS_NULL THEN
            IF flowDef.trigger IS_DEFINED THEN
                ASSIGN triggerData = CALL generateTriggerData WITH flowDef.trigger, moduleRegistry
            ELSE
                ASSIGN triggerData = { timestamp: new Date().toISOString(), data: {} }
            END_IF
        END_IF
        
        // 3. Initialize simulation state
        DECLARE stepResults = {}
        DECLARE contextState = CLONE(flowDef.context OR {})
        DECLARE executionOrder = []
        DECLARE errors = []
        
        // 4. Find target step and determine execution order
        DECLARE targetStepIndex = -1
        IF flowDef.steps IS_DEFINED THEN
            ASSIGN targetStepIndex = FIND_INDEX flowDef.steps WHERE step.step_id EQUALS targetStepId
            IF targetStepIndex IS_NEGATIVE THEN
                THROW_ERROR "Target step not found: ${targetStepId}"
            END_IF
        END_IF
        
        // 5. Simulate trigger execution
        DECLARE triggerResult = {
            stepId: 'trigger',
            componentFqn: flowDef.trigger?.type OR 'trigger',
            inputData: triggerData,
            outputData: triggerData,
            contextChanges: {},
            executionOrder: 0,
            simulationSuccess: true
        }
        ASSIGN stepResults['trigger'] = triggerResult
        ADD_TO executionOrder 'trigger'
        
        // 6. Simulate each step up to target step
        IF flowDef.steps IS_DEFINED THEN
            FOR stepIndex FROM 0 TO targetStepIndex
                DECLARE step = flowDef.steps[stepIndex]
                DECLARE stepResult = CALL simulateStepExecution WITH step, stepResults, contextState, moduleRegistry, flowFqn
                
                IF stepResult.simulationSuccess IS_FALSE THEN
                    ADD_TO errors stepResult.error
                    BREAK
                END_IF
                
                ASSIGN stepResults[step.step_id] = stepResult
                ADD_TO executionOrder step.step_id
                
                // Update context state with step changes
                MERGE_OBJECTS contextState WITH stepResult.contextChanges
            END_FOR
        END_IF
        
        // 7. Resolve final input data for target step
        DECLARE finalInputData = {}
        IF targetStepId EQUALS 'trigger' THEN
            ASSIGN finalInputData = triggerData
        ELSE
            DECLARE targetStep = flowDef.steps[targetStepIndex]
            ASSIGN finalInputData = CALL resolveStepInputFromSimulation WITH targetStep, stepResults, contextState
        END_IF
        
        RETURN_VALUE {
            flowFqn,
            targetStepId,
            triggerData,
            stepResults,
            finalInputData,
            executionOrder,
            contextState,
            errors
        }
    `
    dependencies: [
        "cfv_models.IModuleRegistry",
        "cfv_models.FlowSimulationResult",
        "cfv_models.StepSimulationResult"
    ]
}

code cfv_internal_code.FlowSimulationService_SimulateStepExecution {
    title: "Simulate Individual Step Execution"
    part_of_design: cfv_designs.TestCaseService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/flowSimulationService.ts",
        entry_point_name: "simulateStepExecution",
        entry_point_type: "function"
    }
    signature: "(step: any, previousStepResults: Record<string, cfv_models.StepSimulationResult>, contextState: Record<string, any>, moduleRegistry: cfv_models.IModuleRegistry, flowFqn: string) => cfv_models.StepSimulationResult"
    
    detailed_behavior: `
        // 1. Resolve component information
        DECLARE moduleFqn = EXTRACT_MODULE_FQN_FROM flowFqn
        DECLARE componentInfo = CALL moduleRegistry.resolveComponentTypeInfo WITH step.component_ref, moduleFqn
        IF componentInfo IS_NULL THEN
            RETURN_VALUE {
                stepId: step.step_id,
                componentFqn: step.component_ref,
                inputData: {},
                outputData: {},
                contextChanges: {},
                executionOrder: Object.keys(previousStepResults).length,
                simulationSuccess: false,
                error: "Component not found: ${step.component_ref}"
            }
        END_IF
        
        // 2. Resolve input data from previous steps and context
        DECLARE inputData = CALL resolveStepInputFromSimulation WITH step, previousStepResults, contextState
        
        // 3. Get component schema for output generation
        DECLARE componentSchema = CALL moduleRegistry.getComponentSchema WITH componentInfo.baseType
        
        // 4. Simulate component execution based on type
        DECLARE outputData = CALL simulateComponentExecution WITH componentInfo.baseType, inputData, step.config, componentSchema
        
        // 5. Determine context changes
        DECLARE contextChanges = {}
        IF step.outputs_map IS_DEFINED THEN
            FOR_EACH outputMapping IN step.outputs_map
                IF outputMapping.target.startsWith('context.') THEN
                    DECLARE contextVar = outputMapping.target.replace('context.', '')
                    DECLARE sourceValue = GET_NESTED_VALUE outputData, outputMapping.source
                    ASSIGN contextChanges[contextVar] = sourceValue
                END_IF
            END_FOR
        END_IF
        
        RETURN_VALUE {
            stepId: step.step_id,
            componentFqn: componentInfo.baseType,
            inputData,
            outputData,
            contextChanges,
            executionOrder: Object.keys(previousStepResults).length,
            simulationSuccess: true
        }
    `
}

code cfv_internal_code.FlowSimulationService_ResolveStepInputFromSimulation {
    title: "Resolve Step Input Data from Simulation Results"
    part_of_design: cfv_designs.TestCaseService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/flowSimulationService.ts",
        entry_point_name: "resolveStepInputFromSimulation",
        entry_point_type: "function"
    }
    signature: "(step: any, stepResults: Record<string, cfv_models.StepSimulationResult>, contextState: Record<string, any>) => any"
    
    detailed_behavior: `
        DECLARE resolvedInput = {}
        
        // Process inputs_map to resolve actual data from previous steps
        IF step.inputs_map IS_DEFINED THEN
            FOR_EACH inputField, sourceExpression IN step.inputs_map
                DECLARE resolvedValue = null
                
                IF typeof sourceExpression IS 'string' THEN
                    IF sourceExpression.startsWith('trigger.') THEN
                        DECLARE triggerResult = stepResults['trigger']
                        IF triggerResult IS_DEFINED THEN
                            DECLARE dataPath = sourceExpression.replace('trigger.', '')
                            ASSIGN resolvedValue = GET_NESTED_VALUE triggerResult.outputData, dataPath
                        END_IF
                    ELSE_IF sourceExpression.startsWith('steps.') THEN
                        // Parse "steps.step-id.outputs.field" format - CRITICAL: must use actual step outputs
                        DECLARE match = sourceExpression.match(/^steps\.([^.]+)\.outputs\.(.+)$/)
                        IF match IS_DEFINED THEN
                            DECLARE sourceStepId = match[1]
                            DECLARE outputPath = match[2]
                            DECLARE sourceStepResult = stepResults[sourceStepId]
                            IF sourceStepResult IS_DEFINED AND sourceStepResult.outputData IS_DEFINED THEN
                                // CRITICAL: Use actual outputData from previous step simulation
                                ASSIGN resolvedValue = GET_NESTED_VALUE sourceStepResult.outputData, outputPath
                            ELSE
                                LOG "Warning: Source step ${sourceStepId} not found or has no output data"
                                ASSIGN resolvedValue = null
                            END_IF
                        ELSE
                            // Handle legacy format "steps.step-id.field" without explicit "outputs"
                            DECLARE legacyMatch = sourceExpression.match(/^steps\.([^.]+)\.(.+)$/)
                            IF legacyMatch IS_DEFINED THEN
                                DECLARE sourceStepId = legacyMatch[1]
                                DECLARE outputPath = legacyMatch[2]
                                DECLARE sourceStepResult = stepResults[sourceStepId]
                                IF sourceStepResult IS_DEFINED AND sourceStepResult.outputData IS_DEFINED THEN
                                    ASSIGN resolvedValue = GET_NESTED_VALUE sourceStepResult.outputData, outputPath
                                END_IF
                            END_IF
                        END_IF
                    ELSE_IF sourceExpression.startsWith('context.') THEN
                        DECLARE contextVar = sourceExpression.replace('context.', '')
                        ASSIGN resolvedValue = contextState[contextVar]
                    ELSE
                        // Direct value or constant
                        ASSIGN resolvedValue = sourceExpression
                    END_IF
                ELSE
                    // Non-string values (constants, objects, etc.)
                    ASSIGN resolvedValue = sourceExpression
                END_IF
                
                // CRITICAL: Only assign if we have a resolved value, otherwise use null/undefined
                ASSIGN resolvedInput[inputField] = resolvedValue
            END_FOR
        END_IF
        
        RETURN_VALUE resolvedInput
    `
}

code cfv_internal_code.FlowSimulationService_SimulateComponentExecution {
    title: "Simulate Component Execution Based on Type"
    part_of_design: cfv_designs.TestCaseService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/dataGenerationService.ts",
        entry_point_name: "simulateComponentExecution",
        entry_point_type: "function"
    }
    signature: "(componentType: string, inputData: any, config: any, componentSchema?: cfv_models.ComponentSchema) => any"
    
    detailed_behavior: `
        // Generate realistic output based on component type and schema - CRITICAL: outputs must be usable by next steps
        // OPTIMIZED DATA FLOW: Components return streamlined structure to reduce duplication
        // COMPREHENSIVE: All component types are properly handled with realistic simulation
        // Components receive BOTH inputData AND config, and should return structured outputs
        
        FUNCTION simulateComponentExecution(componentType, inputData, config, componentSchema) {
            LOG "🔧 Simulating " + componentType + " with input: " + inputData + " and config: " + config
            
            SWITCH componentType {
                CASE 'StdLib:HttpCall'
                    // CRITICAL: HTTP calls return response structure with realistic data
                    DECLARE responseBody = generateHttpResponseBody(componentType, inputData, config)
                    DECLARE httpResponse = {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                        body: responseBody
                    }
                    RETURN_VALUE {
                        inputRef: { 
                            sourceType: "previous_step",
                            dataSize: JSON.stringify(inputData).length,
                            timestamp: new Date().toISOString()
                        },
                        output: { response: httpResponse }
                    }
                
                CASE 'StdLib:DatabaseQuery'
                    // Database operations return rows and metadata
                    DECLARE dbOutput = {
                        rows: [{ id: 1, ...inputData, created_at: new Date().toISOString() }],
                        rowCount: 1,
                        success: true,
                        queryConfig: config
                    }
                    RETURN_VALUE {
                        inputRef: { 
                            sourceType: "previous_step",
                            dataSize: JSON.stringify(inputData).length,
                            timestamp: new Date().toISOString()
                        },
                        output: dbOutput
                    }
                
                CASE 'StdLib:JsonSchemaValidator'
                    // CRITICAL: For validators, return BOTH validation result AND the validated data
                    DECLARE validationOutput = null
                    IF inputData?.data IS_DEFINED THEN
                        ASSIGN validationOutput = {
                            isValid: true,
                            validData: inputData.data, // The validated data that passes to next steps
                            validationResult: {
                                passed: true,
                                errors: [],
                                schema: config?.schema,
                                validatedFields: Object.keys(inputData.data || {})
                            },
                            config: config // Validation config used
                        }
                    ELSE
                        ASSIGN validationOutput = {
                            isValid: true,
                            validData: inputData, // Pass through all input data if no nested data
                            validationResult: {
                                passed: true,
                                errors: [],
                                schema: config?.schema,
                                validatedFields: Object.keys(inputData || {})
                            },
                            config: config
                        }
                    END_IF
                    RETURN_VALUE {
                        inputRef: { 
                            sourceType: "previous_step",
                            dataSize: JSON.stringify(inputData).length,
                            timestamp: new Date().toISOString()
                        },
                        output: validationOutput
                    }
                
                CASE 'StdLib:DataTransform'
                CASE 'StdLib:MapData'
                    // CRITICAL: For data transformation, apply actual transformations based on config
                    DECLARE transformed = CLONE inputData.data || inputData
                    IF config?.expression IS_DEFINED THEN
                        // Apply transformation logic based on expression
                        IF config.expression.includes('age') AND (inputData?.dateOfBirth OR inputData?.userData?.dateOfBirth) THEN
                            ASSIGN transformed.age = 25 // Simulated age calculation
                            ASSIGN transformed.isEligible = true
                            ASSIGN transformed.jurisdiction = inputData?.country OR inputData?.userData?.country OR 'US'
                        ELSE_IF config.expression.includes('canProceed') THEN
                            // Handle evaluate-compliance-results step specifically
                            ASSIGN transformed.canProceed = inputData.jurisdictionAllowed !== false AND 
                                                           inputData.onSanctionsList !== true AND 
                                                           inputData.ageEligible !== false
                            ASSIGN transformed.complianceFlags = {
                                jurisdiction: inputData.jurisdictionAllowed !== false,
                                sanctions: inputData.onSanctionsList !== true,
                                age: inputData.ageEligible !== false
                            }
                            ASSIGN transformed.riskLevel = transformed.canProceed ? 'low' : 'high'
                        ELSE
                            // Generic transformation - enhance input data
                            ASSIGN transformed.result = inputData.data || inputData
                            ASSIGN transformed.processed = true
                            ASSIGN transformed.timestamp = new Date().toISOString()
                        END_IF
                    ELSE
                        // No expression, pass through with enhancement
                        ASSIGN transformed.result = inputData.data || inputData
                        ASSIGN transformed.success = true
                    END_IF
                    
                    RETURN_VALUE {
                        inputRef: { 
                            sourceType: "previous_step",
                            dataSize: JSON.stringify(inputData).length,
                            timestamp: new Date().toISOString()
                        },
                        output: { ...transformed, transformationConfig: config }
                    }
                
                CASE 'StdLib:Fork'
                    // CRITICAL: Fork components duplicate input data to multiple named output ports
                    // OPTIMIZED: Return only the data needed, not the full input history
                    DECLARE forkResults = {}
                    IF config?.outputNames IS_DEFINED THEN
                        // Use outputNames from config (correct DSL format)
                        FOR_EACH outputName IN config.outputNames
                            // Fork duplicates input data to each named output port
                            ASSIGN forkResults[outputName] = inputData.data || inputData
                        END_FOR
                    ELSE_IF config?.branches IS_DEFINED THEN
                        // Fallback for legacy config with branches
                        FOR_EACH branch IN config.branches
                            ASSIGN forkResults[branch.name] = inputData.data || inputData
                        END_FOR
                    END_IF
                    
                    DECLARE forkOutput = {
                        branches: forkResults, // All branch results
                        forkConfig: config // Fork configuration
                    }
                    
                    RETURN_VALUE {
                        inputRef: { 
                            sourceType: "previous_step",
                            dataSize: JSON.stringify(inputData).length,
                            timestamp: new Date().toISOString()
                        },
                        output: forkOutput
                    }
                
                CASE 'StdLib:FilterData'
                    // CRITICAL: Filter components evaluate conditions and return filtered data
                    DECLARE filterOutput = {
                        matched: true, // Simulate successful filter match
                        filteredData: inputData,
                        filterExpression: config?.expression OR 'default',
                        filterConfig: config
                    }
                    IF config?.matchOutput IS_DEFINED THEN
                        ASSIGN filterOutput[config.matchOutput] = inputData
                    END_IF
                    IF config?.noMatchOutput IS_DEFINED THEN
                        ASSIGN filterOutput[config.noMatchOutput] = null
                    END_IF
                    RETURN_VALUE {
                        inputRef: { 
                            sourceType: "previous_step",
                            dataSize: JSON.stringify(inputData).length,
                            timestamp: new Date().toISOString()
                        },
                        output: filterOutput
                    }
                
                CASE 'StdLib:Validation'
                    DECLARE validationOutput = {
                        isValid: true,
                        validatedData: inputData,
                        errors: [],
                        validationConfig: config
                    }
                    RETURN_VALUE {
                        inputRef: { 
                            sourceType: "previous_step",
                            dataSize: JSON.stringify(inputData).length,
                            timestamp: new Date().toISOString()
                        },
                        output: validationOutput
                    }
                
                CASE 'StdLib:SubFlowInvoker'
                    DECLARE subFlowOutput = {
                        subFlowResult: { success: true, data: inputData },
                        executionId: 'sub-exec-' + Math.random().toString(36).substr(2, 9),
                        status: 'completed',
                        subFlowConfig: config
                    }
                    RETURN_VALUE {
                        inputRef: { 
                            sourceType: "previous_step",
                            dataSize: JSON.stringify(inputData).length,
                            timestamp: new Date().toISOString()
                        },
                        output: subFlowOutput
                    }
                
                // CRITICAL: Handle named components (custom components defined in modules)
                CASE STARTS_WITH 'kyc.' OR CONTAINS 'KYC' OR CONTAINS 'Kyc'
                    DECLARE kycOutput = {
                        status: 'initiated',
                        kycId: 'kyc-' + Math.random().toString(36).substr(2, 9),
                        requiredDocuments: ['passport', 'proof_of_address'],
                        estimatedCompletionTime: '24-48 hours',
                        kycConfig: config
                    }
                    RETURN_VALUE {
                        inputRef: { 
                            sourceType: "previous_step",
                            dataSize: JSON.stringify(inputData).length,
                            timestamp: new Date().toISOString()
                        },
                        output: kycOutput
                    }
                
                CASE STARTS_WITH 'responsible.' OR CONTAINS 'Responsible'
                    DECLARE responsibleOutput = {
                        limitsSet: true,
                        dailyLimit: config?.dailyLimit OR 1000,
                        weeklyLimit: config?.weeklyLimit OR 5000,
                        monthlyLimit: config?.monthlyLimit OR 20000,
                        userId: inputData?.userId OR 'user-' + Math.random().toString(36).substr(2, 9),
                        limitsConfig: config
                    }
                    RETURN_VALUE {
                        inputRef: { 
                            sourceType: "previous_step",
                            dataSize: JSON.stringify(inputData).length,
                            timestamp: new Date().toISOString()
                        },
                        output: responsibleOutput
                    }
                
                CASE STARTS_WITH 'bonuses.' OR CONTAINS 'Bonus'
                    DECLARE bonusOutput = {
                        bonusProcessed: true,
                        bonusAmount: config?.bonusAmount OR 50,
                        bonusType: config?.bonusType OR 'referral',
                        bonusId: 'bonus-' + Math.random().toString(36).substr(2, 9),
                        expiryDate: new Date(Date.now() + (config?.expiryDays OR 30) * 24 * 60 * 60 * 1000).toISOString(),
                        bonusConfig: config
                    }
                    RETURN_VALUE {
                        inputRef: { 
                            sourceType: "previous_step",
                            dataSize: JSON.stringify(inputData).length,
                            timestamp: new Date().toISOString()
                        },
                        output: bonusOutput
                    }
                
                CASE STARTS_WITH 'analytics.' OR CONTAINS 'Analytics'
                    DECLARE analyticsOutput = {
                        tracked: true,
                        eventId: 'analytics-' + Math.random().toString(36).substr(2, 9),
                        timestamp: new Date().toISOString(),
                        userId: inputData?.userId OR inputData?.userData?.userId OR 'unknown',
                        analyticsConfig: config
                    }
                    RETURN_VALUE {
                        inputRef: { 
                            sourceType: "previous_step",
                            dataSize: JSON.stringify(inputData).length,
                            timestamp: new Date().toISOString()
                        },
                        output: analyticsOutput
                    }
                
                DEFAULT
                    // Use schema to generate output if available
                    IF componentSchema?.outputSchema IS_DEFINED THEN
                        DECLARE schemaBasedOutput = CALL generateDataFromSchema WITH componentSchema.outputSchema, 'happy_path', true
                        DECLARE componentOutput = {
                            ...schemaBasedOutput,
                            componentConfig: config
                        }
                        RETURN_VALUE {
                            inputRef: { 
                                sourceType: "previous_step",
                                dataSize: JSON.stringify(inputData).length,
                                timestamp: new Date().toISOString()
                            },
                            output: componentOutput
                        }
                    ELSE
                        // CRITICAL: Default fallback should preserve input data and config for next steps
                        DECLARE defaultOutput = { 
                            result: inputData.data || inputData, 
                            success: true, 
                            timestamp: new Date().toISOString(),
                            componentType: componentType,
                            componentConfig: config
                        }
                        RETURN_VALUE {
                            inputRef: { 
                                sourceType: "previous_step",
                                dataSize: JSON.stringify(inputData).length,
                                timestamp: new Date().toISOString()
                            },
                            output: defaultOutput
                        }
                    END_IF
            }
        }
        
        // CRITICAL: This optimized structure reduces duplication while maintaining:
        // 1. Data traceability through inputRef
        // 2. Component output isolation
        // 3. Proper data flow for next steps
        // 4. Comprehensive component type support
        // 5. Realistic data generation for all component types
    `
}