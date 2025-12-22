import { Page } from '@playwright/test';

export class CartPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/cart.html');
  }

  get items() {
    return this.page.locator('#tbodyid > tr');
  }

  get itemNames() {
    return this.page.locator('#tbodyid > tr td:nth-child(2)');
  }
}
