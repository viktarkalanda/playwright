import { test, expect } from '../../src/fixtures/test-fixtures';
import { TestConfig } from '../../src/config/testConfig';

const config = TestConfig.getInstance();

test.beforeEach(async ({ loginPage }) => {
  await loginPage.open();
});

test('user can login with valid credentials', async ({ loginPage, page }) => {
  const { username, password } = config.getUser('standard');
  await loginPage.login(username, password);

  await expect(
    page,
    'User should be redirected to inventory page after successful login',
  ).toHaveURL(/inventory\.html/);
});

test('user sees error message on invalid password', async ({ loginPage }) => {
  await loginPage.usernameInput.fill('standard_user');
  await loginPage.passwordInput.fill('wrong_password');
  await loginPage.loginButton.click();

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
  await loginPage.passwordInput.fill('secret_sauce');
  await loginPage.loginButton.click();

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
  await loginPage.usernameInput.fill('standard_user');
  await loginPage.loginButton.click();

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
  await loginPage.usernameInput.fill(username);
  await loginPage.passwordInput.fill(password);
  await loginPage.loginButton.click();

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
  await loginPage.usernameInput.fill('unknown_user');
  await loginPage.passwordInput.fill('secret_sauce');
  await loginPage.loginButton.click();

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
  await loginPage.usernameInput.fill('standard_user');
  await loginPage.passwordInput.fill('wrong_password');
  await loginPage.loginButton.click();

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
