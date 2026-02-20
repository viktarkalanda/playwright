import { test, expect } from '@playwright/test';
import { GdprHelper } from '../../src/utils';
import { v4 as uuidv4 } from 'uuid';

/**
 * GDPR API Test Suite
 * 
 * This test suite verifies the GDPR data export functionality, ensuring compliance
 * with data protection regulations. The tests cover the complete workflow of:
 * 
 * 1. Requesting personal data export
 * 2. Monitoring the export job progress
 * 3. Downloading and validating the exported data
 * 
 * Key Requirements:
 * - Users must be able to request their personal data in a machine-readable format
 * - The export must include all relevant user data (profile, orders, preferences)
 * - The export process must be asynchronous to handle large data volumes
 * - The exported data must be provided in a secure, downloadable format
 * - The system must handle the request within a reasonable timeframe
 * 
 * Test Coverage:
 * - Happy path: Complete export workflow
 * - Error cases: Invalid user, concurrent requests, timeout scenarios
 * - Data validation: Format, completeness, and size verification
 * 
 * Security Considerations:
 * - Export requests must be authenticated
 * - Export data must be transmitted securely
 * - Temporary export files must be properly cleaned up
 * 
 * Regulatory Compliance:
 * - GDPR Article 15: Right of access by the data subject
 * - GDPR Article 20: Right to data portability
 * 
 * @package Tests
 * @subpackage API
 * @group GDPR
 */

test.describe('GDPR Data Export API @gdpr @api', () => {
  let gdprHelper: GdprHelper;
  
  test.beforeEach(async ({ request }) => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
    gdprHelper = new GdprHelper(baseUrl);
  });

  test('should successfully complete full GDPR export workflow', async () => {
    // Arrange
    const userId = uuidv4(); // Generate unique user ID for test isolation
    
    // Act & Assert: Request Export
    const jobId = await gdprHelper.requestExport(userId);
    expect(jobId).toBeTruthy();
    expect(typeof jobId).toBe('string');
    
    // Act & Assert: Poll Until Complete
    const downloadLink = await gdprHelper.pollJob(jobId);
    expect(downloadLink).toBeTruthy();
    expect(downloadLink).toMatch(/^https?:\/\//);
    
    // Act & Assert: Validate Export
    await gdprHelper.validateExport(downloadLink);
  });

  test('should handle invalid user ID gracefully', async () => {
    // Arrange
    const invalidUserId = 'invalid-user-id';
    
    // Act & Assert
    try {
      await gdprHelper.requestExport(invalidUserId);
      throw new Error('Expected request to fail');
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toContain('Failed to request GDPR export');
      } else {
        throw error;
      }
    }
  });

  test('should handle concurrent export requests', async () => {
    // Arrange
    const userId = uuidv4();
    
    // Act: Submit multiple requests
    const requests = Array(3).fill(null).map(() => gdprHelper.requestExport(userId));
    
    // Assert: All requests should complete
    const jobIds = await Promise.all(requests);
    expect(jobIds).toHaveLength(3);
    expect(new Set(jobIds).size).toBe(3); // Each job should have unique ID
  });

  test('should validate export file structure and size', async () => {
    // Arrange
    const userId = uuidv4();
    
    // Act: Complete export process
    const jobId = await gdprHelper.requestExport(userId);
    const downloadLink = await gdprHelper.pollJob(jobId);
    
    // Assert: Validate export format
    const response = await fetch(downloadLink);
    expect(response.headers.get('content-type')).toBe('application/zip');
    
    const data = await response.arrayBuffer();
    expect(data.byteLength).toBeGreaterThan(0);
    
    // Additional ZIP format validation could be added here
  });

  test('should handle export job timeout', async () => {
    // Arrange
    const userId = uuidv4();
    const jobId = await gdprHelper.requestExport(userId);
    
    // Act & Assert: Force timeout by modifying helper timeout
    const gdprHelperWithShortTimeout = new GdprHelper(gdprHelper['baseUrl']);
    Object.defineProperty(gdprHelperWithShortTimeout, 'MAX_RETRIES', {
      value: 1
    });
    
    try {
      await gdprHelperWithShortTimeout.pollJob(jobId);
      throw new Error('Expected polling to timeout');
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toContain('Polling timeout after');
      } else {
        throw error;
      }
    }
  });

  test('should include all required data sections', async () => {
    // Arrange
    const userId = uuidv4();
    
    // Act: Complete export process
    const jobId = await gdprHelper.requestExport(userId);
    const downloadLink = await gdprHelper.pollJob(jobId);
    
    // Assert: Verify response headers
    const response = await fetch(downloadLink);
    expect(response.ok).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('profile');
    expect(data).toHaveProperty('orders');
    expect(data).toHaveProperty('preferences');
    
    // Verify data structure
    expect(data.profile).toMatchObject({
      userId: expect.any(String),
      email: expect.any(String),
      createdAt: expect.any(String)
    });
    
    expect(Array.isArray(data.orders)).toBeTruthy();
    expect(typeof data.preferences).toBe('object');
  });

  test('should handle non-existent export job', async () => {
    // Arrange
    const nonExistentJobId = uuidv4();
    
    // Act & Assert
    try {
      await gdprHelper.pollJob(nonExistentJobId);
      throw new Error('Expected polling to fail');
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toBe(`Job ${nonExistentJobId} not found`);
      } else {
        throw error;
      }
    }
  });

  test('should respect rate limiting for export requests', async () => {
    // Arrange
    const userId = uuidv4();
    const requests = Array(10).fill(null);
    
    // Act & Assert
    const results = await Promise.allSettled(
      requests.map(() => gdprHelper.requestExport(userId))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');
    
    expect(successful.length).toBeGreaterThan(0);
    expect(failed.length).toBeGreaterThan(0);
    
    // Verify rate limit errors
    failed.forEach(result => {
      expect(result.status).toBe('rejected');
      expect(result.reason.message).toContain('Failed to request GDPR export');
    });
  });
}); 





