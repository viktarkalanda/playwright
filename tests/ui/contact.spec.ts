import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * Contact Form Test Suite
 * 
 * This test suite validates the contact form functionality including:
 * - Form submission with various types of messages
 * - Email notification verification through MailHog
 * - Console error monitoring
 * - Form validation
 * 
 * Key aspects tested:
 * 1. Basic contact form submission
 * 2. Form field validation
 * 3. Success message verification
 * 4. Email delivery confirmation
 * 5. Console error monitoring
 * 
 * Test data handling:
 * - Uses faker.js for generating realistic test data
 * - Tests different message types and lengths
 * - Validates email format requirements
 * 
 * Error handling:
 * - Monitors browser console for JS errors
 * - Validates form error states
 * - Ensures proper cleanup after tests
 * 
 * Integration points:
 * - MailHog API for email verification
 * - Console API for error monitoring
 * - Form submission endpoints
 */

interface ContactMessage {
    subject: string;
    email: string;
    message: string;
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

test.describe('Contact Form', () => {
    let consoleErrors: string[] = [];
    
    // Setup console error monitoring
    test.beforeEach(async ({ page }) => {
        consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
    });

    test('Submit contact form and verify email delivery @contact', async ({ page }) => {
        const contactData: ContactMessage = {
            subject: faker.lorem.sentence(),
            email: faker.internet.email(),
            message: faker.lorem.paragraphs(2)
        };

        await test.step('Navigate to contact page', async () => {
            await page.goto('/contact');
            await expect(page.getByRole('heading', { name: 'Contact Us' }))
                .toBeVisible();
        });

        await test.step('Fill and submit contact form', async () => {
            // Fill form fields
            await page.getByLabel('Subject').fill(contactData.subject);
            await page.getByLabel('Email').fill(contactData.email);
            await page.getByLabel('Message').fill(contactData.message);

            // Optional fields
            await page.getByLabel('Department').selectOption('Customer Support');
            await page.getByLabel('Priority').selectOption('Normal');

            // Submit form
            await page.getByRole('button', { name: 'Send Message' }).click();

            // Verify success message
            await expect(page.getByText('Your message has been successfully sent'))
                .toBeVisible();
        });

        await test.step('Verify email delivery in MailHog', async () => {
            // Wait for email processing
            await page.waitForTimeout(5000);

            // Check MailHog API for the contact email
            const response = await page.request.get('http://localhost:8025/api/v2/messages');
            const messages: MailHogMessage[] = await response.json();

            const contactEmail = messages.find(msg =>
                msg.Content.Headers.Subject.some(subj => 
                    subj.includes('Contact request')
                )
            );

            expect(contactEmail, 'Contact email not found in MailHog').toBeTruthy();
            expect(contactEmail.Content.Body).toContain(contactData.message);
        });

        await test.step('Verify no console errors', async () => {
            expect(consoleErrors).toHaveLength(0);
        });
    });

    test('Validate contact form fields @contact', async ({ page }) => {
        await test.step('Navigate to contact page', async () => {
            await page.goto('/contact');
        });

        await test.step('Verify email validation', async () => {
            // Try invalid email
            await page.getByLabel('Email').fill('invalid-email');
            await page.getByRole('button', { name: 'Send Message' }).click();

            await expect(page.getByText('Please enter a valid email address'))
                .toBeVisible();
        });

        await test.step('Verify required fields', async () => {
            // Clear all fields
            await page.getByLabel('Subject').clear();
            await page.getByLabel('Email').clear();
            await page.getByLabel('Message').clear();

            await page.getByRole('button', { name: 'Send Message' }).click();

            // Check error messages
            await expect(page.getByText('Subject is required')).toBeVisible();
            await expect(page.getByText('Email is required')).toBeVisible();
            await expect(page.getByText('Message is required')).toBeVisible();
        });

        await test.step('Verify message length validation', async () => {
            // Try too short message
            await page.getByLabel('Message').fill('Hi');
            await page.getByRole('button', { name: 'Send Message' }).click();

            await expect(page.getByText('Message must be at least 10 characters'))
                .toBeVisible();

            // Try too long message
            const longMessage = faker.lorem.paragraphs(20); // Very long message
            await page.getByLabel('Message').fill(longMessage);
            await page.getByRole('button', { name: 'Send Message' }).click();

            await expect(page.getByText('Message cannot exceed 1000 characters'))
                .toBeVisible();
        });

        await test.step('Verify no console errors during validation', async () => {
            expect(consoleErrors).toHaveLength(0);
        });
    });

    test('Test file attachment handling @contact', async ({ page }) => {
        await test.step('Navigate to contact page', async () => {
            await page.goto('/contact');
        });

        await test.step('Verify file upload restrictions', async () => {
            // Setup file input handling
            const fileInput = page.getByLabel('Attachment');

            // Test invalid file type
            await fileInput.setInputFiles({
                name: 'test.exe',
                mimeType: 'application/x-msdownload',
                buffer: Buffer.from('fake executable content')
            });

            await expect(page.getByText('Invalid file type. Allowed: .pdf, .doc, .docx, .txt'))
                .toBeVisible();

            // Test file size limit
            const largeFile = Buffer.alloc(6 * 1024 * 1024); // 6MB file
            await fileInput.setInputFiles({
                name: 'large.pdf',
                mimeType: 'application/pdf',
                buffer: largeFile
            });

            await expect(page.getByText('File size cannot exceed 5MB'))
                .toBeVisible();
        });

        await test.step('Submit form with valid attachment', async () => {
            // Create valid PDF file
            const validPdf = Buffer.from('%PDF-1.4\nvalid pdf content');
            await page.getByLabel('Attachment').setInputFiles({
                name: 'document.pdf',
                mimeType: 'application/pdf',
                buffer: validPdf
            });

            // Fill other required fields
            await page.getByLabel('Subject').fill(faker.lorem.sentence());
            await page.getByLabel('Email').fill(faker.internet.email());
            await page.getByLabel('Message').fill(faker.lorem.paragraph());

            // Submit form
            await page.getByRole('button', { name: 'Send Message' }).click();

            // Verify success
            await expect(page.getByText('Your message has been successfully sent'))
                .toBeVisible();
        });

        await test.step('Verify no console errors during file handling', async () => {
            expect(consoleErrors).toHaveLength(0);
        });
    });
}); 