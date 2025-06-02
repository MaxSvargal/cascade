### AI Implementation Agent: Prompt Plan for CascadeFlowVisualizer (CFV)

**Overall Goal:** Generate the TypeScript/React/Jotai codebase for the CFV library, adhering to the DSpec suite and guided by `cfv_internal_directives.dspec.md`.

**Phase 1: Initialization and Global Setup**

*   **Prompt Task 1.1: Load and Initialize Directives**
    *   **Agent Action:** Ingest and parse `cfv_internal_directives.CFV_TypeScript_React_Jotai_Generator_Directives`.
    *   **Internal Prompt/Logic:** "Parse the `directive` artifact named `CFV_TypeScript_React_Jotai_Generator_Directives`. Store its `global_settings`, `model_generation` rules, `jotai_patterns`, `react_component_structure`, `abstract_call_implementations`, `nfr_implementation_patterns`, and `error_handling_patterns` in an efficiently accessible internal structure. Validate directive syntax."
    *   **Context DSpecs:** `cfv_internal_directives.dspec.md`
*   **Prompt Task 1.2: Generate TypeScript Models from DSpec**
    *   **Agent Action:** Process `cfv_models.dspec.md` to generate TypeScript interfaces and types.
    *   **Internal Prompt/Logic:** "Iterate through all `model` artifacts in `cfv_models.dspec.md`. For each `model`, generate a TypeScript interface or type alias. Apply naming conventions, field types (mapping DSpec types like `String`, `List`, `cfv_models.Any`, `cfv_models.Function` to TypeScript equivalents), `required` status, and enum constraints as specified in the `directive.model_generation` rules. Handle qualified name references to other models by ensuring correct import paths or type usage. Output to `directive.global_settings.models_output_path` (`./src/models/cfv_models_generated.ts`)."
    *   **Context DSpecs:** `cfv_models.dspec.md`, `cfv_internal_directives.dspec.md` (for `model_generation` rules)
*   **Prompt Task 1.3: Initialize Project Structure (Directories)**
    *   **Agent Action:** Create base output directories based on `directive.global_settings`.
    *   **Internal Prompt/Logic:** "Based on `directive.global_settings` (e.g., `output_base_path`, `state_atoms_output_path_prefix`, `services_output_path_prefix`, `components_output_path_prefix`), create these directories if they don't exist."
    *   **Context DSpecs:** `cfv_internal_directives.dspec.md`

**Phase 2: State Atom Generation**

*   **Prompt Task 2.1: Generate Jotai Atoms**
    *   **Agent Action:** Process `code` artifacts that define Jotai atoms (e.g., `cfv_internal_code.ModuleRegistryService_SharedAtoms`).
    *   **Internal Prompt/Logic:** "Find all `code` artifacts containing `defines_atom` sub-artifacts (or similar constructs indicating state atom definitions). For each `defines_atom <AtomName>`:
        1.  Extract `type`, `initial_value`, `description`.
        2.  Determine the output filepath from the parent `code` spec's `implementation_location.filepath`.
        3.  Use the `directive.jotai_patterns.DEFINE_PRIMITIVE_ATOM` (or derived atom patterns if applicable based on how `initial_value` or getter/setter logic is specified for an atom) to generate the TypeScript code for the atom.
        4.  Ensure necessary imports (e.g., `atom` from `jotai`, types from the generated models file) are included.
        5.  Append to or create the specified output file."
    *   **Context DSpecs:** `cfv_internal_code.dspec.md` (specifically artifacts like `ModuleRegistryService_SharedAtoms`), `cfv_models.dspec.md` (for atom types), `cfv_internal_directives.dspec.md` (for `jotai_patterns`).

**Phase 3: Service Logic Generation**

