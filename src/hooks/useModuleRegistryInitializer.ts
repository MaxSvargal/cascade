// Module Registry Initializer Hook
// Generated from cfv_internal_code.ModuleRegistryService_InitializeFromProps

import { useEffect } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import { DslModuleInput, ComponentSchema } from '@/models/cfv_models_generated';
import { 
  dslModuleRepresentationsAtom, 
  componentSchemasAtom,
  activeModuleLoadRequestsAtom 
} from '@/state/moduleRegistryAtoms';
import { processSingleModuleInput } from '@/services/moduleRegistryService';

interface UseModuleRegistryInitializerProps {
  initialModules?: DslModuleInput[];
  componentSchemas?: Record<string, ComponentSchema>;
}

export function useModuleRegistryInitializer(props: UseModuleRegistryInitializerProps) {
  const setDslModuleRepresentations = useSetAtom(dslModuleRepresentationsAtom);
  const setComponentSchemas = useSetAtom(componentSchemasAtom);
  const setActiveModuleLoadRequests = useSetAtom(activeModuleLoadRequestsAtom);
  
  const currentModules = useAtomValue(dslModuleRepresentationsAtom);
  const currentSchemas = useAtomValue(componentSchemasAtom);

  useEffect(() => {
    // Initialize ComponentSchemasAtom from props.componentSchemas
    if (props.componentSchemas && Object.keys(props.componentSchemas).length > 0) {
      setComponentSchemas(props.componentSchemas);
    }
  }, [props.componentSchemas, setComponentSchemas]);

  useEffect(() => {
    // Process initialModules from props.initialModules
    if (props.initialModules && props.initialModules.length > 0) {
      console.log('🔍 Debug: Processing initial modules:', props.initialModules.length);
      
      const getAtoms = (atom: any) => {
        if (atom === dslModuleRepresentationsAtom || atom === 'dslModuleRepresentationsAtom') return currentModules;
        if (atom === componentSchemasAtom || atom === 'componentSchemasAtom') return currentSchemas;
        if (atom === activeModuleLoadRequestsAtom || atom === 'activeModuleLoadRequestsAtom') return {};
        return {};
      };

      const setAtoms = (atom: any, value: any) => {
        if (atom === dslModuleRepresentationsAtom || atom === 'dslModuleRepresentationsAtom') {
          if (typeof value === 'function') {
            setDslModuleRepresentations(value);
          } else {
            setDslModuleRepresentations(value);
          }
        } else if (atom === componentSchemasAtom || atom === 'componentSchemasAtom') {
          if (typeof value === 'function') {
            setComponentSchemas(value);
          } else {
            setComponentSchemas(value);
          }
        } else if (atom === activeModuleLoadRequestsAtom || atom === 'activeModuleLoadRequestsAtom') {
          if (typeof value === 'function') {
            setActiveModuleLoadRequests(value);
          } else {
            setActiveModuleLoadRequests(value);
          }
        }
      };

      // Process each initial module
      for (const moduleInput of props.initialModules) {
        // Only process if not already loaded
        if (!currentModules[moduleInput.fqn]) {
          console.log('🔍 Debug: Processing module:', moduleInput.fqn);
          try {
            processSingleModuleInput(moduleInput, true, getAtoms, setAtoms);
          } catch (error) {
            console.error(`Failed to process initial module ${moduleInput.fqn}:`, error);
          }
        } else {
          console.log('🔍 Debug: Module already loaded:', moduleInput.fqn);
        }
      }
    } else {
      console.log('🔍 Debug: No initial modules provided');
    }
  }, [props.initialModules, currentModules, currentSchemas, setDslModuleRepresentations, setComponentSchemas, setActiveModuleLoadRequests]);
}