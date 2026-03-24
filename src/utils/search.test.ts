import { describe, it, expect } from 'vitest';
import { searchProducts } from './search';
import type { Product } from '../types';

const makeProduct = (overrides: Partial<Product> & { id: string; name: string; description: string }): Product => ({
  category: 'Phones',
  original_price: 100,
  discounted_price: null,
  price_max: null,
  offer_price: null,
  offer_expires_at: null,
  stock_quantity: 10,
  media: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

const products: Product[] = [
  makeProduct({ id: '1', name: 'iPhone 14', description: 'Apple smartphone with A15 chip' }),
  makeProduct({ id: '2', name: 'Samsung Galaxy S23', description: 'Android flagship phone' }),
  makeProduct({ id: '3', name: 'Dell Laptop', description: 'Powerful laptop for professionals' }),
];

describe('searchProducts', () => {
  it('returns all products for an empty query', () => {
    expect(searchProducts(products, '')).toHaveLength(3);
  });

  it('returns all products for a whitespace-only query', () => {
    expect(searchProducts(products, '   ')).toHaveLength(3);
  });

  it('matches by name (case-insensitive)', () => {
    const results = searchProducts(products, 'iphone');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('1');
  });

  it('matches by description (case-insensitive)', () => {
    const results = searchProducts(products, 'ANDROID');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('2');
  });

  it('returns multiple matches when query fits several products', () => {
    // 'phone' appears in iPhone name and Samsung description
    const results = searchProducts(products, 'phone');
    expect(results.map((p) => p.id)).toEqual(expect.arrayContaining(['1', '2']));
  });

  it('returns empty array when no products match', () => {
    expect(searchProducts(products, 'zzznomatch')).toHaveLength(0);
  });

  it('returns empty array when products list is empty', () => {
    expect(searchProducts([], 'iphone')).toHaveLength(0);
  });
});
