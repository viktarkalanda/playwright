// src/pages/saucedemo/InventoryPage.ts
import { Page, Locator } from '@playwright/test';
import { BaseForm } from './BaseForm';
import { step } from '../../utils/stepDecorator';
import { range } from '../../utils/random';

export interface InventoryProductView {
  name: string;
  price: number;
  description: string;
  isInCart: boolean;
}

export type InventorySortOption = 'nameAsc' | 'nameDesc' | 'priceAsc' | 'priceDesc';

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

  @step('Get inventory header text')
  async getHeaderText(): Promise<string> {
    return this.getTitleText();
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

  @step('Get all inventory item names and prices as pairs')
  async getAllItemNamesAndPrices(): Promise<{ name: string; price: number }[]> {
    const names = await this.collectItemNames();
    const prices = await this.collectItemPrices();
    return names.map((name, i) => ({ name, price: prices[i] ?? 0 }));
  }

  @step('Add first inventory item to cart')
  async addFirstItemToCart(): Promise<void> {
    await this.firstItemAddToCartButton.click();
  }

  @step('Add inventory item to cart by name')
  async addItemToCartByName(name: string): Promise<void> {
    await this.addProductToCartByName(name);
  }

  @step('Add product to cart by name')
  async addProductToCartByName(name: string): Promise<void> {
    const item = this.inventoryItems.filter({ hasText: name });
    const button = item.getByRole('button', { name: 'Add to cart' });
    await button.click();
  }

  private async getItemCardByIndex(index: number): Promise<Locator> {
    const count = await this.getItemsCount();
    if (index < 0 || index >= count) {
      throw new Error(`Inventory index ${index} is out of bounds. Total items: ${count}`);
    }
    return this.inventoryItems.nth(index);
  }

  @step('Add inventory item to cart by index')
  async addItemToCartByIndex(index: number): Promise<void> {
    const card = await this.getItemCardByIndex(index);
    const button = card.getByRole('button');
    const label = (await button.textContent())?.trim() ?? '';
    if (label === 'Add to cart') {
      await button.click();
    }
  }

  @step('Remove inventory item from cart by index')
  async removeItemFromCartByIndex(index: number): Promise<void> {
    const card = await this.getItemCardByIndex(index);
    const button = card.getByRole('button');
    const label = (await button.textContent())?.trim() ?? '';
    if (label === 'Remove') {
      await button.click();
    }
  }

  @step('Add inventory items to cart by indexes')
  async addItemsToCartByIndexes(indexes: number[]): Promise<void> {
    for (const index of indexes) {
      await this.addItemToCartByIndex(index);
    }
  }

  @step('Remove inventory items from cart by indexes')
  async removeItemsFromCartByIndexes(indexes: number[]): Promise<void> {
    for (const index of indexes) {
      await this.removeItemFromCartByIndex(index);
    }
  }

  @step('Check if inventory item is in cart by index')
  async isItemInCartByIndex(index: number): Promise<boolean> {
    const card = await this.getItemCardByIndex(index);
    const button = card.getByRole('button');
    const label = (await button.textContent())?.trim() ?? '';
    return label === 'Remove';
  }

  @step('Remove inventory item from cart by name')
  async removeItemFromCartByName(name: string): Promise<void> {
    await this.removeProductFromCartByName(name);
  }

  @step('Remove product from cart by name')
  async removeProductFromCartByName(name: string): Promise<void> {
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
  async sortBy(option: InventorySortOption): Promise<void> {
    const valueMap: Record<InventorySortOption, string> = {
      nameAsc: 'az',
      nameDesc: 'za',
      priceAsc: 'lohi',
      priceDesc: 'hilo',
    };
    await this.sortDropdown.selectOption(valueMap[option]);
  }

  @step('Sort inventory by name ascending')
  async sortByNameAsc(): Promise<void> {
    await this.sortBy('nameAsc');
  }

  @step('Sort inventory by name descending')
  async sortByNameDesc(): Promise<void> {
    await this.sortBy('nameDesc');
  }

  @step('Sort inventory by price low to high')
  async sortByPriceLowToHigh(): Promise<void> {
    await this.sortBy('priceAsc');
  }

  @step('Sort inventory by price high to low')
  async sortByPriceHighToLow(): Promise<void> {
    await this.sortBy('priceDesc');
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

  @step('Open first product details')
  async openFirstProductDetails(): Promise<void> {
    await this.itemNames.first().click();
  }

  @step('Get product image src by name')
  async getItemImageSrcByName(name: string): Promise<string> {
    const item = this.inventoryItems.filter({ hasText: name });
    const image = item.locator('img').first();
    const src = await image.getAttribute('src');
    return src ?? '';
  }

  @step('Get product view by name')
  async getProductViewByName(name: string): Promise<InventoryProductView> {
    const card = this.inventoryItems.filter({ hasText: name }).first();
    await card.waitFor();
    const nameText = (await card.locator('.inventory_item_name').first().textContent())?.trim() ?? '';
    const description = (await card.locator('.inventory_item_desc').first().textContent())?.trim() ?? '';
    const priceText = (await card.locator('.inventory_item_price').first().textContent()) ?? '';
    const button = card.getByRole('button').first();
    const buttonText = (await button.textContent())?.trim() ?? '';
    const price = Number.parseFloat(priceText.replace('$', '').trim()) || 0;

    return {
      name: nameText,
      price,
      description,
      isInCart: buttonText === 'Remove',
    };
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

  @step('Add all products to cart')
  async addAllProductsToCart(): Promise<void> {
    const count = await this.getItemsCount();
    const indexes = range(0, count);
    await this.addItemsToCartByIndexes(indexes);
  }

  @step('Remove all products from cart')
  async removeAllProductsFromCart(): Promise<void> {
    const count = await this.getItemsCount();
    const indexes = range(0, count);
    await this.removeItemsFromCartByIndexes(indexes);
  }
}
