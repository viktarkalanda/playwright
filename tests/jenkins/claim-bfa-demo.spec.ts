import { test, expect } from '@playwright/test';

test.describe('Jenkins Claim/BFA demo @jenkins-demo', () => {
  test('passes for baseline', async () => {
    expect(1 + 1).toBe(2);
  });

  test('fails intentionally for Claim/BFA demo', async () => {
    expect(false, 'Intentional failure to verify Jenkins Claim and BFA plugins').toBe(true);
  });
});
