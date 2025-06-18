// Unified Execution Demo - Examples of using the new consolidated API
// Shows how to use both production API and test server

import {
  CascadeClient,
  createProductionClient,
  createTestClient,
  processEventStream
} from '@cascade/client';
import { ComponentSchema } from '../models/cfv_models_generated';

// Example component schemas for testing
const testComponentSchemas: Record<string, ComponentSchema> = {
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
  }
};

// Example flow definition
const exampleFlowDefinition = {
  name: 'demo.ExampleFlow',
  trigger: {
    type: 'manual',
    config: {}
  },
  steps: [
    {
      step_id: 'fetch_data',
      component: 'StdLib:HttpCall',
      config: {
        url: 'https://api.example.com/data',
        method: 'GET',
        timeoutMs: 5000
      },
      inputs_map: {
        url: 'trigger.requestUrl'
      }
    },
    {
      step_id: 'transform_data',
      component: 'StdLib:MapData',
      config: {
        mapping: {
          id: 'data.id',
          name: 'data.name',
          processed: true
        }
      },
      inputs_map: {
        data: 'fetch_data.data'
      }
    }
  ]
};

/**
 * Demo 1: Using Production API
 */
export async function demoProductionAPI() {
  console.log('=== Production API Demo ===');
  
  const client = createProductionClient();
  
  try {
    // Execute flow with streaming
    const stream = await client.executeFlow({
      flowDefinition: exampleFlowDefinition,
      triggerInput: {
        requestUrl: 'https://api.example.com/users/123'
      }
    });

    // Process streaming events
    await processEventStream(
      stream,
      (eventType, data) => {
        console.log(`Event: ${eventType}`, data);
      },
      (error) => {
        console.error('Stream error:', error);
      }
    );

  } catch (error) {
    console.error('Production API error:', error);
  }
}

/**
 * Demo 2: Using Test Server
 */
export async function demoTestServer() {
  console.log('=== Test Server Demo ===');
  
  const client = createTestClient(testComponentSchemas);
  
  try {
    // Execute flow with streaming (simulated)
    const stream = await client.executeFlow({
      flowDefinition: exampleFlowDefinition,
      triggerInput: {
        requestUrl: 'https://api.example.com/users/123'
      }
    });

    // Process streaming events
    await processEventStream(
      stream,
      (eventType, data) => {
        console.log(`Test Event: ${eventType}`, data);
      },
      (error) => {
        console.error('Test stream error:', error);
      }
    );

  } catch (error) {
    console.error('Test server error:', error);
  }
}

/**
 * Demo 3: Single Step Execution
 */
export async function demoStepExecution() {
  console.log('=== Step Execution Demo ===');
  
  // Test with both clients
  const productionClient = createProductionClient();
  const testClient = createTestClient(testComponentSchemas);
  
  const stepRequest = {
    stepDefinition: {
      step_id: 'test_step',
      component: 'StdLib:MapData'
    },
    inputData: {
      user: { id: 123, name: 'John Doe' },
      timestamp: new Date().toISOString()
    },
    componentConfig: {
      mapping: {
        userId: 'user.id',
        userName: 'user.name',
        processed: true
      }
    }
  };

  try {
    console.log('Testing with test server...');
    const testResult = await testClient.executeStep(stepRequest);
    console.log('Test result:', testResult);

    console.log('Testing with production API...');
    const prodResult = await productionClient.executeStep(stepRequest);
    console.log('Production result:', prodResult);

  } catch (error) {
    console.error('Step execution error:', error);
  }
}

/**
 * Demo 4: Execution Status and Cancellation
 */
