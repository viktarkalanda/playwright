import { test as base, expect, Page } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { OrderModal } from '../pages/OrderModal';

type Pages = {
  secondHomePage: HomePage;
  secondProductPage: ProductPage;
  secondCartPage: CartPage;
  secondOrderModal: OrderModal;
};

export type SecondShopFixtures = Pages;

export const test = base.extend<SecondShopFixtures>({
  secondHomePage: async ({ page }, use) => {
    const home = new HomePage(page);
    await use(home);
  },
  secondProductPage: async ({ page }, use) => {
    const product = new ProductPage(page);
    await use(product);
  },
  secondCartPage: async ({ page }, use) => {
    const cart = new CartPage(page);
    await use(cart);
  },
  secondOrderModal: async ({ page }, use) => {
    const modal = new OrderModal(page);
    await use(modal);
  },
});

export { expect };
