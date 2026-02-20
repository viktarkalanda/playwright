// tests/ui/checkout-step-one.spec.ts
import { test, expect } from '../../../src/fixtures/test-fixtures';
import type { SauceDemoContext } from '../../../src/types/appContext';
import { makeCheckoutUserData } from '../../../src/utils/testData';

const PRODUCT_NAME = 'Sauce Labs Backpack';
const ERROR_MESSAGES = {
  firstName: 'Error: First Name is required',
  lastName: 'Error: Last Name is required',
  postalCode: 'Error: Postal Code is required',
};

async function openCheckoutStepOne({
  inventoryPage,
  cartPage,
  checkoutStepOnePage,
}: Pick<SauceDemoContext, 'inventoryPage' | 'cartPage' | 'checkoutStepOnePage'>): Promise<void> {
  await inventoryPage.addItemToCartByName(PRODUCT_NAME);
  await inventoryPage.openCart();
  await cartPage.waitForVisible();
  await cartPage.startCheckout();
  await checkoutStepOnePage.waitForVisible();
}

test.describe('Checkout step one', () => {
  test.beforeEach(async ({ loggedInInventoryPage }) => {
    await loggedInInventoryPage.waitForVisible();
  });

  test('shows error when first name is missing', { tag: '@checkout' }, async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
  }) => {
    await openCheckoutStepOne({ inventoryPage, cartPage, checkoutStepOnePage });

    const user = makeCheckoutUserData({ firstName: '' });
    await checkoutStepOnePage.fillForm(user.firstName, user.lastName, user.postalCode);
    await checkoutStepOnePage.continue();

    const errorText = await checkoutStepOnePage.getErrorText();
    expect(errorText, 'Missing first name should trigger validation error').toBe(
      ERROR_MESSAGES.firstName,
    );
  });

  test('shows error when last name is missing', { tag: '@checkout' }, async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
  }) => {
    await openCheckoutStepOne({ inventoryPage, cartPage, checkoutStepOnePage });

    const user = makeCheckoutUserData({ lastName: '' });
    await checkoutStepOnePage.fillForm(user.firstName, user.lastName, user.postalCode);
    await checkoutStepOnePage.continue();

    const errorText = await checkoutStepOnePage.getErrorText();
    expect(errorText, 'Missing last name should trigger validation error').toBe(
      ERROR_MESSAGES.lastName,
    );
  });

  test('shows error when postal code is missing', { tag: '@checkout' }, async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
  }) => {
    await openCheckoutStepOne({ inventoryPage, cartPage, checkoutStepOnePage });

    const user = makeCheckoutUserData({ postalCode: '' });
    await checkoutStepOnePage.fillForm(user.firstName, user.lastName, user.postalCode);
    await checkoutStepOnePage.continue();

    const errorText = await checkoutStepOnePage.getErrorText();
    expect(errorText, 'Missing postal code should trigger validation error').toBe(
      ERROR_MESSAGES.postalCode,
    );
  });

  test('allows user to proceed to step two with valid data', { tag: ['@checkout', '@smoke'] }, async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
  }) => {
    await openCheckoutStepOne({ inventoryPage, cartPage, checkoutStepOnePage });

    const user = makeCheckoutUserData();
    await checkoutStepOnePage.completeStepOne(user.firstName, user.lastName, user.postalCode);

    await checkoutStepTwoPage.waitForVisible();
    const summaryNames = await checkoutStepTwoPage.getItemNames();

    expect(
      summaryNames,
      'Checkout step two should display the product that was added before checkout',
    ).toContain(PRODUCT_NAME);
  });

  test('cancel navigates back to cart', { tag: '@checkout' }, async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
  }) => {
    await openCheckoutStepOne({ inventoryPage, cartPage, checkoutStepOnePage });

    await checkoutStepOnePage.cancel();
    await cartPage.waitForVisible();

    const itemsCount = await cartPage.getItemsCount();
    expect(itemsCount, 'Cart should still contain the product after cancelling checkout').toBe(1);
  });
});
