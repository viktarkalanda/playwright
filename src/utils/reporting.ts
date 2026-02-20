import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { allure } from 'allure-playwright';

/**
 * Performance Metrics Interface
 * Defines the structure of performance metrics collected during tests
 */
interface PerformanceMetrics {
    /**
     * Navigation timing metrics
     */
    navigation: {
        navigationStart: number;
        fetchStart: number;
        domainLookupStart: number;
        domainLookupEnd: number;
        connectStart: number;
        connectEnd: number;
        requestStart: number;
        responseStart: number;
        responseEnd: number;
        domInteractive: number;
        domContentLoadedEventStart: number;
        domContentLoadedEventEnd: number;
        domComplete: number;
        loadEventStart: number;
        loadEventEnd: number;
    };

    /**
     * Resource timing metrics
     */
    resources: Array<{
        name: string;
        initiatorType: string;
        startTime: number;
        duration: number;
        transferSize?: number;
        encodedBodySize?: number;
        decodedBodySize?: number;
    }>;

    /**
     * Core Web Vitals
     */
    webVitals: {
        FCP: number;  // First Contentful Paint
        LCP: number;  // Largest Contentful Paint
        FID: number;  // First Input Delay
        CLS: number;  // Cumulative Layout Shift
        TTFB: number; // Time to First Byte
    };

    /**
     * Custom performance marks and measures
     */
    marks: Record<string, number>;
    measures: Record<string, number>;
}

interface ResourceEntry extends PerformanceResourceTiming {
    initiatorType: string;
}

/**
 * Attaches performance metrics to the test report
 * 
 * This function collects and processes performance metrics from the page,
 * formats them for reporting, and attaches them to the test report.
 * 
 * @param page - Playwright Page object
 * @param metrics - Optional pre-collected metrics to include
 * @returns Promise<void>
 * 
 * @example
 * ```typescript
 * test('page performance', async ({ page }) => {
 *   await page.goto('/');
 *   await attachPerfMetrics(page, {
 *     custom: {
 *       applicationStart: performance.now()
 *     }
 *   });
 * });
 * ```
 * 
 * The function will:
 * 1. Collect navigation timing metrics
 * 2. Gather resource timing data
 * 3. Measure Core Web Vitals
 * 4. Include custom performance marks
 * 5. Generate a detailed performance report
 */
export async function attachPerfMetrics(
    page: Page,
    metrics?: Partial<PerformanceMetrics>
): Promise<void> {
    // Collect navigation timing metrics
    const navigationTiming = await page.evaluate(() => {
        const timing = performance.timing;
        return {
            navigationStart: timing.navigationStart,
            fetchStart: timing.fetchStart,
            domainLookupStart: timing.domainLookupStart,
            domainLookupEnd: timing.domainLookupEnd,
            connectStart: timing.connectStart,
            connectEnd: timing.connectEnd,
            requestStart: timing.requestStart,
            responseStart: timing.responseStart,
            responseEnd: timing.responseEnd,
            domInteractive: timing.domInteractive,
            domContentLoadedEventStart: timing.domContentLoadedEventStart,
            domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
            domComplete: timing.domComplete,
            loadEventStart: timing.loadEventStart,
            loadEventEnd: timing.loadEventEnd
        };
    });

    // Collect resource timing data
    const resourceTiming = await page.evaluate(() => {
        return performance.getEntriesByType('resource').map((entry) => {
            const resourceEntry = entry as PerformanceResourceTiming;
            return {
                name: resourceEntry.name,
                initiatorType: resourceEntry.initiatorType,
                startTime: resourceEntry.startTime,
                duration: resourceEntry.duration,
                transferSize: resourceEntry.transferSize,
                encodedBodySize: resourceEntry.encodedBodySize,
                decodedBodySize: resourceEntry.decodedBodySize
            };
        });
    });

    // Collect Core Web Vitals
    const webVitals = await page.evaluate(() => {
        const getLCP = () => {
            const entries = performance.getEntriesByType('largest-contentful-paint');
            if (entries.length === 0) return 0;
            const lastEntry = entries[entries.length - 1] as any;
            return lastEntry?.startTime || 0;
        };

        const getFID = () => {
            const entries = performance.getEntriesByType('first-input');
            if (entries.length === 0) return 0;
            const firstEntry = entries[0] as any;
            return firstEntry?.processingStart - firstEntry?.startTime || 0;
        };

        const getCLS = () => {
            let clsValue = 0;
            const entries = performance.getEntriesByType('layout-shift');
            for (const entry of entries) {
                const layoutShift = entry as any;
                if (!layoutShift.hadRecentInput) {
                    clsValue += layoutShift.value || 0;
                }
            }
            return clsValue;
        };

        return {
            FCP: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
            LCP: getLCP(),
            FID: getFID(),
            CLS: getCLS(),
            TTFB: performance.getEntriesByName('time-to-first-byte')[0]?.duration || 0
        };
    });

    // Combine all metrics
    const fullMetrics: PerformanceMetrics = {
        navigation: navigationTiming,
        resources: resourceTiming,
        webVitals,
        marks: {},
        measures: {},
        ...metrics
    };

    // Save metrics to file
    const reportsDir = path.join(process.cwd(), 'test-results', 'performance');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const metricsPath = path.join(reportsDir, `metrics-${timestamp}.json`);
    
    fs.writeFileSync(metricsPath, JSON.stringify(fullMetrics, null, 2));
    
    // Log summary to console
    console.log('Performance Metrics Summary:');
    console.log(`- First Contentful Paint: ${webVitals.FCP}ms`);
    console.log(`- Largest Contentful Paint: ${webVitals.LCP}ms`);
    console.log(`- First Input Delay: ${webVitals.FID}ms`);
    console.log(`- Cumulative Layout Shift: ${webVitals.CLS}`);
    console.log(`- Time to First Byte: ${webVitals.TTFB}ms`);
}

