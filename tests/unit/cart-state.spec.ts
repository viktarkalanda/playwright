// tests/unit/cart-state.spec.ts
import { test, expect } from '../../src/saucedemo/fixtures/test-fixtures';
import {
  calculateSubtotal,
  roundToCents,
  toCartItemSnapshotFromDefinition,
  findProductDefinitionByName,
  CartItemSnapshot,
} from '../../src/utils/cartState';
import { productCatalog } from '../../src/data/products';

test.describe('calculateSubtotal', () => {
  test('sums unit price times quantity across items', {
    tag: ['@utils', '@cartState'],
  }, async () => {
    const items: CartItemSnapshot[] = [
      { name: 'A', unitPrice: 10, quantity: 2 },
      { name: 'B', unitPrice: 5, quantity: 3 },
    ];
    expect(calculateSubtotal(items)).toBe(35);
  });

  test('returns zero for an empty list', {
    tag: ['@utils', '@cartState'],
  }, async () => {
    expect(calculateSubtotal([])).toBe(0);
  });

  test('handles a single item with quantity one', {
    tag: ['@utils', '@cartState'],
  }, async () => {
    expect(calculateSubtotal([{ name: 'A', unitPrice: 29.99, quantity: 1 }])).toBe(29.99);
  });

  test('handles a zero unit price without affecting other items', {
    tag: ['@utils', '@cartState'],
  }, async () => {
    const items: CartItemSnapshot[] = [
      { name: 'Free', unitPrice: 0, quantity: 5 },
      { name: 'Paid', unitPrice: 4, quantity: 1 },
    ];
    expect(calculateSubtotal(items)).toBe(4);
  });
});

test.describe('roundToCents', () => {
  test('rounds a value with more than two decimal places', {
    tag: ['@utils', '@cartState'],
  }, async () => {
    expect(roundToCents(9.999)).toBe(10);
    expect(roundToCents(1.005)).toBeCloseTo(1.0, 2);
  });

  test('leaves a value already at cent precision unchanged', {
    tag: ['@utils', '@cartState'],
  }, async () => {
    expect(roundToCents(15.99)).toBe(15.99);
  });

  test('rounds half-cent values consistently with Math.round', {
    tag: ['@utils', '@cartState'],
  }, async () => {
    expect(roundToCents(2.345)).toBe(2.35);
  });

  test('handles zero and negative values', {
    tag: ['@utils', '@cartState'],
  }, async () => {
    expect(roundToCents(0)).toBe(0);
    expect(roundToCents(-3.456)).toBe(-3.46);
  });
});

test.describe('toCartItemSnapshotFromDefinition', () => {
  test('maps a product definition to a cart item snapshot with default quantity 1', {
    tag: ['@utils', '@cartState'],
  }, async () => {
    const product = productCatalog.getByName('Sauce Labs Backpack')!;
    const snapshot = toCartItemSnapshotFromDefinition(product);

    expect(snapshot).toEqual({
      name: 'Sauce Labs Backpack',
      unitPrice: product.price,
      quantity: 1,
    });
  });

  test('honors an explicit quantity argument', {
    tag: ['@utils', '@cartState'],
  }, async () => {
    const product = productCatalog.getByName('Sauce Labs Onesie')!;
    const snapshot = toCartItemSnapshotFromDefinition(product, 4);

    expect(snapshot.quantity).toBe(4);
    expect(snapshot.unitPrice).toBe(product.price);
  });
});

test.describe('findProductDefinitionByName', () => {
  test('returns the matching product definition for a known name', {
    tag: ['@utils', '@cartState'],
  }, async () => {
    const product = findProductDefinitionByName('Sauce Labs Bike Light');
    expect(product.id).toBe('sauce-labs-bike-light');
    expect(product.price).toBeGreaterThan(0);
  });

  test('throws a descriptive error for an unknown product name', {
    tag: ['@utils', '@cartState', '@negative'],
  }, async () => {
    expect(() => findProductDefinitionByName('Nonexistent Product')).toThrow(
      /Nonexistent Product/,
    );
  });

  test('composes with toCartItemSnapshotFromDefinition and calculateSubtotal', {
    tag: ['@utils', '@cartState'],
  }, async () => {
    const backpack = findProductDefinitionByName('Sauce Labs Backpack');
    const tShirt = findProductDefinitionByName('Sauce Labs Bolt T-Shirt');

    const items = [
      toCartItemSnapshotFromDefinition(backpack, 2),
      toCartItemSnapshotFromDefinition(tShirt, 1),
    ];

    const expectedSubtotal = roundToCents(backpack.price * 2 + tShirt.price);
    expect(roundToCents(calculateSubtotal(items))).toBe(expectedSubtotal);
  });
});
