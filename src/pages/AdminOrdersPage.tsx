import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Order, OrderStatus } from '../types';

type Toast = { type: 'success' | 'error'; message: string };

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<OrderStatus, React.CSSProperties> = {
  pending:   { backgroundColor: '#fef3c7', color: '#92400e' },
  confirmed: { backgroundColor: '#dbeafe', color: '#1e40af' },
  dispatched:{ backgroundColor: '#ede9fe', color: '#5b21b6' },
  delivered: { backgroundColor: '#d1fae5', color: '#065f46' },
  cancelled: { backgroundColor: '#fee2e2', color: '#991b1b' },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      setToast({ type: 'error', message: 'Failed to load orders.' });
    } else {
      setOrders((data as Order[]) ?? []);
    }
    setLoading(false);
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      setToast({ type: 'error', message: 'Failed to update status.' });
    } else {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
      setToast({ type: 'success', message: `Order status updated to ${STATUS_LABELS[status]}.` });
    }
  }

  async function updatePaymentStatus(orderId: string, payment_status: Order['payment_status']) {
    const updates: Partial<Order> = { payment_status };
    if (payment_status === 'paid') updates.paid_at = new Date().toISOString();

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId);

    if (error) {
      setToast({ type: 'error', message: 'Failed to update payment status.' });
    } else {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, ...updates } : o));
      setToast({ type: 'success', message: 'Payment status updated.' });
    }
  }

  const filtered = orders.filter((o) => {
    const matchesSearch = !search ||
      o.reference.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_phone ?? '').includes(search);
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    revenue: orders.filter((o) => o.payment_status === 'paid').reduce((s, o) => s + o.total, 0),
  };

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.heading}>Orders</h1>
            <p style={styles.sub}>{orders.length} total orders</p>
          </div>
          <Link to="/admin" style={styles.backBtn}>← Dashboard</Link>
        </div>

        {toast && (
          <div role="alert" style={{ ...styles.toast, ...(toast.type === 'success' ? styles.toastSuccess : styles.toastError) }}>
            {toast.message}
          </div>
        )}

        {/* Stats */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}><span style={styles.statVal}>{stats.total}</span><span style={styles.statLbl}>Total</span></div>
          <div style={{ ...styles.statCard, ...(stats.pending > 0 ? styles.statWarn : {}) }}><span style={styles.statVal}>{stats.pending}</span><span style={styles.statLbl}>Pending</span></div>
          <div style={styles.statCard}><span style={styles.statVal}>{stats.confirmed}</span><span style={styles.statLbl}>Confirmed</span></div>
          <div style={{ ...styles.statCard, ...styles.statGreen }}><span style={styles.statVal}>KES {stats.revenue.toLocaleString()}</span><span style={styles.statLbl}>Revenue (paid)</span></div>
        </div>

        {/* Filters */}
        <div style={styles.filters}>
          <input
            type="search"
            placeholder="Search by ref, name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
            aria-label="Search orders"
          />
          <div style={styles.statusTabs}>
            {(['all', 'pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{ ...styles.statusTab, ...(statusFilter === s ? styles.statusTabActive : {}) }}
              >
                {s === 'all' ? 'All' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Orders list */}
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <p style={styles.empty}>No orders found.</p>
        ) : (
          <div style={styles.list}>
            {filtered.map((order) => (
              <div key={order.id} style={styles.orderCard}>
                {/* Order header */}
                <div style={styles.orderHeader}>
                  <div style={styles.orderMeta}>
                    <span style={styles.orderRef}>{order.reference}</span>
                    <span style={{ ...styles.statusBadge, ...STATUS_COLORS[order.status] }}>
                      {STATUS_LABELS[order.status]}
                    </span>
                    <span style={{ ...styles.statusBadge, ...(order.payment_status === 'paid' ? styles.paidBadge : styles.unpaidBadge) }}>
                      {order.payment_status}
                    </span>
                  </div>
                  <div style={styles.orderRight}>
                    <span style={styles.orderTotal}>KES {order.total.toLocaleString()}</span>
                    <span style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</span>
                    <button
                      style={styles.expandBtn}
                      onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                      aria-label={expanded === order.id ? 'Collapse' : 'Expand'}
                    >
                      {expanded === order.id ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* Customer info */}
                {(order.customer_name || order.customer_phone) && (
                  <div style={styles.customerRow}>
                    {order.customer_name && <span>{order.customer_name}</span>}
                    {order.customer_phone && (
                      <a href={`tel:${order.customer_phone}`} style={styles.phoneLink}>{order.customer_phone}</a>
                    )}
                    <span style={styles.channelBadge}>{order.channel}</span>
                  </div>
                )}

                {/* Expanded details */}
                {expanded === order.id && (
                  <div style={styles.expandedBody}>
                    {/* Items */}
                    {order.items && order.items.length > 0 && (
                      <div style={styles.itemsTable}>
                        {order.items.map((item) => (
                          <div key={item.id} style={styles.itemRow}>
                            <span style={styles.itemName}>{item.product_name}</span>
                            <span style={styles.itemQty}>x{item.quantity}</span>
                            <span style={styles.itemPrice}>KES {item.line_total.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Status controls */}
                    <div style={styles.controls}>
                      <div style={styles.controlGroup}>
                        <label style={styles.controlLabel}>Order Status</label>
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                          style={styles.select}
                        >
                          {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      </div>
                      <div style={styles.controlGroup}>
                        <label style={styles.controlLabel}>Payment Status</label>
                        <select
                          value={order.payment_status}
                          onChange={(e) => updatePaymentStatus(order.id, e.target.value as Order['payment_status'])}
                          style={styles.select}
                        >
                          <option value="unpaid">Unpaid</option>
                          <option value="partial">Partial</option>
                          <option value="paid">Paid</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </div>
                    </div>

                    {order.notes && <p style={styles.notes}><strong>Notes:</strong> {order.notes}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '2rem 1rem' },
  container: { maxWidth: '1000px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' as const },
  heading: { fontSize: '1.6rem', fontWeight: 700, color: '#0f1f3d', margin: '0 0 0.2rem' },
  sub: { fontSize: '0.875rem', color: '#5a6a80', margin: 0 },
  backBtn: { padding: '0.5rem 1rem', backgroundColor: '#fff', border: '1px solid #dde3ec', borderRadius: '6px', color: '#0f1f3d', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none', whiteSpace: 'nowrap' as const },
  toast: { padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: 500 },
  toastSuccess: { backgroundColor: '#f0fff4', border: '1px solid #9ae6b4', color: '#276749' },
  toastError: { backgroundColor: '#fff5f5', border: '1px solid #feb2b2', color: '#b91c1c' },
  statsRow: { display: 'flex', flexWrap: 'wrap' as const, gap: '0.75rem', marginBottom: '1.5rem' },
  statCard: { backgroundColor: '#fff', border: '1px solid #dde3ec', borderRadius: '8px', padding: '0.85rem 1.25rem', display: 'flex', flexDirection: 'column' as const, gap: '0.2rem', minWidth: '110px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  statWarn: { borderColor: '#fca5a5', backgroundColor: '#fff5f5' },
  statGreen: { borderColor: '#9ae6b4', backgroundColor: '#f0fff4' },
  statVal: { fontSize: '1.4rem', fontWeight: 700, color: '#0f1f3d', lineHeight: 1 },
  statLbl: { fontSize: '0.75rem', color: '#5a6a80', fontWeight: 500 },
  filters: { display: 'flex', flexDirection: 'column' as const, gap: '0.75rem', marginBottom: '1.25rem' },
  searchInput: { padding: '0.55rem 0.75rem', fontSize: '0.9rem', border: '1px solid #dde3ec', borderRadius: '6px', outline: 'none', color: '#2d3748', width: '100%', boxSizing: 'border-box' as const },
  statusTabs: { display: 'flex', flexWrap: 'wrap' as const, gap: '0.4rem' },
  statusTab: { padding: '0.3rem 0.75rem', borderRadius: '999px', border: '1px solid #dde3ec', backgroundColor: '#fff', color: '#5a6a80', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' },
  statusTabActive: { backgroundColor: '#0f1f3d', color: '#fff', borderColor: '#0f1f3d' },
  empty: { textAlign: 'center' as const, color: '#5a6a80', padding: '3rem 0' },
  list: { display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' },
  orderCard: { backgroundColor: '#fff', border: '1px solid #dde3ec', borderRadius: '10px', padding: '1rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  orderHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '0.5rem' },
  orderMeta: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' as const },
  orderRef: { fontWeight: 700, fontSize: '0.95rem', color: '#0f1f3d', fontFamily: 'monospace' },
  statusBadge: { fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' },
  paidBadge: { backgroundColor: '#d1fae5', color: '#065f46' },
  unpaidBadge: { backgroundColor: '#fee2e2', color: '#991b1b' },
  orderRight: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  orderTotal: { fontWeight: 700, color: '#0f1f3d', fontSize: '0.95rem' },
  orderDate: { fontSize: '0.8rem', color: '#5a6a80' },
  expandBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#5a6a80', fontSize: '0.75rem', padding: '0.25rem' },
  customerRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' as const, fontSize: '0.875rem', color: '#2d3748' },
  phoneLink: { color: '#1d6fa4', fontWeight: 600, textDecoration: 'none' },
  channelBadge: { fontSize: '0.7rem', fontWeight: 600, padding: '2px 7px', borderRadius: '999px', backgroundColor: '#e8f2fa', color: '#1d6fa4' },
  expandedBody: { marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f0f4f8', display: 'flex', flexDirection: 'column' as const, gap: '1rem' },
  itemsTable: { display: 'flex', flexDirection: 'column' as const, gap: '0.4rem' },
  itemRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' },
  itemName: { flex: 1, color: '#2d3748' },
  itemQty: { color: '#5a6a80', minWidth: '30px' },
  itemPrice: { fontWeight: 600, color: '#0f1f3d', minWidth: '80px', textAlign: 'right' as const },
  controls: { display: 'flex', gap: '1rem', flexWrap: 'wrap' as const },
  controlGroup: { display: 'flex', flexDirection: 'column' as const, gap: '0.3rem' },
  controlLabel: { fontSize: '0.78rem', fontWeight: 600, color: '#5a6a80', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  select: { padding: '0.45rem 0.65rem', fontSize: '0.875rem', border: '1px solid #dde3ec', borderRadius: '6px', color: '#2d3748', outline: 'none', cursor: 'pointer' },
  notes: { fontSize: '0.875rem', color: '#4a5568', margin: 0 },
};
