// Layout Service using ELK.js
// Provides automatic graph layout for React Flow nodes and edges

import ELK from 'elkjs/lib/elk.bundled.js';
import { Node, Edge } from 'reactflow';

const elk = new ELK();

export interface LayoutOptions {
  algorithm?: 'layered' | 'force' | 'mrtree' | 'radial' | 'disco';
  direction?: 'DOWN' | 'UP' | 'RIGHT' | 'LEFT';
  spacing?: {
    nodeNode?: number;
    edgeNode?: number;
    edgeEdge?: number;
    layerSpacing?: number;
  };
  nodeSize?: {
    width?: number;
    height?: number;
    calculateFromContent?: boolean;
  };
}

// Calculate node dimensions based on content
function calculateNodeSize(node: Node): { width: number; height: number } {
  const baseWidth = 150;
  const baseHeight = 80;
  
  if (node.data?.label) {
    // Rough calculation based on text length
    const textLength = node.data.label.length;
    const calculatedWidth = Math.max(baseWidth, textLength * 8 + 40);
    
    // Add height for additional content
    let calculatedHeight = baseHeight;
    if (node.data?.resolvedComponentFqn) calculatedHeight += 20;
    if (node.data?.executionStatus) calculatedHeight += 20;
    if (node.data?.error) calculatedHeight += 20;
    if (node.data?.invokedFlowFqn) calculatedHeight += 20;
    
    return {
      width: Math.min(calculatedWidth, 250), // Max width
      height: Math.min(calculatedHeight, 150) // Max height
    };
  }
  
  return { width: baseWidth, height: baseHeight };
}

export async function layoutNodes(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const {
    algorithm = 'layered',
    direction = 'RIGHT',
    spacing = {
      nodeNode: 80,
      edgeNode: 20,
      edgeEdge: 10,
      layerSpacing: 120
    },
    nodeSize = {
      width: 200,
      height: 80,
      calculateFromContent: true
    }
  } = options;

  if (nodes.length === 0) {
    return { nodes, edges };
  }

  // Convert React Flow nodes/edges to ELK format
  const elkNodes = nodes.map(node => {
    const size = nodeSize.calculateFromContent 
      ? calculateNodeSize(node)
      : { width: nodeSize.width || 200, height: nodeSize.height || 80 };
    
    return {
      id: node.id,
      width: size.width,
      height: size.height,
      layoutOptions: {
        // Node-specific layout options can be added here
      }
    };
  });

  const elkEdges = edges.map(edge => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
    layoutOptions: {
      // Edge-specific layout options
      'elk.edge.thickness': edge.data?.type === 'dataFlow' ? '2' : '1'
    }
  }));

  // Build layout options based on algorithm
  const layoutOptions: Record<string, string> = {
    'elk.algorithm': algorithm,
    'elk.direction': direction,
    'elk.spacing.nodeNode': (spacing.nodeNode || 80).toString(),
    'elk.spacing.edgeNode': (spacing.edgeNode || 20).toString(),
    'elk.spacing.edgeEdge': (spacing.edgeEdge || 10).toString(),
  };

  // Algorithm-specific options
  if (algorithm === 'layered') {
    layoutOptions['elk.layered.spacing.nodeNodeBetweenLayers'] = (spacing.layerSpacing || 120).toString();
    layoutOptions['elk.layered.crossingMinimization.strategy'] = 'LAYER_SWEEP';
    layoutOptions['elk.layered.nodePlacement.strategy'] = 'SIMPLE';
  } else if (algorithm === 'force') {
    layoutOptions['elk.force.repulsivePower'] = '200';
    layoutOptions['elk.force.iterations'] = '300';
  } else if (algorithm === 'mrtree') {
    layoutOptions['elk.mrtree.searchOrder'] = 'DFS';
  }

  const elkGraph = {
    id: 'root',
    layoutOptions,
    children: elkNodes,
    edges: elkEdges
  };

  try {
    const layoutedGraph = await elk.layout(elkGraph);
    
    // Apply positions back to React Flow nodes
    const layoutedNodes = nodes.map(node => {
      const elkNode = layoutedGraph.children?.find(n => n.id === node.id);
      if (elkNode) {
        return {
          ...node,
          position: {
            x: elkNode.x || 0,
            y: elkNode.y || 0
          },
          // Update node dimensions if calculated
          style: {
            ...node.style,
            width: elkNode.width,
            height: elkNode.height
          }
        };
      }
      return node;
    });

    return {
      nodes: layoutedNodes,
      edges
    };
  } catch (error) {
    console.warn('ELK layout failed, using original positions:', error);
    return { nodes, edges };
  }
}

