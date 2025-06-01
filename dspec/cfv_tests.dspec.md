// cfv_tests.dspec
// Example test specifications for CascadeFlowVisualizer features.

test cfv_tests.ModuleLoading_SingleModule {
    title: "Test: Load and Display a Single Valid DSL Module"
    description: "Verifies that the visualizer can correctly load, parse, and display a single valid Cascade DSL V1.1 module provided via `initialModules`."
    verifies_requirement: [cfv_requirements.FR1_1_InitialModules, cfv_requirements.FR1_3_InternalModuleRegistry, cfv_requirements.FR2_1_GenerateNodesAndEdges]
    type: "Integration"
    priority: "Critical"
    test_location: {
        language: "TypeScript",
        framework: "JestPlaywright", // Example
        filepath: "tests/integration/module_loading.spec.ts",
        test_case_id_in_file: "should_load_and_display_single_valid_module"
    }
    preconditions: [
        "A valid Cascade DSL V1.1 module string is prepared."
    ]
    data_inputs: {
        initialModules: "[{ fqn: 'com.example.test', content: 'dsl_version: \"1.1\"\\nnamespace: com.example.test\\nflows:\\n  - name: MyFlow\\n    trigger: { type: T1 }\\n    steps:\\n      - step_id: s1\\n        component_ref: C1' }]"
    }
    steps: [
        "Given the CascadeFlowVisualizer is rendered with `initialModules` (from data_inputs)",
        "And with basic consumer-provided node/edge renderers and inspector tabs",
        "When the visualizer finishes loading",
        "Then the 'com.example.test' module should be listed in the Modules List (Left Sidebar).",
        "And the 'com.example.test.MyFlow' flow should be listed in the Flows List (Left Sidebar).",
        "And selecting 'com.example.test.MyFlow' should display its graph in the Main Canvas.",
        "And the graph should contain a trigger node and a step node 's1'."
    ]
    expected_result: "The single module and its flow are correctly parsed and visualized. No errors are reported for the module."
}

test cfv_tests.Editing_SaveConfigChange {
    title: "Test: Edit and Save a Step's Configuration"
    description: "Verifies that a step's configuration can be edited via the Inspector and saved, triggering the `onSaveModule` callback with updated YAML."
    verifies_requirement: [cfv_requirements.FR7_Editing_V1Scope]
    type: "Integration"
    priority: "High"
    test_location: {
        language: "TypeScript",
        framework: "JestPlaywright",
        filepath: "tests/integration/editing.spec.ts",
        test_case_id_in_file: "should_edit_and_save_step_config"
    }
    preconditions: [
        "Visualizer loaded with a simple flow containing a step 's1' with initial config '{ initialParam: \"value1\" }'.",
        "`isEditingEnabled` prop is true.",
        "Consumer's `renderInspectorPropertiesTab` provides an input to edit `config.initialParam` and a save button triggering `actions.requestSave`."
    ]
    steps: [
        "Given the visualizer is loaded and flow is displayed",
        "When step 's1' is selected in the Main Canvas",
        "And its 'initialParam' in the Properties tab (Right Sidebar) is changed to 'newValue2'",
        "And the 'Save' button in the Properties tab is clicked",
        "Then the `onSaveModule` prop callback should be invoked.",
        "And the `newContent` in the callback payload should reflect the YAML with 's1.config.initialParam' as 'newValue2'."
    ]
    expected_result: "`onSaveModule` is called with the correctly modified YAML content for the module."
}

test cfv_tests.TraceVisualization_StepStatus {
    title: "Test: Visualize Flow Trace with Step Statuses"
    description: "Verifies that when `traceData` is provided, step nodes are visually updated (e.g., color-coded by custom renderer) to reflect their execution status."
    verifies_requirement: [cfv_requirements.FR8_Debugging_TraceVisualization]
    type: "Integration"
    priority: "Critical"
    test_location: {
        language: "TypeScript",
        framework: "JestPlaywright",
        filepath: "tests/integration/trace_visualization.spec.ts",
        test_case_id_in_file: "should_display_step_statuses_from_trace_data"
    }
    preconditions: [
        "Visualizer loaded with a flow having steps 's1', 's2'.",
        "Custom node renderer is configured to change appearance based on `node.data.executionStatus`."
    ]
    data_inputs: {
        traceData: "{ flowFqn: 'com.example.tracedFlow', steps: [{ stepId: 's1', status: 'SUCCESS' }, { stepId: 's2', status: 'FAILURE' }] }" // Simplified trace
    }
    steps: [
        "Given the visualizer is loaded and `mode` is 'trace'",
        "When `traceData` (from data_inputs) is provided via props",
        "Then the node for step 's1' should visually indicate 'SUCCESS' status.",
        "And the node for step 's2' should visually indicate 'FAILURE' status."
    ]
    expected_result: "Step nodes in the graph correctly reflect their execution status from the trace data, as interpreted by the custom node renderer."
}

