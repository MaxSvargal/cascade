// Jotai Atoms for Selection State
// Generated from cfv_designs.SelectionService

import { atom, WritableAtom } from 'jotai';
import { SelectedElement, SelectedElementSourceEnum } from '@/models/cfv_models_generated';

// Core selection state
export const selectedElementAtom = atom<SelectedElement | null>(null) as WritableAtom<SelectedElement | null, [SelectedElement | null], void>;

// Selection history for undo/redo functionality
export const selectionHistoryAtom = atom<SelectedElement[]>([]) as WritableAtom<SelectedElement[], [SelectedElement[]], void>;

// Current selection index in history
export const selectionHistoryIndexAtom = atom<number>(-1) as WritableAtom<number, [number], void>;

// Derived atom for selection type
export const selectedElementTypeAtom = atom((get) => {
  const selectedElement = get(selectedElementAtom);
  return selectedElement?.sourceType || null;
});

// Derived atom for whether something is selected
export const hasSelectionAtom = atom((get) => {
  const selectedElement = get(selectedElementAtom);
  return selectedElement !== null;
});

// Derived atom for selected element data
export const selectedElementDataAtom = atom((get) => {
  const selectedElement = get(selectedElementAtom);
  return selectedElement?.data || null;
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

// Derived atom for whether selected element is configurable
export const selectedElementIsConfigurableAtom = atom((get) => {
  const selectedElement = get(selectedElementAtom);
  return selectedElement?.data?.componentSchema?.configSchema !== undefined;
});

// Derived atom for whether selected element is a flow node
export const selectedElementIsFlowNodeAtom = atom((get) => {
  const selectedElement = get(selectedElementAtom);
  return selectedElement?.sourceType === 'flowNode';
});

// Derived atom for whether selected element is a system node
export const selectedElementIsSystemNodeAtom = atom((get) => {
  const selectedElement = get(selectedElementAtom);
  return selectedElement?.sourceType === 'systemFlowNode' || 
         selectedElement?.sourceType === 'systemTriggerNode';
});

// Derived atom for whether selected element is an edge
export const selectedElementIsEdgeAtom = atom((get) => {
  const selectedElement = get(selectedElementAtom);
  return selectedElement?.sourceType === 'flowEdge';
});

// Derived atom for whether selected element is a list item
export const selectedElementIsListItemAtom = atom((get) => {
  const selectedElement = get(selectedElementAtom);
  return selectedElement?.sourceType === 'moduleListItem' ||
         selectedElement?.sourceType === 'flowListItem' ||
         selectedElement?.sourceType === 'namedComponentListItem' ||
         selectedElement?.sourceType === 'triggerListItem' ||
         selectedElement?.sourceType === 'traceListItem';
});

// Action atom for selecting an element
export const selectElementAtom = atom(
  null,
  (get, set, element: SelectedElement | null) => {
    const currentSelection = get(selectedElementAtom);
    
    // Don't update if selecting the same element
    if (currentSelection?.id === element?.id && 
        currentSelection?.sourceType === element?.sourceType) {
      return;
    }
    
    // Add current selection to history before changing
    if (currentSelection) {
      const history = get(selectionHistoryAtom);
      const currentIndex = get(selectionHistoryIndexAtom);
      
      // Remove any history after current index (for redo functionality)
      const newHistory = [...history.slice(0, currentIndex + 1), currentSelection];
      
      // Limit history to 50 items
      if (newHistory.length > 50) {
        newHistory.shift();
      } else {
        set(selectionHistoryIndexAtom, currentIndex + 1);
      }
      
      set(selectionHistoryAtom, newHistory);
    }
    
    // Update selection
    set(selectedElementAtom, element);
  }
);

// Action atom for clearing selection
export const clearSelectionAtom = atom(
  null,
  (get, set) => {
    set(selectElementAtom, null);
  }
);

// Action atom for selecting by ID and type
export const selectElementByIdAtom = atom(
  null,
  (get, set, id: string, sourceType: SelectedElementSourceEnum, data?: any, moduleFqn?: string, flowFqn?: string, stepId?: string) => {
    const element: SelectedElement = {
      id,
      sourceType,
      data,
      moduleFqn,
      flowFqn,
      stepId
    };
    
    set(selectElementAtom, element);
  }
);

// Action atom for undo selection
export const undoSelectionAtom = atom(
  null,
  (get, set) => {
    const history = get(selectionHistoryAtom);
    const currentIndex = get(selectionHistoryIndexAtom);
    
    if (currentIndex > 0) {
      const previousElement = history[currentIndex - 1];
      set(selectedElementAtom, previousElement);
      set(selectionHistoryIndexAtom, currentIndex - 1);
    } else if (currentIndex === 0) {
      // Go to no selection
      set(selectedElementAtom, null);
      set(selectionHistoryIndexAtom, -1);
    }
  }
);

// Action atom for redo selection
export const redoSelectionAtom = atom(
  null,
  (get, set) => {
    const history = get(selectionHistoryAtom);
    const currentIndex = get(selectionHistoryIndexAtom);
    const currentSelection = get(selectedElementAtom);
    
    if (currentIndex < history.length - 1) {
      const nextElement = history[currentIndex + 1];
      set(selectedElementAtom, nextElement);
      set(selectionHistoryIndexAtom, currentIndex + 1);
    } else if (currentIndex === -1 && history.length > 0) {
      // Restore first item from history
      const firstElement = history[0];
      set(selectedElementAtom, firstElement);
      set(selectionHistoryIndexAtom, 0);
    }
  }
);

// Derived atom for undo/redo availability
export const selectionUndoRedoAvailabilityAtom = atom((get) => {
  const history = get(selectionHistoryAtom);
  const currentIndex = get(selectionHistoryIndexAtom);
  
  return {
    canUndo: currentIndex >= 0,
    canRedo: currentIndex < history.length - 1,
    historyLength: history.length,
    currentIndex
  };
});

// Action atom for clearing selection history
export const clearSelectionHistoryAtom = atom(
  null,
  (get, set) => {
    set(selectionHistoryAtom, []);
    set(selectionHistoryIndexAtom, -1);
  }
);

// Derived atom for selection summary
export const selectionSummaryAtom = atom((get) => {
  const selectedElement = get(selectedElementAtom);
  const isConfigurable = get(selectedElementIsConfigurableAtom);
  const isFlowNode = get(selectedElementIsFlowNodeAtom);
  const isSystemNode = get(selectedElementIsSystemNodeAtom);
  const isEdge = get(selectedElementIsEdgeAtom);
  const isListItem = get(selectedElementIsListItemAtom);
  
  if (!selectedElement) {
    return {
      hasSelection: false,
      type: null,
      id: null,
      label: 'No selection',
      capabilities: {
        canEdit: false,
        canInspect: false,
        canNavigate: false,
        canTest: false
      }
    };
  }
  
  const label = selectedElement.data?.label || selectedElement.id;
  
  return {
    hasSelection: true,
    type: selectedElement.sourceType,
    id: selectedElement.id,
    label,
    capabilities: {
      canEdit: isConfigurable,
      canInspect: true,
      canNavigate: isFlowNode || isSystemNode,
      canTest: isFlowNode
    }
  };
});

// Action atom for selecting multiple elements (for future multi-select support)
export const multiSelectElementsAtom = atom<SelectedElement[]>([]);

// Action atom for adding to multi-selection
export const addToMultiSelectionAtom = atom(
  null,
  (get, set, element: SelectedElement) => {
    const currentMultiSelection = get(multiSelectElementsAtom);
    
    // Check if element is already selected
    const isAlreadySelected = currentMultiSelection.some(
      selected => selected.id === element.id && selected.sourceType === element.sourceType
    );
    
    if (!isAlreadySelected) {
      set(multiSelectElementsAtom, [...currentMultiSelection, element]);
    }
  }
);

// Action atom for removing from multi-selection
export const removeFromMultiSelectionAtom = atom(
  null,
  (get, set, element: SelectedElement) => {
    const currentMultiSelection = get(multiSelectElementsAtom);
    const filtered = currentMultiSelection.filter(
      selected => !(selected.id === element.id && selected.sourceType === element.sourceType)
    );
    set(multiSelectElementsAtom, filtered);
  }
);

// Action atom for clearing multi-selection
export const clearMultiSelectionAtom = atom(
  null,
  (get, set) => {
    set(multiSelectElementsAtom, []);
  }
);

// Derived atom for multi-selection summary
export const multiSelectionSummaryAtom = atom((get) => {
  const multiSelection = get(multiSelectElementsAtom);
  
  const summary = {
    count: multiSelection.length,
    types: new Set(multiSelection.map(el => el.sourceType)),
    hasFlowNodes: multiSelection.some(el => el.sourceType === 'flowNode'),
    hasSystemNodes: multiSelection.some(el => el.sourceType === 'systemFlowNode' || el.sourceType === 'systemTriggerNode'),
    hasEdges: multiSelection.some(el => el.sourceType === 'flowEdge'),
    hasListItems: multiSelection.some(el => 
      el.sourceType === 'moduleListItem' || 
      el.sourceType === 'flowListItem' || 
      el.sourceType === 'namedComponentListItem' || 
      el.sourceType === 'triggerListItem' || 
      el.sourceType === 'traceListItem'
    )
  };
  
  return summary;
}); 