*   **Prompt Task 3.1: Generate Service Functions/Hooks**
    *   **Agent Action:** Iterate through `code` artifacts in `cfv_internal_code.dspec.md` that represent service logic or React hooks (excluding main UI components for now).
    *   **Internal Prompt/Logic:** "For each `code <CodeUnitName>` artifact (e.g., `cfv_internal_code.ModuleRegistryService_InitializeFromProps`, `cfv_internal_code.ModuleRegistryService_RequestAndProcessModule`):
        1.  Retrieve its `implementation_location`, `signature`, `detailed_behavior`, `dependencies`, `applies_nfrs`, and `language`.
        2.  **File Setup:** Determine output file. Generate initial imports.
        3.  **Signature:** Implement the function/hook signature, translating DSpec types to TypeScript.
        4.  **Detailed Behavior Translation:**
            *   Parse the `detailed_behavior` pseudocode.
            *   For each statement (e.g., `CALL`, `IF`, `CREATE_INSTANCE`, `READ_ATOM`, `WRITE_ATOM`, `RETURN_VALUE`):
                *   Map it to TypeScript code using corresponding patterns from `cfv_internal_directives.dspec.md` (e.g., `abstract_call_implementations`, `jotai_patterns`, `error_handling_patterns`).
                *   Manage variable declarations and scoping.
                *   Resolve qualified names for models, other code units, or abstract dependencies.
        5.  **NFR Application:** If `applies_nfrs` is present, consult `directive.nfr_implementation_patterns` and apply relevant code transformations or wrappers.
        6.  **Dependency Imports:** Collect all necessary imports for types, Jotai functions, libraries from directives, and other internal services/atoms.
        7.  **Output:** Format and write the generated code to the specified `implementation_location.filepath`, exporting the `entry_point_name`.
    *   **Context DSpecs:** `cfv_internal_code.dspec.md`, `cfv_models.dspec.md`, `cfv_designs.dspec.md` (for context), `cfv_policies.dspec.md` (for NFRs), `cfv_internal_directives.dspec.md`.

**Phase 4: Main UI Component Generation**

*   **Prompt Task 4.1: Generate Main CascadeFlowVisualizer Component**
    *   **Agent Action:** Process the `code` spec for the main UI component (e.g., `cfv_internal_code.CascadeFlowVisualizerComponent_Main`).
    *   **Internal Prompt/Logic:** "Process `code cfv_internal_code.CascadeFlowVisualizerComponent_Main`:
        1.  **Shell & Props:** Use `directive.react_component_structure.default_functional_component_shell`. Populate `{{props_interface_content}}` by translating the `signature` (which refers to `cfv_models.CascadeFlowVisualizerProps`) into TypeScript interface fields.
        2.  **Hooks & Logic (from `detailed_behavior`):**
            *   Translate `CALL ... HOOK` statements using custom hook generation logic or by ensuring the referenced hook (another `code` spec) is imported and called.
            *   Translate `DEFINE_DERIVED_ATOM_READ_ONLY` (if used directly in component `detailed_behavior` for local derived state, though usually atoms are separate) using `directive.jotai_patterns`. The `{{getter_logic}}` placeholder in the directive template would be filled by translating the DSpec pseudocode for the getter.
            *   Translate `USE_ATOM`, `USE_EFFECT`, `USE_CALLBACK`, `USE_MEMO` statements into React hook calls using `directive.react_component_structure` patterns. The logic within these hooks comes from the `detailed_behavior`.
        3.  **JSX Rendering (from `detailed_behavior`):**
            *   Translate `RENDER_JSX ...` blocks. This is complex. The agent needs to:
                *   Parse the DSpec JSX-like syntax.
                *   Map component names to imported components (either custom from props or internal sub-components).
                *   Translate prop assignments, ensuring variables are correctly referenced.
                *   Handle conditional rendering (`IF ... RENDER_JSX ... END_IF`).
                *   Handle loops for rendering lists (`FOR_EACH ... RENDER_JSX ... END_FOR`).
        4.  **Event Handlers:** Translate `ON_CLICK ... DO ...` or similar event handling logic from `detailed_behavior` into functions, potentially wrapped in `useCallback`.
        5.  **NFRs & Imports:** Apply NFRs (e.g., `React.memo` is default via directive). Collect all imports.
        6.  **Output:** Format and write to `implementation_location.filepath`.
    *   **Context DSpecs:** `cfv_internal_code.dspec.md` (for `CascadeFlowVisualizerComponent_Main`), `cfv_models.dspec.md` (for props), `cfv_designs.dspec.md` (for overall structure), `cfv_internal_directives.dspec.md`.

**Phase 5: Sub-Component Generation (If Any)**

*   **Prompt Task 5.1: Generate UI Sub-Components**
    *   **Agent Action:** If `cfv_internal_code.dspec.md` defines separate `code` specs for internal UI sub-components (e.g., `LeftSidebarComponent`, `MainCanvasComponent` if they have significant logic beyond simple JSX structure), process them similarly to Prompt Task 4.1.
    *   **Internal Prompt/Logic:** Same as 4.1, but for each sub-component `code` spec. These would be imported and used by `CascadeFlowVisualizerComponent_Main`.
    *   **Context DSpecs:** `cfv_internal_code.dspec.md`, `cfv_models.dspec.md`, `cfv_internal_directives.dspec.md`.

