// tests/unit/string-generators.spec.ts
import { test, expect } from '../../src/saucedemo/fixtures/test-fixtures';
import {
  repeatString,
  randomFromCharset,
  generateString,
  trimToMaxLength,
  edgeCaseStrings,
} from '../../src/utils/stringGenerators';

test.describe('repeatString', () => {
  test('repeats a pattern the requested number of times', {
    tag: ['@utils', '@stringGenerators'],
  }, async () => {
    expect(repeatString('ab', 3)).toBe('ababab');
  });

  test('returns an empty string when times is zero', {
    tag: ['@utils', '@stringGenerators'],
  }, async () => {
    expect(repeatString('x', 0)).toBe('');
  });

  test('supports multi-character patterns', {
    tag: ['@utils', '@stringGenerators'],
  }, async () => {
    expect(repeatString('foo-', 2)).toBe('foo-foo-');
  });
});

test.describe('randomFromCharset', () => {
  test('returns a string of the requested length', {
    tag: ['@utils', '@stringGenerators'],
  }, async () => {
    const result = randomFromCharset(12, 'abc');
    expect(result.length).toBe(12);
  });

  test('returns an empty string for length zero or negative', {
    tag: ['@utils', '@stringGenerators', '@negative'],
  }, async () => {
    expect(randomFromCharset(0, 'abc')).toBe('');
    expect(randomFromCharset(-5, 'abc')).toBe('');
  });

  test('only uses characters from the provided charset', {
    tag: ['@utils', '@stringGenerators'],
  }, async () => {
    const charset = 'xyz';
    const result = randomFromCharset(200, charset);
    expect([...result].every((ch) => charset.includes(ch))).toBe(true);
  });

  test('produces different output across calls (statistically)', {
    tag: ['@utils', '@stringGenerators'],
  }, async () => {
    const samples = new Set(Array.from({ length: 20 }, () => randomFromCharset(16, 'abcdefghijklmnopqrstuvwxyz')));
    expect(samples.size).toBeGreaterThan(1);
  });
});

test.describe('generateString', () => {
  test('latin category only produces letters', {
    tag: ['@utils', '@stringGenerators'],
  }, async () => {
    const result = generateString(50, 'latin');
    expect(result.length).toBe(50);
    expect(/^[a-zA-Z]+$/.test(result)).toBe(true);
  });

  test('digits category only produces digit characters', {
    tag: ['@utils', '@stringGenerators'],
  }, async () => {
    const result = generateString(50, 'digits');
    expect(/^[0-9]+$/.test(result)).toBe(true);
  });

  test('symbols category only produces symbol characters', {
    tag: ['@utils', '@stringGenerators'],
  }, async () => {
    const result = generateString(30, 'symbols');
    expect(/^[!@#$%^&*()_+\-=\[\]{};:'",.<>/?\\|`~]+$/.test(result)).toBe(true);
  });

  test('whitespace category returns a string of spaces at the requested length', {
    tag: ['@utils', '@stringGenerators'],
  }, async () => {
    const result = generateString(8, 'whitespace');
    expect(result).toBe(' '.repeat(8));
  });

  test('unicode category produces characters outside the basic Latin range', {
    tag: ['@utils', '@stringGenerators'],
  }, async () => {
    const result = generateString(10, 'unicode');
    expect(result.length).toBeGreaterThan(0);
    expect(/^[\x00-\x7F]*$/.test(result)).toBe(false);
  });

  test('defaults to mixed category when none is specified', {
    tag: ['@utils', '@stringGenerators'],
  }, async () => {
    const result = generateString(40);
    expect(result.length).toBe(40);
  });

  test('mixed category can include letters, digits, symbols and whitespace', {
    tag: ['@utils', '@stringGenerators'],
  }, async () => {
    const result = generateString(500, 'mixed');
    const hasLetter = /[a-zA-Z]/.test(result);
    const hasDigit = /[0-9]/.test(result);
    expect(hasLetter || hasDigit).toBe(true);
    expect(result.length).toBe(500);
  });
});

test.describe('trimToMaxLength', () => {
  test('leaves a string shorter than maxLength untouched', {
    tag: ['@utils', '@stringGenerators'],
  }, async () => {
    expect(trimToMaxLength('short', 20)).toBe('short');
  });

  test('truncates a string longer than maxLength', {
    tag: ['@utils', '@stringGenerators'],
  }, async () => {
    expect(trimToMaxLength('abcdefghij', 4)).toBe('abcd');
  });

  test('returns an empty string when maxLength is zero or negative', {
    tag: ['@utils', '@stringGenerators', '@negative'],
  }, async () => {
    expect(trimToMaxLength('abc', 0)).toBe('');
    expect(trimToMaxLength('abc', -1)).toBe('');
  });

  test('returns the exact string when length equals maxLength', {
    tag: ['@utils', '@stringGenerators'],
  }, async () => {
    expect(trimToMaxLength('exact', 5)).toBe('exact');
  });
});

test.describe('edgeCaseStrings', () => {
  test('static entries have the expected fixed values', {
    tag: ['@utils', '@stringGenerators'],
  }, async () => {
    expect(edgeCaseStrings.empty).toBe('');
    expect(edgeCaseStrings.singleSpace).toBe(' ');
    expect(edgeCaseStrings.multiSpace).toBe('     ');
  });

  test('dynamic entries regenerate a new value on each access', {
    tag: ['@utils', '@stringGenerators'],
  }, async () => {
    const first = edgeCaseStrings.longLatin;
    const second = edgeCaseStrings.longLatin;
    expect(first.length).toBe(256);
    expect(second.length).toBe(256);
    expect(first).not.toBe(second);
  });

  test('longDigits and specialSymbols have the documented lengths', {
    tag: ['@utils', '@stringGenerators'],
  }, async () => {
    expect(edgeCaseStrings.longDigits.length).toBe(256);
    expect(edgeCaseStrings.specialSymbols.length).toBe(64);
  });

  test('unicodeShort and unicodeLong have the documented lengths', {
    tag: ['@utils', '@stringGenerators'],
  }, async () => {
    expect(edgeCaseStrings.unicodeShort.length).toBeGreaterThan(0);
    expect(edgeCaseStrings.unicodeLong.length).toBeGreaterThan(edgeCaseStrings.unicodeShort.length);
  });
});
