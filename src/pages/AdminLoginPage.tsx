import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;
  const lockoutMinsLeft = isLocked ? Math.ceil((lockedUntil! - Date.now()) / 60000) : 0;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isLocked) return;

    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_MS);
        setAttempts(0);
        setError(`Too many failed attempts. Try again in 15 minutes.`);
      } else {
        setError(`Invalid email or password. ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`);
      }
    } else {
      setAttempts(0);
      setLockedUntil(null);
      navigate('/admin');
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Admin Login</h1>

        {isLocked ? (
          <p role="alert" style={styles.error}>
            Account locked due to too many failed attempts. Try again in {lockoutMinsLeft} minute{lockoutMinsLeft !== 1 ? 's' : ''}.
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div style={styles.field}>
              <label htmlFor="email" style={styles.label}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={styles.input}
                placeholder="admin@example.com"
              />
            </div>

            <div style={styles.field}>
              <label htmlFor="password" style={styles.label}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={styles.input}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p role="alert" style={styles.error}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.submitBtn, ...(loading ? styles.submitBtnDisabled : {}) }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f7fa',
    padding: '1rem',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '400px',
  },
  heading: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#0f1f3d',
    marginBottom: '1.75rem',
    textAlign: 'center',
  },
  field: {
    marginBottom: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#2d3748',
  },
  input: {
    padding: '0.6rem 0.75rem',
    fontSize: '0.95rem',
    border: '1px solid #cbd5e0',
    borderRadius: '6px',
    outline: 'none',
    color: '#2d3748',
    width: '100%',
    boxSizing: 'border-box',
  },
  error: {
    color: '#c53030',
    fontSize: '0.875rem',
    marginBottom: '1rem',
    backgroundColor: '#fff5f5',
    border: '1px solid #feb2b2',
    borderRadius: '6px',
    padding: '0.5rem 0.75rem',
  },
  submitBtn: {
    width: '100%',
    padding: '0.7rem',
    backgroundColor: '#1d6fa4',
    color: '#fff',
    fontWeight: 600,
    fontSize: '1rem',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '0.25rem',
  },
  submitBtnDisabled: {
    backgroundColor: '#7aaec8',
    cursor: 'not-allowed',
  },
};
