// cfv_code_main_component.dspec.md
// Internal code specifications for the main CascadeFlowVisualizer component logic.

code cfv_code.CascadeFlowVisualizerComponent_MainLogic {
    title: "Main <CascadeFlowVisualizer /> React Component Logic"
    part_of_design: cfv_designs.CascadeFlowVisualizerComponent
    language: "TypeScriptReact"
    implementation_location: { filepath: "components/CascadeFlowVisualizer.tsx", entry_point_name: "CascadeFlowVisualizer" }
    signature: "React.FC<cfv_models.CascadeFlowVisualizerProps>"
    applies_nfrs: [cfv_policies.NFRs_General.NFR1_Performance, cfv_policies.NFRs_General.NFR4_Reactivity]

    detailed_behavior: `
        // Human Review Focus: Correct props usage, Jotai integration, overall component structure, hook invocations.
        // AI Agent Target: Generate the main React component.

        // --- Prop Destructuring & Defaults ---
        // DESTRUCTURE props: initialModules, componentSchemas, requestModule, onModuleLoadError, parseContextVariables,
        //                  isEditingEnabled, onSaveModule, mode, designData, traceData, testResultData,
        //                  onViewChange, onElementSelect, fetchTraceList, onRunTestCase,
        //                  customReactFlowProOptions, customNodeTypes, customEdgeTypes,
        //                  renderInspectorSourceTab, renderInspectorPropertiesTab, renderInspectorDebugTestTab,
        //                  renderFlowRunListItem, elkOptions, className, style, uiOptions

        // --- Jotai State & Hooks ---
        // Initialize Module Registry state (runs in an effect hook)
        CALL cfv_code.ModuleRegistryService_InitializeFromProps HOOK WITH { initialModules: props.initialModules, componentSchemas: props.componentSchemas }

        // Selected Element State
        DECLARE selectedElement = USE_ATOM_VALUE_HOOK cfv_code.SelectionService_Atoms.selectedElementAtom
        DECLARE setSelectedElementAtom = USE_SET_ATOM_HOOK cfv_code.SelectionService_Atoms.selectedElementAtom

        // Navigation State
        DECLARE currentFlowFqn = USE_ATOM_VALUE_HOOK cfv_code.NavigationStateService_Atoms.currentFlowFqnAtom
        DECLARE setCurrentFlowFqnAtom = USE_SET_ATOM_HOOK cfv_code.NavigationStateService_Atoms.currentFlowFqnAtom
        DECLARE systemViewActive = USE_ATOM_VALUE_HOOK cfv_code.NavigationStateService_Atoms.systemViewActiveAtom
        DECLARE setSystemViewActiveAtom = USE_SET_ATOM_HOOK cfv_code.NavigationStateService_Atoms.systemViewActiveAtom

        // Active Inspector Tab State
        DECLARE activeInspectorTab = USE_ATOM_VALUE_HOOK cfv_code.InspectorStateService_Atoms.activeInspectorTabAtom
        DECLARE setActiveInspectorTabAtom = USE_SET_ATOM_HOOK cfv_code.InspectorStateService_Atoms.activeInspectorTabAtom

        // Derived graph data (conceptual atom, actual implementation might be more complex)
        // This atom would depend on currentFlowFqn, mode, traceData, moduleRegistry state, etc.
        // It would internally call cfv_code.GraphBuilderService_GenerateFlowDetailGraphData or SystemOverview.
        // For simplicity, assume a hook that provides graphData and loading state.
        DECLARE graphData, isLoadingGraph = USE_DERIVED_GRAPH_DATA_HOOK {
            currentFlowFqn: currentFlowFqn,
            mode: props.mode,
            traceData: props.traceData,
            testResultData: props.testResultData, // For trace overlay from test results
            systemViewActive: systemViewActive,
            // Pass moduleRegistry interface (getter functions for atoms) and other necessary services/props
        }

        // --- Event Handlers (Callbacks) ---
        DECLARE handleNodeClick = USE_CALLBACK_HOOK {
            dependencies: [setSelectedElementAtom, props.onElementSelect]
            logic: \`
                (event, node) => {
                    // Create cfv_models.SelectedElement from React Flow node
                    DECLARE newSelectedElement AS cfv_models.SelectedElement
                    CREATE_INSTANCE cfv_models.SelectedElement WITH {
                        sourceType: 'flowNode', // Or determine if system node
                        id: node.id,
                        data: node.data, // Full node data
                        moduleFqn: node.data.dslObject?.moduleFqn, // Example path
                        flowFqn: currentFlowFqn, // If in flow detail
                        stepId: node.data.stepId
                    } ASSIGN_TO newSelectedElement
                    CALL cfv_code.SelectionService_HandleElementSelection WITH { newElement: newSelectedElement, setAtom: setSelectedElementAtom, onElementSelectCallback: props.onElementSelect }
                }
            \`
        }
        DECLARE handleEdgeClick = USE_CALLBACK_HOOK { /* Similar for edges */ }
        DECLARE handlePaneClick = USE_CALLBACK_HOOK { // For deselecting
            dependencies: [setSelectedElementAtom, props.onElementSelect]
            logic: \`
                () => {
                    CALL cfv_code.SelectionService_HandleElementSelection WITH { newElement: null, setAtom: setSelectedElementAtom, onElementSelectCallback: props.onElementSelect }
                }
            \`
        }
        DECLARE handleNodeDoubleClick = USE_CALLBACK_HOOK {
            dependencies: [setCurrentFlowFqnAtom, setSystemViewActiveAtom, props.requestModule, props.onViewChange, props.mode] // And Jotai's get for ModuleRegistry atoms
            logic: \`
                async (event, node) => {
                    IF node.data.invokedFlowFqn IS_PRESENT AND props.uiOptions.interactionOptions.enableDoubleClickNavigation !== false THEN
                        DECLARE targetFlowFqn = node.data.invokedFlowFqn
                        // Check if module for targetFlowFqn is loaded, if not, request it
                        // This logic would involve using get(DslModuleRepresentationsAtom) and potentially calling requestAndProcessModule
                        // For simplicity in this DSpec:
                        // AWAIT cfv_code.ModuleRegistryService_EnsureModuleLoaded_Helper WITH { fqn: targetFlowFqn, props: props }
                        CALL cfv_code.NavigationStateService_NavigateToFlow WITH { flowFqn: targetFlowFqn, setAtom: setCurrentFlowFqnAtom, getAtom: get, onViewChangeCallback: props.onViewChange, currentModeFromProps: props.mode }
                        // Also set systemViewActive to false via setSystemViewActiveAtom
                        CALL setSystemViewActiveAtom WITH false
                        CALL AbstractLogger.logInfo WITH { message: "Navigating to subflow: " + targetFlowFqn }
                    END_IF
                }
            \`
        }

        // --- Effects ---
        // Effect for props.onViewChange
        USE_EFFECT_HOOK {
            dependencies: [props.mode, currentFlowFqn, systemViewActive, props.onViewChange]
            logic: \`
                IF props.onViewChange IS_DEFINED THEN
                    DECLARE payload AS cfv_models.ViewChangePayload
                    CREATE_INSTANCE cfv_models.ViewChangePayload WITH { mode: props.mode, currentFlowFqn: currentFlowFqn, systemViewActive: systemViewActive } ASSIGN_TO payload
                    CALL props.onViewChange WITH { viewPayload: payload }
                END_IF
            \`
        }

        // AutoZoomToFit (managed by a dedicated hook/component)
        DECLARE isUserInteractingManualZoom = USE_STATE_HOOK { initial_value: false, type: "boolean" } // Conceptual state to track user zoom
        // CALL cfv_code.AutoZoomToFit_Logic HOOK WITH { currentFlowFqn: currentFlowFqn, nodes: graphData.nodes, isGeneratingGraph: isLoadingGraph, isUserInteractingManualZoom: isUserInteractingManualZoom }

        // --- Inspector Props Preparation ---
        // These would be memoized or derived atoms for performance
        DECLARE inspectorSourceTabProps = USE_MEMO_HOOK {
            dependencies: [selectedElement /*, moduleRegistryState */]
            logic: \` /* Create cfv_models.InspectorSourceTabProps */ \`
        }
        DECLARE inspectorPropertiesTabProps = USE_MEMO_HOOK {
            dependencies: [selectedElement, props.isEditingEnabled /*, moduleRegistryState, actions for save */]
            logic: \` /* Create cfv_models.InspectorPropertiesTabProps, including actions.requestSave */ \`
        }
        DECLARE inspectorDebugTestTabProps = USE_MEMO_HOOK {
            dependencies: [currentFlowFqn, selectedElement, props.traceData, props.testResultData /*, moduleRegistryState, actions for debug/test */]
            logic: \` /* Create cfv_models.InspectorDebugTestTabProps, including UnifiedDebugTestActions */ \`
        }


        // --- Render ---
        // RENDER_JSX
        // <div className={props.className} style={props.style}>
        //   <ReactFlowProvider>
        //     <LeftSidebarComponent
        //        moduleRegistry={moduleRegistryInterface} // Pass IModuleRegistry
        //        navigationActions={navigationActions} // Actions to navigate flows/modules
        //        fetchTraceList={props.fetchTraceList}
        //        renderFlowRunListItem={props.renderFlowRunListItem}
        //        currentFlowFqn={currentFlowFqn}
        //        systemViewActive={systemViewActive}
        //     />
        //     <MainCanvasComponent
        //        nodes={graphData.nodes}
        //        edges={graphData.edges}
        //        nodeTypes={props.customNodeTypes}
        //        edgeTypes={props.customEdgeTypes}
        //        onNodeClick={handleNodeClick}
        //        onEdgeClick={handleEdgeClick}
        //        onPaneClick={handlePaneClick}
        //        onNodeDoubleClick={handleNodeDoubleClick}
        //        proOptions={props.customReactFlowProOptions}
        //        elkOptions={props.elkOptions} // Passed to internal layout mechanism
        //        isLoading={isLoadingGraph}
        //        // Pass handlers for zoom/pan to set isUserInteractingManualZoom
        //     >
        //        <AutoZoomToFitComponent currentFlowFqn={currentFlowFqn} nodes={graphData.nodes} isGeneratingGraph={isLoadingGraph} isUserInteractingManualZoom={isUserInteractingManualZoom} />
        //     </MainCanvasComponent>
        //     <RightSidebarComponent
        //        selectedElement={selectedElement}
        //        activeTab={activeInspectorTab}
        //        onTabChange={setActiveInspectorTabAtom}
        //        renderSourceTab={props.renderInspectorSourceTab ? () => props.renderInspectorSourceTab(inspectorSourceTabProps) : undefined}
        //        renderPropertiesTab={props.renderInspectorPropertiesTab && props.isEditingEnabled ? () => props.renderInspectorPropertiesTab(inspectorPropertiesTabProps) : undefined}
        //        renderDebugTestTab={props.renderInspectorDebugTestTab ? () => props.renderInspectorDebugTestTab(inspectorDebugTestTabProps) : undefined}
        //     />
        //   </ReactFlowProvider>
        // </div>
    `
    dependencies: [
        "cfv_models.CascadeFlowVisualizerProps",
        "cfv_code.ModuleRegistryService_InitializeFromProps",
        "cfv_code.SelectionService_Atoms.selectedElementAtom",
        "cfv_code.SelectionService_HandleElementSelection",
        "cfv_code.NavigationStateService_Atoms.currentFlowFqnAtom",
        "cfv_code.NavigationStateService_Atoms.systemViewActiveAtom",
        "cfv_code.NavigationStateService_NavigateToFlow",
        "cfv_code.InspectorStateService_Atoms.activeInspectorTabAtom",
        "cfv_code.AutoZoomToFit_Logic", // Or AutoZoomToFitComponent
        // Conceptual hooks/atoms for graph data and loading state
        "USE_DERIVED_GRAPH_DATA_HOOK", // Placeholder for a hook that uses GraphBuilderService
        "AbstractLogger.logInfo"
        // Specific cfv_models for props passed to child components/render props
    ]
}