"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSocket, useSessionRoom } from "@/lib/socket/client";
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
  userId: string;
  userName: string;
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
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [userCount, setUserCount] = useState(0);

  const { socket, isConnected } = useSocket();

  // Join the session room
  useSessionRoom(initialSession.id, userId);

  // Listen for presence updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handlePresenceUpdate = (data: {
      sessionId: string;
      activeUsers: ActiveUser[];
      count: number;
    }) => {
      if (data.sessionId === initialSession.id) {
        console.log("👥 Presence update:", data);
        setActiveUsers(data.activeUsers);
        setUserCount(data.count);
      }
    };

    socket.on("presence:update", handlePresenceUpdate);

    return () => {
      socket.off("presence:update", handlePresenceUpdate);
    };
  }, [socket, isConnected, initialSession.id]);

  // Idea event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleIdeaCreated = (data: unknown) => {
      const { idea } = data as { sessionId: string; idea: IdeaWithDetails };
      console.log("💡 Idea created:", idea);
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

    socket.on("idea:created", handleIdeaCreated);
    socket.on("idea:updated", handleIdeaUpdated);
    socket.on("idea:deleted", handleIdeaDeleted);
    socket.on("idea:moved", handleIdeaMoved);

    return () => {
      socket.off("idea:created", handleIdeaCreated);
      socket.off("idea:updated", handleIdeaUpdated);
      socket.off("idea:deleted", handleIdeaDeleted);
      socket.off("idea:moved", handleIdeaMoved);
    };
  }, [socket, isConnected]);

  // Group event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

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

    socket.on("group:created", handleGroupCreated);
    socket.on("group:updated", handleGroupUpdated);
    socket.on("group:deleted", handleGroupDeleted);

    return () => {
      socket.off("group:created", handleGroupCreated);
      socket.off("group:updated", handleGroupUpdated);
      socket.off("group:deleted", handleGroupDeleted);
    };
  }, [socket, isConnected]);

  // Stage change handler
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleStageChanged = (data: unknown) => {
      const { sessionId, newStage, changedBy } = data as {
        sessionId: string;
        newStage: SessionStage;
        changedBy: string;
      };
      console.log("🎭 Stage changed:", { sessionId, newStage, changedBy });
      if (sessionId === initialSession.id) {
        setCurrentStage(newStage);
      }
    };

    console.log("👂 Listening for stage:changed events on session:", initialSession.id);
    socket.on("stage:changed", handleStageChanged);

    return () => {
      console.log("👋 Stopped listening for stage:changed events");
      socket.off("stage:changed", handleStageChanged);
    };
  }, [socket, isConnected, initialSession.id]);

  // Methods
  const updateIdea = useCallback(
    (ideaId: string, updates: Partial<IdeaWithDetails>) => {
      if (!socket) return;
      // Optimistic update
      setIdeas((prev) =>
        prev.map((idea) => (idea.id === ideaId ? { ...idea, ...updates } : idea))
      );
      // Broadcast
      socket.emit("idea:updated", { sessionId: initialSession.id, ideaId, updates });
    },
    [socket, initialSession.id]
  );

  const deleteIdea = useCallback(
    (ideaId: string) => {
      if (!socket) return;
      // Optimistic update
      setIdeas((prev) => prev.filter((idea) => idea.id !== ideaId));
      // Broadcast
      socket.emit("idea:deleted", { sessionId: initialSession.id, ideaId });
    },
    [socket, initialSession.id]
  );

  const moveIdea = useCallback(
    (ideaId: string, categoryId: string, groupId: string | null, order: number) => {
      if (!socket) return;
      // Optimistic update
      setIdeas((prev) =>
        prev.map((idea) =>
          idea.id === ideaId ? { ...idea, categoryId, groupId, order } : idea
        )
      );
      // Broadcast
      socket.emit("idea:moved", { sessionId: initialSession.id, ideaId, categoryId, groupId, order });
    },
    [socket, initialSession.id]
  );

  const updateGroup = useCallback(
    (groupId: string, updates: Partial<IdeaGroupWithDetails>) => {
      if (!socket) return;
      // Optimistic update
      setGroups((prev) =>
        prev.map((group) => (group.id === groupId ? { ...group, ...updates } : group))
      );
      // Broadcast
      socket.emit("group:updated", { sessionId: initialSession.id, groupId, updates });
    },
    [socket, initialSession.id]
  );

  const deleteGroup = useCallback(
    (groupId: string) => {
      if (!socket) return;
      // Optimistic update
      setGroups((prev) => prev.filter((group) => group.id !== groupId));
      // Broadcast
      socket.emit("group:deleted", { sessionId: initialSession.id, groupId });
    },
    [socket, initialSession.id]
  );

  const changeStage = useCallback(
    (newStage: SessionStage) => {
      if (!socket) return;
      // Optimistic update
      setCurrentStage(newStage);
      // Broadcast
      socket.emit("stage:change", {
        sessionId: initialSession.id,
        newStage,
        changedBy: userId,
      });
    },
    [socket, initialSession.id, userId]
  );

  const value: SessionContextValue = {
    session: initialSession,
    ideas,
    groups,
    currentStage,
    activeUsers,
    userCount,
    isConnected,
    userId,
    userName,
    updateIdea,
    deleteIdea,
    moveIdea,
    updateGroup,
    deleteGroup,
    changeStage,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};
