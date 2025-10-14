import { db } from "@/lib/firebase/client";
import type {
  Comment,
  CommentWithDetails,
  CreateCommentInput,
} from "@/lib/types/session";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

export const createComment = async (
  input: CreateCommentInput,
  userId: string, // Changed from authorId to match security rules
) => {
  try {
    const commentData = {
      sessionId: input.sessionId,
      content: input.content,
      userId, // Changed from authorId
      ...(input.ideaId && { ideaId: input.ideaId }),
      ...(input.groupId && { groupId: input.groupId }),
      ...(input.replyToId && { replyToId: input.replyToId }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const commentRef = await addDoc(
      collection(db, "sessions", input.sessionId, "comments"),
      commentData,
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

// Helper to fetch user details from presence or users collection
const getUserDetails = async (
  userId: string,
  sessionId: string,
): Promise<{ id: string; name: string | null; image: string | null }> => {
  try {
    // Try presence first (for active users)
    const presenceRef = doc(db, "sessions", sessionId, "presence", userId);
    const presenceSnap = await getDoc(presenceRef);

    if (presenceSnap.exists()) {
      const data = presenceSnap.data();
      return {
        id: userId,
        name: (data.userName as string) || null,
        image: (data.userImage as string) || null,
      };
    }

    // Fallback: try users collection
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        id: userId,
        name: (data.name as string) || null,
        image: (data.image as string) || null,
      };
    }

    // Default if user not found
    return { id: userId, name: "Unknown User", image: null };
  } catch (error) {
    console.error("Error fetching user details:", error);
    return { id: userId, name: "Unknown User", image: null };
  }
};

// Fetch comments with full details including user info and threads
export const getCommentsWithDetails = async (
  sessionId: string,
  ideaId?: string,
  groupId?: string,
): Promise<CommentWithDetails[]> => {
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

    // Convert to Comment objects
    const comments = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        sessionId: data.sessionId as string,
        content: data.content as string,
        userId: data.userId as string,
        ideaId: data.ideaId as string | undefined,
        groupId: data.groupId as string | undefined,
        replyToId: data.replyToId as string | undefined,
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

    // Fetch user details for all unique users
    const uniqueUserIds = [...new Set(comments.map((c) => c.userId))];
    const userDetailsMap = new Map<
      string,
      { id: string; name: string | null; image: string | null }
    >();

    await Promise.all(
      uniqueUserIds.map(async (userId) => {
        const userDetails = await getUserDetails(userId, sessionId);
        userDetailsMap.set(userId, userDetails);
      }),
    );

    // Build comment tree structure
    const commentsMap = new Map<string, CommentWithDetails>();
    const rootComments: CommentWithDetails[] = [];

    // First pass: create all comment objects with user details
    for (const comment of comments) {
      const userDetails = userDetailsMap.get(comment.userId) ?? {
        id: comment.userId,
        name: "Unknown User",
        image: null,
      };

      const commentWithDetails: CommentWithDetails = {
        ...comment,
        user: userDetails,
        replies: [],
        replyTo: null,
      };

      commentsMap.set(comment.id, commentWithDetails);

      // Root comments (not replies)
      if (!comment.replyToId) {
        rootComments.push(commentWithDetails);
      }
    }

    // Second pass: build reply relationships
    for (const comment of comments) {
      if (comment.replyToId) {
        const parentComment = commentsMap.get(comment.replyToId);
        const currentComment = commentsMap.get(comment.id);

        if (parentComment && currentComment) {
          // Add to parent's replies
          parentComment.replies ??= [];
          parentComment.replies.push(currentComment);

          // Set replyTo reference
          currentComment.replyTo = {
            id: parentComment.id,
            content: parentComment.content,
            user: { id: parentComment.user.id, name: parentComment.user.name },
          };
        }
      }
    }

    // Sort root comments by creation time (newest first)
    rootComments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Sort replies within each thread (oldest first for natural conversation flow)
    const sortReplies = (comment: CommentWithDetails) => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        );
        comment.replies.forEach(sortReplies);
      }
    };

    rootComments.forEach(sortReplies);

    return rootComments;
  } catch (error) {
    console.error("Error getting comments with details:", error);
    throw error;
  }
};
