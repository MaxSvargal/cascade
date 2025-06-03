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
  TestRunResult,
  UnifiedDebugTestActions,
  AssertionComparisonEnum,
  ExecutionStatusEnum
} from '@/models/cfv_models_generated';
import { generateTestCaseTemplates, createTestCaseFromTemplate } from '@/services/testCaseService';
import { casinoPlatformModules, casinoPlatformComponentSchemas } from '@/examples/casinoPlatformRefinedExample';

// Import dependencies for enhanced inspector tabs
import hljs from 'highlight.js/lib/core';
import yaml from 'highlight.js/lib/languages/yaml';
import 'highlight.js/styles/github.css';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { RJSFSchema } from '@rjsf/utils';
import { z } from 'zod';
import { stringify as yamlStringify } from 'yaml';
import ReactJson from 'react-json-view';

// Register YAML language for highlight.js
hljs.registerLanguage('yaml', yaml);

// Sample DSL module data - Using Casino Platform Refined Example
const sampleModules: DslModuleInput[] = casinoPlatformModules;

// Sample component schemas - Using Casino Platform Refined Schemas
const sampleComponentSchemas: Record<string, ComponentSchema> = {
  ...Object.fromEntries(
    Object.entries(casinoPlatformComponentSchemas).map(([key, schema]) => {
      // Type guard to check if this is a ComponentSchema
      if (typeof schema === 'object' && schema !== null && 'fqn' in schema) {
        return [
          key,
          {
            ...schema,
            configSchema: (schema as any).configSchema === null ? undefined : (schema as any).configSchema
          }
        ];
      }
      return [key, schema];
    })
  ),
  // Fix the StdLib:Manual schema to have undefined instead of null
  'StdLib:Manual': {
    fqn: 'StdLib:Manual',
    // TODO: Use null instead because undefined is not serializable
    configSchema: undefined, // Changed from null to undefined
    outputSchema: {
      type: 'object',
      properties: {
        initialData: { type: 'object', description: 'The data passed when the flow was manually triggered.' }
      },
      required: ['initialData']
    }
  }
};

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
      componentFqn: 'StdLib:JsonSchemaValidator',
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
      componentFqn: 'StdLib:Fork',
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
      componentFqn: 'StdLib:MapData',
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
      componentFqn: 'StdLib:SubFlowInvoker',
      status: 'SUCCESS',
      startTime: '2024-01-15T10:00:06Z',
      endTime: '2024-01-15T10:00:10Z',
      durationMs: 4000,
      inputData: { userData: { email: 'user@example.com' }, complianceData: { riskLevel: 'low' } },
      outputData: { status: 'verified', sessionId: 'kyc-session-123' }
    },
    {
      stepId: 'create-user-account',
      componentFqn: 'StdLib:HttpCall',
      status: 'SUCCESS',
      startTime: '2024-01-15T10:00:10Z',
      endTime: '2024-01-15T10:00:12Z',
      durationMs: 2000,
      inputData: { userData: { email: 'user@example.com' }, kycStatus: 'verified' },
      outputData: { userId: 'user-123', accountCreated: true }
    },
    {
      stepId: 'setup-responsible-gambling',
      componentFqn: 'StdLib:SubFlowInvoker',
      status: 'SUCCESS',
      startTime: '2024-01-15T10:00:12Z',
      endTime: '2024-01-15T10:00:14Z',
      durationMs: 2000,
      inputData: { userId: 'user-123', userTier: 'standard' },
      outputData: { limitsConfigured: true, dailyLimit: 1000 }
    },
    {
      stepId: 'send-welcome-communication',
      componentFqn: 'StdLib:Fork',
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

// Custom node types - moved outside component to prevent recreation
const nodeTypes = {
  stepNode: StepNode,
  triggerNode: TriggerNode,
  subFlowInvokerNode: SubFlowInvokerNode,
  systemFlowNode: SystemFlowNode,
  systemTriggerNode: SystemTriggerNode
};

// Custom edge types - moved outside component to prevent recreation
const edgeTypes = {
  flowEdge: FlowEdge,
  systemEdge: SystemEdge
};

// Enhanced inspector tab renderers as React components
const InspectorSourceTab: React.FC<{
  currentFlowFqn: string | null;
  selectedElement: SelectedElement | null;
  moduleRegistry: IModuleRegistry;
}> = ({ currentFlowFqn, selectedElement, moduleRegistry }) => {
  if (!selectedElement) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
        <p>No element selected</p>
        <p style={{ fontSize: '14px' }}>Select a node or edge to view its source</p>
      </div>
    );
  }

  // Get the module containing the selected element
  const moduleFqn = selectedElement.moduleFqn || currentFlowFqn?.split('.').slice(0, -1).join('.');
  const module = moduleFqn ? moduleRegistry.getLoadedModule(moduleFqn) : null;
  
  if (!module || !module.rawContent) {
    return (
      <div style={{ padding: '16px' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Source</h4>
        <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
          <p style={{ margin: 0, color: '#666' }}>Module source not available</p>
        </div>
      </div>
    );
  }

  // Highlight the YAML content
  const highlightedYaml = hljs.highlight(module.rawContent, { language: 'yaml' }).value;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(module.rawContent);
  };

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Source</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={copyToClipboard}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: '1px solid #d0d7de',
              borderRadius: '4px',
              backgroundColor: '#f6f8fa',
              cursor: 'pointer'
            }}
          >
            Copy
          </button>
        </div>
      </div>
      
      <div style={{ marginBottom: '12px', fontSize: '14px', color: '#656d76' }}>
        <strong>Module:</strong> {moduleFqn}
        {selectedElement.id && (
          <>
            <br />
            <strong>Selected:</strong> {selectedElement.id} ({selectedElement.sourceType})
          </>
        )}
      </div>

      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        border: '1px solid #d0d7de', 
        borderRadius: '6px',
        backgroundColor: '#f6f8fa'
      }}>
        <pre style={{ 
          margin: 0, 
          padding: '16px', 
          fontSize: '12px', 
          lineHeight: '1.45',
          fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
          overflow: 'auto'
        }}>
          <code 
            dangerouslySetInnerHTML={{ __html: highlightedYaml }}
            style={{ whiteSpace: 'pre' }}
          />
        </pre>
      </div>
    </div>
  );
};

