interface SiteStatus {
  is_active: boolean;
  customer_message: string;
  admin_message: string;
  days_until_due: number;
  is_overdue: boolean;
}

interface StatusCardProps {
  status: SiteStatus;
  isActive: boolean;
  saving: boolean;
  onToggle: () => void;
}

export default function StatusCard({ status, isActive, saving, onToggle }: StatusCardProps) {
  return (
    <div style={{ ...styles.card, ...(status.is_active ? styles.cardGreen : styles.cardRed) }}>
      <h2 style={styles.cardHeading}>Current Status</h2>
      <div style={styles.statusGrid}>
        <div>
          <span style={styles.statusLabel}>Site Status:</span>
          <span style={styles.statusValue}>
            {status.is_active ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="3" style={{ verticalAlign: 'middle', marginRight: '0.25rem' }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                ACTIVE
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#f85149" style={{ verticalAlign: 'middle', marginRight: '0.25rem' }}>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
                DISABLED
              </>
            )}
          </span>
        </div>
        <div>
          <span style={styles.statusLabel}>Payment Status:</span>
          <span style={styles.statusValue}>
            {status.is_overdue ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f85149" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.25rem' }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                OVERDUE
              </>
            ) : status.days_until_due < 7 ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d29922" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.25rem' }}>
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                DUE SOON
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="3" style={{ verticalAlign: 'middle', marginRight: '0.25rem' }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Current
              </>
            )}
          </span>
        </div>
        <div>
          <span style={styles.statusLabel}>Days Until Due:</span>
          <span style={styles.statusValue}>{status.days_until_due > 0 ? status.days_until_due : 'OVERDUE'}</span>
        </div>
      </div>
      <button onClick={onToggle} disabled={saving} style={styles.quickToggle}>
        {saving ? 'Processing...' : isActive ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
              <circle cx="12" cy="12" r="10"/>
            </svg>
            Disable Site Now
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Enable Site Now
          </>
        )}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
  cardGreen: { borderColor: '#2ea043' },
  cardRed: { borderColor: '#da3633' },
  cardHeading: { fontSize: '1.1rem', fontWeight: 700, color: '#c9d1d9', margin: '0 0 1rem' },
  statusGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' },
  statusLabel: { display: 'block', fontSize: '0.8rem', color: '#8b949e', marginBottom: '0.25rem' },
  statusValue: { display: 'block', fontSize: '1.1rem', fontWeight: 700, color: '#c9d1d9' },
  quickToggle: { width: '100%', padding: '0.75rem', backgroundColor: '#238636', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' },
};
