// Layout Service using ELK.js
// Provides automatic graph layout for React Flow nodes and edges

import ELK from 'elkjs/lib/elk.bundled.js';
import { Node, Edge } from 'reactflow';

const elk = new ELK();

export interface LayoutOptions {
  direction?: 'DOWN' | 'UP' | 'RIGHT' | 'LEFT';
  spacing?: {
    nodeNode?: number;
    edgeNode?: number;
    edgeEdge?: number;
  };
}

export async function layoutNodes(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const {
    direction = 'DOWN',
    spacing = {
      nodeNode: 50,
      edgeNode: 10,
      edgeEdge: 10
    }
  } = options;

  // Convert React Flow nodes/edges to ELK format
  const elkNodes = nodes.map(node => ({
    id: node.id,
    width: 150, // Default width - could be calculated from node content
    height: 80,  // Default height - could be calculated from node content
  }));

  const elkEdges = edges.map(edge => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target]
  }));

  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': direction,
      'elk.spacing.nodeNode': (spacing.nodeNode || 50).toString(),
      'elk.spacing.edgeNode': (spacing.edgeNode || 10).toString(),
      'elk.spacing.edgeEdge': (spacing.edgeEdge || 10).toString(),
      'elk.layered.spacing.nodeNodeBetweenLayers': '100',
    },
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