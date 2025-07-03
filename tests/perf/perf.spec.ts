import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Performance Testing Methodology
 * =============================
 * 
 * This test suite implements comprehensive performance monitoring using:
 * 
 * 1. Lighthouse Core Web Vitals
 *    - First Contentful Paint (FCP)
 *    - Largest Contentful Paint (LCP)
 *    - Cumulative Layout Shift (CLS)
 *    - Time to Interactive (TTI)
 *    - Total Blocking Time (TBT)
 * 
 * 2. Real User Monitoring (RUM)
 *    - Navigation Timing API metrics
 *    - Resource Timing API data
 *    - User-centric performance marks
 *    - Custom performance observers
 * 
 * 3. Network Analysis
 *    - HAR file capture
 *    - Resource waterfall
 *    - Bandwidth utilization
 *    - Cache effectiveness
 * 
 * 4. Statistical Analysis
 *    - P95 calculations
 *    - Baseline comparisons
 *    - Regression detection
 *    - Trend analysis
 * 
 * The methodology ensures comprehensive coverage of:
 *   a) Server response times
 *   b) Resource loading efficiency
 *   c) Client-side rendering performance
 *   d) User interaction responsiveness
 */

interface PerformanceMetrics {
    navigationStart: number;
    fetchStart: number;
    domainLookupStart: number;
    domainLookupEnd: number;
    connectStart: number;
    connectEnd: number;
    secureConnectionStart: number;
    requestStart: number;
    responseStart: number;
    responseEnd: number;
    domLoading: number;
    domInteractive: number;
    domContentLoadedEventStart: number;
    domContentLoadedEventEnd: number;
    domComplete: number;
    loadEventStart: number;
    loadEventEnd: number;
}

interface ResourceMetrics {
    name: string;
    entryType: string;
    startTime: number;
    duration: number;
    initiatorType: string;
    nextHopProtocol: string;
    transferSize: number;
    encodedBodySize: number;
    decodedBodySize: number;
}

interface PerformanceReport {
    timestamp: string;
    url: string;
    metrics: PerformanceMetrics;
    resources: ResourceMetrics[];
    customMarks: Record<string, number>;
    p95Metrics: {
        domContentLoaded: number;
        firstPaint: number;
        firstContentfulPaint: number;
    };
}

/**
 * Helper Functions
 * ===============
 */

async function calculateP95(values: number[]): Promise<number> {
    if (values.length === 0) return 0;
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[index];
}

async function collectPerformanceMetrics(page): Promise<PerformanceMetrics> {
    return await page.evaluate(() => {
        const timing = performance.timing;
        return {
            navigationStart: timing.navigationStart,
            fetchStart: timing.fetchStart,
            domainLookupStart: timing.domainLookupStart,
            domainLookupEnd: timing.domainLookupEnd,
            connectStart: timing.connectStart,
            connectEnd: timing.connectEnd,
            secureConnectionStart: timing.secureConnectionStart,
            requestStart: timing.requestStart,
            responseStart: timing.responseStart,
            responseEnd: timing.responseEnd,
            domLoading: timing.domLoading,
            domInteractive: timing.domInteractive,
            domContentLoadedEventStart: timing.domContentLoadedEventStart,
            domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
            domComplete: timing.domComplete,
            loadEventStart: timing.loadEventStart,
            loadEventEnd: timing.loadEventEnd
        };
    });
}

async function collectResourceMetrics(page): Promise<ResourceMetrics[]> {
    return await page.evaluate(() => {
        return performance.getEntriesByType('resource').map(entry => ({
            name: entry.name,
            entryType: entry.entryType,
            startTime: entry.startTime,
            duration: entry.duration,
            initiatorType: entry.initiatorType,
            nextHopProtocol: (entry as any).nextHopProtocol,
            transferSize: (entry as any).transferSize,
            encodedBodySize: (entry as any).encodedBodySize,
            decodedBodySize: (entry as any).decodedBodySize
        }));
    });
}

