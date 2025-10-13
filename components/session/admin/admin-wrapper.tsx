"use client";

import { useAuth } from "@/lib/contexts/auth-context";
import { SessionProvider } from "@/lib/contexts/firebase-session-context";
import Link from "next/link";
import { AdminControls } from "./admin-controls";

interface AdminWrapperProps {
  sessionId: string;
}

export const AdminWrapper = ({ sessionId }: AdminWrapperProps) => {
  const { userId, userName, userPhoto, user, isLoading, signIn } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="text-lg text-zinc-600 dark:text-zinc-400">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  // Require authentication for admin features
  if (!user || !userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-md rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Authentication Required
          </h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            You must be signed in to access admin controls for this session.
          </p>
          <button
            onClick={() => signIn()}
            className="mt-6 w-full rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700">
            Sign In with Google
          </button>
          <Link
            href={`/session/${sessionId}`}
            className="mt-4 block text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
            ← Back to Session
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SessionProvider
      sessionId={sessionId}
      userId={userId}
      userName={userName ?? "Anonymous User"}
      userPhoto={userPhoto}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              href={`/session/${sessionId}`}
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
              ← Back to Session
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Admin Controls
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Signed in as {user.email}
            </p>
          </div>

          <AdminControls sessionId={sessionId} />
        </div>
      </div>
    </SessionProvider>
  );
};
