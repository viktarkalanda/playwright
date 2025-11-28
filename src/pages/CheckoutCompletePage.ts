// src/pages/CheckoutCompletePage.ts
import { Page, Locator } from '@playwright/test';
import { BaseForm } from './BaseForm';
import { step } from '../utils/stepDecorator';

export class CheckoutCompletePage extends BaseForm {
  readonly title: Locator = this.page.locator('.title');
  readonly completeHeader: Locator = this.page.locator('.complete-header');
  readonly completeText: Locator = this.page.locator('.complete-text');
  readonly backHomeButton: Locator = this.page.locator('[data-test="back-to-products"]');

  constructor(page: Page) {
    super(page, page.locator('.checkout_complete_container'), 'Checkout complete page');
  }

  @step('Get checkout complete title')
  async getTitleText(): Promise<string> {
    const text = await this.title.textContent();
    return text?.trim() ?? '';
  }

  @step('Get checkout complete header text')
  async getCompleteHeaderText(): Promise<string> {
    const text = await this.completeHeader.textContent();
    return text?.trim() ?? '';
  }

  @step('Get checkout complete body text')
  async getCompleteBodyText(): Promise<string> {
    const text = await this.completeText.textContent();
    return text?.trim() ?? '';
  }

  @step('Return back to products from checkout complete page')
  async backToProducts(): Promise<void> {
    await this.backHomeButton.click();
  }
}
