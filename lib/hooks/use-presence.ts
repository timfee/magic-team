"use client";

import { useEffect, useState } from "react";
import { useSocket } from "./use-socket";
import type { PresenceUpdateEvent } from "@/lib/types/session";

export const usePresence = (sessionId: string, userId: string, userName: string) => {
  const { socket, connected, emit, on, off } = useSocket(sessionId);
  const [activeUsers, setActiveUsers] = useState<PresenceUpdateEvent["activeUsers"]>([]);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    if (!connected || !socket) return;

    // Join session when connected
    emit("session:join", { sessionId, userId, userName });

    // Listen for presence updates
    const handlePresenceUpdate = (data: unknown) => {
      const presenceData = data as PresenceUpdateEvent;
      setActiveUsers(presenceData.activeUsers);
      setUserCount(presenceData.count);
    };

    on("presence:update", handlePresenceUpdate);

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      emit("presence:heartbeat", { sessionId, userId });
    }, 30000);

    // Cleanup
    return () => {
      off("presence:update", handlePresenceUpdate);
      clearInterval(heartbeatInterval);
      emit("session:leave", { sessionId, userId });
    };
  }, [connected, sessionId, userId, userName, socket, emit, on, off]);

  return {
    activeUsers,
    userCount,
    isConnected: connected,
  };
};
