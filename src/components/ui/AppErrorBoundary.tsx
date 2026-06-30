import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './Button';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Endpoint Triage Pro render failure', error, errorInfo);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-8 text-slate-100">
        <section className="w-full max-w-2xl border border-red-400/30 bg-slate-900 p-6 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-300">Startup Error</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-100">Endpoint Triage Pro could not render the dashboard.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            The app loaded, but the renderer hit an unexpected data or runtime error. Use Reload after rebuilding, or clear malformed local reports if this persists.
          </p>
          <pre className="mt-5 max-h-56 overflow-auto border border-slate-800 bg-slate-950 p-4 text-xs leading-5 text-red-100">
            {this.state.error.message}
          </pre>
          <div className="mt-5 flex gap-3">
            <Button onClick={() => window.location.reload()} variant="primary">
              Reload App
            </Button>
          </div>
        </section>
      </main>
    );
  }
}
