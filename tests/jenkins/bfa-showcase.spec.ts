import { test, expect } from '@playwright/test';

/**
 * Jenkins BFA auto-triage showcase — no browser, intentional failures only.
 *
 * Tag: @jenkins-showcase — run ONLY these tests:
 *   npx playwright test --grep @jenkins-showcase
 *   npm run test:jenkins-showcase:grep
 *
 * Or via showcase config (same file, no full suite):
 *   npm run test:jenkins-showcase
 *
 * Jenkins: TEST_SCOPE = showcase
 *
 * BFA Failure Causes (Failure Cause Management) — regex must match error text:
 *
 * | Name                     | Regex (use .* around pattern for find())        |
 * |--------------------------|-------------------------------------------------|
 * | Demo intentional failure | .*Intentional failure to verify Jenkins.*       |
 * | Playwright timeout       | .*Timeout .* exceeded.*                         |
 * | Application unavailable  | .*ECONNREFUSED.*                                |
 * | Assertion mismatch       | .*expect\(.*\)\.toBe.*                          |
 * | Flaky retry detected     | .*Retry #\d+.*                                  |
 *
 * No BFA rule (should stay unclaimed / to investigate):
 * - Unknown infrastructure glitch XYZ-404
 * - Legacy schema mismatch error code LM-9912
 */

test.describe('Checkout smoke', { tag: '@jenkins-showcase' }, () => {
  test('test calculates cart total correctly', async () => {
    expect(19.99 + 5.0).toBeCloseTo(24.99, 2);
  });

  test('test fails on playwright timeout signature', async () => {
    throw new Error('Timeout 30000ms exceeded waiting for locator("#submit-order")');
  });
});

test.describe('Login smoke', { tag: '@jenkins-showcase' }, () => {
  test('test validates username format', async () => {
    expect('standard_user').toMatch(/^[a-z0-9_]+$/);
  });

  test('test fails when application is unreachable', async () => {
    throw new Error('connect ECONNREFUSED 127.0.0.1:8080');
  });
});

test.describe('Claim integration', { tag: '@jenkins-showcase' }, () => {
  test('test passes baseline health check', async () => {
    expect(true).toBeTruthy();
  });

  test('test fails intentionally for Claim plugin demo', async () => {
    expect(false, 'Intentional failure to verify Jenkins Claim and BFA plugins').toBe(true);
  });
});

test.describe('Assertion failures', { tag: '@jenkins-showcase' }, () => {
  test('test fails on assertion mismatch', async () => {
    expect(42).toBe(7);
  });
});

test.describe('Flaky signals', { tag: '@jenkins-showcase' }, () => {
  test('test fails after retry signal in error text', async () => {
    throw new Error('Retry #2: Payment step failed after retries');
  });
});

test.describe('Unknown failures', { tag: '@jenkins-showcase' }, () => {
  test('test fails with unmatched infrastructure error', async () => {
    throw new Error('Unknown infrastructure glitch XYZ-404: widget alignment drift');
  });

  test('test fails with unmatched legacy schema error', async () => {
    throw new Error('Legacy schema mismatch error code LM-9912');
  });
});
