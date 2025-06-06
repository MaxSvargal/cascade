// Jotai Atoms for Module Registry State
// Generated from cfv_designs.ModuleRegistryService

import { atom } from 'jotai';
import { 
  DslModuleRepresentation, 
  ComponentSchema,
  DslModuleInput,
  RequestModuleResult,
  DslModuleStatusEnum,
  DslModuleErrorItem
} from '@/models/cfv_models_generated';

// Core module registry state
export const dslModuleRepresentationsAtom = atom<Record<string, DslModuleRepresentation>>({});

export const componentSchemasAtom = atom<Record<string, ComponentSchema>>({});

// Loading states for modules
export const moduleLoadingStatesAtom = atom<Record<string, boolean>>({});

// Error states for modules
export const moduleErrorStatesAtom = atom<Record<string, DslModuleErrorItem[]>>({});

// Derived atom for all loaded module FQNs
export const loadedModuleFqnsAtom = atom((get) => {
  const modules = get(dslModuleRepresentationsAtom);
  return Object.keys(modules).filter(fqn => 
    modules[fqn].status === 'loaded' || modules[fqn].status === 'partially_loaded'
  );
});

// Derived atom for modules with errors
export const modulesWithErrorsAtom = atom((get) => {
  const modules = get(dslModuleRepresentationsAtom);
  return Object.entries(modules)
    .filter(([_, module]) => module.status === 'error' && module.errors && module.errors.length > 0)
    .map(([fqn, module]) => ({ fqn, module }));
});

// Derived atom for loading status
export const moduleRegistryLoadingAtom = atom((get) => {
  const loadingStates = get(moduleLoadingStatesAtom);
  return Object.values(loadingStates).some(loading => loading);
});

// Action atom for setting module representation
export const setModuleRepresentationAtom = atom(
  null,
  (get, set, fqn: string, moduleRep: DslModuleRepresentation) => {
    const current = get(dslModuleRepresentationsAtom);
    set(dslModuleRepresentationsAtom, {
      ...current,
      [fqn]: moduleRep
    });
    
    // Clear loading state
    const loadingStates = get(moduleLoadingStatesAtom);
    set(moduleLoadingStatesAtom, {
      ...loadingStates,
      [fqn]: false
    });
  }
);

// Action atom for setting loading state
export const setModuleLoadingAtom = atom(
  null,
  (get, set, fqn: string, loading: boolean) => {
    const current = get(moduleLoadingStatesAtom);
    set(moduleLoadingStatesAtom, {
      ...current,
      [fqn]: loading
    });
  }
);

// Action atom for setting module error
export const setModuleErrorAtom = atom(
  null,
  (get, set, fqn: string, errors: DslModuleErrorItem[]) => {
    const currentErrors = get(moduleErrorStatesAtom);
    set(moduleErrorStatesAtom, {
      ...currentErrors,
      [fqn]: errors
    });
    
    // Update module representation with error status
    const currentModules = get(dslModuleRepresentationsAtom);
    const existingModule = currentModules[fqn];
    if (existingModule) {
      set(dslModuleRepresentationsAtom, {
        ...currentModules,
        [fqn]: {
          ...existingModule,
          status: 'error' as DslModuleStatusEnum,
          errors
        }
      });
    }
    
    // Clear loading state
    set(setModuleLoadingAtom, fqn, false);
  }
);

// Action atom for setting component schemas
export const setComponentSchemasAtom = atom(
  null,
  (get, set, schemas: Record<string, ComponentSchema>) => {
    const current = get(componentSchemasAtom);
    set(componentSchemasAtom, {
      ...current,
      ...schemas
    });
  }
);

// Action atom for adding single component schema
export const addComponentSchemaAtom = atom(
  null,
  (get, set, fqn: string, schema: ComponentSchema) => {
    const current = get(componentSchemasAtom);
    set(componentSchemasAtom, {
      ...current,
      [fqn]: schema
    });
  }
);

// Action atom for clearing module registry
export const clearModuleRegistryAtom = atom(
  null,
  (get, set) => {
    set(dslModuleRepresentationsAtom, {});
    set(componentSchemasAtom, {});
    set(moduleLoadingStatesAtom, {});
    set(moduleErrorStatesAtom, {});
  }
);

// Action atom for removing module
export const removeModuleAtom = atom(
  null,
  (get, set, fqn: string) => {
    const currentModules = get(dslModuleRepresentationsAtom);
    const currentLoading = get(moduleLoadingStatesAtom);
    const currentErrors = get(moduleErrorStatesAtom);
    
    const { [fqn]: removedModule, ...remainingModules } = currentModules;
    const { [fqn]: removedLoading, ...remainingLoading } = currentLoading;
    const { [fqn]: removedErrors, ...remainingErrors } = currentErrors;
    
    set(dslModuleRepresentationsAtom, remainingModules);
    set(moduleLoadingStatesAtom, remainingLoading);
    set(moduleErrorStatesAtom, remainingErrors);
  }
);

// Derived atom for module statistics
export const moduleRegistryStatsAtom = atom((get) => {
  const modules = get(dslModuleRepresentationsAtom);
  const loading = get(moduleLoadingStatesAtom);
  
  const stats = {
    total: Object.keys(modules).length,
    loaded: 0,
    loading: Object.values(loading).filter(Boolean).length,
    error: 0,
    partiallyLoaded: 0
  };
  
  Object.values(modules).forEach(module => {
    switch (module.status) {
      case 'loaded':
        stats.loaded++;
        break;
      case 'error':
        stats.error++;
        break;
      case 'partially_loaded':
        stats.partiallyLoaded++;
        break;
    }
  });
  
  return stats;
});

// Derived atom for getting module by FQN
export const getModuleAtom = atom((get) => (fqn: string): DslModuleRepresentation | null => {
  const modules = get(dslModuleRepresentationsAtom);
  return modules[fqn] || null;
});

// Derived atom for getting component schema by FQN
export const getComponentSchemaAtom = atom((get) => (fqn: string): ComponentSchema | null => {
  const schemas = get(componentSchemasAtom);
  return schemas[fqn] || null;
});

// Derived atom for checking if module is loaded
export const isModuleLoadedAtom = atom((get) => (fqn: string): boolean => {
  const modules = get(dslModuleRepresentationsAtom);
  const module = modules[fqn];
  return module ? (module.status === 'loaded' || module.status === 'partially_loaded') : false;
});

// Derived atom for checking if module is loading
export const isModuleLoadingAtom = atom((get) => (fqn: string): boolean => {
  const loading = get(moduleLoadingStatesAtom);
  return loading[fqn] || false;
});

// Derived atom for getting module errors
export const getModuleErrorsAtom = atom((get) => (fqn: string): DslModuleErrorItem[] => {
  const errors = get(moduleErrorStatesAtom);
  return errors[fqn] || [];
}); 