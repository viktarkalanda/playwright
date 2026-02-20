// tests/ui/responsive-layout.spec.ts
import { test, expect } from '../../../src/fixtures/test-fixtures';
import { getDeviceViewport } from '../../../src/utils/viewports';
import { productCatalog } from '../../../src/data/products';
import type { LoginPage } from '../../../src/pages/saucedemo/LoginPage';
import type { InventoryPage } from '../../../src/pages/saucedemo/InventoryPage';

const productNames = productCatalog.products.map((product) => product.name);
const firstProductName = productNames[0] ?? 'Sauce Labs Backpack';
const secondProductName = productNames[1] ?? firstProductName;
const thirdProductName = productNames[2] ?? firstProductName;

const checkoutUser = {
  firstName: 'Responsive',
  lastName: 'Tester',
  postalCode: '30301',
};

async function loginStandard(loginPage: LoginPage, inventoryPage: InventoryPage): Promise<void> {
  await loginPage.loginAs('standard');
  await inventoryPage.waitForVisible();
}

async function addProductsToCart(inventoryPage: InventoryPage, names: string[]): Promise<void> {
  for (const name of names) {
    await inventoryPage.addProductToCartByName(name);
  }
}

test.describe('Responsive: desktop', () => {
  const desktop = getDeviceViewport('desktop');
  test.use({ viewport: desktop.viewport });

  test(
    'inventory shows all products and header/footer on desktop',
    { tag: ['@responsive', '@desktop', '@inventory'] },
    async ({ loggedInInventoryPage: inventoryPage, headerMenu, footer }) => {
      await inventoryPage.waitForVisible();
      const totalProducts = await inventoryPage.getItemsCount();
      expect(totalProducts).toBe(productCatalog.products.length);

      await expect(headerMenu.menuButton).toBeVisible();

      await footer.waitForVisible();
      const footerText = await footer.getFooterText();
      expect(footerText.length).toBeGreaterThan(0);
    },
  );

  test(
    'checkout flow works on desktop without layout issues',
    { tag: ['@responsive', '@desktop', '@checkout', '@e2e'] },
    async ({
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      headerMenu,
      footer,
    }) => {
      await loginStandard(loginPage, inventoryPage);
      await addProductsToCart(inventoryPage, [firstProductName, secondProductName]);

      await inventoryPage.openCart();
      await cartPage.waitForVisible();
      await expect(headerMenu.menuButton).toBeVisible();
      await footer.waitForVisible();

      await cartPage.proceedToCheckout();
      await checkoutStepOnePage.waitForVisible();
      await expect(headerMenu.menuButton).toBeVisible();
      await footer.waitForVisible();

      await checkoutStepOnePage.fillForm(
        checkoutUser.firstName,
        checkoutUser.lastName,
        checkoutUser.postalCode,
      );
      await checkoutStepOnePage.continueToStepTwo();

      await checkoutStepTwoPage.waitForVisible();
      await expect(headerMenu.menuButton).toBeVisible();
      await footer.waitForVisible();

      await checkoutStepTwoPage.finishCheckout();
      await checkoutCompletePage.waitForVisible();
      await expect(headerMenu.menuButton).toBeVisible();
      await footer.waitForVisible();
    },
  );
});

