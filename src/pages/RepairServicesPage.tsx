import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { mapRepairMedia } from '../lib/supabaseClient';
import { RepairService } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const WHATSAPP_URL = 'https://wa.me/254793636022';
const PHONE_PRIMARY = 'tel:+254793636022';
const PHONE_SECONDARY = 'tel:+254756597813';

function WrenchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

export default function RepairServicesPage() {
  const [services, setServices] = useState<RepairService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchServices() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('repair_services')
        .select('*, media:repair_service_media(*)')
        .order('name', { ascending: true });
      if (cancelled) return;
      if (fetchError) {
        setError('Failed to load repair services. Please try again.');
      } else {
        const mapped = (data ?? []).map((s: Record<string, unknown>) => ({
          ...(s as unknown as RepairService),
          media: mapRepairMedia((s.media as Array<Record<string, unknown>>) ?? []),
        }));
        setServices(mapped);
      }
      setLoading(false);
    }
    fetchServices();
    return () => { cancelled = true; };
  }, []);

  return (
    <main style={styles.page}>
      {/* Hero */}
      <section style={styles.hero} aria-label="Repair services hero">
        <h1 style={styles.heroTitle}>Repair Services</h1>
        <p style={styles.heroSub}>Professional repairs for phones, laptops, and other devices — fast turnaround, expert hands.</p>
      </section>

      <div style={styles.content}>
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <p style={styles.error} role="alert">{error}</p>
        ) : services.length === 0 ? (
          <div style={styles.emptyState}>
            <WrenchIcon />
            <p style={styles.emptyText}>Our repair services list is being updated. Contact us directly for a quote.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {services.map((service) => (
              <div key={service.id} style={styles.card}>
                {service.media && service.media.length > 0 ? (
                  <img
                    src={service.media[0].url}
                    alt={service.name}
                    style={styles.cardImage}
                    loading="lazy"
                  />
                ) : (
                  <div style={styles.cardIcon}><WrenchIcon /></div>
                )}
                <h2 style={styles.serviceName}>{service.name}</h2>
                <p style={styles.description}>{service.description}</p>
                <div style={styles.turnaround}>
                  <span style={styles.clockIcon}><ClockIcon /></span>
                  <span>{service.estimated_turnaround}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div style={styles.ctaSection}>
          <p style={styles.ctaText}>Ready to get your device repaired?</p>
          <div style={styles.ctaButtons}>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ ...styles.ctaBtn, ...styles.whatsappBtn }}>
              WhatsApp Us
            </a>
            <a href={PHONE_PRIMARY} style={{ ...styles.ctaBtn, ...styles.phoneBtn }}>+254 793 636 022</a>
            <a href={PHONE_SECONDARY} style={{ ...styles.ctaBtn, ...styles.phoneBtn }}>+254 756 597 813</a>
          </div>
        </div>
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
  heroSub: { fontSize: '1rem', opacity: 0.85, margin: 0, maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' },
  content: { maxWidth: '960px', margin: '0 auto', padding: '2rem 1rem' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.25rem',
    marginBottom: '2.5rem',
  },
  card: {
    border: '1px solid #dde3ec',
    borderRadius: '10px',
    padding: '1.5rem',
    backgroundColor: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  cardIcon: { color: '#1d6fa4', marginBottom: '0.25rem' },
  cardImage: { width: '100%', height: '160px', objectFit: 'cover' as const, borderRadius: '6px', marginBottom: '0.25rem' },
  serviceName: { fontSize: '1.05rem', fontWeight: 700, color: '#0f1f3d', margin: 0 },
  description: { color: '#5a6a80', fontSize: '0.9rem', lineHeight: 1.55, margin: 0, flex: 1 },
  turnaround: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    fontSize: '0.82rem', color: '#1d6fa4', fontWeight: 600, marginTop: '0.25rem',
  },
  clockIcon: { display: 'flex', alignItems: 'center' },
  emptyState: { textAlign: 'center', padding: '3rem 0', color: '#5a6a80', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '1rem' },
  emptyText: { margin: 0, fontSize: '1rem' },
  error: { textAlign: 'center', color: '#b91c1c', padding: '2rem 0' },
  ctaSection: {
    borderTop: '1px solid #dde3ec',
    paddingTop: '1.75rem',
    textAlign: 'center',
  },
  ctaText: { color: '#0f1f3d', fontWeight: 600, fontSize: '1.05rem', marginBottom: '1rem' },
  ctaButtons: { display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' as const },
  ctaBtn: { display: 'inline-block', padding: '0.6rem 1.5rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' },
  whatsappBtn: { backgroundColor: '#25d366', color: '#fff' },
  phoneBtn: { backgroundColor: '#1d6fa4', color: '#fff' },
};
