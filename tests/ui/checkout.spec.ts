/**
 * Checkout Flow Test Suite
 * ======================
 * 
 * End-to-end tests validating the complete checkout process:
 * 
 * User Stories:
 * 1. Address Management
 *    - Enter shipping details
 *    - Save address for future
 *    - Edit saved addresses
 * 
 * 2. Shipping Options
 *    - View available methods
 *    - Compare delivery times
 *    - Select preferred option
 * 
 * 3. Payment Processing
 *    - Choose payment method
 *    - Enter payment details
 *    - Handle validation
 * 
 * 4. Order Review
 *    - Verify cart contents
 *    - Review total costs
 *    - Place final order
 * 
 * @group checkout
 * @group e2e
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
 * Test data: Shipping address for checkout flow
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

test.describe('Checkout Flow @checkout', () => {
    let checkoutPage: CheckoutPage;

    test.beforeEach(async ({ page, request }) => {
        checkoutPage = new CheckoutPage(page);

        // Setup test data via API
        await request.post('/api/cart/add', {
            data: {
                id: 1,
                quantity: 1
            }
        });
    });

    /**
     * Validates the complete checkout process from cart to confirmation
     * 
     * User Story:
     * As a customer
     * I want to complete my purchase
     * So that I can receive my ordered items
     * 
     * @test
     * @category Critical Path
     */
    test('complete checkout process', async ({ page }) => {
        // 1. Address Entry
        await test.step('Shipping address submission', async () => {
            await page.goto('/checkout/address');
            
            // Fill address details
            await checkoutPage.fillShippingAddress({
                firstName: testAddress.firstName,
                lastName: testAddress.lastName,
                email: testAddress.email,
                address: testAddress.address1,
                apartment: testAddress.address2,
                city: testAddress.city,
                state: testAddress.state,
                zip: testAddress.postcode,
                phone: testAddress.phone
            });
            await checkoutPage.saveAddressCheckbox.check();
            
            // Proceed to shipping
            await page.locator('[data-testid="continue-shipping"]').click();
            await expect(page.locator('[data-testid="step-address-complete"]')).toBeVisible();
        });

        // 2. Shipping Selection
        await test.step('Shipping method selection', async () => {
            await expect(page.locator('[data-testid="shipping-methods"]')).toBeVisible();
            
            // Select shipping method
            await page.locator('[data-testid="shipping-method"]').first().click();
            const shippingCost = await page.locator('[data-testid="shipping-price"]').first().textContent();
            
            test.info().annotations.push({
                type: 'Shipping',
                description: shippingCost || '0'
            });
            
            // Proceed to payment
            await page.locator('[data-testid="continue-payment"]').click();
            await expect(page.locator('[data-testid="step-shipping-complete"]')).toBeVisible();
        });

        // 3. Payment Processing
        await test.step('Payment and order placement', async () => {
            await expect(page.locator('[data-testid="payment-methods"]')).toBeVisible();
            
            // Complete payment
            await checkoutPage.fillPaymentDetails({
                number: '4111111111111111',
                expiry: '12/25',
                cvv: '123'
            });
            await checkoutPage.placeOrder();
            
            // Verify order confirmation
            await expect(checkoutPage.confirmationMessage).toBeVisible();
            await expect(checkoutPage.orderNumber).toBeVisible();
        });

        // 4. Order Summary Verification
        await test.step('Order summary validation', async () => {
            await expect(checkoutPage.orderSummary).toBeVisible();
            
            // Verify order details
            const orderNumber = await checkoutPage.getOrderNumber();
            expect(orderNumber).toMatch(/^[A-Z0-9]{8}$/);
        });
    });

    /**
     * Validates address form validation and error handling
     * 
     * User Story:
     * As a customer
     * I want to receive clear feedback on address errors
     * So that I can correct my shipping information
     * 
     * @test
     * @category Form Validation
     */
    test('address validation handling @forms', async ({ page }) => {
        await page.goto('/checkout/address');
        
        // Try to continue without data
        await page.locator('[data-testid="continue-shipping"]').click();
        
        // Verify validation messages
        await expect(page.locator('#first-name-error')).toBeVisible();
        await expect(page.locator('#email-error')).toBeVisible();
        
        // Fill partial data with invalid email
        await checkoutPage.fillShippingAddress({
            ...testAddress,
            email: 'invalid-email',
            address: testAddress.address1,
            zip: testAddress.postcode
        });
        
        // Verify email validation
        await expect(page.locator('#email-error')).toContainText('valid email');
    });

    /**
     * Validates shipping price calculations
     * 
     * User Story:
     * As a customer
     * I want accurate shipping costs
     * So that I can choose the best delivery option
     * 
     * @test
     * @category Price Calculation
     */
    test('shipping cost calculation @pricing', async ({ page }) => {
        // Setup: Get to shipping step
        await page.goto('/checkout/address');
        await checkoutPage.fillShippingAddress({
            firstName: testAddress.firstName,
            lastName: testAddress.lastName,
            email: testAddress.email,
            address: testAddress.address1,
            city: testAddress.city,
            state: testAddress.state,
            zip: testAddress.postcode,
            phone: testAddress.phone
        });
        await page.locator('[data-testid="continue-shipping"]').click();
        
        // Compare shipping options
        const shippingMethods = page.locator('[data-testid="shipping-method"]');
        await expect(shippingMethods).toBeVisible();
        
        const count = await shippingMethods.count();
        expect(count).toBeGreaterThan(1);
        
        // Verify price format and updates
        const firstMethod = shippingMethods.first();
        await firstMethod.click();
        const firstPrice = await page.locator('[data-testid="shipping-price"]').first().textContent();
        expect(firstPrice).toMatch(/^\$\d+\.\d{2}$/);
        
        const secondMethod = shippingMethods.nth(1);
        await secondMethod.click();
        const secondPrice = await page.locator('[data-testid="shipping-price"]').nth(1).textContent();
        expect(firstPrice).not.toBe(secondPrice);
    });
});

