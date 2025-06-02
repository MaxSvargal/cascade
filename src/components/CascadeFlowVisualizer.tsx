// Main CascadeFlowVisualizer React Component
// From cfv_internal_code.CascadeFlowVisualizerComponent_Main

import React, { useEffect, useMemo, useCallback, useRef } from 'react';
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
import { applyConfigChanges, createSavePayload } from '@/services/yamlReconstructionService';

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
  const [expandedModules, setExpandedModules] = React.useState<Set<string>>(new Set());
  const [activeInspectorTab, setActiveInspectorTab] = React.useState<'properties' | 'source' | 'dataio' | 'debugging' | 'testing'>('properties');

  // Add ref to prevent infinite loops in onViewChange
  const isCallingOnViewChange = useRef(false);

  // Toggle module expansion
  const toggleModuleExpansion = useCallback((moduleFqn: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleFqn)) {
        newSet.delete(moduleFqn);
      } else {
        newSet.add(moduleFqn);
      }
      return newSet;
    });
  }, []);

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
          graphData = await generateSystemOverviewGraphData(moduleRegistry, parseContextVars, true, handleFlowNavigation);
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
    if (props.onViewChange && !isCallingOnViewChange.current) {
      isCallingOnViewChange.current = true;
      props.onViewChange({
        mode: props.mode,
        currentFlowFqn: currentFlowFqn || undefined,
        systemViewActive
      });
      // Reset the flag after the call
      setTimeout(() => {
        isCallingOnViewChange.current = false;
      }, 0);
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
    // Prevent default navigation for step nodes - they should open edit dialog instead
    if (node.type === 'stepNode' || node.type === 'triggerNode') {
      const newSelectedElement: SelectedElement = {
        sourceType: 'flowNode',
        id: node.id,
        data: node.data,
        moduleFqn: currentFlowFqn?.split('.').slice(0, -1).join('.')
      };
      setSelectedElement(newSelectedElement);
      return;
    }

    // Handle system flow node navigation
    if (node.type === 'systemFlowNode' && node.data?.navigatable && node.data?.onFlowNodeClick) {
      node.data.onFlowNodeClick(node.data.targetFlowFqn);
      return;
    }

    // Default selection behavior for other node types
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
    requestSave: async (newConfigValue: any, pathToConfig: (string | number)[]) => {
      if (!selectedElement || !props.onSaveModule) {
        console.log('Save requested but no save handler or selected element:', { newConfigValue, pathToConfig });
        return;
      }

      try {
        // Find the module that contains the selected element
        const moduleFqn = selectedElement.moduleFqn || 
          (currentFlowFqn ? currentFlowFqn.split('.').slice(0, -1).join('.') : null);
        
        if (!moduleFqn) {
          console.error('Cannot determine module FQN for save operation');
          return;
        }

        const moduleRep = dslModuleRepresentations[moduleFqn];
        if (!moduleRep) {
          console.error('Module not found for save operation:', moduleFqn);
          return;
        }

        // Apply the configuration changes
        const updatedModuleRep = applyConfigChanges(moduleRep, pathToConfig, newConfigValue);
        
        // Create save payload
        const savePayload = createSavePayload(updatedModuleRep);
        
        // Call the save handler
        const result = await props.onSaveModule(savePayload);
        
        if (result !== false) {
          console.log('Save successful for module:', moduleFqn);
          // Optionally update the local state with the new module representation
          // This would require updating the atom, but we'll let the consumer handle reloading
        } else {
          console.error('Save was rejected by the handler');
        }
      } catch (error) {
        console.error('Save operation failed:', error);
        if (props.onModuleLoadError) {
          props.onModuleLoadError(selectedElement.moduleFqn || 'unknown', error as Error);
        }
      }
    }
  }), [selectedElement, props.onSaveModule, props.onModuleLoadError, dslModuleRepresentations, currentFlowFqn]);

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
            {Object.values(dslModuleRepresentations).map(module => {
              const isExpanded = expandedModules.has(module.fqn);
              const hasFlows = module.definitions?.flows && module.definitions.flows.length > 0;
              
              return (
                <div key={module.fqn} style={{ marginBottom: '4px' }}>
                  <div 
                    style={{ 
                      padding: '8px', 
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      cursor: hasFlows ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onClick={() => hasFlows && toggleModuleExpansion(module.fqn)}
                  >
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '13px' }}>{module.fqn}</div>
                      {module.status === 'error' && (
                        <div style={{ color: '#d32f2f', fontSize: '11px', marginTop: '2px' }}>
                          ⚠ {module.errors?.[0]?.message}
                        </div>
                      )}
                    </div>
                    {hasFlows && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {isExpanded ? '▼' : '▶'}
                      </div>
                    )}
                  </div>
                  
                  {/* Expanded flows list */}
                  {isExpanded && hasFlows && module.definitions && (
                    <div style={{ marginLeft: '16px', marginTop: '4px' }}>
                      {module.definitions.flows.map((flow: any) => {
                        const flowFqn = `${module.fqn}.${flow.name}`;
                        return (
                          <div 
                            key={flowFqn}
                            style={{ 
                              padding: '6px 8px', 
                              marginBottom: '2px',
                              cursor: 'pointer',
                              backgroundColor: currentFlowFqn === flowFqn ? '#e3f2fd' : '#f9f9f9',
                              border: `1px solid ${currentFlowFqn === flowFqn ? '#1976D2' : '#e0e0e0'}`,
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFlowNavigation(flowFqn);
                            }}
                          >
                            📋 {flow.name}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
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
          
          {/* Tab Navigation */}
          <div style={{ 
            display: 'flex', 
            marginBottom: '16px',
            borderBottom: '1px solid #e0e0e0',
            flexWrap: 'wrap'
          }}>
            {['properties', 'source', 'dataio', 'debugging', 'testing'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveInspectorTab(tab as any)}
                style={{
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: activeInspectorTab === tab ? '#1976D2' : 'transparent',
                  color: activeInspectorTab === tab ? 'white' : '#666',
                  cursor: 'pointer',
                  fontSize: '12px',
                  borderRadius: '4px 4px 0 0',
                  marginRight: '4px',
                  textTransform: 'capitalize'
                }}
              >
                {tab === 'dataio' ? 'Data I/O' : tab}
              </button>
            ))}
          </div>

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
              {activeInspectorTab === 'properties' && props.renderInspectorPropertiesTab && (
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
              {activeInspectorTab === 'source' && props.renderInspectorSourceTab && (
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

              {/* Data I/O Tab */}
              {activeInspectorTab === 'dataio' && props.renderInspectorDataIOTab && (
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

              {/* Debugging Tab */}
              {activeInspectorTab === 'debugging' && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>Debugging</h4>
                  <div style={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '12px'
                  }}>
                    {props.traceData ? (
                      <div>
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontWeight: '500', marginBottom: '4px' }}>Execution Trace</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Status: <span style={{ color: props.traceData.status === 'COMPLETED' ? '#4CAF50' : '#F44336' }}>
                              {props.traceData.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Duration: {props.traceData.durationMs}ms
                          </div>
                        </div>
                        
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontWeight: '500', marginBottom: '4px' }}>Step Details</div>
                          {props.traceData.steps.map(step => (
                            <div key={step.stepId} style={{ 
                              padding: '8px', 
                              marginBottom: '4px',
                              backgroundColor: step.status === 'SUCCESS' ? '#E8F5E8' : '#FFEBEE',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}>
                              <div style={{ fontWeight: '500' }}>{step.stepId}</div>
                              <div>Status: {step.status}</div>
                              <div>Duration: {step.durationMs}ms</div>
                              {step.inputData && (
                                <details style={{ marginTop: '4px' }}>
                                  <summary style={{ cursor: 'pointer' }}>Input Data</summary>
                                  <pre style={{ fontSize: '10px', margin: '4px 0', overflow: 'auto' }}>
                                    {JSON.stringify(step.inputData, null, 2)}
                                  </pre>
                                </details>
                              )}
                              {step.outputData && (
                                <details style={{ marginTop: '4px' }}>
                                  <summary style={{ cursor: 'pointer' }}>Output Data</summary>
                                  <pre style={{ fontSize: '10px', margin: '4px 0', overflow: 'auto' }}>
                                    {JSON.stringify(step.outputData, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                        No trace data available. Run a flow to see debugging information.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Property Testing Tab */}
              {activeInspectorTab === 'testing' && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>Property Testing</h4>
                  <div style={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    padding: '12px'
                  }}>
                    {currentFlowFqn ? (
                      <div>
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontWeight: '500', marginBottom: '8px' }}>Test Cases for {currentFlowFqn}</div>
                          <button
                            style={{
                              width: '100%',
                              padding: '8px',
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              marginBottom: '8px'
                            }}
                            onClick={() => {
                              // Generate default test cases
                              console.log('Generating test cases for:', currentFlowFqn);
                            }}
                          >
                            Generate Default Test Cases
                          </button>
                        </div>
                        
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontWeight: '500', marginBottom: '4px' }}>Default Test Templates</div>
                          {['Happy Path', 'Error Handling', 'Performance'].map(testType => (
                            <div key={testType} style={{ 
                              padding: '8px', 
                              marginBottom: '4px',
                              backgroundColor: '#f5f5f5',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              console.log('Creating test case:', testType, 'for', currentFlowFqn);
                            }}
                            >
                              <div style={{ fontWeight: '500' }}>{testType} Test</div>
                              <div style={{ color: '#666' }}>
                                {testType === 'Happy Path' && 'Tests normal execution flow with valid inputs'}
                                {testType === 'Error Handling' && 'Tests error scenarios and edge cases'}
                                {testType === 'Performance' && 'Tests execution timing and resource usage'}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontWeight: '500', marginBottom: '4px' }}>Test Execution</div>
                          <button
                            style={{
                              width: '100%',
                              padding: '8px',
                              backgroundColor: '#2196F3',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            onClick={() => {
                              if (props.onRunTestCase) {
                                // Create a sample test case
                                const testCase = {
                                  testCaseId: 'test-' + Date.now(),
                                  flowFqn: currentFlowFqn,
                                  description: 'Sample test case',
                                  triggerInput: {},
                                  inputData: {},
                                  expectedOutputs: {},
                                  assertions: []
                                };
                                props.onRunTestCase(testCase);
                              }
                            }}
                          >
                            Run Test Cases
                          </button>
                        </div>
                        
                        <div>
                          <div style={{ fontWeight: '500', marginBottom: '4px' }}>Test Results</div>
                          <div style={{ 
                            padding: '8px',
                            backgroundColor: '#f9f9f9',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#666'
                          }}>
                            No test results yet. Run tests to see results here.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                        Select a flow to create and run test cases.
                      </div>
                    )}
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