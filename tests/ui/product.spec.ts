/**
 * Product Details Page Test Suite
 * ============================
 * 
 * End-to-end tests validating the product details page functionality:
 * 
 * User Stories:
 * 1. Product Viewing
 *    - Browse product images
 *    - View detailed information
 *    - Read specifications
 * 
 * 2. Product Configuration
 *    - Select variants (size, color)
 *    - Choose quantity
 *    - View price updates
 * 
 * 3. Customer Reviews
 *    - Read product reviews
 *    - View ratings distribution
 *    - Sort and filter reviews
 * 
 * 4. Purchase Flow
 *    - Add to cart
 *    - Buy now
 *    - Save to wishlist
 * 
 * @group product
 * @group e2e
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

test.describe('Product Details Functionality @product', () => {
    let productPage: ProductPage;

    test.beforeEach(async ({ page }) => {
        productPage = new ProductPage(page);
        await page.goto('/product/1');
    });

    /**
     * Validates core product page functionality including variants and reviews
     * 
     * User Story:
     * As a customer
     * I want to view and configure products
     * So that I can make informed purchase decisions
     * 
     * @test
     * @category Critical Path
     */
    test('product configuration and review display', async ({ page }) => {
        // 1. Initial Product View
        await test.step('Verify product display', async () => {
            await expect(productPage.productTitle).toBeVisible();
            await expect(productPage.productImage).toBeVisible();
            await expect(productPage.productPrice).toBeVisible();
        });

        // 2. Image Gallery Interaction
        await test.step('Image gallery navigation', async () => {
            await expect(productPage.imageGallery.first()).toBeVisible();
            await productPage.imageGallery.first().click();
            
            // Verify gallery navigation
            await expect(page.locator('[data-testid="lightbox"]')).toBeVisible();
            await page.locator('[data-testid="lightbox-close"]').click();
        });

        // 3. Variant Selection
        await test.step('Configure product variants', async () => {
            const initialPrice = await productPage.productPrice.textContent();
            
            // Select variants
            await productPage.selectVariant('size', 'M');
            await productPage.selectVariant('color', 'Red');
            
            // Wait for price update
            await page.waitForResponse(response => 
                response.url().includes('/api/product/price') && 
                response.status() === 200
            );
            
            const updatedPrice = await productPage.productPrice.textContent();
            expect(updatedPrice).not.toBe(initialPrice);
        });

        // 4. Review Section
        await test.step('Review section validation', async () => {
            await productPage.reviewsTab.click();
            
            // Verify review content
            const reviewsContainer = page.locator('[data-testid="reviews-container"]');
            await expect(reviewsContainer).toBeVisible();
            
            // Check rating display
            const ratingStars = page.locator('[data-testid="rating-stars"]');
            await expect(ratingStars).toBeVisible();
        });
    });

    /**
     * Validates product variant combinations
     * 
     * @test
     * @category Product Configuration
     */
    test('variant combination validation @product', async ({ page }) => {
        const sizes = ['S', 'M', 'L'];
        const colors = ['Red', 'Blue', 'Green'];

        for (const size of sizes) {
            for (const color of colors) {
                await test.step(`Variant: ${size}/${color}`, async () => {
                    await productPage.selectVariant('size', size);
                    await productPage.selectVariant('color', color);
                    
                    // Verify selection is valid
                    await expect(page.locator('[data-testid="product-sku"]')).toBeVisible();
                });
            }
        }
    });

    /**
     * Validates the add to cart functionality
     * 
     * User Story:
     * As a customer
     * I want to add products to my cart
     * So that I can proceed with my purchase
     * 
     * @test
     * @category Purchase Flow
     */
    test('add to cart workflow @cart', async ({ page }) => {
        // Configure product
        await productPage.selectVariant('size', 'M');
        await productPage.selectVariant('color', 'Blue');
        
        // Add to cart with quantity
        await productPage.addToCart(2);
        
        // Verify cart notification
        await expect(page.locator('[data-testid="cart-popup"]')).toBeVisible();
        
        // Verify cart state
        const cartCount = await page.locator('[data-testid="cart-count"]').textContent();
        expect(cartCount).toBe('2');
    });
}); 