// Cascade Test Server - Browser-compatible execution engine for testing
// Emulates production ServerExecutionEngine behavior without API calls

import { v4 as uuidv4 } from 'uuid';
import {
  StreamingExecutionEvent,
  StreamingEventType,
  ExecutionStatus,
  ExecutionCancellationResponse,
  ComponentSchema,
  TriggerRuntimeContext,
  FlowExecutionStatusEnum,
  CascadeExecutionRequest
} from './types';

// Test server execution context
interface TestExecutionContext {
  executionId: string;
  flowFqn: string;
  flowDefinition: any;
  triggerInput: any;
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

// Streaming callback interface
interface TestStreamingCallback {
  (event: StreamingExecutionEvent): void;
}

/**
 * Browser-compatible Cascade Test Server
 * Provides the same interface as the production API but runs entirely in the browser
 */
export class CascadeTestServer {
  private activeExecutions: Map<string, TestExecutionContext> = new Map();
  private componentSchemas: Record<string, ComponentSchema>;
  
  constructor(componentSchemas: Record<string, ComponentSchema> = {}) {
    this.componentSchemas = {
      // Default component schemas for testing
      'StdLib:HttpCall': {
        fqn: 'StdLib:HttpCall',
        configSchema: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
            timeoutMs: { type: 'number', default: 5000 }
          }
        },
        outputSchema: {
          type: 'object',
          properties: {
            status: { type: 'number' },
            data: { type: 'object' },
            headers: { type: 'object' }
          }
        }
      },
      'StdLib:Fork': {
        fqn: 'StdLib:Fork',
        configSchema: {
          type: 'object',
          properties: {
            branches: { type: 'array', items: { type: 'string' } }
          }
        },
        outputSchema: {
          type: 'object',
          properties: {
            branches: { type: 'array', items: { type: 'string' } },
            forkId: { type: 'string' }
          }
        }
      },
      'StdLib:Validator': {
        fqn: 'StdLib:Validator',
        configSchema: {
          type: 'object',
          properties: {
            schema: { type: 'object' }
          }
        },
        outputSchema: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            validatedData: { type: 'object' }
          }
        }
      },
      'StdLib:MapData': {
        fqn: 'StdLib:MapData',
        configSchema: {
          type: 'object',
          properties: {
            mapping: { type: 'object' }
          }
        },
        outputSchema: {
          type: 'object',
          properties: {
            mappedData: { type: 'object' },
            transformedAt: { type: 'string' }
          }
        }
      },
      'StdLib:SubFlowInvoker': {
        fqn: 'StdLib:SubFlowInvoker',
        configSchema: {
          type: 'object',
          properties: {
            flowName: { type: 'string' }
          }
        },
        outputSchema: {
          type: 'object',
          properties: {
            result: { type: 'object' },
            subFlowExecutionId: { type: 'string' }
          }
        }
      },
      ...componentSchemas
    };
  }

  /**
   * Unified execution method that handles all operations
   */
  async execute(request: CascadeExecutionRequest): Promise<any> {
    switch (request.action) {
      case 'flow':
        return this.handleFlowExecution(request);
      case 'step':
        return this.handleStepExecution(request);
      case 'status':
        return this.handleStatusCheck(request);
      case 'cancel':
        return this.handleCancellation(request);
      default:
        throw new Error(`Unknown action: ${request.action}`);
    }
  }

  /**
   * Execute flow with streaming simulation
   */
  private async handleFlowExecution(request: CascadeExecutionRequest): Promise<ReadableStream> {
    if (!request.flowDefinition) {
      throw new Error('Flow definition is required for flow execution');
    }

    if (!request.triggerInput) {
      throw new Error('Trigger input is required for flow execution');
    }

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
          flowFqn: flowDefinition.name || 'unknown'
        }
      }
    };

    const context: TestExecutionContext = {
      executionId,
      flowFqn: flowDefinition.name || 'unknown',
      flowDefinition,
      triggerInput,
      triggerContext,
      stepResults: new Map(),
      contextVariables: new Map(),
      startTime: new Date().toISOString(),
      totalSteps: (flowDefinition.steps?.length || 0) + 1,
      completedSteps: 0,
      failedSteps: 0,
      status: 'running',
      eventSequence: 0,
      estimatedDuration: this.estimateFlowDuration(flowDefinition)
    };

    this.activeExecutions.set(executionId, context);

    // Create readable stream for Server-Sent Events simulation
    return new ReadableStream({
      start: async (controller) => {
        const encoder = new TextEncoder();
        
        const streamCallback = (event: StreamingExecutionEvent) => {
          const eventData = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(eventData));
        };

        try {
          await this.simulateFlowExecution(context, streamCallback);
          controller.close();
        } catch (error: any) {
          const errorEvent: StreamingExecutionEvent = {
            type: 'execution.failed',
            executionId: context.executionId,
            timestamp: new Date().toISOString(),
            sequence: 999,
            data: {
              error: {
                errorType: 'ExecutionError',
                message: error.message,
                timestamp: new Date().toISOString()
              }
            }
          };
          const eventData = `event: execution.failed\ndata: ${JSON.stringify(errorEvent)}\n\n`;
          controller.enqueue(encoder.encode(eventData));
          controller.close();
        }
      }
    });
  }

  /**
   * Simulate flow execution with realistic timing and events
   */
  private async simulateFlowExecution(
    context: TestExecutionContext,
    streamCallback: TestStreamingCallback
  ): Promise<void> {
    // Send execution started event
    this.sendEvent(streamCallback, context, 'execution.started', {
      flowFqn: context.flowFqn,
      triggerInput: context.triggerInput,
      triggerContext: context.triggerContext,
      flowDefinition: context.flowDefinition
    });

    // Simulate trigger execution
    await this.simulateTrigger(context, streamCallback);

    // Simulate step execution
    const steps = context.flowDefinition.steps || [];
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      await this.simulateStep(step, context, streamCallback, i + 1);
      
      // Check if execution was cancelled
      if (context.status === 'cancelled') {
        return;
      }
    }

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
  }

  /**
   * Simulate trigger execution
   */
  private async simulateTrigger(
    context: TestExecutionContext,
    streamCallback: TestStreamingCallback
  ): Promise<void> {
    // Simulate trigger processing time
    await this.delay(100);

    const triggerOutput = this.generateTriggerOutput(
      context.triggerContext?.triggerType || 'manual',
      context.triggerInput,
      context.triggerContext?.triggerConfig || {}
    );

    context.stepResults.set('trigger', triggerOutput);
    context.completedSteps++;
  }

  /**
   * Simulate individual step execution
   */
  private async simulateStep(
    step: any,
    context: TestExecutionContext,
    streamCallback: TestStreamingCallback,
    executionOrder: number
  ): Promise<void> {
    const stepId = step.step_id || `step_${executionOrder}`;
    const componentFqn = step.component || 'StdLib:Unknown';
    
    context.currentStep = stepId;

    // Send step started event
    this.sendEvent(streamCallback, context, 'step.started', {
      stepId,
      componentFqn,
      inputData: this.resolveStepInput(step, context),
      estimatedDuration: this.getComponentExecutionTiming(componentFqn).estimatedDurationMs,
      executionOrder
    });

    // Simulate step execution time
    const timing = this.getComponentExecutionTiming(componentFqn);
    await this.delay(timing.estimatedDurationMs);

    // Simulate step execution
    const inputData = this.resolveStepInput(step, context);
    const outputData = await this.simulateComponentExecution(
      componentFqn,
      inputData,
      step.config || {},
      this.componentSchemas[componentFqn]
    );

    context.stepResults.set(stepId, outputData);
    context.completedSteps++;

    // Send step completed event
    this.sendEvent(streamCallback, context, 'step.completed', {
      stepId,
      componentFqn,
      inputData,
      outputData,
      actualDuration: timing.estimatedDurationMs,
      executionOrder,
      contextChanges: {}
    });
  }

  /**
   * Handle step execution
   */
  private async handleStepExecution(request: CascadeExecutionRequest): Promise<any> {
    if (!request.stepDefinition) {
      throw new Error('Step definition is required for step execution');
    }

    if (!request.inputData) {
      throw new Error('Input data is required for step execution');
    }

    if (!request.componentConfig) {
      throw new Error('Component config is required for step execution');
    }

    const componentFqn = request.stepDefinition.component || 'StdLib:Unknown';
    const timing = this.getComponentExecutionTiming(componentFqn);
    
    // Simulate execution delay
    await this.delay(timing.estimatedDurationMs);

    const outputData = await this.simulateComponentExecution(
      componentFqn,
      request.inputData,
      request.componentConfig,
      this.componentSchemas[componentFqn]
    );

    return {
      stepId: request.stepDefinition.step_id || 'test_step',
      componentFqn,
      status: 'SUCCESS',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      durationMs: timing.estimatedDurationMs,
      inputData: request.inputData,
      outputData,
      executionOrder: 1
    };
  }

  /**
   * Handle status check
   */
  private handleStatusCheck(request: CascadeExecutionRequest): ExecutionStatus | null {
    if (!request.executionId) {
      throw new Error('Execution ID is required for status check');
    }

    const context = this.activeExecutions.get(request.executionId);
    if (!context) {
      return null;
    }

    return {
      executionId: context.executionId,
      flowFqn: context.flowFqn,
      status: context.status,
      currentStep: context.currentStep,
      progress: {
        totalSteps: context.totalSteps,
        completedSteps: context.completedSteps,
        currentStepIndex: context.completedSteps
      },
      startTime: context.startTime,
      estimatedEndTime: new Date(
        new Date(context.startTime).getTime() + context.estimatedDuration
      ).toISOString()
    };
  }

  /**
   * Handle execution cancellation
   */
  private handleCancellation(request: CascadeExecutionRequest): ExecutionCancellationResponse {
    if (!request.executionId) {
      throw new Error('Execution ID is required for cancellation');
    }

    const context = this.activeExecutions.get(request.executionId);
    if (!context) {
      return {
        executionId: request.executionId,
        cancelled: false,
        message: 'Execution not found or already completed'
      };
    }

    if (context.status === 'running') {
      context.status = 'cancelled';
      return {
        executionId: request.executionId,
        cancelled: true,
        message: 'Execution cancelled successfully'
      };
    }

    return {
      executionId: request.executionId,
      cancelled: false,
      message: 'Execution already completed or failed'
    };
  }

  // Helper methods (simplified versions of ServerExecutionEngine methods)

  private resolveStepInput(step: any, context: TestExecutionContext): any {
    // Simple input resolution - in real implementation this would be more complex
    const inputsMap = step.inputs_map || {};
    const resolvedInput: any = {};

    for (const [key, mapping] of Object.entries(inputsMap)) {
      if (typeof mapping === 'string' && mapping.startsWith('trigger.')) {
        const triggerResult = context.stepResults.get('trigger');
        const path = mapping.substring(8); // Remove 'trigger.'
        resolvedInput[key] = this.getNestedValue(triggerResult, path) || mapping;
      } else {
        resolvedInput[key] = mapping;
      }
    }

    return resolvedInput;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async simulateComponentExecution(
    componentFqn: string,
    inputData: any,
    config: any,
    schema?: ComponentSchema
  ): Promise<any> {
    // Simulate different component behaviors
    switch (componentFqn) {
      case 'StdLib:HttpCall':
        return {
          status: 200,
          data: { message: 'Test response', input: inputData },
          headers: { 'content-type': 'application/json' }
        };
      
      case 'StdLib:MapData':
        return {
          mappedData: { ...inputData, transformed: true },
          transformedAt: new Date().toISOString()
        };
      
      case 'StdLib:Validator':
        return {
          valid: true,
          validatedData: inputData
        };
      
      case 'StdLib:Fork':
        return {
          branches: config.branches || ['branch1', 'branch2'],
          forkId: this.generateExecutionId()
        };
      
      default:
        return {
          result: 'success',
          processedData: inputData,
          executedAt: new Date().toISOString()
        };
    }
  }

  private generateTriggerOutput(triggerType: string, eventInput: any, triggerConfig: any): any {
    switch (triggerType) {
      case 'manual':
        return {
          triggerType: 'manual',
          data: eventInput,
          timestamp: new Date().toISOString()
        };
      
      case 'http':
        return {
          method: triggerConfig.method || 'POST',
          path: triggerConfig.path || '/webhook',
          headers: { 'content-type': 'application/json' },
          body: eventInput,
          timestamp: new Date().toISOString()
        };
      
      default:
        return {
          triggerType,
          data: eventInput,
          timestamp: new Date().toISOString()
        };
    }
  }

  private getComponentExecutionTiming(componentFqn: string): { estimatedDurationMs: number; isAsync: boolean } {
    // Realistic timing simulation
    switch (componentFqn) {
      case 'StdLib:HttpCall':
        return { estimatedDurationMs: 500, isAsync: true };
      case 'StdLib:MapData':
        return { estimatedDurationMs: 50, isAsync: false };
      case 'StdLib:Validator':
        return { estimatedDurationMs: 100, isAsync: false };
      case 'StdLib:Fork':
        return { estimatedDurationMs: 200, isAsync: true };
      default:
        return { estimatedDurationMs: 300, isAsync: false };
    }
  }

  private estimateFlowDuration(flowDefinition: any): number {
    const steps = flowDefinition.steps || [];
    return steps.reduce((total: number, step: any) => {
      const componentFqn = step.component || 'StdLib:Unknown';
      const timing = this.getComponentExecutionTiming(componentFqn);
      return total + timing.estimatedDurationMs;
    }, 1000); // Base time for trigger + overhead
  }

  private getFinalOutput(context: TestExecutionContext): any {
    const steps = context.flowDefinition.steps || [];
    if (steps.length === 0) {
      return context.stepResults.get('trigger');
    }
    
    const lastStep = steps[steps.length - 1];
    const lastStepId = lastStep.step_id || `step_${steps.length}`;
    return context.stepResults.get(lastStepId);
  }

  private sendEvent(
    streamCallback: TestStreamingCallback,
    context: TestExecutionContext,
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

  private generateExecutionId(): string {
    return `test_exec_${Date.now()}_${uuidv4().substring(0, 8)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 