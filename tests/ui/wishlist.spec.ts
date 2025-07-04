import { test, expect } from '@playwright/test';
import { WishlistPage } from '../../src/pageObjects/WishlistPage';
import { ProductPage } from '../../src/pageObjects/ProductPage';
import { allure } from 'allure-playwright';

/**
 * @fileoverview Wishlist Feature Test Suite
 * =======================================
 * 
 * This test suite validates the wishlist functionality of the e-commerce platform.
 * It covers the core wishlist operations including adding items, moving to cart,
 * and count verification.
 * 
 * Key Features Tested:
 * ------------------
 * 1. Adding items to wishlist
 * 2. Wishlist counter functionality
 * 3. Moving items to cart
 * 4. Count synchronization between wishlist and cart
 * 
 * Test Data Strategy:
 * -----------------
 * - Using predefined product IDs
 * - Verifying both single and multiple items
 * - Testing edge cases and error conditions
 * 
 * Prerequisites:
 * ------------
 * - User authentication
 * - Available test products
 * - Clean wishlist state
 * 
 * @package tests/ui
 * @category Wishlist
 */

/**
 * Test Data and Constants
 * ======================
 */

const TEST_PRODUCTS = {
    PRODUCT1: 'test-product-1',
    PRODUCT2: 'test-product-2',
    INVALID: 'invalid-product'
};

const TEST_USER = {
    email: process.env.TEST_USER_EMAIL || 'test@example.com',
    password: process.env.TEST_USER_PASS || 'test123'
};

/**
 * Wishlist Test Suite
 * ==================
 */

