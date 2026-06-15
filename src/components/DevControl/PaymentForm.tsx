import { useState } from 'react';

interface PaymentFormProps {
  onSubmit: (amount: string, notes: string) => Promise<void>;
  saving: boolean;
}

export default function PaymentForm({ onSubmit, saving }: PaymentFormProps) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  async function handleSubmit() {
    await onSubmit(amount, notes);
    setAmount('');
    setNotes('');
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.cardHeading}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        Record Payment
      </h2>
      <div style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>Payment Amount (KES)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={styles.input}
            placeholder="e.g. 5000"
            min="0"
            step="0.01"
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={styles.input}
            placeholder="e.g. January 2024 payment"
          />
        </div>
        <button onClick={handleSubmit} disabled={saving} style={styles.btn}>
          {saving ? 'Recording...' : 'Record Payment & Extend 30 Days'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
  cardHeading: { fontSize: '1.1rem', fontWeight: 700, color: '#c9d1d9', margin: '0 0 1rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.875rem', fontWeight: 600, color: '#c9d1d9' },
  input: { padding: '0.6rem 0.75rem', fontSize: '0.9rem', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', color: '#c9d1d9', outline: 'none' },
  btn: { padding: '0.75rem 1.5rem', backgroundColor: '#238636', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', alignSelf: 'flex-start' },
};
