/**
 * Shopping Cart Test Suite
 * ======================
 * 
 * This comprehensive test suite validates the shopping cart functionality,
 * covering the entire cart workflow from adding products to checkout:
 * 
 * Key Features Tested:
 * - Adding products to cart with quantity selection
 * - Cart popup notifications
 * - Cart page navigation and display
 * - Quantity updates with price recalculation
 * - Coupon code application and discount calculation
 * - Cart item removal and empty state handling
 * 
 * The tests follow a narrative flow that mimics real user shopping behavior,
 * ensuring all critical cart operations work as expected.
 * 
 * @author QA Team
 * @category UI Tests
 * @subcategory Shopping Cart
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
 * Utility function to calculate discount
 * @param amount - Original amount
 * @param percentage - Discount percentage
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

test.describe('Shopping Cart Tests @cart', () => {
    let homePage: HomePage;
    let productPage: ProductPage;
    let cartPage: CartPage;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        productPage = new ProductPage(page);
        cartPage = new CartPage(page);
    });

    /**
     * Main test case covering the complete cart workflow
     * Uses soft assertions to collect all possible failures
     */
    test('should handle complete cart workflow correctly', async ({ page }) => {
        // Step 1: Add product to cart and verify popup
        await test.step('Add to cart and verify popup', async () => {
            // Navigate to product page
            await page.goto('/product/1');
            await expect.soft(page).toHaveURL('/product/1');

            // Get initial price for later comparison
            const priceElement = page.locator(selectors.product.price);
            const initialPrice = await extractPrice(await priceElement.textContent() || '0');

            // Add to cart
            await page.locator(selectors.product.addToCart).click();

            // Verify popup
            const popup = page.locator(selectors.popup.container);
            await expect.soft(popup).toBeVisible();
            await expect.soft(page.locator(selectors.popup.message))
                .toContainText('Added to cart');

            // Store price for later calculations
            test.info().annotations.push({
                type: 'Price',
                description: initialPrice.toString()
            });
        });

        // Step 2: Navigate to cart and update quantity
        await test.step('Update cart quantity', async () => {
            // Navigate to cart
            await page.goto('/cart');
            await expect.soft(page).toHaveURL('/cart');

            // Get initial subtotal
            const subtotalElement = page.locator(selectors.cart.totals.subtotal);
            const initialSubtotal = await extractPrice(await subtotalElement.textContent() || '0');

            // Update quantity to 3
            const quantityInput = page.locator(selectors.cart.items.quantity);
            await quantityInput.fill('3');
            await quantityInput.press('Enter');

            // Wait for totals update
            await waitForTotalsUpdate(page);

            // Verify subtotal updated correctly
            const updatedSubtotal = await extractPrice(await subtotalElement.textContent() || '0');
            await expect.soft(formatPrice(updatedSubtotal))
                .toBe(formatPrice(initialSubtotal * 3));
        });

        // Step 3: Apply coupon and verify discount
        await test.step('Apply coupon and verify discount', async () => {
            // Get total before discount
            const totalElement = page.locator(selectors.cart.totals.total);
            const initialTotal = await extractPrice(await totalElement.textContent() || '0');

            // Apply TEST10 coupon
            await page.locator(selectors.cart.coupon.input).fill('TEST10');
            await page.locator(selectors.cart.coupon.apply).click();

            // Wait for totals update
            await waitForTotalsUpdate(page);

            // Verify discount applied
            const discountElement = page.locator(selectors.cart.totals.discount);
            await expect.soft(discountElement).toBeVisible();

            // Verify total reduced by 10%
            const expectedTotal = initialTotal - calculateDiscount(initialTotal, 10);
            const updatedTotal = await extractPrice(await totalElement.textContent() || '0');
            await expect.soft(formatPrice(updatedTotal))
                .toBe(formatPrice(expectedTotal));
        });

        // Step 4: Remove item and verify empty cart
        await test.step('Remove item and verify empty cart', async () => {
            // Remove item
            await page.locator(selectors.cart.items.remove).click();

            // Wait for cart update
            await page.waitForResponse(response => 
                response.url().includes('/api/cart/remove') && 
                response.status() === 200
            );

            // Verify empty cart message
            const emptyMessage = page.locator(selectors.cart.emptyMessage);
            await expect.soft(emptyMessage).toBeVisible();
            await expect.soft(emptyMessage)
                .toContainText('Your cart is empty');

            // Verify totals are not visible
            await expect.soft(page.locator(selectors.cart.totals.subtotal))
                .not.toBeVisible();
        });
    });

    /**
     * Additional test for cart persistence
     */
    test('should persist cart state after page reload @cart', async ({ page }) => {
        // Add product and navigate to cart
        await page.goto('/product/1');
        await page.locator(selectors.product.addToCart).click();
        await page.goto('/cart');

        // Get initial cart state
        const initialQuantity = await page.locator(selectors.cart.items.quantity)
            .inputValue();

        // Reload page
        await page.reload();

        // Verify cart state persisted
        await expect.soft(page.locator(selectors.cart.items.quantity))
            .toHaveValue(initialQuantity);
    });
}); 