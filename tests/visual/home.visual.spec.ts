import { test } from '@playwright/test';
import { VisualHelper } from '../../src/utils';
import { HomePage } from '../../src/pageObjects/HomePage';

/**
 * Visual Regression Test Suite for Home Page
 * 
 * This suite verifies the visual appearance of the home page across different
 * viewport sizes and ensures consistent rendering of UI elements.
 * 
 * Test Coverage:
 * - Desktop viewport (1366x768)
 * - Mobile viewport (375x812)
 * - Key UI components:
 *   * Header and navigation
 *   * Hero section
 *   * Featured products
 *   * Footer
 * 
 * Viewport Specifications:
 * Desktop: 1366x768 (Common laptop resolution)
 * Mobile: 375x812 (iPhone X/11 Pro/12 Mini)
 */

test.describe('Home Page Visual Tests @visual', () => {
  let visualHelper: VisualHelper;
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    visualHelper = new VisualHelper({
      maxDiffPixels: 100,
      threshold: 0.1
    });
    homePage = new HomePage(page);
  });

  test.afterEach(async () => {
    await visualHelper.cleanup();
  });

  test('desktop viewport renders correctly', async ({ page }) => {
    // Set desktop viewport
    const viewport = { width: 1366, height: 768 };
    
    // Navigate and wait for content
    await homePage.goto();
    await homePage.waitForLoad();

    // Take full page screenshot
    await visualHelper.compareScreenshot(page, 'home-desktop', { viewport });
  });

  test('mobile viewport renders correctly', async ({ page }) => {
    // Set mobile viewport
    const viewport = { width: 375, height: 812 };
    
    // Navigate and wait for content
    await homePage.goto();
    await homePage.waitForLoad();

    // Take full page screenshot
    await visualHelper.compareScreenshot(page, 'home-mobile', { viewport });
  });

  test('hero section matches baseline on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1366, height: 768 });
    
    // Navigate and locate hero section
    await homePage.goto();
    await homePage.waitForLoad();
    const heroSection = await page.locator('.hero-section').first();
    
    // Take screenshot of hero section
    await visualHelper.compareScreenshot(page, 'home-hero-desktop', {
      viewport: { width: 1366, height: 768 }
    });
  });

  test('featured products grid layout on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1366, height: 768 });
    
    // Navigate and locate products grid
    await homePage.goto();
    await homePage.waitForLoad();
    const productsGrid = await page.locator('.products-grid').first();
    
    // Take screenshot of products grid
    await visualHelper.compareScreenshot(page, 'home-products-desktop', {
      viewport: { width: 1366, height: 768 }
    });
  });

  test('mobile navigation menu structure', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    
    // Navigate and open mobile menu
    await homePage.goto();
    await homePage.waitForLoad();
    await page.click('.mobile-menu-trigger');
    await page.waitForSelector('.mobile-menu.open');
    
    // Take screenshot of mobile menu
    await visualHelper.compareScreenshot(page, 'home-mobile-menu', {
      viewport: { width: 375, height: 812 }
    });
  });

  test('footer layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    
    // Navigate and scroll to footer
    await homePage.goto();
    await homePage.waitForLoad();
    const footer = await page.locator('footer').first();
    await footer.scrollIntoViewIfNeeded();
    
    // Take screenshot of footer
    await visualHelper.compareScreenshot(page, 'home-footer-mobile', {
      viewport: { width: 375, height: 812 }
    });
  });

  test('search bar appearance and interaction', async ({ page }) => {
    // Test on both viewports
    for (const viewport of [
      { width: 1366, height: 768, suffix: 'desktop' },
      { width: 375, height: 812, suffix: 'mobile' }
    ]) {
      // Set viewport
      await page.setViewportSize(viewport);
      
      // Navigate and interact with search
      await homePage.goto();
      await homePage.waitForLoad();
      
      // Take screenshot of default state
      await visualHelper.compareScreenshot(page, `home-search-default-${viewport.suffix}`, {
        viewport
      });
      
      // Focus search and take screenshot
      await page.click('.search-bar');
      await page.waitForTimeout(500); // Wait for any animations
      await visualHelper.compareScreenshot(page, `home-search-active-${viewport.suffix}`, {
        viewport
      });
    }
  });

  test('responsive images load correctly', async ({ page }) => {
    // Test both viewports
    for (const viewport of [
      { width: 1366, height: 768, suffix: 'desktop' },
      { width: 375, height: 812, suffix: 'mobile' }
    ]) {
      // Set viewport
      await page.setViewportSize(viewport);
      
      // Navigate and wait for images
      await homePage.goto();
      await homePage.waitForLoad();
      await page.waitForSelector('img');
      
      // Wait additional time for images to load
      await page.waitForTimeout(1000);
      
      // Take screenshot focusing on image areas
      await visualHelper.compareScreenshot(page, `home-images-${viewport.suffix}`, {
        viewport
      });
    }
  });
}); 





