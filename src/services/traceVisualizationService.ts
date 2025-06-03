// Trace Visualization Service
// Enhances graph elements with execution trace data, critical path analysis, and performance metrics

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
  showExecutionOrder?: boolean;
  performanceThresholds?: {
    fast: number;    // ms
    normal: number;  // ms
    slow: number;    // ms
  };
}

export interface CriticalPathAnalysis {
  criticalSteps: Set<string>;
  totalDuration: number;
  criticalPathDuration: number;
  bottleneckSteps: string[];
  performanceMetrics: {
    stepId: string;
    duration: number;
    percentOfTotal: number;
    isBottleneck: boolean;
  }[];
}

export interface TraceVisualizationService {
  enhanceNodesWithTrace(
    nodes: Node[], 
    traceData: FlowExecutionTrace, 
    options?: TraceVisualizationOptions
  ): Node[];
  
  enhanceEdgesWithTrace(
    edges: Edge[], 
    traceData: FlowExecutionTrace, 
    options?: TraceVisualizationOptions
  ): Edge[];
  
  calculateCriticalPath(traceData: FlowExecutionTrace): CriticalPathAnalysis;
  
  getExecutionMetrics(traceData: FlowExecutionTrace): {
    totalDuration: number;
    stepCount: number;
    successfulSteps: number;
    failedSteps: number;
    averageStepDuration: number;
    longestStep: { stepId: string; duration: number };
    shortestStep: { stepId: string; duration: number };
  };
}

export class TraceVisualizationServiceImpl implements TraceVisualizationService {
  private defaultOptions: Required<TraceVisualizationOptions> = {
    showTimings: true,
    showDataFlow: true,
    highlightCriticalPath: true,
    showErrorDetails: true,
    showExecutionOrder: true,
    performanceThresholds: {
      fast: 100,    // < 100ms
      normal: 1000, // 100ms - 1s
      slow: 1000    // > 1s
    }
  };

  enhanceNodesWithTrace(
    nodes: Node[], 
    traceData: FlowExecutionTrace, 
    options: TraceVisualizationOptions = {}
  ): Node[] {
    const opts = { ...this.defaultOptions, ...options };
    const criticalPath = opts.highlightCriticalPath ? this.calculateCriticalPath(traceData) : null;
    
    return nodes.map(node => {
      const stepTrace = this.findStepTrace(node.id, traceData);
      
      if (!stepTrace) {
        // Node not executed - mark as pending/not executed
        return {
          ...node,
          data: {
            ...node.data,
            executionStatus: 'not_executed',
            traceEnhanced: true
          },
          style: {
            ...node.style,
            opacity: 0.6,
            border: '2px solid #ccc'
          }
        };
      }

      // Calculate performance classification
      const duration = stepTrace.endTime && stepTrace.startTime 
        ? new Date(stepTrace.endTime).getTime() - new Date(stepTrace.startTime).getTime()
        : stepTrace.durationMs || 0;
      
      const performanceClass = this.classifyPerformance(duration, opts.performanceThresholds);
      const isCritical = criticalPath?.criticalSteps.has(node.id) || false;
      const isBottleneck = criticalPath?.bottleneckSteps.includes(node.id) || false;

      // Calculate execution order from trace
      const executionOrder = traceData.steps.findIndex(step => step.stepId === stepTrace.stepId) + 1;

      // Enhanced node data
      const enhancedData = {
        ...node.data,
        executionStatus: stepTrace.status,
        executionTime: duration,
        executionTimestamp: stepTrace.startTime,
        executionError: stepTrace.errorData,
        executionOutput: stepTrace.outputData,
        executionInput: stepTrace.inputData,
        traceId: traceData.traceId,
        executionOrder,
        performanceClass,
        isCritical,
        isBottleneck,
        traceEnhanced: true
      };

      // Enhanced styling based on execution status and performance
      const enhancedStyle = {
        ...node.style,
        ...this.getNodeStyleForStatus(stepTrace.status, performanceClass, isCritical, isBottleneck)
      };

      return {
        ...node,
        data: enhancedData,
        style: enhancedStyle
      };
    });
  }

