import { db } from "@/lib/firebase/client";
import type {
  CreateIdeaGroupInput,
  CreateIdeaInput,
  Idea,
  IdeaGroup,
  UpdateIdeaInput,
} from "@/lib/types/session";

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
} from "firebase/firestore";

export const createIdea = async (input: CreateIdeaInput) => {
  try {
    const ideaRef = await addDoc(
      collection(db, "sessions", input.sessionId, "ideas"),
      {
        ...input,
        order: 0,
        isSelected: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    );
    return { ideaId: ideaRef.id };
  } catch (error) {
    console.error("Error creating idea:", error);
    throw error;
  }
};

export const updateIdea = async (
  ideaId: string,
  sessionId: string,
  updates: UpdateIdeaInput,
) => {
  try {
    const ideaRef = doc(db, "sessions", sessionId, "ideas", ideaId);
    await updateDoc(ideaRef, { ...updates, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    console.error("Error updating idea:", error);
    throw error;
  }
};

export const deleteIdea = async (ideaId: string, sessionId: string) => {
  try {
    const ideaRef = doc(db, "sessions", sessionId, "ideas", ideaId);
    await deleteDoc(ideaRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting idea:", error);
    throw error;
  }
};

export const moveIdeaToGroup = async (
  ideaId: string,
  groupId: string | null,
  sessionId: string,
  order?: number,
) => {
  try {
    const ideaRef = doc(db, "sessions", sessionId, "ideas", ideaId);
    const updates: Record<string, unknown> = {
      groupId,
      updatedAt: serverTimestamp(),
    };
    if (order !== undefined) {
      updates.order = order;
    }
    await updateDoc(ideaRef, updates);
    return { success: true };
  } catch (error) {
    console.error("Error moving idea:", error);
    throw error;
  }
};

export const getSessionIdeas = async (sessionId: string): Promise<Idea[]> => {
  try {
    const ideasQuery = query(collection(db, "sessions", sessionId, "ideas"));
    const snapshot = await getDocs(ideasQuery);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt:
          data.createdAt instanceof Timestamp ?
            data.createdAt.toDate()
          : new Date(),
        updatedAt:
          data.updatedAt instanceof Timestamp ?
            data.updatedAt.toDate()
          : new Date(),
      } as Idea;
    });
  } catch (error) {
    console.error("Error getting session ideas:", error);
    throw error;
  }
};

export const getSessionGroups = async (
  sessionId: string,
): Promise<IdeaGroup[]> => {
  try {
    const groupsQuery = query(collection(db, "sessions", sessionId, "groups"));
    const snapshot = await getDocs(groupsQuery);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt:
          data.createdAt instanceof Timestamp ?
            data.createdAt.toDate()
          : new Date(),
        updatedAt:
          data.updatedAt instanceof Timestamp ?
            data.updatedAt.toDate()
          : new Date(),
      } as IdeaGroup;
    });
  } catch (error) {
    console.error("Error getting session groups:", error);
    throw error;
  }
};

export const createIdeaGroup = async (input: CreateIdeaGroupInput) => {
  try {
    const groupRef = await addDoc(
      collection(db, "sessions", input.sessionId, "groups"),
      { ...input, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
    );
    return { groupId: groupRef.id };
  } catch (error) {
    console.error("Error creating idea group:", error);
    throw error;
  }
};

export const updateIdeaGroup = async (
  groupId: string,
  sessionId: string,
  updates: Partial<IdeaGroup>,
) => {
  try {
    const groupRef = doc(db, "sessions", sessionId, "groups", groupId);
    await updateDoc(groupRef, { ...updates, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    console.error("Error updating idea group:", error);
    throw error;
  }
};

export const deleteIdeaGroup = async (groupId: string, sessionId: string) => {
  try {
    const groupRef = doc(db, "sessions", sessionId, "groups", groupId);
    await deleteDoc(groupRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting idea group:", error);
    throw error;
  }
};
