"use server";

import { revalidatePath } from "next/cache";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { comments } from "@/lib/db/schema";
import type { CreateCommentInput } from "@/lib/types/session";

export const createComment = async (input: CreateCommentInput) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const commentId = crypto.randomUUID();

  await db.insert(comments).values({
    id: commentId,
    sessionId: input.sessionId,
    ideaId: input.ideaId,
    groupId: input.groupId,
    userId: session.user.id,
    content: input.content,
  });

  revalidatePath(`/session/${input.sessionId}`);
  return { commentId };
};

export const getComments = async (
  sessionId: string,
  targetId: string,
  targetType: "idea" | "group",
) => {
  const result = await db.query.comments.findMany({
    where: and(
      eq(comments.sessionId, sessionId),
      targetType === "idea"
        ? eq(comments.ideaId, targetId)
        : eq(comments.groupId, targetId),
    ),
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
  });

  return result;
};

export const deleteComment = async (commentId: string) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const comment = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
  });

  if (!comment) {
    throw new Error("Comment not found");
  }

  if (comment.userId !== session.user.id) {
    // TODO: Check if user is admin
    throw new Error("Unauthorized");
  }

  await db.delete(comments).where(eq(comments.id, commentId));

  revalidatePath(`/session/${comment.sessionId}`);
  return { success: true };
};
