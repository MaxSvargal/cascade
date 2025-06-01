// Main CascadeFlowVisualizer React Component
// From cfv_internal_code.CascadeFlowVisualizerComponent_Main

import React, { useEffect, useMemo, useCallback } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atom } from 'jotai';
import ReactFlow, { 
  ReactFlowProvider, 
  Controls, 
  Background, 
  MiniMap,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge
} from 'reactflow';

import { CascadeFlowVisualizerProps, SelectedElement } from '@/models/cfv_models_generated';
import { useModuleRegistryInitializer } from '@/hooks/useModuleRegistryInitializer';
import { 
  dslModuleRepresentationsAtom, 
  componentSchemasAtom 
} from '@/state/moduleRegistryAtoms';
import { 
  currentFlowFqnAtom, 
  systemViewActiveAtom, 
  selectedElementAtom 
} from '@/state/navigationAtoms';
import { 
  generateFlowDetailGraphData, 
  generateSystemOverviewGraphData,
  GraphData 
} from '@/services/graphBuilderService';
import { createModuleRegistryInterface } from '@/services/moduleRegistryService';

import 'reactflow/dist/style.css';

// Derived atom for current graph data
const currentGraphDataAtom = atom<GraphData>((get) => {
  const currentFlowFqn = get(currentFlowFqnAtom);
  const systemViewActive = get(systemViewActiveAtom);
  const dslModuleRepresentations = get(dslModuleRepresentationsAtom);
  const componentSchemas = get(componentSchemasAtom);

  // Create module registry interface
  const moduleRegistry = createModuleRegistryInterface((atomRef) => {
    if (atomRef === 'dslModuleRepresentationsAtom') return dslModuleRepresentations;
    if (atomRef === 'componentSchemasAtom') return componentSchemas;
    return {};
  });

  // Simple context variable parser (would be replaced by props.parseContextVariables)
  const parseContextVars = (value: string): string[] => {
    const matches = value.match(/\$\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(2, -1)) : [];
  };

  if (systemViewActive) {
    return generateSystemOverviewGraphData(moduleRegistry, parseContextVars);
  } else if (currentFlowFqn) {
    return generateFlowDetailGraphData({
      flowFqn: currentFlowFqn,
      mode: 'design', // Would come from props
      moduleRegistry,
      parseContextVarsFn: parseContextVars,
      componentSchemas
    });
  }

  return { nodes: [], edges: [] };
});

