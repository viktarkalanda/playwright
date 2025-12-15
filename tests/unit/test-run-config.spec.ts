// tests/unit/test-run-config.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';
import {
  tag,
  and,
  or,
  not,
  parseTagExpression,
  toPlaywrightGrepPattern,
} from '../../src/utils/tagExpression';
import {
  getTestSuite,
  buildGrepFromSuite,
  buildPlaywrightCliArgsForSuite,
  resolveTestRunConfigFromEnv,
} from '../../src/config/testRunConfig';

test.describe('tagExpression utilities', () => {
  test('single tag expression generates simple pattern', {
    tag: ['@utils', '@tags'],
  }, async () => {
    const node = tag('@smoke');
    const pattern = toPlaywrightGrepPattern(node);
    expect(pattern).toContain('@smoke');
  });

  test('and expression combines both tags', {
    tag: ['@utils', '@tags'],
  }, async () => {
    const node = and(tag('@smoke'), tag('@checkout'));
    const pattern = toPlaywrightGrepPattern(node);
    expect(pattern).toContain('@smoke');
    expect(pattern).toContain('@checkout');
  });

  test('or expression generates alternation', {
    tag: ['@utils', '@tags'],
  }, async () => {
    const node = or(tag('@cart'), tag('@checkout'));
    const pattern = toPlaywrightGrepPattern(node);
    expect(pattern).toContain('@cart');
    expect(pattern).toContain('@checkout');
    expect(pattern).toContain('|');
  });

  test('not expression generates negative lookahead', {
    tag: ['@utils', '@tags'],
  }, async () => {
    const node = not(tag('@flaky'));
    const pattern = toPlaywrightGrepPattern(node);
    expect(pattern).toContain('@flaky');
    expect(pattern).toContain('?!');
  });

  test('parseTagExpression parses simple tag', {
    tag: ['@utils', '@tags'],
  }, async () => {
    const node = parseTagExpression('@smoke');
    expect(node.type).toBe('tag');
    expect((node as any).value).toBe('@smoke');
  });

  test('parseTagExpression parses simple AND expression', {
    tag: ['@utils', '@tags'],
  }, async () => {
    const node = parseTagExpression('@smoke && @checkout');
    expect(node.type).toBe('and');
  });

  test('parseTagExpression parses expression with NOT', {
    tag: ['@utils', '@tags'],
  }, async () => {
    const node = parseTagExpression('@smoke && !@flaky');
    expect(node.type).toBe('and');
    expect((node as any).right.type).toBe('not');
  });

  test('parseTagExpression parses expression with OR', {
    tag: ['@utils', '@tags'],
  }, async () => {
    const node = parseTagExpression('@smoke || @checkout');
    expect(node.type).toBe('or');
  });
});

test.describe('testRunConfig helpers', () => {
  test('getTestSuite returns suite by key', {
    tag: ['@config', '@runConfig'],
  }, async () => {
    const suite = getTestSuite('smoke');
    expect(suite.key).toBe('smoke');
    expect(suite.description.length).toBeGreaterThan(0);
  });

  test('buildGrepFromSuite returns a non-empty pattern', {
    tag: ['@config', '@runConfig'],
  }, async () => {
    const suite = getTestSuite('checkout');
    const pattern = buildGrepFromSuite(suite);
    expect(pattern.length).toBeGreaterThan(0);
    expect(pattern).toContain('@checkout');
  });

  test('buildPlaywrightCliArgsForSuite returns grep and retries', {
    tag: ['@config', '@runConfig'],
  }, async () => {
    const args = buildPlaywrightCliArgsForSuite('smoke');
    expect(typeof args.grep === 'string' && args.grep.length > 0).toBe(true);
    expect(args.retries).toBe(0);
  });

  test('resolveTestRunConfigFromEnv uses TEST_SUITE env variable', {
    tag: ['@config', '@runConfig'],
  }, async () => {
    const resolved = resolveTestRunConfigFromEnv({ TEST_SUITE: 'health' });
    expect(resolved.suite.key).toBe('health');
    expect(resolved.retries).toBe(0);
    expect(resolved.grep).toContain('@health');
  });

  test('resolveTestRunConfigFromEnv falls back to all suite if TEST_SUITE undefined', {
    tag: ['@config', '@runConfig'],
  }, async () => {
    const resolved = resolveTestRunConfigFromEnv({});
    expect(resolved.suite.key).toBe('all');
    expect(resolved.grep.length).toBeGreaterThan(0);
  });
});
