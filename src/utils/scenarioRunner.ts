import { expect, Page } from '@playwright/test';
import { ScenarioDefinition, ScenarioStep } from './scenarioDefinitions';
import { TestConfig, UserKey } from '../config/testConfig';
import { productCatalog } from '../data/products';
import type { SauceDemoContext } from '../types/appContext';

const config = TestConfig.getInstance();

export type ScenarioRunnerContext = Omit<SauceDemoContext, 'footer'> & {
  aboutPage?: Page;
};

async function executeLoginStep(ctx: ScenarioRunnerContext, step: ScenarioStep): Promise<void> {
  if (step.type !== 'login') {
    return;
  }
  const userKey = step.user as UserKey;
  const { username, password } = config.getUser(userKey);
  await ctx.loginPage.open();
  await ctx.loginPage.fillUsername(username);
  await ctx.loginPage.fillPassword(password);
  await ctx.loginPage.submitLogin();
  await ctx.inventoryPage.waitForVisible();
}

async function executeAddProductsToCartStep(ctx: ScenarioRunnerContext, step: ScenarioStep): Promise<void> {
  if (step.type !== 'addProductsToCart') {
    return;
  }

  await ctx.inventoryPage.waitForVisible();
  if (step.productNames && step.productNames.length > 0) {
    for (const name of step.productNames) {
      await ctx.inventoryPage.addProductToCartByName(name);
    }
    return;
  }

  const count = step.count ?? 1;
  const catalogNames = productCatalog.products.map((product) => product.name);

  for (let i = 0; i < count; i += 1) {
    const targetName = catalogNames[i % catalogNames.length];
    await ctx.inventoryPage.addProductToCartByName(targetName);
  }
}

async function executeOpenCartStep(ctx: ScenarioRunnerContext, step: ScenarioStep): Promise<void> {
  if (step.type !== 'openCart') {
    return;
  }
  await ctx.inventoryPage.openCart();
  await ctx.cartPage.waitForVisible();
}

async function executeStartCheckoutStep(ctx: ScenarioRunnerContext, step: ScenarioStep): Promise<void> {
  if (step.type !== 'startCheckout') {
    return;
  }
  await ctx.cartPage.proceedToCheckout();
  await ctx.checkoutStepOnePage.waitForVisible();
}

async function executeFillCheckoutFormStep(ctx: ScenarioRunnerContext, step: ScenarioStep): Promise<void> {
  if (step.type !== 'fillCheckoutForm') {
    return;
  }
  const firstName = step.firstName ?? 'John';
  const lastName = step.lastName ?? 'Doe';
  const postalCode = step.postalCode ?? '12345';
  await ctx.checkoutStepOnePage.fillForm(firstName, lastName, postalCode);
}

async function executeGoToStepTwoStep(ctx: ScenarioRunnerContext, step: ScenarioStep): Promise<void> {
  if (step.type !== 'goToStepTwo') {
    return;
  }
  await ctx.checkoutStepOnePage.continueToStepTwo();
  await ctx.checkoutStepTwoPage.waitForVisible();
}

async function executeFinishCheckoutStep(ctx: ScenarioRunnerContext, step: ScenarioStep): Promise<void> {
  if (step.type !== 'finishCheckout') {
    return;
  }
  await ctx.checkoutStepTwoPage.finishCheckout();
  await ctx.checkoutCompletePage.waitForVisible();
}

async function executeVerifyCheckoutCompleteStep(
  ctx: ScenarioRunnerContext,
  step: ScenarioStep,
): Promise<void> {
  if (step.type !== 'verifyCheckoutComplete') {
    return;
  }
  await ctx.checkoutCompletePage.waitForVisible();
  const url = await ctx.checkoutCompletePage.getCurrentUrl();
  expect(url).toContain('checkout-complete');
}

async function executeLogoutStep(ctx: ScenarioRunnerContext, step: ScenarioStep): Promise<void> {
  if (step.type !== 'logout') {
    return;
  }
  await ctx.headerMenu.openMenu();
  await ctx.headerMenu.clickLogout();
  await ctx.loginPage.waitForVisible();
}

async function executeResetAppStateStep(ctx: ScenarioRunnerContext, step: ScenarioStep): Promise<void> {
  if (step.type !== 'resetAppState') {
    return;
  }
  await ctx.headerMenu.openMenu();
  await ctx.headerMenu.clickResetAppState();
  await ctx.inventoryPage.waitForVisible();
}

async function executeOpenProductDetailsStep(
  ctx: ScenarioRunnerContext,
  step: ScenarioStep,
): Promise<void> {
  if (step.type !== 'openProductDetails') {
    return;
  }
  await ctx.inventoryPage.waitForVisible();
  if (step.productName) {
    await ctx.inventoryPage.openItemDetailsByName(step.productName);
  } else {
    await ctx.inventoryPage.openFirstProductDetails();
  }
  await ctx.productDetailsPage.waitForVisible();
}

async function executeBackToInventoryStep(ctx: ScenarioRunnerContext, step: ScenarioStep): Promise<void> {
  if (step.type !== 'backToInventory') {
    return;
  }
  await ctx.productDetailsPage.backToProducts();
  await ctx.inventoryPage.waitForVisible();
}

async function executeOpenAboutStep(ctx: ScenarioRunnerContext, step: ScenarioStep): Promise<void> {
  if (step.type !== 'openAbout') {
    return;
  }
  const [aboutPage] = await Promise.all([
    ctx.page.context().waitForEvent('page'),
    ctx.headerMenu.clickAbout(),
  ]);
  await aboutPage.waitForLoadState('domcontentloaded');
  ctx.aboutPage = aboutPage;
}

async function executeReturnFromAboutStep(ctx: ScenarioRunnerContext, step: ScenarioStep): Promise<void> {
  if (step.type !== 'returnFromAbout') {
    return;
  }
  if (ctx.aboutPage) {
    await ctx.aboutPage.close();
    ctx.aboutPage = undefined;
    await ctx.page.bringToFront();
  }
}

export async function runScenario(ctx: ScenarioRunnerContext, scenario: ScenarioDefinition): Promise<void> {
  for (const step of scenario.steps) {
    switch (step.type) {
      case 'login':
        await executeLoginStep(ctx, step);
        break;
      case 'addProductsToCart':
        await executeAddProductsToCartStep(ctx, step);
        break;
      case 'openCart':
        await executeOpenCartStep(ctx, step);
        break;
      case 'startCheckout':
        await executeStartCheckoutStep(ctx, step);
        break;
      case 'fillCheckoutForm':
        await executeFillCheckoutFormStep(ctx, step);
        break;
      case 'goToStepTwo':
        await executeGoToStepTwoStep(ctx, step);
        break;
      case 'finishCheckout':
        await executeFinishCheckoutStep(ctx, step);
        break;
      case 'verifyCheckoutComplete':
        await executeVerifyCheckoutCompleteStep(ctx, step);
        break;
      case 'logout':
        await executeLogoutStep(ctx, step);
        break;
      case 'resetAppState':
        await executeResetAppStateStep(ctx, step);
        break;
      case 'openProductDetails':
        await executeOpenProductDetailsStep(ctx, step);
        break;
      case 'backToInventory':
        await executeBackToInventoryStep(ctx, step);
        break;
      case 'openAbout':
        await executeOpenAboutStep(ctx, step);
        break;
      case 'returnFromAbout':
        await executeReturnFromAboutStep(ctx, step);
        break;
      default:
        throw new Error(`Unsupported step type: ${(step as ScenarioStep).type}`);
    }
  }
}
