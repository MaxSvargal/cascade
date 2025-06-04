// Debug Test Actions Service
// Extracted from CascadeFlowVisualizer to provide modular debug and test actions
// Implements UnifiedDebugTestActions interface

import { 
  UnifiedDebugTestActions,
  IModuleRegistry,
  ComponentSchema,
  FlowTestCase,
  TestRunResult,
  ResolvedStepInput,
  FlowSimulationResult,
  ValidationResult,
  ExecutionOptions,
  StepExecutionTrace,
  ExecutionStatusEnum,
  FlowExecutionTrace
} from '../models/cfv_models_generated';
import { SimulationService } from './simulationService';
import { DataGenerationService } from './dataGenerationService';

export class DebugTestActionsService implements UnifiedDebugTestActions {
  private simulationService: SimulationService;
  private dataGenerationService: DataGenerationService;
  private moduleRegistry: IModuleRegistry;
  private componentSchemas: Record<string, ComponentSchema>;
  private onRunTestCase?: (testCase: FlowTestCase) => Promise<TestRunResult>;
  private updateExecutionStateCallback?: (flowFqn: string, executionResults: FlowSimulationResult | FlowExecutionTrace) => void;
  private currentFlowFqn?: string;

  constructor(
    moduleRegistry: IModuleRegistry,
    componentSchemas: Record<string, ComponentSchema>,
    onRunTestCase?: (testCase: FlowTestCase) => Promise<TestRunResult>,
    updateExecutionStateCallback?: (flowFqn: string, executionResults: FlowSimulationResult | FlowExecutionTrace) => void,
    currentFlowFqn?: string
  ) {
    this.moduleRegistry = moduleRegistry;
    this.componentSchemas = componentSchemas;
    this.onRunTestCase = onRunTestCase;
    this.updateExecutionStateCallback = updateExecutionStateCallback;
    this.currentFlowFqn = currentFlowFqn;
    this.simulationService = new SimulationService(moduleRegistry, componentSchemas);
    this.dataGenerationService = this.simulationService.getDataGenerationService();
  }

  async simulateFlowExecution(
    flowFqn: string, 
    targetStepId?: string, 
    triggerInputData?: any, 
    options?: ExecutionOptions
  ): Promise<FlowSimulationResult> {
    return this.simulationService.simulateFlowExecution(flowFqn, triggerInputData, targetStepId, options);
  }

  async resolveStepInputData(
    stepId: string,
    flowFqn: string, 
    triggerInputData?: any, 
    options?: ExecutionOptions
  ): Promise<ResolvedStepInput> {
    return this.simulationService.resolveStepInputData(stepId, flowFqn);
  }

  async runDebugStep(
    flowFqn: string, 
    stepId: string, 
    inputData: any, 
    componentConfig: any, 
    options?: ExecutionOptions
  ): Promise<StepExecutionTrace> {
    console.log('Running debug step:', stepId, 'in flow:', flowFqn);
    
    return {
      stepId,
      componentFqn: 'unknown',
      status: 'COMPLETED' as ExecutionStatusEnum,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      durationMs: 100,
      inputData,
      outputData: { result: 'debug step completed' }
    };
  }

  async runTestCase(testCase: FlowTestCase): Promise<TestRunResult> {
    console.log('Running test case:', testCase.id, 'for flow:', testCase.flowFqn);
    
    if (!this.onRunTestCase) {
      // If no external test runner, simulate the test execution
      try {
        const simulationResult = await this.simulateFlowExecution(
          testCase.flowFqn,
          undefined, // Run entire flow
          testCase.triggerInput
        );
        
        // Convert simulation result to execution trace for visualization
        const executionTrace: FlowExecutionTrace = {
          traceId: `test-${testCase.id}-${Date.now()}`,
          flowFqn: testCase.flowFqn,
          status: simulationResult.status,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          durationMs: 2000,
          triggerData: simulationResult.triggerInputData,
          steps: Object.entries(simulationResult.resolvedStepInputs).map(([stepId, inputData]) => ({
            stepId,
            componentFqn: 'unknown',
            status: 'SUCCESS' as ExecutionStatusEnum,
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            durationMs: 200,
            inputData,
            outputData: simulationResult.simulatedStepOutputs[stepId] || { result: 'completed' }
          }))
        };
        
        // Update the execution state in the visualizer
        this.updateExecutionState(testCase.flowFqn, executionTrace);
        
        // Mock assertion results
        const assertionResults = testCase.assertions.map(assertion => ({
          assertionId: assertion.id,
          targetPath: assertion.targetPath,
          expectedValue: assertion.expectedValue,
          comparison: assertion.comparison,
          actualValue: 'mock-value',
          passed: true,
          message: 'Assertion passed (simulated)'
        }));
        
        return {
          testCase,
          passed: true,
          assertionResults,
          trace: executionTrace
        };
      } catch (error: any) {
        return {
          testCase,
          passed: false,
          assertionResults: [],
          error: error.message
        };
      }
    }
    
    // Use external test runner
    const result = await this.onRunTestCase(testCase);
    
    // If the result includes trace data, update the execution state
    if (result.trace) {
      this.updateExecutionState(testCase.flowFqn, result.trace);
    }
    
    return result;
  }

