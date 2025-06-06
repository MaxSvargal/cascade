// Inspector Actions Service
// Provides actions for inspector tabs, particularly save operations

import { 
  InspectorPropertiesActions, 
  SaveModulePayload, 
  SelectedElement,
  IModuleRegistry,
  DslModuleRepresentation
} from '@/models/cfv_models_generated';

// Note: yamlReconstructionService functions are now in the workspace
// These would need to be passed in as dependencies or imported from workspace
interface ReconstructionOptions {
  indentSize?: number;
  lineWidth?: number;
  sortKeys?: boolean;
}

// Placeholder functions - these should be provided by the workspace
function createSavePayloadWithChanges(
  moduleRep: any,
  pathToConfig: (string | number)[],
  oldValue: any,
  newValue: any,
  options: ReconstructionOptions
): SaveModulePayload {
  // This is a placeholder - actual implementation should come from workspace
  return {
    fqn: moduleRep.fqn,
    newContent: JSON.stringify(moduleRep.parsedContent, null, 2),
    pathToConfig,
    newConfigValue: newValue
  };
}

function validateConfigPath(moduleRep: any, path: (string | number)[]): { isValid: boolean; error?: string } {
  // This is a placeholder - actual implementation should come from workspace
  return { isValid: true };
}

export class InspectorActionsService implements InspectorPropertiesActions {
  private selectedElement: SelectedElement | null = null;
  private currentFlowFqn: string | null = null;

  constructor(
    private moduleRegistry: IModuleRegistry,
    private dslModuleRepresentations: Record<string, DslModuleRepresentation>,
    private onSaveModule?: (payload: SaveModulePayload) => Promise<boolean | void>,
    private onModuleLoadError?: (moduleFqn: string, error: Error) => void
  ) {}

  async requestSave(newConfigValue: any, pathToConfig: (string | number)[]): Promise<void> {
    try {
      if (!this.selectedElement) {
        throw new Error('No element selected for save operation');
      }

      const moduleFqn = this.selectedElement.moduleFqn;
      if (!moduleFqn) {
        throw new Error('Selected element has no associated module');
      }

      // Get the current module representation
      const moduleRep = this.dslModuleRepresentations[moduleFqn];
      if (!moduleRep) {
        throw new Error(`Module ${moduleFqn} not found in loaded modules`);
      }

      // Validate the configuration path
      const pathValidation = validateConfigPath(moduleRep, pathToConfig);
      if (!pathValidation.isValid) {
        throw new Error(`Invalid configuration path: ${pathValidation.error}`);
      }

      // Get the old value for context
      const oldConfigValue = this.getNestedValue(
        moduleRep.parsedContent || moduleRep.rawContent, 
        pathToConfig
      );

      // Create save payload with changes
      const reconstructionOptions: ReconstructionOptions = {
        indentSize: 2,
        lineWidth: 120,
        sortKeys: false
      };

      const savePayload = createSavePayloadWithChanges(
        moduleRep,
        pathToConfig,
        oldConfigValue,
        newConfigValue,
        reconstructionOptions
      );

      // Validate the save payload
      if (!savePayload.newContent) {
        throw new Error('Failed to generate new module content');
      }

      // Call the save callback if provided
      if (this.onSaveModule) {
        const result = await this.onSaveModule(savePayload);
        
        // Handle save result
        if (result === false) {
          throw new Error('Save operation was rejected by the host application');
        }
        
        console.log('✅ Module saved successfully:', moduleFqn);
      } else {
        console.warn('⚠️ No save handler provided, save operation skipped');
      }

    } catch (error) {
      console.error('❌ Save operation failed:', error);
      
      // Report error to host application if handler provided
      if (this.onModuleLoadError && this.selectedElement?.moduleFqn) {
        this.onModuleLoadError(
          this.selectedElement.moduleFqn, 
          error instanceof Error ? error : new Error('Unknown save error')
        );
      }
      
      // Re-throw for UI error handling
      throw error;
    }
  }

  /**
   * Updates the context for the inspector actions
   */
  updateContext(selectedElement: SelectedElement | null, currentFlowFqn: string | null): void {
    this.selectedElement = selectedElement;
    this.currentFlowFqn = currentFlowFqn;
  }

  /**
   * Gets the currently selected element
   */
  getCurrentSelectedElement(): SelectedElement | null {
    return this.selectedElement;
  }

  /**
   * Gets the current flow FQN
   */
  getCurrentFlowFqn(): string | null {
    return this.currentFlowFqn;
  }

