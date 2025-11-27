// src/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';
import { BaseForm } from './BaseForm';
import { step } from '../utils/stepDecorator.ts';

export class LoginPage extends BaseForm {
  readonly usernameInput: Locator = this.page.getByTestId('username');
  readonly passwordInput: Locator = this.page.getByTestId('password');
  readonly loginButton: Locator = this.page.getByTestId('login-button');
  readonly errorMessage: Locator = this.page.getByTestId('error');
  readonly errorCloseButton: Locator = this.page.locator('.error-button');

  constructor(page: Page) {
    super(page, page.locator('body'), 'Login form');
  }

  @step('Open login page')
  async open(): Promise<void> {
    await this.page.goto('/');
  }

  @step('Login with username and password')
  async login(username: string, password: string): Promise<void> {
    await this.open();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  @step('Get login error text')
  async getErrorText(): Promise<string> {
    const text = await this.errorMessage.textContent();
    return text ?? '';
  }

  @step('Close login error message')
  async closeError(): Promise<void> {
    await this.errorCloseButton.click();
  }
}
