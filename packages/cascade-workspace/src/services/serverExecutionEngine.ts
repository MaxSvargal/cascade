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
  ComponentSchema,
  TriggerRuntimeContext
} from '../models/cfv_models_generated';

export interface ExecutionContext {
  executionId: string;
  flowFqn: string;
  flowDefinition: any;
  triggerInput: any;
  /** Complete trigger runtime context including type, config, and standardized output data. */
  triggerContext?: TriggerRuntimeContext;
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

export interface DependencyAnalysis {
  graph: Map<string, Set<string>>;
  cycles: string[][];
  independentSteps: string[];
  executionOrder: string[][];
}

export interface StepExecutionResult {
  stepId: string;
  componentFqn: string;
  status: 'SUCCESS' | 'FAILURE';
  startTime: string;
  endTime: string;
  durationMs: number;
  inputData: any;
  outputData?: any;
  errorData?: any;
  executionOrder: number;
}

/**
 * Enhanced Server Execution Engine with robust dependency resolution
 * and comprehensive expression parsing capabilities
 */
export class ServerExecutionEngine {
  private activeExecutions: Map<string, ExecutionContext> = new Map();
  private componentSchemas: Record<string, ComponentSchema>;
  
  constructor(componentSchemas: Record<string, ComponentSchema> = {}) {
    this.componentSchemas = componentSchemas;
  }

  /**
   * Execute a flow with streaming updates and enhanced dependency resolution
   */
  async executeFlow(
    request: StreamingExecutionRequest,
    streamCallback: StreamingCallback
  ): Promise<ExecutionContext> {
    const executionId = request.executionId || this.generateExecutionId();
    const flowDefinition = request.flowDefinition;
    const triggerInput = request.triggerInput;
    
    // Create trigger runtime context
    const triggerContext: TriggerRuntimeContext = {
      triggerType: flowDefinition.trigger?.type || 'manual',
      triggerConfig: flowDefinition.trigger?.config || {},
      runtimeData: triggerInput,
      activationTimestamp: new Date().toISOString(),
      metadata: {
        originalEvent: triggerInput,
        processingInfo: {
          executionId,
          flowFqn: request.flowDefinition.name || 'unknown'
        }
      }
    };

    const context: ExecutionContext = {
      executionId,
      flowFqn: flowDefinition.name || 'unknown',
      flowDefinition,
      triggerInput,
      triggerContext,
      stepResults: new Map(),
      contextVariables: new Map(),
      startTime: new Date().toISOString(),
      totalSteps: (flowDefinition.steps?.length || 0) + 1, // +1 for trigger
      completedSteps: 0,
      failedSteps: 0,
      status: 'running',
      eventSequence: 0,
      estimatedDuration: this.estimateFlowDuration(flowDefinition)
    };

    this.activeExecutions.set(executionId, context);

    try {
      // Send execution started event with enhanced trigger context
      this.sendEvent(streamCallback, context, 'execution.started', {
        flowFqn: context.flowFqn,
        triggerInput: triggerInput, // For backward compatibility
        triggerContext: triggerContext,
        flowDefinition: flowDefinition
      });

      // Execute trigger step
      await this.executeTrigger(context, streamCallback);

      // Analyze dependencies
      const dependencyAnalysis = this.analyzeDependencies(flowDefinition.steps || []);

      // Execute steps with enhanced dependency resolution
      await this.executeStepsWithEnhancedDependencyResolution(
        flowDefinition.steps || [],
        context,
        streamCallback,
        dependencyAnalysis
      );

      context.status = 'completed';
      
      // Send execution completed event
      this.sendEvent(streamCallback, context, 'execution.completed', {
        executionId: context.executionId,
        flowFqn: context.flowFqn,
        status: 'COMPLETED' as FlowExecutionStatusEnum,
        totalDuration: Date.now() - new Date(context.startTime).getTime(),
        stepCount: context.totalSteps,
        successfulSteps: context.completedSteps,
        failedSteps: context.failedSteps,
        finalOutput: this.getFinalOutput(context),
        finalContext: Object.fromEntries(context.contextVariables)
      });

    } catch (error: any) {
      context.status = 'failed';
      
      // Send execution failed event
      this.sendEvent(streamCallback, context, 'execution.failed', {
        executionId: context.executionId,
        flowFqn: context.flowFqn,
        error: {
          errorType: 'FlowExecutionError',
          message: error.message,
          timestamp: new Date().toISOString()
        } as ExecutionError,
        totalDuration: Date.now() - new Date(context.startTime).getTime(),
        completedSteps: context.completedSteps,
        failedStep: context.currentStep
      });
      
      throw error;
    }

    return context;
  }

