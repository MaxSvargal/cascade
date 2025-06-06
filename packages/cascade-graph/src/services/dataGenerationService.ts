// Data Generation Service
// Extracted from CascadeFlowVisualizer to provide reusable data generation utilities
// Handles schema-based data generation, trigger data generation, and component simulation

import { ComponentSchema, IModuleRegistry } from '../models/cfv_models_generated';

export interface DataGenerationOptions {
  useDefaults?: boolean;
  includeOptional?: boolean;
  generateRealistic?: boolean;
}

export class DataGenerationService {
  constructor(
    private moduleRegistry: IModuleRegistry,
    private componentSchemas: Record<string, ComponentSchema> = {}
  ) {}

  /**
   * Generate data from JSON schema with different scenarios
   */
  generateDataFromSchema(
    schema: any, 
    dataType: 'happy_path' | 'fork_paths' | 'error_cases', 
    useDefaults: boolean = false
  ): any {
    if (!schema) return {};
    
    switch (schema.type) {
      case 'object':
        const obj: any = {};
        if (schema.properties) {
          Object.entries(schema.properties).forEach(([key, propSchema]: [string, any]) => {
            if (useDefaults && propSchema.default !== undefined) {
              obj[key] = propSchema.default;
            } else {
              obj[key] = this.generateDataFromSchema(propSchema, dataType, useDefaults);
            }
          });
        }
        return obj;
        
      case 'array':
        if (schema.items) {
          return [this.generateDataFromSchema(schema.items, dataType, useDefaults)];
        }
        return [];
        
      case 'string':
        if (useDefaults && schema.default) return schema.default;
        if (schema.enum) return schema.enum[0];
        if (dataType === 'error_cases') return '';
        return schema.example || 'test-string';
        
      case 'number':
      case 'integer':
        if (useDefaults && schema.default !== undefined) return schema.default;
        if (dataType === 'error_cases') return schema.minimum ? schema.minimum - 1 : -1;
        if (schema.minimum !== undefined) return schema.minimum;
        if (schema.maximum !== undefined) return Math.floor(schema.maximum / 2);
        return 42;
        
      case 'boolean':
        if (useDefaults && schema.default !== undefined) return schema.default;
        return dataType !== 'error_cases';
        
      default:
        return useDefaults && schema.default !== undefined ? schema.default : null;
    }
  }

