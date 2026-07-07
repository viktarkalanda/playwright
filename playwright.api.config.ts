import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/api',
  retries: 1,
  reporter: [
    ['line'],
    ['junit', { outputFile: 'test-results/api/junit.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'api', use: { browserName: 'chromium' } }
  ]
});
