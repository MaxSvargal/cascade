import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
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
  addEdge,
  useReactFlow
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
  navigateToFlowAtom,
  navigateToSystemOverviewAtom,
  toggleSystemViewAtom
} from '@/state/navigationAtoms';
import { 
  selectedElementAtom
} from '@/state/selectionAtoms';
import { 
  activeInspectorTabAtom,
  switchInspectorTabAtom,
  currentTabAvailabilityAtom
} from '@/state/inspectorAtoms';
import { 
  generateFlowDetailGraphData, 
  generateSystemOverviewGraphData,
  GraphData 
} from '@/services/graphBuilderService';
import { createModuleRegistryInterface } from '@/services/moduleRegistryService';
import { DebugTestActionsService } from '@/services/debugTestActionsService';
import { createInspectorActions } from '@/services/inspectorActionsService';

import 'reactflow/dist/style.css';

// Constants for sidebar sizing
const MIN_SIDEBAR_WIDTH = 20;
const MAX_SIDEBAR_WIDTH = 900;
const DEFAULT_LEFT_SIDEBAR_WIDTH = 300;
const DEFAULT_RIGHT_SIDEBAR_WIDTH = 300;

// Helper functions for localStorage
const getSidebarWidths = () => {
  if (typeof window === 'undefined') {
    return {
      leftWidth: DEFAULT_LEFT_SIDEBAR_WIDTH,
      rightWidth: DEFAULT_RIGHT_SIDEBAR_WIDTH
    };
  }
  
  try {
    const stored = localStorage.getItem('cascade-visualizer-sidebar-widths');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        leftWidth: Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, parsed.leftWidth || DEFAULT_LEFT_SIDEBAR_WIDTH)),
        rightWidth: Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, parsed.rightWidth || DEFAULT_RIGHT_SIDEBAR_WIDTH))
      };
    }
  } catch (error) {
    console.warn('Failed to load sidebar widths from localStorage:', error);
  }
  
  return {
    leftWidth: DEFAULT_LEFT_SIDEBAR_WIDTH,
    rightWidth: DEFAULT_RIGHT_SIDEBAR_WIDTH
  };
};

const setSidebarWidths = (leftWidth: number, rightWidth: number) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('cascade-visualizer-sidebar-widths', JSON.stringify({
      leftWidth,
      rightWidth
    }));
  } catch (error) {
    console.warn('Failed to save sidebar widths to localStorage:', error);
  }
};

