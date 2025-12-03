// tests/ui/checkout-step-two.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';
import type { InventoryPage } from '../../src/pages/InventoryPage';
import type { CartPage } from '../../src/pages/CartPage';
import type { CheckoutStepOnePage } from '../../src/pages/CheckoutStepOnePage';
import type { CheckoutStepTwoPage } from '../../src/pages/CheckoutStepTwoPage';

async function goToCheckoutStepTwoWithTwoItems(
  inventoryPage: InventoryPage,
  cartPage: CartPage,
  checkoutStepOnePage: CheckoutStepOnePage,
  checkoutStepTwoPage: CheckoutStepTwoPage,
): Promise<void> {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.addItemToCartByName('Sauce Labs Bike Light');
  await inventoryPage.openCart();
  await cartPage.waitForVisible();
  await cartPage.startCheckout();
  await checkoutStepOnePage.waitForVisible();
  await checkoutStepOnePage.fillForm('Test', 'User', '12345');
  await checkoutStepOnePage.submit();
  await checkoutStepTwoPage.waitForVisible();
}

async function goToCheckoutStepTwoWithSingleItem(
  inventoryPage: InventoryPage,
  cartPage: CartPage,
  checkoutStepOnePage: CheckoutStepOnePage,
  checkoutStepTwoPage: CheckoutStepTwoPage,
): Promise<void> {
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();
  await cartPage.waitForVisible();
  await cartPage.startCheckout();
  await checkoutStepOnePage.waitForVisible();
  await checkoutStepOnePage.fillForm('Single', 'User', '54321');
  await checkoutStepOnePage.submit();
  await checkoutStepTwoPage.waitForVisible();
}

