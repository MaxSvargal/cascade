// Server-Side Execution Engine
// Handles flow execution with streaming updates via Server-Sent Events

import {
  StreamingExecutionRequest,
  StepExecutionRequest,
  StreamingExecutionEvent,
  StreamingEventType,
  ExecutionStartedEvent,
  StepStartedEvent,
  StepCompletedEvent,
  StepFailedEvent,
  ExecutionCompletedEvent,
  ExecutionFailedEvent,
  ExecutionStatus,
  ExecutionOptions,
  FlowExecutionStatusEnum,
  ExecutionError,
  ComponentSchema
} from '../models/cfv_models_generated';

export interface ExecutionContext {
  executionId: string;
  flowFqn: string;
  flowDefinition: any;
  triggerInput: any;
  stepResults: Map<string, any>;
  contextVariables: Map<string, any>;
  startTime: string;
  currentStep?: string;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  eventSequence: number;
  estimatedDuration: number;
}

export interface StreamingCallback {
  (event: StreamingExecutionEvent): void;
}

export class ServerExecutionEngine {
  private activeExecutions: Map<string, ExecutionContext> = new Map();
  private componentSchemas: Record<string, ComponentSchema>;
  
  constructor(componentSchemas: Record<string, ComponentSchema> = {}) {
    this.componentSchemas = componentSchemas;
  }

  /**
   * Execute a flow with streaming updates
   */
  async executeFlow(
    request: StreamingExecutionRequest,
    streamCallback: StreamingCallback
  ): Promise<ExecutionContext> {
    const executionId = request.executionId || this.generateExecutionId();
    // Use the full FQN from the request if available, otherwise fall back to flow definition name
    const flowFqn = (request as any).flowFqn || request.flowDefinition.name || 'unknown-flow';
    
    // Initialize execution context
    const context: ExecutionContext = {
      executionId,
      flowFqn,
      flowDefinition: request.flowDefinition,
      triggerInput: request.triggerInput,
      stepResults: new Map(),
      contextVariables: new Map(),
      startTime: new Date().toISOString(),
      totalSteps: (request.flowDefinition.steps || []).length + 1, // +1 for trigger
      completedSteps: 0,
      failedSteps: 0,
      status: 'running',
      eventSequence: 0,
      estimatedDuration: this.estimateFlowDuration(request.flowDefinition)
    };

    this.activeExecutions.set(executionId, context);

    try {
      // Send execution started event
      this.sendEvent(streamCallback, context, 'execution.started', {
        executionId,
        flowFqn,
        triggerInput: request.triggerInput,
        totalSteps: context.totalSteps,
        estimatedDuration: context.estimatedDuration
      } as ExecutionStartedEvent);

      // Execute trigger
      await this.executeTrigger(context, streamCallback);

      // Execute steps
      const steps = request.flowDefinition.steps || [];
      const targetStepIndex = request.targetStepId ? 
        steps.findIndex((s: any) => s.step_id === request.targetStepId) : 
        steps.length - 1;

      if (request.targetStepId && targetStepIndex === -1) {
        throw new Error(`Target step not found: ${request.targetStepId}`);
      }

      // Build dependency graph for parallel execution
      const dependencyGraph = this.buildDependencyGraph(steps);
      
      // Execute steps with dependency resolution
      await this.executeStepsWithDependencies(
        steps.slice(0, targetStepIndex + 1),
        context,
        streamCallback,
        dependencyGraph
      );

      // Mark execution as completed
      context.status = 'completed';
      this.sendEvent(streamCallback, context, 'execution.completed', {
        executionId,
        flowFqn, // Use the full FQN from context
        status: 'COMPLETED' as FlowExecutionStatusEnum,
        totalDuration: Date.now() - new Date(context.startTime).getTime(),
        stepCount: context.totalSteps,
        successfulSteps: context.completedSteps,
        failedSteps: context.failedSteps,
        finalOutput: this.getFinalOutput(context),
        finalContext: Object.fromEntries(context.contextVariables)
      } as ExecutionCompletedEvent);

    } catch (error: any) {
      context.status = 'failed';
      this.sendEvent(streamCallback, context, 'execution.failed', {
        executionId,
        flowFqn, // Use the full FQN from context
        error: {
          errorType: 'ExecutionError',
          message: error.message,
          timestamp: new Date().toISOString()
        } as ExecutionError,
        totalDuration: Date.now() - new Date(context.startTime).getTime(),
        completedSteps: context.completedSteps,
        failedStep: context.currentStep
      } as ExecutionFailedEvent);
      
      throw error;
    } finally {
      // Keep execution context for a while for status queries
      setTimeout(() => {
        this.activeExecutions.delete(executionId);
      }, 300000); // 5 minutes
    }

    return context;
  }

