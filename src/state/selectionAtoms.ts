// Jotai Atoms for Selection State
// Generated from cfv_designs.SelectionService

import { atom } from 'jotai';
import { SelectedElement } from '@/models/cfv_models_generated';

// Currently selected element in the UI (graph node/edge, list item)
export const selectedElementAtom = atom<SelectedElement | null>(null);

// Derived atom for selected element type
export const selectedElementTypeAtom = atom((get) => {
  const selectedElement = get(selectedElementAtom);
  return selectedElement?.sourceType || null;
});

// Derived atom for selected element module FQN
export const selectedElementModuleFqnAtom = atom((get) => {
  const selectedElement = get(selectedElementAtom);
  return selectedElement?.moduleFqn || null;
});

// Derived atom for selected element flow FQN
export const selectedElementFlowFqnAtom = atom((get) => {
  const selectedElement = get(selectedElementAtom);
  return selectedElement?.flowFqn || null;
});

// Derived atom for whether an element is selected
export const hasSelectedElementAtom = atom((get) => {
  const selectedElement = get(selectedElementAtom);
  return selectedElement !== null;
}); 