// cfv_tests.dspec

test cfv_tests.ModuleLoading_WithImportsAndAlias {
    title: "Test: Load Modules with Imports and Aliases"
    description: "Verifies the visualizer correctly handles `imports` (including aliases) between modules, using `props.requestModule` for dependencies."
    verifies_requirement: [cfv_requirements.FR1_2_RequestAdditionalModules, cfv_requirements.FR1_5_HandleImportsAndAliases]
    type: "Integration" // Could be E2E with Playwright or focused Vitest test with mocked props
    priority: "Critical"
    test_location: {
        language: "TypeScript",
        framework: "Vitest", // Assuming a more focused integration test
        filepath: "tests/integration/module_imports.spec.ts",
        test_case_id_in_file: "should_resolve_imports_and_aliases_correctly"
    }
    preconditions: [
        "The `props.requestModule` function is mocked using Vitest (e.g., `vi.fn()`).",
        "Mocked `props.requestModule` is set up to return specific module content when called with expected FQNs."
    ]
    data_inputs: {
        initialModules: "[{ fqn: 'com.example.main', content: 'dsl_version: \"1.1\"\\nnamespace: com.example.main\\nimports:\\n  - namespace: com.example.shared\\n    as: util\\nflows:\\n  - name: MainFlow\\n    trigger: { type: T1 }\\n    steps:\\n      - step_id: s1\\n        component_ref: util.SharedComponent' }]",
        mockedSharedModuleContent: "'dsl_version: \"1.1\"\\nnamespace: com.example.shared\\ndefinitions:\\n  components:\\n    - name: SharedComponent\\n      type: StdLib:NoOp'"
    }
    steps: [
        "Given the CascadeFlowVisualizer is rendered with `initialModules` (com.example.main) and mocked `props.requestModule`",
        "And `props.requestModule` is configured to return `mockedSharedModuleContent` when called with 'com.example.shared'",
        "When the visualizer processes the 'com.example.main' module",
        "Then `props.requestModule` should have been called with 'com.example.shared'.",
        "And the 'com.example.shared' module should be loaded and available in the internal ModuleRegistry.",
        "And if 'com.example.main.MainFlow' is selected and step 's1' is inspected,",
        "Then its `resolvedComponentFqn` (in `node.data`) should correspond to 'com.example.shared.SharedComponent' (or its base type if `SharedComponent` is a named component)."
    ]
    expected_result: "The import is resolved, the dependent module is loaded via `props.requestModule`, and component references using aliases are correctly resolved. MSW could be used if `requestModule` involved actual network calls in a real app, but for library testing, Vitest mocks are sufficient."
}

