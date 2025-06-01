// Module Registry Initializer Hook
// From cfv_internal_code.ModuleRegistryService_InitializeFromProps

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { dslModuleRepresentationsAtom, componentSchemasAtom } from '@/state/moduleRegistryAtoms';
import { DslModuleInput, ComponentSchema } from '@/models/cfv_models_generated';
import { processSingleModuleInput } from '@/services/moduleRegistryService';

interface UseModuleRegistryInitializerProps {
  initialModules?: DslModuleInput[];
  componentSchemas?: Record<string, ComponentSchema>;
}

export function useModuleRegistryInitializer(props: UseModuleRegistryInitializerProps) {
  const setDslModuleRepresentations = useSetAtom(dslModuleRepresentationsAtom);
  const setComponentSchemas = useSetAtom(componentSchemasAtom);

  useEffect(() => {
    // 1. Initialize ComponentSchemasAtom from props.componentSchemas
    if (props.componentSchemas) {
      setComponentSchemas(props.componentSchemas);
    }
  }, [props.componentSchemas, setComponentSchemas]);

  useEffect(() => {
    // 2. Process initialModules from props.initialModules
    if (props.initialModules) {
      const initialModuleReps: Record<string, any> = {};
      
      props.initialModules.forEach(moduleInput => {
        // Simple get/set functions for the processing function
        const getAtoms = (atomName: string) => {
          // This is a simplified implementation - in a real scenario,
          // we'd need proper atom access
          return {};
        };
        
        const setAtoms = (atomName: string, value: any) => {
          // This will be handled by the processSingleModuleInput function
          // which will call setDslModuleRepresentations
        };

        const processedModuleRep = processSingleModuleInput(
          moduleInput, 
          true, 
          getAtoms, 
          (atomName: string, updater: any) => {
            if (atomName === 'dslModuleRepresentationsAtom') {
              if (typeof updater === 'function') {
                setDslModuleRepresentations(prev => updater(prev));
              } else {
                setDslModuleRepresentations(updater);
              }
            }
          }
        );

        if (processedModuleRep) {
          initialModuleReps[moduleInput.fqn] = processedModuleRep;
        }
      });
    }
  }, [props.initialModules, setDslModuleRepresentations]);
} 