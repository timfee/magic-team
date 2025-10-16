"use client";

import Link from "next/link";
import { useAuth } from "@/lib/contexts/auth-context";
import { useEffect, useState } from "react";
import { getArchivedSessions } from "@/lib/actions/session";
import type { MagicSession } from "@/lib/types/session";
import { motion } from "framer-motion";

export default function ArchivedPage() {
  const { user, userId, isLoading, signIn } = useAuth();
  const [sessions, setSessions] = useState<MagicSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!userId) return;
      setLoadingSessions(true);
      try {
        const archivedSessions = await getArchivedSessions(userId);
        setSessions(archivedSessions);
      } catch (error) {
        console.error("Error fetching archived sessions:", error);
      } finally {
        setLoadingSessions(false);
      }
    };

    void fetchSessions();
  }, [userId]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
              ← Back to Active Sessions
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Archived Sessions
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              View and restore your archived retrospective sessions
            </p>
          </div>
        </div>

        {!user ?
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Sign In Required
            </h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
              Please sign in to view your archived sessions.
            </p>
            <button
              onClick={() => signIn()}
              className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              Sign In
            </button>
          </div>
        : isLoading || loadingSessions ?
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-zinc-600 dark:text-zinc-400">
              Loading archived sessions...
            </p>
          </div>
        : sessions.length === 0 ?
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <svg
              className="mx-auto h-16 w-16 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
            <h2 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              No Archived Sessions
            </h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
              You don&apos;t have any archived sessions yet. Archived sessions
              will appear here.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              View Active Sessions
            </Link>
          </div>
        : <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}>
                <Link
                  href={`/session/${session.id}`}
                  className="block rounded-lg border border-zinc-300 bg-zinc-100 p-6 transition-all hover:border-amber-300 hover:bg-white hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-amber-700 dark:hover:bg-zinc-900">
                  <div className="mb-3 flex items-center gap-2">
                    <svg
                      className="h-5 w-5 text-amber-600 dark:text-amber-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      Archived
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {session.name}
                  </h3>
                  {session.description && (
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {session.description}
                    </p>
                  )}
                  <div className="mt-4 space-y-2 text-xs text-zinc-500 dark:text-zinc-500">
                    <div>Created: {session.createdAt.toLocaleDateString()}</div>
                    {session.archivedAt && (
                      <div>
                        Archived: {session.archivedAt.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                      {session.currentStage.replace(/_/g, " ")}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}