const CascadeFlowVisualizer: React.FC<CascadeFlowVisualizerProps> = (props) => {
  // Initialize module registry from props
  useModuleRegistryInitializer({
    initialModules: props.initialModules,
    componentSchemas: props.componentSchemas
  });

  // State atoms
  const [currentFlowFqn, setCurrentFlowFqn] = useAtom(currentFlowFqnAtom);
  const [systemViewActive, setSystemViewActive] = useAtom(systemViewActiveAtom);
  const [selectedElement, setSelectedElement] = useAtom(selectedElementAtom);
  const currentGraphData = useAtomValue(currentGraphDataAtom);
  const dslModuleRepresentations = useAtomValue(dslModuleRepresentationsAtom);

  // Initialize from design data
  useEffect(() => {
    if (props.designData) {
      if (props.designData.initialFlowFqn) {
        setCurrentFlowFqn(props.designData.initialFlowFqn);
      }
      if (props.designData.initialViewMode) {
        setSystemViewActive(props.designData.initialViewMode === 'systemOverview');
      }
    }
  }, [props.designData, setCurrentFlowFqn, setSystemViewActive]);

  // Effect for props.onViewChange
  useEffect(() => {
    if (props.onViewChange) {
      props.onViewChange({
        mode: props.mode,
        currentFlowFqn: currentFlowFqn || undefined,
        systemViewActive
      });
    }
  }, [props.mode, currentFlowFqn, systemViewActive, props.onViewChange]);

  // Effect for props.onElementSelect
  useEffect(() => {
    if (props.onElementSelect) {
      props.onElementSelect(selectedElement);
    }
  }, [selectedElement, props.onElementSelect]);

  // Node click handler
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const newSelectedElement: SelectedElement = {
      sourceType: node.type === 'systemFlowNode' ? 'systemFlowNode' : 'flowNode',
      id: node.id,
      data: node.data,
      moduleFqn: currentFlowFqn?.split('.').slice(0, -1).join('.')
    };
    setSelectedElement(newSelectedElement);
  }, [currentFlowFqn, setSelectedElement]);

  // Flow navigation handler
  const handleFlowNavigation = useCallback((flowFqn: string) => {
    setCurrentFlowFqn(flowFqn);
    setSystemViewActive(false);
  }, [setCurrentFlowFqn, setSystemViewActive]);

  // System view toggle
  const handleSystemViewToggle = useCallback(() => {
    setSystemViewActive(!systemViewActive);
    setCurrentFlowFqn(null);
  }, [systemViewActive, setSystemViewActive, setCurrentFlowFqn]);

  // React Flow state management
  const [nodes, setNodes] = React.useState<Node[]>([]);
  const [edges, setEdges] = React.useState<Edge[]>([]);

  // Update nodes and edges when graph data changes
  useEffect(() => {
    setNodes(currentGraphData.nodes);
    setEdges(currentGraphData.edges);
  }, [currentGraphData]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  // Module registry interface for inspector tabs
  const moduleRegistry = useMemo(() => {
    return createModuleRegistryInterface((atomRef) => {
      if (atomRef === 'dslModuleRepresentationsAtom') return dslModuleRepresentations;
      if (atomRef === 'componentSchemasAtom') return props.componentSchemas || {};
      return {};
    });
  }, [dslModuleRepresentations, props.componentSchemas]);

  // Inspector actions
  const inspectorActions = useMemo(() => ({
    requestSave: (newConfigValue: any, pathToConfig: (string | number)[]) => {
      // TODO: Implement save logic
      console.log('Save requested:', { newConfigValue, pathToConfig });
    }
  }), []);

  return (
    <div className={props.className} style={props.style}>
      <div style={{ display: 'flex', height: '100vh' }}>
        {/* Left Sidebar */}
        <div style={{ width: '300px', borderRight: '1px solid #ccc', padding: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <button onClick={handleSystemViewToggle}>
              {systemViewActive ? 'Flow Detail View' : 'System Overview'}
            </button>
          </div>
          
          {/* Modules List */}
          <div style={{ marginBottom: '16px' }}>
            <h3>Modules</h3>
            {Object.values(dslModuleRepresentations).map(module => (
              <div key={module.fqn} style={{ padding: '4px', cursor: 'pointer' }}>
                <div>{module.fqn}</div>
                {module.status === 'error' && (
                  <div style={{ color: 'red', fontSize: '12px' }}>
                    {module.errors?.[0]?.message}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Flows List */}
          <div>
            <h3>Flows</h3>
            {Object.values(dslModuleRepresentations).map(module => 
              module.definitions?.flows.map((flow: any) => {
                const flowFqn = `${module.fqn}.${flow.name}`;
                return (
                  <div 
                    key={flowFqn}
                    style={{ 
                      padding: '4px', 
                      cursor: 'pointer',
                      backgroundColor: currentFlowFqn === flowFqn ? '#e0e0e0' : 'transparent'
                    }}
                    onClick={() => handleFlowNavigation(flowFqn)}
                  >
                    {flow.name}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main Canvas */}
        <div style={{ flex: 1 }}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={handleNodeClick}
              nodeTypes={props.customNodeTypes}
              edgeTypes={props.customEdgeTypes}
              {...props.customReactFlowProOptions}
            >
              <Controls />
              <Background />
              <MiniMap />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        {/* Right Sidebar */}
        <div style={{ width: '300px', borderLeft: '1px solid #ccc', padding: '16px' }}>
          <h3>Inspector</h3>
          {selectedElement && (
            <div>
              <div>Selected: {selectedElement.id}</div>
              <div>Type: {selectedElement.sourceType}</div>
              
              {/* Properties Tab */}
              {props.renderInspectorPropertiesTab && (
                <div style={{ marginTop: '16px' }}>
                  <h4>Properties</h4>
                  {props.renderInspectorPropertiesTab(selectedElement, inspectorActions, moduleRegistry)}
                </div>
              )}

              {/* Source Tab */}
              {props.renderInspectorSourceTab && (
                <div style={{ marginTop: '16px' }}>
                  <h4>Source</h4>
                  {props.renderInspectorSourceTab(selectedElement, moduleRegistry)}
                </div>
              )}

              {/* Data I/O Tab (for trace mode) */}
              {props.renderInspectorDataIOTab && props.mode === 'trace' && (
                <div style={{ marginTop: '16px' }}>
                  <h4>Data I/O</h4>
                  {props.renderInspectorDataIOTab(null, moduleRegistry)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(CascadeFlowVisualizer); 