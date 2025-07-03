import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Accessibility Testing Suite - WCAG 2.1 & axe-core
 * ==============================================
 * 
 * This test suite implements automated accessibility testing following:
 * 
 * WCAG 2.1 Guidelines:
 * 1. Perceivable
 *    - Text alternatives for non-text content
 *    - Time-based media alternatives
 *    - Adaptable content presentation
 *    - Distinguishable content
 * 
 * 2. Operable
 *    - Keyboard accessible functionality
 *    - Sufficient time for interactions
 *    - Seizure prevention
 *    - Navigation assistance
 * 
 * 3. Understandable
 *    - Readable content
 *    - Predictable operation
 *    - Input assistance
 * 
 * 4. Robust
 *    - Compatible with assistive technologies
 *    - Valid HTML/ARIA implementation
 * 
 * Using axe-core for:
 * - Automated WCAG rule validation
 * - ARIA compliance checking
 * - Color contrast analysis
 * - Keyboard navigation testing
 */

interface AxeViolation {
    id: string;
    impact: 'minor' | 'moderate' | 'serious' | 'critical';
    description: string;
    help: string;
    helpUrl: string;
    nodes: {
        html: string;
        target: string[];
        failureSummary: string;
    }[];
}

interface AccessibilityReport {
    url: string;
    timestamp: string;
    violations: AxeViolation[];
    passes: any[];
    incomplete: any[];
    inapplicable: any[];
}

/**
 * Helper Functions
 * ===============
 */

async function injectAxeCore(page) {
    await page.addScriptTag({
        path: require.resolve('axe-core')
    });
}

async function runAxeAnalysis(page) {
    return await page.evaluate(() => {
        return new Promise(resolve => {
            // @ts-ignore
            axe.run(document, {
                resultTypes: ['violations', 'passes'],
                rules: {
                    'color-contrast': { enabled: true },
                    'frame-title': { enabled: true },
                    'image-alt': { enabled: true },
                    'input-button-name': { enabled: true },
                    'label': { enabled: true },
                    'link-name': { enabled: true },
                    'list': { enabled: true },
                    'listitem': { enabled: true },
                    'meta-viewport': { enabled: true }
                }
            }, (err, results) => {
                if (err) throw err;
                resolve(results);
            });
        });
    });
}