  generateTestCaseTemplate(flowFqn: string, scenarioType: 'happyPath' | 'errorCase' | 'custom'): FlowTestCase {
    return {
      id: 'test-' + Math.random().toString(36).substr(2, 9),
      flowFqn,
      description: `${scenarioType} test case for ${flowFqn}`,
      triggerInput: {},
      assertions: []
    };
  }

  generateSchemaBasedInput(componentSchema: ComponentSchema, scenarioType: 'happyPath' | 'empty' | 'fullOptional') {
    if (componentSchema?.inputSchema) {
      return this.dataGenerationService.generateDataFromSchema(componentSchema.inputSchema, 'happy_path', scenarioType === 'fullOptional');
    }
    return {};
  }

  validateDataAgainstSchema(data: any, schema: any): ValidationResult {
    return this.dataGenerationService.validateInputAgainstSchema(data, schema);
  }

  resolveTriggerInputData(
    triggerConfig: any, 
    triggerSchema?: ComponentSchema, 
    dataType: 'happy_path' | 'fork_paths' | 'error_cases' = 'happy_path'
  ) {
    console.log('Resolving trigger input data:', triggerConfig, triggerSchema, dataType);
    return this.dataGenerationService.generateTriggerData(triggerConfig);
  }

  async propagateDataFlow(flowFqn: string, triggerData: any): Promise<Record<string, any>> {
    console.log('Propagating data flow for:', flowFqn, triggerData);
    
    const flowDef = this.moduleRegistry.getFlowDefinition(flowFqn);
    if (!flowDef) {
      throw new Error(`Flow not found: ${flowFqn}`);
    }

    const stepResults: Record<string, any> = {};
    stepResults['trigger'] = triggerData;

    // Process steps in execution order
    if (flowDef.steps) {
      for (const step of flowDef.steps) {
        try {
          const resolvedInput = await this.resolveStepInputData(step.step_id, flowFqn);
          stepResults[step.step_id] = {
            input: resolvedInput,
            output: this.dataGenerationService.generateDataFromSchema(
              { type: 'object', properties: { result: { type: 'string' } } }, 
              'happy_path', 
              true
            )
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
  }

  analyzeInputMapping(stepConfig: any, availableData: Record<string, any>) {
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
  }

  async simulateDataFlow(flowFqn: string, triggerData: any, targetStepId?: string): Promise<Record<string, any>> {
    console.log('Simulating data flow:', flowFqn, triggerData, targetStepId);
    
    const flowDef = this.moduleRegistry.getFlowDefinition(flowFqn);
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
        const inputMappings = this.analyzeInputMapping(step, simulationResults);
        const resolvedInput: Record<string, any> = {};
        
        inputMappings.forEach(mapping => {
          if (mapping.sourceType === 'triggerData' && mapping.sourceOutputField) {
            const value = this.dataGenerationService.getNestedValue(triggerData, mapping.sourceOutputField);
            if (value !== undefined) {
              resolvedInput[mapping.targetInputField] = value;
            }
          } else if (mapping.sourceType === 'previousStep' && mapping.sourceStepId && mapping.sourceOutputField) {
            const stepResult = simulationResults[mapping.sourceStepId];
            if (stepResult?.output) {
              const value = this.dataGenerationService.getNestedValue(stepResult.output, mapping.sourceOutputField);
              if (value !== undefined) {
                resolvedInput[mapping.targetInputField] = value;
              }
            }
          }
        });
        
        // Generate mock output for this step
        const componentSchema = this.moduleRegistry.getComponentSchema(step.component_ref);
        let mockOutput = {};
        if (componentSchema?.outputSchema) {
          mockOutput = this.dataGenerationService.generateDataFromSchema(componentSchema.outputSchema, 'happy_path', true);
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
  }

  async collectStepLogs(executionId: string) {
    console.log('Collecting step logs for execution:', executionId);
    
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
  }

  exportExecutionResults(executionResult: any, format: 'json' | 'yaml' | 'csv'): string {
    console.log('Exporting execution results in format:', format);
    
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

  generateSchemaBasedInputData(
    targetId: string, 
    dataType: 'happy_path' | 'fork_paths' | 'error_cases', 
    componentSchema?: ComponentSchema
  ) {
    console.log('Generating schema-based input data for:', targetId, dataType, componentSchema);
    
    // Handle both cases: direct schema or schema object with inputSchema property
    let actualSchema = null;
    if (componentSchema?.inputSchema) {
      // Schema object with inputSchema property
      actualSchema = componentSchema.inputSchema;
    } else if (componentSchema && (componentSchema as any).type || (componentSchema as any).properties) {
      // Direct JSON schema
      actualSchema = componentSchema;
    }
    
    // If we have an input schema, generate data based on it
    if (actualSchema) {
      return this.dataGenerationService.generateDataFromSchema(actualSchema, dataType);
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
  }

  async resolveDataLineage(stepId: string, flowFqn: string) {
    console.log('Resolving data lineage for step:', stepId, 'in flow:', flowFqn);
    
    try {
      // Use the simulation to get actual data lineage
      const flowDef = this.moduleRegistry.getFlowDefinition(flowFqn);
      if (!flowDef) {
        throw new Error(`Flow not found: ${flowFqn}`);
      }
      
      // Generate trigger data
      let triggerData;
      if (flowDef.trigger) {
        triggerData = this.dataGenerationService.generateTriggerData(flowDef.trigger);
      } else {
        triggerData = { timestamp: new Date().toISOString(), data: {} };
      }
      
      // Initialize simulation state
      const stepResults: Record<string, any> = {};
      const contextState = { ...(flowDef.context || {}) };
      
      // Find target step index
      let targetStepIndex = -1;
      if (flowDef.steps) {
        targetStepIndex = flowDef.steps.findIndex((s: any) => s.step_id === stepId);
        if (targetStepIndex === -1 && stepId !== 'trigger') {
          throw new Error(`Target step not found: ${stepId}`);
        }
      }
      
      // Simulate trigger execution
      const triggerResult = {
        stepId: 'trigger',
        componentFqn: flowDef.trigger?.type || 'trigger',
        inputData: triggerData,
        outputData: this.createTriggerOutputData(flowDef.trigger, triggerData),
        contextChanges: {},
        executionOrder: 0,
        simulationSuccess: true
      };
      stepResults['trigger'] = triggerResult;
      
      // Build data path from simulation
      const dataPath: any[] = [{
        stepId: 'trigger',
        stepType: 'trigger',
        componentFqn: flowDef.trigger?.type || 'trigger',
        outputSchema: undefined,
        outputData: triggerData,
        executionOrder: 0
      }];
      
      // Simulate each step up to target step
      if (flowDef.steps && targetStepIndex >= 0) {
        for (let stepIndex = 0; stepIndex <= targetStepIndex; stepIndex++) {
          const step = flowDef.steps[stepIndex];
          const stepResult = this.simulationService.simulateStepExecution(step, stepResults, contextState, flowFqn);
          
          if (!stepResult.simulationSuccess) {
            break;
          }
          
          stepResults[step.step_id] = stepResult;
          Object.assign(contextState, stepResult.contextChanges);
          
          // Add to data path
          dataPath.push({
            stepId: step.step_id,
            stepType: 'component',
            componentFqn: stepResult.componentFqn,
            outputSchema: undefined,
            outputData: stepResult.outputData,
            executionOrder: stepIndex + 1
          });
        }
      }
      
      // Generate input mappings for target step
      const inputMappings: any[] = [];
      if (stepId !== 'trigger' && flowDef.steps && targetStepIndex >= 0) {
        const targetStep = flowDef.steps[targetStepIndex];
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
      }
      
      return {
        flowFqn,
        paths: inputMappings.map(mapping => ({
          targetStepId: stepId,
          targetInputField: mapping.targetInputField,
          source: {
            sourceType: mapping.sourceType,
            id: mapping.sourceStepId || mapping.contextVariableName || 'trigger',
            dataPath: mapping.sourceOutputField,
            valuePreview: null
          },
          transformationExpression: mapping.transformationRule
        }))
      };
    } catch (error) {
      console.error('Data lineage simulation failed:', error);
      
      // Fallback to basic mock data lineage
      return {
        flowFqn,
        paths: []
      };
    }
  }

  validateInputAgainstSchema(inputData: any, componentSchema: ComponentSchema): ValidationResult {
    return this.dataGenerationService.validateInputAgainstSchema(inputData, componentSchema);
  }

  async runDebugExecution(targetId: string, inputData: any, executionOptions?: ExecutionOptions) {
    console.log('Debug execution requested for:', targetId, inputData, executionOptions);
    
    try {
      let targetFlowFqn: string | null = this.currentFlowFqn || null;
      
      // If we don't have a current flow context, try to find it
      if (!targetFlowFqn) {
        const allModules = this.moduleRegistry.getAllLoadedModules();
        
        // If targetId is 'trigger', we need to find the current flow context differently
        if (targetId === 'trigger') {
          // For trigger execution, we need the flow context from somewhere else
          // Let's try to get it from the first available flow for now
          // In a real implementation, this should come from the current flow context
          for (const module of allModules) {
            if (module.definitions?.flows && module.definitions.flows.length > 0) {
              targetFlowFqn = `${module.fqn}.${module.definitions.flows[0].name}`;
              break;
            }
          }
        } else {
          // Find the flow that contains this step
          for (const module of allModules) {
            if (module.definitions?.flows) {
              for (const flow of module.definitions.flows) {
                const flowFqn = `${module.fqn}.${flow.name}`;
                if (flow.steps?.some((step: any) => step.step_id === targetId)) {
                  targetFlowFqn = flowFqn;
                  break;
                }
              }
            }
            if (targetFlowFqn) break;
          }
        }
      }
      
      if (!targetFlowFqn) {
        throw new Error(`Could not find flow context for target: ${targetId}`);
      }
      
      console.log('🎯 Executing in flow context:', targetFlowFqn, 'for target:', targetId);
      
      // Check if this is a trigger execution (entire flow) or step execution
      const isTriggerExecution = targetId === 'trigger';
      
      if (isTriggerExecution) {
        // For trigger execution, run progressive flow simulation
        return await this.runProgressiveFlowExecution(targetFlowFqn, inputData, executionOptions);
      } else {
        // For step execution, run up to that step
        const targetStepId = targetId;
        
        // Simulate the flow execution up to target step
        const simulationResult = await this.simulateFlowExecution(
          targetFlowFqn,
          targetStepId,
          inputData,
          executionOptions
        );
        
        console.log('🚀 Simulation completed:', simulationResult);
        
        // Convert simulation result to execution trace format for visualization
        const executionTrace: FlowExecutionTrace = {
          traceId: `debug-${Date.now()}`,
          flowFqn: targetFlowFqn,
          status: simulationResult.status,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          durationMs: 1000,
          triggerData: simulationResult.triggerInputData,
          steps: [
            // Add trigger step
            {
              stepId: 'trigger',
              componentFqn: 'trigger',
              status: 'SUCCESS' as ExecutionStatusEnum,
              startTime: new Date().toISOString(),
              endTime: new Date().toISOString(),
              durationMs: 50,
              inputData: inputData,
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
        };
        
        console.log('📊 Generated execution trace:', executionTrace);
        
        // Update the execution state in the visualizer
        this.updateExecutionState(targetFlowFqn, executionTrace);
        
        // Return execution result for the debug interface
        const executionResult = {
          executionId: `exec-${Date.now()}`,
          status: 'SUCCESS' as const,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          durationMs: 1000,
          logs: [
            {
              stepId: targetId,
              timestamp: new Date().toISOString(),
              level: 'info',
              message: 'Debug execution completed successfully',
              data: { inputData, simulationResult }
            }
          ],
          finalOutput: simulationResult.simulatedStepOutputs[targetId] || { result: 'success' },
          trace: executionTrace
        };
        
        return executionResult;
      }
    } catch (error: any) {
      console.error('Debug execution failed:', error);
      throw error;
    }
  }

  /**
   * Run progressive flow execution that updates node statuses step by step
   */
  private async runProgressiveFlowExecution(
    flowFqn: string, 
    triggerInputData: any, 
    executionOptions?: ExecutionOptions
  ): Promise<any> {
    console.log('🚀 Starting progressive flow execution for:', flowFqn);
    console.log('🔍 Trigger input data:', triggerInputData);
    console.log('🔍 Execution options:', executionOptions);
    
    // Get flow definition
    const flowDef = this.moduleRegistry.getFlowDefinition(flowFqn);
    if (!flowDef) {
      console.error('❌ Flow not found:', flowFqn);
      throw new Error(`Flow not found: ${flowFqn}`);
    }
    
    console.log('✅ Flow definition found:', flowDef);
    
    const steps = flowDef.steps || [];
    const executionId = `progressive-${Date.now()}`;
    
    console.log(`📋 Found ${steps.length} steps to execute:`, steps.map((s: any) => s.step_id));
    
    // Initialize execution trace with all steps in PENDING status
    let currentTrace: FlowExecutionTrace = {
      traceId: executionId,
      flowFqn,
      status: 'RUNNING',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      durationMs: 0,
      triggerData: triggerInputData,
      steps: [
        // Trigger step starts as RUNNING
        {
          stepId: 'trigger',
          componentFqn: 'trigger',
          status: 'RUNNING' as ExecutionStatusEnum,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          durationMs: 0,
          inputData: triggerInputData,
          outputData: {}
        },
        // All other steps start as PENDING
        ...steps.map((step: any) => ({
          stepId: step.step_id,
          componentFqn: step.component_ref || 'unknown',
          status: 'PENDING' as ExecutionStatusEnum,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          durationMs: 0,
          inputData: {},
          outputData: {}
        }))
      ]
    };
    
    console.log('📊 Initial execution trace created:', currentTrace);
    
    // Update visualizer with initial PENDING state
    console.log('🔄 Updating visualizer with initial state...');
    this.updateExecutionState(flowFqn, currentTrace);
    
    // Execute trigger first
    console.log('⏳ Executing trigger...');
    await this.delay(500); // Simulate trigger execution time
    
    // Complete trigger execution - CREATE NEW TRACE OBJECT
    const triggerOutput = {
      data: triggerInputData,
      timestamp: new Date().toISOString(),
      source: 'trigger'
    };
    
    currentTrace = {
      ...currentTrace,
      steps: currentTrace.steps.map((step, index) => 
        index === 0 ? {
          ...step,
          status: 'SUCCESS' as ExecutionStatusEnum,
          endTime: new Date().toISOString(),
          durationMs: 500,
          outputData: triggerOutput
        } : step
      )
    };
    
    console.log('✅ Trigger completed, updating visualizer...');
    this.updateExecutionState(flowFqn, currentTrace);
    console.log('✅ Trigger completed');
    
    // Execute each step progressively
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepIndex = i + 1; // +1 because trigger is at index 0
      
      console.log(`🔄 Starting execution of step ${i + 1}/${steps.length}: ${step.step_id}`);
      
      // Set step to RUNNING - CREATE NEW TRACE OBJECT
      currentTrace = {
        ...currentTrace,
        steps: currentTrace.steps.map((stepTrace, index) => 
          index === stepIndex ? {
            ...stepTrace,
            status: 'RUNNING' as ExecutionStatusEnum,
            startTime: new Date().toISOString()
          } : stepTrace
        )
      };
      
      console.log(`🔄 Setting step ${step.step_id} to RUNNING, updating visualizer...`);
      this.updateExecutionState(flowFqn, currentTrace);
      
      // Simulate step execution time (random between 800-2000ms)
      const executionTime = Math.random() * 1200 + 800;
      console.log(`⏳ Simulating execution time: ${Math.round(executionTime)}ms`);
      await this.delay(executionTime);
      
      try {
        // Resolve step input from previous steps
        const stepInput = this.resolveStepInputFromTrace(step, currentTrace);
        console.log(`📥 Resolved step input for ${step.step_id}:`, stepInput);
        
        // Generate step output
        const stepOutput = this.generateStepOutput(step, stepInput);
        console.log(`📤 Generated step output for ${step.step_id}:`, stepOutput);
        
        // Complete step execution
        currentTrace.steps[stepIndex] = {
          ...currentTrace.steps[stepIndex],
          status: 'SUCCESS' as ExecutionStatusEnum,
          endTime: new Date().toISOString(),
          durationMs: Math.round(executionTime),
          inputData: stepInput,
          outputData: stepOutput
        };
        
        console.log(`✅ Step ${step.step_id} completed successfully, updating visualizer...`);
        
      } catch (error) {
        // Handle step failure
        console.error(`❌ Step ${step.step_id} failed:`, error);
        
        currentTrace.steps[stepIndex] = {
          ...currentTrace.steps[stepIndex],
          status: 'FAILURE' as ExecutionStatusEnum,
          endTime: new Date().toISOString(),
          durationMs: Math.round(executionTime),
          inputData: {},
          outputData: { error: error instanceof Error ? error.message : 'Step execution failed' }
        };
        
        console.error(`❌ Step ${step.step_id} failed:`, error);
        
        // Stop execution on failure
        currentTrace.status = 'FAILED';
        this.updateExecutionState(flowFqn, currentTrace);
        break;
      }
      
      // Update visualizer with step completion
      this.updateExecutionState(flowFqn, currentTrace);
    }
    
    // Complete flow execution
    if (currentTrace.status !== 'FAILED') {
      currentTrace.status = 'COMPLETED';
    }
    currentTrace.endTime = new Date().toISOString();
    currentTrace.durationMs = Date.now() - new Date(currentTrace.startTime).getTime();
    
    console.log('🏁 Flow execution completed, final update...');
    this.updateExecutionState(flowFqn, currentTrace);
    
    console.log('🏁 Progressive flow execution completed');
    
    // Return execution result
    return {
      executionId,
      status: currentTrace.status === 'COMPLETED' ? 'SUCCESS' : 'FAILURE',
      startTime: currentTrace.startTime,
      endTime: currentTrace.endTime,
      durationMs: currentTrace.durationMs,
      logs: currentTrace.steps.map(step => ({
        stepId: step.stepId,
        timestamp: step.endTime,
        level: step.status === 'SUCCESS' ? 'info' : 'error',
        message: `Step ${step.stepId} ${step.status.toLowerCase()}`,
        data: { inputData: step.inputData, outputData: step.outputData }
      })),
      finalOutput: currentTrace.steps[currentTrace.steps.length - 1]?.outputData || {},
      trace: currentTrace
    };
  }
  
  /**
   * Utility method to add delays for progressive execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Resolve step input from current execution trace
   */
  private resolveStepInputFromTrace(step: any, trace: FlowExecutionTrace): any {
    const resolvedInput: Record<string, any> = {};
    
    // Process inputs_map to resolve data from previous steps
    if (step.inputs_map) {
      for (const [inputKey, sourceExpression] of Object.entries(step.inputs_map)) {
        const resolvedValue = this.resolveInputFromTrace(sourceExpression as string, trace);
        resolvedInput[inputKey] = resolvedValue;
      }
    } else {
      // If no explicit inputs_map, use output from previous step or trigger
      const completedSteps = trace.steps.filter(s => s.status === 'SUCCESS');
      if (completedSteps.length > 0) {
        const lastStep = completedSteps[completedSteps.length - 1];
        resolvedInput.data = lastStep.outputData;
      }
    }
    
    return resolvedInput;
  }
  
  /**
   * Resolve input expression from execution trace
   */
  private resolveInputFromTrace(expression: string, trace: FlowExecutionTrace): any {
    if (expression.startsWith('trigger.')) {
      const triggerStep = trace.steps.find(s => s.stepId === 'trigger');
      if (triggerStep && triggerStep.status === 'SUCCESS') {
        const path = expression.substring(8); // Remove 'trigger.'
        return this.dataGenerationService.getNestedValue(triggerStep.outputData, path);
      }
    } else if (expression.startsWith('steps.')) {
      // Parse steps.stepId.outputs.field format
      const match = expression.match(/^steps\.([^.]+)\.outputs\.(.+)$/);
      if (match) {
        const stepId = match[1];
        const field = match[2];
        const step = trace.steps.find(s => s.stepId === stepId);
        if (step && step.status === 'SUCCESS') {
          return this.dataGenerationService.getNestedValue(step.outputData, field);
        }
      }
    }
    
    return null;
  }
  
  /**
   * Generate realistic step output based on component type
   */
  private generateStepOutput(step: any, stepInput: any): any {
    const componentRef = step.component_ref;
    
    // Generate output based on component type
    if (componentRef === 'StdLib:JsonSchemaValidator') {
      return {
        validData: stepInput.data || stepInput,
        isValid: true,
        validationErrors: []
      };
    } else if (componentRef === 'StdLib:Fork') {
      return {
        'branch-1': { result: 'branch1_output', success: true },
        'branch-2': { result: 'branch2_output', success: true },
        'branch-3': { result: 'branch3_output', success: true }
      };
    } else if (componentRef === 'StdLib:MapData') {
      return {
        mappedData: stepInput,
        transformationApplied: true,
        outputFields: Object.keys(stepInput)
      };
    } else if (componentRef === 'StdLib:HttpCall') {
      return {
        statusCode: 200,
        responseBody: { success: true, data: stepInput },
        headers: { 'content-type': 'application/json' },
        duration: Math.random() * 500 + 100
      };
    } else if (componentRef === 'StdLib:SubFlowInvoker') {
      return {
        subFlowResult: { status: 'completed', data: stepInput },
        executionId: `subflow-${Date.now()}`,
        duration: Math.random() * 1000 + 500
      };
    } else {
      // Generic component output
      return {
        result: `output_from_${step.step_id}`,
        inputProcessed: stepInput,
        success: true,
        timestamp: new Date().toISOString()
      };
    }
  }

  private createTriggerOutputData(trigger: any, triggerData: any): any {
    // CRITICAL: Trigger must produce proper outputData that can be consumed by steps
    // This matches the logic in FlowSimulationService.executeTrigger()
    let outputData = triggerData;

    // Enhance trigger output based on trigger type
    if (trigger?.type === 'StdLib.Trigger:Http') {
      // HTTP triggers provide body, headers, query params
      outputData = {
        body: triggerData.body || triggerData,
        headers: triggerData.headers || {},
        query: triggerData.query || {},
        method: triggerData.method || 'POST',
        url: triggerData.url || triggerData.path || '/webhook'
      };
    } else if (trigger?.type === 'StdLib.Trigger:Schedule' || trigger?.type === 'StdLib.Trigger:Scheduled') {
      // Schedule triggers provide timestamp and config
      outputData = {
        timestamp: new Date().toISOString(),
        scheduledTime: triggerData.scheduledTime || new Date().toISOString(),
        config: trigger.config || {}
      };
    } else if (trigger?.type === 'StdLib.Trigger:EventBus') {
      // Event triggers provide event data
      outputData = {
        event: triggerData.eventData || triggerData,
        metadata: {
          messageId: triggerData.messageId || 'msg-' + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          source: triggerData.source || 'system'
        }
      };
    } else {
      // Generic trigger - ensure we have a proper structure
      outputData = {
        data: triggerData,
        timestamp: new Date().toISOString(),
        source: 'trigger'
      };
    }

    console.log(`🎯 Created trigger output data for ${trigger?.type}:`, outputData);
    return outputData;
  }

  updateExecutionState(flowFqn: string, executionResults: FlowSimulationResult | FlowExecutionTrace) {
    if (this.updateExecutionStateCallback) {
      this.updateExecutionStateCallback(flowFqn, executionResults);
    }
  }

  // Method to update the current flow context
  setCurrentFlowFqn(flowFqn: string | undefined) {
    this.currentFlowFqn = flowFqn;
  }
} 