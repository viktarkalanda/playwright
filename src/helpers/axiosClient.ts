import axios from 'axios';
import { allure } from 'allure-playwright';

/**
 * Axios client configuration for API testing
 * =======================================
 * 
 * This module provides a configured Axios instance for making HTTP requests
 * in our API tests. It includes:
 * 
 * - Base URL configuration from environment variables
 * - Request/response interceptors for Allure reporting
 * - Default headers and timeout settings
 * - Error handling and logging
 */

const axiosClient = axios.create({
  baseURL: process.env.BASE_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor for logging and Allure reporting
axiosClient.interceptors.request.use(
  async (config) => {
    const requestData = {
      method: config.method?.toUpperCase(),
      url: config.url,
      headers: config.headers,
      data: config.data
    };

    await allure.attachment(
      'API Request',
      JSON.stringify(requestData, null, 2),
      'application/json'
    );

    return config;
  },
  async (error) => {
    await allure.attachment(
      'Request Error',
      JSON.stringify(error, null, 2),
      'application/json'
    );
    return Promise.reject(error);
  }
);

// Response interceptor for logging and Allure reporting
axiosClient.interceptors.response.use(
  async (response) => {
    const responseData = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    };

    await allure.attachment(
      'API Response',
      JSON.stringify(responseData, null, 2),
      'application/json'
    );

    return response;
  },
  async (error) => {
    if (error.response) {
      const errorData = {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      };

      await allure.attachment(
        'Response Error',
        JSON.stringify(errorData, null, 2),
        'application/json'
      );
    }

    return Promise.reject(error);
  }
);

export default axiosClient; 