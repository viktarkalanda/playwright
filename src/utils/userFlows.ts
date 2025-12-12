import { TestConfig, UserKey } from '../config/testConfig';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutStepOnePage } from '../pages/CheckoutStepOnePage';
import { CheckoutStepTwoPage } from '../pages/CheckoutStepTwoPage';
import { CheckoutCompletePage } from '../pages/CheckoutCompletePage';

export interface BasicUserFlowContext {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutStepOnePage: CheckoutStepOnePage;
  checkoutStepTwoPage: CheckoutStepTwoPage;
  checkoutCompletePage: CheckoutCompletePage;
}

export async function loginAsUser(ctx: BasicUserFlowContext, userKey: UserKey): Promise<void> {
  const config = TestConfig.getInstance();
  const { username, password } = config.getUser(userKey);

  await ctx.loginPage.open();
  await ctx.loginPage.fillUsername(username);
  await ctx.loginPage.fillPassword(password);
  await ctx.loginPage.submitLogin();
}

export async function didLoginSucceed(ctx: BasicUserFlowContext): Promise<boolean> {
  try {
    await ctx.inventoryPage.waitForVisible();
    return true;
  } catch {
    return false;
  }
}

export async function tryFullCheckout(ctx: BasicUserFlowContext): Promise<boolean> {
  try {
    await ctx.inventoryPage.waitForVisible();
    await ctx.inventoryPage.addFirstItemToCart();
    await ctx.inventoryPage.openCart();
    await ctx.cartPage.waitForVisible();

    await ctx.cartPage.proceedToCheckout();
    await ctx.checkoutStepOnePage.waitForVisible();
    await ctx.checkoutStepOnePage.fillForm('John', 'Doe', '12345');
    await ctx.checkoutStepOnePage.continueToStepTwo();

    await ctx.checkoutStepTwoPage.waitForVisible();
    await ctx.checkoutStepTwoPage.finishCheckout();

    await ctx.checkoutCompletePage.waitForVisible();
    return true;
  } catch {
    return false;
  }
}
