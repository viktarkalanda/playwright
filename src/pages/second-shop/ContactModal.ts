import { Locator, Page } from '@playwright/test';

export class ContactModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly closeButton: Locator;
  readonly xButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('#exampleModal');
    this.nameInput = page.locator('#recipient-name');
    this.emailInput = page.locator('#recipient-email');
    this.messageInput = page.locator('#message-text');
    this.sendButton = this.modal.locator('button', { hasText: 'Send message' });
    this.closeButton = this.modal.locator('button', { hasText: 'Close' });
    this.xButton = this.modal.locator('button.close');
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
    const messagePromise = new Promise<string>((resolve) => {
      this.page.once('dialog', async (dialog) => {
        const msg = dialog.message();
        await dialog.accept();
        resolve(msg);
      });
    });
    await this.sendButton.click();
    return messagePromise;
  }

  async close(): Promise<void> {
    await this.xButton.click();
    await this.modal.waitFor({ state: 'hidden' });
  }

  async isOpen(): Promise<boolean> {
    return this.modal.isVisible();
  }
}
