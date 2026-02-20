import { test as baseTest, TestType, TestInfo } from '@playwright/test';

/**
 * Theory of flaky reduction
 * 
 * Flaky tests are one of the most challenging aspects of end-to-end testing.
 * They undermine confidence in the test suite and waste developer time.
 * Here's a comprehensive approach to reducing flakiness:
 * 
 * 1. Root Cause Analysis
 *    - Race conditions: Ensure proper waiting for state changes
 *    - Network volatility: Implement request interception and mocking
 *    - Animation timing: Wait for animations to complete
 *    - Resource loading: Handle dynamic content loading
 *    - State isolation: Reset state between tests
 * 
 * 2. Implementation Strategies
 *    - Use explicit waits over implicit timeouts
 *    - Implement robust selectors (data-testid over CSS)
 *    - Mock external dependencies
 *    - Ensure test isolation
 *    - Monitor system resources
 * 
 * 3. Infrastructure Considerations
 *    - Stable test environment
 *    - Consistent browser versions
 *    - Resource allocation
 *    - Network conditions
 *    - CI/CD configuration
 * 
 * 4. Monitoring and Maintenance
 *    - Track flaky test patterns
 *    - Regular test maintenance
 *    - Automated flaky test detection
 *    - Historical success rate analysis
 *    - Continuous refinement
 */

/**
 * Interface for retry options
 */
interface RetryOptions {
    /**
     * Maximum number of retry attempts
     */
    maxRetries?: number;

    /**
     * Base delay in milliseconds for exponential backoff
     */
    baseDelay?: number;

    /**
     * Maximum delay in milliseconds
     */
    maxDelay?: number;

    /**
     * Whether to log retry attempts
     */
    verbose?: boolean;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
    maxRetries: 2,
    baseDelay: 1000,
    maxDelay: 3000,
    verbose: true
};

/**
 * Error class for test failures
 */
class TestFailureError extends Error {
    constructor(
        message: string,
        public readonly attempt: number,
        public readonly originalError: Error
    ) {
        super(message);
        this.name = 'TestFailureError';
    }
}

/**
 * Calculate exponential backoff delay
 * @param attempt - Current attempt number
 * @param options - Retry options
 * @returns Delay in milliseconds
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
    const exponentialDelay = options.baseDelay * Math.pow(2, attempt - 1);
    return Math.min(exponentialDelay, options.maxDelay);
}

/**
 * Sleep for specified duration
// Duplicate sleep function removed
 * Format error message for logging
 * @param error - Original error
 * @param attempt - Attempt number
 * @returns Formatted error message
 */
function formatErrorMessage(error: Error, attempt: number): string {
    return `Attempt ${attempt} failed: ${error.message}\n${error.stack || ''}`;
}

/**
 * Sleep for specified duration
 * @param ms Duration in milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format error details for logging
 * @param error Error object
 * @returns Formatted error string
 */
function formatError(error: Error): string {
    let message = error.message;
    
    // Extract useful information from common Playwright errors
    if (error.stack) {
        const stackLines = error.stack.split('\n');
        const relevantLines = stackLines
            .filter(line => 
                line.includes('playwright') || 
                line.includes('Error:') ||
                line.includes('expect')
            )
            .slice(0, 3);
        
        if (relevantLines.length > 0) {
            message += '\n\nRelevant stack trace:\n' + relevantLines.join('\n');
        }
    }
    
    return message;
}

/**
 * Log retry attempt details
 * @param attempt Current attempt number
 * @param error Error from the attempt
 * @param nextDelay Delay before next attempt
 */
function logRetryAttempt(attempt: number, error: Error, nextDelay: number): void {
    console.log('\n=== Flaky Test Retry ===');
    console.log(`Attempt ${attempt} failed`);
    console.log('\nFailure reason:');
    console.log(formatError(error));
    console.log(`\nRetrying in ${nextDelay / 1000} seconds...`);
    console.log('=====================\n');
}

/**
 * Calculate delay for current retry attempt
 * @param attempt Current attempt number
 * @returns Delay in milliseconds
 */
function getRetryDelay(attempt: number): number {
    // Fixed delays: 1s for first retry, 3s for second retry
    return attempt === 1 ? 1000 : 3000;
}

