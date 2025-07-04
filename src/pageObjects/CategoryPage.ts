import { Page, Locator } from '@playwright/test';

/**
 * CategoryPage represents the category browsing interface.
 * Provides functionality for navigating product categories, subcategories,
 * and viewing category-specific products.
 * 
 * Key Features:
 * - Category navigation
 * - Subcategory filtering
 * - Category-specific sorting and filtering
 * - Featured categories management
 * 
 * @example
 * ```typescript
 * const category = new CategoryPage(page);
 * await category.navigateToCategory('Electronics');
 * await category.selectSubcategory('Laptops');
 * await category.sortProducts('price-desc');
 * ```
 */
export class CategoryPage {
    readonly page: Page;

    // Category Navigation
    readonly categoryMenu: Locator;
    readonly categoryList: Locator;
    readonly subcategoryList: Locator;
    readonly breadcrumbs: Locator;
    readonly categoryTitle: Locator;

    // Category Content
    readonly productGrid: Locator;
    readonly productList: Locator;
    readonly featuredProducts: Locator;
    readonly categoryBanner: Locator;
    readonly categoryDescription: Locator;

    // Filters and Sorting
    readonly filterPanel: Locator;
    readonly sortSelect: Locator;
    readonly viewToggle: Locator;
    readonly priceFilter: Locator;
    readonly brandFilter: Locator;
    readonly attributeFilters: Locator;
    readonly clearFiltersButton: Locator;

    // Pagination
    readonly pagination: Locator;
    readonly itemsPerPage: Locator;
    readonly totalItems: Locator;
    readonly pageInfo: Locator;

    constructor(page: Page) {
        this.page = page;

        // Category Navigation
        this.categoryMenu = page.locator('.category-menu');
        this.categoryList = page.locator('.category-list');
        this.subcategoryList = page.locator('.subcategory-list');
        this.breadcrumbs = page.locator('.breadcrumbs');
        this.categoryTitle = page.locator('.category-title');

        // Category Content
        this.productGrid = page.locator('.product-grid');
        this.productList = page.locator('.product-list');
        this.featuredProducts = page.locator('.featured-products');
        this.categoryBanner = page.locator('.category-banner');
        this.categoryDescription = page.locator('.category-description');

        // Filters and Sorting
        this.filterPanel = page.locator('.filter-panel');
        this.sortSelect = page.locator('#sort-select');
        this.viewToggle = page.locator('[data-testid="view-toggle"]');
        this.priceFilter = page.locator('.price-filter');
        this.brandFilter = page.locator('.brand-filter');
        this.attributeFilters = page.locator('.attribute-filters');
        this.clearFiltersButton = page.locator('[data-testid="clear-filters"]');

        // Pagination
        this.pagination = page.locator('.pagination');
        this.itemsPerPage = page.locator('#items-per-page');
        this.totalItems = page.locator('.total-items');
        this.pageInfo = page.locator('.page-info');
    }

    /**
     * Navigates to a specific category
     * @param categoryName - Name of the category
     */
    async navigateToCategory(categoryName: string) {
        await this.categoryMenu.click();
        await this.categoryList.locator(`text=${categoryName}`).click();
        await this.productGrid.waitFor();
    }

    /**
     * Selects a subcategory within current category
     * @param subcategoryName - Name of the subcategory
     */
    async selectSubcategory(subcategoryName: string) {
        await this.subcategoryList.locator(`text=${subcategoryName}`).click();
        await this.productGrid.waitFor();
    }

    /**
     * Applies category-specific filters
     * @param filters - Filter criteria
     */
    async applyFilters(filters: {
        priceRange?: { min: number; max: number };
        brands?: string[];
        attributes?: Record<string, string[]>;
    }) {
        if (filters.priceRange) {
            await this.page.fill('[data-testid="price-min"]', filters.priceRange.min.toString());
            await this.page.fill('[data-testid="price-max"]', filters.priceRange.max.toString());
        }

        if (filters.brands) {
            for (const brand of filters.brands) {
                await this.brandFilter.locator(`[value="${brand}"]`).click();
            }
        }

        if (filters.attributes) {
            for (const [attribute, values] of Object.entries(filters.attributes)) {
                for (const value of values) {
                    await this.attributeFilters
                        .locator(`[data-attribute="${attribute}"]`)
                        .locator(`[value="${value}"]`)
                        .click();
                }
            }
        }

        await this.page.locator('[data-testid="apply-filters"]').click();
        await this.productGrid.waitFor();
    }

    /**
     * Clears all applied filters
     */
    async clearFilters() {
        await this.clearFiltersButton.click();
        await this.productGrid.waitFor();
    }

    /**
     * Sorts products in the category
     * @param sortBy - Sort criteria
     */
    async sortProducts(sortBy: string) {
        await this.sortSelect.selectOption(sortBy);
        await this.productGrid.waitFor();
    }

    /**
     * Changes view mode between grid and list
     * @param mode - View mode
     */
    async changeViewMode(mode: 'grid' | 'list') {
        const currentView = await this.viewToggle.getAttribute('data-view');
        if (currentView !== mode) {
            await this.viewToggle.click();
            await (mode === 'grid' ? this.productGrid : this.productList).waitFor();
        }
    }

    /**
     * Changes number of items displayed per page
     * @param count - Number of items per page
     */
    async changeItemsPerPage(count: number) {
        await this.itemsPerPage.selectOption(count.toString());
        await this.productGrid.waitFor();
    }

    /**
     * Navigates to a specific page
     * @param pageNumber - Page number
     */
    async goToPage(pageNumber: number) {
        await this.pagination.locator(`[data-page="${pageNumber}"]`).click();
        await this.productGrid.waitFor();
    }

    /**
     * Gets total number of items in category
     * @returns Total number of items
     */
    async getTotalItems(): Promise<number> {
        const text = await this.totalItems.textContent();
        return parseInt(text?.match(/\d+/)?.[0] || '0', 10);
    }

    /**
     * Gets current category path from breadcrumbs
     * @returns Array of category names in path
     */
    async getCategoryPath(): Promise<string[]> {
        const breadcrumbs = await this.breadcrumbs.locator('li').allTextContents();
        return breadcrumbs.map(text => text.trim());
    }

    /**
     * Clicks on a product in the category
     * @param index - Product index
     */
    async clickProduct(index: number) {
        await this.productGrid.locator('.product-item').nth(index).click();
    }

    /**
     * Gets featured products in the category
     * @returns Array of featured product elements
     */
    async getFeaturedProducts() {
        return this.featuredProducts.locator('.product-item').all();
    }
} 