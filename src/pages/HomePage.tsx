import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, mapProducts } from '../lib/supabaseClient';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import DeliveryStrip from '../components/DeliveryStrip';
import LoadingSpinner from '../components/LoadingSpinner';

type ViewMode = 'grid' | 'list';

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/>
    </svg>
  );
}

interface HomePageProps {
  onAddToCart: (product: Product, quantity: number) => void;
}

export default function HomePage({ onAddToCart }: HomePageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('grid');

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      const { data } = await supabase
        .from('products')
        .select('*, media:product_media(*)')
        .order('created_at', { ascending: false })
        .limit(40);

      if (!cancelled) {
        setProducts(mapProducts((data as Array<Record<string, unknown>>) ?? []));
        setLoading(false);
      }
    }

    fetchProducts();
    return () => { cancelled = true; };
  }, []);

  return (
    <main>
      {/* Hero Banner */}
      <section style={styles.hero} aria-label="Hero banner">
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Medtech Solutions</h1>
          <p style={styles.heroTagline}>
            Your One-Stop Tech Hub — gadgets that empower your productivity
          </p>
          <p style={styles.heroSub}>
            Phones · Laptops · Accessories · Expert Repairs · Countrywide Delivery
          </p>
          <Link to="/catalog" style={styles.shopNowBtn} className="btn-transition">
            Shop Now
          </Link>
        </div>
      </section>

      {/* Category quick links */}
      <section style={styles.categoryRow} aria-label="Shop by category">
        {(['Phones', 'Laptops', 'Desktops', 'Accessories'] as const).map((cat) => (
          <Link key={cat} to={`/catalog?category=${cat}`} style={styles.categoryChip} className="btn-transition">
            {cat === 'Phones' ? '📱' : cat === 'Laptops' ? '💻' : cat === 'Desktops' ? '🖥️' : '🎧'} {cat}
          </Link>
        ))}
      </section>

      {/* Delivery & Payment Strip */}
      <div style={styles.stripWrapper}>
        <DeliveryStrip />
      </div>

      {/* Products */}
      <section style={styles.section} aria-label="All products">
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionHeading} className="section-heading-accent">Our Products</h2>
          <div style={styles.viewToggle} aria-label="View mode">
            <button
              onClick={() => setView('grid')}
              style={{ ...styles.viewBtn, ...(view === 'grid' ? styles.viewBtnActive : {}) }}
              aria-label="Grid view"
              title="Grid view"
            >
              <GridIcon />
            </button>
            <button
              onClick={() => setView('list')}
              style={{ ...styles.viewBtn, ...(view === 'list' ? styles.viewBtnActive : {}) }}
              aria-label="List view"
              title="List view"
            >
              <ListIcon />
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : products.length === 0 ? (
          <p style={styles.emptyMsg}>No products available yet.</p>
        ) : (
          <div style={view === 'list' ? styles.list : styles.grid}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                view={view}
              />
            ))}
          </div>
        )}
      </section>

      {/* WhatsApp CTA */}
      <section style={styles.whatsappSection} aria-label="Contact via WhatsApp">
        <p style={styles.whatsappText}>Have a question or need help choosing a product?</p>
        <a
          href="https://wa.me/254793636022"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.whatsappBtn}
        >
          💬 Chat with us on WhatsApp
        </a>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hero: {
    background: 'linear-gradient(135deg, #0a1628 0%, #0f1f3d 40%, #1d6fa4 100%)',
    color: '#fff',
    padding: '5rem 1.5rem',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: { maxWidth: '640px', margin: '0 auto', position: 'relative', zIndex: 1 },
  heroTitle: {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: 800,
    margin: '0 0 0.75rem',
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
  },
  heroTagline: {
    fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
    opacity: 0.92,
    margin: '0 0 0.5rem',
    lineHeight: 1.5,
  },
  heroSub: {
    fontSize: 'clamp(0.85rem, 2vw, 1rem)',
    opacity: 0.7,
    margin: '0 0 2.25rem',
    lineHeight: 1.5,
  },
  shopNowBtn: {
    display: 'inline-block',
    padding: '0.85rem 2.5rem',
    backgroundColor: '#fff',
    color: '#0f1f3d',
    borderRadius: '999px',
    fontWeight: 700,
    fontSize: '1rem',
    textDecoration: 'none',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },
  categoryRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    gap: '0.75rem',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1.75rem 1rem',
  },
  categoryChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.55rem 1.25rem',
    backgroundColor: '#fff',
    color: '#0f1f3d',
    border: '1px solid #dde3ec',
    borderRadius: '999px',
    fontWeight: 600,
    fontSize: '0.9rem',
    textDecoration: 'none',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
  },
  stripWrapper: {
    maxWidth: '1200px',
    margin: '0 auto 2rem',
    padding: '0 1rem',
  },
  section: {
    maxWidth: '1200px',
    margin: '0 auto 3rem',
    padding: '0 1rem',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
  },
  sectionHeading: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#0f1f3d',
    margin: 0,
  },
  viewToggle: { display: 'flex', gap: '4px' },
  viewBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '34px',
    height: '34px',
    border: '1px solid #dde3ec',
    borderRadius: '6px',
    backgroundColor: '#fff',
    color: '#5a6a80',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
  },
  viewBtnActive: {
    backgroundColor: '#0f1f3d',
    color: '#fff',
    borderColor: '#0f1f3d',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '1.25rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  emptyMsg: { color: '#718096', textAlign: 'center', padding: '2rem 0' },
  whatsappSection: {
    background: 'linear-gradient(135deg, #0a1628 0%, #0f1f3d 100%)',
    textAlign: 'center',
    padding: '3rem 1rem',
  },
  whatsappText: { fontSize: '1.1rem', color: '#c8d8ea', marginBottom: '1.25rem' },
  whatsappBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.8rem 2rem',
    backgroundColor: '#25D366',
    color: '#fff',
    borderRadius: '999px',
    fontWeight: 700,
    fontSize: '1rem',
    textDecoration: 'none',
    boxShadow: '0 4px 16px rgba(37,211,102,0.35)',
  },
};
