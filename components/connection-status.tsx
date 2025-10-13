"use client";

import { useSocket } from "@/lib/socket/client";
import { cn } from "@/lib/utils/cn";

export const ConnectionStatus = () => {
  const { status, isConnected } = useSocket();

  if (isConnected) {
    return null; // Don't show when connected
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm shadow-lg",
          status === "connecting" &&
            "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
          status === "disconnected" &&
            "border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200",
          status === "error" &&
            "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
        )}
      >
        <div
          className={cn(
            "h-2 w-2 rounded-full",
            status === "connecting" && "animate-pulse bg-blue-500",
            status === "disconnected" && "bg-zinc-400",
            status === "error" && "bg-red-500",
          )}
        />
        <span className="font-medium">
          {status === "connecting" && "Connecting..."}
          {status === "disconnected" && "Offline"}
          {status === "error" && "Connection Error"}
        </span>
      </div>
    </div>
  );
};
