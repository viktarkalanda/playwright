import type { StatusClient } from '../clients/StatusClient';
import type { AssetsClient } from '../clients/AssetsClient';
import { discoverMainAssets } from './assetDiscovery';

let bundleTextPromise: Promise<string> | null = null;

async function getMainBundleText(
  statusClient: StatusClient,
  assetsClient: AssetsClient,
): Promise<string> {
  if (!bundleTextPromise) {
    bundleTextPromise = (async () => {
      const rootResponse = await statusClient.fetchRoot();
      const { scriptPath } = discoverMainAssets(rootResponse.body);
      if (!scriptPath) {
        throw new Error('Unable to locate main bundle script in HTML');
      }

      const bundleResponse = await assetsClient.fetchAsset(scriptPath);
      return bundleResponse.body;
    })();
  }

  return bundleTextPromise;
}

export async function resolveMediaAssetPath(
  baseName: string,
  statusClient: StatusClient,
  assetsClient: AssetsClient,
): Promise<string> {
  const bundleText = await getMainBundleText(statusClient, assetsClient);

  const lastDotIndex = baseName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    throw new Error(`Asset base name "${baseName}" must include an extension`);
  }

  const fileName = baseName.slice(0, lastDotIndex);
  const extension = baseName.slice(lastDotIndex + 1);

  const regex = new RegExp(`static\\/media\\/${fileName}\\.[a-z0-9]+\\.${extension}`, 'i');
  const match = bundleText.match(regex);
  if (!match) {
    throw new Error(`Unable to resolve hashed asset for ${baseName}`);
  }

  return `/${match[0]}`;
}
