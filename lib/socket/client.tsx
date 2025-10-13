"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface SocketContextType {
  socket: Socket | null;
  status: ConnectionStatus;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  status: "disconnected",
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  useEffect(() => {
    const socketInstance = io({
      path: "/api/socket",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance.id);
      setStatus("connected");
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setStatus("disconnected");
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setStatus("error");
    });

    setSocket(socketInstance);
    setStatus("connecting");

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        status,
        isConnected: status === "connected",
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// Hook for joining a session room
export const useSessionRoom = (sessionId: string | null, userId: string | null) => {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected || !sessionId || !userId) {
      return;
    }

    // Join the session room
    socket.emit("session:join", { sessionId, userId });

    // Cleanup: leave room on unmount
    return () => {
      socket.emit("session:leave", { sessionId, userId });
    };
  }, [socket, isConnected, sessionId, userId]);
};

// Hook for subscribing to session events
export const useSessionEvent = <T,>(
  event: string,
  handler: (data: T) => void,
  deps: any[] = [],
) => {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) {
      return;
    }

    socket.on(event, handler);

    return () => {
      socket.off(event, handler);
    };
  }, [socket, isConnected, event, ...deps]);
};

// Hook for emitting session events
export const useEmitSessionEvent = () => {
  const { socket, isConnected } = useSocket();

  return useCallback(
    (event: string, data: any) => {
      if (socket && isConnected) {
        socket.emit(event, data);
        return true;
      }
      return false;
    },
    [socket, isConnected],
  );
};
