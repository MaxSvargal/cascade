// cfv_code_module_registry.dspec.md
// Internal code specifications for Module Management logic (cfv_designs.ModuleRegistryService).

code cfv_code.ModuleRegistryService_SharedAtoms {
    title: "Jotai Atoms for Module Registry State"
    part_of_design: cfv_designs.ModuleRegistryService
    language: "TypeScript"
    implementation_location: { filepath: "state/ModuleRegistryServiceAtoms.ts" }

    defines_atom DslModuleRepresentationsAtom {
        description: "Stores all loaded cfv_models.DslModuleRepresentations, keyed by FQN."
        type: "Record<string, cfv_models.DslModuleRepresentation>"
        initial_value: "{}"
    }

    defines_atom ComponentSchemasAtom {
        description: "Stores all pre-loaded cfv_models.ComponentSchemas, keyed by component FQN."
        type: "Record<string, cfv_models.ComponentSchema>"
        initial_value: "{}"
    }

    defines_atom ActiveModuleLoadRequestsAtom {
        description: "Tracks FQNs of modules currently being loaded to prevent duplicate requests."
        type: "Record<string, boolean>"
        initial_value: "{}"
    }
}

code cfv_code.ModuleRegistryService_InitializeFromProps {
    title: "Initialize ModuleRegistryService State from Props"
    part_of_design: cfv_designs.ModuleRegistryService
    language: "TypeScriptReact"
    implementation_location: {
        filepath: "hooks/useModuleRegistryInitializer.ts",
        entry_point_name: "useModuleRegistryInitializer",
        entry_point_type: "function_hook"
    }
    signature: "(props: { initialModules?: cfv_models.DslModuleInput[], componentSchemas?: Record<string, cfv_models.ComponentSchema> }) => void"
    detailed_behavior: `
        // Human Review Focus: Correct initialization logic, props handling.
        // AI Agent Target: Generate a React useEffect hook using Jotai directives.
        // Relies on Jotai context (get/set) being implicitly available or passed if not a hook.

        // 1. Initialize ComponentSchemasAtom from props.componentSchemas
        IF props.componentSchemas IS_PRESENT THEN
            WRITE_ATOM cfv_code.ModuleRegistryService_SharedAtoms.ComponentSchemasAtom WITH props.componentSchemas
        END_IF

        // 2. Process initialModules from props.initialModules
        IF props.initialModules IS_PRESENT THEN
            DECLARE initialModuleReps AS Record<string, cfv_models.DslModuleRepresentation> = {}
            // Assuming 'get' and 'set' for Jotai are available in this hook's scope
            FOR_EACH moduleInput IN props.initialModules
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
            DECLARE errorRep AS cfv_models.DslModuleRepresentation
            CREATE_INSTANCE cfv_models.DslModuleRepresentation WITH { fqn: moduleFqn, rawContent: moduleContent, parsedContent: null, definitions: null, imports: null, status: 'error', errors: errors } ASSIGN_TO errorRep
            CALL params.setAtoms WITH cfv_code.ModuleRegistryService_SharedAtoms.DslModuleRepresentationsAtom, (prev => ({ ...prev, [moduleFqn]: errorRep }))
            RETURN_VALUE errorRep
        END_TRY

        IF parsedDsl IS_NULL THEN
            ADD { message: "YAML content is empty or invalid after parsing.", severity: "error" } TO errors
            DECLARE nullParseRep AS cfv_models.DslModuleRepresentation
            CREATE_INSTANCE cfv_models.DslModuleRepresentation WITH { fqn: moduleFqn, rawContent: moduleContent, parsedContent: null, definitions: null, imports: null, status: 'error', errors: errors } ASSIGN_TO nullParseRep
            CALL params.setAtoms WITH cfv_code.ModuleRegistryService_SharedAtoms.DslModuleRepresentationsAtom, (prev => ({ ...prev, [moduleFqn]: nullParseRep }))
            RETURN_VALUE nullParseRep
        END_IF

        // 2. Extract definitions (flows, components, context) from parsedDsl.
        DECLARE extractedDefinitions AS cfv_models.DslModuleDefinitions
        CREATE_INSTANCE cfv_models.DslModuleDefinitions WITH {
            flows: parsedDsl.flows OR [],
            components: parsedDsl.components OR (parsedDsl.definitions.components OR []), // Handle both locations
            context: parsedDsl.definitions.context OR [] // Handle context under definitions
        } ASSIGN_TO extractedDefinitions
        // TODO: Add validation logic for definitions against schemas if needed.

        // 3. Resolve imports (this can be complex and recursive)
        IF parsedDsl.imports IS_PRESENT THEN
            FOR_EACH importItem IN parsedDsl.imports
                // Synchronous check if already loaded or being loaded to avoid infinite loops in this function
                // Actual request for unloaded modules should be handled by a higher-level orchestrator or specific effect.
                // For now, this function focuses on processing *this* module's content.
                // Recursive loading is part of cfv_code.ModuleRegistryService_RequestAndProcessModule.
                CALL AbstractLogger.logInfo WITH { message: "Module " + moduleFqn + " imports " + importItem.namespace + ". Recursive loading handled by RequestAndProcessModule."}
            END_FOR
        END_IF

        // 4. Create final module representation
        DECLARE finalModuleRep AS cfv_models.DslModuleRepresentation
        CREATE_INSTANCE cfv_models.DslModuleRepresentation WITH {
            fqn: moduleFqn,
            rawContent: moduleContent,
            parsedContent: parsedDsl,
            definitions: extractedDefinitions,
            imports: parsedDsl.imports,
            errors: errors,
            status: 'loaded'
        } ASSIGN_TO finalModuleRep

        // 5. Update DslModuleRepresentationsAtom
        CALL params.setAtoms WITH cfv_code.ModuleRegistryService_SharedAtoms.DslModuleRepresentationsAtom, (prev => ({ ...prev, [moduleFqn]: finalModuleRep }))

        RETURN_VALUE finalModuleRep
    `
    dependencies: [
        "AbstractYamlParser.parse",
        "cfv_code.ModuleRegistryService_SharedAtoms.DslModuleRepresentationsAtom",
        "AbstractLogger.logError",
        "AbstractLogger.logInfo"
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
    signature: "(params: { fqn: string, props: { requestModule: cfv_models.CascadeFlowVisualizerProps['requestModule'], onModuleLoadError?: cfv_models.CascadeFlowVisualizerProps['onModuleLoadError'], componentSchemas?: Record<string, cfv_models.ComponentSchema> }, getAtoms: Function, setAtoms: Function }) => Promise<cfv_models.DslModuleRepresentation | null>"
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
        DECLARE props = params.props // For ProcessSingleModuleInput

        // 1. Check if already loading or loaded
        DECLARE activeLoads = CALL getAtoms WITH cfv_code.ModuleRegistryService_SharedAtoms.ActiveModuleLoadRequestsAtom
        IF activeLoads[fqn] IS_TRUE THEN
            CALL AbstractLogger.logInfo WITH { message: "Module " + fqn + " is already being loaded." }
            RETURN_VALUE null // Or return a promise that resolves when existing load finishes
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
            CALL props.requestModule WITH { fqn: fqn } ASSIGN_TO requestedModuleData
        CATCH_ERROR e
            CALL AbstractLogger.logError WITH { message: "props.requestModule failed for " + fqn + ": " + e.message }
            IF params.props.onModuleLoadError IS_DEFINED THEN
                CALL props.onModuleLoadError WITH { fqn: fqn, error: e }
            END_IF
            DECLARE errorRep AS cfv_models.DslModuleRepresentation
            CREATE_INSTANCE cfv_models.DslModuleRepresentation WITH { fqn: fqn, rawContent: "", status: 'error', errors: [{ message: e.message, severity: 'error' }] } ASSIGN_TO errorRep
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
            CREATE_INSTANCE cfv_models.DslModuleRepresentation WITH { fqn: fqn, rawContent: "", status: 'error', errors: [{ message: "Module not found by host.", severity: 'error' }] } ASSIGN_TO notFoundRep
            CALL setAtoms WITH cfv_code.ModuleRegistryService_SharedAtoms.DslModuleRepresentationsAtom, (prev => ({ ...prev, [fqn]: notFoundRep }))
            CALL setAtoms WITH cfv_code.ModuleRegistryService_SharedAtoms.ActiveModuleLoadRequestsAtom, (prev => ({ ...prev, [fqn]: false }))
            RETURN_VALUE null
        END_IF

        // 4. Process the loaded module content
        DECLARE finalModuleRep AS cfv_models.DslModuleRepresentation | null
        // Pass the full props down, as ProcessSingleModuleInput might need them for recursive import resolution context.
        CALL cfv_code.ModuleRegistryService_ProcessSingleModuleInput WITH { moduleInput: requestedModuleData, isInitialLoad: false, getAtoms: getAtoms, setAtoms: setAtoms, props: props } ASSIGN_TO finalModuleRep

        // 5. If successful and it has imports, trigger loading for them (non-blocking)
        IF finalModuleRep IS_NOT_NULL AND finalModuleRep.status EQUALS 'loaded' AND finalModuleRep.imports IS_PRESENT THEN
            FOR_EACH importItem IN finalModuleRep.imports
                // Check if already loaded or actively loading to prevent re-triggering unnecessarily
                DECLARE currentActiveLoads = CALL getAtoms WITH cfv_code.ModuleRegistryService_SharedAtoms.ActiveModuleLoadRequestsAtom
                DECLARE currentLoadedModules = CALL getAtoms WITH cfv_code.ModuleRegistryService_SharedAtoms.DslModuleRepresentationsAtom
                IF NOT currentActiveLoads[importItem.namespace] AND NOT (currentLoadedModules[importItem.namespace] AND currentLoadedModules[importItem.namespace].status EQUALS 'loaded') THEN
                    // Asynchronously request and process this imported module. Do not await here to avoid blocking.
                    // This function itself will handle atom updates for the imported module.
                    CALL cfv_code.ModuleRegistryService_RequestAndProcessModule WITH { fqn: importItem.namespace, props: params.props, getAtoms: getAtoms, setAtoms: setAtoms }
                    CALL AbstractLogger.logInfo WITH { message: "Triggered asynchronous loading for imported module: " + importItem.namespace }
                END_IF
            END_FOR
        END_IF

        // 6. Unmark as loading
        CALL setAtoms WITH cfv_code.ModuleRegistryService_SharedAtoms.ActiveModuleLoadRequestsAtom, (prev => ({ ...prev, [fqn]: false }))

        RETURN_VALUE finalModuleRep
    `
    dependencies: [
        "cfv_code.ModuleRegistryService_SharedAtoms.DslModuleRepresentationsAtom",
        "cfv_code.ModuleRegistryService_SharedAtoms.ActiveModuleLoadRequestsAtom",
        "cfv_code.ModuleRegistryService_ProcessSingleModuleInput",
        "props.requestModule",
        "props.onModuleLoadError",
        "AbstractLogger.logInfo",
        "AbstractLogger.logError"
    ]
}

// Placeholder for IModuleRegistry implementation logic if needed as separate code specs
// For now, assuming IModuleRegistry methods directly use Jotai's `get` on atoms.
// Example:
// code cfv_code.ModuleRegistryService_GetLoadedModuleImpl {
//     title: "IModuleRegistry: getLoadedModule Implementation"
//     part_of_design: cfv_designs.ModuleRegistryService
//     language: "TypeScript"
//     implementation_location: { filepath: "services/ModuleRegistryServiceLogic.ts", entry_point_name: "getLoadedModuleImpl" }
//     signature: "(fqn: string, getAtoms: Function) => cfv_models.DslModuleRepresentation | null"
//     detailed_behavior: "DECLARE modules = CALL getAtoms WITH cfv_code.ModuleRegistryService_SharedAtoms.DslModuleRepresentationsAtom; RETURN_VALUE modules[fqn] OR null"
//     dependencies: ["cfv_code.ModuleRegistryService_SharedAtoms.DslModuleRepresentationsAtom"]
// }