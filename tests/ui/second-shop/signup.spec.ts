// tests/ui/second-shop/signup.spec.ts
import { test, expect } from '../../../src/second-shop/fixtures/test-fixtures';
import type { SecondShopFixtures } from '../../../src/second-shop/fixtures/test-fixtures';

type SetupFixtures = Pick<SecondShopFixtures, 'secondHomePage' | 'secondNavBar' | 'secondSignUpModal' | 'secondLoginModal'>;

async function openSignUpModal({ secondHomePage, secondNavBar, secondSignUpModal }: Omit<SetupFixtures, 'secondLoginModal'>): Promise<void> {
  await secondHomePage.open();
  await secondHomePage.waitForLoaded();
  await secondNavBar.openSignUpModal();
  await secondSignUpModal.waitForOpen();
}

test.describe('Sign up modal', () => {
  test.describe('Positive cases', () => {
    test('successful registration shows success alert', { tag: ['@signup', '@smoke', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal,
    }) => {
      await openSignUpModal({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondSignUpModal.fill(`newuser_${Date.now()}`, 'pass123');
      const message = await secondSignUpModal.signUpAndWaitForAlert();

      expect(message.toLowerCase()).toContain('sign up successful');
    });

    test('registered user can log in after signup', { tag: ['@signup', '@login', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal, secondLoginModal,
    }) => {
      const username = `regtest_${Date.now()}`;
      const password = 'regpass123';

      await openSignUpModal({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondSignUpModal.fill(username, password);
      await secondSignUpModal.signUpAndWaitForAlert();

      await secondNavBar.openLoginModal();
      await secondLoginModal.waitForOpen();
      await secondLoginModal.fill(username, password);
      await secondLoginModal.loginExpectingSuccess();

      await expect(secondNavBar.logoutLink).toBeVisible();
    });

    test('sign up modal opens and is visible', { tag: ['@signup', '@smoke', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal,
    }) => {
      await openSignUpModal({ secondHomePage, secondNavBar, secondSignUpModal });

      expect(await secondSignUpModal.isOpen()).toBe(true);
    });

    test('sign up modal can be closed without registering', { tag: ['@signup', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal,
    }) => {
      await openSignUpModal({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondSignUpModal.fill('someuser', 'somepass');
      await secondSignUpModal.close();

      expect(await secondSignUpModal.isOpen()).toBe(false);
    });
  });

  test.describe('Negative cases', () => {
    test('duplicate username shows error alert', { tag: ['@signup', '@negative', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal,
    }) => {
      const username = `dupuser_${Date.now()}`;
      const password = 'duppass123';

      // First signup — register the user
      await openSignUpModal({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondSignUpModal.fill(username, password);
      await secondSignUpModal.signUpAndWaitForAlert();

      // Navigate fresh to get a clean logged-out state, then try to register again
      await openSignUpModal({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondSignUpModal.fill(username, password);
      const message = await secondSignUpModal.signUpAndWaitForAlert();

      expect(message.toLowerCase()).toContain('exist');
    });

    test('empty username shows error alert', { tag: ['@signup', '@negative', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal,
    }) => {
      await openSignUpModal({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondSignUpModal.fill('', 'somepass');
      const message = await secondSignUpModal.signUpAndWaitForAlert();

      expect(message).toBeTruthy();
    });

    test('empty password shows error alert', { tag: ['@signup', '@negative', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal,
    }) => {
      await openSignUpModal({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondSignUpModal.fill('someuser', '');
      const message = await secondSignUpModal.signUpAndWaitForAlert();

      expect(message).toBeTruthy();
    });

    test('both fields empty shows error alert', { tag: ['@signup', '@negative', '@regression'] }, async ({
      secondHomePage, secondNavBar, secondSignUpModal,
    }) => {
      await openSignUpModal({ secondHomePage, secondNavBar, secondSignUpModal });
      await secondSignUpModal.fill('', '');
      const message = await secondSignUpModal.signUpAndWaitForAlert();

      expect(message).toBeTruthy();
    });
  });
});
