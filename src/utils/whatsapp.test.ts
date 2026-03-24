import { describe, it, expect } from 'vitest';
import { buildSingleProductUrl, buildCartCheckoutUrl, getEffectivePrice } from './whatsapp';
import type { CartItem, Product } from '../types';

const baseProduct: Product = {
  id: '1',
  name: 'Samsung Galaxy A54',
  category: 'Phones',
  description: 'A great phone',
  original_price: 45000,
  discounted_price: null,
  price_max: null,
  offer_price: null,
  offer_expires_at: null,
  stock_quantity: 10,
  media: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('getEffectivePrice', () => {
  it('returns original_price when discounted_price is null', () => {
    expect(getEffectivePrice({ ...baseProduct, discounted_price: null })).toBe(45000);
  });

  it('returns discounted_price when set', () => {
    expect(getEffectivePrice({ ...baseProduct, discounted_price: 39000 })).toBe(39000);
  });
});

describe('buildSingleProductUrl', () => {
  it('targets the correct WhatsApp number', () => {
    const url = buildSingleProductUrl(baseProduct);
    expect(url).toContain('https://wa.me/254793636022');
  });

  it('includes the product name in the message', () => {
    const url = buildSingleProductUrl(baseProduct);
    const decoded = decodeURIComponent(url.split('?text=')[1]);
    expect(decoded).toContain('Samsung Galaxy A54');
  });

  it('uses original_price when no discount', () => {
    const url = buildSingleProductUrl(baseProduct);
    const decoded = decodeURIComponent(url.split('?text=')[1]);
    expect(decoded).toContain('KES 45000');
  });

  it('uses discounted_price when available', () => {
    const url = buildSingleProductUrl({ ...baseProduct, discounted_price: 39000 });
    const decoded = decodeURIComponent(url.split('?text=')[1]);
    expect(decoded).toContain('KES 39000');
    expect(decoded).not.toContain('KES 45000');
  });

  it('includes availability confirmation request', () => {
    const decoded = decodeURIComponent(buildSingleProductUrl(baseProduct).split('?text=')[1]);
    expect(decoded).toContain('confirm availability and delivery details');
  });
});

describe('buildCartCheckoutUrl', () => {
  const items: CartItem[] = [
    { product_id: '1', name: 'iPhone 14', effective_price: 120000, price_type: 'regular', price_max: null, quantity: 1, thumbnail_url: '' },
    { product_id: '2', name: 'AirPods Pro', effective_price: 25000, price_type: 'regular', price_max: null, quantity: 2, thumbnail_url: '' },
  ];

  it('targets the correct WhatsApp number', () => {
    expect(buildCartCheckoutUrl(items)).toContain('https://wa.me/254793636022');
  });

  it('includes all item names', () => {
    const decoded = decodeURIComponent(buildCartCheckoutUrl(items).split('?text=')[1]);
    expect(decoded).toContain('iPhone 14');
    expect(decoded).toContain('AirPods Pro');
  });

  it('includes quantities', () => {
    const decoded = decodeURIComponent(buildCartCheckoutUrl(items).split('?text=')[1]);
    expect(decoded).toContain('x1');
    expect(decoded).toContain('x2');
  });

  it('calculates the correct total', () => {
    // 120000*1 + 25000*2 = 170000
    const decoded = decodeURIComponent(buildCartCheckoutUrl(items).split('?text=')[1]);
    expect(decoded).toContain('Total: KES 170000');
  });

  it('includes delivery confirmation request', () => {
    const decoded = decodeURIComponent(buildCartCheckoutUrl(items).split('?text=')[1]);
    expect(decoded).toContain('confirm and arrange delivery');
  });
});
