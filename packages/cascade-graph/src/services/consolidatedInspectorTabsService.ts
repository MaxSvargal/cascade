// Consolidated Inspector Tabs Service
// Manages the three consolidated inspector tabs: Source, Properties, Debug & Test

import { 
  InspectorSourceTabProps, 
  InspectorPropertiesTabProps, 
  InspectorDebugTestTabProps,
  SelectedElement,
  IModuleRegistry,
  InspectorPropertiesActions,
  UnifiedDebugTestActions,
  FlowExecutionTrace,
  TestRunResult
} from '@/models/cfv_models_generated';

export interface ConsolidatedInspectorTabsService {
  // Source Tab Management
  getSourceTabProps(
    selectedElement: SelectedElement | null,
    moduleRegistry: IModuleRegistry
  ): InspectorSourceTabProps | null;

  // Properties Tab Management  
  getPropertiesTabProps(
    selectedElement: SelectedElement | null,
    moduleRegistry: IModuleRegistry,
    actions: InspectorPropertiesActions
  ): InspectorPropertiesTabProps | null;

  // Debug & Test Tab Management
  getDebugTestTabProps(
    currentFlowFqn: string | null,
    selectedElement: SelectedElement | null,
    moduleRegistry: IModuleRegistry,
    actions: UnifiedDebugTestActions,
    traceData?: FlowExecutionTrace,
    testResultData?: TestRunResult
  ): InspectorDebugTestTabProps | null;

  // Tab Visibility Logic
  getTabVisibility(
    selectedElement: SelectedElement | null,
    currentFlowFqn: string | null
  ): {
    source: boolean;
    properties: boolean;
    debugtest: boolean;
  };

  // Default Tab Selection
  getDefaultTab(
    selectedElement: SelectedElement | null,
    currentFlowFqn: string | null
  ): 'source' | 'properties' | 'debugtest';
}

export const consolidatedInspectorTabsService: ConsolidatedInspectorTabsService = {
  getSourceTabProps(selectedElement, moduleRegistry) {
    if (!selectedElement) return null;

    return {
      selectedElement,
      moduleRegistry
    };
  },

  getPropertiesTabProps(selectedElement, moduleRegistry, actions) {
    if (!selectedElement) return null;
    
    // Only show properties tab for elements with configurable schemas
    const hasConfigSchema = selectedElement.data?.componentSchema?.configSchema !== undefined;
    if (!hasConfigSchema) return null;

    return {
      selectedElement,
      actions,
      moduleRegistry
    };
  },

  getDebugTestTabProps(currentFlowFqn, selectedElement, moduleRegistry, actions, traceData, testResultData) {
    // Show debug test tab if we have flow context or executable element
    const hasFlowContext = currentFlowFqn !== null;
    const hasExecutableElement = selectedElement !== null && 
      (selectedElement.sourceType === 'flowNode' || selectedElement.sourceType === 'systemFlowNode');
    
    if (!hasFlowContext && !hasExecutableElement) return null;

    // InspectorDebugTestTabProps requires currentFlowFqn to be string, not null
    // So we need a valid flow FQN to create the props
    const flowFqn = currentFlowFqn || selectedElement?.flowFqn;
    if (!flowFqn) return null;

    return {
      currentFlowFqn: flowFqn,
      selectedElement: selectedElement || undefined,
      traceData,
      testResultData,
      actions,
      moduleRegistry
    };
  },

  getTabVisibility(selectedElement, currentFlowFqn) {
    return {
      source: selectedElement !== null,
      properties: selectedElement !== null && 
                  selectedElement.data?.componentSchema?.configSchema !== undefined,
      debugtest: currentFlowFqn !== null || 
                 (selectedElement !== null && 
                  (selectedElement.sourceType === 'flowNode' || selectedElement.sourceType === 'systemFlowNode'))
    };
  },

  getDefaultTab(selectedElement, currentFlowFqn) {
    const visibility = this.getTabVisibility(selectedElement, currentFlowFqn);
    
    // Priority order: source -> properties -> debugtest
    if (visibility.source) return 'source';
    if (visibility.properties) return 'properties';
    if (visibility.debugtest) return 'debugtest';
    
    return 'source'; // fallback
  }
}; 