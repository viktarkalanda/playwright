import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * CMS Pages Test Suite
 * 
 * This test suite validates the functionality of static CMS pages including:
 * - Accessibility and availability of legal/information pages
 * - Proper 404 error page handling
 * - Console error monitoring
 * - Screenshot capture for visual verification
 * 
 * Key aspects tested:
 * 1. Page response codes (200 for valid pages, 404 for non-existent)
 * 2. Content validation through heading verification
 * 3. Browser console monitoring for JavaScript errors
 * 4. Visual regression testing through screenshots
 * 
 * Test coverage:
 * - Terms & Conditions page
 * - Delivery Information page
 * - 404 error page
 * 
 * Error handling:
 * - Validates proper error page rendering
 * - Monitors and verifies absence of console errors
 * - Ensures consistent error page layout
 * 
 * Visual testing:
 * - Captures screenshots of error pages
 * - Stores artifacts in designated directory
 * - Implements proper screenshot naming convention
 * 
 * Integration points:
 * - Static page routing
 * - Error handling middleware
 * - Content management system
 */

test.describe('CMS Pages', () => {
    let consoleErrors: string[] = [];
    
    // Setup console error monitoring
    test.beforeEach(async ({ page }) => {
        consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
    });

    test('Terms and Conditions page loads correctly @cms', async ({ page }) => {
        await test.step('Navigate to Terms page', async () => {
            const response = await page.goto('/terms-and-conditions');
            expect(response.status()).toBe(200);
        });

        await test.step('Verify page content', async () => {
            // Check main heading
            await expect(page.getByRole('heading', { 
                name: 'Terms & Conditions',
                level: 1 
            })).toBeVisible();

            // Verify page structure
            await expect(page.getByRole('main')).toBeVisible();
            await expect(page.getByRole('navigation')).toBeVisible();
        });

        await test.step('Check for console errors', async () => {
            expect(consoleErrors).toHaveLength(0);
        });
    });

    test('Delivery Information page loads correctly @cms', async ({ page }) => {
        await test.step('Navigate to Delivery page', async () => {
            const response = await page.goto('/delivery-info');
            expect(response.status()).toBe(200);
        });

        await test.step('Verify page content', async () => {
            // Check main heading
            await expect(page.getByRole('heading', { 
                name: 'Delivery Information',
                level: 1 
            })).toBeVisible();

            // Verify page sections
            await expect(page.getByRole('main')).toBeVisible();
            await expect(page.getByRole('navigation')).toBeVisible();
        });

        await test.step('Check for console errors', async () => {
            expect(consoleErrors).toHaveLength(0);
        });
    });

    test('404 page handles non-existent pages correctly @cms', async ({ page }) => {
        await test.step('Navigate to non-existent page', async () => {
            const response = await page.goto('/non-existent-page');
            expect(response.status()).toBe(404);
        });

        await test.step('Verify 404 page content', async () => {
            // Check error heading
            await expect(page.getByRole('heading', { 
                name: 'Page not found',
                level: 1 
            })).toBeVisible();

            // Verify error page elements
            await expect(page.getByRole('main')).toBeVisible();
            await expect(page.getByText(/The page you are looking for/)).toBeVisible();
            await expect(page.getByRole('link', { name: 'Return to Homepage' }))
                .toBeVisible();
        });

        await test.step('Capture 404 page screenshot', async () => {
            // Ensure directory exists
            const screenshotPath = path.join('test-artifacts', '404-page.png');
            
            // Take full page screenshot
            await page.screenshot({ 
                path: screenshotPath,
                fullPage: true
            });
        });

        await test.step('Check for console errors', async () => {
            expect(consoleErrors).toHaveLength(0);
        });
    });

    test('Verify consistent header and footer on CMS pages @cms', async ({ page }) => {
        const cmsPages = [
            '/terms-and-conditions',
            '/delivery-info',
            '/privacy-policy',  // Additional common CMS page
            '/about-us'         // Additional common CMS page
        ];

        for (const pageUrl of cmsPages) {
            await test.step(`Check common elements on ${pageUrl}`, async () => {
                const response = await page.goto(pageUrl);
                
                // Skip if page doesn't exist
                if (response.status() === 404) {
                    return;
                }

                // Verify common header elements
                await expect(page.getByRole('banner')).toBeVisible();
                await expect(page.getByRole('navigation')).toBeVisible();
                
                // Verify common footer elements
                await expect(page.getByRole('contentinfo')).toBeVisible();
                await expect(page.getByRole('link', { name: 'Contact Us' }))
                    .toBeVisible();
            });
        }

        await test.step('Check for console errors', async () => {
            expect(consoleErrors).toHaveLength(0);
        });
    });

    test('Verify meta tags and SEO elements @cms', async ({ page }) => {
        await test.step('Check Terms page meta tags', async () => {
            await page.goto('/terms-and-conditions');
            
            // Verify essential meta tags
            await expect(page.locator('meta[name="description"]'))
                .toHaveAttribute('content', /terms/i);
            await expect(page.locator('title'))
                .toContainText(/Terms & Conditions/i);
        });

        await test.step('Check Delivery page meta tags', async () => {
            await page.goto('/delivery-info');
            
            // Verify essential meta tags
            await expect(page.locator('meta[name="description"]'))
                .toHaveAttribute('content', /delivery/i);
            await expect(page.locator('title'))
                .toContainText(/Delivery Information/i);
        });

        await test.step('Check 404 page meta tags', async () => {
            await page.goto('/non-existent-page');
            
            // Verify 404 page meta tags
            await expect(page.locator('meta[name="robots"]'))
                .toHaveAttribute('content', 'noindex, nofollow');
            await expect(page.locator('title'))
                .toContainText(/Page Not Found/i);
        });
    });
}); 