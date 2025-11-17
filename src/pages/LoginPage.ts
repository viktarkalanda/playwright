import { Page, Locator } from '@playwright/test';
import { BaseForm } from './BaseForm';

export class LoginPage extends BaseForm {
  readonly usernameInput: Locator = this.page.getByTestId('username');
  readonly passwordInput: Locator = this.page.getByTestId('password');
  readonly loginButton: Locator = this.page.getByTestId('login-button');
  readonly errorMessage: Locator = this.page.getByTestId('error');

  constructor(page: Page) {
    super(page, page.locator('body'), 'Login form');
  }

  async open(): Promise<void> {
    await this.page.goto('/');
  }

  async login(username: string, password: string): Promise<void> {
    await this.open();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async getErrorText(): Promise<string> {
    const text = await this.errorMessage.textContent();
    return text ?? '';
  }
}
