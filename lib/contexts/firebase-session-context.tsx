"use client";

import { db } from "@/lib/firebase/client";
import type {
  IdeaGroupWithDetails,
  IdeaWithDetails,
  MagicSessionWithDetails,
  SessionStage,
  SessionVisibility,
} from "@/lib/types/session";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useThrottle } from "@/lib/hooks/use-throttle";

// Type guards for Firestore data
function isValidStage(value: unknown): value is SessionStage {
  const validStages = [
    "pre_session",
    "green_room",
    "idea_collection",
    "idea_voting",
    "idea_grouping",
    "idea_finalization",
    "post_session",
  ];
  return typeof value === "string" && validStages.includes(value);
}

function isValidVisibility(value: unknown): value is SessionVisibility {
  return (
    typeof value === "string" &&
    ["public", "private", "protected"].includes(value)
  );
}

interface ActiveUser {
  id: string;
  name: string | null;
  image: string | null;
  lastSeenAt: Date;
}

interface SessionContextValue {
  session: MagicSessionWithDetails | null;
  ideas: IdeaWithDetails[];
  groups: IdeaGroupWithDetails[];
  currentStage: SessionStage;
  activeUsers: ActiveUser[];
  userCount: number;
  isConnected: boolean;
  isLoading: boolean;
  userId: string;
  userName: string;
  // Methods
  updateIdea: (
    ideaId: string,
    updates: Partial<IdeaWithDetails>,
  ) => Promise<void>;
  deleteIdea: (ideaId: string) => Promise<void>;
  updateGroup: (
    groupId: string,
    updates: Partial<IdeaGroupWithDetails>,
  ) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  changeStage: (newStage: SessionStage) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

interface SessionProviderProps {
  children: React.ReactNode;
  sessionId: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
  sessionId,
  userId,
  userName,
  userPhoto,
}) => {
  const [session, setSession] = useState<MagicSessionWithDetails | null>(null);
  const [ideas, setIdeas] = useState<IdeaWithDetails[]>([]);
  const [groups, setGroups] = useState<IdeaGroupWithDetails[]>([]);
  const [currentStage, setCurrentStage] = useState<SessionStage>("pre_session");
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Throttle state updates for ideas and groups to reduce re-renders (200ms)
  const throttledIdeas = useThrottle(ideas, 200);
  const throttledGroups = useThrottle(groups, 200);

  // Load session data from Firebase
  useEffect(() => {
    const sessionRef = doc(db, "sessions", sessionId);

    const unsubscribe = onSnapshot(sessionRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const ownerId =
          typeof data.ownerId === "string" ? data.ownerId : userName;
        const visibility = isValidVisibility(data.visibility) ?
          data.visibility
        : "public";
        const stage = isValidStage(data.currentStage) ?
          data.currentStage
        : "pre_session";

        setSession({
          id: doc.id,
          name: typeof data.name === "string" ? data.name : "Untitled Session",
          description:
            typeof data.description === "string" ? data.description : undefined,
          ownerId,
          visibility,
          currentStage: stage,
          createdAt:
            data.createdAt instanceof Timestamp ?
              data.createdAt.toDate()
            : new Date(data.createdAt as string | number | Date),
          updatedAt:
            data.updatedAt instanceof Timestamp ? data.updatedAt.toDate()
            : data.updatedAt ?
              new Date(data.updatedAt as string | number | Date)
            : new Date(),
          /**
           * Categories and settings are loaded via Server Actions in parent components.
           * This context provides real-time updates only, not initial data fetching.
           * See: lib/actions/session.ts:createSession for where these are created in subcollections.
           */
          categories: [], // Populated by parent component (not real-time listener)
          settings: null, // Populated by parent component (not real-time listener)
          owner: {
            id: ownerId,
            name: userName,
            email: "",
            image: null,
          },
          admins: [],
          _count: { ideas: 0, presence: 0 },
        } as unknown as MagicSessionWithDetails);
        setCurrentStage(stage);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [sessionId, userName]);

  /**
   * Set up presence tracking for authenticated users only.
   * Anonymous users are intentionally excluded because:
   * 1. Firebase security rules require authentication for presence writes
   * 2. Anonymous sessions don't provide meaningful user identification
   * 3. The app requires auth for all core functionality (ideas, votes, comments)
   */
  useEffect(() => {
    if (!userId || userId === "anonymous") return;

    const presenceRef = doc(db, "sessions", sessionId, "presence", userId);

    // Set user as active when component mounts
    const setPresence = async () => {
      try {
        await setDoc(presenceRef, {
          userId,
          userName,
          userPhoto,
          isActive: true,
          lastSeenAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error setting presence:", error);
      }
    };

    void setPresence();

    // Update presence periodically
    const interval = setInterval(() => {
      setDoc(
        presenceRef,
        {
          userId,
          userName,
          userPhoto,
          isActive: true,
          lastSeenAt: serverTimestamp(),
        },
        { merge: true },
      ).catch(console.error);
    }, 30000); // Update every 30 seconds

    // Mark user as inactive on cleanup
    return () => {
      clearInterval(interval);
      setDoc(
        presenceRef,
        { isActive: false, lastSeenAt: serverTimestamp() },
        { merge: true },
      ).catch(console.error);
    };
  }, [sessionId, userId, userName, userPhoto]);

  // Listen to presence updates
  useEffect(() => {
    const presenceQuery = query(
      collection(db, "sessions", sessionId, "presence"),
      where("isActive", "==", true),
    );

    const unsubscribe = onSnapshot(presenceQuery, (snapshot) => {
      const users = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          // Validate required fields
          if (typeof data.userId !== "string") return null;

          return {
            id: data.userId,
            name: typeof data.userName === "string" ? data.userName : null,
            image: typeof data.userPhoto === "string" ? data.userPhoto : null,
            lastSeenAt:
              data.lastSeenAt instanceof Timestamp ?
                data.lastSeenAt.toDate()
              : new Date(),
          };
        })
        .filter((user): user is ActiveUser => user !== null);

      setActiveUsers(users);
      setUserCount(users.length);
    });

    return () => unsubscribe();
  }, [sessionId]);

  // Listen to session document for stage changes
  useEffect(() => {
    const sessionRef = doc(db, "sessions", sessionId);

    const unsubscribe = onSnapshot(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (isValidStage(data.currentStage)) {
          setCurrentStage(data.currentStage);
        }
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  // Listen to ideas subcollection
  useEffect(() => {
    const ideasQuery = collection(db, "sessions", sessionId, "ideas");

    const unsubscribe = onSnapshot(ideasQuery, (snapshot) => {
      const updatedIdeas = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          sessionId: data.sessionId as string,
          categoryId: data.categoryId as string,
          groupId: data.groupId as string | undefined,
          content: data.content as string,
          authorId: data.authorId as string | undefined,
          isAnonymous: (data.isAnonymous as boolean) ?? false,
          order: (data.order as number) ?? 0,
          isSelected: (data.isSelected as boolean) ?? false,
          priority: data.priority as number | undefined,
          assignedToId: data.assignedToId as string | undefined,
          createdAt:
            data.createdAt instanceof Timestamp ? data.createdAt.toDate()
            : data.createdAt ?
              new Date(data.createdAt as string | number | Date)
            : new Date(),
          updatedAt:
            data.updatedAt instanceof Timestamp ? data.updatedAt.toDate()
            : data.updatedAt ?
              new Date(data.updatedAt as string | number | Date)
            : new Date(),
          // Simplified - real-time listeners don't need full relational data
          author: null,
          group: null,
          comments: [],
          votes: [],
          _count: { comments: 0, votes: 0 },
        };
      });
      setIdeas(updatedIdeas);
    });

    return () => unsubscribe();
  }, [sessionId]);

  // Listen to groups subcollection
  useEffect(() => {
    const groupsQuery = collection(db, "sessions", sessionId, "groups");

    const unsubscribe = onSnapshot(groupsQuery, (snapshot) => {
      const updatedGroups = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          sessionId: data.sessionId as string,
          categoryId: data.categoryId as string,
          title: data.title as string | undefined,
          order: (data.order as number) ?? 0,
          maxCards: data.maxCards as number | undefined,
          createdAt:
            data.createdAt instanceof Timestamp ? data.createdAt.toDate()
            : data.createdAt ?
              new Date(data.createdAt as string | number | Date)
            : new Date(),
          updatedAt:
            data.updatedAt instanceof Timestamp ? data.updatedAt.toDate()
            : data.updatedAt ?
              new Date(data.updatedAt as string | number | Date)
            : new Date(),
          // Simplified - real-time listeners don't need full relational data
          ideas: [],
          comments: [],
          votes: [],
          _count: { ideas: 0, votes: 0, comments: 0 },
        };
      });
      setGroups(updatedGroups);
    });

    return () => unsubscribe();
  }, [sessionId]);

  // Methods - no more optimistic updates, Firestore handles real-time sync
  const updateIdea = useCallback(
    async (ideaId: string, updates: Partial<IdeaWithDetails>) => {
      try {
        const { updateIdea } = await import("@/lib/actions/ideas");
        // Map IdeaWithDetails to UpdateIdeaInput
        const updateInput = {
          content: updates.content,
          categoryId: updates.categoryId,
          groupId: updates.groupId,
          order: updates.order,
          isSelected: updates.isSelected,
          priority: updates.priority,
          assignedToId: updates.assignedToId,
        };
        await updateIdea(ideaId, sessionId, updateInput);
      } catch (error) {
        console.error("Error updating idea:", error);
        throw error;
      }
    },
    [sessionId],
  );

  const deleteIdea = useCallback(
    async (ideaId: string) => {
      try {
        const { deleteIdea } = await import("@/lib/actions/ideas");
        await deleteIdea(ideaId, sessionId);
      } catch (error) {
        console.error("Error deleting idea:", error);
        throw error;
      }
    },
    [sessionId],
  );

  const updateGroup = useCallback(
    async (groupId: string, updates: Partial<IdeaGroupWithDetails>) => {
      try {
        const groupRef = doc(db, "sessions", sessionId, "groups", groupId);
        await updateDoc(groupRef, { ...updates, updatedAt: serverTimestamp() });
      } catch (error) {
        console.error("Error updating group:", error);
        throw error;
      }
    },
    [sessionId],
  );

  const deleteGroup = useCallback(
    async (groupId: string) => {
      try {
        const groupRef = doc(db, "sessions", sessionId, "groups", groupId);
        await deleteDoc(groupRef);
      } catch (error) {
        console.error("Error deleting group:", error);
        throw error;
      }
    },
    [sessionId],
  );

  const changeStage = useCallback(
    async (_newStage: SessionStage) => {
      try {
        const { updateSessionStage } = await import("@/lib/actions/session");
        await updateSessionStage(sessionId, _newStage);
      } catch (error) {
        console.error("Error changing stage:", error);
        throw error;
      }
    },
    [sessionId],
  );

  const value: SessionContextValue = {
    session:
      session
      ?? ({
        id: sessionId,
        name: "Loading...",
        description: undefined,
        ownerId: userId,
        visibility: "public" as SessionVisibility,
        currentStage: "pre_session" as SessionStage,
        createdAt: new Date(),
        updatedAt: new Date(),
        categories: [],
        settings: null,
        owner: { id: userId, name: userName, email: "", image: null },
        admins: [],
        _count: { ideas: 0, presence: 0 },
      } as unknown as MagicSessionWithDetails),
    ideas: throttledIdeas,
    groups: throttledGroups,
    currentStage,
    activeUsers,
    userCount,
    isConnected: true, // Always connected with Firestore
    isLoading,
    userId,
    userName,
    updateIdea,
    deleteIdea,
    updateGroup,
    deleteGroup,
    changeStage,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};
