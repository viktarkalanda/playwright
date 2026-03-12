// tests/ui/second-shop/product-details.spec.ts
import { test, expect } from '../../../src/second-shop/fixtures/test-fixtures';

test.describe('Product Details Page', () => {
  test.describe('Content', () => {
    test(
      'product name is visible and non-empty',
      { tag: ['@product', '@smoke'] },
      async ({ secondHomePage, secondProductPage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        const products = await secondHomePage.getVisibleProductNames();
        await secondHomePage.openProductByName(products[0]);
        await secondProductPage.waitForVisible();

        const name = await secondProductPage.getProductName();
        expect(name.trim()).not.toBe('');
      },
    );

    test(
      'product price is visible and contains a number',
      { tag: ['@product'] },
      async ({ secondHomePage, secondProductPage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        const products = await secondHomePage.getVisibleProductNames();
        await secondHomePage.openProductByName(products[0]);
        await secondProductPage.waitForVisible();

        const priceRaw = await secondProductPage.getProductPriceRaw();
        expect(priceRaw).toMatch(/\d+/);
      },
    );

    test(
      'Add to cart button is visible on product page',
      { tag: ['@product', '@cart'] },
      async ({ secondHomePage, secondProductPage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        const products = await secondHomePage.getVisibleProductNames();
        await secondHomePage.openProductByName(products[0]);
        await secondProductPage.waitForVisible();

        await expect(secondProductPage.addToCartButton).toBeVisible();
      },
    );

    test(
      'product name on details page matches the name clicked on home',
      { tag: ['@product'] },
      async ({ secondHomePage, secondProductPage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        const products = await secondHomePage.getVisibleProductNames();
        const expectedName = products[0];

        await secondHomePage.openProductByName(expectedName);
        await secondProductPage.waitForVisible();

        const actualName = await secondProductPage.getProductName();
        expect(actualName).toContain(expectedName);
      },
    );
  });

  test.describe('Cart link', () => {
    test(
      'cart link is visible on product page',
      { tag: ['@product', '@cart'] },
      async ({ secondHomePage, secondProductPage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        const products = await secondHomePage.getVisibleProductNames();
        await secondHomePage.openProductByName(products[0]);
        await secondProductPage.waitForVisible();

        await expect(secondProductPage.cartLink).toBeVisible();
      },
    );

    test(
      'cart link navigates to the cart page',
      { tag: ['@product', '@cart'] },
      async ({ secondHomePage, secondProductPage, secondCartPage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        const products = await secondHomePage.getVisibleProductNames();
        await secondHomePage.openProductByName(products[0]);
        await secondProductPage.waitForVisible();
        await secondProductPage.goToCart();

        await expect(secondCartPage.page).toHaveURL(/cart/);
      },
    );
  });
});
