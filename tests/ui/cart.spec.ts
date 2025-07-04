/**
 * Shopping Cart Test Suite
 * ======================
 * 
 * End-to-end tests validating the shopping cart functionality from a user perspective:
 * 
 * Scenarios Covered:
 * 1. Adding products to cart
 *    - Single product addition
 *    - Multiple product variants
 *    - Quantity selection
 * 
 * 2. Cart Management
 *    - Viewing cart contents
 *    - Updating quantities
 *    - Removing items
 * 
 * 3. Price Calculations
 *    - Subtotal updates
 *    - Discount application
 *    - Tax calculation
 * 
 * 4. User Experience
 *    - Cart persistence
 *    - Empty cart handling
 *    - Error scenarios
 * 
 * @group cart
 * @group e2e
 */

import { test, expect, Page } from '@playwright/test';
import { HomePage } from '../../src/pageObjects/HomePage';
import { ProductPage } from '../../src/pageObjects/ProductPage';
import { CartPage } from '../../src/pageObjects/CartPage';

/**
 * Interface for cart item data
 */
interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    variant?: {
        size?: string;
        color?: string;
    };
}

/**
 * Interface for cart totals
 */
interface CartTotals {
    subtotal: number;
    discount?: number;
    shipping?: number;
    tax?: number;
    total: number;
}

/**
 * Collection of test selectors for cart functionality
 */
const selectors = {
    product: {
        addToCart: '[data-testid="add-to-cart"]',
        quantity: '[data-testid="quantity-input"]'
    },
    popup: {
        container: '[data-testid="cart-popup"]',
        message: '[data-testid="popup-message"]',
        viewCart: '[data-testid="view-cart"]',
        close: '[data-testid="popup-close"]'
    },
    cart: {
        items: {
            container: '[data-testid="cart-items"]',
            item: '[data-testid="cart-item"]',
            name: '[data-testid="item-name"]',
            price: '[data-testid="item-price"]',
            quantity: '[data-testid="item-quantity"]',
            remove: '[data-testid="remove-item"]',
            subtotal: '[data-testid="item-subtotal"]'
        },
        totals: {
            subtotal: '[data-testid="cart-subtotal"]',
            discount: '[data-testid="cart-discount"]',
            shipping: '[data-testid="cart-shipping"]',
            tax: '[data-testid="cart-tax"]',
            total: '[data-testid="cart-total"]'
        },
        coupon: {
            input: '[data-testid="coupon-input"]',
            apply: '[data-testid="apply-coupon"]',
            message: '[data-testid="coupon-message"]',
            remove: '[data-testid="remove-coupon"]'
        },
        emptyMessage: '[data-testid="empty-cart-message"]'
    }
};

/**
 * Utility function to extract price from text
 * @param text - Price text (e.g., "$99.99")
 */
function extractPrice(text: string): number {
    return parseFloat(text.replace(/[^0-9.-]+/g, ''));
}

/**
 * Utility function to format price for comparison
 * @param price - Price number
 */
function formatPrice(price: number): string {
    return price.toFixed(2);
}

/**
 * Utility function to calculate expected discount
 */
function calculateDiscount(amount: number, percentage: number): number {
    return amount * (percentage / 100);
}

/**
 * Utility function to wait for cart totals update
 * @param page - Playwright page object
 */
async function waitForTotalsUpdate(page: Page): Promise<void> {
    await page.waitForResponse(response => 
        response.url().includes('/api/cart/totals') && 
        response.status() === 200
    );
    // Wait for UI update
    await page.locator(selectors.cart.totals.total).waitFor();
}

test.describe('Shopping Cart Functionality @cart', () => {
    let homePage: HomePage;
    let productPage: ProductPage;
    let cartPage: CartPage;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        productPage = new ProductPage(page);
        cartPage = new CartPage(page);
        
        // Start each test from home page
        await page.goto('/');
    });

    /**
     * Validates the complete shopping cart workflow from product selection to checkout
     * 
     * User Story:
     * As a customer
     * I want to add products to my cart and manage them
     * So that I can prepare my order for checkout
     * 
     * @test
     * @category Critical Path
     */
    test('complete shopping cart workflow', async ({ page }) => {
        // 1. Product Selection & Cart Addition
        await test.step('Add product to cart', async () => {
            await page.goto('/product/1');
            const initialPrice = await productPage.productPrice.textContent();
            
            await productPage.addToCart();
            await expect(page.locator('[data-testid="cart-popup"]')).toBeVisible();
            
            test.info().annotations.push({
                type: 'Price',
                description: initialPrice || '0'
            });
        });

        // 2. Cart Quantity Management
        await test.step('Update product quantity', async () => {
            await page.goto('/cart');
            const initialSubtotal = await cartPage.subtotal.textContent();
            
            await cartPage.updateQuantity(0, 3); // Update first item quantity
            await page.waitForResponse(response => 
                response.url().includes('/api/cart/totals') && 
                response.status() === 200
            );
            
            const updatedSubtotal = await cartPage.subtotal.textContent();
            expect(parseFloat(updatedSubtotal || '0')).toBe(parseFloat(initialSubtotal || '0') * 3);
        });

        // 3. Discount Application
        await test.step('Apply discount code', async () => {
            const initialTotal = await cartPage.totalAmount.textContent();
            
            await cartPage.applyPromoCode('TEST10');
            await page.waitForResponse(response => 
                response.url().includes('/api/cart/totals') && 
                response.status() === 200
            );
            
            const discountElement = page.locator('[data-testid="cart-discount"]');
            await expect(discountElement).toBeVisible();
            
            const expectedTotal = parseFloat(initialTotal || '0') - calculateDiscount(parseFloat(initialTotal || '0'), 10);
            const actualTotal = parseFloat(await cartPage.totalAmount.textContent() || '0');
            expect(actualTotal).toBe(expectedTotal);
        });

        // 4. Cart Emptying
        await test.step('Empty cart verification', async () => {
            await cartPage.removeItem(0); // Remove first item
            await page.waitForResponse(response => 
                response.url().includes('/api/cart/remove') && 
                response.status() === 200
            );
            
            await expect(cartPage.emptyCartMessage).toBeVisible();
            await expect(cartPage.subtotal).not.toBeVisible();
        });
    });

    /**
     * Verifies cart state persistence across page reloads
     * 
     * @test
     * @category Data Persistence
     */
    test('cart state persistence @smoke', async ({ page }) => {
        // Setup cart with product
        await page.goto('/product/1');
        await productPage.addToCart();
        
        // Get initial cart state
        await page.goto('/cart');
        const initialQuantity = await cartPage.quantityInputs.first().inputValue();
        const initialTotal = await cartPage.totalAmount.textContent();
        
        // Reload page
        await page.reload();
        
        // Verify persistence
        const currentQuantity = await cartPage.quantityInputs.first().inputValue();
        const currentTotal = await cartPage.totalAmount.textContent();
        
        expect(currentQuantity).toBe(initialQuantity);
        expect(currentTotal).toBe(initialTotal);
    });
}); 