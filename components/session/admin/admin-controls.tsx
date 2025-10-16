"use client";

import { useSession } from "@/lib/contexts/firebase-session-context";
import Link from "next/link";
import { SessionConfig } from "./session-config";
import { StageControls } from "./stage-controls";

interface AdminControlsProps {
  sessionId: string;
}

export const AdminControls = ({ sessionId }: AdminControlsProps) => {
  const { session, userCount, ideas, isLoading } = useSession();

  // Show loading state while session data is being fetched
  if (isLoading || !session) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="h-6 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-4 space-y-2">
              <div className="h-4 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-36 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="h-6 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-4 space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main controls */}
      <div className="space-y-6 lg:col-span-2">
        <StageControls
          sessionId={sessionId}
          currentStage={session.currentStage}
          userId="anonymous-user"
        />

        {/* Session Configuration */}
        <SessionConfig sessionId={sessionId} />

        {/* Quick Stats */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Session Stats
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {userCount}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Active Users
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {ideas.length}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Ideas
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {session.categories?.length || 0}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Categories
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Presentation View */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
            Presentation Mode
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Display on a projector or shared screen
          </p>
          <Link
            href={`/session/${sessionId}/presentation`}
            target="_blank"
            className="mt-4 block w-full rounded-md bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
            Open Presentation View
          </Link>
        </div>

        {/* Session Info */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
            Session Info
          </h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-zinc-600 dark:text-zinc-400">Session Name</dt>
              <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">
                {session.name}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-600 dark:text-zinc-400">Visibility</dt>
              <dd className="mt-1 font-medium text-zinc-900 capitalize dark:text-zinc-50">
                {session.visibility}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-600 dark:text-zinc-400">
                Current Stage
              </dt>
              <dd className="mt-1 font-medium text-zinc-900 capitalize dark:text-zinc-50">
                {session.currentStage.replace(/_/g, " ")}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};
