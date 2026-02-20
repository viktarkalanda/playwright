// tests/ui/user-types-behavior.spec.ts
import { test, expect } from '../../../src/fixtures/test-fixtures';
import { productCatalog } from '../../../src/data/products';
import { userBehaviorMatrix, getUserProfile } from '../../../src/data/userMatrix';
import type { BasicUserFlowContext } from '../../../src/utils/userFlows';
import { loginAsUser, didLoginSucceed, tryFullCheckout } from '../../../src/utils/userFlows';
import type { HeaderMenu } from '../../../src/pages/saucedemo/HeaderMenu';
import type { LoginPage } from '../../../src/pages/saucedemo/LoginPage';
import { openInventoryDirect } from '../../../src/utils/directNavigation';
import {
  expectLockedOutUserError,
  expectInvalidCredentialsError,
} from '../../../src/utils/assertions';

const productNames = productCatalog.products.map((product) => product.name);

function buildContext(fixtureCtx: BasicUserFlowContext): BasicUserFlowContext {
  return fixtureCtx;
}

async function logoutIfPossible(headerMenu: HeaderMenu, loginPage: LoginPage): Promise<void> {
  try {
    await headerMenu.clickLogout();
    await loginPage.waitForVisible();
  } catch {
    // ignore if logout is not available
  }
}

