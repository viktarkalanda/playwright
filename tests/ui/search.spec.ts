/**
 * Search Functionality Test Suite
 * =============================
 * 
 * This test suite validates the site-wide search functionality,
 * including the following key features:
 * 
 * - Autosuggest/typeahead functionality
 * - Search results page rendering
 * - Filter combinations (brand, price)
 * - Empty results handling
 * 
 * The search feature is critical for user experience as it's often
 * the primary way users find products. These tests ensure that
 * search works correctly under various scenarios and edge cases.
 * 
 * @author QA Team
 * @category UI Tests
 * @subcategory Search
 */

import { test, expect, Page } from '@playwright/test';
import { HomePage } from '../../src/pageObjects/HomePage';

/**
 * Interface for search result data
 */
interface SearchResult {
    title: string;
    price: number;
    brand: string;
}

/**
 * Interface for search filter options
 */
interface SearchFilters {
    brand?: string;
    maxPrice?: number;
    minPrice?: number;
    category?: string;
}

/**
 * Collection of test selectors for search functionality
 */
const selectors = {
    search: {
        input: '[data-testid="search-input"]',
        submit: '[data-testid="search-submit"]',
        autosuggest: {
            container: '[data-testid="autosuggest"]',
            items: '[data-testid="autosuggest-item"]',
            loading: '[data-testid="autosuggest-loading"]'
        }
    },
    results: {
        header: '[data-testid="search-results-header"]',
        container: '[data-testid="search-results"]',
        items: '[data-testid="product-item"]',
        empty: '[data-testid="no-results"]'
    },
    filters: {
        brand: {
            section: '#brand-filter',
            options: '[data-testid="brand-option"]'
        },
        price: {
            min: '#price-min',
            max: '#price-max',
            apply: '[data-testid="apply-price"]'
        }
    }
};

/**
 * Utility function to wait for autosuggest to appear and stabilize
 * @param page - Playwright page object
 */
async function waitForAutosuggest(page: Page): Promise<void> {
    // Wait for loading indicator to appear and disappear
    const loading = page.locator(selectors.search.autosuggest.loading);
    await loading.waitFor({ state: 'visible', timeout: 1000 }).catch(() => {});
    await loading.waitFor({ state: 'hidden', timeout: 5000 });
    
    // Wait for autosuggest container to be visible
    await page.locator(selectors.search.autosuggest.container).waitFor();
}

/**
 * Utility function to apply search filters
 * @param page - Playwright page object
 * @param filters - Filter options to apply
 */
async function applySearchFilters(page: Page, filters: SearchFilters): Promise<void> {
    if (filters.brand) {
        const brandOption = page.locator(selectors.filters.brand.options)
            .filter({ hasText: filters.brand });
        await brandOption.click();
    }

    if (filters.maxPrice !== undefined || filters.minPrice !== undefined) {
        if (filters.minPrice !== undefined) {
            await page.locator(selectors.filters.price.min).fill(filters.minPrice.toString());
        }
        if (filters.maxPrice !== undefined) {
            await page.locator(selectors.filters.price.max).fill(filters.maxPrice.toString());
        }
        await page.locator(selectors.filters.price.apply).click();
    }

    // Wait for results to update
    await page.waitForResponse(response => 
        response.url().includes('/api/search') && 
        response.status() === 200
    );
}

/**
 * Utility function to get search results data
 * @param page - Playwright page object
 */
async function getSearchResults(page: Page): Promise<SearchResult[]> {
    const items = page.locator(selectors.results.items);
    const count = await items.count();
    
    const results: SearchResult[] = [];
    for (let i = 0; i < count; i++) {
        const item = items.nth(i);
        results.push({
            title: await item.locator('h3').textContent() || '',
            price: parseFloat((await item.locator('.price').textContent() || '').replace(/[^0-9.]/g, '')),
            brand: await item.locator('.brand').textContent() || ''
        });
    }
    
    return results;
}

test.describe('Search Functionality Tests @search', () => {
    let homePage: HomePage;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        await page.goto('/');
    });

    /**
     * Main positive test case for search functionality
     * Tests autosuggest, results page, and filtering
     */
    test('should search for products with autosuggest and apply filters', async ({ page }) => {
        // Step 1: Enter search term and wait for autosuggest
        await test.step('Search with autosuggest', async () => {
            await page.locator(selectors.search.input).fill('camera');
            await waitForAutosuggest(page);
            
            // Verify autosuggest appears
            const autosuggest = page.locator(selectors.search.autosuggest.container);
            await expect(autosuggest).toBeVisible();
            
            // Press Enter to search
            await page.keyboard.press('Enter');
        });

        // Step 2: Verify search results page
        await test.step('Verify search results header', async () => {
            const header = page.locator(selectors.results.header);
            await expect(header).toContainText('Search results for "camera"');
        });

        // Step 3: Apply filters and verify results
        await test.step('Apply brand and price filters', async () => {
            await applySearchFilters(page, {
                brand: 'Canon',
                maxPrice: 2000
            });

            // Get filtered results
            const results = await getSearchResults(page);
            
            // Verify result count
            expect(results.length).toBeLessThan(10);
            
            // Verify each result matches filters
            for (const result of results) {
                expect(result.brand).toBe('Canon');
                expect(result.price).toBeLessThan(2000);
            }
        });
    });

    /**
     * Negative test case for search functionality
     * Tests behavior with no results
     */
    test('should handle no search results gracefully @search', async ({ page }) => {
        // Enter non-existent search term
        await page.locator(selectors.search.input).fill('zzz-nonexistent');
        await page.keyboard.press('Enter');

        // Verify no results message
        const noResults = page.locator(selectors.results.empty);
        await expect(noResults).toBeVisible();
        await expect(noResults).toContainText('No products found');

        // Verify results container is empty
        const results = page.locator(selectors.results.items);
        await expect(results).toHaveCount(0);
    });

    /**
     * Additional test for search input validation
     */
    test('should handle special characters in search @search', async ({ page }) => {
        const specialChars = '!@#$%^&*()';
        await page.locator(selectors.search.input).fill(specialChars);
        await page.keyboard.press('Enter');

        // Should still load the search page without errors
        await expect(page).toHaveURL(/\/search/);
    });
}); 