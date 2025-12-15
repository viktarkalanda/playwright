import type { UserKey } from '../config/testConfig';

export type ScenarioStepType =
  | 'login'
  | 'addProductsToCart'
  | 'openCart'
  | 'startCheckout'
  | 'fillCheckoutForm'
  | 'goToStepTwo'
  | 'finishCheckout'
  | 'verifyCheckoutComplete'
  | 'logout'
  | 'resetAppState'
  | 'openProductDetails'
  | 'backToInventory'
  | 'openAbout'
  | 'returnFromAbout';

export interface ScenarioStepBase {
  type: ScenarioStepType;
  description?: string;
}

export interface LoginStep extends ScenarioStepBase {
  type: 'login';
  user: UserKey;
}

export interface AddProductsToCartStep extends ScenarioStepBase {
  type: 'addProductsToCart';
  productNames?: string[];
  count?: number;
}

export interface OpenCartStep extends ScenarioStepBase {
  type: 'openCart';
}

export interface StartCheckoutStep extends ScenarioStepBase {
  type: 'startCheckout';
}

export interface FillCheckoutFormStep extends ScenarioStepBase {
  type: 'fillCheckoutForm';
  firstName?: string;
  lastName?: string;
  postalCode?: string;
}

export interface GoToStepTwoStep extends ScenarioStepBase {
  type: 'goToStepTwo';
}

export interface FinishCheckoutStep extends ScenarioStepBase {
  type: 'finishCheckout';
}

export interface VerifyCheckoutCompleteStep extends ScenarioStepBase {
  type: 'verifyCheckoutComplete';
}

export interface LogoutStep extends ScenarioStepBase {
  type: 'logout';
}

export interface ResetAppStateStep extends ScenarioStepBase {
  type: 'resetAppState';
}

export interface OpenProductDetailsStep extends ScenarioStepBase {
  type: 'openProductDetails';
  productName?: string;
}

export interface BackToInventoryStep extends ScenarioStepBase {
  type: 'backToInventory';
}

export interface OpenAboutStep extends ScenarioStepBase {
  type: 'openAbout';
}

export interface ReturnFromAboutStep extends ScenarioStepBase {
  type: 'returnFromAbout';
}

export type ScenarioStep =
  | LoginStep
  | AddProductsToCartStep
  | OpenCartStep
  | StartCheckoutStep
  | FillCheckoutFormStep
  | GoToStepTwoStep
  | FinishCheckoutStep
  | VerifyCheckoutCompleteStep
  | LogoutStep
  | ResetAppStateStep
  | OpenProductDetailsStep
  | BackToInventoryStep
  | OpenAboutStep
  | ReturnFromAboutStep;

export interface ScenarioDefinition {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  steps: ScenarioStep[];
}

export const scenarios: ScenarioDefinition[] = [
  {
    id: 'smoke_checkout_single_item',
    name: 'Smoke: single item checkout',
    description: 'Standard user performs a happy-path checkout with a single product',
    tags: ['@scenario', '@smoke', '@checkout', '@e2e'],
    steps: [
      { type: 'login', user: 'standard' },
      { type: 'addProductsToCart', count: 1 },
      { type: 'openCart' },
      { type: 'startCheckout' },
      { type: 'fillCheckoutForm', firstName: 'John', lastName: 'Doe', postalCode: '12345' },
      { type: 'goToStepTwo' },
      { type: 'finishCheckout' },
      { type: 'verifyCheckoutComplete' },
      { type: 'logout' },
    ],
  },
  {
    id: 'regression_checkout_multiple_items',
    name: 'Regression: multiple item checkout',
    description: 'Regression scenario with multiple items and reset',
    tags: ['@scenario', '@regression', '@checkout', '@e2e'],
    steps: [
      { type: 'login', user: 'standard' },
      { type: 'addProductsToCart', count: 3 },
      { type: 'openCart' },
      { type: 'startCheckout' },
      { type: 'fillCheckoutForm', firstName: 'Jane', lastName: 'Smith', postalCode: '54321' },
      { type: 'goToStepTwo' },
      { type: 'finishCheckout' },
      { type: 'verifyCheckoutComplete' },
      { type: 'resetAppState' },
      { type: 'logout' },
    ],
  },
  {
    id: 'cart_only_add_remove',
    name: 'Cart only: add and reset',
    tags: ['@scenario', '@cart'],
    steps: [
      { type: 'login', user: 'standard' },
      { type: 'addProductsToCart', count: 2 },
      { type: 'openCart' },
      { type: 'resetAppState' },
      { type: 'logout' },
    ],
  },
  {
    id: 'menu_about_and_back',
    name: 'Menu: About journey',
    tags: ['@scenario', '@menu', '@about'],
    steps: [
      { type: 'login', user: 'standard' },
      { type: 'openAbout' },
      { type: 'returnFromAbout' },
      { type: 'logout' },
    ],
  },
  {
    id: 'login_logout_cycle',
    name: 'Login/logout cycle',
    tags: ['@scenario', '@auth'],
    steps: [
      { type: 'login', user: 'standard' },
      { type: 'logout' },
      { type: 'login', user: 'standard' },
      { type: 'logout' },
    ],
  },
];

export function getScenarioById(id: string): ScenarioDefinition {
  const found = scenarios.find((s) => s.id === id);
  if (!found) {
    throw new Error(`Scenario with id "${id}" not found`);
  }
  return found;
}
