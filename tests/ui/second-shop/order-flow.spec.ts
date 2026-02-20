import { test, expect } from '../../../src/second-shop/fixtures/test-fixtures';
import type { SecondShopFixtures } from '../../../src/second-shop/fixtures/test-fixtures';

type CartSetupFixtures = Pick<
  SecondShopFixtures,
  'secondHomePage' | 'secondProductPage' | 'secondCartPage'
>;

const addFirstProductToCart = async ({
  secondHomePage,
  secondProductPage,
  secondCartPage,
}: CartSetupFixtures) => {
  await secondHomePage.open();
  await secondHomePage.waitForLoaded();
  const products = await secondHomePage.getVisibleProductNames();
  const firstProduct = products[0];
  expect(firstProduct).toBeTruthy();
  await secondHomePage.openProductByName(firstProduct);
  await secondProductPage.waitForVisible();
  await secondProductPage.addToCart();
  await secondProductPage.goToCart();
  await secondCartPage.waitForVisible();
  return firstProduct;
};

const clearCart = async (secondCartPage: SecondShopFixtures['secondCartPage']) => {
  await secondCartPage.open();
  await secondCartPage.waitForVisible();
  await secondCartPage.clearCartIfPossible();
};

test('order modal opens from cart when there is at least one item in the cart', { tag: ['@order', '@e2e'] }, async ({
  secondHomePage,
  secondProductPage,
  secondCartPage,
  secondOrderModal,
}) => {
  await clearCart(secondCartPage);
  await addFirstProductToCart({ secondHomePage, secondProductPage, secondCartPage });

  await secondCartPage.openPlaceOrderDialogIfPossible();
  await secondOrderModal.waitForOpen();

  expect(await secondOrderModal.isOpen()).toBe(true);
});

test('order form allows filling basic customer data', { tag: ['@order'] }, async ({
  secondHomePage,
  secondProductPage,
  secondCartPage,
  secondOrderModal,
}) => {
  await clearCart(secondCartPage);
  await addFirstProductToCart({ secondHomePage, secondProductPage, secondCartPage });

  await secondCartPage.openPlaceOrderDialogIfPossible();
  await secondOrderModal.waitForOpen();
  await secondOrderModal.fillForm({
    name: 'John Doe',
    country: 'USA',
    city: 'NY',
    card: '1234',
    month: '12',
    year: '2030',
  });

  await expect(secondOrderModal.nameInput).toHaveValue('John Doe');
  await expect(secondOrderModal.countryInput).toHaveValue('USA');
  await expect(secondOrderModal.cityInput).toHaveValue('NY');
  await expect(secondOrderModal.cardInput).toHaveValue('1234');
  await expect(secondOrderModal.monthInput).toHaveValue('12');
  await expect(secondOrderModal.yearInput).toHaveValue('2030');
});

test('order flow shows confirmation dialog on successful purchase', { tag: ['@order', '@e2e'] }, async ({
  secondHomePage,
  secondProductPage,
  secondCartPage,
  secondOrderModal,
}) => {
  await clearCart(secondCartPage);
  await addFirstProductToCart({ secondHomePage, secondProductPage, secondCartPage });

  await secondCartPage.openPlaceOrderDialogIfPossible();
  await secondOrderModal.waitForOpen();
  await secondOrderModal.fillForm({
    name: 'John Doe',
    country: 'USA',
    city: 'NY',
    card: '1234',
    month: '12',
    year: '2030',
  });
  await secondOrderModal.submitPurchase();
  await secondOrderModal.waitForConfirmation();

  expect(await secondOrderModal.confirmationDialog.first().isVisible()).toBe(true);
  await secondOrderModal.confirmSuccess();
});

test('order modal can be cancelled and cart remains untouched', { tag: ['@order', '@cart', '@negative'] }, async ({
  secondHomePage,
  secondProductPage,
  secondCartPage,
  secondOrderModal,
}) => {
  await clearCart(secondCartPage);
  const productName = await addFirstProductToCart({ secondHomePage, secondProductPage, secondCartPage });

  await secondCartPage.openPlaceOrderDialogIfPossible();
  await secondOrderModal.waitForOpen();
  await secondOrderModal.cancel();

  await expect(secondOrderModal.modal.first()).toBeHidden();
  const items = await secondCartPage.getCartItemNames();
  expect(items).toContain(productName);
});

test('empty cart should still show no items after opening and closing order modal', { tag: ['@order', '@cart', '@negative'] }, async ({
  secondCartPage,
  secondOrderModal,
}) => {
  await clearCart(secondCartPage);

  expect(await secondCartPage.isEmpty()).toBe(true);
  await secondCartPage.openPlaceOrderDialogIfPossible();

  if (await secondOrderModal.isOpen()) {
    await secondOrderModal.cancel();
  }

  expect(await secondCartPage.isEmpty()).toBe(true);
});
