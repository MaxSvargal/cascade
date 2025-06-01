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
        // AI Agent Target: Generate automatic graph layout using ELK.js.

        // 1. Validate inputs and set defaults
        IF nodes.length IS_ZERO THEN
            RETURN_VALUE { nodes, edges }
        END_IF
        
        DECLARE layoutOptions = MERGE_OBJECTS(defaultLayoutOptions, options)
        
        // 2. Calculate node sizes based on content if enabled
        IF layoutOptions.nodeSize.calculateFromContent IS_TRUE THEN
            FOR_EACH node IN nodes
                DECLARE calculatedSize = CALL calculateNodeSize WITH node
                ASSIGN node.style = MERGE_OBJECTS(node.style, calculatedSize)
            END_FOR
        END_IF
        
        // 3. Convert React Flow format to ELK format
        DECLARE elkNodes = MAP nodes TO elkNode FORMAT
        DECLARE elkEdges = MAP edges TO elkEdge FORMAT
        
        // 4. Configure ELK layout options based on algorithm
        DECLARE elkLayoutOptions = BUILD_ELK_OPTIONS(layoutOptions)
        
        // 5. Execute ELK layout
        TRY
            DECLARE layoutedGraph = AWAIT elk.layout WITH elkGraph
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
    title: "Content-Based Node Sizing Calculation"
    part_of_design: cfv_designs.LayoutService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/layoutService.ts",
        entry_point_name: "calculateNodeSize",
        entry_point_type: "function"
    }
    signature: "(node: Node) => { width: number; height: number }"
    
    detailed_behavior: `
        // Calculate node dimensions based on content
        DECLARE baseWidth = 150
        DECLARE baseHeight = 80
        
        IF node.data?.label IS_DEFINED THEN
            DECLARE textLength = node.data.label.length
            DECLARE calculatedWidth = MAX(baseWidth, textLength * 8 + 40)
            
            DECLARE calculatedHeight = baseHeight
            IF node.data?.resolvedComponentFqn THEN calculatedHeight += 20
            IF node.data?.executionStatus THEN calculatedHeight += 20
            IF node.data?.error THEN calculatedHeight += 20
            IF node.data?.invokedFlowFqn THEN calculatedHeight += 20
            
            RETURN_VALUE {
                width: MIN(calculatedWidth, 250),
                height: MIN(calculatedHeight, 150)
            }
        END_IF
        
        RETURN_VALUE { width: baseWidth, height: baseHeight }
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

// --- Enhanced Graph Builder Service Logic ---

code cfv_internal_code.GraphBuilderService_GenerateFlowDetailGraphData {
    title: "Generate Flow Detail Graph Data with Enhanced Features"
    part_of_design: cfv_designs.GraphBuilderService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/graphBuilderService.ts",
        entry_point_name: "generateFlowDetailGraphData",
        entry_point_type: "async_function"
    }
    signature: "(params: GenerateFlowDetailParams) => Promise<GraphData>"
    
    detailed_behavior: `
        // Human Review Focus: Enhanced node/edge generation, trace integration, layout application.
        // AI Agent Target: Generate comprehensive flow detail graph with all enhancements.

        DECLARE { flowFqn, mode, moduleRegistry, parseContextVarsFn, componentSchemas, traceData, useAutoLayout } = params
        
        DECLARE flowDefinition = CALL moduleRegistry.getFlowDefinition WITH flowFqn
        IF flowDefinition IS_NULL THEN
            RETURN_VALUE { nodes: [], edges: [] }
        END_IF
        
        DECLARE nodes = []
        DECLARE edges = []
        
        // 1. Generate trigger node
        IF flowDefinition.trigger IS_DEFINED THEN
            DECLARE triggerNodeData = BUILD_TRIGGER_NODE_DATA(flowDefinition.trigger, componentSchemas, parseContextVarsFn)
            ADD_TO nodes {
                id: "trigger",
                type: "triggerNode",
                position: { x: 0, y: 0 },
                data: triggerNodeData
            }
        END_IF
        
        // 2. Generate step nodes with enhanced data
        IF flowDefinition.steps IS_DEFINED THEN
            FOR_EACH step, index IN flowDefinition.steps
                DECLARE stepTrace = FIND traceData?.steps WHERE t.stepId EQUALS step.step_id
                DECLARE componentInfo = CALL moduleRegistry.resolveComponentTypeInfo WITH step.component_ref, flowFqn
                
                DECLARE stepNodeData = BUILD_STEP_NODE_DATA(step, componentInfo, stepTrace, componentSchemas, parseContextVarsFn)
                
                // Check if this is a SubFlowInvoker
                IF componentInfo?.baseType EQUALS "StdLib:SubFlowInvoker" THEN
                    DECLARE subFlowNodeData = BUILD_SUBFLOW_INVOKER_NODE_DATA(stepNodeData, step.config?.flow_fqn)
                    ADD_TO nodes {
                        id: step.step_id,
                        type: "subFlowInvokerNode",
                        position: { x: 0, y: (index + 1) * 100 },
                        data: subFlowNodeData
                    }
                ELSE
                    ADD_TO nodes {
                        id: step.step_id,
                        type: "stepNode",
                        position: { x: 0, y: (index + 1) * 100 },
                        data: stepNodeData
                    }
                END_IF
            END_FOR
        END_IF
        
        // 3. Generate edges with enhanced data
        CALL GENERATE_FLOW_EDGES(flowDefinition, traceData, edges)
        
        // 4. Apply automatic layout if requested
        IF useAutoLayout AND nodes.length > 0 THEN
            TRY
                DECLARE layouted = AWAIT CALL layoutNodes WITH nodes, edges, layoutPresets.flowDetail
                
                // Apply trace enhancements if trace data is available
                IF traceData IS_DEFINED THEN
                    DECLARE enhancedNodes = CALL enhanceNodesWithTrace WITH layouted.nodes, traceData
                    DECLARE enhancedEdges = CALL enhanceEdgesWithTrace WITH layouted.edges, traceData
                    RETURN_VALUE { nodes: enhancedNodes, edges: enhancedEdges }
                END_IF
                
                RETURN_VALUE layouted
            CATCH_ERROR error
                LOG "Auto-layout failed, using manual positions: ${error}"
            END_TRY
        END_IF
        
        // Apply trace enhancements even without layout if trace data is available
        IF traceData IS_DEFINED THEN
            DECLARE enhancedNodes = CALL enhanceNodesWithTrace WITH nodes, traceData
            DECLARE enhancedEdges = CALL enhanceEdgesWithTrace WITH edges, traceData
            RETURN_VALUE { nodes: enhancedNodes, edges: enhancedEdges }
        END_IF
        
        RETURN_VALUE { nodes, edges }
    `
    dependencies: [
        "cfv_internal_code.LayoutService_AutomaticLayout",
        "cfv_internal_code.TraceVisualizationService_EnhanceNodes",
        "cfv_internal_code.TraceVisualizationService_EnhanceEdges",
        "cfv_models.IModuleRegistry"
    ]
}

code cfv_internal_code.GraphBuilderService_GenerateSystemOverviewGraphData {
    title: "Generate System Overview Graph Data with Enhanced Features"
    part_of_design: cfv_designs.GraphBuilderService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/graphBuilderService.ts",
        entry_point_name: "generateSystemOverviewGraphData",
        entry_point_type: "async_function"
    }
    signature: "(moduleRegistry: cfv_models.IModuleRegistry, parseContextVarsFn: (value: string) => string[], useAutoLayout?: boolean) => Promise<GraphData>"
    
    detailed_behavior: `
        DECLARE nodes = []
        DECLARE edges = []
        
        DECLARE allModules = CALL moduleRegistry.getAllLoadedModules
        
        // Generate flow nodes and trigger nodes
        FOR_EACH module IN allModules
            IF module.definitions?.flows IS_DEFINED THEN
                FOR_EACH flow IN module.definitions.flows
                    DECLARE flowFqn = "${module.fqn}.${flow.name}"
                    
                    // Add flow node
                    DECLARE flowNodeData = BUILD_SYSTEM_FLOW_NODE_DATA(flow, flowFqn, parseContextVarsFn)
                    ADD_TO nodes {
                        id: flowFqn,
                        type: "systemFlowNode",
                        position: { x: 0, y: 0 },
                        data: flowNodeData
                    }
                    
                    // Add trigger node and edge if present
                    IF flow.trigger IS_DEFINED THEN
                        DECLARE triggerNodeId = "trigger-${flowFqn}"
                        DECLARE triggerNodeData = BUILD_SYSTEM_TRIGGER_NODE_DATA(flow.trigger, triggerNodeId, parseContextVarsFn)
                        
                        ADD_TO nodes {
                            id: triggerNodeId,
                            type: "systemTriggerNode",
                            position: { x: 0, y: 0 },
                            data: triggerNodeData
                        }
                        
                        ADD_TO edges {
                            id: "${triggerNodeId}-${flowFqn}",
                            source: triggerNodeId,
                            target: flowFqn,
                            type: "systemEdge",
                            data: { type: "triggerLinkEdge" }
                        }
                    END_IF
                    
                    // Generate invocation edges for SubFlowInvoker steps
                    IF flow.steps IS_DEFINED THEN
                        FOR_EACH step IN flow.steps
                            DECLARE componentInfo = CALL moduleRegistry.resolveComponentTypeInfo WITH step.component_ref, module.fqn
                            IF componentInfo?.baseType EQUALS "StdLib:SubFlowInvoker" AND step.config?.flow_fqn IS_DEFINED THEN
                                ADD_TO edges {
                                    id: "${flowFqn}-${step.config.flow_fqn}",
                                    source: flowFqn,
                                    target: step.config.flow_fqn,
                                    type: "systemEdge",
                                    data: { type: "invocationEdge" }
                                }
                            END_IF
                        END_FOR
                    END_IF
                END_FOR
            END_IF
        END_FOR
        
        // Apply automatic layout if requested
        IF useAutoLayout AND nodes.length > 0 THEN
            TRY
                DECLARE layouted = AWAIT CALL layoutNodes WITH nodes, edges, layoutPresets.systemOverview
                RETURN_VALUE layouted
            CATCH_ERROR error
                LOG "Auto-layout failed, using manual positions: ${error}"
            END_TRY
        END_IF
        
        RETURN_VALUE { nodes, edges }
    `
    dependencies: [
        "cfv_internal_code.LayoutService_AutomaticLayout",
        "cfv_models.IModuleRegistry"
    ]
}