import { test as base, expect, Page, TestInfo } from '@playwright/test';
import { LLMDebugCapture } from './llm-debug-capture';

// Extend the base test to include LLM debug capture
export const test = base.extend<{
  debugCapture: LLMDebugCapture;
}>({
  debugCapture: async ({ page }, use) => {
    const capture = new LLMDebugCapture(page);
    await use(capture);
  },
});

// Re-export expect for convenience
export { expect };

/**
 * Custom test fixture that automatically captures UI state on test failure
 */
export const testWithAutoCapture = base.extend<{
  debugCapture: LLMDebugCapture;
}>({
  debugCapture: async ({ page }, use, testInfo) => {
    const capture = new LLMDebugCapture(page);
    
    // Use the capture instance in the test
    await use(capture);
    
    // Auto-capture on test failure with inline debug analysis
    if (testInfo.status === 'failed') {
      try {
        const reportName = `failure-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}`;
        const reportPath = await capture.captureUIState({
          reportName,
          testContext: {
            testName: testInfo.title,
            testFile: testInfo.file,
            failureReason: testInfo.error?.message,
          },
          includeScreenshots: false, // Disabled for speed
          includePerformanceMetrics: false, // Disabled for speed
        });
        
        // Inline debug analysis
        await analyzeFailureInline(reportPath, testInfo);
      } catch (error) {
        console.warn('Failed to capture debug info on test failure:', error);
      }
    }
  },
});

// Helper function for inline report analysis
async function analyzeReportInline(reportPath: string, context: string, expectedBehavior?: string) {
  try {
    const fs = await import('fs/promises');
    const reportContent = await fs.readFile(reportPath, 'utf-8');
    const report = JSON.parse(reportContent);

    console.log('\n' + '='.repeat(60));
    console.log(`🔍 DEBUG ANALYSIS: ${context}`);
    console.log('='.repeat(60));
    
    // Quick stats
    console.log(`📊 Elements captured: ${report.elements.length}`);
    console.log(`📝 Console messages: ${report.consoleLogs.length}`);
    console.log(`🌐 Network requests: ${report.networkRequests.length}`);
    
    // Visible elements analysis
    const visibleElements = report.elements.filter((el: any) => 
      el.computedStyle?.display !== 'none' && 
      el.computedStyle?.visibility !== 'hidden' &&
      el.boundingBox?.width > 0 && 
      el.boundingBox?.height > 0
    );
    console.log(`✅ Visible elements: ${visibleElements.length}/${report.elements.length}`);
    
    // Interactive elements
    const interactiveElements = report.elements.filter((el: any) => 
      ['button', 'input', 'select', 'textarea', 'a'].includes(el.tagName?.toLowerCase()) ||
      el.attributes?.role === 'button' ||
      el.attributes?.onclick
    );
    console.log(`🖱️  Interactive elements: ${interactiveElements.length}`);
    
    // Layout issues
    const layoutIssues = report.elements.filter((el: any) => 
      el.boundingBox?.width === 0 || 
      el.boundingBox?.height === 0
    );
    if (layoutIssues.length > 0) {
      console.log(`⚠️  Elements with layout issues: ${layoutIssues.length}`);
      layoutIssues.slice(0, 3).forEach((el: any) => {
        console.log(`   - ${el.selector}: ${el.boundingBox?.width || 0}x${el.boundingBox?.height || 0}`);
      });
    }

    // Console errors
    const consoleErrors = report.consoleLogs.filter((log: any) => log.type === 'error');
    if (consoleErrors.length > 0) {
      console.log(`🚨 Console errors: ${consoleErrors.length}`);
      consoleErrors.slice(0, 3).forEach((error: any) => {
        console.log(`   - ${error.text}`);
      });
    }

    // Failed network requests
    const failedRequests = report.networkRequests.filter((req: any) => req.status >= 400);
    if (failedRequests.length > 0) {
      console.log(`🌐 Failed requests: ${failedRequests.length}`);
      failedRequests.forEach((req: any) => {
        console.log(`   - ${req.method} ${req.url} (${req.status})`);
      });
    }

    // Key elements summary with useful information
    const keyElements = report.elements.filter((el: any) => 
      el.selector.includes('data-testid') || 
      el.selector.includes('react-flow') ||
      ['button', 'input', 'select'].includes(el.tagName?.toLowerCase())
    );
    if (keyElements.length > 0) {
      console.log(`🎯 Key elements found: ${keyElements.length}`);
      keyElements.slice(0, 8).forEach((el: any) => {
        const visible = el.boundingBox?.width > 0 && el.boundingBox?.height > 0 ? '✅' : '❌';
        const text = el.textContent ? ` "${el.textContent.slice(0, 30)}${el.textContent.length > 30 ? '...' : ''}"` : '';
        const title = el.attributes?.title ? ` title="${el.attributes.title}"` : '';
        const ariaLabel = el.attributes?.['aria-label'] ? ` aria-label="${el.attributes['aria-label']}"` : '';
        const className = el.attributes?.class ? ` .${el.attributes.class.split(' ')[0]}` : '';
        const id = el.attributes?.id ? ` #${el.attributes.id}` : '';
        
        console.log(`   ${visible} ${el.tagName}${id}${className}${text}${title}${ariaLabel}`);
        console.log(`      └─ ${el.selector}`);
      });
    }

    // Interactive elements with details
    const detailedInteractiveElements = report.elements.filter((el: any) => 
      ['button', 'input', 'select', 'textarea', 'a'].includes(el.tagName?.toLowerCase()) ||
      el.attributes?.role === 'button' ||
      el.attributes?.onclick
    );
    if (detailedInteractiveElements.length > 0) {
      console.log(`\n🖱️  Interactive elements details:`);
      detailedInteractiveElements.slice(0, 5).forEach((el: any) => {
        const visible = el.boundingBox?.width > 0 && el.boundingBox?.height > 0 ? '✅' : '❌';
        const text = el.textContent ? ` "${el.textContent.trim()}"` : '';
        const type = el.attributes?.type ? ` type="${el.attributes.type}"` : '';
        const disabled = el.attributes?.disabled ? ' [DISABLED]' : '';
        
        console.log(`   ${visible} ${el.tagName}${type}${text}${disabled}`);
        if (el.boundingBox) {
          console.log(`      └─ Position: ${Math.round(el.boundingBox.x)},${Math.round(el.boundingBox.y)} Size: ${Math.round(el.boundingBox.width)}x${Math.round(el.boundingBox.height)}`);
        }
      });
    }

    console.log(`\n📄 Full report: ${reportPath}`);
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.warn('Failed to analyze report inline:', error);
  }
}

