import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { allure } from 'allure-playwright';

/**
 * Axios Client Configuration and Setup
 * ==================================
 * 
 * This module provides a configured Axios instance for making HTTP requests
 * in our test automation framework. It includes:
 * 
 * - Base configuration (URL, timeouts, headers)
 * - Request/response interceptors
 * - Logging and reporting utilities
 * - Error handling
 * 
 * Usage Examples:
 * -------------
 * ```typescript
 * // Basic GET request
 * const response = await axiosClient.get('/api/products/1');
 * 
 * // POST with data
 * const newProduct = await axiosClient.post('/api/products', {
 *   name: 'Test Product',
 *   price: 99.99
 * });
 * 
 * // PUT with params
 * await axiosClient.put('/api/products/1', {
 *   status: 'inactive'
 * });
 * 
 * // DELETE request
 * await axiosClient.delete('/api/products/1');
 * ```
 * 
 * Configuration:
 * -------------
 * The client is configured with:
 * - Base URL from environment variables
 * - Default timeout of 5000ms
 * - JSON content type headers
 * - Automatic error handling
 * 
 * Interceptors:
 * -----------
 * Request and response interceptors provide:
 * - Request/response logging
 * - Allure report attachments
 * - Error capture and formatting
 * 
 * Error Handling:
 * -------------
 * The client handles common HTTP errors:
 * - Network errors
 * - Timeout errors
 * - API errors (4xx, 5xx)
 * 
 * Logging:
 * -------
 * All requests and responses are logged:
 * - Request method, URL, headers, body
 * - Response status, headers, body
 * - Error details when applicable
 * 
 * @module axiosClient
 */

/**
 * Interface for structured logging of HTTP requests
 */
interface RequestLog {
  timestamp: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  data?: any;
}

/**
 * Interface for structured logging of HTTP responses
 */
interface ResponseLog {
  timestamp: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  duration: number;
}

/**
 * Formats a request object for logging
 * @param config - Axios request configuration
 * @returns Formatted request log object
 */
function formatRequestLog(config: AxiosRequestConfig): RequestLog {
  return {
    timestamp: new Date().toISOString(),
    method: config.method?.toUpperCase() || 'GET',
    url: config.url || '',
    headers: config.headers as Record<string, string>,
    data: config.data
  };
}

/**
 * Formats a response object for logging
 * @param response - Axios response object
 * @param duration - Request duration in milliseconds
 * @returns Formatted response log object
 */
function formatResponseLog(response: AxiosResponse, duration: number): ResponseLog {
  return {
    timestamp: new Date().toISOString(),
    status: response.status,
    statusText: response.statusText,
    headers: response.headers as Record<string, string>,
    data: response.data,
    duration
  };
}

/**
 * Creates and configures the Axios client instance
 */
const axiosClient: AxiosInstance = axios.create({
  baseURL: process.env.BASE_URL || 'http://localhost:8080',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
axiosClient.interceptors.request.use(
  async (config) => {
    const requestStartTime = Date.now();
    const requestLog = formatRequestLog(config);

    // Console logging
    console.log('🌐 API Request:', JSON.stringify(requestLog, null, 2));

    // Allure reporting
    await allure.attachment(
      'API Request',
      JSON.stringify(requestLog, null, 2),
      'application/json'
    );

    // Store start time for duration calculation
    (config as any).requestStartTime = requestStartTime;

    return config;
  },
  async (error) => {
    // Log request errors
    console.error('❌ Request Error:', error.message);
    
    await allure.attachment(
      'Request Error',
      JSON.stringify({
        message: error.message,
        stack: error.stack
      }, null, 2),
      'application/json'
    );

    return Promise.reject(error);
  }
);

// Response interceptor
axiosClient.interceptors.response.use(
  async (response) => {
    const duration = Date.now() - ((response.config as any).requestStartTime || Date.now());
    const responseLog = formatResponseLog(response, duration);

    // Console logging
    console.log('✅ API Response:', JSON.stringify(responseLog, null, 2));

    // Allure reporting
    await allure.attachment(
      'API Response',
      JSON.stringify(responseLog, null, 2),
      'application/json'
    );

    return response;
  },
  async (error) => {
    const duration = Date.now() - ((error.config as any).requestStartTime || Date.now());

    // Format error response
    const errorLog = {
      timestamp: new Date().toISOString(),
      duration,
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : undefined
    };

    // Console logging
    console.error('❌ API Error:', JSON.stringify(errorLog, null, 2));

    // Allure reporting
    await allure.attachment(
      'API Error',
      JSON.stringify(errorLog, null, 2),
      'application/json'
    );

    return Promise.reject(error);
  }
);

/**
 * Example Usage:
 * 
 * ```typescript
 * // GET request with query parameters
 * const products = await axiosClient.get('/products', {
 *   params: {
 *     category: 'electronics',
 *     limit: 10
 *   }
 * });
 * 
 * // POST request with body
 * const newOrder = await axiosClient.post('/orders', {
 *   items: [
 *     { productId: 1, quantity: 2 },
 *     { productId: 3, quantity: 1 }
 *   ],
 *   shippingAddress: {
 *     street: '123 Test St',
 *     city: 'Test City'
 *   }
 * });
 * 
 * // Error handling
 * try {
 *   await axiosClient.get('/invalid-endpoint');
 * } catch (error) {
 *   console.error('Request failed:', error.response?.data);
 * }
 * ```
 */

export default axiosClient; 