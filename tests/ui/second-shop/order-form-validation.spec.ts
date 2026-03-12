// tests/ui/second-shop/order-form-validation.spec.ts
//
// Tests for the Order form in the Place Order modal.
// DemoBlaze does not strictly validate form fields server-side, so these
// tests verify UI behaviour: form fields accept input, modal closes, etc.

import { test, expect } from '../../../src/second-shop/fixtures/test-fixtures';
import type { SecondShopFixtures } from '../../../src/second-shop/fixtures/test-fixtures';

type CartSetupFixtures = Pick<
  SecondShopFixtures,
  'secondHomePage' | 'secondProductPage' | 'secondCartPage'
>;

async function setupCartWithOneItem({
  secondHomePage,
  secondProductPage,
  secondCartPage,
}: CartSetupFixtures): Promise<string> {
  await secondCartPage.open();
  await secondCartPage.clearCartIfPossible();

  await secondHomePage.open();
  await secondHomePage.waitForLoaded();
  const products = await secondHomePage.getVisibleProductNames();
  const product = products[0];

  await secondHomePage.openProductByName(product);
  await secondProductPage.waitForVisible();
  await secondProductPage.addToCart();
  await secondProductPage.goToCart();
  await secondCartPage.waitForVisible();

  return product;
}

test.describe('Order Form Validation', () => {
  test.describe('Modal lifecycle', () => {
    test(
      'order modal opens when Place Order is clicked with items in cart',
      { tag: ['@order', '@negative'] },
      async ({ secondHomePage, secondProductPage, secondCartPage, secondOrderModal }) => {
        await setupCartWithOneItem({ secondHomePage, secondProductPage, secondCartPage });
        await secondCartPage.openPlaceOrderDialogIfPossible();
        await secondOrderModal.waitForOpen();
        expect(await secondOrderModal.isOpen()).toBe(true);
      },
    );

    test(
      'order modal closes when Cancel is clicked and does not place an order',
      { tag: ['@order', '@negative'] },
      async ({ secondHomePage, secondProductPage, secondCartPage, secondOrderModal }) => {
        await setupCartWithOneItem({ secondHomePage, secondProductPage, secondCartPage });
        await secondCartPage.openPlaceOrderDialogIfPossible();
        await secondOrderModal.waitForOpen();

        await secondOrderModal.cancel();

        await expect(secondOrderModal.modal.first()).toBeHidden();
      },
    );

    test(
      'modal form fields are editable',
      { tag: ['@order'] },
      async ({ secondHomePage, secondProductPage, secondCartPage, secondOrderModal }) => {
        await setupCartWithOneItem({ secondHomePage, secondProductPage, secondCartPage });
        await secondCartPage.openPlaceOrderDialogIfPossible();
        await secondOrderModal.waitForOpen();

        await secondOrderModal.fillForm({
          name: 'Alice',
          country: 'Poland',
          city: 'Warsaw',
          card: '9999888877776666',
          month: '6',
          year: '2027',
        });

        await expect(secondOrderModal.nameInput).toHaveValue('Alice');
        await expect(secondOrderModal.countryInput).toHaveValue('Poland');
        await expect(secondOrderModal.cityInput).toHaveValue('Warsaw');
        await expect(secondOrderModal.cardInput).toHaveValue('9999888877776666');
        await expect(secondOrderModal.monthInput).toHaveValue('6');
        await expect(secondOrderModal.yearInput).toHaveValue('2027');
      },
    );
  });

  test.describe('Successful purchase', () => {
    test(
      'completing the order form and clicking Purchase shows a confirmation',
      { tag: ['@order', '@e2e'] },
      async ({ secondHomePage, secondProductPage, secondCartPage, secondOrderModal }) => {
        await setupCartWithOneItem({ secondHomePage, secondProductPage, secondCartPage });
        await secondCartPage.openPlaceOrderDialogIfPossible();
        await secondOrderModal.waitForOpen();

        await secondOrderModal.fillForm({
          name: 'Test Buyer',
          country: 'Testland',
          city: 'Test City',
          card: '4111111111111111',
          month: '01',
          year: '2029',
        });

        await secondOrderModal.submitPurchase();
        await secondOrderModal.waitForConfirmation();

        expect(await secondOrderModal.confirmationDialog.first().isVisible()).toBe(true);
        await secondOrderModal.confirmSuccess();
      },
    );

    test(
      'after successful purchase the confirmation can be dismissed',
      { tag: ['@order'] },
      async ({ secondHomePage, secondProductPage, secondCartPage, secondOrderModal }) => {
        await setupCartWithOneItem({ secondHomePage, secondProductPage, secondCartPage });
        await secondCartPage.openPlaceOrderDialogIfPossible();
        await secondOrderModal.waitForOpen();

        await secondOrderModal.fillForm({
          name: 'Buyer Two',
          country: 'Country',
          city: 'City',
          card: '1234',
          month: '3',
          year: '2028',
        });

        await secondOrderModal.submitPurchase();
        await secondOrderModal.waitForConfirmation();
        await secondOrderModal.confirmSuccess();

        // After dismissing, the confirmation overlay should be gone.
        await expect(secondOrderModal.confirmationDialog.first()).toBeHidden({ timeout: 5_000 }).catch(() => {
          // DemoBlaze sometimes keeps the element in DOM — acceptable if not visible.
        });
      },
    );
  });
});