export async function demoStatusAndCancellation() {
  console.log('=== Status and Cancellation Demo ===');
  
  const client = createTestClient(testComponentSchemas);
  
  try {
    // Start a flow execution
    const stream = await client.executeFlow({
      flowDefinition: exampleFlowDefinition,
      triggerInput: { requestUrl: 'https://api.example.com/test' },
      executionId: 'demo_execution_123'
    });

    // Check status
    setTimeout(async () => {
      const status = await client.getExecutionStatus('demo_execution_123');
      console.log('Execution status:', status);

      // Cancel execution
      const cancelResult = await client.cancelExecution('demo_execution_123', 'Demo cancellation');
      console.log('Cancellation result:', cancelResult);
    }, 1000);

    // Process events until cancelled
    await processEventStream(
      stream,
      (eventType, data) => {
        console.log(`Status Demo Event: ${eventType}`, data);
      }
    );

  } catch (error) {
    console.error('Status demo error:', error);
  }
}

/**
 * Demo 5: Dynamic Mode Switching
 */
export async function demoDynamicSwitching() {
  console.log('=== Dynamic Mode Switching Demo ===');
  
  const client = new CascadeClient({
    useTestServer: true,
    componentSchemas: testComponentSchemas
  });

  const stepRequest = {
    stepDefinition: {
      step_id: 'switch_test',
      component: 'StdLib:HttpCall'
    },
    inputData: { url: 'https://api.example.com/test' },
    componentConfig: {
      url: 'https://api.example.com/test',
      method: 'GET'
    }
  };

  try {
    console.log('Mode:', client.isTestMode() ? 'Test Server' : 'Production API');
    const testResult = await client.executeStep(stepRequest);
    console.log('Test mode result:', testResult);

    // Switch to production mode
    client.setTestMode(false);
    console.log('Switched to mode:', client.isTestMode() ? 'Test Server' : 'Production API');
    
    // This would now call the real API
    // const prodResult = await client.executeStep(stepRequest);
    // console.log('Production mode result:', prodResult);

  } catch (error) {
    console.error('Dynamic switching error:', error);
  }
}

/**
 * Demo 6: Browser Usage Example
 */
export function demoBrowserUsage() {
  console.log('=== Browser Usage Example ===');
  
  // This is how you would use it in a browser environment
  const setupBrowserClient = () => {
    // For development/testing - runs entirely in browser
    const testClient = createTestClient(testComponentSchemas);
    
    // For production - calls real API
    const prodClient = createProductionClient({
      apiBaseUrl: '/api/execution',
      timeoutMs: 30000
    });

    // You can switch based on environment or user preference
    const isDevelopment = process.env.NODE_ENV === 'development';
    const client = isDevelopment ? testClient : prodClient;

    return client;
  };

  const client = setupBrowserClient();
  console.log('Browser client created, test mode:', client.isTestMode());

  // Example usage in a React component or similar
  const executeFlowInBrowser = async () => {
    try {
      const stream = await client.executeFlow({
        flowDefinition: exampleFlowDefinition,
        triggerInput: { requestUrl: 'https://api.example.com/browser-test' }
      });

      await processEventStream(
        stream,
        (eventType, data) => {
          // Update UI based on events
          console.log('Browser event:', eventType, data);
          // e.g., updateProgressBar(data), showStepResult(data), etc.
        },
        (error) => {
          // Handle errors in UI
          console.error('Browser execution error:', error);
          // e.g., showErrorMessage(error.message)
        }
      );

    } catch (error) {
      console.error('Browser flow execution failed:', error);
    }
  };

  // Simulate browser execution
  executeFlowInBrowser();
}

/**
 * Run all demos
 */
export async function runAllDemos() {
  console.log('🚀 Starting Unified Execution Demos...\n');

  // Note: In a real scenario, you'd run these one at a time
  // to avoid overwhelming the console output

  await demoTestServer();
  console.log('\n');

  await demoStepExecution();
  console.log('\n');

  await demoStatusAndCancellation();
  console.log('\n');

  await demoDynamicSwitching();
  console.log('\n');

  demoBrowserUsage();
  console.log('\n');

  // Uncomment to test production API (requires server to be running)
  // await demoProductionAPI();

  console.log('✅ All demos completed!');
}

// Export for easy testing
export {
  testComponentSchemas,
  exampleFlowDefinition
}; 