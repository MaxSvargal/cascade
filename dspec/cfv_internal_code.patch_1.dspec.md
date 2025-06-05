// cfv_internal_code.dspec.md
// Internal code specifications for CascadeFlowVisualizer services and components.
// Consolidates and refactors logic from original cfv_internal_code.dspec.md and cfv_internal_services_code.dspec.md.

// --- ModuleRegistryService Logic ---

code cfv_code.ModuleRegistryService_SharedAtoms { // Kept as a grouping for atom definitions
    title: "Jotai Atoms for Module Registry State"
    part_of_design: cfv_designs.ModuleRegistryService
    language: "TypeScript"
    implementation_location: { filepath: "state/ModuleRegistryServiceAtoms.ts" } // Atoms in their own file per design artifact
    // This artifact groups atom definitions.
    // The AI agent will use directives from cfv_internal_directives.dspec.md to generate them.

    defines_atom DslModuleRepresentationsAtom {
        description: "Stores all loaded cfv_models.DslModuleRepresentations, keyed by FQN."
        type: "Record<string, cfv_models.DslModuleRepresentation>"
        initial_value: "{}"
    }

    defines_atom ComponentSchemasAtom {
        description: "Stores all pre-loaded cfv_models.ComponentSchemas, keyed by component FQN."
        type: "Record<string, cfv_models.ComponentSchema>"
        initial_value: "{}" // Populated from props.componentSchemas
    }

    defines_atom ActiveModuleLoadRequestsAtom {
        description: "Tracks FQNs of modules currently being loaded to prevent duplicate requests."
        type: "Record<string, boolean>" // FQN -> isLoading
        initial_value: "{}"
    }
}

code cfv_code.ModuleRegistryService_InitializeFromProps {
    title: "Initialize ModuleRegistryService State from Props"
    part_of_design: cfv_designs.ModuleRegistryService
    language: "TypeScriptReact" // Likely part of a React hook or effect in the main component
    implementation_location: {
        filepath: "hooks/useModuleRegistryInitializer.ts",
        entry_point_name: "useModuleRegistryInitializer",
        entry_point_type: "function_hook"
    }
    signature: "(props: { initialModules?: cfv_models.DslModuleInput[], componentSchemas?: Record<string, cfv_models.ComponentSchema> }) => void"
    detailed_behavior: `
        // Human Review Focus: Correct initialization logic, props handling.
        // AI Agent Target: Generate a React useEffect hook using Jotai directives.

        // 1. Initialize ComponentSchemasAtom from props.componentSchemas
        IF props.componentSchemas IS_PRESENT THEN
            WRITE_ATOM cfv_code.ModuleRegistryService_SharedAtoms.ComponentSchemasAtom WITH props.componentSchemas
        END_IF

        // 2. Process initialModules from props.initialModules
        IF props.initialModules IS_PRESENT THEN
            DECLARE initialModuleReps AS Record<string, cfv_models.DslModuleRepresentation> = {}
            FOR_EACH moduleInput IN props.initialModules
                // Conceptual call to a parsing/processing function
                CALL cfv_code.ModuleRegistryService_ProcessSingleModuleInput WITH { moduleInput: moduleInput, isInitialLoad: true, getAtoms: get, setAtoms: set, props: props } ASSIGN_TO processedModuleRep
                IF processedModuleRep IS_NOT_NULL THEN
                    ASSIGN initialModuleReps[moduleInput.fqn] = processedModuleRep
                END_IF
            END_FOR
            WRITE_ATOM cfv_code.ModuleRegistryService_SharedAtoms.DslModuleRepresentationsAtom WITH initialModuleReps
        END_IF

        // This hook runs once on mount or when relevant props change.
        // Dependencies: props.initialModules, props.componentSchemas (managed by useEffect deps array)
    `
    dependencies: [
        "cfv_code.ModuleRegistryService_SharedAtoms.DslModuleRepresentationsAtom",
        "cfv_code.ModuleRegistryService_SharedAtoms.ComponentSchemasAtom",
        "cfv_code.ModuleRegistryService_ProcessSingleModuleInput"
    ]
}

code cfv_code.ModuleRegistryService_ProcessSingleModuleInput {
    title: "Process a Single Module Input (Parse and Store)"
    part_of_design: cfv_designs.ModuleRegistryService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/ModuleRegistryServiceLogic.ts",
        entry_point_name: "processSingleModuleInput",
        entry_point_type: "function"
    }
    signature: "(params: { moduleInput: cfv_models.DslModuleInput | cfv_models.RequestModuleResult, isInitialLoad: boolean, getAtoms: Function, setAtoms: Function, props: cfv_models.CascadeFlowVisualizerProps }) => cfv_models.DslModuleRepresentation | null"
    detailed_behavior: `
        // Human Review Focus: YAML parsing, definition extraction, error handling.
        // AI Agent Target: Generate a TypeScript function.

        DECLARE moduleFqn = params.moduleInput.fqn
        DECLARE moduleContent = params.moduleInput.content
        DECLARE parsedDsl AS cfv_models.DslParsedContent | null = null
        DECLARE errors AS List<cfv_models.DslModuleErrorItem> = []

        // 1. Parse YAML content
        TRY
            CALL AbstractYamlParser.parse WITH { content: moduleContent } ASSIGN_TO parsedDsl
        CATCH_ERROR e
            CALL AbstractLogger.logError WITH { message: "YAML parsing failed for " + moduleFqn + ": " + e.message }
            ADD { message: "YAML Parsing Error: " + e.message, severity: "error" } TO errors
            // Create error representation
            DECLARE errorRep AS cfv_models.DslModuleRepresentation
            CREATE_INSTANCE cfv_models.DslModuleRepresentation WITH { fqn: moduleFqn, rawContent: moduleContent, status: 'error', errors: errors } ASSIGN_TO errorRep
            // Update atom using passed-in setter
            CALL params.setAtoms WITH cfv_code.ModuleRegistryService_SharedAtoms.DslModuleRepresentationsAtom, (prev => ({ ...prev, [moduleFqn]: errorRep }))
            RETURN_VALUE errorRep // Or null, depending on desired return for this helper
        END_TRY

        IF parsedDsl IS_NULL THEN
             // Handle case where parsing returned null without throwing
            ADD { message: "YAML content is empty or invalid.", severity: "error" } TO errors
            // ... (similar error handling as above) ...
            RETURN_VALUE null // Or errorRep
        END_IF

        // 2. TODO: Extract definitions (flows, components, context) from parsedDsl.
        //    This would involve iterating through parsedDsl.flows, parsedDsl.components, etc.
        //    and potentially validating their structure.
        DECLARE extractedDefinitions AS cfv_models.DslModuleDefinitions
        // CREATE_INSTANCE cfv_models.DslModuleDefinitions WITH { ... } ASSIGN_TO extractedDefinitions // Placeholder

        // 3. TODO: Resolve imports (this can be complex and recursive)
        //    IF parsedDsl.imports IS_PRESENT THEN
        //        FOR_EACH importItem IN parsedDsl.imports
        //            CALL cfv_code.ModuleRegistryService_RequestAndProcessModule WITH { fqn: importItem.namespace, props: params.props, getAtoms: params.getAtoms, setAtoms: params.setAtoms }
        //        END_FOR
        //    END_IF

        // 4. Create final module representation
        DECLARE finalModuleRep AS cfv_models.DslModuleRepresentation
        CREATE_INSTANCE cfv_models.DslModuleRepresentation WITH {
            fqn: moduleFqn,
            rawContent: moduleContent,
            parsedContent: parsedDsl,
            definitions: extractedDefinitions, // From step 2
            imports: parsedDsl.imports,
            errors: errors, // Any validation errors found during definition extraction
            status: 'loaded'
        } ASSIGN_TO finalModuleRep

        // 5. Update DslModuleRepresentationsAtom
        CALL params.setAtoms WITH cfv_code.ModuleRegistryService_SharedAtoms.DslModuleRepresentationsAtom, (prev => ({ ...prev, [moduleFqn]: finalModuleRep }))

        RETURN_VALUE finalModuleRep
    `
    dependencies: [
        "AbstractYamlParser.parse",
        "cfv_code.ModuleRegistryService_SharedAtoms.DslModuleRepresentationsAtom",
        "cfv_code.ModuleRegistryService_RequestAndProcessModule", // For handling imports
        "AbstractLogger.logError"
    ]
}

