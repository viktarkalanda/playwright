import { Locator, Page } from '@playwright/test';

export class SignUpModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly signUpButton: Locator;
  readonly closeButton: Locator;
  readonly xButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('#signInModal');
    this.usernameInput = page.locator('#sign-username');
    this.passwordInput = page.locator('#sign-password');
    this.signUpButton = this.modal.locator('button', { hasText: 'Sign up' });
    this.closeButton = this.modal.locator('button', { hasText: 'Close' });
    this.xButton = this.modal.locator('button.close');
  }

  async waitForOpen(): Promise<void> {
    await this.modal.waitFor({ state: 'visible' });
  }

  async waitForClosed(): Promise<void> {
    await this.modal.waitFor({ state: 'hidden' });
    await this.page.locator('.modal-backdrop').waitFor({ state: 'hidden' });
  }

  async fill(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async signUpAndWaitForAlert(): Promise<string> {
    const messagePromise = new Promise<string>((resolve) => {
      this.page.once('dialog', async (dialog) => {
        const msg = dialog.message();
        await dialog.dismiss();
        resolve(msg);
      });
    });
    await this.signUpButton.click();
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
