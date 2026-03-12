// tests/ui/second-shop/navigation.spec.ts
import { test, expect } from '../../../src/second-shop/fixtures/test-fixtures';

test.describe('Navigation', () => {
  test.describe('Home page', () => {
    test(
      'page title is STORE',
      { tag: ['@smoke', '@navigation'] },
      async ({ secondHomePage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();
        await expect(secondHomePage.page).toHaveTitle(/STORE/i);
      },
    );

    test(
      'logo is visible after page load',
      { tag: ['@smoke', '@navigation'] },
      async ({ secondHomePage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();
        await expect(secondHomePage.logo).toBeVisible();
      },
    );

    test(
      'at least 3 category links are present',
      { tag: ['@navigation', '@categories'] },
      async ({ secondHomePage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();
        const count = await secondHomePage.categoryLinks.count();
        expect(count, 'Expected at least 3 category links (Phones, Laptops, Monitors)').toBeGreaterThanOrEqual(3);
      },
    );
  });

  test.describe('Category filtering', () => {
    test(
      'Phones category shows products',
      { tag: ['@navigation', '@categories'] },
      async ({ secondHomePage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();
        await secondHomePage.selectCategoryByName('Phones');
        const products = await secondHomePage.getVisibleProductNames();
        expect(products.length, 'Phones category should show at least one product').toBeGreaterThan(0);
      },
    );

    test(
      'Laptops category shows products',
      { tag: ['@navigation', '@categories'] },
      async ({ secondHomePage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();
        await secondHomePage.selectCategoryByName('Laptops');
        const products = await secondHomePage.getVisibleProductNames();
        expect(products.length, 'Laptops category should show at least one product').toBeGreaterThan(0);
      },
    );

    test(
      'Monitors category shows products',
      { tag: ['@navigation', '@categories'] },
      async ({ secondHomePage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();
        await secondHomePage.selectCategoryByName('Monitors');
        const products = await secondHomePage.getVisibleProductNames();
        expect(products.length, 'Monitors category should show at least one product').toBeGreaterThan(0);
      },
    );

    test(
      'each category shows a different set of products',
      { tag: ['@navigation', '@categories'] },
      async ({ secondHomePage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        await secondHomePage.selectCategoryByName('Phones');
        const phones = await secondHomePage.getVisibleProductNames();

        await secondHomePage.selectCategoryByName('Laptops');
        const laptops = await secondHomePage.getVisibleProductNames();

        await secondHomePage.selectCategoryByName('Monitors');
        const monitors = await secondHomePage.getVisibleProductNames();

        expect(phones).not.toEqual(laptops);
        expect(laptops).not.toEqual(monitors);
      },
    );
  });

  test.describe('Product navigation', () => {
    test(
      'opening a product and navigating back returns to home page',
      { tag: ['@navigation'] },
      async ({ secondHomePage, secondProductPage }) => {
        await secondHomePage.open();
        await secondHomePage.waitForLoaded();

        const products = await secondHomePage.getVisibleProductNames();
        await secondHomePage.openProductByName(products[0]);
        await secondProductPage.waitForVisible();

        await secondHomePage.page.goBack();
        await secondHomePage.waitForLoaded();

        const productsAfterBack = await secondHomePage.getVisibleProductNames();
        expect(productsAfterBack.length).toBeGreaterThan(0);
      },
    );
  });
});
