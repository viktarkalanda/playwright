// tests/api/health.spec.ts
import { apiTest, expect } from '../../src/api/fixtures/api-fixtures';

apiTest.describe('Application availability - HTTP level', () => {
  apiTest('root endpoint returns login markup', async ({ statusClient }) => {
    const response = await statusClient.fetchRoot();

    expect(response.status).toBe(200);
    expect(response.body).toContain('Swag Labs');
    expect(response.headers['content-type']).toContain('text/html');
  });

  apiTest('inventory route falls back to SPA redirect page', async ({ statusClient }) => {
    const response = await statusClient.fetchInventoryPage();

    expect(response.status).toBe(404);
    expect(response.body).toContain('Single Page Apps for GitHub Pages');
  });

  apiTest('cart route behaves the same SPA redirect way', async ({ statusClient }) => {
    const response = await statusClient.fetchCartPage();

    expect(response.status).toBe(404);
    expect(response.body).toContain('Single Page Apps for GitHub Pages');
  });

  apiTest('checkout pages are accessible even for anonymous users', async ({ statusClient }) => {
    const stepOne = await statusClient.fetchCheckoutStep('one');
    const stepTwo = await statusClient.fetchCheckoutStep('two');
    const complete = await statusClient.fetchCheckoutStep('complete');

    for (const response of [stepOne, stepTwo, complete]) {
      expect(response.status).toBe(404);
      expect(response.body).toContain('Single Page Apps for GitHub Pages');
    }
  });

  apiTest('posting credentials to root is blocked server-side', async ({ statusClient }) => {
    const response = await statusClient.submitLoginForm(
      'user-name=standard_user&password=secret_sauce',
    );

    expect(response.status).toBe(405);
  });
});