// Preset layout configurations for different use cases
export const layoutPresets = {
  flowDetail: {
    algorithm: 'layered' as const,
    direction: 'RIGHT' as const,
    spacing: {
      nodeNode: 80,
      edgeNode: 20,
      layerSpacing: 120
    },
    nodeSize: {
      calculateFromContent: true
    }
  },
  systemOverview: {
    algorithm: 'layered' as const,
    direction: 'RIGHT' as const,
    spacing: {
      nodeNode: 100,
      edgeNode: 30,
      layerSpacing: 150
    },
    nodeSize: {
      calculateFromContent: true
    }
  },
  compact: {
    algorithm: 'layered' as const,
    direction: 'RIGHT' as const,
    spacing: {
      nodeNode: 60,
      edgeNode: 15,
      layerSpacing: 80
    },
    nodeSize: {
      width: 150,
      height: 70,
      calculateFromContent: true
    }
  }
};

/**
 * Simple and Clean System Overview Layout
 * - Flows arranged horizontally from left to right
 * - Triggers positioned directly above their connected flow
 * - Connected flows (via SubFlowInvoker) positioned next to each other and waterfalled down
 */
export async function layoutSystemOverview(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  if (nodes.length === 0) {
    return { nodes, edges };
  }

  // Separate different types of nodes
  const triggerNodes = nodes.filter(node => node.type === 'systemTriggerNode');
  const flowNodes = nodes.filter(node => node.type === 'systemFlowNode');
  
  // Build flow connections map (which flows invoke which)
  const flowConnections = new Map<string, string[]>(); // sourceFlow -> [targetFlows]
  const flowIncomingConnections = new Map<string, string[]>(); // targetFlow -> [sourceFlows]
  
  edges.forEach(edge => {
    if (edge.data?.type === 'invocationEdge') {
      const sourceFlow = edge.source;
      const targetFlow = edge.target;
      
      if (!flowConnections.has(sourceFlow)) {
        flowConnections.set(sourceFlow, []);
      }
      flowConnections.get(sourceFlow)!.push(targetFlow);
      
      if (!flowIncomingConnections.has(targetFlow)) {
        flowIncomingConnections.set(targetFlow, []);
      }
      flowIncomingConnections.get(targetFlow)!.push(sourceFlow);
    }
  });

  // Find root flows (flows with no incoming connections)
  const rootFlows = flowNodes.filter(node => 
    !flowIncomingConnections.has(node.id) || flowIncomingConnections.get(node.id)!.length === 0
  );

  // Improved layout parameters to prevent overlaps
  const flowSpacing = 300; // Increased horizontal spacing between flows
  const triggerOffset = 120; // Vertical offset for triggers above flows
  const waterfallOffset = 100; // Increased vertical offset for connected flows
  const waterfallLeftOffset = 50; // Left offset for waterfalled flows
  const nodeHeight = 120; // Estimated node height for spacing calculations
  
  const positionedFlowNodes: Node[] = [];
  const positionedTriggerNodes: Node[] = [];
  const processedFlows = new Set<string>();
  
  // Position root flows horizontally with proper spacing
  let currentX = 0;
  const baseY = 200; // Start flows lower to leave space for triggers
  
  rootFlows.forEach((flowNode, index) => {
    const x = currentX;
    const y = baseY;
    
    positionedFlowNodes.push({
      ...flowNode,
      position: { x, y }
    });
    processedFlows.add(flowNode.id);
    
    // Position trigger above this flow if it exists
    const triggerEdge = edges.find(edge => 
      edge.target === flowNode.id && edge.data?.type === 'triggerLinkEdge'
    );
    
    if (triggerEdge) {
      const triggerNode = triggerNodes.find(node => node.id === triggerEdge.source);
      if (triggerNode) {
        positionedTriggerNodes.push({
          ...triggerNode,
          position: { 
            x: x, // Same X as flow
            y: y - triggerOffset // Above the flow
          }
        });
      }
    }
    
    // Position connected flows (waterfalled down and to the right with left offset)
    const connectedFlows = flowConnections.get(flowNode.id) || [];
    let waterfallY = y;
    
    connectedFlows.forEach((connectedFlowId, connectedIndex) => {
      const connectedFlowNode = flowNodes.find(node => node.id === connectedFlowId);
      if (connectedFlowNode && !processedFlows.has(connectedFlowId)) {
        waterfallY += waterfallOffset;
        
        positionedFlowNodes.push({
          ...connectedFlowNode,
          position: { 
            x: x + flowSpacing + waterfallLeftOffset, // To the right of parent flow with left offset
            y: waterfallY // Waterfalled down
          }
        });
        processedFlows.add(connectedFlowId);
        
        // Position trigger for connected flow
        const connectedTriggerEdge = edges.find(edge => 
          edge.target === connectedFlowId && edge.data?.type === 'triggerLinkEdge'
        );
        
        if (connectedTriggerEdge) {
          const connectedTriggerNode = triggerNodes.find(node => node.id === connectedTriggerEdge.source);
          if (connectedTriggerNode) {
            positionedTriggerNodes.push({
              ...connectedTriggerNode,
              position: { 
                x: x + flowSpacing + waterfallLeftOffset, // Same X as connected flow
                y: waterfallY - triggerOffset // Above the connected flow
              }
            });
          }
        }
      }
    });
    
    currentX += flowSpacing;
  });
  
  // Handle any remaining unprocessed flows (place them to the right with proper spacing)
  const remainingFlows = flowNodes.filter(node => !processedFlows.has(node.id));
  let remainingY = baseY;
  
  remainingFlows.forEach((flowNode, index) => {
    const x = currentX;
    const y = remainingY;
    
    positionedFlowNodes.push({
      ...flowNode,
      position: { x, y }
    });
    
    // Position trigger for remaining flow
    const triggerEdge = edges.find(edge => 
      edge.target === flowNode.id && edge.data?.type === 'triggerLinkEdge'
    );
    
    if (triggerEdge) {
      const triggerNode = triggerNodes.find(node => node.id === triggerEdge.source);
      if (triggerNode) {
        positionedTriggerNodes.push({
          ...triggerNode,
          position: { 
            x: x,
            y: y - triggerOffset
          }
        });
      }
    }
    
    remainingY += waterfallOffset; // Stack remaining flows vertically
    if (index % 3 === 2) { // Move to next column every 3 flows
      currentX += flowSpacing;
      remainingY = baseY;
    }
  });

  // Handle orphaned triggers (triggers without flows)
  const handledTriggerIds = new Set(positionedTriggerNodes.map(node => node.id));
  const orphanedTriggers = triggerNodes.filter(node => !handledTriggerIds.has(node.id));
  
  orphanedTriggers.forEach((triggerNode, index) => {
    positionedTriggerNodes.push({
      ...triggerNode,
      position: { 
        x: currentX + (index * 150),
        y: baseY - triggerOffset
      }
    });
  });

  return {
    nodes: [...positionedFlowNodes, ...positionedTriggerNodes],
    edges
  };
}

