// Enhanced Layout Service with ELK.js Integration
// Provides automatic graph layout with multiple algorithms and intelligent node sizing

import ELK from 'elkjs/lib/elk.bundled.js';
import { Node, Edge } from 'reactflow';
import { 
  LayoutOptions as ModelLayoutOptions,
  LayoutAlgorithmEnum,
  LayoutDirectionEnum,
  NodeSizeOptions,
  LayoutSpacing
} from '@/models/cfv_models_generated';

// Extended layout options for internal use
export interface LayoutOptions extends ModelLayoutOptions {
  algorithm?: LayoutAlgorithmEnum;
  direction?: LayoutDirectionEnum;
  spacing?: LayoutSpacing;
  nodeSize?: NodeSizeOptions;
  edgeRouting?: string;
  // Additional ELK-specific options
  separateConnectedComponents?: boolean;
  aspectRatio?: number;
  priority?: number;
  compactness?: number;
}

export interface LayoutPreset {
  name: string;
  description: string;
  options: LayoutOptions;
}

export interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
  layoutTime: number;
  algorithm: string;
  success: boolean;
  error?: string;
}

// Predefined layout presets
export const layoutPresets: Record<string, LayoutPreset> = {
  flowDetail: {
    name: 'Flow Detail',
    description: 'Optimized for detailed flow visualization with left-to-right orientation',
    options: {
      algorithm: 'layered',
      direction: 'RIGHT',
      spacing: {
        nodeNode: 80,
        edgeNode: 20,
        edgeEdge: 10,
        layerSpacing: 100
      },
      nodeSize: {
        calculateFromContent: true,
        minWidth: 120,
        maxWidth: 300,
        minHeight: 60,
        maxHeight: 200,
        padding: { top: 8, right: 12, bottom: 8, left: 12 }
      },
      edgeRouting: 'ORTHOGONAL',
      separateConnectedComponents: false
    }
  },
  flowDetailSquare: {
    name: 'Flow Detail Square',
    description: 'Square-shaped layout for flows with many nodes, top-to-bottom orientation',
    options: {
      algorithm: 'layered',
      direction: 'DOWN',
      spacing: {
        nodeNode: 100,
        edgeNode: 30,
        edgeEdge: 15,
        layerSpacing: 140
      },
      nodeSize: {
        calculateFromContent: true,
        minWidth: 160,
        maxWidth: 240,
        minHeight: 60,
        maxHeight: 120,
        padding: { top: 10, right: 14, bottom: 10, left: 14 }
      },
      edgeRouting: 'ORTHOGONAL',
      separateConnectedComponents: false,
      aspectRatio: 1.2, // Prefer square-ish aspect ratio
      compactness: 0.7
    }
  },
  systemOverview: {
    name: 'System Overview',
    description: 'Optimized for system-level flow relationships',
    options: {
      algorithm: 'layered',
      direction: 'RIGHT',
      spacing: {
        nodeNode: 100,
        edgeNode: 30,
        edgeEdge: 15,
        layerSpacing: 120
      },
      nodeSize: {
        calculateFromContent: true,
        minWidth: 150,
        maxWidth: 250,
        minHeight: 80,
        maxHeight: 150,
        padding: { top: 10, right: 15, bottom: 10, left: 15 }
      },
      edgeRouting: 'ORTHOGONAL',
      separateConnectedComponents: true
    }
  },
  systemOverviewSquare: {
    name: 'System Overview Square',
    description: 'Square-shaped layout for system overview with many flows',
    options: {
      algorithm: 'layered',
      direction: 'DOWN',
      spacing: {
        nodeNode: 120,
        edgeNode: 40,
        edgeEdge: 20,
        layerSpacing: 160
      },
      nodeSize: {
        calculateFromContent: true,
        minWidth: 180,
        maxWidth: 260,
        minHeight: 80,
        maxHeight: 140,
        padding: { top: 14, right: 18, bottom: 14, left: 18 }
      },
      edgeRouting: 'ORTHOGONAL',
      separateConnectedComponents: true,
      aspectRatio: 1.0, // Square aspect ratio
      compactness: 0.6
    }
  },
  compact: {
    name: 'Compact',
    description: 'Space-efficient layout for large graphs',
    options: {
      algorithm: 'layered',
      direction: 'DOWN',
      spacing: {
        nodeNode: 40,
        edgeNode: 15,
        edgeEdge: 8,
        layerSpacing: 60
      },
      nodeSize: {
        calculateFromContent: false,
        width: 100,
        height: 50,
        padding: { top: 4, right: 8, bottom: 4, left: 8 }
      },
      edgeRouting: 'POLYLINE',
      compactness: 0.8
    }
  },
  compactSquare: {
    name: 'Compact Square',
    description: 'Very space-efficient square layout for very large graphs',
    options: {
      algorithm: 'layered',
      direction: 'DOWN',
      spacing: {
        nodeNode: 50,
        edgeNode: 20,
        edgeEdge: 10,
        layerSpacing: 70
      },
      nodeSize: {
        calculateFromContent: true,
        minWidth: 100,
        maxWidth: 180,
        minHeight: 40,
        maxHeight: 80,
        padding: { top: 6, right: 10, bottom: 6, left: 10 }
      },
      edgeRouting: 'POLYLINE',
      compactness: 0.9,
      aspectRatio: 1.0
    }
  },
  hierarchical: {
    name: 'Hierarchical',
    description: 'Tree-like layout for hierarchical structures',
    options: {
      algorithm: 'mrtree',
      direction: 'DOWN',
      spacing: {
        nodeNode: 60,
        edgeNode: 20,
        layerSpacing: 80
      },
      nodeSize: {
        calculateFromContent: true,
        minWidth: 100,
        maxWidth: 200,
        minHeight: 50,
        maxHeight: 100
      },
      edgeRouting: 'POLYLINE'
    }
  },
  force: {
    name: 'Force-Directed',
    description: 'Physics-based layout for organic appearance',
    options: {
      algorithm: 'force',
      spacing: {
        nodeNode: 100,
        edgeNode: 50
      },
      nodeSize: {
        calculateFromContent: true,
        minWidth: 80,
        maxWidth: 180,
        minHeight: 40,
        maxHeight: 120
      }
    }
  }
};

