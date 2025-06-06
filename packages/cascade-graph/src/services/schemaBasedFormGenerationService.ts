// Schema-Based Form Generation Service
// Generates dynamic forms from JSON schemas with proper validation and UI hints

import { 
  ComponentSchema, 
  JsonSchemaObject, 
  ValidationResult, 
  ValidationError,
  ValidationWarning 
} from '@/models/cfv_models_generated';

export interface UISchema {
  [key: string]: {
    'ui:widget'?: string;
    'ui:placeholder'?: string;
    'ui:help'?: string;
    'ui:description'?: string;
    'ui:options'?: {
      label?: boolean;
      orderable?: boolean;
      addable?: boolean;
      removable?: boolean;
      [key: string]: any;
    };
    'ui:order'?: string[];
    [key: string]: any;
  };
}

export interface FormGenerationResult {
  schema: JsonSchemaObject;
  uiSchema: UISchema;
  defaultValues: any;
}

export interface FormValidationOptions {
  validateRequired?: boolean;
  validateTypes?: boolean;
  validateConstraints?: boolean;
  coerceTypes?: boolean;
}

/**
 * Schema-Based Form Generation Service
 * Converts component schemas to JSON Schema format for form generation
 */
export class SchemaBasedFormGenerationService {
  /**
   * Generates form schema and UI schema from a component schema
   */
  generateFormSchema(componentSchema: ComponentSchema): FormGenerationResult {
    const configSchema = componentSchema.configSchema;
    
    if (!configSchema) {
      return {
        schema: { type: 'object', properties: {} },
        uiSchema: {},
        defaultValues: {}
      };
    }

    // Convert component schema to JSON Schema format
    const schema = this.normalizeJsonSchema(configSchema);
    
    // Generate UI schema with appropriate widgets and hints
    const uiSchema = this.generateUISchema(schema, componentSchema);
    
    // Extract default values
    const defaultValues = this.extractDefaultValues(schema);

    return {
      schema,
      uiSchema,
      defaultValues
    };
  }

