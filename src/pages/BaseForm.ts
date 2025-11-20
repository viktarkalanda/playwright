import { Page, Locator } from '@playwright/test';

export abstract class BaseForm {
  constructor(
    protected readonly page: Page,
    protected readonly formLocator: Locator,
    protected readonly name: string,
  ) {}

  async waitForVisible(): Promise<void> {
    await this.formLocator.waitFor({ state: 'visible' });
  }

  async waitForHidden(): Promise<void> {
    await this.formLocator.waitFor({ state: 'hidden' });
  }
}
