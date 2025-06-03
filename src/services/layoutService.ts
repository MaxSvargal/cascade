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

    return {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': this.getElkAlgorithm(options.algorithm),
        'elk.direction': options.direction,
        'elk.spacing.nodeNode': options.spacing.nodeNode?.toString(),
        'elk.spacing.edgeNode': options.spacing.edgeNode?.toString(),
        'elk.spacing.edgeEdge': options.spacing.edgeEdge?.toString(),
        'elk.layered.spacing.nodeNodeBetweenLayers': options.spacing.layerSpacing?.toString(),
        'elk.edge.routing': options.edgeRouting,
        'elk.separateConnectedComponents': options.separateConnectedComponents?.toString(),
        'elk.aspectRatio': options.aspectRatio?.toString(),
        'elk.priority': options.priority?.toString(),
        'elk.layered.compaction.postCompaction.strategy': options.compactness ? 'EDGE_LENGTH' : 'NONE'
      },
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
    const nodeSpacing = options.spacing?.nodeNode || 150;
    
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

// Export convenience functions for backward compatibility
export async function layoutNodes(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const service = new LayoutService();
  const result = await service.layoutNodes(nodes, edges, options);
  return { nodes: result.nodes, edges: result.edges };
}

export async function layoutSystemOverview(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const service = new LayoutService();
  const result = await service.layoutSystemOverview(nodes, edges, options);
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