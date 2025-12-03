// tests/ui/cart.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';
import type { CartPage } from '../../src/pages/CartPage';

const BACKPACK_NAME = 'Sauce Labs Backpack';
const BIKE_LIGHT_NAME = 'Sauce Labs Bike Light';
const BOLT_TSHIRT_NAME = 'Sauce Labs Bolt T-Shirt';
const FLEECE_JACKET_NAME = 'Sauce Labs Fleece Jacket';
const ONESIE_NAME = 'Sauce Labs Onesie';

async function getCartItemNames(cartPage: CartPage): Promise<string[]> {
  const names = await cartPage.cartItemNames.allTextContents();
  return names.map((name) => name.trim());
}

async function getCartItemPriceByName(cartPage: CartPage, name: string): Promise<number> {
  const item = cartPage.cartItems.filter({ hasText: name });
  const priceLocator = item.locator('.inventory_item_price').first();
  const text = await priceLocator.textContent();
  const numeric = Number.parseFloat((text ?? '').replace('$', '').trim());
  return Number.isNaN(numeric) ? 0 : numeric;
}

async function removeCartItemByName(cartPage: CartPage, name: string): Promise<void> {
  const item = cartPage.cartItems.filter({ hasText: name }).first();
  await item.getByRole('button', { name: 'Remove' }).click();
}

async function getCartItemsPriceSum(cartPage: CartPage): Promise<number> {
  const texts = await cartPage.cartItems.locator('.inventory_item_price').allTextContents();
  return texts.reduce((sum, raw) => {
    const cleaned = raw.replace('$', '').trim();
    const value = Number.parseFloat(cleaned);
    return Number.isNaN(value) ? sum : sum + value;
  }, 0);
}

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

test('cart lists multiple added products in order with correct prices', async ({
  inventoryPage,
  cartPage,
}) => {
  const itemsToAdd = [BACKPACK_NAME, BIKE_LIGHT_NAME, BOLT_TSHIRT_NAME];
  const expectedPriceByName = new Map<string, number>();

  for (const name of itemsToAdd) {
    await inventoryPage.addItemToCartByName(name);
    const price = await inventoryPage.getItemPriceByName(name);
    expectedPriceByName.set(name, price);
  }

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const namesInCart = await getCartItemNames(cartPage);

  expect(namesInCart, 'Cart should list products in order of addition').toEqual(itemsToAdd);

  for (const name of itemsToAdd) {
    const expectedPrice = expectedPriceByName.get(name) ?? 0;
    const cartPrice = await getCartItemPriceByName(cartPage, name);

    expect(cartPrice, `Cart price for ${name} should match inventory price`).toBeCloseTo(
      expectedPrice,
      2,
    );
  }
});

test('removing one product from cart keeps remaining products intact', async ({
  inventoryPage,
  cartPage,
}) => {
  const itemsToAdd = [BACKPACK_NAME, BIKE_LIGHT_NAME, BOLT_TSHIRT_NAME];

  for (const name of itemsToAdd) {
    await inventoryPage.addItemToCartByName(name);
  }

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  await removeCartItemByName(cartPage, BIKE_LIGHT_NAME);

  const namesAfterRemoval = await getCartItemNames(cartPage);
  expect(
    namesAfterRemoval,
    'Removing one product should leave the others untouched and in order',
  ).toEqual([BACKPACK_NAME, BOLT_TSHIRT_NAME]);

  const countAfterRemoval = await cartPage.getItemsCount();
  expect(countAfterRemoval, 'Removing one product should decrement cart count by one').toBe(2);
});

test('continue shopping keeps all cart items untouched', async ({ inventoryPage, cartPage }) => {
  const itemsToAdd = [BACKPACK_NAME, FLEECE_JACKET_NAME];

  for (const name of itemsToAdd) {
    await inventoryPage.addItemToCartByName(name);
  }

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const namesBeforeContinue = await getCartItemNames(cartPage);

  await cartPage.continueShopping();
  await inventoryPage.waitForVisible();

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const namesAfterContinue = await getCartItemNames(cartPage);

  expect(
    namesAfterContinue,
    'Continue shopping should not remove or reorder existing cart items',
  ).toEqual(namesBeforeContinue);
});

test('re-adding removed product appends it at the end of the cart list', async ({
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.addItemToCartByName(BACKPACK_NAME);
  await inventoryPage.addItemToCartByName(BIKE_LIGHT_NAME);

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  await removeCartItemByName(cartPage, BACKPACK_NAME);

  await cartPage.continueShopping();
  await inventoryPage.waitForVisible();

  await inventoryPage.addItemToCartByName(BACKPACK_NAME);
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const namesAfterReadd = await getCartItemNames(cartPage);

  expect(
    namesAfterReadd,
    'Re-added product should appear after existing products and without duplicates',
  ).toEqual([BIKE_LIGHT_NAME, BACKPACK_NAME]);
});

test('sum of cart item prices matches expected total from inventory', async ({
  inventoryPage,
  cartPage,
}) => {
  const itemsToAdd = [BACKPACK_NAME, BOLT_TSHIRT_NAME, ONESIE_NAME];

  for (const name of itemsToAdd) {
    await inventoryPage.addItemToCartByName(name);
  }

  const expectedPrices = await Promise.all(
    itemsToAdd.map((name) => inventoryPage.getItemPriceByName(name)),
  );
  const expectedSum = expectedPrices.reduce((sum, price) => sum + price, 0);

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const cartSum = await getCartItemsPriceSum(cartPage);

  expect(
    cartSum,
    'Cart should display a price per product that sums up to the expected total',
  ).toBeCloseTo(expectedSum, 2);
});

test('cart total updates after removing an item', async ({ inventoryPage, cartPage }) => {
  const itemsToAdd = [BACKPACK_NAME, BOLT_TSHIRT_NAME];

  for (const name of itemsToAdd) {
    await inventoryPage.addItemToCartByName(name);
  }

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const initialSum = await getCartItemsPriceSum(cartPage);
  const removedItemPrice = await getCartItemPriceByName(cartPage, BOLT_TSHIRT_NAME);

  await removeCartItemByName(cartPage, BOLT_TSHIRT_NAME);

  const finalSum = await getCartItemsPriceSum(cartPage);

  expect(
    finalSum,
    'Removing an item should reduce the cart price sum exactly by the removed price',
  ).toBeCloseTo(initialSum - removedItemPrice, 2);
});

test('re-adding the same product after removal keeps only one entry', async ({
  inventoryPage,
  cartPage,
}) => {
  await inventoryPage.addItemToCartByName(ONESIE_NAME);

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  await removeCartItemByName(cartPage, ONESIE_NAME);

  await cartPage.continueShopping();
  await inventoryPage.waitForVisible();

  await inventoryPage.addItemToCartByName(ONESIE_NAME);
  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const finalCount = await cartPage.getItemsCount();
  const names = await getCartItemNames(cartPage);

  expect(finalCount, 'Re-adding the same product should keep a single cart entry').toBe(1);
  expect(names, 'Cart should contain the re-added product only once').toEqual([ONESIE_NAME]);
});

test('checkout cannot be started when cart is empty (skipped on Sauce Demo)', async ({
  inventoryPage,
  cartPage,
}) => {
  const baseUrl = process.env.BASE_URL ?? 'https://www.saucedemo.com/';
  test.skip(
    baseUrl.includes('saucedemo.com'),
    'Sauce Demo allows checkout with empty cart, skip expectation for this environment',
  );

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  await expect(
    cartPage.checkoutButton,
    'Checkout button should be disabled when cart has no items',
  ).toBeDisabled();
});
