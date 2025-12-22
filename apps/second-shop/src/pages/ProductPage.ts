import { expect, Page } from '@playwright/test';

export class ProductPage {
  private readonly addToCartLink = this.page.getByRole('link', { name: 'Add to cart' });
  private readonly productTitle = this.page.locator('.name');

  constructor(private readonly page: Page) {}

  async waitForLoaded(name: string): Promise<void> {
    await expect(this.productTitle).toContainText(name);
  }

  async addToCart(): Promise<void> {
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.addToCartLink.click();
    const dialog = await dialogPromise;
    await dialog.accept();
  }
}
