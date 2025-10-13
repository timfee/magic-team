"use client";

import { useEffect, useState } from "react";
import { useSessionRoom, useSessionEvent } from "@/lib/socket/client";
import type { PresenceUpdateEvent } from "@/lib/types/session";

interface PresenceTrackerProps {
  sessionId: string;
  userId: string | null;
}

export const PresenceTracker = ({ sessionId, userId }: PresenceTrackerProps) => {
  const [activeUsers, setActiveUsers] = useState<
    { id: string; name: string | null; image: string | null }[]
  >([]);

  // Join the session room
  useSessionRoom(sessionId, userId);

  // Listen for presence updates
  useSessionEvent<PresenceUpdateEvent>(
    "presence:update",
    (data) => {
      if (data.sessionId === sessionId) {
        setActiveUsers(data.activeUsers);
      }
    },
    [sessionId],
  );

  // Listen for presence changes (removed auto-reload - too disruptive)
  // The presence:update event handles the real-time user list

  if (activeUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {activeUsers.slice(0, 5).map((user) => (
          <div
            key={user.id}
            className="h-8 w-8 rounded-full border-2 border-white bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-700"
            title={user.name || "Anonymous"}
          >
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {user.name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>
        ))}
      </div>
      {activeUsers.length > 5 && (
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          +{activeUsers.length - 5}
        </span>
      )}
    </div>
  );
};