code cfv_code.ModuleRegistryService_RequestAndProcessModule {
    title: "Handle Asynchronous Module Request and Processing"
    part_of_design: cfv_designs.ModuleRegistryService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/ModuleRegistryServiceLogic.ts",
        entry_point_name: "requestAndProcessModule",
        entry_point_type: "async_function"
    }
    signature: "(params: { fqn: string, props: { requestModule: cfv_models.CascadeFlowVisualizerProps['requestModule'], onModuleLoadError?: cfv_models.CascadeFlowVisualizerProps['onModuleLoadError'] }, getAtoms: Function, setAtoms: Function }) => Promise<cfv_models.DslModuleRepresentation | null>"
    preconditions: [
        "params.fqn is a valid string.",
        "params.props.requestModule is a valid function."
    ]
    postconditions: [
        "If module loaded and processed successfully, DslModuleRepresentationsAtom is updated and the representation is returned.",
        "If module already loading (in ActiveModuleLoadRequestsAtom), returns null or existing promise.",
        "If loading/processing fails, DslModuleRepresentationsAtom is updated with error status, onModuleLoadError is called if provided, and null is returned."
    ]
    detailed_behavior: `
        DECLARE fqn = params.fqn
        DECLARE getAtoms = params.getAtoms
        DECLARE setAtoms = params.setAtoms

        // 1. Check if already loading or loaded
        DECLARE activeLoads = CALL getAtoms WITH cfv_code.ModuleRegistryService_SharedAtoms.ActiveModuleLoadRequestsAtom
        IF activeLoads[fqn] IS_TRUE THEN
            CALL AbstractLogger.logInfo WITH { message: "Module " + fqn + " is already being loaded." }
            RETURN_VALUE null
        END_IF

        DECLARE loadedModules = CALL getAtoms WITH cfv_code.ModuleRegistryService_SharedAtoms.DslModuleRepresentationsAtom
        IF loadedModules[fqn] IS_PRESENT AND loadedModules[fqn].status IS_NOT_ERROR THEN
            RETURN_VALUE loadedModules[fqn]
        END_IF

        // 2. Mark as loading
        CALL setAtoms WITH cfv_code.ModuleRegistryService_SharedAtoms.ActiveModuleLoadRequestsAtom, (prev => ({ ...prev, [fqn]: true }))

        // 3. Request module content
        DECLARE requestedModuleData AS cfv_models.RequestModuleResult | null
        TRY
            CALL props.requestModule WITH { fqn: fqn } ASSIGN_TO requestedModuleData // Uses directive for props.requestModule
        CATCH_ERROR e
            CALL AbstractLogger.logError WITH { message: "props.requestModule failed for " + fqn + ": " + e.message }
            IF params.props.onModuleLoadError IS_DEFINED THEN
                CALL props.onModuleLoadError WITH { fqn: fqn, error: e } // Uses directive for props.onModuleLoadError
            END_IF
            DECLARE errorRep AS cfv_models.DslModuleRepresentation
            CREATE_INSTANCE cfv_models.DslModuleRepresentation WITH { fqn: fqn, rawContent: "", status: 'error', errors: [{ message: e.message }] } ASSIGN_TO errorRep
            CALL setAtoms WITH cfv_code.ModuleRegistryService_SharedAtoms.DslModuleRepresentationsAtom, (prev => ({ ...prev, [fqn]: errorRep }))
            CALL setAtoms WITH cfv_code.ModuleRegistryService_SharedAtoms.ActiveModuleLoadRequestsAtom, (prev => ({ ...prev, [fqn]: false }))
            RETURN_VALUE null
        END_TRY

        IF requestedModuleData IS_NULL THEN
            CALL AbstractLogger.logInfo WITH { message: "Module " + fqn + " not found or props.requestModule returned null."}
            IF params.props.onModuleLoadError IS_DEFINED THEN
                DECLARE notFoundError
                CREATE_INSTANCE Error WITH { message: "Module not found by host." } ASSIGN_TO notFoundError
                CALL props.onModuleLoadError WITH { fqn: fqn, error: notFoundError }
            END_IF
            DECLARE notFoundRep AS cfv_models.DslModuleRepresentation
            CREATE_INSTANCE cfv_models.DslModuleRepresentation WITH { fqn: fqn, rawContent: "", status: 'error', errors: [{ message: "Module not found by host." }] } ASSIGN_TO notFoundRep
            CALL setAtoms WITH cfv_code.ModuleRegistryService_SharedAtoms.DslModuleRepresentationsAtom, (prev => ({ ...prev, [fqn]: notFoundRep }))
            CALL setAtoms WITH cfv_code.ModuleRegistryService_SharedAtoms.ActiveModuleLoadRequestsAtom, (prev => ({ ...prev, [fqn]: false }))
            RETURN_VALUE null
        END_IF

        // 4. Process the loaded module content
        DECLARE finalModuleRep AS cfv_models.DslModuleRepresentation | null
        CALL cfv_code.ModuleRegistryService_ProcessSingleModuleInput WITH { moduleInput: requestedModuleData, isInitialLoad: false, getAtoms: getAtoms, setAtoms: setAtoms, props: params.props } ASSIGN_TO finalModuleRep

        // 5. Unmark as loading
        CALL setAtoms WITH cfv_code.ModuleRegistryService_SharedAtoms.ActiveModuleLoadRequestsAtom, (prev => ({ ...prev, [fqn]: false }))

        RETURN_VALUE finalModuleRep
    `
    dependencies: [
        "cfv_code.ModuleRegistryService_SharedAtoms.DslModuleRepresentationsAtom",
        "cfv_code.ModuleRegistryService_SharedAtoms.ActiveModuleLoadRequestsAtom",
        "cfv_code.ModuleRegistryService_ProcessSingleModuleInput",
        "props.requestModule", // Abstract call
        "props.onModuleLoadError", // Abstract call
        "AbstractLogger.logInfo",
        "AbstractLogger.logError"
    ]
}

// --- Main CascadeFlowVisualizer Component Logic (Simplified Example) ---

code cfv_code.CascadeFlowVisualizerComponent_MainLogic { // Renamed to avoid conflict with design, focuses on logic
    title: "Main <CascadeFlowVisualizer /> React Component Logic"
    part_of_design: cfv_designs.CascadeFlowVisualizerComponent
    language: "TypeScriptReact"
    implementation_location: { filepath: "components/CascadeFlowVisualizer.tsx", entry_point_name: "CascadeFlowVisualizer" }
    signature: "React.FC<cfv_models.CascadeFlowVisualizerProps>" // Actual props model
    applies_nfrs: [cfv_policies.NFRs_General.NFR1_Performance, cfv_policies.NFRs_General.NFR4_Reactivity]

    detailed_behavior: `
        // Human Review Focus: Correct props usage, Jotai integration, overall component structure.
        // AI Agent Target: Generate the main React component.

        // 1. Initialize internal state and services from props
        CALL cfv_code.ModuleRegistryService_InitializeFromProps HOOK WITH { initialModules: props.initialModules, componentSchemas: props.componentSchemas }
        // (Similar initialization for other services like SelectionService, NavigationStateService atoms based on props)

        // 2. Setup derived state atoms (e.g., for current graph nodes/edges)
        //    This logic is often handled by Jotai atoms that `get` other atoms.
        //    Example: currentGraphDataAtom (defined elsewhere)
        //    DEFINE_DERIVED_ATOM_READ_ONLY currentGraphDataAtom WITH_GETTER_LOGIC
        //        DECLARE currentFlowFqn = READ_ATOM cfv_code.NavigationStateService_Atoms.currentFlowFqnAtom // Assuming atoms are organized by service
        //        DECLARE mode = props.mode // Or read from an atom if mode is managed internally
        //        DECLARE traceData = props.traceData // Or read from an atom
        //        DECLARE graphBuilderParams AS cfv_models.GenerateFlowDetailParams
        //        // ... populate graphBuilderParams
        //        IF currentFlowFqn AND mode IS 'design' THEN
        //            CALL cfv_code.GraphBuilderService_GenerateFlowDetailGraphData WITH graphBuilderParams ASSIGN_TO graphData
        //            RETURN_VALUE graphData
        //        // ... other conditions for systemOverview, trace mode ...
        //        ELSE
        //            RETURN_VALUE { nodes: [], edges: [] } // Empty graph
        //        END_IF
        //    END_DEFINE_ATOM
        //    USE_ATOM_VALUE_HOOK currentGraphDataAtom // To get the graph data in the component

        // 3. Setup effect for props.onViewChange
        DECLARE currentFlowFqnForEffect = USE_ATOM_VALUE_HOOK cfv_code.NavigationStateService_Atoms.currentFlowFqnAtom
        DECLARE systemViewActiveForEffect = USE_ATOM_VALUE_HOOK cfv_code.NavigationStateService_Atoms.systemViewActiveAtom
        USE_EFFECT_HOOK {
            dependencies: [props.mode, currentFlowFqnForEffect, systemViewActiveForEffect, props.onViewChange]
            logic: \`
                IF props.onViewChange IS_DEFINED THEN
                    DECLARE payload AS cfv_models.ViewChangePayload
                    CREATE_INSTANCE cfv_models.ViewChangePayload WITH { mode: props.mode, currentFlowFqn: currentFlowFqnForEffect, systemViewActive: systemViewActiveForEffect } ASSIGN_TO payload
                    CALL props.onViewChange WITH { viewPayload: payload }
                END_IF
            \`
        }

        // 4. Setup effect for AutoZoomToFit
        // Assuming AutoZoomToFit logic is encapsulated in a custom hook or child component.
        // CALL cfv_code.AutoZoomToFit_Hook WITH { currentFlowFqn: currentFlowFqnForEffect, nodes: currentGraphData.nodes, isGeneratingGraph: isLoadingGraph }
        // (isLoadingGraph would be another state atom)

        // 5. Render UI Layout (Conceptual JSX structure, actual UI components are external or consumer-provided)
        //    RENDER_JSX
        //    <div className={props.className} style={props.style}>
        //        <ReactFlowProvider> // Assuming React Flow context provider
        //            <LeftSidebarComponent>
        //                // Uses DslModuleRepresentationsAtom, currentFlowFqnAtom, etc.
        //            </LeftSidebarComponent>
        //            <MainCanvasComponent
        //                nodes={currentGraphData.nodes}
        //                edges={currentGraphData.edges}
        //                nodeTypes={props.customNodeTypes}
        //                edgeTypes={props.customEdgeTypes}
        //                onNodeClick={handleNodeClick} // handleNodeClick calls SelectionService logic
        //                onNodeDoubleClick={handleNodeDoubleClick} // For SubFlowInvokerNavigation
        //                // elkOptions={props.elkOptions} // Passed to ELKLayoutEngine via LayoutService
        //            />
        //            <RightSidebarComponent>
        //                // Tabs rendered using props.renderInspectorSourceTab, props.renderInspectorPropertiesTab, props.renderInspectorDebugTestTab
        //                // Pass selectedElementAtom data, moduleRegistry interface, and actions objects to tabs
        //            </RightSidebarComponent>
        //            <AutoZoomToFitComponent currentFlowFqn={currentFlowFqnForEffect} nodes={currentGraphData.nodes} isGeneratingGraph={isLoadingGraph} /> // Render the AutoZoom component
        //        </ReactFlowProvider>
        //    </div>
    `
    dependencies: [
        "cfv_code.ModuleRegistryService_InitializeFromProps",
        "cfv_code.GraphBuilderService_GenerateFlowDetailGraphData", // Example
        // Atom references (conceptual, actual atoms defined in their respective service atom files)
        "cfv_code.NavigationStateService_Atoms.currentFlowFqnAtom",
        "cfv_code.NavigationStateService_Atoms.systemViewActiveAtom",
        "cfv_code.AutoZoomToFit_Logic" // If AutoZoomToFit is a hook
    ]
}

