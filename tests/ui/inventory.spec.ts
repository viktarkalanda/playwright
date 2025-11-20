import { test, expect } from '../../src/fixtures/test-fixtures';

test.beforeEach(async ({ loggedInInventoryPage }) => {
  await loggedInInventoryPage.waitForVisible();
});

test('user sees products list after login', async ({ inventoryPage }) => {
  const itemsCount = await inventoryPage.getItemsCount();
  expect(itemsCount, 'Products list should not be empty').toBeGreaterThan(0);

  const title = await inventoryPage.getTitleText();
  expect(title, 'Inventory page title should contain "Products"').toContain('Products');
});