  /**
   * Validates form data against a JSON schema
   */
  validateFormData(
    data: any, 
    schema: JsonSchemaObject, 
    options: FormValidationOptions = {}
  ): ValidationResult {
    const {
      validateRequired = true,
      validateTypes = true,
      validateConstraints = true,
      coerceTypes = false
    } = options;

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let processedData = coerceTypes ? this.coerceDataTypes(data, schema) : data;

    try {
      // Validate required fields
      if (validateRequired && schema.required) {
        for (const requiredField of schema.required) {
          if (!(requiredField in data) || data[requiredField] === undefined || data[requiredField] === null) {
            errors.push({
              fieldPath: requiredField,
              message: `Field '${requiredField}' is required`,
              expectedType: this.getFieldType(schema, requiredField),
              actualValue: data[requiredField],
              schemaRule: 'required'
            });
          }
        }
      }

      // Validate types and constraints
      if (schema.properties) {
        for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
          const fieldValue = data[fieldName];
          
          if (fieldValue !== undefined && fieldValue !== null) {
            const fieldValidation = this.validateField(
              fieldName, 
              fieldValue, 
              fieldSchema as JsonSchemaObject,
              { validateTypes, validateConstraints }
            );
            
            errors.push(...fieldValidation.errors);
            warnings.push(...fieldValidation.warnings);
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        processedData
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          fieldPath: '',
          message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          schemaRule: 'validation'
        }]
      };
    }
  }

  /**
   * Generates UI schema hints for better form rendering
   */
  generateUISchema(schema: JsonSchemaObject, componentSchema: ComponentSchema): UISchema {
    const uiSchema: UISchema = {};

    if (schema.properties) {
      for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
        const fieldSchemaObj = fieldSchema as JsonSchemaObject;
        uiSchema[fieldName] = this.generateFieldUISchema(fieldName, fieldSchemaObj);
      }
    }

    // Add ordering if specified in schema
    if (schema.propertyOrder) {
      uiSchema['ui:order'] = schema.propertyOrder;
    }

    return uiSchema;
  }

  /**
   * Generates UI schema for a specific field
   */
  private generateFieldUISchema(fieldName: string, fieldSchema: JsonSchemaObject): any {
    const uiField: any = {};

    // Set widget based on field type and format
    if (fieldSchema.type === 'string') {
      if (fieldSchema.format === 'password') {
        uiField['ui:widget'] = 'password';
      } else if (fieldSchema.format === 'email') {
        uiField['ui:widget'] = 'email';
      } else if (fieldSchema.format === 'uri') {
        uiField['ui:widget'] = 'uri';
      } else if (fieldSchema.format === 'date-time') {
        uiField['ui:widget'] = 'datetime';
      } else if (fieldSchema.enum) {
        uiField['ui:widget'] = 'select';
      } else if (fieldSchema.maxLength && fieldSchema.maxLength > 100) {
        uiField['ui:widget'] = 'textarea';
        uiField['ui:options'] = { rows: 4 };
      }
    } else if (fieldSchema.type === 'number' || fieldSchema.type === 'integer') {
      uiField['ui:widget'] = 'updown';
    } else if (fieldSchema.type === 'boolean') {
      uiField['ui:widget'] = 'checkbox';
    } else if (fieldSchema.type === 'array') {
      uiField['ui:options'] = {
        orderable: true,
        addable: true,
        removable: true
      };
    } else if (fieldSchema.type === 'object') {
      uiField['ui:options'] = {
        label: true
      };
    }

    // Add description and help text
    if (fieldSchema.description) {
      uiField['ui:description'] = fieldSchema.description;
    }

    if (fieldSchema.title) {
      uiField['ui:title'] = fieldSchema.title;
    }

    // Add placeholder for string fields
    if (fieldSchema.type === 'string' && fieldSchema.examples && fieldSchema.examples.length > 0) {
      uiField['ui:placeholder'] = fieldSchema.examples[0];
    }

    return uiField;
  }

  /**
   * Normalizes a JSON schema to ensure compatibility
   */
  private normalizeJsonSchema(schema: JsonSchemaObject): JsonSchemaObject {
    const normalized = { ...schema };

    // Ensure type is specified
    if (!normalized.type) {
      normalized.type = 'object';
    }

    // Ensure properties exist for object types
    if (normalized.type === 'object' && !normalized.properties) {
      normalized.properties = {};
    }

    // Normalize nested schemas
    if (normalized.properties) {
      for (const [key, value] of Object.entries(normalized.properties)) {
        normalized.properties[key] = this.normalizeJsonSchema(value as JsonSchemaObject);
      }
    }

    return normalized;
  }

  /**
   * Extracts default values from a JSON schema
   */
  private extractDefaultValues(schema: JsonSchemaObject): any {
    const defaults: any = {};

    if (schema.properties) {
      for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
        const fieldSchemaObj = fieldSchema as JsonSchemaObject;
        
        if (fieldSchemaObj.default !== undefined) {
          defaults[fieldName] = fieldSchemaObj.default;
        } else if (fieldSchemaObj.type === 'object') {
          const nestedDefaults = this.extractDefaultValues(fieldSchemaObj);
          if (Object.keys(nestedDefaults).length > 0) {
            defaults[fieldName] = nestedDefaults;
          }
        } else if (fieldSchemaObj.type === 'array' && fieldSchemaObj.items) {
          // Don't set default arrays, let the form handle empty arrays
        }
      }
    }

    return defaults;
  }

  /**
   * Validates a single field against its schema
   */
  private validateField(
    fieldName: string,
    value: any,
    schema: JsonSchemaObject,
    options: { validateTypes: boolean; validateConstraints: boolean }
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Type validation
    if (options.validateTypes && schema.type) {
      const actualType = this.getActualType(value);
      const expectedType = schema.type;

      if (!this.isTypeCompatible(actualType, expectedType)) {
        errors.push({
          fieldPath: fieldName,
          message: `Expected type '${expectedType}' but got '${actualType}'`,
          expectedType,
          actualValue: value,
          schemaRule: 'type'
        });
      }
    }

    // Constraint validation
    if (options.validateConstraints) {
      // String constraints
      if (schema.type === 'string' && typeof value === 'string') {
        if (schema.minLength && value.length < schema.minLength) {
          errors.push({
            fieldPath: fieldName,
            message: `String must be at least ${schema.minLength} characters long`,
            actualValue: value,
            schemaRule: 'minLength'
          });
        }
        
        if (schema.maxLength && value.length > schema.maxLength) {
          errors.push({
            fieldPath: fieldName,
            message: `String must be no more than ${schema.maxLength} characters long`,
            actualValue: value,
            schemaRule: 'maxLength'
          });
        }

        if (schema.pattern) {
          const regex = new RegExp(schema.pattern);
          if (!regex.test(value)) {
            errors.push({
              fieldPath: fieldName,
              message: `String does not match required pattern: ${schema.pattern}`,
              actualValue: value,
              schemaRule: 'pattern'
            });
          }
        }

        if (schema.enum && !schema.enum.includes(value)) {
          errors.push({
            fieldPath: fieldName,
            message: `Value must be one of: ${schema.enum.join(', ')}`,
            actualValue: value,
            schemaRule: 'enum'
          });
        }
      }

      // Number constraints
      if ((schema.type === 'number' || schema.type === 'integer') && typeof value === 'number') {
        if (schema.minimum !== undefined && value < schema.minimum) {
          errors.push({
            fieldPath: fieldName,
            message: `Value must be at least ${schema.minimum}`,
            actualValue: value,
            schemaRule: 'minimum'
          });
        }

        if (schema.maximum !== undefined && value > schema.maximum) {
          errors.push({
            fieldPath: fieldName,
            message: `Value must be no more than ${schema.maximum}`,
            actualValue: value,
            schemaRule: 'maximum'
          });
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Gets the actual JavaScript type of a value
   */
  private getActualType(value: any): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  /**
   * Checks if an actual type is compatible with an expected JSON Schema type
   */
  private isTypeCompatible(actualType: string, expectedType: string): boolean {
    if (actualType === expectedType) return true;
    
    // Special cases
    if (expectedType === 'integer' && actualType === 'number') {
      return true; // Numbers can be integers
    }
    
    if (expectedType === 'number' && actualType === 'integer') {
      return true; // Integers are numbers
    }

    return false;
  }

  /**
   * Gets the expected type for a field from schema
   */
  private getFieldType(schema: JsonSchemaObject, fieldName: string): string | undefined {
    if (schema.properties && schema.properties[fieldName]) {
      const fieldSchema = schema.properties[fieldName] as JsonSchemaObject;
      return fieldSchema.type;
    }
    return undefined;
  }

  /**
   * Coerces data types based on schema expectations
   */
  private coerceDataTypes(data: any, schema: JsonSchemaObject): any {
    if (!schema.properties) return data;

    const coerced = { ...data };

    for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
      const fieldSchemaObj = fieldSchema as JsonSchemaObject;
      const value = coerced[fieldName];

      if (value !== undefined && value !== null) {
        coerced[fieldName] = this.coerceValue(value, fieldSchemaObj);
      }
    }

    return coerced;
  }

  /**
   * Coerces a single value to match schema type
   */
  private coerceValue(value: any, schema: JsonSchemaObject): any {
    if (schema.type === 'string' && typeof value !== 'string') {
      return String(value);
    }
    
    if (schema.type === 'number' && typeof value !== 'number') {
      const num = Number(value);
      return isNaN(num) ? value : num;
    }
    
    if (schema.type === 'integer' && typeof value !== 'number') {
      const num = parseInt(String(value), 10);
      return isNaN(num) ? value : num;
    }
    
    if (schema.type === 'boolean' && typeof value !== 'boolean') {
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return Boolean(value);
    }

    return value;
  }
} 