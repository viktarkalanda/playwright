import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { TestConfig } from '../config/testConfig';

const config = TestConfig.getInstance();

type Pages = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  loggedInInventoryPage: InventoryPage;
};

// Extra fixtures that are not pages
type ExtraFixtures = {
  // Collected console logs for current test (attached to Allure on failure)
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
    await use(inventoryPage);
  },

  // Auto fixture to collect console logs and attach them on failure
  consoleLogs: [
    async ({ page }, use, testInfo) => {
      const logs: string[] = [];

      page.on('console', (message) => {
        logs.push(`[${message.type()}] ${message.text()}`);
      });

      // Make logs array available to tests if they ever need it
      await use(logs);

      const isFailed = testInfo.status !== testInfo.expectedStatus;
      if (isFailed && logs.length > 0) {
        await testInfo.attach('console-logs', {
          body: logs.join('\n'),
          contentType: 'text/plain',
        });
      }
    },
    { auto: true },
  ],
});

export { expect };
