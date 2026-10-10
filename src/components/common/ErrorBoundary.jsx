import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Antigravity Caught React Boundary Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetState = () => {
    localStorage.removeItem('muet_tracker_user');
    localStorage.removeItem('muet_tracker_token');
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07130e] text-slate-100 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-black">
          <div className="max-w-lg w-full bg-[#0a1812] border border-red-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Background ambient glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header with MUET Badge */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">MUET Point Tracker</h1>
                <p className="text-xs text-slate-400">Application Error Recovery System</p>
              </div>
            </div>

            <div className="bg-[#0f241b] border border-emerald-950/80 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-red-300 mb-1">
                A client rendering exception was caught:
              </p>
              <p className="text-xs font-mono text-slate-300 break-words bg-[#081510] p-3 rounded-lg border border-red-900/40">
                {this.state.error?.message || 'Unknown runtime error'}
              </p>
            </div>

            {this.state.errorInfo && (
              <details className="mb-6 group">
                <summary className="text-xs text-slate-400 cursor-pointer hover:text-emerald-400 select-none transition">
                  View component stack trace
                </summary>
                <pre className="mt-2 text-[10px] text-slate-400 font-mono bg-[#06110c] p-3 rounded-lg border border-emerald-950 overflow-x-auto max-h-40">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2.5 rounded-xl transition text-sm shadow-lg shadow-emerald-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleResetState}
                className="flex-1 flex items-center justify-center gap-2 bg-[#122e22] hover:bg-[#183c2c] border border-emerald-800/60 text-emerald-300 font-semibold px-4 py-2.5 rounded-xl transition text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Reset & Home
              </button>
            </div>

            <p className="mt-6 text-center text-[11px] text-slate-500">
              Mehran University of Engineering & Technology • Jamshoro
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
