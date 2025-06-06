import { Page, Locator } from '@playwright/test';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export interface ElementInfo {
  selector: string;
  tagName: string;
  id?: string;
  className?: string;
  dataTestId?: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  computedStyle: {
    display: string;
    position: string;
    width: string;
    height: string;
    marginTop: string;
    marginRight: string;
    marginBottom: string;
    marginLeft: string;
    paddingTop: string;
    paddingRight: string;
    paddingBottom: string;
    paddingLeft: string;
    borderTopWidth: string;
    borderRightWidth: string;
    borderBottomWidth: string;
    borderLeftWidth: string;
    backgroundColor: string;
    color: string;
    fontSize: string;
    fontFamily: string;
    lineHeight: string;
    textAlign: string;
    zIndex: string;
    opacity: string;
    visibility: string;
    overflow: string;
    transform: string;
    flexDirection?: string;
    justifyContent?: string;
    alignItems?: string;
    gridTemplateColumns?: string;
    gridTemplateRows?: string;
  };
  textContent: string | null;
  innerHTML: string;
  attributes: Record<string, string>;
  screenshotPath?: string;
  error?: string;
}

export interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  timing: {
    startTime: number;
    endTime: number;
    duration: number;
  };
  requestBody?: string;
  responseBody?: string;
}

export interface ConsoleMessage {
  type: 'log' | 'error' | 'warn' | 'info' | 'debug';
  text: string;
  timestamp: number;
  location?: {
    url: string;
    lineNumber: number;
    columnNumber: number;
  };
}

export interface UIDebugReport {
  timestamp: string;
  url: string;
  title: string;
  viewport: {
    width: number;
    height: number;
  };
  screenshotPath?: string;
  elements: ElementInfo[];
  consoleLogs: ConsoleMessage[];
  networkRequests: NetworkRequest[];
  performanceMetrics?: {
    domContentLoaded: number;
    loadComplete: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
  };
  testContext?: {
    testName: string;
    testFile: string;
    failureReason?: string;
    expectedBehavior?: string;
  };
}

export class LLMDebugCapture {
  private page: Page;
  private reportDir: string;
  private consoleLogs: ConsoleMessage[] = [];
  private networkRequests: NetworkRequest[] = [];

  constructor(page: Page, reportDir: string = 'src/test/debug-reports') {
    this.page = page;
    this.reportDir = reportDir;
    this.setupListeners();
  }

  private setupListeners() {
    // Capture console messages
    this.page.on('console', (msg) => {
      this.consoleLogs.push({
        type: msg.type() as ConsoleMessage['type'],
        text: msg.text(),
        timestamp: Date.now(),
        location: msg.location() ? {
          url: msg.location().url,
          lineNumber: msg.location().lineNumber,
          columnNumber: msg.location().columnNumber,
        } : undefined,
      });
    });

    // Capture network requests
    this.page.on('response', async (response) => {
      try {
        const request = response.request();
        const timing = response.request().timing();
        
        this.networkRequests.push({
          url: request.url(),
          method: request.method(),
          status: response.status(),
          statusText: response.statusText(),
          headers: await response.allHeaders(),
          timing: {
            startTime: timing?.startTime || 0,
            endTime: timing?.responseEnd || 0,
            duration: (timing?.responseEnd || 0) - (timing?.startTime || 0),
          },
          requestBody: request.postData() || undefined,
          responseBody: await response.text().catch(() => undefined),
        });
      } catch (error) {
        // Ignore errors in network capture to avoid breaking tests
        console.warn('Failed to capture network request:', error);
      }
    });
  }

  /**
   * Capture UI state for LLM analysis
   */
  async captureUIState(options: {
    elementsOfInterest?: string[];
    reportName: string;
    testContext?: {
      testName: string;
      testFile: string;
      failureReason?: string;
      expectedBehavior?: string;
    };
    includeScreenshots?: boolean;
    includePerformanceMetrics?: boolean;
  }): Promise<string> {
    const {
      elementsOfInterest = [],
      reportName,
      testContext,
      includeScreenshots = true,
      includePerformanceMetrics = false,
    } = options;

    // Ensure report directory exists
    await mkdir(this.reportDir, { recursive: true });

    const timestamp = new Date().toISOString();
    const viewport = this.page.viewportSize() || { width: 1280, height: 720 };

    // Take full page screenshot if requested
    let screenshotPath: string | undefined;
    if (includeScreenshots) {
      screenshotPath = join(this.reportDir, `${reportName}-page.png`);
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
    }

    // Get performance metrics if requested
    let performanceMetrics: UIDebugReport['performanceMetrics'];
    if (includePerformanceMetrics) {
      try {
        const metrics = await this.page.evaluate(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          const paint = performance.getEntriesByType('paint');
          
          return {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            loadComplete: navigation.loadEventEnd - navigation.fetchStart,
            firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
            largestContentfulPaint: paint.find(p => p.name === 'largest-contentful-paint')?.startTime,
          };
        });
        performanceMetrics = metrics;
      } catch (error) {
        console.warn('Failed to capture performance metrics:', error);
      }
    }

    // Capture element information
    const elements: ElementInfo[] = [];
    
    // If no specific elements provided, capture common interactive elements
    const defaultSelectors = [
      '[data-testid]',
      'button',
      'input',
      'select',
      'textarea',
      'a[href]',
      '[role="button"]',
      '[role="link"]',
      '.error',
      '.loading',
      '.spinner',
      'main',
      'header',
      'footer',
      'nav',
    ];

    const selectorsToCapture = elementsOfInterest.length > 0 ? elementsOfInterest : defaultSelectors;

