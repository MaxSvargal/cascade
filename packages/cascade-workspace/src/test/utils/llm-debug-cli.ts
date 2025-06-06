#!/usr/bin/env node

import { chromium, Browser, Page } from 'playwright';
import { LLMDebugCapture } from './llm-debug-capture';
import { program } from 'commander';
import { readFile } from 'fs/promises';

interface CLIOptions {
  url: string;
  elements?: string;
  output?: string;
  headless?: boolean;
  screenshots?: boolean;
  performance?: boolean;
  viewport?: string;
  wait?: number;
  expected?: string;
}

async function captureUIForLLM(options: CLIOptions) {
  const {
    url,
    elements,
    output = 'llm-debug-capture',
    headless = true,
    screenshots = true,
    performance = false,
    viewport = '1280x720',
    wait = 2000,
    expected,
  } = options;

  console.log('🚀 Starting LLM Debug Capture...');
  console.log(`📍 URL: ${url}`);
  console.log(`🖥️  Viewport: ${viewport}`);
  console.log(`👁️  Headless: ${headless}`);

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // Parse viewport
    const [width, height] = viewport.split('x').map(Number);
    if (!width || !height) {
      throw new Error('Invalid viewport format. Use WIDTHxHEIGHT (e.g., 1280x720)');
    }

    // Launch browser
    browser = await chromium.launch({ headless });
    page = await browser.newPage();
    await page.setViewportSize({ width, height });

    // Initialize debug capture
    const debugCapture = new LLMDebugCapture(page);

    // Navigate to URL
    console.log('🌐 Navigating to URL...');
    await page.goto(url);
    await page.waitForLoadState('networkidle');

    // Wait additional time if specified
    if (wait > 0) {
      console.log(`⏳ Waiting ${wait}ms for page to settle...`);
      await page.waitForTimeout(wait);
    }

    // Parse elements of interest
    const elementsOfInterest = elements ? elements.split(',').map(s => s.trim()) : undefined;

    // Capture UI state
    console.log('📊 Capturing UI state...');
    const reportPath = await debugCapture.captureUIState({
      reportName: output,
      testContext: {
        testName: 'CLI Debug Capture',
        testFile: 'cli',
        expectedBehavior: expected,
      },
      elementsOfInterest,
      includeScreenshots: screenshots,
      includePerformanceMetrics: performance,
    });

    console.log('✅ Capture completed successfully!');
    console.log(`📄 Report saved to: ${reportPath}`);
    
    // Quick analysis
    console.log('\n📊 Quick Analysis:');
    console.log('=' .repeat(30));
    console.log(`💡 To analyze with LLM: pnpm llm-debug analyze -r ${reportPath}`);
    console.log(`🔍 To capture with screenshots: add --no-screenshots=false`);
    console.log(`📱 To test mobile: pnpm debug:mobile`);
    console.log(`🖥️  To test desktop: pnpm debug:desktop`);
    
    // Generate LLM prompt
    const prompt = LLMDebugCapture.generateLLMPrompt(reportPath, expected ? 
      `I'm debugging a UI issue. Expected behavior: ${expected}. Please analyze the captured data and provide insights.` : 
      undefined
    );

    console.log('\n🤖 LLM Prompt:');
    console.log('=' .repeat(50));
    console.log(prompt);
    console.log('=' .repeat(50));

    return reportPath;

  } catch (error) {
    console.error('❌ Error during capture:', error);
    throw error;
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

async function analyzeReport(reportPath: string) {
  try {
    console.log(`📖 Reading report: ${reportPath}`);
    const reportContent = await readFile(reportPath, 'utf-8');
    const report = JSON.parse(reportContent);

    console.log('\n📊 Report Summary:');
    console.log('=' .repeat(30));
    console.log(`🌐 URL: ${report.url}`);
    console.log(`📅 Timestamp: ${report.timestamp}`);
    console.log(`📏 Viewport: ${report.viewport.width}x${report.viewport.height}`);
    console.log(`🔍 Elements captured: ${report.elements.length}`);
    console.log(`📝 Console messages: ${report.consoleLogs.length}`);
    console.log(`🌐 Network requests: ${report.networkRequests.length}`);

    // Show errors if any
    const elementsWithErrors = report.elements.filter((el: any) => el.error);
    if (elementsWithErrors.length > 0) {
      console.log(`\n⚠️  Elements with errors: ${elementsWithErrors.length}`);
      elementsWithErrors.forEach((el: any) => {
        console.log(`   - ${el.selector}: ${el.error}`);
      });
    }

    // Show console errors
    const consoleErrors = report.consoleLogs.filter((log: any) => log.type === 'error');
    if (consoleErrors.length > 0) {
      console.log(`\n🚨 Console errors: ${consoleErrors.length}`);
      consoleErrors.forEach((error: any) => {
        console.log(`   - ${error.text}`);
      });
    }

    // Show failed network requests
    const failedRequests = report.networkRequests.filter((req: any) => req.status >= 400);
    if (failedRequests.length > 0) {
      console.log(`\n🌐 Failed requests: ${failedRequests.length}`);
      failedRequests.forEach((req: any) => {
        console.log(`   - ${req.method} ${req.url} (${req.status})`);
      });
    }

    // Show element summary
    console.log('\n🎯 Element Summary:');
    const visibleElements = report.elements.filter((el: any) => 
      el.computedStyle?.display !== 'none' && 
      el.computedStyle?.visibility !== 'hidden' &&
      el.boundingBox?.width > 0 && 
      el.boundingBox?.height > 0
    );
    console.log(`✅ Visible elements: ${visibleElements.length}/${report.elements.length}`);
    
    // Show layout issues
    const layoutIssues = report.elements.filter((el: any) => 
      el.boundingBox?.width === 0 || 
      el.boundingBox?.height === 0 ||
      el.computedStyle?.position === 'absolute' && !el.computedStyle?.top && !el.computedStyle?.left
    );
    if (layoutIssues.length > 0) {
      console.log(`⚠️  Potential layout issues: ${layoutIssues.length} elements`);
    }

    // Generate analysis prompt
    const prompt = LLMDebugCapture.generateLLMPrompt(reportPath);
    console.log('\n🤖 LLM Analysis Prompt:');
    console.log('=' .repeat(50));
    console.log(prompt);
    console.log('=' .repeat(50));
    
    console.log('\n💡 Quick Commands:');
    console.log(`📸 Capture with screenshots: pnpm debug:with-screenshots`);
    console.log(`📱 Test mobile layout: pnpm debug:mobile`);
    console.log(`🖥️  Test desktop layout: pnpm debug:desktop`);

  } catch (error) {
    console.error('❌ Error analyzing report:', error);
    throw error;
  }
}

// CLI Setup
program
  .name('llm-debug')
  .description('Capture UI state for LLM-powered debugging')
  .version('1.0.0');

program
  .command('capture')
  .description('Capture UI state from a webpage')
  .requiredOption('-u, --url <url>', 'URL to capture')
  .option('-e, --elements <elements>', 'Comma-separated list of CSS selectors to focus on')
  .option('-o, --output <name>', 'Output report name', 'llm-debug-capture')
  .option('--no-headless', 'Run browser in headed mode')
  .option('--no-screenshots', 'Skip taking screenshots')
  .option('--performance', 'Include performance metrics')
  .option('-v, --viewport <size>', 'Viewport size (WIDTHxHEIGHT)', '1280x720')
  .option('-w, --wait <ms>', 'Wait time after page load (ms)', parseInt, 2000)
  .option('--expected <behavior>', 'Expected behavior description for LLM context')
  .action(async (options: CLIOptions) => {
    try {
      await captureUIForLLM(options);
    } catch (error) {
      console.error('Capture failed:', error);
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Analyze an existing debug report')
  .requiredOption('-r, --report <path>', 'Path to the debug report JSON file')
  .action(async (options: { report: string }) => {
    try {
      await analyzeReport(options.report);
    } catch (error) {
      console.error('Analysis failed:', error);
      process.exit(1);
    }
  });

// Add example commands
program
  .command('examples')
  .description('Show example usage')
  .action(() => {
    console.log('🔍 LLM Debug CLI Examples:');
    console.log('');
    console.log('Basic capture:');
    console.log('  pnpm llm-debug capture -u http://localhost:3000');
    console.log('');
    console.log('Capture specific elements:');
    console.log('  pnpm llm-debug capture -u http://localhost:3000 -e "button,.react-flow,header"');
    console.log('');
    console.log('Capture with context:');
    console.log('  pnpm llm-debug capture -u http://localhost:3000 --expected "Sidebar should be visible on desktop"');
    console.log('');
    console.log('Mobile viewport capture:');
    console.log('  pnpm llm-debug capture -u http://localhost:3000 -v 375x667');
    console.log('');
    console.log('Analyze existing report:');
    console.log('  pnpm llm-debug analyze -r src/test/debug-reports/my-report.json');
    console.log('');
    console.log('Headed mode for debugging:');
    console.log('  pnpm llm-debug capture -u http://localhost:3000 --no-headless');
  });

if (require.main === module) {
  program.parse();
} 