// src/pages/CheckoutCompletePage.ts
import { Page, Locator } from '@playwright/test';
import { BaseForm } from './BaseForm';
import { step } from '../utils/stepDecorator';

export class CheckoutCompletePage extends BaseForm {
  readonly title: Locator = this.page.locator('.title');
  readonly header: Locator = this.page.locator('.complete-header');
  readonly body: Locator = this.page.locator('.complete-text');
  readonly backHomeButton: Locator = this.page.getByTestId('back-to-products');

  constructor(page: Page) {
    super(page, page.locator('.checkout_complete_container'), 'Checkout complete page');
  }

  @step('Wait for checkout complete page')
  async waitForVisible(): Promise<void> {
    await super.waitForVisible();
  }

  @step('Get checkout complete title')
  async getTitleText(): Promise<string> {
    const text = await this.title.textContent();
    return text?.trim() ?? '';
  }

  @step('Get checkout complete header text')
  async getHeaderText(): Promise<string> {
    return this.getTitleText();
  }

  @step('Get checkout complete success message text')
  async getSuccessMessageText(): Promise<string> {
    const text = await this.header.textContent();
    return text?.trim() ?? '';
  }

  @step('Get checkout complete body text')
  async getBodyText(): Promise<string> {
    const text = await this.body.textContent();
    return text?.trim() ?? '';
  }

  @step('Get checkout complete primary button text')
  async getPrimaryButtonText(): Promise<string> {
    const text = await this.backHomeButton.textContent();
    return text?.trim() ?? '';
  }

  @step('Return to inventory from checkout complete page')
  async backHome(): Promise<void> {
    await this.backHomeButton.click();
  }
}
