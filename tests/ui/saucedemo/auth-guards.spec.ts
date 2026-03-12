// tests/ui/saucedemo/auth-guards.spec.ts
import { test, expect } from '../../../src/saucedemo/fixtures/test-fixtures';

// Auth-guard tests verify that unauthenticated users are redirected to login.
// They must start from a clean browser — not the stored session.
test.use({ storageState: undefined });
import {
  openInventoryDirect,
  openCartDirect,
  openCheckoutStepOneDirect,
  openCheckoutStepTwoDirect,
  openCheckoutCompleteDirect,
  openProductDetailsDirect,
} from '../../../src/utils/directNavigation';
import { makeCheckoutUserData } from '../../../src/utils/testData';
import { expectStringsSortedAsc } from '../../../src/utils/assertions';

const BACKPACK_NAME = 'Sauce Labs Backpack';
const BIKE_LIGHT_NAME = 'Sauce Labs Bike Light';

// ─────────────────────────────────────────────────────────────────────────────
// Anonymous access — every protected page must redirect unauthenticated users
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Anonymous access guards', () => {
  test(
    'cannot access inventory directly via URL',
    { tag: ['@auth', '@smoke'] },
    async ({ page, loginPage }) => {
      await openInventoryDirect(page);
      await expect(
        loginPage.usernameInput,
        'Unauthenticated inventory request should redirect to login page',
      ).toBeVisible();
    },
  );

  test(
    'cannot access cart directly via URL',
    { tag: '@auth' },
    async ({ page, loginPage }) => {
      await openCartDirect(page);
      await expect(
        loginPage.usernameInput,
        'Unauthenticated cart request should redirect to login page',
      ).toBeVisible();
    },
  );

  test(
    'cannot access checkout step one directly',
    { tag: '@auth' },
    async ({ page, loginPage }) => {
      await openCheckoutStepOneDirect(page);
      await expect(
        loginPage.usernameInput,
        'Unauthenticated checkout step one request should redirect to login page',
      ).toBeVisible();
    },
  );

  test(
    'cannot access checkout complete page directly',
    { tag: '@auth' },
    async ({ page, loginPage }) => {
      await openCheckoutCompleteDirect(page);
      await expect(
        loginPage.usernameInput,
        'Unauthenticated checkout-complete request should redirect to login page',
      ).toBeVisible();
    },
  );

  test(
    'cannot access product details page directly',
    { tag: '@auth' },
    async ({ page, loginPage }) => {
      await openProductDetailsDirect(page);
      await expect(
        loginPage.usernameInput,
        'Unauthenticated product-details request should redirect to login page',
      ).toBeVisible();
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Authenticated access guards — mid-flow direct URL access must be blocked
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Authenticated access guards', () => {
  test(
    'logged-in user cannot skip to checkout step two via direct URL',
    { tag: ['@auth', '@checkout'] },
    async ({ loggedInInventoryPage: inventoryPage, page, checkoutStepOnePage }) => {
      await inventoryPage.waitForVisible();
      await openCheckoutStepTwoDirect(page);
      await checkoutStepOnePage.waitForVisible();
      const title = await checkoutStepOnePage.getTitleText();
      expect(
        title,
        'Skipping to step two without completing step one should redirect to step one',
      ).toBe('Checkout: Your Information');
    },
  );

  test(
    'logged-in user cannot open checkout complete page via direct URL',
    { tag: ['@auth', '@checkout'] },
    async ({ loggedInInventoryPage: inventoryPage, page, checkoutStepOnePage }) => {
      await inventoryPage.waitForVisible();
      await openCheckoutCompleteDirect(page);
      await checkoutStepOnePage.waitForVisible();
      const title = await checkoutStepOnePage.getTitleText();
      expect(
        title,
        'Direct access to checkout-complete without finishing checkout should redirect to step one',
      ).toBe('Checkout: Your Information');
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// State management across login sessions
// ─────────────────────────────────────────────────────────────────────────────
test.describe('State management across login sessions', () => {
  test(
    'cart is cleared after logout and login again',
    { tag: ['@auth', '@cart', '@smoke'] },
    async ({ loggedInInventoryPage: inventoryPage, cartPage, headerMenu, loginPage }) => {
      await inventoryPage.addItemToCartByName(BACKPACK_NAME);
      await inventoryPage.addItemToCartByName(BIKE_LIGHT_NAME);
      await inventoryPage.openCart();
      await cartPage.waitForVisible();
      expect(
        await cartPage.getItemsCount(),
        'Cart should hold the 2 products added before logout',
      ).toBe(2);

      await headerMenu.clickLogout();

      await loginPage.loginAs('standard');
      await inventoryPage.waitForVisible();
      await inventoryPage.openCart();
      await cartPage.waitForVisible();
      expect(
        await cartPage.isEmpty(),
        'Cart should be empty after logout and a fresh login',
      ).toBe(true);
    },
  );

  test(
    'inventory sorting resets to default after logout and login',
    { tag: ['@auth', '@inventory'] },
    async ({ loggedInInventoryPage: inventoryPage, headerMenu, loginPage }) => {
      await inventoryPage.sortByNameDesc();
      await headerMenu.clickLogout();

      await loginPage.loginAs('standard');
      await inventoryPage.waitForVisible();
      const names = await inventoryPage.getAllItemNames();
      expectStringsSortedAsc(names);
    },
  );

  test(
    'checkout overview shows no items when cart is reset mid-process',
    { tag: ['@auth', '@checkout'] },
    async ({
      loggedInInventoryPage: inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      headerMenu,
    }) => {
      await inventoryPage.addItemToCartByName(BACKPACK_NAME);
      await inventoryPage.openCart();
      await cartPage.waitForVisible();
      await cartPage.startCheckout();
      await checkoutStepOnePage.waitForVisible();

      await headerMenu.clickResetAppState();

      const user = makeCheckoutUserData();
      await checkoutStepOnePage.fillForm(user.firstName, user.lastName, user.postalCode);
      await checkoutStepOnePage.continue();

      await checkoutStepTwoPage.waitForVisible();
      expect(
        await checkoutStepTwoPage.getSummaryItemCount(),
        'Checkout overview should show 0 items after cart reset during checkout',
      ).toBe(0);
      expect(
        await checkoutStepTwoPage.getItemTotal(),
        'Item total should be $0 when cart was cleared before reaching step two',
      ).toBe(0);
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// User type specific behaviour
// ─────────────────────────────────────────────────────────────────────────────
test.describe('User type specific behaviour', () => {
  test(
    'problem user has broken product image on inventory',
    { tag: ['@auth', '@inventory'] },
    async ({ loginPage, inventoryPage, headerMenu }) => {
      await loginPage.loginAs('problem');
      await inventoryPage.waitForVisible();
      const src = await inventoryPage.getItemImageSrcByName(BACKPACK_NAME);
      expect(src, 'Problem user should see the broken sl-404 placeholder image').toContain('sl-404');
      await headerMenu.clickLogout();
    },
  );

  test(
    'performance glitch user eventually loads inventory',
    { tag: ['@auth', '@inventory'] },
    async ({ loginPage, inventoryPage }) => {
      await loginPage.loginAs('performanceGlitch');
      await inventoryPage.waitForVisible();
      expect(
        await inventoryPage.getItemsCount(),
        'Performance glitch user should eventually see all inventory items',
      ).toBeGreaterThan(0);
    },
  );

  test(
    'error user cannot proceed past checkout step one',
    { tag: ['@auth', '@checkout'] },
    async ({ loginPage, inventoryPage, cartPage, checkoutStepOnePage }) => {
      await loginPage.loginAs('error');
      await inventoryPage.waitForVisible();
      await inventoryPage.addItemToCartByName(BACKPACK_NAME);
      await inventoryPage.openCart();
      await cartPage.waitForVisible();
      await cartPage.startCheckout();
      await checkoutStepOnePage.waitForVisible();

      const user = makeCheckoutUserData();
      await checkoutStepOnePage.fillForm(user.firstName, user.lastName, user.postalCode);
      await checkoutStepOnePage.continue();

      const errorText = await checkoutStepOnePage.getErrorText();
      expect(
        errorText.length,
        'Error user should see a blocking validation error on checkout step one',
      ).toBeGreaterThan(0);
    },
  );
});
