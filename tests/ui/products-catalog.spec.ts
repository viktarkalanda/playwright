// tests/ui/products-catalog.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';
import { productCatalog } from '../../src/data/products';

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
        expect(view.name).toBe(product.name);
        expect(view.price).toBeCloseTo(product.price, 2);
        expect(view.description).toBe(product.description);
        expect(view.isInCart).toBe(false);

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
        expect(view.name).toBe(product.name);
        expect(view.price).toBeCloseTo(product.price, 2);
        expect(view.description).toBe(product.description);
        expect(view.isInCart).toBe(false);
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
      expect(detailsView.price).toBeCloseTo(targetProduct.price, 2);

      await productDetailsPage.backToProducts();
      await loggedInInventoryPage.waitForVisible();

      const badgeCount = await loggedInInventoryPage.getCartBadgeCount();
      expect(badgeCount).toBe(1);

      await loggedInInventoryPage.openCart();
      await cartPage.waitForVisible();
      expect(await cartPage.hasItemWithName(targetProduct.name)).toBe(true);
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
      expect(detailsView.isInCart).toBe(true);

      await productDetailsPage.backToProducts();
      await loggedInInventoryPage.waitForVisible();

      const inventoryView = await loggedInInventoryPage.getProductViewByName(targetProduct.name);
      expect(inventoryView.isInCart).toBe(true);
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
      expect(detailsView.isInCart).toBe(false);

      await productDetailsPage.backToProducts();
      await loggedInInventoryPage.waitForVisible();

      const inventoryView = await loggedInInventoryPage.getProductViewByName(targetProduct.name);
      expect(inventoryView.isInCart).toBe(false);
      expect(await loggedInInventoryPage.getCartBadgeCount()).toBe(0);

      await loggedInInventoryPage.openCart();
      await cartPage.waitForVisible();
      expect(await cartPage.isEmpty()).toBe(true);
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
      expect(badgeCount).toBe(productCatalog.products.length);

      await loggedInInventoryPage.openCart();
      await cartPage.waitForVisible();
      const cartCount = await cartPage.getItemsCount();
      expect(cartCount).toBe(productCatalog.products.length);
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

      expect(await loggedInInventoryPage.getCartBadgeCount()).toBe(0);

      await loggedInInventoryPage.openCart();
      await cartPage.waitForVisible();
      expect(await cartPage.isEmpty()).toBe(true);
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
        expect(await loggedInInventoryPage.getCartBadgeCount()).toBe(1);

        await loggedInInventoryPage.openCart();
        await cartPage.waitForVisible();
        const names = await cartPage.getItemNames();
        expect(names).toEqual([product.name]);

        await cartPage.removeItemByName(product.name);
        expect(await cartPage.isEmpty()).toBe(true);

        await cartPage.continueShopping();
        await loggedInInventoryPage.waitForVisible();
      }
    },
  );
});
