import { Page, Locator } from '@playwright/test';

/**
 * SearchPage represents the search interface and results page.
 * Provides functionality for searching products, filtering results, and sorting.
 * 
 * Key Features:
 * - Search input and suggestions
 * - Advanced search filters
 * - Results sorting and pagination
 * - Search history management
 * 
 * @example
 * ```typescript
 * const search = new SearchPage(page);
 * await search.performSearch('laptop');
 * await search.applyFilters({ price: '0-1000', brand: 'Dell' });
 * await search.sortResults('price-asc');
 * ```
 */
export class SearchPage {
    readonly page: Page;

    // Search Input
    readonly searchInput: Locator;
    readonly searchButton: Locator;
    readonly searchSuggestions: Locator;
    readonly clearSearchButton: Locator;
    readonly searchHistory: Locator;

    // Filters
    readonly filterSection: Locator;
    readonly priceRangeMin: Locator;
    readonly priceRangeMax: Locator;
    readonly categoryFilter: Locator;
    readonly brandFilter: Locator;
    readonly ratingFilter: Locator;
    readonly availabilityToggle: Locator;
    readonly applyFiltersButton: Locator;
    readonly clearFiltersButton: Locator;

    // Results
    readonly resultsGrid: Locator;
    readonly resultsList: Locator;
    readonly sortSelect: Locator;
    readonly viewToggle: Locator;
    readonly itemsPerPageSelect: Locator;
    readonly pagination: Locator;
    readonly totalResults: Locator;

    // Advanced Search
    readonly advancedSearchButton: Locator;
    readonly advancedSearchForm: Locator;
    readonly keywordInput: Locator;
    readonly excludeKeywordInput: Locator;
    readonly searchInSelect: Locator;
    readonly dateRangeStart: Locator;
    readonly dateRangeEnd: Locator;

    constructor(page: Page) {
        this.page = page;

        // Search Input
        this.searchInput = page.locator('#search-input');
        this.searchButton = page.locator('[data-testid="search-button"]');
        this.searchSuggestions = page.locator('.search-suggestions');
        this.clearSearchButton = page.locator('[data-testid="clear-search"]');
        this.searchHistory = page.locator('.search-history');

        // Filters
        this.filterSection = page.locator('.filter-section');
        this.priceRangeMin = page.locator('#price-min');
        this.priceRangeMax = page.locator('#price-max');
        this.categoryFilter = page.locator('#category-filter');
        this.brandFilter = page.locator('#brand-filter');
        this.ratingFilter = page.locator('#rating-filter');
        this.availabilityToggle = page.locator('#availability-toggle');
        this.applyFiltersButton = page.locator('[data-testid="apply-filters"]');
        this.clearFiltersButton = page.locator('[data-testid="clear-filters"]');

        // Results
        this.resultsGrid = page.locator('.results-grid');
        this.resultsList = page.locator('.results-list');
        this.sortSelect = page.locator('#sort-select');
        this.viewToggle = page.locator('[data-testid="view-toggle"]');
        this.itemsPerPageSelect = page.locator('#items-per-page');
        this.pagination = page.locator('.pagination');
        this.totalResults = page.locator('.total-results');

        // Advanced Search
        this.advancedSearchButton = page.locator('[data-testid="advanced-search"]');
        this.advancedSearchForm = page.locator('.advanced-search-form');
        this.keywordInput = page.locator('#keyword-input');
        this.excludeKeywordInput = page.locator('#exclude-keyword');
        this.searchInSelect = page.locator('#search-in');
        this.dateRangeStart = page.locator('#date-start');
        this.dateRangeEnd = page.locator('#date-end');
    }

    /**
     * Performs a basic search
     * @param query - Search query
     */
    async performSearch(query: string) {
        await this.searchInput.fill(query);
        await this.searchButton.click();
        await this.resultsGrid.waitFor();
    }

    /**
     * Applies search filters
     * @param filters - Filter criteria
     */
    async applyFilters(filters: {
        priceRange?: { min: number; max: number };
        category?: string;
        brand?: string[];
        rating?: number;
        inStock?: boolean;
    }) {
        if (filters.priceRange) {
            await this.priceRangeMin.fill(filters.priceRange.min.toString());
            await this.priceRangeMax.fill(filters.priceRange.max.toString());
        }
        
        if (filters.category) {
            await this.categoryFilter.selectOption(filters.category);
        }
        
        if (filters.brand) {
            for (const brand of filters.brand) {
                await this.brandFilter.locator(`[value="${brand}"]`).click();
            }
        }
        
        if (filters.rating) {
            await this.ratingFilter.selectOption(filters.rating.toString());
        }
        
        if (filters.inStock !== undefined) {
            const currentState = await this.availabilityToggle.isChecked();
            if (currentState !== filters.inStock) {
                await this.availabilityToggle.click();
            }
        }
        
        await this.applyFiltersButton.click();
        await this.resultsGrid.waitFor();
    }

    /**
     * Clears all applied filters
     */
    async clearFilters() {
        await this.clearFiltersButton.click();
        await this.resultsGrid.waitFor();
    }

    /**
     * Sorts search results
     * @param sortBy - Sort criteria
     */
    async sortResults(sortBy: string) {
        await this.sortSelect.selectOption(sortBy);
        await this.resultsGrid.waitFor();
    }

    /**
     * Changes view mode (grid/list)
     * @param mode - View mode
     */
    async changeViewMode(mode: 'grid' | 'list') {
        const currentView = await this.viewToggle.getAttribute('data-view');
        if (currentView !== mode) {
            await this.viewToggle.click();
            await (mode === 'grid' ? this.resultsGrid : this.resultsList).waitFor();
        }
    }

    /**
     * Changes items per page
     * @param count - Number of items per page
     */
    async changeItemsPerPage(count: number) {
        await this.itemsPerPageSelect.selectOption(count.toString());
        await this.resultsGrid.waitFor();
    }

    /**
     * Navigates to specific page
     * @param page - Page number
     */
    async goToPage(page: number) {
        await this.pagination.locator(`[data-page="${page}"]`).click();
        await this.resultsGrid.waitFor();
    }

    /**
     * Performs advanced search
     * @param criteria - Advanced search criteria
     */
    async performAdvancedSearch(criteria: {
        keyword: string;
        excludeKeyword?: string;
        searchIn?: string[];
        dateRange?: { start: string; end: string };
    }) {
        await this.advancedSearchButton.click();
        await this.keywordInput.fill(criteria.keyword);
        
        if (criteria.excludeKeyword) {
            await this.excludeKeywordInput.fill(criteria.excludeKeyword);
        }
        
        if (criteria.searchIn) {
            for (const category of criteria.searchIn) {
                await this.searchInSelect.locator(`[value="${category}"]`).click();
            }
        }
        
        if (criteria.dateRange) {
            await this.dateRangeStart.fill(criteria.dateRange.start);
            await this.dateRangeEnd.fill(criteria.dateRange.end);
        }
        
        await this.page.locator('[data-testid="submit-advanced-search"]').click();
        await this.resultsGrid.waitFor();
    }

    /**
     * Gets total number of search results
     * @returns Total number of results
     */
    async getTotalResults(): Promise<number> {
        const text = await this.totalResults.textContent();
        return parseInt(text?.match(/\d+/)?.[0] || '0', 10);
    }

    /**
     * Clicks on a search result
     * @param index - Result index
     */
    async clickResult(index: number) {
        await this.resultsGrid.locator('.result-item').nth(index).click();
    }
} 