test.describe('Checkout step two - overview', () => {
  test.beforeEach(async ({ loggedInInventoryPage }) => {
    await loggedInInventoryPage.waitForVisible();
  });

  test('user can reach checkout step two from cart via checkout step one', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
  }) => {
    await goToCheckoutStepTwoWithSingleItem(
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
    );

    await expect(
      page,
      'User should be on checkout step two page after valid checkout step one',
    ).toHaveURL(/.*checkout-step-two\.html/);

    const title = await checkoutStepTwoPage.getTitleText();
    expect(title, 'Checkout step two title should be "Checkout: Overview"').toBe(
      'Checkout: Overview',
    );
  });

  test('checkout step two shows all items that were in cart', async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
  }) => {
    await inventoryPage.addFirstItemToCart();
    await inventoryPage.addItemToCartByName('Sauce Labs Bike Light');
    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const itemsInCart = await cartPage.getItemsCount();

    await cartPage.startCheckout();
    await checkoutStepOnePage.waitForVisible();
    await checkoutStepOnePage.fillForm('Test', 'User', '12345');
    await checkoutStepOnePage.submit();
    await checkoutStepTwoPage.waitForVisible();

    const itemsInSummary = await checkoutStepTwoPage.getSummaryItemCount();

    expect(itemsInSummary, 'Checkout summary item count should match cart item count').toBe(
      itemsInCart,
    );

    const summaryNames = await checkoutStepTwoPage.getItemNames();

    expect(summaryNames, 'Summary should contain "Sauce Labs Backpack"').toContain(
      'Sauce Labs Backpack',
    );
    expect(summaryNames, 'Summary should contain "Sauce Labs Bike Light"').toContain(
      'Sauce Labs Bike Light',
    );
  });

  test('subtotal equals sum of item prices on checkout step two', async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
  }) => {
    await goToCheckoutStepTwoWithTwoItems(
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
    );

    const prices = await checkoutStepTwoPage.getItemPrices();
    const subtotal = await checkoutStepTwoPage.getSubtotal();

    const calculated = prices.reduce((acc, price) => acc + price, 0);

    expect(subtotal, 'Subtotal value should equal sum of item prices').toBeCloseTo(calculated, 2);
  });

  test('total equals subtotal plus tax on checkout step two', async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
  }) => {
    await goToCheckoutStepTwoWithTwoItems(
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
    );

    const subtotal = await checkoutStepTwoPage.getSubtotal();
    const tax = await checkoutStepTwoPage.getTax();
    const total = await checkoutStepTwoPage.getTotal();

    expect(total, 'Total value should be greater than subtotal').toBeGreaterThan(subtotal);
    expect(
      total,
      'Total value should equal subtotal plus tax within rounding tolerance',
    ).toBeCloseTo(subtotal + tax, 2);
  });

  test('cancel on checkout step two returns user to cart and keeps items', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
  }) => {
    await inventoryPage.addFirstItemToCart();
    await inventoryPage.addItemToCartByName('Sauce Labs Bike Light');
    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const itemsInCartBefore = await cartPage.getItemsCount();

    await cartPage.startCheckout();
    await checkoutStepOnePage.waitForVisible();
    await checkoutStepOnePage.fillForm('Test', 'User', '12345');
    await checkoutStepOnePage.submit();
    await checkoutStepTwoPage.waitForVisible();

    await checkoutStepTwoPage.cancel();

    await expect(
      page,
      'User should be back on cart page after cancelling checkout step two',
    ).toHaveURL(/.*cart\.html/);

    await cartPage.waitForVisible();
    const itemsInCartAfter = await cartPage.getItemsCount();

    expect(
      itemsInCartAfter,
      'Cart items should remain unchanged after cancelling checkout step two',
    ).toBe(itemsInCartBefore);
  });

  test('finish on checkout step two navigates to checkout complete page', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
  }) => {
    await goToCheckoutStepTwoWithSingleItem(
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
    );

    await checkoutStepTwoPage.finish();

    await expect(
      page,
      'User should be on checkout complete page after finishing checkout',
    ).toHaveURL(/.*checkout-complete\.html/);
  });

  test('user cannot access checkout step two without login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/checkout-step-two.html');

    await expect(
      page,
      'Anonymous user should not stay on checkout step two page when accessing it directly',
    ).not.toHaveURL(/.*checkout-step-two\.html/);
  });

  test('user cannot access checkout step two directly without completing step one', async ({
    page,
    loggedInInventoryPage,
  }) => {
    await loggedInInventoryPage.waitForVisible();

    await page.goto('/checkout-step-two.html');

    await expect(
      page,
      'User should not be able to land directly on checkout step two without step one',
    ).not.toHaveURL(/.*checkout-step-two\.html/);
  });

  test('checkout overview remains consistent after page reload', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
  }) => {
    await goToCheckoutStepTwoWithTwoItems(
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
    );

    const namesBefore = await checkoutStepTwoPage.getItemNames();
    const pricesBefore = await checkoutStepTwoPage.getItemPrices();
    const subtotalBefore = await checkoutStepTwoPage.getSubtotal();
    const taxBefore = await checkoutStepTwoPage.getTax();
    const totalBefore = await checkoutStepTwoPage.getTotal();

    await page.reload();
    await checkoutStepTwoPage.waitForVisible();

    const namesAfter = await checkoutStepTwoPage.getItemNames();
    const pricesAfter = await checkoutStepTwoPage.getItemPrices();
    const subtotalAfter = await checkoutStepTwoPage.getSubtotal();
    const taxAfter = await checkoutStepTwoPage.getTax();
    const totalAfter = await checkoutStepTwoPage.getTotal();

    expect(namesAfter, 'Item names should remain the same after reload').toEqual(namesBefore);
    expect(pricesAfter, 'Item prices should remain the same after reload').toEqual(pricesBefore);
    expect(subtotalAfter, 'Subtotal should remain the same after reload').toBeCloseTo(
      subtotalBefore,
      2,
    );
    expect(taxAfter, 'Tax should remain the same after reload').toBeCloseTo(taxBefore, 2);
    expect(totalAfter, 'Total should remain the same after reload').toBeCloseTo(totalBefore, 2);
  });

  test('removing item from cart before checkout is reflected on checkout step two', async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
  }) => {
    await inventoryPage.addFirstItemToCart();
    await inventoryPage.addItemToCartByName('Sauce Labs Bike Light');
    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const firstCartItem = cartPage.cartItems.first();
    await firstCartItem.getByRole('button', { name: 'Remove' }).click();

    const itemsInCart = await cartPage.getItemsCount();

    await cartPage.startCheckout();
    await checkoutStepOnePage.waitForVisible();
    await checkoutStepOnePage.fillForm('Test', 'User', '12345');
    await checkoutStepOnePage.submit();
    await checkoutStepTwoPage.waitForVisible();

    const itemsInSummary = await checkoutStepTwoPage.getSummaryItemCount();

    expect(itemsInSummary, 'Checkout summary should reflect updated cart items after removal').toBe(
      itemsInCart,
    );
  });

  test('checkout summary keeps the order in which products were added to the cart', async ({
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
  }) => {
    const itemsToAdd = [
      'Sauce Labs Bike Light',
      'Sauce Labs Bolt T-Shirt',
      'Sauce Labs Backpack',
    ];

    for (const name of itemsToAdd) {
      await inventoryPage.addItemToCartByName(name);
    }

    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    await cartPage.startCheckout();

    await checkoutStepOnePage.waitForVisible();
    await checkoutStepOnePage.fillForm('Order', 'Check', '32100');
    await checkoutStepOnePage.submit();
    await checkoutStepTwoPage.waitForVisible();

    const summaryNames = await checkoutStepTwoPage.getItemNames();

    expect(
      summaryNames,
      'Checkout overview should list products in the order they were added to the cart',
    ).toEqual(itemsToAdd);
  });

  test('checkout step two shows zero totals when checkout started with empty cart', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
  }) => {
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    await cartPage.startCheckout();

    await checkoutStepOnePage.waitForVisible();
    await checkoutStepOnePage.fillForm('Empty', 'Cart', '00000');
    await checkoutStepOnePage.submit();
    await checkoutStepTwoPage.waitForVisible();

    const summaryNames = await checkoutStepTwoPage.getItemNames();
    const subtotal = await checkoutStepTwoPage.getSubtotal();
    const tax = await checkoutStepTwoPage.getTax();
    const total = await checkoutStepTwoPage.getTotal();

    expect(summaryNames, 'No items should be shown in summary for empty cart checkout').toEqual([]);
    expect(subtotal, 'Subtotal should be zero for empty cart checkout').toBe(0);
    expect(tax, 'Tax should be zero for empty cart checkout').toBe(0);
    expect(total, 'Total should be zero for empty cart checkout').toBe(0);

    await checkoutStepTwoPage.finish();
    await expect(
      page,
      'Finishing checkout with empty cart should still navigate to complete page',
    ).toHaveURL(/.*checkout-complete\.html/);
  });
});
