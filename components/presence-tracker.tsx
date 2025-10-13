"use client";

import { useSession } from "@/lib/contexts/firebase-session-context";
import { cn } from "@/lib/utils/cn";
import Image from "next/image";
import { ParticipantsList } from "./participants-list";

interface PresenceTrackerProps {
  sessionId: string;
  userId: string | null;
}

export const PresenceTracker = ({
  sessionId: _sessionId,
  userId,
}: PresenceTrackerProps) => {
  const { activeUsers, userCount } = useSession();

  // Convert Firebase active users to participants count
  const activeCount = userCount;

  const trigger = (
    <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
      <div className="flex -space-x-1">
        {activeUsers.slice(0, 3).map((user, index) => (
          <div
            key={user.id}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-xs font-medium dark:border-zinc-900",
              // Only apply background colors if there's no image
              !user.image && index === 0 && "bg-blue-500 text-white",
              !user.image && index === 1 && "bg-green-500 text-white",
              !user.image && index === 2 && "bg-purple-500 text-white",
            )}>
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "User"}
                width={24}
                height={24}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span>{(user.name ?? "U").charAt(0).toUpperCase()}</span>
            )}
          </div>
        ))}
        {activeCount > 3 && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-zinc-400 text-xs font-medium text-white dark:border-zinc-900">
            +{activeCount - 3}
          </div>
        )}
      </div>
      <span>{activeCount} online</span>
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
