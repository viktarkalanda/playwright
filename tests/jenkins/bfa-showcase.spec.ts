import { test, expect } from '@playwright/test';

/**
 * Jenkins BFA + Claim + Test Results Analyzer showcase suite.
 *
 * Create these Failure Causes in Jenkins UI (Failure Cause Management):
 *
 * | Name                      | Regex                                              | Categories        |
 * |---------------------------|----------------------------------------------------|-------------------|
 * | Demo intentional failure  | Intentional failure to verify Jenkins Claim and BFA plugins | demo claim   |
 * | Playwright timeout        | Timeout .* exceeded                                | playwright        |
 * | Application unavailable   | ECONNREFUSED                                       | infrastructure    |
 * | Assertion mismatch        | expect\(.*\)\.toBe                                 | test assertion    |
 * | Flaky retry detected      | Retry #\d+                                         | flaky playwright  |
 *
 * Do NOT create rules for these (BFA should report "no cause found"):
 * - Unknown infrastructure glitch XYZ-404
 * - Legacy schema mismatch error code LM-9912
 */

test.describe('Checkout smoke @jenkins-showcase', () => {
  test('calculates cart total correctly', async () => {
    expect(19.99 + 5.0).toBeCloseTo(24.99, 2);
  });

  test('fails with playwright timeout signature', async () => {
    throw new Error('Timeout 30000ms exceeded waiting for locator("#submit-order")');
  });
});

test.describe('Login smoke @jenkins-showcase', () => {
  test('accepts valid username format', async () => {
    expect('standard_user').toMatch(/^[a-z0-9_]+$/);
  });

  test('fails when application is unreachable', async () => {
    throw new Error('connect ECONNREFUSED 127.0.0.1:8080');
  });
});

test.describe('Claim integration @jenkins-showcase', () => {
  test('passes baseline health check', async () => {
    expect(true).toBeTruthy();
  });

  test('fails intentionally for Claim plugin demo', async () => {
    expect(false, 'Intentional failure to verify Jenkins Claim and BFA plugins').toBe(true);
  });
});

test.describe('Assertion failures @jenkins-showcase', () => {
  test('fails with assertion mismatch', async () => {
    expect(42).toBe(7);
  });
});

test.describe('Flaky signals @jenkins-showcase', () => {
  test('fails after retry signal appears in console log', async () => {
    console.log('Retry #2: re-running checkout payment step');
    expect(false, 'Payment step failed after retries').toBe(true);
  });
});

test.describe('Unknown failures @jenkins-showcase', () => {
  test('fails with unmatched infrastructure error', async () => {
    throw new Error('Unknown infrastructure glitch XYZ-404: widget alignment drift');
  });

  test('fails with unmatched legacy schema error', async () => {
    throw new Error('Legacy schema mismatch error code LM-9912');
  });
});
