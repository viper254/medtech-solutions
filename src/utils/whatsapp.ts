import type { CartItem, Product } from '../types';
import { supabase } from '../lib/supabaseClient';

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

async function saveOrder(
  reference: string,
  items: Array<{ product_id: string | null; product_name: string; product_category: string; unit_price: number; quantity: number; price_type: string }>,
  total: number,
  channel: 'whatsapp' | 'mpesa' | 'card' | 'cash' = 'whatsapp'
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const customerId = session?.user?.id ?? null;

    const { data: order, error } = await supabase
      .from('orders')
      .insert({ reference, subtotal: total, total, channel, status: 'pending', payment_status: 'unpaid', customer_id: customerId })
      .select('id')
      .single();

    if (error || !order) return;

    const lineItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_category: item.product_category,
      unit_price: item.unit_price,
      quantity: item.quantity,
      line_total: item.unit_price * item.quantity,
      price_type: item.price_type,
    }));

    await supabase.from('order_items').insert(lineItems);
  } catch {
    // Non-blocking — order still goes through WhatsApp even if DB save fails
  }
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
export async function buildSingleProductUrl(product: Product, quantity = 1): Promise<string> {
  const ref = generateRef();
  const isRange =
    product.price_max != null &&
    product.discounted_price == null &&
    product.offer_price == null;

  let itemLine: string;
  let totalLine: string;
  let total: number;

  if (isRange) {
    const min = product.original_price.toLocaleString();
    const max = product.price_max!.toLocaleString();
    itemLine = `- ${product.name} x${quantity} — KES ${min} – KES ${max}`;
    totalLine = `Total: KES ${min} – KES ${max}`;
    total = product.original_price * quantity;
  } else {
    const price = getEffectivePrice(product);
    total = price * quantity;
    const label = priceLabel(product);
    itemLine = `- ${product.name} x${quantity} — KES ${total.toLocaleString()}${label}`;
    totalLine = `Total: KES ${total.toLocaleString()}`;
  }

  await saveOrder(ref, [{
    product_id: product.id,
    product_name: product.name,
    product_category: product.category,
    unit_price: getEffectivePrice(product),
    quantity,
    price_type: product.offer_price != null ? 'offer' : product.discounted_price != null ? 'discounted' : 'regular',
  }], total);

  const message =
    `Hi Medtech Solutions, I'd like to order:\n\n` +
    `Ref: ${ref}\n\n` +
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
export async function buildCartCheckoutUrl(items: CartItem[]): Promise<string> {
  const ref = generateRef();
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
  const total = fixedTotal + rangeMin;
  const totalLine = hasRange
    ? `Total: KES ${(fixedTotal + rangeMin).toLocaleString()} – KES ${(fixedTotal + rangeMax).toLocaleString()}`
    : `Total: KES ${fixedTotal.toLocaleString()}`;

  await saveOrder(ref, items.map((item) => ({
    product_id: item.product_id,
    product_name: item.name,
    product_category: '',
    unit_price: item.effective_price,
    quantity: item.quantity,
    price_type: item.price_type,
  })), total);

  const message =
    `Hi Medtech Solutions, I'd like to order:\n\n` +
    `Ref: ${ref}\n\n` +
    `Items:\n` +
    `${lines.join('\n')}\n\n` +
    `${totalLine}\n\n` +
    `Please confirm availability and delivery. Thanks!`;
  return `${BASE_URL}?text=${encodeURIComponent(message)}`;
}
