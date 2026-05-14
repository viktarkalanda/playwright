import { Locator, Page } from '@playwright/test';

export class NavBar {
  readonly page: Page;
  readonly loginButton: Locator;
  readonly signUpButton: Locator;
  readonly logoutLink: Locator;
  readonly contactLink: Locator;
  readonly loggedInUsername: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginButton = page.locator('#login2');
    this.signUpButton = page.locator('#signin2');
    this.logoutLink = page.locator('#logout2');
    this.contactLink = page.locator('a', { hasText: 'Contact' }).first();
    this.loggedInUsername = page.locator('#nameofuser');
  }

  async openLoginModal(): Promise<void> {
    await this.loginButton.click();
  }

  async openSignUpModal(): Promise<void> {
    await this.signUpButton.click();
  }

  async openContactModal(): Promise<void> {
    await this.contactLink.click();
  }

  async logout(): Promise<void> {
    await this.logoutLink.click();
  }

  async isLoggedIn(): Promise<boolean> {
    return this.logoutLink.isVisible();
  }

  async getLoggedInUsername(): Promise<string> {
    const text = await this.loggedInUsername.textContent();
    return (text ?? '').replace('Welcome', '').trim();
  }
}
