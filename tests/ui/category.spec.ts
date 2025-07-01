/**
 * Category Page Test Suite
 * ======================
 * 
 * This test suite validates the functionality of the category listing page,
 * focusing on the following key aspects:
 * 
 * 1. Navigation and URL structure
 * 2. Breadcrumb trail accuracy
 * 3. Filter functionality (specifically color filters)
 * 4. Product sorting capabilities
 * 5. Price display and ordering
 * 6. Console error monitoring
 * 
 * The tests ensure that users can effectively browse, filter, and sort products
 * within a category, which is a critical part of the e-commerce user journey.
 * 
 * @author QA Team
 * @category UI Tests
 * @subcategory Category Navigation
 */

import { test, expect, Page, ConsoleMessage } from '@playwright/test';
import { HomePage } from '../../src/pageObjects/HomePage';

/**
 * Interface representing the price range of products
 * Used for price comparison assertions
 */
interface PriceRange {
    min: number;
    max: number;
}

/**
 * Type representing the supported sort directions
 */
type SortDirection = 'asc' | 'desc';

/**
 * Interface for product data extracted from the page
 */
interface ProductData {
    name: string;
    price: number;
    color: string;
}

/**
 * Represents the structure of console messages to be tracked
 */
interface ConsoleMessageLog {
    type: string;
    text: string;
    location: string;
    timestamp: Date;
}

/**
 * Collection of test selectors for the category page
 * Centralizes all selectors used in the test suite
 */
const selectors = {
    breadcrumbs: {
        container: '[data-testid="breadcrumbs"]',
        links: '[data-testid="breadcrumb-link"]',
        separator: '[data-testid="breadcrumb-separator"]',
        current: '[data-testid="breadcrumb-current"]'
    },
    filters: {
        colorSection: '#filter-color',
        colorOptions: '[data-testid="color-filter-option"]',
        activeFilters: '[data-testid="active-filters"]',
        clearAll: '[data-testid="clear-filters"]'
    },
    sorting: {
        dropdown: '[data-testid="sort-dropdown"]',
        options: {
            priceAsc: 'price-asc',
            priceDesc: 'price-desc',
            nameAsc: 'name-asc',
            nameDesc: 'name-desc',
            newest: 'newest'
        }
    },
    products: {
        grid: '[data-testid="product-grid"]',
        item: '[data-testid="product-item"]',
        name: '[data-testid="product-name"]',
        price: '[data-testid="product-price"]',
        color: '[data-testid="product-color"]'
    }
};

/**
 * Utility function to extract price from a string
 * Handles different currency formats and removes non-numeric characters
 * 
 * @param priceString - The price string to parse (e.g., "$123.45", "123,45 €")
 * @returns The price as a number
 * 
 * @example
 * ```typescript
 * const price = extractPrice("$123.45"); // Returns 123.45
 * ```
 */
function extractPrice(priceString: string): number {
    const numericString = priceString.replace(/[^0-9.,]/g, '');
    return parseFloat(numericString.replace(',', '.'));
}

/**
 * Utility function to validate breadcrumb structure
 * Ensures breadcrumbs follow the expected pattern and contain correct links
 * 
 * @param page - The Playwright page object
 * @param expectedPath - Array of expected breadcrumb segments
 * @returns Promise resolving to boolean indicating if breadcrumbs are valid
 */
async function validateBreadcrumbs(page: Page, expectedPath: string[]): Promise<boolean> {
    const breadcrumbs = page.locator(selectors.breadcrumbs.links);
    const count = await breadcrumbs.count();
    
    if (count !== expectedPath.length) {
        return false;
    }

    for (let i = 0; i < count; i++) {
        const text = await breadcrumbs.nth(i).textContent();
        if (text?.trim() !== expectedPath[i]) {
            return false;
        }
    }

    return true;
}

/**
 * Utility function to collect console messages
 * Tracks console.log, console.error, and console.warn messages
 * 
 * @param msg - The console message object from Playwright
 * @returns Formatted console message log entry
 */
function processConsoleMessage(msg: ConsoleMessage): ConsoleMessageLog {
    return {
        type: msg.type(),
        text: msg.text(),
        location: msg.location().url,
        timestamp: new Date()
    };
}

