"use client";

import { useSession } from "@/lib/contexts/firebase-session-context";
import { SessionLoading } from "@/components/session/session-loading";
import { PresentationGreenRoom } from "./presentation-green-room";
import { PresentationIdeaCollection } from "./presentation-idea-collection";
import { PresentationVoting } from "./presentation-voting";
import { PresentationGrouping } from "./presentation-grouping";
import { PresentationFinalization } from "./presentation-finalization";

interface PresentationViewProps {
  sessionId: string;
}

export function PresentationView({ sessionId }: PresentationViewProps) {
  const {
    session,
    ideas,
    groups,
    currentStage,
    userCount,
    isLoading,
    activeUsers,
  } = useSession();

  // Show loading state while session data is being fetched
  if (isLoading || !session) {
    return <SessionLoading sessionId={sessionId} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Full-screen presentation area - no header, no chrome */}
      <main className="h-screen w-screen overflow-hidden p-8">
        {currentStage === "green_room" && (
          <PresentationGreenRoom
            session={session}
            userCount={userCount}
            activeUsers={activeUsers}
            startTime={session.settings?.greenRoomStartTime}
          />
        )}

        {currentStage === "idea_collection" && (
          <PresentationIdeaCollection
            session={session}
            ideas={ideas}
            userCount={userCount}
            timerEnd={session.settings?.ideaCollectionTimerEnd}
            submissionsEnabled={session.settings?.ideaCollectionEnabled ?? true}
          />
        )}

        {currentStage === "idea_voting" && (
          <PresentationVoting
            session={session}
            ideas={ideas}
            groups={groups}
            userCount={userCount}
          />
        )}

        {currentStage === "idea_grouping" && (
          <PresentationGrouping
            session={session}
            ideas={ideas}
            groups={groups}
          />
        )}

        {currentStage === "idea_finalization" && (
          <PresentationFinalization
            session={session}
            ideas={ideas}
            groups={groups}
          />
        )}

        {(currentStage === "pre_session" || currentStage === "post_session") && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-white">
                {session.name}
              </h1>
              <p className="mt-4 text-2xl text-zinc-400">
                {currentStage === "pre_session"
                  ? "Session not started yet"
                  : "Session completed"}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
