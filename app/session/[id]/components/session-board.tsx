"use client";

import { useSession } from "@/lib/contexts/session-context";
import Link from "next/link";
import { GreenRoom } from "./stages/green-room";
import { IdeaCollection } from "./stages/idea-collection";
import { IdeaVoting } from "./stages/idea-voting";
import { IdeaGrouping } from "./stages/idea-grouping";
import { getUserRole } from "@/lib/utils/permissions";

export default function SessionBoard() {
  const { session, ideas, groups, currentStage, userCount, isConnected, userId } = useSession();

  // Determine if user is admin
  const userRole = getUserRole(session, userId);

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

              {/* Admin Button */}
              {(userRole === "owner" || userRole === "admin") && (
                <Link
                  href={`/session/${session.id}/admin`}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Admin Controls
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Render stage-specific components */}
        {currentStage === "pre_session" && (
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Session Not Started
              </h2>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">
                The facilitator will start the session soon. Please wait...
              </p>
              <div className="mt-8 rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                  {session.name}
                </h3>
                {session.description && (
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {session.description}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  {session.categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center gap-2"
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {category.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStage === "green_room" && (
          <GreenRoom sessionId={session.id} initialUserCount={userCount} />
        )}

        {currentStage === "idea_collection" && (
          <IdeaCollection
            sessionId={session.id}
            categories={session.categories}
            initialIdeas={ideas}
            userId={userId}
          />
        )}

        {currentStage === "idea_voting" && session.settings && (
          <IdeaVoting
            sessionId={session.id}
            categories={session.categories}
            ideas={ideas}
            settings={session.settings}
            userId={userId}
          />
        )}

        {currentStage === "idea_grouping" && (
          <IdeaGrouping
            sessionId={session.id}
            categories={session.categories}
            initialIdeas={ideas}
            initialGroups={groups}
          />
        )}

        {(currentStage === "idea_finalization" ||
          currentStage === "post_session") && (
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {currentStage === "idea_finalization" && "Finalizing Results"}
              {currentStage === "post_session" && "Session Complete"}
            </h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
              {currentStage === "idea_finalization" &&
                "Review final results and action items. This stage is coming soon!"}
              {currentStage === "post_session" &&
                "Thank you for participating! Results view coming soon."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
