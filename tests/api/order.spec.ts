import { test, expect } from '@playwright/test';
import { commonSelectors } from '../../src/types/common';

test.describe('Order API Tests', () => {
  test('should create a new order', async ({ request }) => {
    const orderData = {
      items: [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 }
      ],
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        country: 'Test Country',
        postalCode: '12345'
      }
    };

    const response = await request.post(`${process.env.API_URL}/orders`, {
      data: orderData
    });
    expect(response.ok()).toBeTruthy();
    const order = await response.json();
    expect(order).toHaveProperty('id');
    expect(order).toHaveProperty('status', 'pending');
  });

  test('should get order details', async ({ request }) => {
    const response = await request.get(`${process.env.API_URL}/orders/1`);
    expect(response.ok()).toBeTruthy();
    const order = await response.json();
    expect(order).toHaveProperty('id');
    expect(order).toHaveProperty('status');
    expect(order).toHaveProperty('items');
  });

  test('should list user orders', async ({ request }) => {
    const response = await request.get(`${process.env.API_URL}/orders/my-orders`);
    expect(response.ok()).toBeTruthy();
    const orders = await response.json();
    expect(Array.isArray(orders)).toBeTruthy();
  });
}); 