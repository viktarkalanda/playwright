import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { ProductDetailsPage } from '../pages/ProductDetailsPage';
import { CheckoutStepOnePage } from '../pages/CheckoutStepOnePage';
import { CheckoutStepTwoPage } from '../pages/CheckoutStepTwoPage';
import { CheckoutCompletePage } from '../pages/CheckoutCompletePage';
import { HeaderMenu } from '../pages/HeaderMenu';
import { TestConfig, UserKey } from '../config/testConfig';
import { CheckoutUserData, makeCheckoutUserData } from './testData';
import { productCatalog } from '../data/products';

export interface CheckoutContext {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutStepOnePage: CheckoutStepOnePage;
  checkoutStepTwoPage: CheckoutStepTwoPage;
  checkoutCompletePage: CheckoutCompletePage;
  productDetailsPage: ProductDetailsPage;
  headerMenu: HeaderMenu;
}

export interface CheckoutScenarioOptions {
  userKey: UserKey;
  productNames: string[];
  checkoutDataOverrides?: Partial<CheckoutUserData>;
}

const config = TestConfig.getInstance();
export const allCatalogProductNames = productCatalog.products.map((product) => product.name);

async function completeCheckoutFlow(ctx: CheckoutContext, checkoutUser: CheckoutUserData): Promise<void> {
  await ctx.cartPage.proceedToCheckout();
  await ctx.checkoutStepOnePage.waitForVisible();
  await ctx.checkoutStepOnePage.fillForm(
    checkoutUser.firstName,
    checkoutUser.lastName,
    checkoutUser.postalCode,
  );
  await ctx.checkoutStepOnePage.continueToStepTwo();
  await ctx.checkoutStepTwoPage.waitForVisible();
  await ctx.checkoutStepTwoPage.finishCheckout();
  await ctx.checkoutCompletePage.waitForVisible();
}

export async function loginAndResetApp(ctx: CheckoutContext, userKey: UserKey): Promise<void> {
  const { username, password } = config.getUser(userKey);
  await ctx.loginPage.login(username, password);
  await ctx.inventoryPage.waitForVisible();
  await ctx.headerMenu.openMenu();
  await ctx.headerMenu.clickResetAppState();
  await ctx.headerMenu.closeMenu();
  await ctx.inventoryPage.waitForVisible();
}

export async function addSingleProductToCartFromInventory(
  ctx: CheckoutContext,
  productName: string,
): Promise<void> {
  await ctx.inventoryPage.addProductToCartByName(productName);
}

export async function addSingleProductToCartFromDetails(
  ctx: CheckoutContext,
  productName: string,
): Promise<void> {
  await ctx.inventoryPage.openItemDetailsByName(productName);
  await ctx.productDetailsPage.waitForVisible();
  await ctx.productDetailsPage.addToCart();
}

export async function addMultipleProductsToCart(
  ctx: CheckoutContext,
  productNames: string[],
): Promise<void> {
  for (const name of productNames) {
    await ctx.inventoryPage.addProductToCartByName(name);
  }
}

export async function completeCheckoutFromCurrentSession(
  ctx: CheckoutContext,
  productNames: string[],
  checkoutDataOverrides?: Partial<CheckoutUserData>,
): Promise<void> {
  if (productNames.length > 0) {
    await addMultipleProductsToCart(ctx, productNames);
  }
  await ctx.inventoryPage.openCart();
  await ctx.cartPage.waitForVisible();
  const checkoutUser = makeCheckoutUserData(checkoutDataOverrides);
  await completeCheckoutFlow(ctx, checkoutUser);
}

export async function completeCheckout(
  ctx: CheckoutContext,
  options: CheckoutScenarioOptions,
): Promise<void> {
  const { userKey, productNames, checkoutDataOverrides } = options;
  await loginAndResetApp(ctx, userKey);
  await completeCheckoutFromCurrentSession(ctx, productNames, checkoutDataOverrides);
}

export async function completeCheckoutFromDetailsPage(
  ctx: CheckoutContext,
  userKey: UserKey,
  productName: string,
): Promise<void> {
  await loginAndResetApp(ctx, userKey);
  await addSingleProductToCartFromDetails(ctx, productName);
  await ctx.productDetailsPage.backToProducts();
  await ctx.inventoryPage.waitForVisible();
  await completeCheckoutFromCurrentSession(ctx, []);
}

export async function tryCheckoutWithEmptyCart(ctx: CheckoutContext, userKey: UserKey): Promise<void> {
  await loginAndResetApp(ctx, userKey);
  await ctx.inventoryPage.openCart();
  await ctx.cartPage.waitForVisible();
  await ctx.cartPage.tryProceedToCheckoutWithEmptyCart();
  await ctx.checkoutStepOnePage.waitForVisible();
}

export async function cancelCheckoutAndReturnToCart(
  ctx: CheckoutContext,
  userKey: UserKey,
  productNames: string[],
): Promise<void> {
  await loginAndResetApp(ctx, userKey);
  await addMultipleProductsToCart(ctx, productNames);
  await ctx.inventoryPage.openCart();
  await ctx.cartPage.waitForVisible();

  await ctx.cartPage.proceedToCheckout();
  await ctx.checkoutStepOnePage.waitForVisible();
  const checkoutUser = makeCheckoutUserData();
  await ctx.checkoutStepOnePage.fillForm(
    checkoutUser.firstName,
    checkoutUser.lastName,
    checkoutUser.postalCode,
  );
  await ctx.checkoutStepOnePage.continueToStepTwo();
  await ctx.checkoutStepTwoPage.waitForVisible();
  await ctx.checkoutStepTwoPage.cancel();
  await ctx.cartPage.waitForVisible();
}

export async function logout(ctx: CheckoutContext): Promise<void> {
  await ctx.headerMenu.clickLogout();
}
