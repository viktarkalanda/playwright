import { Page, Locator } from '@playwright/test';

/**
 * ContactPage represents the contact form and support interface.
 * Provides functionality for sending messages, support requests, and feedback.
 * 
 * Key Features:
 * - Contact form submission
 * - Support ticket creation
 * - FAQ section navigation
 * - Live chat integration
 * 
 * @example
 * ```typescript
 * const contact = new ContactPage(page);
 * await contact.submitContactForm({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   message: 'Hello!'
 * });
 * await contact.openLiveChat();
 * ```
 */
export class ContactPage {
    readonly page: Page;

    // Contact Form
    readonly contactForm: Locator;
    readonly nameInput: Locator;
    readonly emailInput: Locator;
    readonly subjectInput: Locator;
    readonly messageInput: Locator;
    readonly attachmentInput: Locator;
    readonly submitButton: Locator;
    readonly successMessage: Locator;

    // Support Tickets
    readonly ticketSection: Locator;
    readonly createTicketButton: Locator;
    readonly ticketTypeSelect: Locator;
    readonly prioritySelect: Locator;
    readonly ticketDescriptionInput: Locator;
    readonly submitTicketButton: Locator;
    readonly ticketList: Locator;

    // FAQ Section
    readonly faqSection: Locator;
    readonly faqCategories: Locator;
    readonly faqSearch: Locator;
    readonly faqQuestions: Locator;
    readonly faqAnswers: Locator;

    // Live Chat
    readonly chatButton: Locator;
    readonly chatWindow: Locator;
    readonly chatInput: Locator;
    readonly chatSendButton: Locator;
    readonly chatCloseButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Contact Form
        this.contactForm = page.locator('.contact-form');
        this.nameInput = page.locator('#contact-name');
        this.emailInput = page.locator('#contact-email');
        this.subjectInput = page.locator('#contact-subject');
        this.messageInput = page.locator('#contact-message');
        this.attachmentInput = page.locator('#contact-attachment');
        this.submitButton = page.locator('[data-testid="submit-contact"]');
        this.successMessage = page.locator('.success-message');

        // Support Tickets
        this.ticketSection = page.locator('.support-tickets');
        this.createTicketButton = page.locator('[data-testid="create-ticket"]');
        this.ticketTypeSelect = page.locator('#ticket-type');
        this.prioritySelect = page.locator('#ticket-priority');
        this.ticketDescriptionInput = page.locator('#ticket-description');
        this.submitTicketButton = page.locator('[data-testid="submit-ticket"]');
        this.ticketList = page.locator('.ticket-list');

        // FAQ Section
        this.faqSection = page.locator('.faq-section');
        this.faqCategories = page.locator('.faq-categories');
        this.faqSearch = page.locator('#faq-search');
        this.faqQuestions = page.locator('.faq-questions');
        this.faqAnswers = page.locator('.faq-answers');

        // Live Chat
        this.chatButton = page.locator('[data-testid="open-chat"]');
        this.chatWindow = page.locator('.chat-window');
        this.chatInput = page.locator('#chat-input');
        this.chatSendButton = page.locator('[data-testid="send-message"]');
        this.chatCloseButton = page.locator('[data-testid="close-chat"]');
    }

    /**
     * Submits the contact form
     * @param form - Contact form details
     */
    async submitContactForm(form: {
        name: string;
        email: string;
        subject: string;
        message: string;
        attachment?: string;
    }) {
        await this.nameInput.fill(form.name);
        await this.emailInput.fill(form.email);
        await this.subjectInput.fill(form.subject);
        await this.messageInput.fill(form.message);
        
        if (form.attachment) {
            await this.attachmentInput.setInputFiles(form.attachment);
        }
        
        await this.submitButton.click();
        await this.successMessage.waitFor();
    }

    /**
     * Creates a support ticket
     * @param ticket - Ticket details
     */
    async createSupportTicket(ticket: {
        type: string;
        priority: string;
        description: string;
    }) {
        await this.createTicketButton.click();
        await this.ticketTypeSelect.selectOption(ticket.type);
        await this.prioritySelect.selectOption(ticket.priority);
        await this.ticketDescriptionInput.fill(ticket.description);
        await this.submitTicketButton.click();
    }

    /**
     * Views ticket details
     * @param index - Ticket index in the list
     */
    async viewTicketDetails(index: number) {
        await this.ticketList.nth(index).click();
        await this.page.locator('.ticket-details').waitFor();
    }

    /**
     * Searches FAQ section
     * @param query - Search query
     */
    async searchFAQ(query: string) {
        await this.faqSearch.fill(query);
        await this.faqQuestions.waitFor();
    }

    /**
     * Selects FAQ category
     * @param category - Category name
     */
    async selectFAQCategory(category: string) {
        await this.faqCategories.locator(`text=${category}`).click();
        await this.faqQuestions.waitFor();
    }

    /**
     * Views FAQ answer
     * @param index - Question index
     */
    async viewFAQAnswer(index: number) {
        await this.faqQuestions.nth(index).click();
        await this.faqAnswers.nth(index).waitFor();
    }

    /**
     * Opens live chat window
     */
    async openLiveChat() {
        await this.chatButton.click();
        await this.chatWindow.waitFor();
    }

    /**
     * Sends a chat message
     * @param message - Message text
     */
    async sendChatMessage(message: string) {
        await this.chatInput.fill(message);
        await this.chatSendButton.click();
    }

    /**
     * Closes live chat window
     */
    async closeLiveChat() {
        await this.chatCloseButton.click();
        await this.chatWindow.waitFor({ state: 'hidden' });
    }
} 