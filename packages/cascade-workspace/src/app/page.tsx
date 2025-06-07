'use client';

import React from 'react';
import { 
  CascadeFlowVisualizer,
  StepNode,
  TriggerNode,
  SubFlowInvokerNode,
  SystemFlowNode,
  SystemTriggerNode,
  FlowEdge,
  SystemEdge,
  generateTestCaseTemplates, 
  createTestCaseFromTemplate
} from '@cascade/graph';
import '@cascade/graph/dist/style.css';
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
import { casinoPlatformModules, casinoPlatformComponentSchemas } from '@/examples/casinoPlatformRefinedExample';
import { propertiesTabService } from '@/services/propertiesTabService';

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
// const sampleTraceData: FlowExecutionTrace = {
//   traceId: 'trace-casino-123',
//   flowFqn: 'com.casino.core.UserOnboardingFlow',
//   instanceId: 'instance-casino-456',
//   status: 'COMPLETED',
//   startTime: '2024-01-15T10:00:00Z',
//   endTime: '2024-01-15T10:00:15Z',
//   durationMs: 15000,
//   triggerData: {
//     method: 'POST',
//     path: '/api/users/onboard',
//     body: { 
//       email: 'user@example.com',
//       firstName: 'John',
//       lastName: 'Doe',
//       dateOfBirth: '1990-01-01',
//       country: 'US'
//     }
//   },
//   initialContext: {},
//   finalContext: { userId: 'user-123', kycStatus: 'verified' },
//   steps: [
//     {
//       stepId: 'validate-registration-data',
//       componentFqn: 'StdLib:JsonSchemaValidator',
//       status: 'SUCCESS',
//       startTime: '2024-01-15T10:00:00Z',
//       endTime: '2024-01-15T10:00:02Z',
//       durationMs: 2000,
//       inputData: { 
//         email: 'user@example.com',
//         firstName: 'John',
//         lastName: 'Doe'
//       },
//       outputData: { validData: { email: 'user@example.com', firstName: 'John', lastName: 'Doe' } }
//     },
//     {
//       stepId: 'geo-compliance-check',
//       componentFqn: 'StdLib:Fork',
//       status: 'SUCCESS',
//       startTime: '2024-01-15T10:00:02Z',
//       endTime: '2024-01-15T10:00:05Z',
//       durationMs: 3000,
//       inputData: { userData: { country: 'US' } },
//       outputData: { 
//         'jurisdiction-check': { allowed: true },
//         'sanctions-check': { flagged: false },
//         'age-verification': { isEligible: true, age: 34 }
//       }
//     },
//     {
//       stepId: 'evaluate-compliance-results',
//       componentFqn: 'StdLib:MapData',
//       status: 'SUCCESS',
//       startTime: '2024-01-15T10:00:05Z',
//       endTime: '2024-01-15T10:00:06Z',
//       durationMs: 1000,
//       inputData: { jurisdictionAllowed: true, onSanctionsList: false, ageEligible: true },
//       outputData: { 
//         canProceed: true,
//         complianceFlags: { jurisdiction: true, sanctions: true, age: true },
//         riskLevel: 'low'
//       }
//     },
//     {
//       stepId: 'initiate-kyc-process',
//       componentFqn: 'StdLib:SubFlowInvoker',
//       status: 'SUCCESS',
//       startTime: '2024-01-15T10:00:06Z',
//       endTime: '2024-01-15T10:00:10Z',
//       durationMs: 4000,
//       inputData: { userData: { email: 'user@example.com' }, complianceData: { riskLevel: 'low' } },
//       outputData: { status: 'verified', sessionId: 'kyc-session-123' }
//     },
//     {
//       stepId: 'create-user-account',
//       componentFqn: 'StdLib:HttpCall',
//       status: 'SUCCESS',
//       startTime: '2024-01-15T10:00:10Z',
//       endTime: '2024-01-15T10:00:12Z',
//       durationMs: 2000,
//       inputData: { userData: { email: 'user@example.com' }, kycStatus: 'verified' },
//       outputData: { userId: 'user-123', accountCreated: true }
//     },
//     {
//       stepId: 'setup-responsible-gambling',
//       componentFqn: 'StdLib:SubFlowInvoker',
//       status: 'SUCCESS',
//       startTime: '2024-01-15T10:00:12Z',
//       endTime: '2024-01-15T10:00:14Z',
//       durationMs: 2000,
//       inputData: { userId: 'user-123', userTier: 'standard' },
//       outputData: { limitsConfigured: true, dailyLimit: 1000 }
//     },
//     {
//       stepId: 'send-welcome-communication',
//       componentFqn: 'StdLib:Fork',
//       status: 'SUCCESS',
//       startTime: '2024-01-15T10:00:14Z',
//       endTime: '2024-01-15T10:00:15Z',
//       durationMs: 1000,
//       inputData: { userData: { userId: 'user-123', email: 'user@example.com' } },
//       outputData: { 
//         'welcome-email': { sent: true, messageId: 'email-123' },
//         'welcome-sms': { sent: true, messageId: 'sms-123' },
//         'analytics-event': { tracked: true, eventId: 'event-123' }
//       }
//     }
//   ]
// };

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
  const [validationErrors, setValidationErrors] = React.useState<any[]>([]);
  const [isDirty, setIsDirty] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set(['basic']));

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
      setIsDirty(false);
      setValidationErrors([]);
    }
  }, [selectedElement?.id, currentConfig]);

  // Validate form data when it changes
  React.useEffect(() => {
    if (componentSchema?.configSchema && formData) {
      try {
        const validation = propertiesTabService.validateConfig(formData, componentSchema.configSchema);
        setValidationErrors(validation.errors || []);
      } catch (error) {
        console.error('Validation error:', error);
        setValidationErrors([]);
      }
    }
  }, [formData, componentSchema]);

  // Early returns after hooks
  if (!selectedElement || selectedElement.sourceType !== 'flowNode') {
    return (
      <div style={{ 
        padding: '24px', 
        textAlign: 'center', 
        color: '#6B7280',
        backgroundColor: '#F9FAFB',
        borderRadius: '8px',
        border: '1px solid #E5E7EB'
      }}>
        <div style={{ fontSize: '16px', marginBottom: '8px' }}>📝</div>
        <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>No component selected</p>
        <p style={{ fontSize: '14px', margin: 0, color: '#9CA3AF' }}>
          Select a component node to edit its properties
        </p>
      </div>
    );
  }

  if (!componentSchema?.configSchema) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>Properties</h4>
        </div>
        
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#FEF3C7', 
          borderRadius: '8px', 
          border: '1px solid #F59E0B',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <p style={{ margin: 0, color: '#92400E', fontWeight: '500' }}>
              No configuration schema available
            </p>
          </div>
          <p style={{ margin: 0, color: '#92400E', fontSize: '14px' }}>
            Component: {resolvedComponentFqn || 'Unknown'}
          </p>
        </div>
        
        {Object.keys(currentConfig).length > 0 && (
          <div style={{ 
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '12px 16px', 
              backgroundColor: '#F9FAFB', 
              borderBottom: '1px solid #E5E7EB',
              fontWeight: '500',
              fontSize: '14px',
              color: '#374151'
            }}>
              Current Configuration
            </div>
            <pre style={{
              padding: '16px',
              margin: 0,
              backgroundColor: '#F9FAFB',
              fontSize: '12px',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              overflow: 'auto',
              maxHeight: '300px',
              color: '#374151'
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
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (validationErrors.length > 0) {
      console.warn('Cannot save: validation errors present');
      return;
    }

    setIsLoading(true);
    try {
      await actions.requestSave(formData, ['config']);
      setIsDirty(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(currentConfig);
    setIsDirty(false);
    setValidationErrors([]);
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const yamlPreview = showYamlPreview ? yamlStringify(formData, { indent: 2 }) : '';

  // Generate form fields from schema
  const formFields = React.useMemo(() => {
    if (!componentSchema?.configSchema) return [];
    return propertiesTabService.generateFormFields(componentSchema.configSchema);
  }, [componentSchema]);

  // Group fields by category (basic, advanced, etc.)
  const groupedFields = React.useMemo(() => {
    const groups: Record<string, typeof formFields> = {
      basic: [],
      advanced: [],
      other: []
    };

    formFields.forEach((field: any) => {
      // Simple categorization logic - can be enhanced based on field properties
      if (field.required || ['name', 'id', 'type', 'enabled'].includes(field.path[0])) {
        groups.basic.push(field);
      } else if (['timeout', 'retries', 'debug', 'logging'].includes(field.path[0])) {
        groups.advanced.push(field);
      } else {
        groups.other.push(field);
      }
    });

    return groups;
  }, [formFields]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ 
        padding: '16px',
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>Properties</h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowYamlPreview(!showYamlPreview)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                backgroundColor: showYamlPreview ? '#3B82F6' : 'white',
                color: showYamlPreview ? 'white' : '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {showYamlPreview ? 'Hide YAML' : 'Show YAML'}
            </button>
            {isDirty && (
              <button
                onClick={handleReset}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#6B7280',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Reset
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isLoading || validationErrors.length > 0 || !isDirty}
              style={{
                padding: '6px 16px',
                fontSize: '12px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: isLoading || validationErrors.length > 0 || !isDirty ? '#9CA3AF' : '#10B981',
                color: 'white',
                cursor: isLoading || validationErrors.length > 0 || !isDirty ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Component Info */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          fontSize: '13px', 
          color: '#6B7280',
          backgroundColor: '#F9FAFB',
          padding: '8px 12px',
          borderRadius: '6px'
        }}>
          <div><strong>Component:</strong> {resolvedComponentFqn}</div>
          <div><strong>Step ID:</strong> {selectedElement.id}</div>
          {isDirty && <div style={{ color: '#F59E0B' }}><strong>●</strong> Unsaved changes</div>}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div style={{ 
            marginTop: '12px',
            padding: '12px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#DC2626', marginBottom: '8px' }}>
              Validation Errors:
            </div>
            {validationErrors.map((error, index) => (
              <div key={index} style={{ 
                fontSize: '12px', 
                color: '#DC2626',
                marginBottom: '4px'
              }}>
                • {error.fieldPath}: {error.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {showYamlPreview && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                padding: '12px 16px', 
                backgroundColor: '#F9FAFB', 
                borderBottom: '1px solid #E5E7EB',
                fontWeight: '500',
                fontSize: '14px',
                color: '#374151'
              }}>
                YAML Preview
              </div>
              <pre style={{
                padding: '16px',
                margin: 0,
                backgroundColor: '#F9FAFB',
                fontSize: '12px',
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                overflow: 'auto',
                maxHeight: '200px',
                color: '#374151'
              }}>
                {yamlPreview}
              </pre>
            </div>
          </div>
        )}

        {/* Form Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(groupedFields).map(([groupName, fields]) => {
            if (fields.length === 0) return null;
            
            const isExpanded = expandedSections.has(groupName);
            const sectionTitle = groupName.charAt(0).toUpperCase() + groupName.slice(1);
            
            return (
              <div key={groupName} style={{ 
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <button
                  onClick={() => toggleSection(groupName)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#F9FAFB',
                    border: 'none',
                    borderBottom: isExpanded ? '1px solid #E5E7EB' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}
                >
                  <span>{sectionTitle} ({fields.length} field{fields.length !== 1 ? 's' : ''})</span>
                  <span style={{ 
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}>
                    ▼
                  </span>
                </button>
                
                {isExpanded && (
                  <div style={{ padding: '16px' }}>
                    <Form
                      schema={componentSchema.configSchema as RJSFSchema}
                      formData={formData}
                      onChange={handleFormChange}
                      validator={validator}
                      uiSchema={{
                        "ui:submitButtonOptions": {
                          "norender": true
                        },
                        // Enhanced UI schema for better field rendering
                        ...Object.fromEntries(
                          fields.map((field: any) => [
                            field.path[0],
                            {
                              "ui:placeholder": field.description || `Enter ${field.label.toLowerCase()}`,
                              "ui:description": field.description,
                              "ui:help": field.validation?.pattern ? `Pattern: ${field.validation.pattern}` : undefined
                            }
                          ])
                        )
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Fallback: Show basic form if no fields are categorized */}
        {Object.values(groupedFields).every(fields => fields.length === 0) && (
          <div style={{ 
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <h5 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Configuration Form
            </h5>
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
  const [configurationData, setConfigurationData] = React.useState<string>('{}');
  const [outputData, setOutputData] = React.useState<string>('{}');
  const [executionResults, setExecutionResults] = React.useState<any>(null);
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [dataLineage, setDataLineage] = React.useState<any>(null);
  const [validationResult, setValidationResult] = React.useState<any>(null);
  const [configValidationResult, setConfigValidationResult] = React.useState<any>(null);
  
  // Test interface state
  const [testCases, setTestCases] = React.useState<FlowTestCase[]>([]);
  const [selectedTestCase, setSelectedTestCase] = React.useState<FlowTestCase | null>(null);
  const [testResults, setTestResults] = React.useState<Record<string, TestRunResult>>({});
  const [isExecutingTest, setIsExecutingTest] = React.useState(false);
  const [isExecutingAllTests, setIsExecutingAllTests] = React.useState(false);

  // Load initial data when component mounts or selected element changes
  React.useEffect(() => {
    const resolveData = async () => {
      if (!selectedElement) {
        setInputData('{}');
        setConfigurationData('{}');
        setOutputData('{}');
        setDataLineage(null);
        setValidationResult(null);
        setConfigValidationResult(null);
        return;
      }

      try {
        // Determine if this is a trigger element
        const isTriggerElement = selectedElement.id === 'trigger' || 
                                selectedElement.data?.stepId === 'trigger' ||
                                selectedElement.data?.triggerType;

        let componentSchema = null;
        let flowDefinition = null;

        // Get flow definition for trigger handling
        const stepFlowFqn = currentFlowFqn || 
          (selectedElement.sourceType === 'systemFlowNode' && selectedElement.data?.targetFlowFqn 
            ? selectedElement.data.targetFlowFqn 
            : null);

        if (stepFlowFqn) {
          flowDefinition = moduleRegistry.getFlowDefinition(stepFlowFqn);
        }

        // Get component schema
        if (selectedElement.data?.componentSchema) {
          componentSchema = selectedElement.data.componentSchema;
        } else if (selectedElement.data?.resolvedComponentFqn) {
          componentSchema = moduleRegistry.getComponentSchema(selectedElement.data.resolvedComponentFqn);
        }

        // Load configuration data
        if (isTriggerElement && flowDefinition?.trigger) {
          // For triggers, use only the trigger configuration (not input data)
          const actualTriggerConfig = flowDefinition.trigger.config || {};
          if (Object.keys(actualTriggerConfig).length === 0 && componentSchema?.configSchema) {
            // Generate default config from schema if none exists
            const mockConfigData = generateMockDataFromSchema(componentSchema.configSchema, componentSchema.fqn);
            setConfigurationData(JSON.stringify(mockConfigData, null, 2));
          } else {
            setConfigurationData(JSON.stringify(actualTriggerConfig, null, 2));
          }
        } else {
          // For steps, use step configuration or generate from schema
          const currentConfig = selectedElement.data?.dslObject?.config || {};
          if (Object.keys(currentConfig).length === 0 && componentSchema?.configSchema) {
            // Generate default config if none exists
            const mockConfigData = generateMockDataFromSchema(componentSchema.configSchema, componentSchema.fqn);
            setConfigurationData(JSON.stringify(mockConfigData, null, 2));
          } else {
            setConfigurationData(JSON.stringify(currentConfig, null, 2));
          }
        }

        // Generate input data based on appropriate schema
        if (isTriggerElement && flowDefinition?.trigger) {
          // For triggers, generate external event input data based on input schema
          let triggerInputData: any = {};
          
          if (componentSchema?.inputSchema?.example) {
            // Use the example from the input schema - this represents external event data
            triggerInputData = componentSchema.inputSchema.example;
          } else if (componentSchema?.inputSchema) {
            // Generate from input schema - this is external event data
            triggerInputData = generateMockDataFromSchema(componentSchema.inputSchema, componentSchema.fqn);
          } else {
            // Fallback: generate basic external event data
            triggerInputData = generateBasicTriggerInputData(componentSchema?.fqn || 'StdLib.Trigger:Http');
          }
          
          // Ensure all required fields are populated for HTTP triggers
          if (componentSchema?.fqn === 'StdLib.Trigger:Http') {
            triggerInputData = ensureHttpTriggerInputFields(triggerInputData, flowDefinition.trigger.config);
          }
          
          setInputData(JSON.stringify(triggerInputData, null, 2));
        } else if (selectedElement.sourceType === 'flowNode' && selectedElement.data?.stepId) {
          // For step nodes, resolve input from previous step outputs
          if (!stepFlowFqn) {
            console.warn('No flow context available for step resolution');
            setInputData('{}');
            return;
          }

          try {
            const resolvedInput = await actions.resolveStepInputData(
              selectedElement.data.stepId, 
              stepFlowFqn
            );
            
            // Use the actual resolved input data, not the complex execution history
            if (resolvedInput.actualInputData) {
              setInputData(JSON.stringify(resolvedInput.actualInputData, null, 2));
            } else {
              // Fallback to schema-based generation
              if (componentSchema?.inputSchema) {
                const mockInputData = generateMockDataFromSchema(componentSchema.inputSchema);
                setInputData(JSON.stringify(mockInputData, null, 2));
              } else {
                setInputData('{}');
              }
            }
            
            // Resolve data lineage
            const lineage = await actions.resolveDataLineage(
              selectedElement.data.stepId,
              stepFlowFqn
            );
            setDataLineage(lineage);
          } catch (error) {
            console.warn('Failed to resolve step input, using schema-based generation:', error);
            // Fallback to schema-based generation
            if (componentSchema?.inputSchema) {
              const mockInputData = generateMockDataFromSchema(componentSchema.inputSchema);
              setInputData(JSON.stringify(mockInputData, null, 2));
            } else {
              setInputData('{}');
            }
          }
        } else {
          setInputData('{}');
        }

        // Generate output data based on appropriate schema
        if (isTriggerElement && flowDefinition?.trigger) {
          // For triggers, generate standardized output data based on output schema
          let triggerOutputData: any = {};
          
          if (componentSchema?.outputSchema?.example) {
            // Use the output schema example as base
            triggerOutputData = componentSchema.outputSchema.example;
          } else if (componentSchema?.outputSchema) {
            // Generate from output schema
            triggerOutputData = generateMockDataFromSchema(componentSchema.outputSchema, componentSchema.fqn);
          } else {
            // Fallback: generate basic standardized output
            triggerOutputData = generateBasicTriggerOutputData(componentSchema?.fqn || 'StdLib.Trigger:Http');
          }
          
          setOutputData(JSON.stringify(triggerOutputData, null, 2));
        } else if (componentSchema?.outputSchema) {
          // For steps, generate output data based on component output schema
          // Get the component config to help with dynamic output generation
          let componentConfig = {};
          try {
            componentConfig = JSON.parse(configurationData || '{}');
          } catch (e) {
            // Use default config if parsing fails
            componentConfig = {};
          }
          
          const mockOutputData = generateMockDataFromSchema(
            componentSchema.outputSchema, 
            componentSchema.fqn,
            componentConfig
          );
          setOutputData(JSON.stringify(mockOutputData, null, 2));
        } else {
          // Default output structure
          const defaultOutput = {
            result: `output_from_${selectedElement.data?.stepId || selectedElement.id}`,
            success: true,
            timestamp: new Date().toISOString()
          };
          setOutputData(JSON.stringify(defaultOutput, null, 2));
        }

        // Validate configuration data
        if (componentSchema?.configSchema) {
          try {
            const parsedConfig = JSON.parse(configurationData);
            const configValidation = propertiesTabService.validateConfig(parsedConfig, componentSchema.configSchema);
            setConfigValidationResult(configValidation);
          } catch (error) {
            setConfigValidationResult(null);
          }
        }

      } catch (error) {
        console.error('Error resolving data:', error);
        setInputData('{}');
        setConfigurationData('{}');
        setOutputData('{}');
        setDataLineage(null);
        setValidationResult(null);
        setConfigValidationResult(null);
      }
    };

    resolveData();
  }, [selectedElement, currentFlowFqn, moduleRegistry, actions]);

  // Helper function to generate basic trigger input data for external events
  const generateBasicTriggerInputData = (triggerType: string): any => {
    switch (triggerType) {
      case 'StdLib.Trigger:Http':
        return {
          url: "https://api.casino.com/api/users/onboard?source=web&campaign=summer2024",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "User-Agent": "CasinoApp/1.0",
            "X-Request-ID": "req-ihtqukro7",
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9"
          },
          queryParameters: {
            "source": "web",
            "campaign": "summer2024",
            "utm_source": "google",
            "utm_medium": "cpc"
          },
          body: {
            "email": "john.doe@example.com",
            "password": "SecurePass123!",
            "firstName": "John",
            "lastName": "Doe",
            "dateOfBirth": "1990-01-15",
            "country": "US",
            "phoneNumber": "+1234567890",
            "referralCode": "REF123",
            "acceptedTerms": true,
            "requestMetadata": {
              "timestamp": new Date().toISOString(),
              "requestId": "req-ihtqukro7",
              "userAgent": "CasinoApp/1.0",
              "ipAddress": "192.168.1.100"
            }
          },
          remoteAddress: "203.0.113.195",
          userAgent: "CasinoApp/1.0",
          timestamp: new Date().toISOString(),
          principal: null
        };
      case 'StdLib.Trigger:EventBus':
        return {
          event: {
            id: "event-abc123def456",
            type: "user.deposit.completed",
            source: "payment-service",
            timestamp: new Date().toISOString(),
            payload: {
              userId: "user-12345",
              amount: 100.00,
              currency: "USD",
              transactionId: "txn-abc123",
              paymentMethod: "credit_card",
              processingTime: 2340
            }
          }
        };
      case 'StdLib:Manual':
        return {
          initialData: {
            userId: "user-12345",
            action: "retry_kyc_verification",
            parameters: {
              skipDocumentUpload: false,
              forceManualReview: true,
              region: "US",
              tier: "bronze"
            },
            reason: "Customer requested KYC retry after document update",
            triggeredBy: "admin-user-789",
            timestamp: new Date().toISOString()
          }
        };
      default:
        return {};
    }
  };

  // Helper function to generate basic trigger output data (standardized format)
  const generateBasicTriggerOutputData = (triggerType: string): any => {
    switch (triggerType) {
      case 'StdLib.Trigger:Http':
        return {
          path: "/api/users/onboard",
          method: "POST",
          headers: {
            "content-type": "application/json",
            "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "user-agent": "CasinoApp/1.0",
            "x-request-id": "req-ihtqukro7",
            "accept": "application/json"
          },
          queryParameters: {
            "source": "web",
            "campaign": "summer2024",
            "utm_source": "google",
            "utm_medium": "cpc"
          },
          body: {
            "email": "john.doe@example.com",
            "password": "SecurePass123!",
            "firstName": "John",
            "lastName": "Doe",
            "dateOfBirth": "1990-01-15",
            "country": "US",
            "phoneNumber": "+1234567890",
            "referralCode": "REF123",
            "acceptedTerms": true,
            "requestMetadata": {
              "timestamp": new Date().toISOString(),
              "requestId": "req-ihtqukro7",
              "userAgent": "CasinoApp/1.0",
              "ipAddress": "192.168.1.100"
            }
          },
          remoteAddress: "203.0.113.195",
          userAgent: "CasinoApp/1.0",
          timestamp: new Date().toISOString(),
          principal: null
        };
      case 'StdLib.Trigger:EventBus':
        return {
          event: {
            id: "event-abc123def456",
            type: "user.deposit.completed",
            source: "payment-service",
            timestamp: new Date().toISOString(),
            payload: {
              userId: "user-12345",
              amount: 100.00,
              currency: "USD",
              transactionId: "txn-abc123",
              paymentMethod: "credit_card",
              processingTime: 2340
            }
          }
        };
      case 'StdLib:Manual':
        return {
          initialData: {
            userId: "user-12345",
            action: "retry_kyc_verification",
            parameters: {
              skipDocumentUpload: false,
              forceManualReview: true,
              region: "US",
              tier: "bronze"
            },
            reason: "Customer requested KYC retry after document update",
            triggeredBy: "admin-user-789",
            timestamp: new Date().toISOString()
          }
        };
      default:
        return {};
    }
  };

  // Helper function to ensure HTTP trigger input has all required fields
  const ensureHttpTriggerInputFields = (inputData: any, triggerConfig: any): any => {
    const enhanced = { ...inputData };
    
    // Ensure URL is present and properly formatted
    if (!enhanced.url) {
      const path = triggerConfig?.path || "/api/users/onboard";
      const baseUrl = "https://api.casino.com";
      enhanced.url = `${baseUrl}${path}?source=web&campaign=summer2024`;
    }
    
    // Ensure method is present
    if (!enhanced.method) {
      enhanced.method = triggerConfig?.method || "POST";
    }
    
    // Ensure headers are present and populated
    if (!enhanced.headers || Object.keys(enhanced.headers).length === 0) {
      enhanced.headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "User-Agent": "CasinoApp/1.0",
        "X-Request-ID": "req-ihtqukro7",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9"
      };
    }
    
    // Ensure queryParameters are present
    if (!enhanced.queryParameters) {
      try {
        const url = new URL(enhanced.url);
        const queryParams: Record<string, string> = {};
        url.searchParams.forEach((value, key) => {
          queryParams[key] = value;
        });
        enhanced.queryParameters = queryParams;
      } catch (e) {
        enhanced.queryParameters = {
          "source": "web",
          "campaign": "summer2024"
        };
      }
    }
    
    // Ensure body is present for POST/PUT methods
    if (!enhanced.body && (enhanced.method === "POST" || enhanced.method === "PUT")) {
      // Use requestSchema from trigger config if available
      if (triggerConfig?.requestSchema) {
        enhanced.body = generateMockDataFromSchema(triggerConfig.requestSchema);
      } else {
        enhanced.body = {
          "email": "john.doe@example.com",
          "password": "SecurePass123!",
          "firstName": "John",
          "lastName": "Doe",
          "dateOfBirth": "1990-01-15",
          "country": "US",
          "phoneNumber": "+1234567890",
          "referralCode": "REF123",
          "acceptedTerms": true,
          "requestMetadata": {
            "timestamp": new Date().toISOString(),
            "requestId": "req-ihtqukro7",
            "userAgent": "CasinoApp/1.0",
            "ipAddress": "192.168.1.100"
          }
        };
      }
    }
    
    // Ensure remoteAddress is present
    if (!enhanced.remoteAddress) {
      enhanced.remoteAddress = "203.0.113.195";
    }
    
    // Ensure userAgent is present
    if (!enhanced.userAgent) {
      enhanced.userAgent = "CasinoApp/1.0";
    }
    
    // Ensure timestamp is present
    if (!enhanced.timestamp) {
      enhanced.timestamp = new Date().toISOString();
    }
    
    // Ensure principal is present (can be null for unauthenticated requests)
    if (enhanced.principal === undefined) {
      enhanced.principal = null;
    }
    
    return enhanced;
  };

  const generateMockDataFromSchema = (schema: any, componentType?: string, config?: any): any => {
    if (!schema || typeof schema !== 'object') return {};
    
    // Handle trigger components specially - use schema examples or generate basic output
    if (componentType && componentType.includes('Trigger')) {
      if (schema.example) {
        return schema.example;
      }
      // Generate basic trigger output based on type
      switch (componentType) {
        case 'StdLib.Trigger:Http':
          return {
            path: "/api/users/onboard",
            method: "POST",
            headers: { "content-type": "application/json" },
            queryParameters: {},
            body: null,
            remoteAddress: "203.0.113.195",
            userAgent: "Mozilla/5.0",
            timestamp: new Date().toISOString(),
            principal: null
          };
        case 'StdLib.Trigger:EventBus':
          return {
            event: {
              id: "event-123",
              type: "sample.event",
              source: "sample-service",
              timestamp: new Date().toISOString(),
              payload: {}
            }
          };
        case 'StdLib:Manual':
          return {
            initialData: {}
          };
        default:
          return {};
      }
    }
    
    // First check if schema has an example property and use it
    if (schema.example) {
      return schema.example;
    }
    
    // Handle dynamic output schemas for specific component types
    if (componentType && schema.type === 'object' && schema.additionalProperties) {
      switch (componentType) {
        case 'StdLib:Fork':
          // Generate dynamic output ports based on config.outputNames
          const forkResult: any = {};
          if (config?.outputNames && Array.isArray(config.outputNames)) {
            config.outputNames.forEach((outputName: string) => {
              forkResult[outputName] = { data: `sample_data_for_${outputName}`, timestamp: new Date().toISOString() };
            });
          } else {
            // Default fork outputs
            forkResult.output1 = { data: 'sample_data_for_output1', timestamp: new Date().toISOString() };
            forkResult.output2 = { data: 'sample_data_for_output2', timestamp: new Date().toISOString() };
          }
          // Add any fixed properties from schema
          if (schema.properties) {
            Object.entries(schema.properties).forEach(([key, propSchema]: [string, any]) => {
              forkResult[key] = generateMockDataFromSchema(propSchema);
            });
          }
          return forkResult;
          
        case 'StdLib:Switch':
          // Generate dynamic output ports based on config.cases and defaultOutputName
          const switchResult: any = {};
          if (config?.cases && Array.isArray(config.cases)) {
            // Only populate one output port (the first case for demo)
            const firstCase = config.cases[0];
            if (firstCase?.outputName) {
              switchResult[firstCase.outputName] = { data: `sample_data_for_${firstCase.outputName}`, timestamp: new Date().toISOString() };
            }
          }
          if (config?.defaultOutputName) {
            // Don't populate default output if a case matched
            if (!config?.cases?.length) {
              switchResult[config.defaultOutputName] = { data: `sample_data_for_${config.defaultOutputName}`, timestamp: new Date().toISOString() };
            }
          }
          // Add any fixed properties from schema
          if (schema.properties) {
            Object.entries(schema.properties).forEach(([key, propSchema]: [string, any]) => {
              switchResult[key] = generateMockDataFromSchema(propSchema);
            });
          }
          return switchResult;
          
        case 'StdLib:FilterData':
          // Generate dynamic output ports based on config.matchOutput and noMatchOutput
          const filterResult: any = {};
          const matchOutput = config?.matchOutput || 'matchOutput';
          const noMatchOutput = config?.noMatchOutput || 'noMatchOutput';
          
          // Simulate a match scenario
          filterResult[matchOutput] = { data: 'sample_matched_data', timestamp: new Date().toISOString() };
          filterResult[noMatchOutput] = null; // No data on non-match port
          
          // Add any fixed properties from schema
          if (schema.properties) {
            Object.entries(schema.properties).forEach(([key, propSchema]: [string, any]) => {
              filterResult[key] = generateMockDataFromSchema(propSchema);
            });
          }
          return filterResult;
          
        case 'StdLib:MergeStreams':
          // Generate single output port based on config.mergedOutputName
          const mergeResult: any = {};
          const mergedOutputName = config?.mergedOutputName || 'mergedOutput';
          mergeResult[mergedOutputName] = { data: 'sample_merged_data', timestamp: new Date().toISOString() };
          
          // Add any fixed properties from schema
          if (schema.properties) {
            Object.entries(schema.properties).forEach(([key, propSchema]: [string, any]) => {
              mergeResult[key] = generateMockDataFromSchema(propSchema);
            });
          }
          return mergeResult;
      }
    }
    
    if (schema.type === 'object' && schema.properties) {
      const result: any = {};
      Object.entries(schema.properties).forEach(([key, propSchema]: [string, any]) => {
        // Check for example first, then default, then generate
        if (propSchema.example !== undefined) {
          result[key] = propSchema.example;
        } else if (propSchema.default !== undefined) {
          result[key] = propSchema.default;
        } else if (propSchema.type === 'string') {
          result[key] = `sample_${key}`;
        } else if (propSchema.type === 'number' || propSchema.type === 'integer') {
          result[key] = 42;
        } else if (propSchema.type === 'boolean') {
          result[key] = true;
        } else if (propSchema.type === 'array') {
          result[key] = [generateMockDataFromSchema(propSchema.items)];
        } else if (propSchema.type === 'object') {
          result[key] = generateMockDataFromSchema(propSchema);
        } else {
          result[key] = null;
        }
      });
      return result;
    }
    
    // If schema has example at root level, use it
    if (schema.example) {
      return schema.example;
    }
    
    return {};
  };

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

  // Validate configuration data when it changes
  React.useEffect(() => {
    if (selectedElement && configurationData) {
      let componentSchema = null;
      if (selectedElement.data?.componentSchema) {
        componentSchema = selectedElement.data.componentSchema;
      } else if (selectedElement.data?.resolvedComponentFqn) {
        componentSchema = moduleRegistry.getComponentSchema(selectedElement.data.resolvedComponentFqn);
      }

      if (componentSchema?.configSchema) {
        try {
          const parsedConfig = JSON.parse(configurationData);
          const validation = propertiesTabService.validateConfig(parsedConfig, componentSchema.configSchema);
          setConfigValidationResult(validation);
        } catch (error) {
          setConfigValidationResult({
            isValid: false,
            errors: [{
              fieldPath: 'root',
              message: 'Invalid JSON format',
              expectedType: 'object',
              actualValue: configurationData,
              schemaRule: 'format'
            }],
            warnings: []
          });
        }
      }
    }
  }, [configurationData, selectedElement, moduleRegistry, actions]);

  // Update output data when input data or configuration changes (for triggers)
  React.useEffect(() => {
    console.log('🔄 Trigger output effect triggered:', { selectedElement: selectedElement?.id, hasInputData: !!inputData, hasConfigData: !!configurationData });
    if (selectedElement && inputData && configurationData) {
      const isTriggerElement = selectedElement.id === 'trigger' || 
                              selectedElement.data?.stepId === 'trigger' ||
                              selectedElement.data?.triggerType;

      if (isTriggerElement) {
        try {
          const parsedInput = JSON.parse(inputData);
          const parsedConfig = JSON.parse(configurationData);
          
          let componentSchema = null;
          if (selectedElement.data?.componentSchema) {
            componentSchema = selectedElement.data.componentSchema;
          } else if (selectedElement.data?.resolvedComponentFqn) {
            componentSchema = moduleRegistry.getComponentSchema(selectedElement.data.resolvedComponentFqn);
          }

          // Generate standardized output data from input data for triggers
          let triggerOutputData: any = {};
          
          if (componentSchema?.fqn === 'StdLib.Trigger:Http') {
            // For HTTP triggers, process standard HTTP request input into standardized output
            // Input: Standard HTTP request format (url, method, headers, body)
            // Configuration: DSL trigger config (path patterns, method constraints, etc.)
            // Output: Standardized format with parsed components
            
            const inputUrl = parsedInput.url || "http://localhost/api/trigger";
            const inputMethod = parsedInput.method || parsedConfig.method || "POST";
            const inputHeaders = parsedInput.headers || {};
            const inputBody = parsedInput.body;
            
            // Parse URL to extract path and query parameters
            const queryParams: Record<string, string> = {};
            let extractedPath = parsedConfig.path || "/api/users/onboard";
            
            try {
              const url = new URL(inputUrl);
              extractedPath = url.pathname;
              
              // Extract query parameters from URL
              url.searchParams.forEach((value, key) => {
                queryParams[key] = value;
              });
              console.log('🔍 Extracted query params from URL:', inputUrl, '→', queryParams);
            } catch (e) {
              console.warn('Failed to parse URL, trying manual parsing:', e);
              
              // Fallback: manual URL parsing
              if (inputUrl.includes('?')) {
                try {
                  const [urlPart, queryString] = inputUrl.split('?');
                  
                  // Extract path from URL part
                  const urlObj = new URL(urlPart);
                  extractedPath = urlObj.pathname;
                  
                  // Parse query string manually
                  if (queryString) {
                    const paramPairs = queryString.split('&');
                    paramPairs.forEach(pair => {
                      const [key, value] = pair.split('=');
                      if (key) {
                        queryParams[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
                      }
                    });
                  }
                } catch (manualParseError) {
                  console.warn('Manual URL parsing also failed:', manualParseError);
                }
              }
            }
            
            // Process headers - normalize keys to lowercase for consistency
            const processedHeaders: Record<string, string> = {};
            Object.entries(inputHeaders).forEach(([key, value]) => {
              processedHeaders[key.toLowerCase()] = String(value);
            });
            
            // Parse body based on content-type and configuration
            let processedBody = inputBody;
            const contentType = processedHeaders["content-type"];
            if (contentType && contentType.includes("application/json") && typeof inputBody === 'string') {
              try {
                processedBody = JSON.parse(inputBody);
              } catch (parseError) {
                // Keep as string if JSON parsing fails
                processedBody = inputBody;
              }
            }
            
            // Apply configuration-based processing
            let finalPath = extractedPath;
            if (parsedConfig.pathPattern) {
              // Apply path pattern matching/validation if configured
              // For now, use extracted path as-is
              finalPath = extractedPath;
            }
            
            triggerOutputData = {
              path: finalPath,
              method: inputMethod.toUpperCase(),
              headers: processedHeaders,
              queryParameters: queryParams,
              body: processedBody,
              remoteAddress: parsedInput.remoteAddress || "127.0.0.1",
              userAgent: parsedInput.userAgent || processedHeaders["user-agent"] || "Unknown",
              timestamp: parsedInput.timestamp || new Date().toISOString(),
              principal: parsedInput.principal || null
            };
          } else if (componentSchema?.fqn === 'StdLib.Trigger:EventBus') {
            // For EventBus triggers, output is same as input (event passthrough)
            triggerOutputData = parsedInput;
          } else if (componentSchema?.fqn === 'StdLib:Manual') {
            // For Manual triggers, output is same as input (initialData passthrough)
            triggerOutputData = parsedInput;
          } else {
            // For other trigger types, use input as output
            triggerOutputData = parsedInput;
          }
          
          console.log('🎯 Setting trigger output data:', triggerOutputData);
          setOutputData(JSON.stringify(triggerOutputData, null, 2));
        } catch (error) {
          // If parsing fails, don't update output
          console.warn('Failed to update output data:', error);
        }
      }
    }
  }, [inputData, configurationData, selectedElement, moduleRegistry]);

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
        // For trigger execution, use runDebugExecution with 'trigger' to get progressive execution
        console.log('🎯 Executing entire flow from trigger with input:', validation.data);
        result = await actions.runDebugExecution('trigger', validation.data, {
          useMocks: true,
          timeoutMs: 30000
        });
      } else {
        // For step execution, run debug execution up to that step
        console.log('🎯 Executing step:', selectedElement.id, 'with input:', validation.data);
        result = await actions.runDebugExecution(selectedElement.id, validation.data, {
          useMocks: true,
          timeoutMs: 30000
        });
      }
      
      setExecutionResults(result);

      // Update output data with execution results
      if (result && typeof result === 'object') {
        if ('outputData' in result && result.outputData) {
          setOutputData(JSON.stringify(result.outputData, null, 2));
        } else if ('steps' in result && Array.isArray(result.steps)) {
          // Find the output for the current step
          const currentStepResult = result.steps.find((step: any) => step.stepId === selectedElement.data?.stepId);
          if (currentStepResult?.outputData) {
            setOutputData(JSON.stringify(currentStepResult.outputData, null, 2));
          }
        } else if ('finalOutput' in result && result.finalOutput) {
          setOutputData(JSON.stringify(result.finalOutput, null, 2));
        }
      }
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
        // For trigger nodes, generate external event input data
        const flowDef = moduleRegistry.getFlowDefinition(currentFlowFqn);
        if (flowDef?.trigger) {
          let componentSchema = null;
          if (selectedElement.data?.componentSchema) {
            componentSchema = selectedElement.data.componentSchema;
          } else if (selectedElement.data?.resolvedComponentFqn) {
            componentSchema = moduleRegistry.getComponentSchema(selectedElement.data.resolvedComponentFqn);
          }
          
          // Generate test data based on trigger type and data type
          if (componentSchema?.fqn === 'StdLib.Trigger:Http') {
            generatedData = generateHttpTriggerTestData(dataType, flowDef.trigger.config);
          } else if (componentSchema?.fqn === 'StdLib.Trigger:EventBus') {
            generatedData = generateEventBusTriggerTestData(dataType);
          } else if (componentSchema?.fqn === 'StdLib:Manual') {
            generatedData = generateManualTriggerTestData(dataType);
          } else {
            // Fallback to basic generation
            generatedData = generateBasicTriggerInputData(componentSchema?.fqn || 'StdLib.Trigger:Http');
          }
        }
      } else if (selectedElement.sourceType === 'flowNode' && selectedElement.data?.stepId) {
        // For step nodes, generate input data based on component schema
        let componentSchema = null;
        if (selectedElement.data?.componentSchema) {
          componentSchema = selectedElement.data.componentSchema;
        } else if (selectedElement.data?.resolvedComponentFqn) {
          componentSchema = moduleRegistry.getComponentSchema(selectedElement.data.resolvedComponentFqn);
        }
        
        if (componentSchema?.inputSchema) {
          // Generate test data based on input schema and data type
          generatedData = generateStepTestData(componentSchema, dataType);
        }
      }

      if (generatedData) {
        setInputData(JSON.stringify(generatedData, null, 2));
      }
    } catch (error) {
      console.error('Error generating test data:', error);
    }
  };

  // Helper function to generate HTTP trigger test data
  const generateHttpTriggerTestData = (dataType: 'happy_path' | 'fork_paths' | 'error_cases', triggerConfig: any) => {
    const baseData = generateBasicTriggerInputData('StdLib.Trigger:Http');
    
    switch (dataType) {
      case 'happy_path':
        return baseData;
      case 'fork_paths':
        // Generate data that would trigger different fork paths
        return {
          ...baseData,
          body: {
            ...baseData.body,
            country: "CA", // Different country for geo-compliance fork
            referralCode: "SPECIAL123" // Special referral for bonus fork
          }
        };
      case 'error_cases':
        // Generate data that would cause validation errors
        return {
          ...baseData,
          body: {
            email: "invalid-email", // Invalid email format
            firstName: "", // Empty required field
            dateOfBirth: "2010-01-01", // Underage
            country: "XX" // Invalid country code
          }
        };
      default:
        return baseData;
    }
  };

  // Helper function to generate EventBus trigger test data
  const generateEventBusTriggerTestData = (dataType: 'happy_path' | 'fork_paths' | 'error_cases') => {
    const baseData = generateBasicTriggerInputData('StdLib.Trigger:EventBus');
    
    switch (dataType) {
      case 'happy_path':
        return baseData;
      case 'fork_paths':
        return {
          event: {
            ...baseData.event,
            type: "user.withdrawal.requested",
            payload: {
              userId: "user-12345",
              amount: 500.00,
              currency: "USD",
              method: "bank_transfer"
            }
          }
        };
      case 'error_cases':
        return {
          event: {
            ...baseData.event,
            type: "user.deposit.failed",
            payload: {
              userId: "user-12345",
              error: "insufficient_funds",
              amount: -100.00 // Invalid negative amount
            }
          }
        };
      default:
        return baseData;
    }
  };

  // Helper function to generate Manual trigger test data
  const generateManualTriggerTestData = (dataType: 'happy_path' | 'fork_paths' | 'error_cases') => {
    const baseData = generateBasicTriggerInputData('StdLib:Manual');
    
    switch (dataType) {
      case 'happy_path':
        return baseData;
      case 'fork_paths':
        return {
          initialData: {
            ...baseData.initialData,
            action: "force_tier_upgrade",
            parameters: {
              targetTier: "gold",
              bypassChecks: true
            }
          }
        };
      case 'error_cases':
        return {
          initialData: {
            userId: "", // Empty user ID
            action: "invalid_action",
            parameters: null
          }
        };
      default:
        return baseData;
    }
  };

  // Helper function to generate step test data
  const generateStepTestData = (componentSchema: any, dataType: 'happy_path' | 'fork_paths' | 'error_cases') => {
    const baseData = generateMockDataFromSchema(componentSchema.inputSchema);
    
    switch (dataType) {
      case 'happy_path':
        return baseData;
      case 'fork_paths':
        // Modify data to trigger different paths
        if (componentSchema.fqn === 'StdLib:Switch' || componentSchema.fqn === 'StdLib:FilterData') {
          return {
            ...baseData,
            data: {
              ...baseData.data,
              condition: true,
              alternativeValue: "fork_path_data"
            }
          };
        }
        return baseData;
      case 'error_cases':
        // Generate data that would cause errors
        return {
          ...baseData,
          data: null // Null data to trigger validation errors
        };
      default:
        return baseData;
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
      <div style={{ 
        textAlign: 'center', 
        color: '#6B7280', 
        padding: '24px',
        backgroundColor: '#F9FAFB',
        borderRadius: '8px',
        border: '1px solid #E5E7EB'
      }}>
        <div style={{ fontSize: '16px', marginBottom: '8px' }}>🔍</div>
        <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>No component selected</p>
        <p style={{ fontSize: '14px', margin: 0, color: '#9CA3AF' }}>
          Select a component or trigger to debug and test
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with section tabs */}
      <div style={{ 
        padding: '16px',
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: 'white'
      }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            onClick={() => setActiveSection('debug')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: activeSection === 'debug' ? '#3B82F6' : '#F3F4F6',
              color: activeSection === 'debug' ? 'white' : '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeSection === 'debug' ? '0 2px 4px rgba(59, 130, 246, 0.3)' : 'none'
            }}
          >
            Debug
          </button>
          <button
            onClick={() => setActiveSection('test')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: activeSection === 'test' ? '#3B82F6' : '#F3F4F6',
              color: activeSection === 'test' ? 'white' : '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeSection === 'test' ? '0 2px 4px rgba(59, 130, 246, 0.3)' : 'none'
            }}
          >
            Test
          </button>
        </div>

        {/* Component Info - in rows */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '4px', 
          fontSize: '13px', 
          color: '#6B7280',
          backgroundColor: '#F9FAFB',
          padding: '8px 12px',
          borderRadius: '6px'
        }}>
          <div><strong>Element:</strong> {selectedElement.id}</div>
          <div><strong>Type:</strong> {selectedElement.sourceType}</div>
          {selectedElement.data?.resolvedComponentFqn && (
            <div><strong>Component:</strong> {selectedElement.data.resolvedComponentFqn}</div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {activeSection === 'debug' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Input Data Section */}
            <div>
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
                      backgroundColor: '#10B981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 2px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    Happy Path
                  </button>
                  <button
                    onClick={() => generateTestData('fork_paths')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      backgroundColor: '#F59E0B',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 2px rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    Fork Paths
                  </button>
                  <button
                    onClick={() => generateTestData('error_cases')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      backgroundColor: '#EF4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 2px rgba(239, 68, 68, 0.3)'
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
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                  fontSize: '12px',
                  border: `1px solid ${validationResult && !validationResult.isValid ? '#EF4444' : '#D1D5DB'}`,
                  borderRadius: '6px',
                  padding: '8px',
                  resize: 'vertical',
                  backgroundColor: 'white'
                }}
                placeholder="Enter JSON input data..."
              />
              
              {validationResult && !validationResult.isValid && (
                <div style={{ 
                  color: '#EF4444', 
                  fontSize: '12px', 
                  marginTop: '4px',
                  padding: '8px',
                  backgroundColor: '#FEF2F2',
                  borderRadius: '4px',
                  border: '1px solid #FECACA'
                }}>
                  {validationResult.errors && Array.isArray(validationResult.errors) ? (
                    validationResult.errors.map((error: any, index: number) => (
                      <div key={index} style={{ marginBottom: '2px' }}>
                        {error.fieldPath}: {error.message}
                      </div>
                    ))
                  ) : (
                    <div>Validation failed</div>
                  )}
                </div>
              )}
            </div>

            {/* Configuration Data Section */}
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Configuration Data</h4>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  Component configuration and settings
                </div>
              </div>
              
              <textarea
                value={configurationData}
                onChange={(e) => setConfigurationData(e.target.value)}
                style={{
                  width: '100%',
                  height: '120px',
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                  fontSize: '12px',
                  border: `1px solid ${configValidationResult && !configValidationResult.isValid ? '#EF4444' : '#D1D5DB'}`,
                  borderRadius: '6px',
                  padding: '8px',
                  resize: 'vertical',
                  backgroundColor: 'white'
                }}
                placeholder="Enter JSON configuration data..."
              />
              
              {configValidationResult && !configValidationResult.isValid && (
                <div style={{ 
                  color: '#EF4444', 
                  fontSize: '12px', 
                  marginTop: '4px',
                  padding: '8px',
                  backgroundColor: '#FEF2F2',
                  borderRadius: '4px',
                  border: '1px solid #FECACA'
                }}>
                  {configValidationResult.errors && Array.isArray(configValidationResult.errors) ? (
                    configValidationResult.errors.map((error: any, index: number) => (
                      <div key={index} style={{ marginBottom: '2px' }}>
                        {error.fieldPath}: {error.message}
                      </div>
                    ))
                  ) : (
                    <div>Configuration validation failed</div>
                  )}
                </div>
              )}
            </div>

            {/* Output Data Section */}
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Output Data</h4>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  Expected or actual execution output
                </div>
              </div>
              
              <textarea
                value={outputData}
                readOnly
                style={{
                  width: '100%',
                  height: '120px',
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                  fontSize: '12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  padding: '8px',
                  resize: 'vertical',
                  backgroundColor: '#F9FAFB',
                  color: '#374151'
                }}
                placeholder="Output data will appear here after execution..."
              />
            </div>

            {/* Data Lineage Section */}
            {dataLineage && (
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Data Lineage</h4>
                <div style={{ 
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '12px'
                }}>
                  <div style={{ marginBottom: '8px', fontWeight: '500' }}>
                    Flow Path:
                  </div>
                  {dataLineage.paths && dataLineage.paths.length > 0 ? (
                    dataLineage.paths.map((path: any, index: number) => (
                      <div key={`${path.targetStepId}-${path.targetInputField}-${index}`} style={{ 
                        marginLeft: `${index * 16}px`,
                        marginBottom: '6px',
                        padding: '8px',
                        backgroundColor: 'white',
                        borderRadius: '4px',
                        border: '1px solid #E5E7EB'
                      }}>
                        <div style={{ fontWeight: '500', color: '#374151' }}>{path.targetStepId} → {path.targetInputField}</div>
                        <div style={{ color: '#6B7280', fontSize: '11px' }}>Source: {path.source?.sourceType || 'unknown'}</div>
                        {path.source?.id && (
                          <div style={{ color: '#6B7280', fontSize: '11px' }}>From: {path.source.id}</div>
                        )}
                        {path.source?.dataPath && (
                          <div style={{ color: '#6B7280', fontSize: '11px' }}>
                            Path: {path.source.dataPath}
                          </div>
                        )}
                        {path.transformationExpression && (
                          <div style={{ color: '#6B7280', fontSize: '11px' }}>
                            Expression: {path.transformationExpression}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#6B7280', fontStyle: 'italic' }}>
                      No data lineage paths found for this step.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Execution Controls */}
            <div>
              <button
                onClick={executeFlow}
                disabled={isExecuting || (validationResult && !validationResult.isValid)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: isExecuting ? '#9CA3AF' : '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isExecuting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  boxShadow: isExecuting ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.3)'
                }}
              >
                {isExecuting ? 'Executing...' : `Execute from ${selectedElement.data?.stepId || selectedElement.id}`}
              </button>
            </div>
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
    // const templates = generateTestCaseTemplates(testCase.flowFqn, {
    //   getFlowDefinition: () => null,
    //   getAllLoadedModules: () => [],
    //   getLoadedModule: () => null,
    //   resolveComponentTypeInfo: () => null,
    //   getComponentSchema: () => null,
    //   getNamedComponentDefinition: () => null,
    //   getContextDefinition: () => null,
    //   getFlowDefinitionDsl: () => null,
    //   getNamedComponentDefinitionDsl: () => null
    // });
    
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