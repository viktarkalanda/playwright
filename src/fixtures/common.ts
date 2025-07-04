import { test as base, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import type { TestUser } from '../types/common';

/**
 * Extended test fixture with common functionality
 */
export const test = base.extend({
    /**
     * Authenticated page fixture
     * Provides a page that's already logged in
     */
    authenticatedPage: async ({ page }, use) => {
        // Generate test user
        const user: TestUser = {
            email: faker.internet.email(),
            password: faker.internet.password(),
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName()
        };

        // Register user
        await page.goto('/register');
        await page.getByLabel('First Name').fill(user.firstName);
        await page.getByLabel('Last Name').fill(user.lastName);
        await page.getByLabel('Email').fill(user.email);
        await page.getByLabel('Password').fill(user.password);
        await page.getByLabel('Confirm Password').fill(user.password);
        await page.getByRole('button', { name: 'Create Account' }).click();

        // Login
        await page.goto('/login');
        await page.getByLabel('Email').fill(user.email);
        await page.getByLabel('Password').fill(user.password);
        await page.getByRole('button', { name: 'Login' }).click();

        // Wait for login to complete
        await expect(page.getByText(`Welcome, ${user.firstName}`)).toBeVisible();

        // Use the authenticated page
        await use(page);

        // Cleanup - logout
        await page.goto('/logout');
    },

    /**
     * Console error monitoring fixture
     * Tracks console errors during test execution
     */
    consoleErrors: async ({ page }, use) => {
        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await use(errors);
    },

    /**
     * Clean shopping cart fixture
     * Ensures cart is empty before test
     */
    cleanCart: async ({ page }, use) => {
        await page.goto('/cart');
        const clearCartButton = page.getByRole('button', { name: 'Clear Cart' });
        if (await clearCartButton.isVisible()) {
            await clearCartButton.click();
        }
        await use(page);
    },

    /**
     * Test data fixture
     * Provides common test data
     */
    testData: async ({}, use) => {
        const data = {
            user: {
                email: faker.internet.email(),
                password: faker.internet.password(),
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName()
            },
            product: {
                name: faker.commerce.productName(),
                price: faker.commerce.price(),
                description: faker.commerce.productDescription()
            },
            address: {
                street: faker.location.streetAddress(),
                city: faker.location.city(),
                state: faker.location.state(),
                zip: faker.location.zipCode()
            }
        };

        await use(data);
    }
});

export { expect } from '@playwright/test'; 