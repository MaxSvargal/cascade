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