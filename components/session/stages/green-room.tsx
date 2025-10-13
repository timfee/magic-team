"use client";

import { useSession } from "@/lib/contexts/firebase-session-context";

interface GreenRoomProps {
  sessionId: string;
  initialUserCount: number;
}

export const GreenRoom = ({
  sessionId: _sessionId,
  initialUserCount: _initialUserCount,
}: GreenRoomProps) => {
  const { userCount } = useSession();

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <svg
              className="h-12 w-12 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Green Room
          </h2>
        </div>

        <p className="mb-6 text-lg text-zinc-600 dark:text-zinc-400">
          {userCount === 1
            ? "You're the first one here!"
            : `${userCount} participants are ready`}
        </p>

        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          Waiting for the facilitator to start the session...
        </p>

        {/* Animated waiting dots */}
        <div className="mt-8 flex justify-center gap-2">
          <div
            className="h-2 w-2 animate-pulse rounded-full bg-blue-600 dark:bg-blue-400"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="h-2 w-2 animate-pulse rounded-full bg-blue-600 dark:bg-blue-400"
            style={{ animationDelay: "0.2s" }}
          />
          <div
            className="h-2 w-2 animate-pulse rounded-full bg-blue-600 dark:bg-blue-400"
            style={{ animationDelay: "0.4s" }}
          />
        </div>
      </div>
    </div>
  );
};
