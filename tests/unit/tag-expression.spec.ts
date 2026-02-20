// tests/unit/tag-expression.spec.ts
//
// Unit tests for the tag expression DSL used to build Playwright --grep patterns.
// Covers node factories, pattern generation, De Morgan's law (the not() fix), and parsing.

import { test, expect } from '@playwright/test';
import {
  tag,
  and,
  or,
  not,
  toPlaywrightGrepPattern,
  parseTagExpression,
  type TagExprNode,
} from '../../src/utils/tagExpression';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function matches(pattern: string, input: string): boolean {
  return new RegExp(pattern).test(input);
}

function grepMatches(node: TagExprNode, input: string): boolean {
  return matches(toPlaywrightGrepPattern(node), input);
}

// ---------------------------------------------------------------------------
// node factory functions
// ---------------------------------------------------------------------------

test.describe('tag() factory', () => {
  test('creates a tag node with the given value', () => {
    const node = tag('@smoke');
    expect(node.type).toBe('tag');
    expect(node.value).toBe('@smoke');
  });

  test('preserves special characters in the tag value', () => {
    const node = tag('@auth-guard');
    expect(node.value).toBe('@auth-guard');
  });
});

test.describe('and() factory', () => {
  test('creates an AND node with correct children', () => {
    const node = and(tag('@smoke'), tag('@auth'));
    expect(node.type).toBe('and');
    expect(node.left).toEqual(tag('@smoke'));
    expect(node.right).toEqual(tag('@auth'));
  });
});

test.describe('or() factory', () => {
  test('creates an OR node with correct children', () => {
    const node = or(tag('@smoke'), tag('@cart'));
    expect(node.type).toBe('or');
    expect(node.left).toEqual(tag('@smoke'));
    expect(node.right).toEqual(tag('@cart'));
  });
});

test.describe('not() factory', () => {
  test('creates a NOT node wrapping a tag', () => {
    const node = not(tag('@slow'));
    expect(node.type).toBe('not');
    expect(node.child).toEqual(tag('@slow'));
  });

  test('creates a nested NOT node', () => {
    const node = not(not(tag('@smoke')));
    expect(node.type).toBe('not');
    expect(node.child.type).toBe('not');
  });
});

// ---------------------------------------------------------------------------
// toPlaywrightGrepPattern — single tag
// ---------------------------------------------------------------------------

