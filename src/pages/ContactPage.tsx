/**
 * ContactPage — full business contact details for Medtech Solutions
 */

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
      <rect x="9" y="11" width="14" height="10" rx="1"/>
      <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

export default function ContactPage() {
  return (
    <main style={styles.page}>

      {/* Hero */}
      <section style={styles.hero} aria-label="Contact hero">
        <h1 style={styles.heroTitle}>Get in Touch</h1>
        <p style={styles.slogan}>Home of Quality, Reliable &amp; Affordable Solutions</p>
        <p style={styles.heroSub}>Affordable tech accessories and medical equipment tailored to your needs</p>
      </section>

      <div style={styles.content}>

        {/* Contact Card */}
        <section style={styles.card} aria-labelledby="contact-card-heading">
          <h2 id="contact-card-heading" style={styles.cardHeading}>Contact Details</h2>

          <div style={styles.contactGrid}>
            <div style={styles.contactItem}>
              <span style={styles.contactIcon}><PhoneIcon /></span>
              <div>
                <p style={styles.contactLabel}>WhatsApp / Call</p>
                <a href="tel:+254793636022" style={styles.contactValue}>+254 793 636 022</a>
                <a href="tel:+254756597813" style={styles.contactValue}>+254 756 597 813</a>
              </div>
            </div>

            <div style={styles.contactItem}>
              <span style={styles.contactIcon}><MailIcon /></span>
              <div>
                <p style={styles.contactLabel}>Email</p>
                <a href="mailto:medtechsolutions@gmail.com" style={styles.contactValue}>
                  medtechsolutions@gmail.com
                </a>
              </div>
            </div>

            <div style={styles.contactItem}>
              <span style={styles.contactIcon}><TruckIcon /></span>
              <div>
                <p style={styles.contactLabel}>Delivery</p>
                <p style={styles.contactValuePlain}>Countrywide delivery available</p>
                <p style={styles.contactValuePlain}>Payment on delivery accepted</p>
              </div>
            </div>

            <div style={styles.contactItem}>
              <span style={styles.contactIcon}><WrenchIcon /></span>
              <div>
                <p style={styles.contactLabel}>We Offer</p>
                <p style={styles.contactValuePlain}>Phones &amp; Accessories</p>
                <p style={styles.contactValuePlain}>Laptops &amp; Laptop Gear</p>
                <p style={styles.contactValuePlain}>Medical Equipment</p>
                <p style={styles.contactValuePlain}>Expert Repairs</p>
              </div>
            </div>
          </div>

          {/* CTA buttons */}
          <div style={styles.ctaRow}>
            <a
              href="https://wa.me/254793636022"
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...styles.ctaBtn, ...styles.whatsappBtn }}
            >
              WhatsApp Us
            </a>
            <a href="tel:+254793636022" style={{ ...styles.ctaBtn, ...styles.callBtn }}>
              Call Us
            </a>
            <a
              href="mailto:medtechsolutions@gmail.com"
              style={{ ...styles.ctaBtn, ...styles.emailBtn }}
            >
              Email Us
            </a>
          </div>
        </section>

        {/* Locations */}
        <section aria-labelledby="locations-heading">
          <h2 id="locations-heading" style={styles.sectionHeading}>Our Locations</h2>

          <div style={styles.locationsGrid}>
            {/* Branch 1 */}
            <div style={styles.locationCard}>
              <div style={styles.locationHeader}>
                <span style={styles.locationIcon}><MapPinIcon /></span>
                <div>
                  <h3 style={styles.locationName}>Kisii Branch</h3>
                  <p style={styles.locationAddress}>Kisii Market Plaza, Kisii Town, Kenya</p>
                </div>
              </div>
              <div style={styles.locationDetails}>
                <p style={styles.locationDetail}>+254 793 636 022</p>
                <p style={styles.locationDetail}>+254 756 597 813</p>
              </div>
              <a
                href="https://www.google.com/maps/search/Market+Plaza+Kisii+Town+Kenya"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.mapsLink}
              >
                Open in Google Maps →
              </a>
            </div>

            {/* Branch 2 */}
            <div style={styles.locationCard}>
              <div style={styles.locationHeader}>
                <span style={styles.locationIcon}><MapPinIcon /></span>
                <div>
                  <h3 style={styles.locationName}>Nairobi Branch</h3>
                  <p style={styles.locationAddress}>Platinum Plaza, Nairobi, Kenya</p>
                </div>
              </div>
              <div style={styles.locationDetails}>
                <p style={styles.locationDetail}>+254 793 636 022</p>
                <p style={styles.locationDetail}>+254 756 597 813</p>
              </div>
              <a
                href="https://www.google.com/maps/search/Platinum+Plaza+Nairobi+Kenya"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.mapsLink}
              >
                Open in Google Maps →
              </a>
            </div>
          </div>
        </section>

        {/* Operating Hours */}
        <section style={styles.card} aria-labelledby="hours-heading">
          <h2 id="hours-heading" style={styles.cardHeading}>
            <span style={styles.cardHeadingIcon}><ClockIcon /></span>
            Operating Hours
          </h2>
          <table style={styles.hoursTable}>
            <tbody>
              {[
                { day: 'Monday',    hours: '09:00 – 18:00' },
                { day: 'Tuesday',   hours: '09:00 – 18:00' },
                { day: 'Wednesday', hours: '09:00 – 18:00' },
                { day: 'Thursday',  hours: '09:00 – 18:00' },
                { day: 'Friday',    hours: '09:00 – 18:00' },
                { day: 'Saturday',  hours: '09:00 – 15:00' },
                { day: 'Sunday',    hours: 'Closed' },
              ].map(({ day, hours }) => (
                <tr key={day} style={styles.hoursRow}>
                  <td style={styles.dayCell}>{day}</td>
                  <td style={{ ...styles.hoursCell, ...(hours === 'Closed' ? styles.closedCell : {}) }}>
                    {hours}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f7fafc',
  },
  hero: {
    background: 'linear-gradient(135deg, #0f1f3d 0%, #1d6fa4 100%)',
    color: '#fff',
    textAlign: 'center',
    padding: '3rem 1.5rem 2.5rem',
  },
  heroTitle: {
    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
    fontWeight: 800,
    margin: '0 0 0.5rem',
  },
  slogan: {
    fontSize: '1.1rem',
    fontWeight: 600,
    opacity: 0.95,
    margin: '0 0 0.35rem',
  },
  heroSub: {
    fontSize: '0.95rem',
    opacity: 0.8,
    margin: 0,
  },
  content: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    padding: '1.75rem',
  },
  cardHeading: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#0f1f3d',
    marginBottom: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  cardHeadingIcon: {
    color: '#1d6fa4',
    display: 'flex',
    alignItems: 'center',
  },
  contactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1.25rem',
    marginBottom: '1.5rem',
  },
  contactItem: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start',
  },
  contactIcon: {
    color: '#1d6fa4',
    display: 'flex',
    alignItems: 'center',
    marginTop: '0.1rem',
    flexShrink: 0,
  },
  contactLabel: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#718096',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    margin: '0 0 0.3rem',
  },
  contactValue: {
    display: 'block',
    fontSize: '0.9rem',
    color: '#1d6fa4',
    fontWeight: 600,
    textDecoration: 'none',
    marginBottom: '0.15rem',
  },
  contactValuePlain: {
    fontSize: '0.9rem',
    color: '#2d3748',
    margin: '0 0 0.15rem',
  },
  ctaRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.75rem',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '1.25rem',
  },
  ctaBtn: {
    display: 'inline-block',
    padding: '0.6rem 1.25rem',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.9rem',
    textDecoration: 'none',
  },
  whatsappBtn: { backgroundColor: '#25d366', color: '#fff' },
  callBtn: { backgroundColor: '#1d6fa4', color: '#fff' },
  emailBtn: { backgroundColor: '#4a5568', color: '#fff' },
  sectionHeading: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#0f1f3d',
    marginBottom: '1rem',
  },
  locationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.25rem',
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  locationHeader: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start',
  },
  locationIcon: {
    color: '#1d6fa4',
    display: 'flex',
    alignItems: 'center',
    marginTop: '0.15rem',
    flexShrink: 0,
  },
  locationName: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#0f1f3d',
    margin: '0 0 0.2rem',
  },
  locationAddress: {
    fontSize: '0.875rem',
    color: '#4a5568',
    margin: 0,
    lineHeight: 1.4,
  },
  locationDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.2rem',
  },
  locationDetail: {
    fontSize: '0.875rem',
    color: '#2d3748',
    margin: 0,
  },
  mapsLink: {
    display: 'inline-block',
    fontSize: '0.875rem',
    color: '#1d6fa4',
    fontWeight: 600,
    textDecoration: 'none',
    marginTop: 'auto',
  },
  hoursTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  hoursRow: {
    borderBottom: '1px solid #f0f4f8',
  },
  dayCell: {
    padding: '0.6rem 0',
    fontSize: '0.9rem',
    color: '#2d3748',
    fontWeight: 500,
    width: '50%',
  },
  hoursCell: {
    padding: '0.6rem 0',
    fontSize: '0.9rem',
    color: '#4a5568',
    textAlign: 'right' as const,
  },
  closedCell: {
    color: '#c53030',
    fontWeight: 700,
  },
};
