function TruckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1d6fa4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
      <rect x="9" y="11" width="14" height="10" rx="1"/>
      <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    </svg>
  );
}

function CashIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1d6fa4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <circle cx="12" cy="12" r="2"/>
      <path d="M6 12h.01M18 12h.01"/>
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1d6fa4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="2" width="14" height="20" rx="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  );
}

export default function DeliveryStrip() {
  return (
    <section style={styles.strip} aria-label="Delivery and payment information">
      <div style={styles.item}>
        <span style={styles.iconWrap}><TruckIcon /></span>
        <div>
          <strong style={styles.label}>Nationwide Delivery</strong>
          <p style={styles.detail}>Countrywide delivery available across Kenya in 2–5 business days</p>
        </div>
      </div>
      <div style={styles.divider} aria-hidden="true" />
      <div style={styles.item}>
        <span style={styles.iconWrap}><CashIcon /></span>
        <div>
          <strong style={styles.label}>Pay on Delivery</strong>
          <p style={styles.detail}>Cash accepted at your door</p>
        </div>
      </div>
      <div style={styles.divider} aria-hidden="true" />
      <div style={styles.item}>
        <span style={styles.iconWrap}><PhoneIcon /></span>
        <div>
          <strong style={styles.label}>M-Pesa Accepted</strong>
          <p style={styles.detail}>Pay conveniently via M-Pesa</p>
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  strip: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '1rem',
    backgroundColor: '#fff',
    border: '1px solid #dde3ec',
    borderRadius: '10px',
    padding: '1rem 1.5rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.65rem',
    flex: '1 1 180px',
    minWidth: '160px',
  },
  iconWrap: { flexShrink: 0, marginTop: '0.1rem' },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    color: '#0f1f3d',
    fontWeight: 700,
    marginBottom: '0.15rem',
  },
  detail: { margin: 0, fontSize: '0.78rem', color: '#5a6a80' },
  divider: {
    width: '1px',
    backgroundColor: '#dde3ec',
    alignSelf: 'stretch',
    margin: '0 0.25rem',
  },
};
