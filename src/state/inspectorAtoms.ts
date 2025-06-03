// Jotai Atoms for Inspector State
// Generated from cfv_designs.InspectorStateService

import { atom } from 'jotai';
import { selectedElementAtom } from './selectionAtoms';
import { currentFlowFqnAtom } from './navigationAtoms';
import { dslModuleRepresentationsAtom } from './moduleRegistryAtoms';
import { 
  SelectedElement, 
  InspectorSourceTabProps, 
  InspectorPropertiesTabProps, 
  InspectorDebugTestTabProps,
  InspectorPropertiesActions,
  UnifiedDebugTestActions,
  IModuleRegistry
} from '@/models/cfv_models_generated';

// Active inspector tab - consolidated architecture with three main tabs
export const activeInspectorTabAtom = atom<'source' | 'properties' | 'debugtest'>('source');

// Inspector tab visibility rules based on consolidated architecture
export const inspectorTabVisibilityAtom = atom((get) => {
  const selectedElement = get(selectedElementAtom);
  const currentFlowFqn = get(currentFlowFqnAtom);
  
  return {
    source: selectedElement !== null, // Always visible when element selected
    properties: selectedElement !== null && 
                selectedElement.data?.componentSchema?.configSchema !== undefined, // Visible for configurable components
    debugtest: currentFlowFqn !== null || // Visible when flow context available
               (selectedElement !== null && 
                (selectedElement.sourceType === 'flowNode' || selectedElement.sourceType === 'systemFlowNode'))
  };
});

// Derived atom for inspector source tab props
export const inspectorSourceTabPropsAtom = atom((get) => {
  const selectedElement = get(selectedElementAtom);
  
  if (!selectedElement) return null;
  
  return {
    selectedElement,
    moduleRegistry: null // Will be provided by component context
  } as Omit<InspectorSourceTabProps, 'moduleRegistry'>;
});

// Derived atom for inspector properties tab props
export const inspectorPropertiesTabPropsAtom = atom((get) => {
  const selectedElement = get(selectedElementAtom);
  
  if (!selectedElement) return null;
  
  return {
    selectedElement,
    actions: null, // Will be provided by component context
    moduleRegistry: null // Will be provided by component context
  } as Omit<InspectorPropertiesTabProps, 'actions' | 'moduleRegistry'>;
});

// Derived atom for inspector debug test tab props
export const inspectorDebugTestTabPropsAtom = atom((get) => {
  const selectedElement = get(selectedElementAtom);
  const currentFlowFqn = get(currentFlowFqnAtom);
  
  return {
    currentFlowFqn,
    selectedElement,
    traceData: undefined, // Will be provided by component props
    testResultData: undefined, // Will be provided by component props
    actions: null, // Will be provided by component context
    moduleRegistry: null // Will be provided by component context
  } as Omit<InspectorDebugTestTabProps, 'actions' | 'moduleRegistry'>;
});

// Inspector loading states
export const inspectorLoadingStateAtom = atom({
  source: false,
  properties: false,
  debugtest: false
});

// Inspector error states
export const inspectorErrorStateAtom = atom<{
  source: string | null;
  properties: string | null;
  debugtest: string | null;
}>({
  source: null,
  properties: null,
  debugtest: null
});

// Action atom for manually switching tabs (only way to change tabs)
export const switchInspectorTabAtom = atom(
  null,
  (get, set, tabId: 'source' | 'properties' | 'debugtest') => {
    // Always switch to the requested tab - no availability checking
    // The UI will handle showing "not available" message if needed
    set(activeInspectorTabAtom, tabId);
  }
);

// Derived atom for whether current tab is available for selected element
export const currentTabAvailabilityAtom = atom((get) => {
  const activeTab = get(activeInspectorTabAtom);
  const visibility = get(inspectorTabVisibilityAtom);
  
  return {
    activeTab,
    isAvailable: visibility[activeTab],
    availableTabs: visibility
  };
});

// Action atom for setting loading state
export const setInspectorLoadingAtom = atom(
  null,
  (get, set, updates: Partial<{ source: boolean; properties: boolean; debugtest: boolean }>) => {
    const current = get(inspectorLoadingStateAtom);
    set(inspectorLoadingStateAtom, { ...current, ...updates });
  }
);

// Action atom for setting error state
export const setInspectorErrorAtom = atom(
  null,
  (get, set, updates: Partial<{ source: string | null; properties: string | null; debugtest: string | null }>) => {
    const current = get(inspectorErrorStateAtom);
    set(inspectorErrorStateAtom, { ...current, ...updates });
  }
);

// Derived atom for current tab data
export const currentInspectorTabDataAtom = atom((get) => {
  const activeTab = get(activeInspectorTabAtom);
  const sourceProps = get(inspectorSourceTabPropsAtom);
  const propertiesProps = get(inspectorPropertiesTabPropsAtom);
  const debugTestProps = get(inspectorDebugTestTabPropsAtom);
  
  switch (activeTab) {
    case 'source':
      return { tab: 'source', props: sourceProps };
    case 'properties':
      return { tab: 'properties', props: propertiesProps };
    case 'debugtest':
      return { tab: 'debugtest', props: debugTestProps };
    default:
      return { tab: 'source', props: sourceProps };
  }
});

// Derived atom for whether inspector has content
export const inspectorHasContentAtom = atom((get) => {
  const selectedElement = get(selectedElementAtom);
  const currentFlowFqn = get(currentFlowFqnAtom);
  
  return selectedElement !== null || currentFlowFqn !== null;
});

// Action atom for refreshing tab content
export const refreshInspectorTabAtom = atom(
  null,
  (get, set, tabId?: 'source' | 'properties' | 'debugtest') => {
    const targetTab = tabId || get(activeInspectorTabAtom);
    
    // Clear any existing errors for the tab
    set(setInspectorErrorAtom, { [targetTab]: null });
    
    // Set loading state
    set(setInspectorLoadingAtom, { [targetTab]: true });
    
    // The actual refresh logic will be handled by the component
    // This atom just manages the state transitions
    
    // Clear loading state after a brief delay (will be overridden by actual operations)
    setTimeout(() => {
      set(setInspectorLoadingAtom, { [targetTab]: false });
    }, 100);
  }
);

// Derived atom for inspector tab configuration - consolidated architecture
export const inspectorTabConfigAtom = atom((get) => {
  const visibility = get(inspectorTabVisibilityAtom);
  
  const availableTabs = [
    { id: 'source' as const, label: 'Source', visible: visibility.source },
    { id: 'properties' as const, label: 'Properties', visible: visibility.properties },
    { id: 'debugtest' as const, label: 'Debug & Test', visible: visibility.debugtest }
  ];
  
  return {
    availableTabs,
    tabOrder: ['source', 'properties', 'debugtest'] as const
  };
}); 