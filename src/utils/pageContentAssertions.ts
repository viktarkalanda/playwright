import { expect } from '@playwright/test';
import { getPageContent, PageKey } from '../data/pageContent';
import type { SauceDemoContext } from '../types/appContext';

export type PageContentContext = SauceDemoContext;

export async function expectDocumentTitle(ctx: PageContentContext, pageKey: PageKey): Promise<void> {
  const def = getPageContent(pageKey);
  if (!def.title) {
    return;
  }
  await expect(ctx.page).toHaveTitle(def.title);
}

export async function expectMainHeader(ctx: PageContentContext, pageKey: PageKey): Promise<void> {
  const def = getPageContent(pageKey);
  if (!def.mainHeader) {
    return;
  }

  let headerText: string | null = null;

  switch (pageKey) {
    case 'login':
      headerText = await ctx.loginPage.getMainHeaderText();
      break;
    case 'inventory':
      headerText = await ctx.inventoryPage.getHeaderText();
      break;
    case 'cart':
      headerText = await ctx.cartPage.getHeaderText();
      break;
    case 'productDetails':
      headerText = await ctx.productDetailsPage.getHeaderText();
      break;
    case 'checkoutStepOne':
      headerText = await ctx.checkoutStepOnePage.getHeaderText();
      break;
    case 'checkoutStepTwo':
      headerText = await ctx.checkoutStepTwoPage.getHeaderText();
      break;
    case 'checkoutComplete':
      headerText = await ctx.checkoutCompletePage.getHeaderText();
      break;
    default:
      headerText = null;
  }

  if (headerText === null) {
    throw new Error(`No header text available for pageKey "${pageKey}"`);
  }

  expect(headerText.trim()).toBe(def.mainHeader);
}

export async function expectPrimaryButtonText(ctx: PageContentContext, pageKey: PageKey): Promise<void> {
  const def = getPageContent(pageKey);
  const expected = def.buttons?.primary;
  if (!expected) {
    return;
  }

  let actual: string | null = null;
  switch (pageKey) {
    case 'login':
      actual = await ctx.loginPage.getLoginButtonText();
      break;
    case 'checkoutStepOne':
      actual = await ctx.checkoutStepOnePage.getPrimaryButtonText();
      break;
    case 'checkoutStepTwo':
      actual = await ctx.checkoutStepTwoPage.getPrimaryButtonText();
      break;
    case 'checkoutComplete':
      actual = await ctx.checkoutCompletePage.getPrimaryButtonText();
      break;
    default:
      actual = null;
  }

  if (actual === null) {
    throw new Error(`No primary button for pageKey "${pageKey}"`);
  }

  expect(actual.trim()).toBe(expected);
}

export async function expectSecondaryButtonText(ctx: PageContentContext, pageKey: PageKey): Promise<void> {
  const def = getPageContent(pageKey);
  const expected = def.buttons?.secondary;
  if (!expected) {
    return;
  }

  let actual: string | null = null;
  switch (pageKey) {
    case 'checkoutStepOne':
      actual = await ctx.checkoutStepOnePage.getSecondaryButtonText();
      break;
    case 'checkoutStepTwo':
      actual = await ctx.checkoutStepTwoPage.getSecondaryButtonText();
      break;
    default:
      actual = null;
  }

  if (actual === null) {
    throw new Error(`No secondary button for pageKey "${pageKey}"`);
  }

  expect(actual.trim()).toBe(expected);
}

export async function expectCartButtonsMatchDefinition(ctx: PageContentContext): Promise<void> {
  const def = getPageContent('cart');
  const expectedCheckout = def.buttons?.checkout;
  const expectedContinue = def.buttons?.continueShopping;

  if (expectedCheckout) {
    const actualCheckout = await ctx.cartPage.getCheckoutButtonText();
    expect(actualCheckout.trim()).toBe(expectedCheckout);
  }

  if (expectedContinue) {
    const actualContinue = await ctx.cartPage.getContinueShoppingButtonText();
    expect(actualContinue.trim()).toBe(expectedContinue);
  }
}

export async function expectBackToProductsButtonText(ctx: PageContentContext): Promise<void> {
  const def = getPageContent('productDetails');
  const expected = def.buttons?.backToProducts;
  if (!expected) {
    return;
  }
  const actual = await ctx.productDetailsPage.getBackToProductsButtonText();
  expect(actual.trim()).toBe(expected);
}

export async function expectCheckoutCompleteSuccessMessage(ctx: PageContentContext): Promise<void> {
  const def = getPageContent('checkoutComplete');
  if (!def.successMessage) {
    return;
  }

  const actual = await ctx.checkoutCompletePage.getSuccessMessageText();
  expect(actual.trim()).toBe(def.successMessage);
}

export async function expectFooterVisibleWithText(ctx: PageContentContext): Promise<void> {
  await ctx.footer.waitForVisible();
  const footerText = await ctx.footer.getFooterText();
  expect(footerText.trim().length).toBeGreaterThan(0);
}
