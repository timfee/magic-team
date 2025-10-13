"use server";

import { db } from "@/lib/firebase/client";
import type { CastVoteInput, Vote } from "@/lib/types/session";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";

export const castVote = async (input: CastVoteInput, userId: string) => {
  try {
    const voteRef = await addDoc(
      collection(db, "sessions", input.sessionId, "votes"),
      { ...input, userId, createdAt: serverTimestamp() },
    );
    return { success: true, voteId: voteRef.id };
  } catch (error) {
    console.error("Error casting vote:", error);
    throw error;
  }
};

export const removeVote = async (voteId: string, sessionId: string) => {
  try {
    const voteRef = doc(db, "sessions", sessionId, "votes", voteId);
    await deleteDoc(voteRef);
    return { success: true };
  } catch (error) {
    console.error("Error removing vote:", error);
    throw error;
  }
};

export const getSessionVotes = async (sessionId: string): Promise<Vote[]> => {
  try {
    const votesQuery = query(collection(db, "sessions", sessionId, "votes"));
    const snapshot = await getDocs(votesQuery);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(),
      } as Vote;
    });
  } catch (error) {
    console.error("Error getting session votes:", error);
    throw error;
  }
};

export const getUserVotes = async (
  sessionId: string,
  userId: string,
): Promise<Vote[]> => {
  try {
    const votesQuery = query(
      collection(db, "sessions", sessionId, "votes"),
      where("userId", "==", userId),
    );
    const snapshot = await getDocs(votesQuery);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(),
      } as Vote;
    });
  } catch (error) {
    console.error("Error getting user votes:", error);
    throw error;
  }
};
export const getVoteCounts = async () => ({});
