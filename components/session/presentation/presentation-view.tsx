"use client";

import { SessionLoading } from "@/components/session/session-loading";
import { getSessionCategories } from "@/lib/actions/categories";
import { useSession } from "@/lib/contexts/firebase-session-context";
import type { Category } from "@/lib/types/session";
import { useEffect, useState } from "react";
import { PresentationFinalization } from "./presentation-finalization";
import { PresentationGreenRoom } from "./presentation-green-room";
import { PresentationGrouping } from "./presentation-grouping";
import { PresentationIdeaCollection } from "./presentation-idea-collection";
import { PresentationVoting } from "./presentation-voting";

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

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      if (!session?.id) return;

      try {
        setCategoriesLoading(true);
        const sessionCategories = await getSessionCategories(session.id);
        setCategories(sessionCategories);
      } catch (error) {
        console.error("Error loading categories:", error);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    void loadCategories();
  }, [session?.id]);

  // Show loading state while session data is being fetched
  if (isLoading || !session || categoriesLoading) {
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
            session={{ ...session, categories }}
            ideas={ideas}
            userCount={userCount}
            timerEnd={session.settings?.ideaCollectionTimerEnd}
            submissionsEnabled={session.settings?.ideaCollectionEnabled ?? true}
          />
        )}

        {currentStage === "idea_voting" && (
          <PresentationVoting
            session={{ ...session, categories }}
            ideas={ideas}
            groups={groups}
            userCount={userCount}
          />
        )}

        {currentStage === "idea_grouping" && (
          <PresentationGrouping
            session={{ ...session, categories }}
            ideas={ideas}
            groups={groups}
          />
        )}

        {currentStage === "idea_finalization" && (
          <PresentationFinalization
            session={{ ...session, categories }}
            ideas={ideas}
            groups={groups}
          />
        )}

        {(currentStage === "pre_session"
          || currentStage === "post_session") && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-white">{session.name}</h1>
              <p className="mt-4 text-2xl text-zinc-400">
                {currentStage === "pre_session" ?
                  "Session not started yet"
                : "Session completed"}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
