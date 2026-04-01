// Feature: medtech-solutions-website, Property 9: Product detail page includes delivery and payment summary

import { describe, it, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { render, within, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Product } from '../types';

/**
 * Validates: Requirements 7.3
 *
 * Property 9: For any product, the rendered ProductDetailPage should contain:
 * - Text indicating countrywide delivery availability across Kenya
 * - Text indicating pay-on-delivery payment terms
 */

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('../components/MediaGallery', () => ({
  default: () => <div data-testid="media-gallery" />,
}));

vi.mock('../components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner" />,
}));

import { supabase } from '../lib/supabaseClient';
import ProductDetailPage from './ProductDetailPage';

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

function mockSupabaseWithProduct(product: Product) {
  vi.mocked(supabase.from).mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: product, error: null }),
      }),
    }),
  } as any);
}

async function renderAndWait(product: Product) {
  mockSupabaseWithProduct(product);

  let container!: HTMLElement;
  let unmount!: () => void;

  await act(async () => {
    const result = render(
      <MemoryRouter initialEntries={[`/products/${product.id}`]}>
        <Routes>
          <Route
            path="/products/:id"
            element={<ProductDetailPage onAddToCart={vi.fn()} />}
          />
        </Routes>
      </MemoryRouter>,
    );
    container = result.container;
    unmount = result.unmount;
  });

  return { container, unmount };
}

describe('ProductDetailPage — Property 9: Product detail page includes delivery and payment summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows countrywide delivery text for any product', async () => {
    await fc.assert(
      fc.asyncProperty(productArb, async (product) => {
        const { container, unmount } = await renderAndWait(product);

        const hasDelivery = within(container).queryByText(
          /Countrywide delivery available across Kenya/i,
        ) !== null;

        unmount();
        return hasDelivery;
      }),
      { numRuns: 25 },
    );
  }, 60_000);

  it('shows pay on delivery text for any product', async () => {
    await fc.assert(
      fc.asyncProperty(productArb, async (product) => {
        const { container, unmount } = await renderAndWait(product);

        const hasPayOnDelivery = within(container).queryByText(/Pay on Delivery/i) !== null;

        unmount();
        return hasPayOnDelivery;
      }),
      { numRuns: 25 },
    );
  }, 60_000);
});
