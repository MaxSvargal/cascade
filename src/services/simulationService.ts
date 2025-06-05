// Simulation Service
// Comprehensive flow execution simulation with proper data propagation and component execution
// Handles step execution simulation, data resolution, and complete flow simulation

import { 
  IModuleRegistry, 
  ComponentSchema,
  ResolvedStepInput,
  FlowSimulationResult,
  ExecutionOptions,
  FlowExecutionStatusEnum
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
   * Simulate complete flow execution - simplified for client-side use
   */
  async simulateFlowExecutionDetailed(
    flowFqn: string,
    triggerInput: any,
    targetStepId?: string,
    executionOptions?: FlowExecutionOptions
  ): Promise<InternalFlowSimulationResult> {
    console.log(`🚀 Starting simplified flow simulation for ${flowFqn}`, { triggerInput, targetStepId });

    // Get flow definition from module registry
    const flowDef = this.moduleRegistry.getFlowDefinition(flowFqn);
    if (!flowDef) {
      throw new Error(`Flow not found: ${flowFqn}`);
    }

    const executionId = 'sim-' + Math.random().toString(36).substr(2, 9);
    const startTime = new Date().toISOString();
    const stepResults = new Map<string, StepExecutionResult>();
    const errors: any[] = [];

    // Execute trigger
    const triggerResult = this.executeTrigger(flowDef.trigger, triggerInput, null as any);
    stepResults.set('trigger', triggerResult);

    // Execute steps until target step (or all steps)
    const stepsToExecute = targetStepId ? 
      this.getStepsUpToTarget(flowDef.steps || [], targetStepId) :
      (flowDef.steps || []);

    for (const step of stepsToExecute) {
      try {
        // Simple step execution using existing simulateStepExecution method
        const stepResult = this.simulateStepExecution(
          step, 
          Object.fromEntries(stepResults), 
          {}, 
          flowFqn
        );

        // Convert to StepExecutionResult format
        const executionResult: StepExecutionResult = {
          stepId: step.step_id,
          componentType: stepResult.componentFqn,
          inputData: stepResult.inputData,
          outputData: stepResult.outputData,
          executionTime: 100,
          timestamp: new Date().toISOString(),
          success: stepResult.simulationSuccess
        };

        stepResults.set(step.step_id, executionResult);

        if (step.step_id === targetStepId) {
          break;
        }
      } catch (error: any) {
        console.error(`❌ Step ${step.step_id} failed:`, error);
        errors.push({
          stepId: step.step_id,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        if (!executionOptions?.continueOnError) {
          break;
        }
      }
    }

    // Build simplified result
    const finalResult: InternalFlowSimulationResult = {
      executionId,
      flowFqn,
      success: errors.length === 0,
      startTime,
      endTime: new Date().toISOString(),
      triggerInput,
      finalOutput: stepResults.size > 1 ? Array.from(stepResults.values())[stepResults.size - 1].outputData : triggerInput,
      stepResults: Object.fromEntries(stepResults),
      executionLog: [],
      errors,
      contextVariables: {},
      resolvedStepInputs: {}
    };

    console.log(`🏁 Simplified flow simulation completed:`, finalResult);
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

  private getStepsUpToTarget(steps: any[], targetStepId: string): any[] {
    const targetIndex = steps.findIndex(step => step.step_id === targetStepId);
    return targetIndex >= 0 ? steps.slice(0, targetIndex + 1) : steps;
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
      // Handle both array and object formats for outputs_map
      if (Array.isArray(step.outputs_map)) {
        step.outputs_map.forEach((outputMapping: any) => {
          if (outputMapping.target && outputMapping.target.startsWith('context.')) {
            const contextVar = outputMapping.target.replace('context.', '');
            const sourceValue = this.dataGenerationService.getNestedValue(outputData, outputMapping.source);
            contextChanges[contextVar] = sourceValue;
          }
        });
      } else if (typeof step.outputs_map === 'object') {
        // Handle object format: { "context.varName": "outputField" }
        Object.entries(step.outputs_map).forEach(([target, source]: [string, any]) => {
          if (target.startsWith('context.')) {
            const contextVar = target.replace('context.', '');
            const sourceValue = this.dataGenerationService.getNestedValue(outputData, source);
            contextChanges[contextVar] = sourceValue;
          }
        });
      }
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
      
      // Debug logging
      console.log('🔍 Debug: Flow definition found:', {
        flowFqn,
        hasSteps: !!flowDef.steps,
        stepCount: flowDef.steps?.length || 0,
        stepIds: flowDef.steps?.map((s: any) => s.step_id) || [],
        requestedStepId: stepId
      });
      
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
          console.error(`❌ Target step not found: ${stepId} in flow ${flowFqn}`);
          console.error('Available steps:', flowDef.steps.map((s: any) => s.step_id));
          throw new Error(`Target step not found: ${stepId} in flow ${flowFqn}. Available steps: ${flowDef.steps.map((s: any) => s.step_id).join(', ')}`);
        }
      } else if (stepId !== 'trigger') {
        console.error(`❌ Flow has no steps and requested step is not 'trigger': ${stepId} in flow ${flowFqn}`);
        throw new Error(`Flow ${flowFqn} has no steps and requested step '${stepId}' is not 'trigger'`);
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