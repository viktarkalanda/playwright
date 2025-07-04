import axios, { AxiosError } from 'axios';
import { expect } from '@playwright/test';

/**
 * Helper class for GDPR-related operations
 * Provides functionality for requesting and monitoring data export processes
 */
export class GdprHelper {
  private baseUrl: string;
  private readonly POLL_INTERVAL = 5000; // 5 seconds
  private readonly MAX_RETRIES = 12; // 1 minute total

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Requests a GDPR data export for a specific user
   * @param userId - The ID of the user requesting their data
   * @returns Promise containing the job ID for tracking export progress
   * @throws Error if the export request fails
   */
  async requestExport(userId: string): Promise<string> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/gdpr/export`, {
        userId,
        format: 'JSON',
        includeOrders: true,
        includeProfile: true,
        includePreferences: true
      });

      expect(response.status).toBe(202);
      expect(response.data.jobId).toBeTruthy();

      return response.data.jobId;
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      throw new Error(`Failed to request GDPR export: ${axiosError.message}`);
    }
  }

  /**
   * Polls the job status until completion or timeout
   * @param jobId - The ID of the export job to monitor
   * @returns Promise containing the download link for the exported data
   * @throws Error if polling times out or job fails
   */
  async pollJob(jobId: string): Promise<string> {
    let attempts = 0;
    
    while (attempts < this.MAX_RETRIES) {
      try {
        const response = await axios.get(`${this.baseUrl}/api/gdpr/status/${jobId}`);
        
        switch (response.data.status) {
          case 'FINISHED':
            expect(response.data.downloadLink).toBeTruthy();
            return response.data.downloadLink;
          
          case 'FAILED':
            throw new Error(`Export job failed: ${response.data.error}`);
          
          case 'IN_PROGRESS':
            await new Promise(resolve => setTimeout(resolve, this.POLL_INTERVAL));
            attempts++;
            break;
          
          default:
            throw new Error(`Unknown job status: ${response.data.status}`);
        }
      } catch (error: unknown) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 404) {
          throw new Error(`Job ${jobId} not found`);
        }
        throw new Error(`Failed to poll job status: ${axiosError.message}`);
      }
    }
    
    throw new Error(`Polling timeout after ${this.MAX_RETRIES * this.POLL_INTERVAL / 1000} seconds`);
  }

  /**
   * Validates the exported data file
   * @param downloadLink - URL to download the exported data
   * @returns Promise<void>
   * @throws Error if validation fails
   */
  async validateExport(downloadLink: string): Promise<void> {
    try {
      const response = await axios.get(downloadLink, {
        responseType: 'arraybuffer'
      });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/zip');
      expect(response.data.length).toBeGreaterThan(0);
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      throw new Error(`Failed to validate export: ${axiosError.message}`);
    }
  }
} 