/**
 * Enhanced System Overview Layout with Better Edge Routing
 * Alternative implementation using custom positioning algorithm
 */
export async function layoutSystemOverviewCustom(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  if (nodes.length === 0) {
    return { nodes, edges };
  }

  // Use the main system overview layout
  const result = await layoutSystemOverview(nodes, edges, options);
  
  // Apply additional edge routing optimizations
  const optimizedEdges = optimizeEdgeRouting(result.edges, result.nodes);
  
  return {
    nodes: result.nodes,
    edges: optimizedEdges
  };
}

/**
 * Optimize edge routing for better visual clarity
 */
function optimizeEdgeRouting(edges: Edge[], nodes: Node[]): Edge[] {
  const nodePositions = new Map(nodes.map(node => [node.id, node.position]));
  
  return edges.map(edge => {
    const sourcePos = nodePositions.get(edge.source);
    const targetPos = nodePositions.get(edge.target);
    
    if (!sourcePos || !targetPos) return edge;
    
    // Add custom edge styling based on edge type and positions
    const edgeStyle: any = { ...edge.style };
    
    if (edge.data?.type === 'triggerLinkEdge') {
      // Trigger to flow edges - straight down
      edgeStyle.stroke = '#4CAF50';
      edgeStyle.strokeWidth = 2;
    } else if (edge.data?.type === 'invocationEdge') {
      // Flow to flow invocation edges - curved
      edgeStyle.stroke = '#2196F3';
      edgeStyle.strokeWidth = 2;
      edgeStyle.strokeDasharray = '5,5';
    }
    
    return {
      ...edge,
      style: edgeStyle
    };
  });
} 