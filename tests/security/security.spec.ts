import { test, expect } from '@playwright/test';
import { ZapClient } from '@zaproxy/zap-client';
import { randomUUID } from 'crypto';

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:8080';
const ZAP_PORT = 8090;
const ZAP_API_KEY = randomUUID();
const SCAN_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

let zapClient: ZapClient;

test.describe('Security Tests', () => {
  test.beforeAll(async () => {
    // Initialize ZAP client
    zapClient = new ZapClient({
      apiKey: ZAP_API_KEY,
      proxy: {
        host: 'localhost',
        port: ZAP_PORT
      }
    });

    // Wait for ZAP to be ready
    let attempts = 0;
    while (attempts < 10) {
      try {
        await zapClient.core.numberOfAlerts('');
        break;
      } catch (e) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    if (attempts === 10) {
      throw new Error('ZAP failed to start');
    }
  });

  test('passive security scan', async () => {
    // Set up context
    const contextId = await zapClient.context.newContext('test-context');
    await zapClient.context.includeInContext('test-context', `\\Q${TARGET_URL}\\E.*`);

    // Configure authentication
    await zapClient.authentication.setAuthenticationMethod(
      contextId,
      'formBasedAuthentication',
      `loginUrl=${TARGET_URL}/login&loginRequestData=username%3D%7B%25username%25%7D%26password%3D%7B%25password%25%7D`
    );

    // Start spider scan
    const scanId = await zapClient.spider.scan(TARGET_URL, null, null, null, null);
    
    // Wait for spider to complete
    while (parseInt(await zapClient.spider.status(scanId)) < 100) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Enable and wait for passive scan
    await zapClient.pscan.enableAllScanners();
    while ((await zapClient.pscan.recordsToScan()) > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Analyze alerts
    const alerts = await zapClient.core.alerts(TARGET_URL, -1, -1);
    const highRiskAlerts = alerts.filter(alert => alert.risk === 'High');

    // Generate report
    const report = {
      timestamp: Date.now(),
      target: TARGET_URL,
      alerts: highRiskAlerts.map(alert => ({
        name: alert.name,
        description: alert.description,
        solution: alert.solution,
        reference: alert.reference,
        url: alert.url,
        parameter: alert.param
      }))
    };

    // Attach report to test results
    await test.info().attach('security-report', {
      body: JSON.stringify(report, null, 2),
      contentType: 'application/json'
    });

    // Assert no high-risk vulnerabilities
    expect(highRiskAlerts.length, 
      `High-risk vulnerabilities detected: ${highRiskAlerts.map(a => a.name).join(', ')}`
    ).toBe(0);
  });

  test('security headers configuration', async ({ request }) => {
    const response = await request.get(TARGET_URL);
    
    const requiredHeaders = {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'"
    };

    for (const [header, expectedValue] of Object.entries(requiredHeaders)) {
      const actualValue = response.headers().get(header);
      expect(actualValue, `Incorrect ${header} header`).toBe(expectedValue);
    }
  });

  test('common security vulnerabilities', async ({ request }) => {
    // Test SQL injection protection
    const sqlInjectionPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users; --"
    ];

    for (const payload of sqlInjectionPayloads) {
      const response = await request.get(`${TARGET_URL}/api/users?id=${payload}`);
      expect(response.status(), 
        `SQL injection payload not properly handled: ${payload}`
      ).toBe(400);
    }

    // Test XSS protection
    const xssPayloads = [
      '<script>alert(1)</script>',
      'javascript:alert(1)',
      '<img src=x onerror=alert(1)>'
    ];

    for (const payload of xssPayloads) {
      const response = await request.get(`${TARGET_URL}/search?q=${payload}`);
      const body = await response.text();
      expect(body, `XSS payload not properly escaped: ${payload}`).not.toContain(payload);
    }
  });

  test('authentication security', async ({ request }) => {
    // Test weak password protection
    const response = await request.post(`${TARGET_URL}/api/register`, {
      data: {
        username: 'testuser',
        password: 'weak'
      }
    });
    expect(response.status()).toBe(400);
    
    // Test brute force protection
    for (let i = 0; i < 5; i++) {
      await request.post(`${TARGET_URL}/api/login`, {
        data: {
          username: 'testuser',
          password: 'wrongpass'
        }
      });
    }
    
    const loginResponse = await request.post(`${TARGET_URL}/api/login`, {
      data: {
        username: 'testuser',
        password: 'wrongpass'
      }
    });
    expect(loginResponse.status()).toBe(429); // Too Many Requests
  });

  test('sensitive data exposure', async ({ request }) => {
    // Test error messages don't leak sensitive info
    const response = await request.get(`${TARGET_URL}/api/users/999999`);
    const body = await response.text();
    
    const sensitiveTerms = ['sql', 'error', 'exception', 'stack trace', 'failed'];
    for (const term of sensitiveTerms) {
      expect(body.toLowerCase(), 
        `Error message contains sensitive term: ${term}`
      ).not.toContain(term);
    }
  });

  test('CSRF protection', async ({ request }) => {
    // Test CSRF token requirement
    const response = await request.post(`${TARGET_URL}/api/users`, {
      data: {
        name: 'test'
      }
    });
    expect(response.status()).toBe(403);

    // Get CSRF token
    const pageResponse = await request.get(`${TARGET_URL}/profile`);
    const csrfToken = pageResponse.headers().get('x-csrf-token');
    
    // Test with valid CSRF token
    const protectedResponse = await request.post(`${TARGET_URL}/api/users`, {
      data: {
        name: 'test'
      },
      headers: {
        'x-csrf-token': csrfToken
      }
    });
    expect(protectedResponse.status()).toBe(200);
  });
}); 