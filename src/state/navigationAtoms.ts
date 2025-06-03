// Jotai Atoms for Navigation State
// Generated from cfv_designs.NavigationStateService

import { atom } from 'jotai';
import { 
  VisualizerModeEnum, 
  DesignViewModeEnum, 
  ViewChangePayload 
} from '@/models/cfv_models_generated';

// Core navigation state
export const currentFlowFqnAtom = atom<string | null>(null);
export const systemViewActiveAtom = atom<boolean>(false);
export const currentModeAtom = atom<VisualizerModeEnum>('design');
export const currentDesignViewModeAtom = atom<DesignViewModeEnum>('flowDetail');

// Derived atom for current view state
export const currentViewStateAtom = atom((get) => {
  const currentFlowFqn = get(currentFlowFqnAtom);
  const systemViewActive = get(systemViewActiveAtom);
  const mode = get(currentModeAtom);
  const designViewMode = get(currentDesignViewModeAtom);
  
  return {
    currentFlowFqn,
    systemViewActive,
    mode,
    designViewMode,
    isFlowDetailView: !systemViewActive && currentFlowFqn !== null,
    isSystemOverviewView: systemViewActive
  };
});

// Action atom for navigating to a specific flow
export const navigateToFlowAtom = atom(
  null,
  (get, set, flowFqn: string) => {
    set(currentFlowFqnAtom, flowFqn);
    set(systemViewActiveAtom, false);
    set(currentDesignViewModeAtom, 'flowDetail');
    
    // If we're not in design mode, switch to design mode
    const currentMode = get(currentModeAtom);
    if (currentMode !== 'design') {
      set(currentModeAtom, 'design');
    }
  }
);

// Action atom for navigating to system overview
export const navigateToSystemOverviewAtom = atom(
  null,
  (get, set) => {
    set(systemViewActiveAtom, true);
    set(currentDesignViewModeAtom, 'systemOverview');
    
    // If we're not in design mode, switch to design mode
    const currentMode = get(currentModeAtom);
    if (currentMode !== 'design') {
      set(currentModeAtom, 'design');
    }
  }
);

// Action atom for toggling between system view and flow detail view
export const toggleSystemViewAtom = atom(
  null,
  (get, set) => {
    const currentSystemView = get(systemViewActiveAtom);
    const currentFlowFqn = get(currentFlowFqnAtom);
    
    if (currentSystemView) {
      // Switch to flow detail view
      set(systemViewActiveAtom, false);
      set(currentDesignViewModeAtom, 'flowDetail');
      // Keep current flow if available, otherwise stay in system view
      if (!currentFlowFqn) {
        set(systemViewActiveAtom, true);
        set(currentDesignViewModeAtom, 'systemOverview');
      }
    } else {
      // Switch to system overview
      set(systemViewActiveAtom, true);
      set(currentDesignViewModeAtom, 'systemOverview');
    }
  }
);

// Action atom for setting mode (design, trace, test_result)
export const setModeAtom = atom(
  null,
  (get, set, mode: VisualizerModeEnum) => {
    set(currentModeAtom, mode);
  }
);

// Action atom for navigating to trace mode
export const navigateToTraceAtom = atom(
  null,
  (get, set, flowFqn?: string) => {
    set(currentModeAtom, 'trace');
    if (flowFqn) {
      set(currentFlowFqnAtom, flowFqn);
      set(systemViewActiveAtom, false);
      set(currentDesignViewModeAtom, 'flowDetail');
    }
  }
);

// Action atom for navigating to test result mode
export const navigateToTestResultAtom = atom(
  null,
  (get, set, flowFqn?: string) => {
    set(currentModeAtom, 'test_result');
    if (flowFqn) {
      set(currentFlowFqnAtom, flowFqn);
      set(systemViewActiveAtom, false);
      set(currentDesignViewModeAtom, 'flowDetail');
    }
  }
);

// Action atom for clearing current flow (go to system overview)
export const clearCurrentFlowAtom = atom(
  null,
  (get, set) => {
    set(currentFlowFqnAtom, null);
    set(systemViewActiveAtom, true);
    set(currentDesignViewModeAtom, 'systemOverview');
  }
);

