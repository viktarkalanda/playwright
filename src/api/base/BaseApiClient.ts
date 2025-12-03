import type { APIRequestContext, APIResponse, TestInfo } from '@playwright/test';

export interface ResponseEnvelope<T> {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  body: T;
  raw: APIResponse;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type AttachmentPayload = {
  method: HttpMethod;
  path: string;
  url: string;
  status: number;
  ok: boolean;
  request?: Record<string, unknown>;
  responseHeaders: Record<string, string>;
  bodyPreview?: unknown;
  bodyLength?: number;
  timestamp: string;
};

const BODY_PREVIEW_LIMIT = 1_000;

export abstract class BaseApiClient {
  protected testInfo?: TestInfo;

  protected constructor(protected readonly request: APIRequestContext) {}

  protected registerTestInfo(testInfo?: TestInfo): void {
    this.testInfo = testInfo;
  }

  protected async getText(
    path: string,
    options?: Parameters<APIRequestContext['get']>[1],
  ): Promise<ResponseEnvelope<string>> {
    const response = await this.request.get(path, options);
    const body = await response.text();

    const envelope: ResponseEnvelope<string> = {
      status: response.status(),
      ok: response.ok(),
      headers: response.headers(),
      body,
      raw: response,
    };

    await this.attachResponseMetadata('GET', path, response, {
      request: this.pickRequestOptions(options),
      bodyPreview: body.slice(0, BODY_PREVIEW_LIMIT),
      bodyLength: body.length,
    });

    return envelope;
  }

  protected async getJson<T>(
    path: string,
    options?: Parameters<APIRequestContext['get']>[1],
  ): Promise<ResponseEnvelope<T>> {
    const response = await this.request.get(path, options);
    const body = (await response.json()) as T;

    const envelope: ResponseEnvelope<T> = {
      status: response.status(),
      ok: response.ok(),
      headers: response.headers(),
      body,
      raw: response,
    };

    await this.attachResponseMetadata('GET', path, response, {
      request: this.pickRequestOptions(options),
      bodyPreview: body,
    });

    return envelope;
  }

  protected async getBinary(
    path: string,
    options?: Parameters<APIRequestContext['get']>[1],
  ): Promise<ResponseEnvelope<Buffer>> {
    const response = await this.request.get(path, options);
    const body = Buffer.from(await response.body());

    const envelope: ResponseEnvelope<Buffer> = {
      status: response.status(),
      ok: response.ok(),
      headers: response.headers(),
      body,
      raw: response,
    };

    await this.attachResponseMetadata('GET', path, response, {
      request: this.pickRequestOptions(options),
      bodyLength: body.length,
    });

    return envelope;
  }

  protected async postForm(
    path: string,
    formData: string,
    options?: Parameters<APIRequestContext['post']>[1],
  ): Promise<ResponseEnvelope<string>> {
    const response = await this.request.post(path, {
      ...options,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        ...(options?.headers ?? {}),
      },
      data: formData,
    });
    const body = await response.text();

    const envelope: ResponseEnvelope<string> = {
      status: response.status(),
      ok: response.ok(),
      headers: response.headers(),
      body,
      raw: response,
    };

    await this.attachResponseMetadata('POST', path, response, {
      request: {
        ...this.pickRequestOptions(options),
        data: formData,
      },
      bodyPreview: body.slice(0, BODY_PREVIEW_LIMIT),
      bodyLength: body.length,
    });

    return envelope;
  }

  private async attachResponseMetadata(
    method: HttpMethod,
    path: string,
    response: APIResponse,
    details: {
      request?: Record<string, unknown>;
      bodyPreview?: unknown;
      bodyLength?: number;
    },
  ): Promise<void> {
    if (!this.testInfo) {
      return;
    }

    const payload: AttachmentPayload = {
      method,
      path,
      url: response.url(),
      status: response.status(),
      ok: response.ok(),
      request: details.request,
      responseHeaders: response.headers(),
      bodyPreview: details.bodyPreview,
      bodyLength: details.bodyLength,
      timestamp: new Date().toISOString(),
    };

    await this.testInfo.attach(`API ${method} ${path}`, {
      body: JSON.stringify(payload, null, 2),
      contentType: 'application/json',
    });
  }

  private pickRequestOptions(
    options?: Parameters<APIRequestContext['get']>[1],
  ): Record<string, unknown> | undefined {
    if (!options) {
      return undefined;
    }

    const { headers, params, data, form, multipart, failOnStatusCode } = options as Record<
      string,
      unknown
    >;

    return { headers, params, data, form, multipart, failOnStatusCode };
  }
}
