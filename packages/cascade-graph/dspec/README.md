## Consumer Documentation: `<CascadeFlowVisualizer />` API Reference

This section details the props accepted by the main `<CascadeFlowVisualizer />` React component.

**Source:** `cfv_models.dspec` (model: `cfv_models.CascadeFlowVisualizerProps` and linked models), `cfv_consumer_directives.dspec` (directive: `cfv_consumer_directives.CallbackPropHandling`).

---

### Core Data & Loading Props

#### `initialModules?: DslModuleInput[]`

*   **Type:** `cfv_models.DslModuleInput[]`
    *   `DslModuleInput`: `{ fqn: string; content: string; }` (See `cfv_models.DslModuleInput`)
*   **Optional**
*   **Description:** An array of DSL module objects to load when the visualizer is first mounted. Each object must provide the module's Fully Qualified Name (`fqn`) and its raw YAML `content`.
*   **Usage Notes:** Provide modules here that should be immediately available without needing asynchronous fetching. The visualizer will parse these and build its initial internal registry.

#### `requestModule: (fqn: string) => Promise<RequestModuleResult | null>`

*   **Type:** `(fqn: string) => Promise<cfv_models.RequestModuleResult | null>`
    *   `RequestModuleResult`: `{ fqn: string; content: string; }` (See `cfv_models.RequestModuleResult`)
*   **Required**
*   **Description:** A callback function provided by the consuming application. The visualizer calls this function when it needs to load a DSL module that is not already in its registry (e.g., due to an `import` statement in another module or direct navigation to an unloaded flow).
*   **Usage Notes (from `cfv_consumer_directives.CallbackPropHandling`):**
    *   Your implementation should asynchronously fetch the module content for the given `fqn`.
    *   Resolve the Promise with a `RequestModuleResult` object containing the `fqn` and `content` if successful.
    *   Resolve with `null` or reject the Promise if the module cannot be found or an error occurs during fetching. The visualizer will then use `onModuleLoadError` if provided.
    *   Consider implementing client-side caching in your `requestModule` function to avoid redundant fetches for the same module FQN.

#### `componentSchemas?: Record<string, ComponentSchema>`

*   **Type:** `Record<string, cfv_models.ComponentSchema>`
    *   `ComponentSchema`: `{ fqn: string; configSchema?: object; inputSchema?: object; outputSchema?: object; }` (See `cfv_models.ComponentSchema`)
*   **Optional** (but highly recommended for full functionality like config validation and form generation)
*   **Description:** An object mapping component type FQNs (e.g., `"StdLib:HttpCall"`) to their JSON Schemas. These schemas describe the structure for `config`, `inputs`, and `outputs` of components.
*   **Usage Notes:** The visualizer uses these schemas for:
    *   Validating `config` blocks in DSL steps and Named Component Definitions.
    *   Providing schema information to consumer-rendered inspector tabs (e.g., for dynamic form generation).
    *   The library expects all schemas to be provided upfront and performs synchronous lookups.

#### `onModuleLoadError?: (fqn: string, error: Error) => void`

*   **Type:** `(fqn: string, error: Error) => void`
*   **Optional**
*   **Description:** A callback function invoked if `props.requestModule` fails to load a module (e.g., rejects or returns `null`), or if an internal parsing error occurs for a module from `initialModules` or `requestModule`.
*   **Usage Notes:** Use this to log errors or display notifications to the user about module loading issues.

#### `parseContextVariables: (value: string) => string[]`

*   **Type:** `(value: string) => string[]`
*   **Required**
*   **Description:** A utility function provided by the consumer that takes a string value (typically from a DSL `config` or `inputs_map` string) and returns an array of any Cascade context variable names (e.g., `my-var`, `com.org.module.shared-var`) found within it (e.g., from `{{context.my-var}}`).
*   **Usage Notes:** The visualizer uses this to identify and display context variable usages within DSL elements. Implement robust parsing for your specific context variable syntax.

---

### Editing Props

#### `isEditingEnabled?: boolean`

