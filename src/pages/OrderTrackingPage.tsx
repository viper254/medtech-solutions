import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { usePageTitle } from '../utils/usePageTitle';
import type { Order, OrderStatus } from '../types';

const STATUS_STEPS: OrderStatus[] = ['pending', 'confirmed', 'dispatched', 'delivered'];

const STATUS_INFO: Record<OrderStatus, { label: string; desc: string }> = {
  pending:   { label: 'Order Placed',   desc: 'Your order has been received and is awaiting confirmation.' },
  confirmed: { label: 'Confirmed',      desc: 'Your order has been confirmed and is being prepared.' },
  dispatched:{ label: 'On the Way',     desc: 'Your order has been dispatched and is on its way to you.' },
  delivered: { label: 'Delivered',      desc: 'Your order has been delivered. Enjoy your purchase!' },
  cancelled: { label: 'Cancelled',      desc: 'This order has been cancelled. Contact us if you have questions.' },
};

export default function OrderTrackingPage() {
  usePageTitle('Track Your Order');
  const [ref, setRef] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = ref.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('reference', trimmed)
      .single();

    setLoading(false);

    if (fetchError || !data) {
      setError('No order found with that reference number. Please check and try again.');
    } else {
      setOrder(data as Order);
    }
  }

  const stepIndex = order && order.status !== 'cancelled'
    ? STATUS_STEPS.indexOf(order.status)
    : -1;

  return (
    <main style={styles.page}>
      <section style={styles.hero} aria-label="Order tracking hero">
        <h1 style={styles.heroTitle}>Track Your Order</h1>
        <p style={styles.heroSub}>Enter your order reference number to see the latest status.</p>
      </section>

      <div style={styles.content}>
        {/* Search form */}
        <div style={styles.card}>
          <form onSubmit={handleSearch} style={styles.form}>
            <label htmlFor="ref" style={styles.label}>Order Reference Number</label>
            <div style={styles.inputRow}>
              <input
                id="ref"
                type="text"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="e.g. ORD-260401-4823"
                style={styles.input}
                aria-label="Order reference number"
              />
              <button type="submit" disabled={loading} style={styles.searchBtn}>
                {loading ? 'Searching…' : 'Track'}
              </button>
            </div>
          </form>

          {error && <p role="alert" style={styles.error}>{error}</p>}
        </div>

        {/* Order result */}
        {order && (
          <div style={styles.card}>
            <div style={styles.orderHeader}>
              <div>
                <p style={styles.refLabel}>Reference</p>
                <p style={styles.refValue}>{order.reference}</p>
              </div>
              <div style={styles.orderMeta}>
                <span style={styles.date}>{new Date(order.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span style={styles.total}>KES {order.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Progress tracker */}
            {order.status !== 'cancelled' ? (
              <div style={styles.tracker} aria-label="Order progress">
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= stepIndex;
                  const active = i === stepIndex;
                  return (
                    <div key={step} style={styles.trackerStep}>
                      <div style={{ ...styles.trackerDot, ...(done ? styles.dotDone : styles.dotPending), ...(active ? styles.dotActive : {}) }}>
                        {done && !active && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div style={{ ...styles.trackerLine, ...(i < stepIndex ? styles.lineDone : {}) }} />
                      )}
                      <p style={{ ...styles.trackerLabel, ...(active ? styles.trackerLabelActive : {}) }}>
                        {STATUS_INFO[step].label}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={styles.cancelledBanner} role="alert">
                {STATUS_INFO.cancelled.label} — {STATUS_INFO.cancelled.desc}
              </div>
            )}

            {/* Current status description */}
            <p style={styles.statusDesc}>{STATUS_INFO[order.status].desc}</p>

            {/* Items */}
            {order.items && order.items.length > 0 && (
              <div style={styles.itemsSection}>
                <p style={styles.itemsHeading}>Items in this order</p>
                {order.items.map((item) => (
                  <div key={item.id} style={styles.itemRow}>
                    <span style={styles.itemName}>{item.product_name}</span>
                    <span style={styles.itemQty}>x{item.quantity}</span>
                    <span style={styles.itemTotal}>KES {item.line_total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Payment status */}
            <div style={styles.paymentRow}>
              <span style={styles.paymentLabel}>Payment</span>
              <span style={{
                ...styles.paymentBadge,
                ...(order.payment_status === 'paid' ? styles.paidBadge : styles.unpaidBadge)
              }}>
                {order.payment_status === 'paid' ? 'Paid' : order.payment_status === 'partial' ? 'Partially Paid' : 'Pay on Delivery'}
              </span>
            </div>

            {/* Help */}
            <p style={styles.helpText}>
              Questions about your order?{' '}
              <a
                href={`https://wa.me/254793636022?text=${encodeURIComponent(`Hi, I have a question about order ${order.reference}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.waLink}
              >
                Chat with us on WhatsApp
              </a>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8' },
  hero: {
    background: 'linear-gradient(135deg, #0a1628 0%, #0f1f3d 40%, #1d6fa4 100%)',
    color: '#fff', textAlign: 'center', padding: '3rem 1.5rem 2.5rem',
  },
  heroTitle: { fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 800, margin: '0 0 0.5rem' },
  heroSub: { fontSize: '1rem', opacity: 0.85, margin: 0 },
  content: { maxWidth: '640px', margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column' as const, gap: '1.25rem' },
  card: { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #dde3ec', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' },
  label: { fontSize: '0.9rem', fontWeight: 600, color: '#2d3748' },
  inputRow: { display: 'flex', gap: '0.5rem' },
  input: { flex: 1, padding: '0.65rem 0.85rem', fontSize: '0.95rem', border: '1px solid #dde3ec', borderRadius: '8px', outline: 'none', color: '#2d3748', fontFamily: 'monospace' },
  searchBtn: { padding: '0.65rem 1.5rem', backgroundColor: '#1d6fa4', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', whiteSpace: 'nowrap' as const },
  error: { color: '#b91c1c', fontSize: '0.875rem', margin: '0.5rem 0 0', backgroundColor: '#fff5f5', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.5rem 0.75rem' },
  orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: '0.5rem', marginBottom: '1.5rem' },
  refLabel: { fontSize: '0.75rem', fontWeight: 600, color: '#5a6a80', textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: '0 0 0.2rem' },
  refValue: { fontSize: '1.1rem', fontWeight: 700, color: '#0f1f3d', fontFamily: 'monospace', margin: 0 },
  orderMeta: { display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: '0.2rem' },
  date: { fontSize: '0.82rem', color: '#5a6a80' },
  total: { fontSize: '1rem', fontWeight: 700, color: '#0f1f3d' },
  tracker: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', position: 'relative' as const },
  trackerStep: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', flex: 1, position: 'relative' as const },
  trackerDot: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, flexShrink: 0 },
  dotDone: { backgroundColor: '#1d6fa4' },
  dotActive: { backgroundColor: '#1d6fa4', boxShadow: '0 0 0 4px rgba(29,111,164,0.2)' },
  dotPending: { backgroundColor: '#e2e8f0' },
  trackerLine: { position: 'absolute' as const, top: '14px', left: '50%', width: '100%', height: '2px', backgroundColor: '#e2e8f0', zIndex: 0 },
  lineDone: { backgroundColor: '#1d6fa4' },
  trackerLabel: { fontSize: '0.72rem', color: '#5a6a80', textAlign: 'center' as const, marginTop: '0.4rem', fontWeight: 500 },
  trackerLabelActive: { color: '#1d6fa4', fontWeight: 700 },
  cancelledBanner: { backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.75rem 1rem', color: '#991b1b', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' },
  statusDesc: { fontSize: '0.9rem', color: '#4a5568', margin: '0 0 1.25rem', lineHeight: 1.5 },
  itemsSection: { borderTop: '1px solid #f0f4f8', paddingTop: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column' as const, gap: '0.5rem' },
  itemsHeading: { fontSize: '0.78rem', fontWeight: 700, color: '#5a6a80', textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: '0 0 0.25rem' },
  itemRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' },
  itemName: { flex: 1, color: '#2d3748' },
  itemQty: { color: '#5a6a80' },
  itemTotal: { fontWeight: 600, color: '#0f1f3d' },
  paymentRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f0f4f8', paddingTop: '1rem', marginBottom: '1rem' },
  paymentLabel: { fontSize: '0.875rem', fontWeight: 600, color: '#2d3748' },
  paymentBadge: { fontSize: '0.78rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px' },
  paidBadge: { backgroundColor: '#d1fae5', color: '#065f46' },
  unpaidBadge: { backgroundColor: '#fef3c7', color: '#92400e' },
  helpText: { fontSize: '0.875rem', color: '#5a6a80', margin: 0 },
  waLink: { color: '#25d366', fontWeight: 600 },
};
