// Simulation Service
// Wraps FlowSimulationService and provides simulation logic extracted from CascadeFlowVisualizer
// Handles step execution simulation and data resolution

import { 
  IModuleRegistry, 
  ComponentSchema,
  ResolvedStepInput,
  FlowSimulationResult,
  ExecutionOptions,
  FlowExecutionStatusEnum
} from '../models/cfv_models_generated';
import { FlowSimulationService, InternalFlowSimulationResult } from './flowSimulationService';
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

export class SimulationService {
  private flowSimulationService: FlowSimulationService;
  private dataGenerationService: DataGenerationService;

  constructor(
    private moduleRegistry: IModuleRegistry,
    private componentSchemas: Record<string, ComponentSchema> = {}
  ) {
    this.flowSimulationService = new FlowSimulationService(moduleRegistry, componentSchemas);
    this.dataGenerationService = new DataGenerationService(moduleRegistry, componentSchemas);
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
    const outputData = this.dataGenerationService.simulateComponentExecution(
      componentInfo.baseType, 
      inputData, 
      stepConfig, 
      componentSchema || undefined
    );

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
      outputData,
      contextChanges,
      executionOrder: Object.keys(previousStepResults).length,
      simulationSuccess: true
    };
  }

  /**
   * Resolve step input from simulation results
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

    // Process inputs_map to resolve actual data from previous steps
    if (step.inputs_map) {
      Object.entries(step.inputs_map).forEach(([inputField, sourceExpression]: [string, any]) => {
        console.log(`  📋 Resolving ${inputField} from: ${sourceExpression}`);
        let resolvedValue = null;

        if (typeof sourceExpression === 'string') {
          if (sourceExpression.startsWith('trigger.')) {
            const triggerResult = stepResults['trigger'];
            if (triggerResult) {
              const dataPath = sourceExpression.replace('trigger.', '');
              resolvedValue = this.dataGenerationService.getNestedValue(triggerResult.outputData, dataPath);
              console.log(`    ✅ From trigger.${dataPath}:`, resolvedValue);
            } else {
              console.log(`    ❌ Trigger result not found`);
            }
          } else if (sourceExpression.startsWith('steps.')) {
            // Enhanced parsing for complex nested paths like "steps.geo-compliance-check.outputs.jurisdiction-check.allowed"
            const stepsMatch = sourceExpression.match(/^steps\.([^.]+)\.(.+)$/);
            if (stepsMatch) {
              const sourceStepId = stepsMatch[1];
              const outputPath = stepsMatch[2];
              const sourceStepResult = stepResults[sourceStepId];
              
              if (sourceStepResult && sourceStepResult.outputData) {
                // Handle both "outputs.field" and direct field access
                if (outputPath.startsWith('outputs.')) {
                  const actualPath = outputPath.replace('outputs.', '');
                  resolvedValue = this.dataGenerationService.getNestedValue(sourceStepResult.outputData, actualPath);
                  console.log(`    ✅ From steps.${sourceStepId}.outputs.${actualPath}:`, resolvedValue);
                } else {
                  // Direct field access for backward compatibility
                  resolvedValue = this.dataGenerationService.getNestedValue(sourceStepResult.outputData, outputPath);
                  console.log(`    ✅ From steps.${sourceStepId}.${outputPath}:`, resolvedValue);
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

        // CRITICAL: Only assign if we have a resolved value, otherwise use null/undefined
        resolvedInput[inputField] = resolvedValue;
      });
    }

    console.log(`📥 Final resolved input for ${step.step_id}:`, resolvedInput);
    return resolvedInput;
  }

  /**
   * Simulate flow execution using the FlowSimulationService
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

    // Use the FlowSimulationService for actual simulation
    const internalResult: InternalFlowSimulationResult = await this.flowSimulationService.simulateFlowExecution(
      flowFqn,
      triggerInputData,
      targetStepId
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
        outputData: triggerData,
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
      
      // Resolve final input data for target step
      let finalInputData = {};
      if (stepId === 'trigger') {
        finalInputData = triggerData;
      } else if (flowDef.steps && targetStepIndex >= 0) {
        const targetStep = flowDef.steps[targetStepIndex];
        finalInputData = this.resolveStepInputFromSimulation(targetStep, stepResults, contextState);
      }
      
      return {
        stepId,
        flowFqn,
        componentFqn: 'unknown',
        actualInputData: finalInputData,
        dslConfig: {},
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

  /**
   * Get the data generation service for external use
   */
  getDataGenerationService(): DataGenerationService {
    return this.dataGenerationService;
  }

  /**
   * Get the flow simulation service for external use
   */
  getFlowSimulationService(): FlowSimulationService {
    return this.flowSimulationService;
  }
} 