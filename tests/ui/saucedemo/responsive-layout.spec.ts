// tests/ui/responsive-layout.spec.ts
import { test, expect } from '../../../src/saucedemo/fixtures/test-fixtures';
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
      expect(
        totalProducts,
        `Desktop inventory should show all ${productCatalog.products.length} catalog products`,
      ).toBe(productCatalog.products.length);

      await expect(headerMenu.menuButton, 'Header menu button should be visible on desktop').toBeVisible();

      await footer.waitForVisible();
      const footerText = await footer.getFooterText();
      expect(
        footerText.length,
        'Footer text should be non-empty on desktop inventory page',
      ).toBeGreaterThan(0);
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
      await expect(headerMenu.menuButton, 'Menu button should be visible on cart page (desktop)').toBeVisible();
      await footer.waitForVisible();

      await cartPage.proceedToCheckout();
      await checkoutStepOnePage.waitForVisible();
      await expect(
        headerMenu.menuButton,
        'Menu button should be visible on checkout step one (desktop)',
      ).toBeVisible();
      await footer.waitForVisible();

      await checkoutStepOnePage.fillForm(
        checkoutUser.firstName,
        checkoutUser.lastName,
        checkoutUser.postalCode,
      );
      await checkoutStepOnePage.continueToStepTwo();

      await checkoutStepTwoPage.waitForVisible();
      await expect(
        headerMenu.menuButton,
        'Menu button should be visible on checkout step two (desktop)',
      ).toBeVisible();
      await footer.waitForVisible();

      await checkoutStepTwoPage.finishCheckout();
      await checkoutCompletePage.waitForVisible();
      await expect(
        headerMenu.menuButton,
        'Menu button should be visible on checkout complete page (desktop)',
      ).toBeVisible();
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
      expect(
        productCount,
        `Tablet inventory should show all ${productCatalog.products.length} catalog products`,
      ).toBe(productCatalog.products.length);

      const viewport = page.viewportSize();
      expect(
        viewport?.width,
        `Viewport width should match the tablet portrait setting (${tablet.viewport.width}px)`,
      ).toBe(tablet.viewport.width);
      expect(
        viewport?.height,
        `Viewport height should match the tablet portrait setting (${tablet.viewport.height}px)`,
      ).toBe(tablet.viewport.height);

      await expect(headerMenu.menuButton, 'Header menu button should be visible on tablet').toBeVisible();
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
      await expect(cartPage.checkoutButton, 'Checkout button should be visible on tablet cart').toBeVisible();
      await expect(headerMenu.menuButton, 'Menu button should be visible on tablet cart').toBeVisible();

      await cartPage.proceedToCheckout();
      await checkoutStepOnePage.waitForVisible();
      await expect(
        checkoutStepOnePage.firstNameInput,
        'First name input should be visible on checkout step one (tablet)',
      ).toBeVisible();
      await expect(
        checkoutStepOnePage.continueButton,
        'Continue button should be visible on checkout step one (tablet)',
      ).toBeVisible();

      await checkoutStepOnePage.fillForm(
        checkoutUser.firstName,
        checkoutUser.lastName,
        checkoutUser.postalCode,
      );
      await checkoutStepOnePage.continueToStepTwo();
      await checkoutStepTwoPage.waitForVisible();
      await expect(
        checkoutStepTwoPage.finishButton,
        'Finish button should be visible on checkout step two (tablet)',
      ).toBeVisible();
    },
  );

  test(
    'menu opens and reset app state works on tablet',
    { tag: ['@responsive', '@tablet', '@menu'] },
    async ({ loginPage, inventoryPage, cartPage, headerMenu }) => {
      await loginStandard(loginPage, inventoryPage);
      await addProductsToCart(inventoryPage, [firstProductName, secondProductName]);

      expect(
        await headerMenu.getCartBadgeCount(),
        'Cart badge should show at least 2 items after adding products on tablet',
      ).toBeGreaterThanOrEqual(2);
      await headerMenu.clickResetAppState();
      await inventoryPage.waitForVisible();

      expect(
        await headerMenu.getCartBadgeCount(),
        'Cart badge should be cleared after reset app state on tablet',
      ).toBe(0);
      await inventoryPage.openCart();
      await cartPage.waitForVisible();
      expect(
        await cartPage.getItemsCount(),
        'Cart should be empty after reset app state on tablet',
      ).toBe(0);
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
      await expect(aboutPage, 'About link should open the Sauce Labs website').toHaveURL(/saucelabs\.com/);
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
      await expect(loginPage.usernameInput, 'Username input should be visible on mobile login').toBeVisible();
      await expect(loginPage.passwordInput, 'Password input should be visible on mobile login').toBeVisible();
      await expect(loginPage.loginButton, 'Login button should be visible on mobile').toBeVisible();

      await loginPage.loginAs('standard');
      await inventoryPage.waitForVisible();
    },
  );

  test(
    'inventory shows at least one product above the fold on mobile',
    { tag: ['@responsive', '@mobile', '@inventory'] },
    async ({ loginPage, inventoryPage, headerMenu }) => {
      await loginStandard(loginPage, inventoryPage);
      await expect(
        inventoryPage.inventoryItems.first(),
        'At least the first product card should be visible on mobile',
      ).toBeVisible();
      const totalItems = await inventoryPage.getItemsCount();
      expect(
        totalItems,
        `Mobile inventory should contain all ${productCatalog.products.length} products`,
      ).toBe(productCatalog.products.length);
      await expect(headerMenu.menuButton, 'Header menu button should be visible on mobile inventory').toBeVisible();
    },
  );

  test(
    'cart badge is readable on small mobile',
    { tag: ['@responsive', '@mobile', '@cart'] },
    async ({ loginPage, inventoryPage, headerMenu }) => {
      await loginStandard(loginPage, inventoryPage);
      await addProductsToCart(inventoryPage, [firstProductName, secondProductName, thirdProductName]);

      const badgeCount = await headerMenu.getCartBadgeCount();
      expect(
        badgeCount,
        'Cart badge should show 3 after adding three products on mobile',
      ).toBe(3);
      await expect(headerMenu.cartBadge, 'Cart badge element should be visible on mobile').toBeVisible();
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
      await expect(headerMenu.menuButton, 'Header menu button should be visible on mobile').toBeVisible();
      await footer.waitForVisible();
      const footerText = await footer.getFooterText();
      expect(
        footerText.length,
        'Footer should render text content on mobile',
      ).toBeGreaterThan(0);
    },
  );
});
