import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useCustomerAuth } from '../store/customerAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import { usePageTitle } from '../utils/usePageTitle';
import type { Order, OrderStatus } from '../types';

usePageTitle;

const STATUS_COLORS: Record<OrderStatus, React.CSSProperties> = {
  pending:    { backgroundColor: '#fef3c7', color: '#92400e' },
  confirmed:  { backgroundColor: '#dbeafe', color: '#1e40af' },
  dispatched: { backgroundColor: '#ede9fe', color: '#5b21b6' },
  delivered:  { backgroundColor: '#d1fae5', color: '#065f46' },
  cancelled:  { backgroundColor: '#fee2e2', color: '#991b1b' },
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending', confirmed: 'Confirmed', dispatched: 'On the Way',
  delivered: 'Delivered', cancelled: 'Cancelled',
};

export default function AccountPage() {
  usePageTitle('My Account');
  const { user, profile, loading, signOut, refreshProfile } = useCustomerAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [tab, setTab] = useState<'orders' | 'profile'>('orders');

  // Profile edit state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/account/login', { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data as Order[]) ?? []);
        setOrdersLoading(false);
      });
  }, [user]);

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveMsg(null);

    const { error } = await supabase
      .from('customer_profiles')
      .upsert({ user_id: user.id, full_name: fullName.trim(), phone: phone.trim() });

    setSaving(false);
    if (error) { setSaveMsg('Failed to save. Please try again.'); return; }
    await refreshProfile();
    setSaveMsg('Profile updated.');
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.heading}>My Account</h1>
            <p style={styles.email}>{user.email}</p>
          </div>
          <button onClick={handleSignOut} style={styles.signOutBtn}>Sign Out</button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button style={{ ...styles.tab, ...(tab === 'orders' ? styles.tabActive : {}) }} onClick={() => setTab('orders')}>
            My Orders {orders.length > 0 && `(${orders.length})`}
          </button>
          <button style={{ ...styles.tab, ...(tab === 'profile' ? styles.tabActive : {}) }} onClick={() => setTab('profile')}>
            Profile
          </button>
        </div>

        {/* Orders tab */}
        {tab === 'orders' && (
          <div>
            {ordersLoading ? <LoadingSpinner /> : orders.length === 0 ? (
              <div style={styles.emptyOrders}>
                <p style={styles.emptyText}>You haven't placed any orders yet.</p>
                <Link to="/catalog" style={styles.shopBtn}>Browse Products</Link>
              </div>
            ) : (
              <div style={styles.orderList}>
                {orders.map((order) => (
                  <div key={order.id} style={styles.orderCard}>
                    <div style={styles.orderTop}>
                      <div>
                        <p style={styles.orderRef}>{order.reference}</p>
                        <p style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <div style={styles.orderRight}>
                        <span style={{ ...styles.statusBadge, ...STATUS_COLORS[order.status] }}>
                          {STATUS_LABELS[order.status]}
                        </span>
                        <span style={styles.orderTotal}>KES {order.total.toLocaleString()}</span>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div style={styles.itemsList}>
                        {order.items.map((item) => (
                          <div key={item.id} style={styles.itemRow}>
                            <span style={styles.itemName}>{item.product_name}</span>
                            <span style={styles.itemQty}>x{item.quantity}</span>
                            <span style={styles.itemPrice}>KES {item.line_total.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={styles.orderActions}>
                      <Link to={`/track?ref=${order.reference}`} style={styles.trackLink}>
                        Track this order →
                      </Link>
                      <a
                        href={`https://wa.me/254793636022?text=${encodeURIComponent(`Hi, I have a question about order ${order.reference}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.waLink}
                      >
                        WhatsApp Support
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile tab */}
        {tab === 'profile' && (
          <div style={styles.profileCard}>
            <form onSubmit={handleSaveProfile} style={styles.profileForm} noValidate>
              <div style={styles.field}>
                <label style={styles.label}>Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} style={styles.input} placeholder="Your full name" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Phone / WhatsApp</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={styles.input} placeholder="+254 7XX XXX XXX" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input type="email" value={user.email ?? ''} disabled style={{ ...styles.input, backgroundColor: '#f0f4f8', color: '#5a6a80' }} />
              </div>
              {saveMsg && <p style={saveMsg.includes('Failed') ? styles.errorMsg : styles.successMsg}>{saveMsg}</p>}
              <button type="submit" disabled={saving} style={styles.saveBtn}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '2rem 1rem' },
  container: { maxWidth: '760px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap' as const, gap: '0.75rem' },
  heading: { fontSize: '1.6rem', fontWeight: 700, color: '#0f1f3d', margin: '0 0 0.2rem' },
  email: { fontSize: '0.875rem', color: '#5a6a80', margin: 0 },
  signOutBtn: { padding: '0.5rem 1rem', backgroundColor: '#fff', border: '1px solid #fca5a5', borderRadius: '6px', color: '#b91c1c', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0' },
  tab: { padding: '0.6rem 1.25rem', background: 'none', border: 'none', borderBottom: '2px solid transparent', marginBottom: '-2px', fontWeight: 600, fontSize: '0.9rem', color: '#5a6a80', cursor: 'pointer' },
  tabActive: { color: '#1d6fa4', borderBottomColor: '#1d6fa4' },
  emptyOrders: { textAlign: 'center' as const, padding: '3rem 0', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '1rem' },
  emptyText: { color: '#5a6a80', fontSize: '1rem', margin: 0 },
  shopBtn: { padding: '0.65rem 1.5rem', backgroundColor: '#1d6fa4', color: '#fff', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' },
  orderList: { display: 'flex', flexDirection: 'column' as const, gap: '1rem' },
  orderCard: { backgroundColor: '#fff', border: '1px solid #dde3ec', borderRadius: '10px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  orderTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: '0.5rem', marginBottom: '0.75rem' },
  orderRef: { fontWeight: 700, fontSize: '0.95rem', color: '#0f1f3d', fontFamily: 'monospace', margin: '0 0 0.2rem' },
  orderDate: { fontSize: '0.8rem', color: '#5a6a80', margin: 0 },
  orderRight: { display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: '0.3rem' },
  statusBadge: { fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' },
  orderTotal: { fontWeight: 700, color: '#0f1f3d', fontSize: '0.95rem' },
  itemsList: { borderTop: '1px solid #f0f4f8', paddingTop: '0.75rem', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column' as const, gap: '0.4rem' },
  itemRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' },
  itemName: { flex: 1, color: '#2d3748' },
  itemQty: { color: '#5a6a80' },
  itemPrice: { fontWeight: 600, color: '#0f1f3d' },
  orderActions: { display: 'flex', gap: '1rem', flexWrap: 'wrap' as const, borderTop: '1px solid #f0f4f8', paddingTop: '0.75rem' },
  trackLink: { fontSize: '0.875rem', color: '#1d6fa4', fontWeight: 600, textDecoration: 'none' },
  waLink: { fontSize: '0.875rem', color: '#25d366', fontWeight: 600, textDecoration: 'none' },
  profileCard: { backgroundColor: '#fff', border: '1px solid #dde3ec', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  profileForm: { display: 'flex', flexDirection: 'column' as const, gap: '1.1rem' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: '0.4rem' },
  label: { fontSize: '0.9rem', fontWeight: 600, color: '#2d3748' },
  input: { padding: '0.65rem 0.85rem', fontSize: '0.95rem', border: '1px solid #dde3ec', borderRadius: '8px', outline: 'none', color: '#2d3748', width: '100%', boxSizing: 'border-box' as const },
  successMsg: { color: '#276749', fontSize: '0.875rem', backgroundColor: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: '6px', padding: '0.5rem 0.75rem', margin: 0 },
  errorMsg: { color: '#b91c1c', fontSize: '0.875rem', backgroundColor: '#fff5f5', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.5rem 0.75rem', margin: 0 },
  saveBtn: { padding: '0.65rem 1.5rem', backgroundColor: '#1d6fa4', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', alignSelf: 'flex-start' as const },
};
