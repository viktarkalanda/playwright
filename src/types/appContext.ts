import type { Page } from '@playwright/test';
import type { LoginPage } from '../pages/saucedemo/LoginPage';
import type { InventoryPage } from '../pages/saucedemo/InventoryPage';
import type { CartPage } from '../pages/saucedemo/CartPage';
import type { CheckoutStepOnePage } from '../pages/saucedemo/CheckoutStepOnePage';
import type { CheckoutStepTwoPage } from '../pages/saucedemo/CheckoutStepTwoPage';
import type { CheckoutCompletePage } from '../pages/saucedemo/CheckoutCompletePage';
import type { ProductDetailsPage } from '../pages/saucedemo/ProductDetailsPage';
import type { HeaderMenu } from '../pages/saucedemo/HeaderMenu';
import type { Footer } from '../pages/saucedemo/Footer';

/**
 * Canonical set of SauceDemo page objects shared across utilities.
 * Specific context types are derived from this via Pick / Omit.
 */
export interface SauceDemoContext {
  page: Page;
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutStepOnePage: CheckoutStepOnePage;
  checkoutStepTwoPage: CheckoutStepTwoPage;
  checkoutCompletePage: CheckoutCompletePage;
  productDetailsPage: ProductDetailsPage;
  headerMenu: HeaderMenu;
  footer: Footer;
}
