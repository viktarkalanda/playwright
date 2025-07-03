import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

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
        return performance.getEntriesByType('resource').map(entry => ({
            name: entry.name,
            initiatorType: entry.initiatorType,
            startTime: entry.startTime,
            duration: entry.duration,
            transferSize: (entry as any).transferSize,
            encodedBodySize: (entry as any).encodedBodySize,
            decodedBodySize: (entry as any).decodedBodySize
        }));
    });

    // Collect Core Web Vitals
    const webVitals = await page.evaluate(() => {
        return {
            FCP: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
            LCP: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0,
            FID: performance.getEntriesByName('first-input-delay')[0]?.duration || 0,
            CLS: performance.getEntriesByName('cumulative-layout-shift')[0]?.value || 0,
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
 * Attaches a JSON object to the test report
 * 
 * This function formats and saves JSON data as part of the test artifacts,
 * making it available in the test report.
 * 
 * @param name - Name of the JSON attachment
 * @param obj - Object to attach
 * @returns void
 * 
 * @example
 * ```typescript
 * test('api response validation', async ({ request }) => {
 *   const response = await request.get('/api/data');
 *   const data = await response.json();
 *   
 *   attachJSON('API Response', {
 *     status: response.status(),
 *     headers: response.headers(),
 *     body: data
 *   });
 * });
 * ```
 */
export function attachJSON(name: string, obj: unknown): void {
    const reportsDir = path.join(process.cwd(), 'test-results', 'json');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}.json`;
    const filePath = path.join(reportsDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
    console.log(`Attached JSON: ${filePath}`);
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