"use server";

import { db } from "@/lib/firebase/client";
import type { Comment, CreateCommentInput } from "@/lib/types/session";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

export const createComment = async (
  input: CreateCommentInput,
  authorId: string,
) => {
  try {
    const commentRef = await addDoc(
      collection(db, "sessions", input.sessionId, "comments"),
      {
        ...input,
        authorId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    );
    return { commentId: commentRef.id };
  } catch (error) {
    console.error("Error creating comment:", error);
    throw error;
  }
};

export const updateComment = async (
  commentId: string,
  sessionId: string,
  content: string,
) => {
  try {
    const commentRef = doc(db, "sessions", sessionId, "comments", commentId);
    await updateDoc(commentRef, { content, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    console.error("Error updating comment:", error);
    throw error;
  }
};

export const deleteComment = async (commentId: string, sessionId: string) => {
  try {
    const commentRef = doc(db, "sessions", sessionId, "comments", commentId);
    await deleteDoc(commentRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
};

export const getSessionComments = async (
  sessionId: string,
  ideaId?: string,
  groupId?: string,
): Promise<Comment[]> => {
  try {
    let commentsQuery = query(
      collection(db, "sessions", sessionId, "comments"),
    );

    if (ideaId) {
      commentsQuery = query(commentsQuery, where("ideaId", "==", ideaId));
    }
    if (groupId) {
      commentsQuery = query(commentsQuery, where("groupId", "==", groupId));
    }

    const snapshot = await getDocs(commentsQuery);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(),
        updatedAt:
          data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate()
            : new Date(),
      } as Comment;
    });
  } catch (error) {
    console.error("Error getting session comments:", error);
    throw error;
  }
};
