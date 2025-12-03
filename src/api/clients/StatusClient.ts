import type { APIRequestContext, TestInfo } from '@playwright/test';
import { BaseApiClient, type ResponseEnvelope } from '../base/BaseApiClient';
import { step } from '../../utils/stepDecorator';

type CheckoutStep = 'one' | 'two' | 'complete';

const CHECKOUT_PATHS: Record<CheckoutStep, string> = {
  one: '/checkout-step-one.html',
  two: '/checkout-step-two.html',
  complete: '/checkout-complete.html',
};

export class StatusClient extends BaseApiClient {
  constructor(request: APIRequestContext, testInfo?: TestInfo) {
    super(request);
    this.registerTestInfo(testInfo);
  }

  @step('Fetch root HTML page')
  async fetchRoot(): Promise<ResponseEnvelope<string>> {
    return this.getText('/');
  }

  @step('Fetch inventory route HTML')
  async fetchInventoryPage(): Promise<ResponseEnvelope<string>> {
    return this.getText('/inventory.html');
  }

  @step('Fetch cart route HTML')
  async fetchCartPage(): Promise<ResponseEnvelope<string>> {
    return this.getText('/cart.html');
  }

  @step('Fetch checkout HTML page')
  async fetchCheckoutStep(step: CheckoutStep): Promise<ResponseEnvelope<string>> {
    return this.getText(CHECKOUT_PATHS[step]);
  }

  @step('Submit login form via POST')
  async submitLoginForm(formBody: string): Promise<ResponseEnvelope<string>> {
    return this.postForm('/', formBody);
  }
}