test cfv_tests.TraceVisualization_StepStatusAndData {
    title: "Test: Visualize Flow Trace with Step Statuses and I/O Data Inspector"
    description: "Verifies step nodes reflect execution status and the Inspector's Data I/O tab shows correct data when a step is selected in trace mode."
    verifies_requirement: [cfv_requirements.FR8_Debugging_TraceVisualization, cfv_requirements.UILayout_RightSidebar_Inspector]
    type: "E2E"
    priority: "Critical"
    test_location: {
        language: "TypeScript",
        framework: "Playwright",
        filepath: "tests/e2e/trace_visualization_detail.spec.ts",
        test_case_id_in_file: "should_display_step_statuses_and_correct_io_data_in_inspector"
    }
    preconditions: [
        "Visualizer loaded with a flow having steps 's1' (SUCCESS) and 's2' (FAILURE).",
        "Consumer provides `customNodeTypes` that visually distinguish executionStatus.",
        "Consumer provides `renderInspectorDataIOTab` that displays `executionInputData` and `executionOutputData`."
    ]
    data_inputs: {
        initialModuleContent: "'dsl_version: \"1.1\"\\nnamespace: com.example.traced\\nflows:\\n  - name: MyTraceFlow\\n    trigger: { type: T1 }\\n    steps:\\n      - step_id: s1\\n        component_ref: C1\\n      - step_id: s2\\n        component_ref: C2\\n        inputs_map: { in: \"steps.s1.outputs.out\" }'",
        traceData: "{ traceId: 'trace-001', flowFqn: 'com.example.traced.MyTraceFlow', status: 'FAILED', startTime: '2023-01-01T10:00:00Z', steps: [{ stepId: 's1', status: 'SUCCESS', inputData: { initial: true }, outputData: { out: 'hello' } }, { stepId: 's2', status: 'FAILURE', inputData: { in: 'hello' }, outputData: { error: 'Something broke' } }] }"
    }
    steps: [
        "Given the CascadeFlowVisualizer is rendered with the initial module (from `initialModuleContent`)",
        "And `mode` is 'trace' and `traceData` (from `data_inputs`) is provided",
        "When the 'com.example.traced.MyTraceFlow' is displayed",
        "Then the node for step 's1' should visually indicate 'SUCCESS'.",
        "And the node for step 's2' should visually indicate 'FAILURE'.",
        "When step 's1' is selected",
        "Then the 'Data I/O' tab in the Right Sidebar should display inputData: { initial: true } and outputData: { out: 'hello' }.",
        "When step 's2' is selected",
        "Then the 'Data I/O' tab in the Right Sidebar should display inputData: { in: 'hello' } and outputData: { error: 'Something broke' }."
    ]
    expected_result: "Graph nodes visually reflect step statuses. Selecting a step in trace mode populates the Data I/O inspector tab with the correct input and output data from the trace."
}

test cfv_tests.ModuleRegistryService_ResolveComponent_NamedComponentInSameModule {
    title: "Unit Test: ModuleRegistryService.resolveComponentTypeInfo - Named Component in Same Module"
    verifies_code: [cfv_internal_services_code.ModuleRegistryService_ResolveComponentTypeInfo]
    type: "Unit"
    priority: "High"
    test_location: { filepath: "src/services/module_registry_service.spec.ts", test_case_id_in_file: "resolveComponentTypeInfo should find named component in same module" }
    preconditions: [
        "ModuleRegistryService is instantiated.",
        "A module 'com.example.test' is loaded with a NamedComponentDefinition 'MyNamedComp' (type: 'StdLib:ActualType')."
    ]
    data_inputs: { componentRef: "MyNamedComp", currentModuleFqn: "com.example.test" }
    steps: [
        "When resolveComponentTypeInfo is called with data_inputs",
        "Then the result should be an object.",
        "And result.baseType should be 'StdLib:ActualType'.",
        "And result.isNamedComponent should be true.",
        "And result.componentDefinition.name should be 'MyNamedComp'.",
        "And result.sourceModuleFqn should be 'com.example.test'."
    ]
    expected_result: "Correctly resolves to the named component within the same module."
}

test cfv_tests.GraphBuilderService_GenerateFlowDetail_Basic {
    title: "Unit Test: GraphBuilderService.generateFlowDetailGraphData - Basic Flow"
    verifies_code: [cfv_internal_services_code.GraphBuilderService_GenerateFlowDetailGraphData]
    type: "Unit"
    priority: "Critical"
    test_location: { filepath: "src/services/graph_builder_service.spec.ts", test_case_id_in_file: "generateFlowDetailGraphData should create nodes and edges for a basic flow" }
    preconditions: [
        "GraphBuilderService instantiated.",
        "Mocked ModuleRegistry providing a simple flow definition for 'com.example.flow.Simple'.",
        "Mocked parseContextVarsFn.",
        "Mocked componentSchemas."
    ]
    data_inputs: {
        params: "{ flowFqn: 'com.example.flow.Simple', mode: 'design', moduleRegistry: mockModuleRegistry, parseContextVarsFn: mockParseFn, componentSchemas: mockSchemas }"
    }
    steps: [
        "When generateFlowDetailGraphData is called with data_inputs.params",
        "Then the returned object should have 'nodes' and 'edges' arrays.",
        "And 'nodes' array should contain a trigger node and step nodes corresponding to the flow definition.",
        "And 'edges' array should reflect `inputs_map` and `run_after` connections.",
        "And node data payloads should contain expected dslObject, resolvedComponentFqn, etc."
    ]
    expected_result: "Correct graph data structure is generated for a basic flow."
}

