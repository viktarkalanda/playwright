import { Locator, Page } from '@playwright/test';
import { secondShopConfig } from '../../second-shop/config/secondShopConfig';

export class CartPage {
  readonly page: Page;
  readonly cartRows: Locator;
  readonly deleteButtons: Locator;
  readonly placeOrderButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartRows = page.locator('#tbodyid > tr');
    this.deleteButtons = page.locator('#tbodyid > tr a', { hasText: 'Delete' });
    this.placeOrderButton = page.locator('button', { hasText: 'Place Order' });
  }

  async open(): Promise<void> {
    await this.page.goto(`${secondShopConfig.getBaseUrl()}/cart.html`);
  }

  async waitForVisible(): Promise<void> {
    await this.cartRows.first().waitFor({ state: 'visible' }).catch(() => {});
  }

  async getCartItemNames(): Promise<string[]> {
    const names = await this.cartRows.locator('td:nth-child(2)').allTextContents();
    return names.map((n) => n.trim()).filter((n) => n.length > 0);
  }

  async removeItemByName(name: string): Promise<void> {
    const rows = this.cartRows;
    const count = await rows.count();
    for (let i = 0; i < count; i += 1) {
      const rowText = await rows.nth(i).locator('td:nth-child(2)').textContent();
      if ((rowText ?? '').includes(name)) {
        await this.deleteButtons.nth(i).click();
        return;
      }
    }
    throw new Error(`Item with name "${name}" not found in cart`);
  }

  async isEmpty(): Promise<boolean> {
    const count = await this.cartRows.count();
    return count === 0;
  }

  async clearCartIfPossible(): Promise<void> {
    let count = await this.deleteButtons.count();
    while (count > 0) {
      await this.deleteButtons.first().click();
      count = await this.deleteButtons.count();
    }
  }

  async openPlaceOrderDialogIfPossible(): Promise<void> {
    if (await this.placeOrderButton.isVisible()) {
      await this.placeOrderButton.click();
    }
  }
}
