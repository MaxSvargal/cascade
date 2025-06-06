// Module Registry Initializer Hook
// Generated from cfv_internal_code.ModuleRegistryService_InitializeFromProps

import { useEffect } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import { DslModuleInput, ComponentSchema } from '@/models/cfv_models_generated';
import { 
  dslModuleRepresentationsAtom, 
  componentSchemasAtom,
  moduleLoadingStatesAtom,
  setModuleRepresentationAtom,
  setComponentSchemasAtom,
  setModuleLoadingAtom
} from '@/state/moduleRegistryAtoms';
import { processSingleModuleInput } from '@/services/moduleRegistryService';

interface UseModuleRegistryInitializerProps {
  initialModules?: DslModuleInput[];
  componentSchemas?: Record<string, ComponentSchema>;
}

export function useModuleRegistryInitializer(props: UseModuleRegistryInitializerProps) {
  const setDslModuleRepresentations = useSetAtom(setModuleRepresentationAtom);
  const setComponentSchemasAction = useSetAtom(setComponentSchemasAtom);
  const setModuleLoading = useSetAtom(setModuleLoadingAtom);
  
  const currentModules = useAtomValue(dslModuleRepresentationsAtom);
  const currentSchemas = useAtomValue(componentSchemasAtom);
  const currentLoadingStates = useAtomValue(moduleLoadingStatesAtom);

  useEffect(() => {
    // Initialize ComponentSchemasAtom from props.componentSchemas
    if (props.componentSchemas && Object.keys(props.componentSchemas).length > 0) {
      setComponentSchemasAction(props.componentSchemas);
    }
  }, [props.componentSchemas, setComponentSchemasAction]);

  useEffect(() => {
    // Process initialModules from props.initialModules
    if (props.initialModules && props.initialModules.length > 0) {
      console.log('🔍 Debug: Processing initial modules:', props.initialModules.length);
      
      const getAtoms = (atom: any) => {
        if (atom === dslModuleRepresentationsAtom || atom === 'dslModuleRepresentationsAtom') return currentModules;
        if (atom === componentSchemasAtom || atom === 'componentSchemasAtom') return currentSchemas;
        if (atom === moduleLoadingStatesAtom || atom === 'moduleLoadingStatesAtom') return currentLoadingStates;
        return {};
      };

      const setAtoms = (atom: any, value: any) => {
        if (atom === dslModuleRepresentationsAtom || atom === 'dslModuleRepresentationsAtom') {
          // Handle function updates properly
          if (typeof value === 'function') {
            const newValue = value(currentModules);
            Object.entries(newValue).forEach(([fqn, moduleRep]) => {
              setDslModuleRepresentations(fqn, moduleRep as any);
            });
          } else if (typeof value === 'object' && value !== null) {
            Object.entries(value).forEach(([fqn, moduleRep]) => {
              setDslModuleRepresentations(fqn, moduleRep as any);
            });
          }
        } else if (atom === componentSchemasAtom || atom === 'componentSchemasAtom') {
          if (typeof value === 'function') {
            const newValue = value(currentSchemas);
            setComponentSchemasAction(newValue);
          } else {
            setComponentSchemasAction(value);
          }
        } else if (atom === moduleLoadingStatesAtom || atom === 'moduleLoadingStatesAtom') {
          // Handle loading states - this is now managed by individual actions
          if (typeof value === 'function') {
            const newValue = value(currentLoadingStates);
            Object.entries(newValue).forEach(([fqn, loading]) => {
              setModuleLoading(fqn, loading as boolean);
            });
          } else if (typeof value === 'object' && value !== null) {
            Object.entries(value).forEach(([fqn, loading]) => {
              setModuleLoading(fqn, loading as boolean);
            });
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
  }, [props.initialModules, currentModules, currentSchemas, currentLoadingStates, setDslModuleRepresentations, setComponentSchemasAction, setModuleLoading]);
}