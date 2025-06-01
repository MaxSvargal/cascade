'use client';

import React from 'react';
import CascadeFlowVisualizer from '@/components/CascadeFlowVisualizer';
import StepNode from '@/components/nodes/StepNode';
import TriggerNode from '@/components/nodes/TriggerNode';
import SubFlowInvokerNode from '@/components/nodes/SubFlowInvokerNode';
import SystemFlowNode from '@/components/nodes/SystemFlowNode';
import SystemTriggerNode from '@/components/nodes/SystemTriggerNode';
import FlowEdge from '@/components/edges/FlowEdge';
import SystemEdge from '@/components/edges/SystemEdge';
import { 
  CascadeFlowVisualizerProps, 
  DslModuleInput, 
  ComponentSchema,
  SelectedElement,
  InspectorPropertiesActions,
  IModuleRegistry,
  FlowExecutionTrace,
  SaveModulePayload,
  FlowTestCase,
  TestRunResult
} from '@/models/cfv_models_generated';
import { generateTestCaseTemplates, createTestCaseFromTemplate } from '@/services/testCaseService';

// Sample DSL module data
const sampleModules: DslModuleInput[] = [
  {
    fqn: 'com.example.demo',
    content: `
dsl_version: "1.1"
namespace: com.example.demo

definitions:
  components:
    - name: HttpProcessor
      type: StdLib:HttpCall
      description: "Processes HTTP requests"

flows:
  - name: SampleFlow
    trigger:
      type: HttpTrigger
      config:
        path: "/api/process"
    steps:
      - step_id: fetch_data
        component_ref: HttpProcessor
        config:
          url: "https://api.example.com/data"
          method: GET
        run_after: []
      - step_id: process_data
        component_ref: StdLib:DataTransform
        config:
          transformation: "uppercase"
        inputs_map:
          input: "steps.fetch_data.outputs.response"
        run_after: ["fetch_data"]
      - step_id: invoke_subflow
        component_ref: StdLib:SubFlowInvoker
        config:
          flow_fqn: "com.example.demo.HelperFlow"
        inputs_map:
          data: "steps.process_data.outputs.result"
        run_after: ["process_data"]
      - step_id: save_result
        component_ref: StdLib:FileWrite
        config:
          path: "/tmp/result.json"
        inputs_map:
          data: "steps.invoke_subflow.outputs.result"
        run_after: ["invoke_subflow"]
  - name: HelperFlow
    trigger:
      type: ManualTrigger
    steps:
      - step_id: helper_step
        component_ref: StdLib:DataTransform
        config:
          transformation: "lowercase"
        run_after: []
    `
  }
];

// Sample component schemas
const sampleComponentSchemas: Record<string, ComponentSchema> = {
  'StdLib:HttpCall': {
    fqn: 'StdLib:HttpCall',
    configSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'] }
      }
    }
  },
  'StdLib:DataTransform': {
    fqn: 'StdLib:DataTransform',
    configSchema: {
      type: 'object',
      properties: {
        transformation: { type: 'string' }
      }
    }
  },
  'StdLib:FileWrite': {
    fqn: 'StdLib:FileWrite',
    configSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' }
      }
    }
  },
  'StdLib:SubFlowInvoker': {
    fqn: 'StdLib:SubFlowInvoker',
    configSchema: {
      type: 'object',
      properties: {
        flow_fqn: { type: 'string' }
      }
    }
  }
};

// Sample trace data for demonstration
const sampleTraceData: FlowExecutionTrace = {
  traceId: 'trace-123',
  flowFqn: 'com.example.demo.SampleFlow',
  instanceId: 'instance-456',
  status: 'COMPLETED',
  startTime: '2024-01-15T10:00:00Z',
  endTime: '2024-01-15T10:00:05Z',
  durationMs: 5000,
  triggerData: {
    method: 'POST',
    path: '/api/process',
    body: { input: 'test data' }
  },
  initialContext: {},
  finalContext: { result: 'processed' },
  steps: [
    {
      stepId: 'fetch_data',
      status: 'SUCCESS',
      startTime: '2024-01-15T10:00:00Z',
      endTime: '2024-01-15T10:00:02Z',
      durationMs: 2000,
      inputData: { url: 'https://api.example.com/data' },
      outputData: { response: { data: 'fetched data' }, statusCode: 200 }
    },
    {
      stepId: 'process_data',
      status: 'SUCCESS',
      startTime: '2024-01-15T10:00:02Z',
      endTime: '2024-01-15T10:00:03Z',
      durationMs: 1000,
      inputData: { input: 'fetched data' },
      outputData: { result: 'FETCHED DATA' }
    },
    {
      stepId: 'invoke_subflow',
      status: 'SUCCESS',
      startTime: '2024-01-15T10:00:03Z',
      endTime: '2024-01-15T10:00:04Z',
      durationMs: 1000,
      inputData: { data: 'FETCHED DATA' },
      outputData: { result: 'processed by subflow' }
    },
    {
      stepId: 'save_result',
      status: 'SUCCESS',
      startTime: '2024-01-15T10:00:04Z',
      endTime: '2024-01-15T10:00:05Z',
      durationMs: 1000,
      inputData: { data: 'processed by subflow', path: '/tmp/result.json' },
      outputData: { success: true, bytesWritten: 256 }
    }
  ]
};

