// tests/ui/products-catalog.spec.ts
import { test, expect } from '../../../src/saucedemo/fixtures/test-fixtures';
import { productCatalog } from '../../../src/data/products';

test.describe('Products catalog consistency', () => {
  test.beforeEach(async ({ loggedInInventoryPage, headerMenu }) => {
    await loggedInInventoryPage.waitForVisible();
    await headerMenu.clickResetAppState();
    await headerMenu.closeMenu();
    await loggedInInventoryPage.waitForVisible();
  });

  test(
    'inventory shows all products from catalog',
    { tag: ['@inventory', '@catalog', '@smoke'] },
    async ({ loggedInInventoryPage }) => {
      const visibleNames = await loggedInInventoryPage.getAllItemNames();
      const catalogNames = productCatalog.products.map((product) => product.name);

      expect(visibleNames.length, 'Inventory should show every product from the catalog').toBe(
        catalogNames.length,
      );
      for (const expectedName of catalogNames) {
        expect(visibleNames, `Inventory should list product named ${expectedName}`).toContain(
          expectedName,
        );
      }
    },
  );

  test(
    'product details match catalog definition',
    { tag: ['@details', '@catalog'] },
    async ({ loggedInInventoryPage, productDetailsPage }) => {
      for (const product of productCatalog.products) {
        await loggedInInventoryPage.openItemDetailsByName(product.name);
        await productDetailsPage.waitForVisible();

        const view = await productDetailsPage.getView();
        expect(view.name, `Details page name should match catalog name for "${product.name}"`).toBe(
          product.name,
        );
        expect(
          view.price,
          `Details page price should match catalog price for "${product.name}"`,
        ).toBeCloseTo(product.price, 2);
        expect(
          view.description,
          `Details page description should match catalog for "${product.name}"`,
        ).toBe(product.description);
        expect(
          view.isInCart,
          `"${product.name}" should not be in cart at the start of the details check`,
        ).toBe(false);

        await productDetailsPage.backToProducts();
        await loggedInInventoryPage.waitForVisible();
      }
    },
  );

  test(
    'inventory cards match catalog definition',
    { tag: ['@inventory', '@catalog'] },
    async ({ loggedInInventoryPage }) => {
      for (const product of productCatalog.products) {
        const view = await loggedInInventoryPage.getProductViewByName(product.name);
        expect(view.name, `Inventory card name should match catalog for "${product.name}"`).toBe(
          product.name,
        );
        expect(
          view.price,
          `Inventory card price should match catalog for "${product.name}"`,
        ).toBeCloseTo(product.price, 2);
        expect(
          view.description,
          `Inventory card description should match catalog for "${product.name}"`,
        ).toBe(product.description);
        expect(
          view.isInCart,
          `"${product.name}" should not be in cart on a fresh inventory load`,
        ).toBe(false);
      }
    },
  );

  test(
    'adding from inventory reflects on details and cart',
    { tag: ['@cart', '@details', '@catalog'] },
    async ({ loggedInInventoryPage, productDetailsPage, cartPage }) => {
      const targetProduct = productCatalog.products[0];

      await loggedInInventoryPage.addProductToCartByName(targetProduct.name);
      await loggedInInventoryPage.openItemDetailsByName(targetProduct.name);
      await productDetailsPage.waitForVisible();

      const detailsView = await productDetailsPage.getView();
      expect(detailsView.isInCart, 'Details page should reflect cart state').toBe(true);
      expect(
        detailsView.price,
        `Details page price should still match catalog after adding "${targetProduct.name}" to cart`,
      ).toBeCloseTo(targetProduct.price, 2);

      await productDetailsPage.backToProducts();
      await loggedInInventoryPage.waitForVisible();

      const badgeCount = await loggedInInventoryPage.getCartBadgeCount();
      expect(badgeCount, 'Cart badge should show 1 after adding one product').toBe(1);

      await loggedInInventoryPage.openCart();
      await cartPage.waitForVisible();
      expect(
        await cartPage.hasItemWithName(targetProduct.name),
        `Cart should contain "${targetProduct.name}" after it was added from inventory`,
      ).toBe(true);
      await cartPage.continueShopping();
      await loggedInInventoryPage.waitForVisible();
    },
  );

  test(
    'adding from details updates inventory state',
    { tag: ['@cart', '@details', '@catalog'] },
    async ({ loggedInInventoryPage, productDetailsPage }) => {
      const targetProduct = productCatalog.products[1];

      await loggedInInventoryPage.openItemDetailsByName(targetProduct.name);
      await productDetailsPage.waitForVisible();
      await productDetailsPage.addToCart();

      const detailsView = await productDetailsPage.getView();
      expect(
        detailsView.isInCart,
        'Details page should show item as in-cart after adding from details',
      ).toBe(true);

      await productDetailsPage.backToProducts();
      await loggedInInventoryPage.waitForVisible();

      const inventoryView = await loggedInInventoryPage.getProductViewByName(targetProduct.name);
      expect(
        inventoryView.isInCart,
        `Inventory card for "${targetProduct.name}" should show in-cart state after adding from details`,
      ).toBe(true);
    },
  );

  test(
    'removing from details clears inventory and cart state',
    { tag: ['@cart', '@details', '@catalog'] },
    async ({ loggedInInventoryPage, productDetailsPage, cartPage }) => {
      const targetProduct = productCatalog.products[2];

      await loggedInInventoryPage.addProductToCartByName(targetProduct.name);
      await loggedInInventoryPage.openItemDetailsByName(targetProduct.name);
      await productDetailsPage.waitForVisible();

      await productDetailsPage.removeFromCart();
      const detailsView = await productDetailsPage.getView();
      expect(
        detailsView.isInCart,
        'Details page should show item as not-in-cart after removing from details',
      ).toBe(false);

      await productDetailsPage.backToProducts();
      await loggedInInventoryPage.waitForVisible();

      const inventoryView = await loggedInInventoryPage.getProductViewByName(targetProduct.name);
      expect(
        inventoryView.isInCart,
        `Inventory card for "${targetProduct.name}" should show not-in-cart after removal`,
      ).toBe(false);
      expect(
        await loggedInInventoryPage.getCartBadgeCount(),
        'Cart badge should return to zero after removing the only item',
      ).toBe(0);

      await loggedInInventoryPage.openCart();
      await cartPage.waitForVisible();
      expect(
        await cartPage.isEmpty(),
        'Cart page should be empty after removing the only item via details',
      ).toBe(true);
      await cartPage.continueShopping();
      await loggedInInventoryPage.waitForVisible();
    },
  );

  test(
    'adding all products to cart updates badge and cart count',
    { tag: ['@cart', '@catalog', '@bulk'] },
    async ({ loggedInInventoryPage, cartPage }) => {
      await loggedInInventoryPage.addAllProductsToCart();

      const badgeCount = await loggedInInventoryPage.getCartBadgeCount();
      expect(
        badgeCount,
        `Cart badge should equal the total catalog size (${productCatalog.products.length}) after adding all products`,
      ).toBe(productCatalog.products.length);

      await loggedInInventoryPage.openCart();
      await cartPage.waitForVisible();
      const cartCount = await cartPage.getItemsCount();
      expect(
        cartCount,
        `Cart should contain all ${productCatalog.products.length} catalog products`,
      ).toBe(productCatalog.products.length);
      await cartPage.continueShopping();
      await loggedInInventoryPage.waitForVisible();
    },
  );

  test(
    'removing all products leaves cart empty',
    { tag: ['@cart', '@catalog', '@bulk'] },
    async ({ loggedInInventoryPage, cartPage }) => {
      await loggedInInventoryPage.addAllProductsToCart();
      await loggedInInventoryPage.removeAllProductsFromCart();

      expect(
        await loggedInInventoryPage.getCartBadgeCount(),
        'Cart badge should be zero after removing all products',
      ).toBe(0);

      await loggedInInventoryPage.openCart();
      await cartPage.waitForVisible();
      expect(
        await cartPage.isEmpty(),
        'Cart page should be empty after removing all catalog products',
      ).toBe(true);
      await cartPage.continueShopping();
      await loggedInInventoryPage.waitForVisible();
    },
  );

  test(
    'each product can be added and removed independently',
    { tag: ['@cart', '@catalog'] },
    async ({ loggedInInventoryPage, cartPage, headerMenu }) => {
      for (const product of productCatalog.products) {
        await headerMenu.clickResetAppState();
        await headerMenu.closeMenu();
        await loggedInInventoryPage.waitForVisible();

        await loggedInInventoryPage.addProductToCartByName(product.name);
        expect(
          await loggedInInventoryPage.getCartBadgeCount(),
          `Cart badge should be 1 after adding only "${product.name}"`,
        ).toBe(1);

        await loggedInInventoryPage.openCart();
        await cartPage.waitForVisible();
        const names = await cartPage.getItemNames();
        expect(names, `Cart should contain only "${product.name}" when it is the sole added item`).toEqual(
          [product.name],
        );

        await cartPage.removeItemByName(product.name);
        expect(
          await cartPage.isEmpty(),
          `Cart should be empty after removing "${product.name}"`,
        ).toBe(true);

        await cartPage.continueShopping();
        await loggedInInventoryPage.waitForVisible();
      }
    },
  );
});
