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

// -------------------- NEW TESTS BELOW --------------------

test('cart URL is correct after opening from inventory with item', async ({
  page,
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();

  await cartPage.waitForVisible();

  await expect(page, 'Cart URL should be /cart.html when opened from inventory').toHaveURL(
    /.*cart\.html/,
  );
});

test('cart URL is correct when opened empty', async ({ page, inventoryPage, cartPage }) => {
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  await expect(page, 'Cart URL should be /cart.html even when cart is empty').toHaveURL(
    /.*cart\.html/,
  );
});

test('empty cart remains empty after multiple opens', async ({ inventoryPage, cartPage }) => {
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const firstCount = await cartPage.getItemsCount();

  await cartPage.continueShopping();
  await inventoryPage.waitForVisible();

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const secondCount = await cartPage.getItemsCount();

  expect(firstCount, 'Cart should be empty on first open').toBe(0);
  expect(secondCount, 'Cart should still be empty after reopening without adding items').toBe(0);
});

test('empty cart remains empty after page reload', async ({ page, inventoryPage, cartPage }) => {
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  await page.reload();
  await cartPage.waitForVisible();

  const itemsCount = await cartPage.getItemsCount();

  expect(itemsCount, 'Empty cart should remain empty after page reload').toBe(0);
});

test('cart contents persist after page reload when item is added', async ({
  page,
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  await page.reload();
  await cartPage.waitForVisible();

  const itemsCount = await cartPage.getItemsCount();
  const hasBackpack = await cartPage.hasItemWithName('Sauce Labs Backpack');

  expect(itemsCount, 'Cart should still contain items after page reload').toBeGreaterThan(0);
  expect(hasBackpack, 'Backpack should still be present after page reload').toBe(true);
});

test('cart retains item after continue shopping and page reload', async ({
  page,
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  await cartPage.continueShopping();
  await inventoryPage.waitForVisible();

  await page.reload();
  await inventoryPage.waitForVisible();

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const itemsCount = await cartPage.getItemsCount();
  const hasBackpack = await cartPage.hasItemWithName('Sauce Labs Backpack');

  expect(
    itemsCount,
    'Cart should still contain items after continue shopping and page reload',
  ).toBeGreaterThan(0);
  expect(
    hasBackpack,
    'Backpack should still be present after continue shopping and page reload',
  ).toBe(true);
});

test('cart items count is stable when reopening without changes', async ({
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const firstCount = await cartPage.getItemsCount();

  await cartPage.continueShopping();
  await inventoryPage.waitForVisible();

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const secondCount = await cartPage.getItemsCount();

  expect(firstCount, 'Cart should have at least one item after adding product').toBeGreaterThan(0);
  expect(secondCount, 'Cart items count should stay the same if no changes were made').toBe(
    firstCount,
  );
});

test('cart becomes empty after add, remove and page reload', async ({
  page,
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.addFirstItemToCart(); // remove
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  await page.reload();
  await cartPage.waitForVisible();

  const itemsCount = await cartPage.getItemsCount();

  expect(itemsCount, 'Cart should remain empty after add, remove and reload').toBe(0);
});

test('cart remains empty after add, remove and returning from inventory', async ({
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.addFirstItemToCart(); // remove

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const countAfterRemove = await cartPage.getItemsCount();

  await cartPage.continueShopping();
  await inventoryPage.waitForVisible();

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const countAfterReturn = await cartPage.getItemsCount();

  expect(countAfterRemove, 'Cart should be empty after add and remove before leaving cart').toBe(0);
  expect(
    countAfterReturn,
    'Cart should still be empty after returning from inventory to cart',
  ).toBe(0);
});

test('continue shopping from empty cart returns to inventory and keeps cart empty', async ({
  page,
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const initialCount = await cartPage.getItemsCount();

  await cartPage.continueShopping();
  await inventoryPage.waitForVisible();

  await expect(page, 'User should be redirected back to inventory page').toHaveURL(
    /.*inventory\.html/,
  );

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const finalCount = await cartPage.getItemsCount();

  expect(initialCount, 'Cart should be empty before continue shopping').toBe(0);
  expect(finalCount, 'Cart should remain empty after continue shopping and reopening').toBe(0);
});

test('cart keeps items after browser back navigation from cart', async ({
  page,
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  await page.goBack();
  await inventoryPage.waitForVisible();

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const itemsCount = await cartPage.getItemsCount();
  const hasBackpack = await cartPage.hasItemWithName('Sauce Labs Backpack');

  expect(
    itemsCount,
    'Cart should still contain items after using browser back and reopening cart',
  ).toBeGreaterThan(0);
  expect(
    hasBackpack,
    'Backpack should still be present after using browser back and reopening cart',
  ).toBe(true);
});

test('empty cart stays empty after browser back navigation', async ({
  page,
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const initialCount = await cartPage.getItemsCount();

  await page.goBack();
  await inventoryPage.waitForVisible();

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const finalCount = await cartPage.getItemsCount();

  expect(initialCount, 'Cart should be empty before using browser back').toBe(0);
  expect(finalCount, 'Cart should remain empty after using browser back and reopening').toBe(0);
});

test('cart contents persist after multiple page reloads', async ({
  page,
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  await page.reload();
  await cartPage.waitForVisible();
  await page.reload();
  await cartPage.waitForVisible();

  const itemsCount = await cartPage.getItemsCount();
  const hasBackpack = await cartPage.hasItemWithName('Sauce Labs Backpack');

  expect(itemsCount, 'Cart should still contain items after multiple reloads').toBeGreaterThan(0);
  expect(hasBackpack, 'Backpack should still be present after multiple reloads').toBe(true);
});

test('empty cart stays empty after multiple page reloads', async ({
  page,
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  await page.reload();
  await cartPage.waitForVisible();
  await page.reload();
  await cartPage.waitForVisible();

  const itemsCount = await cartPage.getItemsCount();

  expect(itemsCount, 'Empty cart should remain empty after multiple reloads').toBe(0);
});

test('cart keeps items after back and forward navigation', async ({
  page,
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  await page.goBack();
  await inventoryPage.waitForVisible();

  await page.goForward();
  await cartPage.waitForVisible();

  const itemsCount = await cartPage.getItemsCount();
  const hasBackpack = await cartPage.hasItemWithName('Sauce Labs Backpack');

  expect(
    itemsCount,
    'Cart should still contain items after navigating back and forward',
  ).toBeGreaterThan(0);
  expect(hasBackpack, 'Backpack should still be present after navigating back and forward').toBe(
    true,
  );
});

test('empty cart stays empty after back and forward navigation', async ({
  page,
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  await page.goBack();
  await inventoryPage.waitForVisible();

  await page.goForward();
  await cartPage.waitForVisible();

  const itemsCount = await cartPage.getItemsCount();

  expect(itemsCount, 'Empty cart should remain empty after navigating back and forward').toBe(0);
});

test('cart keeps items after multiple continue shopping actions', async ({
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const initialCount = await cartPage.getItemsCount();

  for (let i = 0; i < 2; i++) {
    await cartPage.continueShopping();
    await inventoryPage.waitForVisible();
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
  }

  const finalCount = await cartPage.getItemsCount();
  const hasBackpack = await cartPage.hasItemWithName('Sauce Labs Backpack');

  expect(initialCount, 'Cart should have at least one item initially').toBeGreaterThan(0);
  expect(
    finalCount,
    'Cart items count should remain the same if user just continues shopping and reopens cart',
  ).toBe(initialCount);
  expect(
    hasBackpack,
    'Backpack should still be present after multiple continue shopping actions',
  ).toBe(true);
});

test('empty cart stays empty after multiple continue shopping actions', async ({
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const initialCount = await cartPage.getItemsCount();

  for (let i = 0; i < 2; i++) {
    await cartPage.continueShopping();
    await inventoryPage.waitForVisible();
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
  }

  const finalCount = await cartPage.getItemsCount();

  expect(initialCount, 'Cart should be empty before continue shopping').toBe(0);
  expect(
    finalCount,
    'Cart should remain empty after multiple continue shopping actions and reopenings',
  ).toBe(0);
});

test('cart keeps item after continue shopping and browser back navigation', async ({
  page,
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  await cartPage.continueShopping();
  await inventoryPage.waitForVisible();

  await page.goBack();
  await cartPage.waitForVisible();

  const itemsCount = await cartPage.getItemsCount();
  const hasBackpack = await cartPage.hasItemWithName('Sauce Labs Backpack');

  expect(
    itemsCount,
    'Cart should still contain items after continue shopping and browser back',
  ).toBeGreaterThan(0);
  expect(
    hasBackpack,
    'Backpack should still be present after continue shopping and browser back',
  ).toBe(true);
});

test('cart item lookup is case sensitive for product name', async ({ inventoryPage, cartPage }) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const hasBackpackExact = await cartPage.hasItemWithName('Sauce Labs Backpack');
  const hasBackpackLowercase = await cartPage.hasItemWithName('sauce labs backpack');

  expect(hasBackpackExact, 'Exact case product name should be found in cart').toBe(true);
  expect(
    hasBackpackLowercase,
    'Lowercase product name should not be found if matching is case sensitive',
  ).toBe(false);
});

test('cart does not contain unknown product after multiple navigation steps', async ({
  page,
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  await cartPage.continueShopping();
  await inventoryPage.waitForVisible();

  await page.goBack();
  await cartPage.waitForVisible();

  await page.goForward();
  await inventoryPage.waitForVisible();
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const hasUnknownProduct = await cartPage.hasItemWithName('Totally unknown product');

  expect(
    hasUnknownProduct,
    'Unknown product should not appear in cart after multiple navigation steps',
  ).toBe(false);
});

test('cart remains consistent when reopened after reload and navigation', async ({
  page,
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const initialCount = await cartPage.getItemsCount();

  await page.reload();
  await cartPage.waitForVisible();

  await cartPage.continueShopping();
  await inventoryPage.waitForVisible();

  await page.goBack();
  await cartPage.waitForVisible();

  await cartPage.continueShopping();
  await inventoryPage.waitForVisible();

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const finalCount = await cartPage.getItemsCount();
  const hasBackpack = await cartPage.hasItemWithName('Sauce Labs Backpack');

  expect(initialCount, 'Cart should have at least one item after initial add').toBeGreaterThan(0);
  expect(
    finalCount,
    'Cart items count should remain stable after reload and navigation when no explicit cart changes are made',
  ).toBe(initialCount);
  expect(hasBackpack, 'Backpack should still be present after reload and navigation').toBe(true);
});
