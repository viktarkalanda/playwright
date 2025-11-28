import { defineConfig, devices } from '@playwright/test';
import { TestConfig } from './src/config/testConfig';

const config = TestConfig.getInstance();

export default defineConfig({
  // Root directory for tests
  testDir: './tests',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if test.only is left in source
  forbidOnly: !!process.env.CI,

  // Retry failed tests on CI
  retries: process.env.CI ? 2 : 0,

  // Disable parallel workers on CI (more stable)
  workers: process.env.CI ? 1 : undefined,

  // Reporters: console, HTML report, Allure
  reporter: [
    ['line'],
    ['html', { open: 'never' }],
    ['allure-playwright', { resultsDir: 'allure-results' }],
  ],

  // Global timeout for a single test (ms)
  // If a test runs longer than this, it will fail
  timeout: 30_000,

  // Default timeouts for Playwright expect(...)
  expect: {
    // Max time for expect(...) to wait for condition (ms)
    // Example: await expect(locator).toBeVisible();
    timeout: 5_000,
  },

  // Shared settings for all projects
  use: {
    // Base URL for page.goto('/') and similar
    baseURL: config.baseUrl,

    // Attribute used by getByTestId(), here it maps to data-test=""
    testIdAttribute: 'data-test',

    // Take screenshots only on test failure
    screenshot: 'only-on-failure',

    // Keep video only for failed tests
    video: 'retain-on-failure',

    // Record trace on first retry (useful for debugging flaky tests)
    trace: 'on-first-retry',

    // Max time for a single action (click, fill, etc.)
    actionTimeout: 10_000,

    // Max time for navigations (page.goto, page.waitForURL, etc.)
    navigationTimeout: 30_000,
  },

  // Browser projects configuration
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
