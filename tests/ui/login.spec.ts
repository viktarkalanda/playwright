// tests/ui/login.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';
import { TestConfig } from '../../src/config/testConfig';

const config = TestConfig.getInstance();

test('user can login with valid credentials', async ({ loginPage, page }) => {
  const { username, password } = config.getUser('standard');

  await loginPage.login(username, password);

  await expect(
    page,
    'User should be redirected to inventory page after successful login',
  ).toHaveURL(/inventory\.html/);
});

test('user sees error message on invalid password', async ({ loginPage }) => {
  await loginPage.open();
  await loginPage.fillUsername('standard_user');
  await loginPage.fillPassword('wrong_password');
  await loginPage.submitLogin();

  await expect(
    loginPage.errorMessage,
    'Error message should be visible for invalid login',
  ).toBeVisible();

  const errorText = await loginPage.getErrorText();
  expect(errorText, 'Error message text should mention invalid username/password').toContain(
    'Username and password do not match',
  );
});

test('user sees error message when username is missing', async ({ loginPage }) => {
  await loginPage.open();
  await loginPage.fillPassword('secret_sauce');
  await loginPage.submitLogin();

  await expect(
    loginPage.errorMessage,
    'Error message should be visible when username is missing',
  ).toBeVisible();

  const errorText = await loginPage.getErrorText();
  expect(errorText, 'Error text should mention that username is required').toContain(
    'Username is required',
  );
});

test('user sees error message when password is missing', async ({ loginPage }) => {
  await loginPage.open();
  await loginPage.fillUsername('standard_user');
  await loginPage.submitLogin();

  await expect(
    loginPage.errorMessage,
    'Error message should be visible when password is missing',
  ).toBeVisible();

  const errorText = await loginPage.getErrorText();
  expect(errorText, 'Error text should mention that password is required').toContain(
    'Password is required',
  );
});

test('locked out user sees locked out error message', async ({ loginPage }) => {
  const { username, password } = config.getUser('locked');

  await loginPage.open();
  await loginPage.fillUsername(username);
  await loginPage.fillPassword(password);
  await loginPage.submitLogin();

  await expect(
    loginPage.errorMessage,
    'Error message should be visible for locked out user',
  ).toBeVisible();

  const errorText = await loginPage.getErrorText();
  expect(errorText, 'Error text should mention that user is locked out').toContain(
    'Sorry, this user has been locked out',
  );
});

test('user sees error message on invalid username', async ({ loginPage }) => {
  await loginPage.open();
  await loginPage.fillUsername('unknown_user');
  await loginPage.fillPassword('secret_sauce');
  await loginPage.submitLogin();

  await expect(
    loginPage.errorMessage,
    'Error message should be visible for invalid username',
  ).toBeVisible();

  const errorText = await loginPage.getErrorText();
  expect(errorText, 'Error message text should mention invalid username/password').toContain(
    'Username and password do not match',
  );
});

test('error message can be closed by user', async ({ loginPage }) => {
  await loginPage.open();
  await loginPage.fillUsername('standard_user');
  await loginPage.fillPassword('wrong_password');
  await loginPage.submitLogin();

  await expect(
    loginPage.errorMessage,
    'Error message should be visible before closing',
  ).toBeVisible();

  await loginPage.closeError();

  await expect(
    loginPage.errorMessage,
    'Error message should not be visible after closing',
  ).not.toBeVisible();
});

test('login form keeps input values after invalid attempt', async ({ loginPage }) => {
  await loginPage.open();
  await loginPage.fillUsername('standard_user');
  await loginPage.fillPassword('wrong_password');
  await loginPage.submitLogin();

  await expect(
    loginPage.errorMessage,
    'Error should appear after submitting invalid credentials',
  ).toBeVisible();
  await expect(
    loginPage.usernameInput,
    'Username input should still contain previously entered value',
  ).toHaveValue('standard_user');
  await expect(
    loginPage.passwordInput,
    'Password input should still contain previously entered value',
  ).toHaveValue('wrong_password');
});

test('error message reappears after closing and submitting invalid login again', async ({
  loginPage,
}) => {
  await loginPage.open();
  await loginPage.fillUsername('standard_user');
  await loginPage.fillPassword('wrong_password');
  await loginPage.submitLogin();

  await loginPage.closeError();

  await expect(
    loginPage.errorMessage,
    'Error message should be hidden after clicking close button',
  ).not.toBeVisible();

  await loginPage.fillPassword('another_wrong_password');
  await loginPage.submitLogin();

  await expect(
    loginPage.errorMessage,
    'Error message should appear again after another invalid attempt',
  ).toBeVisible();

  const errorText = await loginPage.getErrorText();
  expect(
    errorText,
    'Error text should still mention invalid username/password on the second attempt',
  ).toContain('Username and password do not match');
});

test('user can login by pressing Enter key on password input', async ({ loginPage, page }) => {
  const { username, password } = config.getUser('standard');

  await loginPage.open();
  await loginPage.fillUsername(username);
  await loginPage.fillPassword(password);
  await loginPage.passwordInput.press('Enter');

  await expect(
    page,
    'Submitting login form via Enter key should navigate to inventory page',
  ).toHaveURL(/inventory\.html/);
});
