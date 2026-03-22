import type { CartItem } from '../types';

// State
export type CartState = CartItem[];

// Actions
export type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_QUANTITY'; payload: { product_id: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { product_id: string } }
  | { type: 'CLEAR_CART' };

const STORAGE_KEY = 'medtech_cart';

/** Reads cart state from localStorage. Returns empty array if nothing is stored or parsing fails. */
export function loadCartFromStorage(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartState;
  } catch {
    return [];
  }
}

/** Persists cart state to localStorage. */
export function saveCartToStorage(cart: CartState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Silently ignore storage errors (e.g. private browsing quota)
  }
}

/**
 * Pure reducer for cart state. No side effects — localStorage persistence
 * must be handled by the caller.
 */
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.find((item) => item.product_id === action.payload.product_id);
      if (existing) {
        return state.map((item) =>
          item.product_id === action.payload.product_id
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      }
      return [...state, action.payload];
    }

    case 'UPDATE_QUANTITY': {
      const { product_id, quantity } = action.payload;
      if (quantity <= 0) {
        return state.filter((item) => item.product_id !== product_id);
      }
      return state.map((item) =>
        item.product_id === product_id ? { ...item, quantity } : item
      );
    }

    case 'REMOVE_ITEM':
      return state.filter((item) => item.product_id !== action.payload.product_id);

    case 'CLEAR_CART':
      return [];

    default:
      return state;
  }
}
