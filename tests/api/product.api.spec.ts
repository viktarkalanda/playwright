import { test } from '@playwright/test';
import { allure } from 'allure-playwright';
import { faker } from '@faker-js/faker';
import axiosClient from '../../src/helpers/axiosClient';

/**
 * Product API Test Suite
 * =====================
 * 
 * This test suite covers the Product API endpoints and verifies:
 * - Product retrieval functionality
 * - Product creation and deletion flows
 * - Data validation and error handling
 * - Response structure and content
 * 
 * Key Test Scenarios:
 * 1. Get product by ID
 * 2. Create new product
 * 3. Delete product
 * 4. Validate product data
 * 
 * API Endpoints Tested:
 * - GET /api/products/{id}
 * - POST /api/products
 * - DELETE /api/products/{id}
 * 
 * Test Data Strategy:
 * - Using Faker.js for generating random product data
 * - Cleaning up created test data after tests
 * - Validating response schemas
 * 
 * Reporting:
 * - Detailed request/response logging
 * - Allure attachments for API interactions
 * - Test step documentation
 */

test.describe('Product API Tests @api @product', () => {
  // Test data generators
  const generateProductData = () => ({
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: parseFloat(faker.commerce.price()),
    category: faker.commerce.department(),
    sku: faker.string.alphanumeric(8).toUpperCase(),
    attributes: {
      color: faker.commerce.color(),
      size: faker.helpers.arrayElement(['S', 'M', 'L', 'XL']),
      weight: faker.number.float({ min: 0.1, max: 10, fractionDigits: 1 }),
      material: faker.commerce.productMaterial()
    },
    stock: faker.number.int({ min: 0, max: 1000 }),
    manufacturer: {
      name: faker.company.name(),
      country: faker.location.country(),
      contact: {
        email: faker.internet.email(),
        phone: faker.phone.number()
      }
    },
    metadata: {
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      tags: Array.from({ length: 3 }, () => faker.commerce.productAdjective())
    }
  });

  // Helper functions
  const attachJsonToAllure = async (name: string, json: any) => {
    await allure.attachment(
      name,
      JSON.stringify(json, null, 2),
      'application/json'
    );
  };

  const validateProductSchema = (product: any) => {
    const requiredFields = [
      'id',
      'name',
      'description',
      'price',
      'category',
      'sku',
      'attributes',
      'stock',
      'manufacturer',
      'metadata'
    ];

    for (const field of requiredFields) {
      if (!(field in product)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  };

  test('should get product by ID', async () => {
    await allure.step('Getting product with ID 1', async () => {
      const response = await axiosClient.get('/api/products/1');
      
      await allure.step('Validating response status code', async () => {
        test.expect(response.status).toBe(200);
      });

      await allure.step('Validating product data', async () => {
        const product = response.data;
        test.expect(product.id).toBe(1);
        validateProductSchema(product);
      });

      await attachJsonToAllure('Product Details', response.data);
    });
  });

  test('should create and delete product', async () => {
    let createdProductId: number;
    const productData = generateProductData();

    await allure.step('Creating new product', async () => {
      await attachJsonToAllure('Product Creation Payload', productData);

      const response = await axiosClient.post('/api/products', productData);
      
      await allure.step('Validating creation response', async () => {
        test.expect(response.status).toBe(201);
        test.expect(response.data.id).toBeTruthy();
        validateProductSchema(response.data);
      });

      createdProductId = response.data.id;
      await attachJsonToAllure('Created Product', response.data);
    });

    await allure.step('Verifying created product', async () => {
      const response = await axiosClient.get(`/api/products/${createdProductId}`);
      
      await allure.step('Validating retrieved product', async () => {
        test.expect(response.status).toBe(200);
        test.expect(response.data.name).toBe(productData.name);
        test.expect(response.data.price).toBe(productData.price);
        validateProductSchema(response.data);
      });

      await attachJsonToAllure('Retrieved Product', response.data);
    });

    await allure.step('Deleting created product', async () => {
      const response = await axiosClient.delete(`/api/products/${createdProductId}`);
      
      await allure.step('Validating deletion response', async () => {
        test.expect(response.status).toBe(204);
      });
    });

    await allure.step('Verifying product deletion', async () => {
      try {
        await axiosClient.get(`/api/products/${createdProductId}`);
        throw new Error('Product should not exist');
      } catch (error: any) {
        test.expect(error.response.status).toBe(404);
        await attachJsonToAllure('Deletion Verification', error.response.data);
      }
    });
  });

  test('should handle invalid product data', async () => {
    const invalidData = {
      name: '', // Empty name
      price: -100, // Negative price
      category: null // Missing category
    };

    await allure.step('Attempting to create product with invalid data', async () => {
      try {
        await axiosClient.post('/api/products', invalidData);
        throw new Error('Should not create product with invalid data');
      } catch (error: any) {
        await allure.step('Validating error response', async () => {
          test.expect(error.response.status).toBe(400);
          test.expect(error.response.data.errors).toBeTruthy();
        });

        await attachJsonToAllure('Validation Error', error.response.data);
      }
    });
  });

  test('should handle concurrent product operations', async () => {
    const productData = generateProductData();
    let productId: number;

    await allure.step('Creating initial product', async () => {
      const response = await axiosClient.post('/api/products', productData);
      productId = response.data.id;
      await attachJsonToAllure('Initial Product', response.data);
    });

    await allure.step('Performing concurrent operations', async () => {
      const operations = [
        axiosClient.get(`/api/products/${productId}`),
        axiosClient.patch(`/api/products/${productId}`, { price: 999.99 }),
        axiosClient.get(`/api/products/${productId}`)
      ];

      const results = await Promise.all(operations.map(p => p.catch(e => e)));
      
      await allure.step('Validating concurrent operations', async () => {
        for (const result of results) {
          if (result instanceof Error) {
            test.expect(result.response.status).not.toBe(500);
          } else {
            test.expect(result.status).toBeLessThan(500);
          }
        }
      });

      await attachJsonToAllure('Concurrent Operations Results', results);
    });

    await allure.step('Cleaning up test product', async () => {
      await axiosClient.delete(`/api/products/${productId}`);
    });
  });
}); 