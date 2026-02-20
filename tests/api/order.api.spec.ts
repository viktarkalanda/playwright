import { test } from '@playwright/test';
import { allure } from 'allure-playwright';
import { faker } from '@faker-js/faker';
import { axiosClient } from '../../src/utils';

/**
 * Order API Test Suite
 * ===================
 * 
 * This test suite covers the Order API endpoints and verifies:
 * - Order creation process
 * - Order status management
 * - Order retrieval and validation
 * - Error handling and edge cases
 * 
 * Key Test Scenarios:
 * 1. Create new order
 * 2. Retrieve order details
 * 3. Verify order status transitions
 * 4. Handle invalid order operations
 * 
 * API Endpoints Tested:
 * - POST /api/orders
 * - GET /api/orders/{id}
 * - PATCH /api/orders/{id}/status
 * 
 * Test Data Strategy:
 * - Using fixtures for consistent test data
 * - Generating random order details
 * - Validating order status transitions
 * 
 * Reporting:
 * - Detailed request/response logging
 * - Allure attachments for API interactions
 * - Test step documentation
 */

// Order status enum for type safety
enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

// Order fixtures
const orderFixtures = {
  basic: {
    customerId: faker.string.uuid(),
    items: [
      {
        productId: 1,
        quantity: 2,
        price: parseFloat(faker.commerce.price())
      },
      {
        productId: 2,
        quantity: 1,
        price: parseFloat(faker.commerce.price())
      }
    ],
    shippingAddress: {
      street: faker.location.street(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      zipCode: faker.location.zipCode()
    },
    billingAddress: {
      street: faker.location.street(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      zipCode: faker.location.zipCode()
    },
    paymentDetails: {
      method: faker.helpers.arrayElement(['CREDIT_CARD', 'PAYPAL', 'BANK_TRANSFER']),
      transactionId: faker.string.uuid(),
      amount: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 })
    },
    metadata: {
      customerNotes: faker.word.words(5),
      giftWrapping: faker.datatype.boolean(),
      source: faker.helpers.arrayElement(['WEB', 'MOBILE_APP', 'PHONE'])
    }
  }
};