  /**
   * Helper method to get nested values from an object
   */
  private getNestedValue(obj: any, path: (string | number)[]): any {
    if (!obj || path.length === 0) return undefined;
    
    let current = obj;
    for (const key of path) {
      if (current == null || !(key in current)) {
        return undefined;
      }
      current = current[key];
    }
    return current;
  }

  /**
   * Validates that the current context allows for save operations
   */
  canSave(): { canSave: boolean; reason?: string } {
    if (!this.selectedElement) {
      return { canSave: false, reason: 'No element selected' };
    }

    if (!this.selectedElement.moduleFqn) {
      return { canSave: false, reason: 'Selected element has no associated module' };
    }

    const moduleRep = this.dslModuleRepresentations[this.selectedElement.moduleFqn];
    if (!moduleRep) {
      return { canSave: false, reason: 'Module not found in loaded modules' };
    }

    if (moduleRep.status === 'error') {
      return { canSave: false, reason: 'Module has parsing errors' };
    }

    if (!this.onSaveModule) {
      return { canSave: false, reason: 'No save handler provided' };
    }

    return { canSave: true };
  }

  /**
   * Gets information about the currently editable configuration
   */
  getEditableConfig(): { 
    hasConfig: boolean; 
    configPath?: (string | number)[]; 
    currentValue?: any;
    schema?: any;
  } {
    if (!this.selectedElement || !this.selectedElement.data) {
      return { hasConfig: false };
    }

    // For step nodes, the config is typically at ['config']
    if (this.selectedElement.sourceType === 'flowNode' && this.selectedElement.data.dslObject) {
      const configPath = ['config'];
      const currentValue = this.selectedElement.data.dslObject.config;
      const schema = this.selectedElement.data.componentSchema?.configSchema;

      return {
        hasConfig: true,
        configPath,
        currentValue,
        schema
      };
    }

    return { hasConfig: false };
  }
}

/**
 * Factory function to create inspector actions with proper context
 */
export function createInspectorActions(
  moduleRegistry: IModuleRegistry,
  dslModuleRepresentations: Record<string, DslModuleRepresentation>,
  selectedElement: SelectedElement | null,
  currentFlowFqn: string | null,
  onSaveModule?: (payload: SaveModulePayload) => Promise<boolean | void>,
  onModuleLoadError?: (moduleFqn: string, error: Error) => void
): InspectorPropertiesActions {
  const service = new InspectorActionsService(
    moduleRegistry,
    dslModuleRepresentations,
    onSaveModule,
    onModuleLoadError
  );

  // Update context
  service.updateContext(selectedElement, currentFlowFqn);

  // Return the interface implementation
  return {
    async requestSave(newConfigValue: any, pathToConfig: (string | number)[]): Promise<void> {
      return service.requestSave(newConfigValue, pathToConfig);
    }
  };
}

/**
 * Enhanced inspector actions with additional utility methods
 */
export interface EnhancedInspectorActions extends InspectorPropertiesActions {
  canSave(): { canSave: boolean; reason?: string };
  getEditableConfig(): { 
    hasConfig: boolean; 
    configPath?: (string | number)[]; 
    currentValue?: any;
    schema?: any;
  };
  updateContext(selectedElement: SelectedElement | null, currentFlowFqn: string | null): void;
}

/**
 * Factory function to create enhanced inspector actions
 */
export function createEnhancedInspectorActions(
  moduleRegistry: IModuleRegistry,
  dslModuleRepresentations: Record<string, DslModuleRepresentation>,
  selectedElement: SelectedElement | null,
  currentFlowFqn: string | null,
  onSaveModule?: (payload: SaveModulePayload) => Promise<boolean | void>,
  onModuleLoadError?: (moduleFqn: string, error: Error) => void
): EnhancedInspectorActions {
  const service = new InspectorActionsService(
    moduleRegistry,
    dslModuleRepresentations,
    onSaveModule,
    onModuleLoadError
  );

  // Update context
  service.updateContext(selectedElement, currentFlowFqn);

  return {
    async requestSave(newConfigValue: any, pathToConfig: (string | number)[]): Promise<void> {
      return service.requestSave(newConfigValue, pathToConfig);
    },
    canSave(): { canSave: boolean; reason?: string } {
      return service.canSave();
    },
    getEditableConfig() {
      return service.getEditableConfig();
    },
    updateContext(selectedElement: SelectedElement | null, currentFlowFqn: string | null): void {
      service.updateContext(selectedElement, currentFlowFqn);
    }
  };
} 