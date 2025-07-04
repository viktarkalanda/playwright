import { Page, Locator, expect } from '@playwright/test';

/**
 * WishlistPage represents the wishlist functionality in the e-commerce application.
 * This class provides methods to interact with the wishlist features including:
 * - Adding/removing items
 * - Moving items to cart
 * - Checking wishlist count
 * - Managing wishlist UI elements
 * 
 * @example
 * ```typescript
 * const wishlist = new WishlistPage(page);
 * await wishlist.addItem('product-123');
 * await wishlist.moveToCart(0);
 * const count = await wishlist.count();
 * ```
 */
export class WishlistPage {
    readonly page: Page;

    // Main elements
    readonly wishlistIcon: Locator;
    readonly wishlistCounter: Locator;
    readonly wishlistItems: Locator;
    readonly emptyMessage: Locator;

    // Item-specific elements
    readonly removeButtons: Locator;
    readonly moveToCartButtons: Locator;
    readonly itemNames: Locator;
    readonly itemPrices: Locator;

    // Cart elements
    readonly cartIcon: Locator;
    readonly cartCounter: Locator;

    /**
     * Creates an instance of WishlistPage
     * @param page - Playwright page object
     */
    constructor(page: Page) {
        this.page = page;

        // Main elements
        this.wishlistIcon = page.locator('[data-testid="wishlist-icon"]');
        this.wishlistCounter = page.locator('[data-testid="wishlist-count"]');
        this.wishlistItems = page.locator('[data-testid="wishlist-item"]');
        this.emptyMessage = page.locator('[data-testid="wishlist-empty"]');

        // Item-specific elements
        this.removeButtons = page.locator('[data-testid="remove-from-wishlist"]');
        this.moveToCartButtons = page.locator('[data-testid="move-to-cart"]');
        this.itemNames = page.locator('[data-testid="wishlist-item-name"]');
        this.itemPrices = page.locator('[data-testid="wishlist-item-price"]');

        // Cart elements
        this.cartIcon = page.locator('[data-testid="cart-icon"]');
        this.cartCounter = page.locator('[data-testid="cart-count"]');
    }

    /**
     * Opens the wishlist page
     * @returns Promise that resolves when navigation is complete
     */
    async open(): Promise<void> {
        await this.page.goto('/wishlist');
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Adds an item to the wishlist
     * @param productId - ID of the product to add
     * @returns Promise that resolves when item is added
     * @throws Error if product is already in wishlist
     */
    async addItem(productId: string): Promise<void> {
        // Navigate to product page
        await this.page.goto(`/products/${productId}`);
        
        // Find and click add to wishlist button
        const addButton = this.page.locator('[data-testid="add-to-wishlist"]');
        
        // Verify item is not already in wishlist
        const isInWishlist = await addButton.getAttribute('data-in-wishlist');
        if (isInWishlist === 'true') {
            throw new Error(`Product ${productId} is already in wishlist`);
        }

        // Add to wishlist
        await addButton.click();
        
        // Wait for success state
        await expect(addButton).toHaveAttribute('data-in-wishlist', 'true');
        await expect(this.wishlistCounter).toBeVisible();
    }

    /**
     * Removes an item from the wishlist
     * @param index - Index of the item to remove (0-based)
     * @returns Promise that resolves when item is removed
     * @throws Error if index is invalid
     */
    async removeItem(index: number): Promise<void> {
        await this.open();
        
        const itemCount = await this.wishlistItems.count();
        if (index >= itemCount) {
            throw new Error(`Invalid index ${index}. Wishlist has ${itemCount} items.`);
        }

        // Store item details for verification
        const itemName = await this.itemNames.nth(index).textContent();
        
        // Remove item
        await this.removeButtons.nth(index).click();
        
        // Wait for item to be removed
        await expect(this.wishlistItems).toHaveCount(itemCount - 1);
        
        // Verify specific item was removed
        const remainingItems = await this.itemNames.allTextContents();
        expect(remainingItems).not.toContain(itemName);
    }

    /**
     * Moves an item from wishlist to cart
     * @param index - Index of the item to move (0-based)
     * @returns Promise that resolves when item is moved
     * @throws Error if index is invalid
     */
    async moveToCart(index: number): Promise<void> {
        await this.open();
        
        const itemCount = await this.wishlistItems.count();
        if (index >= itemCount) {
            throw new Error(`Invalid index ${index}. Wishlist has ${itemCount} items.`);
        }

        // Store initial counts
        const initialWishlistCount = await this.count();
        const initialCartCount = await this.getCartCount();
        
        // Store item details for verification
        const itemName = await this.itemNames.nth(index).textContent();
        
        // Move item to cart
        await this.moveToCartButtons.nth(index).click();
        
        // Wait for counts to update
        await expect(this.wishlistCounter).toHaveText((initialWishlistCount - 1).toString());
        await expect(this.cartCounter).toHaveText((initialCartCount + 1).toString());
        
        // Verify item was removed from wishlist
        await expect(this.wishlistItems).toHaveCount(itemCount - 1);
        const remainingItems = await this.itemNames.allTextContents();
        expect(remainingItems).not.toContain(itemName);
    }

    /**
     * Gets the current number of items in wishlist
     * @returns Promise that resolves to the number of items
     */
    async count(): Promise<number> {
        const countText = await this.wishlistCounter.textContent();
        return countText ? parseInt(countText, 10) : 0;
    }

    /**
     * Gets the current number of items in cart
     * @returns Promise that resolves to the number of items in cart
     */
    private async getCartCount(): Promise<number> {
        const countText = await this.cartCounter.textContent();
        return countText ? parseInt(countText, 10) : 0;
    }

    /**
     * Verifies if wishlist is empty
     * @returns Promise that resolves to true if wishlist is empty
     */
    async isEmpty(): Promise<boolean> {
        await this.open();
        return await this.emptyMessage.isVisible();
    }

    /**
     * Gets details of all items in wishlist
     * @returns Promise that resolves to array of item details
     */
    async getItems(): Promise<Array<{ name: string; price: string }>> {
        const count = await this.wishlistItems.count();
        const items = [];
        
        for (let i = 0; i < count; i++) {
            items.push({
                name: (await this.itemNames.nth(i).textContent()) || '',
                price: (await this.itemPrices.nth(i).textContent()) || ''
            });
        }
        
        return items;
    }
} 