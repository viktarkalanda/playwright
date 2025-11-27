// tests/ui/cart.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';

test.beforeEach(async ({ loggedInInventoryPage }) => {
  await loggedInInventoryPage.waitForVisible();
});

test('user can add first product to cart', async ({ inventoryPage, cartPage }) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();

  await cartPage.waitForVisible();
  const itemsCount = await cartPage.getItemsCount();

  expect(itemsCount, 'Cart should contain at least one item after adding product').toBeGreaterThan(
    0,
  );
});

test('cart contains "Sauce Labs Backpack" after add', async ({ inventoryPage, cartPage }) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();

  await cartPage.waitForVisible();
  const hasBackpack = await cartPage.hasItemWithName('Sauce Labs Backpack');

  expect(hasBackpack, 'Cart should contain "Sauce Labs Backpack" as the first added product').toBe(
    true,
  );
});

test('cart is empty when opened without adding products', async ({ inventoryPage, cartPage }) => {
  await inventoryPage.openCart();

  await cartPage.waitForVisible();
  const itemsCount = await cartPage.getItemsCount();

  expect(itemsCount, 'Cart should be empty when user opens cart without adding any products').toBe(
    0,
  );
});

test('cart does not contain unknown product', async ({ inventoryPage, cartPage }) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();

  await cartPage.waitForVisible();
  const hasRandomProduct = await cartPage.hasItemWithName('Some non existing product name');

  expect(hasRandomProduct, 'Cart should not contain products that were never added').toBe(false);
});

test('cart becomes empty after adding and then removing first product', async ({
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.addFirstItemToCart(); // second click = remove on Sauce Demo
  await inventoryPage.openCart();

  await cartPage.waitForVisible();
  const itemsCount = await cartPage.getItemsCount();

  expect(itemsCount, 'Cart should be empty after product is added and then removed').toBe(0);
});

test('cart items count increases after adding product', async ({ inventoryPage, cartPage }) => {
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const initialCount = await cartPage.getItemsCount();

  await cartPage.continueShopping();
  await inventoryPage.waitForVisible();

  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const finalCount = await cartPage.getItemsCount();

  expect(finalCount, 'Cart items count should increase after adding product').toBeGreaterThan(
    initialCount,
  );
});

test('cart retains item after navigating back to inventory and returning to cart', async ({
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();

  await cartPage.waitForVisible();

  await cartPage.continueShopping();
  await inventoryPage.waitForVisible();

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const hasBackpack = await cartPage.hasItemWithName('Sauce Labs Backpack');

  expect(
    hasBackpack,
    'Cart should still contain "Sauce Labs Backpack" after navigating back to inventory and returning to cart',
  ).toBe(true);
});
