"use server";

import { revalidatePath } from "next/cache";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { votes, sessionSettings } from "@/lib/db/schema";
import type { CastVoteInput } from "@/lib/types/session";

export const castVote = async (input: CastVoteInput) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get session settings to check voting rules
  const settings = await db.query.sessionSettings.findFirst({
    where: eq(sessionSettings.sessionId, input.sessionId),
  });

  if (!settings) {
    throw new Error("Session settings not found");
  }

  // Check if voting on this target type is allowed
  if (input.ideaId && !settings.allowVotingOnIdeas) {
    throw new Error("Voting on ideas is not allowed");
  }
  if (input.groupId && !settings.allowVotingOnGroups) {
    throw new Error("Voting on groups is not allowed");
  }

  // Get user's current votes
  const userVotes = await db.query.votes.findMany({
    where: and(
      eq(votes.sessionId, input.sessionId),
      eq(votes.userId, session.user.id),
    ),
  });

  // Check total votes limit
  if (settings.votesPerUser && userVotes.length >= settings.votesPerUser) {
    throw new Error(
      `You have reached the maximum number of votes (${settings.votesPerUser})`,
    );
  }

  // Check votes per category limit
  if (settings.maxVotesPerCategory) {
    const categoryVotes = userVotes.filter(
      (v) => v.categoryId === input.categoryId,
    );
    if (categoryVotes.length >= settings.maxVotesPerCategory) {
      throw new Error(
        `You have reached the maximum number of votes for this category (${settings.maxVotesPerCategory})`,
      );
    }
  }

  // Check votes per idea/group limit
  if (settings.maxVotesPerIdea) {
    const targetVotes = userVotes.filter((v) =>
      input.ideaId ? v.ideaId === input.ideaId : v.groupId === input.groupId,
    );
    if (targetVotes.length >= settings.maxVotesPerIdea) {
      throw new Error(
        `You have reached the maximum number of votes for this item (${settings.maxVotesPerIdea})`,
      );
    }
  }

  const voteId = crypto.randomUUID();

  await db.insert(votes).values({
    id: voteId,
    sessionId: input.sessionId,
    categoryId: input.categoryId,
    ideaId: input.ideaId,
    groupId: input.groupId,
    userId: session.user.id,
  });

  revalidatePath(`/session/${input.sessionId}`);
  return { voteId };
};

export const removeVote = async (voteId: string) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const vote = await db.query.votes.findFirst({
    where: eq(votes.id, voteId),
  });

  if (!vote) {
    throw new Error("Vote not found");
  }

  if (vote.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await db.delete(votes).where(eq(votes.id, voteId));

  revalidatePath(`/session/${vote.sessionId}`);
  return { success: true };
};

export const getUserVotes = async (sessionId: string) => {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const result = await db.query.votes.findMany({
    where: and(
      eq(votes.sessionId, sessionId),
      eq(votes.userId, session.user.id),
    ),
  });

  return result;
};

export const getVoteCounts = async (sessionId: string) => {
  const ideaVotes = await db
    .select({
      ideaId: votes.ideaId,
      count: sql<number>`count(*)::int`,
    })
    .from(votes)
    .where(and(eq(votes.sessionId, sessionId), sql`${votes.ideaId} IS NOT NULL`))
    .groupBy(votes.ideaId);

  const groupVotes = await db
    .select({
      groupId: votes.groupId,
      count: sql<number>`count(*)::int`,
    })
    .from(votes)
    .where(
      and(eq(votes.sessionId, sessionId), sql`${votes.groupId} IS NOT NULL`),
    )
    .groupBy(votes.groupId);

  return {
    ideas: Object.fromEntries(
      ideaVotes.map((v) => [v.ideaId, v.count]).filter(([id]) => id),
    ) as Record<string, number>,
    groups: Object.fromEntries(
      groupVotes.map((v) => [v.groupId, v.count]).filter(([id]) => id),
    ) as Record<string, number>,
  };
};
