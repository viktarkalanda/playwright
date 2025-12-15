import type { RouteKey } from './routes';

export type PageKey =
  | 'login'
  | 'inventory'
  | 'cart'
  | 'productDetails'
  | 'checkoutStepOne'
  | 'checkoutStepTwo'
  | 'checkoutComplete'
  | 'about';

export interface ButtonTexts {
  primary?: string;
  secondary?: string;
  checkout?: string;
  continueShopping?: string;
  finish?: string;
  backToProducts?: string;
}

export interface PageContentDefinition {
  key: PageKey;
  routeKey: RouteKey;
  title?: string;
  mainHeader?: string;
  subtitle?: string;
  buttons?: ButtonTexts;
  successMessage?: string;
}

export const pageContent: Record<PageKey, PageContentDefinition> = {
  login: {
    key: 'login',
    routeKey: 'login',
    title: 'Swag Labs',
    mainHeader: 'Swag Labs',
    buttons: {
      primary: 'Login',
    },
  },
  inventory: {
    key: 'inventory',
    routeKey: 'inventory',
    title: 'Swag Labs',
    mainHeader: 'Products',
  },
  cart: {
    key: 'cart',
    routeKey: 'cart',
    title: 'Swag Labs',
    mainHeader: 'Your Cart',
    buttons: {
      checkout: 'Checkout',
      continueShopping: 'Continue Shopping',
    },
  },
  productDetails: {
    key: 'productDetails',
    routeKey: 'inventoryItem',
    title: 'Swag Labs',
    mainHeader: 'Products',
    buttons: {
      backToProducts: 'Back to products',
    },
  },
  checkoutStepOne: {
    key: 'checkoutStepOne',
    routeKey: 'checkoutStepOne',
    title: 'Swag Labs',
    mainHeader: 'Checkout: Your Information',
    buttons: {
      primary: 'Continue',
      secondary: 'Cancel',
    },
  },
  checkoutStepTwo: {
    key: 'checkoutStepTwo',
    routeKey: 'checkoutStepTwo',
    title: 'Swag Labs',
    mainHeader: 'Checkout: Overview',
    buttons: {
      primary: 'Finish',
      secondary: 'Cancel',
      finish: 'Finish',
    },
  },
  checkoutComplete: {
    key: 'checkoutComplete',
    routeKey: 'checkoutComplete',
    title: 'Swag Labs',
    mainHeader: 'Checkout: Complete!',
    successMessage: 'THANK YOU FOR YOUR ORDER',
    buttons: {
      primary: 'Back Home',
    },
  },
  about: {
    key: 'about',
    routeKey: 'inventory',
    title: 'Sauce Labs',
  },
};

export function getPageContent(key: PageKey): PageContentDefinition {
  const def = pageContent[key];
  if (!def) {
    throw new Error(`No page content definition for key "${key}"`);
  }
  return def;
}
