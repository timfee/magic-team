"use client";

import { cn } from "@/lib/utils/cn";

export const ConnectionStatus = () => {
  // Firebase/Firestore maintains persistent connection automatically
  // Only show connection status when there are actual connection issues
  // For now, we assume Firebase is always connected (it handles reconnection internally)
  const isConnected = true;

  if (isConnected) {
    return null; // Don't show when connected (Firebase default)
  }

  // This would only show if we implement Firebase connection state monitoring
  return (
    <div className="fixed right-4 bottom-4 z-50">
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm shadow-lg",
          "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
        )}
      >
        <div className={cn("h-2 w-2 rounded-full bg-red-500")} />
        <span className="font-medium">Connection Error</span>
      </div>
    </div>
  );
};
