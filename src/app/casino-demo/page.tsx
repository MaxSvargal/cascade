'use client';

import React, { useState, useCallback } from 'react';
import CascadeFlowVisualizer from '@/components/CascadeFlowVisualizer';
import { casinoPlatformModules, casinoPlatformComponentSchemas } from '@/examples/casinoPlatformExample';
import { 
  VisualizerModeEnum, 
  DesignViewModeEnum,
  RequestModuleResult,
  SaveModulePayload,
  ViewChangePayload,
  SelectedElement,
  FlowTestCase,
  TestRunResult,
  HistoricalFlowInstanceSummary,
  FlowRunListItemActions,
  InspectorPropertiesActions,
  IModuleRegistry,
  StepExecutionTrace,
  TestDefinitionActions
} from '@/models/cfv_models_generated';

// Custom node types for the casino demo
import StepNode from '@/components/nodes/StepNode';
import TriggerNode from '@/components/nodes/TriggerNode';
import SubFlowInvokerNode from '@/components/nodes/SubFlowInvokerNode';
import SystemFlowNode from '@/components/nodes/SystemFlowNode';
import SystemTriggerNode from '@/components/nodes/SystemTriggerNode';

// Custom edge types
import FlowEdge from '@/components/edges/FlowEdge';
import SystemEdge from '@/components/edges/SystemEdge';

const customNodeTypes = {
  stepNode: StepNode,
  triggerNode: TriggerNode,
  subFlowInvokerNode: SubFlowInvokerNode,
  systemFlowNode: SystemFlowNode,
  systemTriggerNode: SystemTriggerNode,
};

const customEdgeTypes = {
  flowEdge: FlowEdge,
  systemEdge: SystemEdge,
};

