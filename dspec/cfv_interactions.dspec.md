// cfv_interactions.dspec.md
// Refined to use fully qualified names and align with updated designs/models.

interaction cfv_interactions.UserSelectsFlowAndEditsStep {
    title: "User Selects a Flow, then a Step, Edits Config, and Saves"
    description: "Models the interaction flow from user selecting a flow from the sidebar list to successfully saving a change to a step's configuration."
    components: [
        // Conceptual UI components (not formal designs, but represent interaction points)
        "UI.LeftSidebar.FlowsList",
        "UI.MainCanvas", // Represents the React Flow canvas area
        "UI.RightSidebar.PropertiesTab", // Represents the consumer-rendered Properties tab

        // Formal Design Components from cfv_designs.dspec.md
        cfv_designs.NavigationStateService,
        cfv_designs.GraphBuilderService,    // Implied: for re-rendering graph
        cfv_designs.SelectionService,
        cfv_designs.InspectorStateService,
        cfv_designs.ModuleRegistryService,  // For YAML reconstruction by InspectorStateService
        cfv_designs.YamlReconstructionService // Used by InspectorStateService
    ]
    message_types: [ // Abstract message/event types, linked to models where appropriate
        cfv_models.FlowSelectedEventMsg,
        cfv_models.NavigationStateChangedMsg, // Internal conceptual message
        cfv_models.StepNodeClickedEventMsg,   // UI event from React Flow node click
        cfv_models.SelectedElementChangedMsg, // Internal conceptual message
        cfv_models.ConfigEditActionMsg,       // Message from PropertiesTab to InspectorStateService
        cfv_models.SaveModulePayload,         // Payload for props.onSaveModule
        "HostApp.ModuleSaveSuccessConfirmation" // Conceptual: From host app back to UI
    ]
    initial_component: "UI.LeftSidebar.FlowsList"

    steps: [
        {
            step_id: "S1_UserClicksFlowInList"
            component: "UI.LeftSidebar.FlowsList"
            action: "User clicks on flow 'com.example.MyFlow'."
            sends_message: {
                to: cfv_designs.NavigationStateService // Target service
                message_name: "RequestNavigateToFlow" // Logical action/message name
                payload_model: cfv_models.FlowSelectedEventMsg // Data model for the payload
                // Example payload: { flowFqn: 'com.example.MyFlow' }
            }
        },
        {
            step_id: "S2_NavigationServiceUpdatesState"
            component: cfv_designs.NavigationStateService
            description: "Receives RequestNavigateToFlow. Updates internal currentFlowFqn and view mode. Invokes props.onViewChange. Conceptually sends cfv_models.NavigationStateChangedMsg."
            action: "Sets currentFlowFqn = 'com.example.MyFlow', systemViewActive = false. Invokes props.onViewChange."
            // This change in currentFlowFqn Atom will trigger cfv_designs.GraphBuilderService
            // (via a derived atom or effect) to re-calculate graph for MainCanvas.
        },
        {
            step_id: "S3_UserClicksStepNodeOnCanvas"
            component: "UI.MainCanvas" // Represents React Flow instance
            action: "User clicks on the graph node representing step 's1' of 'com.example.MyFlow'."
            sends_message: {
                to: cfv_designs.SelectionService
                message_name: "RequestSelectElement"
                payload_model: cfv_models.StepNodeClickedEventMsg
                // Example payload: { nodeId: 's1_node_id', data: { stepId: 's1', label: 's1', ... } }
            }
        },
        {
            step_id: "S4_SelectionServiceUpdatesState"
            component: cfv_designs.SelectionService
            description: "Receives RequestSelectElement. Updates selectedElementAtom. Invokes props.onElementSelect. Conceptually sends cfv_models.SelectedElementChangedMsg."
            action: "Sets selectedElementAtom to the clicked step node. Invokes props.onElementSelect."
            // This change in selectedElementAtom will trigger cfv_designs.InspectorStateService
            // to prepare data for the RightSidebar.
        },
        {
            step_id: "S5_UserEditsConfigInPropertiesTab"
            component: "UI.RightSidebar.PropertiesTab" // Consumer-rendered component
            description: "User interacts with the form for step 's1's config. Consumer's 'Save' button calls `actions.requestSave` (from cfv_models.InspectorPropertiesActions) passed by cfv_designs.InspectorStateService."
            action: "User changes a config field (e.g., 'timeout') to a new value and clicks consumer's 'Save' button, which invokes props.actions.requestSave."
            sends_message: { // This represents the props.actions.requestSave call
                to: cfv_designs.InspectorStateService // The service that provides the actions object
                message_name: "HandleConfigSaveRequest" // Internal logical name for the action handler
                payload_model: cfv_models.ConfigEditActionMsg
                // Example payload from actions.requestSave: { newConfigValue: 1000, pathToConfig: ['config', 'timeout'] }
            }
        },
        {
            step_id: "S6_InspectorServiceProcessesSave"
            component: cfv_designs.InspectorStateService
            description: "Receives HandleConfigSaveRequest. Uses cfv_designs.ModuleRegistryService to get current module data. Uses cfv_designs.YamlReconstructionService to apply change and generate new YAML string. Invokes `props.onSaveModule`."
            action: "Calls cfv_designs.ModuleRegistryService.getLoadedModule. Calls cfv_designs.YamlReconstructionService.applyConfigChangesToRepresentation and cfv_designs.YamlReconstructionService.reconstructModuleYaml. Prepares cfv_models.SaveModulePayload."
            sends_message: {
                to_dynamic_target_from_context: "HostApplicationCallback_onSaveModule" // Represents the props.onSaveModule callback
                message_name: "ModuleContentToSave" // Logical name for the data being sent
                payload_model: cfv_models.SaveModulePayload // Data model for the payload
            }
        },
        {
            step_id: "S7_HostAppSavesModule"
            component: "HostApplicationCallback_onSaveModule" // Represents the host environment receiving the callback
            description: "Host application receives cfv_models.SaveModulePayload (containing new YAML) and persists it."
            action: "IF save successful, host might optionally notify visualizer (e.g., by updating a prop or calling a re-sync). ELSE handles error."
            // Example: Host could update props.initialModules or trigger a re-fetch if save is successful.
            sends_message?: { // Optional: Host app might send a confirmation back
                to: cfv_designs.ModuleRegistryService // Or another relevant service
                message_name: "ModuleSaveConfirmed"
                payload_model: "HostApp.ModuleSaveSuccessConfirmation" // Conceptual model
            }
            is_endpoint: true // For this interaction from visualizer's perspective
        }
    ]
}