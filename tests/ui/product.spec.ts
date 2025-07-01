/**
 * Product Details Page Test Suite
 * ============================
 * 
 * This test suite validates the product details page functionality,
 * focusing on the following key features:
 * 
 * - Product image gallery and lightbox
 * - Product variants (size, color) selection
 * - Dynamic price updates
 * - Product reviews and ratings
 * 
 * The tests use soft assertions (expect.soft) to collect all possible
 * failures in a single test run, providing a more comprehensive view
 * of the page's state and any potential issues.
 * 
 * @author QA Team
 * @category UI Tests
 * @subcategory Product Details
 */

import { test, expect, Page } from '@playwright/test';
import { ProductPage } from '../../src/pageObjects/ProductPage';

/**
 * Interface for product variant data
 */
interface ProductVariant {
    size?: string;
    color?: string;
    price: number;
    sku: string;
}

/**
 * Interface for product review data
 */
interface ProductReview {
    author: string;
    rating: number;
    date: string;
    text: string;
}

/**
 * Collection of test selectors for product page
 */
const selectors = {
    gallery: {
        mainImage: '[data-testid="main-image"]',
        thumbnails: '[data-testid="thumbnail"]',
        lightbox: {
            container: '[data-testid="lightbox"]',
            image: '[data-testid="lightbox-image"]',
            close: '[data-testid="lightbox-close"]',
            next: '[data-testid="lightbox-next"]',
            prev: '[data-testid="lightbox-prev"]'
        }
    },
    variants: {
        sizeSelect: '[data-testid="size-select"]',
        sizeOptions: '[data-testid="size-option"]',
        colorSelect: '[data-testid="color-select"]',
        colorOptions: '[data-testid="color-option"]',
        price: '[data-testid="product-price"]',
        sku: '[data-testid="product-sku"]'
    },
    tabs: {
        container: '[data-testid="product-tabs"]',
        description: '#tab-description',
        specifications: '#tab-specifications',
        reviews: '#tab-reviews'
    },
    reviews: {
        container: '[data-testid="reviews-container"]',
        averageRating: '[data-testid="average-rating"]',
        ratingStars: '[data-testid="rating-stars"]',
        reviewList: '[data-testid="review-list"]',
        reviewItem: '[data-testid="review-item"]',
        pagination: '[data-testid="reviews-pagination"]'
    }
};

/**
 * Utility function to extract rating value from stars element
 * @param page - Playwright page object
 * @param starsElement - Locator for the stars container
 */
async function extractRating(page: Page, starsElement: any): Promise<number> {
    const fullStars = await starsElement.locator('.full-star').count();
    const halfStars = await starsElement.locator('.half-star').count();
    return fullStars + (halfStars * 0.5);
}

/**
 * Utility function to get all reviews from the current page
 * @param page - Playwright page object
 */
async function getReviews(page: Page): Promise<ProductReview[]> {
    const reviews: ProductReview[] = [];
    const reviewElements = page.locator(selectors.reviews.reviewItem);
    const count = await reviewElements.count();

    for (let i = 0; i < count; i++) {
        const review = reviewElements.nth(i);
        reviews.push({
            author: await review.locator('.author').textContent() || '',
            rating: await extractRating(page, review.locator('.rating')),
            date: await review.locator('.date').textContent() || '',
            text: await review.locator('.text').textContent() || ''
        });
    }

    return reviews;
}

/**
 * Utility function to calculate average rating from reviews
 * @param reviews - Array of product reviews
 */
function calculateAverageRating(reviews: ProductReview[]): number {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
}

/**
 * Utility function to wait for price update after variant selection
 * @param page - Playwright page object
 * @param priceElement - Locator for the price element
 */
async function waitForPriceUpdate(page: Page, priceElement: any): Promise<void> {
    await page.waitForResponse(response => 
        response.url().includes('/api/product/price') && 
        response.status() === 200
    );
    await priceElement.waitFor({ state: 'visible' });
}

test.describe('Product Details Page Tests @product', () => {
    let productPage: ProductPage;

    test.beforeEach(async ({ page }) => {
        productPage = new ProductPage(page);
        await page.goto('/product/1');
    });

    /**
     * Main test case for product page functionality
     * Uses soft assertions to check multiple aspects without early termination
     */
    test('should handle product variants and display reviews correctly', async ({ page }) => {
        // Step 1: Verify initial page load
        await test.step('Initial page load', async () => {
            await expect.soft(page).toHaveURL('/product/1');
            await expect.soft(page.locator(selectors.gallery.mainImage))
                .toBeVisible();
        });

        // Step 2: Test image gallery and lightbox
        await test.step('Image gallery and lightbox', async () => {
            // Click first thumbnail
            const firstThumbnail = page.locator(selectors.gallery.thumbnails).first();
            await firstThumbnail.click();

            // Verify lightbox opens
            const lightbox = page.locator(selectors.gallery.lightbox.container);
            await expect.soft(lightbox).toBeVisible();

            // Verify lightbox navigation
            await expect.soft(page.locator(selectors.gallery.lightbox.next))
                .toBeVisible();
            await expect.soft(page.locator(selectors.gallery.lightbox.prev))
                .toBeVisible();

            // Close lightbox
            await page.locator(selectors.gallery.lightbox.close).click();
            await expect.soft(lightbox).not.toBeVisible();
        });

        // Step 3: Test variant selection and price update
        await test.step('Variant selection', async () => {
            // Get initial price for comparison
            const priceElement = page.locator(selectors.variants.price);
            const initialPrice = await priceElement.textContent();

            // Select size M
            await page.locator(selectors.variants.sizeSelect)
                .selectOption('M');
            
            // Select color Red
            await page.locator(selectors.variants.colorSelect)
                .selectOption('Red');

            // Wait for price update
            await waitForPriceUpdate(page, priceElement);

            // Verify price changed
            const updatedPrice = await priceElement.textContent();
            await expect.soft(updatedPrice).not.toBe(initialPrice);

            // Verify SKU updated
            await expect.soft(page.locator(selectors.variants.sku))
                .toBeVisible();
        });

        // Step 4: Test reviews tab and ratings
        await test.step('Reviews and ratings', async () => {
            // Open reviews tab
            await page.locator(selectors.tabs.reviews).click();
            
            // Wait for reviews to load
            await page.locator(selectors.reviews.container).waitFor();

            // Get all reviews
            const reviews = await getReviews(page);
            expect.soft(reviews.length).toBeGreaterThan(0);

            // Calculate and verify average rating
            const averageRating = calculateAverageRating(reviews);
            expect.soft(averageRating).toBeGreaterThanOrEqual(4);

            // Verify rating display
            const displayedRating = await extractRating(
                page,
                page.locator(selectors.reviews.averageRating)
            );
            expect.soft(displayedRating).toBeGreaterThanOrEqual(4);
        });
    });

    /**
     * Additional test for variant combinations
     */
    test('should handle all variant combinations @product', async ({ page }) => {
        const sizes = ['S', 'M', 'L'];
        const colors = ['Red', 'Blue', 'Green'];

        for (const size of sizes) {
            for (const color of colors) {
                await test.step(`Testing ${size}/${color} combination`, async () => {
                    await page.locator(selectors.variants.sizeSelect)
                        .selectOption(size);
                    await page.locator(selectors.variants.colorSelect)
                        .selectOption(color);

                    // Verify variant selection is valid
                    await expect.soft(page.locator(selectors.variants.sku))
                        .toBeVisible();
                });
            }
        }
    });
}); 