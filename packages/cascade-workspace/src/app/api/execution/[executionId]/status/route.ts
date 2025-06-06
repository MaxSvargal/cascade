// Next.js API Route for Execution Status
// Handles GET /api/execution/[executionId]/status

import { NextRequest, NextResponse } from 'next/server';
import { ServerExecutionEngine } from '@/services/serverExecutionEngine';
import { ComponentSchema } from '@/models/cfv_models_generated';

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
      }
    };
    
    executionEngine = new ServerExecutionEngine(componentSchemas);
  }
  return executionEngine;
}

export async function GET(
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

    // Get execution status
    const engine = getExecutionEngine();
    const status = engine.getExecutionStatus(executionId);

    if (!status) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(status, { status: 200 });

  } catch (error: any) {
    console.error('Execution status API error:', error);
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 