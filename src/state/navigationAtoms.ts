// Jotai Atoms for Navigation State
// Generated from cfv_designs.NavigationStateService

import { atom } from 'jotai';
import { VisualizerModeEnum } from '@/models/cfv_models_generated';

// Current flow FQN being viewed
export const currentFlowFqnAtom = atom<string | null>(null);

// Whether system overview is active
export const systemViewActiveAtom = atom<boolean>(false);

// Current mode (design, trace, test_result)
export const currentModeAtom = atom<VisualizerModeEnum>('design');

// Derived atom for current view name
export const currentViewNameAtom = atom((get) => {
  const systemViewActive = get(systemViewActiveAtom);
  const currentFlowFqn = get(currentFlowFqnAtom);
  
  if (systemViewActive) {
    return 'systemOverview';
  } else if (currentFlowFqn) {
    return 'flowDetail';
  } else {
    return 'empty';
  }
});

// Navigation actions atom (write-only)
export const navigateToFlowAtom = atom(
  null,
  (get, set, flowFqn: string) => {
    set(currentFlowFqnAtom, flowFqn);
    set(systemViewActiveAtom, false);
  }
);

export const navigateToSystemOverviewAtom = atom(
  null,
  (get, set) => {
    set(currentFlowFqnAtom, null);
    set(systemViewActiveAtom, true);
  }
);

export const toggleSystemViewAtom = atom(
  null,
  (get, set) => {
    const systemViewActive = get(systemViewActiveAtom);
    set(systemViewActiveAtom, !systemViewActive);
    if (!systemViewActive) {
      // Switching to system overview, clear current flow
      set(currentFlowFqnAtom, null);
    }
  }
); 