// Helper function for inline failure analysis
async function analyzeFailureInline(reportPath: string, testInfo: TestInfo) {
    try {
      const fs = await import('fs/promises');
      const reportContent = await fs.readFile(reportPath, 'utf-8');
      const report = JSON.parse(reportContent);

      console.log('\n' + '='.repeat(60));
      console.log(`🚨 TEST FAILURE ANALYSIS: ${testInfo.title}`);
      console.log('='.repeat(60));
      
      // Quick stats
      console.log(`📊 Elements captured: ${report.elements.length}`);
      console.log(`📝 Console messages: ${report.consoleLogs.length}`);
      console.log(`🌐 Network requests: ${report.networkRequests.length}`);
      
      // Visible elements analysis
      const visibleElements = report.elements.filter((el: any) => 
        el.computedStyle?.display !== 'none' && 
        el.computedStyle?.visibility !== 'hidden' &&
        el.boundingBox?.width > 0 && 
        el.boundingBox?.height > 0
      );
      console.log(`✅ Visible elements: ${visibleElements.length}/${report.elements.length}`);
      
      // Layout issues
      const layoutIssues = report.elements.filter((el: any) => 
        el.boundingBox?.width === 0 || 
        el.boundingBox?.height === 0
      );
      if (layoutIssues.length > 0) {
        console.log(`⚠️  Elements with layout issues: ${layoutIssues.length}`);
        layoutIssues.slice(0, 3).forEach((el: any) => {
          console.log(`   - ${el.selector}: ${el.boundingBox?.width || 0}x${el.boundingBox?.height || 0}`);
        });
      }

      // Console errors
      const consoleErrors = report.consoleLogs.filter((log: any) => log.type === 'error');
      if (consoleErrors.length > 0) {
        console.log(`🚨 Console errors: ${consoleErrors.length}`);
        consoleErrors.slice(0, 3).forEach((error: any) => {
          console.log(`   - ${error.text}`);
        });
      }

      // Failed network requests
      const failedRequests = report.networkRequests.filter((req: any) => req.status >= 400);
      if (failedRequests.length > 0) {
        console.log(`🌐 Failed requests: ${failedRequests.length}`);
        failedRequests.forEach((req: any) => {
          console.log(`   - ${req.method} ${req.url} (${req.status})`);
        });
      }

      // Missing elements (common cause of test failures)
      const missingElements = report.elements.filter((el: any) => el.error);
      if (missingElements.length > 0) {
        console.log(`❌ Missing/problematic elements: ${missingElements.length}`);
        missingElements.slice(0, 3).forEach((el: any) => {
          console.log(`   - ${el.selector}: ${el.error}`);
        });
      }

      // LLM prompt for deeper analysis
      console.log('\n🤖 LLM Analysis Prompt:');
      console.log('Copy this to your LLM for detailed analysis:');
      console.log('-'.repeat(40));
      console.log(`Test "${testInfo.title}" failed. Expected behavior: ${report.testContext?.expectedBehavior || 'Not specified'}`);
      console.log(`Error: ${testInfo.error?.message || 'Unknown error'}`);
      console.log(`\nUI State Analysis needed for:`);
      console.log(`- ${report.elements.length} elements captured`);
      console.log(`- ${consoleErrors.length} console errors`);
      console.log(`- ${failedRequests.length} failed network requests`);
      console.log(`- ${layoutIssues.length} layout issues detected`);
      console.log(`\nReport file: ${reportPath}`);
             console.log('-'.repeat(40));
       console.log('='.repeat(60) + '\n');
       
     } catch (error) {
       console.warn('Failed to analyze failure inline:', error);
     }
 }

