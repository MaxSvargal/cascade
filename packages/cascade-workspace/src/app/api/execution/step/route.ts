// Next.js API Route for Single Step Execution
// Handles POST /api/execution/step

import { NextRequest, NextResponse } from 'next/server';
import { ServerExecutionEngine } from '@/services/serverExecutionEngine';
import { StepExecutionRequest, ComponentSchema } from '@/models/cfv_models_generated';

// Global execution engine instance (shared with flow execution)
let executionEngine: ServerExecutionEngine | null = null;

function getExecutionEngine(): ServerExecutionEngine {
  if (!executionEngine) {
    // Initialize with component schemas (same as flow execution)
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
    const body: StepExecutionRequest = await request.json();
    
    // Validate request
    if (!body.stepDefinition) {
      return NextResponse.json(
        { error: 'Step definition is required' },
        { status: 400 }
      );
    }

    if (!body.inputData) {
      return NextResponse.json(
        { error: 'Input data is required' },
        { status: 400 }
      );
    }

    if (!body.componentConfig) {
      return NextResponse.json(
        { error: 'Component config is required' },
        { status: 400 }
      );
    }

    // Execute step
    const engine = getExecutionEngine();
    const result = await engine.executeStep(body);

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Step execution API error:', error);
    return NextResponse.json(
      { 
        error: 'Step execution failed', 
        details: error.message,
        stepId: 'unknown',
        status: 'FAILURE'
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 