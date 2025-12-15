export type CartEventType =
  | 'add'
  | 'remove'
  | 'clear'
  | 'reset'
  | 'checkoutStarted'
  | 'checkoutCompleted';

export interface CartEventBase {
  type: CartEventType;
  timestamp: number;
  description?: string;
}

export interface CartItemEvent extends CartEventBase {
  type: 'add' | 'remove';
  productName: string;
  productId?: string;
  price?: number;
}

export interface CartClearEvent extends CartEventBase {
  type: 'clear';
  reason?: string;
}

export interface CartResetEvent extends CartEventBase {
  type: 'reset';
}

export interface CartCheckoutStartedEvent extends CartEventBase {
  type: 'checkoutStarted';
}

export interface CartCheckoutCompletedEvent extends CartEventBase {
  type: 'checkoutCompleted';
  success: boolean;
  orderId?: string;
}

export type CartEvent =
  | CartItemEvent
  | CartClearEvent
  | CartResetEvent
  | CartCheckoutStartedEvent
  | CartCheckoutCompletedEvent;

export interface CartItemState {
  productName: string;
  productId?: string;
  addedCount: number;
  removedCount: number;
  inCart: boolean;
  lastUpdated: number;
}

export interface CartHistorySnapshot {
  items: Record<string, CartItemState>;
  events: CartEvent[];
  checkoutStartedCount: number;
  checkoutCompletedCount: number;
  successfulCheckouts: number;
  failedCheckouts: number;
  clearsCount: number;
  resetsCount: number;
}

export class CartHistory {
  private readonly events: CartEvent[] = [];

  addItem(
    productName: string,
    options?: { productId?: string; price?: number; description?: string },
  ): void {
    const event: CartItemEvent = {
      type: 'add',
      timestamp: Date.now(),
      productName,
      productId: options?.productId,
      price: options?.price,
      description: options?.description,
    };
    this.events.push(event);
  }

  removeItem(
    productName: string,
    options?: { productId?: string; price?: number; description?: string },
  ): void {
    const event: CartItemEvent = {
      type: 'remove',
      timestamp: Date.now(),
      productName,
      productId: options?.productId,
      price: options?.price,
      description: options?.description,
    };
    this.events.push(event);
  }

  clear(reason?: string): void {
    const event: CartClearEvent = {
      type: 'clear',
      timestamp: Date.now(),
      reason,
    };
    this.events.push(event);
  }

  reset(): void {
    const event: CartResetEvent = {
      type: 'reset',
      timestamp: Date.now(),
    };
    this.events.push(event);
  }

  checkoutStarted(description?: string): void {
    const event: CartCheckoutStartedEvent = {
      type: 'checkoutStarted',
      timestamp: Date.now(),
      description,
    };
    this.events.push(event);
  }

  checkoutCompleted(success: boolean, options?: { orderId?: string; description?: string }): void {
    const event: CartCheckoutCompletedEvent = {
      type: 'checkoutCompleted',
      timestamp: Date.now(),
      success,
      orderId: options?.orderId,
      description: options?.description,
    };
    this.events.push(event);
  }

  getEvents(): CartEvent[] {
    return [...this.events];
  }

  getSnapshot(): CartHistorySnapshot {
    const items: Record<string, CartItemState> = {};
    let checkoutStartedCount = 0;
    let checkoutCompletedCount = 0;
    let successfulCheckouts = 0;
    let failedCheckouts = 0;
    let clearsCount = 0;
    let resetsCount = 0;

    for (const event of this.events) {
      switch (event.type) {
        case 'add': {
          const existing = items[event.productName] ?? {
            productName: event.productName,
            productId: event.productId,
            addedCount: 0,
            removedCount: 0,
            inCart: false,
            lastUpdated: event.timestamp,
          };
          existing.addedCount += 1;
          existing.inCart = true;
          existing.lastUpdated = event.timestamp;
          items[event.productName] = existing;
          break;
        }
        case 'remove': {
          const existing = items[event.productName] ?? {
            productName: event.productName,
            productId: event.productId,
            addedCount: 0,
            removedCount: 0,
            inCart: false,
            lastUpdated: event.timestamp,
          };
          existing.removedCount += 1;
          existing.inCart = existing.addedCount > existing.removedCount;
          existing.lastUpdated = event.timestamp;
          items[event.productName] = existing;
          break;
        }
        case 'clear': {
          clearsCount += 1;
          for (const key of Object.keys(items)) {
            const item = items[key];
            item.inCart = false;
            item.lastUpdated = event.timestamp;
          }
          break;
        }
        case 'reset': {
          resetsCount += 1;
          for (const key of Object.keys(items)) {
            const item = items[key];
            item.inCart = false;
            item.lastUpdated = event.timestamp;
          }
          break;
        }
        case 'checkoutStarted': {
          checkoutStartedCount += 1;
          break;
        }
        case 'checkoutCompleted': {
          checkoutCompletedCount += 1;
          if (event.success) {
            successfulCheckouts += 1;
          } else {
            failedCheckouts += 1;
          }
          break;
        }
        default:
          break;
      }
    }

    return {
      items,
      events: [...this.events],
      checkoutStartedCount,
      checkoutCompletedCount,
      successfulCheckouts,
      failedCheckouts,
      clearsCount,
      resetsCount,
    };
  }

  getCurrentCartProductNames(): string[] {
    const snapshot = this.getSnapshot();
    return Object.values(snapshot.items)
      .filter((item) => item.inCart)
      .map((item) => item.productName);
  }

  getItemState(productName: string): CartItemState | undefined {
    const snapshot = this.getSnapshot();
    return snapshot.items[productName];
  }

  getTotalAddedCount(): number {
    const snapshot = this.getSnapshot();
    return Object.values(snapshot.items).reduce((acc, item) => acc + item.addedCount, 0);
  }

  getTotalRemovedCount(): number {
    const snapshot = this.getSnapshot();
    return Object.values(snapshot.items).reduce((acc, item) => acc + item.removedCount, 0);
  }
}