// --- Layout Service Logic (Refactored from original cfv_internal_code.dspec.md) ---

code cfv_code.LayoutService_LayoutNodes { // Replaces LayoutService_AutomaticLayout
    title: "Main Layout Service Function (ELK.js)"
    part_of_design: cfv_designs.LayoutService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/LayoutServiceLogic.ts",
        entry_point_name: "layoutNodesWithELK", // More specific name
        entry_point_type: "async_function"
    }
    signature: "(nodes: cfv_models.ReactFlowNode[], edges: cfv_models.ReactFlowEdge[], options?: cfv_models.LayoutOptions, elkInstance: any) => Promise<{ nodes: cfv_models.ReactFlowNode[]; edges: cfv_models.ReactFlowEdge[] }>" // elkInstance passed in
    detailed_behavior: `
        // Human Review Focus: ELK options construction, graph conversion.
        // AI Agent Target: Generate ELK layout function.

        IF nodes.length IS_ZERO THEN
            RETURN_VALUE { nodes: nodes, edges: edges }
        END_IF

        // 1. Determine ELK options
        //    This might involve merging default presets with user options
        //    and applying adaptive spacing logic.
        DECLARE baseSpacing AS cfv_models.LayoutSpacing
        IF options.spacing IS_PRESENT THEN
            ASSIGN baseSpacing = options.spacing
        ELSE
            // Get default from presets, e.g., layoutPresets.flowDetail.spacing
            DECLARE presets = CALL cfv_code.LayoutService_GetLayoutPresets
            ASSIGN baseSpacing = presets.flowDetail.spacing // Example default
        END_IF

        DECLARE adaptiveSpacing = CALL cfv_code.LayoutService_CalculateAdaptiveSpacingWithWidthCompensation WITH { nodes: nodes, baseSpacing: baseSpacing }

        DECLARE elkLayoutOptions = { // Base ELK options
            'elk.algorithm': options.algorithm OR 'layered',
            'elk.direction': options.direction OR 'RIGHT',
            'elk.spacing.nodeNode': adaptiveSpacing.nodeNode.toString(),
            'elk.layered.spacing.nodeNodeBetweenLayers': adaptiveSpacing.layerSpacing.toString(),
            'elk.spacing.edgeNode': adaptiveSpacing.edgeNode.toString(),
            'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP', // Example default
            // Add more ELK options based on cfv_internal_code.LayoutServiceEnhancedSpacing.enhanced_fork_handling
        }

        IF options.elkSpecificOptions IS_PRESENT THEN
            // Merge elkLayoutOptions with options.elkSpecificOptions
        END_IF

        // 2. Convert React Flow nodes/edges to ELK graph format
        //    This is a complex step, abstract it.
        CALL cfv_code.LayoutService_ConvertToElkGraph WITH { nodes: nodes, edges: edges, elkOptions: elkLayoutOptions } ASSIGN_TO elkGraphInput

        // 3. Run ELK layout
        DECLARE layoutedElkGraph
        TRY
            CALL AbstractELKEngine.layout WITH { elkInstance: elkInstance, elkGraphInput: elkGraphInput } ASSIGN_TO layoutedElkGraph
        CATCH_ERROR e
            CALL AbstractLogger.logError WITH { message: "ELK layout failed: " + e.message }
            // Fallback: return original nodes/edges or apply a simpler layout
            RETURN_VALUE { nodes: nodes, edges: edges }
        END_TRY

        // 4. Convert layouted ELK graph back to React Flow format
        CALL cfv_code.LayoutService_ConvertFromElkGraph WITH { layoutedElkGraph: layoutedElkGraph } ASSIGN_TO result

        RETURN_VALUE result
    `
    dependencies: [
        "cfv_models.ReactFlowNode", // Assuming this is the type for React Flow nodes
        "cfv_models.ReactFlowEdge", // Assuming this is the type for React Flow edges
        "cfv_models.LayoutOptions",
        "AbstractELKEngine.layout",
        "cfv_code.LayoutService_GetLayoutPresets",
        "cfv_code.LayoutService_CalculateAdaptiveSpacingWithWidthCompensation",
        "cfv_code.LayoutService_ConvertToElkGraph",
        "cfv_code.LayoutService_ConvertFromElkGraph",
        "AbstractLogger.logError"
    ]
}

code cfv_code.LayoutService_CalculateNodeSizeWithStyling { // From LayoutService_ContentBasedSizing
    title: "Calculate Node Size with Styling Considerations"
    part_of_design: cfv_designs.LayoutService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/LayoutServiceLogic.ts",
        entry_point_name: "calculateNodeSizeWithStyling",
        entry_point_type: "function"
    }
    signature: "(node: cfv_models.ReactFlowNode, sizeOptions: cfv_models.NodeSizeOptions) => { width: number; height: number; style: object }"
    detailed_behavior: `
        // Logic from original cfv_internal_code.LayoutService_ContentBasedSizing.detailed_behavior
        // Ensure to use abstract calls for text measurement if it's complex, e.g., CALL TextMetrics.measureText
        DECLARE baseWidth = sizeOptions.width OR 200
        DECLARE baseHeight = sizeOptions.height OR 80
        DECLARE padding
        IF sizeOptions.padding IS_PRESENT THEN ASSIGN padding = sizeOptions.padding ELSE ASSIGN padding = { top: 8, right: 12, bottom: 8, left: 12 } END_IF

        IF node.data.label IS_DEFINED THEN
            DECLARE textLength = node.data.label.length // Simplified text width calculation
            DECLARE estimatedTextWidth = textLength * 8 + padding.left + padding.right
            DECLARE calculatedWidth = CALL Math.max WITH { values: [baseWidth, estimatedTextWidth] }

            DECLARE calculatedHeight = baseHeight + padding.top + padding.bottom
            IF node.data.resolvedComponentFqn IS_PRESENT THEN ASSIGN calculatedHeight = calculatedHeight + 20 END_IF
            IF node.data.executionStatus IS_PRESENT THEN ASSIGN calculatedHeight = calculatedHeight + 20 END_IF
            // ... other height adjustments ...

            DECLARE minW = sizeOptions.minWidth OR 150
            DECLARE maxW = sizeOptions.maxWidth OR 300
            DECLARE finalWidth = CALL Math.min WITH { values: [maxW, (CALL Math.max WITH { values: [minW, calculatedWidth] })] } // CLAMP
            // ... similar for finalHeight ...
            DECLARE finalHeight = calculatedHeight // Placeholder for brevity

            DECLARE nodeStyle = {
                width: finalWidth,
                height: finalHeight,
                padding: padding.top + "px " + padding.right + "px " + padding.bottom + "px " + padding.left + "px",
                boxSizing: "border-box",
                overflow: "hidden"
                // ... other styles
            }
            RETURN_VALUE { width: finalWidth, height: finalHeight, style: nodeStyle }
        END_IF
        // ... Default return ...
        RETURN_VALUE { width: baseWidth, height: baseHeight, style: { /* basic style */ } }
    `
    dependencies: ["cfv_models.ReactFlowNode", "cfv_models.NodeSizeOptions", "Math.max", "Math.min"] // Abstracted Math calls
}