  /**
   * Execute a single step
   */
  async executeStep(request: StepExecutionRequest): Promise<any> {
    const stepId = request.stepDefinition.step_id || 'unknown-step';
    const componentFqn = request.stepDefinition.component_ref || 'unknown-component';
    
    const startTime = Date.now();
    
    try {
      // Get component schema for realistic simulation
      const componentSchema = this.componentSchemas[componentFqn];
      
      // Simulate component execution
      const output = await this.simulateComponentExecution(
        componentFqn,
        request.inputData,
        request.componentConfig,
        componentSchema
      );
      
      const duration = Date.now() - startTime;
      
      return {
        stepId,
        componentFqn,
        status: 'SUCCESS',
        startTime: new Date(startTime).toISOString(),
        endTime: new Date().toISOString(),
        durationMs: duration,
        inputData: request.inputData,
        outputData: output
      };
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        stepId,
        componentFqn,
        status: 'FAILURE',
        startTime: new Date(startTime).toISOString(),
        endTime: new Date().toISOString(),
        durationMs: duration,
        inputData: request.inputData,
        errorData: {
          errorType: 'ComponentExecutionError',
          message: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId: string): ExecutionStatus | null {
    const context = this.activeExecutions.get(executionId);
    if (!context) return null;

    return {
      executionId,
      flowFqn: context.flowFqn,
      status: context.status,
      currentStep: context.currentStep,
      progress: {
        totalSteps: context.totalSteps,
        completedSteps: context.completedSteps,
        currentStepIndex: context.completedSteps
      },
      startTime: context.startTime,
      estimatedEndTime: context.status === 'running' ? 
        new Date(new Date(context.startTime).getTime() + context.estimatedDuration).toISOString() : 
        undefined,
      actualEndTime: context.status !== 'running' ? new Date().toISOString() : undefined
    };
  }

  /**
   * Cancel execution
   */
  cancelExecution(executionId: string): boolean {
    const context = this.activeExecutions.get(executionId);
    if (!context || context.status !== 'running') return false;

    context.status = 'cancelled';
    return true;
  }

  /**
   * Execute trigger step
   */
  private async executeTrigger(
    context: ExecutionContext,
    streamCallback: StreamingCallback
  ): Promise<void> {
    const stepId = 'trigger';
    context.currentStep = stepId;

    // Send step started event
    this.sendEvent(streamCallback, context, 'step.started', {
      stepId,
      componentFqn: 'trigger',
      inputData: context.triggerInput,
      estimatedDuration: 100,
      executionOrder: 0
    } as StepStartedEvent);

    // Simulate trigger execution time
    await this.delay(50 + Math.random() * 100);

    // Create trigger output
    const triggerOutput = {
      data: context.triggerInput,
      timestamp: new Date().toISOString(),
      source: 'trigger'
    };

    context.stepResults.set(stepId, {
      stepId,
      componentFqn: 'trigger',
      inputData: context.triggerInput,
      outputData: triggerOutput,
      executionOrder: 0
    });

    context.completedSteps++;

    // Send step completed event
    this.sendEvent(streamCallback, context, 'step.completed', {
      stepId,
      componentFqn: 'trigger',
      inputData: context.triggerInput,
      outputData: triggerOutput,
      actualDuration: 100,
      executionOrder: 0
    } as StepCompletedEvent);
  }

  /**
   * Execute steps with dependency resolution and parallel execution
   */
  private async executeStepsWithDependencies(
    steps: any[],
    context: ExecutionContext,
    streamCallback: StreamingCallback,
    dependencyGraph: Map<string, Set<string>>
  ): Promise<void> {
    const completedSteps = new Set<string>(['trigger']); // Trigger is always completed first
    let executionOrder = 1; // Start after trigger
    let warningsSent = 0; // Track warnings to prevent infinite loops
    const maxWarnings = 5; // Increased from 3 to 5

    console.log(`🚀 Starting step execution: ${steps.length} total steps`);
    console.log(`📊 Dependency graph:`, Array.from(dependencyGraph.entries()).map(([step, deps]) => ({ step, dependencies: Array.from(deps) })));

    while (completedSteps.size - 1 < steps.length && warningsSent < maxWarnings) {
      // Find steps that are ready to execute (all dependencies completed)
      const readySteps = this.findReadySteps(steps, completedSteps, dependencyGraph);
      
      console.log(`🔍 Iteration ${executionOrder}: ${readySteps.length} steps ready to execute:`, readySteps.map(s => s.step_id));
      console.log(`✅ Completed steps so far:`, Array.from(completedSteps));
      
      if (readySteps.length === 0) {
        // No more steps can be executed - check for circular dependencies
        const remainingSteps = steps.filter(s => !completedSteps.has(s.step_id));
        if (remainingSteps.length > 0) {
          // Send warning event instead of throwing error
          console.warn(`⚠️ Circular dependency detected or unresolvable dependencies for steps: ${remainingSteps.map(s => s.step_id).join(', ')}`);
          
          // Log detailed dependency analysis
          remainingSteps.forEach(step => {
            const dependencies = dependencyGraph.get(step.step_id) || new Set();
            const unmetDependencies = Array.from(dependencies).filter(dep => !completedSteps.has(dep));
            console.warn(`  - ${step.step_id}: waiting for [${unmetDependencies.join(', ')}]`);
          });
          
          // Send a warning event to the client
          this.sendEvent(streamCallback, context, 'execution.warning', {
            warningType: 'CircularDependency',
            message: `Circular dependency detected or unresolvable dependencies for steps: ${remainingSteps.map(s => s.step_id).join(', ')}`,
            affectedSteps: remainingSteps.map(s => s.step_id),
            timestamp: new Date().toISOString()
          });
          
          warningsSent++;
          
          // ENHANCED FALLBACK STRATEGY: Try multiple approaches
          
          // 1. Try to execute steps without dependencies as a fallback
          const independentSteps = remainingSteps.filter(step => {
            const dependencies = dependencyGraph.get(step.step_id) || new Set();
            // Remove already completed dependencies
            const unmetDependencies = Array.from(dependencies).filter(dep => !completedSteps.has(dep));
            return unmetDependencies.length === 0;
          });
          
          console.log(`🔍 Found ${independentSteps.length} independent steps:`, independentSteps.map(s => s.step_id));
          
          if (independentSteps.length > 0) {
            console.log(`🔄 Executing ${independentSteps.length} independent steps as fallback:`, independentSteps.map(s => s.step_id));
            await this.executeStepsInParallel(independentSteps, context, streamCallback, executionOrder);
            independentSteps.forEach(step => completedSteps.add(step.step_id));
            executionOrder += independentSteps.length;
            continue;
          }
          
          // 2. Try to execute steps with only missing dependencies (ignore unmet dependencies)
          const stepsWithMinimalDeps = remainingSteps.filter(step => {
            const dependencies = dependencyGraph.get(step.step_id) || new Set();
            const unmetDependencies = Array.from(dependencies).filter(dep => !completedSteps.has(dep));
            return unmetDependencies.length <= 2; // Allow steps with up to 2 unmet dependencies
          }).slice(0, 3); // Limit to 3 steps to avoid overwhelming
          
          if (stepsWithMinimalDeps.length > 0) {
            console.log(`🔄 Executing ${stepsWithMinimalDeps.length} steps with minimal dependencies:`, stepsWithMinimalDeps.map(s => s.step_id));
            await this.executeStepsInParallel(stepsWithMinimalDeps, context, streamCallback, executionOrder);
            stepsWithMinimalDeps.forEach(step => completedSteps.add(step.step_id));
            executionOrder += stepsWithMinimalDeps.length;
            continue;
          }
          
          // 3. If no independent steps found, try to execute first remaining step to break deadlock
          if (remainingSteps.length > 0) {
            console.log(`🔄 Executing first remaining step to break deadlock: ${remainingSteps[0].step_id}`);
            await this.executeStepsInParallel([remainingSteps[0]], context, streamCallback, executionOrder);
            completedSteps.add(remainingSteps[0].step_id);
            executionOrder++;
            continue;
          }
        }
        break;
      }

      // Execute ready steps in parallel
      console.log(`⚡ Executing ${readySteps.length} steps in parallel...`);
      await this.executeStepsInParallel(readySteps, context, streamCallback, executionOrder);

      // Mark steps as completed
      readySteps.forEach(step => completedSteps.add(step.step_id));
      executionOrder += readySteps.length;
      
      console.log(`✅ Completed batch. Total completed: ${completedSteps.size - 1}/${steps.length}`);
    }
    
    // FINAL FALLBACK: If we still have unexecuted steps and haven't hit warning limit, execute them all
    const finalRemainingSteps = steps.filter(s => !completedSteps.has(s.step_id));
    if (finalRemainingSteps.length > 0 && warningsSent < maxWarnings) {
      console.log(`🚨 Final fallback: executing ${finalRemainingSteps.length} remaining steps:`, finalRemainingSteps.map(s => s.step_id));
      
      // Execute remaining steps in small batches to avoid overwhelming
      const batchSize = 3;
      for (let i = 0; i < finalRemainingSteps.length; i += batchSize) {
        const batch = finalRemainingSteps.slice(i, i + batchSize);
        console.log(`🔄 Executing final batch ${Math.floor(i/batchSize) + 1}:`, batch.map(s => s.step_id));
        
        try {
          await this.executeStepsInParallel(batch, context, streamCallback, executionOrder);
          batch.forEach(step => completedSteps.add(step.step_id));
          executionOrder += batch.length;
        } catch (error) {
          console.error(`❌ Failed to execute final batch:`, error);
          // Continue with next batch even if this one fails
        }
      }
    }
    
    // Log final execution summary
    const totalSteps = steps.length;
    const executedSteps = completedSteps.size - 1; // -1 for trigger
    console.log(`🏁 Execution completed: ${executedSteps}/${totalSteps} steps executed`);
    
    if (executedSteps < totalSteps) {
      const unexecutedSteps = steps.filter(s => !completedSteps.has(s.step_id));
      console.warn(`⚠️ ${unexecutedSteps.length} steps were not executed:`, unexecutedSteps.map(s => s.step_id));
    }
  }

  /**
   * Execute multiple steps in parallel
   */
  private async executeStepsInParallel(
    steps: any[],
    context: ExecutionContext,
    streamCallback: StreamingCallback,
    executionOrder: number
  ): Promise<void> {
    const stepPromises = steps.map(async (step, index) => {
      const stepId = step.step_id;
      context.currentStep = stepId;

      try {
        // Resolve step input from previous step results
        const stepInput = this.resolveStepInput(step, context);
        
        // Get component execution timing
        const componentFqn = step.component_ref || 'unknown';
        const executionTiming = this.getComponentExecutionTiming(componentFqn, step.config);

        // Send step started event
        this.sendEvent(streamCallback, context, 'step.started', {
          stepId,
          componentFqn,
          inputData: stepInput,
          estimatedDuration: executionTiming.estimatedDurationMs,
          executionOrder: executionOrder + index
        } as StepStartedEvent);

        // Wait for component execution time
        await this.delay(executionTiming.estimatedDurationMs);

        // Simulate component execution
        const componentSchema = this.componentSchemas[componentFqn];
        const stepOutput = await this.simulateComponentExecution(
          componentFqn,
          stepInput,
          step.config,
          componentSchema
        );

        // Store step result
        context.stepResults.set(stepId, {
          stepId,
          componentFqn,
          inputData: stepInput,
          outputData: stepOutput,
          executionOrder: executionOrder + index
        });

        context.completedSteps++;

        // Send step completed event
        this.sendEvent(streamCallback, context, 'step.completed', {
          stepId,
          componentFqn,
          inputData: stepInput,
          outputData: stepOutput,
          actualDuration: executionTiming.estimatedDurationMs,
          executionOrder: executionOrder + index
        } as StepCompletedEvent);

      } catch (error: any) {
        context.failedSteps++;

        // Send step failed event
        this.sendEvent(streamCallback, context, 'step.failed', {
          stepId,
          componentFqn: step.component_ref || 'unknown',
          inputData: {},
          error: {
            errorType: 'StepExecutionError',
            message: error.message,
            stepId,
            timestamp: new Date().toISOString()
          } as ExecutionError,
          actualDuration: 0,
          executionOrder: executionOrder + index
        } as StepFailedEvent);

        throw error;
      }
    });

    await Promise.all(stepPromises);
  }

  /**
   * Build dependency graph from steps
   */
  private buildDependencyGraph(steps: any[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();
    
    steps.forEach(step => {
      const dependencies = new Set<string>();
      
      // Add run_after dependencies
      if (step.run_after) {
        if (Array.isArray(step.run_after)) {
          step.run_after.forEach((dep: string) => dependencies.add(dep));
        } else {
          dependencies.add(step.run_after);
        }
      }
      
      // Add input mapping dependencies - FIXED PARSING
      if (step.inputs_map) {
        Object.values(step.inputs_map).forEach((mapping: any) => {
          if (typeof mapping === 'string') {
            // Extract step references using regex to match "steps.stepName" pattern
            const stepReferences = mapping.match(/steps\.([a-zA-Z0-9_-]+)/g);
            if (stepReferences) {
              stepReferences.forEach((ref: string) => {
                // Extract just the step name after "steps."
                const stepName = ref.replace('steps.', '');
                if (stepName !== 'trigger' && stepName !== 'context' && stepName.length > 0) {
                  dependencies.add(stepName);
                }
              });
            }
          }
        });
      }
      
      graph.set(step.step_id, dependencies);
    });
    
    console.log(`📊 Built dependency graph:`, Array.from(graph.entries()).map(([step, deps]) => ({ 
      step, 
      dependencies: Array.from(deps) 
    })));
    
    return graph;
  }

  /**
   * Find steps that are ready to execute
   */
  private findReadySteps(
    steps: any[],
    completedSteps: Set<string>,
    dependencyGraph: Map<string, Set<string>>
  ): any[] {
    return steps.filter(step => {
      if (completedSteps.has(step.step_id)) return false;
      
      const dependencies = dependencyGraph.get(step.step_id) || new Set();
      return Array.from(dependencies).every(dep => completedSteps.has(dep));
    });
  }

  /**
   * Resolve step input from previous step results
   */
  private resolveStepInput(step: any, context: ExecutionContext): any {
    const resolvedInput: any = {};
    
    if (step.inputs_map) {
      Object.entries(step.inputs_map).forEach(([inputKey, mapping]) => {
        try {
          const resolvedValue = this.resolveInputMapping(mapping as string, context);
          if (resolvedValue !== undefined) {
            resolvedInput[inputKey] = resolvedValue;
          }
        } catch (error) {
          console.warn(`Failed to resolve input mapping for ${inputKey}:`, error);
        }
      });
    }
    
    return resolvedInput;
  }

  /**
   * Resolve input mapping expression
   */
  private resolveInputMapping(mapping: string, context: ExecutionContext): any {
    if (typeof mapping !== 'string') return mapping;
    
    // Handle complex expressions with step references
    if (mapping.includes('steps.')) {
      try {
        // Replace step references with actual values
        let resolvedExpression = mapping;
        
        // Find all step references in the expression
        const stepReferences = mapping.match(/steps\.([a-zA-Z0-9_-]+)\.outputs\.([a-zA-Z0-9_.]+)/g);
        if (stepReferences) {
          stepReferences.forEach((ref: string) => {
            const match = ref.match(/steps\.([a-zA-Z0-9_-]+)\.outputs\.(.+)/);
            if (match) {
              const [, stepName, outputPath] = match;
              const stepResult = context.stepResults.get(stepName);
              if (stepResult) {
                const value = this.getNestedValue(stepResult.outputData, outputPath);
                // Replace the reference with the actual value
                resolvedExpression = resolvedExpression.replace(ref, JSON.stringify(value));
              }
            }
          });
        }
        
        // Handle trigger references
        resolvedExpression = resolvedExpression.replace(/trigger\.([a-zA-Z0-9_.]+)/g, (match, path) => {
          const triggerResult = context.stepResults.get('trigger');
          if (triggerResult) {
            const value = this.getNestedValue(triggerResult.outputData, path);
            return JSON.stringify(value);
          }
          return match;
        });
        
        // If the expression looks like a JSON object or array, try to parse it
        if ((resolvedExpression.trim().startsWith('{') && resolvedExpression.trim().endsWith('}')) ||
            (resolvedExpression.trim().startsWith('[') && resolvedExpression.trim().endsWith(']'))) {
          try {
            return JSON.parse(resolvedExpression);
          } catch (e) {
            console.warn(`Failed to parse resolved expression as JSON: ${resolvedExpression}`);
            return resolvedExpression;
          }
        }
        
        return resolvedExpression;
      } catch (error) {
        console.warn(`Failed to resolve complex expression: ${mapping}`, error);
        return mapping;
      }
    }
    
    // Handle simple dot notation references (legacy support)
    if (mapping.includes('.')) {
      const [sourceStep, ...pathParts] = mapping.split('.');
      const path = pathParts.join('.');
      
      if (sourceStep === 'trigger') {
        return this.getNestedValue(context.stepResults.get('trigger')?.outputData, path);
      } else if (sourceStep === 'context') {
        return context.contextVariables.get(path);
      } else {
        const stepResult = context.stepResults.get(sourceStep);
        return stepResult ? this.getNestedValue(stepResult.outputData, path) : undefined;
      }
    }
    
    return mapping;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return obj;
    
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Simulate component execution with realistic output
   */
  private async simulateComponentExecution(
    componentFqn: string,
    inputData: any,
    config: any,
    componentSchema?: ComponentSchema
  ): Promise<any> {
    // Generate realistic output based on component type and schema
    if (componentSchema?.outputSchema) {
      return this.generateDataFromSchema(componentSchema.outputSchema);
    }
    
    // Default output based on component type
    switch (componentFqn) {
      case 'StdLib:HttpCall':
        return {
          status: 200,
          data: { result: 'success', timestamp: new Date().toISOString() },
          headers: { 'content-type': 'application/json' }
        };
      
      case 'StdLib:Fork':
        return { branches: ['branch1', 'branch2'], forkId: Math.random().toString(36) };
      
      case 'StdLib:Validator':
        return { valid: true, validatedData: inputData };
      
      case 'StdLib:MapData':
        return { mappedData: inputData, transformedAt: new Date().toISOString() };
      
      default:
        return { result: 'success', output: inputData, processedAt: new Date().toISOString() };
    }
  }

  /**
   * Generate data from JSON schema
   */
  private generateDataFromSchema(schema: any): any {
    if (!schema || typeof schema !== 'object') return {};
    
    if (schema.type === 'object' && schema.properties) {
      const result: any = {};
      Object.entries(schema.properties).forEach(([key, propSchema]: [string, any]) => {
        result[key] = this.generateDataFromSchema(propSchema);
      });
      return result;
    }
    
    if (schema.type === 'array') {
      return [this.generateDataFromSchema(schema.items || {})];
    }
    
    switch (schema.type) {
      case 'string': return schema.example || 'sample-string';
      case 'number': return schema.example || 42;
      case 'boolean': return schema.example || true;
      default: return schema.example || null;
    }
  }

  /**
   * Get component execution timing
   */
  private getComponentExecutionTiming(componentFqn: string, config: any): { estimatedDurationMs: number; isAsync: boolean } {
    switch (componentFqn) {
      case 'StdLib:HttpCall':
        return { 
          estimatedDurationMs: (config?.timeoutMs || 5000) * 0.7, 
          isAsync: true 
        };
      
      case 'StdLib:SubFlowInvoker':
        return { 
          estimatedDurationMs: Math.random() * 4000 + 1000, 
          isAsync: true 
        };
      
      case 'StdLib:WaitForDuration':
        return { 
          estimatedDurationMs: config?.durationMs || 1000, 
          isAsync: true 
        };
      
      case 'StdLib:Fork':
        return { 
          estimatedDurationMs: Math.random() * 15 + 5, 
          isAsync: false 
        };
      
      case 'StdLib:Validator':
        return { 
          estimatedDurationMs: Math.random() * 40 + 10, 
          isAsync: false 
        };
      
      case 'StdLib:MapData':
        return { 
          estimatedDurationMs: Math.random() * 80 + 20, 
          isAsync: false 
        };
      
      default:
        return { 
          estimatedDurationMs: Math.random() * 200 + 100, 
          isAsync: false 
        };
    }
  }

  /**
   * Estimate total flow duration
   */
  private estimateFlowDuration(flowDefinition: any): number {
    const steps = flowDefinition.steps || [];
    let totalDuration = 100; // Trigger time
    
    steps.forEach((step: any) => {
      const timing = this.getComponentExecutionTiming(step.component_ref, step.config);
      totalDuration += timing.estimatedDurationMs;
    });
    
    return totalDuration;
  }

  /**
   * Get final output from execution context
   */
  private getFinalOutput(context: ExecutionContext): any {
    const steps = context.flowDefinition.steps || [];
    if (steps.length === 0) return context.triggerInput;
    
    const lastStep = steps[steps.length - 1];
    const lastStepResult = context.stepResults.get(lastStep.step_id);
    return lastStepResult?.outputData || {};
  }

  /**
   * Send streaming event
   */
  private sendEvent(
    streamCallback: StreamingCallback,
    context: ExecutionContext,
    type: StreamingEventType,
    data: any
  ): void {
    const event: StreamingExecutionEvent = {
      type,
      executionId: context.executionId,
      timestamp: new Date().toISOString(),
      sequence: ++context.eventSequence,
      data
    };
    
    streamCallback(event);
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default ServerExecutionEngine; 