test.describe('Responsive: tablet', () => {
  const tablet = getDeviceViewport('tabletPortrait');
  test.use({ viewport: tablet.viewport });

  test(
    'inventory layout is stable on tablet portrait',
    { tag: ['@responsive', '@tablet', '@inventory'] },
    async ({ loggedInInventoryPage: inventoryPage, headerMenu, page }) => {
      await inventoryPage.waitForVisible();
      const productCount = await inventoryPage.getItemsCount();
      expect(productCount).toBe(productCatalog.products.length);

      const viewport = page.viewportSize();
      expect(viewport?.width).toBe(tablet.viewport.width);
      expect(viewport?.height).toBe(tablet.viewport.height);

      await expect(headerMenu.menuButton).toBeVisible();
    },
  );

  test(
    'cart and checkout are usable on tablet portrait',
    { tag: ['@responsive', '@tablet', '@checkout'] },
    async ({
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      headerMenu,
    }) => {
      await loginStandard(loginPage, inventoryPage);
      await addProductsToCart(inventoryPage, [firstProductName]);

      await inventoryPage.openCart();
      await cartPage.waitForVisible();
      await expect(cartPage.checkoutButton).toBeVisible();
      await expect(headerMenu.menuButton).toBeVisible();

      await cartPage.proceedToCheckout();
      await checkoutStepOnePage.waitForVisible();
      await expect(checkoutStepOnePage.firstNameInput).toBeVisible();
      await expect(checkoutStepOnePage.continueButton).toBeVisible();

      await checkoutStepOnePage.fillForm(
        checkoutUser.firstName,
        checkoutUser.lastName,
        checkoutUser.postalCode,
      );
      await checkoutStepOnePage.continueToStepTwo();
      await checkoutStepTwoPage.waitForVisible();
      await expect(checkoutStepTwoPage.finishButton).toBeVisible();
    },
  );

  test(
    'menu opens and reset app state works on tablet',
    { tag: ['@responsive', '@tablet', '@menu'] },
    async ({ loginPage, inventoryPage, cartPage, headerMenu }) => {
      await loginStandard(loginPage, inventoryPage);
      await addProductsToCart(inventoryPage, [firstProductName, secondProductName]);

      expect(await headerMenu.getCartBadgeCount()).toBeGreaterThanOrEqual(2);
      await headerMenu.clickResetAppState();
      await inventoryPage.waitForVisible();

      expect(await headerMenu.getCartBadgeCount()).toBe(0);
      await inventoryPage.openCart();
      await cartPage.waitForVisible();
      expect(await cartPage.getItemsCount()).toBe(0);
    },
  );

  test(
    'about link works on tablet',
    { tag: ['@responsive', '@tablet', '@about'] },
    async ({ loginPage, inventoryPage, headerMenu, page }) => {
      await loginStandard(loginPage, inventoryPage);
      await headerMenu.openMenu();

      const [aboutPage] = await Promise.all([
        page.context().waitForEvent('page'),
        headerMenu.clickAbout(),
      ]);

      await aboutPage.waitForLoadState('domcontentloaded');
      await expect(aboutPage).toHaveURL(/saucelabs\.com/);
      await aboutPage.close();
      await page.bringToFront();
    },
  );
});

test.describe('Responsive: mobile', () => {
  const mobile = getDeviceViewport('mobileSmall');
  test.use({ viewport: mobile.viewport });

  test(
    'login form is usable on small mobile',
    { tag: ['@responsive', '@mobile', '@login'] },
    async ({ loginPage, inventoryPage }) => {
      await loginPage.open();
      await expect(loginPage.usernameInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.loginButton).toBeVisible();

      await loginPage.loginAs('standard');
      await inventoryPage.waitForVisible();
    },
  );

  test(
    'inventory shows at least one product above the fold on mobile',
    { tag: ['@responsive', '@mobile', '@inventory'] },
    async ({ loginPage, inventoryPage, headerMenu }) => {
      await loginStandard(loginPage, inventoryPage);
      await expect(inventoryPage.inventoryItems.first()).toBeVisible();
      const totalItems = await inventoryPage.getItemsCount();
      expect(totalItems).toBe(productCatalog.products.length);
      await expect(headerMenu.menuButton).toBeVisible();
    },
  );

  test(
    'cart badge is readable on small mobile',
    { tag: ['@responsive', '@mobile', '@cart'] },
    async ({ loginPage, inventoryPage, headerMenu }) => {
      await loginStandard(loginPage, inventoryPage);
      await addProductsToCart(inventoryPage, [firstProductName, secondProductName, thirdProductName]);

      const badgeCount = await headerMenu.getCartBadgeCount();
      expect(badgeCount).toBe(3);
      await expect(headerMenu.cartBadge).toBeVisible();
    },
  );

  test(
    'checkout flow works on mobile with scrolling',
    { tag: ['@responsive', '@mobile', '@checkout', '@e2e'] },
    async ({
      loginPage,
      inventoryPage,
      productDetailsPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    }) => {
      await loginStandard(loginPage, inventoryPage);
      await inventoryPage.openItemDetailsByName(firstProductName);
      await productDetailsPage.waitForVisible();
      await productDetailsPage.addToCart();
      await productDetailsPage.backToProducts();
      await inventoryPage.waitForVisible();

      await inventoryPage.openCart();
      await cartPage.waitForVisible();
      await cartPage.proceedToCheckout();

      await checkoutStepOnePage.waitForVisible();
      await checkoutStepOnePage.fillForm(
        checkoutUser.firstName,
        checkoutUser.lastName,
        checkoutUser.postalCode,
      );
      await checkoutStepOnePage.continueToStepTwo();

      await checkoutStepTwoPage.waitForVisible();
      await checkoutStepTwoPage.finishCheckout();

      await checkoutCompletePage.waitForVisible();
    },
  );

  test(
    'header menu and footer are still accessible on mobile',
    { tag: ['@responsive', '@mobile', '@menu', '@footer'] },
    async ({ loginPage, inventoryPage, headerMenu, footer }) => {
      await loginStandard(loginPage, inventoryPage);
      await expect(headerMenu.menuButton).toBeVisible();
      await footer.waitForVisible();
      const footerText = await footer.getFooterText();
      expect(footerText.length).toBeGreaterThan(0);
    },
  );
});
