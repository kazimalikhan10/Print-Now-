import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Keep the error visible during frontend development without introducing a backend logger.
    console.error('Print Now runtime error:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f7f7fb' }}>
        <div style={{ width: '100%', maxWidth: 520, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: 28, boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#4338ca' }}>Print Now</p>
          <h1 style={{ margin: '0 0 10px', fontSize: 24 }}>The app could not load</h1>
          <p style={{ margin: '0 0 18px', color: '#64748b', lineHeight: 1.5 }}>
            A frontend error occurred while starting Print Now. Reload the page and, if it continues, open the browser console for the exact error.
          </p>
          <details style={{ marginBottom: 18 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Technical error</summary>
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: 10, fontSize: 12, color: '#475569' }}>{String(this.state.error?.stack || this.state.error || 'Unknown error')}</pre>
          </details>
          <button type="button" onClick={this.handleReload} style={{ width: '100%', border: 0, borderRadius: 12, padding: '13px 16px', background: '#4338ca', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            Reload Print Now
          </button>
        </div>
      </div>
    );
  }
}
