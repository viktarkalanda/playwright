import { Page, Locator } from '@playwright/test';

/**
 * CartPage represents the shopping cart view.
 * It contains the list of items, quantity controls, and checkout options.
 * 
 * @example
 * ```typescript
 * const cartPage = new CartPage(page);
 * await cartPage.updateQuantity(1, 2);
 * await cartPage.proceedToCheckout();
 * ```
 */
export class CartPage {
    readonly page: Page;

    /**
     * Cart items container
     * @example await expect(page.cartItems).toBeVisible()
     */
    readonly cartItems: Locator;

    /**
     * Individual cart item rows
     * @example await page.cartItemRows.first().click()
     */
    readonly cartItemRows: Locator;

    /**
     * Product image in cart row
     * @example await page.productImages.first().click()
     */
    readonly productImages: Locator;

    /**
     * Product titles in cart
     * @example await expect(page.productTitles.first()).toContainText('Wireless Headphones')
     */
    readonly productTitles: Locator;

    /**
     * Product prices in cart
     * @example await expect(page.productPrices.first()).toContainText('$99.99')
     */
    readonly productPrices: Locator;

    /**
     * Quantity input fields
     * @example await page.quantityInputs.first().fill('2')
     */
    readonly quantityInputs: Locator;

    /**
     * Remove item buttons
     * @example await page.removeButtons.first().click()
     */
    readonly removeButtons: Locator;

    /**
     * Save for later buttons
     * @example await page.saveForLaterButtons.first().click()
     */
    readonly saveForLaterButtons: Locator;

    /**
     * Subtotal amount display
     * @example await expect(page.subtotal).toContainText('$199.98')
     */
    readonly subtotal: Locator;

    /**
     * Shipping cost display
     * @example await expect(page.shippingCost).toContainText('$9.99')
     */
    readonly shippingCost: Locator;

    /**
     * Tax amount display
     * @example await expect(page.taxAmount).toContainText('$20.00')
     */
    readonly taxAmount: Locator;

    /**
     * Total amount display
     * @example await expect(page.totalAmount).toContainText('$229.97')
     */
    readonly totalAmount: Locator;

    /**
     * Proceed to checkout button
     * @example await page.checkoutButton.click()
     */
    readonly checkoutButton: Locator;

    /**
     * Continue shopping link
     * @example await page.continueShoppingLink.click()
     */
    readonly continueShoppingLink: Locator;

    /**
     * Promo code input field
     * @example await page.promoCodeInput.fill('SUMMER20')
     */
    readonly promoCodeInput: Locator;

    /**
     * Apply promo code button
     * @example await page.applyPromoButton.click()
     */
    readonly applyPromoButton: Locator;

    /**
     * Gift wrapping option checkbox
     * @example await page.giftWrapCheckbox.check()
     */
    readonly giftWrapCheckbox: Locator;

    /**
     * Gift message textarea
     * @example await page.giftMessageInput.fill('Happy Birthday!')
     */
    readonly giftMessageInput: Locator;

    /**
     * Empty cart message
     * @example await expect(page.emptyCartMessage).toBeVisible()
     */
    readonly emptyCartMessage: Locator;

    /**
     * Cart summary section
     * @example await expect(page.cartSummary).toBeVisible()
     */
    readonly cartSummary: Locator;

    constructor(page: Page) {
        this.page = page;
        this.cartItems = page.locator('#cart-items');
        this.cartItemRows = page.locator('.cart-item');
        this.productImages = page.locator('.cart-item-image');
        this.productTitles = page.locator('.cart-item-title');
        this.productPrices = page.locator('.cart-item-price');
        this.quantityInputs = page.locator('.quantity-input');
        this.removeButtons = page.locator('.remove-item');
        this.saveForLaterButtons = page.locator('.save-for-later');
        this.subtotal = page.locator('#subtotal');
        this.shippingCost = page.locator('#shipping-cost');
        this.taxAmount = page.locator('#tax-amount');
        this.totalAmount = page.locator('#total-amount');
        this.checkoutButton = page.locator('#checkout-button');
        this.continueShoppingLink = page.locator('#continue-shopping');
        this.promoCodeInput = page.locator('#promo-code');
        this.applyPromoButton = page.locator('#apply-promo');
        this.giftWrapCheckbox = page.locator('#gift-wrap');
        this.giftMessageInput = page.locator('#gift-message');
        this.emptyCartMessage = page.locator('#empty-cart-message');
        this.cartSummary = page.locator('#cart-summary');
    }

    /**
     * Updates the quantity of a specific item in the cart
     * @param index - The 0-based index of the item in the cart
     * @param quantity - The new quantity to set
     * 
     * @example
     * ```typescript
     * await cartPage.updateQuantity(0, 2);
     * ```
     */
    async updateQuantity(index: number, quantity: number) {
        await this.quantityInputs.nth(index).fill(quantity.toString());
    }

    /**
     * Removes a specific item from the cart
     * @param index - The 0-based index of the item to remove
     * 
     * @example
     * ```typescript
     * await cartPage.removeItem(0);
     * ```
     */
    async removeItem(index: number) {
        await this.removeButtons.nth(index).click();
    }

    /**
     * Applies a promo code to the cart
     * @param code - The promo code to apply
     * 
     * @example
     * ```typescript
     * await cartPage.applyPromoCode('SUMMER20');
     * ```
     */
    async applyPromoCode(code: string) {
        await this.promoCodeInput.fill(code);
        await this.applyPromoButton.click();
    }

    /**
     * Adds gift wrapping with an optional message
     * @param message - The gift message to include
     * 
     * @example
     * ```typescript
     * await cartPage.addGiftWrapping('Happy Birthday!');
     * ```
     */
    async addGiftWrapping(message?: string) {
        await this.giftWrapCheckbox.check();
        if (message) {
            await this.giftMessageInput.fill(message);
        }
    }

    /**
     * Proceeds to checkout
     * 
     * @example
     * ```typescript
     * await cartPage.proceedToCheckout();
     * ```
     */
    async proceedToCheckout() {
        await this.checkoutButton.click();
    }
} 