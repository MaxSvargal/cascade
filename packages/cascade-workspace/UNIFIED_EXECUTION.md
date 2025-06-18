# Unified Execution System

This document describes the new unified execution system that consolidates all execution operations into a single API endpoint and provides a browser-compatible test server.

## Overview

The previous system had **4 separate API endpoints** with duplicated code and complex client integration:
- `/api/execution/flow` - Flow execution with streaming
- `/api/execution/step` - Single step execution  
- `/api/execution/[executionId]/status` - Execution status
- `/api/execution/[executionId]` - Execution cancellation

The new system provides:
- **Single API endpoint**: `/api/execution` with action-based routing
- **Browser test server**: Runs entirely in browser without API calls
- **Unified client**: Seamless switching between production and test modes
- **Simplified integration**: One interface for all operations

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cascade Client                           │
│  ┌─────────────────┐              ┌─────────────────────┐   │
│  │ Production Mode │              │   Test Mode         │   │
│  │                 │              │                     │   │
│  │ HTTP API Calls  │    <--->     │ Browser Test Server │   │
│  │ /api/execution  │              │ (In-Memory)         │   │
│  └─────────────────┘              └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Application / UI Components                    │
│  • Same interface regardless of mode                        │
│  • Streaming events processing                              │
│  • Error handling                                           │
│  • Progress tracking                                        │
└─────────────────────────────────────────────────────────────┘
```

## Files Structure

```
packages/cascade-workspace/src/
├── app/api/execution/
│   └── route.ts                     # NEW: Unified API endpoint
├── services/
│   ├── cascadeTestServer.ts         # NEW: Browser test server
│   ├── cascadeClient.ts             # NEW: Unified client
│   └── serverExecutionEngine.ts     # Existing server engine
└── examples/
    └── unifiedExecutionDemo.ts      # NEW: Usage examples
```

## Usage Examples

### 1. Basic Setup

```typescript
import { createProductionClient, createTestClient } from '../services/cascadeClient';

// For production use
const prodClient = createProductionClient();

// For testing/development
const testClient = createTestClient(componentSchemas);
```

### 2. Flow Execution with Streaming

```typescript
const client = createTestClient();

// Execute flow
const stream = await client.executeFlow({
  flowDefinition: myFlowDefinition,
  triggerInput: { userId: 123 }
});

// Process streaming events
await processEventStream(
  stream,
  (eventType, data) => {
    console.log(`Event: ${eventType}`, data);
    // Update UI: progress bars, step results, etc.
  },
  (error) => {
    console.error('Execution error:', error);
    // Handle errors in UI
  }
);
```

### 3. Single Step Execution

```typescript
const result = await client.executeStep({
  stepDefinition: {
    step_id: 'transform_data',
    component: 'StdLib:MapData'
  },
  inputData: { user: { id: 123, name: 'John' } },
  componentConfig: {
    mapping: { userId: 'user.id', userName: 'user.name' }
  }
});

console.log('Step result:', result);
```

### 4. Execution Status and Cancellation

```typescript
// Check status
const status = await client.getExecutionStatus('execution_123');
console.log('Status:', status);

// Cancel execution
const cancelResult = await client.cancelExecution('execution_123', 'User requested');
console.log('Cancelled:', cancelResult.cancelled);
```

### 5. Dynamic Mode Switching

```typescript
const client = new CascadeClient({
  useTestServer: true,
  componentSchemas: mySchemas
});

// Start in test mode
console.log('Test mode:', client.isTestMode()); // true

// Switch to production
client.setTestMode(false);
console.log('Production mode:', client.isTestMode()); // false
```

## API Reference

### Unified API Endpoint

**POST** `/api/execution`

```typescript
interface UnifiedExecutionRequest {
  action: 'flow' | 'step' | 'status' | 'cancel';
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
```

**Examples:**

```bash
# Flow execution
curl -X POST /api/execution \
  -H "Content-Type: application/json" \
  -d '{
    "action": "flow",
    "flowDefinition": {...},
    "triggerInput": {...}
  }'

# Step execution
curl -X POST /api/execution \
  -H "Content-Type: application/json" \
  -d '{
    "action": "step",
    "stepDefinition": {...},
    "inputData": {...},
    "componentConfig": {...}
  }'

# Status check
curl -X POST /api/execution \
  -H "Content-Type: application/json" \
  -d '{
    "action": "status",
    "executionId": "exec_123"
  }'

# Cancellation
curl -X POST /api/execution \
  -H "Content-Type: application/json" \
  -d '{
    "action": "cancel",
    "executionId": "exec_123",
    "reason": "User requested"
  }'
```

### CascadeClient Methods

```typescript
class CascadeClient {
  // Flow execution with streaming
  executeFlow(request: FlowExecutionRequest): Promise<ReadableStream>
  
  // Single step execution
  executeStep(request: StepExecutionRequest): Promise<StepExecutionResult>
  
  // Get execution status
  getExecutionStatus(executionId: string): Promise<ExecutionStatus | null>
  
  // Cancel execution
  cancelExecution(executionId: string, reason?: string): Promise<ExecutionCancellationResponse>
  