  /**
   * Enhanced dependency analysis with cycle detection and execution planning
   */
  private analyzeDependencies(steps: any[]): DependencyAnalysis {
    const graph = new Map<string, Set<string>>();
    const stepMap = new Map<string, any>();
    
    // Build step map for quick lookup
    steps.forEach(step => stepMap.set(step.step_id, step));
    
    // Build dependency graph with enhanced parsing
    steps.forEach(step => {
      const dependencies = this.extractStepDependencies(step);
      graph.set(step.step_id, dependencies);
    });
    
    // Detect cycles using DFS
    const cycles = this.detectCycles(graph);
    
    // Find independent steps (no dependencies or only depend on trigger/context)
    const independentSteps = steps
      .filter(step => {
        const deps = graph.get(step.step_id) || new Set();
        return deps.size === 0 || Array.from(deps).every(dep => dep === 'trigger' || dep === 'context');
      })
      .map(step => step.step_id);
    
    // Create execution order layers
    const executionOrder = this.createExecutionOrder(steps, graph);
    
    console.log(`📊 Dependency Graph:`, Array.from(graph.entries()).map(([step, deps]) => ({
      step,
      dependencies: Array.from(deps)
    })));
    
    if (cycles.length > 0) {
      console.warn(`⚠️ Detected ${cycles.length} dependency cycles:`, cycles);
    }
    
    return {
      graph,
      cycles,
      independentSteps,
      executionOrder
    };
  }

  /**
   * Extract step dependencies with robust expression parsing
   */
  private extractStepDependencies(step: any): Set<string> {
    const dependencies = new Set<string>();
    
    // Add explicit run_after dependencies
    if (step.run_after) {
      const runAfterDeps = Array.isArray(step.run_after) ? step.run_after : [step.run_after];
      runAfterDeps.forEach((dep: string) => {
        if (dep && typeof dep === 'string') {
          dependencies.add(dep);
        }
      });
    }
    
    // Extract dependencies from input mappings using enhanced parsing
    if (step.inputs_map) {
      Object.values(step.inputs_map).forEach((mapping: any) => {
        if (typeof mapping === 'string') {
          const stepDeps = this.extractStepReferencesFromExpression(mapping);
          stepDeps.forEach(dep => dependencies.add(dep));
        }
      });
    }
    
    // Extract dependencies from condition expressions
    if (step.condition && typeof step.condition === 'string') {
      const conditionDeps = this.extractStepReferencesFromExpression(step.condition);
      conditionDeps.forEach(dep => dependencies.add(dep));
    }
    
    return dependencies;
  }

  /**
   * Extract step references from complex expressions using comprehensive regex patterns
   */
  private extractStepReferencesFromExpression(expression: string): Set<string> {
    const stepRefs = new Set<string>();
    
    // Pattern 1: steps.stepName.outputs.path
    const stepsPattern = /steps\.([a-zA-Z0-9_-]+)(?:\.outputs)?(?:\.[a-zA-Z0-9_.]+)?/g;
    let match;
    while ((match = stepsPattern.exec(expression)) !== null) {
      const stepName = match[1];
      if (stepName && stepName !== 'trigger' && stepName !== 'context') {
        stepRefs.add(stepName);
      }
    }
    
    // Pattern 2: Direct step references without "steps." prefix (legacy support)
    const directPattern = /\b([a-zA-Z][a-zA-Z0-9_-]*)\.(outputs|result|data)\b/g;
    while ((match = directPattern.exec(expression)) !== null) {
      const stepName = match[1];
      if (stepName && stepName !== 'trigger' && stepName !== 'context' && stepName !== 'steps') {
        stepRefs.add(stepName);
      }
    }
    
    return stepRefs;
  }

  /**
   * Detect cycles in dependency graph using DFS
   */
  private detectCycles(graph: Map<string, Set<string>>): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const currentPath: string[] = [];
    
