// Test Case Service
// Manages flow test case definitions and execution

import { 
  FlowTestCase, 
  TestRunResult, 
  TestCaseAssertion, 
  AssertionResult,
  MockedComponentResponse,
  IModuleRegistry 
} from '@/models/cfv_models_generated';

export interface TestCaseTemplate {
  name: string;
  description: string;
  triggerInputTemplate: any;
  commonAssertions: TestCaseAssertion[];
}

export interface TestExecutionOptions {
  timeout?: number;
  mockComponents?: boolean;
  captureIntermediateData?: boolean;
  validateSchema?: boolean;
}

/**
 * Generate test case templates for a flow
 */
export function generateTestCaseTemplates(
  flowFqn: string,
  moduleRegistry: IModuleRegistry
): TestCaseTemplate[] {
  const flowDefinition = moduleRegistry.getFlowDefinition(flowFqn);
  if (!flowDefinition) {
    return [];
  }

  const templates: TestCaseTemplate[] = [];

  // Happy path test
  templates.push({
    name: 'Happy Path',
    description: 'Test successful execution with valid inputs',
    triggerInputTemplate: generateTriggerInputTemplate(flowDefinition.trigger),
    commonAssertions: [
      {
        targetPath: 'status',
        expectedValue: 'COMPLETED',
        comparison: 'equals'
      }
    ]
  });

  // Error handling test
  templates.push({
    name: 'Error Handling',
    description: 'Test error handling with invalid inputs',
    triggerInputTemplate: generateInvalidInputTemplate(flowDefinition.trigger),
    commonAssertions: [
      {
        targetPath: 'status',
        expectedValue: 'FAILED',
        comparison: 'equals'
      }
    ]
  });

  // Performance test
  if (flowDefinition.steps && flowDefinition.steps.length > 3) {
    templates.push({
      name: 'Performance',
      description: 'Test execution performance within acceptable limits',
      triggerInputTemplate: generateTriggerInputTemplate(flowDefinition.trigger),
      commonAssertions: [
        {
          targetPath: 'durationMs',
          expectedValue: 5000, // 5 seconds
          comparison: 'lessThan'
        }
      ]
    });
  }

  return templates;
}

/**
 * Create a test case from a template
 */
export function createTestCaseFromTemplate(
  template: TestCaseTemplate,
  flowFqn: string,
  customizations?: Partial<FlowTestCase>
): FlowTestCase {
  return {
    flowFqn,
    description: template.description,
    triggerInput: template.triggerInputTemplate,
    contextOverrides: {},
    componentMocks: [],
    assertions: template.commonAssertions,
    ...customizations
  };
}

/**
 * Validate a test case definition
 */
