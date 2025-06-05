import { testWithAutoCapture as test, expect, captureUIStateForLLM, expectWithCapture, debugCurrentState } from '../utils/playwright-helpers';

test.describe('Example E2E Tests with LLM Debug Capture', () => {
  test('should load homepage with inline debug analysis', async ({ page, debugCapture }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Debug the initial page state with inline analysis
    await debugCurrentState(page, 'Homepage initial load', [
      'header',
      'nav',
      'main',
      '[data-testid="flow-canvas"]',
      'button',
      '.react-flow',
    ]);
    
    // Basic assertions - updated to match actual app
    await expect(page).toHaveTitle(/CascadeFlowVisualizer Demo/);
    await expect(page.locator('.react-flow')).toBeVisible();
  });

  test('should handle flow interactions with inline debug', async ({ page, debugCapture }) => {
    await page.goto('/');
    
    // Debug the initial state
    await debugCurrentState(page, 'Before flow interactions');
    
    await expect(page.locator('.react-flow')).toBeVisible();
    
    // Debug after React Flow is visible
    await debugCurrentState(page, 'After React Flow loaded', [
      'button', 
      '.react-flow', 
      '.react-flow__panel',
      '.react-flow__controls'
    ]);
    
    // Check for buttons and debug if not found
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      await debugCurrentState(page, `Found ${buttonCount} buttons, checking first one`);
      await expect(buttons.first()).toBeVisible();
    } else {
      await debugCurrentState(page, 'No buttons found on page');
    }
  });

    test('should test desktop layout', async ({ page, debugCapture }) => {
    // Test desktop viewport only for speed - use CLI for responsive testing
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Capture UI state for desktop
    await debugCapture.captureUIState({
      reportName: 'desktop-layout-test',
      testContext: {
        testName: 'Desktop Layout Test',
        testFile: __filename,
        expectedBehavior: 'Layout should display properly on desktop viewport',
      },
      elementsOfInterest: [
        'button',
        '.react-flow',
        '.react-flow__panel',
        '.react-flow__minimap',
        '.react-flow__background',
      ],
    });

    // Basic checks
    const reactFlow = page.locator('.react-flow');
    await expect(reactFlow).toBeVisible();
    
    const minimap = page.locator('.react-flow__minimap');
    await expect(minimap).toBeVisible();
  });

  test('should test error states with debug capture', async ({ page, debugCapture }) => {
    // Navigate to a page that might have errors
    await page.goto('/');
    
    // Simulate an error condition or navigate to an error-prone state
    // This is just an example - adapt to your actual error scenarios
    
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Trigger some action that might cause errors
    try {
      await page.click('[data-testid="trigger-error"]', { timeout: 2000 });
    } catch (error) {
      // Expected if the element doesn't exist
    }

    // Wait a bit for any async errors
    await page.waitForTimeout(1000);

    // If there were console errors, capture the state
    if (consoleErrors.length > 0) {
      await debugCapture.captureUIState({
        reportName: 'console-errors-detected',
        testContext: {
          testName: 'Error State Analysis',
          testFile: __filename,
          failureReason: `Console errors detected: ${consoleErrors.join(', ')}`,
          expectedBehavior: 'No console errors should occur during normal operation',
        },
        includeScreenshots: false, // Use CLI for screenshots
      });
    }

    // This assertion might fail, triggering auto-capture
    expect(consoleErrors).toHaveLength(0);
  });

  test('should demonstrate inline debug during interactions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Debug initial state
    await debugCurrentState(page, 'Before user interactions');
    
    // Simulate some user interactions
    try {
      await page.click('button:first-child', { timeout: 2000 });
      await page.waitForTimeout(500);
      
      // Debug after interaction
      await debugCurrentState(page, 'After clicking first button');
    } catch (error) {
      // Debug when interaction fails
      await debugCurrentState(page, 'Button click failed - analyzing state');
    }

    // Final state capture with detailed analysis
    await captureUIStateForLLM(
      page,
      'final-interaction-state',
      {
        elementsOfInterest: [
          'button',
          '[data-testid]',
          '.react-flow__node',
          '.react-flow__edge',
          'input',
          'select',
        ],
        expectedBehavior: 'All interactive elements should be properly positioned and styled after interactions',
        analyze: true, // This will show detailed inline analysis
      }
    );
  });

  test('should demonstrate debug output format', async ({ page, debugCapture }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Debug to show the improved output format
    await debugCurrentState(page, 'Demonstrating improved debug output');
    
    // Simple assertion that should pass
    await expect(page.locator('.react-flow')).toBeVisible();
  });
}); 