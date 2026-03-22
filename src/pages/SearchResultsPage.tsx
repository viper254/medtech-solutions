import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase, mapProducts } from '../lib/supabaseClient';
import { searchProducts } from '../utils/search';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
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

interface SearchResultsPageProps {
  onAddToCart: (product: Product, quantity: number) => void;
}

export default function SearchResultsPage({ onAddToCart }: SearchResultsPageProps) {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('grid');
  const [offersOnly, setOffersOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchAndFilter() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*, media:product_media(*)')
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (fetchError) {
        setError('Failed to load products. Please try again.');
      } else {
        const mapped = mapProducts((data as Array<Record<string, unknown>>) ?? []);
        setResults(searchProducts(mapped, query));
      }
      setLoading(false);
    }

    fetchAndFilter();
    return () => { cancelled = true; };
  }, [query]);

  const now = Date.now();
  const displayed = offersOnly
    ? results.filter(
        (p) =>
          p.offer_price != null &&
          p.offer_expires_at != null &&
          new Date(p.offer_expires_at).getTime() > now
      )
    : results;

  return (
    <main style={styles.page}>
      <div style={styles.toolbar}>
        <h1 style={styles.heading}>
          Results for &ldquo;{query}&rdquo;
          {!loading && displayed.length > 0 && (
            <span style={styles.count}> — {displayed.length} found</span>
          )}
        </h1>
        {results.length > 0 && (
          <div style={styles.rightControls}>
            <button
              onClick={() => setOffersOnly((v) => !v)}
              style={{ ...styles.offerToggle, ...(offersOnly ? styles.offerToggleActive : {}) }}
              aria-pressed={offersOnly}
            >
              🔥 Limited Offers
            </button>
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
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p style={styles.message} role="alert">{error}</p>
      ) : displayed.length === 0 ? (
        <p style={styles.message}>
          {offersOnly
            ? 'No active limited offers match your search.'
            : <>
                No results for &ldquo;{query}&rdquo;.{' '}
                <a
                  href="https://wa.me/254793636022"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.waLink}
                >
                  Contact us on WhatsApp
                </a>{' '}
                and we&apos;ll help you find it.
              </>
          }
        </p>
      ) : (
        <div style={view === 'list' ? styles.list : styles.grid} aria-label="Search results">
          {displayed.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              view={view}
            />
          ))}
        </div>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' },
  toolbar: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  heading: { fontSize: '1.5rem', fontWeight: 700, color: '#0f1f3d', margin: 0 },
  count: { fontSize: '1rem', fontWeight: 400, color: '#5a6a80' },
  rightControls: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' as const },
  offerToggle: {
    padding: '0.35rem 0.85rem',
    borderRadius: '999px',
    border: '1px solid #dde3ec',
    backgroundColor: '#fff',
    color: '#5a6a80',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  offerToggleActive: { backgroundColor: '#c05621', color: '#fff', borderColor: '#c05621' },
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
  },
  viewBtnActive: { backgroundColor: '#0f1f3d', color: '#fff', borderColor: '#0f1f3d' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' },
  list: { display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' },
  message: { textAlign: 'center', color: '#718096', fontSize: '1rem', padding: '3rem 0' },
  waLink: { color: '#25d366', fontWeight: 600, textDecoration: 'underline' },
};
