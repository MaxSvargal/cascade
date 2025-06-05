// Next.js API Route for Streaming Flow Execution
// Handles POST /api/execution/flow with Server-Sent Events streaming

import { NextRequest, NextResponse } from 'next/server';
import { ServerExecutionEngine } from '@/services/serverExecutionEngine';
import { StreamingExecutionRequest, StreamingExecutionEvent, ComponentSchema } from '@/models/cfv_models_generated';

// Global execution engine instance (in production, this should be properly managed)
let executionEngine: ServerExecutionEngine | null = null;

function getExecutionEngine(): ServerExecutionEngine {
  if (!executionEngine) {
    // Initialize with component schemas (in production, load from database or config)
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
      }
    };
    
    executionEngine = new ServerExecutionEngine(componentSchemas);
  }
  return executionEngine;
}

export async function POST(request: NextRequest) {
  try {
    const body: StreamingExecutionRequest = await request.json();
    
    // Validate request
    if (!body.flowDefinition) {
      return NextResponse.json(
        { error: 'Flow definition is required' },
        { status: 400 }
      );
    }

    if (!body.triggerInput) {
      return NextResponse.json(
        { error: 'Trigger input is required' },
        { status: 400 }
      );
    }

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
        const engine = getExecutionEngine();
        engine.executeFlow(body, streamCallback)
          .then((context) => {
            // Execution completed successfully
            console.log('Flow execution completed:', context.executionId);
          })
          .catch((error) => {
            // Send error event
            const errorEvent: StreamingExecutionEvent = {
              type: 'execution.failed',
              executionId: body.executionId || 'unknown',
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
            // Clean up and close stream
            clearInterval(heartbeatInterval);
            controller.close();
          });
      },
      
      cancel() {
        // Handle client disconnect - cancel execution if needed
        if (body.executionId) {
          const engine = getExecutionEngine();
          engine.cancelExecution(body.executionId);
        }
      }
    });

    // Return streaming response with proper headers
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

  } catch (error: any) {
    console.error('Flow execution API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
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