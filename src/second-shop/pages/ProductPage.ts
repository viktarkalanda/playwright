import { Locator, Page } from '@playwright/test';

export class ProductPage {
  readonly page: Page;
  readonly title: Locator;
  readonly price: Locator;
  readonly description: Locator;
  readonly addToCartButton: Locator;
  readonly cartLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('.name');
    this.price = page.locator('.price-container');
    this.description = page.locator('#more-information, #tbodyid .description');
    this.addToCartButton = page.locator('a', { hasText: 'Add to cart' });
    this.cartLink = page.locator('#cartur');
  }

  async waitForVisible(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  async getProductName(): Promise<string> {
    const text = await this.title.textContent();
    return (text ?? '').trim();
  }

  async getProductPriceRaw(): Promise<string> {
    const text = await this.price.textContent();
    return (text ?? '').trim();
  }

  async addToCart(): Promise<void> {
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.addToCartButton.click();
    const dialog = await dialogPromise;
    await dialog.accept();
  }

  async goToCart(): Promise<void> {
    await this.cartLink.click();
  }
}
