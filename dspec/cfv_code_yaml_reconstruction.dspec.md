// cfv_code_yaml_reconstruction.dspec.md
// Internal code specifications for YAML Reconstruction logic (cfv_designs.YamlReconstructionService).

code cfv_code.YamlReconstructionService_ReconstructModuleYaml {
    title: "Reconstruct YAML Content from DSL Module Representation"
    part_of_design: cfv_designs.YamlReconstructionService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/YamlReconstructionServiceLogic.ts",
        entry_point_name: "reconstructModuleYaml",
        entry_point_type: "function"
    }
    signature: "(params: { moduleRep: cfv_models.DslModuleRepresentation, options?: cfv_models.ReconstructionOptions }) => string"
    detailed_behavior: `
        // Based on original cfv_internal_code.YamlReconstructionService_ReconstructModule
        // Human Review Focus: YAML structure preservation, configuration merging, error handling.
        // AI Agent Target: Generate valid YAML from module representation.

        DECLARE moduleRep = params.moduleRep
        DECLARE options = params.options OR {}

        IF moduleRep.parsedContent IS_NULL THEN
            CALL AbstractLogger.logError WITH { message: "Module " + moduleRep.fqn + " has no parsed content to reconstruct from. Returning raw content." }
            RETURN_VALUE moduleRep.rawContent // Fallback to raw content if no parsed version
        END_IF

        // Create a new object to be stringified, starting with essential fields.
        // This helps control the order of top-level keys.
        DECLARE yamlObject = {
            dsl_version: moduleRep.parsedContent.dsl_version,
            namespace: moduleRep.parsedContent.namespace
        }

        IF moduleRep.parsedContent.imports IS_PRESENT AND moduleRep.parsedContent.imports.length > 0 THEN
            ASSIGN yamlObject.imports = moduleRep.parsedContent.imports
        END_IF

        // Handle 'definitions' block if it exists and contains components or context
        IF moduleRep.parsedContent.definitions IS_PRESENT THEN
            // Only add 'definitions' key if it has content to avoid empty 'definitions: {}'
            DECLARE definitionsContent = {}
            IF moduleRep.parsedContent.definitions.components IS_PRESENT AND moduleRep.parsedContent.definitions.components.length > 0 THEN
                ASSIGN definitionsContent.components = moduleRep.parsedContent.definitions.components
            END_IF
            IF moduleRep.parsedContent.definitions.context IS_PRESENT AND moduleRep.parsedContent.definitions.context.length > 0 THEN
                ASSIGN definitionsContent.context = moduleRep.parsedContent.definitions.context
            END_IF
            // If 'definitions' has content, add it to yamlObject
            IF Object.keys(definitionsContent).length > 0 THEN
                 ASSIGN yamlObject.definitions = definitionsContent
            END_IF
        END_IF

        // Handle top-level 'components' if they exist (alternative to being under 'definitions')
        IF moduleRep.parsedContent.components IS_PRESENT AND moduleRep.parsedContent.components.length > 0 THEN
            // This assumes components are not also under definitions. If they can be, merge logic is needed.
            ASSIGN yamlObject.components = moduleRep.parsedContent.components
        END_IF

        // Handle 'flows'
        IF moduleRep.parsedContent.flows IS_PRESENT AND moduleRep.parsedContent.flows.length > 0 THEN
            ASSIGN yamlObject.flows = moduleRep.parsedContent.flows
        END_IF
        
        // Merge any other top-level keys from parsedContent that are not explicitly handled above,
        // to preserve unknown or future DSL additions.
        FOR_EACH key, value IN moduleRep.parsedContent
            IF key NOT_IN ['dsl_version', 'namespace', 'imports', 'definitions', 'components', 'flows'] THEN
                ASSIGN yamlObject[key] = value
            END_IF
        END_FOR

        DECLARE yamlStringifyOptions = { indent: options.indentSize OR 2 }
        // More options for yaml.stringify can be added based on cfv_models.ReconstructionOptions
        // (e.g., preserveComments is hard with standard libraries, formatting is also limited).

        TRY
            DECLARE resultYaml = CALL AbstractYamlSerializer.stringify WITH { jsObject: yamlObject, options: yamlStringifyOptions }
            RETURN_VALUE resultYaml
        CATCH_ERROR error
            CALL AbstractLogger.logError WITH { message: "Failed to reconstruct YAML for " + moduleRep.fqn + ": " + error.message }
            THROW_ERROR "YAML Reconstruction Failed: " + error.message // Re-throw to indicate failure
        END_TRY
    `
    dependencies: [
        "cfv_models.DslModuleRepresentation",
        "cfv_models.ReconstructionOptions",
        "AbstractYamlSerializer.stringify",
        "AbstractLogger.logError",
        "Object.keys" // Assumed utility
    ]
}

