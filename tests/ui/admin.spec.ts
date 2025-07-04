import { test, expect, Page } from '@playwright/test';
import { allure } from 'allure-playwright';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * @fileoverview Back-Office Administration Test Suite
 * @package tests/ui
 * @requires @playwright/test
 * @requires allure-playwright
 * @requires axios
 * 
 * @narrative
 * As an administrator
 * I want to manage products through the back-office
 * So that I can control the product catalog effectively
 * 
 * @description
 * This test suite covers the core administrative functionality:
 * - Admin authentication
 * - Product management (CRUD operations)
 * - Cross-validation between back-office and front-office
 * - API integration verification
 */

/**
 * Test environment configuration and constants
 */
const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3000/admin';
const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3000';

const ADMIN_CREDS = {
    username: process.env.ADMIN_USER || 'admin@example.com',
    password: process.env.ADMIN_PASS || 'admin123'
};

/**
 * Product management test utilities
 */
interface IProduct {
    id?: string;
    name: string;
    price: number;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    createdAt?: string;
    updatedAt?: string;
}

/**
 * API helper functions
 */
const api = {
    /**
     * Fetches products by name
     * @param name - Product name to search for
     * @returns Promise with matching products
     */
    async getProductByName(name: string): Promise<IProduct[]> {
        const response = await axios.get(`${API_URL}/products`, {
            params: { name }
        });
        return response.data;
    },

    /**
     * Deletes a product by ID
     * @param id - Product ID to delete
     */
    async deleteProduct(id: string): Promise<void> {
        await axios.delete(`${API_URL}/products/${id}`);
    }
};

/**
 * Page Object helper functions
 */
const adminPage = {
    /**
     * Logs in to the admin panel
     * @param page - Playwright page object
     */
    async login(page: Page): Promise<void> {
        await allure.step('Login to admin panel', async () => {
            await page.goto(`${ADMIN_URL}/login`);
            await page.fill('[data-testid="username"]', ADMIN_CREDS.username);
            await page.fill('[data-testid="password"]', ADMIN_CREDS.password);
            await page.click('[data-testid="login-button"]');
            await page.waitForURL(`${ADMIN_URL}/dashboard`);
        });
    },

    /**
     * Creates a new product
     * @param page - Playwright page object
     * @param product - Product data
     * @returns Created product ID
     */
    async createProduct(page: Page, product: IProduct): Promise<string> {
        await allure.step('Create new product', async () => {
            // Navigate to product creation
            await page.click('[data-testid="products-menu"]');
            await page.click('[data-testid="create-product"]');

            // Fill product details
            await page.fill('[data-testid="product-name"]', product.name);
            await page.fill('[data-testid="product-price"]', product.price.toString());
            await page.selectOption('[data-testid="product-status"]', product.status);

            // Save and wait for confirmation
            await page.click('[data-testid="save-product"]');
            await page.waitForSelector('[data-testid="toast-success"]');
        });

        // Extract product ID from URL
        const url = page.url();
        return url.split('/').pop() || '';
    },

    /**
     * Verifies product visibility in front-office
     * @param page - Playwright page object
     * @param productId - Product ID to verify
     */
    async verifyProductInFrontOffice(page: Page, productId: string): Promise<void> {
        await allure.step('Verify product in front-office', async () => {
            await page.goto(`${FRONT_URL}/product/${productId}`);
            await expect(page.locator('[data-testid="product-details"]')).toBeVisible();
        });
    }
};

/**
 * Test suite: Back-Office Product Management
 * @tag @admin
 * @tag @ui
 */
test.describe('Back-Office Product Management', () => {
    let productId: string;
    let productName: string;

    test.beforeEach(async ({ page }) => {
        await allure.step('Setup: Generate unique product name', async () => {
            productName = `Test TS ${Date.now()}-${uuidv4().slice(0, 8)}`;
        });
    });

    test.afterEach(async () => {
        await allure.step('Cleanup: Delete test product', async () => {
            if (productId) {
                await api.deleteProduct(productId);
            }
        });
    });

    /**
     * @test Create and verify product through admin panel
     * @description Tests the complete product creation flow:
     * 1. Admin login
     * 2. Product creation
     * 3. API verification
     * 4. Front-office visibility check
     */
    test('should create product and verify in front-office @admin @ui', async ({ page }) => {
        // Step 1: Admin Login
        await allure.step('Step 1: Login to admin panel', async () => {
            await adminPage.login(page);
            await expect(page).toHaveURL(/.*\/dashboard/);
        });

        // Step 2: Create Product
        await allure.step('Step 2: Create new product', async () => {
            const product: IProduct = {
                name: productName,
                price: 123.45,
                status: 'PUBLISHED'
            };

            productId = await adminPage.createProduct(page, product);
            expect(productId).toBeTruthy();
        });

        // Step 3: Verify Toast Message
        await allure.step('Step 3: Verify success message', async () => {
            const toast = page.locator('[data-testid="toast-success"]');
            await expect(toast).toBeVisible();
            await expect(toast).toHaveText('Product saved');
        });

        // Step 4: API Verification
        await allure.step('Step 4: Verify product via API', async () => {
            const products = await api.getProductByName(productName);
            expect(products).toHaveLength(1);
            expect(products[0]).toMatchObject({
                name: productName,
                price: 123.45,
                status: 'PUBLISHED'
            });
        });

        // Step 5: Front-office Verification
        await allure.step('Step 5: Verify product in front-office', async () => {
            await adminPage.verifyProductInFrontOffice(page, productId);
        });
    });

    /**
     * @test Product status management
     * @description Verifies product status changes are reflected correctly
     */
    test('should manage product status correctly @admin @ui', async ({ page }) => {
        await allure.step('Create draft product', async () => {
            await adminPage.login(page);
            const product: IProduct = {
                name: productName,
                price: 123.45,
                status: 'DRAFT'
            };
            productId = await adminPage.createProduct(page, product);
        });

        await allure.step('Verify draft not visible in front-office', async () => {
            await page.goto(`${FRONT_URL}/product/${productId}`);
            await expect(page.locator('[data-testid="product-not-found"]')).toBeVisible();
        });

        await allure.step('Publish product', async () => {
            await page.goto(`${ADMIN_URL}/products/${productId}/edit`);
            await page.selectOption('[data-testid="product-status"]', 'PUBLISHED');
            await page.click('[data-testid="save-product"]');
            await page.waitForSelector('[data-testid="toast-success"]');
        });

        await allure.step('Verify published product visible in front-office', async () => {
            await adminPage.verifyProductInFrontOffice(page, productId);
        });
    });

    /**
     * @test Product price validation
     * @description Ensures proper price formatting and validation
     */
    test('should validate product price format @admin @ui', async ({ page }) => {
        await adminPage.login(page);

        await allure.step('Attempt to create product with invalid price', async () => {
            await page.click('[data-testid="products-menu"]');
            await page.click('[data-testid="create-product"]');
            await page.fill('[data-testid="product-name"]', productName);
            await page.fill('[data-testid="product-price"]', 'invalid');
            await page.click('[data-testid="save-product"]');

            const error = page.locator('[data-testid="price-error"]');
            await expect(error).toBeVisible();
            await expect(error).toHaveText('Please enter a valid price');
        });

        await allure.step('Create product with valid price', async () => {
            await page.fill('[data-testid="product-price"]', '123.45');
            await page.click('[data-testid="save-product"]');
            await page.waitForSelector('[data-testid="toast-success"]');
        });
    });
});

// Output completion message
console.log('Done – T-8a complete'); 