async function saveAccessibilityReport(report: AccessibilityReport) {
    const reportsDir = path.join('test-results', 'accessibility');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(reportsDir, `a11y-report-${timestamp}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
}

async function generateHtmlSnippet(violation: AxeViolation): Promise<string> {
    const snippet = `
        <div class="violation-report">
            <h3>${violation.id} - ${violation.impact}</h3>
            <p>${violation.description}</p>
            <p><strong>Help:</strong> ${violation.help}</p>
            <p><a href="${violation.helpUrl}" target="_blank">More Information</a></p>
            <div class="affected-elements">
                <h4>Affected Elements:</h4>
                ${violation.nodes.map(node => `
                    <div class="element">
                        <pre><code>${escapeHtml(node.html)}</code></pre>
                        <p><strong>Failure Summary:</strong></p>
                        <p>${node.failureSummary}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    return snippet;
}

function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

test.describe('Accessibility Tests @a11y', () => {
    test.beforeEach(async ({ page }) => {
        // Increase timeout for accessibility scans
        test.setTimeout(60000);
    });

    test('validates homepage accessibility', async ({ page }) => {
        await test.step('Navigate to homepage', async () => {
            await page.goto('/');
            await page.waitForLoadState('networkidle');
        });

        await test.step('Inject axe-core', async () => {
            await injectAxeCore(page);
        });

        await test.step('Run accessibility scan', async () => {
            const results = await runAxeAnalysis(page);
            
            // Filter critical violations
            const criticalViolations = results.violations.filter(
                v => v.impact === 'critical'
            );

            // Generate report
            const report: AccessibilityReport = {
                url: page.url(),
                timestamp: new Date().toISOString(),
                violations: criticalViolations,
                passes: results.passes,
                incomplete: results.incomplete,
                inapplicable: results.inapplicable
            };

            // Save report
            await saveAccessibilityReport(report);

            // Generate HTML snippets for violations
            for (const violation of criticalViolations) {
                const snippet = await generateHtmlSnippet(violation);
                // Attach to Allure report
                console.log('Violation HTML Snippet:', snippet);
            }

            // Assert no critical violations
            expect(criticalViolations.length).toBe(0);
        });
    });

    test('validates product page accessibility', async ({ page }) => {
        await test.step('Navigate to product page', async () => {
            await page.goto('/product/1');
            await page.waitForLoadState('networkidle');
        });

        await test.step('Inject axe-core', async () => {
            await injectAxeCore(page);
        });

        await test.step('Run accessibility scan', async () => {
            const results = await runAxeAnalysis(page);
            
            // Filter critical violations
            const criticalViolations = results.violations.filter(
                v => v.impact === 'critical'
            );

            // Generate report
            const report: AccessibilityReport = {
                url: page.url(),
                timestamp: new Date().toISOString(),
                violations: criticalViolations,
                passes: results.passes,
                incomplete: results.incomplete,
                inapplicable: results.inapplicable
            };

            // Save report
            await saveAccessibilityReport(report);

            // Generate HTML snippets for violations
            for (const violation of criticalViolations) {
                const snippet = await generateHtmlSnippet(violation);
                // Attach to Allure report
                console.log('Violation HTML Snippet:', snippet);
            }

            // Assert no critical violations
            expect(criticalViolations.length).toBe(0);
        });
    });

    test('validates dynamic content accessibility', async ({ page }) => {
        await test.step('Navigate to product page', async () => {
            await page.goto('/product/1');
            await injectAxeCore(page);
        });

        await test.step('Test modal dialog accessibility', async () => {
            // Open a modal (e.g., quick view)
            await page.click('[data-testid="quick-view-button"]');
            await page.waitForSelector('[role="dialog"]');

            const results = await runAxeAnalysis(page);
            const criticalViolations = results.violations.filter(
                v => v.impact === 'critical'
            );

            // Check modal-specific requirements
            await expect(page.locator('[role="dialog"]'))
                .toHaveAttribute('aria-modal', 'true');
            await expect(page.locator('[role="dialog"]'))
                .toHaveAttribute('aria-labelledby');

            expect(criticalViolations.length).toBe(0);
        });

        await test.step('Test tab panel accessibility', async () => {
            // Switch between product description tabs
            await page.click('[role="tab"]');
            await page.waitForSelector('[role="tabpanel"]');

            const results = await runAxeAnalysis(page);
            const criticalViolations = results.violations.filter(
                v => v.impact === 'critical'
            );

            // Check tab panel requirements
            await expect(page.locator('[role="tab"][aria-selected="true"]'))
                .toBeVisible();
            await expect(page.locator('[role="tabpanel"]'))
                .toHaveAttribute('aria-labelledby');

            expect(criticalViolations.length).toBe(0);
        });
    });

    test('validates form accessibility', async ({ page }) => {
        await test.step('Navigate to contact form', async () => {
            await page.goto('/contact');
            await injectAxeCore(page);
        });

        await test.step('Test form field accessibility', async () => {
            const formFields = [
                { label: 'Name', type: 'text' },
                { label: 'Email', type: 'email' },
                { label: 'Message', type: 'textarea' }
            ];

            for (const field of formFields) {
                // Check label association
                const label = page.locator(`label:has-text("${field.label}")`);
                await expect(label).toBeVisible();
                
                // Check input attributes
                const input = field.type === 'textarea' 
                    ? page.locator('textarea') 
                    : page.locator(`input[type="${field.type}"]`);
                
                await expect(input).toHaveAttribute('aria-required', 'true');
                await expect(input).toHaveAttribute('id');
                
                // Verify label-input connection
                const labelFor = await label.getAttribute('for');
                const inputId = await input.getAttribute('id');
                expect(labelFor).toBe(inputId);
            }

            const results = await runAxeAnalysis(page);
            const criticalViolations = results.violations.filter(
                v => v.impact === 'critical'
            );

            expect(criticalViolations.length).toBe(0);
        });
    });
}); 