"use client";

import { Button } from "@/components/ui/button";
import type { AppError } from "@/lib/utils/firebase-errors";

interface ErrorDisplayProps {
  error: AppError;
  onRetry?: () => void;
  onNavigateHome?: () => void;
  onSignIn?: () => void;
  className?: string;
}

export function ErrorDisplay({
  error,
  onRetry,
  onNavigateHome,
  onSignIn,
  className = "",
}: ErrorDisplayProps) {
  const getErrorIcon = () => {
    switch (error.type) {
      case "firebase":
        return (
          <svg
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      case "network":
        return (
          <svg
            className="h-8 w-8 text-orange-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="h-8 w-8 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
    }
  };

  const getActionButton = () => {
    switch (error.action) {
      case "retry":
        return (
          onRetry && (
            <Button onClick={onRetry} className="mt-4">
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try Again
            </Button>
          )
        );

      case "retry-auth":
        return (
          <div className="mt-4 space-x-2">
            {onSignIn && (
              <Button onClick={onSignIn}>
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                Sign In
              </Button>
            )}
            {onRetry && (
              <Button variant="outline" onClick={onRetry}>
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Try Again
              </Button>
            )}
          </div>
        );

      case "sign-in":
        return (
          onSignIn && (
            <Button onClick={onSignIn} className="mt-4">
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              Sign In
            </Button>
          )
        );

      case "navigate-home":
        return (
          onNavigateHome && (
            <Button onClick={onNavigateHome} className="mt-4">
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Go Home
            </Button>
          )
        );

      default:
        return (
          onRetry && (
            <Button onClick={onRetry} className="mt-4">
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try Again
            </Button>
          )
        );
    }
  };

  return (
    <div
      className={`rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950/20 ${className}`}>
      <div className="mb-4 flex justify-center">{getErrorIcon()}</div>
      <h3 className="mb-2 text-lg font-semibold text-red-900 dark:text-red-100">
        Something went wrong
      </h3>
      <p className="mb-2 text-red-700 dark:text-red-300">{error.userMessage}</p>
      {process.env.NODE_ENV === "development" && (
        <details className="mt-2 text-left">
          <summary className="cursor-pointer text-sm text-red-600 dark:text-red-400">
            Developer Details
          </summary>
          <pre className="mt-2 overflow-auto rounded bg-red-100 p-2 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {JSON.stringify(
              { type: error.type, code: error.code, message: error.message },
              null,
              2,
            )}
          </pre>
        </details>
      )}
      {getActionButton()}
    </div>
  );
}
