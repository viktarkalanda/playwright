// tests/ui/checkout-e2e.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';

const BACKPACK_NAME = 'Sauce Labs Backpack';
const BIKE_LIGHT_NAME = 'Sauce Labs Bike Light';

interface InventoryPageLike {
  addItemToCartByName(name: string): Promise<void>;
  openCart(): Promise<void>;
  openItemDetailsByName(name: string): Promise<void>;
  getCartBadgeCount(): Promise<number>;
}

interface CartPageLike {
  waitForVisible(): Promise<void>;
  getItemsCount(): Promise<number>;
  startCheckout(): Promise<void>;
  cartItems: {
    first(): {
      getByRole(role: string, options: { name: string }): { click(): Promise<void> };
    };
  };
}

interface CheckoutStepOnePageLike {
  waitForVisible(): Promise<void>;
  fillForm(firstName: string, lastName: string, postalCode: string): Promise<void>;
  submit(): Promise<void>;
  cancel(): Promise<void>;
}

interface CheckoutStepTwoPageLike {
  waitForVisible(): Promise<void>;
  getSummaryItemCount(): Promise<number>;
  getItemNames(): Promise<string[]>;
  finish(): Promise<void>;
  cancel(): Promise<void>;
}

interface CheckoutCompletePageLike {
  waitForVisible(): Promise<void>;
  getTitleText(): Promise<string>;
  backToProducts(): Promise<void>;
}

async function completeSingleItemCheckout(args: {
  inventoryPage: InventoryPageLike;
  cartPage: CartPageLike;
  checkoutStepOnePage: CheckoutStepOnePageLike;
  checkoutStepTwoPage: CheckoutStepTwoPageLike;
  checkoutCompletePage: CheckoutCompletePageLike;
}): Promise<void> {
  const {
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  } = args;

  await inventoryPage.addItemToCartByName(BACKPACK_NAME);
  await inventoryPage.openCart();
  await cartPage.waitForVisible();
  await cartPage.startCheckout();

  await checkoutStepOnePage.waitForVisible();
  await checkoutStepOnePage.fillForm('E2E', 'User', '10001');
  await checkoutStepOnePage.submit();

  await checkoutStepTwoPage.waitForVisible();
  await checkoutStepTwoPage.finish();

  await checkoutCompletePage.waitForVisible();
}

