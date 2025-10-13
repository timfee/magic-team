"use client";

import { useSession } from "@/lib/contexts/firebase-session-context";
import { ParticipantsList } from "./participants-list";
import { Facepile } from "./ui/facepile";

interface PresenceTrackerProps {
  sessionId: string;
  userId: string | null;
}

export const PresenceTracker = ({
  sessionId: _sessionId,
  userId,
}: PresenceTrackerProps) => {
  const { activeUsers, userCount } = useSession();

  const trigger = (
    <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
      <Facepile users={activeUsers} maxVisible={4} size="sm" />
      <span>{userCount} online</span>
    </div>
  );

  return (
    <ParticipantsList
      activeUsers={activeUsers}
      userCount={userCount}
      currentUserId={userId}
      trigger={trigger}
    />
  );
};
