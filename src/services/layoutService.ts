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
    direction = 'DOWN',
    spacing = {
      nodeNode: 50,
      edgeNode: 10,
      edgeEdge: 10,
      layerSpacing: 100
    },
    nodeSize = {
      width: 150,
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
      : { width: nodeSize.width || 150, height: nodeSize.height || 80 };
    
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
    'elk.spacing.nodeNode': (spacing.nodeNode || 50).toString(),
    'elk.spacing.edgeNode': (spacing.edgeNode || 10).toString(),
    'elk.spacing.edgeEdge': (spacing.edgeEdge || 10).toString(),
  };

  // Algorithm-specific options
  if (algorithm === 'layered') {
    layoutOptions['elk.layered.spacing.nodeNodeBetweenLayers'] = (spacing.layerSpacing || 100).toString();
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
    direction: 'DOWN' as const,
    spacing: {
      nodeNode: 60,
      edgeNode: 15,
      layerSpacing: 120
    },
    nodeSize: {
      calculateFromContent: true
    }
  },
  systemOverview: {
    algorithm: 'force' as const,
    direction: 'RIGHT' as const,
    spacing: {
      nodeNode: 100,
      edgeNode: 20
    },
    nodeSize: {
      calculateFromContent: true
    }
  },
  compact: {
    algorithm: 'layered' as const,
    direction: 'DOWN' as const,
    spacing: {
      nodeNode: 30,
      edgeNode: 10,
      layerSpacing: 80
    },
    nodeSize: {
      width: 120,
      height: 60,
      calculateFromContent: false
    }
  }
}; 