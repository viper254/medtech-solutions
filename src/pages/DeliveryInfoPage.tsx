export default function DeliveryInfoPage() {
  return (
    <main style={styles.page}>
      <section style={styles.hero} aria-label="Delivery info hero">
        <h1 style={styles.heroTitle}>Delivery &amp; Payment</h1>
        <p style={styles.heroSub}>Everything you need to know about getting your order delivered.</p>
      </section>

      <div style={styles.content}>
        <section style={styles.card} aria-labelledby="delivery-heading">
          <h2 id="delivery-heading" style={styles.cardHeading}>Delivery</h2>
          <ul style={styles.list}>
            <li>Nationwide delivery available across Kenya</li>
            <li>Estimated delivery time: <strong>2–5 business days</strong></li>
            <li>Orders dispatched within 1 business day of confirmation</li>
            <li>You will be contacted via WhatsApp or phone to confirm your order and delivery address</li>
            <li>Delivery fees may apply depending on your location — our team will advise you at checkout</li>
          </ul>
        </section>

        <section style={styles.card} aria-labelledby="payment-heading">
          <h2 id="payment-heading" style={styles.cardHeading}>Payment Options</h2>
          <ul style={styles.list}>
            <li><strong>Pay on Delivery</strong> — cash payment accepted when your order arrives</li>
            <li><strong>M-Pesa</strong> — send payment via M-Pesa before or on delivery</li>
          </ul>
        </section>

        <section style={styles.card} aria-labelledby="contact-heading">
          <h2 id="contact-heading" style={styles.cardHeading}>Questions?</h2>
          <p style={styles.text}>
            Reach us on WhatsApp at{' '}
            <a href="https://wa.me/254793636022" style={styles.link} target="_blank" rel="noopener noreferrer">
              +254 793 636 022
            </a>{' '}
            or{' '}
            <a href="tel:+254756597813" style={styles.link}>+254 756 597 813</a>,
            or visit us at Kisii Market Plaza or Platinum Plaza, Nairobi.
          </p>
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', backgroundColor: '#f5f7fa' },
  hero: {
    background: 'linear-gradient(135deg, #0f1f3d 0%, #1d6fa4 100%)',
    color: '#fff',
    textAlign: 'center',
    padding: '3rem 1.5rem 2.5rem',
  },
  heroTitle: { fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 800, margin: '0 0 0.5rem' },
  heroSub: { fontSize: '1rem', opacity: 0.85, margin: 0 },
  content: {
    maxWidth: '760px',
    margin: '0 auto',
    padding: '2rem 1rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    border: '1px solid #dde3ec',
    padding: '1.5rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  cardHeading: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#0f1f3d',
    marginBottom: '0.75rem',
  },
  list: {
    margin: 0,
    paddingLeft: '1.25rem',
    color: '#2d3748',
    lineHeight: 1.85,
    fontSize: '0.92rem',
  },
  text: { margin: 0, color: '#2d3748', fontSize: '0.92rem', lineHeight: 1.6 },
  link: { color: '#1d6fa4', fontWeight: 600 },
};
