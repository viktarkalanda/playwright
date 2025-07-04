import { Page, Locator } from '@playwright/test';

/**
 * HomePage represents the main landing page of the e-commerce website.
 * It contains navigation elements, featured products, and promotional content.
 * 
 * @example
 * ```typescript
 * const homePage = new HomePage(page);
 * await homePage.navigateToFeaturedProduct(1);
 * ```
 */
export class HomePage {
    readonly page: Page;

    /**
     * Main hero banner showcasing featured promotions
     * @example await expect(page.heroBanner).toBeVisible()
     */
    readonly heroBanner: Locator;

    /**
     * Primary navigation menu containing category links
     * @example await page.mainNav.click()
     */
    readonly mainNav: Locator;

    /**
     * Search input field in the header
     * @example await page.searchInput.fill('laptop')
     */
    readonly searchInput: Locator;

    /**
     * Search submit button
     * @example await page.searchButton.click()
     */
    readonly searchButton: Locator;

    /**
     * Shopping cart icon with item count
     * @example await page.cartIcon.click()
     */
    readonly cartIcon: Locator;

    /**
     * User account menu trigger
     * @example await page.accountMenu.click()
     */
    readonly accountMenu: Locator;

    /**
     * Newsletter subscription email input
     * @example await page.newsletterInput.fill('user@example.com')
     */
    readonly newsletterInput: Locator;

    /**
     * Newsletter subscription submit button
     * @example await page.newsletterSubmit.click()
     */
    readonly newsletterSubmit: Locator;

    /**
     * Featured products carousel container
     * @example await page.featuredProducts.scrollIntoViewIfNeeded()
     */
    readonly featuredProducts: Locator;

    /**
     * "Deal of the Day" product card
     * @example await page.dealOfTheDay.click()
     */
    readonly dealOfTheDay: Locator;

    /**
     * Category filter checkboxes
     * @example await page.categoryFilters.nth(0).click()
     */
    readonly categoryFilters: Locator;

    /**
     * Price range slider minimum handle
     * @example await page.priceRangeMin.click()
     */
    readonly priceRangeMin: Locator;

    /**
     * Price range slider maximum handle
     * @example await page.priceRangeMax.click()
     */
    readonly priceRangeMax: Locator;

    /**
     * Sort dropdown for product listing
     * @example await page.sortDropdown.selectOption('price-asc')
     */
    readonly sortDropdown: Locator;

    /**
     * Grid/List view toggle buttons
     * @example await page.viewToggle.click()
     */
    readonly viewToggle: Locator;

    /**
     * Language selector dropdown
     * @example await page.languageSelect.selectOption('es')
     */
    readonly languageSelect: Locator;

    /**
     * Currency selector dropdown
     * @example await page.currencySelect.selectOption('EUR')
     */
    readonly currencySelect: Locator;

    /**
     * Customer support chat widget trigger
     * @example await page.chatWidget.click()
     */
    readonly chatWidget: Locator;

    /**
     * Back to top button
     * @example await page.backToTop.click()
     */
    readonly backToTop: Locator;

    constructor(page: Page) {
        this.page = page;
        this.heroBanner = page.locator('[data-testid="hero-banner"]');
        this.mainNav = page.locator('#main-nav');
        this.searchInput = page.locator('#search-input');
        this.searchButton = page.locator('#search-submit');
        this.cartIcon = page.locator('#cart-icon');
        this.accountMenu = page.locator('#account-menu');
        this.newsletterInput = page.locator('#newsletter-email');
        this.newsletterSubmit = page.locator('#newsletter-submit');
        this.featuredProducts = page.locator('#featured-products');
        this.dealOfTheDay = page.locator('#deal-of-day');
        this.categoryFilters = page.locator('.category-filter');
        this.priceRangeMin = page.locator('#price-range-min');
        this.priceRangeMax = page.locator('#price-range-max');
        this.sortDropdown = page.locator('#sort-select');
        this.viewToggle = page.locator('#view-toggle');
        this.languageSelect = page.locator('#language-select');
        this.currencySelect = page.locator('#currency-select');
        this.chatWidget = page.locator('#chat-widget');
        this.backToTop = page.locator('#back-to-top');
    }

    /**
     * Navigates to a specific product from the featured products section
     * @param index - The 1-based index of the product to select
     * 
     * @example
     * ```typescript
     * await homePage.navigateToFeaturedProduct(1);
     * ```
     */
    async navigateToFeaturedProduct(index: number) {
        await this.featuredProducts.locator(`div:nth-child(${index})`).click();
    }

    /**
     * Performs a product search and submits the search form
     * @param query - The search term to look for
     * 
     * @example
     * ```typescript
     * await homePage.searchForProduct('wireless headphones');
     * ```
     */
    async searchForProduct(query: string) {
        await this.searchInput.fill(query);
        await this.searchButton.click();
    }

    /**
     * Subscribes to the newsletter with the given email
     * @param email - The email address to subscribe with
     * 
     * @example
     * ```typescript
     * await homePage.subscribeToNewsletter('user@example.com');
     * ```
     */
    async subscribeToNewsletter(email: string) {
        await this.newsletterInput.fill(email);
        await this.newsletterSubmit.click();
    }

    /**
     * Applies price range filter using the slider
     * @param min - Minimum price value
     * @param max - Maximum price value
     * 
     * @example
     * ```typescript
     * await homePage.setPriceRange(10, 100);
     * ```
     */
    async setPriceRange(min: number, max: number) {
        await this.priceRangeMin.fill(min.toString());
        await this.priceRangeMax.fill(max.toString());
    }

    /**
     * Changes the display currency
     * @param currency - Currency code (e.g., 'USD', 'EUR')
     * 
     * @example
     * ```typescript
     * await homePage.changeCurrency('EUR');
     * ```
     */
    async changeCurrency(currency: string) {
        await this.currencySelect.selectOption(currency);
    }

    /**
     * Navigate to the home page
     */
    async goto(): Promise<void> {
        await this.page.goto('/');
    }

    /**
     * Wait for the home page to be fully loaded
     */
    async waitForLoad(): Promise<void> {
        // Wait for key elements that indicate the page is loaded
        await this.page.waitForSelector('.hero-section');
        await this.page.waitForSelector('.products-grid');
        await this.page.waitForSelector('footer');
        
        // Wait for all images to load
        await this.page.waitForFunction(() => {
            const images = document.querySelectorAll('img');
            return Array.from(images).every(img => img.complete);
        });
    }
} 