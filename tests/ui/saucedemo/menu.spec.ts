// tests/ui/menu.spec.ts
import { test, expect } from '../../../src/fixtures/test-fixtures';
import type { InventoryPage } from '../../../src/pages/saucedemo/InventoryPage';

const CART_ITEMS = ['Sauce Labs Backpack', 'Sauce Labs Bike Light'];

async function addItemsToCart(inventoryPage: InventoryPage, items: string[]): Promise<void> {
  for (const name of items) {
    await inventoryPage.addItemToCartByName(name);
  }
}

test.describe('Header menu', () => {
  test.beforeEach(async ({ loggedInInventoryPage }) => {
    await loggedInInventoryPage.waitForVisible();
  });

  test('burger menu toggle opens and closes panel', { tag: '@menu' }, async ({ headerMenu }) => {
    await headerMenu.openMenu();
    expect(await headerMenu.isMenuOpen(), 'Menu should be open after clicking the toggle').toBe(
      true,
    );

    await headerMenu.closeMenu();
    expect(await headerMenu.isMenuOpen(), 'Menu should be closed after clicking the close icon').toBe(
      false,
    );
  });

  test('logout from menu redirects user to login page and protects inventory', { tag: ['@menu', '@smoke'] }, async ({
    page,
    loginPage,
    headerMenu,
  }) => {
    await headerMenu.clickLogout();
    await loginPage.waitForVisible();

    await expect(
      page,
      'After logout user should land on the login page instead of inventory',
    ).toHaveURL(/(index\.html|\/)$/);

    await page.goto('/inventory.html');
    await expect(
      page,
      'Direct navigation to inventory should be blocked until user logs in again',
    ).not.toHaveURL(/inventory\.html/);
  });

  test('reset app state clears cart items and badge', { tag: ['@menu', '@cart'] }, async ({
    inventoryPage,
    cartPage,
    headerMenu,
  }) => {
    await addItemsToCart(inventoryPage, CART_ITEMS);

    const badgeBeforeReset = await headerMenu.getCartBadgeCount();
    expect(badgeBeforeReset, 'Cart badge should reflect the number of added items before reset').toBe(
      CART_ITEMS.length,
    );

    await headerMenu.clickResetAppState();

    const badgeAfterReset = await headerMenu.getCartBadgeCount();
    expect(badgeAfterReset, 'Cart badge should be cleared after resetting app state').toBe(0);

    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    expect(await cartPage.isEmpty(), 'Cart should be empty after resetting app state').toBe(true);
  });

  test('all items menu option navigates back to inventory from cart', { tag: '@menu' }, async ({
    page,
    inventoryPage,
    cartPage,
    headerMenu,
  }) => {
    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    await headerMenu.clickAllItems();
    await inventoryPage.waitForVisible();

    await expect(
      page,
      'Selecting All Items in the menu should navigate back to inventory page',
    ).toHaveURL(/inventory\.html/);
  });

  test('about link opens external site', { tag: '@menu' }, async ({ page, headerMenu }) => {
    await headerMenu.openMenu();
    const [aboutPage] = await Promise.all([
      page.context().waitForEvent('page'),
      headerMenu.clickAbout(),
    ]);
    await aboutPage.waitForLoadState('domcontentloaded');
    await expect(
      aboutPage,
      'About link should open Sauce Labs website in a new tab',
    ).toHaveURL(/saucelabs\.com/);
    await aboutPage.close();
    await page.bringToFront();
  });
});
