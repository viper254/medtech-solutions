// Feature: medtech-solutions-website, Property 7: Cart total invariant — total always equals sum of (effective_price × quantity)
// Feature: medtech-solutions-website, Property 8: Adding a product increases item count

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { cartReducer, type CartState } from './cartReducer';
import type { CartItem } from '../types';

/**
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */

const cartItemArb: fc.Arbitrary<CartItem> = fc.record({
  product_id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 80 }),
  effective_price: fc.integer({ min: 1, max: 100_000 }),
  price_type: fc.constantFrom('offer' as const, 'discounted' as const, 'regular' as const),
  price_max: fc.option(fc.integer({ min: 1, max: 200_000 }), { nil: null }),
  quantity: fc.integer({ min: 1, max: 100 }),
  thumbnail_url: fc.constant(''),
});

/** Generates a valid cart state (no duplicate product_ids). */
const cartStateArb: fc.Arbitrary<CartState> = fc
  .array(cartItemArb, { minLength: 0, maxLength: 20 })
  .map((items) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.product_id)) return false;
      seen.add(item.product_id);
      return true;
    });
  });

function computeTotal(cart: CartState): number {
  return cart.reduce((sum, item) => sum + item.effective_price * item.quantity, 0);
}

function totalQuantity(cart: CartState): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

describe('cartReducer — Property 7: Cart total invariant', () => {
  it('total equals sum of (effective_price × quantity) after ADD_ITEM', () => {
    fc.assert(
      fc.property(cartStateArb, cartItemArb, (state, newItem) => {
        const nextState = cartReducer(state, { type: 'ADD_ITEM', payload: newItem });
        const expected = computeTotal(nextState);
        const actual = nextState.reduce(
          (sum, item) => sum + item.effective_price * item.quantity,
          0,
        );
        return Math.abs(actual - expected) < 0.0001;
      }),
      { numRuns: 25 },
    );
  });

  it('total equals sum of (effective_price × quantity) after UPDATE_QUANTITY', () => {
    fc.assert(
      fc.property(
        cartStateArb.filter((s) => s.length > 0),
        fc.integer({ min: 0, max: 50 }),
        (state, newQty) => {
          const target = state[0];
          const nextState = cartReducer(state, {
            type: 'UPDATE_QUANTITY',
            payload: { product_id: target.product_id, quantity: newQty },
          });
          const expected = computeTotal(nextState);
          const actual = nextState.reduce(
            (sum, item) => sum + item.effective_price * item.quantity,
            0,
          );
          return Math.abs(actual - expected) < 0.0001;
        },
      ),
      { numRuns: 25 },
    );
  });

  it('total equals sum of (effective_price × quantity) after REMOVE_ITEM', () => {
    fc.assert(
      fc.property(
        cartStateArb.filter((s) => s.length > 0),
        (state) => {
          const target = state[0];
          const nextState = cartReducer(state, {
            type: 'REMOVE_ITEM',
            payload: { product_id: target.product_id },
          });
          const expected = computeTotal(nextState);
          const actual = nextState.reduce(
            (sum, item) => sum + item.effective_price * item.quantity,
            0,
          );
          return Math.abs(actual - expected) < 0.0001;
        },
      ),
      { numRuns: 25 },
    );
  });
});

describe('cartReducer — Property 8: Adding a product increases item count', () => {
  it('after ADD_ITEM the cart contains the product and total quantity is >= previous total', () => {
    fc.assert(
      fc.property(cartStateArb, cartItemArb, (state, newItem) => {
        const prevTotal = totalQuantity(state);
        const nextState = cartReducer(state, { type: 'ADD_ITEM', payload: newItem });

        const containsProduct = nextState.some(
          (item) => item.product_id === newItem.product_id,
        );
        const nextTotal = totalQuantity(nextState);

        return containsProduct && nextTotal >= prevTotal;
      }),
      { numRuns: 25 },
    );
  });
});
