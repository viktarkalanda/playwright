import { Locator, Page } from '@playwright/test';

export class LoginModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('#logInModal');
    this.usernameInput = page.locator('#loginusername');
    this.passwordInput = page.locator('#loginpassword');
    this.loginButton = this.modal.locator('button', { hasText: 'Log in' });
    this.closeButton = this.modal.locator('button', { hasText: 'Close' });
  }

  async waitForOpen(): Promise<void> {
    await this.modal.waitFor({ state: 'visible' });
  }

  async fill(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async loginExpectingSuccess(): Promise<void> {
    await this.loginButton.click();
    await this.page.locator('#logout2').waitFor({ state: 'visible' });
  }

  async loginExpectingAlert(): Promise<string> {
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.loginButton.click();
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
