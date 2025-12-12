import type { ViewportSize } from '@playwright/test';

export type DeviceKey = 'desktop' | 'tabletPortrait' | 'tabletLandscape' | 'mobileSmall' | 'mobileMedium';

export interface DeviceViewport {
  key: DeviceKey;
  viewport: ViewportSize;
  description: string;
}

export const deviceViewports: Record<DeviceKey, DeviceViewport> = {
  desktop: {
    key: 'desktop',
    viewport: { width: 1280, height: 720 },
    description: 'Desktop 1280x720',
  },
  tabletPortrait: {
    key: 'tabletPortrait',
    viewport: { width: 768, height: 1024 },
    description: 'Tablet portrait 768x1024',
  },
  tabletLandscape: {
    key: 'tabletLandscape',
    viewport: { width: 1024, height: 768 },
    description: 'Tablet landscape 1024x768',
  },
  mobileSmall: {
    key: 'mobileSmall',
    viewport: { width: 360, height: 640 },
    description: 'Small mobile 360x640',
  },
  mobileMedium: {
    key: 'mobileMedium',
    viewport: { width: 414, height: 896 },
    description: 'Medium mobile 414x896',
  },
};

export function getDeviceViewport(key: DeviceKey): DeviceViewport {
  const vp = deviceViewports[key];
  if (!vp) {
    throw new Error(`Unknown device viewport key: ${key}`);
  }
  return vp;
}

export function allDeviceViewports(): DeviceViewport[] {
  return Object.values(deviceViewports);
}
