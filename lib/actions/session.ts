"use server";

import { db } from "@/lib/firebase/client";
import type {
  CreateMagicSessionInput,
  MagicSession,
  SessionStage,
  UpdateMagicSessionInput,
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

export const createSession = async (
  input: CreateMagicSessionInput,
  ownerId: string,
) => {
  try {
    const sessionRef = await addDoc(collection(db, "sessions"), {
      ...input,
      ownerId,
      currentStage: "pre_session" as SessionStage,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { sessionId: sessionRef.id };
  } catch (error) {
    console.error("Error creating session:", error);
    throw error;
  }
};

export const getSession = async (
  sessionId: string,
): Promise<MagicSession | null> => {
  try {
    const sessionRef = doc(db, "sessions", sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      return null;
    }

    const data = sessionDoc.data();
    return {
      id: sessionDoc.id,
      ...data,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(),
      updatedAt:
        data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : new Date(),
    } as MagicSession;
  } catch (error) {
    console.error("Error getting session:", error);
    throw error;
  }
};

export const getUserSessions = async (
  userId: string,
): Promise<MagicSession[]> => {
  try {
    const sessionsQuery = query(
      collection(db, "sessions"),
      where("ownerId", "==", userId),
    );
    const snapshot = await getDocs(sessionsQuery);

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
      } as MagicSession;
    });
  } catch (error) {
    console.error("Error getting user sessions:", error);
    throw error;
  }
};

export const updateSession = async (
  sessionId: string,
  updates: UpdateMagicSessionInput,
) => {
  try {
    const sessionRef = doc(db, "sessions", sessionId);
    await updateDoc(sessionRef, { ...updates, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    console.error("Error updating session:", error);
    throw error;
  }
};

export const deleteSession = async (sessionId: string) => {
  try {
    const sessionRef = doc(db, "sessions", sessionId);
    await deleteDoc(sessionRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting session:", error);
    throw error;
  }
};

export const addSessionAdmin = async (
  sessionId: string,
  userId: string,
  addedById: string,
) => {
  try {
    const adminRef = await addDoc(
      collection(db, "sessions", sessionId, "admins"),
      { userId, role: "admin", addedAt: serverTimestamp(), addedById },
    );
    return { success: true, adminId: adminRef.id };
  } catch (error) {
    console.error("Error adding session admin:", error);
    throw error;
  }
};

export const removeSessionAdmin = async (
  sessionId: string,
  adminId: string,
) => {
  try {
    const adminRef = doc(db, "sessions", sessionId, "admins", adminId);
    await deleteDoc(adminRef);
    return { success: true };
  } catch (error) {
    console.error("Error removing session admin:", error);
    throw error;
  }
};

export const updateSessionStage = async (
  sessionId: string,
  newStage: SessionStage,
) => {
  try {
    const sessionRef = doc(db, "sessions", sessionId);
    await updateDoc(sessionRef, {
      currentStage: newStage,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating session stage:", error);
    throw error;
  }
};
