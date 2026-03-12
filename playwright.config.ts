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

  // No retries — flaky tests should be fixed, not hidden
  retries: 0,

  // 4 workers everywhere for faster runs
  workers: 4,

  // Reporters: console, HTML report, Allure
  reporter: [
    ['line'],
    ['html', { open: 'never' }],
    ['allure-playwright', { resultsDir: 'allure-results' }],
    ['./src/reporters/TextFileReporter.ts', { outputFile: 'logs/test-run.log' }],
  ],

  // Global timeout for a single test (ms).
  // 30 s accommodates both the fast SauceDemo mock and the live demoblaze.com
  // second-shop tests, while still catching genuinely hung tests.
  timeout: 20_000,

  // Default timeouts for Playwright expect(...)
  expect: {
    timeout: 5_000,
  },

  // Shared settings for all projects
  use: {
    // Base URL for page.goto('/') and similar
    baseURL: config.baseUrl,

    // Attribute used by getByTestId(), here it maps to data-test=""
    testIdAttribute: 'data-test',

    // Take screenshots only on test failure
    screenshot: process.env.DOCKER ? 'off' : 'only-on-failure',

    // Disable video recording (locally and in Docker) to save resources
    video: 'off',

    // Disable trace recording in Docker to save resources
    trace: process.env.DOCKER ? 'off' : 'on-first-retry',

    // Max time for a single action (click, fill, etc.)
    actionTimeout: 5_000,

    // Max time for navigations (page.goto, page.waitForURL, etc.)
    navigationTimeout: 10_000,
  },

  // Browser projects configuration
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
