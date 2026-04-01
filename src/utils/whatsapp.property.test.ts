// Feature: medtech-solutions-website, Property 5: Single-product WhatsApp URL contains product name and effective price
// Feature: medtech-solutions-website, Property 6: Cart checkout WhatsApp message contains all items

import { describe, it, vi } from 'vitest';
import * as fc from 'fast-check';
import { buildSingleProductUrl, buildCartCheckoutUrl } from './whatsapp';
import type { CartItem, Product } from '../types';

// Mock supabase so DB calls don't run in tests
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })) })) })),
    })),
  },
}));

const categoryArb = fc.constantFrom(
  'Phones' as const,
  'Laptops' as const,
  'Desktops' as const,
  'Accessories' as const,
);

const productArb: fc.Arbitrary<Product> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 80 }),
  category: categoryArb,
  description: fc.string({ minLength: 1, maxLength: 200 }),
  original_price: fc.float({ min: 1, max: 100_000, noNaN: true }),
  discounted_price: fc.option(fc.float({ min: 1, max: 100_000, noNaN: true }), { nil: null }),
  price_max: fc.option(fc.float({ min: 1, max: 200_000, noNaN: true }), { nil: null }),
  offer_price: fc.option(fc.float({ min: 1, max: 100_000, noNaN: true }), { nil: null }),
  offer_expires_at: fc.option(fc.constant('2099-01-01T00:00:00Z'), { nil: null }),
  stock_quantity: fc.nat({ max: 1000 }),
  is_featured: fc.boolean(),
  low_stock_threshold: fc.integer({ min: 1, max: 20 }),
  media: fc.constant([]),
  created_at: fc.constant('2024-01-01T00:00:00Z'),
  updated_at: fc.constant('2024-01-01T00:00:00Z'),
});

const cartItemArb: fc.Arbitrary<CartItem> = fc.record({
  product_id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 80 }),
  effective_price: fc.float({ min: 1, max: 100_000, noNaN: true }),
  price_type: fc.constantFrom('offer' as const, 'discounted' as const, 'regular' as const),
  price_max: fc.option(fc.float({ min: 1, max: 200_000, noNaN: true }), { nil: null }),
  quantity: fc.integer({ min: 1, max: 100 }),
  thumbnail_url: fc.constant(''),
});

describe('buildSingleProductUrl — Property 5: Single-product WhatsApp URL contains product name and effective price', () => {
  it('URL targets wa.me/254793636022, decoded message contains product name and effective price', async () => {
    await fc.assert(
      fc.asyncProperty(productArb, async (product) => {
        const url = await buildSingleProductUrl(product);
        const decoded = decodeURIComponent(url.split('?text=')[1]);

        const effectivePrice = product.discounted_price ?? product.original_price;

        const containsNumber = url.includes('wa.me/254793636022');
        const containsName = decoded.includes(product.name);
        const containsPrice = decoded.includes(`KES ${effectivePrice}`);

        return containsNumber && containsName && containsPrice;
      }),
      { numRuns: 25 },
    );
  });
});

describe('buildCartCheckoutUrl — Property 6: Cart checkout WhatsApp message contains all items', () => {
  it('decoded message contains every item name, quantity, price, and correct total', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(cartItemArb, { minLength: 1, maxLength: 20 }), async (items) => {
        const url = await buildCartCheckoutUrl(items);
        const decoded = decodeURIComponent(url.split('?text=')[1]);

        const allNamesPresent = items.every((item) => decoded.includes(item.name));
        const allQuantitiesPresent = items.every((item) =>
          decoded.includes(`x${item.quantity}`),
        );
        const allPricesPresent = items.every((item) =>
          decoded.includes(`KES ${item.effective_price}`),
        );

        const expectedTotal = items.reduce(
          (sum, item) => sum + item.effective_price * item.quantity,
          0,
        );
        const totalPresent = decoded.includes(`Total: KES ${expectedTotal}`);

        return allNamesPresent && allQuantitiesPresent && allPricesPresent && totalPresent;
      }),
      { numRuns: 25 },
    );
  });
});
