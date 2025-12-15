// tests/ui/page-content.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';
import { getPageContent, pageContent, PageKey } from '../../src/data/pageContent';
import {
  PageContentContext,
  expectDocumentTitle,
  expectMainHeader,
  expectPrimaryButtonText,
  expectSecondaryButtonText,
  expectCartButtonsMatchDefinition,
  expectBackToProductsButtonText,
  expectCheckoutCompleteSuccessMessage,
  expectFooterVisibleWithText,
} from '../../src/utils/pageContentAssertions';
import { validationMessages } from '../../src/data/validationMessages';
import {
  expectUsernameRequiredError,
  expectPasswordRequiredError,
  expectLockedOutUserError,
  expectFirstNameRequiredError,
  expectLastNameRequiredError,
  expectPostalCodeRequiredError,
} from '../../src/utils/assertions';
import { productCatalog } from '../../src/data/products';

const firstProductName = productCatalog.products[0]?.name ?? 'Sauce Labs Backpack';

function buildContext(fixtures: PageContentContext): PageContentContext {
  return fixtures;
}

test.describe('Page content consistency', () => {
  test('login page has correct title, header and primary button text', {
    tag: ['@ux', '@login', '@content'],
  }, async ({ page, loginPage, inventoryPage, cartPage, productDetailsPage, checkoutStepOnePage, checkoutStepTwoPage, checkoutCompletePage, headerMenu, footer }) => {
    const ctx = buildContext({
      page,
      loginPage,
      inventoryPage,
      cartPage,
      productDetailsPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      headerMenu,
      footer,
    });
    await loginPage.open();
    await expectDocumentTitle(ctx, 'login');
    await expectMainHeader(ctx, 'login');
    await expectPrimaryButtonText(ctx, 'login');
    await expectFooterVisibleWithText(ctx);
  });

  test('inventory page header matches definition', {
    tag: ['@ux', '@inventory', '@content'],
  }, async ({ page, loginPage, loggedInInventoryPage, inventoryPage, cartPage, productDetailsPage, checkoutStepOnePage, checkoutStepTwoPage, checkoutCompletePage, headerMenu, footer }) => {
    const ctx = buildContext({
      page,
      loginPage,
      inventoryPage,
      cartPage,
      productDetailsPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      headerMenu,
      footer,
    });
    await loggedInInventoryPage.waitForVisible();
    await expectDocumentTitle(ctx, 'inventory');
    await expectMainHeader(ctx, 'inventory');
    await expectFooterVisibleWithText(ctx);
  });

  test('cart page header and buttons match definition', {
    tag: ['@ux', '@cart', '@content'],
  }, async ({ page, loginPage, inventoryPage, loggedInInventoryPage, cartPage, productDetailsPage, checkoutStepOnePage, checkoutStepTwoPage, checkoutCompletePage, headerMenu, footer }) => {
    const ctx = buildContext({
      page,
      loginPage,
      inventoryPage,
      cartPage,
      productDetailsPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      headerMenu,
      footer,
    });
    await loggedInInventoryPage.waitForVisible();
    await inventoryPage.addFirstItemToCart();
    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    await expectMainHeader(ctx, 'cart');
    await expectCartButtonsMatchDefinition(ctx);
    await expectFooterVisibleWithText(ctx);
  });

  test('checkout step one header and button texts match definition', {
    tag: ['@ux', '@checkout', '@content'],
  }, async ({ page, loginPage, inventoryPage, loggedInInventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage, checkoutCompletePage, productDetailsPage, headerMenu, footer }) => {
    const ctx = buildContext({
      page,
      loginPage,
      inventoryPage,
      cartPage,
      productDetailsPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      headerMenu,
      footer,
    });
    await loggedInInventoryPage.waitForVisible();
    await inventoryPage.addFirstItemToCart();
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    await cartPage.proceedToCheckout();
    await checkoutStepOnePage.waitForVisible();

    await expectMainHeader(ctx, 'checkoutStepOne');
    await expectPrimaryButtonText(ctx, 'checkoutStepOne');
    await expectSecondaryButtonText(ctx, 'checkoutStepOne');
    await expectFooterVisibleWithText(ctx);
  });

  test('checkout step two header and button texts match definition', {
    tag: ['@ux', '@checkout', '@content'],
  }, async ({ page, loginPage, inventoryPage, loggedInInventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage, checkoutCompletePage, productDetailsPage, headerMenu, footer }) => {
    const ctx = buildContext({
      page,
      loginPage,
      inventoryPage,
      cartPage,
      productDetailsPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      headerMenu,
      footer,
    });
    await loggedInInventoryPage.waitForVisible();
    await inventoryPage.addFirstItemToCart();
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    await cartPage.proceedToCheckout();
    await checkoutStepOnePage.waitForVisible();
    await checkoutStepOnePage.fillForm('John', 'Doe', '12345');
    await checkoutStepOnePage.continueToStepTwo();
    await checkoutStepTwoPage.waitForVisible();

    await expectMainHeader(ctx, 'checkoutStepTwo');
    await expectPrimaryButtonText(ctx, 'checkoutStepTwo');
    await expectSecondaryButtonText(ctx, 'checkoutStepTwo');
    await expectFooterVisibleWithText(ctx);
  });

  test('checkout complete page header, button and success message match definition', {
    tag: ['@ux', '@checkout', '@content', '@e2e'],
  }, async ({ page, loginPage, inventoryPage, loggedInInventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage, checkoutCompletePage, productDetailsPage, headerMenu, footer }) => {
    const ctx = buildContext({
      page,
      loginPage,
      inventoryPage,
      cartPage,
      productDetailsPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      headerMenu,
      footer,
    });
    await loggedInInventoryPage.waitForVisible();
    await inventoryPage.addFirstItemToCart();
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    await cartPage.proceedToCheckout();
    await checkoutStepOnePage.waitForVisible();
    await checkoutStepOnePage.fillForm('John', 'Doe', '12345');
    await checkoutStepOnePage.continueToStepTwo();
    await checkoutStepTwoPage.waitForVisible();
    await checkoutStepTwoPage.finishCheckout();
    await checkoutCompletePage.waitForVisible();

    await expectMainHeader(ctx, 'checkoutComplete');
    await expectPrimaryButtonText(ctx, 'checkoutComplete');
    await expectCheckoutCompleteSuccessMessage(ctx);
    await expectFooterVisibleWithText(ctx);
  });

  test('product details page shows consistent header and back button text', {
    tag: ['@ux', '@details', '@content'],
  }, async ({ page, loginPage, inventoryPage, loggedInInventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage, checkoutCompletePage, productDetailsPage, headerMenu, footer }) => {
    const ctx = buildContext({
      page,
      loginPage,
      inventoryPage,
      cartPage,
      productDetailsPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      headerMenu,
      footer,
    });
    await loggedInInventoryPage.waitForVisible();
    await inventoryPage.openItemDetailsByName(firstProductName);
    await productDetailsPage.waitForVisible();

    await expectMainHeader(ctx, 'productDetails');
    await expectBackToProductsButtonText(ctx);
    await expectFooterVisibleWithText(ctx);
  });

  test('footer is visible on login page', {
    tag: ['@ux', '@footer', '@content', '@login'],
  }, async ({ page, loginPage, inventoryPage, cartPage, productDetailsPage, checkoutStepOnePage, checkoutStepTwoPage, checkoutCompletePage, headerMenu, footer }) => {
    const ctx = buildContext({
      page,
      loginPage,
      inventoryPage,
      cartPage,
      productDetailsPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      headerMenu,
      footer,
    });
    await loginPage.open();
    await expectFooterVisibleWithText(ctx);
  });

  test('footer is visible on checkout complete page', {
    tag: ['@ux', '@footer', '@content', '@checkout'],
  }, async ({ page, loginPage, inventoryPage, loggedInInventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage, checkoutCompletePage, productDetailsPage, headerMenu, footer }) => {
    const ctx = buildContext({
      page,
      loginPage,
      inventoryPage,
      cartPage,
      productDetailsPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      headerMenu,
      footer,
    });
    await loggedInInventoryPage.waitForVisible();
    await inventoryPage.addFirstItemToCart();
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    await cartPage.proceedToCheckout();
    await checkoutStepOnePage.waitForVisible();
    await checkoutStepOnePage.fillForm('John', 'Doe', '12345');
    await checkoutStepOnePage.continueToStepTwo();
    await checkoutStepTwoPage.waitForVisible();
    await checkoutStepTwoPage.finishCheckout();
    await checkoutCompletePage.waitForVisible();
    await expectFooterVisibleWithText(ctx);
  });

  test('login error messages match validationMessages definitions', {
    tag: ['@ux', '@login', '@errors', '@content'],
  }, async ({ page, loginPage, inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage, checkoutCompletePage, productDetailsPage, headerMenu, footer }) => {
    const ctx = buildContext({
      page,
      loginPage,
      inventoryPage,
      cartPage,
      productDetailsPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      headerMenu,
      footer,
    });

    await loginPage.open();
    await loginPage.submitLogin();
    let error = await loginPage.getErrorText();
    expectUsernameRequiredError(error);

    await loginPage.open();
    await loginPage.fillUsername('standard_user');
    await loginPage.submitLogin();
    error = await loginPage.getErrorText();
    expectPasswordRequiredError(error);

    await loginPage.open();
    await loginPage.fillUsername('locked_out_user');
    await loginPage.fillPassword('secret_sauce');
    await loginPage.submitLogin();
    error = await loginPage.getErrorText();
    expectLockedOutUserError(error);
    expect(error).toBe(validationMessages.login.lockedOut);
    await expectFooterVisibleWithText(ctx);
  });

  test('checkout step one validation messages match definitions', {
    tag: ['@ux', '@checkout', '@errors', '@content'],
  }, async ({ page, loginPage, inventoryPage, loggedInInventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage, checkoutCompletePage, productDetailsPage, headerMenu, footer }) => {
    const ctx = buildContext({
      page,
      loginPage,
      inventoryPage,
      cartPage,
      productDetailsPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      headerMenu,
      footer,
    });
    await loggedInInventoryPage.waitForVisible();
    await inventoryPage.addFirstItemToCart();
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    await cartPage.proceedToCheckout();
    await checkoutStepOnePage.waitForVisible();

    await checkoutStepOnePage.fillForm('', 'Doe', '12345');
    await checkoutStepOnePage.continueToStepTwo();
    let error = await checkoutStepOnePage.getErrorText();
    expectFirstNameRequiredError(error);

    await checkoutStepOnePage.fillForm('John', '', '12345');
    await checkoutStepOnePage.continueToStepTwo();
    error = await checkoutStepOnePage.getErrorText();
    expectLastNameRequiredError(error);

    await checkoutStepOnePage.fillForm('John', 'Doe', '');
    await checkoutStepOnePage.continueToStepTwo();
    error = await checkoutStepOnePage.getErrorText();
    expectPostalCodeRequiredError(error);
    await expectFooterVisibleWithText(ctx);
  });

  test('all defined page titles can be retrieved from pageContent config', {
    tag: ['@ux', '@content', '@config'],
  }, async () => {
    const keys = Object.keys(pageContent) as PageKey[];
    for (const key of keys) {
      const def = getPageContent(key);
      expect(def.routeKey).toBeDefined();
    }
  });

  test('about page title matches expectation when opened from header menu', {
    tag: ['@ux', '@about', '@content'],
  }, async ({ page, loginPage, loggedInInventoryPage, inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage, checkoutCompletePage, productDetailsPage, headerMenu, footer }) => {
    const ctx = buildContext({
      page,
      loginPage,
      inventoryPage,
      cartPage,
      productDetailsPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      headerMenu,
      footer,
    });
    await loggedInInventoryPage.waitForVisible();
    await headerMenu.openMenu();
    const [aboutPage] = await Promise.all([
      page.context().waitForEvent('page'),
      headerMenu.clickAbout(),
    ]);
    await aboutPage.waitForLoadState('domcontentloaded');
    const aboutDef = getPageContent('about');
    if (aboutDef.title) {
      await expect(aboutPage).toHaveTitle(aboutDef.title);
    }
    await aboutPage.close();
    await expectFooterVisibleWithText(ctx);
  });
});
