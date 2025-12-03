// tests/api/manifest-details.spec.ts
import { apiTest, expect } from '../../src/api/fixtures/api-fixtures';
import { STATIC_ENDPOINTS } from '../../src/api/data/endpoints';

apiTest.describe('Manifest metadata', () => {
  apiTest('theme color matches expected palette', async ({ assetsClient }) => {
    const manifest = await assetsClient.fetchAsset(STATIC_ENDPOINTS.manifest);
    const json = JSON.parse(manifest.body) as Record<string, string>;

    expect(json.theme_color).toBe('#eefcf6');
  });

  apiTest('background color matches expected palette', async ({ assetsClient }) => {
    const manifest = await assetsClient.fetchAsset(STATIC_ENDPOINTS.manifest);
    const json = JSON.parse(manifest.body) as Record<string, string>;

    expect(json.background_color).toBe('#132322');
  });

  apiTest('display mode is set to browser', async ({ assetsClient }) => {
    const manifest = await assetsClient.fetchAsset(STATIC_ENDPOINTS.manifest);
    const json = JSON.parse(manifest.body) as Record<string, string>;

    expect(json.display).toBe('browser');
  });

  apiTest('start URL stays on root', async ({ assetsClient }) => {
    const manifest = await assetsClient.fetchAsset(STATIC_ENDPOINTS.manifest);
    const json = JSON.parse(manifest.body) as Record<string, string>;

    expect(json.start_url).toBe('/.');
  });
});
