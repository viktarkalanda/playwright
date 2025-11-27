// src/fixtures/test-fixtures.ts
import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { TestConfig } from '../config/testConfig';

const config = TestConfig.getInstance();

type Pages = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  loggedInInventoryPage: InventoryPage;
  cartPage: CartPage;
};

// Extra fixtures that are not pages
type ExtraFixtures = {
  // Collected console logs for current test (attached to report on failure)
  consoleLogs: string[];
};

type Fixtures = Pages & ExtraFixtures;

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  inventoryPage: async ({ page }, use) => {
    const inventoryPage = new InventoryPage(page);
    await use(inventoryPage);
  },

  loggedInInventoryPage: async ({ loginPage, inventoryPage }, use) => {
    const { username, password } = config.getUser('standard');
    await loginPage.login(username, password);
    await inventoryPage.waitForVisible();
    await use(inventoryPage);
  },

  cartPage: async ({ page }, use) => {
    const cartPage = new CartPage(page);
    await use(cartPage);
  },

  consoleLogs: async ({ page }, use, testInfo) => {
    const logs: string[] = [];

    page.on('console', (msg) => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });

    await use(logs);

    const failed = testInfo.status !== testInfo.expectedStatus;

    if (failed && logs.length > 0) {
      // Allure via allure-playwright
      const anyInfo = testInfo as any;
      const allure = anyInfo.allure as
        | { attachment?: (name: string, content: string, type: string) => void }
        | undefined;

      if (allure && typeof allure.attachment === 'function') {
        allure.attachment('Browser console logs', logs.join('\n'), 'text/plain');
      } else if (testInfo.attach) {
        await testInfo.attach('Browser console logs', {
          body: logs.join('\n'),
          contentType: 'text/plain',
        });
      }
    }
  },
});

export { expect };
