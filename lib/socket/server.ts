import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import type { Socket } from "socket.io";
import { db } from "@/lib/db";
import { userPresence } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export type SocketServer = SocketIOServer;

let io: SocketIOServer | null = null;

export const initSocketServer = (httpServer: NetServer): SocketIOServer => {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
  });

  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    // Join session room
    socket.on("session:join", async (data: { sessionId: string; userId: string }) => {
      const { sessionId, userId } = data;

      await socket.join(`session:${sessionId}`);

      // Update presence in database
      try {
        await db
          .insert(userPresence)
          .values({
            sessionId,
            userId,
            isActive: true,
            lastSeenAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [userPresence.sessionId, userPresence.userId],
            set: {
              isActive: true,
              lastSeenAt: new Date(),
            },
          });

        // Broadcast presence update to room
        const presenceList = await db.query.userPresence.findMany({
          where: and(
            eq(userPresence.sessionId, sessionId),
            eq(userPresence.isActive, true),
          ),
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        });

        io?.to(`session:${sessionId}`).emit("presence:update", {
          sessionId,
          activeUsers: presenceList.map((p) => ({
            id: p.user.id,
            name: p.user.name,
            image: p.user.image,
            lastSeenAt: p.lastSeenAt,
          })),
          count: presenceList.length,
        });

        console.log(`User ${userId} joined session ${sessionId}`);
      } catch (error) {
        console.error("Failed to update presence:", error);
      }
    });

    // Leave session room
    socket.on("session:leave", async (data: { sessionId: string; userId: string }) => {
      const { sessionId, userId } = data;

      await socket.leave(`session:${sessionId}`);

      // Update presence in database
      try {
        await db
          .update(userPresence)
          .set({
            isActive: false,
            lastSeenAt: new Date(),
          })
          .where(
            and(
              eq(userPresence.sessionId, sessionId),
              eq(userPresence.userId, userId),
            ),
          );

        // Broadcast presence update to room
        const presenceList = await db.query.userPresence.findMany({
          where: and(
            eq(userPresence.sessionId, sessionId),
            eq(userPresence.isActive, true),
          ),
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        });

        io?.to(`session:${sessionId}`).emit("presence:update", {
          sessionId,
          activeUsers: presenceList.map((p) => ({
            id: p.user.id,
            name: p.user.name,
            image: p.user.image,
            lastSeenAt: p.lastSeenAt,
          })),
          count: presenceList.length,
        });

        console.log(`User ${userId} left session ${sessionId}`);
      } catch (error) {
        console.error("Failed to update presence:", error);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

export const getSocketServer = (): SocketIOServer | null => {
  return io;
};

// Broadcast helpers
export const broadcastToSession = (sessionId: string, event: string, data: any) => {
  if (io) {
    io.to(`session:${sessionId}`).emit(event, data);
  }
};
