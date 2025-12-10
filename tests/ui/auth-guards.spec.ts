// tests/ui/auth-guards.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';
import { makeCheckoutUserData } from '../../src/utils/testData';
import { expectStringsSortedAsc } from '../../src/utils/assertions';

const BACKPACK_NAME = 'Sauce Labs Backpack';
const BIKE_LIGHT_NAME = 'Sauce Labs Bike Light';

test.describe('Authentication guards and direct access', () => {
  test('anonymous cannot access inventory directly via URL', { tag: ['@auth', '@smoke'] }, async ({
    loginPage,
  }) => {
    await loginPage.openInventoryDirect();
    await expect(loginPage.usernameInput).toBeVisible();
  });

  test('anonymous cannot access cart directly via URL', { tag: '@auth' }, async ({ loginPage }) => {
    await loginPage.openCartDirect();
    await expect(loginPage.usernameInput).toBeVisible();
  });

  test('anonymous cannot access checkout step one directly', { tag: '@auth' }, async ({
    loginPage,
  }) => {
    await loginPage.openCheckoutStepOneDirect();
    await expect(loginPage.usernameInput).toBeVisible();
  });

  test('anonymous cannot access checkout complete page directly', { tag: '@auth' }, async ({
    loginPage,
  }) => {
    await loginPage.openCheckoutCompleteDirect();
    await expect(loginPage.usernameInput).toBeVisible();
  });

  test('anonymous cannot access product details page directly', { tag: '@auth' }, async ({
    loginPage,
  }) => {
    await loginPage.openProductDetailsDirect();
    await expect(loginPage.usernameInput).toBeVisible();
  });

  test('user cannot open checkout step two without completing step one', { tag: ['@auth', '@checkout'] }, async ({
    loginPage,
    checkoutStepOnePage,
  }) => {
    await loginPage.loginAs('standard');
    await loginPage.openCheckoutStepTwoDirect();
    await checkoutStepOnePage.waitForVisible();
    const title = await checkoutStepOnePage.getTitleText();
    expect(title).toBe('Checkout: Your Information');
  });

  test('user cannot open checkout complete page without finishing checkout', { tag: ['@auth', '@checkout'] }, async ({
    loginPage,
    checkoutStepOnePage,
  }) => {
    await loginPage.loginAs('standard');
    await loginPage.openCheckoutCompleteDirect();
    await checkoutStepOnePage.waitForVisible();
    const title = await checkoutStepOnePage.getTitleText();
    expect(title).toBe('Checkout: Your Information');
  });

  test('cart is cleared after logout and login again', { tag: ['@auth', '@cart', '@smoke'] }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    headerMenu,
  }) => {
    await loginPage.loginAs('standard');
    await inventoryPage.waitForVisible();
    await inventoryPage.addItemToCartByName(BACKPACK_NAME);
    await inventoryPage.addItemToCartByName(BIKE_LIGHT_NAME);
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    expect(await cartPage.getItemsCount()).toBe(2);

    await headerMenu.clickLogout();

    await loginPage.loginAs('standard');
    await inventoryPage.waitForVisible();
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    expect(await cartPage.isEmpty()).toBe(true);
  });

  test('inventory sorting resets after logout and login', { tag: ['@auth', '@inventory'] }, async ({
    loginPage,
    inventoryPage,
    headerMenu,
  }) => {
    await loginPage.loginAs('standard');
    await inventoryPage.waitForVisible();
    await inventoryPage.sortByNameDesc();

    await headerMenu.clickLogout();

    await loginPage.loginAs('standard');
    await inventoryPage.waitForVisible();
    const names = await inventoryPage.getAllItemNames();
    expectStringsSortedAsc(names);
  });

  test('checkout overview shows no items if cart cleared mid-process', { tag: ['@auth', '@checkout'] }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    headerMenu,
  }) => {
    await loginPage.loginAs('standard');
    await inventoryPage.waitForVisible();
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
    expect(await checkoutStepTwoPage.getSummaryItemCount()).toBe(0);
    expect(await checkoutStepTwoPage.getItemTotal()).toBe(0);
  });

  test('problem user has broken product image on inventory', { tag: ['@auth', '@inventory'] }, async ({
    loginPage,
    inventoryPage,
    headerMenu,
  }) => {
    await loginPage.loginAs('problem');
    await inventoryPage.waitForVisible();
    const src = await inventoryPage.getItemImageSrcByName(BACKPACK_NAME);
    expect(src).toContain('sl-404');
    await headerMenu.clickLogout();
  });

  test('performance glitch user eventually loads inventory', { tag: ['@auth', '@inventory'] }, async ({
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.loginAs('performanceGlitch');
    await inventoryPage.waitForVisible();
    expect(await inventoryPage.getItemsCount()).toBeGreaterThan(0);
  });

  test('error user cannot proceed past checkout step one', { tag: ['@auth', '@checkout'] }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
  }) => {
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
    expect(errorText.length).toBeGreaterThan(0);
  });
});
