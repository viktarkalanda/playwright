import { test as base, expect } from '@playwright/test';
import { HomePage } from '../../pages/second-shop/HomePage';
import { ProductPage } from '../../pages/second-shop/ProductPage';
import { CartPage } from '../../pages/second-shop/CartPage';
import { OrderModal } from '../../pages/second-shop/OrderModal';
import { NavBar } from '../../pages/second-shop/NavBar';
import { LoginModal } from '../../pages/second-shop/LoginModal';
import { SignUpModal } from '../../pages/second-shop/SignUpModal';
import { ContactModal } from '../../pages/second-shop/ContactModal';

type Pages = {
  secondHomePage: HomePage;
  secondProductPage: ProductPage;
  secondCartPage: CartPage;
  secondOrderModal: OrderModal;
  secondNavBar: NavBar;
  secondLoginModal: LoginModal;
  secondSignUpModal: SignUpModal;
  secondContactModal: ContactModal;
};

export type SecondShopFixtures = Pages;

export const test = base.extend<SecondShopFixtures>({
  secondHomePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  secondProductPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  secondCartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  secondOrderModal: async ({ page }, use) => {
    await use(new OrderModal(page));
  },
  secondNavBar: async ({ page }, use) => {
    await use(new NavBar(page));
  },
  secondLoginModal: async ({ page }, use) => {
    await use(new LoginModal(page));
  },
  secondSignUpModal: async ({ page }, use) => {
    await use(new SignUpModal(page));
  },
  secondContactModal: async ({ page }, use) => {
    await use(new ContactModal(page));
  },
});

export { expect };