export function validateTestCase(
  testCase: FlowTestCase,
  moduleRegistry: IModuleRegistry
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if flow exists
  const flowDefinition = moduleRegistry.getFlowDefinition(testCase.flowFqn);
  if (!flowDefinition) {
    errors.push(`Flow not found: ${testCase.flowFqn}`);
    return { isValid: false, errors };
  }

  // Validate trigger input structure
  if (!testCase.triggerInput) {
    errors.push('Trigger input is required');
  }

  // Validate assertions
  if (!testCase.assertions || testCase.assertions.length === 0) {
    errors.push('At least one assertion is required');
  } else {
    testCase.assertions.forEach((assertion, index) => {
      if (!assertion.targetPath) {
        errors.push(`Assertion ${index + 1}: targetPath is required`);
      }
      if (assertion.expectedValue === undefined) {
        errors.push(`Assertion ${index + 1}: expectedValue is required`);
      }
      if (!assertion.comparison) {
        errors.push(`Assertion ${index + 1}: comparison method is required`);
      }
    });
  }

  // Validate component mocks
  if (testCase.componentMocks) {
    testCase.componentMocks.forEach((mock, index) => {
      if (!mock.stepIdPattern) {
        errors.push(`Mock ${index + 1}: stepIdPattern is required`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate mock responses for common component types
 */
export function generateMockResponses(
  flowFqn: string,
  moduleRegistry: IModuleRegistry
): MockedComponentResponse[] {
  const flowDefinition = moduleRegistry.getFlowDefinition(flowFqn);
  if (!flowDefinition?.steps) {
    return [];
  }

  const mocks: MockedComponentResponse[] = [];

  flowDefinition.steps.forEach((step: any) => {
    const componentInfo = moduleRegistry.resolveComponentTypeInfo(step.component_ref, flowFqn);
    
    if (componentInfo?.baseType) {
      const mockResponse = createMockForComponentType(componentInfo.baseType, step.step_id);
      if (mockResponse) {
        mocks.push(mockResponse);
      }
    }
  });

  return mocks;
}

/**
 * Evaluate assertions against test results
 */
export function evaluateAssertions(
  assertions: TestCaseAssertion[],
  testResult: any
): AssertionResult[] {
  return assertions.map(assertion => {
    const actualValue = getValueAtPath(testResult, assertion.targetPath);
    const passed = evaluateComparison(actualValue, assertion.expectedValue, assertion.comparison);
    
    return {
      ...assertion,
      actualValue,
      passed,
      message: passed 
        ? 'Assertion passed' 
        : `Expected ${assertion.expectedValue}, got ${actualValue}`
    };
  });
}

// Helper functions

function generateTriggerInputTemplate(trigger: any): any {
  if (!trigger) return {};
  
  // Generate appropriate input based on trigger type
  switch (trigger.type) {
    case 'HttpTrigger':
      return {
        method: 'POST',
        path: trigger.config?.path || '/api/test',
        body: { test: 'data' },
        headers: { 'Content-Type': 'application/json' }
      };
    case 'ScheduleTrigger':
      return {
        scheduledTime: new Date().toISOString()
      };
    case 'ManualTrigger':
      return {
        triggeredBy: 'test-user',
        reason: 'automated-test'
      };
    default:
      return { test: 'input' };
  }
}

function generateInvalidInputTemplate(trigger: any): any {
  const validTemplate = generateTriggerInputTemplate(trigger);
  
  // Introduce invalid data
  if (validTemplate.body) {
    validTemplate.body = null; // Invalid body
  }
  if (validTemplate.method) {
    validTemplate.method = 'INVALID_METHOD';
  }
  
  return validTemplate;
}

function createMockForComponentType(componentType: string, stepId: string): MockedComponentResponse | null {
  switch (componentType) {
    case 'StdLib:HttpCall':
      return {
        stepIdPattern: stepId,
        outputData: {
          response: { status: 'success', data: 'mocked response' },
          statusCode: 200
        }
      };
    case 'StdLib:DataTransform':
      return {
        stepIdPattern: stepId,
        outputData: {
          result: 'transformed data'
        }
      };
    case 'StdLib:FileWrite':
      return {
        stepIdPattern: stepId,
        outputData: {
          success: true,
          bytesWritten: 1024
        }
      };
    default:
      return null;
  }
}

function getValueAtPath(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

function evaluateComparison(actual: any, expected: any, comparison: string): boolean {
  switch (comparison) {
    case 'equals':
      return actual === expected;
    case 'notEquals':
      return actual !== expected;
    case 'contains':
      return typeof actual === 'string' && actual.includes(expected);
    case 'greaterThan':
      return typeof actual === 'number' && actual > expected;
    case 'lessThan':
      return typeof actual === 'number' && actual < expected;
    case 'matchesRegex':
      return typeof actual === 'string' && new RegExp(expected).test(actual);
    case 'exists':
      return actual !== undefined && actual !== null;
    case 'isEmpty':
      return !actual || (Array.isArray(actual) && actual.length === 0) || 
             (typeof actual === 'object' && Object.keys(actual).length === 0);
    default:
      return false;
  }
} 