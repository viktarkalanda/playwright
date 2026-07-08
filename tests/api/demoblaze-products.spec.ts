// tests/api/demoblaze-products.spec.ts
//
// API-level tests for DemoBlaze product endpoints:
// GET /entries, POST /bycat, GET /prod?id=<id>
import { apiTest as test, expect } from '../../src/api/fixtures/api-fixtures';
import { DEMOBLAZE_CATEGORIES } from '../../src/api/types/DemoBlazeTypes';

test.describe('DemoBlaze Products API', () => {
  test.describe('GET /entries — all products', () => {
    test(
      'returns 200 and a product list',
      { tag: ['@api', '@products', '@smoke'] },
      async ({ demoBlazeApi }) => {
        const envelope = await demoBlazeApi.getProducts();

        expect(envelope.status).toBe(200);
        expect(envelope.ok).toBe(true);
      },
    );

    test(
      'product list contains at least one item',
      { tag: ['@api', '@products', '@smoke'] },
      async ({ demoBlazeApi }) => {
        const products = await demoBlazeApi.getAllProducts();

        expect(products.length).toBeGreaterThan(0);
      },
    );

    test(
      'each product has id, title, price, and category',
      { tag: ['@api', '@products', '@regression'] },
      async ({ demoBlazeApi }) => {
        const products = await demoBlazeApi.getAllProducts();

        for (const product of products) {
          expect(typeof product.id).toBe('number');
          expect(typeof product.title).toBe('string');
          expect(product.title.trim()).not.toBe('');
          expect(typeof product.price).toBe('number');
          expect(product.price).toBeGreaterThan(0);
          expect(typeof product.cat).toBe('string');
        }
      },
    );

    test(
      'response includes Count field matching number of items',
      { tag: ['@api', '@products', '@regression'] },
      async ({ demoBlazeApi }) => {
        const envelope = await demoBlazeApi.getProducts();

        expect(envelope.body.Count).toBe(envelope.body.Items.length);
      },
    );

    test(
      'products include items from all three categories',
      { tag: ['@api', '@products', '@regression'] },
      async ({ demoBlazeApi }) => {
        const products = await demoBlazeApi.getAllProducts();
        const cats = new Set(products.map((p) => p.cat));

        expect(cats.has('phone')).toBe(true);
        expect(cats.has('notebook')).toBe(true);
        expect(cats.has('monitor')).toBe(true);
      },
    );

    test(
      'all product IDs are unique',
      { tag: ['@api', '@products', '@regression'] },
      async ({ demoBlazeApi }) => {
        const products = await demoBlazeApi.getAllProducts();
        const ids = products.map((p) => p.id);
        const unique = new Set(ids);

        expect(unique.size).toBe(ids.length);
      },
    );
  });

  test.describe('POST /bycat — products by category', () => {
    test(
      'Phones category returns only phone products',
      { tag: ['@api', '@products', '@categories', '@smoke'] },
      async ({ demoBlazeApi }) => {
        const phones = await demoBlazeApi.getProductsWithCategory(DEMOBLAZE_CATEGORIES.Phones);

        expect(phones.length).toBeGreaterThan(0);
        for (const p of phones) {
          expect(p.cat).toBe('phone');
        }
      },
    );

    test(
      'Laptops category returns only notebook products',
      { tag: ['@api', '@products', '@categories', '@smoke'] },
      async ({ demoBlazeApi }) => {
        const laptops = await demoBlazeApi.getProductsWithCategory(DEMOBLAZE_CATEGORIES.Laptops);

        expect(laptops.length).toBeGreaterThan(0);
        for (const p of laptops) {
          expect(p.cat).toBe('notebook');
        }
      },
    );

    test(
      'Monitors category returns only monitor products',
      { tag: ['@api', '@products', '@categories', '@smoke'] },
      async ({ demoBlazeApi }) => {
        const monitors = await demoBlazeApi.getProductsWithCategory(DEMOBLAZE_CATEGORIES.Monitors);

        expect(monitors.length).toBeGreaterThan(0);
        for (const p of monitors) {
          expect(p.cat).toBe('monitor');
        }
      },
    );

    test(
      'phone and laptop categories return different products',
      { tag: ['@api', '@products', '@categories', '@regression'] },
      async ({ demoBlazeApi }) => {
        const phones = await demoBlazeApi.getProductsWithCategory('phone');
        const laptops = await demoBlazeApi.getProductsWithCategory('notebook');

        const phoneIds = new Set(phones.map((p) => p.id));
        const laptopIds = laptops.map((p) => p.id);

        for (const id of laptopIds) {
          expect(phoneIds.has(id)).toBe(false);
        }
      },
    );

    test(
      'category totals add up to approximate full catalog',
      { tag: ['@api', '@products', '@categories', '@regression'] },
      async ({ demoBlazeApi }) => {
        const [phones, laptops, monitors, all] = await Promise.all([
          demoBlazeApi.getProductsWithCategory('phone'),
          demoBlazeApi.getProductsWithCategory('notebook'),
          demoBlazeApi.getProductsWithCategory('monitor'),
          demoBlazeApi.getAllProducts(),
        ]);

        const total = phones.length + laptops.length + monitors.length;
        expect(total).toBe(all.length);
      },
    );
  });

  test.describe('GET /prod — individual product details', () => {
    test(
      'fetching a known product by ID returns correct data',
      { tag: ['@api', '@products', '@smoke'] },
      async ({ demoBlazeApi }) => {
        const products = await demoBlazeApi.getAllProducts();
        expect(products.length).toBeGreaterThan(0);
        const first = products[0];

        const envelope = await demoBlazeApi.getProduct(first.id);

        expect(envelope.status).toBe(200);
        expect(envelope.body.id).toBe(first.id);
        expect(envelope.body.title).toBe(first.title);
        expect(envelope.body.price).toBe(first.price);
        expect(envelope.body.cat).toBe(first.cat);
      },
    );

    test(
      'product detail includes a non-empty description',
      { tag: ['@api', '@products', '@regression'] },
      async ({ demoBlazeApi }) => {
        const products = await demoBlazeApi.getAllProducts();
        const product = products[0];

        const envelope = await demoBlazeApi.getProduct(product.id);
        expect(envelope.body.desc.trim()).not.toBe('');
      },
    );

    test(
      'product detail includes an image URL',
      { tag: ['@api', '@products', '@regression'] },
      async ({ demoBlazeApi }) => {
        const products = await demoBlazeApi.getAllProducts();
        const product = products[1] ?? products[0];

        const envelope = await demoBlazeApi.getProduct(product.id);
        expect(envelope.body.img.trim()).not.toBe('');
      },
    );

    test(
      'first three products each have valid details',
      { tag: ['@api', '@products', '@regression'] },
      async ({ demoBlazeApi }) => {
        const products = await demoBlazeApi.getAllProducts();
        const sample = products.slice(0, 3);

        for (const p of sample) {
          const detail = await demoBlazeApi.getProduct(p.id);
          expect(detail.body.title).toBe(p.title);
          expect(detail.body.price).toBe(p.price);
        }
      },
    );
  });
});
