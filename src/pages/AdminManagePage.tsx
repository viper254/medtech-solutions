import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from '../components/LoadingSpinner';

interface AdminRow {
  user_id: string;
  email: string;
  is_super_admin: boolean;
  added_at: string;
}

type Toast = { type: 'success' | 'error'; message: string };

export default function AdminManagePage() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUid(session?.user.id ?? null);
    });
    fetchAdmins();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchAdmins() {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_admins');
    if (error) {
      setToast({ type: 'error', message: 'Failed to load admins.' });
    } else {
      const rows = (data as AdminRow[]) ?? [];
      setAdmins(rows);
    }
    setLoading(false);
  }

  // Determine if current user is super admin once admins + uid are loaded
  useEffect(() => {
    if (!currentUid || admins.length === 0) return;
    const me = admins.find((a) => a.user_id === currentUid);
    setIsSuperAdmin(me?.is_super_admin ?? false);
  }, [admins, currentUid]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setAdding(true);

    const { data, error } = await supabase.rpc('add_admin_by_email', { target_email: trimmed });

    if (error || (data as { error?: string })?.error) {
      setToast({ type: 'error', message: (data as { error?: string })?.error ?? error?.message ?? 'Failed to add admin.' });
    } else {
      setToast({ type: 'success', message: `${trimmed} added as admin.` });
      setEmail('');
      fetchAdmins();
    }
    setAdding(false);
  }

  async function handleRemove(admin: AdminRow) {
    if (!window.confirm(`Remove ${admin.email} as admin?`)) return;

    const { data, error } = await supabase.rpc('remove_admin', { target_uid: admin.user_id });

    if (error || (data as { error?: string })?.error) {
      setToast({ type: 'error', message: (data as { error?: string })?.error ?? 'Failed to remove admin.' });
    } else {
      setToast({ type: 'success', message: `${admin.email} removed.` });
      setAdmins((prev) => prev.filter((a) => a.user_id !== admin.user_id));
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.heading}>Admin Management</h1>
            <p style={styles.sub}>Manage who has access to the admin panel.</p>
          </div>
          <Link to="/admin" style={styles.backBtn}>← Back to Dashboard</Link>
        </div>

        {toast && (
          <div role="alert" style={{ ...styles.toast, ...(toast.type === 'success' ? styles.toastSuccess : styles.toastError) }}>
            {toast.message}
          </div>
        )}

        {/* Add admin form — super admin only */}
        {isSuperAdmin && (
          <div style={styles.card}>
            <h2 style={styles.cardHeading}>Add Admin</h2>
            <p style={styles.cardSub}>The user must already have an account. Enter their email address.</p>
            <form onSubmit={handleAdd} style={styles.addForm}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                style={styles.input}
                aria-label="Admin email address"
              />
              <button type="submit" disabled={adding} style={styles.addBtn}>
                {adding ? 'Adding…' : 'Add Admin'}
              </button>
            </form>
          </div>
        )}

        {/* Admins list */}
        <div style={styles.card}>
          <h2 style={styles.cardHeading}>Current Admins</h2>
          {loading ? (
            <LoadingSpinner />
          ) : admins.length === 0 ? (
            <p style={styles.empty}>No admins found.</p>
          ) : (
            <div style={styles.list}>
              {admins.map((admin) => (
                <div key={admin.user_id} style={styles.row}>
                  <div style={styles.rowInfo}>
                    <span style={styles.rowEmail}>{admin.email || admin.user_id}</span>
                    <div style={styles.rowMeta}>
                      {admin.is_super_admin && (
                        <span style={styles.superBadge}>Super Admin</span>
                      )}
                      {admin.user_id === currentUid && (
                        <span style={styles.youBadge}>You</span>
                      )}
                      <span style={styles.addedAt}>
                        Added {new Date(admin.added_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {isSuperAdmin && !admin.is_super_admin && admin.user_id !== currentUid && (
                    <button
                      onClick={() => handleRemove(admin)}
                      style={styles.removeBtn}
                      aria-label={`Remove ${admin.email}`}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '2rem 1rem' },
  container: { maxWidth: '720px', margin: '0 auto' },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
    gap: '1rem',
    flexWrap: 'wrap' as const,
  },
  heading: { fontSize: '1.6rem', fontWeight: 700, color: '#0f1f3d', margin: '0 0 0.25rem' },
  sub: { fontSize: '0.875rem', color: '#5a6a80', margin: 0 },
  backBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#fff',
    border: '1px solid #dde3ec',
    borderRadius: '6px',
    color: '#0f1f3d',
    fontWeight: 600,
    fontSize: '0.875rem',
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  toast: { padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: 500 },
  toastSuccess: { backgroundColor: '#f0fff4', border: '1px solid #9ae6b4', color: '#276749' },
  toastError: { backgroundColor: '#fff5f5', border: '1px solid #feb2b2', color: '#b91c1c' },
  card: {
    backgroundColor: '#fff',
    border: '1px solid #dde3ec',
    borderRadius: '10px',
    padding: '1.5rem',
    marginBottom: '1.25rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  cardHeading: { fontSize: '1rem', fontWeight: 700, color: '#0f1f3d', margin: '0 0 0.35rem' },
  cardSub: { fontSize: '0.82rem', color: '#5a6a80', margin: '0 0 1rem' },
  addForm: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as const },
  input: {
    flex: 1,
    minWidth: '200px',
    padding: '0.55rem 0.75rem',
    fontSize: '0.9rem',
    border: '1px solid #dde3ec',
    borderRadius: '6px',
    color: '#2d3748',
    outline: 'none',
  },
  addBtn: {
    padding: '0.55rem 1.25rem',
    backgroundColor: '#1d6fa4',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  list: { display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '0.85rem 1rem',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
  },
  rowInfo: { display: 'flex', flexDirection: 'column' as const, gap: '0.3rem', minWidth: 0 },
  rowEmail: { fontSize: '0.9rem', fontWeight: 600, color: '#0f1f3d', wordBreak: 'break-all' as const },
  rowMeta: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' as const },
  superBadge: {
    fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px',
    backgroundColor: '#0f1f3d', color: '#fff', borderRadius: '999px',
  },
  youBadge: {
    fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px',
    backgroundColor: '#1d6fa4', color: '#fff', borderRadius: '999px',
  },
  addedAt: { fontSize: '0.75rem', color: '#5a6a80' },
  removeBtn: {
    padding: '0.35rem 0.8rem',
    backgroundColor: '#fff',
    color: '#b91c1c',
    border: '1px solid #fca5a5',
    borderRadius: '5px',
    fontWeight: 600,
    fontSize: '0.82rem',
    cursor: 'pointer',
    flexShrink: 0,
  },
  empty: { color: '#5a6a80', fontSize: '0.9rem', margin: 0 },
};
