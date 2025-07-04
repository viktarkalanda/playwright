import { test } from '@playwright/test';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const exec = promisify(execCallback);

/**
 * @fileoverview Smoke Gate Test Orchestrator
 * @package tests
 * @tag @gate
 * 
 * @Gate_Philosophy
 * The Smoke Gate serves as a critical quality control mechanism in our CI/CD pipeline.
 * It orchestrates the execution of key test suites in a specific order, ensuring that
 * fundamental system capabilities are operational before proceeding with deployment.
 * 
 * Core Principles:
 * 1. Fast Feedback
 *    - Early detection of critical failures
 *    - Rapid identification of regression issues
 *    - Immediate notification to development team
 * 
 * 2. Progressive Validation
 *    - Tests executed in order of dependency
 *    - Each suite builds confidence in system stability
 *    - Failures prevent unnecessary test execution
 * 
 * 3. Resource Optimization
 *    - Efficient use of CI/CD resources
 *    - Parallel execution where appropriate
 *    - Early termination on critical failures
 * 
 * 4. Clear Communication
 *    - Detailed failure reporting
 *    - Actionable error messages
 *    - Integration with notification systems
 * 
 * Test Suite Organization:
 * 1. @home - Homepage and Core Navigation
 *    - Basic site accessibility
 *    - Main navigation functionality
 *    - Search and filtering capabilities
 * 
 * 2. @product - Product Management
 *    - Product listing and details
 *    - Inventory management
 *    - Price and availability
 * 
 * 3. @cart - Shopping Cart
 *    - Add/remove items
 *    - Quantity updates
 *    - Price calculations
 * 
 * 4. @checkout - Checkout Process
 *    - Payment processing
 *    - Order submission
 *    - Confirmation handling
 * 
 * 5. @api - API Integration
 *    - Core API endpoints
 *    - Data consistency
 *    - Service integration
 * 
 * Example CI Output:
 * ```
 * [Gate] Starting Smoke Gate Tests
 * [Gate] Running @home suite...
 * [PASS] Homepage loads successfully (2s)
 * [PASS] Navigation menu works (1s)
 * [PASS] Search function operational (3s)
 * 
 * [Gate] Running @product suite...
 * [PASS] Product list loads (2s)
 * [PASS] Product details accessible (2s)
 * [PASS] Inventory status accurate (1s)
 * 
 * [Gate] Running @cart suite...
 * [PASS] Add to cart works (3s)
 * [PASS] Cart updates correctly (2s)
 * [PASS] Price calculations accurate (1s)
 * 
 * [Gate] Running @checkout suite...
 * [PASS] Checkout flow operational (4s)
 * [PASS] Payment processing works (3s)
 * [PASS] Order confirmation sent (2s)
 * 
 * [Gate] Running @api suite...
 * [PASS] Core APIs responding (1s)
 * [PASS] Data consistency verified (2s)
 * [PASS] Services integrated (1s)
 * 
 * [Gate] All smoke tests passed!
 * ```
 * 
 * Error Handling:
 * ```
 * [Gate] Running @home suite...
 * [PASS] Homepage loads successfully (2s)
 * [FAIL] Navigation menu works (1s)
 * Error: Navigation menu not responding
 * at NavigationTest.click (navigation.spec.ts:25:7)
 * 
 * [Gate] Critical failure in @home suite
 * [Gate] Aborting remaining tests
 * [Gate] Notifying team...
 * ```
 * 
 * @implementation_notes
 * The gate implementation follows these key patterns:
 * 1. Sequential Execution
 *    - Suites run in specific order
 *    - Each suite must pass to continue
 * 
 * 2. Error Management
 *    - Detailed error capture
 *    - Failure classification
 *    - Appropriate exit codes
 * 
 * 3. Reporting
 *    - Progress indication
 *    - Time tracking
 *    - Result summarization
 * 
 * 4. Resource Cleanup
 *    - Proper process termination
 *    - Resource deallocation
 *    - State cleanup between suites
 */

/**
 * Test suites to be executed in order
 * @constant {string[]}
 */
const suites = ['@home', '@product', '@cart', '@checkout', '@api'];

/**
 * Configuration for test execution
 * @constant {Object}
 */
const config = {
    maxRetries: 1,
    timeout: 30000,
    reporter: 'line'
};

/**
 * Represents the result of a test suite execution
 * @interface
 */
interface SuiteResult {
    tag: string;
    exitCode: number;
    output: string;
    duration: number;
}

/**
 * Executes a specific test suite
 * @param {string} tag - The test suite tag to run
 * @returns {Promise<SuiteResult>} The result of the suite execution
 */
async function runSubset(tag: string): Promise<SuiteResult> {
    const startTime = Date.now();
    
    try {
        console.log(`\n[Gate] Running ${tag} suite...`);
        
        const command = `npx playwright test -g "${tag}" --reporter=line`;
        const { stdout, stderr } = await exec(command);
        const exitCode = 0; // Success case
        
        const duration = Date.now() - startTime;
        return {
            tag,
            exitCode,
            output: stdout,
            duration
        };
    } catch (error: any) {
        const duration = Date.now() - startTime;
        return {
            tag,
            exitCode: error.code || 1,
            output: error.stderr || error.message,
            duration
        };
    }
}

/**
 * Formats the duration in a human-readable format
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
}

/**
 * Writes test results to a report file
 * @param {SuiteResult[]} results - Array of suite results
 */
