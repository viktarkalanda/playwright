export type RouteDefinition = {
  key: string;
  path: string;
  description: string;
};

export const SPA_FALLBACK_MARKER = 'Single Page Apps for GitHub Pages';

export const SPA_ROUTES: RouteDefinition[] = [
  { key: 'login', path: '/', description: 'Login SPA entry point' },
  { key: 'inventory', path: '/?/inventory.html', description: 'Inventory SPA route' },
  { key: 'cart', path: '/?/cart.html', description: 'Cart SPA route' },
  {
    key: 'productDetails',
    path: '/?/inventory-item.html?id=4',
    description: 'Product details SPA route for backpack',
  },
  { key: 'checkoutStepOne', path: '/?/checkout-step-one.html', description: 'Checkout step one SPA route' },
  { key: 'checkoutStepTwo', path: '/?/checkout-step-two.html', description: 'Checkout step two SPA route' },
  {
    key: 'checkoutComplete',
    path: '/?/checkout-complete.html',
    description: 'Checkout complete SPA route',
  },
];

export const LEGACY_ROUTES: RouteDefinition[] = [
  { key: 'inventoryLegacy', path: '/inventory.html', description: 'Legacy inventory route without ?/' },
  { key: 'cartLegacy', path: '/cart.html', description: 'Legacy cart route without ?/' },
  {
    key: 'productDetailsLegacy',
    path: '/inventory-item.html?id=4',
    description: 'Legacy product details route',
  },
  {
    key: 'checkoutStepOneLegacy',
    path: '/checkout-step-one.html',
    description: 'Legacy checkout step one route',
  },
  {
    key: 'checkoutStepTwoLegacy',
    path: '/checkout-step-two.html',
    description: 'Legacy checkout step two route',
  },
  {
    key: 'checkoutCompleteLegacy',
    path: '/checkout-complete.html',
    description: 'Legacy checkout complete route',
  },
];

export const STATIC_ENDPOINTS = {
  manifest: '/manifest.json',
  serviceWorker: '/service-worker.js',
  robots: '/robots.txt',
};

export interface IconAssetDefinition {
  path: string;
  size: number;
  mime: string;
  description: string;
}

export const ICON_ASSETS: IconAssetDefinition[] = [
  { path: '/icon-192x192.png', size: 192, mime: 'image/png', description: '192px progressive web app icon' },
  { path: '/icon-256x256.png', size: 256, mime: 'image/png', description: '256px progressive web app icon' },
  { path: '/icon-384x384.png', size: 384, mime: 'image/png', description: '384px progressive web app icon' },
  { path: '/icon-512x512.png', size: 512, mime: 'image/png', description: '512px progressive web app icon' },
];

export interface MediaAssetDefinition {
  baseName: string;
  mime: string;
  description: string;
}

export const MEDIA_ASSETS: MediaAssetDefinition[] = [
  { baseName: 'bike-light-1200x1500.jpg', mime: 'image/jpeg', description: 'Bike light product photo' },
  { baseName: 'bolt-shirt-1200x1500.jpg', mime: 'image/jpeg', description: 'Bolt shirt product photo' },
  { baseName: 'red-onesie-1200x1500.jpg', mime: 'image/jpeg', description: 'Red onesie product photo' },
  { baseName: 'red-tatt-1200x1500.jpg', mime: 'image/jpeg', description: 'Test.allTheThings() shirt product photo' },
  { baseName: 'sauce-backpack-1200x1500.jpg', mime: 'image/jpeg', description: 'Backpack product photo' },
  { baseName: 'sauce-pullover-1200x1500.jpg', mime: 'image/jpeg', description: 'Fleece jacket product photo' },
  { baseName: 'sl-404.jpg', mime: 'image/jpeg', description: '404 illustration asset' },
  { baseName: 'pony-express.png', mime: 'image/png', description: 'Pony Express logo graphic' },
  { baseName: 'menu3x.svg', mime: 'image/svg+xml', description: 'Hamburger menu SVG icon' },
];

export const FORM_ENDPOINT = '/';
