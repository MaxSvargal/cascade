// Main CascadeFlowVisualizer React Component
// From cfv_internal_code.CascadeFlowVisualizerComponent_Main

import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atom } from 'jotai';
import ReactFlow, { 
  ReactFlowProvider, 
  Controls, 
  Background, 
  MiniMap,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge
} from 'reactflow';

import { CascadeFlowVisualizerProps, SelectedElement } from '@/models/cfv_models_generated';
import { useModuleRegistryInitializer } from '@/hooks/useModuleRegistryInitializer';
import { 
  dslModuleRepresentationsAtom, 
  componentSchemasAtom 
} from '@/state/moduleRegistryAtoms';
import { 
  currentFlowFqnAtom, 
  systemViewActiveAtom, 
  selectedElementAtom 
} from '@/state/navigationAtoms';
import { 
  generateFlowDetailGraphData, 
  generateSystemOverviewGraphData,
  GraphData 
} from '@/services/graphBuilderService';
import { createModuleRegistryInterface } from '@/services/moduleRegistryService';
import { applyConfigChanges, createSavePayload } from '@/services/yamlReconstructionService';

import 'reactflow/dist/style.css';

// Derived atom for current graph data
const currentGraphDataAtom = atom<GraphData>((get) => {
  const currentFlowFqn = get(currentFlowFqnAtom);
  const systemViewActive = get(systemViewActiveAtom);
  const dslModuleRepresentations = get(dslModuleRepresentationsAtom);
  const componentSchemas = get(componentSchemasAtom);

  // Create module registry interface
  const moduleRegistry = createModuleRegistryInterface((atomRef) => {
    if (atomRef === 'dslModuleRepresentationsAtom') return dslModuleRepresentations;
    if (atomRef === 'componentSchemasAtom') return componentSchemas;
    return {};
  });

  // Simple context variable parser (would be replaced by props.parseContextVariables)
  const parseContextVars = (value: string): string[] => {
    const matches = value.match(/\$\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(2, -1)) : [];
  };

  // Return empty graph data - actual generation will be handled in useEffect
  return { nodes: [], edges: [] };
});

