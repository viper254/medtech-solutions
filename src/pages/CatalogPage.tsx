import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase, mapProducts } from '../lib/supabaseClient';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORIES = ['All', 'Phones', 'Laptops', 'Desktops', 'Accessories', 'Medical Equipment'] as const;
type CategoryTab = (typeof CATEGORIES)[number];
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

interface CatalogPageProps {
  onAddToCart: (product: Product, quantity: number) => void;
}

export default function CatalogPage({ onAddToCart }: CatalogPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') as Product['category'] | null;

  const activeTab: CategoryTab =
    categoryParam && (CATEGORIES as readonly string[]).includes(categoryParam)
      ? categoryParam
      : 'All';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('grid');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [offersOnly, setOffersOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('products')
        .select('*, media:product_media(*)')
        .order('created_at', { ascending: false });

      if (activeTab !== 'All') {
        query = query.eq('category', activeTab);
      }

      const { data, error: fetchError } = await query;

      if (cancelled) return;

      if (fetchError) {
        setError('Failed to load products. Please try again.');
      } else {
        setProducts(mapProducts((data as Array<Record<string, unknown>>) ?? []));
      }
      setLoading(false);
    }

    fetchProducts();
    return () => { cancelled = true; };
  }, [activeTab]);

  function handleTabClick(tab: CategoryTab) {
    if (tab === 'All') {
      setSearchParams({});
    } else {
      setSearchParams({ category: tab });
    }
  }

  const min = minPrice !== '' ? parseFloat(minPrice) : null;
  const max = maxPrice !== '' ? parseFloat(maxPrice) : null;
  const now = Date.now();
  const filtered = products.filter((p) => {
    const offerActive = p.offer_price != null && p.offer_expires_at != null && new Date(p.offer_expires_at).getTime() > now;
    const effectivePrice = offerActive ? p.offer_price! : (p.discounted_price ?? p.original_price);
    const priceHigh = p.price_max ?? effectivePrice;
    // include if any part of the price range overlaps the filter range
    if (min !== null && priceHigh < min) return false;
    if (max !== null && effectivePrice > max) return false;
    if (offersOnly) {
      if (!offerActive) return false;
    }
    return true;
  });

  return (
    <main style={styles.page}>
      <h1 style={styles.heading}>Product Catalog</h1>

      {/* Category tabs + view toggle */}
      <div style={styles.toolbar}>
        <nav aria-label="Product categories" style={styles.tabs}>
          {CATEGORIES.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              style={{
                ...styles.tab,
                ...(activeTab === tab ? styles.tabActive : {}),
              }}
              aria-current={activeTab === tab ? 'page' : undefined}
            >
              {tab}
            </button>
          ))}
        </nav>
        <div style={styles.rightControls}>
          {/* Price range */}
          <div style={styles.priceRange}>
            <input
              type="number"
              min="0"
              placeholder="Min KSh"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              style={styles.priceInput}
              aria-label="Minimum price"
            />
            <span style={styles.priceSep}>–</span>
            <input
              type="number"
              min="0"
              placeholder="Max KSh"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              style={styles.priceInput}
              aria-label="Maximum price"
            />
            {(minPrice || maxPrice) && (
              <button
                onClick={() => { setMinPrice(''); setMaxPrice(''); }}
                style={styles.clearBtn}
                aria-label="Clear price filter"
              >
                ✕
              </button>
            )}
          </div>
          {/* Limited offers toggle */}
          <button
            onClick={() => setOffersOnly((v) => !v)}
            style={{ ...styles.offerToggle, ...(offersOnly ? styles.offerToggleActive : {}) }}
            aria-pressed={offersOnly}
          >
            🔥 Limited Offers
          </button>
          {/* View toggle */}
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
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p style={styles.message} role="alert">{error}</p>
      ) : filtered.length === 0 ? (
        <p style={styles.message}>
          {products.length === 0
            ? 'No products in this category yet.'
            : offersOnly
            ? 'No active limited offers in this category.'
            : 'No products match the selected price range.'}
        </p>
      ) : (
        <div style={view === 'list' ? styles.list : styles.grid} aria-label="Products">
          {filtered.map((product) => (
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
  page: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1.5rem 1rem',
  },
  heading: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#0f1f3d',
    marginBottom: '1rem',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  tabs: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
  },
  rightControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap' as const,
  },
  priceRange: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  priceInput: {
    width: '100px',
    padding: '0.35rem 0.6rem',
    fontSize: '0.82rem',
    border: '1px solid #dde3ec',
    borderRadius: '6px',
    color: '#0f1f3d',
    outline: 'none',
  },
  priceSep: {
    color: '#5a6a80',
    fontSize: '0.85rem',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#5a6a80',
    cursor: 'pointer',
    fontSize: '0.8rem',
    padding: '0 4px',
    lineHeight: 1,
  },
  tab: {
    padding: '0.4rem 1rem',
    borderRadius: '999px',
    border: '1px solid #dde3ec',
    backgroundColor: '#fff',
    color: '#5a6a80',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  tabActive: {
    backgroundColor: '#1d6fa4',
    color: '#fff',
    borderColor: '#1d6fa4',
  },
  viewToggle: {
    display: 'flex',
    gap: '4px',
  },
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
  message: {
    textAlign: 'center',
    color: '#718096',
    fontSize: '1rem',
    padding: '3rem 0',
  },
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
  offerToggleActive: {
    backgroundColor: '#c05621',
    color: '#fff',
    borderColor: '#c05621',
  },
};
