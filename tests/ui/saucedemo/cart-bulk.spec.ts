// tests/ui/cart-bulk.spec.ts
import { test, expect } from '../../../src/fixtures/test-fixtures';
import { productCatalog } from '../../../src/data/products';
import { range, shuffle, pickRandomSubset, randomInt } from '../../../src/utils/random';
import { makeCheckoutUserData } from '../../../src/utils/testData';

const catalogSize = productCatalog.products.length;

test.describe('Cart bulk and stress scenarios', () => {
  test.beforeEach(async ({ loggedInInventoryPage, headerMenu }) => {
    await loggedInInventoryPage.waitForVisible();
    await headerMenu.clickResetAppState();
    await headerMenu.closeMenu();
    await loggedInInventoryPage.waitForVisible();
  });

  test('add all products to cart and verify badge and cart count', {
    tag: ['@cart', '@bulk', '@catalog', '@smoke'],
  }, async ({ loggedInInventoryPage: inventoryPage, cartPage }) => {
    await inventoryPage.addAllProductsToCart();
    expect(await inventoryPage.getCartBadgeCount()).toBe(catalogSize);

    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    expect(await cartPage.getItemsCount()).toBe(catalogSize);
  });

  test('remove all products from cart leaves cart empty', {
    tag: ['@cart', '@bulk', '@catalog'],
  }, async ({ loggedInInventoryPage: inventoryPage, cartPage }) => {
    await inventoryPage.addAllProductsToCart();
    expect(await inventoryPage.getCartBadgeCount()).toBe(catalogSize);

    await inventoryPage.removeAllProductsFromCart();
    expect(await inventoryPage.getCartBadgeCount()).toBe(0);

    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    expect(await cartPage.getItemsCount()).toBe(0);
  });

  test('add odd-indexed products only and verify', { tag: ['@cart', '@bulk'] }, async ({
    loggedInInventoryPage: inventoryPage,
    cartPage,
  }) => {
    const count = await inventoryPage.getItemsCount();
    const indexes = range(0, count).filter((index) => index % 2 === 1);
    const names = await inventoryPage.getAllItemNames();
    const expectedNames = indexes.map((index) => names[index]);

    await inventoryPage.addItemsToCartByIndexes(indexes);
    expect(await inventoryPage.getCartBadgeCount()).toBe(indexes.length);

    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    const cartNames = await cartPage.getItemNames();
    expect(cartNames.sort()).toEqual([...expectedNames].sort());
  });

  test('add even-indexed products only and verify', { tag: ['@cart', '@bulk'] }, async ({
    loggedInInventoryPage: inventoryPage,
    cartPage,
  }) => {
    const count = await inventoryPage.getItemsCount();
    const indexes = range(0, count).filter((index) => index % 2 === 0);
    const names = await inventoryPage.getAllItemNames();
    const expectedNames = indexes.map((index) => names[index]);

    await inventoryPage.addItemsToCartByIndexes(indexes);
    expect(await inventoryPage.getCartBadgeCount()).toBe(indexes.length);

    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    const cartNames = await cartPage.getItemNames();
    expect(cartNames.sort()).toEqual([...expectedNames].sort());
  });

  test('toggle each product in and out of cart keeps final state empty', { tag: ['@cart', '@bulk'] }, async ({
    loggedInInventoryPage: inventoryPage,
    cartPage,
  }) => {
    const count = await inventoryPage.getItemsCount();
    for (const index of range(0, count)) {
      await inventoryPage.addItemToCartByIndex(index);
      expect(await inventoryPage.isItemInCartByIndex(index)).toBe(true);
      await inventoryPage.removeItemFromCartByIndex(index);
      expect(await inventoryPage.isItemInCartByIndex(index)).toBe(false);
    }

    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    expect(await cartPage.getItemsCount()).toBe(0);
    expect(await inventoryPage.getCartBadgeCount()).toBe(0);
  });

  test('random subset of products can be added and removed', {
    tag: ['@cart', '@bulk', '@random'],
  }, async ({ loggedInInventoryPage: inventoryPage, cartPage }) => {
    const total = await inventoryPage.getItemsCount();
    const indexes = range(0, total);
    const subsetSize = randomInt(1, total - 1);
    const subset = pickRandomSubset(indexes, subsetSize);
    const names = await inventoryPage.getAllItemNames();
    const expectedNames = subset.map((index) => names[index]);

    await inventoryPage.addItemsToCartByIndexes(subset);
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    const cartNames = await cartPage.getItemNames();
    expect(cartNames.sort()).toEqual([...expectedNames].sort());

    await cartPage.continueShopping();
    await inventoryPage.waitForVisible();
    await inventoryPage.removeItemsFromCartByIndexes(subset);
    expect(await inventoryPage.getCartBadgeCount()).toBe(0);
  });

  test('bulk operations respect current sort order by name A to Z', {
    tag: ['@cart', '@bulk', '@inventory'],
  }, async ({ loggedInInventoryPage: inventoryPage, cartPage }) => {
    await inventoryPage.sortByNameAsc();
    const sortedNames = await inventoryPage.getAllItemNames();
    await inventoryPage.addAllProductsToCart();

    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    const cartNames = await cartPage.getItemNames();
    expect(cartNames.length).toBe(catalogSize);
    expect(cartNames.sort()).toEqual([...sortedNames].sort());
  });

  test('bulk operations work correctly after multiple sort changes', {
    tag: ['@cart', '@bulk', '@inventory'],
  }, async ({ loggedInInventoryPage: inventoryPage, cartPage }) => {
    await inventoryPage.sortByNameDesc();
    await inventoryPage.sortByPriceLowToHigh();
    await inventoryPage.sortByPriceHighToLow();
    await inventoryPage.sortByNameAsc();
    await inventoryPage.addAllProductsToCart();

    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    expect(await cartPage.getItemsCount()).toBe(catalogSize);
  });

  test('shuffled sequence of additions results in full cart', {
    tag: ['@cart', '@bulk', '@random'],
  }, async ({ loggedInInventoryPage: inventoryPage, cartPage }) => {
    const indexes = shuffle(range(0, await inventoryPage.getItemsCount()));
    await inventoryPage.addItemsToCartByIndexes(indexes);
    expect(await inventoryPage.getCartBadgeCount()).toBe(catalogSize);

    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    expect(await cartPage.getItemsCount()).toBe(catalogSize);
  });

  test('e2e checkout with all products in cart', {
    tag: ['@cart', '@bulk', '@checkout', '@e2e', '@smoke'],
  }, async ({
    loggedInInventoryPage: inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    await inventoryPage.addAllProductsToCart();
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    await cartPage.startCheckout();
    await checkoutStepOnePage.waitForVisible();

    const user = makeCheckoutUserData();
    await checkoutStepOnePage.completeStepOne(user.firstName, user.lastName, user.postalCode);

    await checkoutStepTwoPage.waitForVisible();
    expect(await checkoutStepTwoPage.getSummaryItemCount()).toBe(catalogSize);
    await checkoutStepTwoPage.finish();

    await checkoutCompletePage.waitForVisible();
    expect(await checkoutCompletePage.getHeaderText()).toContain('Thank you');
    await checkoutCompletePage.backHome();
    await inventoryPage.waitForVisible();
    expect(await inventoryPage.getCartBadgeCount()).toBe(0);
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    expect(await cartPage.isEmpty()).toBe(true);
  });

  test('reset app state clears any bulk cart operations', {
    tag: ['@cart', '@bulk', '@menu'],
  }, async ({ loggedInInventoryPage: inventoryPage, headerMenu, cartPage }) => {
    await inventoryPage.addAllProductsToCart();
    expect(await inventoryPage.getCartBadgeCount()).toBe(catalogSize);

    await headerMenu.clickResetAppState();
    await headerMenu.closeMenu();
    expect(await inventoryPage.getCartBadgeCount()).toBe(0);

    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    expect(await cartPage.isEmpty()).toBe(true);
  });
});
