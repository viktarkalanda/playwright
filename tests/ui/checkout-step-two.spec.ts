// tests/ui/checkout-step-two.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';
import { makeCheckoutUserData } from '../../src/utils/testData';
import type { InventoryPage } from '../../src/pages/InventoryPage';
import type { CartPage } from '../../src/pages/CartPage';
import type { CheckoutStepOnePage } from '../../src/pages/CheckoutStepOnePage';
import type { CheckoutStepTwoPage } from '../../src/pages/CheckoutStepTwoPage';

const PRODUCT_SET = ['Sauce Labs Backpack', 'Sauce Labs Bike Light', 'Sauce Labs Bolt T-Shirt'];

type StepTwoContext = {
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutStepOnePage: CheckoutStepOnePage;
  checkoutStepTwoPage: CheckoutStepTwoPage;
};

async function goToCheckoutStepTwo(
  { inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage }: StepTwoContext,
  products: string[],
): Promise<{ cartNames: string[]; cartPrices: number[] }> {
  for (const name of products) {
    await inventoryPage.addItemToCartByName(name);
  }

  await inventoryPage.openCart();
  await cartPage.waitForVisible();

  const cartNames = await cartPage.getItemNames();
  const cartPrices = await cartPage.getItemPrices();

  await cartPage.startCheckout();
  const user = makeCheckoutUserData();
  await checkoutStepOnePage.completeStepOne(user.firstName, user.lastName, user.postalCode);
  await checkoutStepTwoPage.waitForVisible();

  return { cartNames, cartPrices };
}

test.describe('Checkout step two overview', () => {
  test.beforeEach(async ({ loggedInInventoryPage }) => {
    await loggedInInventoryPage.waitForVisible();
  });

  test('shows the same items and prices as in cart', { tag: ['@checkout', '@smoke'] }, async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
  }) => {
    const products = PRODUCT_SET.slice(0, 2);
    const { cartNames, cartPrices } = await goToCheckoutStepTwo(
      { inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage },
      products,
    );

    const summaryNames = await checkoutStepTwoPage.getItemNames();
    const summaryPrices = await checkoutStepTwoPage.getItemPrices();

    expect(summaryNames, 'Summary names should match cart names before checkout').toEqual(cartNames);
    expect(summaryPrices, 'Summary prices should match cart prices before checkout').toEqual(
      cartPrices,
    );
  });

  test('item total equals sum of item prices', { tag: '@checkout' }, async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
  }) => {
    await goToCheckoutStepTwo(
      { inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage },
      PRODUCT_SET.slice(0, 3),
    );

    const summaryPrices = await checkoutStepTwoPage.getItemPrices();
    const itemTotal = await checkoutStepTwoPage.getItemTotal();
    const calculated = summaryPrices.reduce((sum, price) => sum + price, 0);

    expect(itemTotal, 'Item total should equal the sum of summary item prices').toBeCloseTo(
      calculated,
      2,
    );
  });

  test('total equals item total plus tax', { tag: '@checkout' }, async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
  }) => {
    await goToCheckoutStepTwo(
      { inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage },
      PRODUCT_SET.slice(0, 2),
    );

    const itemTotal = await checkoutStepTwoPage.getItemTotal();
    const tax = await checkoutStepTwoPage.getTax();
    const total = await checkoutStepTwoPage.getTotal();

    expect(total, 'Total should equal item total plus tax').toBeCloseTo(itemTotal + tax, 2);
  });

  test('cancel from step two navigates back to cart', { tag: '@checkout' }, async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
  }) => {
    const products = PRODUCT_SET.slice(0, 2);
    const { cartNames } = await goToCheckoutStepTwo(
      { inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage },
      products,
    );

    await checkoutStepTwoPage.cancel();
    await cartPage.waitForVisible();

    const namesAfterCancel = await cartPage.getItemNames();
    expect(
      namesAfterCancel,
      'Cancelling on step two should return to cart with the same items intact',
    ).toEqual(cartNames);
  });

  test('finish from step two navigates to complete page', { tag: ['@checkout', '@e2e'] }, async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    await goToCheckoutStepTwo(
      { inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage },
      PRODUCT_SET.slice(0, 1),
    );

    await checkoutStepTwoPage.finish();
    await checkoutCompletePage.waitForVisible();

    const headerText = await checkoutCompletePage.getHeaderText();
    expect(headerText, 'Checkout complete page should confirm successful order').toContain(
      'Thank you',
    );
  });
});
