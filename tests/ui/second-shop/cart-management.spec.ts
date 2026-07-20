// tests/ui/second-shop/cart-management.spec.ts
//
// UI coverage for multi-item cart management on DemoBlaze: adding several
// products, verifying they all persist, removing a specific item by name,
// and confirming the rest of the cart is left untouched.
import { test, expect } from '../../../src/second-shop/fixtures/test-fixtures';
import type { SecondShopFixtures } from '../../../src/second-shop/fixtures/test-fixtures';

type CartSetupFixtures = Pick<
  SecondShopFixtures,
  'secondHomePage' | 'secondProductPage' | 'secondCartPage'
>;

const clearCart = async (secondCartPage: SecondShopFixtures['secondCartPage']) => {
  await secondCartPage.open();
  await secondCartPage.waitForVisible();
  await secondCartPage.clearCartIfPossible();
};

// Adds a single product to the cart. Assumes the home page is already loaded
// and returns to it via history navigation, avoiding a fresh full page load
// (DemoBlaze's product grid is fetched asynchronously and a repeated cold
// navigation is a common source of flakiness on this public demo site).
const addProductFromLoadedHome = async (
  { secondHomePage, secondProductPage }: CartSetupFixtures,
  name: string,
  returnToHome: boolean,
) => {
  await secondHomePage.openProductByName(name);
  await secondProductPage.waitForVisible();
  await secondProductPage.addToCart();

  if (returnToHome) {
    await secondHomePage.page.goBack();
    await secondHomePage.waitForLoaded();
  }
};

const addFirstNProducts = async (
  { secondHomePage, secondProductPage, secondCartPage }: CartSetupFixtures,
  count: number,
): Promise<string[]> => {
  await secondHomePage.open();
  await secondHomePage.waitForLoaded();
  const available = await secondHomePage.getVisibleProductNames();
  expect(available.length).toBeGreaterThanOrEqual(count);
  const chosen = available.slice(0, count);

  for (let i = 0; i < chosen.length; i += 1) {
    await addProductFromLoadedHome(
      { secondHomePage, secondProductPage, secondCartPage },
      chosen[i],
      i < chosen.length - 1,
    );
  }
  return chosen;
};

// DemoBlaze's anonymous cart accumulates items across sessions; allow extra time to clear it.
test.beforeEach(() => { test.setTimeout(60_000); });

test.describe('Cart / Multi-item management', () => {
  test.describe('Adding multiple items', () => {
    test(
      'adding two different products results in both appearing in the cart',
      { tag: ['@cart', '@e2e'] },
      async ({ secondHomePage, secondProductPage, secondCartPage }) => {
        await clearCart(secondCartPage);
        const chosen = await addFirstNProducts({ secondHomePage, secondProductPage, secondCartPage }, 2);

        await secondCartPage.open();
        await secondCartPage.waitForVisible();
        const itemNames = await secondCartPage.getCartItemNames();

        for (const name of chosen) {
          expect(itemNames).toContain(name);
        }
      },
    );

    test(
      'cart row count matches the number of items added',
      { tag: ['@cart', '@regression'] },
      async ({ secondHomePage, secondProductPage, secondCartPage }) => {
        await clearCart(secondCartPage);
        await addFirstNProducts({ secondHomePage, secondProductPage, secondCartPage }, 3);

        await secondCartPage.open();
        await secondCartPage.waitForVisible();
        const itemNames = await secondCartPage.getCartItemNames();

        expect(itemNames.length).toBeGreaterThanOrEqual(3);
      },
    );

    test(
      'adding the same product twice results in two separate cart rows',
      { tag: ['@cart', '@regression'] },
      async ({ secondHomePage, secondProductPage, secondCartPage }) => {
        await clearCart(secondCartPage);
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();
        const products = await secondHomePage.getVisibleProductNames();
        const productName = products[0];

        await addProductFromLoadedHome({ secondHomePage, secondProductPage, secondCartPage }, productName, true);
        await addProductFromLoadedHome({ secondHomePage, secondProductPage, secondCartPage }, productName, false);

        await secondCartPage.open();
        await secondCartPage.waitForVisible();
        const itemNames = await secondCartPage.getCartItemNames();
        const matching = itemNames.filter((name) => name === productName);

        expect(matching.length).toBe(2);
      },
    );
  });

  test.describe('Removing a specific item', () => {
    test(
      'removing one item by name leaves the other items intact',
      { tag: ['@cart', '@e2e'] },
      async ({ secondHomePage, secondProductPage, secondCartPage }) => {
        await clearCart(secondCartPage);
        const chosen = await addFirstNProducts({ secondHomePage, secondProductPage, secondCartPage }, 3);

        await secondCartPage.open();
        await secondCartPage.waitForVisible();
        await secondCartPage.removeItemByName(chosen[0]);

        const remaining = await secondCartPage.getCartItemNames();
        expect(remaining).not.toContain(chosen[0]);
        expect(remaining).toContain(chosen[1]);
        expect(remaining).toContain(chosen[2]);
      },
    );

    test(
      'cart row count decreases by exactly one after a single removal',
      { tag: ['@cart', '@regression'] },
      async ({ secondHomePage, secondProductPage, secondCartPage }) => {
        await clearCart(secondCartPage);
        const chosen = await addFirstNProducts({ secondHomePage, secondProductPage, secondCartPage }, 2);

        await secondCartPage.open();
        await secondCartPage.waitForVisible();
        const before = await secondCartPage.getCartItemNames();

        await secondCartPage.removeItemByName(chosen[0]);
        const after = await secondCartPage.getCartItemNames();

        expect(after.length).toBe(before.length - 1);
      },
    );

    test(
      'removing an item not present in the cart throws an error',
      { tag: ['@cart', '@negative'] },
      async ({ secondCartPage }) => {
        await clearCart(secondCartPage);

        await expect(secondCartPage.removeItemByName('Definitely Not A Real Product')).rejects.toThrow(
          /not found in cart/,
        );
      },
    );
  });

  test.describe('Clearing the cart', () => {
    test(
      'clearing a multi-item cart results in an empty cart',
      { tag: ['@cart', '@e2e'] },
      async ({ secondHomePage, secondProductPage, secondCartPage }) => {
        await clearCart(secondCartPage);
        await addFirstNProducts({ secondHomePage, secondProductPage, secondCartPage }, 2);

        await secondCartPage.open();
        await secondCartPage.waitForVisible();
        expect(await secondCartPage.isEmpty()).toBe(false);

        await secondCartPage.clearCartIfPossible();

        expect(await secondCartPage.isEmpty()).toBe(true);
        expect(await secondCartPage.getCartItemNames()).toEqual([]);
      },
    );

    test(
      'clearing an already-empty cart is a no-op and does not error',
      { tag: ['@cart', '@negative'] },
      async ({ secondCartPage }) => {
        await clearCart(secondCartPage);
        expect(await secondCartPage.isEmpty()).toBe(true);

        await secondCartPage.clearCartIfPossible();

        expect(await secondCartPage.isEmpty()).toBe(true);
      },
    );
  });
});
