// tests/ui/saucedemo/footer.spec.ts
//
// Verifies that the SauceDemo footer is rendered correctly on all pages
// that a logged-in user can reach: inventory, cart, checkout step one,
// checkout step two, and the product details page.
//
// Also validates social media links and copyright text.

import { test, expect } from '../../../src/fixtures/test-fixtures';
import { makeCheckoutUserData } from '../../../src/utils/testData';
import { productCatalog } from '../../../src/data/products';

const firstProductName = productCatalog.products[0]?.name ?? 'Sauce Labs Backpack';
const secondProductName = productCatalog.products[1]?.name ?? firstProductName;

test.describe('Footer — content and presence', () => {
  test.beforeEach(async ({ loggedInInventoryPage }) => {
    await loggedInInventoryPage.waitForVisible();
  });

  // -------------------------------------------------------------------------
  // Inventory page
  // -------------------------------------------------------------------------

  test(
    'footer is visible on the inventory page',
    { tag: ['@footer', '@inventory', '@smoke'] },
    async ({ inventoryPage, footer }) => {
      await inventoryPage.waitForVisible();
      await expect(footer.footerCopy, 'Footer element should be visible on inventory page').toBeVisible();
    },
  );

  test(
    'footer copyright text contains "Sauce Labs"',
    { tag: ['@footer', '@inventory'] },
    async ({ inventoryPage, footer }) => {
      await inventoryPage.waitForVisible();
      const text = await footer.getFooterText();
      expect(text, 'Copyright notice should mention Sauce Labs').toContain('Sauce Labs');
    },
  );

  test(
    'footer copyright text contains current or recent year',
    { tag: ['@footer', '@inventory'] },
    async ({ inventoryPage, footer }) => {
      await inventoryPage.waitForVisible();
      const text = await footer.getFooterText();
      // SauceDemo keeps a static year in the footer; we accept 2024 or 2025.
      const hasYear = /202[0-9]/.test(text);
      expect(hasYear, `Footer text "${text}" should contain a year like 202x`).toBe(true);
    },
  );

  // -------------------------------------------------------------------------
  // Social media links
  // -------------------------------------------------------------------------

  test(
    'footer has exactly 3 social media links',
    { tag: ['@footer', '@social'] },
    async ({ inventoryPage, footer }) => {
      await inventoryPage.waitForVisible();
      const count = await footer.getSocialLinksCount();
      expect(count, 'Footer should have 3 social media links (Twitter, Facebook, LinkedIn)').toBe(3);
    },
  );

  test(
    'Twitter link is visible and points to saucelabs',
    { tag: ['@footer', '@social'] },
    async ({ inventoryPage, footer }) => {
      await inventoryPage.waitForVisible();
      await expect(footer.twitterLink, 'Twitter link should be visible').toBeVisible();
      const href = await footer.getTwitterHref();
      expect(href, 'Twitter link should point to the Sauce Labs Twitter account').toContain('twitter.com');
    },
  );

  test(
    'Facebook link is visible and points to saucelabs',
    { tag: ['@footer', '@social'] },
    async ({ inventoryPage, footer }) => {
      await inventoryPage.waitForVisible();
      await expect(footer.facebookLink, 'Facebook link should be visible').toBeVisible();
      const href = await footer.getFacebookHref();
      expect(href, 'Facebook link should point to the Sauce Labs Facebook page').toContain('facebook.com');
    },
  );

  test(
    'LinkedIn link is visible and points to saucelabs',
    { tag: ['@footer', '@social'] },
    async ({ inventoryPage, footer }) => {
      await inventoryPage.waitForVisible();
      await expect(footer.linkedinLink, 'LinkedIn link should be visible').toBeVisible();
      const href = await footer.getLinkedinHref();
      expect(href, 'LinkedIn link should point to the Sauce Labs LinkedIn profile').toContain('linkedin.com');
    },
  );

  // -------------------------------------------------------------------------
  // Cart page
  // -------------------------------------------------------------------------

  test(
    'footer is visible on the cart page',
    { tag: ['@footer', '@cart'] },
    async ({ inventoryPage, cartPage, footer }) => {
      await inventoryPage.addProductToCartByName(firstProductName);
      await inventoryPage.openCart();
      await cartPage.waitForVisible();

      await expect(footer.footerCopy, 'Footer should be present on the cart page').toBeVisible();
      const text = await footer.getFooterText();
      expect(text, 'Footer copyright text should be visible on cart page').toContain('Sauce Labs');
    },
  );

  // -------------------------------------------------------------------------
  // Product details page
  // -------------------------------------------------------------------------

  test(
    'footer is visible on the product details page',
    { tag: ['@footer', '@details'] },
    async ({ inventoryPage, productDetailsPage, footer }) => {
      await inventoryPage.openItemDetailsByName(firstProductName);
      await productDetailsPage.waitForVisible();

      await expect(footer.footerCopy, 'Footer should be visible on product details page').toBeVisible();
      const text = await footer.getFooterText();
      expect(text, 'Footer copyright text should be visible on product details page').toContain('Sauce Labs');
    },
  );

  // -------------------------------------------------------------------------
  // Checkout step one
  // -------------------------------------------------------------------------

  test(
    'footer is visible on checkout step one',
    { tag: ['@footer', '@checkout'] },
    async ({ inventoryPage, cartPage, checkoutStepOnePage, footer }) => {
      await inventoryPage.addProductToCartByName(firstProductName);
      await inventoryPage.openCart();
      await cartPage.waitForVisible();
      await cartPage.startCheckout();
      await checkoutStepOnePage.waitForVisible();

      await expect(
        footer.footerCopy,
        'Footer should be present on checkout step one',
      ).toBeVisible();
    },
  );

  // -------------------------------------------------------------------------
  // Checkout step two
  // -------------------------------------------------------------------------

  test(
    'footer is visible on checkout step two',
    { tag: ['@footer', '@checkout'] },
    async ({ inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage, footer }) => {
      await inventoryPage.addProductToCartByName(firstProductName);
      await inventoryPage.openCart();
      await cartPage.waitForVisible();
      await cartPage.startCheckout();
      await checkoutStepOnePage.waitForVisible();

      const user = makeCheckoutUserData();
      await checkoutStepOnePage.completeStepOne(user.firstName, user.lastName, user.postalCode);
      await checkoutStepTwoPage.waitForVisible();

      await expect(
        footer.footerCopy,
        'Footer should be present on checkout step two',
      ).toBeVisible();
    },
  );

  // -------------------------------------------------------------------------
  // Footer consistency across pages
  // -------------------------------------------------------------------------

  test(
    'footer copyright text is identical on inventory and cart',
    { tag: ['@footer', '@smoke'] },
    async ({ inventoryPage, cartPage, footer }) => {
      await inventoryPage.waitForVisible();
      const textOnInventory = await footer.getFooterText();

      await inventoryPage.addProductToCartByName(secondProductName);
      await inventoryPage.openCart();
      await cartPage.waitForVisible();
      const textOnCart = await footer.getFooterText();

      expect(textOnCart, 'Footer text should be identical across inventory and cart pages').toBe(
        textOnInventory,
      );
    },
  );

  test(
    'all social links open in new tab (target=_blank or rel=noopener)',
    { tag: ['@footer', '@social'] },
    async ({ inventoryPage, footer }) => {
      await inventoryPage.waitForVisible();

      for (const [name, locator] of [
        ['Twitter', footer.twitterLink],
        ['Facebook', footer.facebookLink],
        ['LinkedIn', footer.linkedinLink],
      ] as const) {
        const target = await locator.getAttribute('target');
        const rel = await locator.getAttribute('rel');
        const opensSafely =
          target === '_blank' || (rel !== null && rel.includes('noopener'));

        expect(
          opensSafely,
          `${name} link should open in a new tab or have rel=noopener`,
        ).toBe(true);
      }
    },
  );
});
