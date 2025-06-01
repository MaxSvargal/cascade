// Trace Visualization Service
// Enhances graph elements with execution trace data

import { Node, Edge } from 'reactflow';
import { 
  FlowExecutionTrace, 
  StepExecutionTrace, 
  ExecutionStatusEnum 
} from '@/models/cfv_models_generated';

export interface TraceVisualizationOptions {
  showTimings?: boolean;
  showDataFlow?: boolean;
  highlightCriticalPath?: boolean;
  showErrorDetails?: boolean;
  animateExecution?: boolean;
}

export interface EnhancedNodeData {
  // Original node data plus trace enhancements
  [key: string]: any;
  traceOverlay?: {
    executionOrder?: number;
    startTime?: string;
    endTime?: string;
    duration?: number;
    status?: ExecutionStatusEnum;
    isOnCriticalPath?: boolean;
    inputDataSummary?: string;
    outputDataSummary?: string;
    errorDetails?: string;
    performanceMetrics?: {
      cpuTime?: number;
      memoryUsage?: number;
      ioOperations?: number;
    };
  };
}

export interface EnhancedEdgeData {
  // Original edge data plus trace enhancements
  [key: string]: any;
  traceOverlay?: {
    wasExecuted?: boolean;
    executionTime?: string;
    dataTransferred?: any;
    transferSize?: number;
    isOnCriticalPath?: boolean;
  };
}

/**
 * Enhance nodes with trace data overlays
 */
export function enhanceNodesWithTrace(
  nodes: Node[],
  traceData: FlowExecutionTrace,
  options: TraceVisualizationOptions = {}
): Node<EnhancedNodeData>[] {
  const {
    showTimings = true,
    showDataFlow = true,
    highlightCriticalPath = true,
    showErrorDetails = true
  } = options;

  // Calculate critical path if requested
  const criticalPath = highlightCriticalPath ? calculateCriticalPath(traceData) : new Set();

  return nodes.map(node => {
    // Find corresponding step trace
    const stepTrace = traceData.steps.find(step => step.stepId === node.id);
    
    if (!stepTrace) {
      return node;
    }

    // Build trace overlay
    const traceOverlay: EnhancedNodeData['traceOverlay'] = {};

    if (showTimings) {
      traceOverlay.startTime = stepTrace.startTime;
      traceOverlay.endTime = stepTrace.endTime;
      traceOverlay.duration = stepTrace.durationMs;
    }

    traceOverlay.status = stepTrace.status;
    traceOverlay.executionOrder = getExecutionOrder(stepTrace, traceData);

    if (highlightCriticalPath) {
      traceOverlay.isOnCriticalPath = criticalPath.has(node.id);
    }

    if (showDataFlow) {
      traceOverlay.inputDataSummary = summarizeData(stepTrace.inputData);
      traceOverlay.outputDataSummary = summarizeData(stepTrace.outputData);
    }

    if (showErrorDetails && stepTrace.status === 'FAILURE') {
      traceOverlay.errorDetails = extractErrorDetails(stepTrace);
    }

    // Enhanced styling based on trace data
    const enhancedStyle = {
      ...node.style,
      ...getTraceBasedStyling(stepTrace, traceOverlay)
    };

    return {
      ...node,
      data: {
        ...node.data,
        traceOverlay
      },
      style: enhancedStyle
    };
  });
}

/**
 * Enhance edges with trace data overlays
 */
export function enhanceEdgesWithTrace(
  edges: Edge[],
  traceData: FlowExecutionTrace,
  options: TraceVisualizationOptions = {}
): Edge<EnhancedEdgeData>[] {
  const {
    showDataFlow = true,
    highlightCriticalPath = true
  } = options;

  const criticalPath = highlightCriticalPath ? calculateCriticalPath(traceData) : new Set();
  const executedEdges = getExecutedEdges(traceData);

  return edges.map(edge => {
    const wasExecuted = executedEdges.has(edge.id);
    
    if (!wasExecuted) {
      return {
        ...edge,
        style: {
          ...edge.style,
          opacity: 0.3,
          strokeDasharray: '5,5'
        }
      };
    }

    const traceOverlay: EnhancedEdgeData['traceOverlay'] = {
      wasExecuted: true
    };

    if (highlightCriticalPath) {
      traceOverlay.isOnCriticalPath = criticalPath.has(edge.source) && criticalPath.has(edge.target);
    }

    if (showDataFlow && edge.data?.type === 'dataFlow') {
      const dataTransfer = getDataTransferInfo(edge, traceData);
      traceOverlay.dataTransferred = dataTransfer.data;
      traceOverlay.transferSize = dataTransfer.size;
    }

    // Enhanced styling for executed edges
    const enhancedStyle = {
      ...edge.style,
      stroke: traceOverlay.isOnCriticalPath ? '#FF5722' : '#4CAF50',
      strokeWidth: traceOverlay.isOnCriticalPath ? 4 : 2,
      opacity: 1
    };

    return {
      ...edge,
      data: {
        ...edge.data,
        traceOverlay
      },
      style: enhancedStyle
    };
  });
}