// Auto Zoom-to-Fit Component (must be inside ReactFlowProvider)
const AutoZoomToFit: React.FC<{
  currentFlowFqn: string | null;
  nodes: Node[];
  isGeneratingGraph: boolean;
}> = ({ currentFlowFqn, nodes, isGeneratingGraph }) => {
  const { fitView } = useReactFlow();
  const lastFlowFqnRef = useRef<string | null>(null);
  const lastNodeCountRef = useRef<number>(0);

  useEffect(() => {
    // Only auto-fit when:
    // 1. Flow changes (different FQN)
    // 2. Graph generation is complete
    // 3. We have nodes to display
    const flowChanged = lastFlowFqnRef.current !== currentFlowFqn;
    const hasNodes = nodes.length > 0;
    const nodeCountChanged = lastNodeCountRef.current !== nodes.length;

    if ((flowChanged || nodeCountChanged) && !isGeneratingGraph && hasNodes) {
      // Small delay to ensure DOM updates are complete
      const timeoutId = setTimeout(() => {
        try {
          fitView({ 
            duration: 800, 
            padding: 0.1 // 10% padding around nodes
          });
        } catch (error) {
          console.warn('Failed to auto-fit view:', error);
        }
      }, 100);

      // Update refs
      lastFlowFqnRef.current = currentFlowFqn;
      lastNodeCountRef.current = nodes.length;

      return () => clearTimeout(timeoutId);
    }
  }, [currentFlowFqn, nodes.length, isGeneratingGraph, fitView]);

  return null; // This component doesn't render anything
};

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

  // Navigation actions
  const navigateToFlow = useSetAtom(navigateToFlowAtom);
  const navigateToSystemOverview = useSetAtom(navigateToSystemOverviewAtom);
  const toggleSystemView = useSetAtom(toggleSystemViewAtom);
  const switchInspectorTab = useSetAtom(switchInspectorTabAtom);

  // React Flow state management
  const [nodes, setNodes] = React.useState<Node[]>([]);
  const [edges, setEdges] = React.useState<Edge[]>([]);
  const [isGeneratingGraph, setIsGeneratingGraph] = React.useState(false);
  const [expandedModules, setExpandedModules] = React.useState<Set<string>>(new Set());
  const [activeInspectorTab, setActiveInspectorTab] = useAtom(activeInspectorTabAtom);
  
  // Execution state management
  const [currentExecutionResults, setCurrentExecutionResults] = React.useState<any>(null);

  // UI customization options with defaults
  const uiOptions = React.useMemo(() => ({
    sidebarOptions: {
      defaultLeftWidth: 300,
      defaultRightWidth: 300,
      minWidth: 20,
      maxWidth: 900,
      resizable: true,
      collapsible: false,
      ...props.uiOptions?.sidebarOptions
    },
    colorTheme: {
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      backgroundColor: '#f8fafc',
      sidebarBackgroundColor: '#ffffff',
      nodeColors: {
        successColor: '#10B981',
        failureColor: '#EF4444',
        runningColor: '#F59E0B',
        skippedColor: '#6B7280',
        notExecutedColor: '#E5E7EB',
        stepNodeColor: '#3B82F6',
        triggerNodeColor: '#059669',
        subFlowInvokerColor: '#8B5CF6',
        ...props.uiOptions?.colorTheme?.nodeColors
      },
      edgeColors: {
        dataFlowColor: '#81C784',
        controlFlowColor: '#9CA3AF',
        invocationEdgeColor: '#F59E0B',
        triggerLinkEdgeColor: '#10B981',
        executedPathColor: '#10B981',
        notExecutedPathColor: '#D1D5DB',
        ...props.uiOptions?.colorTheme?.edgeColors
      },
      ...props.uiOptions?.colorTheme
    },
    interactionOptions: {
      enableDoubleClickNavigation: true,
      enableHoverEffects: true,
      multiSelectEnabled: false,
      enableAnimations: true,
      animationDuration: 200,
      ...props.uiOptions?.interactionOptions
    },
    ...props.uiOptions
  }), [props.uiOptions]);

  // Sidebar width state - use UI options for defaults
  const [sidebarWidths, setSidebarWidthsState] = React.useState({
    leftWidth: uiOptions.sidebarOptions.defaultLeftWidth || DEFAULT_LEFT_SIDEBAR_WIDTH,
    rightWidth: uiOptions.sidebarOptions.defaultRightWidth || DEFAULT_RIGHT_SIDEBAR_WIDTH
  });
  const [isResizing, setIsResizing] = React.useState<'left' | 'right' | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  // Add ref to prevent infinite loops in onViewChange
  const isCallingOnViewChange = useRef(false);

  // Load sidebar widths from localStorage on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cascade-visualizer-sidebar-widths');
        if (stored) {
          const parsed = JSON.parse(stored);
          setSidebarWidthsState({
            leftWidth: Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, parsed.leftWidth || DEFAULT_LEFT_SIDEBAR_WIDTH)),
            rightWidth: Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, parsed.rightWidth || DEFAULT_RIGHT_SIDEBAR_WIDTH))
          });
        }
      } catch (error) {
        console.warn('Failed to load sidebar widths from localStorage:', error);
      }
    }
  }, []);

  // Save sidebar widths to localStorage when they change
  useEffect(() => {
    setSidebarWidths(sidebarWidths.leftWidth, sidebarWidths.rightWidth);
  }, [sidebarWidths]);

  // Mouse event handlers for resizing
  const handleMouseDown = useCallback((side: 'left' | 'right', e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(side);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = side === 'left' ? sidebarWidths.leftWidth : sidebarWidths.rightWidth;
  }, [sidebarWidths]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - resizeStartX.current;
    let newWidth: number;

    if (isResizing === 'left') {
      newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, resizeStartWidth.current + deltaX));
      setSidebarWidthsState(prev => ({ ...prev, leftWidth: newWidth }));
    } else {
      newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, resizeStartWidth.current - deltaX));
      setSidebarWidthsState(prev => ({ ...prev, rightWidth: newWidth }));
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(null);
  }, []);

  // Add global mouse event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

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

  // Module registry interface for services
  const moduleRegistry = useMemo(() => {
    return createModuleRegistryInterface((atomRef) => {
      if (atomRef === 'dslModuleRepresentationsAtom') return dslModuleRepresentations;
      if (atomRef === 'componentSchemasAtom') return componentSchemas;
      return {};
    });
  }, [dslModuleRepresentations, componentSchemas]);

  // Debug test actions service
  const debugTestActionsService = useMemo(() => {
    // Wrap onRunTestCase to handle null return type
    const wrappedOnRunTestCase = props.onRunTestCase ? async (testCase: any) => {
      const result = await props.onRunTestCase!(testCase);
      return result || {
        testCase,
        passed: false,
        assertionResults: [],
        error: 'Test execution returned null'
      };
    } : undefined;

    // Callback to update execution state in the visualizer
    const updateExecutionStateCallback = (flowFqn: string, executionResults: any) => {
      console.log('🔄 Updating execution state for flow:', flowFqn, executionResults);
      setCurrentExecutionResults(executionResults);
    };

    return new DebugTestActionsService(
      moduleRegistry,
      componentSchemas,
      wrappedOnRunTestCase,
      updateExecutionStateCallback,
      currentFlowFqn || undefined
    );
  }, [moduleRegistry, componentSchemas, props.onRunTestCase, currentFlowFqn]);

  // Update debug actions service when flow changes
  React.useEffect(() => {
    if (debugTestActionsService && 'setCurrentFlowFqn' in debugTestActionsService) {
      (debugTestActionsService as any).setCurrentFlowFqn(currentFlowFqn || undefined);
    }
  }, [debugTestActionsService, currentFlowFqn]);

  // Inspector actions
  const inspectorActions = useMemo(() => {
    return createInspectorActions(
      moduleRegistry,
      dslModuleRepresentations,
      selectedElement,
      currentFlowFqn,
      props.onSaveModule,
      props.onModuleLoadError
    );
  }, [moduleRegistry, dslModuleRepresentations, selectedElement, currentFlowFqn, props.onSaveModule, props.onModuleLoadError]);

  // Trace list service
  // const traceListService = useMemo(() => {
  //   return new TraceListService({
  //     fetchTraceList: props.fetchTraceList,
  //     onTraceSelect: (traceId: string) => {
  //       // This would typically trigger the host app to load trace data
  //       console.log('Trace selected:', traceId);
  //     }
  //   });
  // }, [props.fetchTraceList]);

  // // Navigation service
  // const navigationService = useMemo(() => {
  //   return new NavigationService({
  //     onViewChange: props.onViewChange
  //   });
  // }, [props.onViewChange]);

  // Generate graph data when dependencies change
  useEffect(() => {
    const generateGraphData = async () => {
      setIsGeneratingGraph(true);
      
      try {
        // Simple context variable parser (would be replaced by props.parseContextVariables)
        const parseContextVars = (value: string): string[] => {
          const matches = value.match(/\$\{([^}]+)\}/g);
          return matches ? matches.map(match => match.slice(2, -1)) : [];
        };

        let graphData: GraphData = { nodes: [], edges: [] };

        if (systemViewActive) {
          graphData = await generateSystemOverviewGraphData(moduleRegistry, parseContextVars, true, handleFlowNavigation);
        } else if (currentFlowFqn) {
          const flowDef = moduleRegistry.getFlowDefinition(currentFlowFqn);
          
          // Use currentExecutionResults as trace data if available, otherwise use props.traceData
          const traceDataToUse = currentExecutionResults || props.traceData;
          
          graphData = await generateFlowDetailGraphData({
            flowFqn: currentFlowFqn,
            mode: props.mode || 'design',
            moduleRegistry,
            parseContextVarsFn: parseContextVars,
            componentSchemas,
            traceData: traceDataToUse
          });
        } else {
          console.log('🔍 Debug: No flow selected and not in system view');
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
  }, [currentFlowFqn, systemViewActive, dslModuleRepresentations, componentSchemas, props.mode, props.traceData, currentExecutionResults]);

  // Initialize from design data
  useEffect(() => {
    if (props.designData) {
      console.log('🔍 Debug: Initializing from design data:', props.designData);
      if (props.designData.initialFlowFqn) {
        console.log('🔍 Debug: Setting initial flow FQN:', props.designData.initialFlowFqn);
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
    // Handle step nodes - select element without auto-switching tabs
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

  // Node double-click handler for SubFlowInvoker navigation
  const handleNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Only handle double-click navigation if enabled
    if (!uiOptions.interactionOptions.enableDoubleClickNavigation) {
      return;
    }

    // Handle SubFlowInvoker navigation
    if (node.type === 'subFlowInvokerNode' && node.data?.invokedFlowFqn) {
      const targetFlowFqn = node.data.invokedFlowFqn;
      
      // Check if target flow is already loaded
      const targetModule = Object.values(dslModuleRepresentations).find(module => 
        module.definitions?.flows?.some((flow: any) => 
          `${module.fqn}.${flow.name}` === targetFlowFqn
        )
      );

      if (targetModule) {
        // Navigate to the target flow
        navigateToFlow(targetFlowFqn);
      } else {
        // Try to load the target module
        const moduleFqn = targetFlowFqn.split('.').slice(0, -1).join('.');
        if (props.requestModule) {
          props.requestModule(moduleFqn)
            .then((result) => {
              if (result) {
                // Module loaded successfully, navigate to flow
                setTimeout(() => navigateToFlow(targetFlowFqn), 100);
              } else {
                console.warn(`Failed to load module for flow: ${targetFlowFqn}`);
                // Could show user notification here
              }
            })
            .catch((error) => {
              console.error(`Error loading module for flow ${targetFlowFqn}:`, error);
              if (props.onModuleLoadError) {
                props.onModuleLoadError(moduleFqn, error);
              }
            });
        } else {
          console.warn(`Cannot navigate to ${targetFlowFqn}: requestModule not provided`);
        }
      }
    }
  }, [uiOptions.interactionOptions.enableDoubleClickNavigation, dslModuleRepresentations, navigateToFlow, props.requestModule, props.onModuleLoadError]);

  // Flow navigation handler
  const handleFlowNavigation = useCallback((flowFqn: string) => {
    navigateToFlow(flowFqn);
  }, [navigateToFlow]);

  // System view toggle
  const handleSystemViewToggle = useCallback(() => {
    toggleSystemView();
  }, [toggleSystemView]);

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

  // Tab Navigation with proper visibility logic
  const tabAvailability = useAtomValue(currentTabAvailabilityAtom);
  const tabVisibility = useMemo(() => {
    return tabAvailability.availableTabs;
  }, [tabAvailability.availableTabs]);

  const availableTabs = useMemo(() => {
    const tabs: Array<{ id: 'source' | 'properties' | 'debugtest'; label: string; visible: boolean }> = [
      { id: 'source' as const, label: 'Source', visible: tabVisibility.source },
      { id: 'properties' as const, label: 'Properties', visible: tabVisibility.properties },
      { id: 'debugtest' as const, label: 'Debug & Test', visible: tabVisibility.debugtest }
    ];

    return tabs;
  }, [tabVisibility]);

  // Debug logging for module loading
  useEffect(() => {
    console.log('🔍 Debug: Module representations updated:', {
      moduleCount: Object.keys(dslModuleRepresentations).length,
      modules: Object.keys(dslModuleRepresentations),
      moduleDetails: Object.values(dslModuleRepresentations).map(m => ({
        fqn: m.fqn,
        status: m.status,
        flowCount: m.definitions?.flows?.length || 0
      }))
    });
  }, [dslModuleRepresentations]);

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      backgroundColor: uiOptions.colorTheme.backgroundColor,
      ...props.style 
    }} className={props.className}>
      <ReactFlowProvider>
        {/* Left Sidebar */}
        <div style={{ 
          width: `${sidebarWidths.leftWidth}px`, 
          backgroundColor: uiOptions.colorTheme.sidebarBackgroundColor,
          borderRight: '1px solid #e0e0e0',
          overflow: 'auto',
          position: 'relative'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <button 
              onClick={handleSystemViewToggle}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: systemViewActive ? '#3B82F6' : '#f8fafc',
                color: systemViewActive ? 'white' : '#374151',
                border: `1px solid ${systemViewActive ? '#3B82F6' : '#E5E7EB'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              {systemViewActive ? '📋 Flow Detail View' : '🌐 System Overview'}
            </button>
          </div>
          
          {/* Modules List */}
          <div style={{ marginBottom: '24px', padding: '4px' }}>
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
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      cursor: hasFlows ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => hasFlows && toggleModuleExpansion(module.fqn)}
                  >
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '13px', color: '#374151' }}>{module.fqn}</div>
                      {module.status === 'error' && (
                        <div style={{ color: '#EF4444', fontSize: '11px', marginTop: '2px' }}>
                          ⚠ {module.errors?.[0]?.message}
                        </div>
                      )}
                    </div>
                    {hasFlows && (
                      <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
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
                              backgroundColor: currentFlowFqn === flowFqn ? '#EBF4FF' : '#F9FAFB',
                              border: `1px solid ${currentFlowFqn === flowFqn ? '#3B82F6' : '#E5E7EB'}`,
                              borderRadius: '4px',
                              fontSize: '12px',
                              transition: 'all 0.2s ease'
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
          <div style={{ padding: '4px' }}>
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
                      backgroundColor: currentFlowFqn === flowFqn ? '#EBF4FF' : 'white',
                      border: `1px solid ${currentFlowFqn === flowFqn ? '#3B82F6' : '#E5E7EB'}`,
                      borderRadius: '6px',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => handleFlowNavigation(flowFqn)}
                    onMouseEnter={(e) => {
                      if (currentFlowFqn !== flowFqn) {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentFlowFqn !== flowFqn) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <div style={{ fontWeight: '500', fontSize: '13px', color: '#374151' }}>{flow.name}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                      {module.fqn}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Left Resize Handle */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: -3,
              width: '6px',
              height: '100%',
              cursor: 'col-resize',
              backgroundColor: isResizing === 'left' ? '#1976D2' : '#d0d7de',
              opacity: isResizing === 'left' ? 1 : 0.5,
              borderRadius: '0 3px 3px 0',
              zIndex: 10,
              transition: 'all 0.2s ease'
            }}
            onMouseDown={(e) => handleMouseDown('left', e)}
            onMouseEnter={(e) => {
              if (!isResizing) {
                e.currentTarget.style.opacity = '0.8';
                e.currentTarget.style.backgroundColor = '#1976D2';
              }
            }}
            onMouseLeave={(e) => {
              if (!isResizing) {
                e.currentTarget.style.opacity = '0.5';
                e.currentTarget.style.backgroundColor = '#d0d7de';
              }
            }}
          />
        </div>

        {/* Main Content */}
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
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={handleNodeClick}
              onNodeDoubleClick={handleNodeDoubleClick}
              nodeTypes={props.customNodeTypes}
              edgeTypes={props.customEdgeTypes}
              fitView
              {...props.customReactFlowProOptions}
            >
              <Controls />
              <Background />
              <MiniMap />
              <AutoZoomToFit currentFlowFqn={currentFlowFqn} nodes={nodes} isGeneratingGraph={isGeneratingGraph} />
            </ReactFlow>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ 
          width: `${sidebarWidths.rightWidth}px`, 
          backgroundColor: uiOptions.colorTheme.sidebarBackgroundColor,
          borderLeft: '1px solid #e0e0e0',
          overflow: 'auto',
          padding: "8px",
          position: 'relative'
        }}>
          {/* Right Resize Handle */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: -3,
              width: '6px',
              height: '100%',
              cursor: 'col-resize',
              backgroundColor: isResizing === 'right' ? '#1976D2' : '#d0d7de',
              opacity: isResizing === 'right' ? 1 : 0.5,
              borderRadius: '3px 0 0 3px',
              zIndex: 10,
              transition: 'all 0.2s ease'
            }}
            onMouseDown={(e) => handleMouseDown('right', e)}
            onMouseEnter={(e) => {
              if (!isResizing) {
                e.currentTarget.style.opacity = '0.8';
                e.currentTarget.style.backgroundColor = '#1976D2';
              }
            }}
            onMouseLeave={(e) => {
              if (!isResizing) {
                e.currentTarget.style.opacity = '0.5';
                e.currentTarget.style.backgroundColor = '#d0d7de';
              }
            }}
          />

          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#374151' }}>Inspector</h3>
          
          {/* Tab Navigation */}
          <div style={{ 
            display: 'flex', 
            marginBottom: '16px',
            borderBottom: '1px solid #E5E7EB',
            flexWrap: 'wrap'
          }}>
            {availableTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => switchInspectorTab(tab.id)}
                style={{
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: activeInspectorTab === tab.id ? '#3B82F6' : 'transparent',
                  color: activeInspectorTab === tab.id ? 'white' : (tab.visible ? '#6B7280' : '#D1D5DB'),
                  cursor: 'pointer',
                  fontSize: '12px',
                  borderRadius: '6px 6px 0 0',
                  marginRight: '4px',
                  textTransform: 'capitalize',
                  opacity: tab.visible ? 1 : 0.5,
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                title={!tab.visible ? 'Not available for current selection' : ''}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {selectedElement ? (
            <div>
              <div style={{ 
                padding: '12px', 
                backgroundColor: 'white', 
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                marginBottom: '16px'
              }}>
                <div style={{ fontWeight: '500', marginBottom: '4px', color: '#374151' }}>Selected: {selectedElement.id}</div>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Type: {selectedElement.sourceType}</div>
              </div>
              
              {/* Show content only if current tab is available, otherwise show not available message */}
              {tabAvailability.isAvailable ? (
                <>
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
                        {props.renderInspectorPropertiesTab({
                          selectedElement,
                          actions: inspectorActions,
                          moduleRegistry
                        })}
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
                        {props.renderInspectorSourceTab({
                          selectedElement,
                          moduleRegistry
                        })}
                      </div>
                    </div>
                  )}

                  {/* Unified DebugTest Tab */}
                  {activeInspectorTab === 'debugtest' && props.renderInspectorDebugTestTab && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>Debug & Test</h4>
                      <div style={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        padding: '12px'
                      }}>
                        {props.renderInspectorDebugTestTab({
                          currentFlowFqn: currentFlowFqn || '',
                          selectedElement: selectedElement || undefined,
                          actions: debugTestActionsService,
                          moduleRegistry
                        })}
                      </div>
                    </div>
                  )}

                  {/* Fallback DebugTest Tab - for backward compatibility */}
                  {activeInspectorTab === 'debugtest' && !props.renderInspectorDebugTestTab && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>Debug & Test</h4>
                      <div style={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        padding: '12px'
                      }}>
                        {currentFlowFqn ? (
                          <div>
                            {/* Debug Execution Section */}
                            <div style={{ marginBottom: '16px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '8px' }}>Debug Execution</div>
                              <div style={{ marginBottom: '8px' }}>
                                <button
                                  style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: '#FF9800',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    marginBottom: '4px'
                                  }}
                                  onClick={async () => {
                                    try {
                                      console.log('🎯 Executing entire flow from trigger');
                                      
                                      // Generate trigger input data
                                      const flowDef = moduleRegistry.getFlowDefinition(currentFlowFqn);
                                      const triggerData = debugTestActionsService.resolveTriggerInputData(
                                        flowDef?.trigger || {},
                                        undefined,
                                        'happy_path'
                                      );
                                      
                                      console.log('🎯 Executing entire flow from trigger with input:', triggerData);
                                      
                                      // Execute the entire flow
                                      await debugTestActionsService.runDebugExecution(
                                        'trigger',
                                        triggerData,
                                        { useMocks: true, timeoutMs: 30000 }
                                      );
                                    } catch (error) {
                                      console.error('❌ Flow execution failed:', error);
                                    }
                                  }}
                                >
                                  🚀 Execute Entire Flow (Progressive)
                                </button>
                                
                                {selectedElement && selectedElement.sourceType === 'flowNode' && selectedElement.id !== 'trigger' && (
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
                                    onClick={async () => {
                                      try {
                                        console.log('🎯 Executing up to selected step:', selectedElement.id);
                                        
                                        // Generate trigger input data
                                        const flowDef = moduleRegistry.getFlowDefinition(currentFlowFqn);
                                        const triggerData = debugTestActionsService.resolveTriggerInputData(
                                          flowDef?.trigger || {},
                                          undefined,
                                          'happy_path'
                                        );
                                        
                                        // Execute up to selected step
                                        await debugTestActionsService.runDebugExecution(
                                          selectedElement.id,
                                          triggerData,
                                          { useMocks: true, timeoutMs: 30000 }
                                        );
                                      } catch (error) {
                                        console.error('❌ Step execution failed:', error);
                                      }
                                    }}
                                  >
                                    🎯 Execute Up To: {selectedElement.id}
                                  </button>
                                )}
                              </div>
                              
                              {/* Execution Status */}
                              {currentExecutionResults && (
                                <div style={{
                                  padding: '8px',
                                  backgroundColor: currentExecutionResults.status === 'COMPLETED' ? '#e8f5e8' : 
                                                  currentExecutionResults.status === 'FAILED' ? '#ffeaea' : '#fff3cd',
                                  border: `1px solid ${currentExecutionResults.status === 'COMPLETED' ? '#4CAF50' : 
                                                      currentExecutionResults.status === 'FAILED' ? '#F44336' : '#FF9800'}`,
                                  borderRadius: '4px',
                                  fontSize: '12px'
                                }}>
                                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                                    Execution Status: {currentExecutionResults.status}
                                  </div>
                                  <div>
                                    Steps: {currentExecutionResults.steps?.length || 0} | 
                                    Duration: {currentExecutionResults.durationMs || 0}ms
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Test Case Generation */}
                            <div style={{ marginBottom: '16px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '8px' }}>Test Case Generation</div>
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
                                  // Generate and run a test case
                                  const testCase = debugTestActionsService.generateTestCaseTemplate(currentFlowFqn, 'happyPath');
                                  console.log('Generated test case:', testCase);
                                  
                                  // Auto-populate trigger input
                                  const flowDef = moduleRegistry.getFlowDefinition(currentFlowFqn);
                                  testCase.triggerInput = debugTestActionsService.resolveTriggerInputData(
                                    flowDef?.trigger || {},
                                    undefined,
                                    'happy_path'
                                  );
                                  
                                  // Run the test case
                                  debugTestActionsService.runTestCase(testCase).then(result => {
                                    console.log('Test case result:', result);
                                  }).catch(error => {
                                    console.error('Test case failed:', error);
                                  });
                                }}
                              >
                                Generate & Run Happy Path Test
                              </button>
                            </div>
                            
                            {/* Test Templates */}
                            <div style={{ marginBottom: '16px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '4px' }}>Test Templates</div>
                              {[
                                { type: 'happyPath', label: 'Happy Path', desc: 'Tests normal execution flow with valid inputs', color: '#4CAF50' },
                                { type: 'errorCase', label: 'Error Handling', desc: 'Tests error scenarios and edge cases', color: '#FF5722' },
                                { type: 'custom', label: 'Custom Scenario', desc: 'Create custom test with specific conditions', color: '#9C27B0' }
                              ].map(testType => (
                                <div key={testType.type} style={{ 
                                  padding: '8px', 
                                  marginBottom: '4px',
                                  backgroundColor: '#f5f5f5',
                                  border: '1px solid #e0e0e0',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: 'pointer'
                                }}
                                onClick={() => {
                                  const testCase = debugTestActionsService.generateTestCaseTemplate(
                                    currentFlowFqn, 
                                    testType.type as 'happyPath' | 'errorCase' | 'custom'
                                  );
                                  console.log(`Creating ${testType.label} test case:`, testCase);
                                  
                                  // Auto-populate trigger input based on test type
                                  const flowDef = moduleRegistry.getFlowDefinition(currentFlowFqn);
                                  const dataType = testType.type === 'happyPath' ? 'happy_path' : 
                                                  testType.type === 'errorCase' ? 'error_cases' : 'fork_paths';
                                  testCase.triggerInput = debugTestActionsService.resolveTriggerInputData(
                                    flowDef?.trigger || {},
                                    undefined,
                                    dataType
                                  );
                                  
                                  // For demo, just log the test case
                                  console.log(`Generated ${testType.label} test case:`, testCase);
                                }}
                                >
                                  <div style={{ fontWeight: '500', color: testType.color }}>{testType.label} Test</div>
                                  <div style={{ color: '#666' }}>{testType.desc}</div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Data Generation Tools */}
                            <div style={{ marginBottom: '16px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '4px' }}>Data Generation</div>
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                <button
                                  style={{
                                    flex: 1,
                                    padding: '6px 8px',
                                    backgroundColor: '#607D8B',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '11px'
                                  }}
                                  onClick={() => {
                                    const flowDef = moduleRegistry.getFlowDefinition(currentFlowFqn);
                                    const triggerData = debugTestActionsService.resolveTriggerInputData(
                                      flowDef?.trigger || {},
                                      undefined,
                                      'happy_path'
                                    );
                                    console.log('Generated trigger data:', triggerData);
                                  }}
                                >
                                  Generate Trigger Data
                                </button>
                                
                                {selectedElement && selectedElement.sourceType === 'flowNode' && (
                                  <button
                                    style={{
                                      flex: 1,
                                      padding: '6px 8px',
                                      backgroundColor: '#795548',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '11px'
                                    }}
                                    onClick={async () => {
                                      try {
                                        const stepInput = await debugTestActionsService.resolveStepInputData(
                                          selectedElement.id,
                                          currentFlowFqn
                                        );
                                        console.log(`Generated input for ${selectedElement.id}:`, stepInput);
                                      } catch (error) {
                                        console.error('Failed to generate step input:', error);
                                      }
                                    }}
                                  >
                                    Generate Step Input
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Execution Results */}
                            <div>
                              <div style={{ fontWeight: '500', marginBottom: '4px' }}>Execution Results</div>
                              <div style={{ 
                                padding: '8px',
                                backgroundColor: '#f9f9f9',
                                border: '1px solid #e0e0e0',
                                borderRadius: '4px',
                                fontSize: '12px',
                                color: '#666',
                                maxHeight: '200px',
                                overflowY: 'auto'
                              }}>
                                {currentExecutionResults ? (
                                  <div>
                                    <div style={{ fontWeight: '500', marginBottom: '8px' }}>
                                      Latest Execution: {currentExecutionResults.flowFqn}
                                    </div>
                                    <div style={{ marginBottom: '4px' }}>
                                      Status: <span style={{ 
                                        color: currentExecutionResults.status === 'COMPLETED' ? '#4CAF50' : 
                                              currentExecutionResults.status === 'FAILED' ? '#F44336' : '#FF9800'
                                      }}>
                                        {currentExecutionResults.status}
                                      </span>
                                    </div>
                                    <div style={{ marginBottom: '4px' }}>
                                      Duration: {currentExecutionResults.durationMs || 0}ms
                                    </div>
                                    <div style={{ marginBottom: '8px' }}>
                                      Steps Executed: {currentExecutionResults.steps?.length || 0}
                                    </div>
                                    
                                    {currentExecutionResults.steps && currentExecutionResults.steps.length > 0 && (
                                      <div>
                                        <div style={{ fontWeight: '500', marginBottom: '4px' }}>Step Status:</div>
                                        {currentExecutionResults.steps.map((step: any, index: number) => (
                                          <div key={step.stepId || index} style={{ 
                                            fontSize: '11px', 
                                            marginBottom: '2px',
                                            color: step.status === 'SUCCESS' ? '#4CAF50' : 
                                                  step.status === 'FAILURE' ? '#F44336' : 
                                                  step.status === 'RUNNING' ? '#FF9800' : '#666'
                                          }}>
                                            {step.stepId}: {step.status} ({step.durationMs || 0}ms)
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  'No execution results yet. Run debug execution or tests to see results here.'
                                )}
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
                </>
              ) : (
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  color: '#666',
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px'
                }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>
                    {tabAvailability.activeTab.charAt(0).toUpperCase() + tabAvailability.activeTab.slice(1)} Tab
                  </h4>
                  <p>This tab is not available for the current selection.</p>
                  <p style={{ fontSize: '12px', color: '#999' }}>
                    {tabAvailability.activeTab === 'properties' && 'Properties tab is only available for configurable components.'}
                    {tabAvailability.activeTab === 'debugtest' && 'Debug & Test tab is only available when a flow is selected or for executable elements.'}
                    {tabAvailability.activeTab === 'source' && 'Source tab is only available when an element is selected.'}
                  </p>
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
      </ReactFlowProvider>
    </div>
  );
};

export default React.memo(CascadeFlowVisualizer); 