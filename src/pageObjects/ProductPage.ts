import { Page, Locator } from '@playwright/test';

/**
 * ProductPage represents the detailed view of a single product.
 * It contains product information, variants, reviews, and purchase options.
 * 
 * @example
 * ```typescript
 * const productPage = new ProductPage(page);
 * await productPage.selectVariant('size', 'L');
 * await productPage.addToCart();
 * ```
 */
export class ProductPage {
    readonly page: Page;

    /**
     * Product title heading
     * @example await expect(page.productTitle).toHaveText('Wireless Headphones')
     */
    readonly productTitle: Locator;

    /**
     * Product main image
     * @example await page.productImage.click()
     */
    readonly productImage: Locator;

    /**
     * Thumbnail image gallery
     * @example await page.imageGallery.nth(1).click()
     */
    readonly imageGallery: Locator;

    /**
     * Product price display
     * @example await expect(page.productPrice).toContainText('$99.99')
     */
    readonly productPrice: Locator;

    /**
     * Original price for discounted items
     * @example await expect(page.originalPrice).toContainText('$129.99')
     */
    readonly originalPrice: Locator;

    /**
     * Discount percentage badge
     * @example await expect(page.discountBadge).toContainText('20% OFF')
     */
    readonly discountBadge: Locator;

    /**
     * Color variant selector
     * @example await page.colorSelect.selectOption('blue')
     */
    readonly colorSelect: Locator;

    /**
     * Size variant selector
     * @example await page.sizeSelect.selectOption('L')
     */
    readonly sizeSelect: Locator;

    /**
     * Quantity input spinner
     * @example await page.quantityInput.fill('2')
     */
    readonly quantityInput: Locator;

    /**
     * Add to cart button
     * @example await page.addToCartButton.click()
     */
    readonly addToCartButton: Locator;

    /**
     * Buy now button for immediate checkout
     * @example await page.buyNowButton.click()
     */
    readonly buyNowButton: Locator;

    /**
     * Wishlist toggle button
     * @example await page.wishlistButton.click()
     */
    readonly wishlistButton: Locator;

    /**
     * Product description tab
     * @example await page.descriptionTab.click()
     */
    readonly descriptionTab: Locator;

    /**
     * Product specifications tab
     * @example await page.specificationsTab.click()
     */
    readonly specificationsTab: Locator;

    /**
     * Product reviews tab
     * @example await page.reviewsTab.click()
     */
    readonly reviewsTab: Locator;

    /**
     * Stock availability status
     * @example await expect(page.stockStatus).toContainText('In Stock')
     */
    readonly stockStatus: Locator;

    /**
     * Shipping information section
     * @example await page.shippingInfo.click()
     */
    readonly shippingInfo: Locator;

    /**
     * Return policy section
     * @example await page.returnPolicy.click()
     */
    readonly returnPolicy: Locator;

    /**
     * Size guide modal trigger
     * @example await page.sizeGuide.click()
     */
    readonly sizeGuide: Locator;

    /**
     * Share product buttons container
     * @example await page.shareButtons.locator('facebook').click()
     */
    readonly shareButtons: Locator;

    constructor(page: Page) {
        this.page = page;
        this.productTitle = page.locator('#product-title');
        this.productImage = page.locator('#main-product-image');
        this.imageGallery = page.locator('.thumbnail-image');
        this.productPrice = page.locator('#product-price');
        this.originalPrice = page.locator('#original-price');
        this.discountBadge = page.locator('#discount-badge');
        this.colorSelect = page.locator('#color-select');
        this.sizeSelect = page.locator('#size-select');
        this.quantityInput = page.locator('#quantity');
        this.addToCartButton = page.locator('[data-testid="add-to-cart"]');
        this.buyNowButton = page.locator('#buy-now');
        this.wishlistButton = page.locator('#wishlist-toggle');
        this.descriptionTab = page.locator('#description-tab');
        this.specificationsTab = page.locator('#specifications-tab');
        this.reviewsTab = page.locator('#reviews-tab');
        this.stockStatus = page.locator('#stock-status');
        this.shippingInfo = page.locator('#shipping-info');
        this.returnPolicy = page.locator('#return-policy');
        this.sizeGuide = page.locator('#size-guide');
        this.shareButtons = page.locator('#share-buttons');
    }

    /**
     * Selects a product variant (color, size, etc.)
     * @param type - Type of variant ('color' or 'size')
     * @param value - Value to select
     * 
     * @example
     * ```typescript
     * await productPage.selectVariant('color', 'blue');
     * await productPage.selectVariant('size', 'L');
     * ```
     */
    async selectVariant(type: 'color' | 'size', value: string) {
        const selector = type === 'color' ? this.colorSelect : this.sizeSelect;
        await selector.selectOption(value);
    }

    /**
     * Adds the current product to cart with specified quantity
     * @param quantity - Number of items to add (default: 1)
     * 
     * @example
     * ```typescript
     * await productPage.addToCart(2);
     * ```
     */
    async addToCart(quantity: number = 1) {
        await this.quantityInput.fill(quantity.toString());
        await this.addToCartButton.click();
    }

    /**
     * Proceeds to immediate checkout with the current product
     * @param quantity - Number of items to buy (default: 1)
     * 
     * @example
     * ```typescript
     * await productPage.buyNow(1);
     * ```
     */
    async buyNow(quantity: number = 1) {
        await this.quantityInput.fill(quantity.toString());
        await this.buyNowButton.click();
    }

    /**
     * Toggles the wishlist status for the current product
     * 
     * @example
     * ```typescript
     * await productPage.toggleWishlist();
     * ```
     */
    async toggleWishlist() {
        await this.wishlistButton.click();
    }

    /**
     * Opens the size guide modal
     * 
     * @example
     * ```typescript
     * await productPage.openSizeGuide();
     * ```
     */
    async openSizeGuide() {
        await this.sizeGuide.click();
    }
} 