export default function CasinoDemoPage() {
  const [mode, setMode] = useState<VisualizerModeEnum>('design');
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  
  // Mock request module function
  const requestModule = useCallback(async (fqn: string): Promise<RequestModuleResult | null> => {
    console.log(`Requesting module: ${fqn}`);
    // In a real app, this would fetch from a server
    const module = casinoPlatformModules.find(m => m.fqn === fqn);
    if (module) {
      return {
        fqn: module.fqn,
        content: module.content
      };
    }
    return null;
  }, []);

  // Mock save module function
  const onSaveModule = useCallback(async (payload: SaveModulePayload): Promise<void> => {
    console.log('Saving module:', payload);
    // In a real app, this would save to a server
  }, []);

  // Parse context variables function
  const parseContextVariables = useCallback((value: string): string[] => {
    const matches = value.match(/\{\{context\.([^}]+)\}\}/g);
    return matches ? matches.map(match => match.replace(/\{\{context\.|\}\}/g, '')) : [];
  }, []);

  // Handle view changes - simplified to just log, no state updates
  const onViewChange = useCallback((view: ViewChangePayload) => {
    console.log('View changed:', view);
    // Don't update state that affects designData to prevent infinite loops
  }, []);

  // Handle element selection
  const onElementSelect = useCallback((element: SelectedElement | null) => {
    console.log('Element selected:', element);
    setSelectedElement(element);
  }, []);

  // Handle flow navigation from system overview - simplified
  const handleFlowNavigation = useCallback((flowFqn: string) => {
    console.log('Navigating to flow:', flowFqn);
    // Let the CascadeFlowVisualizer handle navigation internally
  }, []);

  // Mock test case runner
  const onRunTestCase = useCallback(async (testCase: FlowTestCase): Promise<TestRunResult | null> => {
    console.log('Running test case:', testCase);
    // Mock test result
    return {
      testCase,
      passed: true,
      assertionResults: testCase.assertions.map(assertion => ({
        ...assertion,
        actualValue: assertion.expectedValue,
        passed: true,
        message: 'Test passed'
      }))
    };
  }, []);

  // Mock trace list fetcher
  const fetchTraceList = useCallback(async (): Promise<HistoricalFlowInstanceSummary[]> => {
    return [
      {
        id: 'trace-001',
        flowFqn: 'com.casino.core.PlaceBetFlow',
        startTime: '2024-01-15T10:30:00Z',
        status: 'COMPLETED'
      },
      {
        id: 'trace-002',
        flowFqn: 'com.casino.users.DepositFlow',
        startTime: '2024-01-15T10:25:00Z',
        status: 'COMPLETED'
      }
    ];
  }, []);

  // Inspector tab renderers
  const renderInspectorPropertiesTab = useCallback((
    selectedElement: SelectedElement | null,
    actions: InspectorPropertiesActions,
    moduleRegistry: IModuleRegistry
  ) => {
    if (!selectedElement) {
      return <div className="p-4 text-gray-500">No element selected</div>;
    }

    return (
      <div className="p-4 space-y-4">
        <h3 className="font-bold text-lg">Properties</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium">Element ID:</label>
            <div className="text-sm text-gray-600">{selectedElement.id}</div>
          </div>
          <div>
            <label className="block text-sm font-medium">Type:</label>
            <div className="text-sm text-gray-600">{selectedElement.sourceType}</div>
          </div>
          {selectedElement.data?.label && (
            <div>
              <label className="block text-sm font-medium">Label:</label>
              <div className="text-sm text-gray-600">{selectedElement.data.label}</div>
            </div>
          )}
          {selectedElement.data?.resolvedComponentFqn && (
            <div>
              <label className="block text-sm font-medium">Component:</label>
              <div className="text-sm text-gray-600 font-mono">{selectedElement.data.resolvedComponentFqn}</div>
            </div>
          )}
        </div>
      </div>
    );
  }, []);

  const renderInspectorSourceTab = useCallback((
    selectedElement: SelectedElement | null,
    moduleRegistry: IModuleRegistry
  ) => {
    if (!selectedElement?.data?.dslObject) {
      return <div className="p-4 text-gray-500">No source available</div>;
    }

    return (
      <div className="p-4">
        <h3 className="font-bold text-lg mb-4">Source</h3>
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
          {JSON.stringify(selectedElement.data.dslObject, null, 2)}
        </pre>
      </div>
    );
  }, []);

  const renderInspectorDataIOTab = useCallback((
    selectedStepTrace: StepExecutionTrace | null,
    moduleRegistry: IModuleRegistry
  ) => {
    if (!selectedStepTrace) {
      return <div className="p-4 text-gray-500">No trace data available</div>;
    }

    return (
      <div className="p-4 space-y-4">
        <h3 className="font-bold text-lg">Data I/O</h3>
        <div>
          <h4 className="font-medium">Input Data:</h4>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(selectedStepTrace.inputData, null, 2)}
          </pre>
        </div>
        <div>
          <h4 className="font-medium">Output Data:</h4>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(selectedStepTrace.outputData, null, 2)}
          </pre>
        </div>
      </div>
    );
  }, []);

  const renderInspectorTestDefinitionTab = useCallback((
    currentFlowFqn: string | null,
    actions: TestDefinitionActions,
    moduleRegistry: IModuleRegistry
  ) => {
    return (
      <div className="p-4 space-y-4">
        <h3 className="font-bold text-lg">Test Definition</h3>
        {currentFlowFqn ? (
          <div>
            <p className="text-sm text-gray-600 mb-4">Define tests for: {currentFlowFqn}</p>
            <button 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => {
                const testCase: FlowTestCase = {
                  flowFqn: currentFlowFqn,
                  description: 'Sample test case',
                  triggerInput: { userId: 'test-user', amount: 100 },
                  assertions: [
                    {
                      targetPath: 'status',
                      expectedValue: 'SUCCESS',
                      comparison: 'equals'
                    }
                  ]
                };
                actions.runTestCase(testCase);
              }}
            >
              Run Sample Test
            </button>
          </div>
        ) : (
          <div className="text-gray-500">Select a flow to define tests</div>
        )}
      </div>
    );
  }, []);

  const renderFlowRunListItem = useCallback((
    summary: HistoricalFlowInstanceSummary,
    actions: FlowRunListItemActions,
    isSelected: boolean
  ) => {
    return (
      <div 
        className={`p-3 border rounded cursor-pointer ${isSelected ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-50'}`}
        onClick={() => actions.selectTrace(summary.id)}
      >
        <div className="font-medium">{summary.flowFqn}</div>
        <div className="text-sm text-gray-600">{summary.startTime}</div>
        <div className={`text-sm ${summary.status === 'COMPLETED' ? 'text-green-600' : 'text-red-600'}`}>
          {summary.status}
        </div>
      </div>
    );
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Casino Platform Demo</h1>
          <p className="text-gray-600 mt-2">
            Production-ready casino flows showcasing complex DSL features: multiple modules, forks, user triggers, and stdlib components
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Flow Visualizer</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('design')}
                  className={`px-3 py-1 rounded text-sm ${mode === 'design' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  Design
                </button>
                <button
                  onClick={() => setMode('trace')}
                  className={`px-3 py-1 rounded text-sm ${mode === 'trace' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  Trace
                </button>
              </div>
            </div>
          </div>

          <div style={{ height: '800px' }}>
            <CascadeFlowVisualizer
              mode={mode}
              initialModules={casinoPlatformModules}
              componentSchemas={casinoPlatformComponentSchemas}
              requestModule={requestModule}
              parseContextVariables={parseContextVariables}
              onSaveModule={onSaveModule}
              onViewChange={onViewChange}
              onElementSelect={onElementSelect}
              onRunTestCase={onRunTestCase}
              fetchTraceList={fetchTraceList}
              customNodeTypes={customNodeTypes}
              customEdgeTypes={customEdgeTypes}
              renderInspectorPropertiesTab={renderInspectorPropertiesTab}
              renderInspectorSourceTab={renderInspectorSourceTab}
              renderInspectorDataIOTab={renderInspectorDataIOTab}
              renderInspectorTestDefinitionTab={renderInspectorTestDefinitionTab}
              renderFlowRunListItem={renderFlowRunListItem}
              designData={{
                initialViewMode: 'systemOverview',
                initialFlowFqn: undefined
              }}
              isEditingEnabled={true}
              elkOptions={{
                algorithm: 'layered',
                direction: 'RIGHT',
                spacing: {
                  nodeNode: 100,
                  edgeNode: 30,
                  layerSpacing: 150
                },
                nodeSize: {
                  calculateFromContent: true,
                  minWidth: 200,
                  maxWidth: 320
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 