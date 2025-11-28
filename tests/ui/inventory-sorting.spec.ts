// tests/ui/inventory-sorting.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';

const EXPECTED_PRODUCTS = [
  'Sauce Labs Backpack',
  'Sauce Labs Bike Light',
  'Sauce Labs Bolt T-Shirt',
  'Sauce Labs Fleece Jacket',
  'Sauce Labs Onesie',
  'Test.allTheThings() T-Shirt (Red)',
];

async function getProductNames(inventoryPage: any): Promise<string[]> {
  const names = await inventoryPage.getItemNames();
  return names.map((n: string) => n.trim());
}

async function getProductPrices(inventoryPage: any): Promise<number[]> {
  const prices = await inventoryPage.getItemPrices();
  return prices.map((p: number) => Number(p));
}

test.describe('Inventory sorting scenarios', () => {
  test.beforeEach(async ({ loggedInInventoryPage }) => {
    await loggedInInventoryPage.waitForVisible();
  });

  test('sorting A to Z arranges products alphabetically', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('az');

    const names = await getProductNames(inventoryPage);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));

    expect(names, 'Products should be sorted alphabetically A to Z').toEqual(sorted);
  });

  test('sorting Z to A arranges products in reverse alphabetical order', async ({
    inventoryPage,
  }) => {
    await inventoryPage.sortBy('za');

    const names = await getProductNames(inventoryPage);
    const sorted = [...names].sort((a, b) => b.localeCompare(a));

    expect(names, 'Products should be sorted alphabetically Z to A').toEqual(sorted);
  });

  test('sorting low to high arranges products by price ascending', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('lohi');

    const prices = await getProductPrices(inventoryPage);
    const sorted = [...prices].sort((a, b) => a - b);

    expect(prices, 'Products should be sorted price low to high').toEqual(sorted);
  });

  test('sorting high to low arranges products by price descending', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('hilo');

    const prices = await getProductPrices(inventoryPage);
    const sorted = [...prices].sort((a, b) => b - a);

    expect(prices, 'Products should be sorted price high to low').toEqual(sorted);
  });

  test('sorting persists after page reload', async ({ page, inventoryPage }) => {
    await inventoryPage.sortBy('za');

    const namesBefore = await getProductNames(inventoryPage);

    await page.reload();
    await inventoryPage.waitForVisible();

    const namesAfter = await getProductNames(inventoryPage);

    expect(namesAfter, 'Sorting order should be preserved after reload').toEqual(namesBefore);
  });

  test('sorting persists when navigating to product details and back', async ({
    inventoryPage,
    productDetailsPage,
  }) => {
    await inventoryPage.sortBy('lohi');
    const namesBefore = await getProductNames(inventoryPage);

    await inventoryPage.openItemDetailsByName(EXPECTED_PRODUCTS[0]);
    await productDetailsPage.waitForVisible();

    await productDetailsPage.backToProducts();
    await inventoryPage.waitForVisible();

    const namesAfter = await getProductNames(inventoryPage);

    expect(namesAfter, 'Sorting order should remain the same after navigating to details and back').toEqual(
      namesBefore,
    );
  });

  test('sorting does not change product count', async ({ inventoryPage }) => {
    const initialCount = await inventoryPage.getItemsCount();

    const sortOptions = ['az', 'za', 'lohi', 'hilo'] as const;

    for (const option of sortOptions) {
      await inventoryPage.sortBy(option);
      const countAfterSort = await inventoryPage.getItemsCount();

      expect(
        countAfterSort,
        `Sorting by ${option} should not change the number of displayed products`,
      ).toBe(initialCount);
    }
  });

  test('sorting works correctly after adding items to cart', async ({
    inventoryPage,
    cartPage,
  }) => {
    await inventoryPage.sortBy('az');
    await inventoryPage.addItemToCartByName('Sauce Labs Backpack');

    const namesAfterAdd = await getProductNames(inventoryPage);
    const sorted = [...namesAfterAdd].sort((a, b) => a.localeCompare(b));

    expect(namesAfterAdd, 'Sorting A to Z should persist after adding an item').toEqual(sorted);

    await inventoryPage.openCart();
    await cartPage.waitForVisible();
  });

  test('sorting works correctly after Reset App State', async ({
    inventoryPage,
    mainMenu,
  }) => {
    await inventoryPage.sortBy('za');

    const namesBeforeReset = await getProductNames(inventoryPage);

    await mainMenu.resetAppState();
    await inventoryPage.waitForVisible();

    const namesAfterReset = await getProductNames(inventoryPage);

    expect(
      namesAfterReset,
      'Reset App State should not break sorting order on inventory page',
    ).toEqual(namesBeforeReset);
  });

  test('sorting remains correct after logout and new login session', async ({
    page,
    loginPage,
    inventoryPage,
    mainMenu,
  }) => {
    await inventoryPage.sortBy('hilo');
    const beforeLogout = await getProductNames(inventoryPage);

    await mainMenu.logout();
    await expect(page).not.toHaveURL(/.*inventory\.html/);

    const { username, password } = { username: 'standard_user', password: 'secret_sauce' };
    await loginPage.login(username, password);
    await inventoryPage.waitForVisible();

    const afterLogin = await getProductNames(inventoryPage);

    expect(
      afterLogin,
      'Sorting order should persist across logout/login on Swag Labs',
    ).toEqual(beforeLogout);
  });

  test('sorting remains stable after browser back/forward navigation', async ({
    page,
    inventoryPage,
  }) => {
    await inventoryPage.sortBy('az');
    const afterSort = await getProductNames(inventoryPage);

    await page.goBack();
    await page.goForward();
    await inventoryPage.waitForVisible();

    const afterNav = await getProductNames(inventoryPage);

    expect(afterNav, 'Sorting should remain the same after back/forward').toEqual(afterSort);
  });

  test('sorting updates immediately when a new option is selected', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('az');
    const azOrder = await getProductNames(inventoryPage);

    await inventoryPage.sortBy('za');
    const zaOrder = await getProductNames(inventoryPage);

    expect(
      azOrder,
      'A to Z order should differ from Z to A order',
    ).not.toEqual(zaOrder);
  });
});