// Create a single ELK instance to reuse
const elk = new ELK();

/**
 * Enhanced Layout Service with ELK.js integration
 */
export class LayoutService {
  private cache: Map<string, LayoutResult> = new Map();
  private cacheMaxSize = 50;

  constructor() {
    // ELK instance is created globally and reused
  }

  /**
   * Applies layout to nodes and edges using specified options
   */
  async layoutNodes(
    nodes: Node[],
    edges: Edge[],
    options: LayoutOptions = {}
  ): Promise<LayoutResult> {
    const startTime = performance.now();
    
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(nodes, edges, options);
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)!;
        return {
          ...cached,
          layoutTime: performance.now() - startTime
        };
      }

      // Apply default options
      const layoutOptions = this.mergeWithDefaults(options);
      
      // Calculate node sizes if needed
      const nodesWithSizes = this.calculateNodeSizes(nodes, layoutOptions.nodeSize);
      
      // Convert to ELK format
      const elkGraph = this.convertToElkGraph(nodesWithSizes, edges, layoutOptions);
      
      // Apply ELK layout
      const laidOutGraph = await elk.layout(elkGraph);
      
      // Convert back to React Flow format
      const { nodes: layoutedNodes, edges: layoutedEdges } = this.convertFromElkGraph(
        laidOutGraph,
        nodesWithSizes,
        edges
      );

      const result: LayoutResult = {
        nodes: layoutedNodes,
        edges: layoutedEdges,
        layoutTime: performance.now() - startTime,
        algorithm: layoutOptions.algorithm || 'layered',
        success: true
      };

      // Cache the result
      this.cacheResult(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Layout failed:', error);
      
      // Return fallback layout
      const fallbackNodes = this.applyFallbackLayout(nodes, options);
      
      return {
        nodes: fallbackNodes,
        edges,
        layoutTime: performance.now() - startTime,
        algorithm: 'fallback',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown layout error'
      };
    }
  }

  /**
   * Applies system overview specific layout
   */
  async layoutSystemOverview(
    nodes: Node[],
    edges: Edge[],
    options: LayoutOptions = {}
  ): Promise<LayoutResult> {
    // Use system overview preset as base
    const systemOptions = {
      ...layoutPresets.systemOverview.options,
      ...options
    };

    // Apply custom system overview logic
    const enhancedNodes = this.enhanceSystemOverviewNodes(nodes);
    
    return this.layoutNodes(enhancedNodes, edges, systemOptions);
  }

  /**
   * Calculates optimal node size based on content
   */
  calculateNodeSize(node: Node, options?: NodeSizeOptions): { width: number; height: number } {
    const opts = options || {};
    
    if (!opts.calculateFromContent) {
      return {
        width: opts.width || 150,
        height: opts.height || 80
      };
    }

    // Calculate based on content
    const label = node.data?.label || node.id;
    const hasDescription = node.data?.description || node.data?.dslObject?.description;
    const hasError = node.data?.error;
    
    // Base dimensions
    let width = Math.max(label.length * 8 + 40, opts.minWidth || 100);
    let height = opts.minHeight || 60;
    
    // Adjust for content
    if (hasDescription) {
      height += 20;
      width = Math.max(width, 180);
    }
    
    if (hasError) {
      height += 15;
      width = Math.max(width, 200);
    }
    
    // Apply constraints
    width = Math.min(Math.max(width, opts.minWidth || 100), opts.maxWidth || 300);
    height = Math.min(Math.max(height, opts.minHeight || 60), opts.maxHeight || 200);
    
    // Add padding
    if (opts.padding) {
      width += (opts.padding.left || 0) + (opts.padding.right || 0);
      height += (opts.padding.top || 0) + (opts.padding.bottom || 0);
    }

    return { width, height };
  }

  /**
   * Gets available layout presets
   */
  getLayoutPresets(): Record<string, LayoutPreset> {
    return layoutPresets;
  }

  /**
   * Clears the layout cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.cacheMaxSize,
      hitRate: 0 // Would need to track hits/misses for accurate calculation
    };
  }

  // Private methods

  private mergeWithDefaults(options: LayoutOptions): Required<LayoutOptions> {
    const defaultSpacing = {
      nodeNode: 80,
      edgeNode: 20,
      edgeEdge: 10,
      layerSpacing: 100
    };

    const defaultNodeSize = {
      calculateFromContent: true,
      width: 150,
      height: 80,
      minWidth: 100,
      maxWidth: 300,
      minHeight: 60,
      maxHeight: 200,
      padding: { top: 8, right: 12, bottom: 8, left: 12 }
    };

    return {
      algorithm: 'layered',
      direction: 'RIGHT',
      spacing: { ...defaultSpacing, ...options.spacing },
      nodeSize: { ...defaultNodeSize, ...options.nodeSize },
      edgeRouting: 'ORTHOGONAL',
      separateConnectedComponents: false,
      aspectRatio: 1.6,
      priority: 0,
      compactness: 0.5,
      ...options
    };
  }

  private calculateNodeSizes(nodes: Node[], sizeOptions?: NodeSizeOptions): Node[] {
    return nodes.map(node => ({
      ...node,
      ...this.calculateNodeSize(node, sizeOptions)
    }));
  }

  private convertToElkGraph(nodes: Node[], edges: Edge[], options: Required<LayoutOptions>): any {
    const elkNodes = nodes.map(node => ({
      id: node.id,
      width: node.width || 150,
      height: node.height || 80,
      layoutOptions: {
        'elk.padding': `[top=${options.nodeSize.padding?.top || 8},left=${options.nodeSize.padding?.left || 12},bottom=${options.nodeSize.padding?.bottom || 8},right=${options.nodeSize.padding?.right || 12}]`
      }
    }));

    const elkEdges = edges.map(edge => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target]
    }));

    // Enhanced ELK options for better fork and parallel path handling
    const elkLayoutOptions: Record<string, string> = {
      'elk.algorithm': this.getElkAlgorithm(options.algorithm),
      'elk.direction': options.direction,
      'elk.spacing.nodeNode': options.spacing.nodeNode?.toString() || '60',
      'elk.spacing.edgeNode': options.spacing.edgeNode?.toString() || '20',
      'elk.spacing.edgeEdge': options.spacing.edgeEdge?.toString() || '10',
      'elk.edge.routing': options.edgeRouting || 'ORTHOGONAL',
      'elk.separateConnectedComponents': options.separateConnectedComponents?.toString() || 'false',
      'elk.aspectRatio': options.aspectRatio?.toString() || '1.6',
      'elk.priority': options.priority?.toString() || '0',
      
      // SIMPLIFIED: Core layered algorithm options
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
      
      // CRITICAL: Spacing between layers and nodes
      'elk.layered.spacing.nodeNodeBetweenLayers': (options.spacing.layerSpacing || 80).toString(),
      'elk.layered.spacing.edgeNodeBetweenLayers': (options.spacing.edgeNode || 20).toString(),
      'elk.layered.spacing.edgeEdgeBetweenLayers': (options.spacing.edgeEdge || 10).toString(),
      
      // ENHANCED: More vertical spacing for fork nodes
      'elk.layered.spacing.inLayerSpacingFactor': '8.0', // Good vertical space between fork nodes
      'elk.layered.nodePlacement.favorStraightEdges': 'true',
      'elk.layered.mergeEdges': 'false',
      
      // SIMPLIFIED: Basic alignment and spacing control
      'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
      'elk.layered.spacing.individualOverride': 'false',
      'elk.layered.thoroughness': '5' // Reasonable thoroughness
    };

    return {
      id: 'root',
      layoutOptions: elkLayoutOptions,
      children: elkNodes,
      edges: elkEdges
    };
  }

  private convertFromElkGraph(elkGraph: any, originalNodes: Node[], originalEdges: Edge[]): { nodes: Node[]; edges: Edge[] } {
    const nodeMap = new Map(originalNodes.map(node => [node.id, node]));
    
    const nodes = elkGraph.children?.map((elkNode: any) => {
      const originalNode = nodeMap.get(elkNode.id);
      return {
        ...originalNode,
        position: {
          x: elkNode.x || 0,
          y: elkNode.y || 0
        },
        width: elkNode.width,
        height: elkNode.height
      };
    }) || originalNodes;

    // ELK doesn't modify edges much, so return originals
    const edges = originalEdges;

    return { nodes, edges };
  }

  private getElkAlgorithm(algorithm: LayoutAlgorithmEnum): string {
    const algorithmMap: Record<LayoutAlgorithmEnum, string> = {
      'layered': 'layered',
      'force': 'force',
      'mrtree': 'mrtree',
      'radial': 'radial',
      'disco': 'disco',
      'rectpacking': 'rectpacking',
      'stress': 'stress'
    };
    
    return algorithmMap[algorithm] || 'layered';
  }

  private enhanceSystemOverviewNodes(nodes: Node[]): Node[] {
    return nodes.map(node => {
      // Add system-specific enhancements
      if (node.type === 'systemFlowNode') {
        return {
          ...node,
          data: {
            ...node.data,
            enhanced: true,
            systemLevel: true
          }
        };
      }
      return node;
    });
  }

  private applyFallbackLayout(nodes: Node[], options: LayoutOptions): Node[] {
    // Simple grid layout as fallback
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const nodeSpacing = options.spacing?.nodeNode || 80;
    
    return nodes.map((node, index) => ({
      ...node,
      position: {
        x: (index % cols) * nodeSpacing,
        y: Math.floor(index / cols) * nodeSpacing
      }
    }));
  }

  private generateCacheKey(nodes: Node[], edges: Edge[], options: LayoutOptions): string {
    const nodeIds = nodes.map(n => n.id).sort().join(',');
    const edgeIds = edges.map(e => `${e.source}-${e.target}`).sort().join(',');
    const optionsStr = JSON.stringify(options);
    
    return `${nodeIds}|${edgeIds}|${optionsStr}`;
  }

  private cacheResult(key: string, result: LayoutResult): void {
    // Implement LRU cache behavior
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, result);
  }
}

// Export convenience functions for backward compatibility with enhanced horizontal layout
export async function layoutNodes(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const service = new LayoutService();
  
  // Use enhanced horizontal layout for flows with many nodes
  const isLongFlow = nodes.length > 7;
  
  if (isLongFlow && !options.algorithm && !options.direction) {
    console.log(`📏 Using enhanced horizontal layout for flow with ${nodes.length} nodes`);
    
    // Use enhanced horizontal layout with REDUCED spacing (50% reduction)
    const finalOptions = {
      algorithm: 'layered' as const,
      direction: 'RIGHT' as const,
      spacing: {
        nodeNode: 50,         // Good spacing for smaller nodes
        edgeNode: 20,         // Simple edge spacing
        edgeEdge: 10,         // Simple edge separation
        layerSpacing: 80      // Good layer separation
      },
      nodeSize: {
        calculateFromContent: true,
        minWidth: 160,        // REDUCED: Match SubFlow node minimum
        maxWidth: 240,        // REDUCED: Match SubFlow node maximum to prevent overlap
        minHeight: 70,        // Reasonable minimum height
        maxHeight: 120,       // Reasonable maximum height
        padding: { top: 10, right: 12, bottom: 10, left: 12 } // Simple padding
      },
      edgeRouting: 'ORTHOGONAL',
      separateConnectedComponents: false,
      aspectRatio: 3.0,     // Wide aspect ratio for long flows
      compactness: 0.3,     // Simple compactness
      ...options // Allow user overrides
    };
    
    const result = await service.layoutNodes(nodes, edges, finalOptions);
    return { nodes: result.nodes, edges: result.edges };
  } else if (!isLongFlow && !options.algorithm && !options.direction) {
    // Use regular layout for shorter flows with REDUCED spacing
    const finalOptions = {
      algorithm: 'layered' as const,
      direction: 'RIGHT' as const,
      spacing: {
        nodeNode: 60,         // Slightly more spacing for regular flows
        edgeNode: 20,         // Simple edge spacing
        edgeEdge: 10,         // Simple edge separation
        layerSpacing: 90      // Good layer separation
      },
      nodeSize: {
        calculateFromContent: true,
        minWidth: 140,        // Slightly smaller for regular nodes
        maxWidth: 220,        // Smaller maximum width
        minHeight: 60,        // Regular minimum height
        maxHeight: 100,       // Smaller maximum height
        padding: { top: 8, right: 12, bottom: 8, left: 12 }
      },
      edgeRouting: 'ORTHOGONAL',
      separateConnectedComponents: false,
      aspectRatio: 1.6,
      compactness: 0.4,     // Simple compactness
      ...options // Allow user overrides
    };
    
    const result = await service.layoutNodes(nodes, edges, finalOptions);
    return { nodes: result.nodes, edges: result.edges };
  } else {
    // Use provided options
    const result = await service.layoutNodes(nodes, edges, options);
    return { nodes: result.nodes, edges: result.edges };
  }
}

export async function layoutSystemOverview(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const service = new LayoutService();
  
  // Use enhanced horizontal layout with REDUCED spacing for system overview
  const finalOptions = {
    algorithm: 'layered' as const,
    direction: 'RIGHT' as const,
    spacing: {
      nodeNode: 23,         // Reduced from 45px (approximately 50% reduction)
      edgeNode: 6,          // Reduced from 12px (50% reduction)
      edgeEdge: 3,          // Reduced from 6px (50% reduction)
      layerSpacing: 35      // Reduced from 70px (50% reduction)
    },
    nodeSize: {
      calculateFromContent: true,
      minWidth: 180,
      maxWidth: 300,
      minHeight: 80,
      maxHeight: 140,
      padding: { top: 14, right: 18, bottom: 14, left: 18 }
    },
    edgeRouting: 'ORTHOGONAL',
    separateConnectedComponents: true,
    aspectRatio: 2.5,     // Wide aspect ratio for system overview
    compactness: 0.4,     // Less compactness for better readability
    ...options // Allow user overrides
  };
  
  const result = await service.layoutSystemOverview(nodes, edges, finalOptions);
  return { nodes: result.nodes, edges: result.edges };
}

export async function layoutSystemOverviewCustom(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  // Custom system overview layout with trigger positioning
  const service = new LayoutService();
  
  // Separate triggers and flows
  const triggerNodes = nodes.filter(n => n.type === 'systemTriggerNode');
  const flowNodes = nodes.filter(n => n.type === 'systemFlowNode');
  const otherNodes = nodes.filter(n => !['systemTriggerNode', 'systemFlowNode'].includes(n.type || ''));
  
  // Layout flows first
  const flowResult = await service.layoutNodes(flowNodes, edges, {
    ...options,
    algorithm: 'layered',
    direction: 'RIGHT'
  });
  
  // Position triggers above their corresponding flows
  const enhancedNodes = [
    ...flowResult.nodes,
    ...triggerNodes.map((trigger, index) => ({
      ...trigger,
      position: {
        x: index * 200,
        y: -100 // Position above flows
      }
    })),
    ...otherNodes
  ];
  
  return { nodes: enhancedNodes, edges };
}

function optimizeEdgeRouting(edges: Edge[], nodes: Node[]): Edge[] {
  // Simple edge optimization - could be enhanced
  return edges.map(edge => ({
    ...edge,
    style: {
      ...edge.style,
      strokeWidth: 2,
      stroke: '#666'
    }
  }));
}

function calculateNodeSize(node: Node): { width: number; height: number } {
  const service = new LayoutService();
  return service.calculateNodeSize(node);
} 