**Phase 6: Utility and Helper Function Generation**

*   **Prompt Task 6.1: Generate Utility Functions**
    *   **Agent Action:** If `cfv_internal_code.dspec.md` contains `code` specs for standalone utility functions (not tied to a specific service or component, e.g., complex data transformers used by multiple parts).
    *   **Internal Prompt/Logic:** Similar to Prompt Task 3.1, but for generic utility functions.
    *   **Context DSpecs:** `cfv_internal_code.dspec.md`, `cfv_models.dspec.md`, `cfv_internal_directives.dspec.md`.

**Phase 7: Finalization and Reporting**

*   **Prompt Task 7.1: Generate Barrel Files / Index Files (Optional)**
    *   **Agent Action:** Based on a directive, create `index.ts` files for easier importing from generated modules (e.g., `src/services/index.ts` exporting all service functions).
    *   **Internal Prompt/Logic:** "Scan generated files in specified directories (e.g., `services_output_path_prefix`). Create an `index.ts` file in each, exporting all public members from the files within that directory. This requires a `directive.barrel_file_generation` rule."
    *   **Context DSpecs:** `cfv_internal_directives.dspec.md`.
*   **Prompt Task 7.2: Final Code Formatting Pass (Optional)**
    *   **Agent Action:** If a global formatter (e.g., Prettier) is configured and not run per file, run it across the entire `directive.global_settings.output_base_path`.
    *   **Internal Prompt/Logic:** "Execute `{{formatter_command}} {{output_base_path}}` based on `directive.global_settings.default_prettier_config_path`."
    *   **Context DSpecs:** `cfv_internal_directives.dspec.md`.
*   **Prompt Task 7.3: Generate Summary Report**
    *   **Agent Action:** Output a report summarizing the generation process.
    *   **Internal Prompt/Logic:** "Report:
        *   List of all `code` artifacts processed and their output file locations.
        *   List of any `code` artifacts skipped (e.g., due to `escape_hatch`).
        *   Any errors encountered (e.g., missing directives, unresolvable `detailed_behavior` parts).
        *   Warnings (e.g., ambiguous DSpec, potential directive misapplication).
        *   Statistics (files generated, LoC - approximate)."

---

**Error Handling Strategy for the Agent during this Plan:**

*   **Missing Directive:** If `detailed_behavior` uses an abstract operation (e.g., `PERSIST_TO_ELASTIC_DB`) for which no pattern exists in `cfv_internal_directives.dspec.md`, the agent should:
    1.  Log a critical error, naming the `code` spec and the missing abstract operation.
    2.  Attempt to generate a placeholder comment in the code: `// TODO: Implement logic for "PERSIST_TO_ELASTIC_DB" - No directive found.`
    3.  Continue processing other parts if possible, but flag the overall generation for this `code` unit as incomplete/failed.
*   **Ambiguous DSpec:** If `detailed_behavior` is too vague for the agent's parsing capabilities (even with directives), it should log a warning and potentially insert a more generic placeholder or skip that part of the logic.
*   **Link Resolution Failure:** If a qualified name (e.g., to a model, another code unit) cannot be resolved by the ISE, this is a critical error. The agent should report it and likely halt generation for the dependent artifact. (SVS should catch most of these beforehand).

# Inspector Tab Architecture Fix - Implementation Plan

## Overview
This plan addresses the critical architectural issues identified in the CascadeFlowVisualizer inspector tabs, including redundant functionality, broken Data I/O implementation, and poor separation of concerns.

## Critical Issues Identified

### 1. **Data I/O Tab Bug** 
- **Problem**: Always passes `null` to `renderInspectorDataIOTab`
- **Root Cause**: Hardcoded `null` instead of finding relevant `StepExecutionTrace`
- **Impact**: Tab shows "No trace data available" even when trace data exists

### 2. **Properties vs Source Tab Redundancy**
- **Problem**: Both show same DSL data in different formats
- **Root Cause**: Poor separation of concerns
- **Impact**: Confusing UX, redundant functionality

### 3. **Debugging vs Data I/O Overlap**
- **Problem**: Debugging tab already shows input/output data
- **Root Cause**: Feature creep without architectural planning
- **Impact**: Duplicate functionality, user confusion

### 4. **Field Naming Inconsistency**
- **Problem**: `inputData/outputData` vs `executionInputData/executionOutputData`
- **Root Cause**: Inconsistent specification implementation
- **Impact**: Developer confusion, potential bugs

### 5. **Too Many Inspector Tabs**
- **Problem**: 5 tabs with overlapping functionality
- **Root Cause**: Additive development without consolidation
- **Impact**: Poor UX, maintenance burden

