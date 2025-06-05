# Testing Setup & LLM Debugging Automation

This document describes the comprehensive testing setup for the Cascade Visualizer project, including the innovative LLM debugging automation system.

## 🧪 Testing Stack Overview

Our testing setup follows the testing pyramid with three main layers:

### 1. **Unit Testing** - Vitest + React Testing Library + MSW
- **Fast execution** with Vite's HMR capabilities
- **Jest-compatible API** for easy migration and familiarity
- **ESM & TypeScript first** with excellent modern JavaScript support
- **MSW integration** for realistic API mocking at the network level

### 2. **Integration Testing** - Vitest + MSW + Component Testing
- Tests component interactions with APIs
- Realistic data fetching scenarios
- Cross-component communication testing

### 3. **End-to-End Testing** - Playwright + LLM Debug Automation
- **Real browser testing** across Chromium, Firefox, and WebKit
- **Auto-wait capabilities** for robust async handling
- **Rich debugging features** including trace viewer and video recording
- **Integrated LLM debugging** for automated UI state analysis

## 🚀 Quick Start

### Install Dependencies
```bash
pnpm install
```

### Run Tests
```bash
# Unit tests
pnpm test                    # Watch mode
pnpm test:run               # Single run
pnpm test:coverage          # With coverage
pnpm test:ui                # With Vitest UI

# E2E tests
pnpm test:e2e               # Headless mode
pnpm test:e2e:headed        # Headed mode (see browser)
pnpm test:e2e:ui            # With Playwright UI
pnpm test:e2e:debug         # Debug mode
```

## 🔍 LLM Debugging Automation

### Overview

The LLM debugging system automatically captures detailed UI state information when tests fail or when manually triggered. This data can then be analyzed by an LLM to provide debugging insights.

### What Gets Captured

- **Element Information**: Bounding boxes, computed styles, attributes, content
- **Console Messages**: Errors, warnings, logs with timestamps and locations
- **Network Requests**: Status codes, timing, headers, request/response bodies
- **Performance Metrics**: Load times, paint metrics, Core Web Vitals
- **Screenshots**: Full page and individual element screenshots
- **Test Context**: Test name, expected behavior, failure reasons

### Automatic Capture on Test Failure

Tests using `testWithAutoCapture` automatically capture UI state when they fail:

```typescript
import { testWithAutoCapture as test, expect } from '../utils/playwright-helpers';

test('should display user dashboard', async ({ page, debugCapture }) => {
  await page.goto('/dashboard');
  
  // If this fails, UI state is automatically captured
  await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
});
```

### Manual Capture During Tests

Capture UI state at specific points for analysis:

```typescript
test('should handle complex user flow', async ({ page, debugCapture }) => {
  await page.goto('/');
  
  // Capture state at a specific point
  await debugCapture.captureUIState({
    reportName: 'after-login',
    testContext: {
      testName: 'User Login Flow',
      testFile: __filename,
      expectedBehavior: 'User should see dashboard after login',
    },
    elementsOfInterest: ['[data-testid="dashboard"]', 'header', 'nav'],
    includeScreenshots: true,
    includePerformanceMetrics: true,
  });
});
```

### CLI Tool for Manual Debugging

Use the CLI tool to capture UI state from any webpage:

```bash
# Basic capture
pnpm llm-debug capture -u http://localhost:3000

# Capture specific elements
pnpm llm-debug capture -u http://localhost:3000 -e "button,.react-flow,header"

# Mobile viewport
pnpm llm-debug capture -u http://localhost:3000 -v 375x667

# With expected behavior context
pnpm llm-debug capture -u http://localhost:3000 --expected "Sidebar should be visible on desktop"

# Analyze existing report
pnpm llm-debug analyze -r src/test/debug-reports/my-report.json

# See all examples
pnpm llm-debug examples
```

### Using Captured Data with LLMs

1. **Automatic Prompt Generation**: The system generates LLM-ready prompts
2. **Copy-Paste Workflow**: Copy the generated JSON and prompt to your LLM chat
3. **Structured Analysis**: LLMs can analyze layout issues, CSS problems, performance bottlenecks

Example LLM prompt:
```
I'm debugging a Next.js application and have captured detailed UI state information using Playwright. 
The data includes element positions, computed styles, console logs, and network requests.

Please analyze this UI debug report and help me identify potential issues with:
1. Layout and positioning problems
2. CSS styling issues  
3. JavaScript errors or warnings
4. Network request failures
5. Performance bottlenecks
6. Accessibility concerns

[JSON data follows...]
```

## 📁 Project Structure

