"use client";

import type { IdeaWithDetails } from "@/lib/types/session";

interface VoteHeatmapProps {
  ideas: IdeaWithDetails[];
  categoryColors: Record<string, string>;
}

export const VoteHeatmap = ({ ideas, categoryColors }: VoteHeatmapProps) => {
  // Find the max vote count to normalize the heatmap
  const maxVotes = Math.max(...ideas.map((idea) => idea._count.votes), 1);

  // Calculate opacity based on vote count (0.2 to 1.0)
  const MIN_OPACITY = 0.2;
  const OPACITY_RANGE = 0.8;
  const getOpacity = (voteCount: number) => {
    return MIN_OPACITY + (voteCount / maxVotes) * OPACITY_RANGE;
  };

  // Sort ideas by vote count descending
  const sortedIdeas = [...ideas].sort(
    (a, b) => b._count.votes - a._count.votes,
  );

  // Only show top 10 ideas for heatmap
  const topIdeas = sortedIdeas.slice(0, 10);

  if (topIdeas.length === 0) {
    return (
      <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        No votes yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        Top Ideas by Votes
      </div>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {topIdeas.map((idea) => {
          const categoryColor = categoryColors[idea.categoryId] || "#3b82f6";
          const opacity = getOpacity(idea._count.votes);

          return (
            <div
              key={idea.id}
              className="group relative aspect-square rounded transition-transform hover:scale-110"
              style={{ backgroundColor: categoryColor, opacity }}
              title={`${idea.content.substring(0, 50)}${idea.content.length > 50 ? "..." : ""} - ${idea._count.votes} votes`}>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                {idea._count.votes}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>Less votes</span>
        <span>More votes</span>
      </div>
    </div>
  );
};
