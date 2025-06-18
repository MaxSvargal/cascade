// Cascade Client - Unified interface for production API and test server
// Provides seamless switching between real API calls and browser-based testing

import { CascadeTestServer } from './testServer';
import {
  StreamingExecutionRequest,
  StepExecutionRequest,
  ExecutionStatus,
  ExecutionCancellationResponse,
  ComponentSchema,
  CascadeClientConfig,
  CascadeExecutionRequest
} from './types';

/**
 * Unified Cascade Client
 * Provides a single interface that can use either the production API or test server
 */
export class CascadeClient {
  private config: CascadeClientConfig;
  private testServer?: CascadeTestServer;

  constructor(config: CascadeClientConfig) {
    this.config = {
      apiBaseUrl: '/api/execution',
      timeoutMs: 30000,
      ...config
    };

    if (this.config.useTestServer) {
      this.testServer = new CascadeTestServer(this.config.componentSchemas);
    }
  }

  /**
   * Execute a flow with streaming updates
   */
  async executeFlow(request: {
    flowDefinition: any;
    triggerInput: any;
    executionOptions?: any;
    targetStepId?: string;
    executionId?: string;
  }): Promise<ReadableStream> {
    const execRequest: CascadeExecutionRequest = {
      action: 'flow',
      ...request
    };

    if (this.config.useTestServer && this.testServer) {
      return this.testServer.execute(execRequest) as Promise<ReadableStream>;
    }

    const response = await this.callProductionAPI(execRequest);
    if (!response.body) {
      throw new Error('No response body for streaming');
    }
    return response.body;
  }

  /**
   * Execute a single step
   */
  async executeStep(request: {
    stepDefinition: any;
    inputData: any;
    componentConfig: any;
    executionOptions?: any;
  }): Promise<any> {
    const execRequest: CascadeExecutionRequest = {
      action: 'step',
      ...request
    };

    if (this.config.useTestServer && this.testServer) {
      return this.testServer.execute(execRequest);
    }

    const response = await this.callProductionAPI(execRequest);
    return this.parseJSONResponse(response);
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(executionId: string): Promise<ExecutionStatus | null> {
    const execRequest: CascadeExecutionRequest = {
      action: 'status',
      executionId
    };

    if (this.config.useTestServer && this.testServer) {
      return this.testServer.execute(execRequest) as Promise<ExecutionStatus | null>;
    }

    try {
      const response = await this.callProductionAPI(execRequest);
      return this.parseJSONResponse(response);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string, reason?: string): Promise<ExecutionCancellationResponse> {
    const execRequest: CascadeExecutionRequest = {
      action: 'cancel',
      executionId,
      reason
    };

    if (this.config.useTestServer && this.testServer) {
      return this.testServer.execute(execRequest) as Promise<ExecutionCancellationResponse>;
    }

    const response = await this.callProductionAPI(execRequest);
    return this.parseJSONResponse(response);
  }

  /**
   * Switch between test server and production API
   */
  setTestMode(useTestServer: boolean): void {
    this.config.useTestServer = useTestServer;
    
    if (useTestServer && !this.testServer) {
      this.testServer = new CascadeTestServer(this.config.componentSchemas);
    }
  }

  /**
   * Check if currently using test server
   */
  isTestMode(): boolean {
    return this.config.useTestServer;
  }

  /**
   * Get current configuration
   */
  getConfig(): CascadeClientConfig {
    return { ...this.config };
  }

  // Private methods

  private async callProductionAPI(request: CascadeExecutionRequest): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(this.config.apiBaseUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        const error = new Error(errorData.error || `HTTP ${response.status}`);
        (error as any).status = response.status;
        (error as any).data = errorData;
        throw error;
      }

      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeoutMs}ms`);
      }
      
      throw error;
    }
  }

  private async parseJSONResponse(response: Response): Promise<any> {
    const text = await response.text();
    if (!text) {
      return null;
    }
    
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error(`Invalid JSON response: ${text}`);
    }
  }
}

/**
 * Convenience function to create a client for production use
 */
export function createProductionClient(config: Partial<CascadeClientConfig> = {}): CascadeClient {
  return new CascadeClient({
    useTestServer: false,
    ...config
  });
}

/**
 * Convenience function to create a client for testing
 */
export function createTestClient(componentSchemas?: Record<string, ComponentSchema>): CascadeClient {
  return new CascadeClient({
    useTestServer: true,
    componentSchemas
  });
}

/**
 * Helper function to process Server-Sent Events stream
 */
export async function processEventStream(
  stream: ReadableStream,
  onEvent: (eventType: string, data: any) => void,
  onError?: (error: Error) => void
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      
      // Process complete events
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      let currentEvent: { type?: string; data?: string } = {};
      
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent.type = line.substring(7);
        } else if (line.startsWith('data: ')) {
          currentEvent.data = line.substring(6);
        } else if (line === '' && currentEvent.type && currentEvent.data) {
          // Complete event
          try {
            const eventData = JSON.parse(currentEvent.data);
            onEvent(currentEvent.type, eventData);
          } catch (error) {
            console.warn('Failed to parse event data:', currentEvent.data);
          }
          currentEvent = {};
        }
      }
    }
  } catch (error: any) {
    if (onError) {
      onError(error);
    } else {
      console.error('Stream processing error:', error);
    }
  } finally {
    reader.releaseLock();
  }
} 