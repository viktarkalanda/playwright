// tests/ui/header-menu.spec.ts
import { test, expect } from '../../../src/fixtures/test-fixtures';
import { productCatalog } from '../../../src/data/products';
import { routesConfig } from '../../../src/data/routes';
import { openInventoryDirect, openCartDirect } from '../../../src/utils/directNavigation';

const firstProductName = productCatalog.products[0]?.name ?? 'Sauce Labs Backpack';
const secondProductName = productCatalog.products[1]?.name ?? firstProductName;
const checkoutUser = {
  firstName: 'Header',
  lastName: 'Tester',
  postalCode: '30301',
};

const escapeForRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const toRouteRegex = (path: string): RegExp => new RegExp(`${escapeForRegExp(path)}$`);

const inventoryPathMatcher = toRouteRegex(routesConfig.routes.inventory.path);
const checkoutStepOneMatcher = toRouteRegex(routesConfig.routes.checkoutStepOne.path);
const loginPathMatcher = toRouteRegex(routesConfig.routes.login.path);

test.describe('Header burger menu: All Items / About / Logout / Reset', () => {
  test('menu is visible and can be opened on inventory page', { tag: ['@menu', '@inventory'] }, async ({
    loggedInInventoryPage: inventoryPage,
    headerMenu,
  }) => {
    await inventoryPage.waitForVisible();
    await expect(headerMenu.menuButton, 'Menu toggle should be visible on inventory page').toBeVisible();

    await headerMenu.openMenu();
    expect(await headerMenu.isMenuOpen(), 'Menu should be open after clicking burger button').toBe(true);

    await headerMenu.closeMenu();
    expect(await headerMenu.isMenuOpen(), 'Menu should be closed after clicking close icon').toBe(false);
  });

  test(
    'menu is available on cart and checkout pages',
    { tag: ['@menu', '@cart', '@checkout'] },
    async ({
      loggedInInventoryPage: inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      headerMenu,
      page,
    }) => {
      await inventoryPage.openCart();
      await cartPage.waitForVisible();

      const assertMenuAccessibility = async (context: string): Promise<void> => {
        await expect(
          headerMenu.menuButton,
          `Menu button should be visible on ${context}`,
        ).toBeVisible();
        await headerMenu.openMenu();
        expect(await headerMenu.isMenuOpen(), `Menu should open on ${context}`).toBe(true);
        await headerMenu.closeMenu();
        expect(await headerMenu.isMenuOpen(), `Menu should close on ${context}`).toBe(false);
      };

      await assertMenuAccessibility('cart page');

      await cartPage.proceedToCheckout();
      await checkoutStepOnePage.waitForVisible();
      await expect(page, 'Checkout step one URL should be correct').toHaveURL(checkoutStepOneMatcher);
      await assertMenuAccessibility('checkout step one');

      await checkoutStepOnePage.fillForm(
        checkoutUser.firstName,
        checkoutUser.lastName,
        checkoutUser.postalCode,
      );
      await checkoutStepOnePage.continueToStepTwo();
      await checkoutStepTwoPage.waitForVisible();
      await assertMenuAccessibility('checkout step two');
    },
  );

  test(
    'All Items sends user back to inventory from cart',
    { tag: ['@menu', '@inventory', '@cart'] },
    async ({ loggedInInventoryPage: inventoryPage, cartPage, headerMenu, page }) => {
      await inventoryPage.addProductToCartByName(firstProductName);
      await inventoryPage.openCart();
      await cartPage.waitForVisible();

      await headerMenu.openMenu();
      await headerMenu.clickAllItems();

      await inventoryPage.waitForVisible();
      expect(await headerMenu.getCartBadgeCount(), 'Cart badge should retain added items').toBeGreaterThan(0);
      expect(page.url(), 'Inventory URL should be restored after All Items').toContain(
        routesConfig.routes.inventory.path,
      );
    },
  );

  test(
    'All Items sends user back to inventory from checkout step one',
    { tag: ['@menu', '@inventory', '@checkout'] },
    async ({
      loggedInInventoryPage: inventoryPage,
      cartPage,
      checkoutStepOnePage,
      headerMenu,
    }) => {
      await inventoryPage.addProductToCartByName(firstProductName);
      await inventoryPage.openCart();
      await cartPage.waitForVisible();
      await cartPage.proceedToCheckout();
      await checkoutStepOnePage.waitForVisible();

      await headerMenu.openMenu();
      await headerMenu.clickAllItems();

      await inventoryPage.waitForVisible();
      expect(await headerMenu.getCartBadgeCount(), 'Cart badge should persist after returning').toBeGreaterThan(0);
    },
  );

  test(
    'Reset App State clears cart but does not log out',
    { tag: ['@menu', '@cart', '@state'] },
    async ({ loggedInInventoryPage: inventoryPage, cartPage, headerMenu, page }) => {
      await inventoryPage.addProductToCartByName(firstProductName);
      await inventoryPage.addProductToCartByName(secondProductName);

      expect(await headerMenu.getCartBadgeCount(), 'Cart badge should reflect added items before reset').toBeGreaterThan(
        0,
      );

      await headerMenu.clickResetAppState();
      await inventoryPage.waitForVisible();

      expect(await headerMenu.getCartBadgeCount(), 'Cart badge should be cleared after reset').toBe(0);
      await expect(page, 'User should stay on inventory page after reset').toHaveURL(inventoryPathMatcher);

      await inventoryPage.openCart();
      await cartPage.waitForVisible();
      expect(await cartPage.getItemsCount(), 'Cart page should be empty after reset').toBe(0);
    },
  );

  test(
    'Logout logs user out and redirects to login page',
    { tag: ['@menu', '@auth'] },
    async ({ loggedInInventoryPage: inventoryPage, headerMenu, loginPage, page }) => {
      await inventoryPage.addProductToCartByName(firstProductName);
      await headerMenu.clickLogout();

      await loginPage.waitForVisible();
      await expect(page, 'Logout should redirect to login').toHaveURL(loginPathMatcher);

      await openInventoryDirect(page);
      await loginPage.waitForVisible();
      await expect(page, 'Direct inventory navigation should still show login').toHaveURL(loginPathMatcher);

      await openCartDirect(page);
      await loginPage.waitForVisible();
      await expect(page, 'Direct cart navigation should still show login').toHaveURL(loginPathMatcher);
    },
  );

  test(
    'Logout clears cart state for next login',
    { tag: ['@menu', '@auth', '@cart', '@state'] },
    async ({ loggedInInventoryPage: inventoryPage, headerMenu, loginPage, cartPage }) => {
      await inventoryPage.addProductToCartByName(firstProductName);
      await inventoryPage.addProductToCartByName(secondProductName);
      expect(await headerMenu.getCartBadgeCount(), 'Badge should reflect items before logout').toBeGreaterThan(0);

      await headerMenu.clickLogout();
      await loginPage.waitForVisible();

      await loginPage.loginAs('standard');
      await inventoryPage.waitForVisible();
      expect(await headerMenu.getCartBadgeCount(), 'Cart badge should be cleared after relogin').toBe(0);

      await inventoryPage.openCart();
      await cartPage.waitForVisible();
      expect(await cartPage.isEmpty(), 'Cart should remain empty after relogin').toBe(true);
    },
  );

  test(
    'About opens external Sauce Labs page in new tab',
    { tag: ['@menu', '@about', '@external'] },
    async ({ loggedInInventoryPage: inventoryPage, headerMenu, page }) => {
      await inventoryPage.waitForVisible();
      await headerMenu.openMenu();

      const [aboutPage] = await Promise.all([
        page.context().waitForEvent('page'),
        headerMenu.clickAbout(),
      ]);

      await aboutPage.waitForLoadState('domcontentloaded');
      await expect(aboutPage, 'About page should navigate to Sauce Labs domain').toHaveURL(/saucelabs\.com/);
      await aboutPage.close();
      await page.bringToFront();
    },
  );

  test(
    'menu closes automatically after navigation',
    { tag: ['@menu', '@state'] },
    async ({ loggedInInventoryPage: inventoryPage, headerMenu }) => {
      await inventoryPage.waitForVisible();
      await headerMenu.openMenu();
      expect(await headerMenu.isMenuOpen(), 'Menu should be open before navigation').toBe(true);

      await headerMenu.clickAllItems();
      await inventoryPage.waitForVisible();

      await expect.poll(
        async () => ((await headerMenu.isMenuOpen()) ? 'open' : 'closed'),
        {
          message: 'Menu panel should close after All Items navigation',
        },
      ).toBe('closed');
    },
  );

  test(
    'menu works correctly on product details page',
    { tag: ['@menu', '@details', '@inventory'] },
    async ({ loggedInInventoryPage: inventoryPage, productDetailsPage, headerMenu }) => {
      await inventoryPage.addProductToCartByName(firstProductName);
      await inventoryPage.openItemDetailsByName(secondProductName);
      await productDetailsPage.waitForVisible();

      await headerMenu.openMenu();
      await headerMenu.clickAllItems();

      await inventoryPage.waitForVisible();
      expect(await headerMenu.getCartBadgeCount(), 'Badge should still show previously added items').toBe(1);
    },
  );

  test(
    'back/forward after logout does not restore access to inventory',
    { tag: ['@menu', '@auth', '@nav'] },
    async ({ loggedInInventoryPage: inventoryPage, headerMenu, loginPage, page }) => {
      await inventoryPage.waitForVisible();
      await headerMenu.clickLogout();
      await loginPage.waitForVisible();
      await expect(page, 'Logout should land on login page').toHaveURL(loginPathMatcher);

      await page.goBack();
      await loginPage.waitForVisible();
      await expect(page, 'Backward navigation should not restore inventory access').toHaveURL(loginPathMatcher);

      await page.goForward();
      await loginPage.waitForVisible();
      await expect(page, 'Forward navigation should keep user on login').toHaveURL(loginPathMatcher);
    },
  );
});
