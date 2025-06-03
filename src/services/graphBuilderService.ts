// Graph Builder Service Logic
// Transforms DSL data into React Flow nodes and edges

import { Node, Edge, MarkerType } from 'reactflow';
import {
  StepNodeData,
  TriggerEntryPointNodeData,
  SubFlowInvokerNodeData,
  SystemGraphNodeData,
  FlowEdgeData,
  SystemEdgeData,
  IModuleRegistry,
  ComponentSchema,
  FlowExecutionTrace,
  VisualizerModeEnum
} from '@/models/cfv_models_generated';
import { layoutNodes, layoutPresets, layoutSystemOverview } from './layoutService';
import { enhanceNodesWithTrace, enhanceEdgesWithTrace } from './traceVisualizationService';

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export interface GenerateFlowDetailParams {
  flowFqn: string;
  mode: VisualizerModeEnum;
  moduleRegistry: IModuleRegistry;
  parseContextVarsFn: (value: string) => string[];
  componentSchemas: Record<string, ComponentSchema>;
  traceData?: FlowExecutionTrace;
  useAutoLayout?: boolean;
}

/**
 * Generate Flow Detail Graph Data
 * From cfv_internal_code.GraphBuilderService_GenerateFlowDetailGraphData
 */
export async function generateFlowDetailGraphData(params: GenerateFlowDetailParams): Promise<GraphData> {
  const { flowFqn, mode, moduleRegistry, parseContextVarsFn, componentSchemas, traceData, useAutoLayout = true } = params;
  
  const flowDefinition = moduleRegistry.getFlowDefinition(flowFqn);
  if (!flowDefinition) {
    return { nodes: [], edges: [] };
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Generate trigger node
  if (flowDefinition.trigger) {
    const triggerTrace = traceData?.steps.find(t => t.stepId === 'trigger');
    
    const triggerNodeData: TriggerEntryPointNodeData = {
      label: `Trigger: ${flowDefinition.trigger.type}`,
      triggerType: flowDefinition.trigger.type,
      dslObject: flowDefinition.trigger,
      resolvedComponentFqn: flowDefinition.trigger.type,
      componentSchema: componentSchemas[flowDefinition.trigger.type] || undefined,
      isNamedComponent: false,
      contextVarUsages: parseContextVarsFn(JSON.stringify(flowDefinition.trigger)),
      // CRITICAL: Only populate execution fields when trace data is available
      ...(triggerTrace && {
        executionStatus: triggerTrace.status,
        executionDurationMs: triggerTrace.durationMs,
        executionInputData: triggerTrace.inputData,
        executionOutputData: triggerTrace.outputData
      })
    };

    nodes.push({
      id: 'trigger',
      type: 'triggerNode',
      position: { x: 0, y: 0 }, // Will be positioned by ELK
      data: triggerNodeData
    });
  }

  // Generate step nodes
  if (flowDefinition.steps) {
    flowDefinition.steps.forEach((step: any, index: number) => {
      const stepTrace = traceData?.steps.find(t => t.stepId === step.step_id);
      
      // Resolve component info
      const componentInfo = moduleRegistry.resolveComponentTypeInfo(
        step.component_ref, 
        flowFqn.split('.').slice(0, -1).join('.')
      );

      const stepNodeData: StepNodeData = {
        label: step.step_id,
        stepId: step.step_id,
        dslObject: step,
        resolvedComponentFqn: componentInfo?.baseType || step.component_ref,
        componentSchema: componentInfo ? moduleRegistry.getComponentSchema(componentInfo.baseType) || undefined : undefined,
        isNamedComponent: componentInfo?.isNamedComponent || false,
        contextVarUsages: parseContextVarsFn(JSON.stringify(step)),
        // CRITICAL: Only populate execution fields when trace data is available
        // This ensures nodes start clean in design mode without "Not Executed" status
        ...(stepTrace && {
          executionStatus: stepTrace.status,
          executionDurationMs: stepTrace.durationMs,
          executionInputData: stepTrace.inputData,
          executionOutputData: stepTrace.outputData
        })
      };

      // Check if this is a SubFlowInvoker
      if (componentInfo?.baseType === 'StdLib:SubFlowInvoker' || step.component_ref.includes('SubFlowInvoker')) {
        const subFlowNodeData: SubFlowInvokerNodeData = {
          ...stepNodeData,
          invokedFlowFqn: step.config?.flow_fqn || 'unknown'
        };
        
        nodes.push({
          id: step.step_id,
          type: 'subFlowInvokerNode',
          position: { x: 0, y: (index + 1) * 100 },
          data: subFlowNodeData
        });
      } else {
        nodes.push({
          id: step.step_id,
          type: 'stepNode',
          position: { x: 0, y: (index + 1) * 100 },
          data: stepNodeData
        });
      }
    });
  }

  // Generate edges based on inputs_map and run_after
  if (flowDefinition.steps) {
    flowDefinition.steps.forEach((step: any) => {
      // Control flow edges from trigger
      if (!step.run_after || step.run_after.length === 0) {
        const edgeData: FlowEdgeData = {
          type: 'controlFlow',
          targetStepId: step.step_id,
          isExecutedPath: traceData ? true : undefined // Simplified - would need actual path analysis
        };

        edges.push({
          id: `trigger-${step.step_id}`,
          source: 'trigger',
          target: step.step_id,
          type: 'flowEdge',
          data: edgeData
        });
      }

      // Control flow edges from run_after
      if (step.run_after) {
        step.run_after.forEach((sourceStepId: string) => {
          const edgeData: FlowEdgeData = {
            type: 'controlFlow',
            sourceStepId: sourceStepId,
            targetStepId: step.step_id,
            isExecutedPath: traceData ? true : undefined
          };

          edges.push({
            id: `${sourceStepId}-${step.step_id}-control`,
            source: sourceStepId,
            target: step.step_id,
            type: 'flowEdge',
            data: edgeData
          });
        });
      }

      // Data flow edges from inputs_map
      if (step.inputs_map) {
        Object.entries(step.inputs_map).forEach(([inputKey, sourceExpression]: [string, any]) => {
          if (typeof sourceExpression === 'string' && sourceExpression.startsWith('steps.')) {
            const match = sourceExpression.match(/steps\.([^.]+)/);
            if (match) {
              const sourceStepId = match[1];
              const edgeData: FlowEdgeData = {
                type: 'dataFlow',
                sourceStepId: sourceStepId,
                targetStepId: step.step_id,
                isExecutedPath: traceData ? true : undefined
              };

              edges.push({
                id: `${sourceStepId}-${step.step_id}-data-${inputKey}`,
                source: sourceStepId,
                target: step.step_id,
                type: 'flowEdge',
                data: edgeData
              });
            }
          }
        });
      }
    });
  }

  // Apply automatic layout if requested
  if (useAutoLayout && nodes.length > 0) {
    try {
      const layouted = await layoutNodes(nodes, edges, layoutPresets.flowDetail.options);
      
      // Apply trace enhancements if trace data is available
      if (traceData) {
        const enhancedNodes = enhanceNodesWithTrace(layouted.nodes, traceData, {
          showTimings: true,
          showDataFlow: true,
          highlightCriticalPath: true,
          showErrorDetails: true
        });
        
        const enhancedEdges = enhanceEdgesWithTrace(layouted.edges, traceData, {
          showDataFlow: true,
          highlightCriticalPath: true
        });
        
        return { nodes: enhancedNodes, edges: enhancedEdges };
      }
      
      return layouted;
    } catch (error) {
      console.warn('Auto-layout failed, using manual positions:', error);
    }
  }

  // Apply trace enhancements even without layout if trace data is available
  if (traceData) {
    const enhancedNodes = enhanceNodesWithTrace(nodes, traceData);
    const enhancedEdges = enhanceEdgesWithTrace(edges, traceData);
    return { nodes: enhancedNodes, edges: enhancedEdges };
  }

  return { nodes, edges };
}

/**
 * Generate System Overview Graph Data with Navigation Support
 * From cfv_internal_code.GraphBuilderService_GenerateSystemOverviewGraphData
 */
export async function generateSystemOverviewGraphData(
  moduleRegistry: IModuleRegistry,
  parseContextVarsFn: (value: string) => string[],
  useAutoLayout: boolean = true,
  onFlowNodeClick?: (flowFqn: string) => void
): Promise<GraphData> {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  const allModules = moduleRegistry.getAllLoadedModules();
  
  // Generate flow nodes and trigger nodes with navigation support
  allModules.forEach(module => {
    if (module.definitions?.flows) {
      module.definitions.flows.forEach((flow: any) => {
        const flowFqn = `${module.fqn}.${flow.name}`;
        
        // Add flow node with click handler for navigation
        const flowNodeData: SystemGraphNodeData = {
          label: flow.name,
          fqn: flowFqn,
          nodeCategory: 'flow',
          dslObject: flow,
          resolvedComponentFqn: undefined,
          componentSchema: undefined,
          isNamedComponent: false,
          contextVarUsages: parseContextVarsFn(JSON.stringify(flow)),
          // Add navigation metadata to node data
          navigatable: true,
          targetFlowFqn: flowFqn,
          onFlowNodeClick: onFlowNodeClick
        };
        
        nodes.push({
          id: flowFqn,
          type: 'systemFlowNode',
          position: { x: 0, y: 0 },
          data: flowNodeData
        });
        
        // Add trigger node and edge if present
        if (flow.trigger) {
          const triggerNodeId = `trigger-${flowFqn}`;
          const triggerNodeData: SystemGraphNodeData = {
            label: `${flow.trigger.type}`,
            fqn: triggerNodeId,
            nodeCategory: 'externalTrigger',
            dslObject: flow.trigger,
            resolvedComponentFqn: flow.trigger.type,
            componentSchema: undefined,
            isNamedComponent: false,
            contextVarUsages: parseContextVarsFn(JSON.stringify(flow.trigger))
          };
          
          nodes.push({
            id: triggerNodeId,
            type: 'systemTriggerNode',
            position: { x: 0, y: 0 },
            data: triggerNodeData
          });
          
          const edgeData: SystemEdgeData = {
            type: 'triggerLinkEdge'
          };
          
          edges.push({
            id: `${triggerNodeId}-${flowFqn}`,
            source: triggerNodeId,
            target: flowFqn,
            type: 'systemEdge',
            data: edgeData,
            style: {
              stroke: '#4CAF50',
              strokeWidth: 2,
              strokeDasharray: 'none'
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#4CAF50'
            }
          });
        }
        
        // Generate invocation edges for SubFlowInvoker steps
        if (flow.steps) {
          flow.steps.forEach((step: any) => {
            const componentInfo = moduleRegistry.resolveComponentTypeInfo(step.component_ref, module.fqn);
            if (componentInfo?.baseType === 'StdLib:SubFlowInvoker' && step.config?.flow_fqn) {
              const edgeData: SystemEdgeData = {
                type: 'invocationEdge'
              };
              
              edges.push({
                id: `${flowFqn}-${step.config.flow_fqn}`,
                source: flowFqn,
                target: step.config.flow_fqn,
                type: 'systemEdge',
                data: edgeData,
                style: {
                  stroke: '#2196F3',
                  strokeWidth: 2,
                  strokeDasharray: '5,5'
                },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: '#2196F3'
                },
                label: step.step_id,
                labelStyle: {
                  fontSize: '10px',
                  fill: '#666'
                }
              });
            }
          });
        }
      });
    }
  });
  
  // Apply enhanced system overview layout if requested
  if (useAutoLayout && nodes.length > 0) {
    try {
      const layouted = await layoutSystemOverview(nodes, edges, {
        algorithm: 'layered',
        direction: 'RIGHT',
        spacing: {
          nodeNode: 150,
          edgeNode: 50,
          layerSpacing: 250
        },
        nodeSize: {
          calculateFromContent: true
        }
      });
      return layouted;
    } catch (error) {
      console.warn('Auto-layout failed, using manual positions:', error);
    }
  }
  
  return { nodes, edges };
} 