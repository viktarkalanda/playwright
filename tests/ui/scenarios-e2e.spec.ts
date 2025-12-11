// tests/ui/scenarios-e2e.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';
import { productCatalog } from '../../src/data/products';
import {
  CheckoutContext,
  completeCheckout,
  completeCheckoutFromDetailsPage,
  tryCheckoutWithEmptyCart,
  cancelCheckoutAndReturnToCart,
  loginAndResetApp,
  addMultipleProductsToCart,
  completeCheckoutFromCurrentSession,
  logout,
} from '../../src/utils/scenarios';
import { makeCheckoutUserData } from '../../src/utils/testData';

test.describe('High-level e2e scenarios', () => {
  test('standard user can complete checkout with single product via inventory', {
    tag: ['@e2e', '@checkout', '@scenario', '@smoke'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
    headerMenu,
  }) => {
    const ctx: CheckoutContext = {
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
      headerMenu,
    };
    const firstProduct = productCatalog.products[0];

    await completeCheckout(ctx, {
      userKey: 'standard',
      productNames: [firstProduct.name],
    });

    expect(await checkoutCompletePage.getHeaderText()).toContain('Thank you');
  });

  test('standard user can complete checkout with multiple products via inventory', {
    tag: ['@e2e', '@checkout', '@scenario'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
    headerMenu,
  }) => {
    const ctx: CheckoutContext = {
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
      headerMenu,
    };
    const names = productCatalog.products.slice(0, 3).map((product) => product.name);

    await completeCheckout(ctx, {
      userKey: 'standard',
      productNames: names,
    });
    expect(await checkoutCompletePage.getHeaderText()).toContain('Thank you');
  });

  test('standard user can complete checkout starting from product details page', {
    tag: ['@e2e', '@checkout', '@scenario', '@details'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
    headerMenu,
  }) => {
    const ctx: CheckoutContext = {
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
      headerMenu,
    };
    const targetProduct = productCatalog.products[1];

    await completeCheckoutFromDetailsPage(ctx, 'standard', targetProduct.name);
    expect(await checkoutCompletePage.getHeaderText()).toContain('Thank you');
  });

  test('checkout shows zero items when cart is empty', {
    tag: ['@e2e', '@checkout', '@scenario', '@negative'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
    headerMenu,
  }) => {
    const ctx: CheckoutContext = {
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
      headerMenu,
    };

    await tryCheckoutWithEmptyCart(ctx, 'standard');
    const user = makeCheckoutUserData();
    await checkoutStepOnePage.fillForm(user.firstName, user.lastName, user.postalCode);
    await checkoutStepOnePage.continueToStepTwo();
    await checkoutStepTwoPage.waitForVisible();
    expect(await checkoutStepTwoPage.getSummaryItemCount()).toBe(0);
  });

  test('problem user can still complete checkout with single product', {
    tag: ['@e2e', '@checkout', '@scenario', '@userType'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
    headerMenu,
  }) => {
    const ctx: CheckoutContext = {
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
      headerMenu,
    };
    const productName = productCatalog.products[2].name;

    await completeCheckout(ctx, {
      userKey: 'problem',
      productNames: [productName],
    });
    expect(await checkoutCompletePage.getHeaderText()).toContain('Thank you');
  });

  test('performance glitch user completes checkout with multiple products', {
    tag: ['@e2e', '@checkout', '@scenario', '@userType'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
    headerMenu,
  }) => {
    const ctx: CheckoutContext = {
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
      headerMenu,
    };
    const names = productCatalog.products.slice(3).map((product) => product.name);

    await completeCheckout(ctx, {
      userKey: 'performanceGlitch',
      productNames: names,
    });
    expect(await checkoutCompletePage.getHeaderText()).toContain('Thank you');
  });

  test('logout after completed checkout resets cart and allows new checkout', {
    tag: ['@e2e', '@checkout', '@scenario', '@auth'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
    headerMenu,
  }) => {
    const ctx: CheckoutContext = {
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
      headerMenu,
    };
    const firstRunProducts = [productCatalog.products[0].name];
    const secondRunProducts = [productCatalog.products[3].name];

    await completeCheckout(ctx, {
      userKey: 'standard',
      productNames: firstRunProducts,
    });
    expect(await checkoutCompletePage.getHeaderText()).toContain('Thank you');
    await checkoutCompletePage.backToProducts();
    await logout(ctx);

    await completeCheckout(ctx, {
      userKey: 'standard',
      productNames: secondRunProducts,
    });
    expect(await checkoutCompletePage.getHeaderText()).toContain('Thank you');
  });

  test('switching user types between checkouts does not leak cart state', {
    tag: ['@e2e', '@checkout', '@scenario', '@userType'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
    headerMenu,
  }) => {
    const ctx: CheckoutContext = {
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
      headerMenu,
    };

    await completeCheckout(ctx, {
      userKey: 'standard',
      productNames: [productCatalog.products[0].name],
    });
    await checkoutCompletePage.backToProducts();
    await logout(ctx);

    await loginAndResetApp(ctx, 'problem');
    expect(await inventoryPage.getCartBadgeCount()).toBe(0);
    const problemProducts = [productCatalog.products[4].name];
    await completeCheckoutFromCurrentSession(ctx, problemProducts);
    expect(await checkoutCompletePage.getHeaderText()).toContain('Thank you');
  });

  test('user can cancel checkout and return to cart with items preserved', {
    tag: ['@e2e', '@checkout', '@scenario', '@negative'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
    headerMenu,
  }) => {
    const ctx: CheckoutContext = {
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
      headerMenu,
    };
    const selectedNames = productCatalog.products.slice(0, 2).map((product) => product.name);

    await cancelCheckoutAndReturnToCart(ctx, 'standard', selectedNames);
    const cartNames = await cartPage.getItemNames();
    expect(cartNames.sort()).toEqual([...selectedNames].sort());
  });

  test('standard user can complete checkout with entire catalog', {
    tag: ['@e2e', '@checkout', '@scenario'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    productDetailsPage,
    headerMenu,
  }) => {
    const ctx: CheckoutContext = {
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
      productDetailsPage,
      headerMenu,
    };

    await completeCheckout(ctx, {
      userKey: 'standard',
      productNames: productCatalog.products.map((product) => product.name),
    });
    expect(await checkoutCompletePage.getHeaderText()).toContain('Thank you');
  });
});
