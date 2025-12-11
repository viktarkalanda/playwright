export type RouteKey =
  | 'root'
  | 'login'
  | 'inventory'
  | 'cart'
  | 'checkoutStepOne'
  | 'checkoutStepTwo'
  | 'checkoutComplete'
  | 'inventoryItem';

export interface RouteDefinition {
  key: RouteKey;
  path: string;
  description: string;
}

export interface RoutesConfig {
  baseUrl: string;
  routes: Record<RouteKey, RouteDefinition>;
}

const baseUrl = 'https://www.saucedemo.com';

export const routesConfig: RoutesConfig = {
  baseUrl,
  routes: {
    root: {
      key: 'root',
      path: '/',
      description: 'Application root',
    },
    login: {
      key: 'login',
      path: '/',
      description: 'Login page',
    },
    inventory: {
      key: 'inventory',
      path: '/inventory.html',
      description: 'Inventory page',
    },
    cart: {
      key: 'cart',
      path: '/cart.html',
      description: 'Shopping cart page',
    },
    checkoutStepOne: {
      key: 'checkoutStepOne',
      path: '/checkout-step-one.html',
      description: 'Checkout step one',
    },
    checkoutStepTwo: {
      key: 'checkoutStepTwo',
      path: '/checkout-step-two.html',
      description: 'Checkout step two',
    },
    checkoutComplete: {
      key: 'checkoutComplete',
      path: '/checkout-complete.html',
      description: 'Checkout complete',
    },
    inventoryItem: {
      key: 'inventoryItem',
      path: '/inventory-item.html',
      description: 'Product details page',
    },
  },
};

export function getRoute(key: RouteKey): RouteDefinition {
  return routesConfig.routes[key];
}

export function buildUrl(key: RouteKey): string {
  const route = getRoute(key);
  return `${routesConfig.baseUrl}${route.path}`;
}