// --- NEW TESTS FOR ENHANCED FEATURES ---

test cfv_tests.LayoutService_LeftToRightOrientation {
    title: "Test: Left-to-Right Layout Orientation"
    description: "Verifies that flows are rendered with left-to-right orientation by default."
    verifies_requirement: [cfv_requirements.FR12_LeftToRightFlowLayout, cfv_requirements.FR6_Layout_ELKjs]
    type: "Integration"
    priority: "High"
    test_location: {
        language: "TypeScript",
        framework: "Vitest",
        filepath: "tests/integration/layout_orientation.spec.ts",
        test_case_id_in_file: "should_render_flows_left_to_right"
    }
    preconditions: [
        "A flow with trigger and multiple steps is loaded.",
        "ELK.js layout is enabled."
    ]
    steps: [
        "Given a flow with trigger -> step1 -> step2 -> step3 is displayed",
        "When the layout is applied",
        "Then the trigger node should have the smallest x-coordinate",
        "And step nodes should be arranged with increasing x-coordinates",
        "And the layout direction should be 'RIGHT'"
    ]
    expected_result: "Flow elements are arranged from left to right in execution order."
}

test cfv_tests.SystemOverview_FlowNavigation {
    title: "Test: System Overview Flow Node Navigation"
    description: "Verifies that clicking on flow nodes in System Overview navigates to Flow Detail view."
    verifies_requirement: [cfv_requirements.FR14_SystemOverviewNavigation]
    type: "E2E"
    priority: "High"
    test_location: {
        language: "TypeScript",
        framework: "Playwright",
        filepath: "tests/e2e/system_overview_navigation.spec.ts",
        test_case_id_in_file: "should_navigate_to_flow_detail_on_flow_node_click"
    }
    preconditions: [
        "Multiple flows are loaded in the visualizer.",
        "System Overview mode is active."
    ]
    steps: [
        "Given the visualizer is in System Overview mode",
        "And multiple flow nodes are visible",
        "When a specific flow node is clicked",
        "Then the visualizer should switch to Flow Detail mode",
        "And the clicked flow should be displayed in detail",
        "And the URL or navigation state should reflect the selected flow"
    ]
    expected_result: "Clicking flow nodes in System Overview successfully navigates to Flow Detail view."
}

test cfv_tests.NodeStyling_BackgroundContainment {
    title: "Test: Node Background Styling Containment"
    description: "Verifies that node backgrounds are properly contained within node boundaries."
    verifies_requirement: [cfv_requirements.FR13_ImprovedNodeStyling]
    type: "Visual"
    priority: "Medium"
    test_location: {
        language: "TypeScript",
        framework: "Playwright",
        filepath: "tests/visual/node_styling.spec.ts",
        test_case_id_in_file: "should_contain_backgrounds_within_node_boundaries"
    }
    preconditions: [
        "Nodes with various background styles are rendered.",
        "Visual regression testing is configured."
    ]
    steps: [
        "Given nodes with different background colors and styles are displayed",
        "When the nodes are rendered",
        "Then backgrounds should not extend beyond node boundaries",
        "And text should be properly positioned within nodes",
        "And borders and shadows should render correctly"
    ]
    expected_result: "Node styling is properly contained and visually correct."
}

// --- COMPLEX CASINO PLATFORM EXAMPLE ---

