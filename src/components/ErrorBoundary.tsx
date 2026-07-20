import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  // Explicit props typing to prevent compiler issues
  props!: Props;

  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    if (confirm('Apakah Anda yakin ingin menyetel ulang data aplikasi? Tindakan ini akan menghapus cache lokal browser untuk memulihkan halaman yang error.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center bg-white rounded-2xl border border-slate-200 shadow-sm my-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Terjadi Kesalahan Sistem</h2>
          <p className="text-slate-500 text-sm max-w-md mt-2 leading-relaxed">
            Halaman mengalami kendala rendering karena format data lokal tidak kompatibel atau terjadi error tak terduga.
          </p>
          {this.state.error && (
            <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl text-left max-w-lg w-full">
              <p className="text-xs font-mono text-slate-600 break-words">
                <span className="font-bold text-rose-600">Error:</span> {this.state.error.message}
              </p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full justify-center max-w-md">
            <button
              onClick={this.handleReload}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Ulang Halaman</span>
            </button>
            <button
              onClick={this.handleResetStorage}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-sm font-bold transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset Penyimpanan Lokal</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
