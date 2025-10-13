"use client";

import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";

interface SessionLoadingProps {
  sessionId: string;
}

export const SessionLoading = ({ sessionId }: SessionLoadingProps) => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
                ← Back to Sessions
              </Link>
              <div className="mt-2 space-y-2">
                <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Connection Status Skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <div className="h-4 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>

              {/* Participants Skeleton */}
              <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex -space-x-1">
                  <div className="h-6 w-6 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-6 w-6 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-6 w-6 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
                </div>
                <div className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>

              {/* Stage Skeleton */}
              <div className="h-8 w-24 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />

              {/* Admin Button Skeleton */}
              <div className="h-8 w-20 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <Spinner size="lg" className="mx-auto" />
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Loading session...
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
              Session ID: {sessionId}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
