// tests/unit/routes.spec.ts
import { test, expect } from '../../src/saucedemo/fixtures/test-fixtures';
import { getRoute, buildUrl, routesConfig } from '../../src/data/routes';

test.describe('getRoute', () => {
  test('returns the route definition for a known key', {
    tag: ['@utils', '@routes'],
  }, async () => {
    const route = getRoute('inventory');
    expect(route.key).toBe('inventory');
    expect(route.path).toBe('/inventory.html');
  });

  test('root and login keys resolve to the same path', {
    tag: ['@utils', '@routes'],
  }, async () => {
    expect(getRoute('root').path).toBe(getRoute('login').path);
  });

  test('every route in routesConfig has a non-empty description', {
    tag: ['@utils', '@routes'],
  }, async () => {
    for (const route of Object.values(routesConfig.routes)) {
      expect(route.description.trim().length).toBeGreaterThan(0);
    }
  });

  test('every route path starts with a forward slash', {
    tag: ['@utils', '@routes'],
  }, async () => {
    for (const route of Object.values(routesConfig.routes)) {
      expect(route.path.startsWith('/')).toBe(true);
    }
  });

  test('route keys are internally consistent with their map key', {
    tag: ['@utils', '@routes'],
  }, async () => {
    for (const [mapKey, route] of Object.entries(routesConfig.routes)) {
      expect(route.key).toBe(mapKey);
    }
  });
});

test.describe('buildUrl', () => {
  test('combines the base URL with the route path', {
    tag: ['@utils', '@routes'],
  }, async () => {
    expect(buildUrl('cart')).toBe('https://www.saucedemo.com/cart.html');
  });

  test('root route builds a URL without a trailing double slash', {
    tag: ['@utils', '@routes'],
  }, async () => {
    expect(buildUrl('root')).toBe('https://www.saucedemo.com/');
  });

  test('every route key produces a URL starting with the configured base URL', {
    tag: ['@utils', '@routes'],
  }, async () => {
    const keys = Object.keys(routesConfig.routes) as (keyof typeof routesConfig.routes)[];
    for (const key of keys) {
      expect(buildUrl(key).startsWith(routesConfig.baseUrl)).toBe(true);
    }
  });

  test('checkout step URLs are distinct from each other', {
    tag: ['@utils', '@routes'],
  }, async () => {
    const stepOne = buildUrl('checkoutStepOne');
    const stepTwo = buildUrl('checkoutStepTwo');
    const complete = buildUrl('checkoutComplete');

    expect(new Set([stepOne, stepTwo, complete]).size).toBe(3);
  });
});