  /**
   * Generate realistic trigger data based on trigger configuration
   */
  generateTriggerData(trigger: any): any {
    console.log(`🎯 Generating trigger data for:`, trigger);
    
    switch (trigger.type) {
      case 'StdLib.Trigger:Http':
      case 'StdLib:HttpTrigger': // Backward compatibility
        const path = trigger.config?.path || '/api/endpoint';
        const method = trigger.config?.method || 'POST';
        
        // Generate realistic body data based on the trigger path
        let body: any = {};
        
        if (path.includes('/users/onboard') || path.includes('/onboard')) {
          // User onboarding data - CRITICAL: This becomes the trigger output that flows to first step
          // Put user data directly in body since steps expect trigger.body to contain the registration data
          body = {
            email: 'john.doe@example.com',
            password: 'SecurePass123!',
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1990-01-15',
            country: 'US',
            phoneNumber: '+1234567890',
            referralCode: 'REF123',
            acceptedTerms: true,
            // Additional metadata can be included alongside user data
            requestMetadata: {
              timestamp: new Date().toISOString(),
              requestId: 'req-' + Math.random().toString(36).substr(2, 9),
              userAgent: 'CasinoApp/1.0',
              ipAddress: '192.168.1.100'
            }
          };
        } else if (path.includes('/bet') || path.includes('/place-bet')) {
          // Betting data
          body = {
            betData: {
              userId: 'user123',
              gameId: 'slot_001',
              betAmount: 10.00,
              currency: 'USD',
              gameType: 'slots',
              sessionId: 'session_' + Date.now()
            },
            requestMetadata: {
              timestamp: new Date().toISOString(),
              requestId: 'req-' + Math.random().toString(36).substr(2, 9)
            }
          };
        } else {
          // Generic data
          body = { 
            data: {
              userId: 'user123', 
              requestId: 'req456'
            },
            requestMetadata: {
              timestamp: new Date().toISOString()
            }
          };
        }
        
        // CRITICAL: The trigger output should be the complete HTTP request data
        // This is what gets passed to the first step via inputs_map
        const triggerOutput = {
          method,
          path,
          headers: { 
            'content-type': 'application/json',
            'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            'user-agent': 'CasinoApp/1.0',
            'x-request-id': body.requestMetadata?.requestId || 'req-unknown'
          },
          body,
          // Additional trigger metadata
          triggerType: trigger.type, // Use the actual trigger type
          triggerConfig: trigger.config,
          receivedAt: new Date().toISOString()
        };
        
        console.log(`🎯 Generated HttpTrigger output:`, triggerOutput);
        return triggerOutput;
        
      case 'StdLib.Trigger:Schedule':
      case 'StdLib.Trigger:Scheduled':
      case 'StdLib:ScheduledTrigger': // Backward compatibility
        const scheduledOutput = {
          scheduledTime: new Date().toISOString(),
          triggerType: trigger.type, // Use the actual trigger type
          data: { 
            batchId: 'batch123',
            scheduleName: trigger.config?.scheduleName || 'default-schedule'
          },
          triggerConfig: trigger.config,
          triggeredAt: new Date().toISOString()
        };
        console.log(`🎯 Generated ScheduledTrigger output:`, scheduledOutput);
        return scheduledOutput;
        
      case 'StdLib.Trigger:EventBus':
      case 'StdLib:EventTrigger': // Backward compatibility
        const eventOutput = {
          eventType: trigger.config?.eventType || 'generic-event',
          eventData: {
            userId: 'user123',
            eventId: 'event-' + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString()
          },
          triggerType: trigger.type, // Use the actual trigger type
          triggerConfig: trigger.config,
          receivedAt: new Date().toISOString()
        };
        console.log(`🎯 Generated EventTrigger output:`, eventOutput);
        return eventOutput;
        
      default:
        const defaultOutput = {
          eventType: 'sample-event',
          data: { 
            userId: 'user123', 
            timestamp: new Date().toISOString() 
          },
          triggerType: trigger.type || 'unknown',
          triggerConfig: trigger.config,
          triggeredAt: new Date().toISOString()
        };
        console.log(`🎯 Generated default trigger output:`, defaultOutput);
        return defaultOutput;
    }
  }