/**
 * Wraps a Playwright test function with retry logic
 * Implements exponential back-off with 1s and 3s delays
 * 
 * @param testFn Test function to wrap
 * @param retries Number of retry attempts (default: 2)
 * @returns Wrapped test function
 * 
 * @example
 * ```typescript
 * import { test, expect } from '@playwright/test';
 * import { withRetry } from '../utils';
 * 
 * // Basic usage - retries twice with 1s and 3s delays
 * test('flaky element test', withRetry(async ({ page }) => {
 *   await page.goto('/dynamic-page');
 *   
 *   // Wait for dynamic content
 *   await expect(page.locator('.dynamic-element')).toBeVisible();
 *   
 *   // Perform actions
 *   await page.click('.dynamic-element');
 *   await expect(page.locator('.result')).toHaveText('Success');
 * }));
 * 
 * // With custom retry count
 * test('complex async test', withRetry(async ({ page }) => {
 *   await page.goto('/async-page');
 *   
 *   // Multiple async operations
 *   await page.click('#load-data');
 *   await expect(page.locator('#status')).toHaveText('Loaded');
 *   
 *   await page.click('#process-data');
 *   await expect(page.locator('#result')).toContainText('Processed');
 * }, 3)); // Will retry up to 3 times
 * 
 * // In a describe block
 * test.describe('Flaky test group', () => {
 *   test('conditional rendering', withRetry(async ({ page }) => {
 *     await page.goto('/conditional-page');
 *     
 *     // Test conditional states
 *     await page.click('#toggle');
 *     await expect(page.locator('.hidden-element')).toBeVisible();
 *     
 *     await page.click('#toggle');
 *     await expect(page.locator('.hidden-element')).toBeHidden();
 *   }));
 * });
 * ```
 */
export function withRetry(
    testFn: (testArgs: any) => Promise<void>,
    retries: number = 2
): (testArgs: any) => Promise<void> {
    return async (testArgs: any) => {
        let lastError: Error | null = null;

        // Initial attempt + retries
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                await testFn(testArgs);
                
                // Log success if it was a retry
                if (attempt > 0) {
                    console.log(`\nPASSED: Test passed on attempt ${attempt + 1}\n`);
                }
                
                return;
            } catch (error: any) {
                lastError = error;
                
                // If we have more retries, log and wait
                if (attempt < retries) {
                    const nextDelay = attempt === 0 ? 1000 : 3000; // 1s for first retry, 3s for second
                    
                    // Log retry information
                    console.log('\n=== Flaky Test Retry ===');
                    console.log(`Attempt ${attempt + 1} failed`);
                    console.log('\nFailure reason:');
                    
                    // Format error message
                    let errorMessage = error.message;
                    if (error.stack) {
                        const stackLines = error.stack.split('\n')
                            .filter(line => 
                                line.includes('playwright') || 
                                line.includes('Error:') ||
                                line.includes('expect')
                            )
                            .slice(0, 3);
                        
                        if (stackLines.length > 0) {
                            errorMessage += '\n\nRelevant stack trace:\n' + stackLines.join('\n');
                        }
                    }
                    console.log(errorMessage);
                    
                    console.log(`\nRetrying in ${nextDelay / 1000} seconds...`);
                    console.log('=====================\n');
                    
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, nextDelay));
                }
            }
        }

        // If we get here, all attempts failed
        if (lastError) {
            console.log('\n=== Test Failed ===');
            console.log(`All ${retries} retry attempts exhausted`);
            console.log('\nLast error:');
            console.log(lastError.message);
            if (lastError.stack) {
                console.log('\nStack trace:');
                console.log(lastError.stack);
            }
            console.log('=================\n');
            
            throw lastError;
        }
    };
}

/**
 * Creates a test fixture with built-in retry support
 * @param defaultRetries Default number of retries
 * @returns TestType with retry capability
 * 
 * @example
 * ```typescript
 * import { expect } from '@playwright/test';
 * import { createFlakeTest } from '../utils';
 * 
 * // Create test fixture with 2 retries by default
 * const test = createFlakeTest(2);
 * 
 * test('flaky test', async ({ page }) => {
 *   await page.goto('/unstable-page');
 *   await expect(page.locator('#content')).toBeVisible();
 * });
 * ```
 */
export function createFlakeTest(defaultRetries: number = 2): TestType<any, any> {
    return baseTest.extend({
        test: async ({ test }, use) => {
            await use({
                ...test,
                retry: (fn: (testArgs: any) => Promise<void>) => withRetry(fn, defaultRetries)
            });
        }
    });
}

/**
 * Utility function to track flaky test occurrences
 * @param testInfo - Playwright TestInfo object
 */
export function trackFlakiness(testInfo: TestInfo): void {
    const retryCount = testInfo.retry;
    if (retryCount > 0) {
        console.log('\n=== Flaky Test Detection ===');
        console.log(`Test: ${testInfo.title}`);
        console.log(`File: ${testInfo.file}`);
        console.log(`Retry count: ${retryCount}`);
        console.log(`Duration: ${testInfo.duration}ms`);
        console.log('==========================\n');
    }
} 





