"use server";

import { revalidatePath } from "next/cache";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  magicSessions,
  categories,
  sessionSettings,
  sessionAdmins,
  ideas,
  userPresence,
} from "@/lib/db/schema";
import type {
  CreateMagicSessionInput,
  UpdateMagicSessionInput,
  MagicSessionWithDetails,
} from "@/lib/types/session";

export const createSession = async (input: CreateMagicSessionInput) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const sessionId = crypto.randomUUID();

  // Create session, categories, and settings in a transaction
  await db.transaction(async (tx) => {
    // Create the main session
    await tx.insert(magicSessions).values({
      id: sessionId,
      name: input.name,
      description: input.description,
      ownerId: session.user.id,
      visibility: input.visibility || "public",
      currentStage: "pre_session",
    });

    // Create categories
    const categoriesToInsert = input.categories.map((cat, index) => ({
      id: crypto.randomUUID(),
      sessionId,
      name: cat.name,
      color: cat.color || "#3b82f6",
      order: index,
      maxEntriesPerPerson: cat.maxEntriesPerPerson,
    }));

    await tx.insert(categories).values(categoriesToInsert);

    // Create default settings
    await tx.insert(sessionSettings).values({
      sessionId,
      enablePreSession: input.settings?.enablePreSession ?? true,
      enablePreSubmit: input.settings?.enablePreSubmit ?? false,
      enableGreenRoom: input.settings?.enableGreenRoom ?? true,
      votesPerUser: input.settings?.votesPerUser,
      maxVotesPerIdea: input.settings?.maxVotesPerIdea,
      maxVotesPerCategory: input.settings?.maxVotesPerCategory,
      allowVotingOnGroups: input.settings?.allowVotingOnGroups ?? true,
      allowVotingOnIdeas: input.settings?.allowVotingOnIdeas ?? true,
      allowGroupsInCategories: input.settings?.allowGroupsInCategories,
      disallowGroupsInCategories: input.settings?.disallowGroupsInCategories,
      ideaCollectionDuration: input.settings?.ideaCollectionDuration,
      votingDuration: input.settings?.votingDuration,
      customSettings: input.settings?.customSettings,
    });
  });

  revalidatePath("/");
  return { sessionId };
};

export const getSession = async (
  sessionId: string,
): Promise<MagicSessionWithDetails | null> => {
  const result = await db.query.magicSessions.findFirst({
    where: eq(magicSessions.id, sessionId),
    with: {
      owner: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      categories: {
        orderBy: (categories, { asc }) => [asc(categories.order)],
      },
      settings: true,
      admins: true,
    },
  });

  if (!result) return null;

  // Get counts
  const [ideasCountResult, presenceCountResult] = await Promise.all([
    db
      .select({ value: count() })
      .from(ideas)
      .where(eq(ideas.sessionId, sessionId)),
    db
      .select({ value: count() })
      .from(userPresence)
      .where(
        and(
          eq(userPresence.sessionId, sessionId),
          eq(userPresence.isActive, true),
        ),
      ),
  ]);

  const ideasCount = ideasCountResult[0]?.value ?? 0;
  const presenceCount = presenceCountResult[0]?.value ?? 0;

  return {
    ...result,
    _count: {
      ideas: ideasCount,
      presence: presenceCount,
    },
  };
};

export const getUserSessions = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const result = await db.query.magicSessions.findMany({
    where: eq(magicSessions.ownerId, session.user.id),
    orderBy: [desc(magicSessions.createdAt)],
    with: {
      owner: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      categories: true,
      settings: true,
    },
  });

  return result;
};

export const updateSession = async (
  sessionId: string,
  input: UpdateMagicSessionInput,
) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check if user is owner or admin
  const magicSession = await db.query.magicSessions.findFirst({
    where: eq(magicSessions.id, sessionId),
    with: {
      admins: true,
    },
  });

  if (!magicSession) {
    throw new Error("Session not found");
  }

  const isOwner = magicSession.ownerId === session.user.id;
  const isAdmin = magicSession.admins.some(
    (admin) => admin.userId === session.user.id,
  );

  if (!isOwner && !isAdmin) {
    throw new Error("Unauthorized");
  }

  await db
    .update(magicSessions)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(magicSessions.id, sessionId));

  revalidatePath(`/session/${sessionId}`);
  return { success: true };
};

export const deleteSession = async (sessionId: string) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check if user is owner
  const magicSession = await db.query.magicSessions.findFirst({
    where: eq(magicSessions.id, sessionId),
  });

  if (!magicSession) {
    throw new Error("Session not found");
  }

  if (magicSession.ownerId !== session.user.id) {
    throw new Error("Unauthorized - only owner can delete session");
  }

  await db.delete(magicSessions).where(eq(magicSessions.id, sessionId));

  revalidatePath("/");
  return { success: true };
};

export const addSessionAdmin = async (sessionId: string, userId: string) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check if user is owner
  const magicSession = await db.query.magicSessions.findFirst({
    where: eq(magicSessions.id, sessionId),
  });

  if (!magicSession) {
    throw new Error("Session not found");
  }

  if (magicSession.ownerId !== session.user.id) {
    throw new Error("Unauthorized - only owner can add admins");
  }

  await db.insert(sessionAdmins).values({
    sessionId,
    userId,
  });

  revalidatePath(`/session/${sessionId}`);
  return { success: true };
};

export const removeSessionAdmin = async (
  sessionId: string,
  userId: string,
) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check if user is owner
  const magicSession = await db.query.magicSessions.findFirst({
    where: eq(magicSessions.id, sessionId),
  });

  if (!magicSession) {
    throw new Error("Session not found");
  }

  if (magicSession.ownerId !== session.user.id) {
    throw new Error("Unauthorized - only owner can remove admins");
  }

  await db
    .delete(sessionAdmins)
    .where(
      and(
        eq(sessionAdmins.sessionId, sessionId),
        eq(sessionAdmins.userId, userId),
      ),
    );

  revalidatePath(`/session/${sessionId}`);
  return { success: true };
};

export const updateSessionStage = async (
  sessionId: string,
  stage: string,
) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check if user is owner or admin
  const magicSession = await db.query.magicSessions.findFirst({
    where: eq(magicSessions.id, sessionId),
    with: {
      admins: true,
    },
  });

  if (!magicSession) {
    throw new Error("Session not found");
  }

  const isOwner = magicSession.ownerId === session.user.id;
  const isAdmin = magicSession.admins.some(
    (admin) => admin.userId === session.user.id,
  );

  if (!isOwner && !isAdmin) {
    throw new Error("Unauthorized");
  }

  await db
    .update(magicSessions)
    .set({
      currentStage: stage,
      updatedAt: new Date(),
    })
    .where(eq(magicSessions.id, sessionId));

  revalidatePath(`/session/${sessionId}`);
  return { success: true };
};
