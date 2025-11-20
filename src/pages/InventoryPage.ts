import { Page, Locator } from '@playwright/test';
import { BaseForm } from './BaseForm';

export class InventoryPage extends BaseForm {
  readonly inventoryContainer: Locator = this.page.locator('.inventory_list');
  readonly inventoryItems: Locator = this.page.locator('.inventory_item');
  readonly pageTitle: Locator = this.page.locator('.title');
  readonly cartIcon: Locator = this.page.getByTestId('shopping-cart-link');
  readonly firstInventoryItem: Locator = this.inventoryItems.first();
  readonly firstItemAddToCartButton: Locator = this.firstInventoryItem.getByRole('button', {
    name: 'Add to cart',
  });

  constructor(page: Page) {
    super(page, page.locator('.inventory_list'), 'Inventory page');
  }

  async getItemsCount(): Promise<number> {
    return await this.inventoryItems.count();
  }

  async getTitleText(): Promise<string> {
    return (await this.pageTitle.textContent()) || '';
  }

  async addFirstItemToCart(): Promise<void> {
    await this.firstItemAddToCartButton.click();
  }

  async openCart(): Promise<void> {
    await this.cartIcon.click();
  }
}
