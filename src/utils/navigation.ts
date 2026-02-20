import { expect } from '@playwright/test';
import { getRoute, RouteKey } from '../data/routes';
import type { SauceDemoContext } from '../types/appContext';

export type NavigationContext = Pick<
  SauceDemoContext,
  | 'page'
  | 'loginPage'
  | 'inventoryPage'
  | 'cartPage'
  | 'checkoutStepOnePage'
  | 'checkoutStepTwoPage'
  | 'checkoutCompletePage'
  | 'productDetailsPage'
>;

async function expectUrlContains(ctx: NavigationContext, key: RouteKey): Promise<void> {
  const route = getRoute(key);
  expect.soft(ctx.page.url(), `URL should contain ${route.path}`).toContain(route.path);
}

export async function expectOnLoginPage(ctx: NavigationContext): Promise<void> {
  await expectUrlContains(ctx, 'login');
  await ctx.loginPage.waitForVisible();
}

export async function expectOnInventoryPage(ctx: NavigationContext): Promise<void> {
  await expectUrlContains(ctx, 'inventory');
  await ctx.inventoryPage.waitForVisible();
}

export async function expectOnCartPage(ctx: NavigationContext): Promise<void> {
  await expectUrlContains(ctx, 'cart');
  await ctx.cartPage.waitForVisible();
}

export async function expectOnCheckoutStepOnePage(ctx: NavigationContext): Promise<void> {
  await expectUrlContains(ctx, 'checkoutStepOne');
  await ctx.checkoutStepOnePage.waitForVisible();
}

export async function expectOnCheckoutStepTwoPage(ctx: NavigationContext): Promise<void> {
  await expectUrlContains(ctx, 'checkoutStepTwo');
  await ctx.checkoutStepTwoPage.waitForVisible();
}

export async function expectOnCheckoutCompletePage(ctx: NavigationContext): Promise<void> {
  await expectUrlContains(ctx, 'checkoutComplete');
  await ctx.checkoutCompletePage.waitForVisible();
}

export async function expectOnProductDetailsPage(ctx: NavigationContext): Promise<void> {
  await expectUrlContains(ctx, 'inventoryItem');
  await ctx.productDetailsPage.waitForVisible();
}

async function expectOnRoute(ctx: NavigationContext, key: RouteKey): Promise<void> {
  switch (key) {
    case 'inventory':
      await expectOnInventoryPage(ctx);
      break;
    case 'cart':
      await expectOnCartPage(ctx);
      break;
    case 'checkoutStepOne':
      await expectOnCheckoutStepOnePage(ctx);
      break;
    case 'checkoutStepTwo':
      await expectOnCheckoutStepTwoPage(ctx);
      break;
    case 'checkoutComplete':
      await expectOnCheckoutCompletePage(ctx);
      break;
    case 'inventoryItem':
      await expectOnProductDetailsPage(ctx);
      break;
    case 'login':
    case 'root':
    default:
      await expectOnLoginPage(ctx);
      break;
  }
}

export async function navigateToCartFromInventory(ctx: NavigationContext): Promise<void> {
  await ctx.inventoryPage.openCart();
  await expectOnCartPage(ctx);
}

export async function navigateToInventoryFromCart(ctx: NavigationContext): Promise<void> {
  await ctx.cartPage.continueShopping();
  await expectOnInventoryPage(ctx);
}

export async function reloadAndAssertOnSamePage(
  ctx: NavigationContext,
  pageKey: RouteKey,
): Promise<void> {
  await ctx.page.reload();
  await expectOnRoute(ctx, pageKey);
}

export async function goBackAndAssert(ctx: NavigationContext, expectedRouteKey: RouteKey): Promise<void> {
  await ctx.page.goBack();
  await expectOnRoute(ctx, expectedRouteKey);
}

export async function goForwardAndAssert(
  ctx: NavigationContext,
  expectedRouteKey: RouteKey,
): Promise<void> {
  await ctx.page.goForward();
  await expectOnRoute(ctx, expectedRouteKey);
}
