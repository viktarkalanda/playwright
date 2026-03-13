import { defineConfig, devices } from '@playwright/test';
import { TestConfig } from './src/config/testConfig';

const config = TestConfig.getInstance();

export default defineConfig({
  // Runs once before all tests: logs in and saves browser storage state.
  // Tests that exercise the login page must opt out with:
  //   test.use({ storageState: undefined })
  globalSetup: require.resolve('./tests/global-setup'),

  // Root directory for tests
  testDir: './tests',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if test.only is left in source
  forbidOnly: !!process.env.CI,

  // No retries — failures are investigated immediately.
  retries: 0,

  // On CI limit to 2 workers to avoid resource contention in Docker.
  // Locally: 4 workers for fast feedback.
  workers: process.env.CI ? 2 : 4,

  // Reporters: console + Allure always; HTML only locally (CI uses Allure Docker).
  // Text log path is configurable via LOG_FILE env var.
  reporter: [
    ['line'],
    ...(process.env.CI ? [] : [['html', { open: 'never' }] as const]),
    ['allure-playwright', { resultsDir: 'allure-results' }],
    ['./src/reporters/TextFileReporter.ts', { outputFile: process.env.LOG_FILE ?? 'logs/test-run.log' }],
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

    // Use the session saved by global-setup so tests skip the login UI.
    storageState: 'playwright/.auth/standard-user.json',

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

  // Browser projects configuration.
  // Locally: Chromium only for fast feedback.
  // On CI: all three browsers to catch cross-browser regressions.
  // To run Firefox/WebKit locally: npx playwright test --project=firefox
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