const CascadeFlowVisualizer: React.FC<CascadeFlowVisualizerProps> = (props) => {
  // Initialize module registry from props
  useModuleRegistryInitializer({
    initialModules: props.initialModules,
    componentSchemas: props.componentSchemas
  });

  // State atoms
  const [currentFlowFqn, setCurrentFlowFqn] = useAtom(currentFlowFqnAtom);
  const [systemViewActive, setSystemViewActive] = useAtom(systemViewActiveAtom);
  const [selectedElement, setSelectedElement] = useAtom(selectedElementAtom);
  const dslModuleRepresentations = useAtomValue(dslModuleRepresentationsAtom);
  const componentSchemas = useAtomValue(componentSchemasAtom);

  // React Flow state management
  const [nodes, setNodes] = React.useState<Node[]>([]);
  const [edges, setEdges] = React.useState<Edge[]>([]);
  const [isGeneratingGraph, setIsGeneratingGraph] = React.useState(false);
  const [expandedModules, setExpandedModules] = React.useState<Set<string>>(new Set());
  const [activeInspectorTab, setActiveInspectorTab] = React.useState<'properties' | 'source' | 'debugtest'>('properties');

  // Add ref to prevent infinite loops in onViewChange
  const isCallingOnViewChange = useRef(false);

  // Toggle module expansion
  const toggleModuleExpansion = useCallback((moduleFqn: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleFqn)) {
        newSet.delete(moduleFqn);
      } else {
        newSet.add(moduleFqn);
      }
      return newSet;
    });
  }, []);

  // Generate graph data when dependencies change
  useEffect(() => {
    const generateGraphData = async () => {
      setIsGeneratingGraph(true);
      
      try {
        // Create module registry interface
        const moduleRegistry = createModuleRegistryInterface((atomRef) => {
          if (atomRef === 'dslModuleRepresentationsAtom') return dslModuleRepresentations;
          if (atomRef === 'componentSchemasAtom') return componentSchemas;
          return {};
        });

        // Simple context variable parser (would be replaced by props.parseContextVariables)
        const parseContextVars = (value: string): string[] => {
          const matches = value.match(/\$\{([^}]+)\}/g);
          return matches ? matches.map(match => match.slice(2, -1)) : [];
        };

        let graphData: GraphData = { nodes: [], edges: [] };

        if (systemViewActive) {
          graphData = await generateSystemOverviewGraphData(moduleRegistry, parseContextVars, true, handleFlowNavigation);
        } else if (currentFlowFqn) {
          graphData = await generateFlowDetailGraphData({
            flowFqn: currentFlowFqn,
            mode: props.mode || 'design',
            moduleRegistry,
            parseContextVarsFn: parseContextVars,
            componentSchemas,
            traceData: props.traceData
          });
        }

        setNodes(graphData.nodes);
        setEdges(graphData.edges);
      } catch (error) {
        console.error('Failed to generate graph data:', error);
        setNodes([]);
        setEdges([]);
      } finally {
        setIsGeneratingGraph(false);
      }
    };

    generateGraphData();
  }, [currentFlowFqn, systemViewActive, dslModuleRepresentations, componentSchemas, props.mode, props.traceData]);

  // Initialize from design data
  useEffect(() => {
    if (props.designData) {
      if (props.designData.initialFlowFqn) {
        setCurrentFlowFqn(props.designData.initialFlowFqn);
      }
      if (props.designData.initialViewMode) {
        setSystemViewActive(props.designData.initialViewMode === 'systemOverview');
      }
    }
  }, [props.designData, setCurrentFlowFqn, setSystemViewActive]);

  // Effect for props.onViewChange
  useEffect(() => {
    if (props.onViewChange && !isCallingOnViewChange.current) {
      isCallingOnViewChange.current = true;
      props.onViewChange({
        mode: props.mode,
        currentFlowFqn: currentFlowFqn || undefined,
        systemViewActive
      });
      // Reset the flag after the call
      setTimeout(() => {
        isCallingOnViewChange.current = false;
      }, 0);
    }
  }, [props.mode, currentFlowFqn, systemViewActive, props.onViewChange]);

  // Effect for props.onElementSelect
  useEffect(() => {
    if (props.onElementSelect) {
      props.onElementSelect(selectedElement);
    }
  }, [selectedElement, props.onElementSelect]);

  // Node click handler
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Prevent default navigation for step nodes - they should open edit dialog instead
    if (node.type === 'stepNode' || node.type === 'triggerNode') {
      const newSelectedElement: SelectedElement = {
        sourceType: 'flowNode',
        id: node.id,
        data: node.data,
        moduleFqn: currentFlowFqn?.split('.').slice(0, -1).join('.')
      };
      setSelectedElement(newSelectedElement);
      return;
    }

    // Handle system flow node navigation
    if (node.type === 'systemFlowNode' && node.data?.navigatable && node.data?.onFlowNodeClick) {
      node.data.onFlowNodeClick(node.data.targetFlowFqn);
      return;
    }

    // Default selection behavior for other node types
    const newSelectedElement: SelectedElement = {
      sourceType: node.type === 'systemFlowNode' ? 'systemFlowNode' : 'flowNode',
      id: node.id,
      data: node.data,
      moduleFqn: currentFlowFqn?.split('.').slice(0, -1).join('.')
    };
    setSelectedElement(newSelectedElement);
  }, [currentFlowFqn, setSelectedElement]);

  // Flow navigation handler
  const handleFlowNavigation = useCallback((flowFqn: string) => {
    setCurrentFlowFqn(flowFqn);
    setSystemViewActive(false);
  }, [setCurrentFlowFqn, setSystemViewActive]);

  // System view toggle
  const handleSystemViewToggle = useCallback(() => {
    setSystemViewActive(!systemViewActive);
    setCurrentFlowFqn(null);
  }, [systemViewActive, setSystemViewActive, setCurrentFlowFqn]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  // Module registry interface for inspector tabs
  const moduleRegistry = useMemo(() => {
    return createModuleRegistryInterface((atomRef) => {
      if (atomRef === 'dslModuleRepresentationsAtom') return dslModuleRepresentations;
      if (atomRef === 'componentSchemasAtom') return props.componentSchemas || {};
      return {};
    });
  }, [dslModuleRepresentations, props.componentSchemas]);

  // Inspector actions
  const inspectorActions = useMemo(() => ({
    requestSave: async (newConfigValue: any, pathToConfig: (string | number)[]) => {
      if (!selectedElement || !props.onSaveModule) {
        console.log('Save requested but no save handler or selected element:', { newConfigValue, pathToConfig });
        return;
      }

      try {
        // Find the module that contains the selected element
        const moduleFqn = selectedElement.moduleFqn || 
          (currentFlowFqn ? currentFlowFqn.split('.').slice(0, -1).join('.') : null);
        
        if (!moduleFqn) {
          console.error('Cannot determine module FQN for save operation');
          return;
        }

        const moduleRep = dslModuleRepresentations[moduleFqn];
        if (!moduleRep) {
          console.error('Module not found for save operation:', moduleFqn);
          return;
        }

        // Apply the configuration changes
        const updatedModuleRep = applyConfigChanges(moduleRep, pathToConfig, newConfigValue);
        
        // Create save payload
        const savePayload = createSavePayload(updatedModuleRep);
        
        // Call the save handler
        const result = await props.onSaveModule(savePayload);
        
        if (result !== false) {
          console.log('Save successful for module:', moduleFqn);
          // Optionally update the local state with the new module representation
          // This would require updating the atom, but we'll let the consumer handle reloading
        } else {
          console.error('Save was rejected by the handler');
        }
      } catch (error) {
        console.error('Save operation failed:', error);
        if (props.onModuleLoadError) {
          props.onModuleLoadError(selectedElement.moduleFqn || 'unknown', error as Error);
        }
      }
    },
    runDebugExecution: async (elementId: string, config: any) => {
      // Placeholder implementation - would need actual debug execution logic
      console.log('Debug execution requested for:', elementId, config);
      
      // Return a mock step trace for now
      return {
        stepId: elementId,
        status: 'SUCCESS' as const,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        durationMs: 100,
        inputData: config,
        outputData: { result: 'debug execution completed' }
      };
    }
  }), [selectedElement, props.onSaveModule, props.onModuleLoadError, dslModuleRepresentations, currentFlowFqn]);

  // Unified debug/test actions for the new DebugTest tab
  const unifiedDebugTestActions = useMemo(() => ({
    runDebugExecution: async (targetId: string, inputData: any, executionOptions?: any) => {
      console.log('Debug execution requested for:', targetId, inputData, executionOptions);
      
      const startTime = new Date().toISOString();
      const executionId = `exec-${Date.now()}`;
      
      // Simulate execution delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const endTime = new Date().toISOString();
      const durationMs = 1000;
      
      // Mock execution result with comprehensive data
      return {
        executionId,
        status: 'SUCCESS' as const,
        startTime,
        endTime,
        durationMs,
        logs: [
          {
            stepId: targetId,
            timestamp: startTime,
            level: 'info',
            message: 'Debug execution started',
            data: { inputData, executionOptions }
          },
          {
            stepId: targetId,
            timestamp: new Date(Date.now() + 500).toISOString(),
            level: 'debug',
            message: 'Processing input data',
            data: inputData
          },
          {
            stepId: targetId,
            timestamp: endTime,
            level: 'info',
            message: 'Debug execution completed successfully'
          }
        ],
        finalOutput: {
          result: 'success',
          processedData: inputData,
          timestamp: endTime
        },
        systemTriggers: [
          {
            triggerId: `trigger-${Date.now()}`,
            triggerType: 'notification',
            targetSystem: 'notification-service',
            payload: { message: 'Execution completed', stepId: targetId },
            timestamp: endTime,
            sourceStepId: targetId
          }
        ],
        dataTransformations: [
          {
            fromStepId: 'input',
            toStepId: targetId,
            inputPath: 'data',
            outputPath: 'processedData',
            originalValue: inputData,
            transformedValue: inputData,
            transformationRule: 'passthrough'
          }
        ]
      };
    },
    
    runTestCase: async (testCase: any) => {
      if (props.onRunTestCase) {
        const result = await props.onRunTestCase(testCase);
        return result || {
          testCase,
          passed: false,
          assertionResults: [],
          error: 'Test execution failed'
        };
      }
      return {
        testCase,
        passed: false,
        assertionResults: [],
        error: 'No test runner available'
      };
    },
    
    generateTestCase: (flowFqn: string, testType: 'happy_path' | 'error_handling' | 'performance') => {
      return {
        flowFqn,
        description: `${testType.replace('_', ' ')} test case for ${flowFqn}`,
        triggerInput: {},
        contextOverrides: {},
        componentMocks: [],
        assertions: []
      };
    },
    
    generateSchemaBasedInputData: (targetId: string, dataType: 'happy_path' | 'fork_paths' | 'error_cases', inputSchema?: any, outputSchemas?: Record<string, any>) => {
      console.log('Generating schema-based input data for:', targetId, dataType, inputSchema);
      
      // Handle both cases: direct schema or schema object with inputSchema property
      let actualSchema = null;
      if (inputSchema?.inputSchema) {
        // Schema object with inputSchema property
        actualSchema = inputSchema.inputSchema;
      } else if (inputSchema?.type || inputSchema?.properties) {
        // Direct JSON schema
        actualSchema = inputSchema;
      }
      
      // If we have an input schema, generate data based on it
      if (actualSchema) {
        return generateDataFromSchema(actualSchema, dataType);
      }
      
      // Fallback to basic data generation
      const baseData = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        targetId
      };
      
      switch (dataType) {
        case 'happy_path':
          return {
            ...baseData,
            status: 'active',
            value: 100,
            message: 'Happy path test data'
          };
        case 'fork_paths':
          return {
            ...baseData,
            status: Math.random() > 0.5 ? 'active' : 'inactive',
            value: Math.floor(Math.random() * 200),
            condition: Math.random() > 0.5 ? 'A' : 'B'
          };
        case 'error_cases':
          return {
            ...baseData,
            status: 'error',
            value: -1,
            error: 'Simulated error condition'
          };
        default:
          return baseData;
      }
    },
    
    generateInputStructureFromSchema: (inputSchema: any, useDefaults?: boolean) => {
      console.log('Generating input structure from schema:', inputSchema, useDefaults);
      
      // Handle both cases: direct schema or schema object with inputSchema property
      let actualSchema = null;
      if (inputSchema?.inputSchema) {
        // Schema object with inputSchema property
        actualSchema = inputSchema.inputSchema;
      } else if (inputSchema?.type || inputSchema?.properties) {
        // Direct JSON schema
        actualSchema = inputSchema;
      }
      
      if (!actualSchema) {
        return {};
      }
      
      return generateDataFromSchema(actualSchema, 'happy_path', useDefaults);
    },
    
    validateInputAgainstSchema: (inputData: any, inputSchema: any) => {
      console.log('Validating input against schema:', inputData, inputSchema);
      
      const errors: any[] = [];
      const warnings: any[] = [];
      
      // Handle both cases: direct schema or schema object with inputSchema property
      let actualSchema = null;
      if (inputSchema?.inputSchema) {
        // Schema object with inputSchema property
        actualSchema = inputSchema.inputSchema;
      } else if (inputSchema?.type || inputSchema?.properties) {
        // Direct JSON schema
        actualSchema = inputSchema;
      }
      
      if (!actualSchema) {
        return {
          isValid: true,
          errors: [],
          warnings: [],
          normalizedData: inputData
        };
      }
      
      // Basic validation logic
      if (actualSchema.required) {
        actualSchema.required.forEach((field: string) => {
          if (!inputData || inputData[field] === undefined || inputData[field] === null) {
            errors.push({
              fieldPath: field,
              message: `Required field '${field}' is missing`,
              expectedType: actualSchema.properties?.[field]?.type || 'any',
              actualValue: inputData?.[field],
              schemaRule: 'required'
            });
          }
        });
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        normalizedData: inputData
      };
    },
    
    resolveTriggerInputData: (triggerConfig: any, triggerSchema?: any, dataType: 'happy_path' | 'fork_paths' | 'error_cases' = 'happy_path') => {
      console.log('Resolving trigger input data:', triggerConfig, triggerSchema, dataType);
      
      // If we have a trigger schema with inputSchema, use it to generate data
      if (triggerSchema?.inputSchema) {
        const generatedData = generateDataFromSchema(triggerSchema.inputSchema, dataType, true);
        
        // For HttpTrigger, enhance the generated data with realistic values
        if (triggerConfig?.type === 'StdLib:HttpTrigger') {
          // Add method and path from config if not in schema
          if (!generatedData.method) {
            generatedData.method = triggerConfig.config?.method || 'POST';
          }
          if (!generatedData.path) {
            generatedData.path = triggerConfig.config?.path || '/api/endpoint';
          }
          
          // Enhance headers with realistic values
          if (generatedData.headers && typeof generatedData.headers === 'object') {
            generatedData.headers = {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              'User-Agent': 'CasinoApp/1.0',
              'X-Request-ID': `req-${Date.now()}`,
              ...generatedData.headers
            };
          }
          
          // Enhance body with realistic casino platform data
          if (generatedData.body && typeof generatedData.body === 'object') {
            if (dataType === 'happy_path') {
              generatedData.body = {
                userId: 'user_' + Math.random().toString(36).substr(2, 9),
                email: 'user@example.com',
                firstName: 'John',
                lastName: 'Doe',
                dateOfBirth: '1990-01-15',
                country: 'US',
                currency: 'USD',
                referralCode: 'REF123',
                acceptedTerms: true,
                timestamp: new Date().toISOString(),
                ...generatedData.body
              };
            } else if (dataType === 'fork_paths') {
              generatedData.body = {
                userId: 'user_' + Math.random().toString(36).substr(2, 9),
                email: 'vip@example.com',
                firstName: 'Jane',
                lastName: 'Smith',
                dateOfBirth: '1985-06-20',
                country: 'CA',
                currency: 'CAD',
                referralCode: 'VIP456',
                acceptedTerms: true,
                isVip: true,
                specialOfferCode: 'WELCOME100',
                timestamp: new Date().toISOString(),
                ...generatedData.body
              };
            } else if (dataType === 'error_cases') {
              generatedData.body = {
                userId: null, // Missing required field
                email: 'invalid-email', // Invalid email format
                firstName: '',
                lastName: '',
                dateOfBirth: '2010-01-01', // Underage
                country: 'XX', // Invalid country
                currency: 'INVALID',
                acceptedTerms: false, // Not accepted
                timestamp: 'invalid-date',
                ...generatedData.body
              };
            }
          }
        }
        
        return generatedData;
      }
      
      // Fallback to hardcoded generation if no schema available
      if (triggerConfig?.type === 'StdLib:HttpTrigger') {
        const baseData = {
          method: triggerConfig.config?.method || 'POST',
          path: triggerConfig.config?.path || '/api/endpoint',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            'User-Agent': 'CasinoApp/1.0',
            'X-Request-ID': `req-${Date.now()}`
          }
        };

        // Generate body based on data type and trigger path
        let body = {};
        const path = triggerConfig.config?.path || '';
        
        if (path.includes('/users/onboard') || path.includes('/onboard')) {
          // User onboarding data
          if (dataType === 'happy_path') {
            body = {
              userId: 'user_' + Math.random().toString(36).substr(2, 9),
              email: 'user@example.com',
              firstName: 'John',
              lastName: 'Doe',
              dateOfBirth: '1990-01-15',
              country: 'US',
              currency: 'USD',
              referralCode: 'REF123',
              acceptedTerms: true,
              timestamp: new Date().toISOString()
            };
          } else if (dataType === 'fork_paths') {
            body = {
              userId: 'user_' + Math.random().toString(36).substr(2, 9),
              email: 'vip@example.com',
              firstName: 'Jane',
              lastName: 'Smith',
              dateOfBirth: '1985-06-20',
              country: 'CA',
              currency: 'CAD',
              referralCode: 'VIP456',
              acceptedTerms: true,
              isVip: true,
              specialOfferCode: 'WELCOME100',
              timestamp: new Date().toISOString()
            };
          } else if (dataType === 'error_cases') {
            body = {
              userId: null,
              email: 'invalid-email',
              firstName: '',
              lastName: '',
              dateOfBirth: '2010-01-01', // Underage
              country: 'XX',
              currency: 'INVALID',
              acceptedTerms: false,
              timestamp: 'invalid-date'
            };
          }
        } else if (path.includes('/bet') || path.includes('/place-bet')) {
          // Betting data
          if (dataType === 'happy_path') {
            body = {
              userId: 'user123',
              gameId: 'slot_001',
              betAmount: 10.00,
              currency: 'USD',
              gameType: 'slots',
              sessionId: 'session_' + Date.now(),
              timestamp: new Date().toISOString()
            };
          } else if (dataType === 'fork_paths') {
            body = {
              userId: 'user456',
              gameId: 'blackjack_001',
              betAmount: 100.00,
              currency: 'USD',
              gameType: 'table',
              sessionId: 'session_' + Date.now(),
              isHighRoller: true,
              timestamp: new Date().toISOString()
            };
          } else {
            body = {
              userId: null,
              gameId: '',
              betAmount: -10, // Invalid amount
              currency: 'INVALID',
              gameType: 'unknown',
              timestamp: 'invalid'
            };
          }
        } else {
          // Generic data
          if (dataType === 'happy_path') {
            body = {
              userId: 'user123',
              requestId: 'req456',
              timestamp: new Date().toISOString(),
              data: { status: 'success' }
            };
          } else if (dataType === 'fork_paths') {
            body = {
              userId: 'user789',
              requestId: 'req999',
              specialFlag: true,
              timestamp: new Date().toISOString(),
              data: { status: 'pending', priority: 'high' }
            };
          } else if (dataType === 'error_cases') {
            body = {
              userId: null,
              invalidField: null,
              timestamp: 'invalid-date'
            };
          }
        }

        return { ...baseData, body };
      } else if (triggerConfig?.type === 'StdLib:EventTrigger') {
        const eventType = triggerConfig.config?.eventType || 'generic-event';
        
        if (dataType === 'happy_path') {
          return {
            eventType,
            payload: {
              id: 'event123',
              timestamp: new Date().toISOString(),
              data: { status: 'success' }
            }
          };
        } else if (dataType === 'fork_paths') {
          return {
            eventType,
            payload: {
              id: 'event456',
              timestamp: new Date().toISOString(),
              data: { status: 'pending', priority: 'high' }
            }
          };
        } else {
          return {
            eventType,
            payload: {
              id: null,
              timestamp: 'invalid'
            }
          };
        }
      }

      // Fallback for unknown trigger types
      return {
        triggerType: triggerConfig?.type || 'unknown',
        data: dataType === 'happy_path' ? { success: true } : { error: 'invalid' }
      };
    },

    propagateDataFlow: async (flowFqn: string, triggerData: any) => {
      console.log('Propagating data flow for:', flowFqn, triggerData);
      
      const flowDef = moduleRegistry.getFlowDefinition(flowFqn);
      if (!flowDef) {
        throw new Error(`Flow not found: ${flowFqn}`);
      }

      const stepResults: Record<string, any> = {};
      stepResults['trigger'] = triggerData;

      // Process steps in execution order
      if (flowDef.steps) {
        for (const step of flowDef.steps) {
          try {
            const resolvedInput = await unifiedDebugTestActions.resolveStepInputData(step.step_id, flowFqn);
            stepResults[step.step_id] = {
              input: resolvedInput,
              output: generateDataFromSchema({ type: 'object', properties: { result: { type: 'string' } } }, 'happy_path', true)
            };
          } catch (error) {
            console.warn(`Failed to resolve input for step ${step.step_id}:`, error);
            stepResults[step.step_id] = {
              input: {},
              output: {},
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        }
      }

      return stepResults;
    },

    analyzeInputMapping: (stepConfig: any, availableData: Record<string, any>) => {
      console.log('Analyzing input mapping:', stepConfig, availableData);
      
      const inputMappings: any[] = [];
      
      if (stepConfig?.inputs_map) {
        Object.entries(stepConfig.inputs_map).forEach(([targetField, sourceExpression]) => {
          // Parse source expression (e.g., "trigger.body", "steps.previous-step.outputs.result")
          const sourceExpr = sourceExpression as string;
          
          let sourceType: 'previousStep' | 'contextVariable' | 'triggerData' | 'constant' = 'constant';
          let sourceStepId: string | undefined;
          let sourceOutputField: string | undefined;
          
          if (sourceExpr.startsWith('trigger.')) {
            sourceType = 'triggerData';
            sourceOutputField = sourceExpr.replace('trigger.', '');
          } else if (sourceExpr.startsWith('steps.')) {
            sourceType = 'previousStep';
            const parts = sourceExpr.split('.');
            if (parts.length >= 2) {
              sourceStepId = parts[1];
              sourceOutputField = parts.slice(2).join('.');
            }
          } else if (sourceExpr.startsWith('context.')) {
            sourceType = 'contextVariable';
            sourceOutputField = sourceExpr.replace('context.', '');
          }
          
          inputMappings.push({
            targetInputField: targetField,
            sourceType,
            sourceStepId,
            sourceOutputField,
            transformationRule: sourceExpr,
            isRequired: true // Default to required
          });
        });
      }
      
      return inputMappings;
    },

    simulateDataFlow: async (flowFqn: string, triggerData: any, targetStepId?: string) => {
      console.log('Simulating data flow:', flowFqn, triggerData, targetStepId);
      
      const flowDef = moduleRegistry.getFlowDefinition(flowFqn);
      if (!flowDef) {
        throw new Error(`Flow not found: ${flowFqn}`);
      }

      const simulationResults: Record<string, any> = {};
      simulationResults['trigger'] = triggerData;

      // If no target step specified, simulate entire flow
      const steps = flowDef.steps || [];
      const targetIndex = targetStepId ? steps.findIndex((s: any) => s.step_id === targetStepId) : steps.length - 1;
      
      // Simulate steps up to target
      for (let i = 0; i <= targetIndex && i < steps.length; i++) {
        const step = steps[i];
        
        try {
          // Resolve input for this step
          const inputMappings = unifiedDebugTestActions.analyzeInputMapping(step, simulationResults);
          const resolvedInput: Record<string, any> = {};
          
          inputMappings.forEach(mapping => {
            if (mapping.sourceType === 'triggerData' && mapping.sourceOutputField) {
              const value = getNestedValue(triggerData, mapping.sourceOutputField);
              if (value !== undefined) {
                resolvedInput[mapping.targetInputField] = value;
              }
            } else if (mapping.sourceType === 'previousStep' && mapping.sourceStepId && mapping.sourceOutputField) {
              const stepResult = simulationResults[mapping.sourceStepId];
              if (stepResult?.output) {
                const value = getNestedValue(stepResult.output, mapping.sourceOutputField);
                if (value !== undefined) {
                  resolvedInput[mapping.targetInputField] = value;
                }
              }
            }
          });
          
          // Generate mock output for this step
          const componentSchema = moduleRegistry.getComponentSchema(step.component_ref);
          let mockOutput = {};
          if (componentSchema?.outputSchema) {
            mockOutput = generateDataFromSchema(componentSchema.outputSchema, 'happy_path', true);
          } else {
            mockOutput = { result: `output_from_${step.step_id}`, success: true };
          }
          
          simulationResults[step.step_id] = {
            input: resolvedInput,
            output: mockOutput
          };
          
        } catch (error) {
          console.warn(`Failed to simulate step ${step.step_id}:`, error);
          simulationResults[step.step_id] = {
            input: {},
            output: {},
            error: error instanceof Error ? error.message : 'Simulation error'
          };
        }
      }
      
      return simulationResults;
    },
    
    resolveStepInputData: async (stepId: string, flowFqn: string) => {
      console.log('Resolving input data for step:', stepId, 'in flow:', flowFqn);
      
      // Get the flow definition and step information
      const flowDef = moduleRegistry.getFlowDefinition(flowFqn);
      if (!flowDef) {
        throw new Error(`Flow not found: ${flowFqn}`);
      }
      
      // Find the step in the flow - use step_id property
      const step = flowDef.steps?.find((s: any) => s.step_id === stepId);
      if (!step) {
        throw new Error(`Step not found: ${stepId} in flow ${flowFqn}`);
      }
      
      // Get component schema for the step
      const moduleFqn = flowFqn.split('.').slice(0, -1).join('.');
      const componentInfo = moduleRegistry.resolveComponentTypeInfo(step.component_ref, moduleFqn);
      const componentSchema = componentInfo ? moduleRegistry.getComponentSchema(componentInfo.baseType) : null;
      
      // Generate input structure from schema with proper defaults
      let resolvedInputData: Record<string, any> = {};
      if (componentSchema?.inputSchema) {
        resolvedInputData = generateDataFromSchema(componentSchema.inputSchema, 'happy_path', true);
      } else {
        // Fallback: generate basic input structure based on inputs_map
        if (step.inputs_map) {
          Object.keys(step.inputs_map).forEach(key => {
            resolvedInputData[key] = `resolved_${key}_value`;
          });
        }
      }
      
      // Analyze inputs_map to determine data sources
      const inputSources: any[] = [];
      const inputMappings: any[] = [];
      
      if (step.inputs_map) {
        Object.entries(step.inputs_map).forEach(([targetField, sourceExpression]: [string, any]) => {
          if (typeof sourceExpression === 'string') {
            // Parse source expressions like "trigger.body", "steps.validate-data.outputs.result"
            if (sourceExpression.startsWith('trigger.')) {
              inputSources.push({
                sourceType: 'triggerData' as const,
                sourceId: 'trigger',
                dataPath: sourceExpression.replace('trigger.', ''),
                transformedValue: `trigger_${targetField}_value`
              });
              inputMappings.push({
                targetInputField: targetField,
                sourceType: 'triggerData' as const,
                sourceStepId: 'trigger',
                sourceOutputField: sourceExpression.replace('trigger.', ''),
                defaultValue: null,
                transformationRule: 'direct',
                isRequired: true
              });
            } else if (sourceExpression.startsWith('steps.')) {
              // Extract step ID from expression like "steps.validate-data.outputs.result"
              const match = sourceExpression.match(/^steps\.([^.]+)\.(.+)$/);
              if (match) {
                const sourceStepId = match[1];
                const outputPath = match[2];
                inputSources.push({
                  sourceType: 'previousStep' as const,
                  sourceId: sourceStepId,
                  dataPath: outputPath,
                  transformedValue: `step_${sourceStepId}_${targetField}`
                });
                inputMappings.push({
                  targetInputField: targetField,
                  sourceType: 'previousStep' as const,
                  sourceStepId: sourceStepId,
                  sourceOutputField: outputPath,
                  defaultValue: null,
                  transformationRule: 'direct',
                  isRequired: true
                });
              }
            } else if (sourceExpression.startsWith('context.')) {
              const contextVar = sourceExpression.replace('context.', '');
              inputSources.push({
                sourceType: 'contextVariable' as const,
                sourceId: contextVar,
                dataPath: 'value',
                transformedValue: `context_${contextVar}_value`
              });
              inputMappings.push({
                targetInputField: targetField,
                sourceType: 'contextVariable' as const,
                contextVariableName: contextVar,
                defaultValue: null,
                transformationRule: 'direct',
                isRequired: false
              });
            }
          }
        });
      }
      
      // If no inputs_map, create default mappings
      if (inputSources.length === 0) {
        inputSources.push({
          sourceType: 'triggerData' as const,
          sourceId: 'trigger',
          dataPath: 'body',
          transformedValue: { data: 'trigger input data' }
        });
        inputMappings.push({
          targetInputField: 'data',
          sourceType: 'triggerData' as const,
          sourceStepId: 'trigger',
          sourceOutputField: 'body',
          defaultValue: {},
          transformationRule: 'direct',
          isRequired: true
        });
      }
      
      return {
        stepId,
        resolvedInputData,
        inputSources,
        availableContext: {
          user_id: 'user123',
          session_id: 'session456',
          environment: 'development'
        },
        inputSchema: componentSchema || undefined
      };
    },
    
    resolveDataLineage: async (stepId: string, flowFqn: string) => {
      console.log('Resolving data lineage for step:', stepId, 'in flow:', flowFqn);
      
      // Get the flow definition
      const flowDef = moduleRegistry.getFlowDefinition(flowFqn);
      if (!flowDef) {
        throw new Error(`Flow not found: ${flowFqn}`);
      }
      
      // Find the target step
      const targetStep = flowDef.steps?.find((s: any) => s.step_id === stepId);
      if (!targetStep) {
        throw new Error(`Step not found: ${stepId} in flow ${flowFqn}`);
      }
      
      // Build data lineage by analyzing the flow structure
      const dataPath: any[] = [];
      const inputMappings: any[] = [];
      
      // Add trigger as the starting point
      if (flowDef.trigger) {
        dataPath.push({
          stepId: 'trigger',
          stepType: 'trigger',
          componentFqn: flowDef.trigger.type,
          outputSchema: undefined,
          outputData: { 
            // Generate sample trigger data based on trigger type
            ...(flowDef.trigger.type === 'StdLib:HttpTrigger' ? {
              method: flowDef.trigger.config?.method || 'POST',
              path: flowDef.trigger.config?.path || '/api/endpoint',
              body: { userId: 'user123', requestId: 'req456' }
            } : {
              eventType: 'sample-event',
              data: { userId: 'user123', timestamp: new Date().toISOString() }
            })
          },
          executionOrder: 0
        });
      }
      
      // Analyze steps that come before the target step
      if (flowDef.steps) {
        const targetStepIndex = flowDef.steps.findIndex((s: any) => s.step_id === stepId);
        const precedingSteps = flowDef.steps.slice(0, targetStepIndex);
        
        precedingSteps.forEach((step: any, index: number) => {
          const moduleFqn = flowFqn.split('.').slice(0, -1).join('.');
          const componentInfo = moduleRegistry.resolveComponentTypeInfo(step.component_ref, moduleFqn);
          const componentSchema = componentInfo ? moduleRegistry.getComponentSchema(componentInfo.baseType) : null;
          
          dataPath.push({
            stepId: step.step_id,
            stepType: 'component',
            componentFqn: componentInfo?.baseType || step.component_ref,
            outputSchema: componentSchema,
            outputData: componentSchema?.outputSchema ? 
              generateDataFromSchema(componentSchema.outputSchema, 'happy_path', true) :
              { result: `output_from_${step.step_id}`, status: 'success' },
            executionOrder: index + 1
          });
        });
      }
      
      // Analyze target step's inputs_map to create input mappings
      if (targetStep.inputs_map) {
        Object.entries(targetStep.inputs_map).forEach(([targetField, sourceExpression]: [string, any]) => {
          if (typeof sourceExpression === 'string') {
            if (sourceExpression.startsWith('trigger.')) {
              inputMappings.push({
                targetInputField: targetField,
                sourceType: 'triggerData' as const,
                sourceStepId: 'trigger',
                sourceOutputField: sourceExpression.replace('trigger.', ''),
                defaultValue: null,
                transformationRule: 'direct',
                isRequired: true
              });
            } else if (sourceExpression.startsWith('steps.')) {
              const match = sourceExpression.match(/^steps\.([^.]+)\.(.+)$/);
              if (match) {
                const sourceStepId = match[1];
                const outputPath = match[2];
                inputMappings.push({
                  targetInputField: targetField,
                  sourceType: 'previousStep' as const,
                  sourceStepId: sourceStepId,
                  sourceOutputField: outputPath,
                  defaultValue: null,
                  transformationRule: 'direct',
                  isRequired: true
                });
              }
            } else if (sourceExpression.startsWith('context.')) {
              const contextVar = sourceExpression.replace('context.', '');
              inputMappings.push({
                targetInputField: targetField,
                sourceType: 'contextVariable' as const,
                contextVariableName: contextVar,
                defaultValue: null,
                transformationRule: 'direct',
                isRequired: false
              });
            }
          }
        });
      }
      
      // Generate available inputs based on data lineage
      const availableInputs: Record<string, any> = {};
      dataPath.forEach(pathStep => {
        if (pathStep.outputData) {
          Object.entries(pathStep.outputData).forEach(([key, value]) => {
            availableInputs[`${pathStep.stepId}.${key}`] = value;
          });
        }
      });
      
      return {
        targetStepId: stepId,
        flowFqn,
        dataPath,
        availableInputs,
        contextVariables: {
          user_id: 'user123',
          session_id: 'session456',
          environment: 'development'
        },
        inputMappings
      };
    },
    
    collectStepLogs: async (executionId: string) => {
      // Mock step logs with more detail
      return [
        {
          stepId: 'step1',
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Step execution started',
          data: { executionId }
        },
        {
          stepId: 'step1',
          timestamp: new Date().toISOString(),
          level: 'debug',
          message: 'Processing input data',
          data: { inputSize: 1024 }
        },
        {
          stepId: 'step1',
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Step execution completed',
          data: { outputSize: 2048, duration: 500 }
        }
      ];
    },
    
    exportExecutionResults: (executionResult: any, format: 'json' | 'yaml' | 'csv') => {
      switch (format) {
        case 'json':
          return JSON.stringify(executionResult, null, 2);
        case 'yaml':
          // Simple YAML-like format
          return Object.entries(executionResult)
            .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
            .join('\n');
        case 'csv':
          // Simple CSV format for logs
          if (executionResult.logs) {
            const headers = 'stepId,timestamp,level,message';
            const rows = executionResult.logs.map((log: any) => 
              `${log.stepId},${log.timestamp},${log.level},"${log.message}"`
            ).join('\n');
            return `${headers}\n${rows}`;
          }
          return 'No log data available';
        default:
          return JSON.stringify(executionResult, null, 2);
      }
    }
  }), [props.onRunTestCase, moduleRegistry]);

  // Helper function to get nested values from objects
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  };

  // Helper function to generate data from schema
  const generateDataFromSchema = (schema: any, dataType: 'happy_path' | 'fork_paths' | 'error_cases', useDefaults: boolean = false): any => {
    if (!schema) return {};
    
    switch (schema.type) {
      case 'object':
        const obj: any = {};
        if (schema.properties) {
          Object.entries(schema.properties).forEach(([key, propSchema]: [string, any]) => {
            if (useDefaults && propSchema.default !== undefined) {
              obj[key] = propSchema.default;
            } else {
              obj[key] = generateDataFromSchema(propSchema, dataType, useDefaults);
            }
          });
        }
        return obj;
        
      case 'array':
        if (schema.items) {
          return [generateDataFromSchema(schema.items, dataType, useDefaults)];
        }
        return [];
        
      case 'string':
        if (useDefaults && schema.default) return schema.default;
        if (schema.enum) return schema.enum[0];
        if (dataType === 'error_cases') return '';
        return schema.example || 'test-string';
        
      case 'number':
      case 'integer':
        if (useDefaults && schema.default !== undefined) return schema.default;
        if (dataType === 'error_cases') return schema.minimum ? schema.minimum - 1 : -1;
        if (schema.minimum !== undefined) return schema.minimum;
        if (schema.maximum !== undefined) return Math.floor(schema.maximum / 2);
        return 42;
        
      case 'boolean':
        if (useDefaults && schema.default !== undefined) return schema.default;
        return dataType !== 'error_cases';
        
      default:
        return useDefaults && schema.default !== undefined ? schema.default : null;
    }
  };

  return (
    <div className={props.className} style={props.style}>
      <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
        {/* Left Sidebar */}
        <div style={{ 
          width: '300px', 
          borderRight: '1px solid #e0e0e0', 
          padding: '16px',
          backgroundColor: '#fafafa',
          overflowY: 'auto'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <button 
              onClick={handleSystemViewToggle}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: systemViewActive ? '#1976D2' : '#f5f5f5',
                color: systemViewActive ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {systemViewActive ? '📋 Flow Detail View' : '🌐 System Overview'}
            </button>
          </div>
          
          {/* Modules List */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#333' }}>Modules</h3>
            {Object.values(dslModuleRepresentations).map(module => {
              const isExpanded = expandedModules.has(module.fqn);
              const hasFlows = module.definitions?.flows && module.definitions.flows.length > 0;
              
              return (
                <div key={module.fqn} style={{ marginBottom: '4px' }}>
                  <div 
                    style={{ 
                      padding: '8px', 
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      cursor: hasFlows ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onClick={() => hasFlows && toggleModuleExpansion(module.fqn)}
                  >
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '13px' }}>{module.fqn}</div>
                      {module.status === 'error' && (
                        <div style={{ color: '#d32f2f', fontSize: '11px', marginTop: '2px' }}>
                          ⚠ {module.errors?.[0]?.message}
                        </div>
                      )}
                    </div>
                    {hasFlows && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {isExpanded ? '▼' : '▶'}
                      </div>
                    )}
                  </div>
                  
                  {/* Expanded flows list */}
                  {isExpanded && hasFlows && module.definitions && (
                    <div style={{ marginLeft: '16px', marginTop: '4px' }}>
                      {module.definitions.flows.map((flow: any) => {
                        const flowFqn = `${module.fqn}.${flow.name}`;
                        return (
                          <div 
                            key={flowFqn}
                            style={{ 
                              padding: '6px 8px', 
                              marginBottom: '2px',
                              cursor: 'pointer',
                              backgroundColor: currentFlowFqn === flowFqn ? '#e3f2fd' : '#f9f9f9',
                              border: `1px solid ${currentFlowFqn === flowFqn ? '#1976D2' : '#e0e0e0'}`,
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFlowNavigation(flowFqn);
                            }}
                          >
                            📋 {flow.name}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Flows List */}
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#333' }}>Flows</h3>
            {Object.values(dslModuleRepresentations).map(module => 
              module.definitions?.flows.map((flow: any) => {
                const flowFqn = `${module.fqn}.${flow.name}`;
                return (
                  <div 
                    key={flowFqn}
                    style={{ 
                      padding: '8px', 
                      marginBottom: '4px',
                      cursor: 'pointer',
                      backgroundColor: currentFlowFqn === flowFqn ? '#e3f2fd' : 'white',
                      border: `1px solid ${currentFlowFqn === flowFqn ? '#1976D2' : '#e0e0e0'}`,
                      borderRadius: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => handleFlowNavigation(flowFqn)}
                    onMouseEnter={(e) => {
                      if (currentFlowFqn !== flowFqn) {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentFlowFqn !== flowFqn) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <div style={{ fontWeight: '500', fontSize: '13px' }}>{flow.name}</div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                      {module.fqn}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Header */}
          <div style={{ 
            height: '50px', 
            borderBottom: '1px solid #e0e0e0', 
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>
              {systemViewActive ? 'System Overview' : (currentFlowFqn || 'Select a Flow')}
            </h2>
          </div>
          
          {/* React Flow Canvas */}
          <div style={{ height: 'calc(100vh - 50px)' }}>
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
                nodeTypes={props.customNodeTypes}
                edgeTypes={props.customEdgeTypes}
                fitView
                {...props.customReactFlowProOptions}
              >
                <Controls />
                <Background />
                <MiniMap />
              </ReactFlow>
            </ReactFlowProvider>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ 
          width: '300px', 
          borderLeft: '1px solid #e0e0e0', 
          padding: '16px',
          backgroundColor: '#fafafa',
          overflowY: 'auto'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#333' }}>Inspector</h3>
          
          {/* Tab Navigation */}
          <div style={{ 
            display: 'flex', 
            marginBottom: '16px',
            borderBottom: '1px solid #e0e0e0',
            flexWrap: 'wrap'
          }}>
            {['properties', 'source', 'debugtest'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveInspectorTab(tab as any)}
                style={{
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: activeInspectorTab === tab ? '#1976D2' : 'transparent',
                  color: activeInspectorTab === tab ? 'white' : '#666',
                  cursor: 'pointer',
                  fontSize: '12px',
                  borderRadius: '4px 4px 0 0',
                  marginRight: '4px',
                  textTransform: 'capitalize'
                }}
              >
                {tab === 'debugtest' ? 'Debug & Test' : tab}
              </button>
            ))}
          </div>

          {selectedElement ? (
            <div>
              <div style={{ 
                padding: '12px', 
                backgroundColor: 'white', 
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                marginBottom: '16px'
              }}>
                <div style={{ fontWeight: '500', marginBottom: '4px' }}>Selected: {selectedElement.id}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Type: {selectedElement.sourceType}</div>
              </div>
              
              {/* Properties Tab */}
              {activeInspectorTab === 'properties' && props.renderInspectorPropertiesTab && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>Properties</h4>
                  <div style={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '12px'
                  }}>
                    {props.renderInspectorPropertiesTab(selectedElement, inspectorActions, moduleRegistry)}
                  </div>
                </div>
              )}

              {/* Source Tab */}
              {activeInspectorTab === 'source' && props.renderInspectorSourceTab && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>Source</h4>
                  <div style={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '12px'
                  }}>
                    {props.renderInspectorSourceTab(currentFlowFqn, selectedElement, moduleRegistry)}
                  </div>
                </div>
              )}

              {/* Unified DebugTest Tab */}
              {activeInspectorTab === 'debugtest' && props.renderInspectorDebugTestTab && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>Debug & Test</h4>
                  <div style={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '12px'
                  }}>
                    {props.renderInspectorDebugTestTab(currentFlowFqn, selectedElement, unifiedDebugTestActions, moduleRegistry)}
                  </div>
                </div>
              )}

              {/* Fallback DebugTest Tab - for backward compatibility */}
              {activeInspectorTab === 'debugtest' && !props.renderInspectorDebugTestTab && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>Debug & Test</h4>
                  <div style={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '12px'
                  }}>
                    {currentFlowFqn ? (
                      <div>
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontWeight: '500', marginBottom: '8px' }}>Test Cases for {currentFlowFqn}</div>
                          <button
                            style={{
                              width: '100%',
                              padding: '8px',
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              marginBottom: '8px'
                            }}
                            onClick={() => {
                              // Generate default test cases
                              console.log('Generating test cases for:', currentFlowFqn);
                            }}
                          >
                            Generate Default Test Cases
                          </button>
                        </div>
                        
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontWeight: '500', marginBottom: '4px' }}>Default Test Templates</div>
                          {['Happy Path', 'Error Handling', 'Performance'].map(testType => (
                            <div key={testType} style={{ 
                              padding: '8px', 
                              marginBottom: '4px',
                              backgroundColor: '#f5f5f5',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              console.log('Creating test case:', testType, 'for', currentFlowFqn);
                            }}
                            >
                              <div style={{ fontWeight: '500' }}>{testType} Test</div>
                              <div style={{ color: '#666' }}>
                                {testType === 'Happy Path' && 'Tests normal execution flow with valid inputs'}
                                {testType === 'Error Handling' && 'Tests error scenarios and edge cases'}
                                {testType === 'Performance' && 'Tests execution timing and resource usage'}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontWeight: '500', marginBottom: '4px' }}>Test Execution</div>
                          <button
                            style={{
                              width: '100%',
                              padding: '8px',
                              backgroundColor: '#2196F3',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            onClick={() => {
                              if (props.onRunTestCase) {
                                // Create a sample test case
                                const testCase = {
                                  testCaseId: 'test-' + Date.now(),
                                  flowFqn: currentFlowFqn,
                                  description: 'Sample test case',
                                  triggerInput: {},
                                  inputData: {},
                                  expectedOutputs: {},
                                  assertions: []
                                };
                                props.onRunTestCase(testCase);
                              }
                            }}
                          >
                            Run Test Cases
                          </button>
                        </div>
                        
                        <div>
                          <div style={{ fontWeight: '500', marginBottom: '4px' }}>Test Results</div>
                          <div style={{ 
                            padding: '8px',
                            backgroundColor: '#f9f9f9',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#666'
                          }}>
                            No test results yet. Run tests to see results here.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                        Select a flow to create and run test cases.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: '#666',
              backgroundColor: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '4px'
            }}>
              Click on a node or edge to inspect its properties
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(CascadeFlowVisualizer); 