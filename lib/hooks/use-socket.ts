"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";

type SocketEventHandler = (...args: unknown[]) => void;

export const useSocket = (sessionId?: string) => {
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only initialize socket if we're in the browser and have a sessionId
    if (typeof window === "undefined" || !sessionId) {
      return;
    }

    // Create socket connection
    const newSocket = io({
      path: "/api/socket",
      addTrailingSlash: false,
    });

    socketRef.current = newSocket;

    // Connection event handlers - set state in callbacks, not synchronously
    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setConnected(true);
      setSocket(newSocket);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnected(false);
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [sessionId]);

  const emit = useCallback((event: string, data?: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event: string, handler: SocketEventHandler) => {
    socketRef.current?.on(event, handler);
  }, []);

  const off = useCallback((event: string, handler?: SocketEventHandler) => {
    if (handler) {
      socketRef.current?.off(event, handler);
    } else {
      socketRef.current?.off(event);
    }
  }, []);

  return {
    socket,
    connected,
    emit,
    on,
    off,
  };
};
