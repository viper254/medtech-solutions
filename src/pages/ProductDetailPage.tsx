import { useEffect, useState, Component, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, mapProducts } from '../lib/supabaseClient';
import { Product } from '../types';
import MediaGallery from '../components/MediaGallery';
import LoadingSpinner from '../components/LoadingSpinner';
import { buildSingleProductUrl } from '../utils/whatsapp';
import DeliveryStrip from '../components/DeliveryStrip';
import { usePageTitle } from '../utils/usePageTitle';

interface ProductDetailPageProps {
  onAddToCart: (product: Product, quantity: number) => void;
}

// ── Error boundary to surface render crashes ──────────────────────────────────
class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  render() {
    if (this.state.error) {
      return (
        <p style={{ textAlign: 'center', color: '#c53030', padding: '3rem 1rem' }}>
          Something went wrong loading this product: {this.state.error}
        </p>
      );
    }
    return this.props.children;
  }
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
    : `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} left`;
  return { active: true, countdown: label };
}

function RequestForm({ productName }: { productName: string }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);

  function handleRequest() {
    if (!name.trim() || !phone.trim()) return;
    const msg = `Hi, I'd like to request: *${productName}*\n\nName: ${name.trim()}\nPhone: ${phone.trim()}`;
    window.open(`https://wa.me/254793636022?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
    setSent(true);
  }

  if (sent) return (
    <div style={reqStyles.success}>Request sent via WhatsApp. We'll get back to you soon.</div>
  );

  return (
    <div style={reqStyles.box}>
      <p style={reqStyles.heading}>Out of stock — request this item</p>
      <p style={reqStyles.sub}>Leave your details and we'll contact you when it's available.</p>
      <div style={reqStyles.fields}>
        <input style={reqStyles.input} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <input style={reqStyles.input} placeholder="Phone / WhatsApp number" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <button style={reqStyles.btn} onClick={handleRequest}>Send Request via WhatsApp</button>
    </div>
  );
}

const reqStyles: Record<string, React.CSSProperties> = {
  box: { backgroundColor: '#fff5eb', border: '1px solid #fbd38d', borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  heading: { margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#0f1f3d' },
  sub: { margin: 0, fontSize: '0.85rem', color: '#5a6a80' },
  fields: { display: 'flex', flexDirection: 'column' as const, gap: '0.5rem' },
  input: { padding: '0.55rem 0.75rem', fontSize: '0.9rem', border: '1px solid #dde3ec', borderRadius: '6px', outline: 'none', color: '#2d3748' },
  btn: { padding: '0.6rem 1.25rem', backgroundColor: '#25d366', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', alignSelf: 'flex-start' as const },
  success: { backgroundColor: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: '8px', padding: '1rem', color: '#276749', fontSize: '0.9rem', fontWeight: 500 },
};

function ProductDetail({ onAddToCart }: ProductDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  // Must be called unconditionally — hooks cannot be after early returns
  const { active: offerActive, countdown } = useOfferState(
    product?.offer_price != null ? product.offer_expires_at : null
  );
  usePageTitle(product ? product.name : 'Product');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function fetchProduct() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('products')
          .select('*, media:product_media(*)')
          .eq('id', id)
          .single();

        if (cancelled) return;

        if (fetchError || !data) {
          setError(fetchError?.message ?? 'Product not found.');
        } else {
          const [mapped] = mapProducts([data as Record<string, unknown>]);
          setProduct(mapped);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load product.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProduct();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <LoadingSpinner />;

  if (error || !product) {
    return <p style={styles.message} role="alert">{error ?? 'Product not found.'}</p>;
  }

  const isOutOfStock = product.stock_quantity === 0;
  const hasDiscount = product.discounted_price !== null;
  const isRange = product.price_max != null && !hasDiscount && product.offer_price == null;
  const effectivePrice = offerActive
    ? product.offer_price!
    : (product.discounted_price ?? product.original_price);

  function handleOrderNow() {
    window.open(buildSingleProductUrl(product!, qty), '_blank', 'noopener,noreferrer');
  }

  return (
    <main style={styles.page}>
      <div style={styles.layout}>
        <div style={styles.galleryCol}>
          <MediaGallery items={product.media} productName={product.name} />
        </div>

        <div style={styles.infoCol}>
          <h1 style={styles.name}>{product.name}</h1>

          {isOutOfStock && (
            <span style={styles.outOfStock} aria-label="Out of stock">Out of Stock</span>
          )}

          {/* Prices */}
          <div style={styles.priceRow}>
            {isRange ? (
              <span style={styles.effectivePrice}>
                KES {product.original_price.toLocaleString()} – KES {product.price_max!.toLocaleString()}
              </span>
            ) : (
              <>
                <span style={offerActive ? styles.offerPrice : styles.effectivePrice}>
                  KES {effectivePrice.toLocaleString()}
                </span>
                {(hasDiscount || offerActive) && (
                  <span style={styles.originalPrice}>
                    KES {product.original_price.toLocaleString()}
                  </span>
                )}
              </>
            )}
          </div>

          {offerActive && countdown && (
            <div style={styles.countdownBanner} aria-live="polite">
              🔥 Limited offer — ⏱ {countdown}
            </div>
          )}

          <p style={styles.description}>{product.description}</p>

          <DeliveryStrip />

          <div style={styles.qtyRow} aria-label="Quantity">
            <button style={styles.qtyBtn} onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
            <span style={styles.qtyVal}>{qty}</span>
            <button style={styles.qtyBtn} onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity">+</button>
          </div>

          <div style={styles.ctaRow}>
            <button style={styles.orderBtn} onClick={handleOrderNow} aria-label={`Order ${product.name} via WhatsApp`}>
              Order Now via WhatsApp
            </button>
            <button
              style={{ ...styles.cartBtn, ...(isOutOfStock ? styles.cartBtnDisabled : {}) }}
              onClick={() => onAddToCart(product, qty)}
              disabled={isOutOfStock}
              aria-label={isOutOfStock ? 'Out of stock' : `Add ${product.name} to cart`}
            >
              Add to Cart
            </button>
            <button
              style={styles.shareBtn}
              onClick={() => {
                const url = window.location.href;
                if (navigator.share) {
                  navigator.share({ title: product.name, url });
                } else {
                  navigator.clipboard.writeText(url);
                  alert('Link copied to clipboard');
                }
              }}
              aria-label="Share this product"
            >
              Share
            </button>
          </div>

          {/* Request product form */}
          {isOutOfStock && (
            <RequestForm productName={product.name} />
          )}
        </div>
      </div>
    </main>
  );
}

export default function ProductDetailPage(props: ProductDetailPageProps) {
  return (
    <ErrorBoundary>
      <ProductDetail {...props} />
    </ErrorBoundary>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' },
  layout: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'start' },
  galleryCol: { width: '100%' },
  infoCol: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  name: { fontSize: '1.75rem', fontWeight: 700, color: '#1a202c', margin: 0 },
  outOfStock: { display: 'inline-block', backgroundColor: '#fed7d7', color: '#c53030', fontSize: '0.8rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '4px' },
  priceRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' as const },
  effectivePrice: { fontSize: '1.5rem', fontWeight: 700, color: '#1d6fa4' },
  offerPrice: { fontSize: '1.5rem', fontWeight: 700, color: '#c05621' },
  originalPrice: { fontSize: '1rem', color: '#a0aec0', textDecoration: 'line-through' },
  countdownBanner: { backgroundColor: '#fff5eb', border: '1px solid #fbd38d', borderRadius: '6px', padding: '0.5rem 0.85rem', fontSize: '0.9rem', fontWeight: 600, color: '#c05621' },
  description: { fontSize: '0.95rem', color: '#4a5568', lineHeight: 1.6, margin: 0 },
  ctaRow: { display: 'flex', flexWrap: 'wrap' as const, gap: '0.75rem' },
  qtyRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  qtyBtn: { width: '32px', height: '32px', border: '1px solid #cbd5e0', borderRadius: '6px', background: '#f7fafc', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  qtyVal: { minWidth: '28px', textAlign: 'center' as const, fontWeight: 700, fontSize: '1rem', color: '#1a202c' },
  orderBtn: { flex: '1 1 auto', padding: '0.75rem 1.25rem', backgroundColor: '#25d366', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' },
  cartBtn: { flex: '1 1 auto', padding: '0.75rem 1.25rem', backgroundColor: '#1d6fa4', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' },
  cartBtnDisabled: { backgroundColor: '#a0aec0', cursor: 'not-allowed' },
  shareBtn: { padding: '0.75rem 1.25rem', backgroundColor: '#f0f4f8', color: '#0f1f3d', border: '1px solid #dde3ec', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' },
  message: { textAlign: 'center' as const, color: '#718096', padding: '3rem 0' },
};
