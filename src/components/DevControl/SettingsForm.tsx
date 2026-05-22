interface SettingsFormProps {
  isActive: boolean;
  setIsActive: (value: boolean) => void;
  autoDisable: boolean;
  setAutoDisable: (value: boolean) => void;
  paymentDueDate: string;
  setPaymentDueDate: (value: string) => void;
  gracePeriod: number;
  setGracePeriod: (value: number) => void;
  nextAmount: number;
  setNextAmount: (value: number) => void;
  customerMsg: string;
  setCustomerMsg: (value: string) => void;
  adminMsg: string;
  setAdminMsg: (value: string) => void;
  onSave: () => void;
  saving: boolean;
}

export default function SettingsForm(props: SettingsFormProps) {
  return (
    <div style={styles.card}>
      <h2 style={styles.cardHeading}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m-6 0l-4.2 4.2"/>
        </svg>
        Site Control Settings
      </h2>
      
      <div style={styles.formGrid}>
        <div style={styles.field}>
          <label style={styles.label}>
            <input type="checkbox" checked={props.isActive} onChange={(e) => props.setIsActive(e.target.checked)} style={styles.checkbox} />
            Site Active
          </label>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>
            <input type="checkbox" checked={props.autoDisable} onChange={(e) => props.setAutoDisable(e.target.checked)} style={styles.checkbox} />
            Auto-Disable on Overdue
          </label>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Payment Due Date</label>
          <input type="datetime-local" value={props.paymentDueDate} onChange={(e) => props.setPaymentDueDate(e.target.value)} style={styles.input} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Grace Period (days)</label>
          <input type="number" value={props.gracePeriod} onChange={(e) => props.setGracePeriod(parseInt(e.target.value))} style={styles.input} min="0" />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Next Payment Amount (KES)</label>
          <input type="number" value={props.nextAmount} onChange={(e) => props.setNextAmount(parseFloat(e.target.value))} style={styles.input} min="0" step="0.01" />
        </div>

        <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
          <label style={styles.label}>Customer Message</label>
          <textarea value={props.customerMsg} onChange={(e) => props.setCustomerMsg(e.target.value)} style={{ ...styles.input, minHeight: '80px' }} placeholder="Message shown to customers when site is disabled" />
        </div>

        <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
          <label style={styles.label}>Admin Message</label>
          <textarea value={props.adminMsg} onChange={(e) => props.setAdminMsg(e.target.value)} style={{ ...styles.input, minHeight: '80px' }} placeholder="Message shown to admin when site is disabled" />
        </div>
      </div>

      <button onClick={props.onSave} disabled={props.saving} style={styles.saveBtn}>
        {props.saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
  cardHeading: { fontSize: '1.1rem', fontWeight: 700, color: '#c9d1d9', margin: '0 0 1rem' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.875rem', fontWeight: 600, color: '#c9d1d9', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  input: { padding: '0.6rem 0.75rem', fontSize: '0.9rem', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', color: '#c9d1d9', outline: 'none' },
  checkbox: { width: '18px', height: '18px', cursor: 'pointer' },
  saveBtn: { padding: '0.75rem 1.5rem', backgroundColor: '#1f6feb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', alignSelf: 'flex-start' },
};
