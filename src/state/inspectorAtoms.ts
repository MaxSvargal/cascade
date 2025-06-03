// Jotai Atoms for Inspector State
// Generated from cfv_designs.InspectorStateService

import { atom } from 'jotai';
import { selectedElementAtom } from './selectionAtoms';
import { currentFlowFqnAtom } from './navigationAtoms';
import { dslModuleRepresentationsAtom } from './moduleRegistryAtoms';

// Active inspector tab
export const activeInspectorTabAtom = atom<'source' | 'properties' | 'debugtest'>('source');

// Derived atom for inspector source tab props
export const inspectorSourceTabPropsAtom = atom((get) => {
  const selectedElement = get(selectedElementAtom);
  const currentFlowFqn = get(currentFlowFqnAtom);
  const dslModuleRepresentations = get(dslModuleRepresentationsAtom);
  
  return {
    selectedElement,
    currentFlowFqn,
    moduleRegistry: null // Will be provided by component
  };
});

// Derived atom for inspector properties tab props
export const inspectorPropertiesTabPropsAtom = atom((get) => {
  const selectedElement = get(selectedElementAtom);
  
  return {
    selectedElement,
    actions: null, // Will be provided by component
    moduleRegistry: null // Will be provided by component
  };
});

// Derived atom for inspector debug test tab props
export const inspectorDebugTestTabPropsAtom = atom((get) => {
  const selectedElement = get(selectedElementAtom);
  const currentFlowFqn = get(currentFlowFqnAtom);
  
  return {
    currentFlowFqn: currentFlowFqn || '',
    selectedElement,
    actions: null, // Will be provided by component
    moduleRegistry: null // Will be provided by component
  };
});

// Derived atom for whether inspector should be visible
export const inspectorVisibleAtom = atom((get) => {
  const selectedElement = get(selectedElementAtom);
  return selectedElement !== null;
}); 