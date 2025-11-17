import { test, expect } from '../../src/fixtures/test-fixtures';
import { CartPage } from '../../src/pages/CartPage';

test.beforeEach(async ({ loggedInInventoryPage }) => {
  await loggedInInventoryPage.waitForVisible();
});

test('user can add first product to cart', async ({ inventoryPage, page }) => {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();

  const cartPage = new CartPage(page);
  await cartPage.waitForVisible();

  const itemsCount = await cartPage.getItemsCount();
  expect(itemsCount, 'Cart should contain at least one item')
    .toBeGreaterThan(0);
});
