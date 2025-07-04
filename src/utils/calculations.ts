import { ProductReview } from '../types/common';

/**
 * Utility functions for common calculations in tests
 */

/**
 * Calculate discount amount
 * @param amount Original amount
 * @param percentage Discount percentage
 * @returns Calculated discount amount
 * 
 * @example
 * ```typescript
 * const discount = calculateDiscount(100, 20); // Returns 20
 * ```
 */
export function calculateDiscount(amount: number, percentage: number): number {
    return amount * (percentage / 100);
}

/**
 * Calculate average rating from product reviews
 * @param reviews Array of product reviews
 * @returns Average rating or 0 if no reviews
 * 
 * @example
 * ```typescript
 * const reviews = [
 *   { rating: 5, comment: "Great!", author: "John", date: "2024-01-01" },
 *   { rating: 4, comment: "Good", author: "Jane", date: "2024-01-02" }
 * ];
 * const avgRating = calculateAverageRating(reviews); // Returns 4.5
 * ```
 */
export function calculateAverageRating(reviews: ProductReview[]): number {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
}

/**
 * Extract numeric price from a string
 * @param priceString Price string with currency symbol
 * @returns Numeric price value
 * 
 * @example
 * ```typescript
 * const price = extractPrice("$123.45"); // Returns 123.45
 * const euroPrice = extractPrice("99,99 €"); // Returns 99.99
 * ```
 */
export function extractPrice(priceString: string): number {
    const numericString = priceString.replace(/[^0-9.,]/g, '');
    return parseFloat(numericString.replace(',', '.'));
}

/**
 * Calculate percentage
 * @param value Current value
 * @param total Total value
 * @returns Percentage value
 * 
 * @example
 * ```typescript
 * const percent = calculatePercentage(25, 100); // Returns 25
 * ```
 */
export function calculatePercentage(value: number, total: number): number {
    return (value / total) * 100;
}

/**
 * Round number to specified decimal places
 * @param value Number to round
 * @param decimals Number of decimal places
 * @returns Rounded number
 * 
 * @example
 * ```typescript
 * const rounded = roundNumber(123.456, 2); // Returns 123.46
 * ```
 */
export function roundNumber(value: number, decimals: number = 2): number {
    return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
}

/**
 * Format currency value
 * @param amount Amount to format
 * @param currency Currency code
 * @param locale Locale string
 * @returns Formatted currency string
 * 
 * @example
 * ```typescript
 * const price = formatCurrency(123.45, 'USD'); // Returns "$123.45"
 * const eurPrice = formatCurrency(99.99, 'EUR', 'de-DE'); // Returns "99,99 €"
 * ```
 */
export function formatCurrency(
    amount: number,
    currency: string = 'USD',
    locale: string = 'en-US'
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
    }).format(amount);
} 