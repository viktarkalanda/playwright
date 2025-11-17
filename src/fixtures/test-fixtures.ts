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

export const test = base.extend<Pages>({
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
});

export { expect };
