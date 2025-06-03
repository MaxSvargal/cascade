// YAML Reconstruction Service
// Rebuilds YAML content from DSL module representations

import { stringify as yamlStringify } from 'yaml';
import { DslModuleRepresentation, SaveModulePayload } from '@/models/cfv_models_generated';

export interface ReconstructionOptions {
  preserveComments?: boolean;
  indentSize?: number;
  lineWidth?: number;
}

/**
 * Reconstruct YAML content from a DSL module representation
 */
export function reconstructModuleYaml(
  moduleRep: DslModuleRepresentation,
  options: ReconstructionOptions = {}
): string {
  const {
    preserveComments = false,
    indentSize = 2,
    lineWidth = 80
  } = options;

  if (!moduleRep.parsedContent) {
    throw new Error('Module has no parsed content to reconstruct from');
  }

  // If we have the original raw content and no modifications, return it
  if (!moduleRep.definitions && moduleRep.rawContent) {
    return moduleRep.rawContent;
  }

  // Build the YAML structure
  const yamlStructure: any = {
    dsl_version: (moduleRep.parsedContent as any).dsl_version || '1.1',
    namespace: (moduleRep.parsedContent as any).namespace || moduleRep.fqn
  };

  // Add imports if present
  if (moduleRep.imports && moduleRep.imports.length > 0) {
    yamlStructure.imports = moduleRep.imports.map(imp => {
      const importObj: any = { fqn: imp.namespace };
      if (imp.as) importObj.alias = imp.as;
      if (imp.version) importObj.version = imp.version;
      return importObj;
    });
  }

  // Add definitions if present
  if (moduleRep.definitions) {
    yamlStructure.definitions = {};
    
    if (moduleRep.definitions.context && moduleRep.definitions.context.length > 0) {
      yamlStructure.definitions.context = moduleRep.definitions.context;
    }
    
    if (moduleRep.definitions.components && moduleRep.definitions.components.length > 0) {
      yamlStructure.definitions.components = moduleRep.definitions.components;
    }
  }

  // Add flows if present
  if (moduleRep.definitions?.flows && moduleRep.definitions.flows.length > 0) {
    yamlStructure.flows = moduleRep.definitions.flows;
  }

  // Convert to YAML string
  try {
    return yamlStringify(yamlStructure, {
      indent: indentSize,
      lineWidth: lineWidth,
      minContentWidth: 20,
      doubleQuotedAsJSON: false,
      doubleQuotedMinMultiLineLength: 40,
      singleQuote: false
    });
  } catch (error) {
    throw new Error(`Failed to reconstruct YAML: ${(error as Error).message}`);
  }
}

/**
 * Create a save payload from a module representation
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
 * Apply configuration changes to a module representation
 */
export function applyConfigChanges(
  moduleRep: DslModuleRepresentation,
  pathToConfig: (string | number)[],
  newConfigValue: any
): DslModuleRepresentation {
  // Deep clone the module representation
  const updatedRep = JSON.parse(JSON.stringify(moduleRep));
  
  // Navigate to the target path and update the value
  let current = updatedRep.parsedContent;
  
  for (let i = 0; i < pathToConfig.length - 1; i++) {
    const key = pathToConfig[i];
    if (current[key] === undefined) {
      current[key] = {};
    }
    current = current[key];
  }
  
  const finalKey = pathToConfig[pathToConfig.length - 1];
  current[finalKey] = newConfigValue;
  
  // Also update the definitions if applicable
  if (updatedRep.definitions) {
    let defCurrent = updatedRep.definitions;
    for (let i = 0; i < pathToConfig.length - 1; i++) {
      const key = pathToConfig[i];
      if (defCurrent[key] !== undefined) {
        defCurrent = defCurrent[key];
      }
    }
    if (defCurrent[finalKey] !== undefined) {
      defCurrent[finalKey] = newConfigValue;
    }
  }
  
  return updatedRep;
}

/**
 * Validate a reconstructed YAML against the original
 */
export function validateReconstructedYaml(
  original: DslModuleRepresentation,
  reconstructed: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    // Parse the reconstructed YAML
    const { parse } = require('yaml');
    const parsed = parse(reconstructed);
    
    // Basic validation checks
    if (!parsed.dsl_version) {
      errors.push('Missing dsl_version');
    }
    
    if (!parsed.namespace) {
      errors.push('Missing namespace');
    }
    
    // Check if flows are preserved
    if (original.definitions?.flows && !parsed.flows) {
      errors.push('Flows were lost during reconstruction');
    }
    
    // Check if definitions are preserved
    if (original.definitions?.components && !parsed.definitions?.components) {
      errors.push('Component definitions were lost during reconstruction');
    }
    
  } catch (error) {
    errors.push(`YAML parsing failed: ${(error as Error).message}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
} 