// tests/ui/inventory-sorting.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';
import { productCatalog } from '../../src/data/products';
import { isSortedStrings, isSortedNumbers, haveSameElementsIgnoreOrder } from '../../src/utils/sortUtils';
import { InventorySortOption } from '../../src/pages/InventoryPage';

const catalogNames = productCatalog.products.map((product) => product.name);
const catalogPrices = productCatalog.products.map((product) => product.price);

test.describe('Inventory sorting', () => {
  test.beforeEach(async ({ loggedInInventoryPage, headerMenu }) => {
    await loggedInInventoryPage.waitForVisible();
    await headerMenu.clickResetAppState();
    await headerMenu.closeMenu();
    await loggedInInventoryPage.waitForVisible();
  });

  test('A→Z sorting sorts products by name ascending', {
    tag: ['@inventory', '@sorting'],
  }, async ({ inventoryPage }) => {
    await inventoryPage.sortBy('nameAsc');
    const names = await inventoryPage.getAllItemNames();
    expect(isSortedStrings(names, 'asc')).toBe(true);
    expect(haveSameElementsIgnoreOrder(names, catalogNames)).toBe(true);
  });

  test('Z→A sorting sorts products by name descending', {
    tag: ['@inventory', '@sorting'],
  }, async ({ inventoryPage }) => {
    await inventoryPage.sortBy('nameDesc');
    const names = await inventoryPage.getAllItemNames();
    expect(isSortedStrings(names, 'desc')).toBe(true);
    expect(haveSameElementsIgnoreOrder(names, catalogNames)).toBe(true);
  });

  test('Price low→high sorts products by price ascending', {
    tag: ['@inventory', '@sorting'],
  }, async ({ inventoryPage }) => {
    await inventoryPage.sortBy('priceAsc');
    const prices = await inventoryPage.getAllItemPrices();
    expect(isSortedNumbers(prices, 'asc')).toBe(true);
  });

  test('Price high→low sorts products by price descending', {
    tag: ['@inventory', '@sorting'],
  }, async ({ inventoryPage }) => {
    await inventoryPage.sortBy('priceDesc');
    const prices = await inventoryPage.getAllItemPrices();
    expect(isSortedNumbers(prices, 'desc')).toBe(true);
  });

  test('sorting by name does not lose or duplicate products', {
    tag: ['@inventory', '@sorting', '@state'],
  }, async ({ inventoryPage }) => {
    const namesBefore = await inventoryPage.getAllItemNames();
    await inventoryPage.sortBy('nameDesc');
    const namesAfter = await inventoryPage.getAllItemNames();
    expect(haveSameElementsIgnoreOrder(namesBefore, namesAfter)).toBe(true);
  });

  test('sorting by price does not lose or duplicate products', {
    tag: ['@inventory', '@sorting', '@state'],
  }, async ({ inventoryPage }) => {
    const namesBefore = await inventoryPage.getAllItemNames();
    await inventoryPage.sortBy('priceAsc');
    await inventoryPage.sortBy('priceDesc');
    const namesAfter = await inventoryPage.getAllItemNames();
    expect(haveSameElementsIgnoreOrder(namesBefore, namesAfter)).toBe(true);
  });

  test('sorting after adding items to cart keeps cart state but changes visual order only', {
    tag: ['@inventory', '@sorting', '@cart'],
  }, async ({ inventoryPage, cartPage }) => {
    const selectedProducts = productCatalog.products.slice(0, 2);
    for (const product of selectedProducts) {
      await inventoryPage.addProductToCartByName(product.name);
    }

    await inventoryPage.sortBy('priceAsc');
    const names = await inventoryPage.getAllItemNames();
    expect(isSortedStrings(names, 'asc')).toBe(true);

    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    const cartNames = await cartPage.getItemNames();
    expect(haveSameElementsIgnoreOrder(cartNames, selectedProducts.map((p) => p.name))).toBe(true);
  });

  test('switching sort order multiple times does not break set of products', {
    tag: ['@inventory', '@sorting'],
  }, async ({ inventoryPage }) => {
    const sequences: InventorySortOption[] = ['nameAsc', 'nameDesc', 'priceAsc', 'priceDesc', 'nameAsc'];
    for (const option of sequences) {
      await inventoryPage.sortBy(option);
      const names = await inventoryPage.getAllItemNames();
      expect(haveSameElementsIgnoreOrder(names, catalogNames)).toBe(true);
    }
  });

  test('sorting is consistent with product catalog prices', {
    tag: ['@inventory', '@sorting', '@catalog'],
  }, async ({ inventoryPage }) => {
    await inventoryPage.sortBy('priceAsc');
    const pairs = await inventoryPage.getAllItemNamesAndPrices();
    for (const pair of pairs) {
      const product = productCatalog.getByName(pair.name);
      expect(product?.price).toBeCloseTo(pair.price, 2);
    }
  });

  test('details page respects sorted inventory when navigating back', {
    tag: ['@inventory', '@sorting', '@details'],
  }, async ({ inventoryPage, productDetailsPage }) => {
    await inventoryPage.sortBy('nameAsc');
    const names = await inventoryPage.getAllItemNames();
    const firstProduct = names[0];
    await inventoryPage.openItemDetailsByName(firstProduct);
    await productDetailsPage.waitForVisible();
    await productDetailsPage.backToProducts();
    await inventoryPage.waitForVisible();
    const afterBackNames = await inventoryPage.getAllItemNames();
    expect(afterBackNames[0]).toBe(firstProduct);
    expect(isSortedStrings(afterBackNames, 'asc')).toBe(true);
  });

  test('cart badge does not depend on sort order', {
    tag: ['@inventory', '@sorting', '@cart'],
  }, async ({ inventoryPage }) => {
    const products = productCatalog.products.slice(0, 3);
    for (const product of products) {
      await inventoryPage.addProductToCartByName(product.name);
    }
    const badgeBefore = await inventoryPage.getCartBadgeCount();
    const sorts: InventorySortOption[] = ['nameAsc', 'nameDesc', 'priceAsc', 'priceDesc'];
    for (const option of sorts) {
      await inventoryPage.sortBy(option);
      expect(await inventoryPage.getCartBadgeCount()).toBe(badgeBefore);
    }
  });
});
