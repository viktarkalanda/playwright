// src/pages/InventoryPage.ts
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

  // New locators
  readonly itemNames: Locator = this.page.locator('.inventory_item_name');
  readonly itemPrices: Locator = this.page.locator('.inventory_item_price');
  readonly sortDropdown: Locator = this.page.locator('[data-test="product_sort_container"]');
  readonly cartBadge: Locator = this.page.locator('.shopping_cart_badge');

  constructor(page: Page) {
    super(page, page.locator('.inventory_list'), 'Inventory page');
  }

  @step('Open inventory page')
  async open(): Promise<void> {
    await this.page.goto('/inventory.html');
    await this.waitForVisible();
  }

  @step('Get inventory items count')
  async getItemsCount(): Promise<number> {
    return this.inventoryItems.count();
  }

  @step('Get inventory page title')
  async getTitleText(): Promise<string> {
    const text = await this.pageTitle.textContent();
    return text?.trim() ?? '';
  }

  private async collectItemNames(): Promise<string[]> {
    const texts = await this.itemNames.allTextContents();
    return texts.map((t) => t.trim());
  }

  private async collectItemPrices(): Promise<number[]> {
    const texts = await this.itemPrices.allTextContents();
    return texts
      .map((t) => t.trim().replace('$', ''))
      .map((raw) => Number.parseFloat(raw))
      .filter((value) => !Number.isNaN(value));
  }

  @step('Get all inventory item names')
  async getItemNames(): Promise<string[]> {
    return this.collectItemNames();
  }

  @step('Get all inventory item prices')
  async getItemPrices(): Promise<number[]> {
    return this.collectItemPrices();
  }

  @step('Get all inventory item names (display order)')
  async getAllItemNames(): Promise<string[]> {
    return this.collectItemNames();
  }

  @step('Get all inventory item prices (display order)')
  async getAllItemPrices(): Promise<number[]> {
    return this.collectItemPrices();
  }

  @step('Add first inventory item to cart')
  async addFirstItemToCart(): Promise<void> {
    await this.firstItemAddToCartButton.click();
  }

  @step('Add inventory item to cart by name')
  async addItemToCartByName(name: string): Promise<void> {
    const item = this.inventoryItems.filter({ hasText: name });
    const button = item.getByRole('button', { name: 'Add to cart' });
    await button.click();
  }

  @step('Remove inventory item from cart by name')
  async removeItemFromCartByName(name: string): Promise<void> {
    const item = this.inventoryItems.filter({ hasText: name });
    const button = item.getByRole('button', { name: 'Remove' });
    await button.click();
  }

  @step('Check if inventory has item with given name')
  async hasItemWithName(name: string): Promise<boolean> {
    const item = this.itemNames.filter({ hasText: name });
    return (await item.count()) > 0;
  }

  @step('Sort inventory items')
  async sortBy(option: 'az' | 'za' | 'lohi' | 'hilo'): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }

  @step('Sort inventory by name ascending')
  async sortByNameAsc(): Promise<void> {
    await this.sortBy('az');
  }

  @step('Sort inventory by name descending')
  async sortByNameDesc(): Promise<void> {
    await this.sortBy('za');
  }

  @step('Sort inventory by price low to high')
  async sortByPriceLowToHigh(): Promise<void> {
    await this.sortBy('lohi');
  }

  @step('Sort inventory by price high to low')
  async sortByPriceHighToLow(): Promise<void> {
    await this.sortBy('hilo');
  }

  @step('Get cart badge count from inventory page')
  async getCartBadgeCount(): Promise<number> {
    const count = await this.cartBadge.count();
    if (count === 0) {
      return 0;
    }

    const text = await this.cartBadge.textContent();
    const numeric = Number.parseInt((text ?? '').trim(), 10);

    return Number.isNaN(numeric) ? 0 : numeric;
  }

  @step('Open cart from inventory page')
  async openCart(): Promise<void> {
    await this.cartIcon.click();
  }

  @step('Open product details by name')
  async openItemDetailsByName(name: string): Promise<void> {
    const link = this.itemNames.filter({ hasText: name }).first();
    await link.click();
  }

  @step('Get price of item by name on inventory page')
  async getItemPriceByName(name: string): Promise<number> {
    const item = this.inventoryItems.filter({ hasText: name });
    const priceLocator = item.locator('.inventory_item_price').first();
    const text = await priceLocator.textContent();
    const cleaned = (text ?? '').replace('$', '').trim();
    const value = Number.parseFloat(cleaned);
    return Number.isNaN(value) ? 0 : value;
  }
}
