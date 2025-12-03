// tests/api/assets.spec.ts
import { apiTest, expect } from '../../src/api/fixtures/api-fixtures';
import { discoverMainAssets } from '../../src/api/utils/assetDiscovery';

apiTest.describe('Static asset delivery', () => {
  apiTest('manifest describes icons and theme', async ({ assetsClient }) => {
    const response = await assetsClient.fetchManifest();

    expect(response.status).toBe(200);
    expect(response.body.short_name).toBe('Swag Labs');
    expect(response.body.icons.length).toBeGreaterThan(0);
    const icon = response.body.icons[0];
    expect(icon.src).toContain('icon');
  });

  apiTest('robots file exists', async ({ assetsClient }) => {
    const response = await assetsClient.fetchRobots();

    expect(response.status).toBe(200);
    expect(response.body.toLowerCase()).toContain('user-agent');
  });

  apiTest('service worker is served as JavaScript', async ({ assetsClient }) => {
    const response = await assetsClient.fetchServiceWorker();

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('javascript');
  });

  apiTest('main JS and CSS bundles referenced in HTML are reachable', async ({
    assetsClient,
    statusClient,
  }) => {
    const root = await statusClient.fetchRoot();
    const { scriptPath, stylePath } = discoverMainAssets(root.body);

    expect(scriptPath, 'main script path should be discoverable').toBeTruthy();
    expect(stylePath, 'main stylesheet path should be discoverable').toBeTruthy();

    if (scriptPath) {
      const script = await assetsClient.fetchAsset(scriptPath);
      expect(script.status).toBe(200);
      expect(script.body).toContain('Swag Labs');
    }

    if (stylePath) {
      const css = await assetsClient.fetchAsset(stylePath);
      expect(css.status).toBe(200);
      expect(css.body).toContain('.login_wrapper');
    }
  });

  apiTest('favicon delivered as binary image', async ({ assetsClient }) => {
    const response = await assetsClient.fetchBinaryAsset('/favicon.ico');

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.headers['content-type']).toContain('image');
  });
});
