import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import StatusCard from '../components/DevControl/StatusCard';
import PaymentForm from '../components/DevControl/PaymentForm';
import PaymentHistory from '../components/DevControl/PaymentHistory';
import SettingsForm from '../components/DevControl/SettingsForm';

interface SiteControl {
  is_active: boolean;
  auto_disable_on_overdue: boolean;
  payment_due_date: string;
  grace_period_days: number;
  next_payment_amount: number;
  customer_message: string;
  admin_message: string;
}

interface SiteStatus {
  is_active: boolean;
  customer_message: string;
  admin_message: string;
  days_until_due: number;
  is_overdue: boolean;
}

interface PaymentRecord {
  id: string;
  amount: number;
  payment_date: string;
  status: string;
  notes: string | null;
}

export default function DevControlPanel() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data states
  const [status, setStatus] = useState<SiteStatus | null>(null);
  const [control, setControl] = useState<SiteControl | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // Form states
  const [isActive, setIsActive] = useState(true);
  const [autoDisable, setAutoDisable] = useState(true);
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [gracePeriod, setGracePeriod] = useState(3);
  const [nextAmount, setNextAmount] = useState(5000);
  const [customerMsg, setCustomerMsg] = useState('');
  const [adminMsg, setAdminMsg] = useState('');

  useEffect(() => {
    const key = searchParams.get('key');
    const expectedKey = import.meta.env.VITE_DEV_CONTROL_KEY;

    if (!expectedKey) {
      alert('Developer control system not configured. Set VITE_DEV_CONTROL_KEY in environment.');
      navigate('/');
      return;
    }

    if (key !== expectedKey) {
      alert('Invalid access key');
      navigate('/');
      return;
    }

    setAuthenticated(true);
    loadData();
  }, [searchParams, navigate]);

  async function loadData() {
    console.log('🔄 Starting to load control panel data...');
    console.log('🔗 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('🔑 Using key:', import.meta.env.VITE_DEV_CONTROL_KEY);
    
    try {
      // Load status
      console.log('📊 Loading site status...');
      const { data: statusData, error: statusError } = await supabase.rpc('get_site_status');
      
      console.log('📊 Status response:', { data: statusData, error: statusError });
      
      if (statusError) {
        console.error('❌ Status error:', statusError);
      } else if (statusData && statusData.length > 0) {
        console.log('✅ Status loaded:', statusData[0]);
        setStatus(statusData[0] as SiteStatus);
      } else {
        console.warn('⚠️ No status data returned');
      }

      // Load control settings
      console.log('⚙️ Loading control settings...');
      const { data: controlData, error: controlError } = await supabase
        .from('site_control')
        .select('*')
        .single();

      if (controlError) {
        console.error('❌ Control data error:', controlError);
      } else if (controlData) {
        console.log('✅ Control data loaded:', controlData);
        const ctrl = controlData as SiteControl;
        setControl(ctrl);
        setIsActive(ctrl.is_active);
        setAutoDisable(ctrl.auto_disable_on_overdue);
        setPaymentDueDate(ctrl.payment_due_date ? new Date(ctrl.payment_due_date).toISOString().slice(0, 16) : '');
        setGracePeriod(ctrl.grace_period_days);
        setNextAmount(ctrl.next_payment_amount);
        setCustomerMsg(ctrl.customer_message);
        setAdminMsg(ctrl.admin_message);
      } else {
        console.warn('⚠️ No control data returned');
      }

      // Load payment history
      console.log('💰 Loading payment history...');
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payment_history')
        .select('*')
        .order('payment_date', { ascending: false })
        .limit(10);

      if (paymentsError) {
        console.error('❌ Payments error:', paymentsError);
      } else if (paymentsData) {
        console.log('✅ Payments loaded:', paymentsData.length, 'records');
        setPayments(paymentsData as PaymentRecord[]);
      } else {
        console.log('ℹ️ No payment history yet');
      }
      
      console.log('✅ Data loading complete!');
    } catch (error) {
      console.error('💥 Failed to load data:', error);
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  }

  async function handleToggleSite() {
    if (!control) return;

    setSaving(true);
    try {
      const newState = !control.is_active;
      
      const { error } = await supabase
        .from('site_control')
        .update({ is_active: newState })
        .eq('id', 1);

      if (error) throw error;

      setControl({ ...control, is_active: newState });
      setIsActive(newState);
      
      // Refresh status
      await loadData();
      
      alert(`Site ${newState ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      console.error('Failed to toggle site:', error);
      alert('Failed to toggle site. Check console for details.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSettings() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_control')
        .update({
          is_active: isActive,
          auto_disable_on_overdue: autoDisable,
          payment_due_date: paymentDueDate ? new Date(paymentDueDate).toISOString() : null,
          grace_period_days: gracePeriod,
          next_payment_amount: nextAmount,
          customer_message: customerMsg,
          admin_message: adminMsg,
        })
        .eq('id', 1);

      if (error) throw error;

      await loadData();
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Check console for details.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRecordPayment(amount: string, notes: string) {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    setSaving(true);
    try {
      // Record payment
      const { error: paymentError } = await supabase
        .from('payment_history')
        .insert({
          amount: parseFloat(amount),
          notes: notes || null,
          status: 'received',
        });

      if (paymentError) throw paymentError;

      // Extend due date by 30 days
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 30);

      const { error: updateError } = await supabase
        .from('site_control')
        .update({
          payment_due_date: newDueDate.toISOString(),
          is_active: true, // Re-enable site on payment
        })
        .eq('id', 1);

      if (updateError) throw updateError;

      await loadData();
      alert('Payment recorded and site extended for 30 days!');
    } catch (error) {
      console.error('Failed to record payment:', error);
      alert('Failed to record payment. Check console for details.');
    } finally {
      setSaving(false);
    }
  }

  if (!authenticated || loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingBox}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>
            {!authenticated ? 'Checking access...' : 'Loading control panel...'}
          </p>
          <p style={{ ...styles.loadingText, fontSize: '0.8rem', marginTop: '0.5rem' }}>
            If this takes too long, check browser console (F12) for errors
          </p>
        </div>
      </div>
    );
  }

  if (!status || !control) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f85149" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <h2 style={styles.errorHeading}>Control System Not Initialized</h2>
          <p style={styles.errorText}>
            The developer control system database tables are not set up.
            Please run the migration: <code>012_developer_control_system.sql</code>
          </p>
          <button onClick={() => navigate('/')} style={styles.errorBtn}>
            Return to Site
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="9" x2="15" y2="9"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            Developer Control Panel
          </h1>
          <p style={styles.subtitle}>Manage site status and payment tracking</p>
        </div>
        <button onClick={() => navigate('/')} style={styles.backBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to Site
        </button>
      </div>

      <div style={styles.grid}>
        <StatusCard
          status={status}
          isActive={control.is_active}
          saving={saving}
          onToggle={handleToggleSite}
        />

        <PaymentForm
          onSubmit={handleRecordPayment}
          saving={saving}
        />

        <div style={{ gridColumn: '1 / -1' }}>
          <PaymentHistory payments={payments} />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <SettingsForm
            isActive={isActive}
            setIsActive={setIsActive}
            autoDisable={autoDisable}
            setAutoDisable={setAutoDisable}
            paymentDueDate={paymentDueDate}
            setPaymentDueDate={setPaymentDueDate}
            gracePeriod={gracePeriod}
            setGracePeriod={setGracePeriod}
            nextAmount={nextAmount}
            setNextAmount={setNextAmount}
            customerMsg={customerMsg}
            setCustomerMsg={setCustomerMsg}
            adminMsg={adminMsg}
            setAdminMsg={setAdminMsg}
            onSave={handleSaveSettings}
            saving={saving}
          />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0d1117',
    padding: '2rem 1rem',
  },
  header: {
    maxWidth: '1200px',
    margin: '0 auto 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#c9d1d9',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#8b949e',
    margin: '0.25rem 0 0',
  },
  backBtn: {
    padding: '0.6rem 1.2rem',
    backgroundColor: '#21262d',
    color: '#c9d1d9',
    border: '1px solid #30363d',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  grid: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '1.5rem',
  },
  loadingBox: {
    maxWidth: '400px',
    margin: '4rem auto',
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
    borderRadius: '8px',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #30363d',
    borderTop: '4px solid #58a6ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 1rem',
  },
  loadingText: {
    color: '#8b949e',
    fontSize: '0.95rem',
  },
  errorBox: {
    maxWidth: '500px',
    margin: '4rem auto',
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: '#161b22',
    border: '1px solid #da3633',
    borderRadius: '8px',
  },
  errorHeading: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#f85149',
    margin: '1rem 0 0.5rem',
  },
  errorText: {
    color: '#8b949e',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    margin: '0 0 1.5rem',
  },
  errorBtn: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#238636',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
};
