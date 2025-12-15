// tests/unit/cart-history.spec.ts
import { test, expect } from '../../src/fixtures/test-fixtures';
import { CartHistory } from '../../src/utils/cartHistory';

const sortNames = (names: string[]): string[] => [...names].sort();

test.describe('CartHistory unit behavior', () => {
  test('single add event results in item present in cart', {
    tag: ['@utils', '@cartHistory'],
  }, async () => {
    const history = new CartHistory();
    history.addItem('Sauce Labs Backpack');

    const snapshot = history.getSnapshot();
    const state = snapshot.items['Sauce Labs Backpack'];

    expect(state).toBeDefined();
    expect(state?.inCart).toBe(true);
    expect(state?.addedCount).toBe(1);
    expect(state?.removedCount).toBe(0);
    expect(sortNames(history.getCurrentCartProductNames())).toEqual(['Sauce Labs Backpack']);
  });

  test('add and remove toggles inCart flag correctly', {
    tag: ['@utils', '@cartHistory'],
  }, async () => {
    const history = new CartHistory();
    history.addItem('Item');
    history.removeItem('Item');

    const state = history.getItemState('Item');
    expect(state?.addedCount).toBe(1);
    expect(state?.removedCount).toBe(1);
    expect(state?.inCart).toBe(false);
  });

  test('multiple adds and removes keep inCart true when adds exceed removes', {
    tag: ['@utils', '@cartHistory'],
  }, async () => {
    const history = new CartHistory();
    history.addItem('Item');
    history.addItem('Item');
    history.addItem('Item');
    history.removeItem('Item');

    const state = history.getItemState('Item');
    expect(state?.addedCount).toBe(3);
    expect(state?.removedCount).toBe(1);
    expect(state?.inCart).toBe(true);
  });

  test('clear makes all items not in cart but preserves history', {
    tag: ['@utils', '@cartHistory', '@clear'],
  }, async () => {
    const history = new CartHistory();
    history.addItem('A');
    history.addItem('B');
    history.clear('manual');

    const snapshot = history.getSnapshot();
    expect(snapshot.clearsCount).toBe(1);
    expect(Object.values(snapshot.items).every((item) => item.inCart === false)).toBe(true);
    expect(snapshot.events.length).toBe(3);
  });

  test('reset behaves like clear and increments resetsCount', {
    tag: ['@utils', '@cartHistory', '@reset'],
  }, async () => {
    const history = new CartHistory();
    history.addItem('Item');
    history.reset();

    const snapshot = history.getSnapshot();
    expect(snapshot.resetsCount).toBe(1);
    expect(Object.values(snapshot.items).every((item) => item.inCart === false)).toBe(true);
  });

  test('checkoutStarted and checkoutCompleted counters are tracked correctly', {
    tag: ['@utils', '@cartHistory', '@checkout'],
  }, async () => {
    const history = new CartHistory();
    history.checkoutStarted();
    history.checkoutCompleted(true);
    history.checkoutCompleted(false);

    const snapshot = history.getSnapshot();
    expect(snapshot.checkoutStartedCount).toBe(1);
    expect(snapshot.checkoutCompletedCount).toBe(2);
    expect(snapshot.successfulCheckouts).toBe(1);
    expect(snapshot.failedCheckouts).toBe(1);
  });

  test('getTotalAddedCount and getTotalRemovedCount return aggregated values', {
    tag: ['@utils', '@cartHistory', '@aggregate'],
  }, async () => {
    const history = new CartHistory();
    history.addItem('A');
    history.addItem('B');
    history.addItem('B');
    history.removeItem('B');

    expect(history.getTotalAddedCount()).toBe(3);
    expect(history.getTotalRemovedCount()).toBe(1);
  });

  test('getItemState returns undefined for unknown item', {
    tag: ['@utils', '@cartHistory'],
  }, async () => {
    const history = new CartHistory();
    expect(history.getItemState('Unknown')).toBeUndefined();
  });

  test('events array mutation does not affect internal state', {
    tag: ['@utils', '@cartHistory'],
  }, async () => {
    const history = new CartHistory();
    history.addItem('Item');
    const eventsBefore = history.getEvents().length;
    const events = history.getEvents();
    events.push({ type: 'clear', timestamp: 0 });
    expect(history.getEvents().length).toBe(eventsBefore);
  });

  test('snapshot immutability: old snapshot remains unchanged after new events', {
    tag: ['@utils', '@cartHistory'],
  }, async () => {
    const history = new CartHistory();
    history.addItem('Item');
    const snapshotBefore = history.getSnapshot();
    history.addItem('Item');
    const snapshotAfter = history.getSnapshot();

    expect(snapshotBefore.items['Item'].addedCount).toBe(1);
    expect(snapshotAfter.items['Item'].addedCount).toBe(2);
  });
});
