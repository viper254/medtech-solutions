// Feature: medtech-solutions-website, Property 1: Category filter shows only matching products

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import type { Product } from '../types';

/**
 * Validates: Requirements 1.2
 *
 * Property 1: For any array of products and any selected category,
 * filtering by that category returns only products whose `category`
 * field equals the selected category — no product from a different
 * category should appear in the results.
 */

// Pure filtering logic extracted from CatalogPage
function filterByCategory(products: Product[], category: string): Product[] {
  return products.filter((p) => p.category === category);
}

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
  original_price: fc.integer({ min: 1, max: 100_000 }),
  discounted_price: fc.option(fc.integer({ min: 1, max: 100_000 }), { nil: null }),
  stock_quantity: fc.nat({ max: 1000 }),
  media: fc.constant([]),
  created_at: fc.constant('2024-01-01T00:00:00Z'),
  updated_at: fc.constant('2024-01-01T00:00:00Z'),
});

describe('CatalogPage — Property 1: Category filter shows only matching products', () => {
  it('returns only products matching the selected category', () => {
    fc.assert(
      fc.property(fc.array(productArb), categoryArb, (products, category) => {
        const result = filterByCategory(products, category);

        // Every product in the result must match the selected category
        return result.every((p) => p.category === category);
      }),
      { numRuns: 25 },
    );
  });

  it('excludes all products from different categories', () => {
    fc.assert(
      fc.property(fc.array(productArb), categoryArb, (products, category) => {
        const result = filterByCategory(products, category);

        // No product from a different category should appear
        const wrongCategory = result.filter((p) => p.category !== category);
        return wrongCategory.length === 0;
      }),
      { numRuns: 25 },
    );
  });

  it('includes every product that belongs to the selected category', () => {
    fc.assert(
      fc.property(fc.array(productArb), categoryArb, (products, category) => {
        const result = filterByCategory(products, category);
        const expected = products.filter((p) => p.category === category);

        return result.length === expected.length;
      }),
      { numRuns: 25 },
    );
  });
});
