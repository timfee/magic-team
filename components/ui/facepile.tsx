"use client";

import { cn } from "@/lib/utils/cn";
import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";

interface User {
  id: string;
  name: string | null;
  image: string | null;
}

interface FacepileProps {
  users: User[];
  maxVisible?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Facepile = ({
  users,
  maxVisible = 4,
  size = "md",
  className,
}: FacepileProps) => {
  const [displayUsers, setDisplayUsers] = useState(users);
  const lastUpdateTimeRef = useRef(Date.now());
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Size configurations
  const sizeConfig = useMemo(() => {
    switch (size) {
      case "sm":
        return {
          avatarSize: "h-6 w-6",
          textSize: "text-xs",
          spacing: "-space-x-1",
        };
      case "lg":
        return {
          avatarSize: "h-10 w-10",
          textSize: "text-sm",
          spacing: "-space-x-2",
        };
      default: // md
        return {
          avatarSize: "h-8 w-8",
          textSize: "text-xs",
          spacing: "-space-x-1.5",
        };
    }
  }, [size]);

  // Rate limited update function
  const updateUsers = useCallback((newUsers: User[]) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    const MIN_UPDATE_INTERVAL = 60000; // 1 minute

    if (timeSinceLastUpdate >= MIN_UPDATE_INTERVAL) {
      setDisplayUsers(newUsers);
      lastUpdateTimeRef.current = now;
    } else {
      // Clear existing timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // Schedule an update for when the rate limit expires
      updateTimeoutRef.current = setTimeout(() => {
        setDisplayUsers(newUsers);
        lastUpdateTimeRef.current = Date.now();
        updateTimeoutRef.current = null;
      }, MIN_UPDATE_INTERVAL - timeSinceLastUpdate);
    }
  }, []);

  // Update when users change
  useMemo(() => {
    updateUsers(users);
  }, [users, updateUsers]);

  const visibleUsers = displayUsers.slice(0, maxVisible);
  const remainingCount = Math.max(0, displayUsers.length - maxVisible);

  if (displayUsers.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center", sizeConfig.spacing, className)}>
      {visibleUsers.map((user, index) => (
        <div
          key={user.id}
          className={cn(
            "flex items-center justify-center rounded-full border-2 border-white bg-zinc-100 font-medium transition-all duration-300 dark:border-zinc-900 dark:bg-zinc-800",
            sizeConfig.avatarSize,
            sizeConfig.textSize,
          )}
          style={{
            transform: `translateX(${index * -4}px)`,
            zIndex: 10 + index,
          }}>
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "User"}
              width={size === "sm" ? 24 : size === "lg" ? 40 : 32}
              height={size === "sm" ? 24 : size === "lg" ? 40 : 32}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span className="text-zinc-600 dark:text-zinc-400">
              {(user.name ?? "U").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full border-2 border-white bg-zinc-400 font-medium text-white transition-all duration-300 dark:border-zinc-900",
            sizeConfig.avatarSize,
            sizeConfig.textSize,
          )}
          style={{
            transform: `translateX(${visibleUsers.length * -4}px)`,
            zIndex: 10 + visibleUsers.length,
          }}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
};
