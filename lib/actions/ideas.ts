"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { comments, ideaGroups, ideas } from "@/lib/db/schema";
import type {
  CreateIdeaGroupInput,
  CreateIdeaInput,
  IdeaGroupWithDetails,
  IdeaWithDetails,
  UpdateIdeaInput,
} from "@/lib/types/session";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const createIdea = async (input: CreateIdeaInput) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const ideaId = crypto.randomUUID();

  await db.insert(ideas).values({
    id: ideaId,
    sessionId: input.sessionId,
    categoryId: input.categoryId,
    content: input.content,
    authorId: input.isAnonymous ? null : session.user.id,
    isAnonymous: input.isAnonymous ?? true,
    order: 0,
  });

  revalidatePath(`/session/${input.sessionId}`);
  return { ideaId };
};

export const getSessionIdeas = async (
  sessionId: string,
): Promise<IdeaWithDetails[]> => {
  const result = await db.query.ideas.findMany({
    where: eq(ideas.sessionId, sessionId),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          image: true,
        },
      },
      group: true,
      comments: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: [desc(comments.createdAt)],
      },
      votes: true,
    },
    orderBy: [desc(ideas.createdAt)],
  });

  return result.map((idea) => ({
    ...idea,
    _count: {
      votes: idea.votes.length,
      comments: idea.comments.length,
    },
  }));
};

export const updateIdea = async (ideaId: string, input: UpdateIdeaInput) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const idea = await db.query.ideas.findFirst({
    where: eq(ideas.id, ideaId),
  });

  if (!idea) {
    throw new Error("Idea not found");
  }

  // Check if user is the author (for non-anonymous ideas) or an admin
  if (idea.authorId && idea.authorId !== session.user.id) {
    // TODO: Check if user is admin
  }

  await db
    .update(ideas)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(ideas.id, ideaId));

  revalidatePath(`/session/${idea.sessionId}`);
  return { success: true };
};

export const deleteIdea = async (ideaId: string) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const idea = await db.query.ideas.findFirst({
    where: eq(ideas.id, ideaId),
  });

  if (!idea) {
    throw new Error("Idea not found");
  }

  // Check if user is the author or an admin
  if (idea.authorId && idea.authorId !== session.user.id) {
    // TODO: Check if user is admin
    throw new Error("Unauthorized");
  }

  await db.delete(ideas).where(eq(ideas.id, ideaId));

  revalidatePath(`/session/${idea.sessionId}`);
  return { success: true };
};

// ============================================================
// Idea Groups
// ============================================================

export const createIdeaGroup = async (input: CreateIdeaGroupInput) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const groupId = crypto.randomUUID();

  await db.insert(ideaGroups).values({
    id: groupId,
    sessionId: input.sessionId,
    categoryId: input.categoryId,
    title: input.title,
    order: input.order ?? 0,
    maxCards: input.maxCards,
  });

  revalidatePath(`/session/${input.sessionId}`);
  return { groupId };
};

export const getSessionGroups = async (
  sessionId: string,
): Promise<IdeaGroupWithDetails[]> => {
  const result = await db.query.ideaGroups.findMany({
    where: eq(ideaGroups.sessionId, sessionId),
    with: {
      ideas: true,
      comments: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: [desc(comments.createdAt)],
      },
      votes: true,
    },
  });

  return result.map((group) => ({
    ...group,
    _count: {
      ideas: group.ideas.length,
      votes: group.votes.length,
      comments: group.comments.length,
    },
  }));
};

export const updateIdeaGroup = async (
  groupId: string,
  input: Partial<CreateIdeaGroupInput>,
) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const group = await db.query.ideaGroups.findFirst({
    where: eq(ideaGroups.id, groupId),
  });

  if (!group) {
    throw new Error("Group not found");
  }

  await db
    .update(ideaGroups)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(ideaGroups.id, groupId));

  revalidatePath(`/session/${group.sessionId}`);
  return { success: true };
};

export const deleteIdeaGroup = async (groupId: string) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const group = await db.query.ideaGroups.findFirst({
    where: eq(ideaGroups.id, groupId),
  });

  if (!group) {
    throw new Error("Group not found");
  }

  await db.delete(ideaGroups).where(eq(ideaGroups.id, groupId));

  revalidatePath(`/session/${group.sessionId}`);
  return { success: true };
};

export const moveIdeaToGroup = async (
  ideaId: string,
  groupId: string | null,
) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const idea = await db.query.ideas.findFirst({
    where: eq(ideas.id, ideaId),
  });

  if (!idea) {
    throw new Error("Idea not found");
  }

  await db
    .update(ideas)
    .set({
      groupId,
      updatedAt: new Date(),
    })
    .where(eq(ideas.id, ideaId));

  revalidatePath(`/session/${idea.sessionId}`);
  return { success: true };
};
