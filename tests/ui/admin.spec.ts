import { test, expect, Page } from '@playwright/test';
import { allure } from 'allure-playwright';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { AdminPage } from '../../src/pageObjects/AdminPage';
import { ProductPage } from '../../src/pageObjects/ProductPage';
import axiosClient from '../../src/utils/axiosClient';

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
 * 
 * @requirements
 * 1. Admin Authentication:
 *    - Secure login with credentials
 *    - Session management
 *    - Access control to admin features
 * 
 * 2. Product Management:
 *    - Create new products with required fields
 *    - Update existing products
 *    - Delete products
 *    - Validate input fields
 *    - Handle product status changes
 * 
 * 3. Front-office Integration:
 *    - Published products visible to customers
 *    - Draft products hidden from customers
 *    - Real-time updates reflected in front-office
 * 
 * 4. API Integration:
 *    - REST API endpoints for CRUD operations
 *    - Data validation and error handling
 *    - Status code verification
 *    - Response schema validation
 * 
 * @testStrategy
 * The test suite follows these principles:
 * 1. Independence: Each test is self-contained
 * 2. Cleanup: All test data is removed after execution
 * 3. Verification: Multiple layers (UI, API, DB) are checked
 * 4. Documentation: Clear steps and expectations
 * 
 * @environment
 * - Node.js 16+
 * - Playwright 1.40+
 * - Allure Reporter
 * - Axios HTTP Client
 */

/**
 * Test environment configuration and constants
 * @namespace Configuration
 */
const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3000/admin';
const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3000';

const ADMIN_CREDS = {
    username: process.env.ADMIN_USER || 'admin@example.com',
    password: process.env.ADMIN_PASS || 'admin123'
};

/**
 * Product management interfaces and types
 * @namespace Types
 */
interface IProduct {
    id?: string;
    name: string;
    price: number;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    createdAt?: string;
    updatedAt?: string;
    description?: string;
    category?: string;
    sku?: string;
    stock?: number;
}

interface IApiResponse<T> {
    data: T;
    status: number;
    message?: string;
}

/**
 * API helper functions for product management
 * @namespace API
 */