/**
 * Calculate the critical path through the execution
 */
function calculateCriticalPath(traceData: FlowExecutionTrace): Set<string> {
  const criticalPath = new Set<string>();
  
  // Find the longest execution path by duration
  const stepsByDuration = [...traceData.steps].sort((a, b) => (b.durationMs || 0) - (a.durationMs || 0));
  
  // Add the top 20% longest-running steps to critical path
  const criticalCount = Math.max(1, Math.ceil(stepsByDuration.length * 0.2));
  for (let i = 0; i < criticalCount; i++) {
    criticalPath.add(stepsByDuration[i].stepId);
  }
  
  return criticalPath;
}

/**
 * Get execution order for a step
 */
function getExecutionOrder(stepTrace: StepExecutionTrace, traceData: FlowExecutionTrace): number {
  if (!stepTrace.startTime) return 0;
  
  const sortedSteps = [...traceData.steps]
    .filter(s => s.startTime)
    .sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime());
  
  return sortedSteps.findIndex(s => s.stepId === stepTrace.stepId) + 1;
}

/**
 * Summarize data for display
 */
function summarizeData(data: any): string {
  if (!data) return 'No data';
  
  if (typeof data === 'string') {
    return data.length > 50 ? `${data.substring(0, 47)}...` : data;
  }
  
  if (typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 0) return 'Empty object';
    if (keys.length === 1) return `{${keys[0]}: ...}`;
    return `{${keys.slice(0, 2).join(', ')}${keys.length > 2 ? ', ...' : ''}}`;
  }
  
  return String(data);
}

/**
 * Extract error details from step trace
 */
function extractErrorDetails(stepTrace: StepExecutionTrace): string {
  // This would extract error information from the step trace
  // Implementation depends on how errors are stored in the trace
  return 'Execution failed - check logs for details';
}

/**
 * Get trace-based styling for nodes
 */
function getTraceBasedStyling(stepTrace: StepExecutionTrace, traceOverlay: any): any {
  const baseStyle: any = {};
  
  // Status-based border colors
  switch (stepTrace.status) {
    case 'SUCCESS':
      baseStyle.borderColor = '#4CAF50';
      baseStyle.backgroundColor = '#E8F5E8';
      break;
    case 'FAILURE':
      baseStyle.borderColor = '#F44336';
      baseStyle.backgroundColor = '#FFEBEE';
      break;
    case 'RUNNING':
      baseStyle.borderColor = '#FF9800';
      baseStyle.backgroundColor = '#FFF3E0';
      break;
    case 'SKIPPED':
      baseStyle.borderColor = '#9E9E9E';
      baseStyle.backgroundColor = '#F5F5F5';
      break;
  }
  
  // Critical path highlighting
  if (traceOverlay.isOnCriticalPath) {
    baseStyle.borderWidth = '3px';
    baseStyle.boxShadow = '0 0 10px rgba(255, 87, 34, 0.5)';
  }
  
  return baseStyle;
}

/**
 * Get executed edges from trace data
 */
function getExecutedEdges(traceData: FlowExecutionTrace): Set<string> {
  const executedEdges = new Set<string>();
  
  // This is a simplified implementation
  // In reality, you'd need to track which edges were actually traversed
  traceData.steps.forEach(step => {
    if (step.status === 'SUCCESS' || step.status === 'FAILURE') {
      // Add edges that would have been traversed to reach this step
      // This requires knowledge of the flow structure
    }
  });
  
  return executedEdges;
}

/**
 * Get data transfer information for an edge
 */
function getDataTransferInfo(edge: Edge, traceData: FlowExecutionTrace): { data: any; size: number } {
  // Extract data that flowed through this edge
  // This requires correlating edge source/target with step inputs/outputs
  return {
    data: null,
    size: 0
  };
} 