code cfv_code.LayoutService_GetLayoutPresets { // From LayoutService_LayoutPresets
    title: "Get Predefined Layout Presets"
    part_of_design: cfv_designs.LayoutService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/LayoutServiceLogic.ts",
        entry_point_name: "getLayoutPresets",
        entry_point_type: "function" // Or constant if truly static
    }
    signature: "() => Record<string, cfv_models.LayoutOptions>"
    detailed_behavior: `
        // Logic from original cfv_internal_code.LayoutService_LayoutPresets.detailed_behavior
        // Defines and returns the layoutPresets object.
        DECLARE layoutPresets = {
            flowDetail: { /* ... */ },
            systemOverview: { /* ... */ }
            // ... other presets
        }
        RETURN_VALUE layoutPresets
    `
    dependencies: ["cfv_models.LayoutOptions"]
}

code cfv_code.LayoutService_CalculateAdaptiveSpacingWithWidthCompensation { // From LayoutServiceWidthCompensation & EnhancedSpacing
    title: "Calculate Adaptive Spacing with Width Compensation"
    part_of_design: cfv_designs.LayoutService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/LayoutServiceLogic.ts",
        entry_point_name: "calculateAdaptiveSpacingWithWidthCompensation",
        entry_point_type: "function"
    }
    signature: "(params: { nodes: cfv_models.ReactFlowNode[], baseSpacing: cfv_models.LayoutSpacing }) => cfv_models.LayoutSpacing"
    detailed_behavior: `
        // Merged logic from cfv_internal_code.LayoutServiceWidthCompensation.enhanced_adaptive_spacing
        // and cfv_internal_services_code.EnhancedLayoutService.calculateAdaptiveSpacingWithWidthCompensation
        // Ensure all sub-calculations (like calculateNodeSize or calculateWidthCompensation) are either inlined
        // or are CALLs to other defined `code` specs.

        DECLARE nodes = params.nodes
        DECLARE baseSpacing = params.baseSpacing

        IF nodes.length EQUALS 0 THEN
            RETURN_VALUE baseSpacing
        END_IF

        // 1. Calculate actual node sizes (Simplified: assume width/height are on node objects or use a helper)
        DECLARE maxWidth = 150 // Placeholder
        DECLARE hasSubFlowNodes = false // Placeholder
        // In reality, this would iterate nodes and call cfv_code.LayoutService_CalculateNodeSizeWithStyling

        // 2. Calculate width compensation factors (from LayoutServiceWidthCompensation)
        DECLARE standardWidth = 150
        DECLARE widthOverflow = CALL Math.max WITH { values: [0, maxWidth - standardWidth] }
        DECLARE widthCompensationFactor = widthOverflow * 0.8 // 80%
        DECLARE bufferSpace = 30

        DECLARE compensatedLayerSpacing = baseSpacing.layerSpacing + widthCompensationFactor + bufferSpace

        // 3. Apply adaptive spacing (from EnhancedLayoutService)
        DECLARE adaptiveSpacing AS cfv_models.LayoutSpacing
        CREATE_INSTANCE cfv_models.LayoutSpacing WITH {
            nodeNode: (CALL Math.max WITH { values: [(baseSpacing.nodeNode OR 30) / 1.5, (hasSubFlowNodes ? (CALL Math.max WITH { values: [maxWidth * 0.15, 40] }) / 2 : 20)] }),
            edgeNode: (CALL Math.max WITH { values: [(baseSpacing.edgeNode OR 8) / 1.5, (hasSubFlowNodes ? 10 / 1.5 : 5)] }),
            edgeEdge: (CALL Math.max WITH { values: [(baseSpacing.edgeEdge OR 5) / 1.5, 3] }),
            layerSpacing: (CALL Math.max WITH { values: [(baseSpacing.layerSpacing OR 40) / 1.5, (hasSubFlowNodes ? (CALL Math.max WITH { values: [maxWidth * 0.2, 50] }) / 1.5 : 27), compensatedLayerSpacing] })
        } ASSIGN_TO adaptiveSpacing

        CALL AbstractLogger.logInfo WITH { message: "ENHANCED spacing with width compensation applied: " + adaptiveSpacing } // Example log

        // Round values
        ASSIGN adaptiveSpacing.nodeNode = CALL Math.round WITH { value: adaptiveSpacing.nodeNode }
        // ... round other fields ...
        RETURN_VALUE adaptiveSpacing
    `
    dependencies: [
        "cfv_models.ReactFlowNode",
        "cfv_models.LayoutSpacing",
        "cfv_code.LayoutService_CalculateNodeSizeWithStyling", // If called
        "Math.max", "Math.round", // Abstracted Math calls
        "AbstractLogger.logInfo"
    ]
}

// --- AutoZoomToFit Logic ---
code cfv_code.AutoZoomToFit_Logic { // Refactored from AutoZoomToFitComponent
    title: "Auto Zoom-to-Fit Logic for React Flow"
    part_of_design: cfv_designs.AutoZoomToFitService
    language: "TypeScriptReact" // Implies hook or component logic
    implementation_location: {
        filepath: "hooks/useAutoZoomToFit.ts", // Example: as a custom hook
        entry_point_name: "useAutoZoomToFit",
        entry_point_type: "function_hook"
    }
    signature: "(params: { currentFlowFqn: string | null; nodes: cfv_models.ReactFlowNode[]; isGeneratingGraph: boolean; isUserInteractingManualZoom: boolean }) => void"
    detailed_behavior: `
        // Human Review Focus: Timing coordination, user experience, performance optimization.
        // AI Agent Target: Implement smooth auto zoom-to-fit when flows change.

        DECLARE fitView = CALL ReactFlowAPI.useReactFlow().fitView // This implies useReactFlow() is called at hook top level
        DECLARE lastFlowFqnRef = USE_REF_HOOK { initial_value: null, refType: "string | null" }
        DECLARE lastNodeCountRef = USE_REF_HOOK { initial_value: 0, refType: "number" }
        DECLARE timeoutIdRef = USE_REF_HOOK { initial_value: null, refType: "any" } // For NodeJS.Timeout or number

        USE_EFFECT_HOOK {
            dependencies: [params.currentFlowFqn, params.nodes.length, params.isGeneratingGraph, fitView, params.isUserInteractingManualZoom]
            logic: \`
                IF params.isUserInteractingManualZoom THEN RETURN_VALUE END_IF // Respect user manual zoom

                DECLARE flowChanged = lastFlowFqnRef.current NOT_EQUALS params.currentFlowFqn
                DECLARE nodeCountChanged = lastNodeCountRef.current NOT_EQUALS params.nodes.length
                DECLARE hasNodes = params.nodes.length > 0

                IF (flowChanged OR nodeCountChanged) AND NOT params.isGeneratingGraph AND hasNodes THEN
                    // Clear previous timeout if any
                    IF timeoutIdRef.current IS_NOT_NULL THEN
                        CALL GlobalTimers.clearTimeout WITH { timeoutId: timeoutIdRef.current }
                    END_IF

                    DECLARE newTimeoutId
                    CALL GlobalTimers.setTimeout WITH { callback: ASYNC_FUNCTION () => {
                        TRY
                            DECLARE isLongFlow = params.nodes.length > 8
                            DECLARE padding = isLongFlow ? 0.15 : 0.1
                            DECLARE minZoom = isLongFlow ? 0.05 : 0.1 // More aggressive for long flows
                            CALL fitView WITH { options: { duration: 800, padding: padding, minZoom: minZoom, maxZoom: 1.5 } }
                        CATCH_ERROR error
                            CALL AbstractLogger.logError WITH { message: "Failed to auto-fit view: " + error.message }
                        END_TRY
                    }, delayMs: 100 } ASSIGN_TO newTimeoutId
                    ASSIGN timeoutIdRef.current = newTimeoutId

                    ASSIGN lastFlowFqnRef.current = params.currentFlowFqn
                    ASSIGN lastNodeCountRef.current = params.nodes.length
                END_IF
            \`
            cleanup_logic: \`
                IF timeoutIdRef.current IS_NOT_NULL THEN
                    CALL GlobalTimers.clearTimeout WITH { timeoutId: timeoutIdRef.current }
                END_IF
            \`
        }
        // This hook doesn't return anything directly to the component rendering it.
    `
    dependencies: [
        "cfv_models.ReactFlowNode",
        "ReactFlowAPI.useReactFlow", // Abstracted hook
        "GlobalTimers.setTimeout",
        "GlobalTimers.clearTimeout",
        "AbstractLogger.logError"
    ]
}


// --- ServerExecutionEngine Logic (from original cfv_internal_code.dspec.md) ---
// These are server-side logic specs, part of cfv_designs.StreamingExecutionAPIService

