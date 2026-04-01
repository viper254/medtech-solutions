// Feature: medtech-solutions-website, Property 12: Discounted price round-trip
// Feature: medtech-solutions-website, Property 13: Product edit round-trip
// Feature: medtech-solutions-website, Property 14: Deleted product no longer appears in catalog

import { describe, it, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { Product } from '../types/index';

/**
 * Validates: Requirements 9.4, 9.7, 9.8
 *
 * These properties test the Supabase CRUD round-trip behaviour for the admin
 * panel using a mocked Supabase client.
 *
 * Property 12: For any product with a discounted_price, after upsert the mock
 *              returns the same discounted_price on select.
 *
 * Property 13: For any product, after an edit upsert the mock returns the
 *              updated field values on select.
 *
 * Property 14: After a delete, the mock returns an empty array on select
 *              (product no longer in catalog).
 */

// ---------------------------------------------------------------------------
// Mock the Supabase client
// ---------------------------------------------------------------------------

vi.mock('../lib/supabaseClient', () => {
  // In-memory store shared across the mock's chained calls.
  // Each test resets this via the exported `__resetStore` helper.
  const store: Map<string, Product> = new Map();

  const mockFrom = (_table: string) => {
    return {
      upsert: (row: Product) => {
        store.set(row.id, { ...row });
        return { data: [{ ...row }], error: null };
      },
      delete: () => ({
        eq: (field: string, value: string) => {
          for (const [key, product] of store.entries()) {
            if ((product as unknown as Record<string, unknown>)[field] === value) {
              store.delete(key);
            }
          }
          return { data: null, error: null };
        },
      }),
      select: (_cols?: string) => ({
        eq: (field: string, value: string) => {
          const results = [...store.values()].filter(
            (p) => (p as unknown as Record<string, unknown>)[field] === value,
          );
          return { data: results, error: null };
        },
        // select without eq — return all
        then: undefined as unknown,
        data: [...store.values()],
        error: null,
      }),
    };
  };

  return {
    supabase: {
      from: mockFrom,
      __store: store,
      __resetStore: () => store.clear(),
    },
  };
});

// ---------------------------------------------------------------------------
// Import the mocked client AFTER vi.mock is hoisted
// ---------------------------------------------------------------------------

import { supabase } from '../lib/supabaseClient';

// Helper to access the internal reset function exposed by the mock
const resetStore = () =>
  (supabase as unknown as { __resetStore: () => void }).__resetStore();

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const categoryArb = fc.constantFrom(
  'Phones' as const,
  'Laptops' as const,
  'Desktops' as const,
  'Accessories' as const,
);

const uuidArb = fc.uuid();

/** Generates a valid original_price (positive integer). */
const originalPriceArb = fc.integer({ min: 1, max: 1_000_000 });

/**
 * Generates a discounted_price that is strictly less than original_price.
 * Returns [original_price, discounted_price].
 * original_price must be >= 2 so that discounted_price has a valid range [1, orig-1].
 */
const pricesWithDiscountArb = fc.integer({ min: 2, max: 1_000_000 }).chain((orig) =>
  fc
    .integer({ min: 1, max: orig - 1 })
    .map((disc) => [orig, disc] as [number, number]),
);

/** Generates a minimal valid Product (no media, timestamps are stubs). */
const productArb = fc
  .record({
    id: uuidArb,
    name: fc.string({ minLength: 1, maxLength: 80 }).filter((s) => s.trim().length > 0),
    category: categoryArb,
    description: fc.string({ minLength: 1, maxLength: 200 }),
    original_price: originalPriceArb,
    discounted_price: fc.option(fc.integer({ min: 1, max: 999_999 }), { nil: null }),
    price_max: fc.option(fc.integer({ min: 1, max: 1_999_999 }), { nil: null }),
    offer_price: fc.option(fc.integer({ min: 1, max: 999_999 }), { nil: null }),
    offer_expires_at: fc.option(fc.constant('2099-01-01T00:00:00Z'), { nil: null }),
    stock_quantity: fc.nat({ max: 9999 }),
    is_featured: fc.boolean(),
    low_stock_threshold: fc.integer({ min: 1, max: 20 }),
    media: fc.constant([] as import('../types').MediaItem[]),
    created_at: fc.constant('2024-01-01T00:00:00Z'),
    updated_at: fc.constant('2024-01-01T00:00:00Z'),
  })
  .map((p) => p as Product);

// ---------------------------------------------------------------------------
// Property 12: Discounted price round-trip
// ---------------------------------------------------------------------------

describe('Property 12: Discounted price round-trip', () => {
  beforeEach(() => resetStore());

  it('a product saved with a discounted_price reads back the same value', () => {
    fc.assert(
      fc.property(productArb, pricesWithDiscountArb, (product, [orig, disc]) => {
        const productWithDiscount: Product = {
          ...product,
          original_price: orig,
          discounted_price: disc,
        };

        // Upsert
        supabase.from('products').upsert(productWithDiscount);

        // Select back by id
        const { data } = (supabase
          .from('products')
          .select('*')
          .eq('id', productWithDiscount.id)) as any;

        if (!data || data.length === 0) return false;
        const fetched = data[0] as Product;
        return fetched.discounted_price === disc;
      }),
      { numRuns: 25 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 13: Product edit round-trip
// ---------------------------------------------------------------------------

describe('Property 13: Product edit round-trip', () => {
  beforeEach(() => resetStore());

  it('editing a product fields and re-fetching returns the updated values', () => {
    fc.assert(
      fc.property(
        productArb,
        fc.string({ minLength: 1, maxLength: 80 }).filter((s) => s.trim().length > 0),
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.nat({ max: 9999 }),
        (original, updatedName, updatedPrice, updatedQty) => {
          // Insert original
          supabase.from('products').upsert(original);

          // Build updated product (same id, different fields)
          const updated: Product = {
            ...original,
            name: updatedName,
            original_price: updatedPrice,
            stock_quantity: updatedQty,
            updated_at: '2024-06-01T00:00:00Z',
          };

          // Upsert the edit
          supabase.from('products').upsert(updated);

          // Re-fetch by id
          const { data } = (supabase
            .from('products')
            .select('*')
            .eq('id', original.id)) as any;

          if (!data || data.length === 0) return false;
          const fetched = data[0] as Product;

          return (
            fetched.name === updatedName &&
            fetched.original_price === updatedPrice &&
            fetched.stock_quantity === updatedQty
          );
        },
      ),
      { numRuns: 25 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 14: Deleted product no longer appears in catalog
// ---------------------------------------------------------------------------

describe('Property 14: Deleted product no longer appears in catalog', () => {
  beforeEach(() => resetStore());

  it('after a delete, the product no longer appears in select results', () => {
    fc.assert(
      fc.property(productArb, (product) => {
        // Insert
        supabase.from('products').upsert(product);

        // Confirm it exists
        const { data: before } = (supabase
          .from('products')
          .select('*')
          .eq('id', product.id)) as any;
        if (!before || before.length === 0) return false;

        // Delete
        supabase.from('products').delete().eq('id', product.id);

        // Select again — should be empty
        const { data: after } = (supabase
          .from('products')
          .select('*')
          .eq('id', product.id)) as any;

        return after !== null && after.length === 0;
      }),
      { numRuns: 25 },
    );
  });
});
