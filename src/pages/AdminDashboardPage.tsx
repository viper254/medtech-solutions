import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, mapProducts } from '../lib/supabaseClient';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Product } from '../types';

type Toast = { type: 'success' | 'error'; message: string };

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    // Check if current user is super admin
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data } = await supabase
        .from('admins')
        .select('is_super_admin')
        .eq('user_id', session.user.id)
        .single();
      setIsSuperAdmin((data as { is_super_admin: boolean } | null)?.is_super_admin ?? false);
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, media:product_media(*)')
      .order('created_at', { ascending: false });

    if (error) {
      setToast({ type: 'error', message: 'Failed to load products.' });
    } else {
      setProducts(mapProducts((data as Array<Record<string, unknown>>) ?? []));
    }
    setLoading(false);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    navigate('/admin/login');
  }

  // Stats
  const totalProducts = products.length;
  const outOfStock = products.filter((p) => p.stock_quantity === 0).length;
  const categoryCounts = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    const { error } = await supabase.from('products').delete().eq('id', product.id);

    if (error) {
      setToast({ type: 'error', message: `Failed to delete "${product.name}".` });
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setToast({ type: 'success', message: `"${product.name}" was deleted successfully.` });
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.heading}>Admin Dashboard</h1>
          <div style={styles.headerActions}>
            <Link to="/admin/repairs" style={styles.repairsBtn}>
              Repair Services
            </Link>
            {isSuperAdmin && (
              <Link to="/admin/manage" style={styles.repairsBtn}>
                Manage Admins
              </Link>
            )}
            <Link to="/admin/products/new" style={styles.newBtn}>
              + New Product
            </Link>
            <button onClick={handleSignOut} disabled={signingOut} style={styles.signOutBtn}>
              {signingOut ? 'Signing out…' : 'Sign Out'}
            </button>
          </div>
        </div>

        {/* Stats */}
        {!loading && (
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <span style={styles.statValue}>{totalProducts}</span>
              <span style={styles.statLabel}>Total Products</span>
            </div>
            <div style={{ ...styles.statCard, ...(outOfStock > 0 ? styles.statCardWarn : {}) }}>
              <span style={styles.statValue}>{outOfStock}</span>
              <span style={styles.statLabel}>Out of Stock</span>
            </div>
            {Object.entries(categoryCounts).map(([cat, count]) => (
              <div key={cat} style={styles.statCard}>
                <span style={styles.statValue}>{count}</span>
                <span style={styles.statLabel}>{cat}</span>
              </div>
            ))}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div
            role="alert"
            style={{
              ...styles.toast,
              ...(toast.type === 'success' ? styles.toastSuccess : styles.toastError),
            }}
          >
            {toast.message}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <LoadingSpinner />
        ) : products.length === 0 ? (
          <p style={styles.empty}>No products found. Add your first product.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Price (KES)</th>
                  <th style={styles.th}>Stock</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} style={styles.tr}>
                    <td style={styles.td}>{product.name}</td>
                    <td style={styles.td}>{product.category}</td>
                    <td style={styles.td}>
                      {product.offer_price != null && product.offer_expires_at != null && new Date(product.offer_expires_at).getTime() > Date.now() ? (
                        <>
                          <span style={styles.strikethrough}>{product.original_price.toLocaleString()}</span>{' '}
                          <span style={{ ...styles.discounted, color: '#c05621' }}>{product.offer_price.toLocaleString()}</span>
                          <span style={{ fontSize: '0.75rem', color: '#c05621', marginLeft: '4px' }}>[Offer]</span>
                        </>
                      ) : product.discounted_price != null ? (
                        <>
                          <span style={styles.strikethrough}>{product.original_price.toLocaleString()}</span>{' '}
                          <span style={styles.discounted}>{product.discounted_price.toLocaleString()}</span>
                        </>
                      ) : product.price_max != null ? (
                        <span>{product.original_price.toLocaleString()} – {product.price_max.toLocaleString()}</span>
                      ) : (
                        product.original_price.toLocaleString()
                      )}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.stockBadge,
                          ...(product.stock_quantity === 0 ? styles.outOfStock : styles.inStock),
                        }}
                      >
                        {product.stock_quantity === 0 ? 'Out of Stock' : product.stock_quantity}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <Link
                        to={`/admin/products/${product.id}/edit`}
                        style={styles.editBtn}
                        aria-label={`Edit ${product.name}`}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product)}
                        style={styles.deleteBtn}
                        aria-label={`Delete ${product.name}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    padding: '2rem 1rem',
  },
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap' as const,
  },
  repairsBtn: {
    backgroundColor: '#fff',
    color: '#1d6fa4',
    border: '1px solid #1d6fa4',
    padding: '0.55rem 1.1rem',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '0.95rem',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  heading: {
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#0f1f3d',
    margin: 0,
  },
  newBtn: {
    backgroundColor: '#1d6fa4',
    color: '#fff',
    padding: '0.55rem 1.1rem',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '0.95rem',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  toast: {
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    marginBottom: '1.25rem',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  toastSuccess: {
    backgroundColor: '#f0fff4',
    border: '1px solid #9ae6b4',
    color: '#276749',
  },
  toastError: {
    backgroundColor: '#fff5f5',
    border: '1px solid #feb2b2',
    color: '#c53030',
  },
  empty: {
    textAlign: 'center',
    color: '#718096',
    marginTop: '3rem',
    fontSize: '1rem',
  },
  tableWrapper: {
    overflowX: 'auto',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  th: {
    padding: '0.85rem 1rem',
    textAlign: 'left',
    fontWeight: 600,
    color: '#2d3748',
    borderBottom: '2px solid #e2e8f0',
    backgroundColor: '#f7fafc',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #e2e8f0',
  },
  td: {
    padding: '0.8rem 1rem',
    color: '#2d3748',
    verticalAlign: 'middle',
  },
  strikethrough: {
    textDecoration: 'line-through',
    color: '#a0aec0',
    fontSize: '0.85rem',
  },
  discounted: {
    color: '#1d6fa4',
    fontWeight: 600,
  },
  stockBadge: {
    display: 'inline-block',
    padding: '0.2rem 0.55rem',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  inStock: {
    backgroundColor: '#f0fff4',
    color: '#276749',
  },
  outOfStock: {
    backgroundColor: '#fff5f5',
    color: '#c53030',
  },
  signOutBtn: {
    padding: '0.55rem 1.1rem',
    backgroundColor: '#fff',
    color: '#b91c1c',
    border: '1px solid #fca5a5',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  statsRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  statCard: {
    backgroundColor: '#fff',
    border: '1px solid #dde3ec',
    borderRadius: '8px',
    padding: '0.85rem 1.25rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.2rem',
    minWidth: '110px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  statCardWarn: {
    borderColor: '#fca5a5',
    backgroundColor: '#fff5f5',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#0f1f3d',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#5a6a80',
    fontWeight: 500,
  },
    display: 'inline-block',
    padding: '0.35rem 0.8rem',
    backgroundColor: '#1d6fa4',
    color: '#fff',
    borderRadius: '5px',
    fontWeight: 600,
    fontSize: '0.85rem',
    textDecoration: 'none',
    marginRight: '0.5rem',
  },
  deleteBtn: {
    padding: '0.35rem 0.8rem',
    backgroundColor: '#fff',
    color: '#c53030',
    border: '1px solid #fc8181',
    borderRadius: '5px',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
};
