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
  UnifiedDebugTestActions
} from '@/models/cfv_models_generated';
import { generateTestCaseTemplates, createTestCaseFromTemplate } from '@/services/testCaseService';
import { casinoPlatformModules, casinoPlatformComponentSchemas } from '@/examples/casinoPlatformExample';

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
  const currentConfig = selectedElement?.data?.dslObject?.config || {};
  const resolvedComponentFqn = selectedElement?.data?.resolvedComponentFqn;

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
  const [resolvedInput, setResolvedInput] = React.useState<any>(null);
  const [dataLineage, setDataLineage] = React.useState<any>(null);
  const [executionResult, setExecutionResult] = React.useState<any>(null);
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [inputError, setInputError] = React.useState<string | null>(null);
  const [validationResult, setValidationResult] = React.useState<any>(null);

  // Resolve input data and data lineage when selection changes
  React.useEffect(() => {
    if (selectedElement && currentFlowFqn) {
      const resolveData = async () => {
        try {
          // Get component schema for the selected element
          let componentSchema = null;
          if (selectedElement.data?.componentSchema) {
            componentSchema = selectedElement.data.componentSchema;
          } else if (selectedElement.data?.resolvedComponentFqn) {
            componentSchema = moduleRegistry.getComponentSchema(selectedElement.data.resolvedComponentFqn);
          }

          if (selectedElement.sourceType === 'flowNode' && selectedElement.data?.stepId) {
            // For step nodes, resolve input data based on schema and flow structure
            const resolved = await actions.resolveStepInputData(selectedElement.data.stepId, currentFlowFqn);
            setResolvedInput(resolved);
            
            // Generate input structure from schema
            if (componentSchema?.inputSchema) {
              const inputStructure = actions.generateInputStructureFromSchema(componentSchema, true);
              const inputDataString = JSON.stringify(inputStructure, null, 2);
              setInputData(inputDataString);
              
              // Validate the generated input data
              const validation = actions.validateInputAgainstSchema(inputStructure, componentSchema);
              setValidationResult(validation);
            } else {
              const inputDataString = JSON.stringify(resolved.resolvedInputData, null, 2);
              setInputData(inputDataString);
            }

            // Resolve data lineage
            const lineage = await actions.resolveDataLineage(selectedElement.data.stepId, currentFlowFqn);
            setDataLineage(lineage);
          } else if (selectedElement.sourceType === 'flowNode' && selectedElement.data?.triggerType) {
            // For trigger nodes, use trigger schema
            const flowDef = moduleRegistry.getFlowDefinition(currentFlowFqn);
            if (flowDef?.trigger) {
              // Generate trigger input structure
              const triggerSchema = { 
                fqn: 'trigger',
                inputSchema: flowDef.trigger.schema || { type: 'object', properties: {} } 
              };
              const inputStructure = actions.generateInputStructureFromSchema(triggerSchema, true);
              const inputDataString = JSON.stringify(inputStructure, null, 2);
              setInputData(inputDataString);
              
              // Validate the generated trigger input data
              const validation = actions.validateInputAgainstSchema(inputStructure, triggerSchema);
              setValidationResult(validation);
            }
          }
        } catch (error) {
          console.error('Error resolving input data:', error);
          setInputError(error instanceof Error ? error.message : 'Unknown error');
        }
      };

      resolveData();
    } else {
      setResolvedInput(null);
      setDataLineage(null);
      setInputData('{}');
      setValidationResult(null);
    }
  }, [selectedElement, currentFlowFqn, actions, moduleRegistry]);

  const validateAndParseInput = (input: string) => {
    try {
      const parsed = JSON.parse(input);
      setInputError(null);
      
      // Validate against schema if available
      if (selectedElement?.data?.componentSchema) {
        const validation = actions.validateInputAgainstSchema(parsed, selectedElement.data.componentSchema);
        setValidationResult(validation);
        if (!validation.isValid) {
          setInputError(`Validation errors: ${validation.errors.map(e => e.message).join(', ')}`);
        }
      }
      
      return parsed;
    } catch (error) {
      setInputError('Invalid JSON format');
      return null;
    }
  };

  const handleInputChange = (value: string) => {
    setInputData(value);
    validateAndParseInput(value);
  };

  const generateSchemaBasedData = (dataType: 'happy_path' | 'fork_paths' | 'error_cases') => {
    if (!selectedElement) return;

    const componentSchema = selectedElement.data?.componentSchema || 
      (selectedElement.data?.resolvedComponentFqn ? moduleRegistry.getComponentSchema(selectedElement.data.resolvedComponentFqn) : null);

    if (componentSchema) {
      const generatedData = actions.generateSchemaBasedInputData(
        selectedElement.id, 
        dataType, 
        componentSchema,
        {} // outputSchemas - would be populated from previous steps in real implementation
      );
      setInputData(JSON.stringify(generatedData, null, 2));
    }
  };

  const executeFromSelection = async () => {
    if (!selectedElement || !currentFlowFqn) return;

    const parsedInput = validateAndParseInput(inputData);
    if (!parsedInput) return;

    setIsExecuting(true);
    try {
      const result = await actions.runDebugExecution(selectedElement.id, parsedInput, {
        useMocks: true,
        timeoutMs: 30000
      });
      setExecutionResult(result);
    } catch (error) {
      console.error('Execution failed:', error);
      setExecutionResult({
        error: error instanceof Error ? error.message : 'Execution failed',
        status: 'FAILURE'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const exportResults = (format: 'json' | 'yaml' | 'csv') => {
    if (!executionResult) return;
    
    const exported = actions.exportExecutionResults(executionResult, format);
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
                  onClick={() => generateSchemaBasedData('happy_path')}
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
                  onClick={() => generateSchemaBasedData('fork_paths')}
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
                  onClick={() => generateSchemaBasedData('error_cases')}
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
              onChange={(e) => handleInputChange(e.target.value)}
              style={{
                width: '100%',
                height: '120px',
                fontFamily: 'monospace',
                fontSize: '12px',
                border: `1px solid ${inputError ? '#f44336' : '#e0e0e0'}`,
                borderRadius: '4px',
                padding: '8px',
                resize: 'vertical'
              }}
              placeholder="Enter JSON input data..."
            />
            
            {inputError && (
              <div style={{ 
                color: '#f44336', 
                fontSize: '12px', 
                marginTop: '4px',
                padding: '4px 8px',
                backgroundColor: '#ffebee',
                borderRadius: '3px'
              }}>
                {inputError}
              </div>
            )}

            {validationResult && !validationResult.isValid && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#f44336', marginBottom: '4px' }}>
                  Schema Validation Errors:
                </div>
                {validationResult.errors.map((error: any, index: number) => (
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
                ))}
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
                {dataLineage.dataPath.map((step: any, index: number) => (
                  <div key={step.stepId} style={{ 
                    marginLeft: `${index * 16}px`,
                    marginBottom: '4px',
                    padding: '4px',
                    backgroundColor: 'white',
                    borderRadius: '3px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{ fontWeight: '600' }}>{step.stepId} ({step.stepType})</div>
                    {step.componentFqn && (
                      <div style={{ color: '#666' }}>Component: {step.componentFqn}</div>
                    )}
                    {step.outputData && (
                      <div style={{ color: '#666', fontSize: '11px' }}>
                        Output: {JSON.stringify(step.outputData)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Mappings */}
          {dataLineage?.inputMappings && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Input Mappings</h4>
              <div style={{ 
                backgroundColor: '#f9f9f9',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '12px'
              }}>
                {dataLineage.inputMappings.map((mapping: any, index: number) => (
                  <div key={index} style={{ 
                    marginBottom: '4px',
                    padding: '4px',
                    backgroundColor: 'white',
                    borderRadius: '3px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{ fontWeight: '600' }}>
                      {mapping.targetInputField} 
                      {mapping.isRequired && <span style={{ color: '#f44336' }}>*</span>}
                    </div>
                    <div style={{ color: '#666' }}>
                      Source: {mapping.sourceType}
                      {mapping.sourceStepId && ` (${mapping.sourceStepId})`}
                      {mapping.contextVariableName && ` (${mapping.contextVariableName})`}
                    </div>
                    {mapping.defaultValue !== null && (
                      <div style={{ color: '#666', fontSize: '11px' }}>
                        Default: {JSON.stringify(mapping.defaultValue)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Execution Controls */}
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={executeFromSelection}
              disabled={isExecuting || !!inputError}
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
          {executionResult && (
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
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Status:</strong> 
                  <span style={{ 
                    color: executionResult.status === 'SUCCESS' ? '#4CAF50' : '#f44336',
                    marginLeft: '8px'
                  }}>
                    {executionResult.status}
                  </span>
                </div>
                
                {executionResult.durationMs && (
                  <div style={{ marginBottom: '8px', fontSize: '12px' }}>
                    <strong>Duration:</strong> {executionResult.durationMs}ms
                  </div>
                )}

                {executionResult.finalOutput && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Final Output:</strong>
                    <pre style={{ 
                      fontSize: '11px', 
                      backgroundColor: 'white',
                      padding: '8px',
                      borderRadius: '3px',
                      border: '1px solid #e0e0e0',
                      margin: '4px 0',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {JSON.stringify(executionResult.finalOutput, null, 2)}
                    </pre>
                  </div>
                )}

                {executionResult.logs && executionResult.logs.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Execution Logs:</strong>
                    <div style={{ 
                      maxHeight: '150px',
                      overflowY: 'auto',
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '3px',
                      margin: '4px 0'
                    }}>
                      {executionResult.logs.map((log: any, index: number) => (
                        <div key={index} style={{ 
                          padding: '4px 8px',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '11px',
                          fontFamily: 'monospace'
                        }}>
                          <span style={{ color: '#666' }}>[{log.timestamp}]</span>
                          <span style={{ 
                            color: log.level === 'error' ? '#f44336' : 
                                   log.level === 'warn' ? '#FF9800' : '#666',
                            marginLeft: '8px',
                            fontWeight: '600'
                          }}>
                            {log.level.toUpperCase()}
                          </span>
                          <span style={{ marginLeft: '8px' }}>{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {executionResult.systemTriggers && executionResult.systemTriggers.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>System Triggers:</strong>
                    <div style={{ fontSize: '11px', marginTop: '4px' }}>
                      {executionResult.systemTriggers.map((trigger: any, index: number) => (
                        <div key={index} style={{ 
                          padding: '4px',
                          backgroundColor: 'white',
                          border: '1px solid #e0e0e0',
                          borderRadius: '3px',
                          marginBottom: '2px'
                        }}>
                          <div><strong>{trigger.triggerType}</strong> → {trigger.targetSystem}</div>
                          <div style={{ color: '#666' }}>From: {trigger.sourceStepId}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {executionResult.error && (
                  <div style={{ 
                    color: '#f44336',
                    backgroundColor: '#ffebee',
                    padding: '8px',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}>
                    <strong>Error:</strong> {executionResult.error}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeSection === 'test' && (
        <div>
          <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            <h4>Test Case Management</h4>
            <p style={{ fontSize: '12px', margin: '8px 0' }}>
              Test case creation and management functionality will be implemented here.
            </p>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              onClick={() => {
                if (currentFlowFqn) {
                  const testCase = actions.generateTestCase(currentFlowFqn, 'happy_path');
                  console.log('Generated test case:', testCase);
                }
              }}
            >
              Generate Test Case
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrapper functions that return the React components
const renderInspectorSourceTab = (
  currentFlowFqn: string | null,
  selectedElement: SelectedElement | null,
  moduleRegistry: IModuleRegistry
) => {
  return React.createElement(InspectorSourceTab, {
    currentFlowFqn,
    selectedElement,
    moduleRegistry
  });
};

const renderInspectorPropertiesTab = (
  selectedElement: SelectedElement | null,
  actions: InspectorPropertiesActions,
  moduleRegistry: IModuleRegistry
) => {
  return React.createElement(InspectorPropertiesTab, {
    selectedElement,
    actions,
    moduleRegistry
  });
};

const renderInspectorDebugTestTab = (
  currentFlowFqn: string | null,
  selectedElement: SelectedElement | null,
  actions: UnifiedDebugTestActions,
  moduleRegistry: IModuleRegistry
) => {
  return React.createElement(InspectorDebugTestTab, {
    currentFlowFqn,
    selectedElement,
    actions,
    moduleRegistry
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
          renderInspectorDebugTestTab={renderInspectorDebugTestTab}
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