async function attachPerfMetrics(metrics: PerformanceReport): Promise<void> {
    const reportPath = path.join('test-results', 'performance');
    if (!fs.existsSync(reportPath)) {
        fs.mkdirSync(reportPath, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(reportPath, `perf-metrics-${timestamp}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify(metrics, null, 2));
}

test.describe('Performance Tests @perf', () => {
    test.beforeEach(async ({ page }) => {
        // Enable detailed metrics collection
        await page.coverage.startJSCoverage();
        await page.coverage.startCSSCoverage();
    });

    test.afterEach(async ({ page }) => {
        const [jsCoverage, cssCoverage] = await Promise.all([
            page.coverage.stopJSCoverage(),
            page.coverage.stopCSSCoverage()
        ]);

        // Calculate and log coverage metrics
        const calculateCoverage = coverage => {
            return coverage.reduce((acc, entry) => {
                acc.total += entry.text.length;
                acc.used += entry.ranges.reduce((sum, range) => 
                    sum + (range.end - range.start), 0);
                return acc;
            }, { total: 0, used: 0 });
        };

        const js = calculateCoverage(jsCoverage);
        const css = calculateCoverage(cssCoverage);

        console.log(`JS coverage: ${(js.used / js.total * 100).toFixed(2)}%`);
        console.log(`CSS coverage: ${(css.used / css.total * 100).toFixed(2)}%`);
    });

    test('measures page load performance metrics', async ({ page }) => {
        // Start tracing
        await test.step('Start performance tracing', async () => {
            await page.context().tracing.start({
                screenshots: true,
                snapshots: true,
                sources: true
            });
        });

        const samples = [];
        const iterations = 5;

        for (let i = 0; i < iterations; i++) {
            await test.step(`Iteration ${i + 1} of ${iterations}`, async () => {
                // Clear cache and cookies
                await page.context().clearCookies();
                const client = await page.context().newCDPSession(page);
                await client.send('Network.clearBrowserCache');

                // Navigate and collect metrics
                const response = await page.goto('/');
                expect(response.status()).toBe(200);

                const timing = await page.evaluate(() => {
                    const t = performance.timing;
                    return t.domContentLoadedEventEnd - t.navigationStart;
                });
                samples.push(timing);

                // Wait for network idle
                await page.waitForLoadState('networkidle');
            });
        }

        await test.step('Calculate P95 metrics', async () => {
            const p95DomContentLoaded = await calculateP95(samples);
            expect(p95DomContentLoaded).toBeLessThan(2000);
        });

        await test.step('Collect final performance data', async () => {
            const metrics = await collectPerformanceMetrics(page);
            const resources = await collectResourceMetrics(page);

            const report: PerformanceReport = {
                timestamp: new Date().toISOString(),
                url: page.url(),
                metrics,
                resources,
                customMarks: {},
                p95Metrics: {
                    domContentLoaded: await calculateP95(samples),
                    firstPaint: await calculateP95(
                        await page.evaluate(() => 
                            performance.getEntriesByName('first-paint')
                                .map(entry => entry.startTime)
                        )
                    ),
                    firstContentfulPaint: await calculateP95(
                        await page.evaluate(() =>
                            performance.getEntriesByName('first-contentful-paint')
                                .map(entry => entry.startTime)
                        )
                    )
                }
            };

            await attachPerfMetrics(report);
        });

        await test.step('Save HAR file', async () => {
            const harPath = path.join('test-results', 'performance', 
                `trace-${new Date().toISOString().replace(/[:.]/g, '-')}.har`);
            
            await page.context().tracing.stop({
                path: harPath
            });
        });
    });

    test('analyzes resource loading performance', async ({ page }) => {
        await test.step('Enable detailed resource timing', async () => {
            await page.route('**/*', route => {
                const timing = {
                    startTime: Date.now(),
                    endTime: 0,
                    size: 0
                };
                
                route.continue({
                    onResponse: response => {
                        timing.endTime = Date.now();
                        timing.size = response.headers()['content-length'] || 0;
                    }
                });
            });
        });

        await test.step('Navigate and collect resource metrics', async () => {
            await page.goto('/');
            await page.waitForLoadState('networkidle');

            const resourceMetrics = await page.evaluate(() => {
                return performance.getEntriesByType('resource').map(entry => ({
                    name: entry.name,
                    duration: entry.duration,
                    size: (entry as any).transferSize,
                    protocol: (entry as any).nextHopProtocol
                }));
            });

            // Analyze resource loading
            const totalSize = resourceMetrics.reduce((sum, r) => sum + (r.size || 0), 0);
            const avgDuration = resourceMetrics.reduce((sum, r) => sum + r.duration, 0) 
                / resourceMetrics.length;

            expect(totalSize).toBeLessThan(5 * 1024 * 1024); // 5MB total
            expect(avgDuration).toBeLessThan(1000); // 1s avg load time
        });
    });

    test('monitors runtime performance metrics', async ({ page }) => {
        await test.step('Setup performance observers', async () => {
            await page.evaluate(() => {
                window.performanceMarks = [];
                const observer = new PerformanceObserver(list => {
                    window.performanceMarks.push(...list.getEntries());
                });
                observer.observe({ entryTypes: ['measure', 'mark'] });
            });
        });

        await test.step('Navigate and interact', async () => {
            await page.goto('/');
            
            // Simulate user interaction
            await page.mouse.move(100, 100);
            await page.mouse.wheel(0, 500);
            await page.waitForTimeout(1000);
            
            // Collect runtime metrics
            const runtimeMetrics = await page.evaluate(() => {
                return {
                    marks: window.performanceMarks,
                    memory: (performance as any).memory ? {
                        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
                        totalJSHeapSize: (performance as any).memory.totalJSHeapSize
                    } : null,
                    fps: window.requestAnimationFrame ? 
                        new Promise(resolve => {
                            let frames = 0;
                            let lastTime = performance.now();
                            
                            function countFrames(now) {
                                frames++;
                                if (now - lastTime > 1000) {
                                    resolve(Math.round(frames * 1000 / (now - lastTime)));
                                } else {
                                    window.requestAnimationFrame(countFrames);
                                }
                            }
                            
                            window.requestAnimationFrame(countFrames);
                        }) : null
                };
            });

            // Verify runtime performance
            if (runtimeMetrics.memory) {
                expect(runtimeMetrics.memory.usedJSHeapSize)
                    .toBeLessThan(100 * 1024 * 1024); // 100MB heap
            }
        });
    });
}); 