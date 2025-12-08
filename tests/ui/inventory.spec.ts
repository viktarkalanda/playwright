// tests/ui/inventory.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';

test.beforeEach(async ({ loggedInInventoryPage }) => {
  await loggedInInventoryPage.waitForVisible();
});

test('cart is empty when user did not add any products', { tag: '@inventory' }, async ({ inventoryPage, cartPage }) => {
  await inventoryPage.openCart();

  await cartPage.waitForVisible();
  const itemsCount = await cartPage.getItemsCount();

  expect(itemsCount, 'Cart should be empty when no products were added').toBe(0);
});

test('user can add first product to cart', { tag: '@inventory' }, async ({ inventoryPage, cartPage }) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();

  await cartPage.waitForVisible();
  const itemsCount = await cartPage.getItemsCount();

  expect(itemsCount, 'Cart should contain at least one item after adding product').toBeGreaterThan(
    0,
  );
});

test('cart contains "Sauce Labs Backpack" after adding first product', { tag: '@inventory' }, async ({
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

test('user can add two different products to cart', { tag: '@inventory' }, async ({ inventoryPage, cartPage }) => {
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

test('user can remove product from cart', { tag: '@inventory' }, async ({ inventoryPage, cartPage }) => {
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

test('cart contents persist when navigating back to inventory and opening cart again', { tag: '@inventory' }, async ({
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

// -------------------- NEW TESTS BELOW --------------------

const expectedProductNames = [
  'Sauce Labs Backpack',
  'Sauce Labs Bike Light',
  'Sauce Labs Bolt T-Shirt',
  'Sauce Labs Fleece Jacket',
  'Sauce Labs Onesie',
  'Test.allTheThings() T-Shirt (Red)',
];

test('inventory page title is "Products"', { tag: ['@inventory', '@smoke'] }, async ({ inventoryPage }) => {
  const title = await inventoryPage.getTitleText();

  expect(title, 'Inventory page title should be "Products"').toBe('Products');
});

test('inventory page shows all expected products', { tag: ['@inventory', '@smoke'] }, async ({ inventoryPage }) => {
  const names = await inventoryPage.getItemNames();

  for (const expectedName of expectedProductNames) {
    expect(names, `Inventory page should contain product with name "${expectedName}"`).toContain(
      expectedName,
    );
  }
});

test('inventory items count matches expected products length', { tag: '@inventory' }, async ({ inventoryPage }) => {
  const itemsCount = await inventoryPage.getItemsCount();

  expect(
    itemsCount,
    `Inventory should contain exactly ${expectedProductNames.length} products`,
  ).toBe(expectedProductNames.length);
});

test('inventory can sort products by name A to Z', { tag: ['@inventory', '@smoke'] }, async ({ inventoryPage }) => {
  await inventoryPage.sortBy('az');

  const names = await inventoryPage.getItemNames();
  const sorted = [...names].sort((a, b) => a.localeCompare(b));

  expect(
    names,
    'Product names should be sorted alphabetically (A to Z) after sorting by name A to Z',
  ).toEqual(sorted);
});

test('inventory can sort products by name Z to A', { tag: '@inventory' }, async ({ inventoryPage }) => {
  await inventoryPage.sortBy('za');

  const names = await inventoryPage.getItemNames();
  const sorted = [...names].sort((a, b) => b.localeCompare(a));

  expect(
    names,
    'Product names should be sorted in reverse alphabetical order (Z to A) after sorting',
  ).toEqual(sorted);
});

test('inventory can sort products by price low to high', { tag: '@inventory' }, async ({ inventoryPage }) => {
  await inventoryPage.sortBy('lohi');

  const prices = await inventoryPage.getItemPrices();
  const sorted = [...prices].sort((a, b) => a - b);

  expect(
    prices,
    'Product prices should be sorted from low to high after sorting by price (low to high)',
  ).toEqual(sorted);
});

test('inventory can sort products by price high to low', { tag: '@inventory' }, async ({ inventoryPage }) => {
  await inventoryPage.sortBy('hilo');

  const prices = await inventoryPage.getItemPrices();
  const sorted = [...prices].sort((a, b) => b - a);

  expect(
    prices,
    'Product prices should be sorted from high to low after sorting by price (high to low)',
  ).toEqual(sorted);
});

test('add to cart button changes to Remove after adding product by name', { tag: '@inventory' }, async ({
  inventoryPage,
}) => {
  const productName = 'Sauce Labs Backpack';

  const item = inventoryPage.inventoryItems.filter({ hasText: productName });
  const button = item.getByRole('button');

  const initialLabel = await button.textContent();

  await inventoryPage.addItemToCartByName(productName);

  const labelAfterAdd = await button.textContent();

  expect(initialLabel?.trim(), 'Initial button label should contain "Add to cart"').toContain(
    'Add to cart',
  );
  expect(
    labelAfterAdd?.trim(),
    'Button label should change to "Remove" after adding product to cart',
  ).toBe('Remove');
});

test('remove button changes back to Add to cart after removing product by name', { tag: '@inventory' }, async ({
  inventoryPage,
}) => {
  const productName = 'Sauce Labs Backpack';

  await inventoryPage.addItemToCartByName(productName);

  const item = inventoryPage.inventoryItems.filter({ hasText: productName });
  const button = item.getByRole('button');

  const labelAfterAdd = await button.textContent();

  await inventoryPage.removeItemFromCartByName(productName);

  const labelAfterRemove = await button.textContent();

  expect(labelAfterAdd?.trim(), 'Button label should be "Remove" after product is added').toBe(
    'Remove',
  );
  expect(
    labelAfterRemove?.trim(),
    'Button label should change back to "Add to cart" after removing product',
  ).toContain('Add to cart');
});

test('cart badge count is zero when no products are added', { tag: '@inventory' }, async ({ inventoryPage }) => {
  const badgeCount = await inventoryPage.getCartBadgeCount();

  expect(
    badgeCount,
    'Cart badge count should be zero when no products are added from inventory',
  ).toBe(0);
});

test('cart badge count increases when products are added from inventory', { tag: '@inventory' }, async ({
  inventoryPage,
}) => {
  await inventoryPage.addItemToCartByName('Sauce Labs Backpack');
  let badgeCount = await inventoryPage.getCartBadgeCount();

  expect(badgeCount, 'Cart badge count should be 1 after adding first product').toBe(1);

  await inventoryPage.addItemToCartByName('Sauce Labs Bike Light');
  badgeCount = await inventoryPage.getCartBadgeCount();

  expect(badgeCount, 'Cart badge count should be 2 after adding second product').toBe(2);
});

test('cart badge count decreases when product is removed from inventory', { tag: '@inventory' }, async ({
  inventoryPage,
}) => {
  await inventoryPage.addItemToCartByName('Sauce Labs Backpack');
  await inventoryPage.addItemToCartByName('Sauce Labs Bike Light');

  const badgeBeforeRemove = await inventoryPage.getCartBadgeCount();

  await inventoryPage.removeItemFromCartByName('Sauce Labs Backpack');

  const badgeAfterRemove = await inventoryPage.getCartBadgeCount();

  expect(
    badgeBeforeRemove,
    'Cart badge count should be greater than zero before removing product',
  ).toBeGreaterThan(0);
  expect(
    badgeAfterRemove,
    'Cart badge count should decrease after removing product from inventory',
  ).toBe(badgeBeforeRemove - 1);
});

test('cart badge matches actual cart items after multiple add/remove actions', { tag: '@inventory' }, async ({
  inventoryPage,
  cartPage,
}) => {
  const products = ['Sauce Labs Backpack', 'Sauce Labs Bike Light', 'Sauce Labs Bolt T-Shirt'];

  for (const name of products) {
    await inventoryPage.addItemToCartByName(name);
  }

  await inventoryPage.removeItemFromCartByName('Sauce Labs Bike Light');

  const badgeCount = await inventoryPage.getCartBadgeCount();

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const itemsInCart = await cartPage.getItemsCount();

  expect(badgeCount, 'Cart badge should match the actual number of items in cart').toBe(
    itemsInCart,
  );
  expect(itemsInCart, 'Cart should contain two items after removing one of the three added').toBe(2);
});

test('inventory reload does not remove products already added to the cart', { tag: '@inventory' }, async ({
  page,
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.addItemToCartByName('Sauce Labs Backpack');

  await page.reload();
  await inventoryPage.waitForVisible();

  const badgeCount = await inventoryPage.getCartBadgeCount();
  expect(
    badgeCount,
    'Cart badge should still show added item after reloading inventory page',
  ).toBe(1);

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const hasBackpack = await cartPage.hasItemWithName('Sauce Labs Backpack');
  expect(
    hasBackpack,
    'Cart should still contain the previously added product after inventory reload',
  ).toBe(true);
});
