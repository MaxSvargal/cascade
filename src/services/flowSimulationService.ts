// Flow Simulation Service
// Provides realistic flow execution simulation with proper data propagation and component execution
// Separated from CascadeFlowVisualizer to maintain clean architecture

import { 
  IModuleRegistry, 
  ComponentSchema, 
  ResolvedStepInput,
  FlowSimulationResult,
  ExecutionOptions,
  FlowExecutionStatusEnum,
  StepExecutionTrace,
  ExecutionStatusEnum
} from '../models/cfv_models_generated';

export interface FlowExecutionOptions {
  continueOnError?: boolean;
  maxExecutionTime?: number;
  enableLogging?: boolean;
}

export interface StepExecutionResult {
  stepId: string;
  componentType: string;
  inputData: any;
  outputData: any;
  executionTime: number;
  timestamp: string;
  success: boolean;
  inputSources?: InputSource[];
  error?: string;
}

export interface InputSource {
  inputKey: string;
  sourceExpression: string;
  resolvedValue: any;
  sourceInfo: {
    type: 'trigger' | 'step' | 'context' | 'literal';
    stepId?: string;
    path?: string;
    key?: string;
    value?: any;
    error?: string;
    expression?: string;
  };
}

export interface InternalResolvedStepInput {
  stepId: string;
  resolvedInput: Record<string, any>;
  inputSources: InputSource[];
  componentType?: string;
  config?: any;
}

export interface InternalFlowSimulationResult {
  executionId: string;
  flowFqn: string;
  success: boolean;
  startTime: string;
  endTime: string;
  triggerInput: any;
  finalOutput: any;
  stepResults: Record<string, StepExecutionResult>;
  executionLog: Array<{
    stepId: string;
    timestamp: string;
    input: any;
    output: any;
    duration: number;
    dataLineage?: InputSource[];
  }>;
  errors: Array<{
    stepId: string;
    error: string;
    timestamp: string;
  }>;
  contextVariables: Record<string, any>;
  resolvedStepInputs: Record<string, InternalResolvedStepInput>;
}

export interface ExecutionContext {
  flowFqn: string;
  executionId: string;
  startTime: string;
  triggerInput: any;
  stepResults: Map<string, StepExecutionResult>;
  contextVariables: Map<string, any>;
  executionLog: any[];
  errors: any[];
}

export class FlowSimulationService {
  constructor(
    private moduleRegistry: IModuleRegistry,
    private componentSchemas: Record<string, ComponentSchema> = {}
  ) {}

