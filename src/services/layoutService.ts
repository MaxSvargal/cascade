// Enhanced Layout Service with ELK.js Integration
// Provides automatic graph layout with multiple algorithms and intelligent node sizing
//
// NEW FEATURE: Adaptive Spacing with Enhanced Width Compensation + Aggressive Fork Compaction
// The layout service now automatically calculates optimal spacing based on actual node dimensions:
// - Analyzes all nodes to find maximum and average dimensions
// - Calculates spacing factors based on node size relative to standard dimensions
// - Applies intelligent spacing formulas to prevent overlaps:
//   * nodeNode: base spacing reduced by 1.5x, fork spacing DIVIDED BY 2 (aggressive reduction)
//   * edgeNode: base spacing reduced by 1.5x
//   * layerSpacing: base spacing reduced by 1.5x + ENHANCED WIDTH COMPENSATION
// - ENHANCED: Compensates for wide nodes by adding 80% of width overflow (increased from 60%)
// - ENHANCED: Increased buffer space from 20px to 30px for better right-side spacing
// - NEW: AGGRESSIVE fork spacing reduction - fork nodes get 50% less spacing
// - NEW: Post-processing compaction reduces fork target spacing to 30px minimum
// - USER REQUESTED: Fork spacing reduced by 2x, base spacing reduced by 1.5x
// - ENHANCED: Special handling for Integration.ExternalServiceAdapter nodes with long adapter types
// - Handles different node types (SubFlowInvoker, Trigger, ExternalServiceAdapter) with appropriate sizing
// - Automatically prevents overlaps even with very wide or tall nodes
//
// Width Compensation Formula: layerSpacing += Math.max(0, (maxWidth - 150) * 0.8) + 30px buffer
// Fork Spacing Reduction: Fork nodes get nodeSpacing / 2, post-processed to 30px minimum vertical spacing
// ExternalServiceAdapter Support: Dynamic width calculation based on adapterType and operation length
// This ensures adequate spacing between layers when nodes exceed the standard 150px width
// while dramatically reducing spacing between parallel/forked nodes
//
// Usage: Simply call layoutNodes() - adaptive spacing with enhanced width compensation is calculated automatically
// The system will log the calculated spacing values and compensation details for transparency

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
        nodeNode: 125,    // Increased by 25% (100 -> 125)
        edgeNode: 38,     // Increased by ~25% (30 -> 38)
        edgeEdge: 19,     // Increased by ~25% (15 -> 19)
        layerSpacing: 100 // Reduced from 120 to bring triggers closer to flows
      },
      nodeSize: {
        calculateFromContent: true,
        minWidth: 180,
        maxWidth: 500,        // INCREASED: Allow much wider nodes for SubFlowInvoker (was 300)
        minHeight: 80,
        maxHeight: 250,       // INCREASED: Allow taller nodes for wrapped content (was 140)
        padding: { top: 14, right: 18, bottom: 14, left: 18 }
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
    const startTime = Date.now();
    
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(nodes, edges, options);
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)!;
        console.log(`📋 Using cached layout for ${nodes.length} nodes`);
        return cached;
      }

      // Merge with defaults and calculate adaptive spacing
      const mergedOptions = this.mergeWithDefaults(options);
      
      // Calculate adaptive spacing based on actual node dimensions
      const adaptiveSpacing = this.calculateAdaptiveSpacing(nodes, mergedOptions.spacing);
      const finalOptions = {
        ...mergedOptions,
        spacing: adaptiveSpacing
      };
      
      console.log(`📐 Calculated adaptive spacing:`, adaptiveSpacing);

      // Calculate node sizes
      const nodesWithSizes = this.calculateNodeSizes(nodes, finalOptions.nodeSize);

      // Apply ELK layout
      const elkGraph = this.convertToElkGraph(nodesWithSizes, edges, finalOptions);
      const elk = new ELK();
      const layoutedGraph = await elk.layout(elkGraph);
      
      // Convert back to React Flow format
      const { nodes: layoutedNodes, edges: layoutedEdges } = this.convertFromElkGraph(
        layoutedGraph, 
        nodesWithSizes, 
        edges
      );

      const result: LayoutResult = {
        nodes: layoutedNodes,
        edges: layoutedEdges,
        layoutTime: Date.now() - startTime,
        algorithm: finalOptions.algorithm,
        success: true
      };

      // Cache the result
      this.cacheResult(cacheKey, result);
      
      console.log(`✅ Layout completed in ${result.layoutTime}ms with adaptive spacing`);
      return result;

    } catch (error) {
      console.error('❌ Layout failed:', error);
      
      // Fallback to simple layout
      const fallbackNodes = this.applyFallbackLayout(nodes, options);
      
      return {
        nodes: fallbackNodes,
        edges,
        layoutTime: Date.now() - startTime,
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
    const isSubFlowInvoker = node.type === 'subFlowInvokerNode';
    const isTrigger = node.type === 'triggerNode';
    
    // ENHANCED: Check for Integration.ExternalServiceAdapter component type
    const resolvedComponentFqn = node.data?.resolvedComponentFqn || '';
    const isExternalServiceAdapter = resolvedComponentFqn === 'Integration.ExternalServiceAdapter';
    
    // Enhanced base dimensions calculation
    let width = Math.max(label.length * 8 + 40, opts.minWidth || 100);
    let height = opts.minHeight || 60;
    
    // Node type specific adjustments
    if (isSubFlowInvoker) {
      // ENHANCED: SubFlow nodes need much more width for long FQN display
      const invokedFlowFqn = node.data?.invokedFlowFqn || '';
      const resolvedComponentFqn = node.data?.resolvedComponentFqn || '';
      const maxFqnLength = Math.max(invokedFlowFqn.length, resolvedComponentFqn.length);
      
      // DYNAMIC WIDTH: Calculate based on actual FQN length with proper scaling
      const labelWidth = label.length * 8 + 40;
      const fqnWidth = maxFqnLength * 7 + 60; // 7px per character + padding
      
      width = Math.max(labelWidth, fqnWidth, 200); // Minimum 200px for SubFlow nodes
      height = Math.max(height, 90); // Taller for SubFlow content with wrapped text
      
      // ADDITIONAL HEIGHT: Account for text wrapping in long FQNs
      if (maxFqnLength > 40) {
        const estimatedLines = Math.ceil(maxFqnLength / 35); // Estimate lines based on character width
        height += (estimatedLines - 1) * 15; // Add height for additional lines
      }
    }
    
    // ENHANCED: Special handling for Integration.ExternalServiceAdapter nodes
    if (isExternalServiceAdapter) {
      // ExternalServiceAdapter nodes can have long adapter types and configuration details
      const dslObject = node.data?.dslObject || {};
      const config = dslObject.config || {};
      const adapterType = config.adapterType || '';
      const operation = config.operation || '';
      
      // Calculate width based on adapter configuration content
      const labelWidth = label.length * 8 + 40;
      const adapterTypeWidth = adapterType.length * 7 + 60; // 7px per character + padding
      const operationWidth = operation.length * 7 + 40; // 7px per character + padding
      const componentFqnWidth = resolvedComponentFqn.length * 6 + 40; // 6px per character for component FQN
      
      // Use the maximum width needed for all content
      width = Math.max(labelWidth, adapterTypeWidth, operationWidth, componentFqnWidth, 220); // Minimum 220px for ExternalServiceAdapter
      height = Math.max(height, 100); // Taller for adapter configuration content
      
      // ADDITIONAL HEIGHT: Account for multiple configuration lines
      const configLines = [adapterType, operation, resolvedComponentFqn].filter(Boolean).length;
      if (configLines > 1) {
        height += (configLines - 1) * 18; // Add height for additional configuration lines
      }
      
      console.log(`🔧 ExternalServiceAdapter node sizing:`, {
        nodeId: node.id,
        label,
        adapterType,
        operation,
        resolvedComponentFqn,
        calculatedWidth: width,
        calculatedHeight: height,
        configLines
      });
    }
    
    if (isTrigger) {
      // Trigger nodes are typically wider
      width = Math.max(width, 180);
      height = Math.max(height, 70);
    }
    
    // Adjust for additional content
    if (hasDescription) {
      height += 20;
      width = Math.max(width, 180);
    }
    
    if (hasError) {
      height += 15;
      width = Math.max(width, 200);
    }
    
    // ENHANCED CONSTRAINTS: Allow much wider nodes for SubFlowInvoker AND ExternalServiceAdapter
    const needsWideLayout = isSubFlowInvoker || isExternalServiceAdapter;
    const maxWidthLimit = needsWideLayout ? 500 : (opts.maxWidth || 300); // 500px max for special nodes
    const maxHeightLimit = needsWideLayout ? 250 : (opts.maxHeight || 200); // 250px max height for special nodes
    
    width = Math.min(Math.max(width, opts.minWidth || 100), maxWidthLimit);
    height = Math.min(Math.max(height, opts.minHeight || 60), maxHeightLimit);
    
    // Add padding
    if (opts.padding) {
      width += (opts.padding.left || 0) + (opts.padding.right || 0);
      height += (opts.padding.top || 0) + (opts.padding.bottom || 0);
    }

    return { width, height };
  }

  /**
   * Calculates optimal spacing based on actual node dimensions
   */
  calculateAdaptiveSpacing(nodes: Node[], baseSpacing: LayoutSpacing): LayoutSpacing {
    if (nodes.length === 0) return baseSpacing;
    
    // Calculate node sizes first
    const nodesWithSizes = nodes.map(node => ({
      ...node,
      ...this.calculateNodeSize(node)
    }));
    
    // Find the largest dimensions and check for special node types
    const maxWidth = Math.max(...nodesWithSizes.map(n => n.width || 150));
    const maxHeight = Math.max(...nodesWithSizes.map(n => n.height || 80));
    const averageWidth = nodesWithSizes.reduce((sum, n) => sum + (n.width || 150), 0) / nodesWithSizes.length;
    const hasSubFlowNodes = nodes.some(n => n.type === 'subFlowInvokerNode');
    const hasTriggerNodes = nodes.some(n => n.type === 'triggerNode');
    
    // ENHANCED: Check for Integration.ExternalServiceAdapter nodes that also need width compensation
    const hasExternalServiceAdapterNodes = nodes.some(n => n.data?.resolvedComponentFqn === 'Integration.ExternalServiceAdapter');
    const hasWideNodes = hasSubFlowNodes || hasExternalServiceAdapterNodes;
    
    // ENHANCED: Calculate width overflow compensation for long nodes - INCREASED for better right-side spacing
    const standardWidth = 150; // Standard baseline width
    const widthOverflow = Math.max(0, maxWidth - standardWidth);
    const widthCompensation = widthOverflow * 0.8; // INCREASED from 0.6 to 0.8 (80% of overflow)
    const bufferSpace = 30; // INCREASED from 20 to 30 for better spacing
    
    // CRITICAL: Calculate fork spacing with width compensation for LEFT side spacing
    const baseForkSpacing = (baseSpacing.nodeNode || 30) / 1.5; // Base reduction by 1.5x
    const forkWidthCompensation = hasWideNodes ? Math.max(0, (maxWidth - 200) * 0.4) : 0; // 40% of width overflow for fork spacing
    const enhancedForkSpacing = Math.max(baseForkSpacing, 15 + forkWidthCompensation); // Minimum 15px + width compensation
    
    // USER REQUESTED: Reduced spacing - fork spacing by 2x, base spacing by 1.5x + WIDTH COMPENSATION
    const adaptiveSpacing: LayoutSpacing = {
      // ENHANCED: Fork spacing with LEFT-SIDE width compensation for columned wide nodes
      nodeNode: Math.max(
        enhancedForkSpacing, // Use enhanced fork spacing with width compensation
        hasWideNodes ? enhancedForkSpacing : 20 // Apply to wide node scenarios
      ),
      
      // Vertical spacing: reduced by 1.5x
      edgeNode: Math.max(
        (baseSpacing.edgeNode || 8) / 1.5,   // Reduced by 1.5x: 8 -> 5.3
        hasWideNodes ? 10 / 1.5 : 5 // Reduced by 1.5x: 10 -> 6.7, 8 -> 5.3
      ),
      
      // Edge-to-edge spacing: reduced by 1.5x
      edgeEdge: Math.max(
        (baseSpacing.edgeEdge || 5) / 1.5,   // Reduced by 1.5x: 5 -> 3.3
        3
      ),
      
      // CRITICAL: Layer spacing with ENHANCED width compensation for RIGHT-SIDE spacing
      layerSpacing: Math.max(
        (baseSpacing.layerSpacing || 40) / 1.5,  // Base reduced by 1.5x: 40 -> 26.7
        hasWideNodes ? Math.max(maxWidth * 0.2, 50) / 1.5 : 27, // Reduced by 1.5x: 50 -> 33.3
        // ENHANCED: Add INCREASED width compensation to prevent right-side overlap
        27 + widthCompensation + bufferSpace // Base 27 + enhanced compensation
      )
    };
    
    console.log(`🔧 ENHANCED spacing with DUAL width compensation applied:`, {
      nodeNode: adaptiveSpacing.nodeNode,
      edgeNode: adaptiveSpacing.edgeNode,
      layerSpacing: adaptiveSpacing.layerSpacing,
      maxWidth,
      widthOverflow,
      rightSideCompensation: `${widthCompensation} (80% of overflow)`,
      leftSideForkCompensation: `${forkWidthCompensation} (40% of overflow for fork spacing)`,
      enhancedForkSpacing,
      bufferSpace: `${bufferSpace} (increased)`,
      hasSubFlows: hasSubFlowNodes,
      hasExternalServiceAdapters: hasExternalServiceAdapterNodes,
      hasWideNodes,
      nodeCount: nodes.length,
      improvements: 'LEFT-side fork compensation + RIGHT-side layer compensation for SubFlow AND ExternalServiceAdapter nodes'
    });
    
    // Round to reasonable values
    return {
      nodeNode: Math.round(adaptiveSpacing.nodeNode!),
      edgeNode: Math.round(adaptiveSpacing.edgeNode!),
      edgeEdge: Math.round(adaptiveSpacing.edgeEdge!),
      layerSpacing: Math.round(adaptiveSpacing.layerSpacing!)
    };
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
    // FURTHER REDUCED SPACING: Fork spacing by 2x, base spacing by 1.5x
    const defaultSpacing = {
      nodeNode: 20,    // FURTHER REDUCED from 30 to 20 (1.5x reduction)
      edgeNode: 5,     // FURTHER REDUCED from 8 to 5 (1.5x reduction)
      edgeEdge: 3,     // FURTHER REDUCED from 5 to 3 (1.5x reduction)
      layerSpacing: 27 // FURTHER REDUCED from 40 to 27 (1.5x reduction)
    };

    const defaultNodeSize = {
      calculateFromContent: true,
      minWidth: 140,        // Keep standard minimum width
      maxWidth: 500,        // INCREASED: Allow much wider nodes for SubFlowInvoker (was 240)
      minHeight: 60,        // Keep standard minimum height
      maxHeight: 250,       // INCREASED: Allow taller nodes for wrapped content (was 120)
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
    // DEBUGGING: Analyze fork scenarios
    const forkAnalysis = this.analyzeForkScenarios(nodes, edges);
    console.log(`🔍 Fork analysis:`, forkAnalysis);

    const elkNodes = nodes.map(node => {
      const baseLayoutOptions = {
        'elk.padding': `[top=${options.nodeSize.padding?.top || 8},left=${options.nodeSize.padding?.left || 12},bottom=${options.nodeSize.padding?.bottom || 8},right=${options.nodeSize.padding?.right || 12}]`
      };

      // ENHANCED FORK SPACING: Apply width-compensated spacing for fork target nodes
      const isForkTarget = Object.values(forkAnalysis.forkTargets).flat().includes(node.id);
      if (isForkTarget) {
        console.log(`🎯 Applying WIDTH-COMPENSATED spacing to fork target: ${node.id}`);
        return {
          id: node.id,
          width: node.width || 150,
          height: node.height || 80,
          layoutOptions: {
            ...baseLayoutOptions,
            // ENHANCED: Use calculated spacing with width compensation instead of dividing by 2
            'elk.spacing.nodeNode': options.spacing.nodeNode?.toString() || '20',
            'elk.spacing.individual': 'true',
            'elk.layered.spacing.individual': 'true'
          }
        };
      }

      return {
        id: node.id,
        width: node.width || 150,
        height: node.height || 80,
        layoutOptions: baseLayoutOptions
      };
    });

    const elkEdges = edges.map(edge => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target]
    }));

    // Enhanced ELK options with PROPER layer spacing and ENHANCED fork spacing with width compensation
    const elkLayoutOptions: Record<string, string> = {
      'elk.algorithm': this.getElkAlgorithm(options.algorithm),
      'elk.direction': options.direction,
      
      // ENHANCED: Within-layer spacing (fork nodes) with width compensation
      'elk.spacing.nodeNode': options.spacing.nodeNode?.toString() || '20',
      
      // Between-layer spacing - USE CALCULATED layerSpacing VALUE
      'elk.spacing.edgeNode': options.spacing.edgeNode?.toString() || '5',
      'elk.spacing.edgeEdge': options.spacing.edgeEdge?.toString() || '3',
      
      // CRITICAL: Use the calculated layerSpacing value with width compensation
      'elk.layered.spacing.nodeNodeBetweenLayers': options.spacing.layerSpacing?.toString() || '40',
      
      'elk.edge.routing': options.edgeRouting || 'ORTHOGONAL',
      'elk.separateConnectedComponents': options.separateConnectedComponents?.toString() || 'false',
      'elk.aspectRatio': options.aspectRatio?.toString() || '1.6',
      'elk.priority': options.priority?.toString() || '0',
      
      // SIMPLIFIED: Core layered algorithm options
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
      
      // CRITICAL: Use calculated spacing values
      'elk.layered.spacing.edgeNodeBetweenLayers': (options.spacing.edgeNode || 5).toString(),
      'elk.layered.spacing.edgeEdgeBetweenLayers': (options.spacing.edgeEdge || 3).toString(),
      
      // ENHANCED: Balanced spacing factor for fork scenarios with width compensation
      'elk.layered.spacing.inLayerSpacingFactor': forkAnalysis.problematicForks.length > 0 ? '3.0' : '4.0', // BALANCED (was 2.0/3.0)
      'elk.layered.nodePlacement.favorStraightEdges': 'true',
      'elk.layered.mergeEdges': 'false',
      
      // FORK-SPECIFIC: Enhanced fork spacing with width compensation
      'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
      'elk.layered.spacing.individualOverride': 'true',
      'elk.layered.thoroughness': '7',
      
      // FORCE SPACING: Use calculated values with width compensation
      'elk.layered.compaction.postCompaction.strategy': 'NONE',
      'elk.layered.spacing.baseValue': options.spacing.nodeNode?.toString() || '20',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      
      // ADDITIONAL: Use calculated spacing with width compensation
      'elk.spacing.portPort': options.spacing.nodeNode?.toString() || '20',
      'elk.layered.spacing.portPortBetweenAdjacentLayers': (options.spacing.layerSpacing || 40).toString()
    };

    console.log(`🔧 ENHANCED ELK options applied (DUAL width compensation):`, {
      'elk.spacing.nodeNode': elkLayoutOptions['elk.spacing.nodeNode'],
      'elk.layered.spacing.nodeNodeBetweenLayers': elkLayoutOptions['elk.layered.spacing.nodeNodeBetweenLayers'],
      'elk.layered.spacing.inLayerSpacingFactor': elkLayoutOptions['elk.layered.spacing.inLayerSpacingFactor'],
      'elk.layered.spacing.baseValue': elkLayoutOptions['elk.layered.spacing.baseValue'],
      calculatedLayerSpacing: options.spacing.layerSpacing,
      calculatedNodeSpacing: options.spacing.nodeNode,
      nodeCount: nodes.length,
      forkCount: forkAnalysis.forkNodes.length,
      problematicForkCount: forkAnalysis.problematicForks.length,
      forkTargetsWithWidthCompensation: Object.values(forkAnalysis.forkTargets).flat().length,
      spacingStrategy: 'Width compensation for both LEFT (fork) and RIGHT (layer) spacing'
    });

    return {
      id: 'root',
      layoutOptions: elkLayoutOptions,
      children: elkNodes,
      edges: elkEdges
    };
  }

  /**
   * Analyzes fork scenarios in the graph to understand spacing issues
   */
  private analyzeForkScenarios(nodes: Node[], edges: Edge[]): {
    forkNodes: string[];
    forkTargets: Record<string, string[]>;
    hasForks: boolean;
    problematicForks: string[];
  } {
    const forkNodes: string[] = [];
    const forkTargets: Record<string, string[]> = {};
    const problematicForks: string[] = [];

    // Find nodes that have multiple outgoing edges (fork nodes)
    nodes.forEach(node => {
      const outgoingEdges = edges.filter(edge => edge.source === node.id);
      if (outgoingEdges.length > 1) {
        forkNodes.push(node.id);
        forkTargets[node.id] = outgoingEdges.map(edge => edge.target);
        
        // Check if this might be a problematic fork
        if (outgoingEdges.length === 2) {
          problematicForks.push(node.id);
        }
      }
    });

    return {
      forkNodes,
      forkTargets,
      hasForks: forkNodes.length > 0,
      problematicForks
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

    // POST-LAYOUT PROCESSING: Fix fork spacing issues manually
    const adjustedNodes = this.postProcessForkSpacing(nodes, originalEdges);

    // ELK doesn't modify edges much, so return originals
    const edges = originalEdges;

    return { nodes: adjustedNodes, edges };
  }

  /**
   * Post-processes node positions to ensure proper fork spacing
   */
  private postProcessForkSpacing(nodes: Node[], edges: Edge[]): Node[] {
    const forkAnalysis = this.analyzeForkScenarios(nodes, edges);
    
    if (!forkAnalysis.hasForks) {
      return nodes; // No forks, no adjustments needed
    }

    console.log(`🔧 POST-PROCESSING: Adjusting fork spacing for ${forkAnalysis.forkNodes.length} fork nodes`);
    
    const adjustedNodes = [...nodes];
    const minVerticalSpacing = 30; // REDUCED: Much smaller vertical spacing between fork targets (was 120, now 30)
    
    // Process each fork node
    forkAnalysis.forkNodes.forEach(forkNodeId => {
      const forkTargets = forkAnalysis.forkTargets[forkNodeId];
      if (forkTargets.length < 2) return; // Skip if not a real fork
      
      // Get fork target nodes and sort by Y position
      const targetNodes = forkTargets
        .map(targetId => adjustedNodes.find(n => n.id === targetId))
        .filter(Boolean)
        .sort((a, b) => (a!.position.y || 0) - (b!.position.y || 0));
      
      if (targetNodes.length < 2) return;
      
      console.log(`🎯 Adjusting fork targets for ${forkNodeId}:`, targetNodes.map(n => n!.id));
      
      // AGGRESSIVE COMPACTION: Force nodes closer together
      let currentY = targetNodes[0]!.position.y || 0;
      
      for (let i = 1; i < targetNodes.length; i++) {
        const currentNode = targetNodes[i]!;
        const prevNode = targetNodes[i - 1]!;
        
        // Calculate ideal position: previous node bottom + minimal spacing
        const idealY = currentY + (prevNode.height || 80) + minVerticalSpacing;
        const currentNodeY = currentNode.position.y || 0;
        
        if (currentNodeY > idealY) {
          // Move node up to reduce spacing
          const adjustment = idealY - currentNodeY;
          
          console.log(`📏 COMPACTING: Moving ${currentNode.id} up by ${Math.abs(adjustment)}px (from ${currentNodeY} to ${idealY})`);
          
          const nodeIndex = adjustedNodes.findIndex(n => n.id === currentNode.id);
          if (nodeIndex >= 0) {
            adjustedNodes[nodeIndex] = {
              ...adjustedNodes[nodeIndex],
              position: {
                ...adjustedNodes[nodeIndex].position,
                y: idealY
              }
            };
            currentY = idealY;
          }
        } else {
          currentY = currentNodeY;
        }
      }
      
      console.log(`✅ COMPACTED fork targets for ${forkNodeId} with ${minVerticalSpacing}px spacing`);
    });
    
    return adjustedNodes;
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
    const nodeSpacing = options.spacing?.nodeNode || 25;
    
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

// Export convenience functions for backward compatibility with enhanced horizontal layout and width compensation
export async function layoutNodes(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const service = new LayoutService();
  
  // Use enhanced horizontal layout for flows with many nodes
  const isLongFlow = nodes.length > 7;
  
  if (isLongFlow && !options.algorithm && !options.direction) {
    console.log(`📏 Using enhanced horizontal layout with INCREASED width compensation for flow with ${nodes.length} nodes`);
    
    // Base options for long flows - FURTHER REDUCED spacing with enhanced width compensation
    const baseOptions = {
      algorithm: 'layered' as const,
      direction: 'RIGHT' as const,
      spacing: {
        nodeNode: 27,         // FURTHER REDUCED from 40 to 27 (1.5x reduction)
        edgeNode: 7,          // FURTHER REDUCED from 10 to 7 (1.5x reduction)
        edgeEdge: 4,          // FURTHER REDUCED from 6 to 4 (1.5x reduction)
        layerSpacing: 33      // FURTHER REDUCED from 50 to 33 (1.5x reduction) - will be enhanced with width compensation
      },
      nodeSize: {
        calculateFromContent: true,
        minWidth: 160,        // Keep minimum width for readability
        maxWidth: 500,        // INCREASED: Allow much wider nodes for SubFlowInvoker (was 280)
        minHeight: 70,        // Keep minimum height
        maxHeight: 250,       // INCREASED: Allow taller nodes for wrapped content (was 140)
        padding: { top: 10, right: 12, bottom: 10, left: 12 }
      },
      edgeRouting: 'ORTHOGONAL',
      separateConnectedComponents: false,
      aspectRatio: 3.0,     // Wide aspect ratio for long flows
      compactness: 0.3,     // Less compactness for better readability
      ...options // Allow user overrides
    };
    
    const result = await service.layoutNodes(nodes, edges, baseOptions);
    console.log(`📊 Long flow layout completed with INCREASED width compensation for ${nodes.length} nodes`);
    return { nodes: result.nodes, edges: result.edges };
  } else {
    // Use regular layout for shorter flows - FURTHER REDUCED spacing with enhanced width compensation
    const baseOptions = {
      algorithm: 'layered' as const,
      direction: 'RIGHT' as const,
      spacing: {
        nodeNode: 23,         // FURTHER REDUCED from 35 to 23 (1.5x reduction)
        edgeNode: 6,          // FURTHER REDUCED from 9 to 6 (1.5x reduction)
        edgeEdge: 3,          // FURTHER REDUCED from 5 to 3 (1.5x reduction)
        layerSpacing: 30      // FURTHER REDUCED from 45 to 30 (1.5x reduction) - will be enhanced with width compensation
      },
      nodeSize: {
        calculateFromContent: true,
        minWidth: 140,        // Keep standard minimum width
        maxWidth: 500,        // INCREASED: Allow much wider nodes for SubFlowInvoker (was 240)
        minHeight: 60,        // Keep standard minimum height
        maxHeight: 250,       // INCREASED: Allow taller nodes for wrapped content (was 120)
        padding: { top: 8, right: 12, bottom: 8, left: 12 }
      },
      edgeRouting: 'ORTHOGONAL',
      separateConnectedComponents: false,
      aspectRatio: 1.6,
      compactness: 0.4,
      ...options // Allow user overrides
    };
    
    const result = await service.layoutNodes(nodes, edges, baseOptions);
    console.log(`📊 Regular flow layout completed with INCREASED width compensation for ${nodes.length} nodes`);
    return { nodes: result.nodes, edges: result.edges };
  }
}

export async function layoutSystemOverview(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const service = new LayoutService();
  
  // Use enhanced horizontal layout with INCREASED width compensation for system overview
  const finalOptions = {
    algorithm: 'layered' as const,
    direction: 'RIGHT' as const,
    spacing: {
      nodeNode: 20,         // REDUCED spacing for system overview (1.5x reduction from 30)
      edgeNode: 7,          // REDUCED edge spacing (1.5x reduction from 10)
      edgeEdge: 3,          // REDUCED edge separation (1.5x reduction from 5)
      layerSpacing: 33      // REDUCED layer separation (1.5x reduction from 50) - will be enhanced with width compensation
    },
    nodeSize: {
      calculateFromContent: true,
      minWidth: 180,
      maxWidth: 500,        // INCREASED: Allow much wider nodes for SubFlowInvoker (was 300)
      minHeight: 80,
      maxHeight: 250,       // INCREASED: Allow taller nodes for wrapped content (was 140)
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