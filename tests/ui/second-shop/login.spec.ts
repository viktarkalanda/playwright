// tests/ui/second-shop/login.spec.ts
import { test, expect } from '../../../src/second-shop/fixtures/test-fixtures';
import type { SecondShopFixtures } from '../../../src/second-shop/fixtures/test-fixtures';

type SetupFixtures = Pick<SecondShopFixtures, 'secondHomePage' | 'secondNavBar' | 'secondSignUpModal' | 'secondLoginModal'>;

async function openHomeAndLoginModal({ secondHomePage, secondNavBar, secondLoginModal }: Omit<SetupFixtures, 'secondSignUpModal'>): Promise<void> {
  await secondHomePage.open();
  await secondHomePage.waitForLoaded();
  await secondNavBar.openLoginModal();
  await secondLoginModal.waitForOpen();
}

async function registerUser({ secondHomePage, secondNavBar, secondSignUpModal }: Omit<SetupFixtures, 'secondLoginModal'>): Promise<{ username: string; password: string }> {
  const username = `logintest_${Date.now()}`;
  const password = 'loginpass123';
  await secondHomePage.open();
  await secondHomePage.waitForLoaded();
  await secondNavBar.openSignUpModal();
  await secondSignUpModal.waitForOpen();
  await secondSignUpModal.fill(username, password);
  await secondSignUpModal.signUpAndWaitForAlert();
  return { username, password };
}

test.describe('Login modal', () => {
  test.describe('Positive cases', () => {
    test('successful login hides login button and shows logout', { tag: ['@login', '@smoke', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      const { username, password } = await registerUser({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondNavBar.openLoginModal();
      await secondLoginModal.waitForOpen();
      await secondLoginModal.fill(username, password);
      await secondLoginModal.loginExpectingSuccess();

      await expect(secondNavBar.logoutLink).toBeVisible();
      await expect(secondNavBar.loginButton).toBeHidden();
    });

    test('successful login shows username in navbar', { tag: ['@login', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      const { username, password } = await registerUser({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondNavBar.openLoginModal();
      await secondLoginModal.waitForOpen();
      await secondLoginModal.fill(username, password);
      await secondLoginModal.loginExpectingSuccess();

      const displayed = await secondNavBar.getLoggedInUsername();
      expect(displayed).toContain(username);
    });

    test('login modal is not visible after successful login', { tag: ['@login', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      const { username, password } = await registerUser({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondNavBar.openLoginModal();
      await secondLoginModal.waitForOpen();
      await secondLoginModal.fill(username, password);
      await secondLoginModal.loginExpectingSuccess();

      expect(await secondLoginModal.isOpen()).toBe(false);
    });
  });

  test.describe('Negative cases', () => {
    test('wrong password shows error alert', { tag: ['@login', '@negative', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      const { username } = await registerUser({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondNavBar.openLoginModal();
      await secondLoginModal.waitForOpen();
      await secondLoginModal.fill(username, 'wrongpassword');
      const message = await secondLoginModal.loginExpectingAlert();

      expect(message).toBeTruthy();
    });

    test('non-existent user shows error alert', { tag: ['@login', '@negative', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondLoginModal,
    }) => {
      await openHomeAndLoginModal({ secondHomePage, secondNavBar, secondLoginModal });
      await secondLoginModal.fill(`nouser_${Date.now()}`, 'anypass');
      const message = await secondLoginModal.loginExpectingAlert();

      expect(message).toBeTruthy();
    });

    test('empty username shows error alert', { tag: ['@login', '@negative', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondLoginModal,
    }) => {
      await openHomeAndLoginModal({ secondHomePage, secondNavBar, secondLoginModal });
      await secondLoginModal.fill('', 'somepass');
      const message = await secondLoginModal.loginExpectingAlert();

      expect(message).toBeTruthy();
    });

    test('empty password shows error alert', { tag: ['@login', '@negative', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondLoginModal,
    }) => {
      await openHomeAndLoginModal({ secondHomePage, secondNavBar, secondLoginModal });
      await secondLoginModal.fill('someuser', '');
      const message = await secondLoginModal.loginExpectingAlert();

      expect(message).toBeTruthy();
    });

    test('both fields empty shows error alert', { tag: ['@login', '@negative', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondLoginModal,
    }) => {
      await openHomeAndLoginModal({ secondHomePage, secondNavBar, secondLoginModal });
      await secondLoginModal.fill('', '');
      const message = await secondLoginModal.loginExpectingAlert();

      expect(message).toBeTruthy();
    });

    test('login modal can be closed without submitting', { tag: ['@login', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondLoginModal,
    }) => {
      await openHomeAndLoginModal({ secondHomePage, secondNavBar, secondLoginModal });
      await secondLoginModal.fill('user', 'pass');
      await secondLoginModal.close();

      expect(await secondLoginModal.isOpen()).toBe(false);
      await expect(secondNavBar.loginButton).toBeVisible();
    });
  });
});
