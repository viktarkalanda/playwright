import { Locator, Page } from '@playwright/test';

export class SignUpModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly signUpButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('#signInModal');
    this.usernameInput = page.locator('#sign-username');
    this.passwordInput = page.locator('#sign-password');
    this.signUpButton = this.modal.locator('button', { hasText: 'Sign up' });
    this.closeButton = this.modal.locator('button', { hasText: 'Close' });
  }

  async waitForOpen(): Promise<void> {
    await this.modal.waitFor({ state: 'visible' });
  }

  async fill(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async signUpAndWaitForAlert(): Promise<string> {
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.signUpButton.click();
    const dialog = await dialogPromise;
    const message = dialog.message();
    await dialog.dismiss();
    return message;
  }

  async close(): Promise<void> {
    await this.closeButton.click();
  }

  async isOpen(): Promise<boolean> {
    return this.modal.isVisible();
  }
}