```
src/test/
├── setup.ts                 # Vitest setup with MSW
├── global-setup.ts          # Playwright global setup
├── global-teardown.ts       # Playwright global teardown
├── mocks/
│   ├── server.ts            # MSW server setup
│   └── handlers.ts          # API request handlers
├── utils/
│   ├── llm-debug-capture.ts # Core LLM debugging utility
│   ├── playwright-helpers.ts # Playwright test helpers
│   └── llm-debug-cli.ts     # CLI tool for manual debugging
├── unit/                    # Unit tests
├── integration/             # Integration tests
├── e2e/                     # End-to-end tests
└── debug-reports/           # Generated debug reports
```

## 🛠️ Configuration Files

### Vitest Configuration (`vitest.config.ts`)
- JSdom environment for React component testing
- Path aliases for clean imports
- Coverage reporting with v8 provider
- MSW integration via setup files

### Playwright Configuration (`playwright.config.ts`)
- Multi-browser testing (Chromium, Firefox, WebKit)
- Mobile device testing
- Automatic dev server startup
- Trace collection and video recording
- Headless by default (override with `--headed`)

## 🔧 MSW (Mock Service Worker) Setup

### Server Setup (`src/test/mocks/server.ts`)
```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Request Handlers (`src/test/mocks/handlers.ts`)
```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/flow', () => {
    return HttpResponse.json({
      nodes: [/* mock data */],
      edges: [/* mock data */]
    });
  }),
];
```

### Using Different Scenarios
```typescript
// In tests, override handlers for specific scenarios
server.use(
  http.get('/api/flow', () => {
    return HttpResponse.json(
      { error: 'Server Error' },
      { status: 500 }
    );
  })
);
```

## 📊 Advanced Features

### Responsive Testing with Debug Capture
```typescript
test('responsive layout analysis', async ({ page, debugCapture }) => {
  const viewports = [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 667, name: 'mobile' },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    
    await debugCapture.captureUIState({
      reportName: `responsive-${viewport.name}`,
      testContext: {
        expectedBehavior: `Layout should adapt to ${viewport.name}`,
      },
    });
  }
});
```

### Custom Assertions with Auto-Capture
```typescript
await expectWithCapture(
  page,
  async () => {
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
  },
  {
    reportName: 'sidebar-visibility-check',
    elementsOfInterest: ['[data-testid="sidebar"]', 'header', 'main'],
    expectedBehavior: 'Sidebar should be visible on desktop viewport',
  }
);
```

### Page Object Model with Debug Integration
```typescript
class DashboardPage extends PageWithDebugCapture {
  async navigateToSettings() {
    await this.page.click('[data-testid="settings-button"]');
    
    // Auto-capture state after navigation
    await this.captureCurrentState('after-settings-navigation', [
      '[data-testid="settings-panel"]',
      '[data-testid="settings-form"]'
    ]);
  }
}
```

## 🎯 Best Practices

### Test Organization
- Use descriptive test names that explain the expected behavior
- Group related tests in `describe` blocks
- Use `data-testid` attributes for reliable element selection
- Keep tests focused and independent

### MSW Usage
- Create reusable handler groups for different scenarios
- Reset handlers between tests to avoid interference
- Use realistic response data that matches your API
- Test both success and error scenarios

### LLM Debugging
- Capture UI state at meaningful points in user flows
- Include expected behavior context for better LLM analysis
- Focus on specific elements when debugging layout issues
- Use screenshots for visual debugging of complex layouts

### Performance
- Run unit tests in watch mode during development
- Use headless mode for CI/CD pipelines
- Limit element capture to relevant selectors for faster execution
- Use parallel test execution when possible

## 🚨 Troubleshooting

### Common Issues

**Vitest tests failing with module resolution errors:**
- Check path aliases in `vitest.config.ts`
- Ensure all imports use correct relative paths
- Verify MSW handlers are properly imported

**Playwright tests timing out:**
- Increase timeout values for slow operations
- Use `waitForLoadState('networkidle')` for dynamic content
- Check if elements exist before interacting with them

**MSW not intercepting requests:**
- Verify server is started in setup files
- Check handler URL patterns match actual requests
- Ensure handlers are reset between tests

**LLM debug capture failing:**
- Check file permissions for debug-reports directory
- Verify Playwright browser installation
- Ensure sufficient disk space for screenshots

### Debug Commands
```bash
# Debug Playwright tests
PWDEBUG=1 pnpm test:e2e

# Run single test file
pnpm test:e2e tests/login.spec.ts

# Generate Playwright test code
npx playwright codegen http://localhost:3000

# View test reports
npx playwright show-report
```

## 🔮 Future Enhancements

- **IDE Extension**: VS Code extension for one-click LLM analysis
- **AI Integration**: Direct API integration with LLM services
- **Visual Regression**: Automated visual diff detection
- **Performance Monitoring**: Continuous performance tracking
- **Accessibility Testing**: Automated a11y analysis with LLM insights

---

This testing setup provides a robust foundation for maintaining code quality while offering innovative debugging capabilities through LLM integration. The system grows with your application and provides valuable insights for both development and debugging workflows. 