test.describe('End-to-end checkout flows', () => {
  test.beforeEach(async ({ loggedInInventoryPage }) => {
    await loggedInInventoryPage.waitForVisible();
  });

  test('user can complete checkout with a single product', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    await completeSingleItemCheckout({
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    });

    await expect(
      page,
      'After finishing checkout user should be on checkout complete page',
    ).toHaveURL(/.*checkout-complete\.html/);

    const title = await checkoutCompletePage.getTitleText();
    expect(title, 'Checkout complete title should confirm completion').toContain('Complete');

    await checkoutCompletePage.backToProducts();
    await inventoryPage.waitForVisible();

    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const itemsCount = await cartPage.getItemsCount();
    expect(
      itemsCount,
      'Cart should be empty after completing full checkout flow with a single product',
    ).toBe(0);
  });

  test('user can complete checkout with multiple products and summary matches cart', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    await inventoryPage.addItemToCartByName(BACKPACK_NAME);
    await inventoryPage.addItemToCartByName(BIKE_LIGHT_NAME);

    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const itemsInCart = await cartPage.getItemsCount();
    expect(
      itemsInCart,
      'Cart should contain at least two items before multi-product checkout',
    ).toBeGreaterThanOrEqual(2);

    await cartPage.startCheckout();

    await checkoutStepOnePage.waitForVisible();
    await checkoutStepOnePage.fillForm('Multi', 'User', '20002');
    await checkoutStepOnePage.submit();

    await checkoutStepTwoPage.waitForVisible();

    const summaryCount = await checkoutStepTwoPage.getSummaryItemCount();
    expect(
      summaryCount,
      'Checkout summary should show the same number of items as cart before checkout',
    ).toBe(itemsInCart);

    const summaryNames = await checkoutStepTwoPage.getItemNames();
    expect(summaryNames, 'Summary should include backpack').toContain(BACKPACK_NAME);
    expect(summaryNames, 'Summary should include bike light').toContain(BIKE_LIGHT_NAME);

    await checkoutStepTwoPage.finish();
    await checkoutCompletePage.waitForVisible();

    await expect(
      page,
      'After finishing multi-product checkout user should be on complete page',
    ).toHaveURL(/.*checkout-complete\.html/);
  });

  test('aborting checkout at step one keeps cart intact and allows later completion', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    await inventoryPage.addItemToCartByName(BACKPACK_NAME);
    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const itemsBefore = await cartPage.getItemsCount();

    await cartPage.startCheckout();
    await checkoutStepOnePage.waitForVisible();

    await checkoutStepOnePage.cancel();

    await expect(page, 'After cancelling step one user should be back on cart').toHaveURL(
      /.*cart\.html/,
    );

    const itemsAfterCancel = await cartPage.getItemsCount();
    expect(
      itemsAfterCancel,
      'Cart items should remain unchanged after cancelling checkout at step one',
    ).toBe(itemsBefore);

    await cartPage.startCheckout();
    await checkoutStepOnePage.waitForVisible();
    await checkoutStepOnePage.fillForm('Retry', 'User', '30003');
    await checkoutStepOnePage.submit();

    await checkoutStepTwoPage.waitForVisible();
    await checkoutStepTwoPage.finish();
    await checkoutCompletePage.waitForVisible();

    await checkoutCompletePage.backToProducts();
    await inventoryPage.waitForVisible();

    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const itemsAfterComplete = await cartPage.getItemsCount();
    expect(
      itemsAfterComplete,
      'Cart should be empty after completing checkout after previous cancel',
    ).toBe(0);
  });

  test('aborting checkout at step two, modifying cart and restarting reflects changes', async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
  }) => {
    await inventoryPage.addItemToCartByName(BACKPACK_NAME);
    await inventoryPage.addItemToCartByName(BIKE_LIGHT_NAME);
    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    await cartPage.startCheckout();

    await checkoutStepOnePage.waitForVisible();
    await checkoutStepOnePage.fillForm('Change', 'Cart', '40004');
    await checkoutStepOnePage.submit();

    await checkoutStepTwoPage.waitForVisible();
    const initialSummaryCount = await checkoutStepTwoPage.getSummaryItemCount();

    await checkoutStepTwoPage.cancel();
    await cartPage.waitForVisible();

    const firstCartItem = cartPage.cartItems.first();
    await firstCartItem.getByRole('button', { name: 'Remove' }).click();

    const itemsInCartAfterRemoval = await cartPage.getItemsCount();

    await cartPage.startCheckout();
    await checkoutStepOnePage.waitForVisible();
    await checkoutStepOnePage.fillForm('Change', 'Cart', '40004');
    await checkoutStepOnePage.submit();

    await checkoutStepTwoPage.waitForVisible();
    const summaryCountAfterChange = await checkoutStepTwoPage.getSummaryItemCount();

    expect(
      initialSummaryCount,
      'Initial summary count should be greater than zero',
    ).toBeGreaterThan(0);
    expect(
      summaryCountAfterChange,
      'Summary count after modifying cart should match updated cart count',
    ).toBe(itemsInCartAfterRemoval);
  });

  test('user can start checkout from product details page and complete flow', async ({
    page,
    inventoryPage,
    productDetailsPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    await inventoryPage.openItemDetailsByName(BACKPACK_NAME);
    await productDetailsPage.waitForVisible();

    await productDetailsPage.addToCart();

    await productDetailsPage.backToProducts();
    await inventoryPage.waitForVisible();

    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const itemsInCart = await cartPage.getItemsCount();
    expect(
      itemsInCart,
      'Cart should contain at least one item after adding from details page',
    ).toBeGreaterThan(0);

    await cartPage.startCheckout();

    await checkoutStepOnePage.waitForVisible();
    await checkoutStepOnePage.fillForm('Details', 'Flow', '50005');
    await checkoutStepOnePage.submit();

    await checkoutStepTwoPage.waitForVisible();
    await checkoutStepTwoPage.finish();

    await checkoutCompletePage.waitForVisible();

    await expect(
      page,
      'User should reach complete page when starting checkout from details page',
    ).toHaveURL(/.*checkout-complete\.html/);
  });

  test('checkout with empty cart still leads to overview with zero items', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
  }) => {
    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const itemsBefore = await cartPage.getItemsCount();
    expect(itemsBefore, 'Cart should be empty before empty-cart checkout flow').toBe(0);

    await cartPage.startCheckout();

    await checkoutStepOnePage.waitForVisible();
    await checkoutStepOnePage.fillForm('Empty', 'Cart', '60006');
    await checkoutStepOnePage.submit();

    await checkoutStepTwoPage.waitForVisible();

    const summaryCount = await checkoutStepTwoPage.getSummaryItemCount();
    expect(summaryCount, 'Checkout summary should show zero items for empty-cart checkout').toBe(0);

    await expect(
      page,
      'User should be on checkout step two page even for empty-cart checkout',
    ).toHaveURL(/.*checkout-step-two\.html/);
  });

  test('full checkout flow with reset app state at the end leaves application clean', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    mainMenu,
  }) => {
    await inventoryPage.addItemToCartByName(BACKPACK_NAME);
    await inventoryPage.addItemToCartByName(BIKE_LIGHT_NAME);

    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    await cartPage.startCheckout();

    await checkoutStepOnePage.waitForVisible();
    await checkoutStepOnePage.fillForm('Reset', 'Flow', '70007');
    await checkoutStepOnePage.submit();

    await checkoutStepTwoPage.waitForVisible();
    await checkoutStepTwoPage.finish();

    await checkoutCompletePage.waitForVisible();

    await checkoutCompletePage.backToProducts();
    await inventoryPage.waitForVisible();

    await mainMenu.resetAppState();

    const badgeCount = await inventoryPage.getCartBadgeCount();
    expect(badgeCount, 'Cart badge should be zero after full checkout and reset app state').toBe(0);

    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const itemsCount = await cartPage.getItemsCount();
    expect(itemsCount, 'Cart should be empty after full checkout and reset app state').toBe(0);

    await expect(
      page,
      'User should remain on inventory page after reset app state in clean end-to-end flow',
    ).toHaveURL(/.*inventory\.html/);
  });

  test('using browser back after checkout complete does not restore previous cart items', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    await completeSingleItemCheckout({
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    });

    await page.goBack();
    await checkoutStepTwoPage.waitForVisible();

    await page.goBack();
    await checkoutStepOnePage.waitForVisible();

    await page.goBack();
    await cartPage.waitForVisible();

    const itemsInCart = await cartPage.getItemsCount();
    expect(
      itemsInCart,
      'Cart should remain empty even after navigating back through checkout history',
    ).toBe(0);
  });

  test('reset app state during checkout clears cart before overview step', async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    mainMenu,
  }) => {
    await inventoryPage.addItemToCartByName(BACKPACK_NAME);
    await inventoryPage.addItemToCartByName(BIKE_LIGHT_NAME);
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    await cartPage.startCheckout();

    await checkoutStepOnePage.waitForVisible();

    await mainMenu.resetAppState();

    const badgeAfterReset = await inventoryPage.getCartBadgeCount();
    expect(
      badgeAfterReset,
      'Cart badge should be cleared immediately after resetting app state mid-checkout',
    ).toBe(0);

    await checkoutStepOnePage.fillForm('Reset', 'During', '80808');
    await checkoutStepOnePage.submit();
    await checkoutStepTwoPage.waitForVisible();

    const summaryCount = await checkoutStepTwoPage.getSummaryItemCount();
    expect(
      summaryCount,
      'Checkout overview should be empty when cart was cleared mid-flow',
    ).toBe(0);

    await checkoutStepTwoPage.finish();
    await checkoutCompletePage.waitForVisible();

    await checkoutCompletePage.backToProducts();
    await inventoryPage.waitForVisible();

    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const itemsAfterFlow = await cartPage.getItemsCount();
    expect(
      itemsAfterFlow,
      'Cart should stay empty throughout after resetting app state during checkout',
    ).toBe(0);
  });
});
