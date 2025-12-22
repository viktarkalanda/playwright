import { expect, Page } from '@playwright/test';

export class HomePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async openProduct(name: string): Promise<void> {
    const productLink = this.page.locator('.card-title a', { hasText: name });
    await expect(productLink).toBeVisible();
    await productLink.first().click();
  }
}
