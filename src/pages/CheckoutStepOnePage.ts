// src/pages/CheckoutStepOnePage.ts
import { Page, Locator } from '@playwright/test';
import { BaseForm } from './BaseForm';
import { step } from '../utils/stepDecorator';

export class CheckoutStepOnePage extends BaseForm {
  readonly title: Locator = this.page.locator('.title');
  readonly firstNameInput: Locator = this.page.getByTestId('firstName');
  readonly lastNameInput: Locator = this.page.getByTestId('lastName');
  readonly postalCodeInput: Locator = this.page.getByTestId('postalCode');
  readonly continueButton: Locator = this.page.getByTestId('continue');
  readonly cancelButton: Locator = this.page.getByTestId('cancel');
  readonly errorMessage: Locator = this.page.getByTestId('error');

  constructor(page: Page) {
    super(page, page.locator('.checkout_info'), 'Checkout step one page');
  }

  @step('Get checkout step one title')
  async getTitleText(): Promise<string> {
    const text = await this.title.textContent();
    return text?.trim() ?? '';
  }

  @step('Get checkout step one header text')
  async getHeaderText(): Promise<string> {
    return this.getTitleText();
  }

  @step('Get checkout step one primary button text')
  async getPrimaryButtonText(): Promise<string> {
    const text = await this.continueButton.textContent();
    return text?.trim() ?? '';
  }

  @step('Get checkout step one secondary button text')
  async getSecondaryButtonText(): Promise<string> {
    const text = await this.cancelButton.textContent();
    return text?.trim() ?? '';
  }

  @step('Fill first name')
  async fillFirstName(value: string): Promise<void> {
    await this.firstNameInput.fill(value);
  }

  @step('Fill last name')
  async fillLastName(value: string): Promise<void> {
    await this.lastNameInput.fill(value);
  }

  @step('Fill postal code')
  async fillPostalCode(value: string): Promise<void> {
    await this.postalCodeInput.fill(value);
  }

  @step('Fill checkout personal information')
  async fillForm(firstName: string, lastName: string, postalCode: string): Promise<void> {
    await this.fillFirstName(firstName);
    await this.fillLastName(lastName);
    await this.fillPostalCode(postalCode);
  }

  @step('Continue checkout step one')
  async continue(): Promise<void> {
    await this.continueButton.click();
  }

  @step('Continue to checkout step two')
  async continueToStepTwo(): Promise<void> {
    await this.continue();
  }

  @step('Complete checkout step one')
  async completeStepOne(firstName: string, lastName: string, postalCode: string): Promise<void> {
    await this.fillForm(firstName, lastName, postalCode);
    await this.continue();
  }

  @step('Cancel checkout step one')
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  @step('Get checkout error text')
  async getErrorText(): Promise<string> {
    if ((await this.errorMessage.count()) === 0) {
      return '';
    }

    const text = await this.errorMessage.textContent();
    return text?.trim() ?? '';
  }

  @step('Get current first name value')
  async getFirstNameValue(): Promise<string> {
    return this.firstNameInput.inputValue();
  }

  @step('Get current last name value')
  async getLastNameValue(): Promise<string> {
    return this.lastNameInput.inputValue();
  }

  @step('Get current postal code value')
  async getPostalCodeValue(): Promise<string> {
    return this.postalCodeInput.inputValue();
  }
}
