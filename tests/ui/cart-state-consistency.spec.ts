// tests/ui/cart-state-consistency.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';
import { productCatalog } from '../../src/data/products';
import {
  calculateSubtotal,
  roundToCents,
  CartSnapshot,
  CheckoutSummarySnapshot,
} from '../../src/utils/cartState';
import { pickRandomSubset, randomInt } from '../../src/utils/random';
import { makeCheckoutUserData } from '../../src/utils/testData';
import { LoginPage } from '../../src/pages/LoginPage';
import { InventoryPage } from '../../src/pages/InventoryPage';
import { CartPage } from '../../src/pages/CartPage';
import { CheckoutStepOnePage } from '../../src/pages/CheckoutStepOnePage';
import { CheckoutStepTwoPage } from '../../src/pages/CheckoutStepTwoPage';
import { HeaderMenu } from '../../src/pages/HeaderMenu';

async function loginAndReset({
  loginPage,
  inventoryPage,
  headerMenu,
}: {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  headerMenu: HeaderMenu;
}) {
  await loginPage.loginAs('standard');
  await inventoryPage.waitForVisible();
  await headerMenu.clickResetAppState();
  await headerMenu.closeMenu();
  await inventoryPage.waitForVisible();
}

async function proceedToCheckoutStepTwo({
  cartPage,
  checkoutStepOnePage,
  checkoutStepTwoPage,
}: {
  cartPage: CartPage;
  checkoutStepOnePage: CheckoutStepOnePage;
  checkoutStepTwoPage: CheckoutStepTwoPage;
}) {
  await cartPage.proceedToCheckout();
  await checkoutStepOnePage.waitForVisible();
  const user = makeCheckoutUserData();
  await checkoutStepOnePage.fillForm(user.firstName, user.lastName, user.postalCode);
  await checkoutStepOnePage.continueToStepTwo();
  await checkoutStepTwoPage.waitForVisible();
}

