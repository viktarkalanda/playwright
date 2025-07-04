import { Page, Locator } from '@playwright/test';

/**
 * Product interface for admin operations
 */
interface AdminProduct {
    name: string;
    price: number;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    description?: string;
}

/**
 * AdminPage represents the back-office administration interface.
 * Provides access to product management, order processing, and system configuration.
 * 
 * Key Features:
 * - Product CRUD operations
 * - Order management
 * - User administration
 * - System settings
 * 
 * @example
 * ```typescript
 * const admin = new AdminPage(page);
 * await admin.login(username, password);
 * await admin.navigateToProducts();
 * await admin.createProduct({ name: 'New Product', price: 99.99 });
 * ```
 */
export class AdminPage {
    readonly page: Page;

    // Authentication
    readonly usernameInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;

    // Navigation
    readonly sidebar: Locator;
    readonly productsLink: Locator;
    readonly ordersLink: Locator;
    readonly usersLink: Locator;
    readonly settingsLink: Locator;

    // Product Management
    readonly productList: Locator;
    readonly addProductButton: Locator;
    readonly productNameInput: Locator;
    readonly productPriceInput: Locator;
    readonly productDescriptionInput: Locator;
    readonly productStatusSelect: Locator;
    readonly saveProductButton: Locator;
    readonly deleteProductButton: Locator;
    readonly priceError: Locator;

    // Order Management
    readonly orderList: Locator;
    readonly orderStatusSelect: Locator;
    readonly updateOrderButton: Locator;

    // User Management
    readonly userList: Locator;
    readonly userRoleSelect: Locator;
    readonly blockUserButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Authentication
        this.usernameInput = page.locator('#admin-username');
        this.passwordInput = page.locator('#admin-password');
        this.loginButton = page.locator('#admin-login');

        // Navigation
        this.sidebar = page.locator('.admin-sidebar');
        this.productsLink = page.locator('[data-testid="nav-products"]');
        this.ordersLink = page.locator('[data-testid="nav-orders"]');
        this.usersLink = page.locator('[data-testid="nav-users"]');
        this.settingsLink = page.locator('[data-testid="nav-settings"]');

        // Product Management
        this.productList = page.locator('.product-list');
        this.addProductButton = page.locator('[data-testid="add-product"]');
        this.productNameInput = page.locator('#product-name');
        this.productPriceInput = page.locator('#product-price');
        this.productDescriptionInput = page.locator('#product-description');
        this.productStatusSelect = page.locator('#product-status');
        this.saveProductButton = page.locator('[data-testid="save-product"]');
        this.deleteProductButton = page.locator('[data-testid="delete-product"]');
        this.priceError = page.locator('.price-error');

        // Order Management
        this.orderList = page.locator('.order-list');
        this.orderStatusSelect = page.locator('#order-status');
        this.updateOrderButton = page.locator('[data-testid="update-order"]');

        // User Management
        this.userList = page.locator('.user-list');
        this.userRoleSelect = page.locator('#user-role');
        this.blockUserButton = page.locator('[data-testid="block-user"]');
    }

    /**
     * Logs in to the admin panel
     * @param username - Admin username
     * @param password - Admin password
     */
    async login(username: string, password: string) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    /**
     * Navigates to the products section
     */
    async navigateToProducts() {
        await this.productsLink.click();
        await this.productList.waitFor();
    }

    /**
     * Creates a new product
     * @param product - Product details
     */
    async createProduct(product: AdminProduct) {
        await this.addProductButton.click();
        await this.productNameInput.fill(product.name);
        await this.productPriceInput.fill(product.price.toString());
        if (product.description) {
            await this.productDescriptionInput.fill(product.description);
        }
        if (product.status) {
            await this.productStatusSelect.selectOption(product.status);
        }
        await this.saveProductButton.click();
    }

    /**
     * Gets product ID by name
     */
    async getProductIdByName(name: string): Promise<string> {
        const product = await this.page.locator(`[data-testid="product-row"]:has-text("${name}")`);
        const id = await product.getAttribute('data-product-id');
        if (!id) throw new Error(`Product with name ${name} not found`);
        return id;
    }

    /**
     * Updates product status
     */
    async updateProductStatus(name: string, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
        const product = await this.page.locator(`[data-testid="product-row"]:has-text("${name}")`).click();
        await this.productStatusSelect.selectOption(status);
        await this.saveProductButton.click();
    }

    /**
     * Gets current product status
     */
    async getProductStatus(name: string): Promise<string> {
        const product = await this.page.locator(`[data-testid="product-row"]:has-text("${name}")`).click();
        return this.productStatusSelect.inputValue();
    }

    /**
     * Updates an existing product
     * @param index - Product index in the list
     * @param product - Updated product details
     */
    async updateProduct(index: number, product: Partial<AdminProduct>) {
        await this.productList.nth(index).click();
        if (product.name) {
            await this.productNameInput.fill(product.name);
        }
        if (product.price) {
            await this.productPriceInput.fill(product.price.toString());
        }
        if (product.description) {
            await this.productDescriptionInput.fill(product.description);
        }
        if (product.status) {
            await this.productStatusSelect.selectOption(product.status);
        }
        await this.saveProductButton.click();
    }

    /**
     * Deletes a product
     * @param index - Product index in the list
     */
    async deleteProduct(index: number) {
        await this.productList.nth(index).click();
        await this.deleteProductButton.click();
        await this.page.locator('[data-testid="confirm-delete"]').click();
    }

    /**
     * Updates order status
     * @param index - Order index in the list
     * @param status - New order status
     */
    async updateOrderStatus(index: number, status: string) {
        await this.orderList.nth(index).click();
        await this.orderStatusSelect.selectOption(status);
        await this.updateOrderButton.click();
    }

    /**
     * Updates user role
     * @param index - User index in the list
     * @param role - New user role
     */
    async updateUserRole(index: number, role: string) {
        await this.userList.nth(index).click();
        await this.userRoleSelect.selectOption(role);
        await this.page.locator('[data-testid="save-user"]').click();
    }

    /**
     * Blocks/unblocks a user
     * @param index - User index in the list
     * @param block - Whether to block or unblock
     */
    async toggleUserBlock(index: number, block: boolean) {
        await this.userList.nth(index).click();
        await this.blockUserButton.click();
        await this.page.locator('[data-testid="confirm-block"]').click();
    }
} 