  // Mode switching
  setTestMode(useTestServer: boolean): void
  isTestMode(): boolean
  getConfig(): CascadeClientConfig
}
```

## Browser Test Server

The `CascadeTestServer` provides a complete execution environment that runs in the browser:

### Features

- **No Network Calls**: Everything runs in browser memory
- **Realistic Simulation**: Mimics production timing and behavior
- **Component Schemas**: Supports custom component definitions
- **Streaming Events**: Generates the same events as production
- **Error Simulation**: Can simulate various error conditions

### Component Simulation

The test server simulates different component behaviors:

```typescript
// HTTP Call simulation
'StdLib:HttpCall' → {
  status: 200,
  data: { message: 'Test response', input: inputData },
  headers: { 'content-type': 'application/json' }
}

// Data mapping simulation
'StdLib:MapData' → {
  mappedData: { ...inputData, transformed: true },
  transformedAt: new Date().toISOString()
}

// Validation simulation
'StdLib:Validator' → {
  valid: true,
  validatedData: inputData
}
```

## Migration Guide

### From Old API Structure

**Before (Multiple Endpoints):**
```typescript
// Flow execution
const flowResponse = await fetch('/api/execution/flow', {
  method: 'POST',
  body: JSON.stringify({ flowDefinition, triggerInput })
});

// Step execution  
const stepResponse = await fetch('/api/execution/step', {
  method: 'POST', 
  body: JSON.stringify({ stepDefinition, inputData, componentConfig })
});

// Status check
const statusResponse = await fetch(`/api/execution/${executionId}/status`);

// Cancellation
const cancelResponse = await fetch(`/api/execution/${executionId}`, {
  method: 'DELETE'
});
```

**After (Unified Client):**
```typescript
import { createProductionClient } from '../services/cascadeClient';

const client = createProductionClient();

// Flow execution
const stream = await client.executeFlow({ flowDefinition, triggerInput });

// Step execution
const result = await client.executeStep({ stepDefinition, inputData, componentConfig });

// Status check
const status = await client.getExecutionStatus(executionId);

// Cancellation
const cancelResult = await client.cancelExecution(executionId);
```

### Benefits of Migration

1. **Simplified Code**: Single client interface instead of multiple fetch calls
2. **Better Error Handling**: Consistent error handling across all operations
3. **Type Safety**: Full TypeScript support with proper interfaces
4. **Testing Support**: Easy switching between production and test modes
5. **Streaming Support**: Built-in Server-Sent Events processing
6. **Timeout Management**: Configurable timeouts with proper cleanup

## Development Workflow

### 1. Development Mode (Test Server)
```typescript
// Use test server for rapid development
const client = createTestClient(componentSchemas);

// All operations run in browser - no server needed
await client.executeFlow({ flowDefinition, triggerInput });
```

### 2. Integration Testing (Production API)
```typescript
// Switch to production API for integration tests
const client = createProductionClient();

// Calls real API endpoints
await client.executeFlow({ flowDefinition, triggerInput });
```

### 3. Environment-Based Configuration
```typescript
const client = process.env.NODE_ENV === 'development' 
  ? createTestClient(componentSchemas)
  : createProductionClient();
```

## Performance Benefits

### Reduced Network Overhead
- **Before**: 4 separate endpoints, multiple HTTP requests
- **After**: Single endpoint, multiplexed operations

### Improved Caching
- **Before**: Separate execution engines per endpoint
- **After**: Single shared execution engine instance

### Better Resource Management
- **Before**: Multiple connection pools, separate timeouts
- **After**: Unified connection handling, shared resources

### Development Speed
- **Before**: Requires server restart for testing changes
- **After**: Instant feedback with browser test server

## Error Handling

The unified system provides consistent error handling:

```typescript
try {
  const result = await client.executeStep(stepRequest);
} catch (error) {
  if (error.status === 404) {
    console.log('Execution not found');
  } else if (error.status === 400) {
    console.log('Invalid request:', error.data);
  } else if (error.message.includes('timeout')) {
    console.log('Request timed out');
  } else {
    console.log('Unexpected error:', error.message);
  }
}
```

## Testing

Run the demo to see the unified system in action:

```typescript
import { runAllDemos } from '../examples/unifiedExecutionDemo';

// Run all examples
await runAllDemos();
```

Individual demo functions:
- `demoTestServer()` - Test server execution
- `demoStepExecution()` - Single step execution
- `demoStatusAndCancellation()` - Status and cancellation
- `demoDynamicSwitching()` - Mode switching
- `demoBrowserUsage()` - Browser integration

## Conclusion

The unified execution system provides:

✅ **Simplified Architecture**: Single API endpoint instead of 4 separate routes  
✅ **Better Developer Experience**: Browser test server for instant feedback  
✅ **Consistent Interface**: Same client methods for all operations  
✅ **Flexible Deployment**: Easy switching between test and production modes  
✅ **Improved Performance**: Shared resources and reduced network overhead  
✅ **Type Safety**: Full TypeScript support throughout  

This consolidation makes the system much easier to use, test, and maintain while providing the same functionality as the previous multi-endpoint approach. 