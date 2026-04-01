import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { usePageTitle } from '../utils/usePageTitle';

type Mode = 'login' | 'signup' | 'reset';

export default function CustomerAuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/account';

  const [mode, setMode] = useState<Mode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  usePageTitle(mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (mode === 'reset') {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account`,
      });
      setLoading(false);
      if (err) setError(err.message);
      else setInfo('Check your email for a password reset link.');
      return;
    }

    if (mode === 'signup') {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      setLoading(false);
      if (err) { setError(err.message); return; }
      setInfo('Account created! Check your email to verify, then sign in.');
      setMode('login');
      return;
    }

    // login
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError('Invalid email or password.'); return; }
    navigate(from, { replace: true });
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>
          {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
        </h1>

        <form onSubmit={handleSubmit} noValidate style={styles.form}>
          {mode === 'signup' && (
            <div style={styles.field}>
              <label htmlFor="fullName" style={styles.label}>Full Name</label>
              <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={styles.input} placeholder="Your name" autoComplete="name" />
            </div>
          )}

          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} placeholder="you@example.com" autoComplete="email" />
          </div>

          {mode !== 'reset' && (
            <div style={styles.field}>
              <label htmlFor="password" style={styles.label}>Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </div>
          )}

          {error && <p role="alert" style={styles.error}>{error}</p>}
          {info && <p style={styles.info}>{info}</p>}

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
          </button>
        </form>

        <div style={styles.links}>
          {mode === 'login' && (
            <>
              <button style={styles.linkBtn} onClick={() => { setMode('signup'); setError(null); setInfo(null); }}>
                Don't have an account? Sign up
              </button>
              <button style={styles.linkBtn} onClick={() => { setMode('reset'); setError(null); setInfo(null); }}>
                Forgot password?
              </button>
            </>
          )}
          {mode !== 'login' && (
            <button style={styles.linkBtn} onClick={() => { setMode('login'); setError(null); setInfo(null); }}>
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f4f8', padding: '1rem' },
  card: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.10)', padding: '2.5rem 2rem', width: '100%', maxWidth: '420px' },
  heading: { fontSize: '1.5rem', fontWeight: 700, color: '#0f1f3d', marginBottom: '1.75rem', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '1.1rem' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: '0.4rem' },
  label: { fontSize: '0.9rem', fontWeight: 600, color: '#2d3748' },
  input: { padding: '0.65rem 0.85rem', fontSize: '0.95rem', border: '1px solid #dde3ec', borderRadius: '8px', outline: 'none', color: '#2d3748', width: '100%', boxSizing: 'border-box' as const },
  error: { color: '#b91c1c', fontSize: '0.875rem', backgroundColor: '#fff5f5', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0.5rem 0.75rem', margin: 0 },
  info: { color: '#276749', fontSize: '0.875rem', backgroundColor: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: '6px', padding: '0.5rem 0.75rem', margin: 0 },
  submitBtn: { padding: '0.75rem', backgroundColor: '#1d6fa4', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginTop: '0.25rem' },
  links: { display: 'flex', flexDirection: 'column' as const, gap: '0.5rem', marginTop: '1.25rem', alignItems: 'center' },
  linkBtn: { background: 'none', border: 'none', color: '#1d6fa4', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', padding: 0 },
};
