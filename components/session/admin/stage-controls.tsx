"use client";

import { useSession } from "@/lib/contexts/firebase-session-context";
import type { SessionStage } from "@/lib/types/session";
import { cn } from "@/lib/utils/cn";
import { useState, useTransition } from "react";
import { announce } from "@/lib/utils/a11y";

const STAGES: { value: SessionStage; label: string; description: string }[] = [
  {
    value: "pre_session",
    label: "Pre-Session",
    description: "Before the session begins",
  },
  {
    value: "green_room",
    label: "Green Room",
    description: "Waiting for participants to join",
  },
  {
    value: "idea_collection",
    label: "Idea Collection",
    description: "Collect ideas anonymously",
  },
  {
    value: "idea_grouping",
    label: "Idea Grouping",
    description: "Organize ideas into groups",
  },
  {
    value: "idea_voting",
    label: "Voting",
    description: "Vote on the most important ideas",
  },
  {
    value: "idea_finalization",
    label: "Finalization",
    description: "Review and assign action items",
  },
  {
    value: "post_session",
    label: "Post-Session",
    description: "Session complete",
  },
];

interface StageControlsProps {
  sessionId: string;
  currentStage: string;
  userId: string;
}

export const StageControls = ({
  sessionId: _sessionId,
  currentStage: _initialStage,
  userId: _userId,
}: StageControlsProps) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { currentStage, changeStage } = useSession();

  const handleStageChange = async (newStage: SessionStage) => {
    setError(null);

    startTransition(async () => {
      try {
        console.log("🎭 Admin changing stage to:", newStage);
        // Use Firebase context method which handles both DB update and real-time sync
        await changeStage(newStage);
        console.log("✅ Stage changed successfully via Firebase");

        // Announce stage change to screen readers
        const stageLabel =
          STAGES.find((s) => s.value === newStage)?.label ?? newStage;
        announce(`Stage changed to ${stageLabel}`, "polite");
      } catch (err) {
        console.error("🔴 Stage change error:", err);
        const errorMsg =
          err instanceof Error ? err.message : "Failed to change stage";
        setError(errorMsg);
        announce(`Error: ${errorMsg}`, "assertive");
      }
    });
  };

  const currentIndex = STAGES.findIndex((s) => s.value === currentStage);

  return (
    <div
      className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      role="region"
      aria-label="Stage management controls">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Stage Management
        </h2>
        {isPending && (
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Updating...
          </span>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {STAGES.map((stage, index) => {
          const isCurrent = stage.value === currentStage;
          const isPast = index < currentIndex;

          return (
            <button
              key={stage.value}
              onClick={() => handleStageChange(stage.value)}
              disabled={isPending}
              aria-label={`Change to ${stage.label} stage: ${stage.description}`}
              aria-current={isCurrent ? "true" : undefined}
              className={cn(
                "w-full rounded-lg border p-4 text-left transition-all",
                isCurrent
                  && "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-950",
                !isCurrent
                  && isPast
                  && "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50",
                !isCurrent
                  && !isPast
                  && "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700",
                isPending && "cursor-not-allowed opacity-50",
              )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                      isCurrent && "bg-blue-500 text-white",
                      !isCurrent
                        && isPast
                        && "bg-zinc-300 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300",
                      !isCurrent
                        && !isPast
                        && "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
                    )}>
                    {index + 1}
                  </div>
                  <div>
                    <div
                      className={cn(
                        "font-medium",
                        isCurrent && "text-blue-900 dark:text-blue-100",
                        !isCurrent && "text-zinc-900 dark:text-zinc-50",
                      )}>
                      {stage.label}
                    </div>
                    <div
                      className={cn(
                        "text-sm",
                        isCurrent && "text-blue-700 dark:text-blue-300",
                        !isCurrent && "text-zinc-600 dark:text-zinc-400",
                      )}>
                      {stage.description}
                    </div>
                  </div>
                </div>
                {isCurrent && (
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    Current
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex gap-3">
        {currentIndex > 0 && (
          <button
            onClick={() => handleStageChange(STAGES[currentIndex - 1].value)}
            disabled={isPending}
            aria-label={`Go to previous stage: ${STAGES[currentIndex - 1].label}`}
            className="flex-1 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
            ← Previous Stage
          </button>
        )}
        {currentIndex < STAGES.length - 1 && (
          <button
            onClick={() => handleStageChange(STAGES[currentIndex + 1].value)}
            disabled={isPending}
            aria-label={`Go to next stage: ${STAGES[currentIndex + 1].label}`}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
            Next Stage →
          </button>
        )}
      </div>

      {/* Stage-specific controls */}
      {currentStage === "idea_collection" && (
        <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Idea Collection Controls
          </h3>
          <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-400">
            Control when participants can submit ideas. This is a graceful
            disable - participants can finish submitting ideas they started.
          </p>
          {/* Note: Actual implementation would require Firebase settings update */}
          <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              💡 Tip: Use the timer to set a countdown, then disable submissions
              before advancing to the next stage.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
