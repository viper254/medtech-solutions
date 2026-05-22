interface PaymentRecord {
  id: string;
  amount: number;
  payment_date: string;
  status: string;
  notes: string | null;
}

interface PaymentHistoryProps {
  payments: PaymentRecord[];
}

export default function PaymentHistory({ payments }: PaymentHistoryProps) {
  return (
    <div style={styles.card}>
      <h2 style={styles.cardHeading}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
          <line x1="12" y1="20" x2="12" y2="10"/>
          <line x1="18" y1="20" x2="18" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="16"/>
        </svg>
        Payment History
      </h2>
      {payments.length === 0 ? (
        <p style={styles.emptyText}>No payment records yet</p>
      ) : (
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span>Date</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Notes</span>
          </div>
          {payments.map((payment) => (
            <div key={payment.id} style={styles.tableRow}>
              <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
              <span style={styles.amount}>KES {payment.amount.toLocaleString()}</span>
              <span style={styles.status}>{payment.status}</span>
              <span style={styles.notes}>{payment.notes || '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
  cardHeading: { fontSize: '1.1rem', fontWeight: 700, color: '#c9d1d9', margin: '0 0 1rem' },
  table: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  tableHeader: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: '1rem', padding: '0.75rem', backgroundColor: '#0d1117', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#8b949e', textTransform: 'uppercase' },
  tableRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: '1rem', padding: '0.75rem', borderBottom: '1px solid #21262d', fontSize: '0.875rem', color: '#c9d1d9' },
  amount: { fontWeight: 700, color: '#3fb950' },
  status: { textTransform: 'capitalize', color: '#58a6ff' },
  notes: { color: '#8b949e' },
  emptyText: { color: '#8b949e', textAlign: 'center', padding: '2rem' },
};
