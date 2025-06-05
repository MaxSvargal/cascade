// Next.js API Route for Execution Cancellation
// Handles DELETE /api/execution/[executionId]

import { NextRequest, NextResponse } from 'next/server';
import { ServerExecutionEngine } from '@/services/serverExecutionEngine';
import { ExecutionCancellationRequest, ExecutionCancellationResponse, ComponentSchema } from '@/models/cfv_models_generated';

// Global execution engine instance (shared with other execution routes)
let executionEngine: ServerExecutionEngine | null = null;

function getExecutionEngine(): ServerExecutionEngine {
  if (!executionEngine) {
    // Initialize with component schemas (same as other execution routes)
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
      }
    };
    
    executionEngine = new ServerExecutionEngine(componentSchemas);
  }
  return executionEngine;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { executionId: string } }
) {
  try {
    const { executionId } = params;
    
    if (!executionId) {
      return NextResponse.json(
        { error: 'Execution ID is required' },
        { status: 400 }
      );
    }

    // Parse request body for cancellation reason (optional)
    let cancellationRequest: ExecutionCancellationRequest | null = null;
    try {
      cancellationRequest = await request.json();
    } catch {
      // Body is optional for cancellation
      cancellationRequest = { executionId };
    }

    // Cancel execution
    const engine = getExecutionEngine();
    const cancelled = engine.cancelExecution(executionId);

    const response: ExecutionCancellationResponse = {
      executionId,
      cancelled,
      message: cancelled 
        ? 'Execution cancelled successfully' 
        : 'Execution not found or already completed'
    };

    return NextResponse.json(response, { 
      status: cancelled ? 200 : 404 
    });

  } catch (error: any) {
    console.error('Execution cancellation API error:', error);
    return NextResponse.json(
      { 
        executionId: params.executionId,
        cancelled: false,
        message: 'Internal server error',
        error: error.message 
      },
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
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 