import { Page, Locator } from '@playwright/test';
import { BaseForm } from './BaseForm';

export class CartPage extends BaseForm {
  readonly cartItems: Locator = this.page.locator('.cart_item');
  readonly cartItemNames: Locator = this.page.locator('.cart_item .inventory_item_name');

  constructor(page: Page) {
    super(page, page.locator('.cart_list'), 'Cart page');
  }

  async getItemsCount(): Promise<number> {
    return this.cartItems.count();
  }

  async hasItemWithName(name: string): Promise<boolean> {
    const item = this.cartItemNames.filter({ hasText: name });
    return (await item.count()) > 0;
  }
}
