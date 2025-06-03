// Module Registry Service Logic
// Generated from cfv_internal_code specifications

import { parse as yamlParse } from 'yaml';
import { 
  DslModuleRepresentation, 
  RequestModuleResult, 
  DslModuleInput,
  ResolvedComponentInfo,
  ComponentSchema,
  IModuleRegistry,
  CascadeFlowVisualizerProps
} from '@/models/cfv_models_generated';

// Type for Jotai get/set functions
type JotaiGetFunction = (atom: any) => any;
type JotaiSetFunction = (atom: any, value: any) => void;

/**
 * Handle Asynchronous Module Request and Processing
 * From cfv_internal_code.ModuleRegistryService_RequestAndProcessModule
 */
export async function requestAndProcessModule(
  fqn: string,
  props: {
    requestModule: CascadeFlowVisualizerProps['requestModule'];
    onModuleLoadError?: CascadeFlowVisualizerProps['onModuleLoadError'];
  },
  getAtoms: JotaiGetFunction,
  setAtoms: JotaiSetFunction
): Promise<DslModuleRepresentation | null> {
  
  // 1. Check if already loading or loaded
  const activeLoads = getAtoms('activeModuleLoadRequestsAtom');
  if (activeLoads[fqn] === true) {
    console.log(`Module ${fqn} is already being loaded.`);
    return null;
  }

  const loadedModules = getAtoms('dslModuleRepresentationsAtom');
  if (loadedModules[fqn] && loadedModules[fqn].status !== 'error') {
    return loadedModules[fqn];
  }

  // 2. Mark as loading
  setAtoms('activeModuleLoadRequestsAtom', (prev: Record<string, boolean>) => ({ ...prev, [fqn]: true }));

  // 3. Request module content
  let requestedModuleData: RequestModuleResult | null;
  try {
    requestedModuleData = await props.requestModule(fqn);
  } catch (e: any) {
    console.log(`props.requestModule failed for ${fqn}: ${e.message}`);
    if (props.onModuleLoadError) {
      props.onModuleLoadError(fqn, e);
    }
    
    // Update DslModuleRepresentationsAtom with error status
    const errorRep: DslModuleRepresentation = {
      fqn: fqn,
      rawContent: "",
      status: 'error',
      errors: [{ message: e.message }]
    };
    setAtoms('dslModuleRepresentationsAtom', (prev: Record<string, DslModuleRepresentation>) => ({ ...prev, [fqn]: errorRep }));
    setAtoms('activeModuleLoadRequestsAtom', (prev: Record<string, boolean>) => ({ ...prev, [fqn]: false }));
    return null;
  }

  if (requestedModuleData === null) {
    console.log(`Module ${fqn} not found or props.requestModule returned null.`);
    if (props.onModuleLoadError) {
      props.onModuleLoadError(fqn, new Error("Module not found by host."));
    }
    
    const notFoundRep: DslModuleRepresentation = {
      fqn: fqn,
      rawContent: "",
      status: 'error',
      errors: [{ message: "Module not found by host." }]
    };
    setAtoms('dslModuleRepresentationsAtom', (prev: Record<string, DslModuleRepresentation>) => ({ ...prev, [fqn]: notFoundRep }));
    setAtoms('activeModuleLoadRequestsAtom', (prev: Record<string, boolean>) => ({ ...prev, [fqn]: false }));
    return null;
  }

  // 4. Process the loaded module content
  const finalModuleRep = processSingleModuleInput(requestedModuleData, false, getAtoms, setAtoms, props);

  // 5. Unmark as loading
  setAtoms('activeModuleLoadRequestsAtom', (prev: Record<string, boolean>) => ({ ...prev, [fqn]: false }));

  return finalModuleRep;
}

/**
 * Process a single module input (parsing, extracting definitions)
 * Referenced from cfv_internal_code.ModuleRegistryService_RequestAndProcessModule
 */
export function processSingleModuleInput(
  moduleInput: RequestModuleResult | DslModuleInput,
  isInitialLoad: boolean,
  getAtoms: JotaiGetFunction,
  setAtoms: JotaiSetFunction,
  props?: {
    requestModule?: CascadeFlowVisualizerProps['requestModule'];
    onModuleLoadError?: CascadeFlowVisualizerProps['onModuleLoadError'];
  }
): DslModuleRepresentation | null {
  
  try {
    // Parse YAML content
    const parsedContent = yamlParse(moduleInput.content);
    
    // Debug logging
    console.log('🔍 Debug: Parsed content for', moduleInput.fqn, ':', {
      hasDefinitions: !!parsedContent?.definitions,
      hasFlowsInDefinitions: !!parsedContent?.definitions?.flows,
      hasFlowsAtRoot: !!parsedContent?.flows,
      flowsInDefinitions: parsedContent?.definitions?.flows?.length || 0,
      flowsAtRoot: parsedContent?.flows?.length || 0
    });
    
    // Extract definitions (simplified for now)
    const definitions = {
      context: parsedContent?.definitions?.context || [],
      components: parsedContent?.definitions?.components || [],
      flows: parsedContent?.definitions?.flows || parsedContent?.flows || []
    };

    console.log('🔍 Debug: Extracted definitions for', moduleInput.fqn, ':', {
      contextCount: definitions.context.length,
      componentsCount: definitions.components.length,
      flowsCount: definitions.flows.length
    });

    // Extract imports
    const imports = parsedContent?.imports || [];

    const moduleRep: DslModuleRepresentation = {
      fqn: moduleInput.fqn,
      rawContent: moduleInput.content,
      parsedContent,
      definitions,
      imports,
      errors: [],
      status: 'loaded'
    };

    // Update the atom
    setAtoms('dslModuleRepresentationsAtom', (prev: Record<string, DslModuleRepresentation>) => ({ 
      ...prev, 
      [moduleInput.fqn]: moduleRep 
    }));

    return moduleRep;
  } catch (error: any) {
    const errorRep: DslModuleRepresentation = {
      fqn: moduleInput.fqn,
      rawContent: moduleInput.content,
      status: 'error',
      errors: [{ message: `YAML parsing failed: ${error.message}` }]
    };

    setAtoms('dslModuleRepresentationsAtom', (prev: Record<string, DslModuleRepresentation>) => ({ 
      ...prev, 
      [moduleInput.fqn]: errorRep 
    }));

    return null;
  }
}

