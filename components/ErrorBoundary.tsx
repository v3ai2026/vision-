import React, { Component, ErrorInfo, ReactNode } from 'react';
import { NeuralButton } from './UIElements';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#020420] flex items-center justify-center p-4">
          <div className="max-w-lg w-full space-y-6 text-center">
            <div className="text-6xl">⚠️</div>
            <h1 className="text-3xl font-black text-[#00DC82]">Oops! Something went wrong</h1>
            <p className="text-slate-400">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <NeuralButton
              onClick={() => window.location.reload()}
              variant="primary"
            >
              🔄 Reload Page
            </NeuralButton>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