code cfv_code.ServerExecutionEngine_AnalyzeDependencies {
    title: "Server: Analyze Step Dependencies"
    part_of_design: cfv_designs.StreamingExecutionAPIService
    language: "TypeScript" // Server-side language
    implementation_location: {
        filepath: "server/execution/ServerExecutionEngine.ts", // Example path
        entry_point_name: "analyzeDependencies",
        entry_point_type: "method" // Assuming part of a class
    }
    signature: "(steps: cfv_models.FlowStepDsl[]) => cfv_models.DependencyAnalysis"
    detailed_behavior: `
        // Logic from original cfv_internal_code.ServerExecutionEngine_EnhancedDependencyResolution.analyzeDependencies
        // Ensure all sub-functions like extractStepDependencies, detectCycles, createExecutionOrder
        // are either inlined or CALLs to other `code` specs.

        DECLARE graph AS Map<string, Set<string>>
        CREATE_INSTANCE Map ASSIGN_TO graph // Map<stepId, Set<dependencyStepId>>

        FOR_EACH step IN steps
            DECLARE dependencies = CALL cfv_code.ServerExecutionEngine_ExtractStepDependencies WITH { step: step }
            CALL graph.set WITH { key: step.step_id, value: dependencies }
        END_FOR

        DECLARE cycles = CALL cfv_code.ServerExecutionEngine_DetectCycles WITH { graph: graph }
        // ... (logic for independentSteps and executionOrder) ...
        DECLARE independentStepsResult AS List<String> = [] // Placeholder
        DECLARE executionOrderResult AS List<List<String>> = [] // Placeholder

        DECLARE analysisResult AS cfv_models.DependencyAnalysis
        CREATE_INSTANCE cfv_models.DependencyAnalysis WITH {
            graph: graph,
            cycles: cycles,
            independentSteps: independentStepsResult,
            executionOrder: executionOrderResult
        } ASSIGN_TO analysisResult

        RETURN_VALUE analysisResult
    `
    dependencies: [
        "cfv_models.FlowStepDsl",
        "cfv_models.DependencyAnalysis",
        "cfv_code.ServerExecutionEngine_ExtractStepDependencies",
        "cfv_code.ServerExecutionEngine_DetectCycles"
        // "cfv_code.ServerExecutionEngine_CreateExecutionOrder" // If defined
    ]
}

code cfv_code.ServerExecutionEngine_ExtractStepDependencies {
    title: "Server: Extract Dependencies for a Single Step"
    part_of_design: cfv_designs.StreamingExecutionAPIService
    language: "TypeScript"
    implementation_location: {
        filepath: "server/execution/ServerExecutionEngine.ts",
        entry_point_name: "extractStepDependencies",
        entry_point_type: "private_method"
    }
    signature: "(params: { step: cfv_models.FlowStepDsl }) => Set<string>"
    detailed_behavior: `
        // Logic from original cfv_internal_code.ServerExecutionEngine_EnhancedDependencyResolution.extractStepDependencies
        // Ensure extractStepReferencesFromExpression is a CALL to another `code` spec.
        DECLARE step = params.step
        DECLARE dependencies AS Set<string>
        CREATE_INSTANCE Set ASSIGN_TO dependencies

        IF step.run_after IS_PRESENT THEN
            IF IS_ARRAY step.run_after THEN
                FOR_EACH dep IN step.run_after
                    CALL dependencies.add WITH { value: dep }
                END_FOR
            ELSE
                CALL dependencies.add WITH { value: step.run_after }
            END_IF
        END_IF

        IF step.inputs_map IS_PRESENT THEN
            FOR_EACH inputField, sourceExpression IN step.inputs_map // Assuming inputs_map is Record<string,string>
                IF TYPE_OF sourceExpression IS 'string' THEN
                    DECLARE stepRefs = CALL cfv_code.ServerExecutionEngine_ExtractStepReferencesFromExpression WITH { expression: sourceExpression }
                    FOR_EACH stepRef IN stepRefs
                        CALL dependencies.add WITH { value: stepRef }
                    END_FOR
                END_IF
            END_FOR
        END_IF

        IF step.condition IS_PRESENT AND TYPE_OF step.condition IS 'string' THEN
            DECLARE stepRefsInCondition = CALL cfv_code.ServerExecutionEngine_ExtractStepReferencesFromExpression WITH { expression: step.condition }
            FOR_EACH stepRefInCondition IN stepRefsInCondition
                CALL dependencies.add WITH { value: stepRefInCondition }
            END_FOR
        END_IF
        RETURN_VALUE dependencies
    `
    dependencies: [
        "cfv_models.FlowStepDsl",
        "cfv_code.ServerExecutionEngine_ExtractStepReferencesFromExpression"
    ]
}

code cfv_code.ServerExecutionEngine_ExtractStepReferencesFromExpression {
    title: "Server: Extract Step References from Expression String"
    part_of_design: cfv_designs.StreamingExecutionAPIService
    language: "TypeScript"
    implementation_location: {
        filepath: "server/execution/ServerExecutionEngineUtils.ts", // Example utility file
        entry_point_name: "extractStepReferencesFromExpression",
        entry_point_type: "function"
    }
    signature: "(params: { expression: string }) => Set<string>"
    detailed_behavior: `
        // Logic from original cfv_internal_code.ServerExecutionEngine_EnhancedDependencyResolution.extractStepReferencesFromExpression
        // This involves regex matching. The DSpec can describe the patterns.
        DECLARE expression = params.expression
        DECLARE stepReferences AS Set<string>
        CREATE_INSTANCE Set ASSIGN_TO stepReferences

        // Primary pattern: steps.stepName.outputs.path or steps.stepName.field
        DECLARE primaryPattern = /steps\\.([a-zA-Z0-9_-]+)/g // Simplified regex for DSpec
        DECLARE matches
        ASSIGN matches = CALL RegExpAPI.matchAll WITH { text: expression, pattern: primaryPattern } // Abstract regex call
        FOR_EACH match IN matches
            IF match[1] IS_NOT_NULL THEN
                 CALL stepReferences.add WITH { value: match[1] }
            END_IF
        END_FOR

        // Consider direct references if not "steps." prefix, excluding "trigger." and "context."
        DECLARE directPattern = /(?<!steps\\.|trigger\\.|context\\.)([a-zA-Z0-9_-]+)\\.outputs\\./g // More complex regex
        // ... similar logic for directPattern ...

        RETURN_VALUE stepReferences
    `
    dependencies: ["RegExpAPI.matchAll"] // Abstracting regex operations
}

code cfv_code.ServerExecutionEngine_DetectCycles {
    title: "Server: Detect Cycles in Dependency Graph"
    part_of_design: cfv_designs.StreamingExecutionAPIService
    language: "TypeScript"
    implementation_location: {
        filepath: "server/execution/ServerExecutionEngineUtils.ts",
        entry_point_name: "detectCyclesDFS", // Example name for DFS based cycle detection
        entry_point_type: "function"
    }
    signature: "(params: { graph: Map<string, Set<string>> }) => List<List<String>>"
    detailed_behavior: `
        // Logic from original cfv_internal_code.ServerExecutionEngine_EnhancedDependencyResolution.detectCycles
        // This is a standard DFS algorithm.
        DECLARE graph = params.graph
        DECLARE visited AS Set<string>; CREATE_INSTANCE Set ASSIGN_TO visited
        DECLARE recursionStack AS Set<string>; CREATE_INSTANCE Set ASSIGN_TO recursionStack
        DECLARE cyclesResult AS List<List<String>> = []

        FUNCTION dfs(node, path) // path is List<String>
            CALL visited.add WITH { value: node }
            CALL recursionStack.add WITH { value: node }
            ADD node TO path

            DECLARE neighbors = CALL graph.get WITH { key: node } OR (CREATE_INSTANCE Set)
            FOR_EACH neighbor IN neighbors
                IF NOT (CALL visited.has WITH { value: neighbor }) THEN
                    IF CALL dfs WITH { node: neighbor, path: path } THEN RETURN_VALUE true END_IF
                ELSE_IF CALL recursionStack.has WITH { value: neighbor } THEN
                    // Cycle detected
                    DECLARE cycleStartIndex = CALL path.indexOf WITH { value: neighbor }
                    DECLARE detectedCycle = CALL path.slice WITH { start: cycleStartIndex }
                    ADD detectedCycle TO cyclesResult
                    // Depending on policy, might return true to stop on first cycle, or continue finding all
                END_IF
            END_FOR

            REMOVE node FROM path
            CALL recursionStack.delete WITH { value: node }
            RETURN_VALUE false
        END_FUNCTION

        FOR_EACH nodeKey IN (CALL graph.keys)
            IF NOT (CALL visited.has WITH { value: nodeKey }) THEN
                CALL dfs WITH { node: nodeKey, path: [] }
            END_IF
        END_FOR
        RETURN_VALUE cyclesResult
    `
    dependencies: [] // Standard data structures and algorithm
}

// ... Other ServerExecutionEngine methods like ExecuteStepsWithEnhancedDependencyResolution, ResolveInputMapping
// would be refactored into their own `code` specs similarly.

// --- ClientExecutionStreamHandler Logic (from original cfv_internal_code.dspec.md) ---

