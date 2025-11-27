import { Page, Locator } from '@playwright/test';
import { BaseForm } from './BaseForm';
import { step } from '../utils/stepDecorator';

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

  @step('Get inventory items count')
  async getItemsCount(): Promise<number> {
    return this.inventoryItems.count();
  }

  @step('Get inventory page title')
  async getTitleText(): Promise<string> {
    const text = await this.pageTitle.textContent();
    return text ?? '';
  }

  @step('Add first inventory item to cart')
  async addFirstItemToCart(): Promise<void> {
    await this.firstItemAddToCartButton.click();
  }

  @step('Open cart from inventory page')
  async openCart(): Promise<void> {
    await this.cartIcon.click();
  }
}
