import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  cartReducer,
  loadCartFromStorage,
  saveCartToStorage,
  type CartState,
} from './cartReducer';
import type { CartItem } from '../types';

const item1: CartItem = {
  product_id: 'p1',
  name: 'Phone A',
  effective_price: 15000,
  quantity: 1,
  thumbnail_url: 'https://example.com/phone-a.jpg',
};

const item2: CartItem = {
  product_id: 'p2',
  name: 'Laptop B',
  effective_price: 55000,
  quantity: 2,
  thumbnail_url: 'https://example.com/laptop-b.jpg',
};

describe('cartReducer', () => {
  describe('ADD_ITEM', () => {
    it('adds a new item to an empty cart', () => {
      const state = cartReducer([], { type: 'ADD_ITEM', payload: item1 });
      expect(state).toHaveLength(1);
      expect(state[0]).toEqual(item1);
    });

    it('adds a new item to a non-empty cart', () => {
      const state = cartReducer([item1], { type: 'ADD_ITEM', payload: item2 });
      expect(state).toHaveLength(2);
    });

    it('increments quantity when adding an existing product', () => {
      const state = cartReducer([item1], { type: 'ADD_ITEM', payload: item1 });
      expect(state).toHaveLength(1);
      expect(state[0].quantity).toBe(2);
    });

    it('does not mutate the original state', () => {
      const original: CartState = [item1];
      cartReducer(original, { type: 'ADD_ITEM', payload: item2 });
      expect(original).toHaveLength(1);
    });
  });

  describe('UPDATE_QUANTITY', () => {
    it('updates the quantity of an existing item', () => {
      const state = cartReducer(
        [item1, item2],
        { type: 'UPDATE_QUANTITY', payload: { product_id: 'p1', quantity: 5 } }
      );
      expect(state.find((i) => i.product_id === 'p1')?.quantity).toBe(5);
    });

    it('removes the item when quantity is set to 0', () => {
      const state = cartReducer(
        [item1, item2],
        { type: 'UPDATE_QUANTITY', payload: { product_id: 'p1', quantity: 0 } }
      );
      expect(state.find((i) => i.product_id === 'p1')).toBeUndefined();
      expect(state).toHaveLength(1);
    });

    it('removes the item when quantity is negative', () => {
      const state = cartReducer(
        [item1],
        { type: 'UPDATE_QUANTITY', payload: { product_id: 'p1', quantity: -1 } }
      );
      expect(state).toHaveLength(0);
    });
  });

  describe('REMOVE_ITEM', () => {
    it('removes an item by product_id', () => {
      const state = cartReducer(
        [item1, item2],
        { type: 'REMOVE_ITEM', payload: { product_id: 'p1' } }
      );
      expect(state).toHaveLength(1);
      expect(state[0].product_id).toBe('p2');
    });

    it('returns unchanged state when product_id not found', () => {
      const state = cartReducer(
        [item1],
        { type: 'REMOVE_ITEM', payload: { product_id: 'nonexistent' } }
      );
      expect(state).toHaveLength(1);
    });
  });

  describe('CLEAR_CART', () => {
    it('empties the cart', () => {
      const state = cartReducer([item1, item2], { type: 'CLEAR_CART' });
      expect(state).toHaveLength(0);
    });

    it('returns empty array for already-empty cart', () => {
      const state = cartReducer([], { type: 'CLEAR_CART' });
      expect(state).toEqual([]);
    });
  });
});

describe('localStorage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loadCartFromStorage returns empty array when nothing stored', () => {
    expect(loadCartFromStorage()).toEqual([]);
  });

  it('saveCartToStorage and loadCartFromStorage round-trip', () => {
    const cart: CartState = [item1, item2];
    saveCartToStorage(cart);
    expect(loadCartFromStorage()).toEqual(cart);
  });

  it('loadCartFromStorage returns empty array on invalid JSON', () => {
    localStorage.setItem('medtech_cart', 'not-json{{{');
    expect(loadCartFromStorage()).toEqual([]);
  });
});
