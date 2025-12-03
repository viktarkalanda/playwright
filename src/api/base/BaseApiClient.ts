import type { APIRequestContext, APIResponse } from '@playwright/test';

export interface ResponseEnvelope<T> {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  body: T;
  raw: APIResponse;
}

export abstract class BaseApiClient {
  protected constructor(protected readonly request: APIRequestContext) {}

  protected async getText(
    path: string,
    options?: Parameters<APIRequestContext['get']>[1],
  ): Promise<ResponseEnvelope<string>> {
    const response = await this.request.get(path, options);
    const body = await response.text();

    return {
      status: response.status(),
      ok: response.ok(),
      headers: response.headers(),
      body,
      raw: response,
    };
  }

  protected async getJson<T>(
    path: string,
    options?: Parameters<APIRequestContext['get']>[1],
  ): Promise<ResponseEnvelope<T>> {
    const response = await this.request.get(path, options);
    const body = (await response.json()) as T;

    return {
      status: response.status(),
      ok: response.ok(),
      headers: response.headers(),
      body,
      raw: response,
    };
  }

  protected async getBinary(
    path: string,
    options?: Parameters<APIRequestContext['get']>[1],
  ): Promise<ResponseEnvelope<Buffer>> {
    const response = await this.request.get(path, options);
    const body = Buffer.from(await response.body());

    return {
      status: response.status(),
      ok: response.ok(),
      headers: response.headers(),
      body,
      raw: response,
    };
  }

  protected async postForm(
    path: string,
    formData: string,
    options?: Parameters<APIRequestContext['post']>[1],
  ): Promise<ResponseEnvelope<string>> {
    const response = await this.request.post(path, {
      ...options,
      headers: {
        ...(options?.headers ?? {}),
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: formData,
    });
    const body = await response.text();

    return {
      status: response.status(),
      ok: response.ok(),
      headers: response.headers(),
      body,
      raw: response,
    };
  }
}
