import { test, expect } from '../../../src/second-shop/fixtures/test-fixtures';

test('second shop home page loads and shows products', { tag: ['@smoke'] }, async ({ secondHomePage }) => {
  await secondHomePage.open();
  await secondHomePage.waitForLoaded();
  const products = await secondHomePage.getVisibleProductNames();
  expect(products.length).toBeGreaterThan(0);
});

test('second shop allows switching categories and changes products', { tag: ['@categories'] }, async ({ secondHomePage }) => {
  await secondHomePage.open();
  await secondHomePage.waitForLoaded();

  await secondHomePage.selectCategoryByName('Phones');
  const phones = await secondHomePage.getVisibleProductNames();

  await secondHomePage.selectCategoryByName('Laptops');
  const laptops = await secondHomePage.getVisibleProductNames();

  expect(phones).not.toEqual(laptops);
});

test('second shop allows opening product details from home', { tag: ['@product'] }, async ({ secondHomePage, secondProductPage }) => {
  await secondHomePage.open();
  await secondHomePage.waitForLoaded();

  const products = await secondHomePage.getVisibleProductNames();
  const firstProduct = products[0];

  expect(firstProduct).toBeTruthy();

  await secondHomePage.openProductByName(firstProduct);
  await secondProductPage.waitForVisible();

  const productName = await secondProductPage.getProductName();
  expect(productName).toContain(firstProduct);
});

test('second shop allows adding product to cart and seeing it in cart', { tag: ['@cart', '@smoke'] }, async ({ secondHomePage, secondProductPage, secondCartPage }) => {
  await secondHomePage.open();
  await secondHomePage.waitForLoaded();

  const products = await secondHomePage.getVisibleProductNames();
  const productName = products[0];

  expect(productName).toBeTruthy();

  await secondHomePage.openProductByName(productName);
  await secondProductPage.waitForVisible();
  await secondProductPage.addToCart();
  await secondProductPage.goToCart();

  await secondCartPage.waitForVisible();
  const cartItems = await secondCartPage.getCartItemNames();

  expect(cartItems).toContain(productName);
});

test('second shop cart supports removing item by name', { tag: ['@cart'] }, async ({ secondHomePage, secondProductPage, secondCartPage }) => {
  await secondHomePage.open();
  await secondHomePage.waitForLoaded();

  const products = await secondHomePage.getVisibleProductNames();
  const firstProduct = products[0];
  const secondProduct = products[1];

  expect(firstProduct).toBeTruthy();
  expect(secondProduct).toBeTruthy();

  await secondHomePage.openProductByName(firstProduct);
  await secondProductPage.waitForVisible();
  await secondProductPage.addToCart();

  await secondHomePage.open();
  await secondHomePage.waitForLoaded();
  await secondHomePage.openProductByName(secondProduct);
  await secondProductPage.waitForVisible();
  await secondProductPage.addToCart();
  await secondProductPage.goToCart();

  await secondCartPage.waitForVisible();
  await secondCartPage.removeItemByName(firstProduct);

  const remainingItems = await secondCartPage.getCartItemNames();
  expect(remainingItems).not.toContain(firstProduct);
  expect(remainingItems).toContain(secondProduct);
});

test('second shop cart can be cleared', { tag: ['@cart', '@cleanup'] }, async ({ secondHomePage, secondProductPage, secondCartPage }) => {
  await secondHomePage.open();
  await secondHomePage.waitForLoaded();

  const products = await secondHomePage.getVisibleProductNames();
  const firstProduct = products[0];
  const secondProduct = products[1];

  expect(firstProduct).toBeTruthy();
  expect(secondProduct).toBeTruthy();

  await secondHomePage.openProductByName(firstProduct);
  await secondProductPage.waitForVisible();
  await secondProductPage.addToCart();

  await secondHomePage.open();
  await secondHomePage.waitForLoaded();
  await secondHomePage.openProductByName(secondProduct);
  await secondProductPage.waitForVisible();
  await secondProductPage.addToCart();
  await secondProductPage.goToCart();

  await secondCartPage.waitForVisible();
  await secondCartPage.clearCartIfPossible();
  expect(await secondCartPage.isEmpty()).toBe(true);
});
