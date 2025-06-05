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
    title: "ELK.js Automatic Graph Layout Service with Grid Layout Support"
    part_of_design: cfv_designs.LayoutService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/layoutService.ts",
        entry_point_name: "layoutNodes",
        entry_point_type: "async_function"
    }
    signature: "(nodes: Node[], edges: Edge[], options?: cfv_models.LayoutOptions) => Promise<{ nodes: Node[]; edges: Edge[] }>"
    
    detailed_behavior: `
        // Human Review Focus: Grid layout implementation, node ordering, adaptive spacing.
        // AI Agent Target: Generate automatic graph layout with grid arrangements for flows with many nodes.

        // 1. Validate inputs and determine optimal layout strategy
        IF nodes.length IS_ZERO THEN
            RETURN_VALUE { nodes, edges }
        END_IF
        
        // 2. Determine if we should use grid layout based on node count
        DECLARE useGridLayout = nodes.length > 7 // Use grid layout for flows with many nodes
        
        IF useGridLayout AND NOT options.algorithm AND NOT options.direction THEN
            LOG "🔲 Using grid layout for flow with " + nodes.length + " nodes (max 7 per row)"
            
            // 3. Apply manual grid layout
            DECLARE maxNodesPerRow = 7
            DECLARE nodeSpacing = 220 // Horizontal spacing between nodes
            DECLARE rowSpacing = 160  // Vertical spacing between rows
            
            // 4. Sort nodes to maintain flow order (trigger first, then steps in order)
            DECLARE sortedNodes = SORT nodes WHERE
                IF node.id EQUALS 'trigger' THEN return -1
                ELSE return 0 // Maintain original order for steps
            END_SORT
            
            // 5. Calculate grid positions
            DECLARE gridNodes = MAP sortedNodes TO gridNode WHERE
                DECLARE row = FLOOR(index / maxNodesPerRow)
                DECLARE col = index MOD maxNodesPerRow
                
                // Center each row by calculating offset
                DECLARE nodesInThisRow = MIN(maxNodesPerRow, sortedNodes.length - row * maxNodesPerRow)
                DECLARE rowOffset = (maxNodesPerRow - nodesInThisRow) * nodeSpacing / 2
                
                RETURN_VALUE {
                    ...node,
                    position: {
                        x: col * nodeSpacing + rowOffset,
                        y: row * rowSpacing
                    }
                }
            END_MAP
            
            RETURN_VALUE { nodes: gridNodes, edges }
        ELSE_IF NOT useGridLayout AND NOT options.algorithm AND NOT options.direction THEN
            // Use regular ELK layout for shorter flows
            DECLARE finalOptions = MERGE_OBJECTS(layoutPresets.flowDetail.options, options)
            DECLARE result = AWAIT service.layoutNodes(nodes, edges, finalOptions)
            RETURN_VALUE { nodes: result.nodes, edges: result.edges }
        ELSE
            // Use provided options with ELK
            DECLARE result = AWAIT service.layoutNodes(nodes, edges, options)
            RETURN_VALUE { nodes: result.nodes, edges: result.edges }
        END_IF
    `
    dependencies: [
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
    title: "Layout Presets for Different View Types with Square Layout Support"
    part_of_design: cfv_designs.LayoutService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/layoutService.ts",
        entry_point_name: "layoutPresets",
        entry_point_type: "constant"
    }
    signature: "Record<string, cfv_models.LayoutOptions>"
    
    detailed_behavior: `
        // Define layout presets optimized for different visualization modes with square layout support
        DECLARE layoutPresets = {
            flowDetail: {
                algorithm: "layered",
                direction: "RIGHT", // Left-to-right flow for simple flows
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
            flowDetailSquare: {
                algorithm: "layered",
                direction: "DOWN", // Top-to-bottom for square arrangement
                spacing: {
                    nodeNode: 100,
                    edgeNode: 30,
                    layerSpacing: 140
                },
                nodeSize: {
                    calculateFromContent: true,
                    minWidth: 160,
                    maxWidth: 240,
                    padding: { top: 10, right: 14, bottom: 10, left: 14 }
                },
                squareLayout: {
                    enabled: true,
                    maxNodesPerLayer: 4, // 4 nodes per row for square-ish arrangement
                    preferCompactness: true
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
            systemOverviewSquare: {
                algorithm: "layered",
                direction: "DOWN", // Top-to-bottom for system square layout
                spacing: {
                    nodeNode: 120,
                    edgeNode: 40,
                    layerSpacing: 160
                },
                nodeSize: {
                    calculateFromContent: true,
                    minWidth: 180,
                    maxWidth: 260,
                    padding: { top: 14, right: 18, bottom: 14, left: 18 }
                },
                squareLayout: {
                    enabled: true,
                    maxNodesPerLayer: 3, // 3 flows per row for system overview
                    preferCompactness: false
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
            },
            compactSquare: {
                algorithm: "layered",
                direction: "DOWN",
                spacing: {
                    nodeNode: 70,
                    edgeNode: 20,
                    layerSpacing: 90
                },
                nodeSize: {
                    calculateFromContent: true,
                    minWidth: 100,
                    maxWidth: 180,
                    padding: { top: 6, right: 10, bottom: 6, left: 10 }
                },
                squareLayout: {
                    enabled: true,
                    maxNodesPerLayer: 5, // 5 nodes per row for compact square
                    preferCompactness: true
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

code cfv_internal_code.GraphBuilderService_GenerateFlowDetailGraphData {
    title: "Generate Flow Detail Graph Data with Trace Integration"
    part_of_design: cfv_designs.GraphBuilderService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/graphBuilderService.ts",
        entry_point_name: "generateFlowDetailGraphData",
        entry_point_type: "function"
    }
    signature: "(params: cfv_models.GenerateFlowDetailParams) => Promise<cfv_models.GraphData>"
    
    detailed_behavior: `
        // Human Review Focus: Node type detection, trace data correlation, edge generation logic.
        // AI Agent Target: Generate React Flow nodes and edges from DSL flow definition.

        DECLARE flowDefinition = CALL moduleRegistry.getFlowDefinition WITH params.flowFqn
        IF flowDefinition IS_NULL THEN
            RETURN_VALUE { nodes: [], edges: [] }
        END_IF
        
        DECLARE nodes = []
        DECLARE edges = []
        
        // 1. Generate trigger node
        IF flowDefinition.trigger IS_DEFINED THEN
            DECLARE triggerNodeData = {
                label: flowDefinition.trigger.type,
                triggerType: flowDefinition.trigger.type,
                dslObject: flowDefinition.trigger,
                resolvedComponentFqn: flowDefinition.trigger.type,
                componentSchema: CALL params.componentSchemas.get WITH flowDefinition.trigger.type,
                contextVarUsages: CALL params.parseContextVarsFn WITH JSON.stringify(flowDefinition.trigger)
            }
            
            // Add trace data if available
            IF params.traceData IS_DEFINED THEN
                ASSIGN triggerNodeData.executionStatus = "SUCCESS" // Triggers are always successful if trace exists
                ASSIGN triggerNodeData.executionInputData = params.traceData.triggerData
            END_IF
            
            ADD {
                id: "trigger",
                type: "triggerNode",
                position: { x: 0, y: 0 },
                data: triggerNodeData
            } TO nodes
        END_IF
        
        // 2. Generate step nodes with proper SubFlowInvoker handling
        IF flowDefinition.steps IS_DEFINED THEN
            FOR EACH step IN flowDefinition.steps WITH index
                DECLARE componentInfo = CALL moduleRegistry.resolveComponentTypeInfo WITH step.component_ref, params.flowFqn
                DECLARE stepTrace = NULL
                IF params.traceData IS_DEFINED THEN
                    ASSIGN stepTrace = FIND params.traceData.steps WHERE stepTrace.stepId EQUALS step.step_id
                END_IF
                
                DECLARE stepNodeData = {
                    label: step.step_id,
                    stepId: step.step_id,
                    dslObject: step,
                    resolvedComponentFqn: componentInfo?.baseType,
                    componentSchema: CALL params.componentSchemas.get WITH componentInfo?.baseType,
                    contextVarUsages: CALL params.parseContextVarsFn WITH JSON.stringify(step)
                }
                
                // Add trace data if available
                IF stepTrace IS_DEFINED THEN
                    ASSIGN stepNodeData.executionStatus = stepTrace.status
                    ASSIGN stepNodeData.executionDurationMs = stepTrace.durationMs
                    ASSIGN stepNodeData.executionInputData = stepTrace.inputData
                    ASSIGN stepNodeData.executionOutputData = stepTrace.outputData
                END_IF
                
                // Check if this is a SubFlowInvoker and populate invokedFlowFqn correctly
                IF componentInfo?.baseType EQUALS "StdLib:SubFlowInvoker" OR step.component_ref CONTAINS "SubFlowInvoker" THEN
                    DECLARE flowName = step.config?.flowName
                    DECLARE invokedFlowFqn = "unknown"
                    
                    IF flowName IS_DEFINED AND flowName IS_NOT_EMPTY THEN
                        // Resolve flowName to full FQN
                        IF flowName CONTAINS "." THEN
                            // Already a full FQN
                            ASSIGN invokedFlowFqn = flowName
                        ELSE
                            // Simple name, resolve using current module namespace
                            DECLARE currentModuleFqn = EXTRACT_MODULE_FQN_FROM params.flowFqn
                            ASSIGN invokedFlowFqn = currentModuleFqn + "." + flowName
                        END_IF
                    ELSE
                        LOG_WARNING "SubFlowInvoker step " + step.step_id + " has missing or empty flowName in config"
                    END_IF
                    
                    DECLARE subFlowNodeData = {
                        ...stepNodeData,
                        invokedFlowFqn: invokedFlowFqn
                    }
                    
                    ADD {
                        id: step.step_id,
                        type: "subFlowInvokerNode",
                        position: { x: 0, y: (index + 1) * 100 },
                        data: subFlowNodeData
                    } TO nodes
                ELSE
                    ADD {
                        id: step.step_id,
                        type: "stepNode",
                        position: { x: 0, y: (index + 1) * 100 },
                        data: stepNodeData
                    } TO nodes
                END_IF
            END_FOR
        END_IF
        
        // 3. Generate edges based on inputs_map and run_after
        // ... (edge generation logic remains the same)
        
        // 4. Apply automatic layout if requested
        IF params.useAutoLayout AND nodes.length > 0 THEN
            TRY
                DECLARE layouted = CALL layoutNodes WITH nodes, edges, layoutPresets.flowDetail.options
                
                // Apply trace enhancements if trace data is available
                IF params.traceData IS_DEFINED THEN
                    DECLARE enhancedNodes = CALL enhanceNodesWithTrace WITH layouted.nodes, params.traceData
                    DECLARE enhancedEdges = CALL enhanceEdgesWithTrace WITH layouted.edges, params.traceData
                    RETURN_VALUE { nodes: enhancedNodes, edges: enhancedEdges }
                END_IF
                
                RETURN_VALUE layouted
            CATCH error
                LOG_WARNING "Auto-layout failed, using manual positions: " + error
            END_TRY
        END_IF
        
        // Apply trace enhancements even without layout if trace data is available
        IF params.traceData IS_DEFINED THEN
            DECLARE enhancedNodes = CALL enhanceNodesWithTrace WITH nodes, params.traceData
            DECLARE enhancedEdges = CALL enhanceEdgesWithTrace WITH edges, params.traceData
            RETURN_VALUE { nodes: enhancedNodes, edges: enhancedEdges }
        END_IF
        
        RETURN_VALUE { nodes, edges }
    `
    dependencies: [
        "cfv_models.GenerateFlowDetailParams",
        "cfv_models.GraphData",
        "cfv_models.IModuleRegistry"
    ]
}

code cfv_internal_code.AutoZoomToFitComponent {
    title: "Auto Zoom-to-Fit Component Implementation"
    part_of_design: cfv_designs.AutoZoomToFitService
    language: "TypeScriptReact"
    implementation_location: {
        filepath: "components/CascadeFlowVisualizer.tsx",
        entry_point_name: "AutoZoomToFit",
        entry_point_type: "component"
    }
    signature: "React.FC<{ currentFlowFqn: string | null; nodes: Node[]; isGeneratingGraph: boolean }>"
    
    detailed_behavior: `
        // Human Review Focus: Timing coordination, user experience, performance optimization.
        // AI Agent Target: Implement smooth auto zoom-to-fit when flows change.

        DECLARE fitView = CALL useReactFlow().fitView
        DECLARE lastFlowFqnRef = useRef<string | null>(null)
        DECLARE lastNodeCountRef = useRef<number>(0)

        EFFECT on [currentFlowFqn, nodes.length, isGeneratingGraph, fitView] {
            DECLARE flowChanged = lastFlowFqnRef.current !== currentFlowFqn
            DECLARE hasNodes = nodes.length > 0
            DECLARE nodeCountChanged = lastNodeCountRef.current !== nodes.length

            IF (flowChanged OR nodeCountChanged) AND NOT isGeneratingGraph AND hasNodes THEN {
                DECLARE timeoutId = setTimeout(() => {
                    TRY {
                        // Use more aggressive zoom-out for long flows
                        DECLARE isLongFlow = nodes.length > 8
                        CALL fitView({ 
                            duration: 800, 
                            padding: isLongFlow ? 0.15 : 0.1, // 15% padding for long flows, 10% for short flows
                            minZoom: 0.1, // Allow very aggressive zoom-out
                            maxZoom: 1.5  // Reasonable maximum zoom
                        })
                    } CATCH error {
                        LOG "Failed to auto-fit view:", error
                    }
                }, 100)

                SET lastFlowFqnRef.current = currentFlowFqn
                SET lastNodeCountRef.current = nodes.length

                RETURN () => clearTimeout(timeoutId)
            }
        }

        RETURN null // Component doesn't render anything
    `
    
    integration_notes: `
        - Must be placed inside ReactFlowProvider context to access useReactFlow hook
        - Renders as child of ReactFlow component alongside Controls, Background, MiniMap
        - Uses refs to track flow changes and prevent unnecessary zoom adjustments
        - Implements 100ms delay to ensure DOM updates are complete before fitting view
        - Uses 800ms animation duration and 10% padding for optimal user experience
        - Only triggers on flow changes or significant node count changes, not during user interaction
    `
}

specification cfv_internal_code.LayoutServiceEnhancedSpacing {
    id: "CFV_INT_LAY_003"
    title: "Enhanced Layout Service with Optimized Spacing and Fork Handling"
    description: "Specification for improved ELK.js layout configuration with reduced spacing and better fork node alignment."
    
    overview: "The LayoutService must provide optimized spacing for compact layouts while ensuring proper vertical alignment of fork nodes and accommodating varying node heights."
    
    enhanced_spacing_configuration: {
        description: "Reduced spacing configuration for more compact layouts",
        
        FUNCTION configureEnhancedSpacing(isLongFlow: Boolean, nodeCount: Number) -> LayoutSpacing {
            IF isLongFlow OR nodeCount > 7 THEN
                RETURN {
                    nodeNode: 20,        // Reduced from 40px (50% reduction)
                    edgeNode: 5,         // Reduced from 10px (50% reduction) 
                    edgeEdge: 3,         // Reduced from 5px (40% reduction)
                    layerSpacing: 30     // Reduced from 60px (50% reduction)
                }
            ELSE
                RETURN {
                    nodeNode: 40,        // Regular spacing for short flows
                    edgeNode: 10,
                    edgeEdge: 5,
                    layerSpacing: 50
                }
            END_IF
        }
    }
    
    enhanced_fork_handling: {
        description: "Improved ELK configuration for better fork node vertical alignment and spacing",
        
        FUNCTION configureElkForForkHandling(options: LayoutOptions) -> ElkLayoutOptions {
            DECLARE elkOptions = {
                // ENHANCED: Advanced layered algorithm options for perfect fork handling
                'elk.layered.compaction.postCompaction.strategy': 'NONE', // Disable compaction to maintain spacing
                'elk.layered.compaction.connectedComponents': 'false', // Don't compact connected components
                'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
                'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
                'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
                'elk.layered.cycleBreaking.strategy': 'GREEDY',
                
                // ENHANCED: Much more vertical spacing for fork nodes (1.5x increase to 9.0)
                'elk.layered.spacing.inLayerSpacingFactor': '9.0',  // INCREASED: 1.5x more vertical space between fork nodes (6.0 * 1.5 = 9.0)
                'elk.layered.nodePlacement.favorStraightEdges': 'true',
                'elk.layered.mergeEdges': 'false',
                'elk.layered.mergeHierarchyEdges': 'false',
                
                // CRITICAL: Advanced fork alignment options for perfect vertical grid
                'elk.layered.nodePlacement.bk.edgeStraightening': 'IMPROVE_STRAIGHTNESS',
                'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
                'elk.layered.nodePlacement.linearSegments.deflectionDampening': '0.1',
                'elk.layered.spacing.baseValue': options.spacing.nodeNode.toString(),
                
                // ENHANCED: 2x space after forked nodes and SubFlow overflow prevention
                'elk.layered.spacing.edgeNodeBetweenLayers': (Math.max((options.spacing.edgeNode || 20) * 2, 40)).toString(), // 2x space after fork nodes
                'elk.layered.spacing.edgeEdgeBetweenLayers': (Math.max((options.spacing.edgeEdge || 10) * 1.5, 15)).toString(), // 1.5x edge spacing
                'elk.layered.spacing.portsSurroundingNode': 'true', // Better port spacing around nodes
                'elk.layered.spacing.portPortBetweenAdjacentLayers': (Math.max(options.spacing.edgeNode || 20, 15)).toString(), // Minimum 15px port spacing
                'elk.layered.spacing.componentComponent': (Math.max(options.spacing.nodeNode || 80, 60)).toString(), // Minimum 60px component spacing
                
                // ENHANCED: Consistent spacing enforcement for uniform layout
                'elk.layered.spacing.individualOverride': 'false',
                'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
                'elk.layered.considerModelOrder.noModelOrder': 'false',
                
                // CRITICAL: SubFlow overflow prevention
                'elk.layered.wrapping.strategy': 'OFF', // Disable wrapping to prevent overflow
                'elk.layered.wrapping.additionalEdgeSpacing': '0',
                'elk.layered.wrapping.correctionFactor': '1.0',
                
                // ENHANCED: Additional spacing control for perfect fork alignment
                'elk.layered.thoroughness': '7',
                'elk.layered.unnecessaryBendpoints': 'false',
                'elk.layered.sausageFolding': 'false'
            }
            
            RETURN elkOptions
        }
    }
    
    subflow_node_sizing: {
        description: "Enhanced node sizing that accounts for SubFlow node height variations",
        
        FUNCTION calculateSubFlowNodeSize(node: Node, baseOptions: NodeSizeOptions) -> NodeDimensions {
            IF node.type EQUALS "subFlowInvokerNode" THEN
                DECLARE baseHeight = baseOptions.minHeight OR 70
                DECLARE additionalHeight = 0
                
                // Account for additional content in SubFlow nodes
                IF node.data?.invokedFlowFqn AND node.data.invokedFlowFqn !== "unknown" THEN
                    ASSIGN additionalHeight += 25  // FQN display area
                END_IF
                
                IF node.data?.resolvedComponentFqn THEN
                    ASSIGN additionalHeight += 20  // Component FQN area
                END_IF
                
                IF node.data?.executionStatus THEN
                    ASSIGN additionalHeight += 15  // Status indicator area
                END_IF
                
                DECLARE finalHeight = baseHeight + additionalHeight
                DECLARE finalWidth = CLAMP(
                    calculateTextWidth(node.data?.label OR node.id) + 40,
                    baseOptions.minWidth OR 200,
                    baseOptions.maxWidth OR 320
                )
                
                RETURN {
                    width: finalWidth,
                    height: finalHeight,
                    padding: { top: 14, right: 18, bottom: 14, left: 18 }  // Symmetric padding
                }
            ELSE
                RETURN calculateStandardNodeSize(node, baseOptions)
            END_IF
        }
    }
}

specification cfv_internal_code.SubFlowInvokerNodeStyling {
    id: "CFV_INT_STY_002"
    title: "SubFlowInvoker Node Enhanced Styling and Text Handling"
    description: "Specification for improved SubFlowInvoker node styling with symmetric padding and text overflow handling."
    
    overview: "SubFlowInvoker nodes must have balanced visual appearance with proper text overflow handling for long FQNs."
    
    symmetric_padding_implementation: {
        description: "Ensure symmetric left/right padding for visual balance",
        
        FUNCTION getNodeStyle(data: SubFlowInvokerNodeData, selected: Boolean) -> CSSProperties {
            DECLARE baseStyle = {
                padding: data.executionStatus ? '24px 18px 14px 18px' : '14px 18px',  // Symmetric horizontal padding
                borderRadius: '8px',
                minWidth: '200px',
                maxWidth: '320px',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                cursor: 'pointer'
            }
            
            // Apply execution status styling...
            RETURN enhancedStyle
        }
    }
    
    text_overflow_handling: {
        description: "Implement text overflow ellipsis for long FQN display",
        
        FUNCTION getInvokedFlowFqnStyle() -> CSSProperties {
            RETURN {
                fontSize: '10px',
                color: '#8B5CF6',
                marginBottom: '8px',
                textAlign: 'center',
                fontFamily: 'ui-monospace, monospace',
                backgroundColor: '#FAF5FF',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid #E9D5FF',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                
                // ENHANCED: Text overflow handling
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%'
            }
        }
    }
    
    responsive_content_display: {
        description: "Adaptive content display based on available space",
        
        FUNCTION renderInvokedFlowFqn(fqn: String, maxWidth: Number) -> ReactElement {
            IF fqn.length > 30 THEN
                // For very long FQNs, show abbreviated version with ellipsis
                DECLARE shortFqn = abbreviateFqn(fqn)
                RETURN (
                    <div 
                        style={getInvokedFlowFqnStyle()}
                        title={`Double-click to navigate to ${fqn}`}
                    >
                        🔗 {shortFqn}
                        <span style={{ marginLeft: '4px', fontSize: '8px', opacity: 0.7 }}>⤴</span>
                    </div>
                )
            ELSE
                RETURN standardFqnDisplay(fqn)
            END_IF
        }
        
        FUNCTION abbreviateFqn(fqn: String) -> String {
            DECLARE parts = fqn.split('.')
            IF parts.length > 3 THEN
                RETURN parts[0] + '...' + parts[parts.length - 1]
            ELSE
                RETURN fqn
            END_IF
        }
    }
}

specification cfv_internal_code.LayoutServiceWidthCompensation {
    id: "CFV_INT_LAY_004"
    title: "Enhanced Layout Service with Width Compensation for Long Nodes"
    description: "Specification for automatic width compensation in adaptive spacing calculations to prevent right-side overlap issues with wide nodes."
    
    overview: "The LayoutService must automatically compensate for wide nodes (especially SubFlowInvoker nodes with long FQNs) by adding appropriate spacing to prevent right-side overlap between layers."
    
    width_compensation_algorithm: {
        description: "Algorithm for calculating width overflow compensation",
        
        FUNCTION calculateWidthCompensation(nodes: Node[]) -> WidthCompensationResult {
            // 1. Calculate actual node sizes
            DECLARE nodesWithSizes = MAP nodes TO nodeWithSize WHERE
                RETURN_VALUE {
                    ...node,
                    ...CALL calculateNodeSize WITH node
                }
            END_MAP
            
            // 2. Find maximum width and calculate overflow
            DECLARE maxWidth = MAX(nodesWithSizes.map(n => n.width || 150))
            DECLARE standardWidth = 150  // Standard baseline width
            DECLARE widthOverflow = Math.max(0, maxWidth - standardWidth)
            
            // 3. Calculate compensation factors
            DECLARE widthCompensation = widthOverflow * 0.6  // 60% of overflow as compensation
            DECLARE bufferSpace = 20  // Additional buffer for very wide nodes
            
            // 4. Apply compensation to layer spacing
            DECLARE compensatedLayerSpacing = baseLayerSpacing + widthCompensation + bufferSpace
            
            RETURN_VALUE {
                maxWidth: maxWidth,
                widthOverflow: widthOverflow,
                widthCompensation: widthCompensation,
                bufferSpace: bufferSpace,
                compensatedLayerSpacing: compensatedLayerSpacing
            }
        }
    }
    
    enhanced_adaptive_spacing: {
        description: "Enhanced adaptive spacing calculation with width compensation",
        
        FUNCTION calculateAdaptiveSpacingWithWidthCompensation(nodes: Node[], baseSpacing: LayoutSpacing) -> LayoutSpacing {
            IF nodes.length EQUALS 0 THEN
                RETURN baseSpacing
            END_IF
            
            // Calculate width compensation
            DECLARE widthCompensation = CALL calculateWidthCompensation WITH nodes
            
            // Apply enhanced spacing with compensation
            DECLARE adaptiveSpacing = {
                nodeNode: Math.max(
                    baseSpacing.nodeNode || 30,
                    hasSubFlowNodes ? Math.max(maxWidth * 0.15, 40) : 30
                ),
                edgeNode: Math.max(
                    baseSpacing.edgeNode || 8,
                    hasSubFlowNodes ? 10 : 8
                ),
                edgeEdge: Math.max(
                    baseSpacing.edgeEdge || 5,
                    5
                ),
                // CRITICAL: Layer spacing with width compensation
                layerSpacing: Math.max(
                    baseSpacing.layerSpacing || 40,
                    hasSubFlowNodes ? Math.max(maxWidth * 0.2, 50) : 40,
                    widthCompensation.compensatedLayerSpacing
                )
            }
            
            LOG "🔧 ENHANCED spacing with width compensation applied:", {
                nodeNode: adaptiveSpacing.nodeNode,
                layerSpacing: adaptiveSpacing.layerSpacing,
                maxWidth: widthCompensation.maxWidth,
                widthOverflow: widthCompensation.widthOverflow,
                widthCompensation: widthCompensation.widthCompensation,
                bufferSpace: widthCompensation.bufferSpace
            }
            
            RETURN adaptiveSpacing
        }
    }
    
    compensation_benefits: {
        description: "Benefits of width compensation for layout quality",
        prevents_overlap: "Prevents right-side overlap when nodes exceed standard 150px width",
        handles_subflow_nodes: "Properly handles SubFlowInvoker nodes with long FQN displays",
        maintains_readability: "Ensures adequate spacing for readability even with very wide nodes",
        automatic_calculation: "Automatically calculates compensation without manual configuration",
        proportional_scaling: "Uses proportional scaling (60% of overflow) for balanced compensation"
    }
    
    test_scenarios: {
        description: "Test scenarios for width compensation validation",
        
        normal_width_nodes: {
            description: "Nodes with standard width (≤150px) should use base spacing",
            expected_behavior: "No width compensation applied, uses standard adaptive spacing"
        },
        
        wide_subflow_nodes: {
            description: "SubFlowInvoker nodes with long FQNs (>150px width)",
            expected_behavior: "Width compensation applied proportionally to overflow amount"
        },
        
        mixed_width_nodes: {
            description: "Mix of normal and wide nodes in same flow",
            expected_behavior: "Compensation based on maximum width node in the flow"
        },
        
        very_wide_nodes: {
            description: "Extremely wide nodes (>300px)",
            expected_behavior: "Significant compensation with buffer space to prevent overlap"
        }
    }
    
    implementation_requirements: {
        automatic_detection: "Automatically detect wide nodes without manual configuration",
        proportional_compensation: "Apply 60% of width overflow as compensation factor",
        buffer_space: "Add 20px buffer space for additional safety margin",
        logging_transparency: "Log compensation calculations for debugging and transparency",
        backward_compatibility: "Maintain compatibility with existing layout options and presets"
    }
}

// --- Enhanced Server Execution Engine Logic (New) ---

code cfv_internal_code.ServerExecutionEngine_EnhancedDependencyResolution {
    title: "Enhanced Server Execution Engine with Advanced Dependency Resolution"
    part_of_design: cfv_designs.StreamingExecutionAPIService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/serverExecutionEngine.ts",
        entry_point_name: "ServerExecutionEngine",
        entry_point_type: "class"
    }
    signature: "class ServerExecutionEngine"
    
    detailed_behavior: `
        // Human Review Focus: Advanced dependency analysis, robust expression parsing, layered execution strategy.
        // AI Agent Target: Generate comprehensive server-side execution engine with sophisticated dependency handling.

        CLASS ServerExecutionEngine {
            // Enhanced dependency analysis with comprehensive cycle detection
            FUNCTION analyzeDependencies(steps: any[]): DependencyAnalysis {
                DECLARE graph = new Map<string, Set<string>>()
                
                // Build dependency graph with enhanced expression parsing
                FOR_EACH step IN steps {
                    DECLARE dependencies = CALL extractStepDependencies WITH step
                    ASSIGN graph.set(step.step_id, dependencies)
                }
                
                // Detect cycles using DFS with recursion stack
                DECLARE cycles = CALL detectCycles WITH graph
                
                // Identify independent steps (no dependencies or only trigger/context deps)
                DECLARE independentSteps = FILTER steps WHERE
                    DECLARE deps = graph.get(step.step_id) || new Set()
                    RETURN deps.size === 0 OR 
                           Array.from(deps).every(dep => dep === 'trigger' OR dep.startsWith('context.'))
                END_FILTER
                
                // Create execution order layers for parallel processing
                DECLARE executionOrder = CALL createExecutionOrder WITH steps, graph
                
                RETURN_VALUE {
                    graph: graph,
                    cycles: cycles,
                    independentSteps: independentSteps.map(s => s.step_id),
                    executionOrder: executionOrder
                }
            }
            
            // Enhanced step dependency extraction with robust expression parsing
            FUNCTION extractStepDependencies(step: any): Set<string> {
                DECLARE dependencies = new Set<string>()
                
                // Add explicit run_after dependencies
                IF step.run_after IS_DEFINED {
                    IF Array.isArray(step.run_after) {
                        FOR_EACH dep IN step.run_after {
                            ADD dep TO dependencies
                        }
                    } ELSE {
                        ADD step.run_after TO dependencies
                    }
                }
                
                // Extract dependencies from inputs_map with enhanced parsing
                IF step.inputs_map IS_DEFINED {
                    FOR_EACH inputField, sourceExpression IN step.inputs_map {
                        IF typeof sourceExpression IS 'string' {
                            DECLARE stepRefs = CALL extractStepReferencesFromExpression WITH sourceExpression
                            FOR_EACH stepRef IN stepRefs {
                                ADD stepRef TO dependencies
                            }
                        }
                    }
                }
                
                // Extract dependencies from condition expressions
                IF step.condition IS_DEFINED AND typeof step.condition IS 'string' {
                    DECLARE stepRefs = CALL extractStepReferencesFromExpression WITH step.condition
                    FOR_EACH stepRef IN stepRefs {
                        ADD stepRef TO dependencies
                    }
                }
                
                RETURN_VALUE dependencies
            }
            
            // Robust expression parsing to extract step references
            FUNCTION extractStepReferencesFromExpression(expression: string): Set<string> {
                DECLARE stepReferences = new Set<string>()
                
                // Primary pattern: steps.stepName.outputs.path
                DECLARE primaryMatches = expression.match(/steps\.([a-zA-Z0-9_-]+)\.outputs\./g)
                IF primaryMatches {
                    FOR_EACH match IN primaryMatches {
                        DECLARE stepName = match.match(/steps\.([a-zA-Z0-9_-]+)\.outputs\./)[1]
                        ADD stepName TO stepReferences
                    }
                }
                
                // Legacy pattern: steps.stepName.path (without explicit outputs)
                DECLARE legacyMatches = expression.match(/steps\.([a-zA-Z0-9_-]+)\.(?!outputs\.)/g)
                IF legacyMatches {
                    FOR_EACH match IN legacyMatches {
                        DECLARE stepName = match.match(/steps\.([a-zA-Z0-9_-]+)\./)[1]
                        ADD stepName TO stepReferences
                    }
                }
                
                // Direct step references: stepName.outputs.path
                DECLARE directMatches = expression.match(/(?<!steps\.)([a-zA-Z0-9_-]+)\.outputs\./g)
                IF directMatches {
                    FOR_EACH match IN directMatches {
                        DECLARE stepName = match.match(/([a-zA-Z0-9_-]+)\.outputs\./)[1]
                        // Exclude 'trigger' and 'context' as they are not step dependencies
                        IF stepName !== 'trigger' AND stepName !== 'context' {
                            ADD stepName TO stepReferences
                        }
                    }
                }
                
                RETURN_VALUE stepReferences
            }
            
            // Advanced cycle detection using DFS with recursion stack
            FUNCTION detectCycles(graph: Map<string, Set<string>>): string[][] {
                DECLARE visited = new Set<string>()
                DECLARE recursionStack = new Set<string>()
                DECLARE currentPath = []
                DECLARE cycles = []
                
                FUNCTION dfs(node: string): boolean {
                    IF recursionStack.has(node) {
                        // Found cycle - extract cycle path
                        DECLARE cycleStart = currentPath.indexOf(node)
                        DECLARE cyclePath = currentPath.slice(cycleStart).concat([node])
                        ADD cyclePath TO cycles
                        RETURN true
                    }
                    
                    IF visited.has(node) {
                        RETURN false
                    }
                    
                    ADD node TO visited
                    ADD node TO recursionStack
                    ADD node TO currentPath
                    
                    DECLARE dependencies = graph.get(node) || new Set()
                    FOR_EACH dep IN Array.from(dependencies) {
                        IF graph.has(dep) AND dfs(dep) {
                            RETURN true
                        }
                    }
                    
                    REMOVE node FROM recursionStack
                    REMOVE node FROM currentPath
                    RETURN false
                }
                
                FOR_EACH node IN Array.from(graph.keys()) {
                    IF NOT visited.has(node) {
                        CALL dfs WITH node
                    }
                }
                
                RETURN_VALUE cycles
            }
            
            // Enhanced execution strategy with layered approach and fallback mechanisms
            FUNCTION executeStepsWithEnhancedDependencyResolution(
                steps: any[],
                context: ExecutionContext,
                streamCallback: StreamingCallback,
                dependencyAnalysis: DependencyAnalysis
            ): Promise<void> {
                DECLARE completedSteps = new Set<string>(['trigger'])
                DECLARE failedSteps = new Set<string>()
                DECLARE warningCount = 0
                DECLARE maxWarnings = 5
                
                LOG "🚀 Starting enhanced execution with dependency analysis"
                LOG "📊 Dependency graph:", dependencyAnalysis.graph
                LOG "🔄 Execution order layers:", dependencyAnalysis.executionOrder
                LOG "⚠️ Detected cycles:", dependencyAnalysis.cycles
                
                // Send warning events for detected cycles
                IF dependencyAnalysis.cycles.length > 0 {
                    FOR_EACH cycle IN dependencyAnalysis.cycles {
                        CALL sendEvent WITH streamCallback, context, 'execution.warning', {
                            type: 'circular_dependency',
                            message: "Circular dependency detected: " + cycle.join(' → '),
                            cyclePath: cycle,
                            severity: 'warning'
                        }
                        INCREMENT warningCount
                    }
                }
                
                // Execute steps layer by layer for optimal parallelization
                FOR_EACH layer IN dependencyAnalysis.executionOrder {
                    DECLARE readySteps = FILTER layer WHERE
                        DECLARE stepDeps = dependencyAnalysis.graph.get(stepId) || new Set()
                        RETURN Array.from(stepDeps).every(dep => 
                            completedSteps.has(dep) OR 
                            dep === 'trigger' OR 
                            dep.startsWith('context.')
                        )
                    END_FILTER
                    
                    IF readySteps.length > 0 {
                        LOG "🔄 Executing layer with " + readySteps.length + " parallel steps:", readySteps
                        
                        // Execute steps in parallel within the layer
                        DECLARE stepPromises = MAP readySteps TO stepPromise WHERE
                            RETURN_VALUE CALL executeStepWithErrorHandling WITH stepId, context, streamCallback
                        END_MAP
                        
                        DECLARE results = AWAIT Promise.allSettled(stepPromises)
                        
                        // Process results and update completed/failed sets
                        FOR_EACH result, index IN results {
                            DECLARE stepId = readySteps[index]
                            IF result.status === 'fulfilled' {
                                ADD stepId TO completedSteps
                                LOG "✅ Step completed successfully:", stepId
                            } ELSE {
                                ADD stepId TO failedSteps
                                LOG "❌ Step failed:", stepId, result.reason
                            }
                        }
                    } ELSE {
                        LOG "⚠️ No ready steps in current layer, checking for deadlock"
                        
                        // Deadlock resolution: execute independent steps as fallback
                        DECLARE independentSteps = FILTER dependencyAnalysis.independentSteps WHERE
                            NOT completedSteps.has(stepId) AND NOT failedSteps.has(stepId)
                        END_FILTER
                        
                        IF independentSteps.length > 0 {
                            LOG "🔄 Executing independent steps as fallback:", independentSteps
                            DECLARE firstIndependent = independentSteps[0]
                            TRY {
                                AWAIT CALL executeStepWithErrorHandling WITH firstIndependent, context, streamCallback
                                ADD firstIndependent TO completedSteps
                            } CATCH error {
                                ADD firstIndependent TO failedSteps
                                LOG "❌ Independent step failed:", firstIndependent, error
                            }
                        } ELSE {
                            // Final fallback: execute first remaining step to break deadlock
                            DECLARE remainingSteps = FILTER steps WHERE
                                NOT completedSteps.has(step.step_id) AND NOT failedSteps.has(step.step_id)
                            END_FILTER
                            
                            IF remainingSteps.length > 0 AND warningCount < maxWarnings {
                                DECLARE firstRemaining = remainingSteps[0]
                                LOG "🔄 Executing first remaining step to break deadlock:", firstRemaining.step_id
                                
                                TRY {
                                    AWAIT CALL executeStepWithErrorHandling WITH firstRemaining.step_id, context, streamCallback
                                    ADD firstRemaining.step_id TO completedSteps
                                } CATCH error {
                                    ADD firstRemaining.step_id TO failedSteps
                                    LOG "❌ Deadlock-breaking step failed:", firstRemaining.step_id, error
                                }
                                
                                INCREMENT warningCount
                            } ELSE {
                                LOG "🏁 Execution terminating: no more executable steps or max warnings reached"
                                BREAK
                            }
                        }
                    }
                }
                
                // Generate comprehensive execution summary
                DECLARE totalSteps = steps.length
                DECLARE executedSteps = completedSteps.size - 1 // Exclude trigger
                DECLARE unexecutedSteps = FILTER steps WHERE
                    NOT completedSteps.has(step.step_id) AND NOT failedSteps.has(step.step_id)
                END_FILTER
                
                LOG "🏁 Execution completed: " + executedSteps + "/" + totalSteps + " steps executed"
                IF unexecutedSteps.length > 0 {
                    LOG "⚠️ " + unexecutedSteps.length + " steps were not executed:", unexecutedSteps.map(s => s.step_id)
                }
                
                // Update final execution context
                ASSIGN context.completedSteps = completedSteps.size - 1
                ASSIGN context.failedSteps = failedSteps.size
                ASSIGN context.status = failedSteps.size > 0 ? 'failed' : 'completed'
            }
            
            // Enhanced input mapping resolution with complex expression support
            FUNCTION resolveInputMapping(mapping: string, context: ExecutionContext): any {
                IF typeof mapping !== 'string' {
                    RETURN_VALUE mapping
                }
                
                TRY {
                    // Handle complex expressions with multiple step references
                    IF mapping.includes('steps.') {
                        DECLARE resolvedExpression = mapping
                        
                        // Replace step output references with actual values
                        DECLARE stepOutputPattern = /steps\.([a-zA-Z0-9_-]+)\.outputs\.([a-zA-Z0-9_.]+)/g
                        ASSIGN resolvedExpression = resolvedExpression.replace(stepOutputPattern, (match, stepName, outputPath) => {
                            DECLARE stepResult = context.stepResults.get(stepName)
                            IF stepResult AND stepResult.outputData {
                                DECLARE value = CALL getNestedValue WITH stepResult.outputData, outputPath
                                RETURN_VALUE JSON.stringify(value)
                            } ELSE {
                                LOG "Warning: Step " + stepName + " not found or has no output data"
                                RETURN_VALUE 'null'
                            }
                        })
                        
                        // Replace trigger references
                        DECLARE triggerPattern = /trigger\.([a-zA-Z0-9_.]+)/g
                        ASSIGN resolvedExpression = resolvedExpression.replace(triggerPattern, (match, triggerPath) => {
                            DECLARE value = CALL getNestedValue WITH context.triggerInput, triggerPath
                            RETURN_VALUE JSON.stringify(value)
                        })
                        
                        // Replace context variable references
                        DECLARE contextPattern = /context\.([a-zA-Z0-9_.]+)/g
                        ASSIGN resolvedExpression = resolvedExpression.replace(contextPattern, (match, contextVar) => {
                            DECLARE value = context.contextVariables.get(contextVar)
                            RETURN_VALUE JSON.stringify(value)
                        })
                        
                        // Attempt to parse as JSON if it looks like a complex expression
                        IF resolvedExpression.trim().startsWith('{') OR resolvedExpression.trim().startsWith('[') {
                            TRY {
                                RETURN_VALUE JSON.parse(resolvedExpression)
                            } CATCH parseError {
                                LOG "Warning: Failed to parse resolved expression as JSON:", resolvedExpression
                                RETURN_VALUE resolvedExpression
                            }
                        } ELSE {
                            RETURN_VALUE resolvedExpression
                        }
                    } ELSE {
                        // Simple value or constant
                        RETURN_VALUE mapping
                    }
                } CATCH error {
                    LOG "Error resolving input mapping:", mapping, error
                    RETURN_VALUE mapping // Return original mapping on error
                }
            }
        }
    `
    dependencies: [
        "cfv_models.StreamingExecutionRequest",
        "cfv_models.StreamingExecutionEvent",
        "cfv_models.ExecutionContext",
        "cfv_models.DependencyAnalysis"
    ]
}

code cfv_internal_code.ServerExecutionEngine_EnhancedExpressionResolution {
    title: "Enhanced Expression Resolution with JavaScript Object Literal Support"
    part_of_design: cfv_designs.StreamingExecutionAPIService
    language: "TypeScript"
    implementation_location: { 
        filepath: "services/serverExecutionEngine.ts", 
        entry_point_name: "resolveInputMapping",
        entry_point_type: "private_method"
    }
    signature: "(mapping: string, context: ExecutionContext) => any"
    
    detailed_behavior: `
        // Human Review Focus: Robust expression parsing, JavaScript object literal handling, type safety
        // AI Agent Target: Generate comprehensive expression resolution logic
        
        // 1. Input validation and early returns
        IF mapping IS_NOT_STRING THEN
            RETURN_VALUE mapping
        END_IF
        
        // 2. Check for complex expressions with step references
        IF mapping CONTAINS 'steps.' OR mapping CONTAINS 'trigger.' OR mapping CONTAINS 'context.' THEN
            DECLARE resolvedExpression = mapping
            DECLARE hasReplacements = false
            
            // 3. Replace step output references with actual values
            APPLY_REGEX_REPLACEMENT resolvedExpression WITH_PATTERN /steps\.([a-zA-Z0-9_-]+)\.outputs\.([a-zA-Z0-9_.]+)/g
                EXTRACT stepName = match[1], outputPath = match[2]
                DECLARE stepResult = context.stepResults.get(stepName)
                IF stepResult AND stepResult.outputData THEN
                    DECLARE value = getNestedValue(stepResult.outputData, outputPath)
                    SET hasReplacements = true
                    RETURN JSON.stringify(value)
                ELSE
                    LOG_WARNING "Step result not found for: ${stepName}"
                    SET hasReplacements = true
                    RETURN 'null'
                END_IF
            END_APPLY_REGEX
            
            // 4. Replace trigger references
            APPLY_REGEX_REPLACEMENT resolvedExpression WITH_PATTERN /trigger\.([a-zA-Z0-9_.]+)/g
                EXTRACT path = match[1]
                DECLARE triggerResult = context.stepResults.get('trigger')
                IF triggerResult AND triggerResult.outputData THEN
                    DECLARE value = getNestedValue(triggerResult.outputData, path)
                    SET hasReplacements = true
                    RETURN JSON.stringify(value)
                ELSE
                    SET hasReplacements = true
                    RETURN 'null'
                END_IF
            END_APPLY_REGEX
            
            // 5. Replace context variable references
            APPLY_REGEX_REPLACEMENT resolvedExpression WITH_PATTERN /context\.([a-zA-Z0-9_.]+)/g
                EXTRACT varName = match[1]
                DECLARE value = context.contextVariables.get(varName)
                SET hasReplacements = true
                RETURN JSON.stringify(value)
            END_APPLY_REGEX
            
            // 6. Process resolved expression with JavaScript object literal support
            IF hasReplacements THEN
                DECLARE trimmed = resolvedExpression.trim()
                
                // Fix undefined values before processing
                DECLARE fixedExpression = trimmed.replace(/:\s*undefined/g, ': null').replace(/undefined/g, 'null')
                
                // 7. Handle object expressions with direct key-value extraction
                IF fixedExpression STARTS_WITH '{' AND fixedExpression ENDS_WITH '}' THEN
                    TRY
                        // Extract key-value pairs using regex for robust parsing
                        DECLARE keyValuePattern = /"?([a-zA-Z_][a-zA-Z0-9_]*)"?\s*:\s*([^,}]+)/g
                        DECLARE result = {}
                        DECLARE match
                        
                        WHILE (match = keyValuePattern.exec(fixedExpression)) IS_NOT_NULL
                            DECLARE key = match[1]
                            DECLARE value = match[2].trim()
                            
                            // Type-aware value parsing
                            IF value EQUALS 'null' THEN
                                SET result[key] = null
                            ELSE_IF value EQUALS 'true' OR value EQUALS 'false' THEN
                                SET result[key] = (value === 'true')
                            ELSE_IF value STARTS_WITH '"' AND value ENDS_WITH '"' THEN
                                SET result[key] = value.slice(1, -1)
                            ELSE_IF value STARTS_WITH "'" AND value ENDS_WITH "'" THEN
                                SET result[key] = value.slice(1, -1)
                            ELSE_IF NOT_IS_NaN(Number(value)) THEN
                                SET result[key] = Number(value)
                            ELSE_IF value STARTS_WITH '{' OR value STARTS_WITH '[' THEN
                                // Handle nested objects/arrays
                                TRY
                                    DECLARE nestedFixed = value.replace(/'/g, '"').replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
                                    SET result[key] = JSON.parse(nestedFixed)
                                CATCH_ERROR
                                    SET result[key] = value
                                END_TRY
                            ELSE
                                SET result[key] = value
                            END_IF
                        END_WHILE
                        
                        RETURN_VALUE result
                    CATCH_ERROR
                        RETURN_VALUE {}
                    END_TRY
                ELSE_IF fixedExpression STARTS_WITH '[' AND fixedExpression ENDS_WITH ']' THEN
                    RETURN_VALUE []
                END_IF
                
                RETURN_VALUE fixedExpression
            END_IF
         END_IF
         
         // 8. Handle simple dot notation references (legacy support)
         IF mapping CONTAINS '.' AND NOT mapping CONTAINS 'steps.' THEN
             DECLARE pathParts = mapping.split('.')
             DECLARE sourceStep = pathParts[0]
             DECLARE path = pathParts.slice(1).join('.')
             
             IF sourceStep EQUALS 'trigger' THEN
                 DECLARE triggerResult = context.stepResults.get('trigger')
                 RETURN triggerResult ? getNestedValue(triggerResult.outputData, path) : null
             ELSE_IF sourceStep EQUALS 'context' THEN
                 RETURN context.contextVariables.get(path)
             ELSE
                 DECLARE stepResult = context.stepResults.get(sourceStep)
                 RETURN stepResult ? getNestedValue(stepResult.outputData, path) : null
             END_IF
         END_IF
         
         RETURN_VALUE mapping
     `
     
     dependencies: [
         "getNestedValue: (obj: any, path: string) => any",
         "ExecutionContext interface",
         "JSON.stringify and JSON.parse for value serialization"
     ]
     
     error_handling: [
         "Graceful handling of missing step references with null fallback",
         "Safe parsing of malformed expressions with fallback objects",
         "Comprehensive logging for debugging expression resolution issues",
         "Type-safe value conversion with proper error boundaries"
     ]
     
     performance_considerations: [
         "Regex compilation optimization for repeated pattern matching",
         "Efficient Map lookups for step results and context variables",
         "Minimal object creation during expression resolution",
         "Early returns for simple cases to avoid unnecessary processing"
     ]
 }

 code cfv_internal_code.ServerExecutionEngine_EnhancedDependencyAnalysis {
     title: "Enhanced Dependency Analysis with Cycle Detection and Execution Planning"
     part_of_design: cfv_designs.StreamingExecutionAPIService
     language: "TypeScript"
     implementation_location: { 
         filepath: "services/serverExecutionEngine.ts", 
         entry_point_name: "analyzeDependencies",
         entry_point_type: "private_method"
     }
     signature: "(steps: any[]) => DependencyAnalysis"
     
     detailed_behavior: `
         // Human Review Focus: Correct dependency extraction, cycle detection algorithm, execution planning
         // AI Agent Target: Generate sophisticated dependency analysis logic
         
         // 1. Initialize data structures
         DECLARE graph = new Map<string, Set<string>>()
         DECLARE stepMap = new Map<string, any>()
         
         // Build step map for quick lookup
         FOR_EACH step IN steps
             SET stepMap[step.step_id] = step
         END_FOR
         
         // 2. Build dependency graph with enhanced parsing
         FOR_EACH step IN steps
             DECLARE dependencies = extractStepDependencies(step)
             SET graph[step.step_id] = dependencies
         END_FOR
         
         // 3. Detect cycles using Depth-First Search
         DECLARE cycles = detectCycles(graph)
         
         // 4. Find independent steps (no dependencies or only depend on trigger/context)
         DECLARE independentSteps = []
         FOR_EACH step IN steps
             DECLARE deps = graph.get(step.step_id) || new Set()
             IF deps.size === 0 OR ALL_ELEMENTS_IN deps ARE ('trigger' OR 'context') THEN
                 ADD step.step_id TO independentSteps
             END_IF
         END_FOR
         
         // 5. Create execution order layers for parallel processing
         DECLARE executionOrder = createExecutionOrder(steps, graph)
         
         // 6. Log comprehensive dependency analysis
         LOG_INFO "Dependency Graph: ${Array.from(graph.entries()).map(([step, deps]) => ({ step, dependencies: Array.from(deps) }))}"
         
         IF cycles.length > 0 THEN
             LOG_WARNING "Detected ${cycles.length} dependency cycles: ${cycles}"
         END_IF
         
         RETURN_VALUE {
             graph: graph,
             cycles: cycles,
             independentSteps: independentSteps,
             executionOrder: executionOrder
         }
     `
     
     dependencies: [
         "extractStepDependencies: (step: any) => Set<string>",
         "detectCycles: (graph: Map<string, Set<string>>) => string[][]",
         "createExecutionOrder: (steps: any[], graph: Map<string, Set<string>>) => string[][]"
     ]
 }

 code cfv_internal_code.ServerExecutionEngine_LayeredExecutionStrategy {
     title: "Layered Execution Strategy with Parallel Processing and Fallback Mechanisms"
     part_of_design: cfv_designs.StreamingExecutionAPIService
     language: "TypeScript"
     implementation_location: { 
         filepath: "services/serverExecutionEngine.ts", 
         entry_point_name: "executeStepsWithEnhancedDependencyResolution",
         entry_point_type: "private_method"
     }
     signature: "(steps: any[], context: ExecutionContext, streamCallback: StreamingCallback, dependencyAnalysis: DependencyAnalysis) => Promise<void>"
     
     detailed_behavior: `
         // Human Review Focus: Parallel execution coordination, error isolation, fallback strategies
         // AI Agent Target: Generate robust layered execution logic
         
         DECLARE executionOrder = 1 // Start after trigger
         
         LOG_INFO "Starting enhanced step execution with ${dependencyAnalysis.executionOrder.length} execution layers"
         
         // Execute steps layer by layer for optimal parallelization
         FOR layerIndex FROM 0 TO dependencyAnalysis.executionOrder.length - 1
             DECLARE layer = dependencyAnalysis.executionOrder[layerIndex]
             DECLARE layerSteps = layer.map(stepId => steps.find(s => s.step_id === stepId)).filter(Boolean)
             
             LOG_INFO "Executing layer ${layerIndex + 1}: ${layer.length} steps in parallel: ${layer}"
             
             IF layerSteps.length > 0 THEN
                 TRY
                     AWAIT executeStepsInParallel(layerSteps, context, streamCallback, executionOrder)
                     SET executionOrder += layerSteps.length
                 CATCH_ERROR error
                     LOG_ERROR "Failed to execute layer ${layerIndex + 1}: ${error}"
                     // Continue with next layer even if this one partially fails
                     // This provides resilience against individual step failures
                 END_TRY
             END_IF
         END_FOR
         
         // 6. Comprehensive execution reporting
         DECLARE totalSteps = steps.length
         DECLARE executedSteps = context.completedSteps - 1 // -1 for trigger
         
         LOG_INFO "Enhanced execution completed: ${executedSteps}/${totalSteps} steps executed successfully"
         
         IF executedSteps < totalSteps THEN
             DECLARE unexecutedSteps = steps.filter(s => !context.stepResults.has(s.step_id))
             LOG_WARNING "${unexecutedSteps.length} steps were not executed: ${unexecutedSteps.map(s => s.step_id)}"
         END_IF
     `
     
     dependencies: [
         "executeStepsInParallel: (steps: any[], context: ExecutionContext, streamCallback: StreamingCallback, executionOrder: number) => Promise<void>",
         "StreamingCallback interface",
         "ExecutionContext interface",
         "DependencyAnalysis interface"
     ]
     
     error_handling: [
         "Layer-level error isolation to prevent cascade failures",
         "Comprehensive logging for execution tracking and debugging",
         "Graceful degradation with partial execution support",
         "Detailed reporting of executed vs. unexecuted steps"
     ]
     
     performance_optimizations: [
         "Parallel execution within dependency layers",
         "Optimal resource utilization through layer-based processing",
         "Early termination strategies for critical failures",
         "Memory-efficient execution context management"
     ]
 }

 code cfv_internal_code.ClientExecutionStreamHandler_EnhancedStateManagement {
     title: "Enhanced Client Stream Handler with React State Management"
     part_of_design: cfv_designs.ClientExecutionStreamHandler
     language: "TypeScript"
     implementation_location: { 
         filepath: "services/clientExecutionStreamHandler.ts", 
         entry_point_name: "handleStreamingEvent",
         entry_point_type: "private_method"
     }
     signature: "(event: StreamingExecutionEvent, currentTrace: FlowExecutionTrace) => FlowExecutionTrace"
     
     detailed_behavior: `
         // Human Review Focus: Proper React state management, object reference handling, event processing
         // AI Agent Target: Generate robust client-side streaming event handler
         
         // 1. Create new trace object to ensure React re-rendering
         DECLARE newTrace = { ...currentTrace }
         
         // 2. Process event based on type
         SWITCH event.type
             CASE 'execution.started':
                 // Pre-populate all steps with PENDING status
                 DECLARE executionStartedData = event.data as ExecutionStartedEvent
                 DECLARE newSteps = new Map<string, StepExecutionTrace>()
                 
                 // Extract steps from flow definition and create placeholder traces
                 FOR_EACH step IN executionStartedData.flowDefinition.steps
                     DECLARE stepTrace = {
                         stepId: step.step_id,
                         componentFqn: step.component_ref,
                         status: 'PENDING' as ExecutionStatusEnum,
                         startTime: null,
                         endTime: null,
                         durationMs: null,
                         inputData: null,
                         outputData: null,
                         executionOrder: null
                     }
                     SET newSteps[step.step_id] = stepTrace
                 END_FOR
                 
                 SET newTrace.steps = newSteps
                 SET newTrace.status = 'RUNNING'
                 SET newTrace.startTime = event.timestamp
                 BREAK
                 
             CASE 'step.started':
                 DECLARE stepStartedData = event.data as StepStartedEvent
                 DECLARE existingStep = newTrace.steps.get(stepStartedData.stepId)
                 
                 IF existingStep THEN
                     // Create new step object to trigger React re-render
                     DECLARE updatedStep = {
                         ...existingStep,
                         status: 'RUNNING' as ExecutionStatusEnum,
                         startTime: event.timestamp,
                         inputData: stepStartedData.inputData,
                         executionOrder: stepStartedData.executionOrder
                     }
                     
                     // Create new steps Map to ensure React detects change
                     DECLARE newSteps = new Map(newTrace.steps)
                     SET newSteps[stepStartedData.stepId] = updatedStep
                     SET newTrace.steps = newSteps
                 END_IF
                 BREAK
                 
             CASE 'step.completed':
                 DECLARE stepCompletedData = event.data as StepCompletedEvent
                 DECLARE existingStep = newTrace.steps.get(stepCompletedData.stepId)
                 
                 IF existingStep THEN
                     // Create new step object to trigger React re-render
                     DECLARE updatedStep = {
                         ...existingStep,
                         status: 'SUCCESS' as ExecutionStatusEnum,
                         endTime: event.timestamp,
                         durationMs: stepCompletedData.actualDuration,
                         outputData: stepCompletedData.outputData
                     }
                     
                     // Create new steps Map to ensure React detects change
                     DECLARE newSteps = new Map(newTrace.steps)
                     SET newSteps[stepCompletedData.stepId] = updatedStep
                     SET newTrace.steps = newSteps
                 END_IF
                 BREAK
                 
             CASE 'step.failed':
                 DECLARE stepFailedData = event.data as StepFailedEvent
                 DECLARE existingStep = newTrace.steps.get(stepFailedData.stepId)
                 
                 IF existingStep THEN
                     // Create new step object to trigger React re-render
                     DECLARE updatedStep = {
                         ...existingStep,
                         status: 'FAILURE' as ExecutionStatusEnum,
                         endTime: event.timestamp,
                         durationMs: stepFailedData.actualDuration,
                         errorData: stepFailedData.error
                     }
                     
                     // Create new steps Map to ensure React detects change
                     DECLARE newSteps = new Map(newTrace.steps)
                     SET newSteps[stepFailedData.stepId] = updatedStep
                     SET newTrace.steps = newSteps
                 END_IF
                 BREAK
                 
             CASE 'execution.completed':
                 DECLARE executionCompletedData = event.data as ExecutionCompletedEvent
                 SET newTrace.status = 'COMPLETED'
                 SET newTrace.endTime = event.timestamp
                 SET newTrace.finalOutput = executionCompletedData.finalOutput
                 BREAK
                 
             CASE 'execution.failed':
                 DECLARE executionFailedData = event.data as ExecutionFailedEvent
                 SET newTrace.status = 'FAILED'
                 SET newTrace.endTime = event.timestamp
                 SET newTrace.errorData = executionFailedData.error
                 BREAK
                 
             DEFAULT:
                 LOG_WARNING "Unknown event type: ${event.type}"
                 BREAK
         END_SWITCH
         
         // 3. Add timestamp to ensure React re-rendering
         SET newTrace.lastUpdated = Date.now()
         
         RETURN_VALUE newTrace
     `
     
     dependencies: [
         "StreamingExecutionEvent interface",
         "FlowExecutionTrace interface", 
         "StepExecutionTrace interface",
         "ExecutionStatusEnum enumeration"
     ]
     
     react_optimization: [
         "Always create new object references for state updates",
         "Use Map constructor to create new Map instances",
         "Add timestamp fields to force React re-rendering",
         "Avoid mutating existing objects in place"
     ]
     
     error_handling: [
         "Graceful handling of missing step references",
         "Validation of event data before processing",
         "Fallback to previous state on processing errors",
         "Comprehensive logging for debugging"
     ]
 }