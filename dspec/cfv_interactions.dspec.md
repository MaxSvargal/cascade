interaction cfv_interactions.UserSelectsFlowAndEditsStep {
    title: "User Selects a Flow, then a Step, Edits Config, and Saves"
    description: "Models the interaction flow from user selecting a flow from the sidebar list to successfully saving a change to a step's configuration."
    components: [
        // Conceptual components representing parts of the UI or services
        "UI.LeftSidebar.FlowsList",
        cfv_designs.NavigationStateService,
        cfv_designs.GraphBuilderService, // Implied: re-renders graph
        "UI.MainCanvas",
        cfv_designs.SelectionService,
        "UI.RightSidebar.PropertiesTab", // Consumer-provided
        cfv_designs.InspectorStateService,
        cfv_designs.ModuleRegistryService // For YAML reconstruction
    ]
    message_types: [ // Abstract message/event types, now linked to models where appropriate
        cfv_models.FlowSelectedEventMsg,
        cfv_models.NavigationStateChangedMsg,
        cfv_models.StepNodeClickedEventMsg,
        cfv_models.SelectedElementChangedMsg,
        cfv_models.ConfigEditActionMsg,
        cfv_models.SaveModulePayload, // This was already a model, referenced directly
        "ModuleSaveSuccessConfirmation" // From host app back to UI (conceptual, not a model in cfv_models)
    ]
    initial_component: "UI.LeftSidebar.FlowsList"

    steps: [
        {
            step_id: "S1_UserClicksFlowInList"
            component: "UI.LeftSidebar.FlowsList"
            action: "User clicks on flow 'com.example.MyFlow'."
            sends_message: { to: cfv_designs.NavigationStateService, message_name: "RequestNavigateToFlow", payload_model: cfv_models.FlowSelectedEventMsg /* Example: { flowFqn: 'com.example.MyFlow' } */ }
        },
        {
            step_id: "S2_NavigationServiceUpdatesState"
            component: cfv_designs.NavigationStateService
            description: "Receives RequestNavigateToFlow. Updates internal currentFlowFqn and view mode."
            action: "Sets currentFlowFqn = 'com.example.MyFlow', systemViewActive = false. Emits `props.onViewChange`."
            // Triggers GraphBuilderService to re-calculate graph for MainCanvas
            // Sends internal NavigationStateChangedMsg conceptually
        },
        {
            step_id: "S3_UserClicksStepNodeOnCanvas"
            component: "UI.MainCanvas" // React Flow within it
            action: "User clicks on the graph node representing step 's1' of 'com.example.MyFlow'."
            sends_message: { to: cfv_designs.SelectionService, message_name: "RequestSelectElement", payload_model: cfv_models.StepNodeClickedEventMsg /* Example: { nodeId: '...', stepData_summary: {label: 's1'} } */ }
        },
        {
            step_id: "S4_SelectionServiceUpdatesState"
            component: cfv_designs.SelectionService
            description: "Receives RequestSelectElement. Updates selectedElementAtom."
            action: "Sets selectedElement to the clicked step node. Emits `props.onElementSelect`."
            // Triggers InspectorStateService to prepare data for RightSidebar
            // Sends internal SelectedElementChangedMsg conceptually
        },
        {
            step_id: "S5_UserEditsConfigInPropertiesTab"
            component: "UI.RightSidebar.PropertiesTab"
            description: "User interacts with the (consumer-rendered) form for step 's1's config."
            action: "User changes a config field (e.g., 'timeout') to a new value and clicks consumer's 'Save' button."
            // Consumer's Save button calls `actions.requestSave` passed by InspectorStateService
            sends_message: { to: cfv_designs.InspectorStateService, message_name: "HandleSaveRequest", payload_model: cfv_models.ConfigEditActionMsg /* Example: { newConfigValue: 1000, pathToConfig: ['config', 'timeout'] } */ }
        },
        {
            step_id: "S6_InspectorServiceProcessesSave"
            component: cfv_designs.InspectorStateService
            description: "Receives HandleSaveRequest. Updates in-memory DSL structure for the module. Reconstructs module YAML."
            action: "Calls ModuleRegistryService to get current module data. Applies change. Generates new YAML string."
            sends_message: { /* Conceptual: This triggers props.onSaveModule callback */
                to_dynamic_target_from_context: "HostApplicationCallback_onSaveModule", // Represents the prop
                message_name: "ModuleContentToSave", // Logical name
                payload_model: cfv_models.SaveModulePayload // Reference to the existing model
            }
        },
        {
            step_id: "S7_HostAppSavesModule"
            component: "HostApplicationCallback_onSaveModule" // Represents the host environment
            description: "Host application receives new YAML and persists it."
            action: "IF save successful, host might optionally notify visualizer (e.g., by updating a prop or calling a re-sync). ELSE handles error."
            is_endpoint: true // For this interaction from visualizer's perspective
        }
    ]
}