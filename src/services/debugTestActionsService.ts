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
  ExecutionStatusEnum
} from '../models/cfv_models_generated';
import { SimulationService } from './simulationService';
import { DataGenerationService } from './dataGenerationService';

export class DebugTestActionsService implements UnifiedDebugTestActions {
  private simulationService: SimulationService;
  private dataGenerationService: DataGenerationService;

  constructor(
    private moduleRegistry: IModuleRegistry,
    private componentSchemas: Record<string, ComponentSchema> = {},
    private onRunTestCase?: (testCase: FlowTestCase) => Promise<TestRunResult>
  ) {
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
    flowFqn: string, 
    stepId: string, 
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
    if (this.onRunTestCase) {
      const result = await this.onRunTestCase(testCase);
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
          const resolvedInput = await this.resolveStepInputData(flowFqn, step.step_id);
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
        outputData: triggerData,
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
  }
} 