/**
 * Test suite for category page functionality
 * Tests navigation, filtering, and sorting capabilities
 */
test.describe('Category Page Tests @category', () => {
    let consoleMessages: ConsoleMessageLog[] = [];

    test.beforeEach(async ({ page }) => {
        // Reset console messages before each test
        consoleMessages = [];

        // Listen for console messages
        page.on('console', (msg) => {
            consoleMessages.push(processConsoleMessage(msg));
        });
    });

    /**
     * Main test case for category page functionality
     * Validates navigation, filtering, and sorting
     */
    test('should filter and sort products correctly', async ({ page }) => {
        // Step 1: Navigate to the category page
        await test.step('Navigate to category page', async () => {
            await page.goto('/category/clothes');
            await expect(page).toHaveURL('/category/clothes');
        });

        // Step 2: Validate breadcrumbs
        await test.step('Validate breadcrumbs', async () => {
            const breadcrumbsValid = await validateBreadcrumbs(page, ['Home', 'Clothes']);
            expect(breadcrumbsValid, 'Breadcrumbs should show correct path').toBe(true);
        });

        // Step 3: Apply color filter
        await test.step('Apply blue color filter', async () => {
            const colorFilter = page.locator(selectors.filters.colorOptions).filter({ hasText: 'Blue' });
            await colorFilter.click();
            
            // Wait for filter to be applied
            await page.waitForResponse(response => 
                response.url().includes('/api/products') && 
                response.status() === 200
            );

            // Verify filter is active
            const activeFilters = page.locator(selectors.filters.activeFilters);
            await expect(activeFilters).toContainText('Blue');
        });

        // Step 4: Sort by price ascending
        await test.step('Sort by price ascending', async () => {
            const sortDropdown = page.locator(selectors.sorting.dropdown);
            await sortDropdown.selectOption(selectors.sorting.options.priceAsc);
            
            // Wait for sorting to be applied
            await page.waitForResponse(response => 
                response.url().includes('/api/products') && 
                response.status() === 200
            );
        });

        // Step 5: Verify price ordering
        await test.step('Verify price ordering', async () => {
            const productPrices = page.locator(selectors.products.price);
            const priceCount = await productPrices.count();
            
            expect(priceCount).toBeGreaterThan(1, 'Should have at least 2 products to compare prices');

            const firstPrice = extractPrice(await productPrices.first().textContent() || '');
            const lastPrice = extractPrice(await productPrices.last().textContent() || '');

            expect(firstPrice).toBeLessThan(lastPrice, 'First price should be less than last price');
        });

        // Step 6: Check for console errors
        await test.step('Verify no console errors', async () => {
            const errors = consoleMessages.filter(msg => msg.type === 'error');
            expect(errors).toHaveLength(0, 'Should have no console errors');
            
            if (errors.length > 0) {
                console.log('Found console errors:', errors);
            }
        });
    });

    /**
     * Additional test case for filter persistence
     * Ensures filters remain active after page reload
     */
    test('should persist filters after page reload @category', async ({ page }) => {
        await page.goto('/category/clothes');
        
        // Apply filter
        const colorFilter = page.locator(selectors.filters.colorOptions).filter({ hasText: 'Blue' });
        await colorFilter.click();
        
        // Reload page
        await page.reload();
        
        // Verify filter is still active
        const activeFilters = page.locator(selectors.filters.activeFilters);
        await expect(activeFilters).toContainText('Blue');
    });

    /**
     * Test case for URL parameters
     * Validates that filter and sort parameters are correctly reflected in URL
     */
    test('should update URL with filter and sort parameters @category', async ({ page }) => {
        await page.goto('/category/clothes');
        
        // Apply filter and sort
        const colorFilter = page.locator(selectors.filters.colorOptions).filter({ hasText: 'Blue' });
        await colorFilter.click();
        
        const sortDropdown = page.locator(selectors.sorting.dropdown);
        await sortDropdown.selectOption(selectors.sorting.options.priceAsc);
        
        // Verify URL parameters
        await expect(page).toHaveURL(/color=blue/);
        await expect(page).toHaveURL(/sort=price-asc/);
    });
}); 