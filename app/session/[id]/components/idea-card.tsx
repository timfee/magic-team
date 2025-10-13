"use client";

import type { IdeaWithDetails } from "@/lib/types/session";

interface IdeaCardProps {
  idea: IdeaWithDetails;
  categoryColor: string;
}

export const IdeaCard = ({ idea, categoryColor }: IdeaCardProps) => {
  return (
    <div
      className="group relative rounded-lg border border-zinc-200 bg-white p-4 transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
      style={{
        borderLeftWidth: "3px",
        borderLeftColor: categoryColor,
      }}
    >
      <p className="text-zinc-900 dark:text-zinc-50">{idea.content}</p>

      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500">
        <div className="flex items-center gap-2">
          {!idea.isAnonymous && idea.author && (
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {idea.author.name ?? "Unknown"}
            </span>
          )}
          {idea.isAnonymous && (
            <span className="italic">Anonymous</span>
          )}
        </div>

        {(idea._count?.votes ?? 0) > 0 && (
          <div className="flex items-center gap-1">
            <svg
              className="h-4 w-4 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium text-red-600 dark:text-red-400">
              {idea._count.votes}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
