// tests/ui/cart-history-integration.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';
import { CartHistory } from '../../src/utils/cartHistory';
import { productCatalog } from '../../src/data/products';

const sortNames = (values: string[]): string[] => [...values].sort();
const defaultProducts = productCatalog.products.map((product) => product.name);

test.describe('Cart history integration with UI flows', () => {
  test('cart history matches actual UI cart items after add and remove', {
    tag: ['@cart', '@cartHistory', '@integration'],
  }, async ({ loginPage, inventoryPage, cartPage }) => {
    const history = new CartHistory();
    const productsToUse = defaultProducts.slice(0, 3);

    await loginPage.loginAs('standard');
    await inventoryPage.waitForVisible();

    for (const name of productsToUse) {
      await inventoryPage.addProductToCartByName(name);
      history.addItem(name);
    }

    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const removed = productsToUse[0];
    await cartPage.removeItemByName(removed);
    history.removeItem(removed);

    const uiNames = await cartPage.getItemNames();
    const historyNames = history.getCurrentCartProductNames();
    expect(sortNames(uiNames)).toEqual(sortNames(historyNames));
  });

  test('cart history clear aligns with Reset App State behavior', {
    tag: ['@cart', '@cartHistory', '@integration', '@reset'],
  }, async ({ loginPage, inventoryPage, cartPage, headerMenu }) => {
    const history = new CartHistory();
    const productsToUse = defaultProducts.slice(0, 2);

    await loginPage.loginAs('standard');
    await inventoryPage.waitForVisible();
    for (const name of productsToUse) {
      await inventoryPage.addProductToCartByName(name);
      history.addItem(name);
    }

    await headerMenu.clickResetAppState();
    await inventoryPage.waitForVisible();
    history.reset();

    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    expect(await cartPage.getItemsCount()).toBe(0);
    expect(history.getCurrentCartProductNames()).toEqual([]);
    const snapshot = history.getSnapshot();
    expect(snapshot.resetsCount).toBe(1);
  });

  test('cart history records full checkout flow as successful checkout', {
    tag: ['@cart', '@cartHistory', '@integration', '@checkout', '@e2e'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    const history = new CartHistory();
    const productsToUse = defaultProducts.slice(0, 2);

    await loginPage.loginAs('standard');
    await inventoryPage.waitForVisible();

    for (const name of productsToUse) {
      await inventoryPage.addProductToCartByName(name);
      history.addItem(name);
    }

    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    history.checkoutStarted('UI checkout');
    await cartPage.proceedToCheckout();
    await checkoutStepOnePage.waitForVisible();
    await checkoutStepOnePage.fillForm('John', 'Doe', '10101');
    await checkoutStepOnePage.continueToStepTwo();
    await checkoutStepTwoPage.waitForVisible();
    await checkoutStepTwoPage.finishCheckout();
    await checkoutCompletePage.waitForVisible();
    history.checkoutCompleted(true, { orderId: 'ORDER-1' });

    const snapshot = history.getSnapshot();
    expect(snapshot.checkoutStartedCount).toBe(1);
    expect(snapshot.checkoutCompletedCount).toBe(1);
    expect(snapshot.successfulCheckouts).toBe(1);
    expect(snapshot.failedCheckouts).toBe(0);
  });

  test('cart history can be reused across multiple flows in one test', {
    tag: ['@cart', '@cartHistory', '@integration', '@checkout', '@reset'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    headerMenu,
  }) => {
    const history = new CartHistory();
    const [firstProduct, secondProduct] = defaultProducts;

    // Flow one: add/remove/reset
    await loginPage.loginAs('standard');
    await inventoryPage.waitForVisible();
    await inventoryPage.addProductToCartByName(firstProduct);
    history.addItem(firstProduct);
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    await cartPage.removeItemByName(firstProduct);
    history.removeItem(firstProduct);
    await headerMenu.clickResetAppState();
    await inventoryPage.waitForVisible();
    history.reset();
    await headerMenu.clickLogout();
    await loginPage.waitForVisible();

    // Flow two: checkout
    await loginPage.loginAs('standard');
    await inventoryPage.waitForVisible();
    await inventoryPage.addProductToCartByName(secondProduct);
    history.addItem(secondProduct);
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    history.checkoutStarted('Flow two checkout');
    await cartPage.proceedToCheckout();
    await checkoutStepOnePage.waitForVisible();
    await checkoutStepOnePage.fillForm('Jane', 'Smith', '60606');
    await checkoutStepOnePage.continueToStepTwo();
    await checkoutStepTwoPage.waitForVisible();
    await checkoutStepTwoPage.finishCheckout();
    await checkoutCompletePage.waitForVisible();
    history.checkoutCompleted(true);

    const snapshot = history.getSnapshot();
    expect(snapshot.resetsCount).toBe(1);
    expect(snapshot.checkoutCompletedCount).toBe(1);
    expect(snapshot.successfulCheckouts).toBe(1);
    expect(history.getTotalAddedCount()).toBeGreaterThan(1);
    expect(history.getTotalRemovedCount()).toBeGreaterThan(0);
  });

  test('cart history remains consistent after logout and new login cycle', {
    tag: ['@cart', '@cartHistory', '@integration', '@auth'],
  }, async ({ loginPage, inventoryPage, cartPage, headerMenu }) => {
    const history = new CartHistory();

    await loginPage.loginAs('standard');
    await inventoryPage.waitForVisible();
    await inventoryPage.addProductToCartByName(defaultProducts[0]);
    history.addItem(defaultProducts[0]);
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    await cartPage.removeItemByName(defaultProducts[0]);
    history.removeItem(defaultProducts[0]);
    await headerMenu.clickLogout();
    await loginPage.waitForVisible();

    await loginPage.loginAs('standard');
    await inventoryPage.waitForVisible();
    await inventoryPage.addProductToCartByName(defaultProducts[1]);
    history.addItem(defaultProducts[1]);

    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    const uiNames = await cartPage.getItemNames();
    const historyNames = history.getCurrentCartProductNames();
    expect(sortNames(uiNames)).toEqual(sortNames(historyNames));
    expect(history.getItemState(defaultProducts[0])?.inCart).toBe(false);
    expect(history.getItemState(defaultProducts[1])?.inCart).toBe(true);
  });
});
