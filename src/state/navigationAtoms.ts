// Jotai Atoms for Navigation State
// Generated from cfv_designs.NavigationStateService

import { atom } from 'jotai';
import { VisualizerModeEnum, SelectedElement } from '@/models/cfv_models_generated';

// Current flow FQN being viewed
export const currentFlowFqnAtom = atom<string | null>(null);

// Whether system overview is active
export const systemViewActiveAtom = atom<boolean>(false);

// Currently selected element in the UI
export const selectedElementAtom = atom<SelectedElement | null>(null); 