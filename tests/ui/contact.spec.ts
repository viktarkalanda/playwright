import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { ContactPage } from '../../src/pageObjects/ContactPage';

/**
 * @test
 * Scenario: Contact Form Test Suite
 * Page Objects: ContactPage
 * 
 * This test suite validates the contact form functionality including:
 * - Form submission with various types of messages
 * - Support ticket creation and management
 * - FAQ section navigation
 * - Live chat functionality
 * 
 * Key aspects tested:
 * 1. Contact form submission
 * 2. Support ticket lifecycle
 * 3. FAQ search and navigation
 * 4. Live chat operations
 * 
 * Test data handling:
 * - Uses faker.js for generating realistic test data
 * - Tests different message types and priorities
 * - Validates form submissions and responses
 */

interface ContactMessage {
    name: string;
    email: string;
    subject: string;
    message: string;
    attachment?: string;
}

interface SupportTicket {
    type: string;
    priority: string;
    description: string;
}

test.describe('Contact Form', () => {
    let contact: ContactPage;
    let consoleErrors: string[] = [];
    
    test.beforeEach(async ({ page }) => {
        contact = new ContactPage(page);
        consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
    });

    test('Submit contact form with attachment @contact', async ({ page }) => {
        const contactData: ContactMessage = {
            name: faker.person.fullName(),
            email: faker.internet.email(),
            subject: faker.lorem.sentence(),
            message: faker.lorem.paragraphs(2),
            attachment: 'test-artifacts/document.pdf'
        };

        await test.step('Submit contact form', async () => {
            await contact.submitContactForm(contactData);

            // Verify success message
            await expect(contact.successMessage).toBeVisible();
        });

        await test.step('Verify no console errors', async () => {
            expect(consoleErrors).toHaveLength(0);
        });
    });

    test('Create and manage support ticket @contact', async ({ page }) => {
        const ticket: SupportTicket = {
            type: 'Technical Issue',
            priority: 'High',
            description: faker.lorem.paragraph()
        };

        await test.step('Create support ticket', async () => {
            await contact.createSupportTicket(ticket);
            
            // View ticket details
            await contact.viewTicketDetails(0);
            
            // Verify ticket content
            await expect(page.locator('.ticket-details')).toContainText(ticket.description);
        });
    });

    test('Search and navigate FAQ section @contact', async ({ page }) => {
        await test.step('Search FAQ', async () => {
            await contact.searchFAQ('return policy');
            
            // Verify search results
            await expect(contact.faqQuestions).toBeVisible();
        });

        await test.step('View FAQ answer', async () => {
            await contact.selectFAQCategory('Orders');
            await contact.viewFAQAnswer(0);
            
            // Verify answer is displayed
            await expect(contact.faqAnswers).toBeVisible();
        });
    });

    test('Use live chat functionality @contact', async ({ page }) => {
        await test.step('Start chat session', async () => {
            await contact.openLiveChat();
            
            // Send test message
            await contact.sendChatMessage('Hello, I need help with my order');
            
            // Verify message sent
            await expect(page.locator('.chat-window')).toContainText('Hello, I need help');
        });

        await test.step('Close chat session', async () => {
            await contact.closeLiveChat();
            
            // Verify chat window is closed
            await expect(contact.chatWindow).toBeHidden();
        });
    });

    test('Validate contact form fields @contact', async ({ page }) => {
        await test.step('Try invalid email', async () => {
            await expect(contact.submitContactForm({
                name: faker.person.fullName(),
                email: 'invalid-email',
                subject: faker.lorem.sentence(),
                message: faker.lorem.paragraph()
            })).rejects.toThrow();
        });

        await test.step('Try too short message', async () => {
            await expect(contact.submitContactForm({
                name: faker.person.fullName(),
                email: faker.internet.email(),
                subject: faker.lorem.sentence(),
                message: 'Hi'
            })).rejects.toThrow();
        });

        await test.step('Try too large attachment', async () => {
            const largeFile = 'test-artifacts/large.pdf'; // 6MB file
            await expect(contact.submitContactForm({
                name: faker.person.fullName(),
                email: faker.internet.email(),
                subject: faker.lorem.sentence(),
                message: faker.lorem.paragraph(),
                attachment: largeFile
            })).rejects.toThrow();
        });
    });
}); 