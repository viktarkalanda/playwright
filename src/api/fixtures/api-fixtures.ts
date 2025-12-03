import { test as base, expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { TestConfig } from '../../config/testConfig';
import { StatusClient } from '../clients/StatusClient';
import { AssetsClient } from '../clients/AssetsClient';

const config = TestConfig.getInstance();

type ApiFixtures = {
  apiRequest: APIRequestContext;
  statusClient: StatusClient;
  assetsClient: AssetsClient;
};

export const apiTest = base.extend<ApiFixtures>({
  apiRequest: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({
      baseURL: config.baseUrl,
      extraHTTPHeaders: {
        'user-agent': 'SwagLabs-API-Tests',
      },
    });

    await use(context);
    await context.dispose();
  },

  statusClient: async ({ apiRequest }, use, testInfo) => {
    await use(new StatusClient(apiRequest, testInfo));
  },

  assetsClient: async ({ apiRequest }, use, testInfo) => {
    await use(new AssetsClient(apiRequest, testInfo));
  },
});

export { expect };
