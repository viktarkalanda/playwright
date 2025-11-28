// src/pages/ProductDetailsPage.ts
import { Page, Locator } from '@playwright/test';
import { BaseForm } from './BaseForm';
import { step } from '../utils/stepDecorator';

export class ProductDetailsPage extends BaseForm {
  readonly title: Locator = this.page.locator('.title');
  readonly productName: Locator = this.page.locator('.inventory_details_name');
  readonly description: Locator = this.page.locator('.inventory_details_desc');
  readonly price: Locator = this.page.locator('.inventory_details_price');
  readonly backToProductsButton: Locator = this.page.locator('[data-test="back-to-products"]');
  readonly addToCartButton: Locator = this.page.getByRole('button', { name: 'Add to cart' });
  readonly removeButton: Locator = this.page.getByRole('button', { name: 'Remove' });

  constructor(page: Page) {
    super(page, page.locator('.inventory_details_container'), 'Product details page');
  }

  @step('Get product details page title')
  async getTitleText(): Promise<string> {
    const text = await this.title.textContent();
    return text?.trim() ?? '';
  }

  @step('Get product name on details page')
  async getProductName(): Promise<string> {
    const text = await this.productName.textContent();
    return text?.trim() ?? '';
  }

  @step('Get product description on details page')
  async getProductDescription(): Promise<string> {
    const text = await this.description.textContent();
    return text?.trim() ?? '';
  }

  @step('Get product price on details page')
  async getProductPrice(): Promise<number> {
    const text = await this.price.textContent();
    const cleaned = (text ?? '').replace('$', '').trim();
    const value = Number.parseFloat(cleaned);
    return Number.isNaN(value) ? 0 : value;
  }

  @step('Add product to cart from details page')
  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
  }

  @step('Remove product from cart from details page')
  async removeFromCart(): Promise<void> {
    await this.removeButton.click();
  }

  @step('Check if "Add to cart" button is visible on details page')
  async isAddToCartVisible(): Promise<boolean> {
    return this.addToCartButton.isVisible();
  }

  @step('Check if "Remove" button is visible on details page')
  async isRemoveButtonVisible(): Promise<boolean> {
    return this.removeButton.isVisible();
  }

  @step('Back to products from details page')
  async backToProducts(): Promise<void> {
    await this.backToProductsButton.click();
  }
}
