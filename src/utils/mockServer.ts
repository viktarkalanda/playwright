import express, { Express, Request, Response } from 'express';
import { Server } from 'http';
import { AddressInfo } from 'net';

/**
 * MockServer class for testing webhook integrations
 * Provides a lightweight Express server for simulating external service callbacks
 */
export class MockServer {
  private app: Express;
  private server: Server | null = null;
  private webhookHandlers: Map<string, (req: Request, res: Response) => void>;

  constructor() {
    this.app = express();
    this.app.use(express.json());
    this.webhookHandlers = new Map();

    // Default error handler
    this.app.use((err: Error, req: Request, res: Response, next: any) => {
      console.error('Mock Server Error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    });
  }

  /**
   * Start the mock server on a random available port
   * @returns Promise<number> The port number the server is listening on
   */
  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(0, () => {
          const address = this.server?.address() as AddressInfo;
          resolve(address.port);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the mock server
   * @returns Promise<void>
   */
  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          this.server = null;
          resolve();
        }
      });
    });
  }

  /**
   * Register a webhook handler for a specific path
   * @param path - The URL path to handle
   * @param handler - The handler function for the webhook
   */
  onWebhook(path: string, handler: (req: Request, res: Response) => void): void {
    this.webhookHandlers.set(path, handler);
    this.app.post(path, handler);
  }

  /**
   * Get the full URL for a specific path on the mock server
   * @param path - The path to get the URL for
   * @returns string The full URL
   * @throws Error if the server is not running
   */
  getUrl(path: string): string {
    if (!this.server) {
      throw new Error('Server not running');
    }
    const address = this.server.address() as AddressInfo;
    return `http://localhost:${address.port}${path}`;
  }

  /**
   * Clear all registered webhook handlers
   */
  clearHandlers(): void {
    this.webhookHandlers.clear();
  }

  /**
   * Get the number of registered webhook handlers
   * @returns number The count of handlers
   */
  getHandlerCount(): number {
    return this.webhookHandlers.size;
  }

  /**
   * Check if a specific path has a registered handler
   * @param path - The path to check
   * @returns boolean True if a handler exists
   */
  hasHandler(path: string): boolean {
    return this.webhookHandlers.has(path);
  }
} 