test cfv_tests.ComplexExample_CasinoPlatform {
    title: "Test: Complex Casino Platform Example"
    description: "Verifies the visualizer can handle a complex, real-world casino platform with multiple interconnected flows."
    verifies_requirement: [cfv_requirements.FR16_ComplexExampleSupport]
    type: "Integration"
    priority: "Medium"
    test_location: {
        language: "TypeScript",
        framework: "Vitest",
        filepath: "tests/integration/complex_casino_example.spec.ts",
        test_case_id_in_file: "should_handle_complex_casino_platform"
    }
    preconditions: [
        "Complex casino platform DSL modules are prepared.",
        "All required component schemas are provided."
    ]
    data_inputs: {
        casinoModules: [
            {
                fqn: "com.casino.core",
                content: `
dsl_version: "1.1"
namespace: com.casino.core
imports:
  - namespace: com.casino.payments
    as: payments
  - namespace: com.casino.games
    as: games
  - namespace: com.casino.users
    as: users

definitions:
  context:
    - name: max-bet-amount
      value: 10000
      type: number
    - name: min-bet-amount
      value: 1
      type: number
    - name: house-edge
      value: 0.02
      type: number

  components:
    - name: bet-validator
      type: StdLib:FilterData
      config:
        expression: "amount >= {{context.min-bet-amount}} && amount <= {{context.max-bet-amount}}"
        matchOutput: validBet
        noMatchOutput: invalidBet

    - name: balance-checker
      type: StdLib:HttpCall
      config:
        url: "{{secrets.user-service-url}}/balance/{{context.user-id}}"
        method: GET
        timeout: 5000

flows:
  - name: PlaceBetFlow
    trigger:
      type: StdLib:HttpTrigger
      config:
        path: /api/bets
        method: POST
    steps:
      - step_id: validate-bet
        component_ref: bet-validator
        inputs_map:
          data: "trigger.body"
      - step_id: check-balance
        component_ref: balance-checker
        inputs_map:
          userId: "trigger.body.userId"
        run_after: [validate-bet]
      - step_id: process-payment
        component_ref: payments.ProcessPayment
        inputs_map:
          amount: "steps.validate-bet.outputs.validBet.amount"
          userId: "trigger.body.userId"
        run_after: [check-balance]
      - step_id: execute-game
        component_ref: games.ExecuteGame
        inputs_map:
          gameType: "trigger.body.gameType"
          betAmount: "steps.validate-bet.outputs.validBet.amount"
          userId: "trigger.body.userId"
        run_after: [process-payment]
      - step_id: update-balance
        component_ref: users.UpdateBalance
        inputs_map:
          userId: "trigger.body.userId"
          amount: "steps.execute-game.outputs.winnings"
        run_after: [execute-game]
                `
            },
            {
                fqn: "com.casino.payments",
                content: `
dsl_version: "1.1"
namespace: com.casino.payments

definitions:
  components:
    - name: ProcessPayment
      type: StdLib:HttpCall
      config:
        url: "{{secrets.payment-service-url}}/process"
        method: POST
        timeout: 10000
        headers:
          Authorization: "Bearer {{secrets.payment-api-key}}"

flows:
  - name: RefundFlow
    trigger:
      type: StdLib:EventTrigger
      config:
        eventType: bet-cancelled
    steps:
      - step_id: calculate-refund
        component_ref: StdLib:MapData
        config:
          expression: "{ amount: event.originalBet.amount, userId: event.userId }"
        inputs_map:
          data: "trigger.event"
      - step_id: process-refund
        component_ref: ProcessPayment
        config:
          url: "{{secrets.payment-service-url}}/refund"
        inputs_map:
          refundData: "steps.calculate-refund.outputs.result"
                `
            }
        ]
    }
    steps: [
        "Given the complex casino platform modules are loaded",
        "When the visualizer processes all modules",
        "Then all flows should be correctly parsed and displayed",
        "And the System Overview should show flow relationships",
        "And clicking on PlaceBetFlow should show its detailed steps",
        "And component references across modules should be resolved",
        "And the layout should handle 10+ nodes efficiently"
    ]
    expected_result: "Complex casino platform is successfully visualized with all flows, components, and relationships properly displayed."
}

