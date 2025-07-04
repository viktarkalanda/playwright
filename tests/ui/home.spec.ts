import { test, expect } from '@playwright/test';
import { HomePage } from '../../src/pageObjects/HomePage';

/**
 * @group home
 * @group smoke
 * 
 * Home page smoke tests verify critical functionality of the landing page
 */

test('verify hero banner visibility and content @smoke', async ({ page }) => {
  // Initialize page object
  const home = new HomePage(page);
  
  // Navigate and verify landing page
  await home.navigate();
  await expect(home.heroBanner).toBeVisible();
  
  // Additional verifications can be added here using home.* methods
});
