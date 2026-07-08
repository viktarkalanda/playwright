import { Locator, Page } from '@playwright/test';
import { secondShopConfig } from '../../second-shop/config/secondShopConfig';

export class HomePage {
  readonly page: Page;
  readonly logo: Locator;
  readonly categoryLinks: Locator;
  readonly productCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logo = page.locator('#nava');
    this.categoryLinks = page.locator('#itemc');
    this.productCards = page.locator('#tbodyid .card');
  }

  async open(): Promise<void> {
    await this.page.goto(`${secondShopConfig.getBaseUrl()}/`);
  }

  async waitForLoaded(): Promise<void> {
    await this.logo.waitFor({ state: 'visible' });
    await this.productCards.first().waitFor({ state: 'visible', timeout: 15_000 });
  }

  async selectCategoryByName(name: string): Promise<void> {
    const responsePromise = this.page
      .waitForResponse((res) => res.url().includes('bycat'), { timeout: 10_000 })
      .catch(() => null);
    await this.categoryLinks.filter({ hasText: name }).first().click();
    await responsePromise;
    await this.productCards.first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  }

  async openProductByName(name: string): Promise<void> {
    await this.page.locator('#tbodyid .card-title', { hasText: name }).first().click();
  }

  async getVisibleProductNames(): Promise<string[]> {
    const names = await this.page.locator('#tbodyid .card-title').allTextContents();
    return names.map((n) => n.trim()).filter((n) => n.length > 0);
  }
}
