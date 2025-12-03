// tests/api/icons.spec.ts
import { apiTest, expect } from '../../src/api/fixtures/api-fixtures';
import { ICON_ASSETS } from '../../src/api/data/endpoints';

apiTest.describe('Progressive web app icons', () => {
  for (const icon of ICON_ASSETS) {
    apiTest(`${icon.description} responds with binary image`, async ({ assetsClient }) => {
      const response = await assetsClient.fetchBinaryAsset(icon.path);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain(icon.mime);
      expect(response.body.length).toBeGreaterThan(0);
    });

    apiTest(`${icon.description} exposes caching metadata`, async ({ assetsClient }) => {
      const response = await assetsClient.fetchBinaryAsset(icon.path);

      expect(response.headers['cache-control']).toContain('max-age');
      expect(response.headers['etag']).toBeTruthy();
      expect(response.headers['last-modified']).toBeTruthy();
    });
  }

  apiTest('manifest lists every published icon asset', async ({ assetsClient }) => {
    const manifest = await assetsClient.fetchManifest();
    const manifestIcons = manifest.body.icons.map((icon) => icon.src);

    for (const icon of ICON_ASSETS) {
      expect(manifestIcons).toContain(icon.path);
    }
  });

  apiTest('manifest icon metadata keeps accurate sizes and mime types', async ({ assetsClient }) => {
    const manifest = await assetsClient.fetchManifest();

    for (const expected of ICON_ASSETS) {
      const manifestIcon = manifest.body.icons.find((icon) => icon.src === expected.path);

      expect(manifestIcon, `Manifest should include ${expected.path}`).toBeTruthy();
      expect(manifestIcon?.sizes).toBe(`${expected.size}x${expected.size}`);
      expect(manifestIcon?.type).toBe(expected.mime);
    }
  });
});