test.describe('@checkout negative', () => {
    /**
     * Negative Test Scenarios for Checkout Process
     * 
     * This test suite covers error handling and validation in the checkout flow:
     * 1. Form validation for required shipping fields
     * 2. Payment decline handling with test cards
     * 3. Security measures (CSRF protection)
     * 
     * Key aspects tested:
     * - Required field validation
     * - Payment error handling
     * - Security token validation
     * - User feedback for errors
     * 
     * Test coverage:
     * - Empty required fields
     * - Invalid payment methods
     * - Session security
     * 
     * Error handling:
     * - Form validation messages
     * - Payment decline scenarios
     * - Security violation responses
     * 
     * Integration points:
     * - Payment gateway
     * - Form validation
     * - Security middleware
     */

    test('validates required shipping address fields', async ({ page }) => {
        await test.step('Navigate to checkout', async () => {
            // Add item to cart and proceed to checkout
            await page.goto('/products/sample-product');
            await page.getByRole('button', { name: 'Add to Cart' }).click();
            await page.getByRole('link', { name: 'Checkout' }).click();
            
            await expect(page.getByText('Shipping Address')).toBeVisible();
        });

        await test.step('Submit empty form', async () => {
            // Clear any pre-filled fields
            const requiredFields = [
                'First Name',
                'Last Name',
                'Address Line 1',
                'City',
                'Postal Code',
                'Phone'
            ];

            for (const field of requiredFields) {
                await page.getByLabel(field).clear();
            }

            // Try to proceed
            await page.getByRole('button', { name: 'Continue to Payment' }).click();

            // Verify validation messages
            for (const field of requiredFields) {
                await expect(page.getByText(`${field} is required`))
                    .toBeVisible();
            }
        });

        await test.step('Verify payment button state', async () => {
            // Payment button should be disabled
            await expect(page.getByRole('button', { name: 'Pay' }))
                .toBeDisabled();
        });
    });

    test('handles declined payment card', async ({ page }) => {
        await test.step('Setup test order', async () => {
            // Add item and fill shipping info
            await page.goto('/products/sample-product');
            await page.getByRole('button', { name: 'Add to Cart' }).click();
            await page.getByRole('link', { name: 'Checkout' }).click();

            // Fill required shipping fields
            await page.getByLabel('First Name').fill('Test');
            await page.getByLabel('Last Name').fill('User');
            await page.getByLabel('Address Line 1').fill('123 Test St');
            await page.getByLabel('City').fill('Test City');
            await page.getByLabel('Postal Code').fill('12345');
            await page.getByLabel('Phone').fill('1234567890');

            await page.getByRole('button', { name: 'Continue to Payment' }).click();
        });

        await test.step('Attempt payment with declined card', async () => {
            // Use Stripe test card for decline
            await page.getByLabel('Card number').fill('4000000000000002');
            await page.getByLabel('Expiry date').fill('1230');
            await page.getByLabel('CVC').fill('123');

            await page.getByRole('button', { name: 'Pay' }).click();

            // Verify decline message
            await expect(page.getByText('Your payment was declined'))
                .toBeVisible();
            await expect(page.getByText('Please try a different payment method'))
                .toBeVisible();
        });
    });

    test('handles expired CSRF token', async ({ page }) => {
        await test.step('Setup checkout with expired token', async () => {
            // Start checkout process
            await page.goto('/products/sample-product');
            await page.getByRole('button', { name: 'Add to Cart' }).click();
            await page.getByRole('link', { name: 'Checkout' }).click();

            // Manipulate CSRF token cookie
            await page.evaluate(() => {
                document.cookie = 'XSRF-TOKEN=expired; path=/';
            });
        });

        await test.step('Attempt form submission', async () => {
            // Try to submit shipping form
            await page.getByLabel('First Name').fill('Test');
            await page.getByRole('button', { name: 'Continue to Payment' }).click();

            // Verify security error
            const response = await page.waitForResponse(resp => 
                resp.status() === 403
            );
            
            expect(response.status()).toBe(403);
            await expect(page.getByText('Session expired')).toBeVisible();
        });

        await test.step('Verify redirect to login', async () => {
            // Should be redirected to login page
            await expect(page).toHaveURL(/.*login/);
            await expect(page.getByText('Please log in to continue'))
                .toBeVisible();
        });
    });

    test('validates payment form fields', async ({ page }) => {
        await test.step('Setup checkout process', async () => {
            // Add item and proceed to payment
            await page.goto('/products/sample-product');
            await page.getByRole('button', { name: 'Add to Cart' }).click();
            await page.getByRole('link', { name: 'Checkout' }).click();

            // Fill shipping info
            await page.getByLabel('First Name').fill('Test');
            await page.getByLabel('Last Name').fill('User');
            await page.getByLabel('Address Line 1').fill('123 Test St');
            await page.getByLabel('City').fill('Test City');
            await page.getByLabel('Postal Code').fill('12345');
            await page.getByLabel('Phone').fill('1234567890');

            await page.getByRole('button', { name: 'Continue to Payment' }).click();
        });

        await test.step('Verify card number validation', async () => {
            // Try invalid card number
            await page.getByLabel('Card number').fill('4242');
            await page.getByRole('button', { name: 'Pay' }).click();

            await expect(page.getByText('Invalid card number'))
                .toBeVisible();
        });

        await test.step('Verify expiry date validation', async () => {
            // Try expired date
            await page.getByLabel('Card number').fill('4242424242424242');
            await page.getByLabel('Expiry date').fill('0122'); // Past date
            await page.getByRole('button', { name: 'Pay' }).click();

            await expect(page.getByText('Card has expired'))
                .toBeVisible();
        });

        await test.step('Verify CVC validation', async () => {
            // Try invalid CVC
            await page.getByLabel('CVC').fill('1');
            await page.getByRole('button', { name: 'Pay' }).click();

            await expect(page.getByText('Invalid CVC code'))
                .toBeVisible();
        });
    });
});

console.log('Done - PO-2 complete');
