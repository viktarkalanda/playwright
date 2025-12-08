// tests/ui/menu.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';
import type { InventoryPage } from '../../src/pages/InventoryPage';

const PRODUCT_NAME = 'Sauce Labs Backpack';

async function addBackpackToCart(inventoryPage: InventoryPage): Promise<void> {
  await inventoryPage.addItemToCartByName(PRODUCT_NAME);
}

test.describe('Main menu', () => {
  test.beforeEach(async ({ loggedInInventoryPage }) => {
    await loggedInInventoryPage.waitForVisible();
  });

  test('user can open and close main menu from inventory page', { tag: '@menu' }, async ({ mainMenu }) => {
    await mainMenu.open();

    const visibleAfterOpen = await mainMenu.isVisible();
    expect(visibleAfterOpen, 'Main menu should be visible after opening').toBe(true);

    await mainMenu.close();

    const visibleAfterClose = await mainMenu.isVisible();
    expect(visibleAfterClose, 'Main menu should not be visible after closing').toBe(false);
  });

  test('all items link keeps user on inventory when already on inventory', { tag: '@menu' }, async ({
    page,
    inventoryPage,
    mainMenu,
  }) => {
    await mainMenu.goToAllItems();
    await inventoryPage.waitForVisible();

    await expect(page, 'All items from inventory should keep user on inventory page').toHaveURL(
      /.*inventory\.html/,
    );
  });

  test('all items link navigates back to inventory from product details', { tag: '@menu' }, async ({
    page,
    inventoryPage,
    productDetailsPage,
    mainMenu,
  }) => {
    await inventoryPage.openItemDetailsByName(PRODUCT_NAME);
    await productDetailsPage.waitForVisible();

    await mainMenu.goToAllItems();
    await inventoryPage.waitForVisible();

    await expect(
      page,
      'All items from product details should navigate back to inventory page',
    ).toHaveURL(/.*inventory\.html/);
  });

  test('reset app state clears cart and cart badge from inventory page', { tag: '@menu' }, async ({
    inventoryPage,
    cartPage,
    mainMenu,
  }) => {
    await addBackpackToCart(inventoryPage);
    let badgeBeforeReset = await inventoryPage.getCartBadgeCount();

    expect(
      badgeBeforeReset,
      'Cart badge should be greater than zero before reset app state',
    ).toBeGreaterThan(0);

    await mainMenu.resetAppState();

    const badgeAfterReset = await inventoryPage.getCartBadgeCount();
    expect(badgeAfterReset, 'Cart badge should be zero after reset app state').toBe(0);

    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const itemsCount = await cartPage.getItemsCount();
    expect(itemsCount, 'Cart should be empty after reset app state').toBe(0);
  });

  test('reset app state clears cart even when triggered from cart page', { tag: '@menu' }, async ({
    inventoryPage,
    cartPage,
    mainMenu,
  }) => {
    await addBackpackToCart(inventoryPage);
    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const itemsBeforeReset = await cartPage.getItemsCount();
    expect(
      itemsBeforeReset,
      'Cart should contain at least one item before reset app state from cart page',
    ).toBeGreaterThan(0);

    await mainMenu.resetAppState();

    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const itemsAfterReset = await cartPage.getItemsCount();
    expect(itemsAfterReset, 'Cart should be empty after reset app state from cart page').toBe(0);
  });

  test('reset app state clears cart when triggered from product details page', { tag: '@menu' }, async ({
    inventoryPage,
    cartPage,
    productDetailsPage,
    mainMenu,
  }) => {
    await addBackpackToCart(inventoryPage);

    await inventoryPage.openItemDetailsByName(PRODUCT_NAME);
    await productDetailsPage.waitForVisible();

    await mainMenu.resetAppState();

    const badgeAfterReset = await inventoryPage.getCartBadgeCount();
    expect(
      badgeAfterReset,
      'Cart badge should be zero after reset app state from product details page',
    ).toBe(0);

    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const itemsCount = await cartPage.getItemsCount();
    expect(itemsCount, 'Cart should be empty after reset app state from product details page').toBe(
      0,
    );
  });

  test('logout from inventory redirects to login page', { tag: ['@menu', '@smoke'] }, async ({ page, mainMenu }) => {
    await mainMenu.logout();

    await expect(page, 'Logout from inventory should redirect user to login page').not.toHaveURL(
      /.*inventory\.html/,
    );

    const currentUrl = page.url();
    expect(currentUrl, 'After logout user should be on login related URL').toMatch(
      /.*(index\.html|\/)$/,
    );
  });

  test('after logout user cannot access inventory page directly', { tag: '@menu' }, async ({ page, mainMenu }) => {
    await mainMenu.logout();

    await page.goto('/inventory.html');

    await expect(
      page,
      'After logout user should not be able to access inventory directly',
    ).not.toHaveURL(/.*inventory\.html/);
  });

  test('logout from cart redirects to login and clears cart', { tag: '@menu' }, async ({
    page,
    inventoryPage,
    cartPage,
    mainMenu,
  }) => {
    await addBackpackToCart(inventoryPage);

    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    await mainMenu.logout();

    await expect(page, 'Logout from cart should redirect user to login page').not.toHaveURL(
      /.*cart\.html/,
    );

    await page.goto('/inventory.html');

    await expect(
      page,
      'After logout and navigation to inventory user should not stay on inventory page',
    ).not.toHaveURL(/.*inventory\.html/);
  });

  test('about link navigates to Sauce Labs site', { tag: '@menu' }, async ({ page, mainMenu }) => {
    await mainMenu.goToAbout();

    const currentUrl = page.url();

    expect(currentUrl, 'About link should navigate to Sauce Labs domain').toContain('saucelabs');
  });

  test('menu stays closed after logout and cannot be opened on login page', { tag: '@menu' }, async ({
    page,
    mainMenu,
  }) => {
    await mainMenu.logout();

    const menuButtonVisibleOnLogin = await mainMenu.menuButton.isVisible().catch(() => false);

    await expect(page, 'After logout user should be on login related page').not.toHaveURL(
      /.*inventory\.html/,
    );

    expect(
      menuButtonVisibleOnLogin,
      'Menu button should not be visible or usable on login page',
    ).toBe(false);
  });

  test('menu can be opened from product details and closed without navigation', { tag: '@menu' }, async ({
    inventoryPage,
    productDetailsPage,
    mainMenu,
  }) => {
    await inventoryPage.openItemDetailsByName(PRODUCT_NAME);
    await productDetailsPage.waitForVisible();

    await mainMenu.open();
    const visibleAfterOpen = await mainMenu.isVisible();
    expect(
      visibleAfterOpen,
      'Main menu should be visible after opening it from product details page',
    ).toBe(true);

    await mainMenu.close();
    const visibleAfterClose = await mainMenu.isVisible();
    expect(
      visibleAfterClose,
      'Main menu should not be visible after closing it from product details page',
    ).toBe(false);
  });

  test('reset app state restores "Add to cart" button labels on inventory page', { tag: '@menu' }, async ({
    inventoryPage,
    mainMenu,
  }) => {
    await addBackpackToCart(inventoryPage);

    const backpackCard = inventoryPage.inventoryItems.filter({ hasText: PRODUCT_NAME });
    const button = backpackCard.getByRole('button');

    await expect(
      button,
      'Button text should change to "Remove" after product was added',
    ).toHaveText('Remove');

    await mainMenu.resetAppState();

    await expect(
      button,
      'After reset app state button should revert to "Add to cart"',
    ).toHaveText(/Add to cart/);
  });

  test('all items link from checkout returns user to inventory while keeping cart items', { tag: '@menu' }, async ({
    page,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    mainMenu,
  }) => {
    await addBackpackToCart(inventoryPage);
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    await cartPage.startCheckout();

    await checkoutStepOnePage.waitForVisible();

    await mainMenu.goToAllItems();
    await inventoryPage.waitForVisible();

    await expect(
      page,
      'Selecting All Items from checkout should navigate back to inventory page',
    ).toHaveURL(/.*inventory\.html/);

    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const itemsCount = await cartPage.getItemsCount();
    expect(
      itemsCount,
      'Cart should still contain the previously added product after navigating via menu',
    ).toBe(1);
  });
});
