"use client";

import { ErrorDisplay } from "@/components/ui/error-display";
import { handleFirebaseError, logError } from "@/lib/utils/firebase-errors";
import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = handleFirebaseError(error);
    logError(appError, "GlobalErrorBoundary");

    // Log additional context in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error boundary caught an error:", {
        error,
        errorInfo,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleNavigateHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const appError = handleFirebaseError(this.state.error);

      return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
          <div className="w-full max-w-md">
            <ErrorDisplay
              error={appError}
              onRetry={this.handleReset}
              onNavigateHome={this.handleNavigateHome}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
