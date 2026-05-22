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
        <div style={styles.icon}>
          {isAdmin ? (
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#f85149" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          ) : (
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#1d6fa4" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          )}
        </div>
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
                <span style={styles.contactIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </span>
                <span>WhatsApp</span>
              </a>
              <a
                href="tel:+254756597813"
                style={styles.contactBtn}
              >
                <span style={styles.contactIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </span>
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
    marginBottom: '1rem',
    display: 'flex',
    justifyContent: 'center',
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
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
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
