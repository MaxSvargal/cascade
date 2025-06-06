// cfv_code_ui_state.dspec.md
// Internal code specifications for UI State management (Selection, Navigation, Inspector).

code cfv_code.AutoZoomToFit_Logic {
    title: "Auto Zoom-to-Fit Logic for React Flow"
    part_of_design: cfv_designs.AutoZoomToFitService
    language: "TypeScriptReact"
    implementation_location: {
        filepath: "hooks/useAutoZoomToFit.ts",
        entry_point_name: "useAutoZoomToFit",
        entry_point_type: "function_hook"
    }
    signature: "(params: { currentFlowFqn: string | null; nodes: cfv_models.ReactFlowNode[]; isGeneratingGraph: boolean; isUserInteractingManualZoom: boolean }) => void"
    detailed_behavior: `
        // Human Review Focus: Timing coordination, user experience, performance optimization.
        // AI Agent Target: Implement smooth auto zoom-to-fit when flows change.

        DECLARE fitView = CALL ReactFlowAPI.useReactFlow().fitView
        DECLARE lastFlowFqnRef = USE_REF_HOOK { initial_value: null, refType: "string | null" }
        DECLARE lastNodeCountRef = USE_REF_HOOK { initial_value: 0, refType: "number" }
        DECLARE timeoutIdRef = USE_REF_HOOK { initial_value: null, refType: "any" }

        USE_EFFECT_HOOK {
            dependencies: [params.currentFlowFqn, params.nodes.length, params.isGeneratingGraph, fitView, params.isUserInteractingManualZoom]
            logic: \`
                IF params.isUserInteractingManualZoom THEN RETURN_VALUE END_IF

                DECLARE flowChanged = lastFlowFqnRef.current NOT_EQUALS params.currentFlowFqn
                DECLARE nodeCountChanged = lastNodeCountRef.current NOT_EQUALS params.nodes.length
                DECLARE hasNodes = params.nodes.length > 0

                IF (flowChanged OR nodeCountChanged) AND NOT params.isGeneratingGraph AND hasNodes THEN
                    IF timeoutIdRef.current IS_NOT_NULL THEN
                        CALL GlobalTimers.clearTimeout WITH { timeoutId: timeoutIdRef.current }
                    END_IF

                    DECLARE newTimeoutId
                    CALL GlobalTimers.setTimeout WITH { callback: ASYNC_FUNCTION () => {
                        TRY
                            DECLARE isLongFlow = params.nodes.length > 8
                            DECLARE padding = isLongFlow ? 0.20 : 0.1 // Increased padding for long flows
                            DECLARE minZoom = isLongFlow ? 0.05 : 0.1
                            CALL fitView WITH { options: { duration: 800, padding: padding, minZoom: minZoom, maxZoom: 1.5 } }
                        CATCH_ERROR error
                            CALL AbstractLogger.logError WITH { message: "Failed to auto-fit view: " + error.message }
                        END_TRY
                    }, delayMs: 150 } ASSIGN_TO newTimeoutId // Slightly increased delay
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
    `
    dependencies: [
        "cfv_models.ReactFlowNode",
        "ReactFlowAPI.useReactFlow",
        "GlobalTimers.setTimeout",
        "GlobalTimers.clearTimeout",
        "AbstractLogger.logError"
    ]
}

// --- SelectionService Atoms & Logic ---
code cfv_code.SelectionService_Atoms {
    title: "Jotai Atoms for Selection Service State"
    part_of_design: cfv_designs.SelectionService
    language: "TypeScript"
    implementation_location: { filepath: "state/SelectionServiceAtoms.ts" }

    defines_atom selectedElementAtom {
        description: "Stores the currently selected UI element."
        type: "cfv_models.SelectedElement | null"
        initial_value: "null"
    }
}

