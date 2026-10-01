import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // store stack info for debug
    this.setState({ info });
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught', error, info);
  }

  render() {
    const { error, info } = this.state;
    if (error) {
      return (
        <div className="container loading-error">
          <h3>Something went wrong</h3>
          <p>{error && (error.message || String(error))}</p>
          <details style={{ whiteSpace: 'pre-wrap' }}>{info && info.componentStack}</details>
          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={() => { this.setState({ error: null, info: null }); window.location.reload(); }}>Reload page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
