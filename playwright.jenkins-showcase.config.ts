import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/jenkins',
  testMatch: 'bfa-showcase.spec.ts',
  reporter: [
    ['line'],
    ['junit', { outputFile: 'test-results/jenkins-showcase/junit.xml' }],
  ],
});
