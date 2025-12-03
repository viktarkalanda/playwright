// tests/api/app-data.spec.ts
import { apiTest, expect } from '../../src/api/fixtures/api-fixtures';
import { discoverMainAssets } from '../../src/api/utils/assetDiscovery';
import type { StatusClient } from '../../src/api/clients/StatusClient';
import type { AssetsClient } from '../../src/api/clients/AssetsClient';

async function fetchMainBundleText(
  statusClient: StatusClient,
  assetsClient: AssetsClient,
): Promise<string> {
  const root = await statusClient.fetchRoot();
  const { scriptPath } = discoverMainAssets(root.body);
  if (!scriptPath) {
    throw new Error('Unable to locate main bundle from the root HTML');
  }

  const bundle = await assetsClient.fetchAsset(scriptPath);
  return bundle.body;
}

apiTest.describe('Embedded application data (bundle inspection)', () => {
  apiTest('bundle contains the list of demo users and password', async ({
    statusClient,
    assetsClient,
  }) => {
    const bundleText = await fetchMainBundleText(statusClient, assetsClient);

    expect(bundleText).toContain('standard_user');
    expect(bundleText).toContain('locked_out_user');
    expect(bundleText).toContain('problem_user');
    expect(bundleText).toContain('secret_sauce');
  });

  apiTest('bundle exposes inventory metadata', async ({ statusClient, assetsClient }) => {
    const bundleText = await fetchMainBundleText(statusClient, assetsClient);

    expect(bundleText).toContain('Sauce Labs Backpack');
    expect(bundleText).toContain('Sauce Labs Bike Light');
    expect(bundleText).toContain('carry.allTheThings()');
  });

  apiTest('bundle keeps Backtrace reporting configuration', async ({
    statusClient,
    assetsClient,
  }) => {
    const bundleText = await fetchMainBundleText(statusClient, assetsClient);

    expect(bundleText).toContain('BacktraceClient');
    expect(bundleText).toContain('Swag Store');
    expect(bundleText).toContain('submit.backtrace.io');
  });
});
