import { Page, Locator } from '@playwright/test';
import { BaseForm } from './BaseForm';

export class Footer extends BaseForm {
  readonly footerCopy: Locator;

  constructor(page: Page) {
    super(page, page.locator('.footer'), 'Application footer');
    this.footerCopy = this.page.locator('.footer_copy');
  }

  async getFooterText(): Promise<string> {
    await this.waitForVisible();
    const text = await this.footerCopy.textContent();
    return text?.trim() ?? '';
  }
}
