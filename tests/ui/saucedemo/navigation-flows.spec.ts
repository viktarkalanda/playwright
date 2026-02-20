// tests/ui/navigation-flows.spec.ts
import { test, expect } from '../../../src/fixtures/test-fixtures';
import { productCatalog } from '../../../src/data/products';
import {
  openCartDirect,
  openCheckoutStepOneDirect,
  openCheckoutStepTwoDirect,
  openCheckoutCompleteDirect,
} from '../../../src/utils/directNavigation';
import {
  NavigationContext,
  expectOnLoginPage,
  expectOnInventoryPage,
  expectOnCartPage,
  expectOnCheckoutStepOnePage,
  expectOnCheckoutStepTwoPage,
  expectOnCheckoutCompletePage,
  expectOnProductDetailsPage,
  reloadAndAssertOnSamePage,
  navigateToCartFromInventory,
  navigateToInventoryFromCart,
  goBackAndAssert,
} from '../../../src/utils/navigation';
import { makeCheckoutUserData } from '../../../src/utils/testData';

test.describe('Navigation and URL flow', () => {
  test('login redirects to inventory and reload keeps user on inventory', {
    tag: ['@nav', '@auth', '@inventory'],
  }, async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
  }) => {
    const ctx: NavigationContext = {
      page,
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
    };

    await loginPage.loginAs('standard');
    await expectOnInventoryPage(ctx);
    await reloadAndAssertOnSamePage(ctx, 'inventory');
  });

  test('user can navigate inventory -> cart -> inventory and back', {
    tag: ['@nav', '@cart', '@inventory'],
  }, async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
    loggedInInventoryPage,
  }) => {
    await loggedInInventoryPage.waitForVisible();
    const ctx: NavigationContext = {
      page,
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
    };

    await navigateToCartFromInventory(ctx);
    await navigateToInventoryFromCart(ctx);
  });

  test('back button from cart returns to inventory', {
    tag: ['@nav', '@cart', '@inventory'],
  }, async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
    loggedInInventoryPage,
  }) => {
    await loggedInInventoryPage.waitForVisible();
    const ctx: NavigationContext = {
      page,
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
    };

    await navigateToCartFromInventory(ctx);
    await goBackAndAssert(ctx, 'inventory');
  });

  test('back button from checkout step one returns to cart', {
    tag: ['@nav', '@checkout', '@cart'],
  }, async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
  }) => {
    const ctx: NavigationContext = {
      page,
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
    };
    const productName = productCatalog.products[0].name;

    await loginPage.loginAs('standard');
    await inventoryPage.waitForVisible();
    await inventoryPage.addProductToCartByName(productName);
    await navigateToCartFromInventory(ctx);
    await cartPage.proceedToCheckout();
    await expectOnCheckoutStepOnePage(ctx);
    await goBackAndAssert(ctx, 'cart');
  });

  test('refresh on checkout step one keeps cart items for summary', {
    tag: ['@nav', '@checkout'],
  }, async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
  }) => {
    const ctx: NavigationContext = {
      page,
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
    };
    const names = productCatalog.products.slice(0, 2).map((product) => product.name);

    await loginPage.loginAs('standard');
    await inventoryPage.waitForVisible();
    for (const name of names) {
      await inventoryPage.addProductToCartByName(name);
    }

    await navigateToCartFromInventory(ctx);
    const expectedCount = await cartPage.getItemsCount();
    await cartPage.proceedToCheckout();
    await expectOnCheckoutStepOnePage(ctx);
    await reloadAndAssertOnSamePage(ctx, 'checkoutStepOne');

    const user = makeCheckoutUserData();
    await checkoutStepOnePage.fillForm(user.firstName, user.lastName, user.postalCode);
    await checkoutStepOnePage.continueToStepTwo();
    await expectOnCheckoutStepTwoPage(ctx);
    expect(await checkoutStepTwoPage.getSummaryItemCount()).toBe(expectedCount);
  });

  test('refresh on checkout step two keeps summary items', {
    tag: ['@nav', '@checkout'],
  }, async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
  }) => {
    const ctx: NavigationContext = {
      page,
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
    };
    const names = productCatalog.products.slice(0, 3).map((product) => product.name);

    await loginPage.loginAs('standard');
    await inventoryPage.waitForVisible();
    for (const name of names) {
      await inventoryPage.addProductToCartByName(name);
    }
    await navigateToCartFromInventory(ctx);
    await cartPage.proceedToCheckout();
    await checkoutStepOnePage.waitForVisible();
    const user = makeCheckoutUserData();
    await checkoutStepOnePage.fillForm(user.firstName, user.lastName, user.postalCode);
    await checkoutStepOnePage.continueToStepTwo();
    await expectOnCheckoutStepTwoPage(ctx);

    const summaryBefore = await checkoutStepTwoPage.getItemNames();
    await reloadAndAssertOnSamePage(ctx, 'checkoutStepTwo');
    const summaryAfter = await checkoutStepTwoPage.getItemNames();
    expect(summaryAfter).toEqual(summaryBefore);
  });

  test('after finishing checkout, back brings user to inventory without cart items', {
    tag: ['@nav', '@checkout', '@e2e'],
  }, async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
  }) => {
    const ctx: NavigationContext = {
      page,
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
    };
    const productName = productCatalog.products[0].name;

    await loginPage.loginAs('standard');
    await inventoryPage.waitForVisible();
    await inventoryPage.addProductToCartByName(productName);
    await navigateToCartFromInventory(ctx);
    await cartPage.proceedToCheckout();
    await checkoutStepOnePage.waitForVisible();
    const user = makeCheckoutUserData();
    await checkoutStepOnePage.fillForm(user.firstName, user.lastName, user.postalCode);
    await checkoutStepOnePage.continueToStepTwo();
    await checkoutStepTwoPage.finishCheckout();
    await expectOnCheckoutCompletePage(ctx);

    await goBackAndAssert(ctx, 'inventory');
    expect(await inventoryPage.getCartBadgeCount()).toBe(0);
  });

  test('anonymous user cannot reach inventory via browser history after logout', {
    tag: ['@nav', '@auth'],
  }, async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
    headerMenu,
  }) => {
    const ctx: NavigationContext = {
      page,
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
    };

    await loginPage.loginAs('standard');
    await expectOnInventoryPage(ctx);
    await headerMenu.clickLogout();
    await expectOnLoginPage(ctx);
    await goBackAndAssert(ctx, 'login');
  });

  test('direct navigation to cart URL without login leads to login page', {
    tag: ['@nav', '@auth', '@cart'],
  }, async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
  }) => {
    const ctx: NavigationContext = {
      page,
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
    };

    await openCartDirect(page);
    await expectOnLoginPage(ctx);
  });

  test('direct navigation to checkout step one without login leads to login page', {
    tag: ['@nav', '@auth', '@checkout'],
  }, async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
  }) => {
    const ctx: NavigationContext = {
      page,
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
    };

    await openCheckoutStepOneDirect(page);
    await expectOnLoginPage(ctx);
  });

  test('direct navigation to checkout step two without login leads to login page', {
    tag: ['@nav', '@auth', '@checkout'],
  }, async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
  }) => {
    const ctx: NavigationContext = {
      page,
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
    };

    await openCheckoutStepTwoDirect(page);
    await expectOnLoginPage(ctx);
  });

  test('direct navigation to checkout complete without login leads to login page', {
    tag: ['@nav', '@auth', '@checkout'],
  }, async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
  }) => {
    const ctx: NavigationContext = {
      page,
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
    };

    await openCheckoutCompleteDirect(page);
    await expectOnLoginPage(ctx);
  });

  test('product details back button returns to inventory and browser back returns to details', {
    tag: ['@nav', '@details', '@inventory'],
  }, async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
    loggedInInventoryPage,
  }) => {
    await loggedInInventoryPage.waitForVisible();
    const ctx: NavigationContext = {
      page,
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
    };
    const productName = productCatalog.products[0].name;

    await inventoryPage.openItemDetailsByName(productName);
    await expectOnProductDetailsPage(ctx);
    await productDetailsPage.backToProducts();
    await expectOnInventoryPage(ctx);
    await goBackAndAssert(ctx, 'inventoryItem');
  });
});
