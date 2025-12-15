// tests/unit/run-summary.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';
import {
  TestResult,
  buildRunSummary,
  filterResultsByTag,
  filterResultsByStatus,
  getSlowTests,
  sortResultsByDurationDesc,
  sortResultsByName,
} from '../../src/utils/runSummary';

function makeResult(partial: Partial<TestResult>): TestResult {
  return {
    id: partial.id ?? `id-${Math.random()}`,
    name: partial.name ?? 'test name',
    file: partial.file ?? 'tests/spec.ts',
    status: partial.status ?? 'passed',
    durationMs: partial.durationMs ?? 100,
    retries: partial.retries ?? 0,
    tags: partial.tags ?? [],
    failure: partial.failure,
  };
}

test.describe('runSummary aggregations', () => {
  test('buildRunSummary calculates status counts correctly', {
    tag: ['@runSummary', '@aggregate'],
  }, async () => {
    const results: TestResult[] = [
      makeResult({ status: 'passed' }),
      makeResult({ status: 'failed' }),
      makeResult({ status: 'skipped' }),
      makeResult({ status: 'flaky' }),
      makeResult({ status: 'broken' }),
    ];
    const summary = buildRunSummary(results);
    expect(summary.statusCounts).toEqual({
      passed: 1,
      failed: 1,
      skipped: 1,
      flaky: 1,
      broken: 1,
    });
  });

  test('buildRunSummary calculates duration stats correctly for non-empty list', {
    tag: ['@runSummary', '@aggregate'],
  }, async () => {
    const results: TestResult[] = [
      makeResult({ durationMs: 100 }),
      makeResult({ durationMs: 200 }),
      makeResult({ durationMs: 400 }),
    ];
    const summary = buildRunSummary(results);
    expect(summary.duration.totalDurationMs).toBe(700);
    expect(summary.duration.averageDurationMs).toBeCloseTo(233.33, 1);
    expect(summary.duration.minDurationMs).toBe(100);
    expect(summary.duration.maxDurationMs).toBe(400);
  });

  test('buildRunSummary returns zero durations for empty results', {
    tag: ['@runSummary', '@aggregate'],
  }, async () => {
    const summary = buildRunSummary([]);
    expect(summary.duration.totalDurationMs).toBe(0);
    expect(summary.duration.averageDurationMs).toBe(0);
    expect(summary.duration.minDurationMs).toBe(0);
    expect(summary.duration.maxDurationMs).toBe(0);
  });

  test('buildRunSummary calculates passRate based on relevant statuses', {
    tag: ['@runSummary', '@aggregate'],
  }, async () => {
    const results: TestResult[] = [
      makeResult({ status: 'passed' }),
      makeResult({ status: 'passed' }),
      makeResult({ status: 'failed' }),
      makeResult({ status: 'flaky' }),
      makeResult({ status: 'skipped' }),
      makeResult({ status: 'skipped' }),
    ];
    const summary = buildRunSummary(results);
    expect(summary.passRate).toBeCloseTo(50);
  });

  test('buildRunSummary builds tagStats aggregated per tag', {
    tag: ['@runSummary', '@tags'],
  }, async () => {
    const results: TestResult[] = [
      makeResult({ status: 'passed', tags: ['@smoke', '@checkout'] }),
      makeResult({ status: 'failed', tags: ['@smoke'] }),
      makeResult({ status: 'passed', tags: ['@regression'] }),
    ];
    const summary = buildRunSummary(results);
    const smokeStats = summary.tagStats.find((stat) => stat.tag === '@smoke');
    const checkoutStats = summary.tagStats.find((stat) => stat.tag === '@checkout');
    const regressionStats = summary.tagStats.find((stat) => stat.tag === '@regression');
    expect(smokeStats).toEqual({ tag: '@smoke', total: 2, failed: 1, passed: 1 });
    expect(checkoutStats).toEqual({ tag: '@checkout', total: 1, failed: 0, passed: 1 });
    expect(regressionStats).toEqual({ tag: '@regression', total: 1, failed: 0, passed: 1 });
  });

  test('failureClusters are grouped by message by default', {
    tag: ['@runSummary', '@failures'],
  }, async () => {
    const results: TestResult[] = [
      makeResult({ status: 'failed', failure: { message: 'Error: Timeout' } }),
      makeResult({ status: 'failed', failure: { message: 'Error: Timeout' } }),
      makeResult({ status: 'failed', failure: { message: 'Error: Network' } }),
    ];
    const summary = buildRunSummary(results);
    const timeoutCluster = summary.failureClusters.find((c) => c.messageSample.includes('Timeout'));
    const networkCluster = summary.failureClusters.find((c) => c.messageSample.includes('Network'));
    expect(timeoutCluster?.occurrences).toBe(2);
    expect(networkCluster?.occurrences).toBe(1);
  });

  test('failureClusters respect minClusterSize threshold', {
    tag: ['@runSummary', '@failures'],
  }, async () => {
    const results: TestResult[] = [
      makeResult({ status: 'failed', failure: { message: 'Timeout 1' } }),
      makeResult({ status: 'failed', failure: { message: 'Timeout 1' } }),
      makeResult({ status: 'failed', failure: { message: 'Network 1' } }),
    ];
    const summary = buildRunSummary(results, { minClusterSize: 2 });
    expect(summary.failureClusters.length).toBe(1);
    expect(summary.failureClusters[0].occurrences).toBe(2);
  });

  test('failureClusters can be grouped by errorType', {
    tag: ['@runSummary', '@failures'],
  }, async () => {
    const results: TestResult[] = [
      makeResult({ status: 'failed', failure: { message: 'm1', errorType: 'TimeoutError' } }),
      makeResult({ status: 'failed', failure: { message: 'm2', errorType: 'TimeoutError' } }),
      makeResult({ status: 'failed', failure: { message: 'm3', errorType: 'AssertionError' } }),
    ];
    const summary = buildRunSummary(results, { clusterFailuresBy: 'errorType' });
    const timeoutCluster = summary.failureClusters.find((c) => c.key === 'TimeoutError');
    const assertionCluster = summary.failureClusters.find((c) => c.key === 'AssertionError');
    expect(timeoutCluster?.occurrences).toBe(2);
    expect(assertionCluster?.occurrences).toBe(1);
  });

  test('filterResultsByTag returns only tests with given tag', {
    tag: ['@runSummary', '@filter'],
  }, async () => {
    const results: TestResult[] = [
      makeResult({ tags: ['@checkout'] }),
      makeResult({ tags: ['@smoke'] }),
      makeResult({ tags: ['@checkout', '@smoke'] }),
    ];
    const filtered = filterResultsByTag(results, '@checkout');
    expect(filtered.length).toBe(2);
    expect(filtered.every((r) => r.tags.includes('@checkout'))).toBe(true);
  });

  test('filterResultsByStatus returns only tests with given status', {
    tag: ['@runSummary', '@filter'],
  }, async () => {
    const results: TestResult[] = [
      makeResult({ status: 'passed' }),
      makeResult({ status: 'failed' }),
      makeResult({ status: 'failed' }),
    ];
    const filtered = filterResultsByStatus(results, 'failed');
    expect(filtered.length).toBe(2);
    expect(filtered.every((r) => r.status === 'failed')).toBe(true);
  });

  test('getSlowTests returns tests above or equal to threshold', {
    tag: ['@runSummary', '@filter'],
  }, async () => {
    const results: TestResult[] = [
      makeResult({ durationMs: 100 }),
      makeResult({ durationMs: 500 }),
      makeResult({ durationMs: 1000 }),
    ];
    const slow = getSlowTests(results, 500);
    expect(slow.map((r) => r.durationMs)).toEqual([500, 1000]);
  });

  test('sortResultsByDurationDesc returns sorted copy without mutating original', {
    tag: ['@runSummary', '@sort'],
  }, async () => {
    const results: TestResult[] = [
      makeResult({ durationMs: 200, name: 'test b' }),
      makeResult({ durationMs: 300, name: 'test c' }),
      makeResult({ durationMs: 100, name: 'test a' }),
    ];
    const originalOrder = results.map((r) => r.name);
    const sorted = sortResultsByDurationDesc(results);
    expect(sorted.map((r) => r.durationMs)).toEqual([300, 200, 100]);
    expect(results.map((r) => r.name)).toEqual(originalOrder);
  });

  test('sortResultsByName sorts alphabetically by name', {
    tag: ['@runSummary', '@sort'],
  }, async () => {
    const results: TestResult[] = [
      makeResult({ name: 'c test' }),
      makeResult({ name: 'a test' }),
      makeResult({ name: 'b test' }),
    ];
    const sorted = sortResultsByName(results);
    expect(sorted.map((r) => r.name)).toEqual(['a test', 'b test', 'c test']);
  });
});