    const dfs = (node: string): boolean => {
      if (recursionStack.has(node)) {
        // Found a cycle - extract the cycle path
        const cycleStart = currentPath.indexOf(node);
        if (cycleStart >= 0) {
          cycles.push([...currentPath.slice(cycleStart), node]);
        }
        return true;
      }
      
      if (visited.has(node)) return false;
      
      visited.add(node);
      recursionStack.add(node);
      currentPath.push(node);
      
      const dependencies = graph.get(node) || new Set();
      for (const dep of Array.from(dependencies)) {
        if (graph.has(dep) && dfs(dep)) {
          return true;
        }
      }
      
      recursionStack.delete(node);
      currentPath.pop();
      return false;
    };
    
    for (const node of Array.from(graph.keys())) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }
    
    return cycles;
  }

  /**
   * Create execution order layers for parallel execution
   */
  private createExecutionOrder(steps: any[], graph: Map<string, Set<string>>): string[][] {
    const executionOrder: string[][] = [];
    const completed = new Set<string>(['trigger']); // Trigger is always completed first
    const remaining = new Set(steps.map(s => s.step_id));
    
    while (remaining.size > 0) {
      // Find steps that can be executed in this layer
      const readySteps = Array.from(remaining).filter(stepId => {
        const dependencies = graph.get(stepId) || new Set();
        return Array.from(dependencies).every(dep => completed.has(dep));
      });
      
      if (readySteps.length === 0) {
        // No more steps can be executed - break cycles by selecting independent steps
        const independentSteps = Array.from(remaining).filter(stepId => {
          const dependencies = graph.get(stepId) || new Set();
          const unmetDeps = Array.from(dependencies).filter(dep => !completed.has(dep));
          return unmetDeps.length <= 1; // Allow steps with minimal unmet dependencies
        });
        
        if (independentSteps.length > 0) {
          readySteps.push(...independentSteps.slice(0, 3)); // Limit to 3 to avoid overwhelming
        } else {
          // Last resort: pick the first remaining step
          readySteps.push(Array.from(remaining)[0]);
        }
      }
      
      if (readySteps.length > 0) {
        executionOrder.push(readySteps);
        readySteps.forEach(stepId => {
          completed.add(stepId);
          remaining.delete(stepId);
        });
      } else {
        break; // Safety break to avoid infinite loops
      }
    }
    
    return executionOrder;
  }

  /**
   * Execute steps with enhanced dependency resolution and parallel processing
   */
  private async executeStepsWithEnhancedDependencyResolution(
    steps: any[],
    context: ExecutionContext,
    streamCallback: StreamingCallback,
    dependencyAnalysis: DependencyAnalysis
  ): Promise<void> {
    let executionOrder = 1; // Start after trigger
    
    console.log(`🚀 Starting enhanced step execution with ${dependencyAnalysis.executionOrder.length} execution layers`);
    
    // Execute steps layer by layer
    for (let layerIndex = 0; layerIndex < dependencyAnalysis.executionOrder.length; layerIndex++) {
      const layer = dependencyAnalysis.executionOrder[layerIndex];
      const layerSteps = layer.map(stepId => steps.find(s => s.step_id === stepId)).filter(Boolean);
      
      console.log(`⚡ Executing layer ${layerIndex + 1}: ${layer.length} steps in parallel:`, layer);
      
      if (layerSteps.length > 0) {
        try {
          await this.executeStepsInParallel(layerSteps, context, streamCallback, executionOrder);
          executionOrder += layerSteps.length;
        } catch (error) {
          console.error(`❌ Failed to execute layer ${layerIndex + 1}:`, error);
          // Continue with next layer even if this one partially fails
        }
      }
    }
    
    const totalSteps = steps.length;
    const executedSteps = context.completedSteps - 1; // -1 for trigger
    console.log(`🏁 Enhanced execution completed: ${executedSteps}/${totalSteps} steps executed successfully`);
    
    if (executedSteps < totalSteps) {
      const unexecutedSteps = steps.filter(s => !context.stepResults.has(s.step_id));
      console.warn(`⚠️ ${unexecutedSteps.length} steps were not executed:`, unexecutedSteps.map(s => s.step_id));
    }
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
      componentFqn: context.triggerContext?.triggerType || 'trigger',
      inputData: null, // Triggers don't have input data - they receive external events
      estimatedDuration: 100,
      executionOrder: 0
    } as StepStartedEvent);

    // Simulate trigger processing time
    await this.delay(50 + Math.random() * 100);

    // Create standardized trigger output from external event input and trigger config
    const triggerOutput = this.generateTriggerOutput(
      context.triggerContext?.triggerType || 'trigger',
      context.triggerInput, // External event data (matches input schema)
      context.triggerContext?.triggerConfig || {} // DSL configuration
    );

    context.stepResults.set(stepId, {
      stepId,
      componentFqn: context.triggerContext?.triggerType || 'trigger',
      inputData: null, // Triggers don't have input data
      outputData: triggerOutput,
      executionOrder: 0
    });

    context.completedSteps++;

    // Send step completed event
    this.sendEvent(streamCallback, context, 'step.completed', {
      stepId,
      componentFqn: context.triggerContext?.triggerType || 'trigger',
      inputData: null,
      outputData: triggerOutput,
      actualDuration: 100,
      executionOrder: 0
    } as StepCompletedEvent);
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
   * Resolve input mapping expression with enhanced support for complex expressions
   */
  private resolveInputMapping(mapping: string, context: ExecutionContext): any {
    if (typeof mapping !== 'string') return mapping;
    
    try {
      // Handle complex expressions with step references
      if (mapping.includes('steps.') || mapping.includes('trigger.') || mapping.includes('context.')) {
        let resolvedExpression = mapping;
        let hasReplacements = false;
        
        // Replace step output references with actual values
        const stepOutputPattern = /steps\.([a-zA-Z0-9_-]+)\.outputs\.([a-zA-Z0-9_.]+)/g;
        resolvedExpression = resolvedExpression.replace(stepOutputPattern, (match, stepName, outputPath) => {
          const stepResult = context.stepResults.get(stepName);
          if (stepResult && stepResult.outputData) {
            const value = this.getNestedValue(stepResult.outputData, outputPath);
            hasReplacements = true;
            return JSON.stringify(value);
          }
          console.warn(`Step result not found for: ${stepName}`);
          hasReplacements = true;
          return 'null';
        });
        
        // Replace trigger references
        const triggerPattern = /trigger\.([a-zA-Z0-9_.]+)/g;
        resolvedExpression = resolvedExpression.replace(triggerPattern, (match, path) => {
          const triggerResult = context.stepResults.get('trigger');
          if (triggerResult && triggerResult.outputData) {
            const value = this.getNestedValue(triggerResult.outputData, path);
            hasReplacements = true;
            return JSON.stringify(value);
          }
          hasReplacements = true;
          return 'null';
        });
        
        // Replace context variable references
        const contextPattern = /context\.([a-zA-Z0-9_.]+)/g;
        resolvedExpression = resolvedExpression.replace(contextPattern, (match, varName) => {
          const value = context.contextVariables.get(varName);
          hasReplacements = true;
          return JSON.stringify(value);
        });
        
        // If we made replacements, try to parse as JSON
        if (hasReplacements) {
          const trimmed = resolvedExpression.trim();
          
          // Fix undefined values in the expression before JSON parsing
          let fixedExpression = trimmed.replace(/:\s*undefined/g, ': null')
                                     .replace(/undefined/g, 'null');
          
          // For object expressions, use direct key-value extraction instead of JSON parsing
          if (fixedExpression.startsWith('{') && fixedExpression.endsWith('}')) {
            try {
              // Extract key-value pairs using regex for both quoted and unquoted keys
              const keyValuePattern = /"?([a-zA-Z_][a-zA-Z0-9_]*)"?\s*:\s*([^,}]+)/g;
              const result: any = {};
              let match;
              
              while ((match = keyValuePattern.exec(fixedExpression)) !== null) {
                const key = match[1];
                let value = match[2].trim();
                
                // Try to parse the value
                try {
                  if (value === 'null') {
                    result[key] = null;
                  } else if (value === 'true' || value === 'false') {
                    result[key] = value === 'true';
                  } else if (value.startsWith('"') && value.endsWith('"')) {
                    result[key] = value.slice(1, -1);
                  } else if (value.startsWith("'") && value.endsWith("'")) {
                    result[key] = value.slice(1, -1);
                  } else if (!isNaN(Number(value))) {
                    result[key] = Number(value);
                  } else if (value.startsWith('{') || value.startsWith('[')) {
                    // Try to parse nested objects/arrays
                    try {
                      // For nested objects, try JSON parsing first
                      const nestedFixed = value.replace(/'/g, '"').replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
                      result[key] = JSON.parse(nestedFixed);
                    } catch {
                      result[key] = value;
                    }
                  } else {
                    result[key] = value;
                  }
                } catch {
                  result[key] = value;
                }
              }
              
              return result;
            } catch {
              return {};
            }
          } else if (fixedExpression.startsWith('[') && fixedExpression.endsWith(']')) {
            return [];
          }
          
          // For non-object expressions, return the resolved string
          return fixedExpression;
        }
      }
      
      // Handle simple dot notation references (legacy support)
      if (mapping.includes('.') && !mapping.includes('steps.')) {
        const [sourceStep, ...pathParts] = mapping.split('.');
        const path = pathParts.join('.');
        
        if (sourceStep === 'trigger') {
          const triggerResult = context.stepResults.get('trigger');
          return triggerResult ? this.getNestedValue(triggerResult.outputData, path) : null;
        } else if (sourceStep === 'context') {
          return context.contextVariables.get(path);
        } else {
          const stepResult = context.stepResults.get(sourceStep);
          return stepResult ? this.getNestedValue(stepResult.outputData, path) : null;
        }
      }
      
      return mapping;
    } catch (error) {
      console.warn(`Failed to resolve input mapping: ${mapping}`, error);
      return mapping;
    }
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
    
    // Default output based on component type with realistic casino flow data
    switch (componentFqn) {
      case 'StdLib:HttpCall':
        return {
          status: 200,
          response: {
            body: { 
              result: 'success', 
              timestamp: new Date().toISOString(),
              allowed: true,
              data: inputData 
            }
          },
          headers: { 'content-type': 'application/json' }
        };
      
      case 'StdLib:Fork':
        return { 
          branches: ['branch1', 'branch2'], 
          forkId: Math.random().toString(36),
          selectedBranch: 'branch1'
        };
      
      case 'StdLib:Validator':
        return { 
          valid: true, 
          validatedData: inputData,
          validData: inputData,
          errors: []
        };
      
      case 'StdLib:MapData':
        return { 
          mappedData: inputData, 
          transformedAt: new Date().toISOString(),
          result: inputData
        };
      
      // Casino-specific component outputs
      case 'Casino:UserValidator':
        return {
          valid: true,
          validData: inputData,
          userData: {
            ...inputData,
            userId: `user-${Math.random().toString(36).substr(2, 9)}`,
            validated: true
          }
        };
      
      case 'Casino:ComplianceChecker':
        return {
          compliant: true,
          complianceData: {
            jurisdiction: 'allowed',
            sanctions: 'clear',
            age: 'verified',
            score: 95
          },
          allowed: true
        };
      
      case 'Casino:AccountCreator':
        return {
          success: true,
          userId: `user-${Math.random().toString(36).substr(2, 9)}`,
          accountId: `acc-${Math.random().toString(36).substr(2, 9)}`,
          userTier: 'standard',
          createdAt: new Date().toISOString()
        };
      
      case 'Casino:CommunicationSender':
        return {
          sent: true,
          messageId: `msg-${Math.random().toString(36).substr(2, 9)}`,
          deliveryStatus: 'delivered',
          timestamp: new Date().toISOString()
        };
      
      default:
        // Generic output that includes common fields expected by casino flows
        return { 
          result: 'success', 
          success: true,
          data: inputData,
          output: inputData, 
          processedAt: new Date().toISOString(),
          // Include some common fields that might be referenced
          userId: inputData?.userId || `user-${Math.random().toString(36).substr(2, 9)}`,
          allowed: true,
          valid: true
        };
    }
  }

  /**
   * Derive trigger output from input data based on trigger type
   */
  private generateTriggerOutput(
    triggerType: string,
    eventInput: any, // External event data (matches input schema)
    triggerConfig: any // DSL configuration (resolved from context/secrets)
  ): any {
    if (!eventInput) {
      return this.generateDefaultTriggerOutput(triggerType);
    }

    // Get component schema to check for output examples
    const componentSchema = this.componentSchemas[triggerType];
    if (componentSchema?.outputSchema?.example) {
      // Use the output schema example if available
      return componentSchema.outputSchema.example;
    }

    switch (triggerType) {
      case 'StdLib.Trigger:Http':
        return this.generateHttpTriggerOutput(eventInput, triggerConfig);
      
      case 'StdLib.Trigger:Scheduled':
        return this.generateScheduledTriggerOutput(eventInput, triggerConfig);
      
      case 'StdLib.Trigger:EventBus':
        return this.generateEventBusTriggerOutput(eventInput, triggerConfig);
      
      case 'StdLib:Manual':
        return this.generateManualTriggerOutput(eventInput, triggerConfig);
      
      default:
        // For unknown trigger types, return basic standardized structure
        return { data: eventInput, timestamp: new Date().toISOString() };
    }
  }

  /**
   * Generate HTTP trigger standardized output from external event input and config
   */
  private generateHttpTriggerOutput(eventInput: any, triggerConfig: any): any {
    const output: any = {};

    // Extract path from URL if available
    if (eventInput.url) {
      try {
        const url = new URL(eventInput.url);
        output.path = url.pathname;
        
        // Parse query parameters from URL
        const queryParams: any = {};
        url.searchParams.forEach((value, key) => {
          queryParams[key] = value;
        });
        output.queryParameters = queryParams;
      } catch {
        // If URL parsing fails, use input values directly
        output.path = eventInput.path || '/api/trigger';
        output.queryParameters = eventInput.queryParameters || {};
      }
    } else {
      output.path = eventInput.path || '/api/trigger';
      output.queryParameters = eventInput.queryParameters || {};
    }

    // Normalize method to uppercase
    output.method = (eventInput.method || 'POST').toUpperCase();

    // Process headers (normalize keys to lowercase)
    output.headers = {};
    if (eventInput.headers && typeof eventInput.headers === 'object') {
      Object.entries(eventInput.headers).forEach(([key, value]) => {
        output.headers[key.toLowerCase()] = value;
      });
    }

    // Pass through body data
    output.body = eventInput.body || null;

    // Extract client information
    output.remoteAddress = eventInput.remoteAddress || eventInput.headers?.['x-forwarded-for'] || '127.0.0.1';
    output.userAgent = eventInput.userAgent || eventInput.headers?.['user-agent'] || 'Unknown';
    output.timestamp = eventInput.timestamp || new Date().toISOString();

    // Process authentication principal if available
    if (eventInput.principal) {
      output.principal = eventInput.principal;
    }

    return output;
  }

  /**
   * Generate scheduled trigger standardized output from external event input and config
   */
  private generateScheduledTriggerOutput(eventInput: any, triggerConfig: any): any {
    const now = new Date().toISOString();
    
    return {
      triggerTime: eventInput.triggerTime || now,
      scheduledTime: eventInput.scheduledTime || now,
      payload: eventInput.payload || triggerConfig.initialPayload || {}
    };
  }

  /**
   * Generate event bus trigger standardized output from external event input and config
   */
  private generateEventBusTriggerOutput(eventInput: any, triggerConfig: any): any {
    if (eventInput.event) {
      // Input already has event structure
      return { event: eventInput.event };
    }

    // Transform input into standardized event structure
    return {
      event: {
        id: eventInput.id || `event-${Math.random().toString(36).substr(2, 9)}`,
        type: eventInput.type || eventInput.eventType || 'generic.event',
        source: eventInput.source || 'system',
        timestamp: eventInput.timestamp || new Date().toISOString(),
        payload: eventInput.payload || eventInput
      }
    };
  }

  /**
   * Generate manual trigger standardized output from external event input and config
   */
  private generateManualTriggerOutput(eventInput: any, triggerConfig: any): any {
    return {
      initialData: eventInput.initialData || eventInput
    };
  }

  /**
   * Generate default trigger output when no input is available
   */
  private generateDefaultTriggerOutput(triggerType: string): any {
    // Try to use input schema example as basis for default output
    const componentSchema = this.componentSchemas[triggerType];
    if (componentSchema?.inputSchema?.example) {
      // Use the input schema example and transform it directly
      const eventInput = componentSchema.inputSchema.example;
      
      switch (triggerType) {
        case 'StdLib.Trigger:Http':
          return this.generateHttpTriggerOutput(eventInput, {});
        
        case 'StdLib.Trigger:Scheduled':
          return this.generateScheduledTriggerOutput(eventInput, {});
        
        case 'StdLib.Trigger:EventBus':
          return this.generateEventBusTriggerOutput(eventInput, {});
        
        case 'StdLib:Manual':
          return this.generateManualTriggerOutput(eventInput, {});
        
        default:
          return eventInput;
      }
    }

    // Fallback to basic default structure
    const now = new Date().toISOString();
    return { data: 'default_trigger_data', timestamp: now };
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