  enhanceEdgesWithTrace(
    edges: Edge[], 
    traceData: FlowExecutionTrace, 
    options: TraceVisualizationOptions = {}
  ): Edge[] {
    const opts = { ...this.defaultOptions, ...options };
    const criticalPath = opts.highlightCriticalPath ? this.calculateCriticalPath(traceData) : null;
    
    return edges.map(edge => {
      const sourceTrace = this.findStepTrace(edge.source, traceData);
      const targetTrace = this.findStepTrace(edge.target, traceData);
      
      // Determine if this edge is part of the execution path - ensure boolean result
      const wasExecuted = Boolean(sourceTrace && targetTrace && 
        sourceTrace.status === 'SUCCESS' && 
        (targetTrace.status === 'SUCCESS' || targetTrace.status === 'FAILURE' || targetTrace.status === 'RUNNING'));
      
      // Fix: Properly handle null criticalPath to ensure boolean result
      const isCriticalPath = Boolean(criticalPath !== null && 
        criticalPath.criticalSteps.has(edge.source) && 
        criticalPath.criticalSteps.has(edge.target));

      // Calculate data flow information
      let dataFlowInfo = null;
      if (opts.showDataFlow && sourceTrace && targetTrace) {
        dataFlowInfo = this.analyzeDataFlow(sourceTrace, targetTrace);
      }

      // Calculate execution orders
      const sourceExecutionOrder = sourceTrace ? traceData.steps.findIndex(step => step.stepId === sourceTrace.stepId) + 1 : undefined;
      const targetExecutionOrder = targetTrace ? traceData.steps.findIndex(step => step.stepId === targetTrace.stepId) + 1 : undefined;

      // Now both wasExecuted and isCriticalPath are guaranteed to be boolean
      const enhancedStyle = {
        ...edge.style,
        ...this.getEdgeStyleForExecution(wasExecuted, isCriticalPath, sourceTrace?.status)
      };

      return {
        ...edge,
        data: {
          ...edge.data,
          wasExecuted,
          isCriticalPath,
          dataFlowInfo,
          sourceExecutionOrder,
          targetExecutionOrder,
          traceEnhanced: true
        },
        style: enhancedStyle
      };
    });
  }

  calculateCriticalPath(traceData: FlowExecutionTrace): CriticalPathAnalysis {
    const stepDurations = new Map<string, number>();
    const stepConnections = new Map<string, string[]>();
    
    // Calculate step durations
    traceData.steps.forEach(step => {
      if (step.startTime && step.endTime) {
        const duration = new Date(step.endTime).getTime() - new Date(step.startTime).getTime();
        stepDurations.set(step.stepId, duration);
      }
    });

    // Build step dependency graph (simplified - would need actual flow definition)
    traceData.steps.forEach((step, index) => {
      if (index > 0) {
        const prevStep = traceData.steps[index - 1];
        if (!stepConnections.has(prevStep.stepId)) {
          stepConnections.set(prevStep.stepId, []);
        }
        stepConnections.get(prevStep.stepId)!.push(step.stepId);
      }
    });

    // Find critical path using longest path algorithm
    const criticalSteps = new Set<string>();
    const longestPaths = new Map<string, number>();
    
    // Calculate longest path to each step
    const calculateLongestPath = (stepId: string, visited: Set<string>): number => {
      if (visited.has(stepId)) return 0; // Avoid cycles
      if (longestPaths.has(stepId)) return longestPaths.get(stepId)!;
      
      visited.add(stepId);
      const stepDuration = stepDurations.get(stepId) || 0;
      const dependencies = Array.from(stepConnections.entries())
        .filter(([_, targets]) => targets.includes(stepId))
        .map(([source, _]) => source);
      
      let maxPredecessorPath = 0;
      dependencies.forEach(dep => {
        const depPath = calculateLongestPath(dep, new Set(visited));
        maxPredecessorPath = Math.max(maxPredecessorPath, depPath);
      });
      
      const totalPath = maxPredecessorPath + stepDuration;
      longestPaths.set(stepId, totalPath);
      visited.delete(stepId);
      
      return totalPath;
    };

    // Calculate longest paths for all steps
    traceData.steps.forEach(step => {
      calculateLongestPath(step.stepId, new Set());
    });

    // Find the critical path (steps with longest total path)
    const maxPath = Math.max(...Array.from(longestPaths.values()));
    longestPaths.forEach((pathLength, stepId) => {
      if (pathLength === maxPath) {
        criticalSteps.add(stepId);
      }
    });

    // Identify bottlenecks (steps taking > 20% of total time)
    const totalDuration = Array.from(stepDurations.values()).reduce((sum, duration) => sum + duration, 0);
    const bottleneckThreshold = totalDuration * 0.2;
    const bottleneckSteps = Array.from(stepDurations.entries())
      .filter(([_, duration]) => duration > bottleneckThreshold)
      .map(([stepId, _]) => stepId);

    // Generate performance metrics
    const performanceMetrics = Array.from(stepDurations.entries()).map(([stepId, duration]) => ({
      stepId,
      duration,
      percentOfTotal: (duration / totalDuration) * 100,
      isBottleneck: bottleneckSteps.includes(stepId)
    }));

    return {
      criticalSteps,
      totalDuration,
      criticalPathDuration: maxPath,
      bottleneckSteps,
      performanceMetrics
    };
  }

  getExecutionMetrics(traceData: FlowExecutionTrace) {
    const durations = traceData.steps
      .filter(step => step.startTime && step.endTime)
      .map(step => ({
        stepId: step.stepId,
        duration: new Date(step.endTime!).getTime() - new Date(step.startTime!).getTime()
      }));

    const totalDuration = durations.reduce((sum, { duration }) => sum + duration, 0);
    const successfulSteps = traceData.steps.filter(step => step.status === 'SUCCESS').length;
    const failedSteps = traceData.steps.filter(step => step.status === 'FAILURE').length;

    const sortedDurations = durations.sort((a, b) => b.duration - a.duration);

    return {
      totalDuration,
      stepCount: traceData.steps.length,
      successfulSteps,
      failedSteps,
      averageStepDuration: durations.length > 0 ? totalDuration / durations.length : 0,
      longestStep: sortedDurations[0] || { stepId: '', duration: 0 },
      shortestStep: sortedDurations[sortedDurations.length - 1] || { stepId: '', duration: 0 }
    };
  }

