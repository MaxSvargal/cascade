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
   * Simulate component execution with realistic outputs
   */
  simulateComponentExecution(
    componentType: string, 
    inputData: any, 
    config: any, 
    componentSchema?: ComponentSchema
  ): any {
    // Generate realistic output based on component type and schema - CRITICAL: outputs must be usable by next steps
    // Components receive BOTH inputData AND config, and should return structured outputs
    console.log(`🔧 Simulating ${componentType} with input:`, inputData, 'and config:', config);
    
    switch (componentType) {
      case 'StdLib:HttpCall':
        return {
          status: 200,
          body: { success: true, data: inputData, timestamp: new Date().toISOString() },
          headers: { 'content-type': 'application/json' },
          requestConfig: config, // Include config that was used
          inputData: inputData // Preserve input data for debugging
        };
      
      case 'StdLib:DatabaseQuery':
        return {
          rows: [{ id: 1, ...inputData, created_at: new Date().toISOString() }],
          rowCount: 1,
          success: true,
          queryConfig: config,
          inputData: inputData
        };
      
      case 'StdLib:JsonSchemaValidator':
        // CRITICAL: For validators, return BOTH validation result AND the validated data
        if (inputData?.data) {
          return {
            isValid: true,
            validData: inputData.data, // The validated data that passes to next steps
            validationResult: {
              passed: true,
              errors: [],
              schema: config?.schema,
              validatedFields: Object.keys(inputData.data || {})
            },
            inputData: inputData, // Original input for reference
            config: config // Validation config used
          };
        } else {
          return {
            isValid: true,
            validData: inputData, // Pass through all input data if no nested data
            validationResult: {
              passed: true,
              errors: [],
              schema: config?.schema,
              validatedFields: Object.keys(inputData || {})
            },
            inputData: inputData,
            config: config
          };
        }
      
      case 'StdLib:DataTransform':
      case 'StdLib:MapData':
        // CRITICAL: For data transformation, apply actual transformations based on config
        const transformed = { ...inputData };
        if (config?.expression) {
          // Simulate expression evaluation - in real implementation would use actual expression engine
          if (config.expression.includes('age') && inputData?.userData?.dateOfBirth) {
            transformed.age = 25; // Simulated age calculation
            transformed.isEligible = true;
            transformed.jurisdiction = inputData.userData.country || 'US';
          } else if (config.expression.includes('canProceed')) {
            // Handle evaluate-compliance-results step specifically
            transformed.canProceed = inputData.jurisdictionAllowed !== false && 
                                   inputData.onSanctionsList !== true && 
                                   inputData.ageEligible !== false;
            transformed.complianceFlags = {
              jurisdiction: inputData.jurisdictionAllowed !== false,
              sanctions: inputData.onSanctionsList !== true,
              age: inputData.ageEligible !== false
            };
            transformed.riskLevel = transformed.canProceed ? 'low' : 'high';
          } else {
            // Generic transformation - enhance input data
            transformed.result = inputData;
            transformed.processed = true;
            transformed.timestamp = new Date().toISOString();
          }
        } else {
          // No expression, pass through with enhancement
          transformed.result = inputData;
          transformed.success = true;
        }
        return {
          ...transformed, // Spread the transformed data
          transformationConfig: config, // Include config used
          originalInput: inputData // Preserve original input
        };
      
      case 'StdLib:Fork':
        // CRITICAL: Fork components run multiple branches and return combined results
        const forkResults: Record<string, any> = {};
        if (config?.outputNames) {
          // Use outputNames from config (correct DSL format)
          config.outputNames.forEach((outputName: string) => {
            // Fork duplicates input data to each named output port
            forkResults[outputName] = inputData;
          });
        } else if (config?.branches) {
          // Fallback for legacy config with branches
          config.branches.forEach((branch: any) => {
            if (branch.name === 'jurisdiction-check') {
              forkResults[branch.name] = { 
                allowed: true, 
                jurisdiction: inputData?.userData?.country || inputData?.country || 'US',
                checkConfig: branch.config
              };
            } else if (branch.name === 'sanctions-check') {
              forkResults[branch.name] = { 
                flagged: false, 
                clearanceLevel: 'green',
                checkConfig: branch.config
              };
            } else if (branch.name === 'age-verification') {
              forkResults[branch.name] = { 
                age: 25, 
                isEligible: true, 
                jurisdiction: inputData?.userData?.country || inputData?.country || 'US',
                checkConfig: branch.config
              };
            } else {
              // Generic branch result
              forkResults[branch.name] = { 
                success: true, 
                data: inputData,
                branchConfig: branch.config
              };
            }
          });
        }
        return {
          ...forkResults, // Spread the fork results at the top level for easier access
          forkConfig: config, // Fork configuration
          inputData: inputData // Original input data for debugging
        };
      
      default:
        // CRITICAL: Handle named components and use schema if available
        if (componentSchema?.outputSchema) {
          const schemaBasedOutput = this.generateDataFromSchema(componentSchema.outputSchema, 'happy_path', true);
          return {
            ...schemaBasedOutput,
            componentConfig: config,
            inputData: inputData
          };
        } else {
          // CRITICAL: Default fallback should preserve input data and config for next steps
          return { 
            result: inputData, 
            success: true, 
            timestamp: new Date().toISOString(),
            componentType: componentType,
            componentConfig: config,
            inputData: inputData
          };
        }
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