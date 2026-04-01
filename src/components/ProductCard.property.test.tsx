// Feature: medtech-solutions-website, Property 2: Product card renders all required fields

import { describe, it, vi } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from './ProductCard';
import type { Product } from '../types';

/**
 * Validates: Requirements 1.3, 1.4, 1.5, 2.4
 *
 * Property 2: For any product object, the rendered ProductCard should:
 * - Contain the product name
 * - Contain the original price
 * - When discounted_price is non-null: both prices appear, original is struck-through
 * - When stock_quantity is 0: an "Out of Stock" indicator appears
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
  original_price: fc.integer({ min: 1, max: 100_000 }),
  discounted_price: fc.option(fc.integer({ min: 1, max: 100_000 }), { nil: null }),
  price_max: fc.option(fc.integer({ min: 1, max: 200_000 }), { nil: null }),
  offer_price: fc.option(fc.integer({ min: 1, max: 100_000 }), { nil: null }),
  offer_expires_at: fc.option(fc.constant('2099-01-01T00:00:00Z'), { nil: null }),
  stock_quantity: fc.nat({ max: 1000 }),
  is_featured: fc.boolean(),
  low_stock_threshold: fc.integer({ min: 1, max: 20 }),
  media: fc.constant([]),
  created_at: fc.constant('2024-01-01T00:00:00Z'),
  updated_at: fc.constant('2024-01-01T00:00:00Z'),
});

function renderCard(product: Product) {
  const onAddToCart = vi.fn();
  const { container } = render(
    <MemoryRouter>
      <ProductCard product={product} onAddToCart={onAddToCart} />
    </MemoryRouter>,
  );
  return container;
}

function formatPrice(price: number) {
  return `KSh ${price.toLocaleString()}`;
}

describe('ProductCard — Property 2: Product card renders all required fields', () => {
  it('renders the product name', () => {
    fc.assert(
      fc.property(productArb, (product) => {
        const container = renderCard(product);
        const nameEl = container.querySelector('h3');
        return nameEl !== null && nameEl.textContent === product.name;
      }),
      { numRuns: 25 },
    );
  });

  it('renders the original price', () => {
    fc.assert(
      fc.property(productArb, (product) => {
        const container = renderCard(product);
        return container.textContent?.includes(formatPrice(product.original_price)) ?? false;
      }),
      { numRuns: 25 },
    );
  });

  it('shows both prices with original struck-through when discounted_price is non-null', () => {
    const discountedProductArb = productArb.filter((p) => p.discounted_price !== null);

    fc.assert(
      fc.property(discountedProductArb, (product) => {
        const container = renderCard(product);

        // Both prices must appear in the rendered text
        const hasDiscountedPrice = container.textContent?.includes(
          formatPrice(product.discounted_price!),
        ) ?? false;
        const hasOriginalPrice = container.textContent?.includes(
          formatPrice(product.original_price),
        ) ?? false;

        // Original price must be in a struck-through element
        const struckEl = container.querySelector('[style*="line-through"]');
        const originalStruckThrough =
          struckEl !== null &&
          struckEl.textContent?.includes(formatPrice(product.original_price));

        return hasDiscountedPrice && hasOriginalPrice && !!originalStruckThrough;
      }),
      { numRuns: 25 },
    );
  });

  it('shows "Out of Stock" indicator when stock_quantity is 0', () => {
    const outOfStockArb = productArb.map((p) => ({ ...p, stock_quantity: 0 }));

    fc.assert(
      fc.property(outOfStockArb, (product) => {
        const container = renderCard(product);
        return container.textContent?.includes('Out of Stock') ?? false;
      }),
      { numRuns: 25 },
    );
  });
});
