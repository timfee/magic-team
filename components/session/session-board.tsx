"use client";

import { ParticipantsList } from "@/components/participants-list";
import { SessionLoading } from "@/components/session/session-loading";
import { GreenRoom } from "@/components/session/stages/green-room";
import { IdeaCollection } from "@/components/session/stages/idea-collection";
import { IdeaGrouping } from "@/components/session/stages/idea-grouping";
import { IdeaVoting } from "@/components/session/stages/idea-voting";
import { IdeaFinalization } from "@/components/session/stages/idea-finalization";
import { PostSession } from "@/components/session/stages/post-session";
import { Facepile } from "@/components/ui/facepile";
import { useSession } from "@/lib/contexts/firebase-session-context";
import { getUserRole } from "@/lib/utils/permissions";
import Link from "next/link";

interface SessionBoardProps {
  sessionId: string;
}

export default function SessionBoard({ sessionId }: SessionBoardProps) {
  const {
    session,
    ideas,
    groups,
    currentStage,
    userCount,
    isConnected,
    isLoading,
    userId,
    activeUsers,
  } = useSession();

  // Show loading state while session data is being fetched
  if (isLoading || !session) {
    return <SessionLoading sessionId={sessionId} />;
  }

  // Determine if current user is admin
  const userRole = userId ? getUserRole(session, userId) : "participant";
  const isAdmin = userRole === "owner" || userRole === "admin";

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
              <ParticipantsList
                activeUsers={activeUsers}
                userCount={userCount}
                currentUserId={userId}
                trigger={
                  <div className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800">
                    <Facepile users={activeUsers} maxVisible={4} size="sm" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {userCount}{" "}
                      {userCount === 1 ? "participant" : "participants"}
                    </span>
                  </div>
                }
              />

              {/* Current Stage */}
              <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-900 dark:bg-blue-950">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {currentStage.replace(/_/g, " ")}
                </span>
              </div>

              {/* Admin Button */}
              <Link
                href={`/session/${session.id}/admin`}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
                Admin Controls
              </Link>
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
                    <div key={category.id} className="flex items-center gap-2">
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
          <GreenRoom
            sessionId={session.id}
            initialUserCount={userCount}
            startTime={session.settings?.greenRoomStartTime}
          />
        )}

        {currentStage === "idea_collection" && (
          <IdeaCollection
            sessionId={session.id}
            categories={session.categories}
            initialIdeas={ideas}
            userId={userId}
            timerEnd={session.settings?.ideaCollectionTimerEnd}
            submissionsEnabled={session.settings?.ideaCollectionEnabled ?? true}
          />
        )}

        {currentStage === "idea_voting" && session.settings && (
          <IdeaVoting
            sessionId={session.id}
            categories={session.categories}
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
            userId={userId}
            isAdmin={isAdmin}
          />
        )}

        {currentStage === "idea_finalization" && (
          <IdeaFinalization
            sessionId={session.id}
            categories={session.categories}
          />
        )}

        {currentStage === "post_session" && (
          <PostSession
            sessionId={session.id}
            sessionName={session.name}
            categories={session.categories}
            createdAt={session.createdAt}
          />
        )}
      </main>
    </div>
  );
}
