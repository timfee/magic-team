"use server";

import { db } from "@/lib/firebase/client";
import {
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

// Lock duration in milliseconds (30 seconds)
const LOCK_DURATION_MS = 30000;

/**
 * Attempts to acquire a lock on an idea for the specified user.
 * Returns true if lock was acquired, false if idea is already locked by someone else.
 */
export const acquireLock = async (
  ideaId: string,
  userId: string,
  sessionId: string,
): Promise<boolean> => {
  try {
    const ideaRef = doc(db, "sessions", sessionId, "ideas", ideaId);
    const ideaSnap = await getDoc(ideaRef);

    if (!ideaSnap.exists()) {
      throw new Error("Idea not found");
    }

    const idea = ideaSnap.data();
    const now = new Date();

    // Check if idea is already locked
    if (idea.lockedById && idea.lockedAt) {
      const lockedAt =
        idea.lockedAt instanceof Timestamp
          ? idea.lockedAt.toDate()
          : new Date(idea.lockedAt);
      const lockAge = now.getTime() - lockedAt.getTime();

      // If locked by someone else and lock is still fresh, deny
      if (idea.lockedById !== userId && lockAge < LOCK_DURATION_MS) {
        return false;
      }
    }

    // Acquire or refresh lock
    await updateDoc(ideaRef, {
      lockedById: userId,
      lockedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error acquiring lock:", error);
    throw error;
  }
};

/**
 * Releases a lock on an idea. Only the user who holds the lock can release it.
 */
export const releaseLock = async (
  ideaId: string,
  userId: string,
  sessionId: string,
): Promise<void> => {
  try {
    const ideaRef = doc(db, "sessions", sessionId, "ideas", ideaId);
    const ideaSnap = await getDoc(ideaRef);

    if (!ideaSnap.exists()) {
      throw new Error("Idea not found");
    }

    const idea = ideaSnap.data();

    // Only release if the current user holds the lock
    if (idea.lockedById === userId) {
      await updateDoc(ideaRef, {
        lockedById: null,
        lockedAt: null,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error releasing lock:", error);
    throw error;
  }
};

/**
 * Refreshes an existing lock to extend its duration.
 * Returns true if refresh was successful, false if lock was lost or expired.
 */
export const refreshLock = async (
  ideaId: string,
  userId: string,
  sessionId: string,
): Promise<boolean> => {
  try {
    const ideaRef = doc(db, "sessions", sessionId, "ideas", ideaId);
    const ideaSnap = await getDoc(ideaRef);

    if (!ideaSnap.exists()) {
      throw new Error("Idea not found");
    }

    const idea = ideaSnap.data();

    // Only refresh if the current user holds the lock
    if (idea.lockedById === userId) {
      await updateDoc(ideaRef, {
        lockedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error refreshing lock:", error);
    throw error;
  }
};

/**
 * Checks if an idea is currently locked by another user.
 * Returns the ID of the user who holds the lock, or null if unlocked/expired.
 */
export const checkLock = async (
  ideaId: string,
  currentUserId: string,
  sessionId: string,
): Promise<string | null> => {
  try {
    const ideaRef = doc(db, "sessions", sessionId, "ideas", ideaId);
    const ideaSnap = await getDoc(ideaRef);

    if (!ideaSnap.exists()) {
      return null;
    }

    const idea = ideaSnap.data();

    if (!idea.lockedById || !idea.lockedAt) {
      return null;
    }

    const lockedAt =
      idea.lockedAt instanceof Timestamp
        ? idea.lockedAt.toDate()
        : new Date(idea.lockedAt);
    const now = new Date();
    const lockAge = now.getTime() - lockedAt.getTime();

    // Lock expired
    if (lockAge >= LOCK_DURATION_MS) {
      return null;
    }

    // Locked by current user
    if (idea.lockedById === currentUserId) {
      return null;
    }

    // Locked by someone else
    return idea.lockedById as string;
  } catch (error) {
    console.error("Error checking lock:", error);
    return null;
  }
};
