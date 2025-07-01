import { Page, Locator } from '@playwright/test';

/**
 * CheckoutPage represents the checkout process pages.
 * It contains shipping address, payment method, and order review sections.
 * 
 * @example
 * ```typescript
 * const checkoutPage = new CheckoutPage(page);
 * await checkoutPage.fillShippingAddress({...});
 * await checkoutPage.selectPaymentMethod('credit-card');
 * await checkoutPage.placeOrder();
 * ```
 */
export class CheckoutPage {
    readonly page: Page;

    /**
     * Email input field
     * @example await page.emailInput.fill('user@example.com')
     */
    readonly emailInput: Locator;

    /**
     * First name input field
     * @example await page.firstNameInput.fill('John')
     */
    readonly firstNameInput: Locator;

    /**
     * Last name input field
     * @example await page.lastNameInput.fill('Doe')
     */
    readonly lastNameInput: Locator;

    /**
     * Street address input field
     * @example await page.addressInput.fill('123 Main St')
     */
    readonly addressInput: Locator;

    /**
     * Apartment/Suite input field
     * @example await page.apartmentInput.fill('Apt 4B')
     */
    readonly apartmentInput: Locator;

    /**
     * City input field
     * @example await page.cityInput.fill('New York')
     */
    readonly cityInput: Locator;

    /**
     * State/Province select dropdown
     * @example await page.stateSelect.selectOption('NY')
     */
    readonly stateSelect: Locator;

    /**
     * ZIP/Postal code input field
     * @example await page.zipInput.fill('10001')
     */
    readonly zipInput: Locator;

    /**
     * Phone number input field
     * @example await page.phoneInput.fill('555-0123')
     */
    readonly phoneInput: Locator;

    /**
     * Save address checkbox
     * @example await page.saveAddressCheckbox.check()
     */
    readonly saveAddressCheckbox: Locator;

    /**
     * Credit card number input field
     * @example await page.cardNumberInput.fill('4111111111111111')
     */
    readonly cardNumberInput: Locator;

    /**
     * Card expiry date input field
     * @example await page.cardExpiryInput.fill('12/25')
     */
    readonly cardExpiryInput: Locator;

    /**
     * Card CVV input field
     * @example await page.cardCvvInput.fill('123')
     */
    readonly cardCvvInput: Locator;

    /**
     * PayPal payment option radio button
     * @example await page.paypalRadio.check()
     */
    readonly paypalRadio: Locator;

    /**
     * Credit card payment option radio button
     * @example await page.creditCardRadio.check()
     */
    readonly creditCardRadio: Locator;

    /**
     * Billing same as shipping checkbox
     * @example await page.billingSameCheckbox.check()
     */
    readonly billingSameCheckbox: Locator;

    /**
     * Order summary section
     * @example await expect(page.orderSummary).toBeVisible()
     */
    readonly orderSummary: Locator;

    /**
     * Place order button
     * @example await page.placeOrderButton.click()
     */
    readonly placeOrderButton: Locator;

    /**
     * Order confirmation message
     * @example await expect(page.confirmationMessage).toHaveText('Thank you for your order')
     */
    readonly confirmationMessage: Locator;

    /**
     * Order number display
     * @example await expect(page.orderNumber).toBeVisible()
     */
    readonly orderNumber: Locator;

    constructor(page: Page) {
        this.page = page;
        this.emailInput = page.locator('#email');
        this.firstNameInput = page.locator('#first-name');
        this.lastNameInput = page.locator('#last-name');
        this.addressInput = page.locator('#street-address');
        this.apartmentInput = page.locator('#apartment');
        this.cityInput = page.locator('#city');
        this.stateSelect = page.locator('#state');
        this.zipInput = page.locator('#zip');
        this.phoneInput = page.locator('#phone');
        this.saveAddressCheckbox = page.locator('#save-address');
        this.cardNumberInput = page.locator('#card-number');
        this.cardExpiryInput = page.locator('#card-expiry');
        this.cardCvvInput = page.locator('#card-cvv');
        this.paypalRadio = page.locator('#paypal-payment');
        this.creditCardRadio = page.locator('#credit-card-payment');
        this.billingSameCheckbox = page.locator('#billing-same');
        this.orderSummary = page.locator('#order-summary');
        this.placeOrderButton = page.locator('[data-testid="pay-now"]');
        this.confirmationMessage = page.locator('#confirmation-message');
        this.orderNumber = page.locator('#order-number');
    }

    /**
     * Fills in the shipping address form
     * @param address - Address details object
     * 
     * @example
     * ```typescript
     * await checkoutPage.fillShippingAddress({
     *   firstName: 'John',
     *   lastName: 'Doe',
     *   email: 'john@example.com',
     *   address: '123 Main St',
     *   city: 'New York',
     *   state: 'NY',
     *   zip: '10001',
     *   phone: '555-0123'
     * });
     * ```
     */
    async fillShippingAddress(address: {
        firstName: string;
        lastName: string;
        email: string;
        address: string;
        city: string;
        state: string;
        zip: string;
        phone: string;
        apartment?: string;
    }) {
        await this.emailInput.fill(address.email);
        await this.firstNameInput.fill(address.firstName);
        await this.lastNameInput.fill(address.lastName);
        await this.addressInput.fill(address.address);
        if (address.apartment) {
            await this.apartmentInput.fill(address.apartment);
        }
        await this.cityInput.fill(address.city);
        await this.stateSelect.selectOption(address.state);
        await this.zipInput.fill(address.zip);
        await this.phoneInput.fill(address.phone);
    }

    /**
     * Fills in credit card payment details
     * @param card - Card details object
     * 
     * @example
     * ```typescript
     * await checkoutPage.fillPaymentDetails({
     *   number: '4111111111111111',
     *   expiry: '12/25',
     *   cvv: '123'
     * });
     * ```
     */
    async fillPaymentDetails(card: {
        number: string;
        expiry: string;
        cvv: string;
    }) {
        await this.creditCardRadio.check();
        await this.cardNumberInput.fill(card.number);
        await this.cardExpiryInput.fill(card.expiry);
        await this.cardCvvInput.fill(card.cvv);
    }

    /**
     * Selects PayPal as the payment method
     * 
     * @example
     * ```typescript
     * await checkoutPage.selectPayPal();
     * ```
     */
    async selectPayPal() {
        await this.paypalRadio.check();
    }

    /**
     * Places the order and waits for confirmation
     * 
     * @example
     * ```typescript
     * await checkoutPage.placeOrder();
     * ```
     */
    async placeOrder() {
        await this.placeOrderButton.click();
        await this.confirmationMessage.waitFor();
    }

    /**
     * Gets the order number from the confirmation page
     * @returns The order number string
     * 
     * @example
     * ```typescript
     * const orderNumber = await checkoutPage.getOrderNumber();
     * ```
     */
    async getOrderNumber(): Promise<string> {
        const text = await this.orderNumber.textContent();
        return text?.trim() || '';
    }
} 