*   **Type:** `boolean`
*   **Optional** (Defaults to `false`)
*   **Description:** If `true`, enables editing capabilities, primarily through the consumer-rendered "Properties/Config" inspector tab.
*   **Usage Notes:** When `true`, the `actions.requestSave` function will be available to your `renderInspectorPropertiesTab` implementation.

#### `onSaveModule?: (payload: SaveModulePayload) => Promise<void | boolean>`

*   **Type:** `(payload: cfv_models.SaveModulePayload) => Promise<void | boolean>`
    *   `SaveModulePayload`: `{ fqn: string; newContent: string; }` (See `cfv_models.SaveModulePayload`)
*   **Optional** (Required if `isEditingEnabled` is `true` and saving is intended)
*   **Description:** A callback function invoked when the visualizer requests to save a modified module. This typically happens when `actions.requestSave` is called from a consumer-rendered inspector tab.
*   **Usage Notes (from `cfv_consumer_directives.CallbackPropHandling`):**
    *   Your implementation is responsible for persisting the `payload.newContent` (the full new YAML string for the module `payload.fqn`). This could involve saving to a file, sending to a backend API, etc.
    *   The Promise should resolve successfully if the save operation was accepted or completed. It can resolve with `false` or reject if the save failed, allowing the host application to handle the error (the visualizer itself doesn't provide UI feedback for save success/failure beyond the Promise outcome).
    *   Consider optimistic updates in your application for a smoother user experience.

---

### Mode & Data Props

#### `mode: 'design' | 'trace' | 'test_result'`

*   **Type:** `'design' | 'trace' | 'test_result'` (See `cfv_models.VisualizerModeEnum`)
*   **Required**
*   **Description:** Specifies the current operational mode of the visualizer.
    *   `'design'`: Standard mode for viewing and editing DSL structure.
    *   `'trace'`: Mode for visualizing a historical `FlowExecutionTrace`. Graph elements will be augmented with execution data.
    *   `'test_result'`: Mode for visualizing the results of a `FlowTestCase` run, which includes a trace and assertion results.
*   **Usage Notes:** Changing this prop will cause the visualizer to re-render and potentially re-calculate graph data.

#### `designData?: DesignDataProps`

*   **Type:** `cfv_models.DesignDataProps`
    *   `DesignDataProps`: `{ initialViewMode?: 'systemOverview' | 'flowDetail'; initialFlowFqn?: string | null; }`
*   **Optional**
*   **Description:** Provides initial view settings when `mode` is `'design'`.
    *   `initialViewMode`: Sets whether to start in "System Overview" or "Flow Detail" view.
    *   `initialFlowFqn`: If `initialViewMode` is `'flowDetail'`, this specifies the FQN of the flow to display initially.

#### `traceData?: FlowExecutionTrace | null`

*   **Type:** `cfv_models.FlowExecutionTrace | null` (See `cfv_models.FlowExecutionTrace`)
*   **Optional**
*   **Description:** Provides the detailed execution trace data when `mode` is `'trace'` or `'test_result'`. Setting this prop (or changing it) will trigger the visualizer to overlay trace information onto the relevant flow graph.
*   **Usage Notes:** Set to `null` or `undefined` to clear any existing trace overlay.

#### `testResultData?: TestRunResult | null`

*   **Type:** `cfv_models.TestRunResult | null` (See `cfv_models.TestRunResult`)
*   **Optional**
*   **Description:** Provides the results of a `FlowTestCase` execution when `mode` is `'test_result'`. This typically includes the `FlowExecutionTrace` (which will be used for visualization) and `assertionResults`.
*   **Usage Notes:** Setting this prop will also utilize its `.trace` property similar to `traceData`.

---

### Callback Props

#### `onViewChange?: (view: ViewChangePayload) => void`

*   **Type:** `(view: cfv_models.ViewChangePayload) => void`
    *   `ViewChangePayload`: `{ mode: 'design' | 'trace' | 'test_result'; currentFlowFqn?: string | null; systemViewActive: boolean; }`
*   **Optional**
*   **Description:** A callback invoked whenever the visualizer's internal view state changes (e.g., user navigates to a different flow, switches to system overview, or mode changes internally due to test run completion).
*   **Usage Notes:** Useful for synchronizing external UI elements (like browser URL/history) with the visualizer's state.

#### `onElementSelect?: (element: SelectedElement | null) => void`

*   **Type:** `(element: cfv_models.SelectedElement | null) => void` (See `cfv_models.SelectedElement`)
*   **Optional**
*   **Description:** A callback invoked when a user selects or deselects an element in the visualizer (e.g., a node/edge in the graph, an item in a sidebar list).
*   **Usage Notes:** `element` will be `null` if the selection is cleared. The `element.data` field contains the actual object selected (e.g., React Flow node, `DslModuleRepresentation`).

---

### Debugging & Trace Callback Props

#### `fetchTraceList?: (filterOptions?: any) => Promise<HistoricalFlowInstanceSummary[]>`

*   **Type:** `(filterOptions?: any) => Promise<cfv_models.HistoricalFlowInstanceSummary[]>` (See `cfv_models.HistoricalFlowInstanceSummary`)
*   **Optional**
*   **Description:** A callback function the visualizer uses to fetch a list of historical flow run summaries for display in the "Flow Runs/History List" in the Left Sidebar.
*   **Usage Notes (from `cfv_consumer_directives.CallbackPropHandling`):**
    *   Your implementation should fetch the summary data (e.g., from a backend API).
    *   The `filterOptions` argument is for future extensibility; V1 might not pass any specific options.
    *   Resolve the Promise with an array of `HistoricalFlowInstanceSummary` objects.

---

### Property Testing Callback Props

#### `onRunTestCase?: (testCase: FlowTestCase) => Promise<TestRunResult | null>`

*   **Type:** `(testCase: cfv_models.FlowTestCase) => Promise<cfv_models.TestRunResult | null>` (See `cfv_models.FlowTestCase` and `cfv_models.TestRunResult`)
*   **Optional**
*   **Description:** A callback invoked when a user triggers a test case run from the (consumer-rendered) "Test Definition" inspector tab.
*   **Usage Notes (from `cfv_consumer_directives.CallbackPropHandling`):**
    *   Your implementation is responsible for taking the `testCase` object, executing the target flow (potentially in a sandboxed environment, with mocks applied as defined in `testCase.componentMocks`), collecting the trace, evaluating assertions, and constructing a `TestRunResult` object.
    *   Resolve the Promise with the `TestRunResult`. If the test execution itself fails catastrophically, you can resolve with `null` or reject the Promise.

---

### Customization (Renderer) Props

#### `customReactFlowProOptions?: Partial<ReactFlowProps>`

*   **Type:** `Partial<ReactFlowProps>` (from `reactflow` library)
*   **Optional**
*   **Description:** Allows passing through additional props directly to the underlying React Flow instance (e.g., for connection line styles, snap grid settings, etc.).
*   **Usage Notes:** Refer to React Flow documentation for available options.

#### `customNodeTypes: NodeTypes`

*   **Type:** `NodeTypes` (from `reactflow` library)
*   **Required**
*   **Description:** An object mapping node type strings to your custom React components for rendering nodes.
*   **Usage Notes:**
    *   You **must** provide renderers for the library's well-known types (e.g., `'triggerEntryPointNode'`, `'subFlowInvokerNode'`, `'defaultStepNode'`, etc.) or ensure your component-FQN specific types cover all possibilities.
    *   See the "Customization Guide: Custom Node Rendering" section for details on expected node types and data.

#### `customEdgeTypes: EdgeTypes`

*   **Type:** `EdgeTypes` (from `reactflow` library)
*   **Required**
*   **Description:** An object mapping edge type strings to your custom React components for rendering edges.
*   **Usage Notes:**
    *   You **must** provide renderers for well-known types like `'dataFlow'`, `'controlFlow'`, `'invocationEdge'`, or a `'defaultEdge'`.
    *   See the "Customization Guide: Custom Edge Rendering" for details.

#### `renderInspectorPropertiesTab?: (selectedElement, actions, moduleRegistry) => React.ReactNode`

*   **Type:** `(selectedElement: cfv_models.SelectedElement | null, actions: cfv_models.InspectorPropertiesActions, moduleRegistry: cfv_models.IModuleRegistry) => React.ReactNode`
*   **Optional**
*   **Description:** A function that renders the content of the "Properties/Config" tab in the Right Sidebar.
*   **Usage Notes:** See "Customization Guide: Customizing Inspector Tabs."

#### `renderInspectorSourceTab?: (selectedElement, moduleRegistry) => React.ReactNode`

*   **Type:** `(selectedElement: cfv_models.SelectedElement | null, moduleRegistry: cfv_models.IModuleRegistry) => React.ReactNode`
*   **Optional**
*   **Description:** Renders the content of the "Source (YAML)" tab. Typically displays the `selectedElement.data.dslObject` as a formatted YAML string.

#### `renderInspectorDataIOTab?: (selectedStepTrace, moduleRegistry) => React.ReactNode`

*   **Type:** `(selectedStepTrace: cfv_models.StepExecutionTrace | null, moduleRegistry: cfv_models.IModuleRegistry) => React.ReactNode`
*   **Optional**
*   **Description:** Renders the content of the "Data I/O" tab when a step is selected in `'trace'` or `'test_result'` mode.
*   **Usage Notes:** Use `selectedStepTrace.executionInputData` and `selectedStepTrace.executionOutputData`.

#### `renderInspectorContextVarsTab?: (relevantContext, selectedElement, moduleRegistry) => React.ReactNode`

*   **Type:** `(relevantContext: Record<string, any> | null, selectedElement: cfv_models.SelectedElement | null, moduleRegistry: cfv_models.IModuleRegistry) => React.ReactNode`
*   **Optional**
*   **Description:** Renders the content of the "Context Vars" tab, displaying resolved context variables relevant to the selected scope during a trace/test execution. `relevantContext` would be derived from `traceData.initialContext` or `stepTrace.contextBefore/After`.

#### `renderInspectorTestDefinitionTab?: (currentFlowFqn, actions, moduleRegistry) => React.ReactNode`

*   **Type:** `(currentFlowFqn: string | null, actions: { runTestCase: (testCase: cfv_models.FlowTestCase) => Promise<cfv_models.TestRunResult | null> }, moduleRegistry: cfv_models.IModuleRegistry) => React.ReactNode`
*   **Optional**
*   **Description:** Renders the UI for defining/editing a `FlowTestCase` when a flow is selected in `'design'` mode.
*   **Usage Notes:** The `actions.runTestCase` should internally call `props.onRunTestCase`.

#### `renderInspectorAssertionResultsTab?: (assertionResults, moduleRegistry) => React.ReactNode`

*   **Type:** `(assertionResults: cfv_models.AssertionResult[] | null, moduleRegistry: cfv_models.IModuleRegistry) => React.ReactNode`
*   **Optional**
*   **Description:** Renders the pass/fail status of assertions from `props.testResultData.assertionResults` when in `'test_result'` mode.

#### `renderFlowRunListItem?: (summary, actions, isSelected) => React.ReactNode`

*   **Type:** `(summary: cfv_models.HistoricalFlowInstanceSummary, actions: { selectTrace: (traceIdOrInstanceId: string) => void }, isSelected: boolean) => React.ReactNode`
*   **Optional**
*   **Description:** Renders a single item in the "Flow Runs/History List".
*   **Usage Notes:** The `actions.selectTrace` function should be called by your component when an item is clicked. This will internally trigger the host application to fetch the full trace and update `props.traceData` and `props.mode`.

---

### Layout, Styling & Dimension Props

#### `elkOptions?: any`

*   **Type:** `any` (Specific ELK layout options object)
*   **Optional**
*   **Description:** Allows passing configuration options directly to the ELK.js layout algorithm.
*   **Usage Notes:** Refer to ELK.js documentation for available options to fine-tune graph layout (e.g., spacing, direction, specific algorithm).

#### `className?: string`

*   **Type:** `string`
*   **Optional**
*   **Description:** A CSS class name to apply to the root container of the visualizer.

#### `style?: React.CSSProperties`

*   **Type:** `React.CSSProperties`
*   **Optional**
*   **Description:** Inline styles to apply to the root container of the visualizer. It's recommended to ensure the container has explicit dimensions (height and width) for React Flow to render correctly.

---

## Consumer Documentation: Customization Guide - Custom Node Rendering

This guide explains how to create custom React components for rendering nodes within the `CascadeFlowVisualizer` graph.

**Source:** `cfv_consumer_directives.dspec` (directive: `cfv_consumer_directives.CustomNodeRendering`), `cfv_models.dspec` (node data types like `StepNodeData`).

---

The `CascadeFlowVisualizer` uses [React Flow](https://reactflow.dev/) for graph visualization. You can provide your own React components to control how different types of nodes (flow steps, triggers, etc.) appear. This is done via the `customNodeTypes` prop.

### 1. The `customNodeTypes` Prop

This prop is an object where keys are **node type strings** and values are your custom React components.

```typescript
import { MyCustomStepNode } from './MyCustomStepNode';
import { MyTriggerNode } from './MyTriggerNode';

const nodeTypes = {
  // Well-known type for the library's default step node rendering
  'defaultStepNode': MyCustomStepNode,
  // Well-known type for triggers
  'triggerEntryPointNode': MyTriggerNode,
  // You can also map component FQNs directly
  'StdLib:HttpCall': MySpecificHttpCallNode, // If you want a special look for HttpCall steps
  'StdLib:SubFlowInvoker': MySubFlowInvokerNode, // For StdLib:SubFlowInvoker steps
  // ... other custom node types
};

<CascadeFlowVisualizer
  customNodeTypes={nodeTypes}
  // ... other props
/>
```

### 2. Node Type String Strategy

The visualizer assigns a `type` string to each generated React Flow node. Your `customNodeTypes` object should provide components for these types:

*   **Well-known Library Types:**
    *   `'triggerEntryPointNode'`: For the flow's trigger.
    *   `'subFlowInvokerNode'`: For steps using `StdLib:SubFlowInvoker`.
    *   `'systemFlowNode'`: For flow nodes in the System Overview graph.
    *   `'systemTriggerNode'`: For external trigger sources in the System Overview graph.
    *   `'defaultStepNode'`: A fallback type used for standard flow steps if a more specific component-FQN type is not found in your `customNodeTypes`.
*   **Component-FQN Specific Types:**
    *   For standard flow steps, the library will **first** try to use the step's resolved component FQN (e.g., `'StdLib:HttpCall'`, `'com.my_org.CustomProcessor'`) as the node `type`. If you provide a component for this FQN in `customNodeTypes`, it will be used.
    *   If a component for the specific FQN is **not** found, the library will then fall back to using `'defaultStepNode'` as the type.

**It's essential to provide at least a `defaultStepNode` component if you have any flows with steps.**

### 3. Anatomy of a Custom Node Component

Your custom node component is a standard React component that receives props from React Flow, most importantly `data`, `selected`, and `type`.

```typescript
// MyCustomStepNode.tsx
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { StepNodeData, ExecutionStatusEnum } from './cfv_models'; // Import from your model definitions

// Assuming StepNodeData is the expected data type for this node
const MyCustomStepNode: React.FC<NodeProps<StepNodeData>> = ({ data, selected, type }) => {
  const nodeStyle: React.CSSProperties = {
    padding: '10px 15px',
    border: '1px solid #777',
    borderRadius: '5px',
    background: '#fff',
    minWidth: '150px',
  };

  if (selected) {
    nodeStyle.borderColor = 'blue';
    nodeStyle.boxShadow = '0 0 5px blue';
  }

  // Style based on execution status (from trace data)
  if (data.executionStatus) {
    switch (data.executionStatus) {
      case 'SUCCESS':
        nodeStyle.background = '#e6ffed';
        nodeStyle.borderColor = '#52c41a';
        break;
      case 'FAILURE':
        nodeStyle.background = '#fff1f0';
        nodeStyle.borderColor = '#f5222d';
        break;
      case 'SKIPPED':
        nodeStyle.background = '#f0f0f0';
        nodeStyle.borderColor = '#bfbfbf';
        break;
      case 'RUNNING': // Example: add a pulsing animation or border
        nodeStyle.borderColor = '#1890ff';
        // You could add a CSS class for animation here
        break;
    }
  }

  // Style based on node error (e.g., config validation error)
  if (data.error) {
    nodeStyle.borderColor = 'orange';
    nodeStyle.borderWidth = '2px';
  }

  return (
    <div style={nodeStyle} title={data.error?.message}>
      {/* Input Handle (Top) - adjust Position as needed */}
      <Handle type="target" position={Position.Top} id="input_main" />

      <div>
        <strong>{data.label || data.stepId || 'Unknown Step'}</strong>
      </div>
      {data.resolvedComponentFqn && (
        <div style={{ fontSize: '0.8em', color: '#555' }}>
          Type: {data.resolvedComponentFqn.split(':').pop()} {/* Display short type name */}
        </div>
      )}
      {data.error && (
        <div style={{ fontSize: '0.8em', color: 'orange', marginTop: '5px' }}>
          ⚠️ {data.error.message.substring(0, 50)}{data.error.message.length > 50 ? '...' : ''}
        </div>
      )}
      {data.executionStatus && (
        <div style={{ fontSize: '0.7em', color: '#333', marginTop: '3px' }}>
          Status: {data.executionStatus}
          {data.executionDurationMs !== undefined && ` (${data.executionDurationMs}ms)`}
        </div>
      )}
      {/* Output Handle (Bottom) - adjust Position as needed */}
      <Handle type="source" position={Position.Bottom} id="output_main" />
      {/* You might add more handles if your component has multiple named input/output ports
          that you want to connect explicitly. The edge `sourceHandle` and `targetHandle`
          would then need to match these ids. */}
    </div>
  );
};

export default memo(MyCustomStepNode);
```

### 4. Accessing Data in `props.data`

The `data` prop passed to your custom node component contains rich information about the DSL element it represents. Key fields to utilize (referencing `cfv_consumer_directives.CustomNodeRendering` and `cfv_models.StepNodeData` / `BaseNodeData`):

*   `data.label: string`: A pre-computed label for the node, often the `step_id` or trigger type.
*   `data.stepId: string` (for step nodes): The `step_id` from the DSL.
*   `data.dslObject: any`: The original JavaScript object representing the DSL element (e.g., the step definition, the trigger definition). Useful for displaying specific configuration details or for advanced interactions.
*   `data.resolvedComponentFqn?: string`: The fully resolved FQN of the component type (e.g., `'StdLib:HttpCall'`).
*   `data.componentSchema?: cfv_models.ComponentSchema | null`: The JSON schema for the component, useful if you want to display information about its config, inputs, or outputs directly on the node.
*   `data.isNamedComponent?: boolean`: Indicates if the `component_ref` was to a `NamedComponentDefinition`.
*   `data.contextVarUsages?: string[]`: An array of context variable names identified as being used by this DSL element.
*   `data.error?: cfv_models.NodeError`: If the visualizer detected an error specific to this node (e.g., its configuration failed schema validation, a referenced component couldn't be resolved), this object will contain error details.
    *   `message: string`: The error message.
    *   `details?: any`: Additional error information.
    *   Use this to visually indicate errors on your node (e.g., a red border, an error icon, a tooltip with the message).

**Trace/Test Mode Specific Fields (`data.executionStatus`, etc.):**

When the visualizer is in `'trace'` or `'test_result'` mode and `traceData` (or `testResultData.trace`) is provided, the `data` prop for step nodes will be augmented with:

*   `data.executionStatus?: cfv_models.ExecutionStatusEnum`: The execution status of the step (`'SUCCESS'`, `'FAILURE'`, `'SKIPPED'`, `'RUNNING'`). Use this to style your nodes accordingly (e.g., green for success, red for failure).
*   `data.executionDurationMs?: number`: The duration of the step's execution in milliseconds.
*   `data.executionInputData?: any`: A snapshot of the input data the step received.
*   `data.executionOutputData?: any`: A snapshot of the output data (or error object) the step produced.

**`StdLib:SubFlowInvoker` Specific Fields (`data.invokedFlowFqn`):**

For nodes of type `'subFlowInvokerNode'` (or if you create a custom type for `StdLib:SubFlowInvoker`), the `data` prop will also include:

*   `data.invokedFlowFqn: string`: The FQN of the sub-flow being invoked. You can use this to create a button or link on your node that, when clicked, triggers navigation to that sub-flow's detail view (e.g., by calling `reactFlowInstance.setCenter()` or a custom navigation callback).

### 5. React Flow Handles

*   Use `<Handle />` components from React Flow to define connection points for edges.
*   `type="target"` for input connections.
*   `type="source"` for output connections.
*   `position` prop (`Position.Top`, `Position.Bottom`, `Position.Left`, `Position.Right`) determines where the handle appears on the node.
*   The `id` prop on a `Handle` is important if you have multiple input or output ports and want edges to connect to specific ones. The `sourceHandle` and `targetHandle` properties on edge objects must match these IDs. For simple nodes with one input and one output, default handle IDs often work.

### 6. Performance

*   Wrap your custom node components with `React.memo` to prevent unnecessary re-renders, especially if they are complex or the graph contains many nodes. React Flow relies on memoization for performance.

By implementing custom node components, you gain full control over the appearance and interactivity of your flow visualizations.

---

## Consumer Documentation: Code Examples - Basic Custom Node Component

This example provides a basic React/TypeScript code snippet for a custom step node (`MyCustomStepNode`) that consumes `props.data` (as defined conceptually in `cfv_models.StepNodeData`) and styles itself based on `data.executionStatus`.

**Source:** Based on the prompt and aligned with `cfv_models.StepNodeData` and `cfv_consumer_directives.CustomNodeRendering`.

---

```typescript
// MyCustomStepNode.tsx
// Make sure to install reactflow: npm install reactflow

import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from 'reactflow';

// Conceptual definition, import from where you define your app's version of these types
// based on cfv_models.dspec
interface NodeError {
  message: string;
  details?: any;
  isFatal?: boolean;
}

type ExecutionStatusEnum = 'SUCCESS' | 'FAILURE' | 'SKIPPED' | 'RUNNING';

export interface MyStepNodeData {
  label: string;
  stepId: string;
  dslObject?: any; // The original step definition from the DSL
  resolvedComponentFqn?: string;
  // componentSchema?: ComponentSchema; // Assuming ComponentSchema is defined elsewhere
  isNamedComponent?: boolean;
  contextVarUsages?: string[];
  error?: NodeError;

  // Trace/Test specific data
  executionStatus?: ExecutionStatusEnum;
  executionDurationMs?: number;
  // executionInputData?: any; // For simplicity, not displayed directly on node in this example
  // executionOutputData?: any; // For simplicity, not displayed directly on node in this example
}


// The component itself
const MyCustomStepNode: React.FC<NodeProps<MyStepNodeData>> = ({ data, selected, type }) => {
  // Base style
  const nodeStyle: React.CSSProperties = {
    padding: '10px 15px',
    border: '1px solid #aaa',
    borderRadius: '4px',
    background: '#f9f9f9',
    minWidth: '180px',
    textAlign: 'center',
    fontSize: '12px',
    boxShadow: '2px 2px 4px rgba(0,0,0,0.1)',
  };

  // Apply selection styling
  if (selected) {
    nodeStyle.borderColor = '#1a73e8'; // A distinct selection color
    nodeStyle.boxShadow = '0 0 8px rgba(26, 115, 232, 0.5)';
  }

  // Apply styling based on execution status
  let statusIndicator = '';
  if (data.executionStatus) {
    switch (data.executionStatus) {
      case 'SUCCESS':
        nodeStyle.background = '#edf7ed'; // Light green
        nodeStyle.borderColor = '#5cb85c'; // Green border
        statusIndicator = '✅ ';
        break;
      case 'FAILURE':
        nodeStyle.background = '#fdeded'; // Light red
        nodeStyle.borderColor = '#d9534f'; // Red border
        statusIndicator = '❌ ';
        break;
      case 'SKIPPED':
        nodeStyle.background = '#f7f7f7'; // Light gray
        nodeStyle.borderColor = '#ccc';   // Gray border
        statusIndicator = '⏭️ ';
        break;
      case 'RUNNING':
        nodeStyle.borderColor = '#4682b4'; // Steel blue for running
        // Potentially add a class for pulsing animation via CSS
        statusIndicator = '⏳ ';
        break;
    }
  }

  // Apply styling for node-specific errors (e.g., config validation)
  if (data.error && !data.executionStatus) { // Show config error if not overshadowed by execution status
    nodeStyle.borderColor = '#ffc107'; // Warning yellow
    nodeStyle.borderWidth = '2px';
    statusIndicator = '⚠️ ';
  }

  const shortType = data.resolvedComponentFqn
    ? data.resolvedComponentFqn.substring(data.resolvedComponentFqn.lastIndexOf(':') + 1)
    : 'Unknown';

  return (
    <div style={nodeStyle} title={data.error?.message || data.resolvedComponentFqn}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="a" // Example: generic input handle
        style={{ background: '#555' }}
      />

      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
        {statusIndicator}{data.label || data.stepId}
      </div>
      <div style={{ color: '#555', marginBottom: '3px' }}>
        ({shortType})
      </div>
      {data.isNamedComponent && <div style={{fontStyle: 'italic', fontSize: '0.9em', color: '#777'}}>(Named)</div>}

      {/* Display context var usage count as an example */}
      {data.contextVarUsages && data.contextVarUsages.length > 0 && (
        <div style={{ fontSize: '0.8em', color: '#007bff', marginTop: '4px' }}>
          Uses {data.contextVarUsages.length} context var(s)
        </div>
      )}
      
      {/* Display execution duration if available */}
      {data.executionDurationMs !== undefined && (
         <div style={{ fontSize: '0.8em', color: '#333', marginTop: '4px' }}>
           {data.executionDurationMs} ms
         </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="b" // Example: generic output handle
        style={{ background: '#555' }}
      />
    </div>
  );
};

// Memoize for performance, critical for React Flow
export default memo(MyCustomStepNode);

// To use this in your CascadeFlowVisualizer:
//
// import MyCustomStepNode from './MyCustomStepNode';
// const nodeTypes = {
//   'defaultStepNode': MyCustomStepNode,
//   // You might also want to map specific component FQNs if they need unique rendering:
//   // 'StdLib:HttpCall': MyCustomHttpNode,
// };
//
// <CascadeFlowVisualizer
//   customNodeTypes={nodeTypes}
//   // ... other props
// />

```

This example demonstrates:
1.  Receiving `NodeProps<MyStepNodeData>`.
2.  Basic styling.
3.  Applying different styles based on `selected` prop.
4.  Applying different styles and a status indicator based on `data.executionStatus`.
5.  Indicating a configuration error (`data.error`) if present and no execution status overrides it.
6.  Displaying the `data.label`, short component type, and an indicator if it's a named component.
7.  Displaying an example of derived information (context variable usage count and execution duration).
8.  Including basic React Flow `Handle` components for inputs and outputs.
9.  Using `React.memo` for performance.

Consumers would adapt and expand upon this to create node appearances that fit their application's specific needs and branding.