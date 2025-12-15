import { TagExprNode, tag, and, or, not, toPlaywrightGrepPattern } from '../utils/tagExpression';

export type TestSuiteKey =
  | 'smoke'
  | 'regression'
  | 'checkout'
  | 'cart'
  | 'menu'
  | 'users'
  | 'health'
  | 'ux'
  | 'all';

export interface TestSuiteDefinition {
  key: TestSuiteKey;
  description: string;
  expression: TagExprNode;
  retries?: number;
}

export const testSuites: TestSuiteDefinition[] = [
  {
    key: 'smoke',
    description: 'Fast smoke scenarios covering main happy paths',
    expression: and(tag('@smoke'), not(tag('@flaky'))),
    retries: 0,
  },
  {
    key: 'regression',
    description: 'Full regression set minus explicitly excluded tests',
    expression: and(tag('@regression'), not(tag('@flaky'))),
    retries: 1,
  },
  {
    key: 'checkout',
    description: 'Checkout and cart related flows',
    expression: or(tag('@checkout'), tag('@cart')),
    retries: 0,
  },
  {
    key: 'cart',
    description: 'Cart focused tests and cart history integration',
    expression: tag('@cart'),
    retries: 0,
  },
  {
    key: 'menu',
    description: 'Header menu, about, logout, reset state',
    expression: tag('@menu'),
    retries: 0,
  },
  {
    key: 'users',
    description: 'User types behavior matrix',
    expression: tag('@users'),
    retries: 0,
  },
  {
    key: 'health',
    description: 'Console and network health checks',
    expression: tag('@health'),
    retries: 0,
  },
  {
    key: 'ux',
    description: 'UX texts, titles, labels, error messages',
    expression: tag('@ux'),
    retries: 0,
  },
  {
    key: 'all',
    description: 'All tests except explicitly excluded ones',
    expression: not(tag('@exclude')),
    retries: 0,
  },
];

export function getTestSuite(key: TestSuiteKey): TestSuiteDefinition {
  const suite = testSuites.find((s) => s.key === key);
  if (!suite) {
    throw new Error(`Test suite with key "${key}" not found`);
  }
  return suite;
}

export function buildGrepFromSuite(suite: TestSuiteDefinition): string {
  return toPlaywrightGrepPattern(suite.expression);
}

export interface PlaywrightCliArgs {
  grep?: string;
  retries?: number;
}

export function buildPlaywrightCliArgsForSuite(key: TestSuiteKey): PlaywrightCliArgs {
  const suite = getTestSuite(key);
  return {
    grep: buildGrepFromSuite(suite),
    retries: suite.retries,
  };
}

export interface ResolvedTestRunConfig {
  suite: TestSuiteDefinition;
  grep: string;
  retries: number;
}

export function resolveTestRunConfigFromEnv(env: { [key: string]: string | undefined }): ResolvedTestRunConfig {
  const suiteKey = (env.TEST_SUITE as TestSuiteKey | undefined) ?? 'all';
  const suite = getTestSuite(suiteKey);
  const { grep, retries } = buildPlaywrightCliArgsForSuite(suiteKey);
  return {
    suite,
    grep: grep ?? '',
    retries: retries ?? 0,
  };
}
