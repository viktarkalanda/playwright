import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/jenkins',
  reporter: [
    ['line'],
    ['junit', { outputFile: 'test-results/jenkins-demo/junit.xml' }],
  ],
});
