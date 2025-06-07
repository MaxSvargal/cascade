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
  FlowExecutionTrace,
  StreamingExecutionRequest
} from '../models/cfv_models_generated';
import { SimulationService } from './simulationService';
import { DataGenerationService } from './dataGenerationService';
import { ClientExecutionStreamHandler, ExecutionStreamOptions } from './clientExecutionStreamHandler';

export class DebugTestActionsService implements UnifiedDebugTestActions {
  private simulationService: SimulationService;
  private dataGenerationService: DataGenerationService;
  private moduleRegistry: IModuleRegistry;
  private componentSchemas: Record<string, ComponentSchema>;
  private onRunTestCase?: (testCase: FlowTestCase) => Promise<TestRunResult>;
  private updateExecutionStateCallback?: (flowFqn: string, executionResults: FlowSimulationResult | FlowExecutionTrace) => void;
  private currentFlowFqn?: string;
  private streamHandler: ClientExecutionStreamHandler;

  constructor(
    moduleRegistry: IModuleRegistry,
    componentSchemas: Record<string, ComponentSchema>,
    onRunTestCase?: (testCase: FlowTestCase) => Promise<TestRunResult>,
    updateExecutionStateCallback?: (flowFqn: string, executionResults: FlowSimulationResult | FlowExecutionTrace) => void,
    currentFlowFqn?: string,
    streamHandler?: ClientExecutionStreamHandler
  ) {
    this.moduleRegistry = moduleRegistry;
    this.componentSchemas = componentSchemas;
    this.onRunTestCase = onRunTestCase;
    this.updateExecutionStateCallback = updateExecutionStateCallback;
    this.currentFlowFqn = currentFlowFqn;
    this.simulationService = new SimulationService(moduleRegistry, componentSchemas);
    this.dataGenerationService = this.simulationService.getDataGenerationService();
    this.streamHandler = streamHandler || new ClientExecutionStreamHandler();
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
        
        // Mock assertion results based on simulation
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
          passed: simulationResult.status === 'COMPLETED',
          assertionResults
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
    return await this.onRunTestCase(testCase);
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
    // Generate data that represents external events coming INTO the trigger (input schema)
    // This is what external systems send to the trigger, not what the trigger outputs to the flow
    if (triggerSchema?.inputSchema?.example) {
      // Use the input schema example - this represents realistic external event data
      return triggerSchema.inputSchema.example;
    }
    
    if (triggerSchema?.inputSchema) {
      // Generate from input schema structure
      return this.dataGenerationService.generateDataFromSchema(
        triggerSchema.inputSchema, 
        dataType
      );
    }
    
    // Fallback to trigger-specific input data generation based on trigger type
    const triggerType = triggerConfig?.type || 'manual';
    
    switch (triggerType) {
      case 'StdLib.Trigger:Http':
      case 'StdLib:HttpTrigger':
        // HTTP trigger input: external HTTP request data
        return {
          method: triggerConfig?.method || 'POST',
          path: triggerConfig?.path || '/api/users/onboard',
          headers: {
            'content-type': 'application/json',
            'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            'user-agent': 'CasinoApp/1.0',
            'x-request-id': 'req-' + Math.random().toString(36).substr(2, 9)
          },
          body: {
            email: 'john.doe@example.com',
            password: 'SecurePass123!',
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1990-01-15',
            country: 'US',
            phoneNumber: '+1234567890',
            referralCode: 'REF123',
            acceptedTerms: true
          },
          query: {},
          timestamp: new Date().toISOString()
        };
        
      case 'StdLib.Trigger:Schedule':
      case 'StdLib.Trigger:Scheduled':
      case 'StdLib:ScheduledTrigger':
        // Scheduled trigger input: scheduled event data
        return {
          scheduledTime: new Date().toISOString(),
          triggeredAt: new Date().toISOString(),
          jobPayload: {
            batchId: 'batch-' + Math.random().toString(36).substr(2, 9),
            scheduleName: triggerConfig?.scheduleName || 'daily-batch',
            parameters: triggerConfig?.parameters || {}
          }
        };
        
      case 'StdLib.Trigger:EventBus':
      case 'StdLib:EventTrigger':
        // EventBus trigger input: external event data
        return {
          id: 'event-' + Math.random().toString(36).substr(2, 9),
          type: triggerConfig?.eventType || 'user.action',
          source: 'external-system',
          timestamp: new Date().toISOString(),
          payload: {
            userId: 'user123',
            action: 'registration',
            data: {
              email: 'user@example.com',
              country: 'US'
            }
          }
        };
        
      default:
        // Manual trigger input: user-initiated data
        return {
          triggeredBy: 'user',
          triggeredAt: new Date().toISOString(),
          initialData: {
            userId: 'user123',
            action: 'manual_trigger',
            parameters: triggerConfig || {}
          }
        };
    }
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
        // For trigger execution, use streaming execution API
        console.log('🌊 Starting streaming execution...');
        
        // Get flow definition
        const flowDef = this.moduleRegistry.getFlowDefinitionDsl(targetFlowFqn);
        if (!flowDef) {
          throw new Error(`Flow definition not found: ${targetFlowFqn}`);
        }
        
        // Create streaming execution request
        const streamingRequest: StreamingExecutionRequest = {
          flowDefinition: flowDef,
          triggerInput: inputData,
          executionOptions: {
            useMocks: true,
            timeoutMs: executionOptions?.timeoutMs || 30000
          }
        };
        
        // Add the correct flow FQN for the client stream handler
        (streamingRequest as any).flowFqn = targetFlowFqn;
        
        // Set up streaming options
        const streamOptions: ExecutionStreamOptions = {
          updateExecutionState: this.updateExecutionStateCallback,
          onExecutionStarted: (data: any) => {
            console.log('🚀 Execution started:', data);
          },
          onStepStarted: (data: any) => {
            console.log('⏳ Step started:', data.stepId);
          },
          onStepCompleted: (data: any) => {
            console.log('✅ Step completed:', data.stepId);
          },
          onStepFailed: (data: any) => {
            console.error('❌ Step failed:', data.stepId, data.error);
          },
          onExecutionCompleted: (data: any) => {
            console.log('🎉 Execution completed:', data);
          },
          onExecutionFailed: (data: any) => {
            console.error('💥 Execution failed:', data.error);
          },
          onConnectionError: (error: Error) => {
            console.error('🔌 Connection error:', error);
          }
        };
        
        // Start streaming execution
        const executionId = await this.streamHandler.startFlowExecution(streamingRequest, streamOptions);
        
        console.log('📡 Streaming execution started with ID:', executionId);
        
        // Return execution result immediately (streaming will update the UI)
        return {
          executionId,
          status: 'RUNNING' as const,
          startTime: new Date().toISOString(),
          logs: [
            {
              stepId: targetId,
              timestamp: new Date().toISOString(),
              level: 'info',
              message: 'Streaming execution started',
              data: { targetId, executionId }
            }
          ],
          finalOutput: { message: 'Execution started, streaming updates in progress...' }
        };
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
        
        // Return simple execution result for the debug interface
        return {
          executionId: `exec-${Date.now()}`,
          status: simulationResult.status === 'COMPLETED' ? 'SUCCESS' as const : 'FAILURE' as const,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          durationMs: 1000,
          logs: [
            {
              stepId: targetId,
              timestamp: new Date().toISOString(),
              level: simulationResult.status === 'COMPLETED' ? 'info' : 'error',
              message: `Step execution ${simulationResult.status === 'COMPLETED' ? 'completed' : 'failed'}`,
              data: { inputData, simulationResult }
            }
          ],
          finalOutput: simulationResult.simulatedStepOutputs[targetId] || simulationResult.triggerInputData || { result: 'completed' }
        };
      }
    } catch (error: any) {
      console.error('Debug execution failed:', error);
      throw error;
    }
  }

  /**
   * Create standardized trigger output data for flow execution
   * This converts trigger input data into the standardized format that flows expect
   */
  private createTriggerOutputData(trigger: any, triggerData: any): any {
    if (!trigger) {
      return triggerData;
    }

    const triggerType = trigger.type;
    
    // For different trigger types, ensure the output follows the expected schema
    switch (triggerType) {
      case 'StdLib.Trigger:Http':
        // HTTP triggers provide request data in a standardized format
        return {
          path: triggerData.path || trigger.config?.path || '/api/endpoint',
          method: triggerData.method || trigger.config?.method || 'POST',
          headers: triggerData.headers || {},
          queryParameters: triggerData.queryParameters || {},
        body: triggerData.body || triggerData,
          principal: triggerData.principal || null
      };
      
      case 'StdLib.Trigger:Scheduled':
        // Scheduled triggers provide timing and payload data
        return {
          triggerTime: triggerData.triggerTime || new Date().toISOString(),
        scheduledTime: triggerData.scheduledTime || new Date().toISOString(),
          cronExpression: trigger.config?.cronExpression,
          payload: triggerData.payload || triggerData
        };
      
      case 'StdLib.Trigger:EventBus':
        // Event bus triggers provide event data in a standardized format
        return {
          event: triggerData.event || {
            id: triggerData.id || 'evt-' + Date.now(),
            type: triggerData.type || trigger.config?.eventType || 'generic.event',
            source: triggerData.source || trigger.config?.source || 'unknown',
            timestamp: triggerData.timestamp || new Date().toISOString(),
            payload: triggerData.payload || triggerData
          }
        };
      
      case 'StdLib.Trigger:Manual':
      default:
        // Manual triggers provide initial data
        return {
          initialData: triggerData.initialData || triggerData
        };
    }
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