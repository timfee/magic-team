"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSocket } from "@/lib/hooks/use-socket";
import { usePresence } from "@/lib/hooks/use-presence";
import type {
  MagicSessionWithDetails,
  IdeaWithDetails,
  IdeaGroupWithDetails,
  SessionStage,
} from "@/lib/types/session";

interface ActiveUser {
  id: string;
  name: string | null;
  image: string | null;
  lastSeenAt: Date;
}

interface SessionContextValue {
  session: MagicSessionWithDetails;
  ideas: IdeaWithDetails[];
  groups: IdeaGroupWithDetails[];
  currentStage: SessionStage;
  activeUsers: ActiveUser[];
  userCount: number;
  isConnected: boolean;
  // Methods
  updateIdea: (ideaId: string, updates: Partial<IdeaWithDetails>) => void;
  deleteIdea: (ideaId: string) => void;
  moveIdea: (ideaId: string, categoryId: string, groupId: string | null, order: number) => void;
  updateGroup: (groupId: string, updates: Partial<IdeaGroupWithDetails>) => void;
  deleteGroup: (groupId: string) => void;
  changeStage: (newStage: SessionStage) => void;
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
  initialSession: MagicSessionWithDetails;
  initialIdeas: IdeaWithDetails[];
  initialGroups: IdeaGroupWithDetails[];
  userId: string;
  userName: string;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
  initialSession,
  initialIdeas,
  initialGroups,
  userId,
  userName,
}) => {
  const [ideas, setIdeas] = useState(initialIdeas);
  const [groups, setGroups] = useState(initialGroups);
  const [currentStage, setCurrentStage] = useState<SessionStage>(
    initialSession.currentStage as SessionStage
  );

  const { connected, emit, on, off } = useSocket(initialSession.id);
  const { activeUsers, userCount, isConnected } = usePresence(
    initialSession.id,
    userId,
    userName
  );

  // Idea event handlers
  useEffect(() => {
    if (!connected) return;

    const handleIdeaCreated = (data: unknown) => {
      const { idea } = data as { sessionId: string; idea: IdeaWithDetails };
      setIdeas((prev) => [...prev, idea]);
    };

    const handleIdeaUpdated = (data: unknown) => {
      const { ideaId, updates } = data as {
        sessionId: string;
        ideaId: string;
        updates: Partial<IdeaWithDetails>;
      };
      setIdeas((prev) =>
        prev.map((idea) => (idea.id === ideaId ? { ...idea, ...updates } : idea))
      );
    };

    const handleIdeaDeleted = (data: unknown) => {
      const { ideaId } = data as { sessionId: string; ideaId: string };
      setIdeas((prev) => prev.filter((idea) => idea.id !== ideaId));
    };

    const handleIdeaMoved = (data: unknown) => {
      const { ideaId, categoryId, groupId, order } = data as {
        sessionId: string;
        ideaId: string;
        categoryId: string;
        groupId: string | null;
        order: number;
      };
      setIdeas((prev) =>
        prev.map((idea) =>
          idea.id === ideaId ? { ...idea, categoryId, groupId, order } : idea
        )
      );
    };

    on("idea:created", handleIdeaCreated);
    on("idea:updated", handleIdeaUpdated);
    on("idea:deleted", handleIdeaDeleted);
    on("idea:moved", handleIdeaMoved);

    return () => {
      off("idea:created", handleIdeaCreated);
      off("idea:updated", handleIdeaUpdated);
      off("idea:deleted", handleIdeaDeleted);
      off("idea:moved", handleIdeaMoved);
    };
  }, [connected, on, off]);

  // Group event handlers
  useEffect(() => {
    if (!connected) return;

    const handleGroupCreated = (data: unknown) => {
      const { group } = data as {
        sessionId: string;
        group: IdeaGroupWithDetails;
      };
      setGroups((prev) => [...prev, group]);
    };

    const handleGroupUpdated = (data: unknown) => {
      const { groupId, updates } = data as {
        sessionId: string;
        groupId: string;
        updates: Partial<IdeaGroupWithDetails>;
      };
      setGroups((prev) =>
        prev.map((group) => (group.id === groupId ? { ...group, ...updates } : group))
      );
    };

    const handleGroupDeleted = (data: unknown) => {
      const { groupId } = data as { sessionId: string; groupId: string };
      setGroups((prev) => prev.filter((group) => group.id !== groupId));
    };

    on("group:created", handleGroupCreated);
    on("group:updated", handleGroupUpdated);
    on("group:deleted", handleGroupDeleted);

    return () => {
      off("group:created", handleGroupCreated);
      off("group:updated", handleGroupUpdated);
      off("group:deleted", handleGroupDeleted);
    };
  }, [connected, on, off]);

  // Stage change handler
  useEffect(() => {
    if (!connected) return;

    const handleStageChanged = (data: unknown) => {
      const { newStage } = data as {
        sessionId: string;
        newStage: SessionStage;
        changedBy: string;
      };
      setCurrentStage(newStage);
    };

    on("stage:changed", handleStageChanged);

    return () => {
      off("stage:changed", handleStageChanged);
    };
  }, [connected, on, off]);

  // Methods
  const updateIdea = useCallback(
    (ideaId: string, updates: Partial<IdeaWithDetails>) => {
      // Optimistic update
      setIdeas((prev) =>
        prev.map((idea) => (idea.id === ideaId ? { ...idea, ...updates } : idea))
      );
      // Broadcast
      emit("idea:updated", { sessionId: initialSession.id, ideaId, updates });
    },
    [emit, initialSession.id]
  );

  const deleteIdea = useCallback(
    (ideaId: string) => {
      // Optimistic update
      setIdeas((prev) => prev.filter((idea) => idea.id !== ideaId));
      // Broadcast
      emit("idea:deleted", { sessionId: initialSession.id, ideaId });
    },
    [emit, initialSession.id]
  );

  const moveIdea = useCallback(
    (ideaId: string, categoryId: string, groupId: string | null, order: number) => {
      // Optimistic update
      setIdeas((prev) =>
        prev.map((idea) =>
          idea.id === ideaId ? { ...idea, categoryId, groupId, order } : idea
        )
      );
      // Broadcast
      emit("idea:moved", { sessionId: initialSession.id, ideaId, categoryId, groupId, order });
    },
    [emit, initialSession.id]
  );

  const updateGroup = useCallback(
    (groupId: string, updates: Partial<IdeaGroupWithDetails>) => {
      // Optimistic update
      setGroups((prev) =>
        prev.map((group) => (group.id === groupId ? { ...group, ...updates } : group))
      );
      // Broadcast
      emit("group:updated", { sessionId: initialSession.id, groupId, updates });
    },
    [emit, initialSession.id]
  );

  const deleteGroup = useCallback(
    (groupId: string) => {
      // Optimistic update
      setGroups((prev) => prev.filter((group) => group.id !== groupId));
      // Broadcast
      emit("group:deleted", { sessionId: initialSession.id, groupId });
    },
    [emit, initialSession.id]
  );

  const changeStage = useCallback(
    (newStage: SessionStage) => {
      // Optimistic update
      setCurrentStage(newStage);
      // Broadcast
      emit("stage:change", {
        sessionId: initialSession.id,
        newStage,
        changedBy: userId,
      });
    },
    [emit, initialSession.id, userId]
  );

  const value: SessionContextValue = {
    session: initialSession,
    ideas,
    groups,
    currentStage,
    activeUsers,
    userCount,
    isConnected,
    updateIdea,
    deleteIdea,
    moveIdea,
    updateGroup,
    deleteGroup,
    changeStage,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};
