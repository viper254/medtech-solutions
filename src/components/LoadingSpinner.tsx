import './LoadingSpinner.css';

const LoadingSpinner = () => (
  <div
    role="status"
    aria-label="Loading"
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem',
    }}
  >
    <div className="loading-spinner" aria-hidden="true" />
    <span className="sr-only">Loading...</span>
  </div>
);

export default LoadingSpinner;
