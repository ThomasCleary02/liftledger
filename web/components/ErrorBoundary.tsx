"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { logger } from "../lib/logger";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("Error caught by boundary", error);
    // Optionally log errorInfo for debugging
    if (process.env.NODE_ENV === "development") {
      logger.error("Error info", errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
          <div className="text-center max-w-md">
            <AlertCircle className="mx-auto h-16 w-16 text-red-600" />
            <h1 className="mt-6 text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm text-red-600">Error details</summary>
                <pre className="mt-2 overflow-auto rounded bg-red-50 p-2 text-xs text-red-800">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="bg-black rounded-xl px-6 py-3 text-white font-semibold hover:bg-gray-800 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
