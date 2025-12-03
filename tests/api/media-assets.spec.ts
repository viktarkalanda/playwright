// tests/api/media-assets.spec.ts
import { apiTest, expect } from '../../src/api/fixtures/api-fixtures';
import { MEDIA_ASSETS } from '../../src/api/data/endpoints';
import { resolveMediaAssetPath } from '../../src/api/utils/mediaResolver';

apiTest.describe('Catalog media assets', () => {
  for (const asset of MEDIA_ASSETS) {
    apiTest(`${asset.description} hashed asset returns ${asset.mime}`, async ({
      statusClient,
      assetsClient,
    }) => {
      const resolvedPath = await resolveMediaAssetPath(
        asset.baseName,
        statusClient,
        assetsClient,
      );
      const response = await assetsClient.fetchBinaryAsset(resolvedPath);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain(asset.mime);
      expect(response.body.length).toBeGreaterThan(0);
    });

    apiTest(`${asset.description} is cached by the CDN`, async ({
      statusClient,
      assetsClient,
    }) => {
      const resolvedPath = await resolveMediaAssetPath(
        asset.baseName,
        statusClient,
        assetsClient,
      );
      const response = await assetsClient.fetchBinaryAsset(resolvedPath);

      expect(response.headers['cache-control']).toContain('max-age');
      expect(response.headers['etag']).toBeTruthy();
      expect(response.headers['last-modified']).toBeTruthy();
    });
  }
});
