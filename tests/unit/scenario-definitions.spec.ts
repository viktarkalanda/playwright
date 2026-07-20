// tests/unit/scenario-definitions.spec.ts
import { test, expect } from '../../src/saucedemo/fixtures/test-fixtures';
import { scenarios, getScenarioById } from '../../src/utils/scenarioDefinitions';

test.describe('getScenarioById', () => {
  test('returns the matching scenario for a known id', {
    tag: ['@utils', '@scenarioDefinitions'],
  }, async () => {
    const scenario = getScenarioById('login_logout_cycle');
    expect(scenario.name).toBe('Login/logout cycle');
    expect(scenario.steps.length).toBeGreaterThan(0);
  });

  test('throws a descriptive error for an unknown id', {
    tag: ['@utils', '@scenarioDefinitions', '@negative'],
  }, async () => {
    expect(() => getScenarioById('does_not_exist')).toThrow(/does_not_exist/);
  });
});

test.describe('scenarios catalog integrity', () => {
  test('every scenario has a unique id', {
    tag: ['@utils', '@scenarioDefinitions'],
  }, async () => {
    const ids = scenarios.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every scenario has at least one step', {
    tag: ['@utils', '@scenarioDefinitions'],
  }, async () => {
    for (const scenario of scenarios) {
      expect(scenario.steps.length).toBeGreaterThan(0);
    }
  });

  test('every scenario has at least one tag and all tags start with @', {
    tag: ['@utils', '@scenarioDefinitions'],
  }, async () => {
    for (const scenario of scenarios) {
      expect(scenario.tags.length).toBeGreaterThan(0);
      for (const t of scenario.tags) {
        expect(t.startsWith('@')).toBe(true);
      }
    }
  });

  test('every scenario is tagged with @scenario for grep-based selection', {
    tag: ['@utils', '@scenarioDefinitions'],
  }, async () => {
    for (const scenario of scenarios) {
      expect(scenario.tags).toContain('@scenario');
    }
  });

  test('checkout scenarios end with verifyCheckoutComplete before any trailing logout', {
    tag: ['@utils', '@scenarioDefinitions'],
  }, async () => {
    const checkoutScenarios = scenarios.filter((s) => s.tags.includes('@checkout'));
    expect(checkoutScenarios.length).toBeGreaterThan(0);

    for (const scenario of checkoutScenarios) {
      const types = scenario.steps.map((step) => step.type);
      const verifyIndex = types.indexOf('verifyCheckoutComplete');
      expect(verifyIndex).toBeGreaterThan(-1);

      const logoutIndex = types.indexOf('logout');
      if (logoutIndex > -1) {
        expect(logoutIndex).toBeGreaterThan(verifyIndex);
      }
    }
  });

  test('every login step references a non-empty user key', {
    tag: ['@utils', '@scenarioDefinitions'],
  }, async () => {
    for (const scenario of scenarios) {
      for (const step of scenario.steps) {
        if (step.type === 'login') {
          expect(step.user.length).toBeGreaterThan(0);
        }
      }
    }
  });

  test('every scenario id is a non-empty lowercase snake_case string', {
    tag: ['@utils', '@scenarioDefinitions'],
  }, async () => {
    for (const scenario of scenarios) {
      expect(scenario.id).toMatch(/^[a-z0-9]+(_[a-z0-9]+)*$/);
    }
  });

  test('every scenario has a non-empty display name distinct from its id', {
    tag: ['@utils', '@scenarioDefinitions'],
  }, async () => {
    for (const scenario of scenarios) {
      expect(scenario.name.trim().length).toBeGreaterThan(0);
      expect(scenario.name).not.toBe(scenario.id);
    }
  });

  test('a scenario that opens the cart does so before starting checkout', {
    tag: ['@utils', '@scenarioDefinitions'],
  }, async () => {
    for (const scenario of scenarios) {
      const types = scenario.steps.map((step) => step.type);
      const openCartIndex = types.indexOf('openCart');
      const startCheckoutIndex = types.indexOf('startCheckout');
      if (openCartIndex > -1 && startCheckoutIndex > -1) {
        expect(openCartIndex).toBeLessThan(startCheckoutIndex);
      }
    }
  });
});
