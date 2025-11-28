// src/pages/CartPage.ts
import { Page, Locator } from '@playwright/test';
import { BaseForm } from './BaseForm';
import { step } from '../utils/stepDecorator';

export class CartPage extends BaseForm {
  readonly cartItems: Locator = this.page.locator('.cart_item');
  readonly cartItemNames: Locator = this.page.locator('.inventory_item_name');
  readonly continueShoppingButton: Locator = this.page.locator('[data-test="continue-shopping"]');
  readonly checkoutButton: Locator = this.page.locator('[data-test="checkout"]');

  constructor(page: Page) {
    super(page, page.locator('.cart_list'), 'Cart page');
  }

  @step('Wait for cart to be visible')
  async waitForVisible(): Promise<void> {
    await super.waitForVisible();
  }

  @step('Get cart items count')
  async getItemsCount(): Promise<number> {
    return this.cartItems.count();
  }

  @step('Check if cart has item with given name')
  async hasItemWithName(name: string): Promise<boolean> {
    const item = this.cartItemNames.filter({ hasText: name });
    return (await item.count()) > 0;
  }

  @step('Continue shopping from cart')
  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }

  @step('Start checkout from cart')
  async startCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
