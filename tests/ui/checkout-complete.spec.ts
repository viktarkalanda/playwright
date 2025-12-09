// tests/ui/checkout-complete.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';
import { makeCheckoutUserData } from '../../src/utils/testData';
import type { InventoryPage } from '../../src/pages/InventoryPage';
import type { CartPage } from '../../src/pages/CartPage';
import type { CheckoutStepOnePage } from '../../src/pages/CheckoutStepOnePage';
import type { CheckoutStepTwoPage } from '../../src/pages/CheckoutStepTwoPage';
import type { CheckoutCompletePage } from '../../src/pages/CheckoutCompletePage';

const PRODUCT_NAME = 'Sauce Labs Backpack';
const EXPECTED_HEADER = 'Thank you for your order!';
const EXPECTED_BODY =
  'Your order has been dispatched, and will arrive just as fast as the pony can get there!';

type CompleteFlowContext = {
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutStepOnePage: CheckoutStepOnePage;
  checkoutStepTwoPage: CheckoutStepTwoPage;
  checkoutCompletePage: CheckoutCompletePage;
};

async function completeCheckoutFlow({
  inventoryPage,
  cartPage,
  checkoutStepOnePage,
  checkoutStepTwoPage,
  checkoutCompletePage,
}: CompleteFlowContext): Promise<void> {
  await inventoryPage.addItemToCartByName(PRODUCT_NAME);
  await inventoryPage.openCart();
  await cartPage.waitForVisible();
  await cartPage.startCheckout();

  const user = makeCheckoutUserData();
  await checkoutStepOnePage.completeStepOne(user.firstName, user.lastName, user.postalCode);
  await checkoutStepTwoPage.waitForVisible();
  await checkoutStepTwoPage.finish();
  await checkoutCompletePage.waitForVisible();
}

test.describe('Checkout complete', () => {
  test.beforeEach(async ({ loggedInInventoryPage }) => {
    await loggedInInventoryPage.waitForVisible();
  });

  test('shows thank you message after successful checkout', { tag: ['@checkout', '@smoke'] }, async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    await completeCheckoutFlow({
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    });

    const header = await checkoutCompletePage.getHeaderText();
    const body = await checkoutCompletePage.getBodyText();

    expect(header, 'Checkout complete page should show thank you header').toBe(EXPECTED_HEADER);
    expect(body, 'Checkout complete page should show confirmation details').toBe(EXPECTED_BODY);
  });

  test('back home navigates to inventory', { tag: '@checkout' }, async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    await completeCheckoutFlow({
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    });

    await checkoutCompletePage.backHome();
    await inventoryPage.waitForVisible();

    const title = await inventoryPage.getTitleText();
    expect(title, 'Back Home should navigate to inventory page').toBe('Products');
  });
});
