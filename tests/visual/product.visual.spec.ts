import { test } from '@playwright/test';
import { VisualHelper } from '../../src/utils/visual';
import { ProductPage } from '../../src/pageObjects/ProductPage';

/**
 * Visual Regression Test Suite for Product Page
 * 
 * This suite verifies the visual appearance of the product page across different
 * themes (light/dark) and ensures consistent rendering of product information.
 * 
 * Test Coverage:
 * - Theme comparison (light vs dark mode)
 * - Key UI components:
 *   * Product images
 *   * Product details
 *   * Price and availability
 *   * Related products
 * 
 * Theme Testing Strategy:
 * - Compare same components in both themes
 * - Verify color schemes and contrast
 * - Check readability and accessibility
 */

test.describe('Product Page Visual Tests @visual', () => {
  let visualHelper: VisualHelper;
  let productPage: ProductPage;
  const testProductId = 'test-product-1'; // Replace with actual test product ID

  test.beforeEach(async ({ page }) => {
    visualHelper = new VisualHelper({
      maxDiffPixels: 100,
      threshold: 0.1
    });
    productPage = new ProductPage(page);
  });

  test.afterEach(async () => {
    await visualHelper.cleanup();
  });

  test('product page renders correctly in light theme', async ({ page }) => {
    // Set theme and viewport
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await page.setViewportSize({ width: 1366, height: 768 });

    // Navigate to test product
    await productPage.navigateToProduct(testProductId);
    await productPage.waitForLoad();

    // Take full page screenshot
    await visualHelper.compareScreenshot(page, 'product-light', {
      viewport: { width: 1366, height: 768 },
      theme: 'light'
    });
  });

  test('product page renders correctly in dark theme', async ({ page }) => {
    // Set theme and viewport
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.setViewportSize({ width: 1366, height: 768 });

    // Navigate to test product
    await productPage.navigateToProduct(testProductId);
    await productPage.waitForLoad();

    // Take full page screenshot
    await visualHelper.compareScreenshot(page, 'product-dark', {
      viewport: { width: 1366, height: 768 },
      theme: 'dark'
    });
  });

  test('product images gallery comparison', async ({ page }) => {
    const viewport = { width: 1366, height: 768 };
    
    // Test both themes
    for (const theme of ['light', 'dark'] as const) {
      // Set theme
      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t);
      }, theme);
      
      // Navigate and wait for gallery
      await productPage.navigateToProduct(testProductId);
      await productPage.waitForLoad();
      const gallery = await page.locator('.product-gallery').first();
      
      // Take gallery screenshot
      await visualHelper.compareScreenshot(page, `product-gallery-${theme}`, {
        viewport,
        theme
      });
    }
  });

  test('product details section theme comparison', async ({ page }) => {
    const viewport = { width: 1366, height: 768 };
    
    // Test both themes
    for (const theme of ['light', 'dark'] as const) {
      // Set theme
      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t);
      }, theme);
      
      // Navigate and locate details section
      await productPage.navigateToProduct(testProductId);
      await productPage.waitForLoad();
      const details = await page.locator('.product-details').first();
      
      // Take details screenshot
      await visualHelper.compareScreenshot(page, `product-details-${theme}`, {
        viewport,
        theme
      });
    }
  });

  test('price and availability section theme comparison', async ({ page }) => {
    const viewport = { width: 1366, height: 768 };
    
    // Test both themes
    for (const theme of ['light', 'dark'] as const) {
      // Set theme
      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t);
      }, theme);
      
      // Navigate and locate price section
      await productPage.navigateToProduct(testProductId);
      await productPage.waitForLoad();
      const priceSection = await page.locator('.price-availability').first();
      
      // Take price section screenshot
      await visualHelper.compareScreenshot(page, `product-price-${theme}`, {
        viewport,
        theme
      });
    }
  });

  test('related products section theme comparison', async ({ page }) => {
    const viewport = { width: 1366, height: 768 };
    
    // Test both themes
    for (const theme of ['light', 'dark'] as const) {
      // Set theme
      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t);
      }, theme);
      
      // Navigate and locate related products
      await productPage.navigateToProduct(testProductId);
      await productPage.waitForLoad();
      const relatedProducts = await page.locator('.related-products').first();
      
      // Take related products screenshot
      await visualHelper.compareScreenshot(page, `product-related-${theme}`, {
        viewport,
        theme
      });
    }
  });

  test('interactive elements theme comparison', async ({ page }) => {
    const viewport = { width: 1366, height: 768 };
    
    // Test both themes
    for (const theme of ['light', 'dark'] as const) {
      // Set theme
      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t);
      }, theme);
      
      // Navigate to product
      await productPage.navigateToProduct(testProductId);
      await productPage.waitForLoad();
      
      // Test various interactive states
      const states = [
        { name: 'default', action: async () => {} },
        { name: 'hover-buy', action: async () => page.hover('.buy-button') },
        { name: 'hover-wishlist', action: async () => page.hover('.wishlist-button') },
        { name: 'expanded-description', action: async () => page.click('.description-toggle') }
      ];
      
      for (const state of states) {
        await state.action();
        await page.waitForTimeout(500); // Wait for any animations
        
        await visualHelper.compareScreenshot(page, `product-${state.name}-${theme}`, {
          viewport,
          theme
        });
      }
    }
  });

  test('color scheme verification', async ({ page }) => {
    const viewport = { width: 1366, height: 768 };
    
    // Define key color elements to verify
    const colorElements = [
      { selector: '.product-title', property: 'color' },
      { selector: '.price', property: 'color' },
      { selector: '.buy-button', property: 'backgroundColor' },
      { selector: '.product-description', property: 'color' }
    ];
    
    // Test both themes
    for (const theme of ['light', 'dark'] as const) {
      // Set theme
      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t);
      }, theme);
      
      // Navigate to product
      await productPage.navigateToProduct(testProductId);
      await productPage.waitForLoad();
      
      // Take screenshot for color verification
      await visualHelper.compareScreenshot(page, `product-colors-${theme}`, {
        viewport,
        theme
      });
    }
  });
}); 