test.describe('Wishlist Functionality @wishlist @ui', () => {
    let wishlistPage: WishlistPage;
    let productPage: ProductPage;

    test.beforeEach(async ({ page }) => {
        wishlistPage = new WishlistPage(page);
        productPage = new ProductPage(page);

        // Login before each test
        await allure.step('Login user', async () => {
            await page.goto('/login');
            await page.fill('[data-testid="email-input"]', TEST_USER.email);
            await page.fill('[data-testid="password-input"]', TEST_USER.password);
            await page.click('[data-testid="login-button"]');
            await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
        });

        // Ensure clean wishlist
        await allure.step('Clear wishlist', async () => {
            await wishlistPage.open();
            const items = await wishlistPage.getItems();
            for (let i = 0; i < items.length; i++) {
                await wishlistPage.removeItem(0); // Always remove first item
            }
            await expect(wishlistPage.emptyMessage).toBeVisible();
        });
    });

    /**
     * Core Wishlist Operations Test
     * ===========================
     * 
     * Validates the main wishlist workflow:
     * 1. Adding multiple items
     * 2. Verifying wishlist counter
     * 3. Moving items to cart
     * 4. Verifying count updates
     * 
     * @test
     * @category Core
     */
    test('complete wishlist workflow @smoke', async ({ page }) => {
        // Step 1: Add first item to wishlist
        await allure.step('Add first item to wishlist', async () => {
            await wishlistPage.addItem(TEST_PRODUCTS.PRODUCT1);
            await expect(wishlistPage.wishlistCounter).toHaveText('1');
            
            // Verify item details
            await wishlistPage.open();
            const items = await wishlistPage.getItems();
            expect(items).toHaveLength(1);
            await allure.attachment(
                'First Item Details',
                JSON.stringify(items[0], null, 2),
                'application/json'
            );
        });

        // Step 2: Add second item to wishlist
        await allure.step('Add second item to wishlist', async () => {
            await wishlistPage.addItem(TEST_PRODUCTS.PRODUCT2);
            await expect(wishlistPage.wishlistCounter).toHaveText('2');
            
            // Verify both items
            await wishlistPage.open();
            const items = await wishlistPage.getItems();
            expect(items).toHaveLength(2);
            await allure.attachment(
                'All Items Details',
                JSON.stringify(items, null, 2),
                'application/json'
            );
        });

        // Step 3: Verify heart icon counter
        await allure.step('Verify wishlist counter', async () => {
            const count = await wishlistPage.count();
            expect(count).toBe(2);
            await allure.attachment(
                'Wishlist Count',
                JSON.stringify({ count }, null, 2),
                'application/json'
            );
        });

        // Step 4: Move first item to cart
        await allure.step('Move first item to cart', async () => {
            const itemsBefore = await wishlistPage.getItems();
            await wishlistPage.moveToCart(0);
            
            // Verify item moved
            const itemsAfter = await wishlistPage.getItems();
            expect(itemsAfter).toHaveLength(1);
            expect(itemsAfter[0].name).toBe(itemsBefore[1].name);
            
            await allure.attachment(
                'Items After Move',
                JSON.stringify({
                    before: itemsBefore,
                    after: itemsAfter
                }, null, 2),
                'application/json'
            );
        });

        // Step 5: Assert counts
        await allure.step('Verify final counts', async () => {
            const finalCounts = {
                wishlist: await wishlistPage.count(),
                cart: await page.locator('[data-testid="cart-count"]').textContent()
            };
            
            expect(finalCounts.wishlist).toBe(1);
            expect(finalCounts.cart).toBe('1');
            
            await allure.attachment(
                'Final Counts',
                JSON.stringify(finalCounts, null, 2),
                'application/json'
            );
        });
    });

    /**
     * Error Handling Test
     * =================
     * 
     * Validates error scenarios:
     * - Adding invalid products
     * - Adding same product twice
     * - Moving non-existent items
     * 
     * @test
     * @category Errors
     */
    test('handles wishlist errors correctly @negative', async ({ page }) => {
        // Test invalid product
        await allure.step('Try adding invalid product', async () => {
            try {
                await wishlistPage.addItem(TEST_PRODUCTS.INVALID);
                throw new Error('Should have failed');
            } catch (error) {
                expect(error.message).toContain('404');
                await allure.attachment(
                    'Invalid Product Error',
                    error.message,
                    'text/plain'
                );
            }
        });

        // Test duplicate addition
        await allure.step('Try adding duplicate product', async () => {
            await wishlistPage.addItem(TEST_PRODUCTS.PRODUCT1);
            try {
                await wishlistPage.addItem(TEST_PRODUCTS.PRODUCT1);
                throw new Error('Should have failed');
            } catch (error) {
                expect(error.message).toContain('already in wishlist');
                await allure.attachment(
                    'Duplicate Product Error',
                    error.message,
                    'text/plain'
                );
            }
        });

        // Test invalid move to cart
        await allure.step('Try moving invalid item to cart', async () => {
            try {
                await wishlistPage.moveToCart(999);
                throw new Error('Should have failed');
            } catch (error) {
                expect(error.message).toContain('Invalid index');
                await allure.attachment(
                    'Invalid Move Error',
                    error.message,
                    'text/plain'
                );
            }
        });
    });

    /**
     * UI Interaction Test
     * =================
     * 
     * Validates UI elements:
     * - Empty state message
     * - Counter visibility
     * - Button states
     * 
     * @test
     * @category UI
     */
    test('wishlist UI elements behave correctly @ui', async ({ page }) => {
        // Check empty state
        await allure.step('Verify empty state', async () => {
            await wishlistPage.open();
            await expect(wishlistPage.emptyMessage).toBeVisible();
            await expect(wishlistPage.wishlistCounter).toBeHidden();
        });

        // Add item and check UI updates
        await allure.step('Add item and verify UI', async () => {
            await wishlistPage.addItem(TEST_PRODUCTS.PRODUCT1);
            await expect(wishlistPage.emptyMessage).toBeHidden();
            await expect(wishlistPage.wishlistCounter).toBeVisible();
            await expect(wishlistPage.wishlistItems).toHaveCount(1);
        });

        // Check button states
        await allure.step('Verify button states', async () => {
            await wishlistPage.open();
            await expect(wishlistPage.moveToCartButtons.first()).toBeEnabled();
            await expect(wishlistPage.removeButtons.first()).toBeEnabled();
        });

        // Remove item and check UI reset
        await allure.step('Remove item and verify UI reset', async () => {
            await wishlistPage.removeItem(0);
            await expect(wishlistPage.emptyMessage).toBeVisible();
            await expect(wishlistPage.wishlistCounter).toBeHidden();
            await expect(wishlistPage.wishlistItems).toHaveCount(0);
        });
    });
});

// Done – M-8a complete 