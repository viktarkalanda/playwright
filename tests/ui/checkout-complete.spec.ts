// tests/ui/checkout-complete.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';
import type { InventoryPage } from '../../src/pages/InventoryPage';
import type { CartPage } from '../../src/pages/CartPage';
import type { CheckoutStepOnePage } from '../../src/pages/CheckoutStepOnePage';
import type { CheckoutStepTwoPage } from '../../src/pages/CheckoutStepTwoPage';
import type { CheckoutCompletePage } from '../../src/pages/CheckoutCompletePage';

async function goToCheckoutCompleteWithSingleItem(
  inventoryPage: InventoryPage,
  cartPage: CartPage,
  checkoutStepOnePage: CheckoutStepOnePage,
  checkoutStepTwoPage: CheckoutStepTwoPage,
  checkoutCompletePage: CheckoutCompletePage,
): Promise<void> {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();
  await cartPage.waitForVisible();
  await cartPage.startCheckout();

  await checkoutStepOnePage.waitForVisible();
  await checkoutStepOnePage.fillForm('Test', 'User', '12345');
  await checkoutStepOnePage.submit();

  await checkoutStepTwoPage.waitForVisible();
  await checkoutStepTwoPage.finish();

  await checkoutCompletePage.waitForVisible();
}

test.describe('Checkout complete - order confirmation', () => {
  test.beforeEach(async ({ loggedInInventoryPage }) => {
    await loggedInInventoryPage.waitForVisible();
  });

  test('user can reach checkout complete page after finishing checkout', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    await goToCheckoutCompleteWithSingleItem(
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    );

    await expect(
      page,
      'User should be on checkout complete page after finishing checkout',
    ).toHaveURL(/.*checkout-complete\.html/);

    const title = await checkoutCompletePage.getTitleText();
    expect(title, 'Checkout complete title should be "Checkout: Complete!"').toBe(
      'Checkout: Complete!',
    );
  });

  test('checkout complete page shows thank you header and body text', async ({
    checkoutCompletePage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
  }) => {
    await goToCheckoutCompleteWithSingleItem(
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    );

    const headerText = await checkoutCompletePage.getCompleteHeaderText();
    const bodyText = await checkoutCompletePage.getCompleteBodyText();

    expect(
      headerText,
      'Complete header text should not be empty on checkout complete page',
    ).not.toBe('');
    expect(bodyText, 'Complete body text should not be empty on checkout complete page').not.toBe(
      '',
    );
  });

  test('cart badge is cleared after completing checkout', async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    await inventoryPage.addFirstItemToCart();
    await inventoryPage.addItemToCartByName('Sauce Labs Bike Light');
    const badgeBefore = await inventoryPage.getCartBadgeCount();
    expect(
      badgeBefore,
      'Cart badge should be greater than zero before finishing checkout',
    ).toBeGreaterThan(0);

    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    await cartPage.startCheckout();

    await checkoutStepOnePage.waitForVisible();
    await checkoutStepOnePage.fillForm('Test', 'User', '12345');
    await checkoutStepOnePage.submit();

    await checkoutStepTwoPage.waitForVisible();
    await checkoutStepTwoPage.finish();

    await checkoutCompletePage.waitForVisible();

    const badgeAfter = await inventoryPage.getCartBadgeCount();

    expect(badgeAfter, 'Cart badge should be cleared after completing checkout').toBe(0);
  });

  test('cart is empty after completing checkout', async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    await goToCheckoutCompleteWithSingleItem(
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    );

    await checkoutCompletePage.backToProducts();
    await inventoryPage.waitForVisible();

    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const itemsCount = await cartPage.getItemsCount();

    expect(itemsCount, 'Cart should be empty after completing checkout and returning to cart').toBe(
      0,
    );
  });

  test('back to products button navigates user to inventory page', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    await goToCheckoutCompleteWithSingleItem(
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    );

    await checkoutCompletePage.backToProducts();

    await expect(page, 'Back to products button should navigate user to inventory page').toHaveURL(
      /.*inventory\.html/,
    );
  });

  test('user cannot access checkout complete page without login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/checkout-complete.html');

    await expect(
      page,
      'Anonymous user should not stay on checkout complete page when accessing it directly',
    ).not.toHaveURL(/.*checkout-complete\.html/);
  });

  test('user cannot access checkout complete page directly without finishing checkout', async ({
    page,
    loggedInInventoryPage,
  }) => {
    await loggedInInventoryPage.waitForVisible();

    await page.goto('/checkout-complete.html');

    await expect(
      page,
      'User should not be able to open checkout complete directly without finishing checkout',
    ).not.toHaveURL(/.*checkout-complete\.html/);
  });

  test('checkout complete page remains visible after reload and order stays completed', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    await goToCheckoutCompleteWithSingleItem(
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    );

    const headerBefore = await checkoutCompletePage.getCompleteHeaderText();
    const bodyBefore = await checkoutCompletePage.getCompleteBodyText();

    await page.reload();
    await checkoutCompletePage.waitForVisible();

    const headerAfter = await checkoutCompletePage.getCompleteHeaderText();
    const bodyAfter = await checkoutCompletePage.getCompleteBodyText();

    expect(
      headerAfter,
      'Header text should remain the same after reload on checkout complete page',
    ).toBe(headerBefore);
    expect(
      bodyAfter,
      'Body text should remain the same after reload on checkout complete page',
    ).toBe(bodyBefore);

    const badgeCount = await inventoryPage.getCartBadgeCount();
    expect(
      badgeCount,
      'Cart badge should remain cleared after reload on checkout complete page',
    ).toBe(0);
  });

  test('cart stays empty after navigating back from checkout complete and reopening cart', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    await goToCheckoutCompleteWithSingleItem(
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    );

    await checkoutCompletePage.backToProducts();
    await inventoryPage.waitForVisible();

    await page.goBack();
    await checkoutCompletePage.waitForVisible();

    await checkoutCompletePage.backToProducts();
    await inventoryPage.waitForVisible();

    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const itemsCount = await cartPage.getItemsCount();

    expect(
      itemsCount,
      'Cart should remain empty even after navigating back from checkout complete and reopening cart',
    ).toBe(0);
  });

  test('back to products works after reloading checkout complete page', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    await goToCheckoutCompleteWithSingleItem(
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    );

    await page.reload();
    await checkoutCompletePage.waitForVisible();

    await checkoutCompletePage.backToProducts();
    await inventoryPage.waitForVisible();

    await expect(
      page,
      'After reload, Back to products should still redirect user to inventory',
    ).toHaveURL(/.*inventory\.html/);

    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const itemsCount = await cartPage.getItemsCount();
    expect(itemsCount, 'Cart should remain empty after returning via Back to products').toBe(0);
  });
});
