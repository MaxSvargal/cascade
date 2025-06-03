// YAML Reconstruction Service
// Rebuilds YAML content from DSL module representations

import { stringify as yamlStringify, parse as yamlParse } from 'yaml';
import { 
  DslModuleRepresentation, 
  SaveModulePayload,
  DslModuleErrorItem 
} from '@/models/cfv_models_generated';

export interface ReconstructionOptions {
  preserveComments?: boolean;
  indentSize?: number;
  lineWidth?: number;
  sortKeys?: boolean;
}

export interface ReconstructionResult {
  success: boolean;
  content?: string;
  errors?: DslModuleErrorItem[];
}

/**
 * Reconstructs YAML content from a DSL module representation
 * Applies configuration changes and maintains structure where possible
 */
export function reconstructModuleYaml(
  moduleRep: DslModuleRepresentation,
  options: ReconstructionOptions = {}
): string {
  const {
    indentSize = 2,
    lineWidth = 120,
    sortKeys = false
  } = options;

  try {
    // Use the parsed content if available, otherwise parse raw content
    let contentToStringify = moduleRep.parsedContent;
    
    if (!contentToStringify && moduleRep.rawContent) {
      contentToStringify = yamlParse(moduleRep.rawContent);
    }
    
    if (!contentToStringify) {
      throw new Error('No content available for reconstruction');
    }

    // Apply YAML stringification with options
    const yamlOptions = {
      indent: indentSize,
      lineWidth,
      sortMapEntries: sortKeys,
      // Preserve null values and empty objects/arrays
      nullStr: 'null',
      // Use block style for better readability
      defaultType: 'BLOCK_LITERAL',
      // Keep quotes minimal
      quotingType: '"',
      minContentWidth: 20
    };

    return yamlStringify(contentToStringify, yamlOptions);
  } catch (error) {
    console.error('Failed to reconstruct YAML:', error);
    // Fallback to raw content if reconstruction fails
    return moduleRep.rawContent || '';
  }
}

/**
 * Creates a save payload from a module representation
 */
export function createSavePayload(
  moduleRep: DslModuleRepresentation,
  options: ReconstructionOptions = {}
): SaveModulePayload {
  const newContent = reconstructModuleYaml(moduleRep, options);
  
  return {
    fqn: moduleRep.fqn,
    newContent
  };
}

/**
 * Applies configuration changes to a module representation
 * Returns a new module representation with the changes applied
 */
export function applyConfigChanges(
  moduleRep: DslModuleRepresentation,
  pathToConfig: (string | number)[],
  newConfigValue: any
): DslModuleRepresentation {
  try {
    // Deep clone the module representation
    const updatedModule = JSON.parse(JSON.stringify(moduleRep));
    
    // Apply changes to parsed content
    if (updatedModule.parsedContent) {
      setNestedValue(updatedModule.parsedContent, pathToConfig, newConfigValue);
    } else if (updatedModule.rawContent) {
      // Parse raw content, apply changes, then update
      const parsed = yamlParse(updatedModule.rawContent);
      setNestedValue(parsed, pathToConfig, newConfigValue);
      updatedModule.parsedContent = parsed;
    }
    
    // Update raw content with reconstructed YAML
    updatedModule.rawContent = reconstructModuleYaml(updatedModule);
    
    return updatedModule;
  } catch (error) {
    console.error('Failed to apply config changes:', error);
    
    // Return original module with error
    return {
      ...moduleRep,
      errors: [
        ...(moduleRep.errors || []),
        {
          message: `Failed to apply configuration changes: ${error instanceof Error ? error.message : 'Unknown error'}`,
          path: pathToConfig,
          severity: 'error'
        }
      ]
    };
  }
}

/**
 * Validates reconstructed YAML against original module structure
 */
export function validateReconstructedYaml(
  original: DslModuleRepresentation,
  reconstructed: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    // Parse the reconstructed YAML
    const parsed = yamlParse(reconstructed);
    
    // Basic structure validation
    if (!parsed) {
      errors.push('Reconstructed YAML is empty or invalid');
      return { isValid: false, errors };
    }
    
    // Check for required top-level fields
    const requiredFields = ['dsl_version', 'namespace'];
    for (const field of requiredFields) {
      if (!(field in parsed)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
    
    // Validate namespace matches original
    if (original.parsedContent?.namespace && parsed.namespace !== original.parsedContent.namespace) {
      errors.push(`Namespace mismatch: expected ${original.parsedContent.namespace}, got ${parsed.namespace}`);
    }
    
    // Check for structural consistency
    const originalParsed = original.parsedContent || yamlParse(original.rawContent);
    if (originalParsed) {
      // Validate that major sections are preserved
      const sections = ['imports', 'definitions', 'flows', 'components'];
      for (const section of sections) {
        if (originalParsed[section] && !parsed[section]) {
          errors.push(`Missing section: ${section}`);
        }
      }
    }
    
    return { isValid: errors.length === 0, errors };
  } catch (error) {
    errors.push(`YAML parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { isValid: false, errors };
  }
}

/**
 * Creates a save payload with configuration change context
 */
export function createSavePayloadWithChanges(
  moduleRep: DslModuleRepresentation,
  pathToConfig: (string | number)[],
  oldConfigValue: any,
  newConfigValue: any,
  options: ReconstructionOptions = {}
): SaveModulePayload {
  const updatedModule = applyConfigChanges(moduleRep, pathToConfig, newConfigValue);
  const newContent = reconstructModuleYaml(updatedModule, options);
  
  return {
    fqn: moduleRep.fqn,
    newContent,
    pathToConfig,
    oldConfigValue,
    newConfigValue
  };
}

/**
 * Helper function to set nested values in an object using a path array
 */
function setNestedValue(obj: any, path: (string | number)[], value: any): void {
  if (path.length === 0) return;
  
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = typeof path[i + 1] === 'number' ? [] : {};
    }
    current = current[key];
  }
  
  current[path[path.length - 1]] = value;
}

/**
 * Helper function to get nested values from an object using a path array
 */
function getNestedValue(obj: any, path: (string | number)[]): any {
  let current = obj;
  for (const key of path) {
    if (current == null || !(key in current)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

/**
 * Validates that a configuration path exists in the module structure
 */
export function validateConfigPath(
  moduleRep: DslModuleRepresentation,
  pathToConfig: (string | number)[]
): { isValid: boolean; error?: string } {
  try {
    const content = moduleRep.parsedContent || yamlParse(moduleRep.rawContent);
    if (!content) {
      return { isValid: false, error: 'No parsed content available' };
    }
    
    // Check if path exists (allowing undefined values)
    let current = content;
    for (let i = 0; i < pathToConfig.length - 1; i++) {
      const key = pathToConfig[i];
      if (current == null || !(key in current)) {
        return { isValid: false, error: `Path does not exist at: ${pathToConfig.slice(0, i + 1).join('.')}` };
      }
      current = current[key];
    }
    
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: `Path validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
} 