/**
 * Test Reporting Utilities
 * =======================
 * 
 * This module provides helper functions for test reporting and documentation.
 * It includes utilities for attaching various types of data to test reports,
 * particularly focusing on JSON data and screenshots.
 * 
 * Features:
 * --------
 * - JSON data attachment with formatting
 * - Screenshot capture and attachment
 * - Error evidence collection
 * - Test step documentation
 * 
 * Usage Examples:
 * -------------
 * ```typescript
 * // Attach JSON data
 * await attachJSON('API Response', {
 *   status: 200,
 *   data: { id: 1, name: 'Test' }
 * });
 * 
 * // Capture and attach screenshot
 * await attachScreenshot(page, 'Login Form');
 * 
 * // Document test steps with data
 * await test.step('Verify user profile', async () => {
 *   const userData = await getUserProfile();
 *   await attachJSON('User Profile', userData);
 * });
 * ```
 * 
 * Best Practices:
 * -------------
 * 1. Always provide descriptive names for attachments
 * 2. Include timestamps when relevant
 * 3. Format data for readability
 * 4. Capture context in error scenarios
 * 5. Use consistent naming conventions
 * 
 * @module reporting
 */

/**
 * Options for JSON attachment
 */
interface JSONAttachmentOptions {
  /** Custom timestamp format */
  timestamp?: boolean;
  /** Pretty print indentation level */
  indent?: number;
  /** Additional metadata to include */
  metadata?: Record<string, any>;
}

/**
 * Options for screenshot attachment
 */
interface ScreenshotOptions {
  /** Whether to hide all fixed position elements */
  hideFixed?: boolean;
  /** Whether to capture full page */
  fullPage?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Additional screenshot options */
  customOptions?: {
    quality?: number;
    scale?: 'css' | 'device';
    animations?: 'disabled' | 'allow';
  };
}

/**
 * Attaches formatted JSON data to the test report
 * 
 * @param name - Descriptive name for the attachment
 * @param obj - Object to attach
 * @param options - Attachment options
 * 
 * @example
 * ```typescript
 * // Basic usage
 * await attachJSON('API Response', {
 *   id: 123,
 *   status: 'success'
 * });
 * 
 * // With options
 * await attachJSON('User Data', userData, {
 *   timestamp: true,
 *   indent: 2,
 *   metadata: {
 *     environment: 'staging',
 *     testId: 'USER-001'
 *   }
 * });
 * ```
 */
export async function attachJSON(
  name: string,
  obj: any,
  options: JSONAttachmentOptions = {}
): Promise<void> {
  const {
    timestamp = true,
    indent = 2,
    metadata = {}
  } = options;

  // Prepare data with optional metadata
  const data = {
    ...(timestamp ? { timestamp: new Date().toISOString() } : {}),
    ...metadata,
    data: obj
  };

  try {
    // Format and attach the data
    const formattedData = JSON.stringify(data, null, indent);
    
    // Log to console for debugging
    console.log(`[ATTACH] Attaching JSON: ${name}`);
    console.log(formattedData);

    // Attach to Allure report
    await allure.attachment(
      name,
      formattedData,
      'application/json'
    );
  } catch (error) {
    console.error(`Failed to attach JSON ${name}:`, error);
    
    // Attach error information
    await allure.attachment(
      `${name} (Attachment Error)`,
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        originalData: obj
      }, null, 2),
      'application/json'
    );
  }
}

