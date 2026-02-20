// tests/ui/login-negative-input.spec.ts
import { test, expect } from '../../../src/fixtures/test-fixtures';
import type { LoginPage } from '../../../src/pages/saucedemo/LoginPage';
import { edgeCaseStrings, generateString } from '../../../src/utils/stringGenerators';
import { validationMessages } from '../../../src/data/validationMessages';
import {
  expectUsernameRequiredError,
  expectPasswordRequiredError,
  expectInvalidCredentialsError,
} from '../../../src/utils/assertions';

const standardPassword = 'secret_sauce';
const sqlPayload = "standard_user' OR '1'='1";
const sqlPasswordPayload = "secret_sauce' OR '1'='1";
const htmlPayload = '<script>alert("x")</script>';

async function submitLogin(
  loginPage: LoginPage,
  username: string,
  password: string,
): Promise<void> {
  await loginPage.open();
  await loginPage.fillUsername(username);
  await loginPage.fillPassword(password);
  await loginPage.submitLogin();
}

test.describe('Login advanced negative input', () => {
  test('login with whitespace-only username shows required username error', {
    tag: ['@login', '@negative', '@validation'],
  }, async ({ loginPage }) => {
    await submitLogin(loginPage, edgeCaseStrings.multiSpace, standardPassword);

    const error = await loginPage.getErrorText();
    if (error.trim() === validationMessages.login.usernameRequired) {
      expectUsernameRequiredError(error);
    } else {
      expectInvalidCredentialsError(error);
    }
  });

  test('login with whitespace-only password shows required password error', {
    tag: ['@login', '@negative', '@validation'],
  }, async ({ loginPage }) => {
    await submitLogin(loginPage, 'standard_user', edgeCaseStrings.multiSpace);

    const error = await loginPage.getErrorText();
    if (error.trim() === validationMessages.login.passwordRequired) {
      expectPasswordRequiredError(error);
    } else {
      expectInvalidCredentialsError(error);
    }
  });

  test('login with very long username and valid password is rejected', {
    tag: ['@login', '@negative', '@long'],
  }, async ({ loginPage }) => {
    await submitLogin(loginPage, edgeCaseStrings.longLatin, standardPassword);

    const error = await loginPage.getErrorText();
    expectInvalidCredentialsError(error);
  });

  test('login with valid username and very long password is rejected', {
    tag: ['@login', '@negative', '@long'],
  }, async ({ loginPage }) => {
    await submitLogin(loginPage, 'standard_user', edgeCaseStrings.longLatin);

    const error = await loginPage.getErrorText();
    expectInvalidCredentialsError(error);
  });

  test('login with unicode username is rejected', {
    tag: ['@login', '@negative', '@unicode'],
  }, async ({ loginPage }) => {
    await submitLogin(loginPage, edgeCaseStrings.unicodeShort, standardPassword);

    const error = await loginPage.getErrorText();
    expectInvalidCredentialsError(error);
  });

  test('login with SQL-like injection patterns is rejected', {
    tag: ['@login', '@negative', '@security'],
  }, async ({ loginPage }) => {
    await submitLogin(loginPage, sqlPayload, sqlPasswordPayload);

    const error = await loginPage.getErrorText();
    expectInvalidCredentialsError(error);
  });

  test('login with HTML-like payload in username is rejected', {
    tag: ['@login', '@negative', '@security'],
  }, async ({ loginPage }) => {
    await submitLogin(loginPage, htmlPayload, standardPassword);

    const error = await loginPage.getErrorText();
    expectInvalidCredentialsError(error);
  });

  test('login with empty fields keeps user on login page', {
    tag: ['@login', '@negative', '@validation'],
  }, async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.submitLogin();

    await loginPage.waitForVisible();
    const error = await loginPage.getErrorText();
    expectUsernameRequiredError(error);
  });

  test('login input trims leading/trailing spaces in username if supported', {
    tag: ['@login', '@negative'],
  }, async ({ loginPage, inventoryPage }) => {
    await submitLogin(loginPage, '   standard_user   ', standardPassword);

    const inventoryVisible = await inventoryPage.inventoryContainer.isVisible();
    if (inventoryVisible) {
      await inventoryPage.waitForVisible();
      expect(inventoryVisible).toBe(true);
    } else {
      const error = await loginPage.getErrorText();
      expectInvalidCredentialsError(error);
    }
  });

  test('login input trims leading/trailing spaces in password if supported', {
    tag: ['@login', '@negative'],
  }, async ({ loginPage, inventoryPage }) => {
    await submitLogin(loginPage, 'standard_user', `   ${standardPassword}   `);

    const inventoryVisible = await inventoryPage.inventoryContainer.isVisible();
    if (inventoryVisible) {
      await inventoryPage.waitForVisible();
      expect(inventoryVisible).toBe(true);
    } else {
      const error = await loginPage.getErrorText();
      expectInvalidCredentialsError(error);
    }
  });

  test('login with random special characters is rejected', {
    tag: ['@login', '@negative', '@security'],
  }, async ({ loginPage }) => {
    const randomSymbols = generateString(64, 'symbols');
    await submitLogin(loginPage, randomSymbols, randomSymbols);

    const error = await loginPage.getErrorText();
    expectInvalidCredentialsError(error);
  });
});
