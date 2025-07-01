/**
 * Checkout Flow Test Suite
 * ======================
 * 
 * This test suite validates the complete checkout process,
 * following the happy path scenario through all checkout steps:
 * 
 * 1. Address Step
 *    - Form validation
 *    - Address saving
 *    - Navigation to shipping
 * 
 * 2. Shipping Step
 *    - Method selection
 *    - Price calculation
 *    - Navigation to payment
 * 
 * 3. Payment Step
 *    - Mock payment processing
 *    - Order confirmation
 * 
 * The suite uses API calls to set up the cart state before each test,
 * ensuring a clean and consistent starting point. All form inputs use
 * realistic but fictional data to avoid any potential real transactions.
 * 
 * @author QA Team
 * @category UI Tests
 * @subcategory Checkout Flow
 */

import { test, expect, Page } from '@playwright/test';
import { CheckoutPage } from '../../src/pageObjects/CheckoutPage';

/**
 * Interface for address form data
 */
interface AddressForm {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
}

/**
 * Interface for shipping method
 */
interface ShippingMethod {
    id: string;
    name: string;
    price: number;
    estimatedDays: string;
}

/**
 * Collection of test selectors for checkout flow
 */
const selectors = {
    address: {
        form: '[data-testid="address-form"]',
        firstName: '[data-testid="address-firstName"]',
        lastName: '[data-testid="address-lastName"]',
        email: '[data-testid="address-email"]',
        phone: '[data-testid="address-phone"]',
        address1: '[data-testid="address-line1"]',
        address2: '[data-testid="address-line2"]',
        city: '[data-testid="address-city"]',
        state: '[data-testid="address-state"]',
        postcode: '[data-testid="address-postcode"]',
        country: '[data-testid="address-country"]',
        saveAddress: '[data-testid="save-address"]',
        continue: '[data-testid="address-continue"]'
    },
    shipping: {
        methods: {
            container: '[data-testid="shipping-methods"]',
            method: '[data-testid="shipping-method"]',
            name: '[data-testid="method-name"]',
            price: '[data-testid="method-price"]',
            estimate: '[data-testid="delivery-estimate"]'
        },
        continue: '[data-testid="shipping-continue"]'
    },
    payment: {
        methods: {
            container: '[data-testid="payment-methods"]',
            method: '[data-testid="payment-method"]'
        },
        mockPay: '[data-testid="mock-payment"]',
        placeOrder: '[data-testid="place-order"]'
    },
    confirmation: {
        container: '[data-testid="order-confirmation"]',
        message: '[data-testid="confirmation-message"]',
        orderNumber: '[data-testid="order-number"]',
        summary: {
            container: '[data-testid="order-summary"]',
            items: '[data-testid="summary-items"]',
            subtotal: '[data-testid="summary-subtotal"]',
            shipping: '[data-testid="summary-shipping"]',
            total: '[data-testid="summary-total"]'
        }
    },
    progress: {
        container: '[data-testid="checkout-progress"]',
        address: '[data-testid="step-address"]',
        shipping: '[data-testid="step-shipping"]',
        payment: '[data-testid="step-payment"]',
        confirmation: '[data-testid="step-confirmation"]'
    }
};

/**
 * Test data for address form
 */
const testAddress: AddressForm = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    address1: '123 Test Street',
    address2: 'Apt 4B',
    city: 'Test City',
    state: 'Test State',
    postcode: '12345',
    country: 'US'
};

/**
 * Utility function to fill address form
 * @param page - Playwright page object
 * @param address - Address form data
 */
async function fillAddressForm(page: Page, address: AddressForm): Promise<void> {
    await page.locator(selectors.address.firstName).fill(address.firstName);
    await page.locator(selectors.address.lastName).fill(address.lastName);
    await page.locator(selectors.address.email).fill(address.email);
    await page.locator(selectors.address.phone).fill(address.phone);
    await page.locator(selectors.address.address1).fill(address.address1);
    if (address.address2) {
        await page.locator(selectors.address.address2).fill(address.address2);
    }
    await page.locator(selectors.address.city).fill(address.city);
    await page.locator(selectors.address.state).fill(address.state);
    await page.locator(selectors.address.postcode).fill(address.postcode);
    await page.locator(selectors.address.country).selectOption(address.country);
}

/**
 * Utility function to wait for step navigation
 * @param page - Playwright page object
 * @param step - Step name
 */