code cfv_code.ClientExecutionStreamHandler_HandleStreamingEvent {
    title: "Client: Handle Single Streaming Execution Event"
    part_of_design: cfv_designs.ClientExecutionStreamHandler
    language: "TypeScript"
    implementation_location: {
        filepath: "services/ClientExecutionStreamHandlerLogic.ts",
        entry_point_name: "handleStreamingEvent",
        entry_point_type: "function" // Pure function: takes current trace, event -> returns new trace
    }
    signature: "(event: cfv_models.StreamingExecutionEvent, currentTrace: cfv_models.FlowExecutionTrace, flowDefinitionFromStartEvent?: cfv_models.FlowDefinitionDsl) => cfv_models.FlowExecutionTrace"
    detailed_behavior: `
        // Logic from original cfv_internal_code.ClientExecutionStreamHandler_EnhancedStateManagement.detailed_behavior
        // Ensure all state updates create NEW objects/maps for React reactivity.

        DECLARE newTrace AS cfv_models.FlowExecutionTrace
        // CRITICAL: Deep clone or spread carefully to ensure immutability
        CREATE_INSTANCE cfv_models.FlowExecutionTrace WITH { ...currentTrace } ASSIGN_TO newTrace
        IF newTrace.steps IS_PRESENT THEN // Ensure steps map is also new instance
            ASSIGN newTrace.steps = (CREATE_INSTANCE Map FROM newTrace.steps)
        ELSE
            ASSIGN newTrace.steps = (CREATE_INSTANCE Map)
        END_IF


        SWITCH event.type
            CASE 'execution.started'
                DECLARE executionStartedData = event.data AS cfv_models.ExecutionStartedEventData
                DECLARE flowDefToUse = flowDefinitionFromStartEvent // Or executionStartedData.flowDefinition
                // Pre-populate all steps from flowDefToUse with PENDING status
                IF flowDefToUse.steps IS_PRESENT THEN
                    FOR_EACH stepDef IN flowDefToUse.steps
                        DECLARE stepTracePlaceholder AS cfv_models.StepExecutionTrace
                        CREATE_INSTANCE cfv_models.StepExecutionTrace WITH {
                            stepId: stepDef.step_id,
                            componentFqn: stepDef.component_ref, // Assuming component_ref is FQN or resolvable
                            status: 'PENDING',
                            startTime: null, endTime: null, durationMs: null,
                            inputData: null, outputData: null, executionOrder: null
                        } ASSIGN_TO stepTracePlaceholder
                        CALL newTrace.steps.set WITH { key: stepDef.step_id, value: stepTracePlaceholder }
                    END_FOR
                END_IF
                ASSIGN newTrace.status = 'RUNNING'
                ASSIGN newTrace.startTime = event.timestamp
                ASSIGN newTrace.flowFqn = executionStartedData.flowFqn
                ASSIGN newTrace.triggerData = executionStartedData.triggerInput
                BREAK

            CASE 'step.started'
                DECLARE stepStartedData = event.data AS cfv_models.StepStartedEventData
                IF (CALL newTrace.steps.has WITH { key: stepStartedData.stepId }) THEN
                    DECLARE existingStep = CALL newTrace.steps.get WITH { key: stepStartedData.stepId }
                    DECLARE updatedStep AS cfv_models.StepExecutionTrace
                    CREATE_INSTANCE cfv_models.StepExecutionTrace WITH {
                        ...existingStep,
                        status: 'RUNNING',
                        startTime: event.timestamp,
                        inputData: stepStartedData.inputData,
                        executionOrder: stepStartedData.executionOrder
                    } ASSIGN_TO updatedStep
                    CALL newTrace.steps.set WITH { key: stepStartedData.stepId, value: updatedStep }
                END_IF
                BREAK

            // ... Other cases (step.completed, step.failed, execution.completed, execution.failed) similarly ...
            // Ensure new StepExecutionTrace objects are created for updates.

            CASE 'step.completed'
                DECLARE stepCompletedData = event.data AS cfv_models.StepCompletedEventData
                IF (CALL newTrace.steps.has WITH { key: stepCompletedData.stepId }) THEN
                    DECLARE existingStep = CALL newTrace.steps.get WITH { key: stepCompletedData.stepId }
                    DECLARE updatedStep AS cfv_models.StepExecutionTrace
                    CREATE_INSTANCE cfv_models.StepExecutionTrace WITH {
                        ...existingStep,
                        status: 'SUCCESS',
                        endTime: event.timestamp,
                        durationMs: stepCompletedData.actualDuration,
                        outputData: stepCompletedData.outputData
                    } ASSIGN_TO updatedStep
                    CALL newTrace.steps.set WITH { key: stepCompletedData.stepId, value: updatedStep }
                END_IF
                BREAK

            CASE 'step.failed'
                DECLARE stepFailedData = event.data AS cfv_models.StepFailedEventData
                IF (CALL newTrace.steps.has WITH { key: stepFailedData.stepId }) THEN
                    DECLARE existingStep = CALL newTrace.steps.get WITH { key: stepFailedData.stepId }
                    DECLARE updatedStep AS cfv_models.StepExecutionTrace
                    CREATE_INSTANCE cfv_models.StepExecutionTrace WITH {
                        ...existingStep,
                        status: 'FAILURE',
                        endTime: event.timestamp,
                        durationMs: stepFailedData.actualDuration, // If available
                        errorData: stepFailedData.error // errorData is the cfv_models.ExecutionError
                    } ASSIGN_TO updatedStep
                    CALL newTrace.steps.set WITH { key: stepFailedData.stepId, value: updatedStep }
                END_IF
                BREAK

            CASE 'execution.completed'
                DECLARE executionCompletedData = event.data AS cfv_models.ExecutionCompletedEventData
                ASSIGN newTrace.status = 'COMPLETED'
                ASSIGN newTrace.endTime = event.timestamp
                ASSIGN newTrace.finalOutput = executionCompletedData.finalOutput // If present
                IF executionCompletedData.totalDuration IS_PRESENT THEN ASSIGN newTrace.durationMs = executionCompletedData.totalDuration END_IF
                BREAK

            CASE 'execution.failed'
                DECLARE executionFailedData = event.data AS cfv_models.ExecutionFailedEventData
                ASSIGN newTrace.status = 'FAILED'
                ASSIGN newTrace.endTime = event.timestamp
                ASSIGN newTrace.flowError = executionFailedData.error // flowError is cfv_models.ExecutionError
                IF executionFailedData.totalDuration IS_PRESENT THEN ASSIGN newTrace.durationMs = executionFailedData.totalDuration END_IF
                BREAK

            CASE 'execution.warning' // Handle warnings if needed
                DECLARE warningData = event.data AS cfv_models.ExecutionWarningEventData
                // Store warning in trace or log it. For simplicity, logging it here.
                CALL AbstractLogger.logWarning WITH { message: "Execution Warning for " + newTrace.flowFqn + ": " + warningData.message }
                BREAK

            DEFAULT
                CALL AbstractLogger.logWarning WITH { message: "Unknown streaming event type: " + event.type }
                BREAK
        END_SWITCH

        ASSIGN newTrace.lastUpdated = CALL SystemTime.now // Forcing re-render via timestamp
        RETURN_VALUE newTrace
    `
    dependencies: [
        "cfv_models.StreamingExecutionEvent",
        "cfv_models.FlowExecutionTrace",
        "cfv_models.StepExecutionTrace",
        "cfv_models.ExecutionStatusEnum",
        "cfv_models.FlowDefinitionDsl", // For execution.started event
        "cfv_models.ExecutionStartedEventData",
        "cfv_models.StepStartedEventData",
        "cfv_models.StepCompletedEventData",
        "cfv_models.StepFailedEventData",
        "cfv_models.ExecutionCompletedEventData",
        "cfv_models.ExecutionFailedEventData",
        "cfv_models.ExecutionWarningEventData",
        "AbstractLogger.logWarning",
        "SystemTime.now"
    ]
}

// --- Code specs refactored from cfv_internal_services_code.dspec.md ---

