// tests/global-setup.ts
//
// Runs once before the entire test suite.
// Logs in as the standard user and saves the browser storage state so that
// individual tests don't have to repeat the login flow through the UI.
//
// The saved file is loaded via `use.storageState` in playwright.config.ts.
// Tests that specifically exercise the login page override this with
//   test.use({ storageState: undefined })
// at the top of their spec file.

import { chromium, FullConfig } from '@playwright/test';
import { TestConfig } from '../src/config/testConfig';
import * as fs from 'fs';
import * as path from 'path';

const AUTH_FILE = 'playwright/.auth/standard-user.json';

export default async function globalSetup(_config: FullConfig): Promise<void> {
  const testConfig = TestConfig.getInstance();
  const { username, password } = testConfig.getUser('standard');

  // Ensure the directory exists.
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(testConfig.baseUrl);
  await page.locator('[data-test="username"]').fill(username);
  await page.locator('[data-test="password"]').fill(password);
  await page.locator('[data-test="login-button"]').click();

  // Wait until we land on the inventory page — confirms login succeeded.
  await page.waitForSelector('[data-test="inventory-container"]');

  await page.context().storageState({ path: AUTH_FILE });
  await browser.close();
}
