import type { ResponseEnvelope } from '../base/BaseApiClient';
import { BaseApiClient } from '../base/BaseApiClient';
import type { Manifest } from '../types/Manifest';

export class AssetsClient extends BaseApiClient {
  async fetchManifest(): Promise<ResponseEnvelope<Manifest>> {
    return this.getJson<Manifest>('/manifest.json');
  }

  async fetchServiceWorker(): Promise<ResponseEnvelope<string>> {
    return this.getText('/service-worker.js');
  }

  async fetchRobots(): Promise<ResponseEnvelope<string>> {
    return this.getText('/robots.txt');
  }

  async fetchAsset(path: string): Promise<ResponseEnvelope<string>> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return this.getText(normalizedPath);
  }

  async fetchBinaryAsset(path: string): Promise<ResponseEnvelope<Buffer>> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return this.getBinary(normalizedPath);
  }
}
