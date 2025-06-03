// Debug Test Tab Service
// Manages flow simulation, testing, and debugging interface

import { 
  SelectedElement, 
  IModuleRegistry, 
  FlowExecutionTrace,
  TestRunResult,
  FlowTestCase,
  StepExecutionTrace,
  UnifiedDebugTestActions,
  FlowSimulationResult,
  ResolvedStepInput,
  ExecutionOptions
} from '@/models/cfv_models_generated';

export interface DebugTestTabService {
  // Debug functionality
  getExecutionContext(
    currentFlowFqn: string,
    selectedElement?: SelectedElement,
    traceData?: FlowExecutionTrace
  ): DebugExecutionContext | null;

  getStepTraceData(
    selectedElement: SelectedElement,
    traceData?: FlowExecutionTrace
  ): StepExecutionTrace | null;

  getFlowExecutionSummary(
    traceData: FlowExecutionTrace
  ): FlowExecutionSummary;

  // Test functionality
  getTestContext(
    currentFlowFqn: string,
    testResultData?: TestRunResult
  ): TestExecutionContext | null;

  generateDefaultTestCase(
    flowFqn: string,
    moduleRegistry: IModuleRegistry
  ): Partial<FlowTestCase>;

  getTestResultSummary(
    testResultData: TestRunResult
  ): TestResultSummary;

  // Data analysis
  analyzeDataFlow(
    flowFqn: string,
    targetStepId?: string,
    traceData?: FlowExecutionTrace
  ): DataFlowAnalysis;

  getExecutionMetrics(
    traceData: FlowExecutionTrace
  ): ExecutionMetrics;
}

export interface DebugExecutionContext {
  flowFqn: string;
  selectedStepId?: string;
  hasTraceData: boolean;
  executionStatus: 'completed' | 'failed' | 'running' | 'pending' | 'none';
  availableActions: string[];
  stepCount: number;
  executedStepCount: number;
}

export interface FlowExecutionSummary {
  flowFqn: string;
  status: string;
  duration?: number;
  stepCount: number;
  successfulSteps: number;
  failedSteps: number;
  skippedSteps: number;
  startTime: string;
  endTime?: string;
}

export interface TestExecutionContext {
  flowFqn: string;
  hasTestResult: boolean;
  testStatus: 'passed' | 'failed' | 'none';
  assertionCount: number;
  passedAssertions: number;
  failedAssertions: number;
}

export interface TestResultSummary {
  testCaseId: string;
  description?: string;
  passed: boolean;
  assertionResults: {
    total: number;
    passed: number;
    failed: number;
  };
  executionTime?: number;
  error?: string;
}

export interface DataFlowAnalysis {
  flowFqn: string;
  targetStepId?: string;
  dataPath: {
    stepId: string;
    stepType: string;
    inputData?: any;
    outputData?: any;
    executionOrder: number;
  }[];
  contextVariables: Record<string, any>;
  inputMappings: {
    targetField: string;
    sourceStep?: string;
    sourceField?: string;
    transformationRule?: string;
  }[];
}

export interface ExecutionMetrics {
  totalDuration: number;
  averageStepDuration: number;
  slowestStep: { stepId: string; duration: number } | null;
  fastestStep: { stepId: string; duration: number } | null;
  errorRate: number;
  throughput: number; // steps per second
}

