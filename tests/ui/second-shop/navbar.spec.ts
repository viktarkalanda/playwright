// tests/ui/second-shop/navbar.spec.ts
import { test, expect } from '../../../src/second-shop/fixtures/test-fixtures';
import type { SecondShopFixtures } from '../../../src/second-shop/fixtures/test-fixtures';

type AuthFixtures = Pick<SecondShopFixtures, 'secondHomePage' | 'secondNavBar' | 'secondSignUpModal' | 'secondLoginModal'>;

async function registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal }: AuthFixtures): Promise<string> {
  const username = `navtest_${Date.now()}`;
  const password = 'navpass123';
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
  return username;
}

test.describe('NavBar', () => {
  test.describe('Before login', () => {
    test('shows Login and Sign up buttons', { tag: ['@smoke', '@regression'] }, async ({
      secondHomePage, secondNavBar,
    }) => {
      await secondHomePage.open();
      await secondHomePage.waitForLoaded();

      await expect(secondNavBar.loginButton).toBeVisible();
      await expect(secondNavBar.signUpButton).toBeVisible();
    });

    test('does not show Logout link', { tag: ['@smoke', '@regression'] }, async ({
      secondHomePage, secondNavBar,
    }) => {
      await secondHomePage.open();
      await secondHomePage.waitForLoaded();

      await expect(secondNavBar.logoutLink).toBeHidden();
    });

    test('does not show logged-in username', { tag: ['@regression'] }, async ({
      secondHomePage, secondNavBar,
    }) => {
      await secondHomePage.open();
      await secondHomePage.waitForLoaded();

      const text = await secondNavBar.loggedInUsername.textContent().catch(() => '');
      expect((text ?? '').replace('Welcome', '').trim()).toBe('');
    });
  });

  test.describe('After login', () => {
    test('shows Logout link after successful login', { tag: ['@smoke', '@regression', '@login'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });

      await expect(secondNavBar.logoutLink).toBeVisible();
    });

    test('shows username in navbar after login', { tag: ['@regression', '@login'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      const username = await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });

      const displayed = await secondNavBar.getLoggedInUsername();
      expect(displayed).toContain(username);
    });

    test('hides Login button after login', { tag: ['@regression', '@login'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });

      await expect(secondNavBar.loginButton).toBeHidden();
    });

    test('hides Sign up button after login', { tag: ['@regression', '@login'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });

      await expect(secondNavBar.signUpButton).toBeHidden();
    });
  });

  test.describe('After logout', () => {
    test('shows Login button again after logout', { tag: ['@regression', '@login'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });
      await secondNavBar.logout();

      await expect(secondNavBar.loginButton).toBeVisible();
    });

    test('shows Sign up button again after logout', { tag: ['@regression', '@login'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });
      await secondNavBar.logout();

      await expect(secondNavBar.signUpButton).toBeVisible();
    });

    test('hides Logout link after logout', { tag: ['@regression', '@login'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      await registerAndLogin({ secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal });
      await secondNavBar.logout();

      await expect(secondNavBar.logoutLink).toBeHidden();
    });
  });
});
