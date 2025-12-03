import type { APIRequestContext, TestInfo } from '@playwright/test';
import { BaseApiClient, type ResponseEnvelope } from '../base/BaseApiClient';
import type { Manifest } from '../types/Manifest';
import { step } from '../../utils/stepDecorator';

export class AssetsClient extends BaseApiClient {
  constructor(request: APIRequestContext, testInfo?: TestInfo) {
    super(request, testInfo);
  }

  @step('Fetch manifest.json')
  async fetchManifest(): Promise<ResponseEnvelope<Manifest>> {
    return this.getJson<Manifest>('/manifest.json');
  }

  @step('Fetch service-worker.js')
  async fetchServiceWorker(): Promise<ResponseEnvelope<string>> {
    return this.getText('/service-worker.js');
  }

  @step('Fetch robots.txt')
  async fetchRobots(): Promise<ResponseEnvelope<string>> {
    return this.getText('/robots.txt');
  }

  @step('Fetch textual asset')
  async fetchAsset(path: string): Promise<ResponseEnvelope<string>> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return this.getText(normalizedPath);
  }

  @step('Fetch binary asset')
  async fetchBinaryAsset(path: string): Promise<ResponseEnvelope<Buffer>> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return this.getBinary(normalizedPath);
  }
}
