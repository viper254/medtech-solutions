// Feature: medtech-solutions-website, Property 15: All product images have non-empty alt text

import { describe, it, vi } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from './ProductCard';
import type { Product, MediaItem } from '../types';

/**
 * Validates: Requirements 10.3
 *
 * Property 15: For any product and any of its images, the rendered <img> element
 * should have a non-empty alt attribute describing the product.
 */

const categoryArb = fc.constantFrom(
  'Phones' as const,
  'Laptops' as const,
  'Desktops' as const,
  'Accessories' as const,
);

const mediaItemArb: fc.Arbitrary<MediaItem> = fc.record({
  id: fc.uuid(),
  product_id: fc.uuid(),
  url: fc.webUrl(),
  type: fc.constant('image' as const),
  sort_order: fc.nat({ max: 10 }),
});

// Products must have at least one image in the media array
const productWithImagesArb: fc.Arbitrary<Product> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 80 }).filter((s) => s.trim().length > 0),
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
  media: fc.array(mediaItemArb, { minLength: 1, maxLength: 5 }),
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

describe('ProductCard — Property 15: All product images have non-empty alt text', () => {
  it('renders the thumbnail <img> with a non-empty alt attribute', () => {
    fc.assert(
      fc.property(productWithImagesArb, (product) => {
        const container = renderCard(product);
        const imgs = container.querySelectorAll('img');

        // There must be at least one <img> rendered (product has media)
        if (imgs.length === 0) return false;

        // Every rendered <img> must have a non-empty alt attribute
        for (const img of Array.from(imgs)) {
          const alt = img.getAttribute('alt');
          if (!alt || alt.trim() === '') return false;
        }

        return true;
      }),
      { numRuns: 25 },
    );
  });

  it('thumbnail alt text matches the product name', () => {
    fc.assert(
      fc.property(productWithImagesArb, (product) => {
        const container = renderCard(product);
        const img = container.querySelector('img');

        // If an image is rendered, its alt must equal the product name
        if (!img) return false;
        return img.getAttribute('alt') === product.name;
      }),
      { numRuns: 25 },
    );
  });
});
