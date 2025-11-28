// src/fixtures/test-fixtures.ts
import { test as base, expect, TestInfo } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutStepOnePage } from '../pages/CheckoutStepOnePage';
import { CheckoutStepTwoPage } from '../pages/CheckoutStepTwoPage';
import { TestConfig } from '../config/testConfig';
import { CheckoutCompletePage } from '../pages/CheckoutCompletePage';
import { ProductDetailsPage } from '../pages/ProductDetailsPage';

const config = TestConfig.getInstance();

type Pages = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  loggedInInventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutStepOnePage: CheckoutStepOnePage;
  checkoutStepTwoPage: CheckoutStepTwoPage;
  checkoutCompletePage: CheckoutCompletePage;
  productDetailsPage: ProductDetailsPage;
};

type ExtraFixtures = {
  consoleLogs: string[];
};

type Fixtures = Pages & ExtraFixtures;

type AllureAttachmentFn = (name: string, content: string, type: string) => void;

type TestInfoWithAllure = TestInfo & {
  allure?: {
    attachment?: AllureAttachmentFn;
  };
};

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

  checkoutStepOnePage: async ({ page }, use) => {
    const checkoutPage = new CheckoutStepOnePage(page);
    await use(checkoutPage);
  },

  checkoutStepTwoPage: async ({ page }, use) => {
    const checkoutPage = new CheckoutStepTwoPage(page);
    await use(checkoutPage);
  },

  checkoutCompletePage: async ({ page }, use) => {
    const checkoutPage = new CheckoutCompletePage(page);
    await use(checkoutPage);
  },

  productDetailsPage: async ({ page }, use) => {
    const productDetailsPage = new ProductDetailsPage(page);
    await use(productDetailsPage);
  },

  consoleLogs: async ({ page }, use, testInfo) => {
    const logs: string[] = [];

    page.on('console', (msg) => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });

    await use(logs);

    const failed = testInfo.status !== testInfo.expectedStatus;

    if (failed && logs.length > 0) {
      const { allure } = testInfo as TestInfoWithAllure;

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
