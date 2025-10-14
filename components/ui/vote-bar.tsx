"use client";

interface VoteBarProps {
  voteCount: number;
  maxVotes: number;
  color?: string;
  showLabel?: boolean;
  label?: string;
}

export const VoteBar = ({
  voteCount,
  maxVotes,
  color = "#3b82f6", // blue-500
  showLabel = false,
  label,
}: VoteBarProps) => {
  const percentage = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;
  const cappedPercentage = Math.min(percentage, 100);

  return (
    <div className="space-y-1">
      {showLabel && label && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {label}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            {voteCount} {voteCount === 1 ? "vote" : "votes"}
          </span>
        </div>
      )}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full transition-all duration-300 ease-in-out"
          style={{
            width: `${cappedPercentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
};
