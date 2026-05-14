// tests/ui/second-shop/auth-e2e.spec.ts
import { test, expect } from '../../../src/second-shop/fixtures/test-fixtures';
import type { SecondShopFixtures } from '../../../src/second-shop/fixtures/test-fixtures';

type AllFixtures = Pick<
  SecondShopFixtures,
  | 'secondHomePage'
  | 'secondNavBar'
  | 'secondSignUpModal'
  | 'secondLoginModal'
  | 'secondProductPage'
  | 'secondCartPage'
  | 'secondOrderModal'
>;

async function registerAndLogin(
  fixtures: Pick<AllFixtures, 'secondHomePage' | 'secondNavBar' | 'secondSignUpModal' | 'secondLoginModal'>,
): Promise<{ username: string; password: string }> {
  const { secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal } = fixtures;
  const username = `e2euser_${Date.now()}`;
  const password = 'e2epass123';
  await secondHomePage.open();
  await secondHomePage.waitForLoaded();
  await secondNavBar.openSignUpModal();
  await secondSignUpModal.waitForOpen();
  await secondSignUpModal.fill(username, password);
  await secondSignUpModal.signUpAndWaitForAlert();
  await secondNavBar.openLoginModal();
  await secondLoginModal.waitForOpen();
  await secondLoginModal.fill(username, password);
  await secondLoginModal.loginExpectingSuccess();
  return { username, password };
}

test.describe('Authenticated E2E flows', () => {
  test('full flow: register, login, add product to cart, place order, logout', {
    tag: ['@login', '@cart', '@e2e'],
  }, async ({
    secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    secondProductPage, secondCartPage, secondOrderModal,
  }) => {
    const { username } = await registerAndLogin({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    });

    expect(await secondNavBar.isLoggedIn()).toBe(true);
    const loggedName = await secondNavBar.getLoggedInUsername();
    expect(loggedName).toContain(username);

    await secondHomePage.open();
    await secondHomePage.waitForLoaded();
    const products = await secondHomePage.getVisibleProductNames();
    expect(products.length).toBeGreaterThan(0);

    await secondHomePage.openProductByName(products[0]);
    await secondProductPage.waitForVisible();
    const productName = await secondProductPage.getProductName();
    await secondProductPage.addToCart();

    await secondProductPage.goToCart();
    await secondCartPage.waitForVisible();
    const cartItems = await secondCartPage.getCartItemNames();
    expect(cartItems.some((item) => item.includes(productName) || productName.includes(item))).toBe(true);

    await secondCartPage.openPlaceOrderDialogIfPossible();
    await secondOrderModal.waitForOpen();
    await secondOrderModal.fillForm({
      name: 'E2E User',
      country: 'Poland',
      city: 'Warsaw',
      card: '4111111111111111',
      month: '12',
      year: '2030',
    });
    await secondOrderModal.submitPurchase();
    await secondOrderModal.waitForConfirmation();

    expect(await secondOrderModal.confirmationDialog.first().isVisible()).toBe(true);
    await secondOrderModal.confirmSuccess();

    await secondNavBar.logout();
    expect(await secondNavBar.isLoggedIn()).toBe(false);
  });

  test('logged-in user can browse multiple categories and return to cart', {
    tag: ['@login', '@cart', '@e2e'],
  }, async ({
    secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    secondProductPage, secondCartPage,
  }) => {
    await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });

    await secondHomePage.open();
    await secondHomePage.waitForLoaded();
    await secondHomePage.selectCategoryByName('Phones');
    const phones = await secondHomePage.getVisibleProductNames();
    expect(phones.length).toBeGreaterThan(0);

    await secondHomePage.openProductByName(phones[0]);
    await secondProductPage.waitForVisible();
    await secondProductPage.addToCart();

    await secondHomePage.open();
    await secondHomePage.waitForLoaded();
    await secondHomePage.selectCategoryByName('Laptops');
    const laptops = await secondHomePage.getVisibleProductNames();
    expect(laptops.length).toBeGreaterThan(0);

    await secondHomePage.openProductByName(laptops[0]);
    await secondProductPage.waitForVisible();
    await secondProductPage.addToCart();

    await secondProductPage.goToCart();
    await secondCartPage.waitForVisible();
    const cartItems = await secondCartPage.getCartItemNames();
    expect(cartItems.length).toBeGreaterThanOrEqual(2);
  });

  test('logged-in user can remove item from cart', {
    tag: ['@login', '@cart', '@regression'],
  }, async ({
    secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    secondProductPage, secondCartPage,
  }) => {
    await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });

    await secondCartPage.open();
    await secondCartPage.waitForVisible();
    await secondCartPage.clearCartIfPossible();

    await secondHomePage.open();
    await secondHomePage.waitForLoaded();
    const products = await secondHomePage.getVisibleProductNames();

    await secondHomePage.openProductByName(products[0]);
    await secondProductPage.waitForVisible();
    const firstProduct = await secondProductPage.getProductName();
    await secondProductPage.addToCart();

    await secondHomePage.open();
    await secondHomePage.waitForLoaded();
    await secondHomePage.openProductByName(products[1]);
    await secondProductPage.waitForVisible();
    await secondProductPage.addToCart();

    await secondProductPage.goToCart();
    await secondCartPage.waitForVisible();
    await secondCartPage.removeItemByName(firstProduct);

    const remaining = await secondCartPage.getCartItemNames();
    expect(remaining.some((item) => item.includes(firstProduct) || firstProduct.includes(item))).toBe(false);
  });

  test('navbar still shows logged-in state after navigating between pages', {
    tag: ['@login', '@smoke', '@e2e'],
  }, async ({
    secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    secondProductPage,
  }) => {
    const { username } = await registerAndLogin({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    });

    await secondHomePage.open();
    await secondHomePage.waitForLoaded();
    expect(await secondNavBar.isLoggedIn()).toBe(true);

    const products = await secondHomePage.getVisibleProductNames();
    await secondHomePage.openProductByName(products[0]);
    await secondProductPage.waitForVisible();

    expect(await secondNavBar.isLoggedIn()).toBe(true);
    const name = await secondNavBar.getLoggedInUsername();
    expect(name).toContain(username);
  });
});
