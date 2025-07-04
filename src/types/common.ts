/**
 * Common interfaces and types used across the test suite
 */

/**
 * Product review information
 */
export interface ProductReview {
    rating: number;
    comment: string;
    author: string;
    date: string;
}

/**
 * Search filter options
 */
export interface SearchFilters {
    brand?: string;
    maxPrice?: number;
    minPrice?: number;
    category?: string;
}

/**
 * Test user data structure
 */
export interface TestUser {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

/**
 * Contact form message structure
 */
export interface ContactMessage {
    subject: string;
    email: string;
    message: string;
}

/**
 * Performance metrics structure
 */
export interface PerformanceMetrics {
    navigationStart: number;
    fetchStart: number;
    domainLookupStart: number;
    domainLookupEnd: number;
    connectStart: number;
    connectEnd: number;
    secureConnectionStart: number;
    requestStart: number;
    responseStart: number;
    responseEnd: number;
    domLoading: number;
    domInteractive: number;
    domContentLoadedEventStart: number;
    domContentLoadedEventEnd: number;
    domComplete: number;
    loadEventStart: number;
    loadEventEnd: number;
}

/**
 * Common page selectors
 */
export const commonSelectors = {
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