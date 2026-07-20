// tests/unit/random-utils.spec.ts
import { test, expect } from '../../src/saucedemo/fixtures/test-fixtures';
import { randomInt, shuffle, pickRandomSubset, range } from '../../src/utils/random';

test.describe('randomInt', () => {
  test('returns a value within the inclusive bounds', {
    tag: ['@utils', '@random'],
  }, async () => {
    for (let i = 0; i < 50; i += 1) {
      const value = randomInt(1, 5);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(5);
    }
  });

  test('returns the only possible value when min equals max', {
    tag: ['@utils', '@random'],
  }, async () => {
    expect(randomInt(7, 7)).toBe(7);
  });

  test('throws when max is less than min', {
    tag: ['@utils', '@random', '@negative'],
  }, async () => {
    expect(() => randomInt(10, 5)).toThrow();
  });

  test('supports negative ranges', {
    tag: ['@utils', '@random'],
  }, async () => {
    for (let i = 0; i < 20; i += 1) {
      const value = randomInt(-10, -5);
      expect(value).toBeGreaterThanOrEqual(-10);
      expect(value).toBeLessThanOrEqual(-5);
    }
  });
});

test.describe('shuffle', () => {
  test('returns an array with the same length as the input', {
    tag: ['@utils', '@random'],
  }, async () => {
    const input = [1, 2, 3, 4, 5];
    expect(shuffle(input).length).toBe(input.length);
  });

  test('returns an array containing exactly the same elements', {
    tag: ['@utils', '@random'],
  }, async () => {
    const input = ['a', 'b', 'c', 'd'];
    const shuffled = shuffle(input);
    expect([...shuffled].sort()).toEqual([...input].sort());
  });

  test('does not mutate the original array', {
    tag: ['@utils', '@random'],
  }, async () => {
    const input = [1, 2, 3];
    shuffle(input);
    expect(input).toEqual([1, 2, 3]);
  });

  test('handles an empty array without error', {
    tag: ['@utils', '@random'],
  }, async () => {
    expect(shuffle([])).toEqual([]);
  });

  test('handles a single-element array', {
    tag: ['@utils', '@random'],
  }, async () => {
    expect(shuffle(['only'])).toEqual(['only']);
  });

  test('produces varied orderings across repeated calls (statistically)', {
    tag: ['@utils', '@random'],
  }, async () => {
    const input = Array.from({ length: 10 }, (_, i) => i);
    const orderings = new Set(
      Array.from({ length: 15 }, () => shuffle(input).join(',')),
    );
    expect(orderings.size).toBeGreaterThan(1);
  });
});

test.describe('pickRandomSubset', () => {
  test('returns a subset of the requested size', {
    tag: ['@utils', '@random'],
  }, async () => {
    const input = [1, 2, 3, 4, 5];
    expect(pickRandomSubset(input, 3).length).toBe(3);
  });

  test('returns only elements present in the original array', {
    tag: ['@utils', '@random'],
  }, async () => {
    const input = ['a', 'b', 'c', 'd', 'e'];
    const subset = pickRandomSubset(input, 3);
    expect(subset.every((item) => input.includes(item))).toBe(true);
  });

  test('returns an empty array when count is zero', {
    tag: ['@utils', '@random'],
  }, async () => {
    expect(pickRandomSubset([1, 2, 3], 0)).toEqual([]);
  });

  test('returns all elements when count equals array length', {
    tag: ['@utils', '@random'],
  }, async () => {
    const input = [1, 2, 3];
    expect([...pickRandomSubset(input, 3)].sort()).toEqual([1, 2, 3]);
  });

  test('throws when count is negative', {
    tag: ['@utils', '@random', '@negative'],
  }, async () => {
    expect(() => pickRandomSubset([1, 2, 3], -1)).toThrow();
  });

  test('throws when count exceeds array length', {
    tag: ['@utils', '@random', '@negative'],
  }, async () => {
    expect(() => pickRandomSubset([1, 2], 5)).toThrow();
  });

  test('does not return duplicate elements from a unique input array', {
    tag: ['@utils', '@random'],
  }, async () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const subset = pickRandomSubset(input, 5);
    expect(new Set(subset).size).toBe(subset.length);
  });
});

test.describe('range', () => {
  test('generates a sequence from fromInclusive to toExclusive', {
    tag: ['@utils', '@random'],
  }, async () => {
    expect(range(0, 5)).toEqual([0, 1, 2, 3, 4]);
  });

  test('returns an empty array when from equals to', {
    tag: ['@utils', '@random'],
  }, async () => {
    expect(range(3, 3)).toEqual([]);
  });

  test('supports negative starting points', {
    tag: ['@utils', '@random'],
  }, async () => {
    expect(range(-3, 2)).toEqual([-3, -2, -1, 0, 1]);
  });

  test('throws when toExclusive is less than fromInclusive', {
    tag: ['@utils', '@random', '@negative'],
  }, async () => {
    expect(() => range(5, 2)).toThrow();
  });
});