example cfv_tests.CasinoPlatformDSLExamples {
    title: "Casino Platform DSL Examples"
    description: "Complete DSL examples for a casino platform demonstrating complex flows and integrations."
    
    user_management_module: `
dsl_version: "1.1"
namespace: com.casino.users

definitions:
  context:
    - name: kyc-verification-url
      value: "https://api.kyc-provider.com/verify"
      type: string
    - name: max-daily-deposit
      value: 50000
      type: number

  components:
    - name: kyc-verifier
      type: StdLib:HttpCall
      config:
        url: "{{context.kyc-verification-url}}"
        method: POST
        timeout: 30000
        headers:
          Authorization: "Bearer {{secrets.kyc-api-key}}"

    - name: deposit-limit-checker
      type: StdLib:FilterData
      config:
        expression: "dailyTotal + amount <= {{context.max-daily-deposit}}"
        matchOutput: withinLimit
        noMatchOutput: exceedsLimit

flows:
  - name: UserRegistrationFlow
    trigger:
      type: StdLib:HttpTrigger
      config:
        path: /api/users/register
        method: POST
    steps:
      - step_id: validate-user-data
        component_ref: StdLib:JsonSchemaValidator
        config:
          schema:
            type: object
            required: [email, password, firstName, lastName, dateOfBirth]
            properties:
              email: { type: string, format: email }
              password: { type: string, minLength: 8 }
              firstName: { type: string, minLength: 1 }
              lastName: { type: string, minLength: 1 }
              dateOfBirth: { type: string, format: date }
        inputs_map:
          data: "trigger.body"
      - step_id: check-age-eligibility
        component_ref: StdLib:FilterData
        config:
          expression: "age(dateOfBirth) >= 18"
          matchOutput: eligible
          noMatchOutput: underage
        inputs_map:
          data: "steps.validate-user-data.outputs.validData"
        run_after: [validate-user-data]
      - step_id: perform-kyc
        component_ref: kyc-verifier
        inputs_map:
          userData: "steps.check-age-eligibility.outputs.eligible"
        run_after: [check-age-eligibility]
      - step_id: create-user-account
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.user-db-url}}/users"
          method: POST
        inputs_map:
          userData: "steps.perform-kyc.outputs.verifiedUser"
        run_after: [perform-kyc]

  - name: DepositFlow
    trigger:
      type: StdLib:HttpTrigger
      config:
        path: /api/users/deposit
        method: POST
    steps:
      - step_id: check-deposit-limits
        component_ref: deposit-limit-checker
        inputs_map:
          data: "trigger.body"
      - step_id: process-deposit
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.payment-processor-url}}/deposit"
          method: POST
        inputs_map:
          depositData: "steps.check-deposit-limits.outputs.withinLimit"
        run_after: [check-deposit-limits]
      - step_id: update-user-balance
        component_ref: UpdateBalance
        inputs_map:
          userId: "trigger.body.userId"
          amount: "steps.process-deposit.outputs.processedAmount"
        run_after: [process-deposit]

  components:
    - name: UpdateBalance
      type: StdLib:HttpCall
      config:
        url: "{{secrets.user-db-url}}/users/{{userId}}/balance"
        method: PATCH
    `

    game_engine_module: `
dsl_version: "1.1"
namespace: com.casino.games

imports:
  - namespace: com.casino.core
    as: core

definitions:
  context:
    - name: rng-service-url
      value: "https://api.rng-provider.com/generate"
      type: string
    - name: game-result-retention-days
      value: 90
      type: number

  components:
    - name: rng-generator
      type: StdLib:HttpCall
      config:
        url: "{{context.rng-service-url}}"
        method: POST
        timeout: 5000
        headers:
          Authorization: "Bearer {{secrets.rng-api-key}}"

    - name: game-outcome-calculator
      type: StdLib:MapData
      config:
        expression: |
          {
            result: randomValue < winThreshold ? 'win' : 'lose',
            multiplier: randomValue < winThreshold ? calculateMultiplier(gameType, randomValue) : 0,
            winnings: randomValue < winThreshold ? betAmount * calculateMultiplier(gameType, randomValue) : 0
          }

flows:
  - name: ExecuteSlotGame
    trigger:
      type: StdLib:SubFlowInvoker
      config:
        flow_fqn: core.PlaceBetFlow
    steps:
      - step_id: generate-random-numbers
        component_ref: rng-generator
        config:
          count: 3
          min: 0
          max: 100
        inputs_map:
          gameId: "trigger.gameId"
      - step_id: calculate-slot-outcome
        component_ref: game-outcome-calculator
        config:
          gameType: "slot"
          winThreshold: 0.15
        inputs_map:
          randomValue: "steps.generate-random-numbers.outputs.numbers[0]"
          betAmount: "trigger.betAmount"
        run_after: [generate-random-numbers]
      - step_id: store-game-result
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.game-db-url}}/results"
          method: POST
        inputs_map:
          gameResult: "steps.calculate-slot-outcome.outputs.result"
          userId: "trigger.userId"
          timestamp: "{{now()}}"
        run_after: [calculate-slot-outcome]

  - name: ExecuteBlackjackGame
    trigger:
      type: StdLib:SubFlowInvoker
      config:
        flow_fqn: core.PlaceBetFlow
    steps:
      - step_id: deal-initial-cards
        component_ref: rng-generator
        config:
          count: 4
          min: 1
          max: 13
        inputs_map:
          gameId: "trigger.gameId"
      - step_id: calculate-hand-values
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              playerHand: calculateBlackjackValue([numbers[0], numbers[1]]),
              dealerHand: calculateBlackjackValue([numbers[2], numbers[3]]),
              playerCards: [numbers[0], numbers[1]],
              dealerCards: [numbers[2], numbers[3]]
            }
        inputs_map:
          data: "steps.deal-initial-cards.outputs"
        run_after: [deal-initial-cards]
      - step_id: determine-winner
        component_ref: game-outcome-calculator
        config:
          gameType: "blackjack"
        inputs_map:
          playerHand: "steps.calculate-hand-values.outputs.result.playerHand"
          dealerHand: "steps.calculate-hand-values.outputs.result.dealerHand"
          betAmount: "trigger.betAmount"
        run_after: [calculate-hand-values]
      - step_id: store-blackjack-result
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.game-db-url}}/blackjack-results"
          method: POST
        inputs_map:
          gameResult: "steps.determine-winner.outputs.result"
          handDetails: "steps.calculate-hand-values.outputs.result"
          userId: "trigger.userId"
        run_after: [determine-winner]

  components:
    - name: ExecuteGame
      type: StdLib:Switch
      config:
        cases:
          - conditionExpression: "gameType == 'slot'"
            outputName: slotGame
          - conditionExpression: "gameType == 'blackjack'"
            outputName: blackjackGame
          - conditionExpression: "gameType == 'roulette'"
            outputName: rouletteGame
        defaultOutputName: unsupportedGame
    `

    analytics_module: `
dsl_version: "1.1"
namespace: com.casino.analytics

imports:
  - namespace: com.casino.core
    as: core
  - namespace: com.casino.users
    as: users

definitions:
  context:
    - name: analytics-db-url
      value: "https://analytics-db.casino.com"
      type: string
    - name: real-time-dashboard-url
      value: "https://dashboard.casino.com/api/events"
      type: string

flows:
  - name: GameAnalyticsFlow
    trigger:
      type: StdLib:EventTrigger
      config:
        eventType: game-completed
    steps:
      - step_id: extract-game-metrics
        component_ref: StdLib:MapData
        config:
          expression: |
            {
              gameType: event.gameType,
              betAmount: event.betAmount,
              winnings: event.winnings,
              duration: event.endTime - event.startTime,
              userId: event.userId,
              timestamp: event.timestamp,
              houseEdge: (event.betAmount - event.winnings) / event.betAmount
            }
        inputs_map:
          data: "trigger.event"
      - step_id: store-analytics-data
        component_ref: StdLib:HttpCall
        config:
          url: "{{context.analytics-db-url}}/game-metrics"
          method: POST
        inputs_map:
          metrics: "steps.extract-game-metrics.outputs.result"
        run_after: [extract-game-metrics]
      - step_id: update-real-time-dashboard
        component_ref: StdLib:HttpCall
        config:
          url: "{{context.real-time-dashboard-url}}"
          method: POST
        inputs_map:
          dashboardEvent: "steps.extract-game-metrics.outputs.result"
        run_after: [extract-game-metrics]

  - name: UserBehaviorAnalyticsFlow
    trigger:
      type: StdLib:EventTrigger
      config:
        eventType: user-action
    steps:
      - step_id: classify-user-action
        component_ref: StdLib:Switch
        config:
          cases:
            - conditionExpression: "action == 'login'"
              outputName: loginAction
            - conditionExpression: "action == 'deposit'"
              outputName: depositAction
            - conditionExpression: "action == 'bet'"
              outputName: betAction
            - conditionExpression: "action == 'withdrawal'"
              outputName: withdrawalAction
          defaultOutputName: otherAction
        inputs_map:
          data: "trigger.event"
      - step_id: update-user-profile
        component_ref: users.UpdateUserProfile
        inputs_map:
          userId: "trigger.event.userId"
          actionData: "steps.classify-user-action.outputs"
        run_after: [classify-user-action]
      - step_id: check-risk-indicators
        component_ref: StdLib:FilterData
        config:
          expression: "isHighRiskBehavior(actionData)"
          matchOutput: highRisk
          noMatchOutput: normalRisk
        inputs_map:
          data: "steps.classify-user-action.outputs"
        run_after: [classify-user-action]
      - step_id: trigger-risk-alert
        component_ref: StdLib:HttpCall
        config:
          url: "{{secrets.risk-management-url}}/alerts"
          method: POST
        inputs_map:
          riskData: "steps.check-risk-indicators.outputs.highRisk"
        run_after: [check-risk-indicators]
        condition: "steps.check-risk-indicators.outputs.highRisk != null"
    `
}