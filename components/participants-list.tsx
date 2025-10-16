"use client";

import { cn } from "@/lib/utils/cn";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface ActiveUser {
  id: string;
  name: string | null;
  image: string | null;
  lastSeenAt: Date;
}

interface ParticipantsListProps {
  activeUsers: ActiveUser[];
  userCount: number;
  currentUserId: string | null;
  trigger: React.ReactNode;
  className?: string;
}

export const ParticipantsList = ({
  activeUsers,
  userCount,
  currentUserId,
  trigger,
  className,
}: ParticipantsListProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sort users: current user first, then by recency (most recent first)
  const sortedUsers = [...activeUsers].sort((a, b) => {
    // Current user always comes first
    if (a.id === currentUserId && b.id !== currentUserId) return -1;
    if (b.id === currentUserId && a.id !== currentUserId) return 1;

    // Then sort by lastSeenAt (most recent first)
    return b.lastSeenAt.getTime() - a.lastSeenAt.getTime();
  });

  // Handle clicking outside to close (only if sticky)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSticky
        && dropdownRef.current
        && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsSticky(false);
        setIsVisible(false);
      }
    };

    if (isSticky) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isSticky]);

  const handleMouseEnter = () => {
    if (!isSticky) {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isSticky) {
      setIsVisible(false);
    }
  };

  const handleClick = () => {
    if (isSticky) {
      // If already sticky, close it
      setIsSticky(false);
      setIsVisible(false);
    } else {
      // Make it sticky
      setIsSticky(true);
      setIsVisible(true);
    }
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="cursor-pointer">
        {trigger}
      </div>

      {isVisible && (
        <div className="absolute top-full right-0 z-50 mt-2 w-64 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Participants ({userCount})
          </h3>
          <div className="max-h-[200px] space-y-2 overflow-y-auto">
            {sortedUsers.map((user) => {
              const isCurrentUser = user.id === currentUserId;
              return (
                <div key={user.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium dark:bg-zinc-800">
                    {user.image ?
                      <Image
                        src={user.image}
                        alt={user.name ?? "User"}
                        width={32}
                        height={32}
                        className="h-full w-full rounded-full object-cover"
                      />
                    : <span className="text-zinc-600 dark:text-zinc-400">
                        {(user.name ?? "U").charAt(0).toUpperCase()}
                      </span>
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {user.name ?? `User ${user.id.slice(-4)}`}
                      {isCurrentUser && (
                        <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">
                          (You)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
