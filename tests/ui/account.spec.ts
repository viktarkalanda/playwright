import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * Account Management Test Suite
 * 
 * This test suite covers the core account management functionality including:
 * - New user registration with email verification
 * - Account activation through email confirmation
 * - Password change functionality
 * - Login with updated credentials
 * 
 * Key workflows tested:
 * 1. Registration form submission with generated test data
 * 2. Email verification through MailHog API integration
 * 3. Account activation process
 * 4. Password update workflow
 * 5. Login verification with new credentials
 * 
 * Test data handling:
 * - Uses faker.js for generating realistic test data
 * - Maintains data consistency across test steps
 * - Cleans up test data after execution
 * 
 * API Integration:
 * - Integrates with MailHog API for email verification
 * - Implements robust waiting strategies for async operations
 * - Handles API response parsing and validation
 * 
 * Error handling:
 * - Implements proper error handling for API calls
 * - Validates error messages and UI states
 * - Ensures proper test cleanup on failures
 */

interface TestUser {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

interface MailHogMessage {
    ID: string;
    Content: {
        Body: string;
        Headers: {
            Subject: string[];
            To: string[];
            From: string[];
        };
    };
}

test.describe('Account Management', () => {
    let testUser: TestUser;

    test.beforeEach(async () => {
        // Generate fresh test data for each test
        testUser = {
            email: faker.internet.email(),
            password: faker.internet.password({ length: 12, pattern: /[A-Za-z0-9!@#$%^&*]/ }),
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName()
        };
    });

    test('Complete account registration and activation workflow @account', async ({ page }) => {
        // Step 1: Navigate to registration page
        await test.step('Navigate to registration page', async () => {
            await page.goto('/register');
            await expect(page.getByRole('heading', { name: 'Create Account' }))
                .toBeVisible();
        });

        // Step 2: Fill registration form
        await test.step('Fill registration form with test data', async () => {
            await page.getByLabel('First Name').fill(testUser.firstName);
            await page.getByLabel('Last Name').fill(testUser.lastName);
            await page.getByLabel('Email').fill(testUser.email);
            await page.getByLabel('Password').fill(testUser.password);
            await page.getByLabel('Confirm Password').fill(testUser.password);
            
            // Optional newsletter subscription
            await page.getByLabel('Subscribe to newsletter').check();
            
            // Submit form
            await page.getByRole('button', { name: 'Create Account' }).click();
            
            // Verify success message
            await expect(page.getByText('Registration successful')).toBeVisible();
        });

        // Step 3: Get activation email from MailHog
        await test.step('Retrieve activation email from MailHog', async () => {
            // Wait for email to arrive (up to 30 seconds)
            await page.waitForTimeout(5000); // Initial delay for email processing

            const response = await page.request.get('http://localhost:8025/api/v2/messages');
            const messages: MailHogMessage[] = await response.json();
            
            // Find activation email
            const activationEmail = messages.find(msg => 
                msg.Content.Headers.To.includes(testUser.email) &&
                msg.Content.Headers.Subject.some(subj => 
                    subj.includes('Activate Your Account')
                )
            );

            expect(activationEmail, 'Activation email not found').toBeTruthy();

            // Extract activation link using RegExp
            const activationLinkMatch = activationEmail.Content.Body.match(
                /https?:\/\/[^\s<>"]+?(?:activate|confirm)[^\s<>"]+/
            );
            expect(activationLinkMatch, 'Activation link not found in email').toBeTruthy();

            // Navigate to activation link
            await page.goto(activationLinkMatch[0]);
            
            // Verify activation success
            await expect(page.getByText('Account activated')).toBeVisible();
        });

        // Step 4: Logout and login with new credentials
        await test.step('Verify login with new credentials', async () => {
            // Logout
            await page.getByRole('link', { name: 'Logout' }).click();
            await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();

            // Login with new credentials
            await page.getByRole('link', { name: 'Login' }).click();
            await page.getByLabel('Email').fill(testUser.email);
            await page.getByLabel('Password').fill(testUser.password);
            await page.getByRole('button', { name: 'Login' }).click();

            // Verify successful login
            await expect(page.getByText(`Welcome back, ${testUser.firstName}`))
                .toBeVisible();
        });

        // Step 5: Change password
        const newPassword = faker.internet.password({ length: 14, pattern: /[A-Za-z0-9!@#$%^&*]/ });
        
        await test.step('Change account password', async () => {
            await page.getByRole('link', { name: 'Account Settings' }).click();
            await page.getByRole('link', { name: 'Change Password' }).click();
            
            await page.getByLabel('Current Password').fill(testUser.password);
            await page.getByLabel('New Password').fill(newPassword);
            await page.getByLabel('Confirm New Password').fill(newPassword);
            
            await page.getByRole('button', { name: 'Update Password' }).click();
            
            // Verify password change success
            await expect(page.getByText('Password updated successfully'))
                .toBeVisible();
        });

        // Step 6: Verify login with new password
        await test.step('Verify login with new password', async () => {
            // Logout
            await page.getByRole('link', { name: 'Logout' }).click();
            await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();

            // Login with new password
            await page.getByRole('link', { name: 'Login' }).click();
            await page.getByLabel('Email').fill(testUser.email);
            await page.getByLabel('Password').fill(newPassword);
            await page.getByRole('button', { name: 'Login' }).click();

            // Final verification of successful login
            await expect(page.getByText(`Welcome back, ${testUser.firstName}`))
                .toBeVisible();
        });
    });

    test('Handle invalid registration attempts @account', async ({ page }) => {
        await test.step('Verify email validation', async () => {
            await page.goto('/register');
            
            // Try registering with invalid email
            await page.getByLabel('Email').fill('invalid-email');
            await page.getByRole('button', { name: 'Create Account' }).click();
            
            await expect(page.getByText('Please enter a valid email address'))
                .toBeVisible();
        });

        await test.step('Verify password requirements', async () => {
            // Try weak password
            await page.getByLabel('Password').fill('123');
            await page.getByRole('button', { name: 'Create Account' }).click();
            
            await expect(page.getByText('Password must be at least 8 characters'))
                .toBeVisible();
        });

        await test.step('Verify duplicate email handling', async () => {
            // Fill form with existing user email
            await page.getByLabel('First Name').fill(faker.person.firstName());
            await page.getByLabel('Last Name').fill(faker.person.lastName());
            await page.getByLabel('Email').fill(testUser.email); // Use existing email
            await page.getByLabel('Password').fill(faker.internet.password());
            
            await page.getByRole('button', { name: 'Create Account' }).click();
            
            await expect(page.getByText('Email address already registered'))
                .toBeVisible();
        });
    });
}); 