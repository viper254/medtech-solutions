// Feature: medtech-solutions-website, Property 3: Search results contain only matching products

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { searchProducts } from './search';
import type { Product } from '../types';

/**
 * Validates: Requirements 2.2
 *
 * Property 3: For any non-empty search query and any product dataset,
 * every product returned by searchProducts must have a name or description
 * that contains the query (case-insensitive), and no non-matching product
 * should appear in the results.
 */

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

describe('searchProducts — Property 3: Search results contain only matching products', () => {
  it('every returned product matches the query, and no non-matching product is included', () => {
    fc.assert(
      fc.property(
        fc.array(productArb, { maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (products, query) => {
          const trimmed = query.trim();
          // Skip whitespace-only queries (empty query returns all — different behaviour)
          fc.pre(trimmed.length > 0);

          const results = searchProducts(products, query);
          const q = trimmed.toLowerCase();

          // Every result must match
          const allResultsMatch = results.every(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q),
          );

          // No non-matching product should appear in results
          const resultIds = new Set(results.map((p) => p.id));
          const noFalsePositives = products
            .filter(
              (p) =>
                !p.name.toLowerCase().includes(q) &&
                !p.description.toLowerCase().includes(q),
            )
            .every((p) => !resultIds.has(p.id));

          return allResultsMatch && noFalsePositives;
        },
      ),
      { numRuns: 25 },
    );
  });
});
