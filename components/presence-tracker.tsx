"use client";

import { useSession } from "@/lib/contexts/firebase-session-context";
import { cn } from "@/lib/utils/cn";
import Image from "next/image";
import { useState } from "react";

interface PresenceTrackerProps {
  sessionId: string;
  userId: string | null;
}

export const PresenceTracker = ({
  sessionId: _sessionId,
  userId,
}: PresenceTrackerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const { activeUsers, userCount } = useSession();

  // Convert Firebase active users to participants count
  const activeCount = userCount;

  return (
    <div className="relative">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        <div className="flex -space-x-1">
          {activeUsers.slice(0, 3).map((user, index) => (
            <div
              key={user.id}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-xs font-medium dark:border-zinc-900",
                index === 0 && "bg-blue-500 text-white",
                index === 1 && "bg-green-500 text-white",
                index === 2 && "bg-purple-500 text-white",
              )}
            >
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
      </button>

      {isVisible && (
        <div className="absolute top-full right-0 z-10 mt-2 w-64 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Active Participants ({activeCount})
          </h3>
          <div className="space-y-2">
            {activeUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium dark:bg-zinc-800">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name ?? "User"}
                      width={32}
                      height={32}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {(user.name ?? "U").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {user.name ?? `User ${user.id.slice(-4)}`}
                    {user.id === userId && " (You)"}
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Online
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
