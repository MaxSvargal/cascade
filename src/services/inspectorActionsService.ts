// Inspector Actions Service
// Extracted from CascadeFlowVisualizer to provide modular inspector actions
// Handles save operations and YAML reconstruction

import { 
  InspectorPropertiesActions,
  IModuleRegistry,
  SelectedElement,
  SaveModulePayload
} from '../models/cfv_models_generated';
import { applyConfigChanges, createSavePayload } from './yamlReconstructionService';

export class InspectorActionsService implements InspectorPropertiesActions {
  constructor(
    private moduleRegistry: IModuleRegistry,
    private dslModuleRepresentations: Record<string, any>,
    private onSaveModule?: (payload: SaveModulePayload) => Promise<boolean | void>,
    private onModuleLoadError?: (moduleFqn: string, error: Error) => void
  ) {}

  async requestSave(newConfigValue: any, pathToConfig: (string | number)[]): Promise<void> {
    const selectedElement = this.getCurrentSelectedElement();
    
    if (!selectedElement || !this.onSaveModule) {
      console.log('Save requested but no save handler or selected element:', { newConfigValue, pathToConfig });
      return;
    }

    try {
      // Find the module that contains the selected element
      const moduleFqn = selectedElement.moduleFqn || 
        (this.getCurrentFlowFqn() ? this.getCurrentFlowFqn()!.split('.').slice(0, -1).join('.') : null);
      
      if (!moduleFqn) {
        console.error('Cannot determine module FQN for save operation');
        return;
      }

      const moduleRep = this.dslModuleRepresentations[moduleFqn];
      if (!moduleRep) {
        console.error('Module not found for save operation:', moduleFqn);
        return;
      }

      // Apply the configuration changes
      const updatedModuleRep = applyConfigChanges(moduleRep, pathToConfig, newConfigValue);
      
      // Create save payload
      const savePayload = createSavePayload(updatedModuleRep);
      
      // Call the save handler
      const result = await this.onSaveModule(savePayload);
      
      if (result !== false) {
        console.log('Save successful for module:', moduleFqn);
        // Optionally update the local state with the new module representation
        // This would require updating the atom, but we'll let the consumer handle reloading
      } else {
        console.error('Save was rejected by the handler');
      }
    } catch (error) {
      console.error('Save operation failed:', error);
      if (this.onModuleLoadError && selectedElement.moduleFqn) {
        this.onModuleLoadError(selectedElement.moduleFqn, error as Error);
      }
    }
  }

  // These methods would need to be provided by the component using this service
  // For now, they return null/undefined as placeholders
  private getCurrentSelectedElement(): SelectedElement | null {
    // This would be injected or provided by the component
    return null;
  }

  private getCurrentFlowFqn(): string | null {
    // This would be injected or provided by the component
    return null;
  }

  // Method to update the context with current state
  updateContext(selectedElement: SelectedElement | null, currentFlowFqn: string | null) {
    // Store these for use in requestSave
    (this as any)._selectedElement = selectedElement;
    (this as any)._currentFlowFqn = currentFlowFqn;
  }

  // Override the private methods to use the stored context
  private getCurrentSelectedElement_Updated(): SelectedElement | null {
    return (this as any)._selectedElement || null;
  }

  private getCurrentFlowFqn_Updated(): string | null {
    return (this as any)._currentFlowFqn || null;
  }
}

// Factory function to create inspector actions with proper context
export function createInspectorActions(
  moduleRegistry: IModuleRegistry,
  dslModuleRepresentations: Record<string, any>,
  selectedElement: SelectedElement | null,
  currentFlowFqn: string | null,
  onSaveModule?: (payload: SaveModulePayload) => Promise<boolean | void>,
  onModuleLoadError?: (moduleFqn: string, error: Error) => void
): InspectorPropertiesActions {
  return {
    async requestSave(newConfigValue: any, pathToConfig: (string | number)[]): Promise<void> {
      if (!selectedElement || !onSaveModule) {
        console.log('Save requested but no save handler or selected element:', { newConfigValue, pathToConfig });
        return;
      }

      try {
        // Find the module that contains the selected element
        const moduleFqn = selectedElement.moduleFqn || 
          (currentFlowFqn ? currentFlowFqn.split('.').slice(0, -1).join('.') : null);
        
        if (!moduleFqn) {
          console.error('Cannot determine module FQN for save operation');
          return;
        }

        const moduleRep = dslModuleRepresentations[moduleFqn];
        if (!moduleRep) {
          console.error('Module not found for save operation:', moduleFqn);
          return;
        }

        // Apply the configuration changes
        const updatedModuleRep = applyConfigChanges(moduleRep, pathToConfig, newConfigValue);
        
        // Create save payload
        const savePayload = createSavePayload(updatedModuleRep);
        
        // Call the save handler
        const result = await onSaveModule(savePayload);
        
        if (result !== false) {
          console.log('Save successful for module:', moduleFqn);
          // Optionally update the local state with the new module representation
          // This would require updating the atom, but we'll let the consumer handle reloading
        } else {
          console.error('Save was rejected by the handler');
        }
      } catch (error) {
        console.error('Save operation failed:', error);
        if (onModuleLoadError && selectedElement.moduleFqn) {
          onModuleLoadError(selectedElement.moduleFqn, error as Error);
        }
      }
    }
  };
} 