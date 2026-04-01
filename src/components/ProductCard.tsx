import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Product } from '../types';
import { buildSingleProductUrl } from '../utils/whatsapp';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  view?: 'grid' | 'list';
}

function useOfferState(expiresAt: string | null): { active: boolean; countdown: string | null } {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return { active: false, countdown: null };
  const diff = new Date(expiresAt).getTime() - now;
  if (diff <= 0) return { active: false, countdown: null };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const label = h >= 24
    ? `${Math.floor(h / 24)}d ${h % 24}h left`
    : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} left`;
  return { active: true, countdown: label };
}

// ── Quantity popup ─────────────────────────────────────────────────────────────

interface QtyPopupProps {
  product: Product;
  onConfirm: (qty: number) => void;
  onClose: () => void;
}

function QtyPopup({ product, onConfirm, onClose }: QtyPopupProps) {
  const [qty, setQty] = useState(1);

  return (
    <div style={popup.overlay} role="dialog" aria-modal="true" aria-label="Select quantity">
      <div style={popup.box}>
        <p style={popup.title}>How many do you want?</p>
        <p style={popup.productName}>{product.name}</p>
        <div style={popup.stepper}>
          <button style={popup.btn} onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">−</button>
          <span style={popup.val}>{qty}</span>
          <button style={popup.btn} onClick={() => setQty((q) => q + 1)} aria-label="Increase">+</button>
        </div>
        <div style={popup.actions}>
          <button style={popup.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={popup.confirmBtn} onClick={() => { onConfirm(qty); onClose(); }}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

const popup: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
  },
  box: {
    backgroundColor: '#fff', borderRadius: '10px', padding: '1.5rem',
    width: '280px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    display: 'flex', flexDirection: 'column', gap: '0.75rem',
  },
  title: { margin: 0, fontWeight: 700, fontSize: '1rem', color: '#0f1f3d' },
  productName: { margin: 0, fontSize: '0.85rem', color: '#5a6a80' },
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' },
  btn: {
    width: '34px', height: '34px', border: '1px solid #cbd5e0', borderRadius: '6px',
    background: '#f7fafc', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  val: { fontSize: '1.25rem', fontWeight: 700, minWidth: '32px', textAlign: 'center' as const, color: '#0f1f3d' },
  actions: { display: 'flex', gap: '0.5rem', marginTop: '0.25rem' },
  cancelBtn: {
    flex: 1, padding: '0.55rem', border: '1px solid #cbd5e0', borderRadius: '6px',
    background: '#fff', color: '#4a5568', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
  },
  confirmBtn: {
    flex: 1, padding: '0.55rem', border: 'none', borderRadius: '6px',
    background: '#1d6fa4', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
  },
};

// ── ProductCard ────────────────────────────────────────────────────────────────

export default function ProductCard({ product, onAddToCart, view = 'grid' }: ProductCardProps) {
  const { id, name, description, original_price, discounted_price, stock_quantity, media } = product;
  const [showQtyPopup, setShowQtyPopup] = useState(false);

  const isOutOfStock = stock_quantity === 0;
  const isLowStock = !isOutOfStock && stock_quantity <= (product.low_stock_threshold ?? 5);
  const thumbnail = media.find((m) => m.type === 'image') ?? media[0];
  const thumbnailUrl = thumbnail?.url ?? null;

  const { active: offerActive, countdown } = useOfferState(
    product.offer_price != null ? product.offer_expires_at : null
  );

  const displayPrice = offerActive
    ? product.offer_price!
    : (discounted_price ?? original_price);

  const discountPct = offerActive
    ? Math.round(((original_price - product.offer_price!) / original_price) * 100)
    : discounted_price !== null
      ? Math.round(((original_price - discounted_price) / original_price) * 100)
      : null;

  function formatPrice(price: number) {
    return `KSh ${price.toLocaleString()}`;
  }

  function handleOrderNow() {
    buildSingleProductUrl(product, 1).then((url) =>
      window.open(url, '_blank', 'noopener,noreferrer')
    );
  }

  const isList = view === 'list';

  return (
    <>
      {showQtyPopup && (
        <QtyPopup
          product={product}
          onConfirm={(qty) => onAddToCart(product, qty)}
          onClose={() => setShowQtyPopup(false)}
        />
      )}

      <div style={isList ? styles.cardList : styles.card} className="product-card-hover">
        {/* Thumbnail */}
        <Link to={`/products/${id}`} style={isList ? styles.imageLinkList : styles.imageLink} tabIndex={-1} aria-hidden="true">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={name} style={isList ? styles.thumbnailList : styles.thumbnail} loading="lazy" />
          ) : (
            <div style={isList ? styles.placeholderList : styles.placeholder} aria-label={`${name} — no image`}>
              <span style={styles.placeholderIcon}>📷</span>
            </div>
          )}
        </Link>

        {/* Badges */}
        <div style={styles.badges}>
          {product.is_featured && !isOutOfStock && <span style={styles.featuredBadge}>Featured</span>}
          {isOutOfStock && <span style={styles.outOfStockBadge}>Out of Stock</span>}
          {isLowStock && <span style={styles.lowStockBadge}>Only {stock_quantity} left</span>}
          {offerActive && !isOutOfStock && <span style={styles.offerBadge}>Limited Offer</span>}
          {discountPct !== null && !isOutOfStock && (
            <span style={styles.discountBadge}>-{discountPct}%</span>
          )}
        </div>

        {/* Body */}
        <div style={isList ? styles.bodyList : styles.body}>
          <Link to={`/products/${id}`} style={styles.nameLink}>
            <h3 style={styles.name}>{name}</h3>
          </Link>

          {description && (
            <p style={isList ? styles.descList : styles.desc}>
              {description.length > 80 ? description.slice(0, 80) + '…' : description}
            </p>
          )}

          {/* Price */}
          <div style={styles.priceRow}>
            {offerActive ? (
              <>
                <span style={styles.offerPrice}>{formatPrice(displayPrice)}</span>
                <span style={styles.originalPriceStruck}>{formatPrice(original_price)}</span>
              </>
            ) : discounted_price !== null ? (
              <>
                <span style={styles.discountedPrice}>{formatPrice(discounted_price)}</span>
                <span style={styles.originalPriceStruck}>{formatPrice(original_price)}</span>
              </>
            ) : product.price_max != null ? (
              <span style={styles.price}>{formatPrice(original_price)} – {formatPrice(product.price_max)}</span>
            ) : (
              <span style={styles.price}>{formatPrice(original_price)}</span>
            )}
          </div>

          {/* Countdown */}
          {offerActive && countdown && (
            <p style={styles.countdown} aria-live="polite">Ends in: {countdown}</p>
          )}

          {/* Actions */}
          <div style={isList ? styles.actionsRow : styles.actionsCol}>
            <button
              style={{
                ...styles.addToCartBtn,
                ...(isOutOfStock ? styles.btnDisabled : {}),
                ...(isList ? { flex: 1 } : {}),
              }}
              disabled={isOutOfStock}
              onClick={() => !isOutOfStock && setShowQtyPopup(true)}
              aria-label={`Add ${name} to cart`}
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            {!isOutOfStock && (
              <button
                style={{ ...styles.orderNowBtn, ...(isList ? { flex: 1 } : {}) }}
                onClick={handleOrderNow}
                aria-label={`Order ${name} via WhatsApp`}
              >
                Order Now
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { position: 'relative', display: 'flex', flexDirection: 'column', borderRadius: '12px', border: '1px solid #dde3ec', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(15,31,61,0.08)' },
  cardList: { position: 'relative', display: 'flex', flexDirection: 'row', borderRadius: '12px', border: '1px solid #dde3ec', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(15,31,61,0.08)', alignItems: 'stretch' },
  imageLink: { display: 'block', lineHeight: 0, flexShrink: 0 },
  imageLinkList: { display: 'block', lineHeight: 0, flexShrink: 0, width: '140px' },
  thumbnail: { width: '100%', height: '200px', objectFit: 'cover', display: 'block' },
  thumbnailList: { width: '140px', height: '100%', minHeight: '120px', objectFit: 'cover', display: 'block' },
  placeholder: { width: '100%', height: '200px', backgroundColor: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  placeholderList: { width: '140px', height: '100%', minHeight: '120px', backgroundColor: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  placeholderIcon: { fontSize: '2rem', opacity: 0.35 },
  badges: { position: 'absolute', top: '8px', left: '8px', display: 'flex', flexDirection: 'column', gap: '4px' },
  outOfStockBadge: { backgroundColor: '#e53e3e', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  featuredBadge: { backgroundColor: '#d4a017', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  lowStockBadge: { backgroundColor: '#c05621', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '999px' },
  offerBadge: { backgroundColor: '#c05621', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '999px' },
  discountBadge: { backgroundColor: '#0f1f3d', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '999px' },
  body: { padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 },
  bodyList: { padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, justifyContent: 'center' },
  nameLink: { textDecoration: 'none', color: 'inherit' },
  name: { margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#0f1f3d', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  desc: { fontSize: '0.8rem', color: '#5a6a80', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  descList: { fontSize: '0.82rem', color: '#5a6a80', margin: 0, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  priceRow: { display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' as const },
  offerPrice: { fontSize: '1rem', fontWeight: 700, color: '#c05621' },
  discountedPrice: { fontSize: '1rem', fontWeight: 700, color: '#1d6fa4' },
  originalPriceStruck: { fontSize: '0.82rem', color: '#a0aec0', textDecoration: 'line-through' },
  price: { fontSize: '1rem', fontWeight: 700, color: '#0f1f3d' },
  countdown: { fontSize: '0.75rem', fontWeight: 600, color: '#c05621', margin: 0, backgroundColor: '#fff5eb', border: '1px solid #fbd38d', borderRadius: '4px', padding: '2px 6px', display: 'inline-block', alignSelf: 'flex-start' },
  actionsCol: { display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: 'auto' },
  actionsRow: { display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' as const },
  addToCartBtn: { padding: '0.5rem 0.75rem', backgroundColor: '#1d6fa4', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', width: '100%', transition: 'background-color 0.15s ease, transform 0.1s ease' },
  orderNowBtn: { padding: '0.5rem 0.75rem', backgroundColor: '#25d366', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', width: '100%', transition: 'background-color 0.15s ease, transform 0.1s ease' },
  btnDisabled: { backgroundColor: '#a0aec0', cursor: 'not-allowed' },
};
