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