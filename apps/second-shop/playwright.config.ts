import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 7000,
  },
  reporter: [['line'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.SECOND_SHOP_BASE_URL || 'https://www.demoblaze.com',
    headless: true,
  },
});
