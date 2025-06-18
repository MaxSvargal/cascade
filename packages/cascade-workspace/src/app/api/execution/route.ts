// Unified Execution API - Single endpoint for all execution operations
// Handles POST /api/execution with action-based routing

import { NextRequest, NextResponse } from 'next/server';
import { ServerExecutionEngine } from '@/services/serverExecutionEngine';
import { 
  StreamingExecutionRequest, 
  StepExecutionRequest,
  StreamingExecutionEvent, 
  ComponentSchema,
  ExecutionCancellationRequest,
  ExecutionCancellationResponse
} from '@/models/cfv_models_generated';

// Action types for unified API
type ExecutionAction = 'flow' | 'step' | 'status' | 'cancel';

interface UnifiedExecutionRequest {
  action: ExecutionAction;
  executionId?: string;
  // Flow execution
  flowDefinition?: any;
  triggerInput?: any;
  executionOptions?: any;
  targetStepId?: string;
  // Step execution
  stepDefinition?: any;
  inputData?: any;
  componentConfig?: any;
  // Cancellation
  reason?: string;
}

// Global execution engine instance
let executionEngine: ServerExecutionEngine | null = null;

function getExecutionEngine(): ServerExecutionEngine {
  if (!executionEngine) {
    // Centralized component schemas configuration
    const componentSchemas: Record<string, ComponentSchema> = {
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
      }
    };
    
    executionEngine = new ServerExecutionEngine(componentSchemas);
  }
  return executionEngine;
}

export async function POST(request: NextRequest) {
  try {
    const body: UnifiedExecutionRequest = await request.json();
    
    // Validate action
    if (!body.action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const engine = getExecutionEngine();

    switch (body.action) {
      case 'flow':
        return await handleFlowExecution(body, engine);
      
      case 'step':
        return await handleStepExecution(body, engine);
      
      case 'status':
        return await handleStatusCheck(body, engine);
      
      case 'cancel':
        return await handleCancellation(body, engine);
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${body.action}` },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Unified execution API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

async function handleFlowExecution(
  body: UnifiedExecutionRequest, 
  engine: ServerExecutionEngine
) {
  // Validate flow execution request
  if (!body.flowDefinition) {
    return NextResponse.json(
      { error: 'Flow definition is required for flow execution' },
      { status: 400 }
    );
  }

  if (!body.triggerInput) {
    return NextResponse.json(
      { error: 'Trigger input is required for flow execution' },
      { status: 400 }
    );
  }

  // Create streaming execution request
  const streamingRequest: StreamingExecutionRequest = {
    flowDefinition: body.flowDefinition,
    triggerInput: body.triggerInput,
    executionOptions: body.executionOptions,
    targetStepId: body.targetStepId,
    executionId: body.executionId
  };

  // Create readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Streaming callback to send events
      const streamCallback = (event: StreamingExecutionEvent) => {
        const eventData = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(eventData));
      };

      // Send heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        const heartbeat = `event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`;
        controller.enqueue(encoder.encode(heartbeat));
      }, 30000);

      // Execute flow with streaming
      engine.executeFlow(streamingRequest, streamCallback)
        .then((context) => {
          console.log('Flow execution completed:', context.executionId);
        })
        .catch((error) => {
          // Send error event
          const errorEvent: StreamingExecutionEvent = {
            type: 'execution.failed',
            executionId: streamingRequest.executionId || 'unknown',
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
        })
        .finally(() => {
          clearInterval(heartbeatInterval);
          controller.close();
        });
    },
    
    cancel() {
      // Handle client disconnect
      if (streamingRequest.executionId) {
        engine.cancelExecution(streamingRequest.executionId);
      }
    }
  });

  // Return streaming response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

async function handleStepExecution(
  body: UnifiedExecutionRequest,
  engine: ServerExecutionEngine
) {
  // Validate step execution request
  if (!body.stepDefinition) {
    return NextResponse.json(
      { error: 'Step definition is required for step execution' },
      { status: 400 }
    );
  }

  if (!body.inputData) {
    return NextResponse.json(
      { error: 'Input data is required for step execution' },
      { status: 400 }
    );
  }

  if (!body.componentConfig) {
    return NextResponse.json(
      { error: 'Component config is required for step execution' },
      { status: 400 }
    );
  }

  // Create step execution request
  const stepRequest: StepExecutionRequest = {
    stepDefinition: body.stepDefinition,
    inputData: body.inputData,
    componentConfig: body.componentConfig,
    executionOptions: body.executionOptions
  };

  // Execute step
  const result = await engine.executeStep(stepRequest);
  return NextResponse.json(result, { status: 200 });
}

async function handleStatusCheck(
  body: UnifiedExecutionRequest,
  engine: ServerExecutionEngine
) {
  if (!body.executionId) {
    return NextResponse.json(
      { error: 'Execution ID is required for status check' },
      { status: 400 }
    );
  }

  const status = engine.getExecutionStatus(body.executionId);

  if (!status) {
    return NextResponse.json(
      { error: 'Execution not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(status, { status: 200 });
}

async function handleCancellation(
  body: UnifiedExecutionRequest,
  engine: ServerExecutionEngine
) {
  if (!body.executionId) {
    return NextResponse.json(
      { error: 'Execution ID is required for cancellation' },
      { status: 400 }
    );
  }

  const cancelled = engine.cancelExecution(body.executionId);

  const response: ExecutionCancellationResponse = {
    executionId: body.executionId,
    cancelled,
    message: cancelled 
      ? 'Execution cancelled successfully' 
      : 'Execution not found or already completed'
  };

  return NextResponse.json(response, { 
    status: cancelled ? 200 : 404 
  });
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 