export const debugTestTabService: DebugTestTabService = {
  getExecutionContext(currentFlowFqn, selectedElement, traceData) {
    const hasTraceData = !!traceData;
    const selectedStepId = selectedElement?.stepId;
    
    let executionStatus: DebugExecutionContext['executionStatus'] = 'none';
    if (traceData) {
      switch (traceData.status) {
        case 'COMPLETED': executionStatus = 'completed'; break;
        case 'FAILED': executionStatus = 'failed'; break;
        case 'RUNNING': executionStatus = 'running'; break;
        case 'PENDING': executionStatus = 'pending'; break;
        default: executionStatus = 'none';
      }
    }

    const availableActions = [
      'simulateFlow',
      'generateTestCase',
      ...(selectedStepId ? ['resolveStepInput', 'runDebugStep'] : []),
      ...(hasTraceData ? ['analyzeExecution', 'exportResults'] : [])
    ];

    return {
      flowFqn: currentFlowFqn,
      selectedStepId,
      hasTraceData,
      executionStatus,
      availableActions,
      stepCount: traceData?.steps.length || 0,
      executedStepCount: traceData?.steps.filter(s => s.status !== 'PENDING').length || 0
    };
  },

  getStepTraceData(selectedElement, traceData) {
    if (!traceData || !selectedElement.stepId) return null;
    
    return traceData.steps.find(step => step.stepId === selectedElement.stepId) || null;
  },

  getFlowExecutionSummary(traceData) {
    const stepCounts = traceData.steps.reduce(
      (acc, step) => {
        switch (step.status) {
          case 'SUCCESS': acc.successful++; break;
          case 'FAILURE': acc.failed++; break;
          case 'SKIPPED': acc.skipped++; break;
        }
        return acc;
      },
      { successful: 0, failed: 0, skipped: 0 }
    );

    return {
      flowFqn: traceData.flowFqn,
      status: traceData.status,
      duration: traceData.durationMs,
      stepCount: traceData.steps.length,
      successfulSteps: stepCounts.successful,
      failedSteps: stepCounts.failed,
      skippedSteps: stepCounts.skipped,
      startTime: traceData.startTime,
      endTime: traceData.endTime
    };
  },

  getTestContext(currentFlowFqn, testResultData) {
    const hasTestResult = !!testResultData;
    
    if (!hasTestResult) {
      return {
        flowFqn: currentFlowFqn,
        hasTestResult: false,
        testStatus: 'none',
        assertionCount: 0,
        passedAssertions: 0,
        failedAssertions: 0
      };
    }

    const assertionCounts = testResultData.assertionResults.reduce(
      (acc, result) => {
        if (result.passed) acc.passed++;
        else acc.failed++;
        return acc;
      },
      { passed: 0, failed: 0 }
    );

    return {
      flowFqn: currentFlowFqn,
      hasTestResult: true,
      testStatus: testResultData.passed ? 'passed' : 'failed',
      assertionCount: testResultData.assertionResults.length,
      passedAssertions: assertionCounts.passed,
      failedAssertions: assertionCounts.failed
    };
  },

  generateDefaultTestCase(flowFqn, moduleRegistry) {
    const flowDef = moduleRegistry.getFlowDefinitionDsl(flowFqn);
    
    return {
      id: `test_${Date.now()}`,
      flowFqn,
      description: `Test case for ${flowFqn}`,
      triggerInput: {}, // Would need to generate based on trigger schema
      initialContext: {},
      componentMocks: [],
      assertions: [],
      tags: ['generated']
    };
  },

  getTestResultSummary(testResultData) {
    const assertionCounts = testResultData.assertionResults.reduce(
      (acc, result) => {
        if (result.passed) acc.passed++;
        else acc.failed++;
        return acc;
      },
      { passed: 0, failed: 0 }
    );

    return {
      testCaseId: testResultData.testCase.id,
      description: testResultData.testCase.description,
      passed: testResultData.passed,
      assertionResults: {
        total: testResultData.assertionResults.length,
        passed: assertionCounts.passed,
        failed: assertionCounts.failed
      },
      executionTime: testResultData.trace?.durationMs,
      error: testResultData.error
    };
  },

  analyzeDataFlow(flowFqn, targetStepId, traceData) {
    const dataPath: DataFlowAnalysis['dataPath'] = [];
    const inputMappings: DataFlowAnalysis['inputMappings'] = [];
    
    if (traceData) {
      traceData.steps.forEach((step, index) => {
        dataPath.push({
          stepId: step.stepId,
          stepType: 'component', // Would need to determine from step data
          inputData: step.inputData,
          outputData: step.outputData,
          executionOrder: index + 1
        });
      });
    }

    return {
      flowFqn,
      targetStepId,
      dataPath,
      contextVariables: traceData?.finalContext || {},
      inputMappings
    };
  },

  getExecutionMetrics(traceData) {
    const stepDurations = traceData.steps
      .filter(step => step.durationMs !== undefined)
      .map(step => ({ stepId: step.stepId, duration: step.durationMs! }));

    const totalDuration = traceData.durationMs || 0;
    const averageStepDuration = stepDurations.length > 0 
      ? stepDurations.reduce((sum, step) => sum + step.duration, 0) / stepDurations.length 
      : 0;

    const slowestStep = stepDurations.length > 0 
      ? stepDurations.reduce((max, step) => step.duration > max.duration ? step : max)
      : null;

    const fastestStep = stepDurations.length > 0 
      ? stepDurations.reduce((min, step) => step.duration < min.duration ? step : min)
      : null;

    const failedSteps = traceData.steps.filter(step => step.status === 'FAILURE').length;
    const errorRate = traceData.steps.length > 0 ? failedSteps / traceData.steps.length : 0;

    const throughput = totalDuration > 0 ? (traceData.steps.length / totalDuration) * 1000 : 0;

    return {
      totalDuration,
      averageStepDuration,
      slowestStep,
      fastestStep,
      errorRate,
      throughput
    };
  }
}; 