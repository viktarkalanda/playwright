import { test, expect } from '@playwright/test';
import { ProductPage } from '../../src/pageObjects/ProductPage';
import { commonSelectors } from '../../src/types/common';

test.describe('Product API Tests', () => {
  test('should get product details', async ({ request }) => {
    const response = await request.get(`${process.env.API_URL}/products/1`);
    expect(response.ok()).toBeTruthy();
    const product = await response.json();
    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('price');
  });

  test('should list products with pagination', async ({ request }) => {
    const response = await request.get(`${process.env.API_URL}/products?page=1&limit=10`);
    expect(response.ok()).toBeTruthy();
    const products = await response.json();
    expect(Array.isArray(products.items)).toBeTruthy();
    expect(products.items.length).toBeLessThanOrEqual(10);
  });

  test('should search products', async ({ request }) => {
    const searchTerm = 'test';
    const response = await request.get(`${process.env.API_URL}/products/search?q=${searchTerm}`);
    expect(response.ok()).toBeTruthy();
    const results = await response.json();
    expect(Array.isArray(results.items)).toBeTruthy();
  });
}); 