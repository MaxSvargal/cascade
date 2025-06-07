// Client Execution Stream Handler
// Handles Server-Sent Events from execution API and updates visualizer state

import {
  StreamingExecutionRequest,
  StreamingExecutionEvent,
  StreamingEventType,
  ExecutionStatus,
  ExecutionCancellationRequest,
  FlowExecutionTrace,
  StepExecutionTrace,
  ExecutionStatusEnum,
  FlowExecutionStatusEnum,
  ExecutionError
} from '@/models/cfv_models_generated';

export interface ExecutionStreamOptions {
  onExecutionStarted?: (data: any) => void;
  onStepStarted?: (data: any) => void;
  onStepCompleted?: (data: any) => void;
  onStepFailed?: (data: any) => void;
  onExecutionCompleted?: (data: any) => void;
  onExecutionFailed?: (data: any) => void;
  onConnectionError?: (error: Error) => void;
  onConnectionClosed?: () => void;
  updateExecutionState?: (flowFqn: string, executionResults: FlowExecutionTrace) => void;
}

export interface ActiveExecution {
  executionId: string;
  flowFqn: string;
  eventSource: EventSource | null;
  status: 'connecting' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  trace: FlowExecutionTrace | null;
  options: ExecutionStreamOptions;
}

export class ClientExecutionStreamHandler {
  private activeExecutions: Map<string, ActiveExecution> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000; // Start with 1 second

  /**
   * Start streaming execution of a flow
   */
  async startFlowExecution(
    request: StreamingExecutionRequest,
    options: ExecutionStreamOptions = {}
  ): Promise<string> {
    const executionId = request.executionId || this.generateExecutionId();
    // Use flowFqn from request if provided, otherwise fall back to flow definition name
    const flowFqn = (request as any).flowFqn || request.flowDefinition.name || 'unknown-flow';

    // Initialize execution tracking
    const execution: ActiveExecution = {
      executionId,
      flowFqn,
      eventSource: null,
      status: 'connecting',
      startTime: new Date().toISOString(),
      trace: null,
      options
    };

    this.activeExecutions.set(executionId, execution);
    this.reconnectAttempts.set(executionId, 0);

    try {
      // Start streaming connection
      await this.connectToExecutionStream(executionId, request);
      return executionId;
    } catch (error: any) {
      execution.status = 'failed';
      if (options.onConnectionError) {
        options.onConnectionError(error);
      }
      throw error;
    }
  }