  private findStepTrace(stepId: string, traceData: FlowExecutionTrace): StepExecutionTrace | null {
    return traceData.steps.find(step => step.stepId === stepId) || null;
  }

  private classifyPerformance(duration: number, thresholds: { fast: number; normal: number; slow: number }): 'fast' | 'normal' | 'slow' {
    if (duration < thresholds.fast) return 'fast';
    if (duration < thresholds.slow) return 'normal';
    return 'slow';
  }

  private getNodeStyleForStatus(
    status: ExecutionStatusEnum, 
    performanceClass: 'fast' | 'normal' | 'slow',
    isCritical: boolean,
    isBottleneck: boolean
  ): any {
    const baseStyle: any = {};

    // Status-based styling
    switch (status) {
      case 'SUCCESS':
        baseStyle.backgroundColor = '#e8f5e8';
        baseStyle.border = '2px solid #4caf50';
        break;
      case 'FAILURE':
        baseStyle.backgroundColor = '#ffebee';
        baseStyle.border = '2px solid #f44336';
        break;
      case 'RUNNING':
        baseStyle.backgroundColor = '#fff3e0';
        baseStyle.border = '2px solid #ff9800';
        baseStyle.animation = 'pulse 1.5s infinite';
        break;
      case 'PENDING':
        baseStyle.backgroundColor = '#f5f5f5';
        baseStyle.border = '2px solid #9e9e9e';
        break;
      case 'SKIPPED':
        baseStyle.backgroundColor = '#f5f5f5';
        baseStyle.border = '2px solid #9e9e9e';
        baseStyle.opacity = 0.7;
        break;
    }

    // Performance-based border styling
    if (performanceClass === 'slow') {
      baseStyle.borderWidth = '3px';
      baseStyle.borderStyle = 'dashed';
    }

    // Critical path highlighting
    if (isCritical) {
      baseStyle.boxShadow = '0 0 10px #2196f3';
    }

    // Bottleneck highlighting
    if (isBottleneck) {
      baseStyle.boxShadow = '0 0 15px #ff5722';
      baseStyle.borderColor = '#ff5722';
    }

    return baseStyle;
  }

  private getEdgeStyleForExecution(
    wasExecuted: boolean, 
    isCriticalPath: boolean, 
    sourceStatus?: ExecutionStatusEnum
  ): any {
    const baseStyle: any = {};

    if (wasExecuted) {
      baseStyle.stroke = '#4caf50';
      baseStyle.strokeWidth = 2;
      
      if (isCriticalPath) {
        baseStyle.stroke = '#2196f3';
        baseStyle.strokeWidth = 3;
        baseStyle.strokeDasharray = 'none';
      }
    } else {
      baseStyle.stroke = '#ccc';
      baseStyle.strokeWidth = 1;
      baseStyle.opacity = 0.5;
    }

    // Animate edges for running steps
    if (sourceStatus === 'RUNNING') {
      baseStyle.strokeDasharray = '5,5';
      baseStyle.animation = 'dash 1s linear infinite';
    }

    return baseStyle;
  }

  private analyzeDataFlow(sourceTrace: StepExecutionTrace, targetTrace: StepExecutionTrace): any {
    // Simplified data flow analysis
    return {
      hasDataTransfer: !!(sourceTrace.outputData && targetTrace.inputData),
      outputSize: sourceTrace.outputData ? JSON.stringify(sourceTrace.outputData).length : 0,
      inputSize: targetTrace.inputData ? JSON.stringify(targetTrace.inputData).length : 0,
      transferTime: sourceTrace.endTime && targetTrace.startTime 
        ? new Date(targetTrace.startTime).getTime() - new Date(sourceTrace.endTime).getTime()
        : 0
    };
  }
}

/**
 * Factory function to create trace visualization service
 */
export function createTraceVisualizationService(): TraceVisualizationService {
  return new TraceVisualizationServiceImpl();
}

/**
 * Convenience functions for direct use
 */
export function enhanceNodesWithTrace(
  nodes: Node[], 
  traceData: FlowExecutionTrace, 
  options?: TraceVisualizationOptions
): Node[] {
  const service = createTraceVisualizationService();
  return service.enhanceNodesWithTrace(nodes, traceData, options);
}

export function enhanceEdgesWithTrace(
  edges: Edge[], 
  traceData: FlowExecutionTrace, 
  options?: TraceVisualizationOptions
): Edge[] {
  const service = createTraceVisualizationService();
  return service.enhanceEdgesWithTrace(edges, traceData, options);
}

export function calculateCriticalPath(traceData: FlowExecutionTrace): CriticalPathAnalysis {
  const service = createTraceVisualizationService();
  return service.calculateCriticalPath(traceData);
} 