test.describe('Cart state and totals consistency', () => {
  test.beforeEach(async ({ loginPage, inventoryPage, headerMenu }) => {
    await loginAndReset({ loginPage, inventoryPage, headerMenu });
  });

  test('cart snapshot matches product catalog for single product', {
    tag: ['@cart', '@state', '@totals'],
  }, async ({ inventoryPage, cartPage }) => {
    const product = productCatalog.products[0];
    await inventoryPage.addProductToCartByName(product.name);
    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const snapshot: CartSnapshot = await cartPage.getSnapshot();
    expect(snapshot.items).toHaveLength(1);
    expect(snapshot.items[0]).toMatchObject({ name: product.name, unitPrice: product.price, quantity: 1 });
    expect(snapshot.subtotal).toBe(roundToCents(product.price));
  });

  test('cart snapshot matches product catalog for multiple products', {
    tag: ['@cart', '@state', '@totals'],
  }, async ({ inventoryPage, cartPage }) => {
    const products = productCatalog.products.slice(0, 3);
    for (const product of products) {
      await inventoryPage.addProductToCartByName(product.name);
    }
    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const snapshot: CartSnapshot = await cartPage.getSnapshot();
    expect(snapshot.items.map((item) => item.name).sort()).toEqual(products.map((p) => p.name).sort());
    expect(snapshot.subtotal).toBe(roundToCents(products.reduce((sum, p) => sum + p.price, 0)));
  });

  test('cart snapshot subtotal equals sum of item prices', {
    tag: ['@cart', '@state', '@totals'],
  }, async ({ inventoryPage, cartPage }) => {
    const products = productCatalog.products.slice(1, 4);
    for (const product of products) {
      await inventoryPage.addProductToCartByName(product.name);
    }
    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const snapshot: CartSnapshot = await cartPage.getSnapshot();
    const expectedSubtotal = roundToCents(calculateSubtotal(snapshot.items));
    expect(snapshot.subtotal).toBe(expectedSubtotal);
  });

  test('checkout step two summary items match cart snapshot', {
    tag: ['@checkout', '@cart', '@state', '@totals'],
  }, async ({ inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage }) => {
    const products = productCatalog.products.slice(0, 2);
    for (const product of products) {
      await inventoryPage.addProductToCartByName(product.name);
    }
    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const cartSnapshot: CartSnapshot = await cartPage.getSnapshot();
    await proceedToCheckoutStepTwo({ cartPage, checkoutStepOnePage, checkoutStepTwoPage });
    const summary: CheckoutSummarySnapshot = await checkoutStepTwoPage.getSummarySnapshot();

    expect(summary.items.map((item) => item.name).sort()).toEqual(cartSnapshot.items.map((item) => item.name).sort());
    expect(roundToCents(cartSnapshot.subtotal)).toBe(roundToCents(summary.itemTotal));
  });

  test('checkout totals are consistent: item total + tax equals total', {
    tag: ['@checkout', '@state', '@totals'],
  }, async ({ inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage }) => {
    const products = productCatalog.products.slice(0, 3);
    for (const product of products) {
      await inventoryPage.addProductToCartByName(product.name);
    }
    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    await proceedToCheckoutStepTwo({ cartPage, checkoutStepOnePage, checkoutStepTwoPage });
    const summary: CheckoutSummarySnapshot = await checkoutStepTwoPage.getSummarySnapshot();
    expect(roundToCents(summary.itemTotal + summary.tax)).toBe(roundToCents(summary.total));
  });

  test('removing item from cart updates snapshot and reduces subtotal', {
    tag: ['@cart', '@state', '@totals'],
  }, async ({ inventoryPage, cartPage }) => {
    const products = productCatalog.products.slice(0, 3);
    for (const product of products) {
      await inventoryPage.addProductToCartByName(product.name);
    }
    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const snapshotBefore: CartSnapshot = await cartPage.getSnapshot();
    const productToRemove = products[1];
    await cartPage.removeItemByName(productToRemove.name);
    const snapshotAfter: CartSnapshot = await cartPage.getSnapshot();

    expect(snapshotAfter.items).toHaveLength(snapshotBefore.items.length - 1);
    expect(snapshotAfter.items.find((item) => item.name === productToRemove.name)).toBeUndefined();
    const expectedSubtotal = roundToCents(snapshotBefore.subtotal - productToRemove.price);
    expect(snapshotAfter.subtotal).toBe(expectedSubtotal);
  });

  test('changing cart before checkout affects checkout step two summary', {
    tag: ['@checkout', '@state', '@totals'],
  }, async ({ inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage }) => {
    const selected = productCatalog.products.slice(0, 3);
    for (const product of selected) {
      await inventoryPage.addProductToCartByName(product.name);
    }
    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const removedProduct = selected[2];
    await cartPage.removeItemByName(removedProduct.name);

    await proceedToCheckoutStepTwo({ cartPage, checkoutStepOnePage, checkoutStepTwoPage });
    const summary: CheckoutSummarySnapshot = await checkoutStepTwoPage.getSummarySnapshot();
    const expectedTotal = roundToCents(selected.slice(0, 2).reduce((sum, p) => sum + p.price, 0));
    expect(roundToCents(summary.itemTotal)).toBe(expectedTotal);
  });

  test('reset app state clears cart snapshot and prevents checkout items', {
    tag: ['@cart', '@state', '@totals', '@menu'],
  }, async ({ inventoryPage, cartPage, headerMenu, checkoutStepOnePage }) => {
    const products = productCatalog.products.slice(0, 2);
    for (const product of products) {
      await inventoryPage.addProductToCartByName(product.name);
    }
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    const snapshot: CartSnapshot = await cartPage.getSnapshot();
    expect(snapshot.items.length).toBeGreaterThan(0);

    await headerMenu.clickResetAppState();
    await headerMenu.closeMenu();
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    const clearedSnapshot: CartSnapshot = await cartPage.getSnapshot();
    expect(clearedSnapshot.items).toHaveLength(0);
    expect(clearedSnapshot.subtotal).toBe(0);

    await cartPage.tryProceedToCheckoutWithEmptyCart();
    await checkoutStepOnePage.waitForVisible();
    expect(await checkoutStepOnePage.getFirstNameValue()).toBe('');
  });

  test('random subset of products results in correct subtotal and checkout totals', {
    tag: ['@cart', '@checkout', '@state', '@totals', '@random'],
  }, async ({ inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage }) => {
    const count = randomInt(1, productCatalog.products.length);
    const subset = pickRandomSubset(productCatalog.products, count);
    for (const product of subset) {
      await inventoryPage.addProductToCartByName(product.name);
    }
    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const snapshot: CartSnapshot = await cartPage.getSnapshot();
    const expectedSubtotal = roundToCents(subset.reduce((sum, p) => sum + p.price, 0));
    expect(snapshot.subtotal).toBe(expectedSubtotal);

    await proceedToCheckoutStepTwo({ cartPage, checkoutStepOnePage, checkoutStepTwoPage });
    const summary: CheckoutSummarySnapshot = await checkoutStepTwoPage.getSummarySnapshot();
    expect(roundToCents(summary.itemTotal)).toBe(expectedSubtotal);
  });
});
