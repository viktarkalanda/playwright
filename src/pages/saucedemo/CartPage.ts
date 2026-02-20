// src/pages/saucedemo/CartPage.ts
import { Page, Locator } from '@playwright/test';
import { BaseForm } from './BaseForm';
import { step } from '../../utils/stepDecorator';
import {
  CartSnapshot,
  CartItemSnapshot,
  calculateSubtotal,
  roundToCents,
  findProductDefinitionByName,
  toCartItemSnapshotFromDefinition,
} from '../../utils/cartState';

export class CartPage extends BaseForm {
  readonly cartItems: Locator = this.page.locator('.cart_item');
  readonly cartItemNames: Locator = this.page.locator('.inventory_item_name');
  readonly cartItemPrices: Locator = this.cartItems.locator('.inventory_item_price');
  readonly continueShoppingButton: Locator = this.page.locator('[data-test="continue-shopping"]');
  readonly checkoutButton: Locator = this.page.locator('[data-test="checkout"]');
  readonly cartBadge: Locator = this.page.locator('.shopping_cart_badge');
  readonly pageTitle: Locator = this.page.locator('.title');

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

  @step('Get cart header text')
  async getHeaderText(): Promise<string> {
    const text = await this.pageTitle.textContent();
    return text?.trim() ?? '';
  }

  @step('Get checkout button text')
  async getCheckoutButtonText(): Promise<string> {
    const text = await this.checkoutButton.textContent();
    return text?.trim() ?? '';
  }

  @step('Get continue shopping button text')
  async getContinueShoppingButtonText(): Promise<string> {
    const text = await this.continueShoppingButton.textContent();
    return text?.trim() ?? '';
  }

  @step('Check if cart has item with given name')
  async hasItemWithName(name: string): Promise<boolean> {
    const names = await this.cartItemNames.allTextContents();
    return names.map((text) => text.trim()).some((value) => value === name);
  }

  @step('Get cart item names')
  async getItemNames(): Promise<string[]> {
    const names = await this.cartItemNames.allTextContents();
    return names.map((name) => name.trim());
  }

  @step('Get cart item prices')
  async getItemPrices(): Promise<number[]> {
    const texts = await this.cartItemPrices.allTextContents();
    return texts
      .map((text) => text.replace('$', '').trim())
      .map((raw) => Number.parseFloat(raw))
      .filter((value) => !Number.isNaN(value));
  }

  @step('Check if cart contains specific item names')
  async hasItemsWithNames(names: string[]): Promise<boolean> {
    const cartNames = await this.getItemNames();
    return names.every((name) => cartNames.includes(name));
  }

  @step('Remove item from cart by name')
  async removeItemByName(name: string): Promise<void> {
    const item = this.cartItems.filter({ hasText: name });
    await item.getByRole('button', { name: 'Remove' }).click();
  }

  @step('Continue shopping from cart')
  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }

  @step('Start checkout from cart')
  async startCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }

  @step('Proceed to checkout from cart')
  async proceedToCheckout(): Promise<void> {
    await this.startCheckout();
  }

  @step('Try to proceed to checkout with empty cart')
  async tryProceedToCheckoutWithEmptyCart(): Promise<void> {
    await this.checkoutButton.click();
  }

  @step('Get cart badge count from cart page')
  async getCartBadgeCount(): Promise<number> {
    const count = await this.cartBadge.count();
    if (count === 0) {
      return 0;
    }

    const text = await this.cartBadge.textContent();
    const numeric = Number.parseInt((text ?? '').trim(), 10);
    return Number.isNaN(numeric) ? 0 : numeric;
  }

  @step('Check if cart is empty')
  async isEmpty(): Promise<boolean> {
    return (await this.getItemsCount()) === 0;
  }

  @step('Get cart snapshot')
  async getSnapshot(): Promise<CartSnapshot> {
    const names = await this.getItemNames();
    const items: CartItemSnapshot[] = names.map((name) =>
      toCartItemSnapshotFromDefinition(findProductDefinitionByName(name)),
    );

    return {
      items,
      subtotal: roundToCents(calculateSubtotal(items)),
    };
  }
}
