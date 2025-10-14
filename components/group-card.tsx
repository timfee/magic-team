"use client";

import type { IdeaGroupWithDetails } from "@/lib/types/session";

interface GroupCardProps {
  group: IdeaGroupWithDetails;
  categoryColor: string;
  showVotes?: boolean;
}

export const GroupCard = ({
  group,
  categoryColor,
  showVotes = true,
}: GroupCardProps) => {
  const ideaCount = group._count?.ideas ?? 0;
  const voteCount = group._count?.votes ?? 0;

  return (
    <div
      data-testid="group-card"
      className="group relative rounded-lg border bg-white p-4 transition-all hover:shadow-md border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900"
      style={{ borderLeftWidth: "3px", borderLeftColor: categoryColor }}>
      <div className="space-y-2">
        <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">
          {group.title && group.title.trim() !== ""
            ? group.title
            : "Untitled Group"}
        </h4>

        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          {ideaCount} {ideaCount === 1 ? "idea" : "ideas"}
        </div>

        {/* Show first few ideas as preview */}
        {group.ideas && group.ideas.length > 0 && (
          <div className="space-y-1 text-xs text-zinc-500 dark:text-zinc-500">
            {group.ideas.slice(0, 2).map((idea) => (
              <div key={idea.id} className="truncate">
                • {idea.content}
              </div>
            ))}
            {group.ideas.length > 2 && (
              <div className="italic">+{group.ideas.length - 2} more...</div>
            )}
          </div>
        )}
      </div>

      {showVotes && voteCount > 0 && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <svg
            className="h-4 w-4 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium text-red-600 dark:text-red-400">
            {voteCount}
          </span>
        </div>
      )}
    </div>
  );
};