code cfv_code.SelectionService_HandleElementSelection {
    title: "Handle Element Selection Logic"
    part_of_design: cfv_designs.SelectionService
    language: "TypeScript" // Could be part of a Jotai atom setter or a hook
    implementation_location: {
        filepath: "services/SelectionServiceLogic.ts",
        entry_point_name: "handleElementSelection",
        entry_point_type: "function" // (get, set, newElement: cfv_models.SelectedElement | null)
    }
    signature: "(params: { newElement: cfv_models.SelectedElement | null, setAtom: Function, onElementSelectCallback?: cfv_models.CascadeFlowVisualizerProps['onElementSelect'] }) => void"
    detailed_behavior: `
        CALL params.setAtom WITH cfv_code.SelectionService_Atoms.selectedElementAtom, params.newElement
        IF params.onElementSelectCallback IS_DEFINED THEN
            CALL params.onElementSelectCallback WITH { selectedElement: params.newElement }
        END_IF
    `
    dependencies: [
        "cfv_code.SelectionService_Atoms.selectedElementAtom",
        "cfv_models.SelectedElement",
        "cfv_models.CascadeFlowVisualizerProps['onElementSelect']"
    ]
}


// --- NavigationStateService Atoms & Logic ---
code cfv_code.NavigationStateService_Atoms {
    title: "Jotai Atoms for Navigation State Service"
    part_of_design: cfv_designs.NavigationStateService
    language: "TypeScript"
    implementation_location: { filepath: "state/NavigationStateServiceAtoms.ts" }

    defines_atom currentFlowFqnAtom {
        description: "Stores the FQN of the currently viewed flow."
        type: "string | null"
        initial_value: "null"
    }

    defines_atom systemViewActiveAtom {
        description: "True if System Overview is active, false if Flow Detail is active."
        type: "boolean"
        initial_value: "true" // Default to system view or based on props.designData.initialViewMode
    }

    // VisualizerModeEnum is typically from props.mode, but if managed internally:
    // defines_atom currentVisualizerModeAtom {
    //     description: "Stores the current visualizer mode (design, trace, test_result)."
    //     type: "cfv_models.VisualizerModeEnum"
    //     initial_value: "'design'"
    // }
}

code cfv_code.NavigationStateService_NavigateToFlow {
    title: "Navigate to Flow Logic"
    part_of_design: cfv_designs.NavigationStateService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/NavigationStateServiceLogic.ts",
        entry_point_name: "navigateToFlow",
        entry_point_type: "function"
    }
    signature: "(params: { flowFqn: string | null, setAtom: Function, getAtom: Function, onViewChangeCallback?: cfv_models.CascadeFlowVisualizerProps['onViewChange'], currentModeFromProps: cfv_models.VisualizerModeEnum }) => void"
    detailed_behavior: `
        CALL params.setAtom WITH cfv_code.NavigationStateService_Atoms.currentFlowFqnAtom, params.flowFqn
        IF params.flowFqn IS_NOT_NULL THEN
            CALL params.setAtom WITH cfv_code.NavigationStateService_Atoms.systemViewActiveAtom, false // Switch to flow detail
        ELSE
            CALL params.setAtom WITH cfv_code.NavigationStateService_Atoms.systemViewActiveAtom, true // Switch to system view if flowFqn is null
        END_IF

        IF params.onViewChangeCallback IS_DEFINED THEN
            DECLARE systemViewActive = CALL params.getAtom WITH cfv_code.NavigationStateService_Atoms.systemViewActiveAtom
            DECLARE payload AS cfv_models.ViewChangePayload
            CREATE_INSTANCE cfv_models.ViewChangePayload WITH {
                mode: params.currentModeFromProps,
                currentFlowFqn: params.flowFqn,
                systemViewActive: systemViewActive
            } ASSIGN_TO payload
            CALL params.onViewChangeCallback WITH { viewPayload: payload }
        END_IF
    `
    dependencies: [
        "cfv_code.NavigationStateService_Atoms.currentFlowFqnAtom",
        "cfv_code.NavigationStateService_Atoms.systemViewActiveAtom",
        "cfv_models.ViewChangePayload",
        "cfv_models.CascadeFlowVisualizerProps['onViewChange']",
        "cfv_models.VisualizerModeEnum"
    ]
}


