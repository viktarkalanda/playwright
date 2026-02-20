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

  // Allow some parallelism on CI; 2 workers keeps resource usage low while
  // avoiding fully-serial execution across ~300+ tests.
  workers: process.env.CI ? 2 : undefined,

  // Reporters: console, HTML report, Allure
  reporter: [
    ['line'],
    ['html', { open: 'never' }],
    ['allure-playwright', { resultsDir: 'allure-results' }],
  ],

  // Global timeout for a single test (ms).
  // 30 s accommodates both the fast SauceDemo mock and the live demoblaze.com
  // second-shop tests, while still catching genuinely hung tests.
  timeout: 30_000,

  // Default timeouts for Playwright expect(...)
  expect: {
    // Max time for expect(...) to wait for condition (ms)
    // Example: await expect(locator).toBeVisible();
    timeout: 8_000,
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
    actionTimeout: 8_000,

    // Max time for navigations (page.goto, page.waitForURL, etc.)
    // 15 s is necessary for demoblaze.com which can be slow on cold requests.
    navigationTimeout: 15_000,
  },

  // Browser projects configuration
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
