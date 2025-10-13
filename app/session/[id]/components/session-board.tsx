"use client";

import { useSession } from "@/lib/contexts/session-context";
import Link from "next/link";
import Image from "next/image";

export default function SessionBoard() {
  const { session, currentStage, activeUsers, userCount, isConnected } = useSession();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                ← Back to Sessions
              </Link>
              <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {session.name}
              </h1>
              {session.description && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {session.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>

              {/* User Count */}
              <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                <svg
                  className="h-4 w-4 text-zinc-600 dark:text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {userCount} {userCount === 1 ? "participant" : "participants"}
                </span>
              </div>

              {/* Current Stage */}
              <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-900 dark:bg-blue-950">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {currentStage.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Session Board
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Current stage: <strong>{currentStage}</strong>
          </p>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
            Stage-specific components will be rendered here based on the current stage.
          </p>

          {/* Active Users */}
          {activeUsers.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Active Participants:
              </h3>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {activeUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    {user.image && (
                      <Image
                        src={user.image}
                        alt={user.name ?? "User"}
                        width={20}
                        height={20}
                        className="h-5 w-5 rounded-full"
                      />
                    )}
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {user.name ?? "Anonymous"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
