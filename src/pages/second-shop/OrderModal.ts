import { Locator, Page } from '@playwright/test';

export class OrderModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly nameInput: Locator;
  readonly countryInput: Locator;
  readonly cityInput: Locator;
  readonly cardInput: Locator;
  readonly monthInput: Locator;
  readonly yearInput: Locator;
  readonly purchaseButton: Locator;
  readonly closeButton: Locator;
  readonly cancelButton: Locator;
  readonly confirmationDialog: Locator;
  readonly confirmationOkButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('.modal.fade.show, .modal-dialog');
    this.nameInput = page.locator('#name');
    this.countryInput = page.locator('#country');
    this.cityInput = page.locator('#city');
    this.cardInput = page.locator('#card');
    this.monthInput = page.locator('#month');
    this.yearInput = page.locator('#year');
    this.purchaseButton = page.locator('button', { hasText: 'Purchase' });
    this.closeButton = page.locator('button', { hasText: 'Close' });
    this.cancelButton = page.locator('button.btn-secondary', { hasText: 'Cancel' });
    this.confirmationDialog = page.locator('.sweet-alert, .sa-success, .showSweetAlert');
    this.confirmationOkButton = page.locator('.confirm, button', { hasText: 'OK' });
  }

  async waitForOpen(): Promise<void> {
    await this.modal.first().waitFor({ state: 'visible' });
  }

  async fillForm(options: {
    name?: string;
    country?: string;
    city?: string;
    card?: string;
    month?: string;
    year?: string;
  }): Promise<void> {
    if (options.name !== undefined) {
      await this.nameInput.fill(options.name);
    }
    if (options.country !== undefined) {
      await this.countryInput.fill(options.country);
    }
    if (options.city !== undefined) {
      await this.cityInput.fill(options.city);
    }
    if (options.card !== undefined) {
      await this.cardInput.fill(options.card);
    }
    if (options.month !== undefined) {
      await this.monthInput.fill(options.month);
    }
    if (options.year !== undefined) {
      await this.yearInput.fill(options.year);
    }
  }

  async submitPurchase(): Promise<void> {
    await this.purchaseButton.click();
  }

  async cancel(): Promise<void> {
    if (await this.cancelButton.first().isVisible().catch(() => false)) {
      await this.cancelButton.first().click();
    } else {
      await this.closeButton.first().click();
    }
  }

  async waitForConfirmation(): Promise<void> {
    await this.confirmationDialog.first().waitFor({ state: 'visible' });
  }

  async confirmSuccess(): Promise<void> {
    if (await this.confirmationOkButton.first().isVisible().catch(() => false)) {
      await this.confirmationOkButton.first().click();
    }
  }

  async isOpen(): Promise<boolean> {
    return this.modal.first().isVisible();
  }
}
