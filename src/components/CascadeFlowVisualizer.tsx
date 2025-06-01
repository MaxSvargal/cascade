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

  // Return empty graph data - actual generation will be handled in useEffect
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
  const dslModuleRepresentations = useAtomValue(dslModuleRepresentationsAtom);
  const componentSchemas = useAtomValue(componentSchemasAtom);

  // React Flow state management
  const [nodes, setNodes] = React.useState<Node[]>([]);
  const [edges, setEdges] = React.useState<Edge[]>([]);
  const [isGeneratingGraph, setIsGeneratingGraph] = React.useState(false);

  // Generate graph data when dependencies change
  useEffect(() => {
    const generateGraphData = async () => {
      setIsGeneratingGraph(true);
      
      try {
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

        let graphData: GraphData = { nodes: [], edges: [] };

        if (systemViewActive) {
          graphData = await generateSystemOverviewGraphData(moduleRegistry, parseContextVars);
        } else if (currentFlowFqn) {
          graphData = await generateFlowDetailGraphData({
            flowFqn: currentFlowFqn,
            mode: props.mode || 'design',
            moduleRegistry,
            parseContextVarsFn: parseContextVars,
            componentSchemas,
            traceData: props.traceData
          });
        }

        setNodes(graphData.nodes);
        setEdges(graphData.edges);
      } catch (error) {
        console.error('Failed to generate graph data:', error);
        setNodes([]);
        setEdges([]);
      } finally {
        setIsGeneratingGraph(false);
      }
    };

    generateGraphData();
  }, [currentFlowFqn, systemViewActive, dslModuleRepresentations, componentSchemas, props.mode, props.traceData]);

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
      <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
        {/* Left Sidebar */}
        <div style={{ 
          width: '300px', 
          borderRight: '1px solid #e0e0e0', 
          padding: '16px',
          backgroundColor: '#fafafa',
          overflowY: 'auto'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <button 
              onClick={handleSystemViewToggle}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: systemViewActive ? '#1976D2' : '#f5f5f5',
                color: systemViewActive ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {systemViewActive ? '📋 Flow Detail View' : '🌐 System Overview'}
            </button>
          </div>
          
          {/* Modules List */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#333' }}>Modules</h3>
            {Object.values(dslModuleRepresentations).map(module => (
              <div 
                key={module.fqn} 
                style={{ 
                  padding: '8px', 
                  marginBottom: '4px',
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: '500', fontSize: '13px' }}>{module.fqn}</div>
                {module.status === 'error' && (
                  <div style={{ color: '#d32f2f', fontSize: '11px', marginTop: '2px' }}>
                    ⚠ {module.errors?.[0]?.message}
                  </div>
                )}
                {module.status === 'loaded' && (
                  <div style={{ color: '#388e3c', fontSize: '11px', marginTop: '2px' }}>
                    ✓ Loaded
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Flows List */}
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#333' }}>Flows</h3>
            {Object.values(dslModuleRepresentations).map(module => 
              module.definitions?.flows.map((flow: any) => {
                const flowFqn = `${module.fqn}.${flow.name}`;
                return (
                  <div 
                    key={flowFqn}
                    style={{ 
                      padding: '8px', 
                      marginBottom: '4px',
                      cursor: 'pointer',
                      backgroundColor: currentFlowFqn === flowFqn ? '#e3f2fd' : 'white',
                      border: `1px solid ${currentFlowFqn === flowFqn ? '#1976D2' : '#e0e0e0'}`,
                      borderRadius: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => handleFlowNavigation(flowFqn)}
                    onMouseEnter={(e) => {
                      if (currentFlowFqn !== flowFqn) {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentFlowFqn !== flowFqn) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <div style={{ fontWeight: '500', fontSize: '13px' }}>{flow.name}</div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                      {module.fqn}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Header */}
          <div style={{ 
            height: '50px', 
            borderBottom: '1px solid #e0e0e0', 
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>
              {systemViewActive ? 'System Overview' : (currentFlowFqn || 'Select a Flow')}
            </h2>
          </div>
          
          {/* React Flow Canvas */}
          <div style={{ height: 'calc(100vh - 50px)' }}>
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
                fitView
                {...props.customReactFlowProOptions}
              >
                <Controls />
                <Background />
                <MiniMap />
              </ReactFlow>
            </ReactFlowProvider>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ 
          width: '300px', 
          borderLeft: '1px solid #e0e0e0', 
          padding: '16px',
          backgroundColor: '#fafafa',
          overflowY: 'auto'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#333' }}>Inspector</h3>
          {selectedElement ? (
            <div>
              <div style={{ 
                padding: '12px', 
                backgroundColor: 'white', 
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                marginBottom: '16px'
              }}>
                <div style={{ fontWeight: '500', marginBottom: '4px' }}>Selected: {selectedElement.id}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Type: {selectedElement.sourceType}</div>
              </div>
              
              {/* Properties Tab */}
              {props.renderInspectorPropertiesTab && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>Properties</h4>
                  <div style={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '12px'
                  }}>
                    {props.renderInspectorPropertiesTab(selectedElement, inspectorActions, moduleRegistry)}
                  </div>
                </div>
              )}

              {/* Source Tab */}
              {props.renderInspectorSourceTab && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>Source</h4>
                  <div style={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '12px'
                  }}>
                    {props.renderInspectorSourceTab(selectedElement, moduleRegistry)}
                  </div>
                </div>
              )}

              {/* Data I/O Tab (for trace mode) */}
              {props.renderInspectorDataIOTab && props.mode === 'trace' && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>Data I/O</h4>
                  <div style={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '12px'
                  }}>
                    {props.renderInspectorDataIOTab(null, moduleRegistry)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: '#666',
              backgroundColor: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '4px'
            }}>
              Click on a node or edge to inspect its properties
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(CascadeFlowVisualizer); 