## Solution Architecture

### New Consolidated Tab Structure

#### **1. Properties Tab** (Component-Level)
- **Purpose**: Interactive configuration editor for selected component
- **Features**:
  - Form-based editor generated from component schema
  - Live YAML preview of changes
  - Context variable editing and validation
  - Inline validation with error display
  - Split-pane layout (form + preview)

#### **2. Source Tab** (Module-Level)
- **Purpose**: Full module YAML context viewer
- **Features**:
  - Complete module YAML display
  - Selected element highlighting within context
  - YAML navigation (line numbers, search, folding)
  - Diff view for editing mode
  - Export/copy functionality

#### **3. Data Flow Tab** (Flow-Level Analysis)
- **Purpose**: Flow-level data analysis and debugging
- **Features**:
  - Flow execution overview and metrics
  - Step execution timeline
  - Data lineage visualization
  - Critical path analysis
  - Error analysis with stack traces
  - Execution comparison tools
  - Step-by-step data inspection
  - Execution replay

#### **4. Testing Tab** (Flow-Level Testing)
- **Purpose**: Comprehensive property testing interface
- **Features**:
  - Test case creation and management
  - Template generation for common scenarios
  - Assertion builder with JMESPath
  - Component mock configuration
  - Test execution and results
  - Coverage analysis
  - Regression testing

## Implementation Plan

### Phase 1: Field Naming Standardization (1-2 days)

#### 1.1 Update Models
- [ ] Standardize `StepExecutionTrace` to use `inputData/outputData`
- [ ] Standardize node data to use `executionInputData/executionOutputData`
- [ ] Update generated TypeScript models
- [ ] Update all documentation

#### 1.2 Update Implementation
- [ ] Fix field access in `graphBuilderService.ts`
- [ ] Update trace visualization service
- [ ] Update all component implementations
- [ ] Add backward compatibility layer

### Phase 2: Fix Data I/O Tab Bug (1 day)

#### 2.1 Immediate Fix
```typescript
// In CascadeFlowVisualizer.tsx
const selectedStepTrace = useMemo(() => {
  if (!selectedElement || !props.traceData || selectedElement.sourceType !== 'flowNode') {
    return null;
  }
  return props.traceData.steps.find(step => step.stepId === selectedElement.id) || null;
}, [selectedElement, props.traceData]);

// Replace line 572:
{props.renderInspectorDataIOTab(selectedStepTrace, moduleRegistry)}
```

#### 2.2 Add Selection Context
- [ ] Track selected step trace in state
- [ ] Update when element selection changes
- [ ] Handle mode changes (design vs trace)

### Phase 3: Implement New Tab Architecture (3-5 days)

#### 3.1 Create New Tab Components
- [ ] `renderInspectorDataFlowTab` implementation
- [ ] `renderInspectorTestingTab` implementation
- [ ] Enhanced `renderInspectorPropertiesTab`
- [ ] Enhanced `renderInspectorSourceTab`

#### 3.2 Update Main Component
```typescript
// New tab structure
const [activeInspectorTab, setActiveInspectorTab] = React.useState<
  'properties' | 'source' | 'dataflow' | 'testing'
>('properties');

// Tab navigation
{['properties', 'source', 'dataflow', 'testing'].map(tab => (
  <button key={tab} onClick={() => setActiveInspectorTab(tab as any)}>
    {tab === 'dataflow' ? 'Data Flow' : 
     tab.charAt(0).toUpperCase() + tab.slice(1)}
  </button>
))}
```

#### 3.3 Implement Data Flow Analysis
- [ ] Create `FlowDataAnalysisActions` implementation
- [ ] Add data lineage calculation
- [ ] Add critical path analysis
- [ ] Add execution comparison tools

### Phase 4: Enhanced Properties Tab (2-3 days)

#### 4.1 Form Generation
- [ ] Integrate with `@rjsf/core` for schema-based forms
- [ ] Add custom field components for common types
- [ ] Implement validation with error display

#### 4.2 Live YAML Preview
- [ ] Add split-pane layout
- [ ] Implement real-time YAML generation
- [ ] Add syntax highlighting
- [ ] Show diff when editing

#### 4.3 Context Variable Support
- [ ] Display context variable usages
- [ ] Allow editing of context variables
- [ ] Validate context variable references

### Phase 5: Enhanced Source Tab (1-2 days)

#### 5.1 Full Module Display
- [ ] Show complete module YAML
- [ ] Highlight selected element section
- [ ] Add line numbers and navigation

