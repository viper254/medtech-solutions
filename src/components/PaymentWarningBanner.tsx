import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface SiteStatus {
  is_active: boolean;
  customer_message: string;
  admin_message: string;
  days_until_due: number;
  is_overdue: boolean;
}

export default function PaymentWarningBanner() {
  const [status, setStatus] = useState<SiteStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      const { data } = await supabase.rpc('get_site_status');
      if (data && data.length > 0) {
        setStatus(data[0] as SiteStatus);
      }
    } catch (error) {
      console.error('Failed to check payment status:', error);
    }
  }

  if (!status || dismissed) return null;

  // Show warning if payment is due within 7 days or overdue
  const showWarning = status.days_until_due <= 7 || status.is_overdue;

  if (!showWarning) return null;

  const isUrgent = status.days_until_due <= 3 || status.is_overdue;

  return (
    <div style={{ ...styles.banner, ...(isUrgent ? styles.bannerUrgent : styles.bannerWarning) }}>
      <div style={styles.content}>
        <span style={styles.icon}>{isUrgent ? '🚨' : '⚠️'}</span>
        <div style={styles.text}>
          <strong style={styles.title}>
            {status.is_overdue ? 'Payment Overdue' : `Payment Due in ${status.days_until_due} Day${status.days_until_due !== 1 ? 's' : ''}`}
          </strong>
          <p style={styles.message}>
            {status.is_overdue 
              ? 'Your site access may be suspended soon. Please contact your developer immediately.'
              : 'Please ensure payment is made before the due date to avoid service interruption.'}
          </p>
        </div>
        <button onClick={() => setDismissed(true)} style={styles.closeBtn} aria-label="Dismiss">
          ✕
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    padding: '1rem 1.5rem',
    borderBottom: '2px solid',
  },
  bannerWarning: {
    backgroundColor: '#fff5eb',
    borderBottomColor: '#fbd38d',
  },
  bannerUrgent: {
    backgroundColor: '#fff5f5',
    borderBottomColor: '#feb2b2',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  icon: {
    fontSize: '1.5rem',
    flexShrink: 0,
  },
  text: {
    flex: 1,
  },
  title: {
    display: 'block',
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#0f1f3d',
    marginBottom: '0.25rem',
  },
  message: {
    fontSize: '0.85rem',
    color: '#4a5568',
    margin: 0,
    lineHeight: 1.4,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.25rem',
    color: '#718096',
    cursor: 'pointer',
    padding: '0.25rem',
    lineHeight: 1,
    flexShrink: 0,
  },
};
