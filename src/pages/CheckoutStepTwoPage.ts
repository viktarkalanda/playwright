// src/pages/CheckoutStepTwoPage.ts
import { Page, Locator } from '@playwright/test';
import { BaseForm } from './BaseForm';
import { step } from '../utils/stepDecorator';

export class CheckoutStepTwoPage extends BaseForm {
  readonly title: Locator = this.page.locator('.title');
  readonly summaryContainer: Locator = this.page.locator('.checkout_summary_container');
  readonly summaryItems: Locator = this.page.locator('.cart_item');
  readonly itemNames: Locator = this.page.locator('.inventory_item_name');
  readonly itemPrices: Locator = this.page.locator('.inventory_item_price');
  readonly subtotalLabel: Locator = this.page.locator('.summary_subtotal_label');
  readonly taxLabel: Locator = this.page.locator('.summary_tax_label');
  readonly totalLabel: Locator = this.page.locator('.summary_total_label');
  readonly finishButton: Locator = this.page.locator('[data-test="finish"]');
  readonly cancelButton: Locator = this.page.locator('[data-test="cancel"]');

  constructor(page: Page) {
    super(page, page.locator('.checkout_summary_container'), 'Checkout step two page');
  }

  @step('Get checkout step two title')
  async getTitleText(): Promise<string> {
    const text = await this.title.textContent();
    return text?.trim() ?? '';
  }

  @step('Get summary item count')
  async getSummaryItemCount(): Promise<number> {
    return this.summaryItems.count();
  }

  @step('Get summary item names')
  async getItemNames(): Promise<string[]> {
    const texts = await this.itemNames.allTextContents();
    return texts.map((t) => t.trim());
  }

  @step('Get summary item prices')
  async getItemPrices(): Promise<number[]> {
    const texts = await this.itemPrices.allTextContents();
    return texts
      .map((t) => t.trim().replace('$', ''))
      .map((raw) => Number.parseFloat(raw))
      .filter((value) => !Number.isNaN(value));
  }

  @step('Get checkout subtotal value')
  async getSubtotal(): Promise<number> {
    const text = await this.subtotalLabel.textContent();
    return this.extractAmount(text);
  }

  @step('Get checkout tax value')
  async getTax(): Promise<number> {
    const text = await this.taxLabel.textContent();
    return this.extractAmount(text);
  }

  @step('Get checkout total value')
  async getTotal(): Promise<number> {
    const text = await this.totalLabel.textContent();
    return this.extractAmount(text);
  }

  @step('Finish checkout')
  async finish(): Promise<void> {
    await this.finishButton.click();
  }

  @step('Cancel checkout step two')
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  private extractAmount(text: string | null): number {
    if (!text) {
      return 0;
    }

    const match = text.match(/([\d.]+)/);
    if (!match) {
      return 0;
    }

    const value = Number.parseFloat(match[1]);
    return Number.isNaN(value) ? 0 : value;
  }
}
