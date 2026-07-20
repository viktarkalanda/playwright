// tests/unit/sort-utils.spec.ts
import { test, expect } from '../../src/saucedemo/fixtures/test-fixtures';
import { isSortedStrings, isSortedNumbers, haveSameElementsIgnoreOrder } from '../../src/utils/sortUtils';

test.describe('isSortedStrings', () => {
  test('returns true for an ascending list', {
    tag: ['@utils', '@sortUtils'],
  }, async () => {
    expect(isSortedStrings(['apple', 'banana', 'cherry'])).toBe(true);
  });

  test('returns true for a descending list when direction is desc', {
    tag: ['@utils', '@sortUtils'],
  }, async () => {
    expect(isSortedStrings(['cherry', 'banana', 'apple'], 'desc')).toBe(true);
  });

  test('returns false for an ascending list checked against desc', {
    tag: ['@utils', '@sortUtils'],
  }, async () => {
    expect(isSortedStrings(['apple', 'banana', 'cherry'], 'desc')).toBe(false);
  });

  test('is case-insensitive when comparing values', {
    tag: ['@utils', '@sortUtils'],
  }, async () => {
    expect(isSortedStrings(['Apple', 'banana', 'Cherry'])).toBe(true);
  });

  test('treats an empty list as sorted', {
    tag: ['@utils', '@sortUtils'],
  }, async () => {
    expect(isSortedStrings([])).toBe(true);
  });

  test('treats a single-element list as sorted', {
    tag: ['@utils', '@sortUtils'],
  }, async () => {
    expect(isSortedStrings(['solo'])).toBe(true);
  });

  test('treats equal adjacent values as sorted in both directions', {
    tag: ['@utils', '@sortUtils'],
  }, async () => {
    expect(isSortedStrings(['same', 'same', 'same'], 'asc')).toBe(true);
    expect(isSortedStrings(['same', 'same', 'same'], 'desc')).toBe(true);
  });

  test('returns false when a single pair is out of order', {
    tag: ['@utils', '@sortUtils', '@negative'],
  }, async () => {
    expect(isSortedStrings(['apple', 'cherry', 'banana'])).toBe(false);
  });
});

test.describe('isSortedNumbers', () => {
  test('returns true for an ascending list', {
    tag: ['@utils', '@sortUtils'],
  }, async () => {
    expect(isSortedNumbers([1, 2, 3, 10])).toBe(true);
  });

  test('returns true for a descending list when direction is desc', {
    tag: ['@utils', '@sortUtils'],
  }, async () => {
    expect(isSortedNumbers([10, 3, 2, 1], 'desc')).toBe(true);
  });

  test('returns false for a descending list checked against asc', {
    tag: ['@utils', '@sortUtils', '@negative'],
  }, async () => {
    expect(isSortedNumbers([10, 3, 2, 1], 'asc')).toBe(false);
  });

  test('handles negative numbers correctly', {
    tag: ['@utils', '@sortUtils'],
  }, async () => {
    expect(isSortedNumbers([-5, -1, 0, 4])).toBe(true);
    expect(isSortedNumbers([4, -1, -5])).toBe(false);
  });

  test('treats an empty list and a single-element list as sorted', {
    tag: ['@utils', '@sortUtils'],
  }, async () => {
    expect(isSortedNumbers([])).toBe(true);
    expect(isSortedNumbers([42])).toBe(true);
  });

  test('treats repeated equal values as sorted in both directions', {
    tag: ['@utils', '@sortUtils'],
  }, async () => {
    expect(isSortedNumbers([5, 5, 5], 'asc')).toBe(true);
    expect(isSortedNumbers([5, 5, 5], 'desc')).toBe(true);
  });

  test('detects a single out-of-order pair in the middle of a long list', {
    tag: ['@utils', '@sortUtils', '@negative'],
  }, async () => {
    expect(isSortedNumbers([1, 2, 3, 2, 5])).toBe(false);
  });
});

test.describe('haveSameElementsIgnoreOrder', () => {
  test('returns true for two arrays with the same elements in different order', {
    tag: ['@utils', '@sortUtils'],
  }, async () => {
    expect(haveSameElementsIgnoreOrder(['a', 'b', 'c'], ['c', 'a', 'b'])).toBe(true);
  });

  test('returns true for two identical arrays', {
    tag: ['@utils', '@sortUtils'],
  }, async () => {
    expect(haveSameElementsIgnoreOrder([1, 2, 3], [1, 2, 3])).toBe(true);
  });

  test('returns false when arrays have different lengths', {
    tag: ['@utils', '@sortUtils', '@negative'],
  }, async () => {
    expect(haveSameElementsIgnoreOrder(['a', 'b'], ['a', 'b', 'c'])).toBe(false);
  });

  test('returns false when arrays have the same length but different elements', {
    tag: ['@utils', '@sortUtils', '@negative'],
  }, async () => {
    expect(haveSameElementsIgnoreOrder(['a', 'b', 'c'], ['a', 'b', 'd'])).toBe(false);
  });

  test('returns true for two empty arrays', {
    tag: ['@utils', '@sortUtils'],
  }, async () => {
    expect(haveSameElementsIgnoreOrder([], [])).toBe(true);
  });

  test('accounts for duplicate values, not just distinct sets', {
    tag: ['@utils', '@sortUtils', '@negative'],
  }, async () => {
    expect(haveSameElementsIgnoreOrder(['a', 'a', 'b'], ['a', 'b', 'b'])).toBe(false);
  });

  test('does not mutate the original input arrays', {
    tag: ['@utils', '@sortUtils'],
  }, async () => {
    const a = [3, 1, 2];
    const b = [2, 3, 1];
    haveSameElementsIgnoreOrder(a, b);
    expect(a).toEqual([3, 1, 2]);
    expect(b).toEqual([2, 3, 1]);
  });
});
