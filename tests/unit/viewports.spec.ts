// tests/unit/viewports.spec.ts
import { test, expect } from '../../src/saucedemo/fixtures/test-fixtures';
import { deviceViewports, getDeviceViewport, allDeviceViewports } from '../../src/utils/viewports';

test.describe('getDeviceViewport', () => {
  test('returns the viewport definition for a known device key', {
    tag: ['@utils', '@viewports'],
  }, async () => {
    const desktop = getDeviceViewport('desktop');
    expect(desktop.viewport).toEqual({ width: 1280, height: 720 });
    expect(desktop.description).toContain('Desktop');
  });

  test('mobile viewports are narrower than tablet viewports', {
    tag: ['@utils', '@viewports'],
  }, async () => {
    const mobile = getDeviceViewport('mobileSmall');
    const tablet = getDeviceViewport('tabletPortrait');
    expect(mobile.viewport.width).toBeLessThan(tablet.viewport.width);
  });

  test('throws for an unknown device key', {
    tag: ['@utils', '@viewports', '@negative'],
  }, async () => {
    expect(() => getDeviceViewport('smartFridge' as never)).toThrow(/Unknown device viewport key/);
  });
});

test.describe('allDeviceViewports', () => {
  test('returns one entry per key in deviceViewports', {
    tag: ['@utils', '@viewports'],
  }, async () => {
    const all = allDeviceViewports();
    expect(all.length).toBe(Object.keys(deviceViewports).length);
  });

  test('every entry has a positive width and height', {
    tag: ['@utils', '@viewports'],
  }, async () => {
    for (const device of allDeviceViewports()) {
      expect(device.viewport.width).toBeGreaterThan(0);
      expect(device.viewport.height).toBeGreaterThan(0);
    }
  });

  test('every entry key matches its own viewport definition key', {
    tag: ['@utils', '@viewports'],
  }, async () => {
    for (const device of allDeviceViewports()) {
      expect(deviceViewports[device.key].key).toBe(device.key);
    }
  });

  test('device keys are unique', {
    tag: ['@utils', '@viewports'],
  }, async () => {
    const keys = allDeviceViewports().map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