  async simulateFlowExecution(
    flowFqn: string,
    triggerInput: any,
    targetStepId?: string,
    executionOptions?: FlowExecutionOptions
  ): Promise<InternalFlowSimulationResult> {
    console.log(`🚀 Starting flow simulation for ${flowFqn}`, { triggerInput, targetStepId });

    // Get flow definition from module registry
    const flowDef = this.moduleRegistry.getFlowDefinition(flowFqn);
    if (!flowDef) {
      throw new Error(`Flow not found: ${flowFqn}`);
    }

    // Initialize execution context
    const executionContext: ExecutionContext = {
      flowFqn,
      executionId: 'sim-' + Math.random().toString(36).substr(2, 9),
      startTime: new Date().toISOString(),
      triggerInput,
      stepResults: new Map(),
      contextVariables: new Map(),
      executionLog: [],
      errors: []
    };

    // Load context variables from module (using any cast since method may not exist)
    const moduleContext = (this.moduleRegistry as any).getModuleContext?.(flowDef.moduleFqn) || { contextVariables: [] };
    for (const contextVar of moduleContext.contextVariables || []) {
      executionContext.contextVariables.set(contextVar.name, contextVar.value);
    }

    // Execute trigger - CRITICAL: trigger must produce proper output data
    const triggerResult = this.executeTrigger(flowDef.trigger, triggerInput, executionContext);
    executionContext.stepResults.set('trigger', triggerResult);

    console.log(`✅ Trigger executed:`, triggerResult);

    // Execute steps in order until target step (or all steps)
    const stepsToExecute = targetStepId ? 
      this.getStepsUpToTarget(flowDef.steps || [], targetStepId) :
      (flowDef.steps || []);

    console.log(`📋 Steps to execute:`, stepsToExecute.map((s: any) => s.step_id));

    for (const step of stepsToExecute) {
      try {
        // CRITICAL: Resolve input data from previous step outputs
        const stepInput = this.resolveStepInput(step, executionContext);
        const stepResult = this.executeStep(step, stepInput, executionContext);
        executionContext.stepResults.set(step.step_id, stepResult);

        console.log(`✅ Step ${step.step_id} executed:`, stepResult);

        // Log execution with proper data lineage
        executionContext.executionLog.push({
          stepId: step.step_id,
          timestamp: new Date().toISOString(),
          input: stepInput,
          output: stepResult,
          duration: stepResult.executionTime || 0,
          dataLineage: stepInput.inputSources
        });

        // Break if this is the target step
        if (step.step_id === targetStepId) {
          break;
        }
      } catch (error: any) {
        console.error(`❌ Step ${step.step_id} failed:`, error);
        executionContext.errors.push({
          stepId: step.step_id,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        // Stop execution on error unless configured to continue
        if (!executionOptions?.continueOnError) {
          break;
        }
      }
    }

    // Build final result with proper data propagation
    const finalResult: InternalFlowSimulationResult = {
      executionId: executionContext.executionId,
      flowFqn,
      success: executionContext.errors.length === 0,
      startTime: executionContext.startTime,
      endTime: new Date().toISOString(),
      triggerInput,
      finalOutput: this.getFinalOutput(executionContext),
      stepResults: Object.fromEntries(executionContext.stepResults),
      executionLog: executionContext.executionLog,
      errors: executionContext.errors,
      contextVariables: Object.fromEntries(executionContext.contextVariables),
      resolvedStepInputs: this.buildResolvedInputsMap(executionContext)
    };

    console.log(`🏁 Flow simulation completed:`, finalResult);
    return finalResult;
  }

  private executeTrigger(trigger: any, triggerInput: any, executionContext: ExecutionContext): StepExecutionResult {
    // CRITICAL: Trigger must produce proper outputData that can be consumed by steps
    let outputData = triggerInput;

    // Enhance trigger output based on trigger type
    if (trigger?.type === 'StdLib.Trigger:Http') {
      // HTTP triggers provide body, headers, query params
      outputData = {
        body: triggerInput.body || triggerInput,
        headers: triggerInput.headers || {},
        query: triggerInput.query || {},
        method: triggerInput.method || 'POST',
        url: triggerInput.url || '/webhook'
      };
    } else if (trigger?.type === 'StdLib.Trigger:Schedule') {
      // Schedule triggers provide timestamp and config
      outputData = {
        timestamp: new Date().toISOString(),
        scheduledTime: triggerInput.scheduledTime || new Date().toISOString(),
        config: trigger.config || {}
      };
    } else {
      // Generic trigger - ensure we have a proper structure
      outputData = {
        data: triggerInput,
        timestamp: new Date().toISOString(),
        source: 'trigger'
      };
    }

    return {
      stepId: 'trigger',
      componentType: trigger?.type || 'trigger',
      inputData: triggerInput,
      outputData,
      executionTime: 10,
      timestamp: new Date().toISOString(),
      success: true
    };
  }

  private resolveStepInput(step: any, executionContext: ExecutionContext): InternalResolvedStepInput {
    const resolvedInput: Record<string, any> = {};
    const inputSources: InputSource[] = [];

    // Process inputs_map to resolve data from previous steps
    if (step.inputs_map) {
      for (const [inputKey, sourceExpression] of Object.entries(step.inputs_map)) {
        const source = this.resolveInputSource(sourceExpression as string, executionContext);
        resolvedInput[inputKey] = source.resolvedValue;
        inputSources.push({
          inputKey,
          sourceExpression: sourceExpression as string,
          resolvedValue: source.resolvedValue,
          sourceInfo: source
        });
      }
    }

    // If no explicit inputs_map, try to use output from previous step or trigger
    if (Object.keys(resolvedInput).length === 0) {
      const previousStepResults = Array.from(executionContext.stepResults.values());
      if (previousStepResults.length > 0) {
        const lastResult = previousStepResults[previousStepResults.length - 1];
        resolvedInput.data = lastResult.outputData;
        inputSources.push({
          inputKey: 'data',
          sourceExpression: `steps.${lastResult.stepId}.outputs`,
          resolvedValue: lastResult.outputData,
          sourceInfo: {
            type: lastResult.stepId === 'trigger' ? 'trigger' : 'step',
            stepId: lastResult.stepId,
            path: 'outputs'
          }
        });
      }
    }

    return {
      stepId: step.step_id,
      resolvedInput,
      inputSources,
      componentType: step.component_ref,
      config: step.config
    };
  }

  private resolveInputSource(expression: string, executionContext: ExecutionContext): any {
    // Handle different types of expressions:
    // - steps.stepId.outputs.field
    // - context.varName
    // - trigger.field
    // - literal values

    if (typeof expression !== 'string') {
      return {
        type: 'literal',
        value: expression,
        resolvedValue: expression
      };
    }

    // Handle steps.stepId.outputs.field pattern
    const stepOutputMatch = expression.match(/^steps\.([^.]+)\.outputs(?:\.(.+))?$/);
    if (stepOutputMatch) {
      const [, stepId, fieldPath] = stepOutputMatch;
      const stepResult = executionContext.stepResults.get(stepId);
      
      if (!stepResult) {
        return {
          type: 'step',
          stepId,
          path: fieldPath || 'outputs',
          error: `Step ${stepId} not found or not executed yet`,
          resolvedValue: null
        };
      }

      let value = stepResult.outputData;
      if (fieldPath) {
        value = this.getNestedValue(value, fieldPath);
      }

      return {
        type: 'step',
        stepId,
        path: fieldPath || 'outputs',
        resolvedValue: value
      };
    }

    // Handle trigger.field pattern
    const triggerMatch = expression.match(/^trigger(?:\.(.+))?$/);
    if (triggerMatch) {
      const [, fieldPath] = triggerMatch;
      const triggerResult = executionContext.stepResults.get('trigger');
      
      if (!triggerResult) {
        return {
          type: 'trigger',
          path: fieldPath,
          error: 'Trigger not executed',
          resolvedValue: null
        };
      }

      let value = triggerResult.outputData;
      if (fieldPath) {
        value = this.getNestedValue(value, fieldPath);
      }

      return {
        type: 'trigger',
        path: fieldPath,
        resolvedValue: value
      };
    }

    // Handle context.varName pattern
    const contextMatch = expression.match(/^context\.(.+)$/);
    if (contextMatch) {
      const [, varName] = contextMatch;
      const value = executionContext.contextVariables.get(varName);
      
      return {
        type: 'context',
        key: varName,
        resolvedValue: value !== undefined ? value : null
      };
    }

    // Default to literal value
    return {
      type: 'literal',
      expression,
      resolvedValue: expression
    };
  }

  private executeStep(step: any, stepInput: InternalResolvedStepInput, executionContext: ExecutionContext): StepExecutionResult {
    const startTime = Date.now();
    
    // Simulate component execution based on component type
    const outputData = this.simulateComponentExecution(
      step.component_ref,
      stepInput.resolvedInput,
      step.config,
      this.componentSchemas[step.component_ref]
    );

    const executionTime = Date.now() - startTime;

    return {
      stepId: step.step_id,
      componentType: step.component_ref,
      inputData: stepInput.resolvedInput,
      outputData,
      executionTime,
      timestamp: new Date().toISOString(),
      success: true,
      inputSources: stepInput.inputSources
    };
  }

  private simulateComponentExecution(componentType: string, inputData: any, config: any, componentSchema?: ComponentSchema): any {
    // Simulate different component types with realistic outputs
    
    switch (componentType) {
      case 'StdLib:JsonSchemaValidator':
        return {
          isValid: true,
          validatedData: inputData,
          errors: []
        };

      case 'StdLib:Fork':
        // Fork creates multiple execution paths
        const conditions = config?.conditions || [{ condition: 'true', path: 'default' }];
        return {
          selectedPath: conditions[0].path,
          condition: conditions[0].condition,
          data: inputData
        };

      case 'StdLib:MapData':
        // MapData transforms input using expressions
        const expression = config?.expression || 'data';
        return this.evaluateMapDataExpression(expression, inputData);

      case 'StdLib:HttpCall':
        // HTTP call simulation
        const method = config?.method || 'GET';
        const url = config?.url || 'https://api.example.com/data';
        
        return this.generateHttpResponseBody(componentType, inputData, config);

      case 'StdLib:DatabaseQuery':
        return {
          rows: [
            { id: 1, name: 'Sample Record 1', status: 'active' },
            { id: 2, name: 'Sample Record 2', status: 'inactive' }
          ],
          rowCount: 2,
          executionTime: 45
        };

      case 'StdLib:SendEmail':
        return {
          messageId: 'msg-' + Math.random().toString(36).substr(2, 9),
          status: 'sent',
          recipient: config?.to || 'user@example.com',
          timestamp: new Date().toISOString()
        };

      case 'StdLib:LogMessage':
        return {
          logged: true,
          level: config?.level || 'info',
          message: config?.message || 'Log message',
          timestamp: new Date().toISOString()
        };

      case 'StdLib:SetContextVariable':
        return {
          variableName: config?.name || 'variable',
          value: config?.value || inputData,
          previousValue: null
        };

      default:
        // Generic component simulation
        return {
          result: inputData,
          processed: true,
          componentType,
          timestamp: new Date().toISOString()
        };
    }
  }

  private evaluateMapDataExpression(expression: string, inputData: any): any {
    // Simple expression evaluation for MapData component
    // In real implementation would use proper expression engine
    
    try {
      if (expression === 'data') {
        return inputData;
      }
      
      if (expression.startsWith('data.')) {
        const path = expression.substring(5);
        return this.getNestedValue(inputData, path);
      }
      
      // Handle simple transformations
      if (expression.includes('toUpperCase()')) {
        const field = expression.replace('.toUpperCase()', '');
        const value = field === 'data' ? inputData : this.getNestedValue(inputData, field.replace('data.', ''));
        return typeof value === 'string' ? value.toUpperCase() : value;
      }
      
      if (expression.includes('toLowerCase()')) {
        const field = expression.replace('.toLowerCase()', '');
        const value = field === 'data' ? inputData : this.getNestedValue(inputData, field.replace('data.', ''));
        return typeof value === 'string' ? value.toLowerCase() : value;
      }
      
      // Handle object construction: { field1: data.field1, field2: "constant" }
      if (expression.startsWith('{') && expression.endsWith('}')) {
        const result: any = {};
        const content = expression.slice(1, -1);
        const pairs = content.split(',').map(p => p.trim());
        
        for (const pair of pairs) {
          const [key, value] = pair.split(':').map(p => p.trim());
          const cleanKey = key.replace(/['"]/g, '');
          
          if (value.startsWith('"') && value.endsWith('"')) {
            result[cleanKey] = value.slice(1, -1);
          } else if (value.startsWith('data.')) {
            result[cleanKey] = this.getNestedValue(inputData, value.substring(5));
          } else if (value === 'data') {
            result[cleanKey] = inputData;
          } else {
            result[cleanKey] = value;
          }
        }
        
        return result;
      }
      
      // Default: return input data
      return inputData;
      
    } catch (error) {
      console.warn('MapData expression evaluation failed:', expression, error);
      return inputData;
    }
  }

  private generateHttpResponseBody(componentType: string, inputData: any, config: any): any {
    const method = config?.method || 'GET';
    const url = config?.url || 'https://api.example.com/data';
    
    // Generate realistic response based on URL patterns
    if (url.includes('/users')) {
      return {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: {
          users: [
            { id: 1, name: 'John Doe', email: 'john@example.com' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
          ],
          total: 2
        }
      };
    }
    
    if (url.includes('/validate')) {
      return {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: {
          valid: true,
          data: inputData,
          validatedAt: new Date().toISOString()
        }
      };
    }
    
    // Default response
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: {
        success: true,
        data: inputData,
        timestamp: new Date().toISOString()
      }
    };
  }

  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return obj;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }
    
    return current;
  }

  private getStepsUpToTarget(steps: any[], targetStepId: string): any[] {
    const targetIndex = steps.findIndex(step => step.step_id === targetStepId);
    return targetIndex >= 0 ? steps.slice(0, targetIndex + 1) : steps;
  }

  private getFinalOutput(executionContext: ExecutionContext): any {
    const stepResults = Array.from(executionContext.stepResults.values());
    return stepResults.length > 0 ? stepResults[stepResults.length - 1].outputData : null;
  }

  private buildResolvedInputsMap(executionContext: ExecutionContext): Record<string, InternalResolvedStepInput> {
    // This would be populated during step execution
    // For now, return empty map as it's built during execution
    return {};
  }
} 