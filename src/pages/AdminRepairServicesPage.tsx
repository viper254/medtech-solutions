import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from '../components/LoadingSpinner';
import type { RepairService } from '../types';

type Toast = { type: 'success' | 'error'; message: string };

interface FormState {
  name: string;
  description: string;
  estimated_turnaround: string;
}

const EMPTY: FormState = { name: '', description: '', estimated_turnaround: '' };

export default function AdminRepairServicesPage() {
  const [services, setServices] = useState<RepairService[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => { fetchServices(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchServices() {
    setLoading(true);
    const { data, error } = await supabase.from('repair_services').select('*').order('name');
    if (error) {
      setToast({ type: 'error', message: 'Failed to load services.' });
    } else {
      setServices((data as RepairService[]) ?? []);
    }
    setLoading(false);
  }

  function startEdit(service: RepairService) {
    setEditingId(service.id);
    setForm({ name: service.name, description: service.description, estimated_turnaround: service.estimated_turnaround });
    setFormError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
    setFormError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim() || !form.description.trim() || !form.estimated_turnaround.trim()) {
      setFormError('All fields are required.');
      return;
    }
    setSaving(true);
    const payload = { name: form.name.trim(), description: form.description.trim(), estimated_turnaround: form.estimated_turnaround.trim() };
    if (editingId) {
      const { error } = await supabase.from('repair_services').update(payload).eq('id', editingId);
      if (error) {
        setToast({ type: 'error', message: 'Failed to update service.' });
      } else {
        setToast({ type: 'success', message: 'Service updated.' });
        cancelEdit();
        fetchServices();
      }
    } else {
      const { error } = await supabase.from('repair_services').insert(payload);
      if (error) {
        setToast({ type: 'error', message: 'Failed to add service.' });
      } else {
        setToast({ type: 'success', message: 'Service added.' });
        setForm(EMPTY);
        fetchServices();
      }
    }
    setSaving(false);
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
                <div style={styles.serviceInfo}>
                  <p style={styles.serviceName}>{s.name}</p>
                  <p style={styles.serviceDesc}>{s.description}</p>
                  <p style={styles.serviceTurnaround}>{s.estimated_turnaround}</p>
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
  formError: { color: '#b91c1c', fontSize: '0.82rem', margin: 0 },
  formActions: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' },
  cancelBtn: { padding: '0.55rem 1.1rem', backgroundColor: '#fff', color: '#4a5568', border: '1px solid #dde3ec', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' },
  saveBtn: { padding: '0.55rem 1.25rem', backgroundColor: '#1d6fa4', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' },
  empty: { textAlign: 'center', color: '#5a6a80', padding: '2rem 0' },
  list: { display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' },
  serviceRow: { backgroundColor: '#fff', border: '1px solid #dde3ec', borderRadius: '8px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  serviceInfo: { flex: 1, minWidth: 0 },
  serviceName: { fontWeight: 700, color: '#0f1f3d', margin: '0 0 0.25rem', fontSize: '0.95rem' },
  serviceDesc: { color: '#5a6a80', fontSize: '0.85rem', margin: '0 0 0.25rem', lineHeight: 1.4 },
  serviceTurnaround: { color: '#1d6fa4', fontSize: '0.8rem', fontWeight: 600, margin: 0 },
  serviceActions: { display: 'flex', gap: '0.5rem', flexShrink: 0 },
  editBtn: { padding: '0.35rem 0.8rem', backgroundColor: '#1d6fa4', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
  deleteBtn: { padding: '0.35rem 0.8rem', backgroundColor: '#fff', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '5px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
};