  /**
   * Cancel a running execution
   */
  async cancelExecution(executionId: string, reason?: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return false;

    try {
      // Close SSE connection
      if (execution.eventSource) {
        execution.eventSource.close();
        execution.eventSource = null;
      }

      // Send cancellation request to server
      const cancellationRequest: ExecutionCancellationRequest = {
        executionId,
        reason
      };

      const response = await fetch(`/api/execution/${executionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cancellationRequest),
      });

      const result = await response.json();
      
      if (result.cancelled) {
        execution.status = 'cancelled';
        if (execution.options.onConnectionClosed) {
          execution.options.onConnectionClosed();
        }
      }

      return result.cancelled;
    } catch (error) {
      console.error('Failed to cancel execution:', error);
      return false;
    }
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(executionId: string): Promise<ExecutionStatus | null> {
    try {
      const response = await fetch(`/api/execution/${executionId}/status`);
      if (!response.ok) return null;
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get execution status:', error);
      return null;
    }
  }

  /**
   * Get active execution info
   */
  getActiveExecution(executionId: string): ActiveExecution | null {
    return this.activeExecutions.get(executionId) || null;
  }

  /**
   * Get all active executions
   */
  getAllActiveExecutions(): ActiveExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Clean up completed executions
   */
  cleanup(executionId?: string): void {
    if (executionId) {
      const execution = this.activeExecutions.get(executionId);
      if (execution?.eventSource) {
        execution.eventSource.close();
      }
      this.activeExecutions.delete(executionId);
      this.reconnectAttempts.delete(executionId);
    } else {
      // Clean up all completed executions
      for (const [id, execution] of Array.from(this.activeExecutions.entries())) {
        if (execution.status === 'completed' || execution.status === 'failed' || execution.status === 'cancelled') {
          if (execution.eventSource) {
            execution.eventSource.close();
          }
          this.activeExecutions.delete(id);
          this.reconnectAttempts.delete(id);
        }
      }
    }
  }

  /**
   * Connect to execution stream via Server-Sent Events
   */
  private async connectToExecutionStream(
    executionId: string,
    request: StreamingExecutionRequest
  ): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) throw new Error('Execution not found');

    // Close existing connection if any
    if (execution.eventSource) {
      execution.eventSource.close();
    }

    // Start flow execution via POST request that returns SSE stream
    const response = await fetch('/api/execution/flow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ ...request, executionId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start execution: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body for streaming');
    }

    // Create EventSource-like interface from fetch response
    this.handleStreamingResponse(executionId, response);
  }

  /**
   * Handle streaming response from fetch
   */
  private async handleStreamingResponse(executionId: string, response: Response): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return;

    execution.status = 'running';

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No reader available for response body');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          execution.status = 'completed';
          if (execution.options.onConnectionClosed) {
            execution.options.onConnectionClosed();
          }
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        this.processStreamChunk(executionId, chunk);
      }
    } catch (error: any) {
      execution.status = 'failed';
      if (execution.options.onConnectionError) {
        execution.options.onConnectionError(error);
      }
      
      // Attempt reconnection
      await this.attemptReconnection(executionId);
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Process streaming chunk and parse events
   */
  private processStreamChunk(executionId: string, chunk: string): void {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return;

    // Parse Server-Sent Events format
    const lines = chunk.split('\n');
    let eventType = '';
    let eventData = '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        eventData = line.substring(5).trim();
      } else if (line === '' && eventType && eventData) {
        // Process complete event
        this.handleStreamEvent(executionId, eventType, eventData);
        eventType = '';
        eventData = '';
      }
    }
  }

  /**
   * Handle individual stream event
   */
  private handleStreamEvent(executionId: string, eventType: string, eventData: string): void {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return;

    try {
      const event: StreamingExecutionEvent = JSON.parse(eventData);
      
      // Reset reconnect attempts on successful event
      this.reconnectAttempts.set(executionId, 0);

      switch (event.type) {
        case 'execution.started':
          this.handleExecutionStarted(execution, event.data);
          break;
        
        case 'step.started':
          this.handleStepStarted(execution, event.data);
          break;
        
        case 'step.completed':
          this.handleStepCompleted(execution, event.data);
          break;
        
        case 'step.failed':
          this.handleStepFailed(execution, event.data);
          break;
        
        case 'execution.completed':
          this.handleExecutionCompleted(execution, event.data);
          break;
        
        case 'execution.failed':
          this.handleExecutionFailed(execution, event.data);
          break;
        
        case 'execution.warning':
          this.handleExecutionWarning(execution, event.data);
          break;
        
        case 'heartbeat':
          // Keep connection alive
          break;
        
        default:
          console.warn('Unknown event type:', event.type);
      }
    } catch (error) {
      console.error('Failed to parse stream event:', error, eventData);
    }
  }

  /**
   * Handle execution started event
   */
  private handleExecutionStarted(execution: ActiveExecution, data: any): void {
    console.log(`🚀 Execution started: ${execution.executionId}`);
    
    // Initialize or update trace with execution started data
    if (!execution.trace) {
    execution.trace = {
      traceId: execution.executionId,
      flowFqn: execution.flowFqn,
        status: 'RUNNING',
        startTime: new Date().toISOString(),
      steps: []
    };
    }

    // Handle both new triggerContext and legacy triggerInput
    if (data.triggerContext) {
      (execution.trace as any).triggerContext = data.triggerContext;
      execution.trace.triggerData = data.triggerContext.runtimeData; // For backward compatibility
    } else if (data.triggerInput) {
      execution.trace.triggerData = data.triggerInput;
    }

    // Store flow definition if provided
    if (data.flowDefinition) {
      (execution.trace as any).flowDefinition = data.flowDefinition;
    }

    // Call user callback
    if (execution.options.onExecutionStarted) {
      execution.options.onExecutionStarted(data);
    }

    // Update execution state if callback provided
    if (execution.options.updateExecutionState && execution.trace) {
      execution.options.updateExecutionState(execution.flowFqn, execution.trace);
    }
  }

  /**
   * Handle step started event
   */
  private handleStepStarted(execution: ActiveExecution, data: any): void {
    console.log('⏳ Handling step started:', data.stepId, data);
    
    if (!execution.trace) return;

    // Find existing step or create new one
    let stepTrace = execution.trace.steps.find(s => s.stepId === data.stepId);
    
    if (!stepTrace) {
      // Create new step with PENDING status first, then immediately update to RUNNING
      stepTrace = {
        stepId: data.stepId,
        componentFqn: data.componentFqn || 'unknown',
        status: 'PENDING' as ExecutionStatusEnum,
        startTime: new Date().toISOString(),
        inputData: data.inputData || {},
        outputData: {}
      };
      execution.trace.steps.push(stepTrace);
      console.log(`➕ Added new step to trace: ${data.stepId}`);
      
      // Update to RUNNING status
      stepTrace.status = 'RUNNING' as ExecutionStatusEnum;
    } else {
      // CRITICAL: Create new step object to trigger React re-render
      const updatedStep = {
        ...stepTrace,
        status: 'RUNNING' as ExecutionStatusEnum,
        componentFqn: data.componentFqn || stepTrace.componentFqn,
        inputData: data.inputData || {},
        startTime: new Date().toISOString()
      };
      
      // Replace the step in the array with new object
      const stepIndex = execution.trace.steps.findIndex(s => s.stepId === data.stepId);
      execution.trace.steps[stepIndex] = updatedStep;
      console.log(`🔄 Updated existing step: ${data.stepId}`);
    }

    // CRITICAL: Create new trace object to trigger React re-render
    execution.trace = {
      ...execution.trace,
      steps: [...execution.trace.steps] // New array reference
    };

    // Update visualizer state
    if (execution.options.updateExecutionState) {
      console.log(`🔄 Updating visualizer state for step started: ${data.stepId}`);
      execution.options.updateExecutionState(execution.flowFqn, execution.trace);
    }

    if (execution.options.onStepStarted) {
      execution.options.onStepStarted(data);
    }
  }

  /**
   * Handle step completed event
   */
  private handleStepCompleted(execution: ActiveExecution, data: any): void {
    console.log('✅ Handling step completed:', data.stepId, data);
    
    if (!execution.trace) return;

    // Find existing step or create new one if somehow missing
    let stepTrace = execution.trace.steps.find(s => s.stepId === data.stepId);
    
    if (!stepTrace) {
      // Create step if it doesn't exist (shouldn't happen but safety check)
      stepTrace = {
        stepId: data.stepId,
        componentFqn: data.componentFqn || 'unknown',
        status: 'SUCCESS' as ExecutionStatusEnum,
        startTime: new Date().toISOString(),
        inputData: data.inputData || {},
        outputData: data.outputData || {}
      };
      execution.trace.steps.push(stepTrace);
      console.log(`➕ Created missing step on completion: ${data.stepId}`);
    } else {
      // CRITICAL: Create new step object to trigger React re-render
      const updatedStep = {
        ...stepTrace,
        status: 'SUCCESS' as ExecutionStatusEnum,
        outputData: data.outputData || {},
        endTime: new Date().toISOString(),
        durationMs: data.actualDuration
      };
      
      // Replace the step in the array with new object
      const stepIndex = execution.trace.steps.findIndex(s => s.stepId === data.stepId);
      execution.trace.steps[stepIndex] = updatedStep;
      console.log(`✅ Updated step completion: ${data.stepId}`);
    }

    // CRITICAL: Create new trace object to trigger React re-render
    execution.trace = {
      ...execution.trace,
      steps: [...execution.trace.steps] // New array reference
    };

    // Update visualizer state
    if (execution.options.updateExecutionState) {
      console.log(`🔄 Updating visualizer state for step completed: ${data.stepId}`);
      execution.options.updateExecutionState(execution.flowFqn, execution.trace);
    }

    if (execution.options.onStepCompleted) {
      execution.options.onStepCompleted(data);
    }
  }

  /**
   * Handle step failed event
   */
  private handleStepFailed(execution: ActiveExecution, data: any): void {
    console.log('❌ Handling step failed:', data.stepId, data);
    
    if (!execution.trace) return;

    // Find existing step or create new one if somehow missing
    let stepTrace = execution.trace.steps.find(s => s.stepId === data.stepId);
    
    if (!stepTrace) {
      // Create step if it doesn't exist (shouldn't happen but safety check)
      stepTrace = {
        stepId: data.stepId,
        componentFqn: data.componentFqn || 'unknown',
        status: 'FAILURE' as ExecutionStatusEnum,
        startTime: new Date().toISOString(),
        inputData: data.inputData || {},
        outputData: {},
        errorData: data.error
      };
      execution.trace.steps.push(stepTrace);
      console.log(`➕ Created missing step on failure: ${data.stepId}`);
    } else {
      // Update existing step
      stepTrace.status = 'FAILURE' as ExecutionStatusEnum;
      stepTrace.endTime = new Date().toISOString();
      stepTrace.durationMs = data.actualDuration;
      stepTrace.errorData = data.error;
      console.log(`❌ Updated step failure: ${data.stepId}`);
    }

    // Update visualizer state
    if (execution.options.updateExecutionState) {
      console.log(`🔄 Updating visualizer state for step failed: ${data.stepId}`);
      execution.options.updateExecutionState(execution.flowFqn, execution.trace);
    }

    if (execution.options.onStepFailed) {
      execution.options.onStepFailed(data);
    }
  }

  /**
   * Handle execution completed event
   */
  private handleExecutionCompleted(execution: ActiveExecution, data: any): void {
    console.log('🎉 Handling execution completed:', data);
    
    execution.status = 'completed';
    
    if (execution.trace) {
      // CRITICAL: Create new trace object to trigger React re-render
      execution.trace = {
        ...execution.trace,
        status: 'COMPLETED' as FlowExecutionStatusEnum,
        endTime: new Date().toISOString(),
        durationMs: data.totalDuration,
        finalContext: data.finalContext
      };
      console.log('✅ Updated execution trace with completion status');
      
      // DEBUG: Log the final trace data to see step statuses
      console.log('🔍 Final trace data:', {
        traceId: execution.trace.traceId,
        status: execution.trace.status,
        stepCount: execution.trace.steps.length,
        steps: execution.trace.steps.map(s => ({ 
          stepId: s.stepId, 
          status: s.status,
          durationMs: s.durationMs 
        }))
      });
    }

    // Update visualizer state
    if (execution.options.updateExecutionState && execution.trace) {
      console.log('🔄 Updating visualizer state for execution completed');
      execution.options.updateExecutionState(execution.flowFqn, execution.trace);
    }

    if (execution.options.onExecutionCompleted) {
      execution.options.onExecutionCompleted(data);
    }
  }

  /**
   * Handle execution failed event
   */
  private handleExecutionFailed(execution: ActiveExecution, data: any): void {
    console.log('❌ Handling execution failed:', data);
    
    execution.status = 'failed';
    
    if (execution.trace) {
      execution.trace.status = 'FAILED' as FlowExecutionStatusEnum;
      execution.trace.endTime = new Date().toISOString();
      execution.trace.durationMs = new Date().getTime() - new Date(execution.trace.startTime).getTime();
      execution.trace.flowError = data.error;
    }

    // Notify callback
    if (execution.options.onExecutionFailed) {
      execution.options.onExecutionFailed(data);
    }

    // Update execution state in visualizer
    if (execution.options.updateExecutionState && execution.trace) {
      execution.options.updateExecutionState(execution.flowFqn, execution.trace);
    }
  }

  /**
   * Handle execution warning event
   */
  private handleExecutionWarning(execution: ActiveExecution, data: any): void {
    console.warn('⚠️ Execution warning:', data.message);
    console.warn('Affected steps:', data.affectedSteps);
    
    // Log warning but don't change execution status - continue execution
    // Don't call onExecutionFailed for warnings as it interferes with normal completion flow
    console.log('🔄 Continuing execution despite warning...');
  }

  /**
   * Attempt reconnection with exponential backoff
   */
  private async attemptReconnection(executionId: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return;

    const attempts = this.reconnectAttempts.get(executionId) || 0;
    if (attempts >= this.maxReconnectAttempts) {
      execution.status = 'failed';
      if (execution.options.onConnectionError) {
        execution.options.onConnectionError(new Error('Max reconnection attempts reached'));
      }
      return;
    }

    this.reconnectAttempts.set(executionId, attempts + 1);
    
    // Exponential backoff
    const delay = this.reconnectDelay * Math.pow(2, attempts);
    
    setTimeout(async () => {
      try {
        // Get current execution status from server
        const status = await this.getExecutionStatus(executionId);
        if (status && status.status === 'running') {
          // Reconnect to stream (this would need additional implementation)
          console.log(`Attempting to reconnect to execution ${executionId} (attempt ${attempts + 1})`);
        }
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, delay);
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default ClientExecutionStreamHandler; 