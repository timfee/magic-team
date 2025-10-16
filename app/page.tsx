"use client";

import Link from "next/link";
import { useAuth } from "@/lib/contexts/auth-context";
import { useEffect, useState } from "react";
import { getUserSessions } from "@/lib/actions/session";
import type { MagicSession } from "@/lib/types/session";
import { motion } from "framer-motion";

export default function Home() {
  const { user, userId, isLoading, signIn, signOut } = useAuth();
  const [sessions, setSessions] = useState<MagicSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!userId) return;
      setLoadingSessions(true);
      try {
        const userSessions = await getUserSessions(userId);
        setSessions(userSessions);
      } catch (error) {
        console.error("Error fetching sessions:", error);
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
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              MagicRetro
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Collaborative retrospective sessions powered by Firebase
            </p>
          </div>
          <div className="flex items-center gap-4">
            {isLoading ?
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Loading...
              </span>
            : user ?
              <>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {user.displayName ?? user.email}
                </span>
                <Link
                  href="/archived"
                  className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                  Archived Sessions
                </Link>
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
            : <button
                onClick={() => signIn()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                Sign In
              </button>
            }
          </div>
        </div>

        {!user ?
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Welcome to MagicRetro
            </h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
              Create retrospective sessions and collaborate with your team in
              real-time. All data is stored in Firebase Firestore.
            </p>
            <button
              onClick={() => signIn()}
              className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              Sign In to Get Started
            </button>
          </div>
        : loadingSessions ?
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-zinc-600 dark:text-zinc-400">
              Loading your sessions...
            </p>
          </div>
        : sessions.length === 0 ?
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              No Active Sessions
            </h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
              You haven&apos;t created any sessions yet. Start by creating your
              first retrospective session!
            </p>
            <Link
              href="/session/create"
              className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              Create Your First Session
            </Link>
          </div>
        : <div>
            <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Your Active Sessions
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}>
                  <Link
                    href={`/session/${session.id}`}
                    className="block rounded-lg border border-zinc-200 bg-white p-6 transition-all hover:border-blue-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      {session.name}
                    </h3>
                    {session.description && (
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {session.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-zinc-500 dark:text-zinc-500">
                        Created {session.createdAt.toLocaleDateString()}
                      </span>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {session.currentStage.replace(/_/g, " ")}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        }
      </div>
    </div>
  );
}
