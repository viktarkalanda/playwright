// tests/ui/second-shop/auth-logout.spec.ts
import { test, expect } from '../../../src/second-shop/fixtures/test-fixtures';
import type { SecondShopFixtures } from '../../../src/second-shop/fixtures/test-fixtures';

type AuthFixtures = Pick<SecondShopFixtures, 'secondHomePage' | 'secondNavBar' | 'secondSignUpModal' | 'secondLoginModal'>;

async function registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal }: AuthFixtures): Promise<{ username: string; password: string }> {
  const username = `logouttest_${Date.now()}`;
  const password = 'logoutpass123';
  await secondHomePage.open();
  await secondHomePage.waitForLoaded();
  await secondNavBar.openSignUpModal();
  await secondSignUpModal.waitForOpen();
  await secondSignUpModal.fill(username, password);
  await secondSignUpModal.signUpAndWaitForAlert();
  await secondNavBar.openLoginModal();
  await secondLoginModal.waitForOpen();
  await secondLoginModal.fill(username, password);
  await secondLoginModal.loginExpectingSuccess();
  return { username, password };
}

test.describe('Logout', () => {
  test('logout link is visible when logged in', { tag: ['@login', '@smoke', '@regression'] }, async ({
    secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
  }) => {
    await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });

    await expect(secondNavBar.logoutLink).toBeVisible();
  });

  test('logout hides the logout link', { tag: ['@login', '@regression'] }, async ({
    secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
  }) => {
    await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });
    await secondNavBar.logout();

    await expect(secondNavBar.logoutLink).toBeHidden();
  });

  test('logout restores Login button', { tag: ['@login', '@regression'] }, async ({
    secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
  }) => {
    await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });
    await secondNavBar.logout();

    await expect(secondNavBar.loginButton).toBeVisible();
  });

  test('logout restores Sign up button', { tag: ['@login', '@regression'] }, async ({
    secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
  }) => {
    await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });
    await secondNavBar.logout();

    await expect(secondNavBar.signUpButton).toBeVisible();
  });

  test('username disappears from navbar after logout', { tag: ['@login', '@regression'] }, async ({
    secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
  }) => {
    const { username } = await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });
    const beforeLogout = await secondNavBar.getLoggedInUsername();
    expect(beforeLogout).toContain(username);

    await secondNavBar.logout();

    const afterLogout = await secondNavBar.loggedInUsername.textContent().catch(() => '');
    expect((afterLogout ?? '').replace('Welcome', '').trim()).toBe('');
  });

  test('can log in again after logout', { tag: ['@login', '@regression'] }, async ({
    secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
  }) => {
    const { username, password } = await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });
    await secondNavBar.logout();

    await expect(secondNavBar.logoutLink).toBeHidden();

    await secondNavBar.openLoginModal();
    await secondLoginModal.waitForOpen();
    await secondLoginModal.fill(username, password);
    await secondLoginModal.loginExpectingSuccess();

    await expect(secondNavBar.logoutLink).toBeVisible();
  });

  test('isLoggedIn returns false before login', { tag: ['@login', '@regression'] }, async ({
    secondHomePage, secondNavBar,
  }) => {
    await secondHomePage.open();
    await secondHomePage.waitForLoaded();

    expect(await secondNavBar.isLoggedIn()).toBe(false);
  });

  test('isLoggedIn returns true after login', { tag: ['@login', '@regression'] }, async ({
    secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
  }) => {
    await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });

    expect(await secondNavBar.isLoggedIn()).toBe(true);
  });
});
