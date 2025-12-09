// tests/ui/checkout-e2e.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';
import { makeCheckoutUserData } from '../../src/utils/testData';
import type { InventoryPage } from '../../src/pages/InventoryPage';
import type { CartPage } from '../../src/pages/CartPage';
import type { CheckoutStepOnePage } from '../../src/pages/CheckoutStepOnePage';
import type { CheckoutStepTwoPage } from '../../src/pages/CheckoutStepTwoPage';
import type { CheckoutCompletePage } from '../../src/pages/CheckoutCompletePage';

const MULTI_PRODUCT_SET = ['Sauce Labs Backpack', 'Sauce Labs Bike Light', 'Sauce Labs Onesie'];
const SINGLE_PRODUCT = ['Sauce Labs Bolt T-Shirt'];

type CheckoutFlowContext = {
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutStepOnePage: CheckoutStepOnePage;
  checkoutStepTwoPage: CheckoutStepTwoPage;
  checkoutCompletePage: CheckoutCompletePage;
};

async function completeCheckout(
  {
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }: CheckoutFlowContext,
  products: string[],
): Promise<{
  cartCount: number;
  itemPrices: number[];
  itemTotal: number;
  tax: number;
  total: number;
}> {
  for (const name of products) {
    await inventoryPage.addItemToCartByName(name);
  }

  await inventoryPage.openCart();
  await cartPage.waitForVisible();
  const cartCount = await cartPage.getItemsCount();

  await cartPage.startCheckout();
  const user = makeCheckoutUserData();
  await checkoutStepOnePage.completeStepOne(user.firstName, user.lastName, user.postalCode);
  await checkoutStepTwoPage.waitForVisible();

  const itemPrices = await checkoutStepTwoPage.getItemPrices();
  const itemTotal = await checkoutStepTwoPage.getItemTotal();
  const tax = await checkoutStepTwoPage.getTax();
  const total = await checkoutStepTwoPage.getTotal();

  await checkoutStepTwoPage.finish();
  await checkoutCompletePage.waitForVisible();

  return { cartCount, itemPrices, itemTotal, tax, total };
}

test.describe('Checkout end-to-end flows', () => {
  test.beforeEach(async ({ loggedInInventoryPage }) => {
    await loggedInInventoryPage.waitForVisible();
  });

  test('user can complete checkout with multiple products end-to-end', { tag: ['@checkout', '@e2e', '@smoke'] }, async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    const { cartCount, itemPrices, itemTotal, tax, total } = await completeCheckout(
      { inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage, checkoutCompletePage },
      MULTI_PRODUCT_SET,
    );

    const calculatedTotal = itemPrices.reduce((sum, price) => sum + price, 0);

    expect(
      cartCount,
      'Cart should contain the number of products selected before checkout',
    ).toBe(MULTI_PRODUCT_SET.length);
    expect(
      itemTotal,
      'Item total should equal sum of item prices for multi-product checkout',
    ).toBeCloseTo(calculatedTotal, 2);
    expect(total, 'Grand total should equal item total plus tax').toBeCloseTo(itemTotal + tax, 2);

    const header = await checkoutCompletePage.getHeaderText();
    expect(header, 'Checkout complete page should confirm the order').toBe('Thank you for your order!');

    await checkoutCompletePage.backHome();
    await inventoryPage.waitForVisible();
    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const itemsAfterCheckout = await cartPage.getItemsCount();
    expect(itemsAfterCheckout, 'Cart should be empty after completing checkout').toBe(0);
  });

  test('user can complete checkout with single product end-to-end', { tag: ['@checkout', '@e2e'] }, async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    await completeCheckout(
      { inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage, checkoutCompletePage },
      SINGLE_PRODUCT,
    );

    const body = await checkoutCompletePage.getBodyText();
    expect(
      body,
      'Checkout complete message should describe shipment after single-product checkout',
    ).toContain('Your order has been dispatched');

    await checkoutCompletePage.backHome();
    await inventoryPage.waitForVisible();

    const badgeCount = await inventoryPage.getCartBadgeCount();
    expect(badgeCount, 'Cart badge should reset after completing checkout').toBe(0);
  });
});