test.describe('toPlaywrightGrepPattern — single tag', () => {
  test('matches a string that contains the tag', () => {
    const pattern = toPlaywrightGrepPattern(tag('@smoke'));
    expect(matches(pattern, 'login test @smoke')).toBe(true);
  });

  test('does not match a string that lacks the tag', () => {
    const pattern = toPlaywrightGrepPattern(tag('@smoke'));
    expect(matches(pattern, 'login test @auth')).toBe(false);
  });

  test('matches when tag appears anywhere in the string', () => {
    const pattern = toPlaywrightGrepPattern(tag('@e2e'));
    expect(matches(pattern, '@e2e checkout full flow')).toBe(true);
    expect(matches(pattern, 'checkout @e2e full flow')).toBe(true);
    expect(matches(pattern, 'checkout full flow @e2e')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// toPlaywrightGrepPattern — AND
// ---------------------------------------------------------------------------

test.describe('toPlaywrightGrepPattern — AND', () => {
  const node = and(tag('@smoke'), tag('@auth'));

  test('matches when both tags are present', () => {
    expect(grepMatches(node, 'test @smoke @auth')).toBe(true);
    expect(grepMatches(node, 'test @auth @smoke @other')).toBe(true);
  });

  test('does not match when only the left tag is present', () => {
    expect(grepMatches(node, 'test @smoke only')).toBe(false);
  });

  test('does not match when only the right tag is present', () => {
    expect(grepMatches(node, 'test @auth only')).toBe(false);
  });

  test('does not match when neither tag is present', () => {
    expect(grepMatches(node, 'test @cart @checkout')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// toPlaywrightGrepPattern — OR
// ---------------------------------------------------------------------------

test.describe('toPlaywrightGrepPattern — OR', () => {
  const node = or(tag('@smoke'), tag('@auth'));

  test('matches when left tag is present', () => {
    expect(grepMatches(node, 'test @smoke')).toBe(true);
  });

  test('matches when right tag is present', () => {
    expect(grepMatches(node, 'test @auth')).toBe(true);
  });

  test('matches when both tags are present', () => {
    expect(grepMatches(node, 'test @smoke @auth')).toBe(true);
  });

  test('does not match when neither tag is present', () => {
    expect(grepMatches(node, 'test @cart')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// toPlaywrightGrepPattern — NOT (base case)
// ---------------------------------------------------------------------------

test.describe('toPlaywrightGrepPattern — NOT (tag)', () => {
  const node = not(tag('@slow'));

  test('matches when the negated tag is absent', () => {
    expect(grepMatches(node, 'test @smoke @auth')).toBe(true);
  });

  test('does not match when the negated tag is present', () => {
    expect(grepMatches(node, 'test @slow @auth')).toBe(false);
  });

  test('matches an empty string (no tags present)', () => {
    expect(grepMatches(node, 'plain test description')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// toPlaywrightGrepPattern — NOT (double negation)
// ---------------------------------------------------------------------------

test.describe('toPlaywrightGrepPattern — double NOT', () => {
  // not(not(@smoke)) === @smoke
  const node = not(not(tag('@smoke')));

  test('matches when the tag is present (double negation = positive)', () => {
    expect(grepMatches(node, 'test @smoke checkout')).toBe(true);
  });

  test('does not match when the tag is absent', () => {
    expect(grepMatches(node, 'test @auth checkout')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// toPlaywrightGrepPattern — NOT of AND  (De Morgan's law)
// ---------------------------------------------------------------------------

test.describe('toPlaywrightGrepPattern — NOT of AND (De Morgan)', () => {
  // not(A and B) === not(A) or not(B)
  // i.e. at least one of the two tags must be absent
  const node = not(and(tag('@smoke'), tag('@auth')));

  test('matches when NEITHER tag is present', () => {
    expect(grepMatches(node, 'test @cart @checkout')).toBe(true);
  });

  test('matches when only the left tag is present (right is absent)', () => {
    expect(grepMatches(node, 'test @smoke @cart')).toBe(true);
  });

  test('matches when only the right tag is present (left is absent)', () => {
    expect(grepMatches(node, 'test @auth @cart')).toBe(true);
  });

  test('does NOT match when BOTH tags are present', () => {
    // Both A and B present → the AND holds → NOT(AND) is false
    expect(grepMatches(node, 'test @smoke @auth @cart')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// toPlaywrightGrepPattern — NOT of OR  (De Morgan's law)
// ---------------------------------------------------------------------------

test.describe('toPlaywrightGrepPattern — NOT of OR (De Morgan)', () => {
  // not(A or B) === not(A) and not(B)
  // i.e. BOTH tags must be absent
  const node = not(or(tag('@smoke'), tag('@auth')));

  test('matches when NEITHER tag is present', () => {
    expect(grepMatches(node, 'test @cart @checkout')).toBe(true);
  });

  test('does NOT match when only the left tag is present', () => {
    expect(grepMatches(node, 'test @smoke @cart')).toBe(false);
  });

  test('does NOT match when only the right tag is present', () => {
    expect(grepMatches(node, 'test @auth @cart')).toBe(false);
  });

  test('does NOT match when both tags are present', () => {
    expect(grepMatches(node, 'test @smoke @auth')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// toPlaywrightGrepPattern — complex / nested
// ---------------------------------------------------------------------------

test.describe('toPlaywrightGrepPattern — complex expressions', () => {
  test('(A and B) or C — matches A+B, matches C, not only A', () => {
    const node = or(and(tag('@smoke'), tag('@auth')), tag('@e2e'));
    expect(grepMatches(node, 'test @smoke @auth')).toBe(true);
    expect(grepMatches(node, 'test @e2e only')).toBe(true);
    expect(grepMatches(node, 'test @smoke only')).toBe(false);
  });

  test('A and (B or C) — matches A+B, matches A+C, not only B', () => {
    const node = and(tag('@smoke'), or(tag('@auth'), tag('@cart')));
    expect(grepMatches(node, 'test @smoke @auth')).toBe(true);
    expect(grepMatches(node, 'test @smoke @cart')).toBe(true);
    expect(grepMatches(node, 'test @auth @cart')).toBe(false);
  });

  test('not(not(A)) and B — behaves like A and B', () => {
    const node = and(not(not(tag('@smoke'))), tag('@auth'));
    expect(grepMatches(node, 'test @smoke @auth')).toBe(true);
    expect(grepMatches(node, 'test @smoke only')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseTagExpression
// ---------------------------------------------------------------------------

test.describe('parseTagExpression', () => {
  test('parses a single tag', () => {
    const node = parseTagExpression('@smoke');
    expect(node).toEqual(tag('@smoke'));
  });

  test('parses a negated tag with ! prefix', () => {
    const node = parseTagExpression('!@slow');
    expect(node.type).toBe('not');
  });

  test('parses AND of two tags', () => {
    const node = parseTagExpression('@smoke && @auth');
    expect(node.type).toBe('and');
  });

  test('parses OR of two tags', () => {
    const node = parseTagExpression('@smoke || @cart');
    expect(node.type).toBe('or');
  });

  test('parsed AND expression matches correctly', () => {
    const node = parseTagExpression('@smoke && @auth');
    expect(grepMatches(node, 'test @smoke @auth @cart')).toBe(true);
    expect(grepMatches(node, 'test @smoke only')).toBe(false);
  });

  test('parsed OR expression matches correctly', () => {
    const node = parseTagExpression('@smoke || @auth');
    expect(grepMatches(node, 'test @smoke only')).toBe(true);
    expect(grepMatches(node, 'test @auth only')).toBe(true);
    expect(grepMatches(node, 'test @cart only')).toBe(false);
  });

  test('parsed NOT expression matches correctly', () => {
    const node = parseTagExpression('!@slow');
    expect(grepMatches(node, 'test @smoke @auth')).toBe(true);
    expect(grepMatches(node, 'test @slow @auth')).toBe(false);
  });

  test('parsed chain A && B && C matches all three', () => {
    const node = parseTagExpression('@smoke && @auth && @cart');
    expect(grepMatches(node, '@smoke @auth @cart test')).toBe(true);
    expect(grepMatches(node, '@smoke @auth test')).toBe(false);
  });

  test('throws on empty input', () => {
    expect(() => parseTagExpression('')).toThrow();
  });

  test('throws on trailing operator', () => {
    expect(() => parseTagExpression('@smoke &&')).toThrow();
  });
});
