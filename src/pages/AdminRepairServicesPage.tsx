import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { mapRepairMedia } from '../lib/supabaseClient';
import LoadingSpinner from '../components/LoadingSpinner';
import type { RepairService, RepairMediaItem } from '../types';

type Toast = { type: 'success' | 'error'; message: string };

interface FormState {
  name: string;
  description: string;
  estimated_turnaround: string;
}

interface NewFile {
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
}

const EMPTY: FormState = { name: '', description: '', estimated_turnaround: '' };

export default function AdminRepairServicesPage() {
  const [services, setServices] = useState<RepairService[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [existingMedia, setExistingMedia] = useState<RepairMediaItem[]>([]);
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<NewFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchServices(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    return () => { newFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl)); };
  }, [newFiles]);

  async function fetchServices() {
    setLoading(true);
    const { data, error } = await supabase
      .from('repair_services')
      .select('*, media:repair_service_media(*)')
      .order('name');
    if (error) {
      setToast({ type: 'error', message: 'Failed to load services.' });
    } else {
      const mapped = (data ?? []).map((s: Record<string, unknown>) => ({
        ...(s as unknown as RepairService),
        media: mapRepairMedia((s.media as Array<Record<string, unknown>>) ?? []),
      }));
      setServices(mapped);
    }
    setLoading(false);
  }

  function startEdit(service: RepairService) {
    setEditingId(service.id);
    setForm({ name: service.name, description: service.description, estimated_turnaround: service.estimated_turnaround });
    setExistingMedia(service.media ?? []);
    setRemovedMediaIds([]);
    setNewFiles([]);
    setFormError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
    setExistingMedia([]);
    setRemovedMediaIds([]);
    setNewFiles([]);
    setFormError(null);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const mapped: NewFile[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
    }));
    setNewFiles((prev) => [...prev, ...mapped]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeNewFile(i: number) {
    setNewFiles((prev) => {
      URL.revokeObjectURL(prev[i].previewUrl);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  function removeExistingMedia(id: string) {
    setExistingMedia((prev) => prev.filter((m) => m.id !== id));
    setRemovedMediaIds((prev) => [...prev, id]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim() || !form.description.trim() || !form.estimated_turnaround.trim()) {
      setFormError('All fields are required.');
      return;
    }
    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        estimated_turnaround: form.estimated_turnaround.trim(),
      };

      let serviceId = editingId;

      if (editingId) {
        const { error } = await supabase.from('repair_services').update(payload).eq('id', editingId);
        if (error) throw new Error(error.message);
      } else {
        const { data, error } = await supabase.from('repair_services').insert(payload).select('id').single();
        if (error || !data) throw new Error(error?.message ?? 'Failed to create service.');
        serviceId = (data as { id: string }).id;
      }

      // Delete removed media
      if (removedMediaIds.length > 0) {
        const { data: removedRows } = await supabase
          .from('repair_service_media')
          .select('storage_path')
          .in('id', removedMediaIds);
        await supabase.from('repair_service_media').delete().in('id', removedMediaIds);
        if (removedRows?.length) {
          await supabase.storage.from('product-media').remove(
            (removedRows as { storage_path: string }[]).map((r) => r.storage_path)
          );
        }
      }

      // Upload new files
      if (newFiles.length > 0 && serviceId) {
        const nextSort = existingMedia.length;
        for (let i = 0; i < newFiles.length; i++) {
          const { file, type } = newFiles[i];
          const ext = file.name.split('.').pop() ?? 'bin';
          const storagePath = `repairs/${serviceId}/${Date.now()}-${i}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from('product-media')
            .upload(storagePath, file, { upsert: false });
          if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);
          await supabase.from('repair_service_media').insert({
            service_id: serviceId,
            storage_path: storagePath,
            type,
            sort_order: nextSort + i,
          });
        }
      }

      setToast({ type: 'success', message: editingId ? 'Service updated.' : 'Service added.' });
      cancelEdit();
      fetchServices();
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(service: RepairService) {
    if (!window.confirm(`Delete "${service.name}"?`)) return;
    const { error } = await supabase.from('repair_services').delete().eq('id', service.id);
    if (error) {
      setToast({ type: 'error', message: 'Failed to delete service.' });
    } else {
      setServices((prev) => prev.filter((s) => s.id !== service.id));
      setToast({ type: 'success', message: `"${service.name}" deleted.` });
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.heading}>Repair Services</h1>

        {toast && (
          <div role="alert" style={{ ...styles.toast, ...(toast.type === 'success' ? styles.toastSuccess : styles.toastError) }}>
            {toast.message}
          </div>
        )}

        {/* Form */}
        <div style={styles.formCard}>
          <h2 style={styles.formHeading}>{editingId ? 'Edit Service' : 'Add New Service'}</h2>
          <form onSubmit={handleSubmit} noValidate style={styles.form}>
            <div style={styles.field}>
              <label htmlFor="svc-name" style={styles.label}>Service Name</label>
              <input id="svc-name" style={styles.input} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Screen Replacement" />
            </div>
            <div style={styles.field}>
              <label htmlFor="svc-desc" style={styles.label}>Description</label>
              <textarea id="svc-desc" style={{ ...styles.input, resize: 'vertical' }} rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description of the service" />
            </div>
            <div style={styles.field}>
              <label htmlFor="svc-turnaround" style={styles.label}>Estimated Turnaround</label>
              <input id="svc-turnaround" style={styles.input} value={form.estimated_turnaround} onChange={(e) => setForm((p) => ({ ...p, estimated_turnaround: e.target.value }))} placeholder="e.g. 1–2 hours" />
            </div>

            {/* Media */}
            <div style={styles.field}>
              <label style={styles.label}>Photos / Videos (optional)</label>

              {existingMedia.length > 0 && (
                <div style={styles.mediaGrid}>
                  {existingMedia.map((m) => (
                    <div key={m.id} style={styles.mediaTile}>
                      {m.type === 'image'
                        ? <img src={m.url} alt="Service media" style={styles.mediaTileImg} loading="lazy" />
                        : <video src={m.url} style={styles.mediaTileImg} muted />
                      }
                      <button type="button" onClick={() => removeExistingMedia(m.id)} style={styles.removeTileBtn} aria-label="Remove">✕</button>
                    </div>
                  ))}
                </div>
              )}

              {newFiles.length > 0 && (
                <div style={styles.mediaGrid}>
                  {newFiles.map((f, i) => (
                    <div key={i} style={styles.mediaTile}>
                      {f.type === 'image'
                        ? <img src={f.previewUrl} alt={`New ${i + 1}`} style={styles.mediaTileImg} />
                        : <video src={f.previewUrl} style={styles.mediaTileImg} muted />
                      }
                      <button type="button" onClick={() => removeNewFile(i)} style={styles.removeTileBtn} aria-label="Remove">✕</button>
                    </div>
                  ))}
                </div>
              )}

              <label htmlFor="repair-media-upload" style={styles.uploadLabel}>
                + Add photos/videos
                <input
                  id="repair-media-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {formError && <p role="alert" style={styles.formError}>{formError}</p>}
            <div style={styles.formActions}>
              {editingId && (
                <button type="button" onClick={cancelEdit} style={styles.cancelBtn} disabled={saving}>Cancel</button>
              )}
              <button type="submit" style={styles.saveBtn} disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Service'}
              </button>
            </div>
          </form>
        </div>

        {/* List */}
        {loading ? <LoadingSpinner /> : services.length === 0 ? (
          <p style={styles.empty}>No services yet. Add one above.</p>
        ) : (
          <div style={styles.list}>
            {services.map((s) => (
              <div key={s.id} style={styles.serviceRow}>
                {s.media && s.media.length > 0 && (
                  <img src={s.media[0].url} alt={s.name} style={styles.serviceThumb} loading="lazy" />
                )}
                <div style={styles.serviceInfo}>
                  <p style={styles.serviceName}>{s.name}</p>
                  <p style={styles.serviceDesc}>{s.description}</p>
                  <p style={styles.serviceTurnaround}>{s.estimated_turnaround}</p>
                  {s.media && s.media.length > 0 && (
                    <p style={styles.mediaCount}>{s.media.length} media file{s.media.length !== 1 ? 's' : ''}</p>
                  )}
                </div>
                <div style={styles.serviceActions}>
                  <button onClick={() => startEdit(s)} style={styles.editBtn}>Edit</button>
                  <button onClick={() => handleDelete(s)} style={styles.deleteBtn}>Delete</button>
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
  page: { minHeight: '100vh', backgroundColor: '#f5f7fa', padding: '2rem 1rem' },
  container: { maxWidth: '800px', margin: '0 auto' },
  heading: { fontSize: '1.6rem', fontWeight: 700, color: '#0f1f3d', marginBottom: '1.5rem' },
  toast: { padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: 500 },
  toastSuccess: { backgroundColor: '#f0fff4', border: '1px solid #9ae6b4', color: '#276749' },
  toastError: { backgroundColor: '#fff5f5', border: '1px solid #feb2b2', color: '#b91c1c' },
  formCard: { backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #dde3ec', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  formHeading: { fontSize: '1rem', fontWeight: 700, color: '#0f1f3d', marginBottom: '1rem' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: '0.35rem' },
  label: { fontSize: '0.875rem', fontWeight: 600, color: '#2d3748' },
  input: { padding: '0.55rem 0.75rem', fontSize: '0.9rem', border: '1px solid #dde3ec', borderRadius: '6px', color: '#2d3748', width: '100%', boxSizing: 'border-box' as const, outline: 'none', fontFamily: 'inherit' },
  mediaGrid: { display: 'flex', flexWrap: 'wrap' as const, gap: '0.75rem', marginBottom: '0.5rem' },
  mediaTile: { position: 'relative' as const, width: '100px', height: '100px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0' },
  mediaTileImg: { width: '100%', height: '100%', objectFit: 'cover' as const },
  removeTileBtn: { position: 'absolute' as const, top: '3px', right: '3px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  uploadLabel: { display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: '#e8f2fa', border: '1px dashed #1d6fa4', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#1d6fa4', fontWeight: 600, alignSelf: 'flex-start' as const },
  formError: { color: '#b91c1c', fontSize: '0.82rem', margin: 0 },
  formActions: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' },
  cancelBtn: { padding: '0.55rem 1.1rem', backgroundColor: '#fff', color: '#4a5568', border: '1px solid #dde3ec', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' },
  saveBtn: { padding: '0.55rem 1.25rem', backgroundColor: '#1d6fa4', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' },
  empty: { textAlign: 'center', color: '#5a6a80', padding: '2rem 0' },
  list: { display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' },
  serviceRow: { backgroundColor: '#fff', border: '1px solid #dde3ec', borderRadius: '8px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  serviceThumb: { width: '72px', height: '72px', objectFit: 'cover' as const, borderRadius: '6px', flexShrink: 0 },
  serviceInfo: { flex: 1, minWidth: 0 },
  serviceName: { fontWeight: 700, color: '#0f1f3d', margin: '0 0 0.25rem', fontSize: '0.95rem' },
  serviceDesc: { color: '#5a6a80', fontSize: '0.85rem', margin: '0 0 0.25rem', lineHeight: 1.4 },
  serviceTurnaround: { color: '#1d6fa4', fontSize: '0.8rem', fontWeight: 600, margin: 0 },
  mediaCount: { fontSize: '0.75rem', color: '#5a6a80', margin: '0.25rem 0 0' },
  serviceActions: { display: 'flex', gap: '0.5rem', flexShrink: 0 },
  editBtn: { padding: '0.35rem 0.8rem', backgroundColor: '#1d6fa4', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
  deleteBtn: { padding: '0.35rem 0.8rem', backgroundColor: '#fff', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '5px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
};
