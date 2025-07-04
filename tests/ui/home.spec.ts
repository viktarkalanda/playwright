import { test, expect } from '@playwright/test';

test('smoke test - hero banner is visible', async ({ page }) => {
  // Navigate to the home page
  await page.goto('/');
  
  // Check that the hero banner is visible
  const heroBanner = page.getByTestId('hero-banner');
  await expect(heroBanner).toBeVisible();
});