/**
 * Helper function to wait for network idle state
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Helper function to wait for React hydration
 */
export async function waitForReactHydration(page: Page) {
  await page.waitForFunction(() => {
    // Check if React has hydrated by looking for React DevTools global
    return window.React !== undefined || 
           document.querySelector('[data-reactroot]') !== null ||
           document.querySelector('#__next') !== null;
  }, { timeout: 10000 });
}

/**
 * Helper function to mock API responses using MSW in Playwright
 */
export async function setupMSWInBrowser(page: Page) {
  // This would set up MSW in the browser context
  // You might need to serve MSW worker script and initialize it
  await page.addInitScript(() => {
    // MSW browser setup would go here
    // This is a placeholder - actual implementation depends on your MSW setup
  });
}

/**
 * Helper to capture UI state at any point in a test with inline analysis
 */
export async function captureUIStateForLLM(
  page: Page,
  reportName: string,
  options?: {
    elementsOfInterest?: string[];
    expectedBehavior?: string;
    includeScreenshots?: boolean;
    analyze?: boolean;
  }
) {
  const capture = new LLMDebugCapture(page);
  const reportPath = await capture.captureUIState({
    reportName,
    testContext: {
      testName: reportName,
      testFile: 'manual-capture',
      expectedBehavior: options?.expectedBehavior,
    },
    elementsOfInterest: options?.elementsOfInterest,
    includeScreenshots: options?.includeScreenshots ?? false, // Default to false for speed
  });

  // Inline analysis if requested
  if (options?.analyze !== false) {
    await analyzeReportInline(reportPath, reportName, options?.expectedBehavior);
  }

  return reportPath;
}

/**
 * Debug helper for immediate UI state analysis in tests
 */
export async function debugCurrentState(
  page: Page,
  context: string,
  elementsOfInterest?: string[]
) {
  console.log(`\n🔍 DEBUG: ${context}`);
  console.log('='.repeat(50));
  
  const capture = new LLMDebugCapture(page);
  const reportPath = await capture.captureUIState({
    reportName: `debug-${context.replace(/\s+/g, '-')}-${Date.now()}`,
    testContext: {
      testName: context,
      testFile: 'debug',
      expectedBehavior: `Debugging: ${context}`,
    },
    elementsOfInterest: elementsOfInterest || [
      'button',
      '.react-flow',
      '.react-flow__panel',
      '[data-testid]',
      'input',
      'select'
    ],
    includeScreenshots: false,
  });

  await analyzeReportInline(reportPath, context);
  return reportPath;
}

/**
 * Custom assertion that captures UI state on failure
 */
export async function expectWithCapture(
  page: Page,
  assertion: () => Promise<void> | void,
  captureOptions?: {
    reportName?: string;
    elementsOfInterest?: string[];
    expectedBehavior?: string;
  }
) {
  try {
    await assertion();
  } catch (error) {
    // Capture UI state on assertion failure
    const reportName = captureOptions?.reportName || `assertion-failure-${Date.now()}`;
    await captureUIStateForLLM(page, reportName, {
      elementsOfInterest: captureOptions?.elementsOfInterest,
      expectedBehavior: captureOptions?.expectedBehavior,
    });
    throw error; // Re-throw the original error
  }
}

/**
 * Page object model base class with debug capture integration
 */
export class PageWithDebugCapture {
  protected page: Page;
  protected debugCapture: LLMDebugCapture;

  constructor(page: Page) {
    this.page = page;
    this.debugCapture = new LLMDebugCapture(page);
  }

  async captureCurrentState(reportName: string, elementsOfInterest?: string[]) {
    return await this.debugCapture.captureUIState({
      reportName,
      elementsOfInterest,
      testContext: {
        testName: reportName,
        testFile: this.constructor.name,
      },
    });
  }

  async goto(url: string) {
    await this.page.goto(url);
    await waitForNetworkIdle(this.page);
    await waitForReactHydration(this.page);
  }
} 