// src/pages/saucedemo/LoginPage.ts
import { Page, Locator } from '@playwright/test';
import { BaseForm } from './BaseForm';
import { step } from '../../utils/stepDecorator';
import { TestConfig, UserKey } from '../../config/testConfig';

const config = TestConfig.getInstance();

export class LoginPage extends BaseForm {
  readonly usernameInput: Locator = this.page.getByTestId('username');
  readonly passwordInput: Locator = this.page.getByTestId('password');
  readonly loginButton: Locator = this.page.getByTestId('login-button');
  readonly errorMessage: Locator = this.page.getByTestId('error');
  readonly errorCloseButton: Locator = this.page.locator('.error-button');
  readonly mainHeader: Locator = this.page.locator('.login_logo');

  constructor(page: Page) {
    // Use the login button as the form sentinel: it only exists on the login page,
    // so waitForVisible() correctly confirms the login form is on screen.
    super(page, page.getByTestId('login-button'), 'Login form');
  }

  @step('Open login page')
  async open(): Promise<void> {
    await this.page.goto('/');
  }

  @step('Fill username')
  async fillUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }

  @step('Fill password')
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  @step('Click login button')
  async submitLogin(): Promise<void> {
    await this.loginButton.click();
  }

  @step('Login with username and password')
  async login(username: string, password: string): Promise<void> {
    await this.open();
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.submitLogin();
  }

  @step('Login as predefined user')
  async loginAs(userKey: UserKey): Promise<void> {
    const { username, password } = config.getUser(userKey);
    await this.login(username, password);
  }

  @step('Get login error text')
  async getErrorText(): Promise<string> {
    const text = await this.errorMessage.textContent();
    return text ?? '';
  }

  @step('Get login page main header text')
  async getMainHeaderText(): Promise<string> {
    const text = await this.mainHeader.textContent();
    return text?.trim() ?? '';
  }

  @step('Get login button text')
  async getLoginButtonText(): Promise<string> {
    const text = await this.loginButton.textContent();
    return text?.trim() ?? '';
  }

  @step('Check if login error is visible')
  async isErrorVisible(): Promise<boolean> {
    return this.errorMessage.isVisible();
  }

  @step('Close login error message')
  async closeError(): Promise<void> {
    await this.errorCloseButton.click();
  }
}
