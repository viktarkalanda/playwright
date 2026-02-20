// tests/ui/checkout-negative-input.spec.ts
import { test, expect } from '../../../src/fixtures/test-fixtures';
import type { InventoryPage } from '../../../src/pages/saucedemo/InventoryPage';
import type { CartPage } from '../../../src/pages/saucedemo/CartPage';
import type { CheckoutStepOnePage } from '../../../src/pages/saucedemo/CheckoutStepOnePage';
import type { CheckoutStepTwoPage } from '../../../src/pages/saucedemo/CheckoutStepTwoPage';
import { edgeCaseStrings, generateString } from '../../../src/utils/stringGenerators';
import { productCatalog } from '../../../src/data/products';
import {
  expectFirstNameRequiredError,
  expectLastNameRequiredError,
  expectPostalCodeRequiredError,
} from '../../../src/utils/assertions';

const defaultProduct =
  productCatalog.products[0]?.name ??
  'Sauce Labs Backpack';

async function startCheckoutFromInventory(
  inventoryPage: InventoryPage,
  cartPage: CartPage,
  checkoutStepOnePage: CheckoutStepOnePage,
  productNames: string[] = [defaultProduct],
): Promise<void> {
  await inventoryPage.waitForVisible();
  for (const name of productNames) {
    await inventoryPage.addProductToCartByName(name);
  }
  await inventoryPage.openCart();
  await cartPage.waitForVisible();
  await cartPage.proceedToCheckout();
  await checkoutStepOnePage.waitForVisible();
}

async function expectAdvanceToStepTwo(checkoutStepTwoPage: CheckoutStepTwoPage): Promise<void> {
  await checkoutStepTwoPage.waitForVisible();
  await expect(checkoutStepTwoPage.summaryContainer).toBeVisible();
}

test.describe('Checkout step one advanced negative input', () => {
  test.beforeEach(async ({ loggedInInventoryPage }) => {
    await loggedInInventoryPage.waitForVisible();
  });

  test(
    'first name with only whitespace is treated as missing',
    { tag: ['@checkout', '@negative', '@validation'] },
    async ({ inventoryPage, cartPage, checkoutStepOnePage }) => {
      await startCheckoutFromInventory(inventoryPage, cartPage, checkoutStepOnePage);

      await checkoutStepOnePage.fillForm(edgeCaseStrings.multiSpace, 'ValidLast', '12345');
      await checkoutStepOnePage.continueToStepTwo();

      const error = await checkoutStepOnePage.getErrorText();
      expectFirstNameRequiredError(error);
    },
  );

  test(
    'last name with only whitespace is treated as missing',
    { tag: ['@checkout', '@negative', '@validation'] },
    async ({ inventoryPage, cartPage, checkoutStepOnePage }) => {
      await startCheckoutFromInventory(inventoryPage, cartPage, checkoutStepOnePage);

      await checkoutStepOnePage.fillForm('ValidFirst', edgeCaseStrings.multiSpace, '12345');
      await checkoutStepOnePage.continueToStepTwo();

      const error = await checkoutStepOnePage.getErrorText();
      expectLastNameRequiredError(error);
    },
  );

  test(
    'postal code with only whitespace is treated as missing or invalid',
    { tag: ['@checkout', '@negative', '@validation'] },
    async ({ inventoryPage, cartPage, checkoutStepOnePage }) => {
      await startCheckoutFromInventory(inventoryPage, cartPage, checkoutStepOnePage);

      await checkoutStepOnePage.fillForm('ValidFirst', 'ValidLast', edgeCaseStrings.multiSpace);
      await checkoutStepOnePage.continueToStepTwo();

      const error = await checkoutStepOnePage.getErrorText();
      expectPostalCodeRequiredError(error);
    },
  );

  test(
    'very long first name is handled on checkout step one',
    { tag: ['@checkout', '@negative', '@long'] },
    async ({ inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage }) => {
      await startCheckoutFromInventory(inventoryPage, cartPage, checkoutStepOnePage);

      await checkoutStepOnePage.fillForm(edgeCaseStrings.longLatin, 'Smith', '12345');
      await checkoutStepOnePage.continueToStepTwo();

      await expectAdvanceToStepTwo(checkoutStepTwoPage);
    },
  );

  test(
    'very long last name is handled on checkout step one',
    { tag: ['@checkout', '@negative', '@long'] },
    async ({ inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage }) => {
      await startCheckoutFromInventory(inventoryPage, cartPage, checkoutStepOnePage);

      await checkoutStepOnePage.fillForm('John', edgeCaseStrings.longLatin, '12345');
      await checkoutStepOnePage.continueToStepTwo();

      await expectAdvanceToStepTwo(checkoutStepTwoPage);
    },
  );

  test(
    'very long postal code is handled on checkout step one',
    { tag: ['@checkout', '@negative', '@long'] },
    async ({ inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage }) => {
      await startCheckoutFromInventory(inventoryPage, cartPage, checkoutStepOnePage);

      await checkoutStepOnePage.fillForm('John', 'Smith', generateString(64, 'digits'));
      await checkoutStepOnePage.continueToStepTwo();

      await expectAdvanceToStepTwo(checkoutStepTwoPage);
    },
  );

  test(
    'unicode characters in first name do not break checkout',
    { tag: ['@checkout', '@negative', '@unicode'] },
    async ({ inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage }) => {
      await startCheckoutFromInventory(inventoryPage, cartPage, checkoutStepOnePage);

      await checkoutStepOnePage.fillForm(edgeCaseStrings.unicodeShort, 'Smith', '12345');
      await checkoutStepOnePage.continueToStepTwo();

      await expectAdvanceToStepTwo(checkoutStepTwoPage);
    },
  );

  test(
    'unicode characters in last name do not break checkout',
    { tag: ['@checkout', '@negative', '@unicode'] },
    async ({ inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage }) => {
      await startCheckoutFromInventory(inventoryPage, cartPage, checkoutStepOnePage);

      await checkoutStepOnePage.fillForm('John', edgeCaseStrings.unicodeShort, '12345');
      await checkoutStepOnePage.continueToStepTwo();

      await expectAdvanceToStepTwo(checkoutStepTwoPage);
    },
  );

  test(
    'non-numeric postal code is handled explicitly',
    { tag: ['@checkout', '@negative'] },
    async ({ inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage }) => {
      await startCheckoutFromInventory(inventoryPage, cartPage, checkoutStepOnePage);

      await checkoutStepOnePage.fillForm('John', 'Smith', 'ABCDE');
      await checkoutStepOnePage.continueToStepTwo();

      await expectAdvanceToStepTwo(checkoutStepTwoPage);
    },
  );

  test(
    'sql-like payload in postal code does not bypass validation',
    { tag: ['@checkout', '@negative', '@security'] },
    async ({ inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage }) => {
      await startCheckoutFromInventory(inventoryPage, cartPage, checkoutStepOnePage);

      await checkoutStepOnePage.fillForm('John', 'Smith', "12345'; DROP TABLE users; --");
      await checkoutStepOnePage.continueToStepTwo();

      await expectAdvanceToStepTwo(checkoutStepTwoPage);
    },
  );

  test(
    'html-like payload in first name is sanitized or accepted safely',
    { tag: ['@checkout', '@negative', '@security'] },
    async ({ inventoryPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage }) => {
      await startCheckoutFromInventory(inventoryPage, cartPage, checkoutStepOnePage);

      await checkoutStepOnePage.fillForm('<b>John</b>', 'Smith', '12345');
      await checkoutStepOnePage.continueToStepTwo();

      await expectAdvanceToStepTwo(checkoutStepTwoPage);
    },
  );
});
