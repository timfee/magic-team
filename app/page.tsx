"use client";

import Link from "next/link";
import { useAuth } from "@/lib/contexts/auth-context";

export default function Home() {
  const { user, isLoading, signIn, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              MagicRetro
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Collaborative retrospective sessions powered by Firebase
            </p>
          </div>
          <div className="flex items-center gap-4">
            {isLoading ? (
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Loading...
              </span>
            ) : user ? (
              <>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {user.displayName ?? user.email}
                </span>
                <Link
                  href="/session/create"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                  Create Session
                </Link>
                <button
                  onClick={() => signOut()}
                  className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => signIn()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                Sign In
              </button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Welcome to MagicRetro
          </h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            Create retrospective sessions and collaborate with your team in
            real-time. All data is stored in Firebase Firestore.
          </p>
          <Link
            href="/session/create"
            className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700">
            Create Your First Session
          </Link>
        </div>
      </div>
    </div>
  );
}
