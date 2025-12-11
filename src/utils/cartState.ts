import { productCatalog, ProductDefinition } from '../data/products';

export interface CartItemSnapshot {
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface CartSnapshot {
  items: CartItemSnapshot[];
  subtotal: number;
}

export interface CheckoutSummarySnapshot {
  items: CartItemSnapshot[];
  itemTotal: number;
  tax: number;
  total: number;
}

export function calculateSubtotal(items: CartItemSnapshot[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function toCartItemSnapshotFromDefinition(
  product: ProductDefinition,
  quantity = 1,
): CartItemSnapshot {
  return {
    name: product.name,
    unitPrice: product.price,
    quantity,
  };
}

export function findProductDefinitionByName(name: string): ProductDefinition {
  const product = productCatalog.getByName(name);
  if (!product) {
    throw new Error(`Product with name "${name}" not found in catalog`);
  }
  return product;
}
