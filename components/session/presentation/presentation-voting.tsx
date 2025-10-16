"use client";

import type {
  MagicSessionWithDetails,
  Idea,
  IdeaGroup,
} from "@/lib/types/session";
import { useEffect, useState } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { calculateMaxPossibleVotes } from "@/lib/utils/session-utils";

interface PresentationVotingProps {
  session: MagicSessionWithDetails;
  ideas: Idea[];
  groups: IdeaGroup[];
  userCount: number;
}

export function PresentationVoting({
  session,
  ideas,
  groups,
  userCount,
}: PresentationVotingProps) {
  const [totalVotesCast, setTotalVotesCast] = useState(0);

  // Fetch vote counts
  useEffect(() => {
    const fetchVotes = async () => {
      const votesRef = collection(db, "sessions", session.id, "votes");
      const votesQuery = query(votesRef);
      const votesSnapshot = await getDocs(votesQuery);

      setTotalVotesCast(votesSnapshot.size);
    };

    void fetchVotes();
    const interval = setInterval(() => {
      void fetchVotes();
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [session.id, ideas, groups]);

  // Calculate vote progress
  const maxPossibleVotes = calculateMaxPossibleVotes(session, userCount);

  const voteProgress =
    maxPossibleVotes ? (totalVotesCast / maxPossibleVotes) * 100 : 0;

  // Check if voting is complete (simplified - could be more sophisticated)
  const votingComplete = Boolean(
    maxPossibleVotes && totalVotesCast >= maxPossibleVotes,
  );

  return (
    <div className="flex h-full flex-col text-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold">{session.name}</h1>
        <p className="mt-2 text-2xl text-zinc-400">Vote for the best ideas</p>
      </div>

      {/* Vote Progress */}
      <div className="mb-12">
        {maxPossibleVotes ?
          <>
            <div className="mb-4 flex items-center justify-between text-2xl">
              <span className="text-zinc-400">Voting Progress</span>
              <span className="font-bold">
                {totalVotesCast} / {maxPossibleVotes} votes cast
              </span>
            </div>
            <div className="h-16 overflow-hidden rounded-2xl bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${Math.min(voteProgress, 100)}%` }}
              />
            </div>
          </>
        : <>
            <div className="mb-4 text-2xl text-zinc-400">Votes Cast</div>
            <div className="text-center">
              <div className="text-8xl font-bold">{totalVotesCast}</div>
              <div className="mt-2 text-2xl text-zinc-400">
                {totalVotesCast === 1 ? "vote" : "votes"}
              </div>
            </div>
          </>
        }
      </div>

      {/* Participation Stats */}
      <div className="mb-12 grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-white/10 p-6 text-center backdrop-blur-sm">
          <div className="text-5xl font-bold">{userCount}</div>
          <div className="mt-2 text-xl text-zinc-400">participants</div>
        </div>

        <div className="rounded-xl bg-white/10 p-6 text-center backdrop-blur-sm">
          <div className="text-5xl font-bold">
            {ideas.length + groups.length}
          </div>
          <div className="mt-2 text-xl text-zinc-400">items to vote on</div>
        </div>

        <div className="rounded-xl bg-white/10 p-6 text-center backdrop-blur-sm">
          <div className="text-5xl font-bold">
            {session.settings?.votesPerUser ?? "∞"}
          </div>
          <div className="mt-2 text-xl text-zinc-400">votes per person</div>
        </div>
      </div>

      {/* Voting Status Message */}
      <div className="flex flex-1 items-center justify-center">
        {votingComplete ?
          <div className="text-center">
            <div className="mb-6 text-9xl">✅</div>
            <h2 className="text-6xl font-bold">Voting Complete!</h2>
            <p className="mt-4 text-3xl text-zinc-400">
              Waiting for facilitator to reveal results...
            </p>
          </div>
        : <div className="text-center">
            <div className="mb-6 text-9xl">🗳️</div>
            <h2 className="text-6xl font-bold">Voting in Progress</h2>
            <p className="mt-4 text-3xl text-zinc-400">
              Cast your votes on your device
            </p>
            {!votingComplete && (
              <div className="mt-8 animate-pulse text-2xl text-zinc-500">
                Results will be shown when voting is complete
              </div>
            )}
          </div>
        }
      </div>

      {/* Note about hidden results */}
      <div className="mt-auto text-center text-xl text-zinc-500">
        Vote counts are hidden to avoid bias
      </div>
    </div>
  );
}
