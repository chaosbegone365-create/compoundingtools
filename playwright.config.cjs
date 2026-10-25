const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/browser',
  testMatch: '**/*.spec.cjs',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  outputDir: '.test-results',
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium', trace: 'off', screenshot: 'off', video: 'off' },
  projects: [
    { name: 'desktop-chromium', use: { viewport: { width: 1365, height: 900 } } },
    { name: 'mobile-chromium', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } }
  ],
  webServer: { command: 'node tests/browser/server.cjs', url: 'http://127.0.0.1:4173/', reuseExistingServer: false, timeout: 10000 }
});
