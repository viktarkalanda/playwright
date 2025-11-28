// tests/ui/checkout-step-one.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';
import type { InventoryPage } from '../../src/pages/InventoryPage';
import type { CartPage } from '../../src/pages/CartPage';

async function goToCheckoutStepOne(
  inventoryPage: InventoryPage,
  cartPage: CartPage,
): Promise<void> {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();
  await cartPage.waitForVisible();
  await cartPage.startCheckout();
}

test.describe('Checkout step one - personal information', () => {
  test.beforeEach(async ({ loggedInInventoryPage }) => {
    await loggedInInventoryPage.waitForVisible();
  });

  test('user can navigate to checkout step one from cart with item', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
  }) => {
    await goToCheckoutStepOne(inventoryPage, cartPage);
    await checkoutStepOnePage.waitForVisible();

    await expect(
      page,
      'User should be on checkout step one page after starting checkout',
    ).toHaveURL(/.*checkout-step-one\.html/);

    const title = await checkoutStepOnePage.getTitleText();
    expect(title, 'Checkout step one title should be "Checkout: Your Information"').toBe(
      'Checkout: Your Information',
    );
  });

  test('user cannot continue with all fields empty', async ({
    checkoutStepOnePage,
    inventoryPage,
    cartPage,
  }) => {
    await goToCheckoutStepOne(inventoryPage, cartPage);
    await checkoutStepOnePage.waitForVisible();

    await checkoutStepOnePage.submit();

    const errorText = await checkoutStepOnePage.getErrorText();
    expect(
      errorText,
      'Error message should be displayed when trying to continue with all fields empty',
    ).not.toBe('');
  });

  test('error is shown when only first name is provided', async ({
    checkoutStepOnePage,
    inventoryPage,
    cartPage,
  }) => {
    await goToCheckoutStepOne(inventoryPage, cartPage);
    await checkoutStepOnePage.waitForVisible();

    await checkoutStepOnePage.fillFirstName('Test');
    await checkoutStepOnePage.submit();

    const errorText = await checkoutStepOnePage.getErrorText();
    expect(
      errorText,
      'Error message should be displayed when last name and postal code are missing',
    ).not.toBe('');
  });

  test('error is shown when only last name is provided', async ({
    checkoutStepOnePage,
    inventoryPage,
    cartPage,
  }) => {
    await goToCheckoutStepOne(inventoryPage, cartPage);
    await checkoutStepOnePage.waitForVisible();

    await checkoutStepOnePage.fillLastName('User');
    await checkoutStepOnePage.submit();

    const errorText = await checkoutStepOnePage.getErrorText();
    expect(
      errorText,
      'Error message should be displayed when first name and postal code are missing',
    ).not.toBe('');
  });

  test('error is shown when only postal code is provided', async ({
    checkoutStepOnePage,
    inventoryPage,
    cartPage,
  }) => {
    await goToCheckoutStepOne(inventoryPage, cartPage);
    await checkoutStepOnePage.waitForVisible();

    await checkoutStepOnePage.fillPostalCode('12345');
    await checkoutStepOnePage.submit();

    const errorText = await checkoutStepOnePage.getErrorText();
    expect(
      errorText,
      'Error message should be displayed when first name and last name are missing',
    ).not.toBe('');
  });

  test('fields keep their values after validation error', async ({
    checkoutStepOnePage,
    inventoryPage,
    cartPage,
  }) => {
    await goToCheckoutStepOne(inventoryPage, cartPage);
    await checkoutStepOnePage.waitForVisible();

    await checkoutStepOnePage.fillFirstName('John');
    await checkoutStepOnePage.fillLastName('Doe');
    await checkoutStepOnePage.submit();

    const errorText = await checkoutStepOnePage.getErrorText();
    expect(errorText, 'Error message should be displayed because postal code is missing').not.toBe(
      '',
    );

    const firstNameValue = await checkoutStepOnePage.getFirstNameValue();
    const lastNameValue = await checkoutStepOnePage.getLastNameValue();

    expect(firstNameValue, 'First name value should be preserved after validation error').toBe(
      'John',
    );
    expect(lastNameValue, 'Last name value should be preserved after validation error').toBe('Doe');
  });

  test('user can successfully continue when all fields are valid', async ({
    page,
    checkoutStepOnePage,
    inventoryPage,
    cartPage,
  }) => {
    await goToCheckoutStepOne(inventoryPage, cartPage);
    await checkoutStepOnePage.waitForVisible();

    await checkoutStepOnePage.fillForm('Test', 'User', '12345');
    await checkoutStepOnePage.submit();

    await expect(
      page,
      'User should be redirected to checkout step two page after providing valid data',
    ).toHaveURL(/.*checkout-step-two\.html/);
  });

  test('cancel on checkout step one returns user back to cart and keeps items', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
  }) => {
    await goToCheckoutStepOne(inventoryPage, cartPage);
    await checkoutStepOnePage.waitForVisible();

    await checkoutStepOnePage.cancel();

    await expect(page, 'User should be back on cart page after cancel').toHaveURL(/.*cart\.html/);

    await cartPage.waitForVisible();
    const itemsCount = await cartPage.getItemsCount();

    expect(
      itemsCount,
      'Cart should still contain items after cancelling checkout step one',
    ).toBeGreaterThan(0);
  });

  test('user cannot access checkout step one without login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/checkout-step-one.html');

    await expect(
      page,
      'Anonymous user should not stay on checkout step one page when accessing it directly',
    ).not.toHaveURL(/.*checkout-step-one\.html/);
  });

  test('user stays on checkout step one after invalid data and can fix it to continue', async ({
    page,
    checkoutStepOnePage,
    inventoryPage,
    cartPage,
  }) => {
    await goToCheckoutStepOne(inventoryPage, cartPage);
    await checkoutStepOnePage.waitForVisible();

    await checkoutStepOnePage.fillForm('Test', '', '');
    await checkoutStepOnePage.submit();

    const errorText = await checkoutStepOnePage.getErrorText();
    expect(
      errorText,
      'Error message should be shown after submitting with missing last name and postal code',
    ).not.toBe('');

    await expect(
      page,
      'User should still be on checkout step one page after validation error',
    ).toHaveURL(/.*checkout-step-one\.html/);

    await checkoutStepOnePage.fillLastName('User');
    await checkoutStepOnePage.fillPostalCode('12345');
    await checkoutStepOnePage.submit();

    await expect(
      page,
      'After fixing invalid data user should be redirected to checkout step two page',
    ).toHaveURL(/.*checkout-step-two\.html/);
  });
});