code cfv_code.YamlReconstructionService_ApplyConfigChangesToRepresentation {
    title: "Apply Configuration Changes to DslModuleRepresentation (Immutable Update)"
    part_of_design: cfv_designs.YamlReconstructionService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/YamlReconstructionServiceLogic.ts",
        entry_point_name: "applyConfigChangesToRepresentation",
        entry_point_type: "function"
    }
    signature: "(params: { moduleRep: cfv_models.DslModuleRepresentation, pathToConfig: (string | number)[], newConfigValue: any }) => cfv_models.DslModuleRepresentation"
    detailed_behavior: `
        // Based on original cfv_internal_code.YamlReconstructionService_ApplyConfigChanges
        // Ensures immutable update of the module representation.
        DECLARE originalModuleRep = params.moduleRep
        DECLARE pathToConfig = params.pathToConfig
        DECLARE newConfigValue = params.newConfigValue

        // Deep clone the module representation to ensure immutability
        // A robust deepClone utility is assumed here.
        DECLARE updatedRep = CALL DeepCloneUtility.clone WITH { object: originalModuleRep }

        IF updatedRep.parsedContent IS_NULL THEN
            CALL AbstractLogger.logError WITH { message: "Cannot apply config changes: moduleRep.parsedContent is null for " + originalModuleRep.fqn }
            RETURN_VALUE originalModuleRep // Or throw error
        END_IF

        // Navigate to the target path within parsedContent and update the value.
        // This requires a helper function to set a nested value immutably.
        // For DSpec, conceptual call:
        TRY
            CALL SetNestedValueImmutableUtility.set WITH {
                obj: updatedRep.parsedContent,
                path: pathToConfig,
                value: newConfigValue
            } ASSIGN_TO updatedRep.parsedContent // Utility returns new top-level object if changes occurred
        CATCH_ERROR e
             CALL AbstractLogger.logError WITH { message: "Failed to apply config to parsedContent for " + originalModuleRep.fqn + ": " + e.message + " Path: " + pathToConfig.join('.') }
             // Decide if to throw or return original. For safety, return original.
             RETURN_VALUE originalModuleRep
        END_TRY

        // Also update the corresponding definition in updatedRep.definitions if applicable.
        // This depends on how pathToConfig relates to the structure within 'definitions'.
        // Example: if path is ['flows', 0, 'steps', 1, 'config', 'timeout'], update the specific step.
        // This logic can be complex and requires careful path traversal and immutable updates within the definitions structure as well.
        // For now, focusing on parsedContent update. A more robust solution would synchronize definitions.
        // A simplified approach: if path starts with 'flows[idx].steps[jdx].config', find that flow/step in definitions.
        IF pathToConfig.length > 0 AND updatedRep.definitions IS_PRESENT THEN
            // TODO: Implement logic to reflect changes in updatedRep.definitions as well,
            // ensuring immutability. This is non-trivial due to potential array/object nesting.
            // For instance, if pathToConfig starts with 'flows', find the flow in updatedRep.definitions.flows,
            // then navigate deeper.
            CALL AbstractLogger.logInfo WITH { message: "Config change applied to parsedContent. Synchronization with 'definitions' block needs careful implementation."}
        END_IF

        // Mark the representation as modified if necessary (e.g., by changing a timestamp or status)
        // updatedRep.lastModified = Date.now(); // Example

        RETURN_VALUE updatedRep
    `
    dependencies: [
        "cfv_models.DslModuleRepresentation",
        "DeepCloneUtility.clone", // Assumed utility for deep cloning
        "SetNestedValueImmutableUtility.set", // Assumed utility for immutable nested updates
        "AbstractLogger.logError",
        "AbstractLogger.logInfo"
    ]
}

code cfv_code.YamlReconstructionService_CreateSavePayload {
    title: "Create SaveModulePayload"
    part_of_design: cfv_designs.YamlReconstructionService
    language: "TypeScript"
    implementation_location: {
        filepath: "services/YamlReconstructionServiceLogic.ts",
        entry_point_name: "createSavePayload",
        entry_point_type: "function"
    }
    signature: "(params: { moduleRep: cfv_models.DslModuleRepresentation, newYamlContent: string, originalPathToConfig?: (string | number)[], originalNewConfigValue?: any }) => cfv_models.SaveModulePayload"
    detailed_behavior: `
        DECLARE savePayload AS cfv_models.SaveModulePayload
        CREATE_INSTANCE cfv_models.SaveModulePayload WITH {
            fqn: params.moduleRep.fqn,
            newContent: params.newYamlContent,
            pathToConfig: params.originalPathToConfig, // Pass along original context of change
            newConfigValue: params.originalNewConfigValue // Pass along original context of change
            // oldConfigValue could be added if tracked and needed by onSaveModule
        } ASSIGN_TO savePayload
        RETURN_VALUE savePayload
    `
    dependencies: ["cfv_models.DslModuleRepresentation", "cfv_models.SaveModulePayload"]
}