#### 5.2 Advanced Features
- [ ] Add search functionality
- [ ] Implement code folding
- [ ] Add export/copy options
- [ ] Show diff view in edit mode

### Phase 6: Testing Tab Implementation (3-4 days)

#### 6.1 Test Case Management
- [ ] Create test case editor interface
- [ ] Implement test template generation
- [ ] Add test case validation

#### 6.2 Assertion Builder
- [ ] Create JMESPath selector UI
- [ ] Add comparison operator selection
- [ ] Implement assertion validation

#### 6.3 Test Execution
- [ ] Integrate with `onRunTestCase` callback
- [ ] Display test results with details
- [ ] Add test history and comparison

### Phase 7: Legacy Tab Deprecation (1 day)

#### 7.1 Backward Compatibility
- [ ] Keep legacy tab props functional
- [ ] Add deprecation warnings in dev mode
- [ ] Update documentation with migration guide

#### 7.2 Migration Support
- [ ] Create migration utilities
- [ ] Provide example implementations
- [ ] Update consumer examples

### Phase 8: Testing & Documentation (2-3 days)

#### 8.1 Comprehensive Testing
- [ ] Unit tests for new tab components
- [ ] Integration tests for tab switching
- [ ] E2E tests for complete workflows

#### 8.2 Documentation Updates
- [ ] Update README with new tab structure
- [ ] Create migration guide
- [ ] Update consumer directives
- [ ] Add usage examples

## File Changes Required

### Core Implementation Files
- `src/components/CascadeFlowVisualizer.tsx` - Main tab structure
- `src/models/cfv_models_generated.ts` - Updated interfaces
- `src/services/graphBuilderService.ts` - Field naming fixes
- `src/services/traceVisualizationService.ts` - Field naming fixes

### New Service Files
- `src/services/dataFlowAnalysisService.ts` - Data flow analysis
- `src/services/testCaseService.ts` - Test case management
- `src/services/yamlReconstructionService.ts` - Enhanced YAML handling

### Example Implementation Files
- `src/app/page.tsx` - Updated tab renderers
- `src/app/casino-demo/page.tsx` - Updated tab renderers

### Documentation Files
- `dspec/cfv_models.dspec.md` - ✅ Updated
- `dspec/cfv_consumer_directives.dspec.md` - ✅ Updated
- `dspec/cfv_requirements.dspec.md` - ✅ Updated
- `dspec/README.md` - Needs update

## Success Criteria

### Functional Requirements
- [ ] Data I/O tab shows actual trace data when available
- [ ] Properties tab provides interactive configuration editing
- [ ] Source tab shows full module context with highlighting
- [ ] Data Flow tab provides comprehensive flow analysis
- [ ] Testing tab supports complete test lifecycle
- [ ] All field naming is consistent across codebase

### Quality Requirements
- [ ] No duplicate functionality between tabs
- [ ] Clear separation between component-level and flow-level features
- [ ] Backward compatibility maintained for existing consumers
- [ ] Performance impact minimal (< 100ms tab switching)
- [ ] Accessibility standards met (keyboard navigation, screen readers)

### User Experience Requirements
- [ ] Tab purpose is immediately clear to users
- [ ] Navigation between tabs is intuitive
- [ ] Information is progressively disclosed
- [ ] Error states are handled gracefully
- [ ] Loading states provide appropriate feedback

## Risk Mitigation

### Breaking Changes
- **Risk**: Existing consumers break with new tab structure
- **Mitigation**: Maintain backward compatibility, provide migration guide

### Performance Impact
- **Risk**: New features slow down the visualizer
- **Mitigation**: Lazy load tab content, optimize rendering

### Complexity Increase
- **Risk**: New architecture is too complex for consumers
- **Mitigation**: Provide comprehensive examples and documentation

## Timeline Estimate

**Total: 12-18 days**

- Phase 1: Field Naming (1-2 days)
- Phase 2: Data I/O Fix (1 day)
- Phase 3: New Architecture (3-5 days)
- Phase 4: Properties Tab (2-3 days)
- Phase 5: Source Tab (1-2 days)
- Phase 6: Testing Tab (3-4 days)
- Phase 7: Deprecation (1 day)
- Phase 8: Testing & Docs (2-3 days)

## Next Steps

1. **Review and approve this plan** with stakeholders
2. **Start with Phase 1** (field naming) as it's foundational
3. **Implement Phase 2** (Data I/O fix) for immediate user value
4. **Proceed with remaining phases** in order
5. **Gather feedback** after each phase for course correction