// Custom node types
const nodeTypes = {
  stepNode: StepNode,
  triggerNode: TriggerNode,
  subFlowInvokerNode: SubFlowInvokerNode,
  systemFlowNode: SystemFlowNode,
  systemTriggerNode: SystemTriggerNode
};

// Custom edge types
const edgeTypes = {
  flowEdge: FlowEdge,
  systemEdge: SystemEdge
};

// Sample inspector tab renderers
const renderInspectorPropertiesTab = (
  selectedElement: SelectedElement | null,
  actions: InspectorPropertiesActions,
  moduleRegistry: IModuleRegistry
) => {
  if (!selectedElement) return <div>No element selected</div>;
  
  return (
    <div>
      <h4>Properties</h4>
      <div style={{ marginBottom: '8px' }}>
        <strong>ID:</strong> {selectedElement.id}
      </div>
      <div style={{ marginBottom: '8px' }}>
        <strong>Type:</strong> {selectedElement.sourceType}
      </div>
      {selectedElement.data && (
        <div>
          <strong>Data:</strong>
          <pre style={{ fontSize: '10px', backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
            {JSON.stringify(selectedElement.data, null, 2)}
          </pre>
        </div>
      )}
      <button 
        onClick={() => actions.requestSave({ test: 'value' }, ['config', 'test'])}
        style={{ marginTop: '8px', padding: '4px 8px' }}
      >
        Test Save
      </button>
    </div>
  );
};

const renderInspectorSourceTab = (
  selectedElement: SelectedElement | null,
  moduleRegistry: IModuleRegistry
) => {
  if (!selectedElement) return <div>No element selected</div>;
  
  return (
    <div>
      <h4>Source</h4>
      <pre style={{ fontSize: '10px', backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
        {selectedElement.data?.dslObject ? 
          JSON.stringify(selectedElement.data.dslObject, null, 2) : 
          'No DSL object available'
        }
      </pre>
    </div>
  );
};

export default function HomePage() {
  const [currentMode, setCurrentMode] = React.useState<'design' | 'trace' | 'test_result'>('design');
  const [isEditingEnabled, setIsEditingEnabled] = React.useState(true);

  const handleRequestModule = async (fqn: string) => {
    console.log('Requesting module:', fqn);
    // In a real app, this would fetch from an API
    return null;
  };

  const handleModuleLoadError = (fqn: string, error: Error) => {
    console.error('Module load error:', fqn, error);
  };

  const handleSaveModule = async (payload: SaveModulePayload): Promise<void | boolean> => {
    console.log('Save module requested:', payload);
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Module saved successfully');
    return true;
  };

  const handleRunTestCase = async (testCase: FlowTestCase): Promise<TestRunResult | null> => {
    console.log('Running test case:', testCase);
    
    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return mock test result
    return {
      testCase,
      passed: true,
      trace: sampleTraceData,
      assertionResults: [
        {
          targetPath: 'status',
          expectedValue: 'COMPLETED',
          comparison: 'equals',
          actualValue: 'COMPLETED',
          passed: true,
          message: 'Assertion passed'
        }
      ]
    };
  };

  const parseContextVariables = (value: string): string[] => {
    const matches = value.match(/\$\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(2, -1)) : [];
  };

  const handleViewChange = (view: any) => {
    console.log('View changed:', view);
  };

  const handleElementSelect = (element: SelectedElement | null) => {
    console.log('Element selected:', element);
  };

  const props: CascadeFlowVisualizerProps = {
    // Core Data & Loading
    initialModules: sampleModules,
    requestModule: handleRequestModule,
    componentSchemas: sampleComponentSchemas,
    onModuleLoadError: handleModuleLoadError,
    parseContextVariables,

    // Editing
    isEditingEnabled,
    onSaveModule: handleSaveModule,

    // Mode & Data
    mode: currentMode,
    designData: {
      initialViewMode: 'flowDetail',
      initialFlowFqn: 'com.example.demo.SampleFlow'
    },
    traceData: currentMode === 'trace' ? sampleTraceData : undefined,

    // Testing
    onRunTestCase: handleRunTestCase,

    // Callbacks
    onViewChange: handleViewChange,
    onElementSelect: handleElementSelect,

    // Customization
    customNodeTypes: nodeTypes,
    customEdgeTypes: edgeTypes,
    renderInspectorPropertiesTab,
    renderInspectorSourceTab,

    // Styling
    style: { width: '100vw', height: '100vh' }
  };

  return (
    <div>
      {/* Demo Controls */}
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        zIndex: 1000,
        backgroundColor: 'white',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        <label style={{ fontSize: '12px', fontWeight: '500' }}>Mode:</label>
        <select 
          value={currentMode} 
          onChange={(e) => setCurrentMode(e.target.value as any)}
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          <option value="design">Design</option>
          <option value="trace">Trace</option>
          <option value="test_result">Test Result</option>
        </select>
        
        <label style={{ fontSize: '12px', marginLeft: '12px' }}>
          <input 
            type="checkbox" 
            checked={isEditingEnabled}
            onChange={(e) => setIsEditingEnabled(e.target.checked)}
            style={{ marginRight: '4px' }}
          />
          Editing
        </label>
      </div>

      <CascadeFlowVisualizer {...props} />
    </div>
  );
} 