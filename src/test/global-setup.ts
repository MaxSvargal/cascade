import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // You can add global setup logic here
  // For example, seeding test database, starting additional services, etc.
  
  console.log('🚀 Starting global test setup...');
  
  // Example: Warm up the application by visiting it once
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:3000');
    await page.waitForLoadState('networkidle');
    console.log('✅ Application warmed up successfully');
  } catch (error) {
    console.warn('⚠️ Could not warm up application:', error);
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global test setup completed');
}

export default globalSetup; 