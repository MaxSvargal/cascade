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
import { casinoPlatformModules, casinoPlatformComponentSchemas } from '@/examples/casinoPlatformExample';

// Sample DSL module data - Using Casino Platform Example
const sampleModules: DslModuleInput[] = casinoPlatformModules;

// Sample component schemas - Using Casino Platform Schemas
const sampleComponentSchemas: Record<string, ComponentSchema> = casinoPlatformComponentSchemas;

// Sample trace data for demonstration - Casino Platform Flow
const sampleTraceData: FlowExecutionTrace = {
  traceId: 'trace-casino-123',
  flowFqn: 'com.casino.core.UserOnboardingFlow',
  instanceId: 'instance-casino-456',
  status: 'COMPLETED',
  startTime: '2024-01-15T10:00:00Z',
  endTime: '2024-01-15T10:00:15Z',
  durationMs: 15000,
  triggerData: {
    method: 'POST',
    path: '/api/users/onboard',
    body: { 
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      country: 'US'
    }
  },
  initialContext: {},
  finalContext: { userId: 'user-123', kycStatus: 'verified' },
  steps: [
    {
      stepId: 'validate-registration-data',
      status: 'SUCCESS',
      startTime: '2024-01-15T10:00:00Z',
      endTime: '2024-01-15T10:00:02Z',
      durationMs: 2000,
      inputData: { 
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe'
      },
      outputData: { validData: { email: 'user@example.com', firstName: 'John', lastName: 'Doe' } }
    },
    {
      stepId: 'geo-compliance-check',
      status: 'SUCCESS',
      startTime: '2024-01-15T10:00:02Z',
      endTime: '2024-01-15T10:00:05Z',
      durationMs: 3000,
      inputData: { userData: { country: 'US' } },
      outputData: { 
        'jurisdiction-check': { allowed: true },
        'sanctions-check': { flagged: false },
        'age-verification': { isEligible: true, age: 34 }
      }
    },
    {
      stepId: 'evaluate-compliance-results',
      status: 'SUCCESS',
      startTime: '2024-01-15T10:00:05Z',
      endTime: '2024-01-15T10:00:06Z',
      durationMs: 1000,
      inputData: { jurisdictionAllowed: true, onSanctionsList: false, ageEligible: true },
      outputData: { 
        canProceed: true,
        complianceFlags: { jurisdiction: true, sanctions: true, age: true },
        riskLevel: 'low'
      }
    },
    {
      stepId: 'initiate-kyc-process',
      status: 'SUCCESS',
      startTime: '2024-01-15T10:00:06Z',
      endTime: '2024-01-15T10:00:10Z',
      durationMs: 4000,
      inputData: { userData: { email: 'user@example.com' }, complianceData: { riskLevel: 'low' } },
      outputData: { status: 'verified', sessionId: 'kyc-session-123' }
    },
    {
      stepId: 'create-user-account',
      status: 'SUCCESS',
      startTime: '2024-01-15T10:00:10Z',
      endTime: '2024-01-15T10:00:12Z',
      durationMs: 2000,
      inputData: { userData: { email: 'user@example.com' }, kycStatus: 'verified' },
      outputData: { userId: 'user-123', accountCreated: true }
    },
    {
      stepId: 'setup-responsible-gambling',
      status: 'SUCCESS',
      startTime: '2024-01-15T10:00:12Z',
      endTime: '2024-01-15T10:00:14Z',
      durationMs: 2000,
      inputData: { userId: 'user-123', userTier: 'standard' },
      outputData: { limitsConfigured: true, dailyLimit: 1000 }
    },
    {
      stepId: 'send-welcome-communication',
      status: 'SUCCESS',
      startTime: '2024-01-15T10:00:14Z',
      endTime: '2024-01-15T10:00:15Z',
      durationMs: 1000,
      inputData: { userData: { userId: 'user-123', email: 'user@example.com' } },
      outputData: { 
        'welcome-email': { sent: true, messageId: 'email-123' },
        'welcome-sms': { sent: true, messageId: 'sms-123' },
        'analytics-event': { tracked: true, eventId: 'event-123' }
      }
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
  currentFlowFqn: string | null,
  selectedElement: SelectedElement | null,
  moduleRegistry: IModuleRegistry
) => {
  if (!selectedElement) return <div>No element selected</div>;
  
  return (
    <div>
      <h4>Source</h4>
      <div style={{ marginBottom: '8px' }}>
        <strong>Flow:</strong> {currentFlowFqn || 'No flow selected'}
      </div>
      <div style={{ marginBottom: '8px' }}>
        <strong>Selected Element:</strong> {selectedElement.id}
      </div>
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
  const [mode, setMode] = React.useState<'design' | 'trace' | 'test_result'>('design');

  const handleRequestModule = async (fqn: string) => {
    console.log('Requesting module:', fqn);
    return null;
  };

  const handleModuleLoadError = (fqn: string, error: Error) => {
    console.error('Module load error:', fqn, error);
  };

  const handleSaveModule = async (payload: SaveModulePayload): Promise<void | boolean> => {
    console.log('Saving module:', payload);
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  };

  const handleRunTestCase = async (testCase: FlowTestCase): Promise<TestRunResult | null> => {
    console.log('Running test case:', testCase);
    
    // Generate test templates for the flow
    const templates = generateTestCaseTemplates(testCase.flowFqn, {
      getFlowDefinition: () => null,
      getAllLoadedModules: () => [],
      getLoadedModule: () => null,
      resolveComponentTypeInfo: () => null,
      getComponentSchema: () => null,
      getNamedComponentDefinition: () => null,
      getContextDefinition: () => null
    });
    
    // Mock test result
    return {
      testCase,
      passed: true,
      assertionResults: testCase.assertions.map(assertion => ({
        ...assertion,
        actualValue: assertion.expectedValue,
        passed: true,
        message: 'Test passed successfully'
      }))
    };
  };

  const parseContextVariables = (value: string): string[] => {
    return [];
  };

  const handleViewChange = (view: any) => {
    console.log('View changed:', view);
  };

  const handleElementSelect = (element: SelectedElement | null) => {
    console.log('Element selected:', element);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <div style={{ 
        backgroundColor: '#1976D2', 
        color: 'white', 
        padding: '16px 24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            Cascade Flow Visualizer
          </h1>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <a 
              href="/casino-demo" 
              style={{ 
                color: 'white', 
                textDecoration: 'none',
                padding: '8px 16px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '6px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
            >
              🎰 Casino Platform Demo
            </a>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setMode('design')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: mode === 'design' ? 'white' : 'rgba(255,255,255,0.2)',
                  color: mode === 'design' ? '#1976D2' : 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Design
              </button>
              <button
                onClick={() => setMode('trace')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: mode === 'trace' ? 'white' : 'rgba(255,255,255,0.2)',
                  color: mode === 'trace' ? '#1976D2' : 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Trace
              </button>
            </div>
          </div>
        </div>
        <p style={{ margin: '8px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
          Enhanced with left-to-right layout, improved node styling, and system overview navigation
        </p>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        <CascadeFlowVisualizer
          initialModules={sampleModules}
          componentSchemas={sampleComponentSchemas}
          mode="trace"
          traceData={sampleTraceData}
          designData={{
            initialFlowFqn: 'com.casino.core.UserOnboardingFlow',
            initialViewMode: 'flowDetail'
          }}
          requestModule={handleRequestModule}
          onModuleLoadError={handleModuleLoadError}
          onSaveModule={handleSaveModule}
          onRunTestCase={handleRunTestCase}
          parseContextVariables={parseContextVariables}
          onViewChange={handleViewChange}
          onElementSelect={handleElementSelect}
          customNodeTypes={nodeTypes}
          customEdgeTypes={edgeTypes}
          renderInspectorPropertiesTab={renderInspectorPropertiesTab}
          renderInspectorSourceTab={renderInspectorSourceTab}
          isEditingEnabled={true}
          elkOptions={{
            algorithm: 'layered',
            direction: 'RIGHT'
          }}
        />
      </div>
    </div>
  );
} 