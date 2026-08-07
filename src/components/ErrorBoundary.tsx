import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Exceção capturada na interface:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen pd-page flex items-center justify-center p-4">
          <div className="max-w-md w-full pd-card p-6 sm:p-8 text-center space-y-5 border-2 border-red-800/60 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-950/80 text-red-400 flex items-center justify-center mx-auto border border-red-700">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-black uppercase italic tracking-wider pd-text">
                Ocorreu uma instabilidade visual
              </h2>
              <p className="text-xs pd-text-2 leading-relaxed">
                Detectamos um erro temporário na renderização da tela. Nenhum dado do seu catálogo ou conta foi perdido.
              </p>
              {this.state.error && (
                <div className="p-2.5 pd-surface-2 rounded border pd-border text-[10px] pd-mono pd-text-3 text-left overflow-x-auto max-h-24">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="btn btn-primary btn-md w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recarregar Página</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="btn btn-subtle btn-md w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>Ir para o Início</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