    for (const selector of selectorsToCapture) {
      try {
        const locators = this.page.locator(selector);
        const count = await locators.count();

        for (let i = 0; i < Math.min(count, 10); i++) { // Limit to 10 elements per selector
          const locator = locators.nth(i);
          const elementInfo = await this.captureElementInfo(locator, selector, reportName, includeScreenshots);
          if (elementInfo) {
            elements.push(elementInfo);
          }
        }
      } catch (error) {
        console.warn(`Failed to capture elements for selector "${selector}":`, error);
        elements.push({
          selector,
          tagName: 'UNKNOWN',
          boundingBox: null,
          computedStyle: {} as any,
          textContent: null,
          innerHTML: '',
          attributes: {},
          error: `Failed to capture: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    // Create the debug report
    const report: UIDebugReport = {
      timestamp,
      url: this.page.url(),
      title: await this.page.title(),
      viewport,
      screenshotPath,
      elements,
      consoleLogs: [...this.consoleLogs],
      networkRequests: [...this.networkRequests],
      performanceMetrics,
      testContext,
    };

    // Save the report
    const reportPath = join(this.reportDir, `${reportName}.json`);
    await writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`🔍 UI Debug Report saved to: ${reportPath}`);
    console.log(`📊 Captured ${elements.length} elements, ${this.consoleLogs.length} console messages, ${this.networkRequests.length} network requests`);

    return reportPath;
  }

  private async captureElementInfo(
    locator: Locator,
    selector: string,
    reportName: string,
    includeScreenshots: boolean
  ): Promise<ElementInfo | null> {
    try {
      // Wait for element to be visible with a short timeout
      await locator.waitFor({ state: 'attached', timeout: 2000 });

      const boundingBox = await locator.boundingBox();
      const tagName = await locator.evaluate(el => el.tagName);
      
      // Get computed styles
      const computedStyle = await locator.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          display: style.display,
          position: style.position,
          width: style.width,
          height: style.height,
          marginTop: style.marginTop,
          marginRight: style.marginRight,
          marginBottom: style.marginBottom,
          marginLeft: style.marginLeft,
          paddingTop: style.paddingTop,
          paddingRight: style.paddingRight,
          paddingBottom: style.paddingBottom,
          paddingLeft: style.paddingLeft,
          borderTopWidth: style.borderTopWidth,
          borderRightWidth: style.borderRightWidth,
          borderBottomWidth: style.borderBottomWidth,
          borderLeftWidth: style.borderLeftWidth,
          backgroundColor: style.backgroundColor,
          color: style.color,
          fontSize: style.fontSize,
          fontFamily: style.fontFamily,
          lineHeight: style.lineHeight,
          textAlign: style.textAlign,
          zIndex: style.zIndex,
          opacity: style.opacity,
          visibility: style.visibility,
          overflow: style.overflow,
          transform: style.transform,
          flexDirection: style.flexDirection,
          justifyContent: style.justifyContent,
          alignItems: style.alignItems,
          gridTemplateColumns: style.gridTemplateColumns,
          gridTemplateRows: style.gridTemplateRows,
        };
      });

      // Get element attributes and content
      const [textContent, innerHTML, attributes, id, className, dataTestId] = await Promise.all([
        locator.textContent(),
        locator.innerHTML(),
        locator.evaluate(el => {
          const attrs: Record<string, string> = {};
          for (let i = 0; i < el.attributes.length; i++) {
            const attr = el.attributes[i];
            attrs[attr.name] = attr.value;
          }
          return attrs;
        }),
        locator.getAttribute('id'),
        locator.getAttribute('class'),
        locator.getAttribute('data-testid'),
      ]);

      // Take element screenshot if requested and element is visible
      let screenshotPath: string | undefined;
      if (includeScreenshots && boundingBox && boundingBox.width > 0 && boundingBox.height > 0) {
        try {
          const sanitizedSelector = selector.replace(/[^a-zA-Z0-9]/g, '_');
          screenshotPath = join(this.reportDir, `${reportName}-element-${sanitizedSelector}-${Date.now()}.png`);
          await locator.screenshot({ path: screenshotPath });
        } catch (error) {
          console.warn('Failed to take element screenshot:', error);
        }
      }

      return {
        selector,
        tagName,
        id: id || undefined,
        className: className || undefined,
        dataTestId: dataTestId || undefined,
        boundingBox,
        computedStyle,
        textContent,
        innerHTML,
        attributes,
        screenshotPath,
      };
    } catch (error) {
      return {
        selector,
        tagName: 'UNKNOWN',
        boundingBox: null,
        computedStyle: {} as any,
        textContent: null,
        innerHTML: '',
        attributes: {},
        error: `Failed to capture: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Clear captured logs and requests (useful between test cases)
   */
  clearCaptures() {
    this.consoleLogs = [];
    this.networkRequests = [];
  }

  /**
   * Generate LLM-friendly prompt with the captured data
   */
  static generateLLMPrompt(reportPath: string, customPrompt?: string): string {
    const defaultPrompt = `
I'm debugging a Next.js application and have captured detailed UI state information using Playwright. 
The data includes element positions, computed styles, console logs, and network requests.

Please analyze this UI debug report and help me identify potential issues with:
1. Layout and positioning problems
2. CSS styling issues
3. JavaScript errors or warnings
4. Network request failures
5. Performance bottlenecks
6. Accessibility concerns

Focus on actionable insights and specific recommendations for fixes.

Debug Report Location: ${reportPath}

Please load and analyze the JSON data from this file.
`;

    return customPrompt || defaultPrompt;
  }
} 