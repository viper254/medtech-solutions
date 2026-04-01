import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { ProductReview } from '../types';

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

function StarRating({ rating, interactive = false, onChange }: {
  rating: number;
  interactive?: boolean;
  onChange?: (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '2px' }} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            fontSize: '1.2rem',
            cursor: interactive ? 'pointer' : 'default',
            color: star <= (interactive ? (hovered || rating) : rating) ? '#f59e0b' : '#d1d5db',
            transition: 'color 0.1s',
          }}
          onClick={() => interactive && onChange?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          role={interactive ? 'button' : undefined}
          aria-label={interactive ? `Rate ${star} stars` : undefined}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReviews((data as ProductReview[]) ?? []);
        setLoading(false);
      });
  }, [productId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setFormError('Please enter your name.'); return; }
    if (rating === 0) { setFormError('Please select a rating.'); return; }
    setFormError(null);
    setSubmitting(true);

    const { error } = await supabase.from('product_reviews').insert({
      product_id: productId,
      reviewer_name: name.trim(),
      rating,
      comment: comment.trim() || null,
    });

    setSubmitting(false);
    if (error) {
      setFormError('Failed to submit review. Please try again.');
    } else {
      setSubmitted(true);
      setShowForm(false);
    }
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <section style={styles.section} aria-label="Product reviews">
      <div style={styles.header}>
        <div>
          <h2 style={styles.heading} className="section-heading-accent">Customer Reviews</h2>
          {reviews.length > 0 && (
            <div style={styles.avgRow}>
              <StarRating rating={Math.round(avgRating)} />
              <span style={styles.avgText}>{avgRating.toFixed(1)} out of 5 ({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>
        {!submitted && (
          <button style={styles.writeBtn} onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'Write a Review'}
          </button>
        )}
      </div>

      {/* Review form */}
      {showForm && (
        <div style={styles.formCard}>
          <p style={styles.formTitle}>Review: {productName}</p>
          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            <div style={styles.field}>
              <label style={styles.label}>Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                placeholder="e.g. John K."
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Rating</label>
              <StarRating rating={rating} interactive onChange={setRating} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Comment (optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{ ...styles.input, resize: 'vertical' }}
                rows={3}
                placeholder="Share your experience…"
              />
            </div>
            {formError && <p role="alert" style={styles.formError}>{formError}</p>}
            <button type="submit" disabled={submitting} style={styles.submitBtn}>
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}

      {submitted && (
        <div style={styles.successMsg}>
          Thank you for your review! It will appear after approval.
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <p style={styles.empty}>Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p style={styles.empty}>No reviews yet. Be the first to review this product.</p>
      ) : (
        <div style={styles.list}>
          {reviews.map((review) => (
            <div key={review.id} style={styles.reviewCard}>
              <div style={styles.reviewHeader}>
                <span style={styles.reviewerName}>{review.reviewer_name}</span>
                <StarRating rating={review.rating} />
                <span style={styles.reviewDate}>
                  {new Date(review.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              {review.comment && <p style={styles.reviewComment}>{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: { marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap' as const, gap: '0.75rem' },
  heading: { fontSize: '1.25rem', fontWeight: 700, color: '#0f1f3d', margin: '0 0 0.4rem' },
  avgRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  avgText: { fontSize: '0.875rem', color: '#5a6a80' },
  writeBtn: { padding: '0.5rem 1.1rem', backgroundColor: '#0f1f3d', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap' as const },
  formCard: { backgroundColor: '#f8fafc', border: '1px solid #dde3ec', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' },
  formTitle: { fontWeight: 700, color: '#0f1f3d', margin: '0 0 1rem', fontSize: '0.95rem' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '0.85rem' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: '0.35rem' },
  label: { fontSize: '0.875rem', fontWeight: 600, color: '#2d3748' },
  input: { padding: '0.55rem 0.75rem', fontSize: '0.9rem', border: '1px solid #dde3ec', borderRadius: '6px', color: '#2d3748', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const },
  formError: { color: '#b91c1c', fontSize: '0.82rem', margin: 0 },
  submitBtn: { padding: '0.6rem 1.25rem', backgroundColor: '#1d6fa4', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', alignSelf: 'flex-start' as const },
  successMsg: { backgroundColor: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: '8px', padding: '0.85rem 1rem', color: '#276749', fontSize: '0.9rem', fontWeight: 500, marginBottom: '1.25rem' },
  empty: { color: '#5a6a80', fontSize: '0.9rem', textAlign: 'center' as const, padding: '1.5rem 0' },
  list: { display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' },
  reviewCard: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem 1.25rem' },
  reviewHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' as const, marginBottom: '0.5rem' },
  reviewerName: { fontWeight: 700, fontSize: '0.9rem', color: '#0f1f3d' },
  reviewDate: { fontSize: '0.78rem', color: '#5a6a80', marginLeft: 'auto' },
  reviewComment: { fontSize: '0.875rem', color: '#4a5568', margin: 0, lineHeight: 1.5 },
};
