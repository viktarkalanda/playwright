// tests/ui/cart.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';

test.beforeEach(async ({ loggedInInventoryPage }) => {
  await loggedInInventoryPage.waitForVisible();
});

test('cart is empty when user did not add any products', async ({ inventoryPage, cartPage }) => {
  await inventoryPage.openCart();

  await cartPage.waitForVisible();
  const itemsCount = await cartPage.getItemsCount();

  expect(itemsCount, 'Cart should be empty when no products were added').toBe(0);
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

test('cart contains "Sauce Labs Backpack" after adding first product', async ({
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();

  await cartPage.waitForVisible();
  const hasBackpack = await cartPage.hasItemWithName('Sauce Labs Backpack');

  expect(hasBackpack, 'Cart should contain "Sauce Labs Backpack" as the first added product').toBe(
    true,
  );
});

test('user can add two different products to cart', async ({ inventoryPage, cartPage }) => {
  await inventoryPage.addFirstItemToCart();

  const secondItem = inventoryPage.inventoryItems.nth(1);
  const secondItemName = 'Sauce Labs Bike Light';

  await secondItem
    .getByRole('button', {
      name: 'Add to cart',
    })
    .click();

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const itemsCount = await cartPage.getItemsCount();
  expect(itemsCount, 'Cart should contain exactly two items after adding two products').toBe(2);

  const hasBackpack = await cartPage.hasItemWithName('Sauce Labs Backpack');
  const hasBikeLight = await cartPage.hasItemWithName(secondItemName);

  expect(
    hasBackpack,
    'Cart should contain "Sauce Labs Backpack" after adding it from inventory',
  ).toBe(true);

  expect(
    hasBikeLight,
    'Cart should contain "Sauce Labs Bike Light" after adding it from inventory',
  ).toBe(true);
});

test('user can remove product from cart', async ({ inventoryPage, cartPage }) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();

  await cartPage.waitForVisible();

  const itemsBeforeRemove = await cartPage.getItemsCount();
  expect(itemsBeforeRemove, 'Cart should contain at least one item before removal').toBeGreaterThan(
    0,
  );

  const firstCartItem = cartPage.cartItems.first();
  await firstCartItem
    .getByRole('button', {
      name: 'Remove',
    })
    .click();

  const itemsAfterRemove = await cartPage.getItemsCount();
  expect(itemsAfterRemove, 'Cart should be empty after removing the only item').toBe(0);
});

test('cart contents persist when navigating back to inventory and opening cart again', async ({
  inventoryPage,
  cartPage,
  page,
}) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();

  await cartPage.waitForVisible();
  const itemsCountInitial = await cartPage.getItemsCount();
  expect(
    itemsCountInitial,
    'Cart should contain at least one item after adding product',
  ).toBeGreaterThan(0);

  await page.goBack();
  await inventoryPage.waitForVisible();

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const itemsCountAfterBack = await cartPage.getItemsCount();
  expect(
    itemsCountAfterBack,
    'Cart items count should remain the same after navigating back and reopening cart',
  ).toBe(itemsCountInitial);
});
