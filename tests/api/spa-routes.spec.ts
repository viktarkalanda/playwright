// tests/api/spa-routes.spec.ts
import { apiTest, expect } from '../../src/api/fixtures/api-fixtures';
import { SPA_ROUTES } from '../../src/api/data/endpoints';

apiTest.describe('SPA routes respond with HTML', () => {
  for (const route of SPA_ROUTES) {
    apiTest(`${route.description} returns 200 HTML`, async ({ statusClient }) => {
      const response = await statusClient.fetchRawPath(route.path);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.body).toContain('Swag Labs');
    });
  }
});

apiTest.describe('SPA routes expose permissive CORS headers', () => {
  for (const route of SPA_ROUTES) {
    apiTest(`${route.description} contains Access-Control-Allow-Origin`, async ({ statusClient }) => {
      const response = await statusClient.fetchRawPath(route.path);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  }
});