async function writeReport(results: SuiteResult[]): Promise<void> {
    const reportDir = path.join(process.cwd(), 'test-results');
    const reportPath = path.join(reportDir, 'smoke-gate-report.txt');
    
    // Ensure directory exists
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const report = results.map(result => {
        const status = result.exitCode === 0 ? '[PASS]' : '[FAIL]';
        return `${status} ${result.tag} (${formatDuration(result.duration)})
Output:
${result.output}
`;
    }).join('\n');
    
    const summary = `
Smoke Gate Test Summary
----------------------
Total Suites: ${results.length}
Passed: ${results.filter(r => r.exitCode === 0).length}
Failed: ${results.filter(r => r.exitCode !== 0).length}
Total Duration: ${formatDuration(results.reduce((sum, r) => sum + r.duration, 0))}
`;
    
    await fs.promises.writeFile(reportPath, `${summary}\n${report}`);
}

/**
 * Main test orchestration
 * @tag @gate
 * 
 * @description
 * The main test orchestration function executes all test suites in sequence,
 * handling errors and generating reports. It follows these steps:
 * 
 * 1. Initialization
 *    - Set up reporting directory
 *    - Initialize results collection
 *    - Configure test environment
 * 
 * 2. Suite Execution
 *    - Run each suite in sequence
 *    - Capture execution metrics
 *    - Handle failures appropriately
 * 
 * 3. Reporting
 *    - Generate detailed reports
 *    - Format results for readability
 *    - Store artifacts for analysis
 * 
 * 4. Error Management
 *    - Capture and classify errors
 *    - Provide actionable feedback
 *    - Ensure proper cleanup
 * 
 * @example
 * Successful Execution:
 * ```
 * [Gate] Starting Smoke Gate Tests
 * [Gate] Running @home suite...
 * [Gate] @home completed successfully
 * [Gate] Running @product suite...
 * [Gate] @product completed successfully
 * [Gate] All suites passed
 * ```
 * 
 * Failed Execution:
 * ```
 * [Gate] Starting Smoke Gate Tests
 * [Gate] Running @home suite...
 * [Gate] Critical failure in @home suite
 * [Gate] Error: Navigation test failed
 * [Gate] Aborting remaining tests
 * ```
 */
test('Smoke Gate', async () => {
    console.log('[Gate] Starting Smoke Gate Tests');
    
    const results: SuiteResult[] = [];
    let hasError = false;
    
    try {
        for (const suite of suites) {
            console.log(`\n[Gate] Executing suite: ${suite}`);
            console.log('----------------------------------------');
            
            const result = await runSubset(suite);
            results.push(result);
            
            if (result.exitCode !== 0) {
                console.error(`\n[Gate] FAILED: Critical failure in ${suite} suite`);
                console.error('Error details:');
                console.error(result.output);
                console.error('\nStack trace:');
                console.error(new Error().stack);
                
                hasError = true;
                break;
            }
            
            console.log(`\n[Gate] PASSED: ${suite} completed successfully`);
            console.log(`Duration: ${formatDuration(result.duration)}`);
        }
        
        // Generate and write report
        await writeReport(results);
        
        if (hasError) {
            console.error('\n[Gate] ERROR: Smoke gate failed - critical errors detected');
            console.error('[Gate] Check the report for details');
            process.exit(1);
        } else {
            console.log('\n[Gate] SUCCESS: All smoke tests passed successfully!');
            console.log(`Total Duration: ${formatDuration(results.reduce((sum, r) => sum + r.duration, 0))}`);
        }
    } catch (error: any) {
        console.error('\n[Gate] ERROR: Unexpected error during test execution');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        
        // Attempt to write report even on unexpected error
        try {
            await writeReport(results);
        } catch (reportError) {
            console.error('[Gate] Failed to write report:', reportError);
        }
        
        process.exit(1);
    }
});

/**
 * Error Types and Handling
 * 
 * The smoke gate handles various types of errors:
 * 
 * 1. Test Failures
 *    - Failed assertions
 *    - Timeout errors
 *    - Navigation errors
 * 
 * 2. Infrastructure Issues
 *    - Network problems
 *    - Resource limitations
 *    - Environment configuration
 * 
 * 3. System Errors
 *    - Out of memory
 *    - Process crashes
 *    - File system issues
 * 
 * Error Response Strategy:
 * 1. Capture complete error context
 * 2. Log detailed error information
 * 3. Generate error report
 * 4. Clean up resources
 * 5. Exit with appropriate code
 * 
 * Example Error Handling:
 * ```typescript
 * try {
 *     await runTests();
 * } catch (error) {
 *     console.error('Test execution failed:', error);
 *     await cleanup();
 *     process.exit(1);
 * }
 * ```
 */

/**
 * Reporting Strategy
 * 
 * The smoke gate generates comprehensive reports including:
 * 
 * 1. Execution Summary
 *    - Total tests run
 *    - Pass/fail counts
 *    - Duration metrics
 * 
 * 2. Detailed Results
 *    - Individual test outcomes
 *    - Error messages
 *    - Stack traces
 * 
 * 3. Performance Metrics
 *    - Execution times
 *    - Resource usage
 *    - Bottlenecks
 * 
 * Report Format:
 * ```
 * Smoke Gate Report
 * ----------------
 * Date: 2024-03-14
 * Duration: 5m 30s
 * 
 * Results:
 * [PASS] @home (45s)
 * [PASS] @product (1m 15s)
 * [PASS] @cart (55s)
 * [PASS] @checkout (1m 30s)
 * [PASS] @api (35s)
 * 
 * Summary:
 * Total: 5 suites
 * Passed: 5
 * Failed: 0
 * ```
 */

 