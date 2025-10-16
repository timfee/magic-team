import { db } from "@/lib/firebase/client";
import type {
  SessionSettings,
  UpdateSessionSettingsInput,
} from "@/lib/types/session";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";

export const getSessionSettings = async (
  sessionId: string,
): Promise<SessionSettings | null> => {
  try {
    const settingsRef = doc(db, "sessions", sessionId, "settings", "config");
    const settingsDoc = await getDoc(settingsRef);

    if (!settingsDoc.exists()) {
      return null;
    }

    const data = settingsDoc.data();
    return {
      allowAnonymousIdeas: data.allowAnonymousIdeas as boolean,
      allowComments: data.allowComments as boolean,
      allowVoting: data.allowVoting as boolean,
      votesPerUser: data.votesPerUser as number | undefined,
      maxVotesPerIdea: data.maxVotesPerIdea as number | undefined,
      maxVotesPerCategory: data.maxVotesPerCategory as number | undefined,
      allowVotingOnGroups: data.allowVotingOnGroups as boolean,
      allowVotingOnIdeas: data.allowVotingOnIdeas as boolean,
      autoGroupSimilarIdeas: data.autoGroupSimilarIdeas as boolean,
      maxIdeasPerPerson: data.maxIdeasPerPerson as number | undefined,
      enableTimer: data.enableTimer as boolean,
      timerDuration: data.timerDuration as number | undefined,
      greenRoomStartTime:
        data.greenRoomStartTime instanceof Timestamp ?
          data.greenRoomStartTime.toDate()
        : data.greenRoomStartTime || null,
      ideaCollectionTimerEnd:
        data.ideaCollectionTimerEnd instanceof Timestamp ?
          data.ideaCollectionTimerEnd.toDate()
        : data.ideaCollectionTimerEnd || null,
      ideaCollectionEnabled: data.ideaCollectionEnabled as boolean | undefined,
      updatedAt:
        data.updatedAt instanceof Timestamp ?
          data.updatedAt.toDate()
        : new Date(),
    } as SessionSettings;
  } catch (error) {
    console.error("Error getting session settings:", error);
    throw error;
  }
};

export const updateSessionSettings = async (
  sessionId: string,
  updates: UpdateSessionSettingsInput,
) => {
  try {
    const settingsRef = doc(db, "sessions", sessionId, "settings", "config");

    // Filter out undefined values and add timestamp
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined),
    );

    await setDoc(
      settingsRef,
      { ...cleanUpdates, updatedAt: serverTimestamp() },
      { merge: true },
    );

    return { success: true };
  } catch (error) {
    console.error("Error updating session settings:", error);
    throw error;
  }
};

export const createDefaultSessionSettings = async (sessionId: string) => {
  try {
    const settingsRef = doc(db, "sessions", sessionId, "settings", "config");

    const defaultSettings = {
      allowAnonymousIdeas: true,
      allowComments: true,
      allowVoting: true,
      votesPerUser: null,
      maxVotesPerIdea: null,
      maxVotesPerCategory: null,
      allowVotingOnGroups: true,
      allowVotingOnIdeas: true,
      autoGroupSimilarIdeas: false,
      maxIdeasPerPerson: null,
      enableTimer: false,
      timerDuration: null,
      greenRoomStartTime: null,
      ideaCollectionTimerEnd: null,
      ideaCollectionEnabled: true,
      updatedAt: serverTimestamp(),
    };

    await setDoc(settingsRef, defaultSettings);
    return { success: true };
  } catch (error) {
    console.error("Error creating default session settings:", error);
    throw error;
  }
};
