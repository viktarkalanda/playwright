import { BaseApiClient, type ResponseEnvelope } from '../base/BaseApiClient';

export class StatusClient extends BaseApiClient {
  async fetchRoot(): Promise<ResponseEnvelope<string>> {
    return this.getText('/');
  }

  async fetchInventoryPage(): Promise<ResponseEnvelope<string>> {
    return this.getText('/inventory.html');
  }

  async fetchCartPage(): Promise<ResponseEnvelope<string>> {
    return this.getText('/cart.html');
  }

  async fetchCheckoutStep(step: 'one' | 'two' | 'complete'): Promise<ResponseEnvelope<string>> {
    const paths: Record<typeof step, string> = {
      one: '/checkout-step-one.html',
      two: '/checkout-step-two.html',
      complete: '/checkout-complete.html',
    };

    return this.getText(paths[step]);
  }

  async submitLoginForm(formBody: string): Promise<ResponseEnvelope<string>> {
    return this.postForm('/', formBody);
  }
}
