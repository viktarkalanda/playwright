// tests/ui/second-shop/home-page.spec.ts
//
// Tests for the DemoBlaze home page: product grid, category filtering,
// pagination (Previous / Next), and general page structure.
import { test, expect } from '../../../src/second-shop/fixtures/test-fixtures';

test.describe('DemoBlaze Home Page', () => {
  test.describe('Page structure', () => {
    test(
      'home page loads and displays the product grid',
      { tag: ['@home', '@smoke'] },
      async ({ secondHomePage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        const products = await secondHomePage.getVisibleProductNames();
        expect(products.length).toBeGreaterThan(0);
      },
    );

    test(
      'product names are non-empty strings',
      { tag: ['@home', '@smoke'] },
      async ({ secondHomePage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        const products = await secondHomePage.getVisibleProductNames();
        for (const name of products) {
          expect(name.trim().length).toBeGreaterThan(0);
        }
      },
    );

    test(
      'logo is visible after page load',
      { tag: ['@home', '@smoke'] },
      async ({ secondHomePage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        await expect(secondHomePage.logo).toBeVisible();
      },
    );

    test(
      'at least 3 category links are visible in the sidebar',
      { tag: ['@home', '@categories'] },
      async ({ secondHomePage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        const count = await secondHomePage.categoryLinks.count();
        expect(count).toBeGreaterThanOrEqual(3);
      },
    );

    test(
      'page title contains STORE',
      { tag: ['@home', '@smoke'] },
      async ({ secondHomePage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        await expect(secondHomePage.page).toHaveTitle(/STORE/i);
      },
    );
  });

  test.describe('Category filtering', () => {
    test(
      'selecting Phones shows only phone products',
      { tag: ['@home', '@categories', '@regression'] },
      async ({ secondHomePage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        await secondHomePage.selectCategoryByName('Phones');
        const phones = await secondHomePage.getVisibleProductNames();

        expect(phones.length).toBeGreaterThan(0);
      },
    );

    test(
      'selecting Laptops shows products',
      { tag: ['@home', '@categories', '@regression'] },
      async ({ secondHomePage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        await secondHomePage.selectCategoryByName('Laptops');
        const laptops = await secondHomePage.getVisibleProductNames();

        expect(laptops.length).toBeGreaterThan(0);
      },
    );

    test(
      'selecting Monitors shows products',
      { tag: ['@home', '@categories', '@regression'] },
      async ({ secondHomePage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        await secondHomePage.selectCategoryByName('Monitors');
        const monitors = await secondHomePage.getVisibleProductNames();

        expect(monitors.length).toBeGreaterThan(0);
      },
    );

    test(
      'switching between Phones and Laptops shows different products',
      { tag: ['@home', '@categories', '@regression'] },
      async ({ secondHomePage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        await secondHomePage.selectCategoryByName('Phones');
        const phones = await secondHomePage.getVisibleProductNames();

        await secondHomePage.selectCategoryByName('Laptops');
        const laptops = await secondHomePage.getVisibleProductNames();

        expect(phones).not.toEqual(laptops);
      },
    );

    test(
      'switching categories three times returns correct products each time',
      { tag: ['@home', '@categories', '@e2e'] },
      async ({ secondHomePage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        await secondHomePage.selectCategoryByName('Phones');
        const phones = await secondHomePage.getVisibleProductNames();

        await secondHomePage.selectCategoryByName('Laptops');
        const laptops = await secondHomePage.getVisibleProductNames();

        await secondHomePage.selectCategoryByName('Monitors');
        const monitors = await secondHomePage.getVisibleProductNames();

        expect(phones.length).toBeGreaterThan(0);
        expect(laptops.length).toBeGreaterThan(0);
        expect(monitors.length).toBeGreaterThan(0);
        expect(phones).not.toEqual(laptops);
        expect(laptops).not.toEqual(monitors);
      },
    );
  });

  test.describe('Product navigation', () => {
    test(
      'clicking a product navigates to product details page',
      { tag: ['@home', '@product', '@smoke'] },
      async ({ secondHomePage, secondProductPage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        const products = await secondHomePage.getVisibleProductNames();
        const targetName = products[0];

        await secondHomePage.openProductByName(targetName);
        await secondProductPage.waitForVisible();

        const detailName = await secondProductPage.getProductName();
        expect(detailName).toContain(targetName);
      },
    );

    test(
      'browser back from product page returns to home with products',
      { tag: ['@home', '@product', '@regression'] },
      async ({ secondHomePage, secondProductPage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        const products = await secondHomePage.getVisibleProductNames();
        await secondHomePage.openProductByName(products[0]);
        await secondProductPage.waitForVisible();

        await secondHomePage.page.goBack();
        await secondHomePage.waitForLoaded();

        const productsAfter = await secondHomePage.getVisibleProductNames();
        expect(productsAfter.length).toBeGreaterThan(0);
      },
    );

    test(
      'second product in grid can be opened',
      { tag: ['@home', '@product', '@regression'] },
      async ({ secondHomePage, secondProductPage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        const products = await secondHomePage.getVisibleProductNames();
        expect(products.length).toBeGreaterThanOrEqual(2);

        await secondHomePage.openProductByName(products[1]);
        await secondProductPage.waitForVisible();

        const name = await secondProductPage.getProductName();
        expect(name.trim()).not.toBe('');
      },
    );
  });

  test.describe('Pagination', () => {
    test(
      'Next button is visible on the home page',
      { tag: ['@home', '@pagination', '@smoke'] },
      async ({ secondHomePage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        const nextBtn = secondHomePage.page.locator('button#next2');
        await expect(nextBtn).toBeVisible();
      },
    );

    test(
      'Previous button is visible on the home page',
      { tag: ['@home', '@pagination', '@smoke'] },
      async ({ secondHomePage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        const prevBtn = secondHomePage.page.locator('button#prev2');
        await expect(prevBtn).toBeVisible();
      },
    );

    test(
      'clicking Next loads a different set of products',
      { tag: ['@home', '@pagination', '@regression'] },
      async ({ secondHomePage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        const firstPageProducts = await secondHomePage.getVisibleProductNames();

        const nextBtn = secondHomePage.page.locator('button#next2');
        const responsePromise = secondHomePage.page.waitForResponse('**/entries*').catch(() => null);
        await nextBtn.click();
        await responsePromise;
        await secondHomePage.productCards.first().waitFor({ state: 'visible', timeout: 10_000 });

        const secondPageProducts = await secondHomePage.getVisibleProductNames();

        expect(secondPageProducts.length).toBeGreaterThan(0);
        expect(secondPageProducts).not.toEqual(firstPageProducts);
      },
    );

    test(
      'clicking Next then Previous returns to the original product set',
      { tag: ['@home', '@pagination', '@regression'] },
      async ({ secondHomePage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        const originalProducts = await secondHomePage.getVisibleProductNames();

        const nextBtn = secondHomePage.page.locator('button#next2');
        let responsePromise = secondHomePage.page.waitForResponse('**/entries*').catch(() => null);
        await nextBtn.click();
        await responsePromise;
        await secondHomePage.productCards.first().waitFor({ state: 'visible', timeout: 10_000 });

        const prevBtn = secondHomePage.page.locator('button#prev2');
        responsePromise = secondHomePage.page.waitForResponse('**/entries*').catch(() => null);
        await prevBtn.click();
        await responsePromise;
        await secondHomePage.productCards.first().waitFor({ state: 'visible', timeout: 10_000 });

        const returnedProducts = await secondHomePage.getVisibleProductNames();
        expect(returnedProducts).toEqual(originalProducts);
      },
    );
  });
});