const api = {
    /**
     * Fetches products by name
     * @param name - Product name to search for
     * @returns Promise with matching products
     * @throws {Error} If API request fails
     */
    async getProductByName(name: string): Promise<IProduct[]> {
        try {
            const response = await axios.get(`${API_URL}/products`, {
                params: { name }
            });
            return response.data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    /**
     * Deletes a product by ID
     * @param id - Product ID to delete
     * @throws {Error} If deletion fails
     */
    async deleteProduct(id: string): Promise<void> {
        try {
            await axios.delete(`${API_URL}/products/${id}`);
        } catch (error) {
            console.error('Delete Error:', error);
            throw error;
        }
    },

    /**
     * Updates a product's details
     * @param id - Product ID to update
     * @param data - Updated product data
     * @returns Updated product data
     */
    async updateProduct(id: string, data: Partial<IProduct>): Promise<IProduct> {
        try {
            const response = await axios.put(`${API_URL}/products/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Update Error:', error);
            throw error;
        }
    }
};

/**
 * Page Object helper functions for admin interface
 * @namespace PageObjects
 */
const adminPage = {
    /**
     * Logs in to the admin panel
     * @param page - Playwright page object
     * @throws {Error} If login fails
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
     * @throws {Error} If product creation fails
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

            // Fill optional fields if provided
            if (product.description) {
                await page.fill('[data-testid="product-description"]', product.description);
            }
            if (product.category) {
                await page.fill('[data-testid="product-category"]', product.category);
            }
            if (product.sku) {
                await page.fill('[data-testid="product-sku"]', product.sku);
            }
            if (product.stock !== undefined) {
                await page.fill('[data-testid="product-stock"]', product.stock.toString());
            }

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
     * @throws {Error} If product is not visible
     */
    async verifyProductInFrontOffice(page: Page, productId: string): Promise<void> {
        await allure.step('Verify product in front-office', async () => {
            await page.goto(`${FRONT_URL}/product/${productId}`);
            await expect(page.locator('[data-testid="product-details"]')).toBeVisible();
        });
    },

    /**
     * Updates an existing product
     * @param page - Playwright page object
     * @param productId - Product ID to update
     * @param updates - Product data to update
     */
    async updateProduct(page: Page, productId: string, updates: Partial<IProduct>): Promise<void> {
        await allure.step('Update product', async () => {
            await page.goto(`${ADMIN_URL}/products/${productId}/edit`);
            
            if (updates.name) {
                await page.fill('[data-testid="product-name"]', updates.name);
            }
            if (updates.price !== undefined) {
                await page.fill('[data-testid="product-price"]', updates.price.toString());
            }
            if (updates.status) {
                await page.selectOption('[data-testid="product-status"]', updates.status);
            }
            if (updates.description) {
                await page.fill('[data-testid="product-description"]', updates.description);
            }
            if (updates.category) {
                await page.fill('[data-testid="product-category"]', updates.category);
            }
            if (updates.sku) {
                await page.fill('[data-testid="product-sku"]', updates.sku);
            }
            if (updates.stock !== undefined) {
                await page.fill('[data-testid="product-stock"]', updates.stock.toString());
            }

            await page.click('[data-testid="save-product"]');
            await page.waitForSelector('[data-testid="toast-success"]');
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
    let admin: AdminPage;
    let productPage: ProductPage;

    test.beforeEach(async ({ page }) => {
        admin = new AdminPage(page);
        productPage = new ProductPage(page);
        await admin.login(ADMIN_CREDS.username, ADMIN_CREDS.password);
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
            await admin.login(ADMIN_CREDS.username, ADMIN_CREDS.password);
            await expect(page).toHaveURL(/.*\/dashboard/);
        });

        // Step 2: Create Product
        await allure.step('Step 2: Create new product', async () => {
            const product: IProduct = {
                name: productName,
                price: 123.45,
                status: 'PUBLISHED',
                description: 'Test product description',
                category: 'Test Category',
                sku: `SKU-${Date.now()}`,
                stock: 100
            };

            productId = await admin.createProduct(product);
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
            await admin.verifyProductInFrontOffice(productId);
        });
    });

    /**
     * @test Product status management
     * @description Verifies product status changes are reflected correctly
     */
    test('should manage product status correctly @admin @ui', async ({ page }) => {
        await allure.step('Create draft product', async () => {
            await admin.login(ADMIN_CREDS.username, ADMIN_CREDS.password);
            const product: IProduct = {
                name: productName,
                price: 123.45,
                status: 'DRAFT'
            };
            productId = await admin.createProduct(product);
        });

        await allure.step('Verify draft not visible in front-office', async () => {
            await page.goto(`${FRONT_URL}/product/${productId}`);
            await expect(page.locator('[data-testid="product-not-found"]')).toBeVisible();
        });

        await allure.step('Publish product', async () => {
            await admin.updateProduct(productId, { status: 'PUBLISHED' });
        });

        await allure.step('Verify published product visible in front-office', async () => {
            await admin.verifyProductInFrontOffice(productId);
        });
    });

    /**
     * @test Product price validation
     * @description Ensures proper price formatting and validation
     */
    test('should validate product price format @admin @ui', async ({ page }) => {
        await admin.login(ADMIN_CREDS.username, ADMIN_CREDS.password);

        await allure.step('Attempt to create product with invalid price', async () => {
            await admin.navigateToProducts();
            await admin.createProduct({
                name: productName,
                price: 0,
                status: 'DRAFT',
                description: 'Test product description',
                category: 'Test Category',
                sku: `SKU-${Date.now()}`,
                stock: 100
            });

            const error = page.locator('[data-testid="price-error"]');
            await expect(error).toBeVisible();
            await expect(error).toHaveText('Please enter a valid price');
        });

        await allure.step('Create product with valid price', async () => {
            await admin.updateProduct(productId, { price: 123.45 });
            await admin.saveProduct();
            await page.waitForSelector('[data-testid="toast-success"]');
        });
    });

    /**
     * @test Product update workflow
     * @description Tests the complete product update flow
     */
    test('should update existing product @admin @ui', async ({ page }) => {
        // Create initial product
        await admin.login(ADMIN_CREDS.username, ADMIN_CREDS.password);
        const initialProduct: IProduct = {
            name: productName,
            price: 123.45,
            status: 'PUBLISHED',
            description: 'Initial description',
            category: 'Initial Category',
            sku: `SKU-${Date.now()}`,
            stock: 100
        };
        productId = await admin.createProduct(initialProduct);

        // Update product
        const updates: Partial<IProduct> = {
            name: `${productName} Updated`,
            price: 234.56,
            description: 'Updated description',
            category: 'Updated Category',
            stock: 200
        };

        await admin.updateProduct(productId, updates);

        // Verify updates via API
        const updatedProducts = await api.getProductByName(updates.name!);
        expect(updatedProducts).toHaveLength(1);
        expect(updatedProducts[0]).toMatchObject(updates);

        // Verify updates in front-office
        await admin.verifyProductInFrontOffice(productId);
    });

    test('should delete a product', async ({ page }) => {
        await allure.step('Delete product', async () => {
            // Create test product first
            const product: IProduct = {
                name: `Test Product ${uuidv4()}`,
                price: 99.99,
                status: 'DRAFT'
            };

            await admin.navigateToProducts();
            await admin.createProduct(product);

            const products = await api.getProductByName(product.name);
            const productId = products[0].id!;

            // Delete product
            await admin.deleteProduct(productId);

            // Verify deletion
            const deletedProducts = await api.getProductByName(product.name);
            expect(deletedProducts).toHaveLength(0);
        });
    });

    test('should manage user roles', async ({ page }) => {
        await allure.step('Manage user roles', async () => {
            await admin.navigateToUsers();
            await admin.updateUserRole(0, 'editor');
            
            // Verify role update
            const roleText = await page.locator('[data-testid="user-role"]').first().textContent();
            expect(roleText).toBe('editor');
        });
    });

    test('should handle order status updates', async ({ page }) => {
        await allure.step('Update order status', async () => {
            await admin.navigateToOrders();
            await admin.updateOrderStatus(0, 'shipped');
            
            // Verify status update
            const statusText = await page.locator('[data-testid="order-status"]').first().textContent();
            expect(statusText).toBe('shipped');
        });
    });
});

// Output completion message
 
