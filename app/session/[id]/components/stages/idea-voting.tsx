"use client";

import { castVote, removeVote, getUserVotes } from "@/lib/actions/votes";
import { useSessionEvent } from "@/lib/socket/client";
import type {
  Category,
  IdeaWithDetails,
  SessionSettings,
} from "@/lib/types/session";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { IdeaCard } from "../idea-card";

interface VoteData {
  ideaId: string;
  voteId: string;
}

interface IdeaVotingProps {
  sessionId: string;
  categories: Category[];
  ideas: IdeaWithDetails[];
  settings: SessionSettings;
  userId: string;
}

export const IdeaVoting = ({
  sessionId,
  categories,
  ideas: initialIdeas,
  settings,
  userId: _userId,
}: IdeaVotingProps) => {
  const [ideas, setIdeas] = useState<IdeaWithDetails[]>(initialIdeas);
  const [myVotes, setMyVotes] = useState<VoteData[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Load user's votes
  useEffect(() => {
    startTransition(async () => {
      const votes = await getUserVotes(sessionId);
      setMyVotes(
        votes.map((v) => ({ ideaId: v.ideaId ?? "", voteId: v.id })),
      );
    });
  }, [sessionId]);

  // Listen for vote changes
  useSessionEvent<{ sessionId: string; vote: { ideaId: string } }>(
    "vote:cast",
    (data) => {
      if (data.sessionId === sessionId && data.vote.ideaId) {
        // Increment vote count for this idea
        setIdeas((prev) =>
          prev.map((idea) =>
            idea.id === data.vote.ideaId
              ? { ...idea, _count: { ...idea._count, votes: idea._count.votes + 1 } }
              : idea,
          ),
        );
      }
    },
    [sessionId],
  );

  useSessionEvent<{ sessionId: string; ideaId: string }>(
    "vote:removed",
    (data) => {
      if (data.sessionId === sessionId && data.ideaId) {
        // Decrement vote count
        setIdeas((prev) =>
          prev.map((idea) =>
            idea.id === data.ideaId
              ? { ...idea, _count: { ...idea._count, votes: Math.max(0, idea._count.votes - 1) } }
              : idea,
          ),
        );
      }
    },
    [sessionId],
  );

  const handleVote = async (ideaId: string, categoryId: string) => {
    setError(null);

    startTransition(async () => {
      try {
        const result = await castVote({
          sessionId,
          categoryId,
          ideaId,
        });

        setMyVotes((prev) => [...prev, { ideaId, voteId: result.voteId }]);

        // Optimistic update
        setIdeas((prev) =>
          prev.map((idea) =>
            idea.id === ideaId
              ? { ...idea, _count: { ...idea._count, votes: idea._count.votes + 1 } }
              : idea,
          ),
        );

        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to cast vote");
      }
    });
  };

  const handleUnvote = async (ideaId: string, voteId: string) => {
    setError(null);

    startTransition(async () => {
      try {
        await removeVote(voteId);

        setMyVotes((prev) => prev.filter((v) => v.voteId !== voteId));

        // Optimistic update
        setIdeas((prev) =>
          prev.map((idea) =>
            idea.id === ideaId
              ? { ...idea, _count: { ...idea._count, votes: Math.max(0, idea._count.votes - 1) } }
              : idea,
          ),
        );

        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove vote");
      }
    });
  };

  const hasVoted = (ideaId: string) => myVotes.some((v) => v.ideaId === ideaId);
  const getVoteId = (ideaId: string) => myVotes.find((v) => v.ideaId === ideaId)?.voteId;

  const votesRemaining = settings.votesPerUser
    ? settings.votesPerUser - myVotes.length
    : Infinity;

  // Sort ideas by vote count
  const sortedIdeas = [...ideas].sort((a, b) => b._count.votes - a._count.votes);

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
              {settings.votesPerUser ? myVotes.length : "∞"} / {settings.votesPerUser ?? "∞"}
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
      </div>

      {/* Ideas by Category */}
      {categories.map((category) => {
        const categoryIdeas = sortedIdeas.filter(
          (idea) => idea.categoryId === category.id,
        );
        if (categoryIdeas.length === 0) return null;

        return (
          <div key={category.id}>
            <div className="mb-3 flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                {category.name}
              </h3>
              <span className="text-sm text-zinc-500 dark:text-zinc-500">
                ({categoryIdeas.length} ideas)
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categoryIdeas.map((idea) => {
                const voted = hasVoted(idea.id);
                const voteId = getVoteId(idea.id);

                return (
                  <div key={idea.id} className="relative">
                    <IdeaCard idea={idea} categoryColor={category.color} />

                    {/* Vote Button Overlay */}
                    <div className="absolute bottom-3 right-3">
                      {voted ? (
                        <button
                          onClick={() => handleUnvote(idea.id, voteId!)}
                          disabled={isPending}
                          className="flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
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
                          onClick={() => handleVote(idea.id, category.id)}
                          disabled={isPending || votesRemaining <= 0}
                          className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 20 20"
                          >
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
