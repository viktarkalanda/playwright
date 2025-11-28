// tests/ui/product-details.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';
import type { InventoryPage } from '../../src/pages/InventoryPage';
import type { ProductDetailsPage } from '../../src/pages/ProductDetailsPage';

const PRODUCT_NAME = 'Sauce Labs Backpack';

async function openDetailsForBackpack(
  inventoryPage: InventoryPage,
  productDetailsPage: ProductDetailsPage,
): Promise<void> {
  await inventoryPage.openItemDetailsByName(PRODUCT_NAME);
  await productDetailsPage.waitForVisible();
}

test.describe('Product details page', () => {
  test.beforeEach(async ({ loggedInInventoryPage }) => {
    await loggedInInventoryPage.waitForVisible();
  });

  test('user can open product details from inventory by clicking product name', async ({
    page,
    inventoryPage,
    productDetailsPage,
  }) => {
    await openDetailsForBackpack(inventoryPage, productDetailsPage);

    await expect(
      page,
      'URL should contain inventory-item.html when product details are opened',
    ).toHaveURL(/.*inventory-item\.html/);

    const detailsName = await productDetailsPage.getProductName();
    expect(detailsName, 'Product name on details page should match expected product name').toBe(
      PRODUCT_NAME,
    );
  });

  test('product price on details page matches price on inventory page', async ({
    inventoryPage,
    productDetailsPage,
  }) => {
    const inventoryPrice = await inventoryPage.getItemPriceByName(PRODUCT_NAME);

    await openDetailsForBackpack(inventoryPage, productDetailsPage);

    const detailsPrice = await productDetailsPage.getProductPrice();

    expect(
      detailsPrice,
      'Product price on details page should match product price on inventory page',
    ).toBeCloseTo(inventoryPrice, 2);
  });

  test('product description on details page is not empty', async ({
    inventoryPage,
    productDetailsPage,
  }) => {
    await openDetailsForBackpack(inventoryPage, productDetailsPage);

    const description = await productDetailsPage.getProductDescription();

    expect(description, 'Product description on details page should not be empty').not.toBe('');
  });

  test('back to products navigates user back to inventory', async ({
    page,
    inventoryPage,
    productDetailsPage,
  }) => {
    await openDetailsForBackpack(inventoryPage, productDetailsPage);

    await productDetailsPage.backToProducts();
    await inventoryPage.waitForVisible();

    await expect(page, 'Back to products should navigate user back to inventory page').toHaveURL(
      /.*inventory\.html/,
    );
  });

  test('"Add to cart" button adds product and changes to "Remove" on details page', async ({
    inventoryPage,
    productDetailsPage,
  }) => {
    await openDetailsForBackpack(inventoryPage, productDetailsPage);

    const addVisibleBefore = await productDetailsPage.isAddToCartVisible();
    expect(
      addVisibleBefore,
      '"Add to cart" button should be visible when product is not in cart yet',
    ).toBe(true);

    await productDetailsPage.addToCart();

    const addVisibleAfter = await productDetailsPage.isAddToCartVisible();
    const removeVisibleAfter = await productDetailsPage.isRemoveButtonVisible();

    expect(addVisibleAfter, '"Add to cart" button should not be visible after clicking it').toBe(
      false,
    );
    expect(
      removeVisibleAfter,
      '"Remove" button should be visible after product is added to cart',
    ).toBe(true);
  });

  test('adding product to cart from details page updates cart badge and cart content', async ({
    inventoryPage,
    cartPage,
    productDetailsPage,
  }) => {
    const initialBadge = await inventoryPage.getCartBadgeCount();
    await openDetailsForBackpack(inventoryPage, productDetailsPage);

    await productDetailsPage.addToCart();

    const badgeAfterAdd = await inventoryPage.getCartBadgeCount();
    expect(
      badgeAfterAdd,
      'Cart badge count should increase by 1 after adding product from details page',
    ).toBe(initialBadge + 1);

    await productDetailsPage.backToProducts();
    await inventoryPage.waitForVisible();

    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const hasBackpackInCart = await cartPage.hasItemWithName(PRODUCT_NAME);

    expect(hasBackpackInCart, 'Product added from details page should appear in cart').toBe(true);
  });

  test('removing product from cart on details page clears it from cart', async ({
    inventoryPage,
    cartPage,
    productDetailsPage,
  }) => {
    await inventoryPage.addItemToCartByName(PRODUCT_NAME);

    await openDetailsForBackpack(inventoryPage, productDetailsPage);

    const removeVisibleBefore = await productDetailsPage.isRemoveButtonVisible();
    expect(
      removeVisibleBefore,
      '"Remove" button should be visible when product is already in cart',
    ).toBe(true);

    await productDetailsPage.removeFromCart();

    const addVisibleAfter = await productDetailsPage.isAddToCartVisible();
    expect(
      addVisibleAfter,
      '"Add to cart" button should be visible after removing product from cart on details page',
    ).toBe(true);

    await productDetailsPage.backToProducts();
    await inventoryPage.waitForVisible();

    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const hasBackpackInCart = await cartPage.hasItemWithName(PRODUCT_NAME);

    expect(
      hasBackpackInCart,
      'Product removed on details page should no longer be present in cart',
    ).toBe(false);
  });

  test('product details page state is preserved after reload', async ({
    page,
    inventoryPage,
    productDetailsPage,
  }) => {
    await openDetailsForBackpack(inventoryPage, productDetailsPage);
    await productDetailsPage.addToCart();

    const nameBefore = await productDetailsPage.getProductName();
    const priceBefore = await productDetailsPage.getProductPrice();
    const removeVisibleBefore = await productDetailsPage.isRemoveButtonVisible();

    await page.reload();
    await productDetailsPage.waitForVisible();

    const nameAfter = await productDetailsPage.getProductName();
    const priceAfter = await productDetailsPage.getProductPrice();
    const removeVisibleAfter = await productDetailsPage.isRemoveButtonVisible();

    expect(nameAfter, 'Product name should remain the same after reload on details page').toBe(
      nameBefore,
    );
    expect(
      priceAfter,
      'Product price should remain the same after reload on details page',
    ).toBeCloseTo(priceBefore, 2);
    expect(
      removeVisibleAfter,
      '"Remove" button should still be visible after reload when product is in cart',
    ).toBe(removeVisibleBefore);
  });

  test('user cannot access product details page without login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/inventory-item.html?id=4');

    await expect(
      page,
      'Anonymous user should not stay on product details page when accessing it directly',
    ).not.toHaveURL(/.*inventory-item\.html/);
  });

  test('user can open details for different products from inventory', async ({
    inventoryPage,
    productDetailsPage,
  }) => {
    const secondProductName = 'Sauce Labs Bike Light';

    await inventoryPage.openItemDetailsByName(PRODUCT_NAME);
    await productDetailsPage.waitForVisible();

    const firstDetailsName = await productDetailsPage.getProductName();
    expect(firstDetailsName, 'First product details should show expected product name').toBe(
      PRODUCT_NAME,
    );

    await productDetailsPage.backToProducts();
    await inventoryPage.waitForVisible();

    await inventoryPage.openItemDetailsByName(secondProductName);
    await productDetailsPage.waitForVisible();

    const secondDetailsName = await productDetailsPage.getProductName();
    expect(
      secondDetailsName,
      'Second product details should show expected second product name',
    ).toBe(secondProductName);
  });

  test('adding product from details page does not create duplicates in cart', async ({
    inventoryPage,
    cartPage,
    productDetailsPage,
  }) => {
    await inventoryPage.addItemToCartByName(PRODUCT_NAME);

    await openDetailsForBackpack(inventoryPage, productDetailsPage);
    await productDetailsPage.addToCart();

    await productDetailsPage.backToProducts();
    await inventoryPage.waitForVisible();

    await inventoryPage.openCart();
    await cartPage.waitForVisible();

    const itemsCount = await cartPage.getItemsCount();
    const hasBackpack = await cartPage.hasItemWithName(PRODUCT_NAME);

    expect(
      hasBackpack,
      'Cart should contain the product after adding from inventory and details',
    ).toBe(true);
    expect(itemsCount, 'Cart should not contain duplicate line items for the same product').toBe(1);
  });
});