  /**
   * Generate realistic HTTP response bodies based on URL patterns
   */
  private generateHttpResponseBody(componentType: string, inputData: any, config: any): any {
    // Generate realistic HTTP response bodies based on URL patterns
    if (config?.url?.includes('jurisdiction-check')) {
      return {
        allowed: inputData?.country !== 'RESTRICTED',
        jurisdiction: inputData?.country || 'US',
        restrictions: [],
        checkId: 'jur-' + Math.random().toString(36).substr(2, 9)
      };
    } else if (config?.url?.includes('sanctions-screening')) {
      return {
        flagged: false, // Simulate clean screening
        riskScore: 0.1,
        screeningId: 'san-' + Math.random().toString(36).substr(2, 9),
        lastUpdated: new Date().toISOString()
      };
    } else if (config?.url?.includes('/users') && config?.method === 'POST') {
      return {
        userId: 'user-' + Math.random().toString(36).substr(2, 9),
        status: 'active',
        createdAt: new Date().toISOString(),
        profile: inputData?.userData || inputData
      };
    } else {
      // Generic HTTP response
      return {
        success: true,
        data: inputData,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Simulate component execution with optimized data flow
   * OPTIMIZED: Components return streamlined structure to reduce duplication
   * Components receive BOTH inputData AND config, and should return structured outputs
   * ENHANCED: Use component configuration to determine execution timing and async behavior
   */
  simulateComponentExecution(
    componentType: string, 
    inputData: any, 
    config: any, 
    componentSchema?: ComponentSchema
  ): any {
    // Generate realistic output based on component type and schema - CRITICAL: outputs must be usable by next steps
    console.log(`🔧 Simulating ${componentType} with input:`, inputData, 'and config:', config);
    
    switch (componentType) {
      case 'StdLib:Fork':
        // CRITICAL: Fork components duplicate input data to multiple named output ports
        // TIMING: Synchronous component - very fast (5-20ms)
        const forkResults: Record<string, any> = {};
        
        if (config?.outputNames) {
          // Use outputNames from config (correct DSL format)
          if (Array.isArray(config.outputNames)) {
            config.outputNames.forEach((outputName: string) => {
              // Fork duplicates ONLY the essential input data to each named output port
              forkResults[outputName] = inputData.data || inputData;
            });
          } else {
            console.warn('config.outputNames is not an array:', config.outputNames);
          }
        } else if (config?.branches) {
          // Fallback for legacy config with branches
          if (Array.isArray(config.branches)) {
            config.branches.forEach((branch: any) => {
              forkResults[branch.name] = inputData.data || inputData;
            });
          } else {
            console.warn('config.branches is not an array:', config.branches);
          }
        }
        
        const forkOutput = {
          branches: forkResults, // All branch results with ESSENTIAL data only
          forkConfig: config // Fork configuration
        };
        
        // OPTIMIZED: Return streamlined structure with timing information
        return {
          // Store only essential input reference, not full input data
          inputRef: { 
            sourceType: "previous_step",
            dataSize: JSON.stringify(inputData).length,
            timestamp: new Date().toISOString()
          },
          output: forkOutput,
          executionTiming: {
            isAsync: false,
            estimatedDurationMs: Math.random() * 15 + 5, // 5-20ms for fork
            enablesParallelExecution: true // CRITICAL: Fork enables parallel downstream execution
          }
        };

      case 'StdLib:MapData':
        // TIMING: Synchronous component - fast (20-100ms)
        const transformedData = this.applyDataTransformation(inputData, config);
        return {
          inputRef: { 
            sourceType: "previous_step",
            dataSize: JSON.stringify(inputData).length,
            timestamp: new Date().toISOString()
          },
          output: {
            mappedData: transformedData,
            transformationApplied: true,
            transformationConfig: config
          },
          executionTiming: {
            isAsync: false,
            estimatedDurationMs: Math.random() * 80 + 20 // 20-100ms for data mapping
          }
        };

      case 'StdLib:HttpCall':
        // TIMING: Async component - use config timeout or default (2000-3000ms)
        const timeoutMs = config?.timeoutMs || (Math.random() * 10000 + 500);
        const httpResponse = this.generateHttpResponseBody(componentType, inputData, config);
        return {
          inputRef: { 
            sourceType: "previous_step",
            dataSize: JSON.stringify(inputData).length,
            timestamp: new Date().toISOString()
          },
          output: {
            status: 200,
            response: {
              body: httpResponse,
              headers: { 'content-type': 'application/json' },
              status: 200
            },
            requestData: inputData,
            requestConfig: config
          },
          executionTiming: {
            isAsync: true,
            estimatedDurationMs: timeoutMs * 0.7, // Use 70% of timeout as realistic duration
            configuredTimeoutMs: timeoutMs
          }
        };

      case 'StdLib:JsonSchemaValidator':
        // TIMING: Synchronous component - minimal delay (10-50ms)
        const validatedData = inputData?.data || inputData;
        return {
          inputRef: { 
            sourceType: "previous_step",
            dataSize: JSON.stringify(inputData).length,
            timestamp: new Date().toISOString()
          },
          output: {
            isValid: true,
            validData: validatedData, // This is what downstream steps should reference
            validationResult: {
              passed: true,
              errors: [],
              schema: config?.schema,
              validatedFields: Object.keys(validatedData || {})
            }
          },
          executionTiming: {
            isAsync: false,
            estimatedDurationMs: Math.random() * 40 + 10 // 10-50ms for validation
          }
        };

      case 'StdLib:DatabaseQuery':
        const dbOutput = {
          rows: [{ id: 1, ...inputData, created_at: new Date().toISOString() }],
          rowCount: 1,
          success: true,
          queryConfig: config
        };
        return {
          inputRef: { 
            sourceType: "previous_step",
            dataSize: JSON.stringify(inputData).length,
            timestamp: new Date().toISOString()
          },
          output: dbOutput,
          executionTiming: {
            isAsync: true,
            estimatedDurationMs: Math.random() * 1000 + 200 // 200-1200ms for database query
          }
        };

      case 'StdLib:DataTransform':
        // Handle legacy DataTransform - same as MapData
        const dataTransformOutput = { ...(inputData.data || inputData) };
        if (config?.expression) {
          if (config.expression.includes('age') && config.expression.includes('isEligible')) {
            dataTransformOutput.age = 25;
            dataTransformOutput.isEligible = true;
            dataTransformOutput.jurisdiction = inputData?.country || inputData?.userData?.country || 'US';
          } else if (config.expression.includes('canProceed')) {
            dataTransformOutput.canProceed = inputData.jurisdictionAllowed !== false && 
                                           inputData.onSanctionsList !== true && 
                                           inputData.ageEligible !== false;
            dataTransformOutput.complianceFlags = {
              jurisdiction: inputData.jurisdictionAllowed !== false,
              sanctions: inputData.onSanctionsList !== true,
              age: inputData.ageEligible !== false
            };
            dataTransformOutput.riskLevel = dataTransformOutput.canProceed ? 'low' : 'high';
          } else {
            dataTransformOutput.result = inputData.data || inputData;
            dataTransformOutput.processed = true;
            dataTransformOutput.timestamp = new Date().toISOString();
          }
        } else {
          dataTransformOutput.result = inputData.data || inputData;
          dataTransformOutput.success = true;
        }
        return {
          inputRef: { 
            sourceType: "previous_step",
            dataSize: JSON.stringify(inputData).length,
            timestamp: new Date().toISOString()
          },
          output: { ...dataTransformOutput, transformationConfig: config },
          executionTiming: {
            isAsync: false,
            estimatedDurationMs: Math.random() * 80 + 20 // 20-100ms for data transformation
          }
        };

      case 'StdLib:FilterData':
        // CRITICAL: Filter components evaluate conditions and return filtered data
        const filterOutput: Record<string, any> = {
          matched: true, // Simulate successful filter match
          filteredData: inputData,
          filterExpression: config?.expression || 'default',
          filterConfig: config
        };
        if (config?.matchOutput) {
          filterOutput[config.matchOutput] = inputData;
        }
        if (config?.noMatchOutput) {
          filterOutput[config.noMatchOutput] = null;
        }
        return {
          inputRef: { 
            sourceType: "previous_step",
            dataSize: JSON.stringify(inputData).length,
            timestamp: new Date().toISOString()
          },
          output: filterOutput,
          executionTiming: {
            isAsync: false,
            estimatedDurationMs: Math.random() * 30 + 10 // 10-40ms for filtering
          }
        };

      case 'StdLib:Validation':
        const basicValidationOutput = {
          isValid: true,
          validatedData: inputData,
          errors: [],
          validationConfig: config
        };
        return {
          inputRef: { 
            sourceType: "previous_step",
            dataSize: JSON.stringify(inputData).length,
            timestamp: new Date().toISOString()
          },
          output: basicValidationOutput,
          executionTiming: {
            isAsync: false,
            estimatedDurationMs: Math.random() * 40 + 10 // 10-50ms for validation
          }
        };

      case 'StdLib:SubFlowInvoker':
        // TIMING: Async component - depends on invoked flow complexity (1000-5000ms)
        const estimatedDuration = Math.random() * 4000 + 1000;
        return {
          inputRef: { 
            sourceType: "previous_step",
            dataSize: JSON.stringify(inputData).length,
            timestamp: new Date().toISOString()
          },
          output: {
            result: {
              status: 'completed',
              data: inputData,
              flowFqn: config?.flowName,
              executionId: 'subflow-' + Math.random().toString(36).substr(2, 9)
            },
            success: true
          },
          executionTiming: {
            isAsync: true,
            estimatedDurationMs: estimatedDuration
          }
        };

      case 'StdLib:WaitForDuration':
        // TIMING: Async component - use exact configured duration
        const waitDuration = config?.durationMs || 1000;
        return {
          inputRef: { 
            sourceType: "previous_step",
            dataSize: JSON.stringify(inputData).length,
            timestamp: new Date().toISOString()
          },
          output: {
            data: inputData // Pass through input data
          },
          executionTiming: {
            isAsync: true,
            estimatedDurationMs: waitDuration,
            isWaitComponent: true
          }
        };

      case 'StdLib:Join':
        // TIMING: Async component - depends on slowest input + timeout
        const joinTimeout = config?.timeoutMs || 10000;
        return {
          inputRef: { 
            sourceType: "previous_step",
            dataSize: JSON.stringify(inputData).length,
            timestamp: new Date().toISOString()
          },
          output: {
            aggregatedData: inputData,
            joinConfig: config
          },
          executionTiming: {
            isAsync: true,
            estimatedDurationMs: joinTimeout * 0.5, // Assume inputs arrive within 50% of timeout
            requiresMultipleInputs: true,
            configuredTimeoutMs: joinTimeout
          }
        };

      default:
        // TIMING: Default to synchronous with moderate delay (100-500ms)
        const defaultDuration = Math.random() * 400 + 100;
        
        // Use schema to generate output if available
        if (componentSchema?.outputSchema) {
          const schemaBasedOutput = this.generateDataFromSchema(componentSchema.outputSchema, 'happy_path', true);
          return {
            inputRef: { 
              sourceType: "previous_step",
              dataSize: JSON.stringify(inputData).length,
              timestamp: new Date().toISOString()
            },
            output: {
              ...schemaBasedOutput,
              componentConfig: config
            },
            executionTiming: {
              isAsync: false,
              estimatedDurationMs: defaultDuration
            }
          };
        } else {
          // CRITICAL: Default fallback should preserve input data and config for next steps
          return {
            inputRef: { 
              sourceType: "previous_step",
              dataSize: JSON.stringify(inputData).length,
              timestamp: new Date().toISOString()
            },
            output: { 
              result: inputData.data || inputData, 
              success: true, 
              timestamp: new Date().toISOString(),
              componentType: componentType,
              componentConfig: config
            },
            executionTiming: {
              isAsync: false,
              estimatedDurationMs: defaultDuration
            }
          };
        }
    }
  }

  /**
   * Apply data transformation based on MapData configuration
   */
  private applyDataTransformation(inputData: any, config: any): any {
    if (!config?.expression) {
      // No expression, pass through with enhancement
      return {
        result: inputData.data || inputData,
        success: true
      };
    }

    // Simple expression evaluation (in real implementation, use proper expression engine)
    try {
      // For demo purposes, just return enhanced data
      return {
        result: inputData.data || inputData,
        transformationApplied: true,
        expression: config.expression
      };
    } catch (error) {
      return {
        result: inputData.data || inputData,
        success: false,
        error: error instanceof Error ? error.message : 'Transformation failed'
      };
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Generate input structure from component schema
   */
  generateInputStructureFromSchema(inputSchema: any, useDefaults?: boolean): any {
    console.log('Generating input structure from schema:', inputSchema, useDefaults);
    
    // Handle both cases: direct schema or schema object with inputSchema property
    let actualSchema = null;
    if (inputSchema?.inputSchema) {
      // Schema object with inputSchema property
      actualSchema = inputSchema.inputSchema;
    } else if (inputSchema?.type || inputSchema?.properties) {
      // Direct JSON schema
      actualSchema = inputSchema;
    }
    
    if (!actualSchema) {
      return {};
    }
    
    return this.generateDataFromSchema(actualSchema, 'happy_path', useDefaults);
  }

  /**
   * Validate input data against schema
   */
  validateInputAgainstSchema(inputData: any, inputSchema: any): any {
    console.log('Validating input against schema:', inputData, inputSchema);
    
    const errors: any[] = [];
    const warnings: any[] = [];
    
    // Handle both cases: direct schema or schema object with inputSchema property
    let actualSchema = null;
    if (inputSchema?.inputSchema) {
      // Schema object with inputSchema property
      actualSchema = inputSchema.inputSchema;
    } else if (inputSchema?.type || inputSchema?.properties) {
      // Direct JSON schema
      actualSchema = inputSchema;
    }
    
    if (!actualSchema) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        normalizedData: inputData
      };
    }
    
    // Basic validation logic
    if (actualSchema.required) {
      actualSchema.required.forEach((field: string) => {
        if (!inputData || inputData[field] === undefined || inputData[field] === null) {
          errors.push({
            fieldPath: field,
            message: `Required field '${field}' is missing`,
            expectedType: actualSchema.properties?.[field]?.type || 'any',
            actualValue: inputData?.[field],
            schemaRule: 'required'
          });
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      normalizedData: inputData
    };
  }
} 