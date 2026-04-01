import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, mapMediaUrls } from '../lib/supabaseClient';
import LoadingSpinner from '../components/LoadingSpinner';
import type { MediaItem, Product } from '../types';
import { validateProductForm } from '../utils/adminFormValidation';
import type { ProductFormErrors } from '../utils/adminFormValidation';

type Category = Product['category'];
const CATEGORIES: Category[] = ['Phones', 'Laptops', 'Desktops', 'Accessories', 'Medical Equipment'];

interface FormValues {
  name: string;
  category: Category | '';
  description: string;
  original_price: string;
  discounted_price: string;
  price_max: string;
  offer_price: string;
  offer_expires_at: string;
  stock_quantity: string;
  is_featured: boolean;
  low_stock_threshold: string;
}

type FormErrors = ProductFormErrors;

interface NewMediaFile {
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
}

const INITIAL_VALUES: FormValues = {
  name: '',
  category: '',
  description: '',
  original_price: '',
  discounted_price: '',
  price_max: '',
  offer_price: '',
  offer_expires_at: '',
  stock_quantity: '',
  is_featured: false,
  low_stock_threshold: '5',
};

export default function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [existingMedia, setExistingMedia] = useState<MediaItem[]>([]);
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<NewMediaFile[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing product in edit mode
  useEffect(() => {
    if (!isEdit || !id) return;

    async function fetchProduct() {
      const { data, error } = await supabase
        .from('products')
        .select('*, media:product_media(*)')
        .eq('id', id)
        .single();

      if (error || !data) {
        setSaveError('Failed to load product.');
        setLoading(false);
        return;
      }

      const product = data as Product;
      setValues({
        name: product.name,
        category: product.category,
        description: product.description,
        original_price: String(product.original_price),
        discounted_price: product.discounted_price != null ? String(product.discounted_price) : '',
        price_max: product.price_max != null ? String(product.price_max) : '',
        offer_price: product.offer_price != null ? String(product.offer_price) : '',
        offer_expires_at: product.offer_expires_at
          ? new Date(product.offer_expires_at).toISOString().slice(0, 16)
          : '',
        stock_quantity: String(product.stock_quantity),
        is_featured: product.is_featured ?? false,
        low_stock_threshold: String(product.low_stock_threshold ?? 5),
      });
      setExistingMedia(mapMediaUrls((product.media as unknown as Array<Record<string, unknown>>) ?? []));
      setLoading(false);
    }

    fetchProduct();
  }, [id, isEdit]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      newFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
  }, [newFiles]);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const mapped: NewMediaFile[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
    }));

    setNewFiles((prev) => [...prev, ...mapped]);
    setErrors((prev) => ({ ...prev, media: undefined }));
    // Reset input so same file can be re-added if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeNewFile(index: number) {
    setNewFiles((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  function removeExistingMedia(mediaId: string) {
    setExistingMedia((prev) => prev.filter((m) => m.id !== mediaId));
    setRemovedMediaIds((prev) => [...prev, mediaId]);
  }

  function validate(): FormErrors {
    const hasExistingImage = existingMedia.some((m) => m.type === 'image');
    const hasNewImage = newFiles.some((f) => f.type === 'image');
    return validateProductForm(values, hasExistingImage || hasNewImage);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveError(null);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);

    try {
      const origPrice = parseFloat(values.original_price);
      const discPrice = values.discounted_price !== '' ? parseFloat(values.discounted_price) : null;
      const priceMax = values.price_max !== '' ? parseFloat(values.price_max) : null;
      const offerPrice = values.offer_price !== '' ? parseFloat(values.offer_price) : null;
      const offerExpiresAt = values.offer_expires_at !== '' ? new Date(values.offer_expires_at).toISOString() : null;
      const stockQty = parseInt(values.stock_quantity, 10);

      // Upsert product row
      const productPayload = {
        ...(isEdit && id ? { id } : {}),
        name: values.name.trim(),
        category: values.category as Category,
        description: values.description.trim(),
        original_price: origPrice,
        discounted_price: discPrice,
        price_max: discPrice !== null ? null : priceMax,
        offer_price: offerPrice,
        offer_expires_at: offerExpiresAt,
        stock_quantity: stockQty,
        is_featured: values.is_featured,
        low_stock_threshold: values.low_stock_threshold !== '' ? parseInt(values.low_stock_threshold, 10) : 5,
      };

      const { data: upserted, error: upsertError } = await supabase
        .from('products')
        .upsert(productPayload)
        .select('id')
        .single();

      if (upsertError || !upserted) {
        throw new Error(upsertError?.message ?? 'Failed to save product.');
      }

      const productId: string = upserted.id;

      // Delete removed existing media
      if (removedMediaIds.length > 0) {
        // Fetch storage_path for each removed media row so we can delete from storage too
        const { data: removedRows } = await supabase
          .from('product_media')
          .select('id, storage_path')
          .in('id', removedMediaIds);

        // Delete DB rows
        const { error: deleteError } = await supabase
          .from('product_media')
          .delete()
          .in('id', removedMediaIds);
        if (deleteError) throw new Error(deleteError.message);

        // Delete storage objects
        if (removedRows && removedRows.length > 0) {
          const paths = removedRows.map((r: { storage_path: string }) => r.storage_path);
          await supabase.storage.from('product-media').remove(paths);
        }
      }

      // Upload new media files and insert product_media rows
      if (newFiles.length > 0) {
        const nextSortOrder = existingMedia.length;

        for (let i = 0; i < newFiles.length; i++) {
          const { file, type } = newFiles[i];
          const ext = file.name.split('.').pop() ?? 'bin';
          const storagePath = `${productId}/${Date.now()}-${i}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from('product-media')
            .upload(storagePath, file, { upsert: false });

          if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);

          const { error: mediaInsertError } = await supabase.from('product_media').insert({
            product_id: productId,
            storage_path: storagePath,
            type,
            sort_order: nextSortOrder + i,
          });

          if (mediaInsertError) throw new Error(mediaInsertError.message);
        }
      }

      navigate('/admin');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.heading}>{isEdit ? 'Edit Product' : 'New Product'}</h1>

        {saveError && (
          <div role="alert" style={styles.alertError}>
            {saveError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          {/* Name */}
          <Field label="Name" htmlFor="name" error={errors.name}>
            <input
              id="name"
              name="name"
              type="text"
              value={values.name}
              onChange={handleChange}
              style={fieldInputStyle(!!errors.name)}
              placeholder="e.g. Samsung Galaxy A55"
            />
          </Field>

          {/* Category */}
          <Field label="Category" htmlFor="category" error={errors.category}>
            <select
              id="category"
              name="category"
              value={values.category}
              onChange={handleChange}
              style={fieldInputStyle(!!errors.category)}
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          {/* Description */}
          <Field label="Description" htmlFor="description" error={errors.description}>
            <textarea
              id="description"
              name="description"
              value={values.description}
              onChange={handleChange}
              rows={4}
              style={{ ...fieldInputStyle(!!errors.description), resize: 'vertical' }}
              placeholder="Product description…"
            />
          </Field>

          {/* Prices */}
          <div style={styles.row} className="admin-price-row">
            <Field label="Original Price (KES)" htmlFor="original_price" error={errors.original_price}>
              <input
                id="original_price"
                name="original_price"
                type="number"
                min="0.01"
                step="0.01"
                value={values.original_price}
                onChange={handleChange}
                style={fieldInputStyle(!!errors.original_price)}
                placeholder="e.g. 45000"
              />
            </Field>

            <Field
              label="Discounted Price (KES) — optional"
              htmlFor="discounted_price"
              error={errors.discounted_price}
            >
              <input
                id="discounted_price"
                name="discounted_price"
                type="number"
                min="0.01"
                step="0.01"
                value={values.discounted_price}
                onChange={handleChange}
                style={fieldInputStyle(!!errors.discounted_price)}
                placeholder="Leave blank if no discount"
              />
            </Field>
          </div>

          {/* Price max — only shown when no discount */}
          {values.discounted_price === '' && (
            <Field
              label="Max Price (KES) — optional, for price ranges e.g. KSh 30,000 – 45,000"
              htmlFor="price_max"
              style={{ maxWidth: '340px' }}
            >
              <input
                id="price_max"
                name="price_max"
                type="number"
                min="0.01"
                step="0.01"
                value={values.price_max}
                onChange={handleChange}
                style={fieldInputStyle(false)}
                placeholder="Leave blank for fixed price"
              />
            </Field>
          )}

          {/* Limited-time offer */}
          <div style={{ ...styles.row, gridTemplateColumns: '1fr 1fr' }} className="admin-price-row">
            <Field label="Offer Price (KES) — optional" htmlFor="offer_price">
              <input
                id="offer_price"
                name="offer_price"
                type="number"
                min="0.01"
                step="0.01"
                value={values.offer_price}
                onChange={handleChange}
                style={fieldInputStyle(false)}
                placeholder="e.g. 25000"
              />
            </Field>
            <Field label="Offer Expires At — optional" htmlFor="offer_expires_at">
              <input
                id="offer_expires_at"
                name="offer_expires_at"
                type="datetime-local"
                value={values.offer_expires_at}
                onChange={handleChange}
                style={fieldInputStyle(false)}
              />
            </Field>
          </div>

          {/* Stock */}
          <Field label="Stock Quantity" htmlFor="stock_quantity" error={errors.stock_quantity} style={{ maxWidth: '220px' }}>            <input
              id="stock_quantity"
              name="stock_quantity"
              type="number"
              min="0"
              step="1"
              value={values.stock_quantity}
              onChange={handleChange}
              style={fieldInputStyle(!!errors.stock_quantity)}
              placeholder="e.g. 10"
            />
          </Field>

          {/* Featured + Low stock threshold */}
          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={values.is_featured}
                  onChange={handleChange}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                Feature this product on the homepage
              </label>
            </div>
            <Field label="Low Stock Warning (units)" htmlFor="low_stock_threshold">
              <input
                id="low_stock_threshold"
                name="low_stock_threshold"
                type="number"
                min="0"
                step="1"
                value={values.low_stock_threshold}
                onChange={handleChange}
                style={fieldInputStyle(false)}
                placeholder="e.g. 5"
              />
            </Field>
          </div>

          {/* Media */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Media <span style={styles.hint}>(images and videos)</span>
            </label>

            {/* Existing media thumbnails (edit mode) */}
            {existingMedia.length > 0 && (
              <div style={styles.mediaGrid}>
                {existingMedia.map((m) => (
                  <div key={m.id} style={styles.mediaTile}>
                    {m.type === 'image' ? (
                      <img src={m.url} alt="Existing product media" style={styles.mediaTileImg} loading="lazy" />
                    ) : (
                      <video src={m.url} style={styles.mediaTileImg} muted />
                    )}
                    <button
                      type="button"
                      onClick={() => removeExistingMedia(m.id)}
                      style={styles.removeTileBtn}
                      aria-label="Remove this media"
                    >
                      ✕
                    </button>
                    <span style={styles.mediaTileLabel}>{m.type}</span>
                  </div>
                ))}
              </div>
            )}

            {/* New file previews */}
            {newFiles.length > 0 && (
              <div style={styles.mediaGrid}>
                {newFiles.map((f, i) => (
                  <div key={i} style={styles.mediaTile}>
                    {f.type === 'image' ? (
                      <img src={f.previewUrl} alt={`New upload ${i + 1}`} style={styles.mediaTileImg} />
                    ) : (
                      <video src={f.previewUrl} style={styles.mediaTileImg} muted />
                    )}
                    <button
                      type="button"
                      onClick={() => removeNewFile(i)}
                      style={styles.removeTileBtn}
                      aria-label={`Remove file ${f.file.name}`}
                    >
                      ✕
                    </button>
                    <span style={styles.mediaTileLabel}>{f.type}</span>
                  </div>
                ))}
              </div>
            )}

            <label htmlFor="media-upload" style={styles.uploadLabel}>
              + Add files
              <input
                id="media-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                style={styles.hiddenInput}
              />
            </label>

            {errors.media && (
              <p role="alert" style={styles.errorText}>
                {errors.media}
              </p>
            )}
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              style={styles.cancelBtn}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ ...styles.saveBtn, ...(saving ? styles.saveBtnDisabled : {}) }}
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

// ── Helper components ──────────────────────────────────────────────────────────

function Field({
  label,
  htmlFor,
  error,
  children,
  style,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ ...styles.fieldGroup, ...style }}>
      <label htmlFor={htmlFor} style={styles.label}>
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" style={styles.errorText}>
          {error}
        </p>
      )}
    </div>
  );
}

function fieldInputStyle(hasError: boolean): React.CSSProperties {
  return {
    ...styles.input,
    ...(hasError ? styles.inputError : {}),
  };
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    padding: '2rem 1rem',
  },
  container: {
    maxWidth: '760px',
    margin: '0 auto',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.09)',
    padding: '2rem',
  },
  heading: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#0f1f3d',
    marginBottom: '1.75rem',
  },
  alertError: {
    backgroundColor: '#fff5f5',
    border: '1px solid #feb2b2',
    color: '#c53030',
    borderRadius: '6px',
    padding: '0.75rem 1rem',
    marginBottom: '1.25rem',
    fontSize: '0.9rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#2d3748',
  },
  hint: {
    fontWeight: 400,
    color: '#718096',
    fontSize: '0.85rem',
  },
  input: {
    padding: '0.6rem 0.75rem',
    fontSize: '0.95rem',
    border: '1px solid #cbd5e0',
    borderRadius: '6px',
    color: '#2d3748',
    width: '100%',
    boxSizing: 'border-box' as const,
    outline: 'none',
  },
  inputError: {
    borderColor: '#fc8181',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#c53030',
    fontSize: '0.8rem',
    margin: 0,
  },
  mediaGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.75rem',
    marginBottom: '0.5rem',
  },
  mediaTile: {
    position: 'relative' as const,
    width: '100px',
    height: '100px',
    borderRadius: '6px',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f7fafc',
  },
  mediaTileImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  mediaTileLabel: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    color: '#fff',
    fontSize: '0.7rem',
    textAlign: 'center' as const,
    padding: '2px 0',
  },
  removeTileBtn: {
    position: 'absolute' as const,
    top: '3px',
    right: '3px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0,0,0,0.55)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.65rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  uploadLabel: {
    display: 'inline-block',
    padding: '0.5rem 1rem',
    backgroundColor: '#e8f2fa',
    border: '1px dashed #1d6fa4',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: '#1d6fa4',
    fontWeight: 600,
    alignSelf: 'flex-start',
  },
  hiddenInput: {
    display: 'none',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  cancelBtn: {
    padding: '0.6rem 1.25rem',
    backgroundColor: '#fff',
    color: '#4a5568',
    border: '1px solid #cbd5e0',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '0.6rem 1.5rem',
    backgroundColor: '#1d6fa4',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
  saveBtnDisabled: {
    backgroundColor: '#7aaec8',
    cursor: 'not-allowed',
  },
};
