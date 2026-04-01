import { Link } from 'react-router-dom';
import type { CartItem } from '../types';
import type { CartAction } from '../store/cartReducer';
import { buildCartCheckoutUrl } from '../utils/whatsapp';

interface CartPageProps {
  cart: CartItem[];
  dispatch: React.Dispatch<CartAction>;
}

export default function CartPage({ cart, dispatch }: CartPageProps) {
  const fixedTotal = cart
    .filter((i) => i.price_max == null)
    .reduce((sum, item) => sum + item.effective_price * item.quantity, 0);
  const rangeMin = cart
    .filter((i) => i.price_max != null)
    .reduce((sum, item) => sum + item.effective_price * item.quantity, 0);
  const rangeMax = cart
    .filter((i) => i.price_max != null)
    .reduce((sum, item) => sum + item.price_max! * item.quantity, 0);
  const hasRange = rangeMin > 0;
  const totalDisplay = hasRange
    ? `KES ${(fixedTotal + rangeMin).toLocaleString()} – KES ${(fixedTotal + rangeMax).toLocaleString()}`
    : `KES ${fixedTotal.toLocaleString()}`;

  function handleCheckout() {
    if (cart.length === 0) return;
    buildCartCheckoutUrl(cart).then((url) =>
      window.open(url, '_blank', 'noopener,noreferrer')
    );
  }

  if (cart.length === 0) {
    return (
      <main style={styles.page}>
        <h1 style={styles.heading}>Your Cart</h1>
        <p style={styles.empty}>
          Your cart is empty. Browse our{' '}
          <Link to="/catalog" style={styles.link}>catalog</Link>{' '}
          to find something you like.
        </p>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <h1 style={styles.heading}>Your Cart</h1>

      <div style={styles.itemList} role="list" aria-label="Cart items">
        {cart.map((item) => (
          <div key={item.product_id} style={styles.item} role="listitem">
            {item.thumbnail_url ? (
              <img
                src={item.thumbnail_url}
                alt={item.name}
                style={styles.thumbnail}
                loading="lazy"
              />
            ) : (
              <div style={styles.thumbnailPlaceholder} aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
            )}

            <div style={styles.info}>
              <p style={styles.name}>{item.name}</p>
              <p style={styles.unitPrice}>KES {item.effective_price.toLocaleString()} each</p>
            </div>

            <div style={styles.stepper} aria-label={`Quantity for ${item.name}`}>
              <button
                style={styles.stepBtn}
                aria-label="Decrease quantity"
                onClick={() =>
                  dispatch({
                    type: 'UPDATE_QUANTITY',
                    payload: { product_id: item.product_id, quantity: item.quantity - 1 },
                  })
                }
              >
                −
              </button>
              <span style={styles.qty}>{item.quantity}</span>
              <button
                style={styles.stepBtn}
                aria-label="Increase quantity"
                onClick={() =>
                  dispatch({
                    type: 'UPDATE_QUANTITY',
                    payload: { product_id: item.product_id, quantity: item.quantity + 1 },
                  })
                }
              >
                +
              </button>
            </div>

            <p style={styles.subtotal}>
              KES {(item.effective_price * item.quantity).toLocaleString()}
            </p>

            <button
              style={styles.removeBtn}
              aria-label={`Remove ${item.name} from cart`}
              onClick={() =>
                dispatch({ type: 'REMOVE_ITEM', payload: { product_id: item.product_id } })
              }
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div style={styles.footer}>
        <p style={styles.total}>Total: {totalDisplay}</p>
        <button style={styles.checkoutBtn} onClick={handleCheckout}>
          Checkout via WhatsApp
        </button>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '1.5rem 1rem',
  },
  heading: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#0f1f3d',
    marginBottom: '1.5rem',
  },
  empty: {
    textAlign: 'center',
    color: '#5a6a80',
    fontSize: '1rem',
    padding: '3rem 0',
  },
  link: {
    color: '#1d6fa4',
    fontWeight: 600,
    textDecoration: 'underline',
  },
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem',
    border: '1px solid #dde3ec',
    borderRadius: '8px',
    backgroundColor: '#fff',
  },
  thumbnail: {
    width: '64px',
    height: '64px',
    objectFit: 'cover',
    borderRadius: '6px',
    flexShrink: 0,
  },
  thumbnailPlaceholder: {
    width: '64px',
    height: '64px',
    borderRadius: '6px',
    flexShrink: 0,
    backgroundColor: '#f0f4f8',
    border: '1px solid #dde3ec',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontWeight: 600,
    color: '#0f1f3d',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  unitPrice: {
    color: '#5a6a80',
    fontSize: '0.875rem',
    margin: '0.25rem 0 0',
  },
  stepper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
  },
  stepBtn: {
    width: '28px',
    height: '28px',
    border: '1px solid #cbd5e0',
    borderRadius: '4px',
    background: '#f7fafc',
    cursor: 'pointer',
    fontSize: '1rem',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    minWidth: '24px',
    textAlign: 'center',
    fontWeight: 600,
    color: '#1a202c',
  },
  subtotal: {
    fontWeight: 700,
    color: '#0f1f3d',
    minWidth: '90px',
    textAlign: 'right',
    flexShrink: 0,
    margin: 0,
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#a0aec0',
    fontSize: '1rem',
    padding: '0.25rem',
    flexShrink: 0,
  },
  footer: {
    marginTop: '1.5rem',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '1.5rem',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '1rem',
  },
  total: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f1f3d',
    margin: 0,
  },
  checkoutBtn: {
    backgroundColor: '#25d366',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
