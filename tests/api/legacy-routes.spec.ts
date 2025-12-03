// tests/api/legacy-routes.spec.ts
import { apiTest, expect } from '../../src/api/fixtures/api-fixtures';
import { LEGACY_ROUTES, SPA_FALLBACK_MARKER } from '../../src/api/data/endpoints';

apiTest.describe('Legacy route fallbacks', () => {
  for (const route of LEGACY_ROUTES) {
    apiTest(`${route.description} returns SPA fallback`, async ({ statusClient }) => {
      const response = await statusClient.fetchRawPath(route.path);

      expect(response.status).toBe(404);
      expect(response.body).toContain(SPA_FALLBACK_MARKER);
    });
  }

  apiTest('root entry responds with login markup', async ({ statusClient }) => {
    const response = await statusClient.fetchRoot();

    expect(response.status).toBe(200);
    expect(response.body).toContain('Swag Labs');
  });

  apiTest('posting credentials to legacy root is blocked', async ({ statusClient }) => {
    const response = await statusClient.submitLoginForm('user-name=standard_user&password=secret_sauce');

    expect(response.status).toBe(405);
    expect(response.body).toContain('405');
  });
});
