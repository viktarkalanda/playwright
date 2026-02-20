// tests/ui/user-types-matrix.spec.ts
import { test, expect } from '../../../src/fixtures/test-fixtures';
import { UserKey } from '../../../src/config/testConfig';
import { makeCheckoutUserData } from '../../../src/utils/testData';

const BACKPACK = 'Sauce Labs Backpack';
const BIKE_LIGHT = 'Sauce Labs Bike Light';
const FLEECE = 'Sauce Labs Fleece Jacket';
const ONESIE = 'Sauce Labs Onesie';

const loginExpectations: { key: UserKey; shouldLogin: boolean }[] = [
  { key: 'standard', shouldLogin: true },
  { key: 'lockedOut', shouldLogin: false },
  { key: 'problem', shouldLogin: true },
  { key: 'performanceGlitch', shouldLogin: true },
  { key: 'error', shouldLogin: true },
  { key: 'visual', shouldLogin: true },
];

const cartCapableUsers: UserKey[] = ['standard', 'problem', 'performanceGlitch', 'error', 'visual'];

test.describe('User types behaviour matrix', () => {
  test('standard user can login and reach inventory', { tag: ['@login', '@auth', '@userType', '@smoke'] }, async ({
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.loginAs('standard');
    await inventoryPage.waitForVisible();
    expect(await inventoryPage.getTitleText()).toBe('Products');
  });

  test('locked out user cannot login and sees error message', { tag: ['@login', '@auth', '@userType'] }, async ({
    loginPage,
  }) => {
    await loginPage.loginAs('lockedOut');
    expect(await loginPage.isErrorVisible()).toBe(true);
    const errorText = await loginPage.getErrorText();
    expect(errorText).toContain('locked out');
  });

  for (const { key, shouldLogin } of loginExpectations) {
    test(
      `login behaviour for user type "${key}"`,
      { tag: ['@login', '@userType'] },
      async ({ loginPage, inventoryPage }) => {
        await loginPage.loginAs(key);
        if (shouldLogin) {
          await inventoryPage.waitForVisible();
          expect(await inventoryPage.getItemsCount()).toBeGreaterThan(0);
        } else {
          expect(await loginPage.isErrorVisible()).toBe(true);
        }
      },
    );
  }

  test('problem user inventory shows broken product image', { tag: ['@inventory', '@auth', '@userType'] }, async ({
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.loginAs('problem');
    await inventoryPage.waitForVisible();
    const imageSrc = await inventoryPage.getItemImageSrcByName(BACKPACK);
    expect(imageSrc).toContain('sl-404');
  });

  test('problem user can add and remove products in cart despite UI issues', { tag: ['@cart', '@userType'] }, async ({
    loginPage,
    inventoryPage,
    cartPage,
  }) => {
    await loginPage.loginAs('problem');
    await inventoryPage.waitForVisible();
    await inventoryPage.addProductToCartByName(FLEECE);
    await inventoryPage.addProductToCartByName(BIKE_LIGHT);
    expect(await inventoryPage.getCartBadgeCount()).toBe(2);

    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    expect(await cartPage.getItemsCount()).toBe(2);

    await cartPage.removeItemByName(BIKE_LIGHT);
    expect(await cartPage.getItemsCount()).toBe(1);
    expect(await cartPage.hasItemWithName(FLEECE)).toBe(true);
  });

  test('performance glitch user eventually reaches inventory and can add products', {
    tag: ['@inventory', '@cart', '@userType'],
  }, async ({ loginPage, inventoryPage }) => {
    await loginPage.loginAs('performanceGlitch');
    await inventoryPage.waitForVisible();
    await inventoryPage.addProductToCartByName(ONESIE);
    expect(await inventoryPage.getCartBadgeCount()).toBe(1);
  });

  test('performance glitch user can proceed to checkout overview', {
    tag: ['@checkout', '@cart', '@userType'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
  }) => {
    await loginPage.loginAs('performanceGlitch');
    await inventoryPage.waitForVisible();
    await inventoryPage.addProductToCartByName(BACKPACK);
    await inventoryPage.addProductToCartByName(BIKE_LIGHT);
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    await cartPage.startCheckout();
    await checkoutStepOnePage.waitForVisible();

    const user = makeCheckoutUserData();
    await checkoutStepOnePage.completeStepOne(user.firstName, user.lastName, user.postalCode);

    await checkoutStepTwoPage.waitForVisible();
    expect(await checkoutStepTwoPage.getSummaryItemCount()).toBe(2);
  });

  test('error user login succeeds but checkout step one shows blocking error', {
    tag: ['@checkout', '@auth', '@userType'],
  }, async ({ loginPage, inventoryPage, cartPage, checkoutStepOnePage }) => {
    await loginPage.loginAs('error');
    await inventoryPage.waitForVisible();
    await inventoryPage.addProductToCartByName(BACKPACK);
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    await cartPage.startCheckout();
    await checkoutStepOnePage.waitForVisible();

    const user = makeCheckoutUserData();
    await checkoutStepOnePage.completeStepOne(user.firstName, user.lastName, user.postalCode);
    const errorText = await checkoutStepOnePage.getErrorText();
    expect(errorText.length).toBeGreaterThan(0);
    expect(errorText).toContain('Error');
  });

  test('standard user can complete checkout with one product', {
    tag: ['@checkout', '@e2e', '@userType', '@smoke'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    await loginPage.loginAs('standard');
    await inventoryPage.waitForVisible();
    await inventoryPage.addProductToCartByName(FLEECE);
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    await cartPage.startCheckout();
    await checkoutStepOnePage.waitForVisible();

    const user = makeCheckoutUserData();
    await checkoutStepOnePage.completeStepOne(user.firstName, user.lastName, user.postalCode);

    await checkoutStepTwoPage.waitForVisible();
    await checkoutStepTwoPage.finish();

    await checkoutCompletePage.waitForVisible();
    expect(await checkoutCompletePage.getHeaderText()).toContain('Thank you');
  });

  test('logout and switching user types resets cart and reflects new anomalies', {
    tag: ['@auth', '@cart', '@userType'],
  }, async ({ loginPage, inventoryPage, cartPage, headerMenu }) => {
    await loginPage.loginAs('standard');
    await inventoryPage.waitForVisible();
    await inventoryPage.addProductToCartByName(BACKPACK);
    await inventoryPage.addProductToCartByName(BIKE_LIGHT);
    expect(await inventoryPage.getCartBadgeCount()).toBe(2);

    await headerMenu.clickLogout();
    await loginPage.loginAs('problem');
    await inventoryPage.waitForVisible();
    expect(await inventoryPage.getCartBadgeCount()).toBe(0);

    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    expect(await cartPage.isEmpty()).toBe(true);

    const imageSrc = await inventoryPage.getItemImageSrcByName(BACKPACK);
    expect(imageSrc).toContain('sl-404');
  });

  for (const key of cartCapableUsers) {
    test(
      `cart starts empty for user type "${key}"`,
      { tag: ['@cart', '@userType'] },
      async ({ loginPage, inventoryPage }) => {
        await loginPage.loginAs(key);
        await inventoryPage.waitForVisible();
        expect(await inventoryPage.getCartBadgeCount()).toBe(0);
      },
    );
  }
});
