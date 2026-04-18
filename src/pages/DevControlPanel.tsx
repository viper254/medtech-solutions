import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from '../components/LoadingSpinner';

// SECURITY: Secret key from environment variable (or fallback)
// Set VITE_DEV_CONTROL_KEY in your .env file
const SECRET_KEY = import.meta.env.VITE_DEV_CONTROL_KEY || 'phantom@2025';

interface SiteStatus {
  is_active: boolean;
  customer_message: string;
  admin_message: string;
  days_until_due: number;
  is_overdue: boolean;
}

interface SiteControl {
  id: string;
  is_active: boolean;
  payment_due_date: string | null;
  grace_period_days: number;
  last_payment_date: string | null;
  next_payment_amount: number;
  customer_message: string;
  admin_message: string;
  auto_disable_enabled: boolean;
}

interface PaymentRecord {
  id: string;
  amount: number;
  payment_date: string;
  due_date: string | null;
  status: string;
  notes: string | null;
}

export default function DevControlPanel() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const key = searchParams.get('key');

  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [siteControl, setSiteControl] = useState<SiteControl | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [status, setStatus] = useState<SiteStatus | null>(null);

  // Form states
  const [isActive, setIsActive] = useState(true);
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [gracePeriod, setGracePeriod] = useState(3);
  const [nextAmount, setNextAmount] = useState(0);
  const [customerMsg, setCustomerMsg] = useState('');
  const [adminMsg, setAdminMsg] = useState('');
  const [autoDisable, setAutoDisable] = useState(true);

  // Payment form
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentNotes, setNewPaymentNotes] = useState('');

  useEffect(() => {
    if (key === SECRET_KEY) {
      setAuthenticated(true);
      loadData();
    } else {
      setLoading(false);
    }
  }, [key]);

  async function loadData() {
    setLoading(true);
    try {
      // Get site control data
      const { data: controlData, error: controlError } = await supabase
        .from('site_control')
        .select('*')
        .limit(1)
        .single();

      if (controlError) throw controlError;

      const control = controlData as unknown as SiteControl;
      setSiteControl(control);
      setIsActive(control.is_active);
      setPaymentDueDate(control.payment_due_date ? new Date(control.payment_due_date).toISOString().slice(0, 16) : '');
      setGracePeriod(control.grace_period_days);
      setNextAmount(control.next_payment_amount);
      setCustomerMsg(control.customer_message);
      setAdminMsg(control.admin_message);
      setAutoDisable(control.auto_disable_enabled);

      // Get payment history
      const { data: paymentData } = await supabase
        .from('payment_history')
        .select('*')
        .order('payment_date', { ascending: false })
        .limit(10);

      setPayments((paymentData as unknown as PaymentRecord[]) ?? []);

      // Get current status
      const { data: statusData } = await supabase.rpc('get_site_status');
      if (statusData && statusData.length > 0) {
        setStatus(statusData[0] as SiteStatus);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setMessage({ type: 'error', text: 'Failed to load control panel data' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!siteControl) return;
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('site_control')
        .update({
          is_active: isActive,
          payment_due_date: paymentDueDate ? new Date(paymentDueDate).toISOString() : null,
          grace_period_days: gracePeriod,
          next_payment_amount: nextAmount,
          customer_message: customerMsg,
          admin_message: adminMsg,
          auto_disable_enabled: autoDisable,
          updated_at: new Date().toISOString(),
        })
        .eq('id', siteControl.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      await loadData();
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  }

  async function handleRecordPayment() {
    if (!newPaymentAmount || parseFloat(newPaymentAmount) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid payment amount' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      // Record payment
      const { error: paymentError } = await supabase
        .from('payment_history')
        .insert({
          amount: parseFloat(newPaymentAmount),
          payment_date: new Date().toISOString(),
          status: 'paid',
          notes: newPaymentNotes || null,
        });

      if (paymentError) throw paymentError;

      // Update site control with new payment date and extend due date
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 30); // 30 days from now

      const { error: updateError } = await supabase
        .from('site_control')
        .update({
          last_payment_date: new Date().toISOString(),
          payment_due_date: newDueDate.toISOString(),
          is_active: true, // Re-enable site on payment
          updated_at: new Date().toISOString(),
        })
        .eq('id', siteControl!.id);

      if (updateError) throw updateError;

      setMessage({ type: 'success', text: 'Payment recorded! Site extended for 30 days.' });
      setNewPaymentAmount('');
      setNewPaymentNotes('');
      await loadData();
    } catch (error) {
      console.error('Payment error:', error);
      setMessage({ type: 'error', text: 'Failed to record payment' });
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickToggle() {
    if (!siteControl) return;
    setSaving(true);

    try {
      const newStatus = !isActive;
      const { error } = await supabase
        .from('site_control')
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq('id', siteControl.id);

      if (error) throw error;

      setIsActive(newStatus);
      setMessage({ type: 'success', text: `Site ${newStatus ? 'enabled' : 'disabled'}!` });
      await loadData();
    } catch (error) {
      console.error('Toggle error:', error);
      setMessage({ type: 'error', text: 'Failed to toggle site status' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  if (!authenticated) {
    return (
      <div style={styles.page}>
        <div style={styles.accessDenied}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f85149" strokeWidth="2" style={{ marginBottom: '1rem' }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
          <h1 style={styles.deniedHeading}>Access Denied</h1>
          <p style={styles.deniedText}>Invalid access key</p>
          <button onClick={() => navigate('/')} style={styles.homeBtn}>Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.heading}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
              Developer Control Panel
            </h1>
            <p style={styles.sub}>Site Management & Payment Tracking</p>
          </div>
          <button onClick={() => navigate('/')} style={styles.homeBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.25rem' }}>
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Site
          </button>
        </div>

        {message && (
          <div style={{ ...styles.alert, ...(message.type === 'success' ? styles.alertSuccess : styles.alertError) }}>
            {message.text}
          </div>
        )}

        {/* Current Status Card */}
        {status && (
          <div style={{ ...styles.card, ...(status.is_active ? styles.cardGreen : styles.cardRed) }}>
            <h2 style={styles.cardHeading}>Current Status</h2>
            <div style={styles.statusGrid}>
              <div>
                <span style={styles.statusLabel}>Site Status:</span>
                <span style={styles.statusValue}>
                  {status.is_active ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="3" style={{ verticalAlign: 'middle', marginRight: '0.25rem' }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      ACTIVE
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#f85149" style={{ verticalAlign: 'middle', marginRight: '0.25rem' }}>
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                      DISABLED
                    </>
                  )}
                </span>
              </div>
              <div>
                <span style={styles.statusLabel}>Payment Status:</span>
                <span style={styles.statusValue}>
                  {status.is_overdue ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f85149" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.25rem' }}>
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      OVERDUE
                    </>
                  ) : status.days_until_due < 7 ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d29922" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.25rem' }}>
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      DUE SOON
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="3" style={{ verticalAlign: 'middle', marginRight: '0.25rem' }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Current
                    </>
                  )}
                </span>
              </div>
              <div>
                <span style={styles.statusLabel}>Days Until Due:</span>
                <span style={styles.statusValue}>{status.days_until_due > 0 ? status.days_until_due : 'OVERDUE'}</span>
              </div>
            </div>
            <button onClick={handleQuickToggle} disabled={saving} style={styles.quickToggle}>
              {saving ? 'Processing...' : isActive ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                  Disable Site Now
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Enable Site Now
                </>
              )}
            </button>
          </div>
        )}

        {/* Record Payment */}
        <div style={styles.card}>
          <h2 style={styles.cardHeading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            Record Payment
          </h2>
          <div style={styles.paymentForm}>
            <div style={styles.field}>
              <label style={styles.label}>Payment Amount (KES)</label>
              <input
                type="number"
                value={newPaymentAmount}
                onChange={(e) => setNewPaymentAmount(e.target.value)}
                style={styles.input}
                placeholder="e.g. 5000"
                min="0"
                step="0.01"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Notes (optional)</label>
              <input
                type="text"
                value={newPaymentNotes}
                onChange={(e) => setNewPaymentNotes(e.target.value)}
                style={styles.input}
                placeholder="e.g. January 2024 payment"
              />
            </div>
            <button onClick={handleRecordPayment} disabled={saving} style={styles.recordBtn}>
              {saving ? 'Recording...' : 'Record Payment & Extend 30 Days'}
            </button>
          </div>
        </div>

        {/* Site Control Settings */}
        <div style={styles.card}>
          <h2 style={styles.cardHeading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m-6 0l-4.2 4.2"/>
            </svg>
            Site Control Settings
          </h2>
          
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={styles.checkbox}
                />
                Site Active
              </label>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                <input
                  type="checkbox"
                  checked={autoDisable}
                  onChange={(e) => setAutoDisable(e.target.checked)}
                  style={styles.checkbox}
                />
                Auto-Disable on Overdue
              </label>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Payment Due Date</label>
              <input
                type="datetime-local"
                value={paymentDueDate}
                onChange={(e) => setPaymentDueDate(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Grace Period (days)</label>
              <input
                type="number"
                value={gracePeriod}
                onChange={(e) => setGracePeriod(parseInt(e.target.value))}
                style={styles.input}
                min="0"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Next Payment Amount (KES)</label>
              <input
                type="number"
                value={nextAmount}
                onChange={(e) => setNextAmount(parseFloat(e.target.value))}
                style={styles.input}
                min="0"
                step="0.01"
              />
            </div>

            <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
              <label style={styles.label}>Customer Message (shown to visitors)</label>
              <textarea
                value={customerMsg}
                onChange={(e) => setCustomerMsg(e.target.value)}
                style={{ ...styles.input, minHeight: '80px' }}
                placeholder="Message shown to customers when site is disabled"
              />
            </div>

            <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
              <label style={styles.label}>Admin Message (shown to client)</label>
              <textarea
                value={adminMsg}
                onChange={(e) => setAdminMsg(e.target.value)}
                style={{ ...styles.input, minHeight: '80px' }}
                placeholder="Message shown to admin when site is disabled"
              />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Payment History */}
        <div style={styles.card}>
          <h2 style={styles.cardHeading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
              <line x1="12" y1="20" x2="12" y2="10"/>
              <line x1="18" y1="20" x2="18" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="16"/>
            </svg>
            Payment History
          </h2>
          {payments.length === 0 ? (
            <p style={styles.emptyText}>No payment records yet</p>
          ) : (
            <div style={styles.table}>
              <div style={styles.tableHeader}>
                <span>Date</span>
                <span>Amount</span>
                <span>Status</span>
                <span>Notes</span>
              </div>
              {payments.map((payment) => (
                <div key={payment.id} style={styles.tableRow}>
                  <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
                  <span style={styles.amount}>KES {payment.amount.toLocaleString()}</span>
                  <span style={styles.status}>{payment.status}</span>
                  <span style={styles.notes}>{payment.notes || '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={styles.infoCard}>
          <h3 style={styles.infoHeading}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            How It Works
          </h3>
          <ul style={styles.infoList}>
            <li>Record payments to automatically extend the site for 30 days</li>
            <li>Site will auto-disable after payment due date + grace period</li>
            <li>Quick toggle allows instant enable/disable regardless of payment status</li>
            <li>Customers see the custom message when site is disabled</li>
            <li>Admin sees a different message in their dashboard</li>
            <li>Keep this URL secret - bookmark it for easy access</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', backgroundColor: '#0f1419', padding: '2rem 1rem' },
  container: { maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' },
  heading: { fontSize: '1.75rem', fontWeight: 700, color: '#fff', margin: 0 },
  sub: { fontSize: '0.9rem', color: '#8b949e', margin: '0.25rem 0 0' },
  homeBtn: { padding: '0.5rem 1rem', backgroundColor: '#21262d', border: '1px solid #30363d', borderRadius: '6px', color: '#c9d1d9', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' },
  
  alert: { padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 500 },
  alertSuccess: { backgroundColor: '#1a3a1a', border: '1px solid #2ea043', color: '#3fb950' },
  alertError: { backgroundColor: '#3a1a1a', border: '1px solid #da3633', color: '#f85149' },
  
  card: { backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
  cardGreen: { borderColor: '#2ea043' },
  cardRed: { borderColor: '#da3633' },
  cardHeading: { fontSize: '1.1rem', fontWeight: 700, color: '#c9d1d9', margin: '0 0 1rem' },
  
  statusGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' },
  statusLabel: { display: 'block', fontSize: '0.8rem', color: '#8b949e', marginBottom: '0.25rem' },
  statusValue: { display: 'block', fontSize: '1.1rem', fontWeight: 700, color: '#c9d1d9' },
  
  quickToggle: { width: '100%', padding: '0.75rem', backgroundColor: '#238636', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' },
  
  paymentForm: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.875rem', fontWeight: 600, color: '#c9d1d9', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  input: { padding: '0.6rem 0.75rem', fontSize: '0.9rem', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', color: '#c9d1d9', outline: 'none' },
  checkbox: { width: '18px', height: '18px', cursor: 'pointer' },
  
  recordBtn: { padding: '0.75rem 1.5rem', backgroundColor: '#238636', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', alignSelf: 'flex-start' },
  saveBtn: { padding: '0.75rem 1.5rem', backgroundColor: '#1f6feb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', alignSelf: 'flex-start' },
  
  table: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  tableHeader: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: '1rem', padding: '0.75rem', backgroundColor: '#0d1117', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#8b949e', textTransform: 'uppercase' },
  tableRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: '1rem', padding: '0.75rem', borderBottom: '1px solid #21262d', fontSize: '0.875rem', color: '#c9d1d9' },
  amount: { fontWeight: 700, color: '#3fb950' },
  status: { textTransform: 'capitalize', color: '#58a6ff' },
  notes: { color: '#8b949e' },
  emptyText: { color: '#8b949e', textAlign: 'center', padding: '2rem' },
  
  infoCard: { backgroundColor: '#1c2128', border: '1px solid #30363d', borderRadius: '8px', padding: '1.5rem' },
  infoHeading: { fontSize: '1rem', fontWeight: 700, color: '#c9d1d9', margin: '0 0 0.75rem' },
  infoList: { color: '#8b949e', fontSize: '0.875rem', lineHeight: 1.8, margin: 0, paddingLeft: '1.5rem' },
  
  accessDenied: { textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', maxWidth: '500px', margin: '4rem auto' },
  deniedHeading: { fontSize: '2rem', fontWeight: 700, color: '#f85149', margin: '0 0 0.5rem' },
  deniedText: { fontSize: '1rem', color: '#8b949e', margin: '0 0 1.5rem' },
};
