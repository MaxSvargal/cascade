// Simulation Service
// Comprehensive flow execution simulation with proper data propagation and component execution
// Handles step execution simulation, data resolution, and complete flow simulation

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
import { DataGenerationService } from './dataGenerationService';

export interface StepSimulationResult {
  stepId: string;
  componentFqn: string;
  inputData: any;
  outputData: any;
  contextChanges: Record<string, any>;
  executionOrder: number;
  simulationSuccess: boolean;
  error?: string;
}

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

export class SimulationService {
  private dataGenerationService: DataGenerationService;

  constructor(
    private moduleRegistry: IModuleRegistry,
    private componentSchemas: Record<string, ComponentSchema> = {}
  ) {
    this.dataGenerationService = new DataGenerationService(moduleRegistry, componentSchemas);
  }

  /**
   * Simulate complete flow execution with detailed execution context
   */
  async simulateFlowExecutionDetailed(
    flowFqn: string,
    triggerInput: any,
    targetStepId?: string,
    executionOptions?: FlowExecutionOptions
  ): Promise<InternalFlowSimulationResult> {
    console.log(`🚀 Starting detailed flow simulation for ${flowFqn}`, { triggerInput, targetStepId });

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
        const stepInput = this.resolveStepInputDetailed(step, executionContext);
        const stepResult = this.executeStepDetailed(step, stepInput, executionContext);
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

  private resolveStepInputDetailed(step: any, executionContext: ExecutionContext): InternalResolvedStepInput {
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
    const source: any = {
      type: 'literal',
      value: expression
    };

    if (expression.startsWith('trigger.')) {
      const triggerResult = executionContext.stepResults.get('trigger');
      if (triggerResult) {
        const path = expression.substring(8); // Remove 'trigger.'
        // CRITICAL: Handle optimized structure - trigger outputs are direct
        const triggerOutput = triggerResult.outputData;
        source.type = 'trigger';
        source.stepId = 'trigger';
        source.path = path;
        source.resolvedValue = this.getNestedValue(triggerOutput, path);
      } else {
        source.error = 'Trigger result not found';
        source.resolvedValue = null;
      }
    } else if (expression.startsWith('steps.')) {
      // Parse steps.stepId.path format
      const match = expression.match(/^steps\.([^.]+)\.(.+)$/);
      if (match) {
        const stepId = match[1];
        const path = match[2];
        const stepResult = executionContext.stepResults.get(stepId);
        
        if (stepResult) {
          // CRITICAL: Handle optimized structure - access output directly
          let stepOutput;
          
          if (stepResult.outputData.output) {
            // New optimized structure: { inputRef, output }
            stepOutput = stepResult.outputData.output;
          } else {
            // Fallback for direct output data (trigger, etc.)
            stepOutput = stepResult.outputData;
          }
          
          // SPECIAL HANDLING for Fork outputs: steps.fork-step.outputs.branch-name
          if (path.startsWith('outputs.') && stepOutput.branches) {
            const branchName = path.substring(8); // Remove 'outputs.'
            source.type = 'step';
            source.stepId = stepId;
            source.path = path;
            source.resolvedValue = stepOutput.branches[branchName];
          } else if (path.startsWith('outputs.')) {
            // Handle regular outputs.field access
            const actualPath = path.replace('outputs.', '');
            source.type = 'step';
            source.stepId = stepId;
            source.path = path;
            source.resolvedValue = this.getNestedValue(stepOutput, actualPath);
          } else {
            // Direct field access or complex path
            source.type = 'step';
            source.stepId = stepId;
            source.path = path;
            source.resolvedValue = this.getNestedValue(stepOutput, path);
          }
        } else {
          source.error = `Step result not found: ${stepId}`;
          source.resolvedValue = null;
        }
      } else {
        source.error = `Invalid steps expression: ${expression}`;
        source.resolvedValue = null;
      }
    } else if (expression.startsWith('context.')) {
      const contextKey = expression.substring(8); // Remove 'context.'
      source.type = 'context';
      source.key = contextKey;
      source.resolvedValue = executionContext.contextVariables.get(contextKey);
    } else {
      // Literal value
      source.type = 'literal';
      source.resolvedValue = expression;
    }

    return source;
  }

  private executeStepDetailed(step: any, stepInput: InternalResolvedStepInput, executionContext: ExecutionContext): StepExecutionResult {
    const startTime = Date.now();
    
    // CRITICAL: Component now returns optimized { inputRef, output } structure
    const componentResult = this.dataGenerationService.simulateComponentExecution(
      step.component_ref,
      stepInput.resolvedInput,
      step.config,
      this.componentSchemas[step.component_ref]
    );

    // Extract the actual output data from the optimized component result
    const outputData = componentResult.output || componentResult; // Fallback for backward compatibility

    const executionTime = Date.now() - startTime;

    return {
      stepId: step.step_id,
      componentType: step.component_ref,
      inputData: stepInput.resolvedInput,
      outputData: componentResult, // CRITICAL: Store the complete optimized structure
      executionTime,
      timestamp: new Date().toISOString(),
      success: true,
      inputSources: stepInput.inputSources
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

  /**
   * Simulate step execution with proper data resolution
   */
  simulateStepExecution(
    step: any, 
    previousStepResults: Record<string, any>, 
    contextState: Record<string, any>, 
    flowFqn: string
  ): StepSimulationResult {
    console.log(`🔄 Simulating step: ${step.step_id}`, { step, previousStepResults, contextState });
    
    // Resolve component information
    const moduleFqn = flowFqn.split('.').slice(0, -1).join('.');
    const componentInfo = this.moduleRegistry.resolveComponentTypeInfo(step.component_ref, moduleFqn);
    
    if (!componentInfo) {
      console.error(`❌ Component not found: ${step.component_ref} for step ${step.step_id}`);
      return {
        stepId: step.step_id,
        componentFqn: step.component_ref,
        inputData: {},
        outputData: {},
        contextChanges: {},
        executionOrder: Object.keys(previousStepResults).length,
        simulationSuccess: false,
        error: `Component not found: ${step.component_ref}`
      };
    }

    // Resolve input data from previous steps and context
    const inputData = this.resolveStepInputFromSimulation(step, previousStepResults, contextState);

    // Get component schema for output generation
    const componentSchema = this.moduleRegistry.getComponentSchema(componentInfo.baseType);

    // CRITICAL: Pass the step's config to the component simulation
    const stepConfig = step.config || {};
    console.log(`📋 Using step config for ${step.step_id}:`, stepConfig);

    // Simulate component execution based on type with BOTH input data AND config
    // CRITICAL: Component now returns { input: ..., output: ... } structure
    const componentResult = this.dataGenerationService.simulateComponentExecution(
      componentInfo.baseType, 
      inputData, 
      stepConfig, 
      componentSchema || undefined
    );

    // Extract the actual output data from the component result
    const outputData = componentResult.output || componentResult; // Fallback for backward compatibility

    // Determine context changes
    const contextChanges: Record<string, any> = {};
    if (step.outputs_map) {
      step.outputs_map.forEach((outputMapping: any) => {
        if (outputMapping.target && outputMapping.target.startsWith('context.')) {
          const contextVar = outputMapping.target.replace('context.', '');
          const sourceValue = this.dataGenerationService.getNestedValue(outputData, outputMapping.source);
          contextChanges[contextVar] = sourceValue;
        }
      });
    }

    return {
      stepId: step.step_id,
      componentFqn: componentInfo.baseType,
      inputData,
      outputData: componentResult, // CRITICAL: Store the complete { input, output } structure
      contextChanges,
      executionOrder: Object.keys(previousStepResults).length,
      simulationSuccess: true
    };
  }

  /**
   * Resolve step input data from previous step results and context
   */
  resolveStepInputFromSimulation(
    step: any, 
    stepResults: Record<string, any>, 
    contextState: Record<string, any>
  ): any {
    console.log(`🔍 Resolving inputs for step: ${step.step_id}`, { 
      stepInputsMap: step.inputs_map, 
      availableStepResults: Object.keys(stepResults),
      contextState 
    });

    const resolvedInput: Record<string, any> = {};

    if (step.inputs_map) {
      Object.entries(step.inputs_map).forEach(([inputField, sourceExpression]: [string, any]) => {
        console.log(`  📋 Resolving ${inputField} from: ${sourceExpression}`);
        let resolvedValue = null;

        if (typeof sourceExpression === 'string') {
          if (sourceExpression.startsWith('trigger.')) {
            const triggerResult = stepResults['trigger'];
            if (triggerResult && triggerResult.outputData) {
              const dataPath = sourceExpression.replace('trigger.', '');
              // CRITICAL: Handle optimized structure - trigger outputs are direct
              const triggerOutput = triggerResult.outputData;
              resolvedValue = this.dataGenerationService.getNestedValue(triggerOutput, dataPath);
              console.log(`    ✅ From trigger.${dataPath}:`, resolvedValue);
            } else {
              console.warn(`    ❌ Trigger result not found or has no output data`);
            }
          } else if (sourceExpression.startsWith('steps.')) {
            // Parse "steps.step-id.outputs.field" or "steps.step-id.field" format
            const stepsMatch = sourceExpression.match(/^steps\.([^.]+)\.(.+)$/);
            if (stepsMatch) {
              const sourceStepId = stepsMatch[1];
              const outputPath = stepsMatch[2];
              const sourceStepResult = stepResults[sourceStepId];
              
              if (sourceStepResult && sourceStepResult.outputData) {
                // CRITICAL: Handle optimized structure - access output directly
                // The outputData now contains the complete { inputRef, output } structure
                let stepOutput;
                
                if (sourceStepResult.outputData.output) {
                  // New optimized structure: { inputRef, output }
                  stepOutput = sourceStepResult.outputData.output;
                } else {
                  // Fallback for direct output data (trigger, etc.)
                  stepOutput = sourceStepResult.outputData;
                }
                
                // SPECIAL HANDLING for Fork outputs: steps.fork-step.outputs.branch-name
                if (outputPath.startsWith('outputs.') && stepOutput.branches) {
                  const branchName = outputPath.substring(8); // Remove 'outputs.'
                  resolvedValue = stepOutput.branches[branchName];
                  console.log(`    ✅ From Fork steps.${sourceStepId}.outputs.${branchName}:`, resolvedValue);
                } else if (outputPath.startsWith('outputs.')) {
                  // Handle regular outputs.field access
                  const actualPath = outputPath.replace('outputs.', '');
                  resolvedValue = this.dataGenerationService.getNestedValue(stepOutput, actualPath);
                  console.log(`    ✅ From steps.${sourceStepId}.outputs.${actualPath}:`, resolvedValue);
                } else {
                  // Direct field access for backward compatibility
                  resolvedValue = this.dataGenerationService.getNestedValue(stepOutput, outputPath);
                  console.log(`    ✅ From steps.${sourceStepId}.${outputPath}:`, resolvedValue);
                }
                
                // CRITICAL: Special handling for complex paths like "response.body.allowed"
                // This is needed for HttpCall components that return { response: { body: ... } }
                if (resolvedValue === undefined && outputPath.includes('.')) {
                  // Try to resolve the full path from the step output
                  resolvedValue = this.dataGenerationService.getNestedValue(stepOutput, outputPath);
                  console.log(`    ✅ From complex path steps.${sourceStepId}.${outputPath}:`, resolvedValue);
                }
              } else {
                console.warn(`    ❌ Source step ${sourceStepId} not found or has no output data`);
                resolvedValue = null;
              }
            } else {
              console.warn(`    ❌ Invalid steps expression format: ${sourceExpression}`);
            }
          } else if (sourceExpression.startsWith('context.')) {
            const contextVar = sourceExpression.replace('context.', '');
            resolvedValue = contextState[contextVar];
            console.log(`    ✅ From context.${contextVar}:`, resolvedValue);
          } else {
            // Direct value or constant
            resolvedValue = sourceExpression;
            console.log(`    ✅ Direct value:`, resolvedValue);
          }
        } else {
          // Non-string values (constants, objects, etc.)
          resolvedValue = sourceExpression;
          console.log(`    ✅ Non-string value:`, resolvedValue);
        }

        // Only assign if we have a resolved value, otherwise use null/undefined
        resolvedInput[inputField] = resolvedValue;
      });
    }

    console.log(`🎯 Final resolved input for ${step.step_id}:`, resolvedInput);
    return resolvedInput;
  }

  /**
   * Get the data generation service for external use
   */
  getDataGenerationService(): DataGenerationService {
    return this.dataGenerationService;
  }

  /**
   * Simulate flow execution using the detailed simulation internally
   */
  async simulateFlowExecution(
    flowFqn: string,
    triggerInputData?: any,
    targetStepId?: string,
    options?: ExecutionOptions
  ): Promise<FlowSimulationResult> {
    // Get flow definition
    const flowDef = this.moduleRegistry.getFlowDefinition(flowFqn);
    if (!flowDef) {
      throw new Error(`Flow not found: ${flowFqn}`);
    }

    // Generate trigger data if not provided
    if (!triggerInputData) {
      if (flowDef.trigger) {
        triggerInputData = this.dataGenerationService.generateTriggerData(flowDef.trigger);
      } else {
        triggerInputData = { timestamp: new Date().toISOString(), data: {} };
      }
    }

    // Use the detailed simulation internally
    const internalResult: InternalFlowSimulationResult = await this.simulateFlowExecutionDetailed(
      flowFqn,
      triggerInputData,
      targetStepId,
      options as FlowExecutionOptions
    );

    // Convert internal result to public interface
    return {
      flowFqn: internalResult.flowFqn,
      targetStepId,
      status: internalResult.success ? 'COMPLETED' : 'FAILED' as FlowExecutionStatusEnum,
      triggerInputData: internalResult.triggerInput,
      resolvedStepInputs: Object.fromEntries(
        Object.entries(internalResult.resolvedStepInputs).map(([stepId, stepInput]) => [
          stepId,
          stepInput.resolvedInput
        ])
      ),
      simulatedStepOutputs: Object.fromEntries(
        Object.entries(internalResult.stepResults).map(([stepId, stepResult]) => [
          stepId,
          stepResult.outputData
        ])
      ),
      finalContextState: internalResult.contextVariables,
      errors: internalResult.errors.map(err => ({
        errorType: 'SimulationError',
        message: err.error,
        stepId: err.stepId,
        timestamp: err.timestamp
      }))
    };
  }

  /**
   * Resolve step input data for a specific step
   */
  async resolveStepInputData(stepId: string, flowFqn: string): Promise<ResolvedStepInput> {
    console.log('Resolving input data for step:', stepId, 'in flow:', flowFqn);
    
    try {
      // Get flow definition
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
      const executionOrder: string[] = [];
      
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
      executionOrder.push('trigger');
      
      // Simulate each step up to target step
      if (flowDef.steps && targetStepIndex >= 0) {
        for (let stepIndex = 0; stepIndex <= targetStepIndex; stepIndex++) {
          const step = flowDef.steps[stepIndex];
          const stepResult = this.simulateStepExecution(step, stepResults, contextState, flowFqn);
          
          if (!stepResult.simulationSuccess) {
            break;
          }
          
          stepResults[step.step_id] = stepResult;
          executionOrder.push(step.step_id);
          
          // Update context state with step changes
          Object.assign(contextState, stepResult.contextChanges);
        }
      }
      
      // CRITICAL: Return the complete data structure that shows what's available to the step
      let finalInputData = {};
      let componentFqn = 'unknown';
      let dslConfig = {};
      
      if (stepId === 'trigger') {
        // For trigger, show the trigger input data
        finalInputData = triggerData;
        componentFqn = flowDef.trigger?.type || 'trigger';
        dslConfig = flowDef.trigger?.config || {};
      } else if (flowDef.steps && targetStepIndex >= 0) {
        const targetStep = flowDef.steps[targetStepIndex];
        
        // CRITICAL: Show the complete data structure that the step receives
        // This includes both the resolved input AND the complete execution history
        const resolvedStepInput = this.resolveStepInputFromSimulation(targetStep, stepResults, contextState);
        
        // Get component info
        const moduleFqn = flowFqn.split('.').slice(0, -1).join('.');
        const componentInfo = this.moduleRegistry.resolveComponentTypeInfo(targetStep.component_ref, moduleFqn);
        componentFqn = componentInfo?.baseType || targetStep.component_ref;
        dslConfig = targetStep.config || {};
        
        // CRITICAL: Create a comprehensive input data structure that shows:
        // 1. The actual resolved input that the component receives
        // 2. The complete execution history up to this point
        // 3. Available context variables
        finalInputData = {
          // The actual input data that the component receives (what gets passed to simulateComponentExecution)
          resolvedInput: resolvedStepInput,
          
          // Complete execution history showing the data flow chain
          executionHistory: {
            trigger: {
              stepId: 'trigger',
              componentType: triggerResult.componentFqn,
              outputData: triggerResult.outputData
            },
            steps: Object.fromEntries(
              Object.entries(stepResults)
                .filter(([id]) => id !== 'trigger')
                .map(([id, result]: [string, any]) => [
                  id, 
                  {
                    stepId: result.stepId,
                    componentType: result.componentFqn,
                    inputData: result.inputData,
                    outputData: result.outputData
                  }
                ])
            )
          },
          
          // Available context variables at this point
          availableContext: contextState,
          
          // Input mappings for this step (how the resolvedInput was constructed)
          inputMappings: targetStep.inputs_map || {},
          
          // Execution order up to this point
          executionOrder: executionOrder,
          
          // Step configuration
          stepConfig: dslConfig
        };
      }
      
      return {
        stepId,
        flowFqn,
        componentFqn,
        actualInputData: finalInputData,
        dslConfig,
        availableContext: contextState
      };
    } catch (error) {
      console.error('Flow simulation failed, falling back to mock data:', error);
      
      // Fallback to original logic if simulation fails
      const flowDef = this.moduleRegistry.getFlowDefinition(flowFqn);
      if (!flowDef) {
        throw new Error(`Flow not found: ${flowFqn}`);
      }
      
      const step = flowDef.steps?.find((s: any) => s.step_id === stepId);
      if (!step) {
        throw new Error(`Step not found: ${stepId} in flow ${flowFqn}`);
      }
      
      // Generate basic mock data as fallback
      let resolvedInputData: Record<string, any> = {};
      if (step.inputs_map) {
        Object.keys(step.inputs_map).forEach(key => {
          resolvedInputData[key] = `resolved_${key}_value`;
        });
      }
      
      return {
        stepId,
        flowFqn,
        componentFqn: 'unknown',
        actualInputData: resolvedInputData,
        dslConfig: {},
        availableContext: {}
      };
    }
  }

  private createTriggerOutputData(trigger: any, triggerData: any): any {
    // CRITICAL: Trigger must produce proper outputData that can be consumed by steps
    // This should match what DataGenerationService.generateTriggerData produces
    
    // For HTTP triggers, the triggerData from DataGenerationService already has the correct structure
    // We just need to ensure it's properly formatted for step consumption
    if (trigger?.type === 'StdLib.Trigger:Http') {
      // triggerData from DataGenerationService already has body, headers, etc.
      // Just ensure we return it in the correct format
      return {
        body: triggerData.body || triggerData,
        headers: triggerData.headers || {},
        query: triggerData.query || {},
        method: triggerData.method || 'POST',
        url: triggerData.url || triggerData.path || '/webhook'
      };
    } else if (trigger?.type === 'StdLib.Trigger:Schedule' || trigger?.type === 'StdLib.Trigger:Scheduled') {
      // Schedule triggers provide timestamp and config
      return {
        timestamp: triggerData.scheduledTime || new Date().toISOString(),
        scheduledTime: triggerData.scheduledTime || new Date().toISOString(),
        data: triggerData.data || {},
        config: trigger.config || {}
      };
    } else if (trigger?.type === 'StdLib.Trigger:EventBus') {
      // Event triggers provide event data
      return {
        event: triggerData.eventData || triggerData.data || {},
        eventType: triggerData.eventType || trigger.config?.eventType || 'generic-event',
        metadata: {
          timestamp: triggerData.receivedAt || new Date().toISOString(),
          eventId: triggerData.eventData?.eventId || 'event-' + Math.random().toString(36).substr(2, 9)
        }
      };
    } else {
      // Generic trigger - ensure we have a proper structure
      return {
        data: triggerData.data || triggerData,
        timestamp: new Date().toISOString(),
        source: 'trigger'
      };
    }
  }
} 