async function waitForStepNavigation(page: Page, step: string): Promise<void> {
    await page.waitForResponse(response => 
        response.url().includes(`/api/checkout/${step}`) && 
        response.status() === 200
    );
    await page.locator(selectors.progress[step]).waitFor({ state: 'visible' });
}

test.describe('Checkout Flow Tests @checkout', () => {
    let checkoutPage: CheckoutPage;

    test.beforeEach(async ({ page, request }) => {
        // Initialize page object
        checkoutPage = new CheckoutPage(page);

        // Add product to cart via API
        await request.post('/api/cart/add', {
            data: {
                id: 1,
                quantity: 1
            }
        });
    });

    /**
     * Main test case for happy path checkout flow
     * Covers complete checkout process from address to confirmation
     */
    test('should complete checkout successfully @checkout', async ({ page }) => {
        // Step 1: Address Form
        await test.step('Fill and submit address form', async () => {
            // Navigate to checkout address step
            await page.goto('/checkout/address');
            await expect.soft(page).toHaveURL('/checkout/address');

            // Fill address form
            await fillAddressForm(page, testAddress);

            // Save address for future use
            await page.locator(selectors.address.saveAddress).check();

            // Continue to shipping
            await page.locator(selectors.address.continue).click();
            await waitForStepNavigation(page, 'shipping');

            // Verify address step completed
            await expect.soft(page.locator(selectors.progress.address))
                .toHaveAttribute('data-status', 'completed');
        });

        // Step 2: Shipping Method
        await test.step('Select shipping method', async () => {
            // Wait for shipping methods to load
            await page.locator(selectors.shipping.methods.container).waitFor();

            // Select first shipping method
            const firstMethod = page.locator(selectors.shipping.methods.method).first();
            await firstMethod.click();

            // Store shipping price for later verification
            const shippingPrice = await page.locator(selectors.shipping.methods.price)
                .first()
                .textContent();
            test.info().annotations.push({
                type: 'Shipping',
                description: shippingPrice || '0'
            });

            // Continue to payment
            await page.locator(selectors.shipping.continue).click();
            await waitForStepNavigation(page, 'payment');

            // Verify shipping step completed
            await expect.soft(page.locator(selectors.progress.shipping))
                .toHaveAttribute('data-status', 'completed');
        });

        // Step 3: Payment and Order Placement
        await test.step('Complete payment and place order', async () => {
            // Wait for payment methods to load
            await page.locator(selectors.payment.methods.container).waitFor();

            // Click mock payment button
            await page.locator(selectors.payment.mockPay).click();

            // Wait for payment processing
            await page.waitForResponse(response => 
                response.url().includes('/api/checkout/payment') && 
                response.status() === 200
            );

            // Place order
            await page.locator(selectors.payment.placeOrder).click();

            // Wait for order confirmation
            await page.waitForResponse(response => 
                response.url().includes('/api/order/create') && 
                response.status() === 200
            );

            // Verify order confirmation
            const confirmationMessage = page.locator(selectors.confirmation.message);
            await expect.soft(confirmationMessage).toBeVisible();
            await expect.soft(confirmationMessage)
                .toContainText('Thank you for your order');

            // Verify order number is displayed
            await expect.soft(page.locator(selectors.confirmation.orderNumber))
                .toBeVisible();

            // Verify order summary
            await expect.soft(page.locator(selectors.confirmation.summary.container))
                .toBeVisible();
        });
    });

    /**
     * Additional test for order summary verification
     */
    test('should display correct order summary @checkout', async ({ page }) => {
        // Complete checkout steps
        await page.goto('/checkout/address');
        await fillAddressForm(page, testAddress);
        await page.locator(selectors.address.continue).click();
        await waitForStepNavigation(page, 'shipping');

        // Get initial subtotal
        const subtotal = await page.locator(selectors.confirmation.summary.subtotal)
            .textContent();

        // Complete remaining steps
        await page.locator(selectors.shipping.methods.method).first().click();
        await page.locator(selectors.shipping.continue).click();
        await page.locator(selectors.payment.mockPay).click();
        await page.locator(selectors.payment.placeOrder).click();

        // Verify final total includes shipping
        const total = await page.locator(selectors.confirmation.summary.total)
            .textContent();
        const shipping = await page.locator(selectors.confirmation.summary.shipping)
            .textContent();

        // Simple verification that total = subtotal + shipping
        const expectedTotal = (parseFloat(subtotal || '0') + parseFloat(shipping || '0'))
            .toFixed(2);
        expect.soft(parseFloat(total || '0').toFixed(2)).toBe(expectedTotal);
    });
});
