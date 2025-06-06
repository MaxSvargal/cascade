// Source Tab Service
// Manages YAML source display with syntax highlighting and element highlighting

import { 
  SelectedElement, 
  IModuleRegistry, 
  DslModuleRepresentation 
} from '@/models/cfv_models_generated';

export interface SourceTabService {
  // Get the full module YAML content for display
  getModuleYamlContent(
    selectedElement: SelectedElement,
    moduleRegistry: IModuleRegistry
  ): string | null;

  // Get line numbers where the selected element appears in the YAML
  getElementHighlightLines(
    selectedElement: SelectedElement,
    moduleRegistry: IModuleRegistry
  ): { startLine: number; endLine: number } | null;

  // Get the module representation for the selected element
  getModuleRepresentation(
    selectedElement: SelectedElement,
    moduleRegistry: IModuleRegistry
  ): DslModuleRepresentation | null;

  // Extract element context (surrounding YAML structure)
  getElementContext(
    selectedElement: SelectedElement,
    moduleRegistry: IModuleRegistry
  ): {
    elementPath: string[];
    parentContext: any;
    elementYaml: string;
  } | null;
}

export const sourceTabService: SourceTabService = {
  getModuleYamlContent(selectedElement, moduleRegistry) {
    const moduleFqn = selectedElement.moduleFqn;
    if (!moduleFqn) return null;

    const moduleRep = moduleRegistry.getLoadedModule(moduleFqn);
    if (!moduleRep) return null;

    return moduleRep.rawContent;
  },

  getElementHighlightLines(selectedElement, moduleRegistry) {
    // This would require parsing the YAML and finding the element's position
    // For now, return null - this would need more sophisticated YAML parsing
    // to map DSL objects back to their line positions in the raw content
    return null;
  },

  getModuleRepresentation(selectedElement, moduleRegistry) {
    const moduleFqn = selectedElement.moduleFqn;
    if (!moduleFqn) return null;

    return moduleRegistry.getLoadedModule(moduleFqn);
  },

  getElementContext(selectedElement, moduleRegistry) {
    const moduleRep = this.getModuleRepresentation(selectedElement, moduleRegistry);
    if (!moduleRep || !moduleRep.parsedContent) return null;

    // Extract the element's path and context based on its type and ID
    let elementPath: string[] = [];
    let parentContext: any = null;
    let elementYaml = '';

    try {
      switch (selectedElement.sourceType) {
        case 'flowNode':
        case 'systemFlowNode':
          if (selectedElement.flowFqn) {
            const flowDef = moduleRegistry.getFlowDefinitionDsl(selectedElement.flowFqn);
            if (flowDef) {
              elementPath = ['flows', selectedElement.flowFqn.split('.').pop() || ''];
              parentContext = flowDef;
              elementYaml = JSON.stringify(flowDef, null, 2); // Convert to YAML-like format
            }
          }
          break;

        case 'namedComponentListItem':
          if (selectedElement.id) {
            const componentDef = moduleRegistry.getNamedComponentDefinitionDsl(selectedElement.id);
            if (componentDef) {
              elementPath = ['components', selectedElement.id.split('.').pop() || ''];
              parentContext = componentDef;
              elementYaml = JSON.stringify(componentDef, null, 2);
            }
          }
          break;

        case 'moduleListItem':
          elementPath = [];
          parentContext = moduleRep.parsedContent;
          elementYaml = moduleRep.rawContent;
          break;

        default:
          // For other types, try to extract from the element's data
          if (selectedElement.data?.dslObject) {
            elementYaml = JSON.stringify(selectedElement.data.dslObject, null, 2);
            parentContext = selectedElement.data.dslObject;
          }
          break;
      }

      return {
        elementPath,
        parentContext,
        elementYaml
      };
    } catch (error) {
      console.error('Error extracting element context:', error);
      return null;
    }
  }
}; 