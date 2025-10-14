"use client";

import { castVote, getUserVotes, removeVote } from "@/lib/actions/votes";
import { useSession } from "@/lib/contexts/firebase-session-context";
import type { Category, SessionSettings } from "@/lib/types/session";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { IdeaCard } from "@/components/idea-card";
import { GroupCard } from "@/components/group-card";
import { VoteBar } from "@/components/ui/vote-bar";
import { VoteHeatmap } from "@/components/ui/vote-heatmap";

interface VoteData {
  ideaId?: string;
  groupId?: string;
  voteId: string;
  categoryId: string;
}

interface IdeaVotingProps {
  sessionId: string;
  categories: Category[];
  settings: SessionSettings;
  userId: string;
}

export const IdeaVoting = ({
  sessionId,
  categories,
  settings,
  userId,
}: IdeaVotingProps) => {
  const { ideas, groups } = useSession();
  const [myVotes, setMyVotes] = useState<VoteData[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Load user's votes
  useEffect(() => {
    startTransition(async () => {
      const votes = await getUserVotes(sessionId, userId);
      setMyVotes(
        votes.map((v) => ({
          ideaId: v.ideaId,
          groupId: v.groupId,
          voteId: v.id,
          categoryId: v.categoryId,
        })),
      );
    });
  }, [sessionId, userId]);

  const handleVote = async (
    categoryId: string,
    target: { ideaId?: string; groupId?: string },
  ) => {
    setError(null);

    startTransition(async () => {
      try {
        const voteInput = target.ideaId
          ? { sessionId, categoryId, ideaId: target.ideaId }
          : { sessionId, categoryId, groupId: target.groupId! };

        const result = await castVote(voteInput, userId);

        setMyVotes((prev) => [
          ...prev,
          {
            ...(target.ideaId ? { ideaId: target.ideaId } : {}),
            ...(target.groupId ? { groupId: target.groupId } : {}),
            voteId: result.voteId,
            categoryId,
          },
        ]);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to cast vote");
      }
    });
  };

  const handleUnvote = async (voteId: string) => {
    setError(null);

    startTransition(async () => {
      try {
        await removeVote(voteId, sessionId);
        setMyVotes((prev) => prev.filter((v) => v.voteId !== voteId));
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove vote");
      }
    });
  };

  const hasVotedIdea = (ideaId: string) =>
    myVotes.some((v) => v.ideaId === ideaId);
  const hasVotedGroup = (groupId: string) =>
    myVotes.some((v) => v.groupId === groupId);
  const getVoteId = (target: { ideaId?: string; groupId?: string }) =>
    myVotes.find((v) =>
      target.ideaId ? v.ideaId === target.ideaId : v.groupId === target.groupId,
    )?.voteId;

  const votesRemaining = settings.votesPerUser
    ? settings.votesPerUser - myVotes.length
    : Infinity;

  // Calculate votes per category
  const getVotesInCategory = (categoryId: string) => {
    return myVotes.filter((v) => v.categoryId === categoryId).length;
  };

  // Get category vote limit
  const getCategoryVotesRemaining = (categoryId: string) => {
    if (!settings.maxVotesPerCategory) return Infinity;
    const used = getVotesInCategory(categoryId);
    return Math.max(0, settings.maxVotesPerCategory - used);
  };

  // Sort ideas by vote count
  const sortedIdeas = [...ideas].sort(
    (a, b) => b._count.votes - a._count.votes,
  );

  // Create category color map for heatmap
  const categoryColorMap = categories.reduce(
    (acc, cat) => {
      acc[cat.id] = cat.color;
      return acc;
    },
    {} as Record<string, string>,
  );

  return (
    <div className="space-y-8">
      {/* Voting Stats */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Cast Your Votes
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Vote on the ideas you think are most important
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {settings.votesPerUser ? myVotes.length : "∞"} /{" "}
              {settings.votesPerUser ?? "∞"}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Votes Used
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Vote Distribution Visualization */}
        {settings.votesPerUser && settings.votesPerUser > 0 && (
          <div className="mt-6">
            <VoteBar
              voteCount={myVotes.length}
              maxVotes={settings.votesPerUser}
              color="#3b82f6"
              showLabel={true}
              label="Your Vote Usage"
            />
          </div>
        )}
      </div>

      {/* Vote Heatmap */}
      {ideas.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Vote Distribution
          </h3>
          <VoteHeatmap ideas={ideas} categoryColors={categoryColorMap} />
        </div>
      )}

      {/* Ideas and Groups by Category */}
      {categories.map((category) => {
        const categoryIdeas = sortedIdeas.filter(
          (idea) => idea.categoryId === category.id && !idea.groupId,
        );
        const categoryGroups = groups.filter(
          (group) => group.categoryId === category.id,
        );

        // Skip if no ideas or groups in this category
        if (categoryIdeas.length === 0 && categoryGroups.length === 0)
          return null;

        const categoryVotesUsed = getVotesInCategory(category.id);
        const categoryVotesRemaining = getCategoryVotesRemaining(category.id);
        const hasCategoryLimit = settings.maxVotesPerCategory !== undefined;

        return (
          <div key={category.id}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                {category.name}
              </h3>
              <span className="text-sm text-zinc-500 dark:text-zinc-500">
                ({categoryIdeas.length} ideas
                {categoryGroups.length > 0 &&
                  `, ${categoryGroups.length} groups`}
                )
              </span>
              {hasCategoryLimit && (
                <span className="ml-auto text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {categoryVotesUsed} / {settings.maxVotesPerCategory} votes
                  used
                </span>
              )}
            </div>

            {hasCategoryLimit && settings.maxVotesPerCategory && (
              <div className="mb-3">
                <VoteBar
                  voteCount={categoryVotesUsed}
                  maxVotes={settings.maxVotesPerCategory}
                  color={category.color}
                  showLabel={false}
                />
              </div>
            )}

            {/* Groups Section */}
            {settings.allowVotingOnGroups && categoryGroups.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Groups
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryGroups.map((group) => {
                    const voted = hasVotedGroup(group.id);
                    const voteId = getVoteId({ groupId: group.id });

                    return (
                      <div key={group.id} className="relative">
                        <GroupCard
                          group={group}
                          categoryColor={category.color}
                        />

                        {/* Vote Button Overlay */}
                        <div className="absolute right-3 bottom-3">
                          {voted ? (
                            <button
                              onClick={() => handleUnvote(voteId!)}
                              disabled={isPending}
                              className="flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50">
                              <svg
                                className="h-4 w-4"
                                fill="currentColor"
                                viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Voted
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleVote(category.id, { groupId: group.id })
                              }
                              disabled={
                                isPending ||
                                votesRemaining <= 0 ||
                                categoryVotesRemaining <= 0
                              }
                              className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 20 20">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                              </svg>
                              Vote
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Individual Ideas Section */}
            {settings.allowVotingOnIdeas && categoryIdeas.length > 0 && (
              <div>
                {categoryGroups.length > 0 && (
                  <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Individual Ideas
                  </h4>
                )}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryIdeas.map((idea) => {
                    const voted = hasVotedIdea(idea.id);
                    const voteId = getVoteId({ ideaId: idea.id });

                    return (
                      <div key={idea.id} className="relative">
                        <IdeaCard idea={idea} categoryColor={category.color} />

                        {/* Vote Button Overlay */}
                        <div className="absolute right-3 bottom-3">
                          {voted ? (
                            <button
                              onClick={() => handleUnvote(voteId!)}
                              disabled={isPending}
                              className="flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50">
                              <svg
                                className="h-4 w-4"
                                fill="currentColor"
                                viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Voted
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleVote(category.id, { ideaId: idea.id })
                              }
                              disabled={
                                isPending ||
                                votesRemaining <= 0 ||
                                categoryVotesRemaining <= 0
                              }
                              className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 20 20">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                              </svg>
                              Vote
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {ideas.length === 0 && (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-600 dark:text-zinc-400">
            No ideas to vote on yet
          </p>
        </div>
      )}
    </div>
  );
};