/**
 * Create Module Registry Interface Implementation
 * Implements cfv_models.IModuleRegistry
 */
export function createModuleRegistryInterface(
  getAtoms: JotaiGetFunction
): IModuleRegistry {
  return {
    getLoadedModule: (fqn: string) => {
      const modules = getAtoms('dslModuleRepresentationsAtom');
      return modules[fqn] || null;
    },

    getAllLoadedModules: () => {
      const modules = getAtoms('dslModuleRepresentationsAtom');
      return Object.values(modules);
    },

    resolveComponentTypeInfo: (componentRef: string, currentModuleFqn: string) => {
      // Simplified implementation - would need full resolution logic
      const modules = getAtoms('dslModuleRepresentationsAtom');
      const currentModule = modules[currentModuleFqn];
      
      if (!currentModule?.definitions) {
        return null;
      }

      // Look for named component in current module first
      const namedComponent = currentModule.definitions.components.find(
        (comp: any) => comp.name === componentRef
      );

      if (namedComponent) {
        return {
          baseType: namedComponent.type || componentRef,
          componentDefinition: namedComponent,
          sourceModuleFqn: currentModuleFqn,
          isNamedComponent: true
        };
      }

      // If not found, treat as direct component type reference
      return {
        baseType: componentRef,
        componentDefinition: null,
        sourceModuleFqn: currentModuleFqn,
        isNamedComponent: false
      };
    },

    getComponentSchema: (componentTypeFqn: string) => {
      const schemas = getAtoms('componentSchemasAtom');
      return schemas[componentTypeFqn] || null;
    },

    getFlowDefinition: (flowFqn: string) => {
      // Parse flowFqn like "com.casino.core.UserOnboardingFlow"
      // Module FQN is "com.casino.core", flow name is "UserOnboardingFlow"
      const parts = flowFqn.split('.');
      const flowName = parts[parts.length - 1];
      const moduleFqn = parts.slice(0, -1).join('.');
      
      const modules = getAtoms('dslModuleRepresentationsAtom');
      const module = modules[moduleFqn];
      
      if (!module?.definitions?.flows) {
        console.log('🔍 Debug: No flows found in module:', moduleFqn);
        return null;
      }
      
      const flow = module.definitions.flows.find((f: any) => f.name === flowName);
      
      return flow || null;
    },

    getNamedComponentDefinition: (componentFqn: string) => {
      // Parse componentFqn like "com.casino.core.MyComponent"
      // Module FQN is "com.casino.core", component name is "MyComponent"
      const parts = componentFqn.split('.');
      const componentName = parts[parts.length - 1];
      const moduleFqn = parts.slice(0, -1).join('.');
      
      const modules = getAtoms('dslModuleRepresentationsAtom');
      const module = modules[moduleFqn];
      if (!module?.definitions?.components) return null;
      return module.definitions.components.find((c: any) => c.name === componentName) || null;
    },

    getContextDefinition: (contextFqn: string) => {
      const modules = getAtoms('dslModuleRepresentationsAtom');
      
      // Parse FQN to get module and context name
      const parts = contextFqn.split('.');
      const contextName = parts[parts.length - 1];
      const moduleFqn = parts.slice(0, -1).join('.');
      
      const module = modules[moduleFqn];
      if (!module?.definitions?.context) {
        return null;
      }

      return module.definitions.context.find((ctx: any) => ctx.name === contextName) || null;
    },

    // New methods required by interface
    getFlowDefinitionDsl: (flowFqn: string) => {
      // Parse flowFqn like "com.casino.core.UserOnboardingFlow"
      // Module FQN is "com.casino.core", flow name is "UserOnboardingFlow"
      const parts = flowFqn.split('.');
      const flowName = parts[parts.length - 1];
      const moduleFqn = parts.slice(0, -1).join('.');
      
      const modules = getAtoms('dslModuleRepresentationsAtom');
      const module = modules[moduleFqn];
      if (!module?.definitions?.flows) return null;
      return module.definitions.flows.find((f: any) => f.name === flowName) || null;
    },

    getNamedComponentDefinitionDsl: (namedComponentFqn: string) => {
      // Parse namedComponentFqn like "com.casino.core.MyComponent"
      // Module FQN is "com.casino.core", component name is "MyComponent"
      const parts = namedComponentFqn.split('.');
      const componentName = parts[parts.length - 1];
      const moduleFqn = parts.slice(0, -1).join('.');
      
      const modules = getAtoms('dslModuleRepresentationsAtom');
      const module = modules[moduleFqn];
      if (!module?.definitions?.components) return null;
      return module.definitions.components.find((c: any) => c.name === componentName) || null;
    }
  };
} 