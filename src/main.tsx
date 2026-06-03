import { Component, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-xl font-bold text-danger">Something went wrong</h1>
          <p className="max-w-md text-sm text-muted">{this.state.error.message}</p>
          <button
            type="button"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white"
            onClick={() => {
              localStorage.removeItem('devices-tycoon-v2');
              window.location.reload();
            }}
          >
            Reset save & reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found');
}

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
