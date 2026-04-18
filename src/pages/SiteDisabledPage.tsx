import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface SiteDisabledPageProps {
  message?: string;
  isAdmin?: boolean;
}

export default function SiteDisabledPage({ message, isAdmin = false }: SiteDisabledPageProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const defaultCustomerMessage = "Our store is temporarily unavailable for maintenance. We'll be back soon!";
  const defaultAdminMessage = "Payment is overdue. Please contact your developer to restore access.";

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.icon}>{isAdmin ? '⚠️' : '🔧'}</div>
        <h1 style={styles.heading}>
          {isAdmin ? 'Admin Access Suspended' : 'Store Temporarily Unavailable'}
        </h1>
        <p style={styles.message}>
          {message || (isAdmin ? defaultAdminMessage : defaultCustomerMessage)}
        </p>

        {!isAdmin && (
          <>
            <div style={styles.infoBox}>
              <p style={styles.infoText}>
                We're working to get everything back online as quickly as possible.
              </p>
              <p style={styles.infoText}>
                In the meantime, you can still reach us:
              </p>
            </div>

            <div style={styles.contactGrid}>
              <a
                href="https://wa.me/254793636022"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.contactBtn}
              >
                <span style={styles.contactIcon}>💬</span>
                <span>WhatsApp</span>
              </a>
              <a
                href="tel:+254756597813"
                style={styles.contactBtn}
              >
                <span style={styles.contactIcon}>📞</span>
                <span>Call Us</span>
              </a>
            </div>

            <p style={styles.footer}>
              Thank you for your patience and understanding.
            </p>
          </>
        )}

        {isAdmin && (
          <div style={styles.adminBox}>
            <p style={styles.adminText}>
              Your site access has been temporarily suspended due to payment issues.
            </p>
            <p style={styles.adminText}>
              Please contact your developer to resolve this and restore full access.
            </p>
            <div style={styles.adminActions}>
              <Link to="/" style={styles.homeLink}>
                View Public Site
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4f8',
    padding: '2rem 1rem',
  },
  container: {
    maxWidth: '600px',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    padding: '3rem 2rem',
    textAlign: 'center',
  },
  icon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  heading: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#0f1f3d',
    margin: '0 0 1rem',
  },
  message: {
    fontSize: '1.05rem',
    color: '#4a5568',
    lineHeight: 1.6,
    margin: '0 0 2rem',
  },
  infoBox: {
    backgroundColor: '#e8f2fa',
    border: '1px solid #bee3f8',
    borderRadius: '8px',
    padding: '1.25rem',
    marginBottom: '1.5rem',
  },
  infoText: {
    fontSize: '0.95rem',
    color: '#2c5282',
    margin: '0 0 0.5rem',
    lineHeight: 1.5,
  },
  contactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  contactBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem',
    backgroundColor: '#1d6fa4',
    color: '#fff',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '0.95rem',
    transition: 'transform 0.2s',
  },
  contactIcon: {
    fontSize: '2rem',
  },
  footer: {
    fontSize: '0.875rem',
    color: '#718096',
    margin: 0,
  },
  adminBox: {
    backgroundColor: '#fff5f5',
    border: '1px solid #feb2b2',
    borderRadius: '8px',
    padding: '1.5rem',
    marginTop: '1rem',
  },
  adminText: {
    fontSize: '0.95rem',
    color: '#742a2a',
    margin: '0 0 0.75rem',
    lineHeight: 1.5,
  },
  adminActions: {
    marginTop: '1.25rem',
  },
  homeLink: {
    display: 'inline-block',
    padding: '0.65rem 1.5rem',
    backgroundColor: '#1d6fa4',
    color: '#fff',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '0.9rem',
  },
};
