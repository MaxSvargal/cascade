// Jotai Atoms for Module Registry State
// Generated from cfv_internal_code.ModuleRegistryService_SharedAtoms

import { atom } from 'jotai';
import { DslModuleRepresentation, ComponentSchema } from '@/models/cfv_models_generated';

// Stores all loaded DslModuleRepresentations, keyed by FQN.
export const dslModuleRepresentationsAtom = atom<Record<string, DslModuleRepresentation>>({});

// Stores all pre-loaded component schemas, keyed by component FQN.
export const componentSchemasAtom = atom<Record<string, ComponentSchema>>({});

// Tracks FQNs of modules currently being loaded to prevent duplicate requests.
export const activeModuleLoadRequestsAtom = atom<Record<string, boolean>>({});

// Derived atom for all loaded module FQNs
export const loadedModuleFqnsAtom = atom((get) => {
  const modules = get(dslModuleRepresentationsAtom);
  return Object.keys(modules).filter(fqn => modules[fqn].status === 'loaded');
});

// Derived atom for modules with errors
export const modulesWithErrorsAtom = atom((get) => {
  const modules = get(dslModuleRepresentationsAtom);
  return Object.entries(modules)
    .filter(([_, module]) => module.status === 'error' || (module.errors && module.errors.length > 0))
    .map(([fqn, module]) => ({ fqn, module }));
});

// Derived atom for loading status
export const moduleLoadingStatusAtom = atom((get) => {
  const activeRequests = get(activeModuleLoadRequestsAtom);
  const loadingCount = Object.values(activeRequests).filter(Boolean).length;
  return {
    isLoading: loadingCount > 0,
    loadingCount,
    loadingModules: Object.keys(activeRequests).filter(fqn => activeRequests[fqn])
  };
}); 