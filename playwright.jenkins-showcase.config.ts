import { defineConfig } from '@playwright/test';

/**
 * Lightweight config for Jenkins BFA / auto-triage demo.
 * No browser, no globalSetup — only throws/assertions for fast UNSTABLE builds.
 */
export default defineConfig({
  testDir: 'tests/jenkins',
  testMatch: 'bfa-showcase.spec.ts',
  retries: 0,
  workers: 1,
  reporter: [
    ['line'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
});
