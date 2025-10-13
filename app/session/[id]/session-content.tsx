"use client";

import { PresenceTracker } from "@/components/presence-tracker";
import { useSessionEvent, useSessionRoom } from "@/lib/socket/client";
import type {
  MagicSessionWithDetails,
  SessionStage,
} from "@/lib/types/session";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SessionContentProps {
  sessionId: string;
  initialSession: MagicSessionWithDetails;
  userRole: string;
  isAdmin: boolean;
  userId: string | null;
}

export const SessionContent = ({
  sessionId,
  initialSession,
  userRole,
  isAdmin,
  userId,
}: SessionContentProps) => {
  const [currentStage, setCurrentStage] = useState<string>(
    initialSession.currentStage,
  );
  const router = useRouter();

  // Join the session room
  useSessionRoom(sessionId, userId);

  // Listen for stage changes
  useSessionEvent<{ sessionId: string; newStage: SessionStage }>(
    "stage:changed",
    (data) => {
      if (data.sessionId === sessionId) {
        setCurrentStage(data.newStage);
        // Optionally refresh to get updated server data
        router.refresh();
      }
    },
    [sessionId],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Back to Dashboard
          </Link>
          <PresenceTracker sessionId={sessionId} userId={userId} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {initialSession.name}
            </h1>
            {initialSession.description && (
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                {initialSession.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {currentStage.replace(/_/g, " ")}
            </span>
            {isAdmin && (
              <Link
                href={`/session/${sessionId}/admin`}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Admin Controls
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Categories Preview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initialSession.categories.map((category) => (
          <div
            key={category.id}
            className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            style={{
              borderLeftWidth: "4px",
              borderLeftColor: category.color,
            }}
          >
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              {category.name}
            </h3>
            {category.maxEntriesPerPerson && (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Max {category.maxEntriesPerPerson} per person
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Stage-specific content */}
      <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {currentStage === "pre_session" && "Session Not Started"}
          {currentStage === "green_room" && "Waiting to Begin"}
          {currentStage === "idea_collection" && "Collecting Ideas"}
          {currentStage === "idea_grouping" && "Grouping Ideas"}
          {currentStage === "idea_voting" && "Voting in Progress"}
          {currentStage === "idea_finalization" && "Finalizing Results"}
          {currentStage === "post_session" && "Session Complete"}
        </h2>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          {currentStage === "pre_session" &&
            "The facilitator will start the session soon."}
          {currentStage === "green_room" &&
            `${initialSession._count?.presence ?? 0} participants are here. Waiting for the facilitator to begin.`}
          {currentStage === "idea_collection" &&
            "Share your ideas anonymously."}
          {currentStage === "idea_grouping" && "Organize ideas into groups."}
          {currentStage === "idea_voting" &&
            "Vote on the most important ideas."}
          {currentStage === "idea_finalization" &&
            "Reviewing final results and action items."}
          {currentStage === "post_session" &&
            "Thank you for participating! View the results below."}
        </p>

        <div className="mt-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Stage-specific UI coming soon...
          </p>
        </div>
      </div>

      {/* Session Info */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {initialSession._count?.presence ?? 0}
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Active Participants
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {initialSession._count?.ideas ?? 0}
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Ideas Submitted
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {userRole}
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Your Role
          </div>
        </div>
      </div>
    </div>
  );
};
