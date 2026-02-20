import type { Page } from '@playwright/test';
import { getRoute } from '../data/routes';

/**
 * Direct navigation helpers for auth-guard and negative-path tests.
 * These bypass the normal login flow to test redirect behaviour.
 * Use these instead of loginPage.openXxxDirect() methods.
 */

export async function openInventoryDirect(page: Page): Promise<void> {
  await page.goto(getRoute('inventory').path);
}

export async function openCartDirect(page: Page): Promise<void> {
  await page.goto(getRoute('cart').path);
}

export async function openCheckoutStepOneDirect(page: Page): Promise<void> {
  await page.goto(getRoute('checkoutStepOne').path);
}

export async function openCheckoutStepTwoDirect(page: Page): Promise<void> {
  await page.goto(getRoute('checkoutStepTwo').path);
}

export async function openCheckoutCompleteDirect(page: Page): Promise<void> {
  await page.goto(getRoute('checkoutComplete').path);
}

export async function openProductDetailsDirect(page: Page, itemId = 4): Promise<void> {
  await page.goto(`${getRoute('inventoryItem').path}?id=${itemId}`);
}