// --- InspectorStateService Atoms & Logic ---
code cfv_code.InspectorStateService_Atoms {
    title: "Jotai Atoms for Inspector State Service"
    part_of_design: cfv_designs.InspectorStateService
    language: "TypeScript"
    implementation_location: { filepath: "state/InspectorStateServiceAtoms.ts" }

    defines_atom activeInspectorTabAtom {
        description: "Stores the key of the currently active inspector tab (e.g., 'Source', 'Properties', 'DebugTest')."
        type: "string" // Or a specific enum type for tab keys
        initial_value: "'Source'" // Default tab
    }
}

code cfv_code.InspectorStateService_HandleSaveRequest {
    title: "Handle Configuration Save Request from Properties Tab"
    part_of_design: cfv_designs.InspectorStateService
    language: "TypeScript" // Likely an async function
    implementation_location: {
        filepath: "services/InspectorStateServiceLogic.ts",
        entry_point_name: "handleSaveRequest",
        entry_point_type: "async_function"
    }
    signature: "(params: { selectedElement: cfv_models.SelectedElement, newConfigValue: any, pathToConfig: (string | number)[], moduleRegistry: cfv_models.IModuleRegistry, yamlReconstructionService: cfv_designs.YamlReconstructionService, onSaveModuleCallback: cfv_models.CascadeFlowVisualizerProps['onSaveModule'] }) => Promise<void>"
    detailed_behavior: `
        // Human Review Focus: Correct interaction with ModuleRegistry and YamlReconstructionService.
        IF params.selectedElement.moduleFqn IS_NULL THEN
            CALL AbstractLogger.logError WITH { message: "Cannot save: selected element has no moduleFqn."}
            THROW_ERROR "Selected element has no module FQN."
        END_IF
        IF params.onSaveModuleCallback IS_NULL THEN
            CALL AbstractLogger.logError WITH { message: "Cannot save: onSaveModule callback is not provided."}
            THROW_ERROR "onSaveModule callback is not provided."
        END_IF

        DECLARE moduleRep = CALL params.moduleRegistry.getLoadedModule WITH { fqn: params.selectedElement.moduleFqn }
        IF moduleRep IS_NULL THEN
            CALL AbstractLogger.logError WITH { message: "Cannot save: module " + params.selectedElement.moduleFqn + " not found in registry."}
            THROW_ERROR "Module not found in registry."
        END_IF

        // 1. Apply changes to the representation
        DECLARE updatedModuleRep = CALL params.yamlReconstructionService.applyConfigChangesToRepresentation WITH { moduleRep: moduleRep, pathToConfig: params.pathToConfig, newConfigValue: params.newConfigValue }

        // 2. Reconstruct YAML
        DECLARE newYamlContent = CALL params.yamlReconstructionService.reconstructModuleYaml WITH { moduleRep: updatedModuleRep }

        // 3. Create save payload
        DECLARE savePayload AS cfv_models.SaveModulePayload
        CREATE_INSTANCE cfv_models.SaveModulePayload WITH {
            fqn: moduleRep.fqn,
            newContent: newYamlContent,
            pathToConfig: params.pathToConfig,
            newConfigValue: params.newConfigValue
            // oldConfigValue could be fetched from original moduleRep.dslObject if needed
        } ASSIGN_TO savePayload

        // 4. Invoke host callback
        TRY
            AWAIT CALL params.onSaveModuleCallback WITH { payload: savePayload }
            CALL AbstractLogger.logInfo WITH { message: "Module " + moduleRep.fqn + " save requested successfully." }
        CATCH_ERROR e
            CALL AbstractLogger.logError WITH { message: "Error during onSaveModule callback for " + moduleRep.fqn + ": " + e.message }
            THROW_ERROR e // Re-throw to propagate error
        END_TRY
    `
    dependencies: [
        "cfv_models.SelectedElement",
        "cfv_models.IModuleRegistry",
        "cfv_designs.YamlReconstructionService", // For method signatures
        "cfv_models.CascadeFlowVisualizerProps['onSaveModule']",
        "cfv_models.SaveModulePayload",
        "AbstractLogger.logError",
        "AbstractLogger.logInfo"
    ]
}