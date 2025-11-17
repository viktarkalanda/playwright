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
    'User should be redirected to inventory page after successful login'
  ).toHaveURL(/inventory\.html/);
});

test('user sees error message on invalid password', async ({ loginPage }) => {
  await loginPage.usernameInput.fill('standard_user');
  await loginPage.passwordInput.fill('wrong_password');
  await loginPage.loginButton.click();

  await expect(
    loginPage.errorMessage,
    'Error message should be visible for invalid login'
  ).toBeVisible();

  const errorText = await loginPage.getErrorText();
  expect(
    errorText,
    'Error message text should mention invalid username/password'
  ).toContain('Username and password do not match');
});
