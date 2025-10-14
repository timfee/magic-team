"use client";

import { cn } from "@/lib/utils/cn";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

interface User {
  id: string;
  name: string | null;
  image: string | null;
}

interface AnimatedFacepileProps {
  users: User[];
  maxVisible?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const AnimatedFacepile = ({
  users,
  maxVisible = 8,
  size = "md",
  className,
}: AnimatedFacepileProps) => {
  const [displayUsers, setDisplayUsers] = useState<User[]>([]);
  const [newUserIds, setNewUserIds] = useState<Set<string>>(new Set());
  const prevUserIdsRef = useRef<Set<string>>(new Set());

  // Size configurations
  const sizeConfig = (() => {
    switch (size) {
      case "sm":
        return {
          avatarSize: "h-8 w-8",
          textSize: "text-xs",
          spacing: "gap-2",
        };
      case "lg":
        return {
          avatarSize: "h-16 w-16",
          textSize: "text-base",
          spacing: "gap-3",
        };
      default: // md
        return {
          avatarSize: "h-12 w-12",
          textSize: "text-sm",
          spacing: "gap-2",
        };
    }
  })();

  // Detect new users and update display
  useEffect(() => {
    const currentUserIds = new Set(users.map((u) => u.id));
    const previousUserIds = prevUserIdsRef.current;

    // Find newly added users
    const addedIds = new Set(
      [...currentUserIds].filter((id) => !previousUserIds.has(id))
    );

    if (addedIds.size > 0) {
      setNewUserIds(addedIds);
      // Clear the "new" state after animation completes
      setTimeout(() => {
        setNewUserIds(new Set());
      }, 1000);
    }

    // Update display and prev ref
    setDisplayUsers(users);
    prevUserIdsRef.current = currentUserIds;
  }, [users]);

  const visibleUsers = displayUsers.slice(0, maxVisible);
  const remainingCount = Math.max(0, displayUsers.length - maxVisible);

  if (displayUsers.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center",
        sizeConfig.spacing,
        className
      )}
    >
      {visibleUsers.map((user, index) => {
        const isNew = newUserIds.has(user.id);
        return (
          <div
            key={user.id}
            className={cn(
              "relative flex items-center justify-center rounded-full border-4 border-white bg-zinc-100 font-medium shadow-lg transition-all duration-500 dark:border-zinc-900 dark:bg-zinc-800",
              sizeConfig.avatarSize,
              sizeConfig.textSize,
              // Pop-in animation for new users
              isNew && "animate-[scale-in_0.5s_ease-out]",
              // Subtle floating animation
              "animate-[float_3s_ease-in-out_infinite]"
            )}
            style={{
              animationDelay: `${index * 0.1}s`,
              zIndex: 10 + index,
            }}
          >
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "User"}
                width={size === "sm" ? 32 : size === "lg" ? 64 : 48}
                height={size === "sm" ? 32 : size === "lg" ? 64 : 48}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-zinc-600 dark:text-zinc-400">
                {(user.name ?? "U").charAt(0).toUpperCase()}
              </span>
            )}
            {/* Ripple effect for new users */}
            {isNew && (
              <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-[ping_1s_ease-out]" />
            )}
          </div>
        );
      })}

      {remainingCount > 0 && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full border-4 border-white bg-blue-500 font-bold text-white shadow-lg transition-all duration-300 dark:border-zinc-900 animate-[float_3s_ease-in-out_infinite]",
            sizeConfig.avatarSize,
            sizeConfig.textSize
          )}
          style={{
            animationDelay: `${visibleUsers.length * 0.1}s`,
            zIndex: 10 + visibleUsers.length,
          }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};
