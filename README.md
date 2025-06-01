# CascadeFlowVisualizer

A React-based library for visualizing and interacting with Cascade DSL V1.1 documents, built with Next.js, TypeScript, Jotai, and React Flow.

## Overview

The CascadeFlowVisualizer is an IDE-like visual environment that provides:

- **Interactive Flow Visualization**: View individual flows with their steps, triggers, and data/control flow connections
- **System Overview**: High-level visualization of all flows and their relationships across modules
- **Module Management**: Load, parse, and manage multiple DSL modules with import resolution
- **Debugging Support**: Overlay execution traces on flow visualizations
- **Property Testing**: Define and execute test cases against flow definitions
- **Extensible Rendering**: Consumer-provided components for custom node/edge rendering and inspector tabs

## Architecture

The implementation follows the DSpec-driven architecture with these key components:

### Core Components

- **CascadeFlowVisualizer**: Main React component providing the IDE-like interface
- **ModuleRegistryService**: Manages DSL module loading, parsing, and resolution
- **GraphBuilderService**: Transforms DSL data into React Flow nodes and edges
- **State Management**: Jotai atoms for reactive state management

### Key Features Implemented

✅ **Phase 1: Initialization and Global Setup**
- TypeScript models generated from DSpec specifications
- Project structure with Next.js and pnpm
- Jotai state atoms for module registry, navigation, and trace data

✅ **Phase 2: State Atom Generation**
- Module registry atoms (loaded modules, component schemas, loading states)
- Navigation atoms (current flow, system view, selected elements)
- Trace list atoms for historical flow runs

✅ **Phase 3: Service Logic Generation**
- Module loading and processing with YAML parsing
- Component resolution across modules with import handling
- Module registry interface implementation

✅ **Phase 4: Main UI Component Generation**
- Multi-pane IDE layout (Left Sidebar, Main Canvas, Right Sidebar)
- React Flow integration with custom node/edge types
- Inspector tabs with consumer-provided renderers

✅ **Phase 5: Example Components**
- Basic step node and trigger node components
- Flow edge component with data/control flow styling
- Demo page with sample DSL data

## Project Structure

```
src/
├── models/
│   └── cfv_models_generated.ts    # Generated TypeScript interfaces
├── state/
│   ├── moduleRegistryAtoms.ts     # Module registry state atoms
│   ├── navigationAtoms.ts         # Navigation state atoms
│   └── traceListAtoms.ts          # Trace list state atoms
├── services/
│   ├── moduleRegistryService.ts   # Module loading and management
│   └── graphBuilderService.ts     # Graph data generation
├── hooks/
│   └── useModuleRegistryInitializer.ts  # Module initialization hook
├── components/
│   ├── CascadeFlowVisualizer.tsx  # Main component
│   ├── nodes/
│   │   ├── StepNode.tsx           # Step node component
│   │   └── TriggerNode.tsx        # Trigger node component
│   └── edges/
│       └── FlowEdge.tsx           # Flow edge component
└── app/
    ├── layout.tsx                 # Next.js layout
    └── page.tsx                   # Demo page
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Visit `http://localhost:3000` to see the demo.

### Usage

```tsx
import CascadeFlowVisualizer from '@/components/CascadeFlowVisualizer';
import { CascadeFlowVisualizerProps } from '@/models/cfv_models_generated';

const props: CascadeFlowVisualizerProps = {
  // Core Data & Loading
  initialModules: [/* DSL modules */],
  requestModule: async (fqn) => { /* fetch module */ },
  componentSchemas: { /* component schemas */ },
  parseContextVariables: (value) => { /* parse context vars */ },

  // Mode & Data
  mode: 'design',
  designData: {
    initialViewMode: 'flowDetail',
    initialFlowFqn: 'com.example.MyFlow'
  },

  // Customization
  customNodeTypes: { /* custom node components */ },
  customEdgeTypes: { /* custom edge components */ },
  renderInspectorPropertiesTab: (element, actions, registry) => { /* custom tab */ },

  // Callbacks
  onViewChange: (view) => { /* handle view changes */ },
  onElementSelect: (element) => { /* handle selection */ }
};

<CascadeFlowVisualizer {...props} />
```

## Key Features

### Module Management

- Load DSL modules via `initialModules` prop or `requestModule` callback
- Parse YAML content and extract flow/component/context definitions
- Handle imports and aliases between modules
- Error handling for parsing failures and missing modules

### Graph Visualization

- **Flow Detail View**: Shows individual flow structure with steps, triggers, and connections
- **System Overview**: Shows all flows and their relationships across modules
- Automatic layout using ELK.js (planned)
- Custom node and edge rendering via consumer-provided components

### Inspector Interface

- Context-sensitive display for selected elements
- Tabbed interface with consumer-provided renderers:
  - Properties/Config tab for editing
  - Source tab for DSL viewing
  - Data I/O tab for trace data
  - Context Variables tab
  - Test Definition tab
  - Assertion Results tab

### State Management

- Jotai atoms for granular reactivity
- Derived atoms for computed state (current graph data)
- Proper initialization from props
- State synchronization with callbacks

## Implementation Status

### Completed (Phase 1-4)
- ✅ TypeScript model generation from DSpec
- ✅ Jotai state atom structure
- ✅ Module registry service with YAML parsing
- ✅ Graph builder service for React Flow data
- ✅ Main CascadeFlowVisualizer component
- ✅ Basic node and edge components
- ✅ Demo page with sample data

### Planned (Phase 5-7)
- 🔄 ELK.js layout integration
- 🔄 Advanced component resolution with imports
- 🔄 Save functionality with YAML reconstruction
- 🔄 Trace visualization overlays
- 🔄 Property testing interface
- 🔄 Error handling improvements
- 🔄 Performance optimizations

## Architecture Decisions

Following the DSpec policies:

- **React Flow + ELK.js Foundation**: Core graph rendering with automatic layout
- **Module-Centric**: Full awareness of DSL modules and import resolution
- **Component Schemas Upfront**: Pre-loaded schemas for synchronous access
- **Jotai State Management**: Atomic, reactive state management
- **Externalized Visuals**: Consumer-provided rendering components
- **Functional Purity**: Pure functions for data transformation

## Contributing

This implementation follows the DSpec-driven development approach. Key specifications:

- `cfv_models.dspec.md`: TypeScript interface definitions
- `cfv_internal_code.dspec.md`: Service logic specifications
- `cfv_designs.dspec.md`: Architectural design decisions
- `cfv_requirements.dspec.md`: Functional requirements
- `cfv_policies.dspec.md`: Non-functional requirements and policies

## License

MIT License 