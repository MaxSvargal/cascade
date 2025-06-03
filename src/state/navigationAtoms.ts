// Jotai Atoms for Navigation State
// Generated from cfv_designs.NavigationStateService

import { atom } from 'jotai';
import { VisualizerModeEnum, DesignViewModeEnum } from '@/models/cfv_models_generated';

// Current flow FQN being viewed
export const currentFlowFqnAtom = atom<string | null>(null);

// Whether system overview is active
export const systemViewActiveAtom = atom<boolean>(false);

// Current mode (design, trace, test_result)
export const currentModeAtom = atom<VisualizerModeEnum>('design');

// Current design view mode (systemOverview, flowDetail)
export const currentDesignViewModeAtom = atom<DesignViewModeEnum>('systemOverview');

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

// Derived atom for whether flow detail view is active
export const flowDetailViewActiveAtom = atom((get) => {
  const currentFlowFqn = get(currentFlowFqnAtom);
  const systemViewActive = get(systemViewActiveAtom);
  return currentFlowFqn !== null && !systemViewActive;
});

// Navigation actions atom (write-only)
export const navigateToFlowAtom = atom(
  null,
  (get, set, flowFqn: string) => {
    set(currentFlowFqnAtom, flowFqn);
    set(systemViewActiveAtom, false);
    set(currentDesignViewModeAtom, 'flowDetail');
  }
);

// Navigate to system overview action
export const navigateToSystemOverviewAtom = atom(
  null,
  (get, set) => {
    set(systemViewActiveAtom, true);
    set(currentDesignViewModeAtom, 'systemOverview');
    // Keep currentFlowFqn for potential return navigation
  }
);

// Clear current flow action
export const clearCurrentFlowAtom = atom(
  null,
  (get, set) => {
    set(currentFlowFqnAtom, null);
    set(systemViewActiveAtom, true);
    set(currentDesignViewModeAtom, 'systemOverview');
  }
);

// Set mode action
export const setModeAtom = atom(
  null,
  (get, set, mode: VisualizerModeEnum) => {
    set(currentModeAtom, mode);
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