const InspectorPropertiesTab: React.FC<{
  selectedElement: SelectedElement | null;
  actions: InspectorPropertiesActions;
  moduleRegistry: IModuleRegistry;
}> = ({ selectedElement, actions, moduleRegistry }) => {
  // All hooks at the top of the component
  const [formData, setFormData] = React.useState<any>({});
  const [showYamlPreview, setShowYamlPreview] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Get component data
  const componentSchema = selectedElement?.data?.componentSchema;
  const resolvedComponentFqn = selectedElement?.data?.resolvedComponentFqn;
  
  // Memoize currentConfig to prevent infinite re-renders
  const currentConfig = React.useMemo(() => {
    return selectedElement?.data?.dslObject?.config || {};
  }, [selectedElement?.data?.dslObject?.config]);

  // Update form data when selected element changes
  React.useEffect(() => {
    if (selectedElement && selectedElement.sourceType === 'flowNode') {
      setFormData(currentConfig);
    }
  }, [selectedElement?.id, currentConfig]);

  // Early returns after hooks
  if (!selectedElement || selectedElement.sourceType !== 'flowNode') {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
        <p>No component selected</p>
        <p style={{ fontSize: '14px' }}>Select a component node to edit its properties</p>
      </div>
    );
  }

  if (!componentSchema?.configSchema) {
    return (
      <div style={{ padding: '16px' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Properties</h4>
        <div style={{ padding: '12px', backgroundColor: '#fff3cd', borderRadius: '6px', border: '1px solid #ffeaa7' }}>
          <p style={{ margin: 0, color: '#856404' }}>
            No schema available for component: {resolvedComponentFqn || 'Unknown'}
          </p>
        </div>
        
        {Object.keys(currentConfig).length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Current Configuration</h5>
            <pre style={{
              padding: '12px',
              backgroundColor: '#f6f8fa',
              border: '1px solid #d0d7de',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
              overflow: 'auto'
            }}>
              {JSON.stringify(currentConfig, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  const handleFormChange = (data: any) => {
    setFormData(data.formData);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await actions.requestSave(formData, ['config']);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const yamlPreview = showYamlPreview ? yamlStringify(formData, { indent: 2 }) : '';

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Properties</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowYamlPreview(!showYamlPreview)}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: '1px solid #d0d7de',
              borderRadius: '4px',
              backgroundColor: showYamlPreview ? '#0969da' : '#f6f8fa',
              color: showYamlPreview ? 'white' : 'black',
              cursor: 'pointer'
            }}
          >
            {showYamlPreview ? 'Hide' : 'Show'} YAML
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: isLoading ? '#94a3b8' : '#0969da',
              color: 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '12px', fontSize: '14px', color: '#656d76' }}>
        <strong>Component:</strong> {resolvedComponentFqn}
        <br />
        <strong>Step ID:</strong> {selectedElement.id}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {showYamlPreview && (
          <div style={{ marginBottom: '16px' }}>
            <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>YAML Preview</h5>
            <pre style={{
              padding: '12px',
              backgroundColor: '#f6f8fa',
              border: '1px solid #d0d7de',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              {yamlPreview}
            </pre>
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>Configuration Form</h5>
          <Form
            schema={componentSchema.configSchema as RJSFSchema}
            formData={formData}
            onChange={handleFormChange}
            validator={validator}
            uiSchema={{
              "ui:submitButtonOptions": {
                "norender": true
              }
            }}
          />
        </div>

        {selectedElement.data?.contextVarUsages && selectedElement.data.contextVarUsages.length > 0 && (
          <div>
            <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Context Variables Used</h5>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {selectedElement.data.contextVarUsages.map((varName: string, index: number) => (
                <span
                  key={index}
                  style={{
                    padding: '2px 6px',
                    fontSize: '11px',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    borderRadius: '3px',
                    fontFamily: 'monospace'
                  }}
                >
                  {varName}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InspectorDebugTestTab: React.FC<{
  currentFlowFqn: string | null;
  selectedElement: SelectedElement | null;
  actions: UnifiedDebugTestActions;
  moduleRegistry: IModuleRegistry;
}> = ({ currentFlowFqn, selectedElement, actions, moduleRegistry }) => {
  const [activeSection, setActiveSection] = React.useState<'debug' | 'test'>('debug');
  const [inputData, setInputData] = React.useState<string>('{}');
  const [executionResults, setExecutionResults] = React.useState<any>(null);
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [dataLineage, setDataLineage] = React.useState<any>(null);
  const [validationResult, setValidationResult] = React.useState<any>(null);
  
  // Test interface state
  const [testCases, setTestCases] = React.useState<FlowTestCase[]>([]);
  const [selectedTestCase, setSelectedTestCase] = React.useState<FlowTestCase | null>(null);
  const [testResults, setTestResults] = React.useState<Record<string, TestRunResult>>({});
  const [isExecutingTest, setIsExecutingTest] = React.useState(false);
  const [isExecutingAllTests, setIsExecutingAllTests] = React.useState(false);

  // Resolve input data and data lineage when selection changes
  React.useEffect(() => {
    if (selectedElement) {
      const resolveData = async () => {
        try {
          // Get component schema for the selected element
          let componentSchema = null;
          if (selectedElement.data?.componentSchema) {
            componentSchema = selectedElement.data.componentSchema;
          } else if (selectedElement.data?.resolvedComponentFqn) {
            componentSchema = moduleRegistry.getComponentSchema(selectedElement.data.resolvedComponentFqn);
          }

          // Check if this is a trigger node (either by stepId 'trigger' or triggerType)
          const isTriggerNode = selectedElement.data?.stepId === 'trigger' || 
                               selectedElement.data?.triggerType ||
                               selectedElement.id === 'trigger';

          // Determine the correct flow FQN for this step
          let stepFlowFqn = currentFlowFqn;
          
          // If we have flow information in the selected element, use that
          if (selectedElement.flowFqn) {
            stepFlowFqn = selectedElement.flowFqn;
          } else if (selectedElement.data?.flowFqn) {
            stepFlowFqn = selectedElement.data.flowFqn;
          } else if (selectedElement.data?.fqn && selectedElement.data.fqn.includes('.')) {
            // For system nodes, the fqn might be the flow FQN
            stepFlowFqn = selectedElement.data.fqn;
          } else {
            // CRITICAL: First try to find the flow that contains this step by searching all modules
            // This should take priority over currentFlowFqn to avoid mismatches
            const allModules = moduleRegistry.getAllLoadedModules();
            for (const module of allModules) {
              if (module.definitions?.flows) {
                for (const flow of module.definitions.flows) {
                  const flowFqn = `${module.fqn}.${flow.name}`;
                  if (flow.steps?.some((step: any) => step.step_id === selectedElement.id)) {
                    stepFlowFqn = flowFqn;
                    console.log(`🎯 Found step "${selectedElement.id}" in flow "${flowFqn}"`);
                    break;
                  }
                  // Check if this is the trigger for this flow
                  if (isTriggerNode && flow.trigger) {
                    stepFlowFqn = flowFqn;
                    console.log(`🎯 Found trigger "${selectedElement.id}" in flow "${flowFqn}"`);
                    break;
                  }
                }
                if (stepFlowFqn) break;
              }
            }
            
            // Only fallback to currentFlowFqn if we couldn't find the step in any flow
            if (!stepFlowFqn && currentFlowFqn) {
              console.warn(`⚠️ Could not find step "${selectedElement.id}" in any flow, falling back to current flow "${currentFlowFqn}"`);
              stepFlowFqn = currentFlowFqn;
            }
          }

          if (!stepFlowFqn) {
            console.warn('Could not determine flow FQN for selected element:', selectedElement);
            setInputData('{}');
            setDataLineage(null);
            setValidationResult(null);
            return;
          }

          console.log(`🔍 Resolving data for step "${selectedElement.id}" in flow "${stepFlowFqn}"`);

          if (isTriggerNode) {
            // For trigger nodes: resolve input from trigger configuration
            const flowDef = moduleRegistry.getFlowDefinition(stepFlowFqn);
            if (flowDef?.trigger) {
              const triggerInputData = actions.resolveTriggerInputData(
                flowDef.trigger,
                componentSchema,
                'happy_path'
              );
              setInputData(JSON.stringify(triggerInputData, null, 2));
              
              // For triggers, data lineage starts from the trigger itself
              setDataLineage({
                flowFqn: stepFlowFqn,
                paths: [{
                  targetStepId: 'trigger',
                  targetInputField: 'triggerData',
                  source: {
                    sourceType: 'external',
                    id: 'external-trigger',
                    dataPath: 'triggerData'
                  },
                  transformationExpression: 'direct'
                }]
              });
            }
          } else if (selectedElement.sourceType === 'flowNode' && selectedElement.data?.stepId) {
            // For step nodes: resolve input from flow structure and previous steps
            const resolvedInput = await actions.resolveStepInputData(
              selectedElement.data.stepId, 
              stepFlowFqn
            );
            
            setInputData(JSON.stringify(resolvedInput.actualInputData, null, 2));
            
            // Resolve data lineage
            const lineage = await actions.resolveDataLineage(
              selectedElement.data.stepId,
              stepFlowFqn
            );
            setDataLineage(lineage);
          }

          // Validate input data if we have a schema
          if (componentSchema) {
            try {
              const parsedInput = JSON.parse(inputData);
              const validation = actions.validateInputAgainstSchema(parsedInput, componentSchema);
              setValidationResult(validation);
            } catch (error) {
              // Input is not valid JSON, skip validation
              setValidationResult(null);
            }
          } else {
            setValidationResult(null);
          }

        } catch (error) {
          console.error('Error resolving input data:', error);
          setInputData('{}');
          setDataLineage(null);
          setValidationResult(null);
        }
      };

      resolveData();
    } else {
      setInputData('{}');
      setDataLineage(null);
      setValidationResult(null);
    }
  }, [selectedElement, currentFlowFqn, moduleRegistry, actions]);

  // Validate input data when it changes
  React.useEffect(() => {
    if (selectedElement && inputData) {
      let componentSchema = null;
      if (selectedElement.data?.componentSchema) {
        componentSchema = selectedElement.data.componentSchema;
      } else if (selectedElement.data?.resolvedComponentFqn) {
        componentSchema = moduleRegistry.getComponentSchema(selectedElement.data.resolvedComponentFqn);
      }

      if (componentSchema) {
        try {
          const parsedInput = JSON.parse(inputData);
          const validation = actions.validateInputAgainstSchema(parsedInput, componentSchema);
          setValidationResult(validation);
        } catch (error) {
          setValidationResult({
            isValid: false,
            errors: [{
              fieldPath: 'root',
              message: 'Invalid JSON format',
              expectedType: 'object',
              actualValue: inputData,
              schemaRule: 'format'
            }],
            warnings: []
          });
        }
      } else {
        // If no schema, consider input valid
        try {
          JSON.parse(inputData);
          setValidationResult({ isValid: true, errors: [], warnings: [] });
        } catch (error) {
          setValidationResult({
            isValid: false,
            errors: [{
              fieldPath: 'root',
              message: 'Invalid JSON format',
              expectedType: 'object',
              actualValue: inputData,
              schemaRule: 'format'
            }],
            warnings: []
          });
        }
      }
    }
  }, [inputData, selectedElement, moduleRegistry, actions]);

  const validateAndParseInput = (input: string) => {
    try {
      const parsed = JSON.parse(input);
      return { isValid: true, data: parsed };
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Invalid JSON' 
      };
    }
  };

  const executeFlow = async () => {
    const validation = validateAndParseInput(inputData);
    if (!validation.isValid) {
      console.error('Invalid input data:', validation.error);
      return;
    }

    if (!selectedElement || !currentFlowFqn) return;

    setIsExecuting(true);
    try {
      // Check if this is a trigger node
      const isTriggerNode = selectedElement.data?.stepId === 'trigger' || 
                           selectedElement.data?.triggerType ||
                           selectedElement.id === 'trigger';
      
      let result;
      
      if (isTriggerNode) {
        // For trigger execution, run the entire flow from the beginning
        console.log('🎯 Executing entire flow from trigger with input:', validation.data);
        const simulationResult = await actions.simulateFlowExecution(
          currentFlowFqn,
          undefined, // No target step - run entire flow
          validation.data,
          {
            useMocks: true,
            timeoutMs: 30000
          }
        );
        
        // Convert simulation result to execution result format
        result = {
          executionId: `flow-exec-${Date.now()}`,
          status: simulationResult.status === 'COMPLETED' ? 'SUCCESS' : 'FAILURE',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          durationMs: 2000,
          logs: [
            {
              stepId: 'trigger',
              timestamp: new Date().toISOString(),
              level: 'info',
              message: 'Flow execution completed from trigger',
              data: { simulationResult }
            }
          ],
          finalOutput: simulationResult.simulatedStepOutputs,
          trace: {
            traceId: `flow-trace-${Date.now()}`,
            flowFqn: currentFlowFqn,
            status: simulationResult.status,
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            durationMs: 2000,
            triggerData: validation.data,
            steps: [
              // Add trigger step
              {
                stepId: 'trigger',
                componentFqn: 'trigger',
                status: 'SUCCESS' as ExecutionStatusEnum,
                startTime: new Date().toISOString(),
                endTime: new Date().toISOString(),
                durationMs: 50,
                inputData: validation.data,
                outputData: simulationResult.triggerInputData
              },
              // Add executed steps
              ...Object.entries(simulationResult.resolvedStepInputs).map(([stepId, stepInputData]) => ({
                stepId,
                componentFqn: 'unknown',
                status: 'SUCCESS' as ExecutionStatusEnum,
                startTime: new Date().toISOString(),
                endTime: new Date().toISOString(),
                durationMs: 100,
                inputData: stepInputData,
                outputData: simulationResult.simulatedStepOutputs[stepId] || { result: 'completed' }
              }))
            ]
          }
        };
        
        // Update the execution state in the visualizer
        if (result.trace) {
          actions.updateExecutionState(currentFlowFqn, result.trace);
        }
      } else {
        // For step execution, run debug execution up to that step
        console.log('🎯 Executing step:', selectedElement.id, 'with input:', validation.data);
        result = await actions.runDebugExecution(selectedElement.id, validation.data, {
          useMocks: true,
          timeoutMs: 30000
        });
      }
      
      setExecutionResults(result);
    } catch (error) {
      console.error('Execution failed:', error);
      setExecutionResults({
        error: error instanceof Error ? error.message : 'Execution failed',
        status: 'FAILURE'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Generate test data based on type
  const generateTestData = (dataType: 'happy_path' | 'fork_paths' | 'error_cases') => {
    if (!selectedElement || !currentFlowFqn) return;

    try {
      let generatedData;
      
      // Check if this is a trigger node
      const isTriggerNode = selectedElement.data?.stepId === 'trigger' || 
                           selectedElement.data?.triggerType ||
                           selectedElement.id === 'trigger';
      
      if (isTriggerNode) {
        // For trigger nodes, generate trigger input data
        const flowDef = moduleRegistry.getFlowDefinition(currentFlowFqn);
        if (flowDef?.trigger) {
          let componentSchema = null;
          if (selectedElement.data?.componentSchema) {
            componentSchema = selectedElement.data.componentSchema;
          } else if (selectedElement.data?.resolvedComponentFqn) {
            componentSchema = moduleRegistry.getComponentSchema(selectedElement.data.resolvedComponentFqn);
          }
          
          generatedData = actions.resolveTriggerInputData(
            flowDef.trigger,
            componentSchema,
            dataType
          );
        }
      } else if (selectedElement.sourceType === 'flowNode' && selectedElement.data?.stepId) {
        // For step nodes, generate input data based on schema
        let componentSchema = null;
        if (selectedElement.data?.componentSchema) {
          componentSchema = selectedElement.data.componentSchema;
        } else if (selectedElement.data?.resolvedComponentFqn) {
          componentSchema = moduleRegistry.getComponentSchema(selectedElement.data.resolvedComponentFqn);
        }
        
        if (componentSchema) {
          generatedData = actions.generateSchemaBasedInputData(
            selectedElement.data.stepId,
            dataType,
            componentSchema
          );
        }
      }

      if (generatedData) {
        setInputData(JSON.stringify(generatedData, null, 2));
        
        // If this is a trigger, propagate the data flow to update dependent steps
        if (isTriggerNode) {
          actions.propagateDataFlow(currentFlowFqn, generatedData)
            .then(flowResults => {
              console.log('Data flow propagated:', flowResults);
              // The propagation results could be used to update other UI elements
            })
            .catch(error => {
              console.warn('Failed to propagate data flow:', error);
            });
        }
      }
    } catch (error) {
      console.error('Error generating test data:', error);
    }
  };

  const exportResults = (format: 'json' | 'yaml' | 'csv') => {
    if (!executionResults) return;
    
    const exported = actions.exportExecutionResults(executionResults, format);
    const blob = new Blob([exported], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-result.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!selectedElement) {
    return (
      <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
        Select a component or trigger to debug and test
      </div>
    );
  }

  return (
    <div>
      {/* Section Toggle */}
      <div style={{ 
        display: 'flex', 
        marginBottom: '16px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        {['debug', 'test'].map(section => (
          <button
            key={section}
            onClick={() => setActiveSection(section as any)}
            style={{
              padding: '8px 16px',
              border: 'none',
              backgroundColor: activeSection === section ? '#1976D2' : 'transparent',
              color: activeSection === section ? 'white' : '#666',
              cursor: 'pointer',
              fontSize: '14px',
              textTransform: 'capitalize',
              borderRadius: '4px 4px 0 0'
            }}
          >
            {section}
          </button>
        ))}
      </div>

      {activeSection === 'debug' && (
        <div>
          {/* Input Data Section */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Input Data</h4>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => generateTestData('happy_path')}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Happy Path
                </button>
                <button
                  onClick={() => generateTestData('fork_paths')}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    backgroundColor: '#FF9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Fork Paths
                </button>
                <button
                  onClick={() => generateTestData('error_cases')}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Error Cases
                </button>
              </div>
            </div>
            
            <textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              style={{
                width: '100%',
                height: '120px',
                fontFamily: 'monospace',
                fontSize: '12px',
                border: `1px solid ${validationResult && !validationResult.isValid ? '#f44336' : '#e0e0e0'}`,
                borderRadius: '4px',
                padding: '8px',
                resize: 'vertical'
              }}
              placeholder="Enter JSON input data..."
            />
            
            {validationResult && !validationResult.isValid && (
              <div style={{ 
                color: '#f44336', 
                fontSize: '12px', 
                marginTop: '4px',
                padding: '4px 8px',
                backgroundColor: '#ffebee',
                borderRadius: '3px'
              }}>
                {validationResult.errors && Array.isArray(validationResult.errors) ? (
                  validationResult.errors.map((error: any, index: number) => (
                    <div key={index} style={{ 
                      fontSize: '11px', 
                      color: '#f44336',
                      padding: '2px 8px',
                      backgroundColor: '#ffebee',
                      borderRadius: '3px',
                      marginBottom: '2px'
                    }}>
                      {error.fieldPath}: {error.message}
                    </div>
                  ))
                ) : (
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#f44336',
                    padding: '2px 8px',
                    backgroundColor: '#ffebee',
                    borderRadius: '3px'
                  }}>
                    Validation failed
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Data Lineage Section */}
          {dataLineage && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Data Lineage</h4>
              <div style={{ 
                backgroundColor: '#f9f9f9',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '12px'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Flow Path:</strong>
                </div>
                {dataLineage.paths && dataLineage.paths.length > 0 ? (
                  dataLineage.paths.map((path: any, index: number) => (
                    <div key={`${path.targetStepId}-${path.targetInputField}-${index}`} style={{ 
                      marginLeft: `${index * 16}px`,
                      marginBottom: '4px',
                      padding: '4px',
                      backgroundColor: 'white',
                      borderRadius: '3px',
                      border: '1px solid #e0e0e0'
                    }}>
                      <div style={{ fontWeight: '600' }}>{path.targetStepId} → {path.targetInputField}</div>
                      <div style={{ color: '#666' }}>Source: {path.source?.sourceType || 'unknown'}</div>
                      {path.source?.id && (
                        <div style={{ color: '#666' }}>From: {path.source.id}</div>
                      )}
                      {path.source?.dataPath && (
                        <div style={{ color: '#666', fontSize: '11px' }}>
                          Path: {path.source.dataPath}
                        </div>
                      )}
                      {path.transformationExpression && (
                        <div style={{ color: '#666', fontSize: '11px' }}>
                          Expression: {path.transformationExpression}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#666', fontStyle: 'italic' }}>
                    No data lineage paths found for this step.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Input Mappings - now included in paths */}
          {dataLineage?.paths && dataLineage.paths.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Input Mappings Summary</h4>
              <div style={{ 
                backgroundColor: '#f9f9f9',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '12px'
              }}>
                <div style={{ color: '#666' }}>
                  Found {dataLineage.paths.length} input mapping(s) for this step.
                </div>
              </div>
            </div>
          )}

          {/* Execution Controls */}
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={executeFlow}
              disabled={isExecuting || (validationResult && !validationResult.isValid)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: isExecuting ? '#ccc' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isExecuting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {isExecuting ? 'Executing...' : `Execute from ${selectedElement.data?.stepId || selectedElement.id}`}
            </button>
          </div>

          {/* Execution Results */}
          {executionResults && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Execution Results</h4>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => exportResults('json')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      backgroundColor: '#666',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => exportResults('yaml')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      backgroundColor: '#666',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    YAML
                  </button>
                  <button
                    onClick={() => exportResults('csv')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      backgroundColor: '#666',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    CSV
                  </button>
                </div>
              </div>
              
              <div style={{ 
                backgroundColor: '#f9f9f9',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '12px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {executionResults.error ? (
                  <div style={{ color: '#f44336' }}>
                    <strong>Error:</strong> {executionResults.error}
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Status:</strong> {executionResults.status}
                    </div>
                    {executionResults.durationMs && (
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Duration:</strong> {executionResults.durationMs}ms
                      </div>
                    )}
                    {executionResults.finalOutput && (
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Output:</strong>
                        <pre style={{ 
                          backgroundColor: 'white',
                          padding: '8px',
                          borderRadius: '3px',
                          border: '1px solid #e0e0e0',
                          fontSize: '11px',
                          marginTop: '4px',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {JSON.stringify(executionResults.finalOutput, null, 2)}
                        </pre>
                      </div>
                    )}
                    {executionResults.logs && executionResults.logs.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Logs:</strong>
                        <div style={{ 
                          backgroundColor: 'white',
                          padding: '8px',
                          borderRadius: '3px',
                          border: '1px solid #e0e0e0',
                          fontSize: '11px',
                          marginTop: '4px',
                          maxHeight: '150px',
                          overflowY: 'auto'
                        }}>
                          {executionResults.logs.map((log: any, index: number) => (
                            <div key={index} style={{ 
                              marginBottom: '2px',
                              color: log.level === 'error' ? '#f44336' : 
                                     log.level === 'warn' ? '#ff9800' : '#333'
                            }}>
                              [{log.timestamp}] {log.level.toUpperCase()}: {log.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeSection === 'test' && (
        <div>
          {/* Test Case Management Section */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Test Cases</h4>
              <button
                onClick={() => {
                  if (currentFlowFqn) {
                    const template = actions.generateTestCaseTemplate(currentFlowFqn, 'happyPath');
                    setTestCases(prev => [...prev, template]);
                  }
                }}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                + New Test Case
              </button>
            </div>

            {/* Test Cases List */}
            <div style={{ 
              backgroundColor: '#f9f9f9',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {testCases.length === 0 ? (
                <div style={{ 
                  padding: '16px', 
                  textAlign: 'center', 
                  color: '#666',
                  fontSize: '12px'
                }}>
                  No test cases created yet. Click "New Test Case" to get started.
                </div>
              ) : (
                testCases.map((testCase, index) => (
                  <div 
                    key={testCase.id}
                    style={{ 
                      padding: '8px 12px',
                      borderBottom: index < testCases.length - 1 ? '1px solid #e0e0e0' : 'none',
                      backgroundColor: selectedTestCase?.id === testCase.id ? '#e3f2fd' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                    onClick={() => setSelectedTestCase(testCase)}
                  >
                    <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                      {testCase.description || `Test Case ${index + 1}`}
                    </div>
                    <div style={{ color: '#666', fontSize: '11px' }}>
                      {testCase.assertions.length} assertion(s)
                      {testResults[testCase.id] && (
                        <span style={{ 
                          marginLeft: '8px',
                          color: testResults[testCase.id].passed ? '#4CAF50' : '#f44336',
                          fontWeight: '500'
                        }}>
                          • {testResults[testCase.id].passed ? 'PASSED' : 'FAILED'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Test Case Details */}
          {selectedTestCase && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                Test Case Details
              </h4>
              
              {/* Test Case Description */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                  Description:
                </label>
                <input
                  type="text"
                  value={selectedTestCase.description || ''}
                  onChange={(e) => {
                    const updated = { ...selectedTestCase, description: e.target.value };
                    setSelectedTestCase(updated);
                    setTestCases(prev => prev.map(tc => tc.id === updated.id ? updated : tc));
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '3px'
                  }}
                  placeholder="Enter test case description..."
                />
              </div>

              {/* Trigger Input */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                  Trigger Input:
                </label>
                <textarea
                  value={JSON.stringify(selectedTestCase.triggerInput, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      const updated = { ...selectedTestCase, triggerInput: parsed };
                      setSelectedTestCase(updated);
                      setTestCases(prev => prev.map(tc => tc.id === updated.id ? updated : tc));
                    } catch (error) {
                      // Invalid JSON, don't update
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '80px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '3px',
                    padding: '6px 8px',
                    resize: 'vertical'
                  }}
                  placeholder="Enter trigger input JSON..."
                />
              </div>

              {/* Assertions */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <label style={{ fontSize: '12px', fontWeight: '500' }}>
                    Assertions:
                  </label>
                  <button
                    onClick={() => {
                      const newAssertion = {
                        id: `assertion-${Date.now()}`,
                        targetPath: 'status',
                        expectedValue: 'COMPLETED',
                        comparison: 'equals' as AssertionComparisonEnum
                      };
                      const updated = { 
                        ...selectedTestCase, 
                        assertions: [...selectedTestCase.assertions, newAssertion] 
                      };
                      setSelectedTestCase(updated);
                      setTestCases(prev => prev.map(tc => tc.id === updated.id ? updated : tc));
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    + Add Assertion
                  </button>
                </div>

                <div style={{ 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  padding: '8px'
                }}>
                  {selectedTestCase.assertions.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#666',
                      fontSize: '11px',
                      padding: '8px'
                    }}>
                      No assertions defined. Click "Add Assertion" to create one.
                    </div>
                  ) : (
                    selectedTestCase.assertions.map((assertion, index) => (
                      <div 
                        key={assertion.id}
                        style={{ 
                          backgroundColor: 'white',
                          border: '1px solid #e0e0e0',
                          borderRadius: '3px',
                          padding: '8px',
                          marginBottom: index < selectedTestCase.assertions.length - 1 ? '8px' : '0',
                          fontSize: '11px'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                          <input
                            type="text"
                            value={assertion.targetPath}
                            onChange={(e) => {
                              const updatedAssertions = selectedTestCase.assertions.map(a => 
                                a.id === assertion.id ? { ...a, targetPath: e.target.value } : a
                              );
                              const updated = { ...selectedTestCase, assertions: updatedAssertions };
                              setSelectedTestCase(updated);
                              setTestCases(prev => prev.map(tc => tc.id === updated.id ? updated : tc));
                            }}
                            placeholder="Target path (e.g., status, durationMs)"
                            style={{
                              flex: 1,
                              padding: '4px 6px',
                              fontSize: '11px',
                              border: '1px solid #ddd',
                              borderRadius: '2px'
                            }}
                          />
                          <select
                            value={assertion.comparison}
                            onChange={(e) => {
                              const updatedAssertions = selectedTestCase.assertions.map(a => 
                                a.id === assertion.id ? { ...a, comparison: e.target.value as AssertionComparisonEnum } : a
                              );
                              const updated = { ...selectedTestCase, assertions: updatedAssertions };
                              setSelectedTestCase(updated);
                              setTestCases(prev => prev.map(tc => tc.id === updated.id ? updated : tc));
                            }}
                            style={{
                              padding: '4px 6px',
                              fontSize: '11px',
                              border: '1px solid #ddd',
                              borderRadius: '2px'
                            }}
                          >
                            <option value="equals">equals</option>
                            <option value="contains">contains</option>
                            <option value="isGreaterThan">greater than</option>
                            <option value="isLessThan">less than</option>
                            <option value="isDefined">exists</option>
                          </select>
                          <button
                            onClick={() => {
                              const updatedAssertions = selectedTestCase.assertions.filter(a => a.id !== assertion.id);
                              const updated = { ...selectedTestCase, assertions: updatedAssertions };
                              setSelectedTestCase(updated);
                              setTestCases(prev => prev.map(tc => tc.id === updated.id ? updated : tc));
                            }}
                            style={{
                              padding: '4px 6px',
                              fontSize: '11px',
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '2px',
                              cursor: 'pointer'
                            }}
                          >
                            ×
                          </button>
                        </div>
                        <input
                          type="text"
                          value={typeof assertion.expectedValue === 'string' ? assertion.expectedValue : JSON.stringify(assertion.expectedValue)}
                          onChange={(e) => {
                            let expectedValue = e.target.value;
                            try {
                              expectedValue = JSON.parse(e.target.value);
                            } catch {
                              // Keep as string if not valid JSON
                            }
                            const updatedAssertions = selectedTestCase.assertions.map(a => 
                              a.id === assertion.id ? { ...a, expectedValue } : a
                            );
                            const updated = { ...selectedTestCase, assertions: updatedAssertions };
                            setSelectedTestCase(updated);
                            setTestCases(prev => prev.map(tc => tc.id === updated.id ? updated : tc));
                          }}
                          placeholder="Expected value"
                          style={{
                            width: '100%',
                            padding: '4px 6px',
                            fontSize: '11px',
                            border: '1px solid #ddd',
                            borderRadius: '2px'
                          }}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Test Execution Controls */}
              <div style={{ marginBottom: '16px' }}>
                <button
                  onClick={async () => {
                    if (!selectedTestCase) return;
                    
                    setIsExecutingTest(true);
                    try {
                      const result = await actions.runTestCase(selectedTestCase);
                      if (result) {
                        setTestResults(prev => ({
                          ...prev,
                          [selectedTestCase.id]: result
                        }));
                      }
                    } catch (error) {
                      console.error('Test execution failed:', error);
                      setTestResults(prev => ({
                        ...prev,
                        [selectedTestCase.id]: {
                          testCase: selectedTestCase,
                          passed: false,
                          assertionResults: [],
                          error: error instanceof Error ? error.message : 'Test execution failed'
                        }
                      }));
                    } finally {
                      setIsExecutingTest(false);
                    }
                  }}
                  disabled={isExecutingTest}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: isExecutingTest ? '#ccc' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isExecutingTest ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  {isExecutingTest ? 'Running Test...' : 'Run Test Case'}
                </button>
              </div>

              {/* Test Results */}
              {testResults[selectedTestCase.id] && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                    Test Results
                  </h4>
                  
                  <div style={{ 
                    backgroundColor: '#f9f9f9',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '12px',
                    fontSize: '12px'
                  }}>
                    {(() => {
                      const result = testResults[selectedTestCase.id];
                      return (
                        <div>
                          <div style={{ 
                            marginBottom: '12px',
                            padding: '8px',
                            backgroundColor: result.passed ? '#e8f5e8' : '#ffebee',
                            borderRadius: '4px',
                            border: `1px solid ${result.passed ? '#4CAF50' : '#f44336'}`
                          }}>
                            <div style={{ 
                              fontWeight: '600',
                              color: result.passed ? '#2e7d32' : '#c62828',
                              marginBottom: '4px'
                            }}>
                              {result.passed ? '✓ TEST PASSED' : '✗ TEST FAILED'}
                            </div>
                            {result.error && (
                              <div style={{ color: '#c62828', fontSize: '11px' }}>
                                Error: {result.error}
                              </div>
                            )}
                          </div>

                          {result.assertionResults.length > 0 && (
                            <div>
                              <div style={{ fontWeight: '500', marginBottom: '8px' }}>
                                Assertion Results:
                              </div>
                              {result.assertionResults.map((assertionResult, index) => (
                                <div 
                                  key={index}
                                  style={{ 
                                    backgroundColor: 'white',
                                    border: `1px solid ${assertionResult.passed ? '#4CAF50' : '#f44336'}`,
                                    borderRadius: '3px',
                                    padding: '8px',
                                    marginBottom: '6px',
                                    fontSize: '11px'
                                  }}
                                >
                                  <div style={{ 
                                    fontWeight: '500',
                                    color: assertionResult.passed ? '#2e7d32' : '#c62828',
                                    marginBottom: '4px'
                                  }}>
                                    {assertionResult.passed ? '✓' : '✗'} {assertionResult.targetPath}
                                  </div>
                                  <div style={{ color: '#666' }}>
                                    Expected: {JSON.stringify(assertionResult.expectedValue)}
                                  </div>
                                  {assertionResult.actualValue !== undefined && (
                                    <div style={{ color: '#666' }}>
                                      Actual: {JSON.stringify(assertionResult.actualValue)}
                                    </div>
                                  )}
                                  {assertionResult.message && (
                                    <div style={{ color: '#666', fontStyle: 'italic' }}>
                                      {assertionResult.message}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {result.trace && (
                            <div style={{ marginTop: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '6px' }}>
                                Execution Trace:
                              </div>
                              <div style={{ 
                                backgroundColor: 'white',
                                border: '1px solid #e0e0e0',
                                borderRadius: '3px',
                                padding: '8px',
                                fontSize: '11px'
                              }}>
                                <div>Status: {result.trace.status}</div>
                                {result.trace.durationMs && (
                                  <div>Duration: {result.trace.durationMs}ms</div>
                                )}
                                <div>Steps: {result.trace.steps.length}</div>
                                <div>
                                  Successful: {result.trace.steps.filter(s => s.status === 'SUCCESS').length}
                                </div>
                                <div>
                                  Failed: {result.trace.steps.filter(s => s.status === 'FAILURE').length}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bulk Test Operations */}
          {testCases.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'flex', 
                gap: '8px',
                justifyContent: 'space-between'
              }}>
                <button
                  onClick={async () => {
                    setIsExecutingAllTests(true);
                    try {
                      for (const testCase of testCases) {
                        const result = await actions.runTestCase(testCase);
                        if (result) {
                          setTestResults(prev => ({
                            ...prev,
                            [testCase.id]: result
                          }));
                        }
                      }
                    } catch (error) {
                      console.error('Bulk test execution failed:', error);
                    } finally {
                      setIsExecutingAllTests(false);
                    }
                  }}
                  disabled={isExecutingAllTests}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: isExecutingAllTests ? '#ccc' : '#FF9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isExecutingAllTests ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  {isExecutingAllTests ? 'Running All...' : 'Run All Tests'}
                </button>

                <button
                  onClick={() => {
                    setTestCases([]);
                    setSelectedTestCase(null);
                    setTestResults({});
                  }}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  Clear All
                </button>
              </div>

              {/* Test Summary */}
              <div style={{ 
                marginTop: '12px',
                padding: '8px',
                backgroundColor: '#f0f0f0',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                <div style={{ fontWeight: '500', marginBottom: '4px' }}>Test Summary:</div>
                <div>
                  Total: {testCases.length} | 
                  Passed: {Object.values(testResults).filter(r => r.passed).length} | 
                  Failed: {Object.values(testResults).filter(r => !r.passed).length} | 
                  Not Run: {testCases.length - Object.keys(testResults).length}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Wrapper functions that return the React components with proper prop signatures
const renderInspectorSourceTab = (props: { selectedElement: SelectedElement; moduleRegistry: IModuleRegistry }) => {
  return React.createElement(InspectorSourceTab, {
    currentFlowFqn: null,
    selectedElement: props.selectedElement,
    moduleRegistry: props.moduleRegistry
  });
};

const renderInspectorPropertiesTab = (props: { selectedElement: SelectedElement; actions: InspectorPropertiesActions; moduleRegistry: IModuleRegistry }) => {
  return React.createElement(InspectorPropertiesTab, {
    selectedElement: props.selectedElement,
    actions: props.actions,
    moduleRegistry: props.moduleRegistry
  });
};

const renderInspectorDebugTestTab = (props: { currentFlowFqn: string; selectedElement?: SelectedElement; actions: UnifiedDebugTestActions; moduleRegistry: IModuleRegistry }) => {
  return React.createElement(InspectorDebugTestTab, {
    currentFlowFqn: props.currentFlowFqn,
    selectedElement: props.selectedElement || null,
    actions: props.actions,
    moduleRegistry: props.moduleRegistry
  });
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
      getContextDefinition: () => null,
      getFlowDefinitionDsl: () => null,
      getNamedComponentDefinitionDsl: () => null
    });
    
    // Mock test result
    return {
      testCase,
      passed: true,
      assertionResults: testCase.assertions.map(assertion => ({
        assertionId: assertion.id,
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
        <CascadeFlowVisualizer
          initialModules={sampleModules}
          componentSchemas={sampleComponentSchemas}
          mode="design"
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
          renderInspectorDebugTestTab={renderInspectorDebugTestTab}
          isEditingEnabled={true}
          elkOptions={{
            algorithm: 'layered',
            direction: 'RIGHT'
          }}
        />
      </div>
  );
} 