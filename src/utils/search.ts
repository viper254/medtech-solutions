import type { Product } from '../types';

/**
 * Filters products by a case-insensitive search query against name and description.
 * Returns all products where either field contains the query string.
 * An empty query returns all products.
 */
export function searchProducts(products: Product[], query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
  );
}