// Derived atom for navigation breadcrumbs
export const navigationBreadcrumbsAtom = atom((get) => {
  const currentFlowFqn = get(currentFlowFqnAtom);
  const systemViewActive = get(systemViewActiveAtom);
  const mode = get(currentModeAtom);
  
  const breadcrumbs = [];
  
  // Add mode breadcrumb
  breadcrumbs.push({
    label: mode.charAt(0).toUpperCase() + mode.slice(1),
    isActive: false,
    action: null
  });
  
  if (systemViewActive) {
    breadcrumbs.push({
      label: 'System Overview',
      isActive: true,
      action: null
    });
  } else if (currentFlowFqn) {
    breadcrumbs.push({
      label: 'System Overview',
      isActive: false,
      action: 'navigateToSystemOverview'
    });
    
    // Parse flow FQN for module and flow name
    const parts = currentFlowFqn.split('.');
    const flowName = parts[parts.length - 1];
    const moduleFqn = parts.slice(0, -1).join('.');
    
    if (moduleFqn) {
      breadcrumbs.push({
        label: moduleFqn,
        isActive: false,
        action: null
      });
    }
    
    breadcrumbs.push({
      label: flowName,
      isActive: true,
      action: null
    });
  }
  
  return breadcrumbs;
});

// Derived atom for checking if navigation is valid
export const navigationValidityAtom = atom((get) => {
  const currentFlowFqn = get(currentFlowFqnAtom);
  const systemViewActive = get(systemViewActiveAtom);
  const mode = get(currentModeAtom);
  
  const isValid = {
    hasValidState: true,
    canNavigateToFlow: true,
    canNavigateToSystemOverview: true,
    canSwitchMode: true,
    issues: [] as string[]
  };
  
  // Check for invalid states
  if (!systemViewActive && !currentFlowFqn) {
    isValid.hasValidState = false;
    isValid.issues.push('No flow selected and not in system overview');
  }
  
  if (mode === 'trace' && !currentFlowFqn) {
    isValid.hasValidState = false;
    isValid.issues.push('Trace mode requires a specific flow');
  }
  
  if (mode === 'test_result' && !currentFlowFqn) {
    isValid.hasValidState = false;
    isValid.issues.push('Test result mode requires a specific flow');
  }
  
  return isValid;
});

// Action atom for resetting navigation to default state
export const resetNavigationAtom = atom(
  null,
  (get, set) => {
    set(currentFlowFqnAtom, null);
    set(systemViewActiveAtom, true);
    set(currentModeAtom, 'design');
    set(currentDesignViewModeAtom, 'systemOverview');
  }
);

// Derived atom for creating ViewChangePayload
export const viewChangePayloadAtom = atom((get): ViewChangePayload => {
  const currentFlowFqn = get(currentFlowFqnAtom);
  const systemViewActive = get(systemViewActiveAtom);
  const mode = get(currentModeAtom);
  
  return {
    mode,
    currentFlowFqn: currentFlowFqn || undefined,
    systemViewActive
  };
});

// Action atom for handling external view changes
export const handleExternalViewChangeAtom = atom(
  null,
  (get, set, viewChange: Partial<ViewChangePayload>) => {
    if (viewChange.mode !== undefined) {
      set(currentModeAtom, viewChange.mode);
    }
    
    if (viewChange.currentFlowFqn !== undefined) {
      set(currentFlowFqnAtom, viewChange.currentFlowFqn);
    }
    
    if (viewChange.systemViewActive !== undefined) {
      set(systemViewActiveAtom, viewChange.systemViewActive);
      set(currentDesignViewModeAtom, viewChange.systemViewActive ? 'systemOverview' : 'flowDetail');
    }
  }
);

// Derived atom for navigation history (simplified)
export const navigationHistoryAtom = atom<Array<{
  flowFqn: string | null;
  systemViewActive: boolean;
  mode: VisualizerModeEnum;
  timestamp: number;
}>>([]);

// Action atom for adding to navigation history
export const addToNavigationHistoryAtom = atom(
  null,
  (get, set) => {
    const currentState = get(currentViewStateAtom);
    const history = get(navigationHistoryAtom);
    
    const newEntry = {
      flowFqn: currentState.currentFlowFqn,
      systemViewActive: currentState.systemViewActive,
      mode: currentState.mode,
      timestamp: Date.now()
    };
    
    // Limit history to last 10 entries
    const newHistory = [newEntry, ...history.slice(0, 9)];
    set(navigationHistoryAtom, newHistory);
  }
); 