test.describe('Order API Tests @api @order', () => {
  // Helper functions
  const attachJsonToAllure = async (name: string, json: any) => {
    await allure.attachment(
      name,
      JSON.stringify(json, null, 2),
      'application/json'
    );
  };

  const validateOrderSchema = (order: any) => {
    const requiredFields = [
      'id',
      'customerId',
      'items',
      'shippingAddress',
      'billingAddress',
      'paymentDetails',
      'status',
      'metadata',
      'createdAt',
      'updatedAt'
    ];

    for (const field of requiredFields) {
      if (!(field in order)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate items array
    if (!Array.isArray(order.items) || order.items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    // Validate item structure
    order.items.forEach((item: any, index: number) => {
      ['productId', 'quantity', 'price'].forEach(field => {
        if (!(field in item)) {
          throw new Error(`Missing field ${field} in item at index ${index}`);
        }
      });
    });
  };

  const waitForOrderStatus = async (orderId: string, expectedStatus: OrderStatus, maxAttempts = 10) => {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await axiosClient.get(`/api/orders/${orderId}`);
      if (response.data.status === expectedStatus) {
        return response.data;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error(`Order did not reach ${expectedStatus} status after ${maxAttempts} attempts`);
  };

  test('should create order and verify paid status', async () => {
    let orderId: string;
    const orderData = orderFixtures.basic;

    await allure.step('Creating new order', async () => {
      await attachJsonToAllure('Order Creation Payload', orderData);

      const response = await axiosClient.post('/api/orders', orderData);
      
      await allure.step('Validating creation response', async () => {
        test.expect(response.status).toBe(201);
        test.expect(response.data.id).toBeTruthy();
        validateOrderSchema(response.data);
        test.expect(response.data.status).toBe(OrderStatus.PENDING);
      });

      orderId = response.data.id;
      await attachJsonToAllure('Created Order', response.data);
    });

    await allure.step('Processing payment', async () => {
      const paymentResponse = await axiosClient.post(`/api/orders/${orderId}/payment`, {
        amount: orderData.paymentDetails.amount,
        method: orderData.paymentDetails.method,
        transactionId: orderData.paymentDetails.transactionId
      });

      test.expect(paymentResponse.status).toBe(200);
      await attachJsonToAllure('Payment Response', paymentResponse.data);
    });

    await allure.step('Waiting for PAID status', async () => {
      const paidOrder = await waitForOrderStatus(orderId, OrderStatus.PAID);
      await attachJsonToAllure('Paid Order', paidOrder);
      
      test.expect(paidOrder.status).toBe(OrderStatus.PAID);
      test.expect(paidOrder.paymentDetails.status).toBe('COMPLETED');
    });

    await allure.step('Verifying order details', async () => {
      const response = await axiosClient.get(`/api/orders/${orderId}`);
      
      await allure.step('Validating retrieved order', async () => {
        test.expect(response.status).toBe(200);
        test.expect(response.data.customerId).toBe(orderData.customerId);
        test.expect(response.data.items).toHaveLength(orderData.items.length);
        validateOrderSchema(response.data);
      });

      await attachJsonToAllure('Retrieved Order', response.data);
    });
  });

  test('should handle invalid order data', async () => {
    const invalidData = {
      customerId: faker.string.uuid(),
      items: [] // Empty items array
    };

    await allure.step('Attempting to create order with invalid data', async () => {
      try {
        await axiosClient.post('/api/orders', invalidData);
        throw new Error('Should not create order with invalid data');
      } catch (error: any) {
        await allure.step('Validating error response', async () => {
          test.expect(error.response.status).toBe(400);
          test.expect(error.response.data.errors).toBeTruthy();
        });

        await attachJsonToAllure('Validation Error', error.response.data);
      }
    });
  });

  test('should handle order status transitions', async () => {
    const orderData = orderFixtures.basic;
    let orderId: string;

    await allure.step('Creating initial order', async () => {
      const response = await axiosClient.post('/api/orders', orderData);
      orderId = response.data.id;
      await attachJsonToAllure('Initial Order', response.data);
    });

    const statusTransitions = [
      OrderStatus.PROCESSING,
      OrderStatus.PAID,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED
    ];

    for (const status of statusTransitions) {
      await allure.step(`Transitioning to ${status}`, async () => {
        const response = await axiosClient.patch(`/api/orders/${orderId}/status`, {
          status,
          reason: `Automated transition to ${status}`
        });

        test.expect(response.status).toBe(200);
        test.expect(response.data.status).toBe(status);
        await attachJsonToAllure(`${status} Transition`, response.data);
      });

      await allure.step(`Verifying ${status} status`, async () => {
        const verifyResponse = await axiosClient.get(`/api/orders/${orderId}`);
        test.expect(verifyResponse.data.status).toBe(status);
      });
    }
  });

  test('should handle concurrent order operations', async () => {
    const orderData = orderFixtures.basic;
    let orderId: string;

    await allure.step('Creating test order', async () => {
      const response = await axiosClient.post('/api/orders', orderData);
      orderId = response.data.id;
    });

    await allure.step('Performing concurrent operations', async () => {
      const operations = [
        axiosClient.get(`/api/orders/${orderId}`),
        axiosClient.patch(`/api/orders/${orderId}/status`, { status: OrderStatus.PROCESSING }),
        axiosClient.patch(`/api/orders/${orderId}/status`, { status: OrderStatus.PAID }),
        axiosClient.get(`/api/orders/${orderId}`)
      ];

      const results = await Promise.all(operations.map(p => p.catch(e => e)));
      
      await allure.step('Validating concurrent operations', async () => {
        let successCount = 0;
        for (const result of results) {
          if (!(result instanceof Error)) {
            successCount++;
            test.expect(result.status).toBeLessThan(500);
          }
        }
        test.expect(successCount).toBeGreaterThan(0);
      });

      await attachJsonToAllure('Concurrent Operations Results', results);
    });
  });
}); 





