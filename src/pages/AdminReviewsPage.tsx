import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from '../components/LoadingSpinner';
import type { ProductReview } from '../types';

type Toast = { type: 'success' | 'error'; message: string };

interface ReviewWithProduct extends ProductReview {
  product_name?: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');

  useEffect(() => { fetchReviews(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchReviews() {
    setLoading(true);
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*, products(name)')
      .order('created_at', { ascending: false });

    if (error) {
      setToast({ type: 'error', message: 'Failed to load reviews.' });
    } else {
      setReviews((data ?? []).map((r: Record<string, unknown>) => ({
        ...(r as unknown as ProductReview),
        product_name: (r.products as { name: string } | null)?.name,
      })));
    }
    setLoading(false);
  }

  async function approve(id: string) {
    const { error } = await supabase.from('product_reviews').update({ is_approved: true }).eq('id', id);
    if (error) { setToast({ type: 'error', message: 'Failed to approve.' }); return; }
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, is_approved: true } : r));
    setToast({ type: 'success', message: 'Review approved.' });
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this review?')) return;
    const { error } = await supabase.from('product_reviews').delete().eq('id', id);
    if (error) { setToast({ type: 'error', message: 'Failed to delete.' }); return; }
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setToast({ type: 'success', message: 'Review deleted.' });
  }

  const filtered = reviews.filter((r) =>
    filter === 'all' ? true : filter === 'pending' ? !r.is_approved : r.is_approved
  );

  const pendingCount = reviews.filter((r) => !r.is_approved).length;

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.heading}>Reviews</h1>
            {pendingCount > 0 && <p style={styles.pendingNote}>{pendingCount} pending approval</p>}
          </div>
          <Link to="/admin" style={styles.backBtn}>← Dashboard</Link>
        </div>

        {toast && (
          <div role="alert" style={{ ...styles.toast, ...(toast.type === 'success' ? styles.toastSuccess : styles.toastError) }}>
            {toast.message}
          </div>
        )}

        <div style={styles.tabs}>
          {(['pending', 'approved', 'all'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ ...styles.tab, ...(filter === f ? styles.tabActive : {}) }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <p style={styles.empty}>No reviews found.</p>
        ) : (
          <div style={styles.list}>
            {filtered.map((review) => (
              <div key={review.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <span style={styles.reviewer}>{review.reviewer_name}</span>
                    <span style={styles.stars}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                    {review.product_name && <span style={styles.productName}>{review.product_name}</span>}
                  </div>
                  <span style={styles.date}>{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                {review.comment && <p style={styles.comment}>{review.comment}</p>}
                <div style={styles.actions}>
                  {!review.is_approved && (
                    <button onClick={() => approve(review.id)} style={styles.approveBtn}>Approve</button>
                  )}
                  {review.is_approved && <span style={styles.approvedBadge}>Approved</span>}
                  <button onClick={() => remove(review.id)} style={styles.deleteBtn}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '2rem 1rem' },
  container: { maxWidth: '800px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' as const },
  heading: { fontSize: '1.6rem', fontWeight: 700, color: '#0f1f3d', margin: '0 0 0.2rem' },
  pendingNote: { fontSize: '0.875rem', color: '#b91c1c', margin: 0, fontWeight: 600 },
  backBtn: { padding: '0.5rem 1rem', backgroundColor: '#fff', border: '1px solid #dde3ec', borderRadius: '6px', color: '#0f1f3d', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' },
  toast: { padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: 500 },
  toastSuccess: { backgroundColor: '#f0fff4', border: '1px solid #9ae6b4', color: '#276749' },
  toastError: { backgroundColor: '#fff5f5', border: '1px solid #feb2b2', color: '#b91c1c' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' },
  tab: { padding: '0.4rem 1rem', borderRadius: '999px', border: '1px solid #dde3ec', backgroundColor: '#fff', color: '#5a6a80', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' },
  tabActive: { backgroundColor: '#0f1f3d', color: '#fff', borderColor: '#0f1f3d' },
  empty: { textAlign: 'center' as const, color: '#5a6a80', padding: '3rem 0' },
  list: { display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' },
  card: { backgroundColor: '#fff', border: '1px solid #dde3ec', borderRadius: '10px', padding: '1rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap' as const, gap: '0.5rem' },
  reviewer: { fontWeight: 700, fontSize: '0.9rem', color: '#0f1f3d', marginRight: '0.5rem' },
  stars: { color: '#f59e0b', fontSize: '0.9rem', marginRight: '0.5rem' },
  productName: { fontSize: '0.78rem', color: '#5a6a80', backgroundColor: '#f0f4f8', padding: '1px 6px', borderRadius: '4px' },
  date: { fontSize: '0.78rem', color: '#5a6a80' },
  comment: { fontSize: '0.875rem', color: '#4a5568', margin: '0 0 0.75rem', lineHeight: 1.5 },
  actions: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  approveBtn: { padding: '0.35rem 0.85rem', backgroundColor: '#1d6fa4', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
  approvedBadge: { fontSize: '0.78rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', backgroundColor: '#d1fae5', color: '#065f46' },
  deleteBtn: { padding: '0.35rem 0.85rem', backgroundColor: '#fff', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '5px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
};
