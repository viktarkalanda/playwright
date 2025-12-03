// tests/api/response-headers.spec.ts
import { apiTest, expect } from '../../src/api/fixtures/api-fixtures';
import { SPA_ROUTES, STATIC_ENDPOINTS, type RouteDefinition } from '../../src/api/data/endpoints';
import type { StatusClient } from '../../src/api/clients/StatusClient';
import type { AssetsClient } from '../../src/api/clients/AssetsClient';
import type { ResponseEnvelope } from '../../src/api/base/BaseApiClient';

type HeaderTarget = RouteDefinition & {
  via: 'status' | 'assets';
};

const SPA_TARGETS: HeaderTarget[] = SPA_ROUTES.map((route) => ({
  ...route,
  via: 'status',
}));

const STATIC_TARGETS: HeaderTarget[] = [
  {
    key: 'manifest',
    path: STATIC_ENDPOINTS.manifest,
    description: 'manifest.json descriptor',
    via: 'assets',
  },
  {
    key: 'serviceWorker',
    path: STATIC_ENDPOINTS.serviceWorker,
    description: 'service-worker script',
    via: 'assets',
  },
  {
    key: 'robots',
    path: STATIC_ENDPOINTS.robots,
    description: 'robots.txt instructions',
    via: 'assets',
  },
];

const HEADER_TARGETS: HeaderTarget[] = [...SPA_TARGETS, ...STATIC_TARGETS];

async function fetchTargetEnvelope(
  target: HeaderTarget,
  statusClient: StatusClient,
  assetsClient: AssetsClient,
): Promise<ResponseEnvelope<unknown>> {
  if (target.via === 'status') {
    if (target.path === '/') {
      return statusClient.fetchRoot();
    }
    return statusClient.fetchRawPath(target.path);
  }

  switch (target.path) {
    case STATIC_ENDPOINTS.manifest:
      return assetsClient.fetchManifest();
    case STATIC_ENDPOINTS.serviceWorker:
      return assetsClient.fetchServiceWorker();
    case STATIC_ENDPOINTS.robots:
      return assetsClient.fetchRobots();
    default:
      return assetsClient.fetchAsset(target.path);
  }
}

apiTest.describe('Response headers are consistent across endpoints', () => {
  apiTest('tracked endpoints expose permissive CORS headers', async ({
    statusClient,
    assetsClient,
  }) => {
    for (const target of HEADER_TARGETS) {
      const response = await fetchTargetEnvelope(target, statusClient, assetsClient);
      expect(response.headers['access-control-allow-origin']).toBe('*');
    }
  });

  apiTest('tracked endpoints are cached by GitHub CDN', async ({ statusClient, assetsClient }) => {
    for (const target of HEADER_TARGETS) {
      const response = await fetchTargetEnvelope(target, statusClient, assetsClient);
      expect(response.headers['cache-control']).toContain('max-age');

      const serverHeader = (response.headers.server ?? '').toLowerCase();
      expect(serverHeader).toContain('github');
    }
  });

  apiTest('tracked endpoints define byte range support and content length', async ({
    statusClient,
    assetsClient,
  }) => {
    for (const target of HEADER_TARGETS) {
      const response = await fetchTargetEnvelope(target, statusClient, assetsClient);
      expect(response.headers['accept-ranges']).toBe('bytes');

      const contentLength = Number.parseInt(response.headers['content-length'] ?? '0', 10);
      expect(contentLength).toBeGreaterThan(0);
    }
  });

  apiTest('tracked endpoints include CDN diagnostics headers', async ({
    statusClient,
    assetsClient,
  }) => {
    for (const target of HEADER_TARGETS) {
      const response = await fetchTargetEnvelope(target, statusClient, assetsClient);
      expect(response.headers['x-cache']).toBeTruthy();
      expect(response.headers['x-served-by']).toBeTruthy();
      const viaHeader = (response.headers.via ?? '').toLowerCase();
      expect(viaHeader).toContain('varnish');
    }
  });
});
