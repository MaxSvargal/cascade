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
  IModuleRegistry
} from '@/models/cfv_models_generated';

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
  const handleRequestModule = async (fqn: string) => {
    console.log('Requesting module:', fqn);
    // In a real app, this would fetch from an API
    return null;
  };

  const handleModuleLoadError = (fqn: string, error: Error) => {
    console.error('Module load error:', fqn, error);
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

    // Mode & Data
    mode: 'design',
    designData: {
      initialViewMode: 'flowDetail',
      initialFlowFqn: 'com.example.demo.SampleFlow'
    },

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
      <CascadeFlowVisualizer {...props} />
    </div>
  );
} 