// Grouping design: cfv_designs.InternalFlowSimulationLogic
code cfv_code.InternalFlowSimulation_SimulateFlowExecution { // Replaces service method
    title: "Internal Client-Side: Simulate Complete Flow Execution (Simplified for Debug Tab)"
    part_of_design: cfv_designs.InternalFlowSimulationLogic
    signature: `(params: {
        flowFqn: string,
        triggerInput: any,
        targetStepId?: string,
        moduleRegistry: cfv_models.IModuleRegistry,
        componentSchemas: Record<string, cfv_models.ComponentSchema>,
        executionOptions?: cfv_models.ExecutionOptions
    }) => Promise<cfv_models.FlowSimulationResult>`
    detailed_behavior: \`
        // This is a SIMPLIFIED client-side simulation, primarily for `resolveStepInputData` or basic UI previews.
        // Complex execution is server-side.
        // Based on original cfv_internal_services_code.FlowSimulationService.simulateFlowExecution

        DECLARE flowFqn = params.flowFqn
        DECLARE triggerInput = params.triggerInput
        DECLARE targetStepId = params.targetStepId
        DECLARE moduleRegistry = params.moduleRegistry
        DECLARE componentSchemas = params.componentSchemas
        DECLARE executionOptions = params.executionOptions

        DECLARE flowDef = CALL moduleRegistry.getFlowDefinition WITH { fqn: flowFqn } // Abstracted
        IF flowDef IS_NULL THEN
            THROW_ERROR "Flow not found: " + flowFqn
        END_IF

        DECLARE executionContext AS cfv_models.ExecutionContext
        CREATE_INSTANCE cfv_models.ExecutionContext WITH {
            flowFqn: flowFqn,
            executionId: "sim-" + (CALL Math.random), // Simplified ID
            startTime: (CALL SystemTime.toISOString WITH { date: (CALL SystemTime.now) }),
            triggerInput: triggerInput,
            stepResults: (CREATE_INSTANCE Map),
            contextVariables: (CREATE_INSTANCE Map),
            executionLog: [],
            errors: []
        } ASSIGN_TO executionContext

        // Load context variables from module (simplified)
        // DECLARE moduleContext = CALL moduleRegistry.getModuleContext WITH { moduleFqn: flowDef.moduleFqn }
        // IF moduleContext.contextVariables IS_PRESENT THEN ... populate executionContext.contextVariables ... END_IF

        // Execute trigger (client-side simulation)
        DECLARE triggerSimResult = CALL cfv_code.InternalComponentExecution_SimulateTrigger WITH { triggerDef: flowDef.trigger, triggerInput: triggerInput, context: executionContext }
        CALL executionContext.stepResults.set WITH { key: 'trigger', value: triggerSimResult }

        DECLARE stepsToExecute AS List<cfv_models.FlowStepDsl> = []
        IF flowDef.steps IS_PRESENT THEN
            IF targetStepId IS_PRESENT THEN
                // Simplified: get steps up to target
                FOR_EACH step IN flowDef.steps
                    ADD step TO stepsToExecute
                    IF step.step_id EQUALS targetStepId THEN BREAK END_IF
                END_FOR
            ELSE
                ASSIGN stepsToExecute = flowDef.steps
            END_IF
        END_IF

        FOR_EACH step IN stepsToExecute
            TRY
                DECLARE stepInputData = CALL cfv_code.InternalFlowSimulation_ResolveStepInput WITH { step: step, executionContext: executionContext, moduleRegistry: moduleRegistry }
                DECLARE stepSimResult = CALL cfv_code.InternalComponentExecution_SimulateStep WITH { step: step, stepInput: stepInputData, context: executionContext, componentSchemas: componentSchemas }
                CALL executionContext.stepResults.set WITH { key: step.step_id, value: stepSimResult }

                IF step.step_id EQUALS targetStepId THEN BREAK END_IF
            CATCH_ERROR e
                // ... error handling ...
                IF executionOptions.continueOnError IS_FALSE THEN BREAK END_IF
            END_TRY
        END_FOR

        DECLARE finalSimResult AS cfv_models.FlowSimulationResult
        // ... construct FlowSimulationResult ...
        // For resolvedStepInputs, iterate executionContext.stepResults and extract inputData
        // For simulatedStepOutputs, iterate executionContext.stepResults and extract outputData
        // For finalInputData (if targetStepId), get it from the target step's resolved input.
        CREATE_INSTANCE cfv_models.FlowSimulationResult WITH {
            flowFqn: flowFqn,
            targetStepId: targetStepId,
            status: (executionContext.errors.length > 0 ? 'FAILED' : 'COMPLETED'), // Simplified status
            triggerInputData: triggerInput,
            // Populate resolvedStepInputs, simulatedStepOutputs, finalContextState, errors, etc.
            // from executionContext.
            stepResults: Object.fromEntries(executionContext.stepResults) // Convert Map to Record
        } ASSIGN_TO finalSimResult
        RETURN_VALUE finalSimResult
    \`
    dependencies: [
        "cfv_models.IModuleRegistry", "cfv_models.ComponentSchema", "cfv_models.ExecutionOptions", "cfv_models.FlowSimulationResult",
        "cfv_models.ExecutionContext", "cfv_models.FlowStepDsl",
        "cfv_code.InternalComponentExecution_SimulateTrigger",
        "cfv_code.InternalFlowSimulation_ResolveStepInput",
        "cfv_code.InternalComponentExecution_SimulateStep",
        "Math.random", "SystemTime.now", "SystemTime.toISOString"
    ]
}

code cfv_code.InternalFlowSimulation_ResolveStepInput { // Replaces service method
    title: "Internal Client-Side: Resolve Step Input Data (Simplified)"
    part_of_design: cfv_designs.InternalFlowSimulationLogic
    signature: `(params: {
        step: cfv_models.FlowStepDsl,
        executionContext: cfv_models.ExecutionContext,
        moduleRegistry: cfv_models.IModuleRegistry
    }) => cfv_models.ResolvedStepInput` // Return ResolvedStepInput for direct use in forms
    detailed_behavior: \`
        // Based on original cfv_internal_services_code.FlowSimulationService.resolveStepInput
        // Simplified for client-side needs (e.g., populating Debug & Test tab forms).
        DECLARE step = params.step
        DECLARE executionContext = params.executionContext
        DECLARE resolvedInputData AS cfv_models.Any = {}
        DECLARE inputSources AS List<cfv_models.Any> = [] // Simplified inputSources structure for client

        IF step.inputs_map IS_PRESENT THEN
            FOR_EACH inputKey, sourceExpression IN step.inputs_map
                DECLARE resolvedValue = null
                DECLARE sourceInfo = { type: 'unknown', expression: sourceExpression }

                IF sourceExpression.startsWith('trigger.') THEN
                    DECLARE triggerResult = CALL executionContext.stepResults.get WITH { key: 'trigger' }
                    DECLARE triggerPath = CALL sourceExpression.substring WITH { start: 8 }
                    ASSIGN resolvedValue = CALL GetNestedValueUtility.get WITH { obj: triggerResult.outputData, path: triggerPath } // Abstracted
                    ASSIGN sourceInfo.type = 'trigger'
                    ASSIGN sourceInfo.path = triggerPath
                ELSE_IF sourceExpression.startsWith('steps.') THEN
                    DECLARE stepsMatch = CALL RegExpAPI.match WITH { text: sourceExpression, pattern: /^steps\\.([^.]+)\\.(.+)$/ }
                    IF stepsMatch IS_PRESENT THEN
                        DECLARE sourceStepId = stepsMatch[1]
                        DECLARE outputPath = stepsMatch[2]
                        DECLARE sourceStepResult = CALL executionContext.stepResults.get WITH { key: sourceStepId }
                        IF sourceStepResult IS_PRESENT AND sourceStepResult.outputData IS_PRESENT THEN
                            IF outputPath.startsWith('outputs.') THEN
                                DECLARE actualPath = CALL outputPath.substring WITH { start: 8 }
                                ASSIGN resolvedValue = CALL GetNestedValueUtility.get WITH { obj: sourceStepResult.outputData, path: actualPath }
                            ELSE
                                ASSIGN resolvedValue = CALL GetNestedValueUtility.get WITH { obj: sourceStepResult.outputData, path: outputPath }
                            END_IF
                            ASSIGN sourceInfo.type = 'step'; ASSIGN sourceInfo.stepId = sourceStepId; ASSIGN sourceInfo.path = outputPath
                        ELSE
                            ASSIGN sourceInfo.error = 'step_not_found_or_no_output'
                        END_IF
                    ELSE
                        ASSIGN sourceInfo.error = 'invalid_steps_expression'
                    END_IF
                ELSE_IF sourceExpression.startsWith('context.') THEN
                    DECLARE contextKey = CALL sourceExpression.substring WITH { start: 8 }
                    ASSIGN resolvedValue = CALL executionContext.contextVariables.get WITH { key: contextKey }
                    ASSIGN sourceInfo.type = 'context'; ASSIGN sourceInfo.key = contextKey
                ELSE
                    ASSIGN resolvedValue = sourceExpression // Literal
                    ASSIGN sourceInfo.type = 'literal'
                END_IF
                ASSIGN resolvedInputData[inputKey] = resolvedValue
                ADD { inputKey: inputKey, sourceExpression: sourceExpression, resolvedValue: resolvedValue, sourceDetails: sourceInfo } TO inputSources
            END_FOR
        ELSE
            // Default: use trigger output if no inputs_map
            DECLARE triggerRes = CALL executionContext.stepResults.get WITH { key: 'trigger' }
            ASSIGN resolvedInputData = triggerRes.outputData OR {}
            ADD { inputKey: '_default', sourceExpression: 'trigger', resolvedValue: resolvedInputData, sourceDetails: {type: 'trigger'} } TO inputSources
        END_IF

        // Get component schema for the ResolvedStepInput
        DECLARE componentInfo = CALL params.moduleRegistry.resolveComponentTypeInfo WITH { componentRef: step.component_ref, currentModuleFqn: executionContext.flowFqn }
        DECLARE componentSchema = null
        IF componentInfo IS_PRESENT THEN
             ASSIGN componentSchema = CALL params.moduleRegistry.getComponentSchema WITH { componentTypeFqn: componentInfo.baseType }
        END_IF

        DECLARE resolvedStepInputResult AS cfv_models.ResolvedStepInput
        CREATE_INSTANCE cfv_models.ResolvedStepInput WITH {
            stepId: step.step_id,
            flowFqn: executionContext.flowFqn,
            componentFqn: componentInfo.baseType OR step.component_ref,
            componentSchema: componentSchema,
            actualInputData: resolvedInputData,
            dslConfig: step.config, // Assuming step.config is the DSL config
            availableContext: Object.fromEntries(executionContext.contextVariables), // Convert Map
            inputSources: inputSources // Simplified for client
        } ASSIGN_TO resolvedStepInputResult
        RETURN_VALUE resolvedStepInputResult
    \`
    dependencies: [
        "cfv_models.FlowStepDsl", "cfv_models.ExecutionContext", "cfv_models.ResolvedStepInput", "cfv_models.IModuleRegistry",
        "GetNestedValueUtility.get", // Assumed utility
        "RegExpAPI.match"
    ]
}


// ... Other refactored `code` specs from cfv_internal_services_code.dspec.md
// (e.g., for ComponentExecutionService, YamlReconstructionService, TraceVisualizationService, etc.)
// would follow a similar pattern:
// - Create a `code cfv_code.ServiceName_MethodName` artifact.
// - Assign `part_of_design: cfv_designs.InternalServiceNameLogic`.
// - Define `signature` based on original.
// - Move `implementation` content to `detailed_behavior`, abstracting library calls.
// - List `dependencies`.

// Example placeholder for a refactored ComponentExecution method:
code cfv_code.InternalComponentExecution_SimulateTrigger {
    title: "Internal Client-Side: Simulate Trigger Execution"
    part_of_design: cfv_designs.InternalComponentExecutionLogic
    signature: "(params: { triggerDef: cfv_models.Any, triggerInput: cfv_models.Any, context: cfv_models.ExecutionContext }) => cfv_models.StepSimulationResult"
    detailed_behavior: \`
        // Simplified client-side simulation logic from original ComponentExecutionService.executeTrigger
        // Focus on producing a plausible outputData structure for form pre-population or basic simulation.
        DECLARE triggerDef = params.triggerDef
        DECLARE triggerInput = params.triggerInput
        DECLARE outputData = triggerInput // Base case

        IF triggerDef.type EQUALS 'StdLib.Trigger:Http' THEN
            CREATE_INSTANCE cfv_models.Any WITH {
                body: triggerInput.body OR triggerInput,
                headers: triggerInput.headers OR {},
                query: triggerInput.query OR {},
                method: triggerDef.config.method OR 'POST',
                path: triggerDef.config.path OR '/api/trigger'
            } ASSIGN_TO outputData
        END_IF
        // ... other trigger types ...

        DECLARE result AS cfv_models.StepSimulationResult
        CREATE_INSTANCE cfv_models.StepSimulationResult WITH {
            stepId: 'trigger',
            componentFqn: triggerDef.type,
            inputData: triggerInput,
            outputData: outputData,
            executionTime: 0, // Client sim doesn't track time accurately
            timestamp: (CALL SystemTime.toISOString WITH { date: (CALL SystemTime.now) }),
            simulationSuccess: true // Assume success for client sim
        } ASSIGN_TO result
        RETURN_VALUE result
    \`
    dependencies: ["SystemTime.now", "SystemTime.toISOString"]
}

code cfv_code.InternalComponentExecution_SimulateStep {
    title: "Internal Client-Side: Simulate Step Execution (Mock/Simplified)"
    part_of_design: cfv_designs.InternalComponentExecutionLogic
    signature: "(params: { step: cfv_models.FlowStepDsl, stepInput: cfv_models.ResolvedStepInput, context: cfv_models.ExecutionContext, componentSchemas: Record<string, cfv_models.ComponentSchema> }) => cfv_models.StepSimulationResult"
    detailed_behavior: \`
        // Simplified client-side simulation logic from original ComponentExecutionService.executeStep
        // and simulateComponentExecution. Focus on generating plausible output for UI/form purposes.
        DECLARE step = params.step
        DECLARE resolvedInputData = params.stepInput.actualInputData
        DECLARE config = step.config
        DECLARE componentSchema = params.componentSchemas[step.component_ref]

        DECLARE simulatedOutput = CALL cfv_code.InternalDataGeneration_SimulateComponentExecutionForClient WITH {
            componentType: step.component_ref,
            inputData: resolvedInputData,
            config: config,
            componentSchema: componentSchema
        }

        DECLARE result AS cfv_models.StepSimulationResult
        CREATE_INSTANCE cfv_models.StepSimulationResult WITH {
            stepId: step.step_id,
            componentFqn: step.component_ref,
            inputData: resolvedInputData,
            outputData: simulatedOutput,
            executionTime: (simulatedOutput.executionTiming.estimatedDurationMs OR 10), // Use estimated if available
            timestamp: (CALL SystemTime.toISOString WITH { date: (CALL SystemTime.now) }),
            simulationSuccess: true, // Assume success
            inputSources: params.stepInput.inputSources
        } ASSIGN_TO result
        RETURN_VALUE result
    \`
    dependencies: ["cfv_code.InternalDataGeneration_SimulateComponentExecutionForClient", "SystemTime.now", "SystemTime.toISOString"]
}

// This replaces the complex simulateComponentExecution from cfv_internal_services_code
code cfv_code.InternalDataGeneration_SimulateComponentExecutionForClient {
    title: "Internal Client-Side: Simulate Component Output for UI/Forms"
    part_of_design: cfv_designs.InternalDataGenerationLogic // Or ComponentExecutionLogic
    signature: "(params: { componentType: string, inputData: any, config: any, componentSchema?: cfv_models.ComponentSchema }) => any"
    detailed_behavior: \`
        // This is the refactored and SIMPLIFIED version of the original simulateComponentExecution.
        // Its primary goal is to generate plausible output data for client-side use cases
        // (e.g., populating next step's input form, UI previews).
        // It should NOT replicate complex business logic, which is now server-side.
        // It SHOULD use componentSchema.outputSchema to generate data if possible.

        DECLARE componentType = params.componentType
        DECLARE inputData = params.inputData
        DECLARE config = params.config
        DECLARE componentSchema = params.componentSchema
        DECLARE outputPayload = {} // Default empty object

        IF componentSchema.outputSchema IS_PRESENT THEN
            // Use a generic schema-to-data generator for "happy path"
            ASSIGN outputPayload = CALL cfv_code.InternalDataGeneration_GenerateDataFromSchema WITH { schema: componentSchema.outputSchema, scenario: 'happyPath' }
        ELSE
            // Fallback for components without output schemas: pass through input or provide generic structure
            SWITCH componentType
                CASE 'StdLib:Fork'
                    DECLARE forkOutputs = {}
                    IF config.outputNames IS_PRESENT THEN
                        FOR_EACH outputName IN config.outputNames
                            ASSIGN forkOutputs[outputName] = inputData
                        END_FOR
                    ELSE
                        ASSIGN forkOutputs.default = inputData
                    END_IF
                    ASSIGN outputPayload = { branches: forkOutputs }
                    BREAK
                CASE 'StdLib:JsonSchemaValidator'
                    ASSIGN outputPayload = { isValid: true, validData: (inputData.data OR inputData) }
                    BREAK
                // Add other common StdLib components with simple, predictable outputs.
                DEFAULT
                    // Generic passthrough or minimal structure
                    ASSIGN outputPayload = { result: inputData, message: "Simulated client-side output for " + componentType }
                    BREAK
            END_SWITCH
        END_IF

        // Add minimal executionTiming for client-side estimates if needed by UI.
        DECLARE timingInfo = { isAsync: false, estimatedDurationMs: 10 }
        IF componentType.includes("HttpCall") OR componentType.includes("SubFlowInvoker") OR componentType.includes("WaitForDuration") THEN
            ASSIGN timingInfo.isAsync = true
            ASSIGN timingInfo.estimatedDurationMs = (config.timeoutMs * 0.5) OR (config.durationMs) OR 500 // Rough estimate
        END_IF
        IF componentType.includes("Fork") THEN
            ASSIGN timingInfo.enablesParallelExecution = true
        END_IF

        RETURN_VALUE { ...outputPayload, executionTiming: timingInfo } // Combine payload with timing
    \`
    dependencies: ["cfv_code.InternalDataGeneration_GenerateDataFromSchema"]
}

// Placeholder for schema-based data generation (used by SimulateComponentExecutionForClient)
code cfv_code.InternalDataGeneration_GenerateDataFromSchema {
    title: "Internal: Generate Data from JSON Schema (Happy Path)"
    part_of_design: cfv_designs.InternalDataGenerationLogic
    signature: "(params: { schema: cfv_models.JsonSchemaObject, scenario: 'happyPath' | 'empty' }) => any"
    detailed_behavior: \`
        // Simplified: in reality, this would be a recursive function that respects
        // schema types, properties, items, required fields, defaults, enums, formats etc.
        // For 'happyPath', it generates plausible values. For 'empty', it generates minimal valid structure.
        DECLARE schema = params.schema
        IF schema.type EQUALS 'object' THEN
            DECLARE obj = {}
            IF schema.properties IS_PRESENT THEN
                FOR_EACH propName, propSchema IN schema.properties
                    // For happy path, generate for all. For empty, only required or minimal.
                    ASSIGN obj[propName] = CALL cfv_code.InternalDataGeneration_GenerateDataFromSchema WITH { schema: propSchema, scenario: params.scenario }
                END_FOR
            END_IF
            RETURN_VALUE obj
        ELSE_IF schema.type EQUALS 'array' THEN
            // Generate one item for happy path, empty array for 'empty' unless minItems > 0
            RETURN_VALUE []
        ELSE_IF schema.type EQUALS 'string' THEN
            RETURN_VALUE "sample string"
        ELSE_IF schema.type EQUALS 'number' OR schema.type EQUALS 'integer' THEN
            RETURN_VALUE 0
        ELSE_IF schema.type EQUALS 'boolean' THEN
            RETURN_VALUE true
        ELSE
            RETURN_VALUE null
        END_IF
    \`
    dependencies: [] // Recursive call to self
}

// ... more code specs for YamlReconstruction, TraceVisualization, GraphBuilder etc. ...
// Each method in the original cfv_internal_services_code.dspec.md becomes a `code` spec here.