/**
 * Captures and attaches a screenshot to the test report
 * 
 * @param page - Playwright Page object
 * @param name - Descriptive name for the screenshot
 * @param options - Screenshot options
 * 
 * @example
 * ```typescript
 * // Basic screenshot
 * await attachScreenshot(page, 'Login Form');
 * 
 * // Full page screenshot with options
 * await attachScreenshot(page, 'Product Catalog', {
 *   fullPage: true,
 *   hideFixed: true,
 *   customOptions: {
 *     quality: 90,
 *     animations: 'disabled'
 *   }
 * });
 * ```
 */
export async function attachScreenshot(
  page: Page,
  name: string,
  options: ScreenshotOptions = {}
): Promise<void> {
  const {
    hideFixed = false,
    fullPage = false,
    timeout = 5000,
    customOptions = {}
  } = options;

  try {
    // Prepare screenshot options
    const screenshotOptions = {
      fullPage,
      timeout,
      ...customOptions
    };

    // Hide fixed elements if requested
    if (hideFixed) {
      await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        for (const element of elements) {
          const position = window.getComputedStyle(element).position;
          if (position === 'fixed') {
            (element as HTMLElement).style.visibility = 'hidden';
          }
        }
      });
    }

    // Capture screenshot
    console.log(`[SCREEN] Capturing screenshot: ${name}`);
    const buffer = await page.screenshot(screenshotOptions);

    // Restore fixed elements
    if (hideFixed) {
      await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        for (const element of elements) {
          const position = window.getComputedStyle(element).position;
          if (position === 'fixed') {
            (element as HTMLElement).style.visibility = '';
          }
        }
      });
    }

    // Attach to Allure report
    await allure.attachment(name, buffer, 'image/png');
  } catch (error) {
    console.error(`Failed to capture screenshot ${name}:`, error);
    
    // Attach error information
    await allure.attachment(
      `${name} (Screenshot Error)`,
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        options: options
      }, null, 2),
      'application/json'
    );

    // Try to capture basic screenshot on error
    try {
      const buffer = await page.screenshot();
      await allure.attachment(
        `${name} (Fallback)`,
        buffer,
        'image/png'
      );
    } catch {
      console.error('Failed to capture fallback screenshot');
    }
  }
}

/**
 * Attaches a HAR file to the test report
 * 
 * This function processes and attaches a HAR (HTTP Archive) file to the test report,
 * providing detailed network request/response information.
 * 
 * @param harPath - Path to the HAR file
 * @returns Promise<void>
 * 
 * @example
 * ```typescript
 * test('network analysis', async ({ context }) => {
 *   // Start HAR recording
 *   await context.tracing.start({ path: 'trace.har' });
 *   
 *   // Perform test actions
 *   await page.goto('/');
 *   await page.click('#submit');
 *   
 *   // Stop recording and attach HAR
 *   await context.tracing.stop();
 *   await attachHar('trace.har');
 * });
 * ```
 */
export async function attachHar(harPath: string): Promise<void> {
    if (!fs.existsSync(harPath)) {
        throw new Error(`HAR file not found: ${harPath}`);
    }

    const harContent = fs.readFileSync(harPath, 'utf8');
    const har = JSON.parse(harContent);

    // Process HAR data
    const summary = {
        totalRequests: har.log.entries.length,
        totalTransferSize: har.log.entries.reduce((sum, entry) => 
            sum + (entry.response.bodySize || 0), 0),
        requestsByType: har.log.entries.reduce((acc, entry) => {
            const type = entry.response.content.mimeType.split(';')[0].split('/')[0];
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
        responseStats: {
            '2xx': 0,
            '3xx': 0,
            '4xx': 0,
            '5xx': 0
        }
    };

    // Calculate response code statistics
    har.log.entries.forEach(entry => {
        const status = Math.floor(entry.response.status / 100);
        const key = `${status}xx` as keyof typeof summary.responseStats;
        if (key in summary.responseStats) {
            summary.responseStats[key]++;
        }
    });

    // Save processed HAR and summary
    const reportsDir = path.join(process.cwd(), 'test-results', 'network');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const harCopyPath = path.join(reportsDir, `trace-${timestamp}.har`);
    const summaryPath = path.join(reportsDir, `har-summary-${timestamp}.json`);

    fs.copyFileSync(harPath, harCopyPath);
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    // Log summary
    console.log('HAR Analysis Summary:');
    console.log(`- Total Requests: ${summary.totalRequests}`);
    console.log(`- Total Transfer Size: ${Math.round(summary.totalTransferSize / 1024)}KB`);
    console.log('- Requests by Type:', summary.requestsByType);
    console.log('- Response Codes:', summary.responseStats);
} 