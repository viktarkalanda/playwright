// tests/ui/login.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';
import { TestConfig, UserKey } from '../../src/config/testConfig';

const config = TestConfig.getInstance();

const userKeys: Record<string, UserKey> = {
  standard: 'standard',
  lockedOut: 'lockedOut',
  problem: 'problem',
  performanceGlitch: 'performanceGlitch',
  error: 'error',
  visual: 'visual',
};

async function attemptLogin(
  loginPage,
  userKey: UserKey,
  overrides?: Partial<{ username: string; password: string }>,
): Promise<void> {
  const { username, password } = {
    ...config.getUser(userKey),
    ...overrides,
  };
  await loginPage.open();
  await loginPage.fillUsername(username);
  await loginPage.fillPassword(password);
  await loginPage.submitLogin();
}

test.describe('Login flows on Sauce Demo', () => {
  test('standard user logs in successfully and sees inventory', { tag: ['@login', '@smoke'] }, async ({
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.loginAs(userKeys.standard);
    await inventoryPage.waitForVisible();
    const title = await inventoryPage.getTitleText();
    expect(title, 'Inventory page should be visible after successful login').toBe('Products');
  });

  test('invalid password shows error message', { tag: '@login' }, async ({ loginPage }) => {
    await attemptLogin(loginPage, userKeys.standard, { password: 'wrong_password' });
    expect(await loginPage.isErrorVisible(), 'Error message should appear for wrong password').toBe(
      true,
    );
    const errorText = await loginPage.getErrorText();
    expect(errorText).toContain('Username and password do not match');
  });

  test('invalid username shows error message', { tag: '@login' }, async ({ loginPage }) => {
    await attemptLogin(loginPage, userKeys.standard, { username: 'random_user' });
    expect(await loginPage.isErrorVisible(), 'Error message should appear for unknown user').toBe(
      true,
    );
    const errorText = await loginPage.getErrorText();
    expect(errorText).toContain('Username and password do not match');
  });

  test('missing username triggers validation error', { tag: '@login' }, async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.fillPassword('secret_sauce');
    await loginPage.submitLogin();
    const errorText = await loginPage.getErrorText();
    expect(errorText).toContain('Username is required');
  });

  test('missing password triggers validation error', { tag: '@login' }, async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.fillUsername('standard_user');
    await loginPage.submitLogin();
    const errorText = await loginPage.getErrorText();
    expect(errorText).toContain('Password is required');
  });

  test('locked out user cannot log in', { tag: '@login' }, async ({ loginPage }) => {
    await loginPage.loginAs(userKeys.lockedOut);
    const errorText = await loginPage.getErrorText();
    expect(errorText).toContain('Sorry, this user has been locked out');
  });

  test('problem user logs in but product images have known issue', { tag: '@login' }, async ({
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.loginAs(userKeys.problem);
    await inventoryPage.waitForVisible();
    const names = await inventoryPage.getAllItemNames();
    expect(names.length, 'Problem user should still see inventory items').toBeGreaterThan(0);
  });

  test('performance glitch user experiences slower load but eventually sees inventory', { tag: '@login' }, async ({
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.loginAs(userKeys.performanceGlitch);
    await inventoryPage.waitForVisible();
    const count = await inventoryPage.getItemsCount();
    expect(count, 'Performance glitch user should eventually see items').toBeGreaterThan(0);
  });

  test('error user encounters issues after login', { tag: ['@login', '@e2e'] }, async ({
    loginPage,
    inventoryPage,
    cartPage,
  }) => {
    await loginPage.loginAs(userKeys.error);
    await inventoryPage.waitForVisible();
    await inventoryPage.openCart();
    await cartPage.waitForVisible();
    const itemsCount = await cartPage.getItemsCount();
    expect(
      itemsCount,
      'Error user cart may behave unexpectedly but should still be reachable',
    ).toBeGreaterThanOrEqual(0);
  });

  test('user can log out and log in as different user', { tag: '@login' }, async ({
    loginPage,
    inventoryPage,
    headerMenu,
  }) => {
    await loginPage.loginAs(userKeys.standard);
    await inventoryPage.waitForVisible();
    await headerMenu.clickLogout();

    await loginPage.loginAs(userKeys.problem);
    await inventoryPage.waitForVisible();
    const names = await inventoryPage.getAllItemNames();
    expect(names.length, 'Problem user should see inventory after relogin').toBeGreaterThan(0);
  });

  test('visual user login ensures UI loads without errors', { tag: '@login' }, async ({
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.loginAs(userKeys.visual);
    await inventoryPage.waitForVisible();
    const badgeCount = await inventoryPage.getCartBadgeCount();
    expect(badgeCount).toBe(0);
  });
});

