import { Locator, Page } from '@playwright/test';

export class ContactModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('#exampleModal');
    this.nameInput = page.locator('#recipient-name');
    this.emailInput = page.locator('#recipient-email');
    this.messageInput = page.locator('#message-text');
    this.sendButton = this.modal.locator('button', { hasText: 'Send message' });
    this.closeButton = this.modal.locator('button', { hasText: 'Close' });
  }

  async waitForOpen(): Promise<void> {
    await this.modal.waitFor({ state: 'visible' });
  }

  async fill(options: { name?: string; email?: string; message?: string }): Promise<void> {
    if (options.name !== undefined) await this.nameInput.fill(options.name);
    if (options.email !== undefined) await this.emailInput.fill(options.email);
    if (options.message !== undefined) await this.messageInput.fill(options.message);
  }

  async sendAndWaitForAlert(): Promise<string> {
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.sendButton.click();
    const dialog = await dialogPromise;
    const message = dialog.message();
    await dialog.accept();
    return message;
  }

  async close(): Promise<void> {
    await this.closeButton.click();
  }

  async isOpen(): Promise<boolean> {
    return this.modal.isVisible();
  }
}