test.describe('SauceDemo user types behavior matrix', () => {
  test('standard user: login succeeds and full checkout is possible', {
    tag: ['@users', '@standard', '@checkout', '@e2e'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    footer,
  }) => {
    const profile = getUserProfile('standard');
    expect(profile.loginExpectation).toBe('success');
    const ctx = buildContext({
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    });
    await loginAsUser(ctx, 'standard');
    expect(await didLoginSucceed(ctx)).toBe(true);

    await footer.waitForVisible();
    const checkoutResult = await tryFullCheckout(ctx);
    expect(checkoutResult).toBe(true);
  });

  test('locked out user: login is rejected with locked message', {
    tag: ['@users', '@lockedOut', '@login', '@negative'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    const profile = getUserProfile('lockedOut');
    expect(profile.loginExpectation).toBe('locked');
    const ctx = buildContext({
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    });
    await loginAsUser(ctx, 'lockedOut');
    const error = await loginPage.getErrorText();
    expectLockedOutUserError(error);
    expect(await didLoginSucceed(ctx)).toBe(false);
  });

  test('problem user: login succeeds but full checkout may still work', {
    tag: ['@users', '@problem', '@checkout'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    const profile = getUserProfile('problem');
    expect(profile.loginExpectation).toBe('success');
    const ctx = buildContext({
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    });
    await loginAsUser(ctx, 'problem');
    expect(await didLoginSucceed(ctx)).toBe(true);

    const checkoutResult = await tryFullCheckout(ctx);
    expect(checkoutResult).toBe(true);
  });

  test('performance glitch user: login succeeds and flow eventually passes', {
    tag: ['@users', '@performanceGlitch', '@checkout'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    const profile = getUserProfile('performanceGlitch');
    expect(profile.loginExpectation).toBe('success');
    const ctx = buildContext({
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    });
    const start = Date.now();
    await loginAsUser(ctx, 'performanceGlitch');
    const loginOk = await didLoginSucceed(ctx);
    const elapsedLogin = Date.now() - start;

    expect(loginOk).toBe(true);
    expect(elapsedLogin).toBeGreaterThan(0);

    const checkoutResult = await tryFullCheckout(ctx);
    expect(checkoutResult).toBe(true);
  });

  test('error user: login succeeds but checkout may fail', {
    tag: ['@users', '@error', '@checkout'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    const profile = getUserProfile('error');
    expect(profile.loginExpectation).toBe('success');
    const ctx = buildContext({
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    });
    await loginAsUser(ctx, 'error');
    expect(await didLoginSucceed(ctx)).toBe(true);

    const checkoutResult = await tryFullCheckout(ctx);
    expect(checkoutResult).toBe(false);
  });

  test('visual user: login succeeds and checkout still works', {
    tag: ['@users', '@visual', '@checkout'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    const profile = getUserProfile('visual');
    expect(profile.loginExpectation).toBe('success');
    const ctx = buildContext({
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    });
    await loginAsUser(ctx, 'visual');
    expect(await didLoginSucceed(ctx)).toBe(true);

    const checkoutResult = await tryFullCheckout(ctx);
    expect(checkoutResult).toBe(true);
  });

  test('locked out user cannot access inventory even via direct navigation', {
    tag: ['@users', '@lockedOut', '@auth'],
  }, async ({
    page,
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    const profile = getUserProfile('lockedOut');
    expect(profile.loginExpectation).toBe('locked');
    const ctx = buildContext({
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    });
    await loginAsUser(ctx, 'lockedOut');
    expect(await didLoginSucceed(ctx)).toBe(false);

    await openInventoryDirect(page);
    await loginPage.waitForVisible();
    expect(await loginPage.isErrorVisible()).toBe(true);
  });

  test('standard user logout and re-login keeps behavior consistent', {
    tag: ['@users', '@standard', '@auth', '@checkout'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    headerMenu,
  }) => {
    const profile = getUserProfile('standard');
    expect(profile.loginExpectation).toBe('success');
    const ctx = buildContext({
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    });
    await loginAsUser(ctx, 'standard');
    expect(await didLoginSucceed(ctx)).toBe(true);
    await headerMenu.clickLogout();
    await loginPage.waitForVisible();

    await loginAsUser(ctx, 'standard');
    expect(await didLoginSucceed(ctx)).toBe(true);
    const checkoutResult = await tryFullCheckout(ctx);
    expect(checkoutResult).toBe(true);
  });

  test('problem user: images or items do not break cart interactions', {
    tag: ['@users', '@problem', '@cart'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    const profile = getUserProfile('problem');
    expect(profile.loginExpectation).toBe('success');
    const ctx = buildContext({
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    });
    await loginAsUser(ctx, 'problem');
    await inventoryPage.waitForVisible();

    const selectedProducts = productNames.slice(0, 3);
    for (const name of selectedProducts) {
      await inventoryPage.addProductToCartByName(name);
    }

    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    expect(await cartPage.getItemsCount()).toBe(selectedProducts.length);
  });

  test('visual user: inventory and cart remain functionally correct despite visual glitches', {
    tag: ['@users', '@visual', '@cart'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
  }) => {
    const profile = getUserProfile('visual');
    expect(profile.loginExpectation).toBe('success');
    const ctx = buildContext({
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    });
    await loginAsUser(ctx, 'visual');
    await inventoryPage.waitForVisible();

    const itemsToAdd = productNames.slice(0, 2);
    for (const name of itemsToAdd) {
      await inventoryPage.addProductToCartByName(name);
    }

    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    expect(await cartPage.getItemsCount()).toBe(itemsToAdd.length);

    await cartPage.continueShopping();
    await inventoryPage.waitForVisible();
  });

  test('all defined users: login expectation matches real behavior', {
    tag: ['@users', '@matrix', '@login'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    headerMenu,
  }) => {
    const ctx = buildContext({
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    });

    for (const profile of userBehaviorMatrix) {
      await test.step(`Validate user ${profile.key}`, async () => {
        await loginAsUser(ctx, profile.key);
        const loginOk = await didLoginSucceed(ctx);

        if (profile.loginExpectation === 'success') {
          expect(loginOk).toBe(true);
          await headerMenu.clickLogout();
          await loginPage.waitForVisible();
        } else if (profile.loginExpectation === 'locked') {
          expect(loginOk).toBe(false);
          const error = await loginPage.getErrorText();
          expectLockedOutUserError(error);
        } else {
          expect(loginOk).toBe(false);
          const error = await loginPage.getErrorText();
          expectInvalidCredentialsError(error);
        }
      });
    }
  });

  test('only success-login users can reach checkout complete based on matrix', {
    tag: ['@users', '@matrix', '@checkout'],
  }, async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutStepOnePage,
    checkoutStepTwoPage,
    checkoutCompletePage,
    headerMenu,
  }) => {
    const ctx = buildContext({
      loginPage,
      inventoryPage,
      cartPage,
      checkoutStepOnePage,
      checkoutStepTwoPage,
      checkoutCompletePage,
    });

    for (const profile of userBehaviorMatrix.filter((p) => p.loginExpectation === 'success')) {
      await test.step(`Checkout capability for ${profile.key}`, async () => {
        await loginAsUser(ctx, profile.key);
        const loginOk = await didLoginSucceed(ctx);
        expect(loginOk).toBe(true);

        const checkoutResult = await tryFullCheckout(ctx);
        if (profile.canCheckout === false) {
          expect(checkoutResult).toBe(false);
        } else {
          expect(checkoutResult).toBe(true);
        }

        await logoutIfPossible(headerMenu, loginPage);
      });
    }
  });
});
