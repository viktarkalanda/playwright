export type TestStatus = 'passed' | 'failed' | 'skipped' | 'flaky' | 'broken';

export interface FailureInfo {
  message: string;
  stack?: string;
  errorType?: string;
}

export interface TestResult {
  id: string;
  name: string;
  file: string;
  status: TestStatus;
  durationMs: number;
  retries: number;
  tags: string[];
  failure?: FailureInfo;
}

export interface SuiteRunMeta {
  suiteName: string;
  branch?: string;
  commit?: string;
  buildId?: string;
  startedAt?: string;
  finishedAt?: string;
  environment?: string;
}

export interface StatusCounts {
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  broken: number;
}

export interface DurationStats {
  totalDurationMs: number;
  averageDurationMs: number;
  maxDurationMs: number;
  minDurationMs: number;
}

export interface FailureCluster {
  key: string;
  messageSample: string;
  occurrences: number;
  testIds: string[];
}

export interface TagStats {
  tag: string;
  total: number;
  failed: number;
  passed: number;
}

export interface RunSummary {
  meta: SuiteRunMeta;
  results: TestResult[];
  statusCounts: StatusCounts;
  duration: DurationStats;
  passRate: number;
  tagStats: TagStats[];
  failureClusters: FailureCluster[];
}

export function emptyStatusCounts(): StatusCounts {
  return {
    passed: 0,
    failed: 0,
    skipped: 0,
    flaky: 0,
    broken: 0,
  };
}

export function emptyDurationStats(): DurationStats {
  return {
    totalDurationMs: 0,
    averageDurationMs: 0,
    maxDurationMs: 0,
    minDurationMs: 0,
  };
}

function normalizeMessage(message: string): string {
  return message.trim().slice(0, 200);
}

export interface BuildRunSummaryOptions {
  meta?: SuiteRunMeta;
  clusterFailuresBy?: 'message' | 'errorType';
  minClusterSize?: number;
}

export function buildRunSummary(
  results: TestResult[],
  options: BuildRunSummaryOptions = {},
): RunSummary {
  const meta: SuiteRunMeta = options.meta ?? { suiteName: 'unknown' };
  const statusCounts = emptyStatusCounts();
  const duration = emptyDurationStats();
  const tagAggregates: Record<string, TagStats> = {};

  let relevantCount = 0;

  for (const result of results) {
    statusCounts[result.status] = (statusCounts[result.status] ?? 0) + 1;

    duration.totalDurationMs += result.durationMs;
    duration.maxDurationMs = Math.max(duration.maxDurationMs, result.durationMs);
    duration.minDurationMs =
      duration.minDurationMs === 0
        ? result.durationMs
        : Math.min(duration.minDurationMs, result.durationMs);

    if (['passed', 'failed', 'flaky', 'broken'].includes(result.status)) {
      relevantCount += 1;
    }

    for (const tagName of result.tags) {
      const entry =
        tagAggregates[tagName] ??
        ({
          tag: tagName,
          total: 0,
          failed: 0,
          passed: 0,
        } as TagStats);
      entry.total += 1;
      if (result.status === 'passed') {
        entry.passed += 1;
      } else if (
        result.status === 'failed' ||
        result.status === 'broken' ||
        result.status === 'flaky'
      ) {
        entry.failed += 1;
      }
      tagAggregates[tagName] = entry;
    }
  }

  const totalTests = results.length;
  if (totalTests > 0) {
    duration.averageDurationMs = duration.totalDurationMs / totalTests;
  } else {
    duration.minDurationMs = 0;
    duration.maxDurationMs = 0;
  }

  const passRate =
    relevantCount === 0 ? 0 : (statusCounts.passed / relevantCount) * 100;

  const clusterOptions: BuildFailureClusterOptions = {
    clusterFailuresBy: options.clusterFailuresBy ?? 'message',
    minClusterSize: options.minClusterSize ?? 1,
  };

  return {
    meta,
    results,
    statusCounts,
    duration,
    passRate,
    tagStats: Object.values(tagAggregates).sort((a, b) => b.total - a.total),
    failureClusters: buildFailureClusters(results, clusterOptions),
  };
}


interface BuildFailureClusterOptions {
  clusterFailuresBy: 'message' | 'errorType';
  minClusterSize: number;
}

function buildFailureClusters(
  results: TestResult[],
  options: BuildFailureClusterOptions,
): FailureCluster[] {
  const clusters: Record<string, FailureCluster> = {};

  for (const result of results) {
    if (
      (result.status === 'failed' ||
        result.status === 'flaky' ||
        result.status === 'broken') &&
      result.failure
    ) {
      const key =
        options.clusterFailuresBy === 'errorType'
          ? result.failure.errorType ?? 'unknown'
          : normalizeMessage(result.failure.message || 'unknown');
      const messageSample = result.failure.message ?? 'unknown';
      const existing =
        clusters[key] ??
        ({
          key,
          messageSample,
          occurrences: 0,
          testIds: [],
        } as FailureCluster);
      existing.occurrences += 1;
      existing.testIds.push(result.id);
      clusters[key] = existing;
    }
  }

  return Object.values(clusters)
    .filter((cluster) => cluster.occurrences >= options.minClusterSize)
    .sort((a, b) => b.occurrences - a.occurrences);
}

export function filterResultsByTag(results: TestResult[], tagName: string): TestResult[] {
  return results.filter((result) => result.tags.includes(tagName));
}

export function filterResultsByStatus(results: TestResult[], status: TestStatus): TestResult[] {
  return results.filter((result) => result.status === status);
}

export function getSlowTests(results: TestResult[], thresholdMs: number): TestResult[] {
  return results.filter((result) => result.durationMs >= thresholdMs);
}

export function sortResultsByDurationDesc(results: TestResult[]): TestResult[] {
  return [...results].sort((a, b) => b.durationMs - a.durationMs);
}

export function sortResultsByName(results: TestResult[]): TestResult[] {
  return [...results].sort((a, b) => a.name.localeCompare(b.name));
}
