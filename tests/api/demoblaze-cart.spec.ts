// tests/api/demoblaze-cart.spec.ts
//
// API-level tests for DemoBlaze cart endpoints:
// POST /addtocart, POST /viewcart, POST /deleteitem
import { apiTest as test, expect } from '../../src/api/fixtures/api-fixtures';
import type { DemoBlazeApiClient } from '../../src/api/clients/DemoBlazeApiClient';

const uniqueUsername = (): string =>
  `cart_api_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

async function createAuthenticatedSession(
  api: DemoBlazeApiClient,
): Promise<{ username: string; token: string }> {
  const username = uniqueUsername();
  const password = 'CartApiPass1';
  await api.signup(username, password);
  const login = await api.login(username, password);
  if (!login.token) {
    throw new Error(`Login failed for ${username}`);
  }
  return { username, token: login.token };
}

test.describe('DemoBlaze Cart API', () => {
  test.describe('POST /viewcart — view cart contents', () => {
    test(
      'new session has an empty cart',
      { tag: ['@api', '@cart', '@smoke'] },
      async ({ demoBlazeApi }) => {
        const { token } = await createAuthenticatedSession(demoBlazeApi);
        const envelope = await demoBlazeApi.viewCart(token);

        expect(envelope.status).toBe(200);
        const items = envelope.body.Items ?? [];
        expect(items.length).toBe(0);
      },
    );

    test(
      'viewcart response has Items field',
      { tag: ['@api', '@cart', '@regression'] },
      async ({ demoBlazeApi }) => {
        const { token } = await createAuthenticatedSession(demoBlazeApi);
        const envelope = await demoBlazeApi.viewCart(token);

        expect(envelope.body).toHaveProperty('Items');
      },
    );
  });

  test.describe('POST /addtocart — add items', () => {
    test(
      'adding a product returns 200',
      { tag: ['@api', '@cart', '@smoke'] },
      async ({ demoBlazeApi }) => {
        const { token } = await createAuthenticatedSession(demoBlazeApi);
        const products = await demoBlazeApi.getAllProducts();
        expect(products.length).toBeGreaterThan(0);

        const envelope = await demoBlazeApi.addToCart(products[0].id, token);

        expect(envelope.status).toBe(200);
      },
    );

    test(
      'cart contains the added product after addtocart',
      { tag: ['@api', '@cart', '@smoke'] },
      async ({ demoBlazeApi }) => {
        const { token } = await createAuthenticatedSession(demoBlazeApi);
        const products = await demoBlazeApi.getAllProducts();
        const product = products[0];

        await demoBlazeApi.addToCart(product.id, token);
        const cart = await demoBlazeApi.viewCart(token);

        const items = cart.body.Items ?? [];
        const found = items.some((item) => item.prod_id === product.id);
        expect(found).toBe(true);
      },
    );

    test(
      'adding two different products results in two cart items',
      { tag: ['@api', '@cart', '@regression'] },
      async ({ demoBlazeApi }) => {
        const { token } = await createAuthenticatedSession(demoBlazeApi);
        const products = await demoBlazeApi.getAllProducts();
        expect(products.length).toBeGreaterThanOrEqual(2);

        await demoBlazeApi.addToCart(products[0].id, token);
        await demoBlazeApi.addToCart(products[1].id, token);

        const cart = await demoBlazeApi.viewCart(token);
        const items = cart.body.Items ?? [];
        expect(items.length).toBeGreaterThanOrEqual(2);
      },
    );

    test(
      'cart item has expected prod_id and title fields',
      { tag: ['@api', '@cart', '@regression'] },
      async ({ demoBlazeApi }) => {
        const { token } = await createAuthenticatedSession(demoBlazeApi);
        const products = await demoBlazeApi.getAllProducts();
        const product = products[0];

        await demoBlazeApi.addToCart(product.id, token);
        const cart = await demoBlazeApi.viewCart(token);

        const items = cart.body.Items ?? [];
        const addedItem = items.find((i) => i.prod_id === product.id);
        expect(addedItem).toBeDefined();
        expect(addedItem!.title).toBe(product.title);
        expect(typeof addedItem!.id).toBe('string');
      },
    );

    test(
      'cart item price matches product catalog price',
      { tag: ['@api', '@cart', '@regression'] },
      async ({ demoBlazeApi }) => {
        const { token } = await createAuthenticatedSession(demoBlazeApi);
        const products = await demoBlazeApi.getAllProducts();
        const product = products[0];

        await demoBlazeApi.addToCart(product.id, token);
        const cart = await demoBlazeApi.viewCart(token);

        const items = cart.body.Items ?? [];
        const addedItem = items.find((i) => i.prod_id === product.id);
        expect(addedItem).toBeDefined();
        expect(addedItem!.price).toBe(product.price);
      },
    );
  });

  test.describe('POST /deleteitem — remove items from cart', () => {
    test(
      'deleting a cart item returns 200',
      { tag: ['@api', '@cart', '@smoke'] },
      async ({ demoBlazeApi }) => {
        const { token } = await createAuthenticatedSession(demoBlazeApi);
        const products = await demoBlazeApi.getAllProducts();

        await demoBlazeApi.addToCart(products[0].id, token);
        const cart = await demoBlazeApi.viewCart(token);
        const items = cart.body.Items ?? [];
        expect(items.length).toBeGreaterThan(0);

        const envelope = await demoBlazeApi.deleteCartItem(items[0].id);

        expect(envelope.status).toBe(200);
      },
    );

    test(
      'cart is empty after deleting the only item',
      { tag: ['@api', '@cart', '@regression'] },
      async ({ demoBlazeApi }) => {
        const { token } = await createAuthenticatedSession(demoBlazeApi);
        const products = await demoBlazeApi.getAllProducts();

        await demoBlazeApi.addToCart(products[0].id, token);
        const cartBefore = await demoBlazeApi.viewCart(token);
        const itemsBefore = cartBefore.body.Items ?? [];
        expect(itemsBefore.length).toBeGreaterThan(0);

        await demoBlazeApi.deleteCartItem(itemsBefore[0].id);

        const cartAfter = await demoBlazeApi.viewCart(token);
        const itemsAfter = cartAfter.body.Items ?? [];
        expect(itemsAfter.length).toBe(0);
      },
    );

    test(
      'deleting one of two items leaves the other intact',
      { tag: ['@api', '@cart', '@regression'] },
      async ({ demoBlazeApi }) => {
        const { token } = await createAuthenticatedSession(demoBlazeApi);
        const products = await demoBlazeApi.getAllProducts();
        expect(products.length).toBeGreaterThanOrEqual(2);

        await demoBlazeApi.addToCart(products[0].id, token);
        await demoBlazeApi.addToCart(products[1].id, token);

        const cartBefore = await demoBlazeApi.viewCart(token);
        const itemsBefore = cartBefore.body.Items ?? [];
        expect(itemsBefore.length).toBeGreaterThanOrEqual(2);

        const toDelete = itemsBefore[0];
        const toKeep = itemsBefore[1];

        await demoBlazeApi.deleteCartItem(toDelete.id);

        const cartAfter = await demoBlazeApi.viewCart(token);
        const itemsAfter = cartAfter.body.Items ?? [];
        const keptIds = itemsAfter.map((i) => i.id);

        expect(keptIds).not.toContain(toDelete.id);
        expect(keptIds).toContain(toKeep.id);
      },
    );

    test(
      'cart count decreases by one after each deletion',
      { tag: ['@api', '@cart', '@regression'] },
      async ({ demoBlazeApi }) => {
        const { token } = await createAuthenticatedSession(demoBlazeApi);
        const products = await demoBlazeApi.getAllProducts();
        expect(products.length).toBeGreaterThanOrEqual(3);

        for (const product of products.slice(0, 3)) {
          await demoBlazeApi.addToCart(product.id, token);
        }

        const cartStart = await demoBlazeApi.viewCart(token);
        const startCount = (cartStart.body.Items ?? []).length;
        expect(startCount).toBeGreaterThanOrEqual(3);

        for (let deleted = 1; deleted <= 3; deleted += 1) {
          const cart = await demoBlazeApi.viewCart(token);
          const items = cart.body.Items ?? [];
          if (items.length === 0) break;
          await demoBlazeApi.deleteCartItem(items[0].id);

          const after = await demoBlazeApi.viewCart(token);
          const afterItems = after.body.Items ?? [];
          expect(afterItems.length).toBe(items.length - 1);
        }
      },
    );
  });
});
