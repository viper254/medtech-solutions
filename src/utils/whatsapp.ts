import type { CartItem, Product } from '../types';

const WHATSAPP_NUMBER = '254793636022';
const BASE_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

function generateRef(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${yy}${mm}${dd}-${rand}`;
}

export function getEffectivePrice(product: Product): number {
  const offerActive =
    product.offer_price != null &&
    product.offer_expires_at != null &&
    new Date(product.offer_expires_at).getTime() > Date.now();
  if (offerActive) return product.offer_price!;
  return product.discounted_price ?? product.original_price;
}

function priceLabel(product: Product): string {
  const offerActive =
    product.offer_price != null &&
    product.offer_expires_at != null &&
    new Date(product.offer_expires_at).getTime() > Date.now();

  if (offerActive) return ` [Limited Offer]`;
  return '';
}

/**
 * Single product "Order Now" message.
 */
export function buildSingleProductUrl(product: Product, quantity = 1): string {
  const isRange =
    product.price_max != null &&
    product.discounted_price == null &&
    product.offer_price == null;

  let itemLine: string;
  let totalLine: string;

  if (isRange) {
    const min = product.original_price.toLocaleString();
    const max = product.price_max!.toLocaleString();
    itemLine = `- ${product.name} x${quantity} — KES ${min} – KES ${max}`;
    totalLine = `Total: KES ${min} – KES ${max}`;
  } else {
    const price = getEffectivePrice(product);
    const total = price * quantity;
    const label = priceLabel(product);
    itemLine = `- ${product.name} x${quantity} — KES ${total.toLocaleString()}${label}`;
    totalLine = `Total: KES ${total.toLocaleString()}`;
  }

  const message =
    `Hi Medtech Solutions, I'd like to order:\n\n` +
    `Ref: ${generateRef()}\n\n` +
    `Items:\n` +
    `${itemLine}\n\n` +
    `${totalLine}\n\n` +
    `Please confirm availability and delivery. Thanks!`;
  return `${BASE_URL}?text=${encodeURIComponent(message)}`;
}

const PRICE_TYPE_LABEL: Record<CartItem['price_type'], string> = {
  offer: ' [Limited Offer]',
  discounted: '',
  regular: '',
};

/**
 * Cart checkout message.
 */
export function buildCartCheckoutUrl(items: CartItem[]): string {
  let rangeMin = 0;
  let rangeMax = 0;
  let fixedTotal = 0;

  const lines = items.map((item) => {
    if (item.price_max != null) {
      rangeMin += item.effective_price * item.quantity;
      rangeMax += item.price_max * item.quantity;
      const min = (item.effective_price * item.quantity).toLocaleString();
      const max = (item.price_max * item.quantity).toLocaleString();
      return `- ${item.name} x${item.quantity} — KES ${min} – KES ${max}`;
    }
    const lineTotal = item.effective_price * item.quantity;
    fixedTotal += lineTotal;
    const label = PRICE_TYPE_LABEL[item.price_type ?? 'regular'];
    return `- ${item.name} x${item.quantity} — KES ${lineTotal.toLocaleString()}${label}`;
  });

  const hasRange = rangeMin > 0;
  const totalLine = hasRange
    ? `Total: KES ${(fixedTotal + rangeMin).toLocaleString()} – KES ${(fixedTotal + rangeMax).toLocaleString()}`
    : `Total: KES ${fixedTotal.toLocaleString()}`;

  const message =
    `Hi Medtech Solutions, I'd like to order:\n\n` +
    `Ref: ${generateRef()}\n\n` +
    `Items:\n` +
    `${lines.join('\n')}\n\n` +
    `${totalLine}\n\n` +
    `Please confirm availability and delivery. Thanks!`;
  return `${BASE_URL}?text=${encodeURIComponent(message)}`;
}
