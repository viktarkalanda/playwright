import { test, expect } from '@playwright/test';

test.describe('Jenkins Claim/BFA demo @jenkins-demo', () => {
  test('test passes for baseline', async () => {
    expect(1 + 1).toBe(2);
  });

  test('test fails intentionally for Claim and BFA demo', async () => {
    expect(false, 'Intentional failure to verify Jenkins Claim and BFA plugins').toBe(true);
  });
});
