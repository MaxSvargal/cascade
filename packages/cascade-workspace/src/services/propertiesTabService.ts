// Properties Tab Service
// Handles schema-driven form generation for configuration editing

import { 
  SelectedElement, 
  IModuleRegistry, 
  ComponentSchema,
  JsonSchemaObject,
  ValidationResult
} from '@/models/cfv_models_generated';

export interface PropertiesTabService {
  getComponentSchema(selectedElement: SelectedElement, moduleRegistry: IModuleRegistry): ComponentSchema | null;
  getCurrentConfig(selectedElement: SelectedElement): any;
  getConfigSchema(selectedElement: SelectedElement, moduleRegistry: IModuleRegistry): JsonSchemaObject | null;
  validateConfig(config: any, schema: JsonSchemaObject): ValidationResult;
  generateFormFields(schema: JsonSchemaObject): FormFieldMetadata[];
  getEditablePaths(selectedElement: SelectedElement, moduleRegistry: IModuleRegistry): string[];
  extractContextVariables(config: any): string[];
  mapSchemaTypeToFormType(schemaType: string): FormFieldMetadata['type'];
}

export interface FormFieldMetadata {
  path: string[];
  label: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'select';
  required: boolean;
  description?: string;
  defaultValue?: any;
  options?: { value: any; label: string }[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
  };
}

export const propertiesTabService: PropertiesTabService = {
  getComponentSchema(selectedElement, moduleRegistry) {
    if (selectedElement.data?.componentSchema) {
      return selectedElement.data.componentSchema;
    }
    const componentFqn = selectedElement.data?.resolvedComponentFqn;
    if (componentFqn) {
      return moduleRegistry.getComponentSchema(componentFqn);
    }
    return null;
  },

  getCurrentConfig(selectedElement) {
    if (selectedElement.data?.dslObject?.config) {
      return selectedElement.data.dslObject.config;
    }
    if (selectedElement.sourceType === 'namedComponentListItem') {
      return selectedElement.data?.dslObject;
    }
    return {};
  },

  getConfigSchema(selectedElement, moduleRegistry) {
    const componentSchema = this.getComponentSchema(selectedElement, moduleRegistry);
    return componentSchema?.configSchema || null;
  },

  validateConfig(config, schema) {
    try {
      const errors: any[] = [];
      if (schema.required && Array.isArray(schema.required)) {
        for (const requiredField of schema.required) {
          if (!(requiredField in config)) {
            errors.push({
              fieldPath: requiredField,
              message: `Required field '${requiredField}' is missing`,
              expectedType: 'any',
              actualValue: undefined,
              schemaRule: 'required'
            });
          }
        }
      }
      return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        processedData: config
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          fieldPath: '',
          message: `Validation error: ${error}`,
          expectedType: 'object',
          actualValue: config,
          schemaRule: 'validation'
        }]
      };
    }
  },

  generateFormFields(schema) {
    const fields: FormFieldMetadata[] = [];
    if (!schema.properties) return fields;
    for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
      const field = fieldSchema as any;
      fields.push({
        path: [fieldName],
        label: field.title || fieldName,
        type: this.mapSchemaTypeToFormType(field.type),
        required: schema.required?.includes(fieldName) || false,
        description: field.description,
        defaultValue: field.default,
        options: field.enum ? field.enum.map((value: any) => ({ value, label: String(value) })) : undefined,
        validation: {
          pattern: field.pattern,
          minLength: field.minLength,
          maxLength: field.maxLength,
          minimum: field.minimum,
          maximum: field.maximum
        }
      });
    }
    return fields;
  },

  getEditablePaths(selectedElement, moduleRegistry) {
    const schema = this.getConfigSchema(selectedElement, moduleRegistry);
    if (!schema || !schema.properties) return [];
    return Object.keys(schema.properties);
  },

  extractContextVariables(config) {
    const contextVars: string[] = [];
    const extractFromValue = (value: any): void => {
      if (typeof value === 'string') {
        const matches = value.match(/\{\{context\.([^}]+)\}\}/g);
        if (matches) {
          matches.forEach(match => {
            const varName = match.replace(/\{\{context\./, '').replace(/\}\}/, '');
            if (!contextVars.includes(varName)) {
              contextVars.push(varName);
            }
          });
        }
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(extractFromValue);
        } else {
          Object.values(value).forEach(extractFromValue);
        }
      }
    };
    extractFromValue(config);
    return contextVars;
  },

  mapSchemaTypeToFormType(schemaType: string): FormFieldMetadata['type'] {
    switch (schemaType) {
      case 'string': return 'string';
      case 'number':
      case 'integer': return 'number';
      case 'boolean': return 'boolean';
      case 'object': return 'object';
      case 'array': return 'array';
      default: return 'string';
    }
  }
}; 