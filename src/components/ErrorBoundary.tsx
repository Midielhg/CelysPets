import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🚨 ErrorBoundary caught an error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('🚨 ErrorBoundary details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    
    this.setState({
      error,
      errorInfo
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
              <p className="text-gray-600 mb-4">
                The application encountered an unexpected error and crashed.
              </p>
              
              <details className="text-left mb-4">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
                  Show error details
                </summary>
                <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-auto max-h-40">
                  <p className="text-red-600 font-semibold mb-2">
                    {this.state.error?.message}
                  </p>
                  {this.state.error?.stack && (
                    <pre className="whitespace-pre-wrap text-gray-700">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </details>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
                  }}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Try Again
                </button>
                
                <button
                  onClick={() => {
                    window.location.href = '/';
                  }}
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
