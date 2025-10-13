import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { db } from "@/lib/db";
import { userPresence } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type {
  SessionJoinEvent,
  StageChangedEvent,
  IdeaCreatedEvent,
  IdeaUpdatedEvent,
  IdeaMovedEvent,
  GroupCreatedEvent,
  GroupUpdatedEvent,
  CommentCreatedEvent,
  VoteCastEvent,
  VoteRemovedEvent,
} from "@/lib/types/session";

let io: SocketIOServer | null = null;

export const initSocketServer = (httpServer: HTTPServer) => {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NODE_ENV === "production"
        ? process.env.NEXTAUTH_URL
        : "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join session room
    socket.on("session:join", async (data: SessionJoinEvent) => {
      const { sessionId, userId, userName } = data;
      try {
        // Join the room
        await socket.join(`session:${sessionId}`);

        // Update presence in database
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

        // Get all active users
        const activeUsers = await db.query.userPresence.findMany({
          where: and(
            eq(userPresence.sessionId, sessionId),
            eq(userPresence.isActive, true)
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

        // Broadcast updated presence
        io?.to(`session:${sessionId}`).emit("presence:update", {
          sessionId,
          activeUsers: activeUsers.map((p) => ({
            id: p.user.id,
            name: p.user.name,
            image: p.user.image,
            lastSeenAt: p.lastSeenAt,
          })),
          count: activeUsers.length,
        });

        console.log(`User ${userName} joined session ${sessionId}`);
      } catch (error) {
        console.error("Error joining session:", error);
        socket.emit("error", { message: "Failed to join session" });
      }
    });

    // Leave session room
    socket.on("session:leave", async (data: { sessionId: string; userId: string }) => {
      const { sessionId, userId } = data;
      try {
        // Leave the room
        await socket.leave(`session:${sessionId}`);

        // Update presence
        await db
          .update(userPresence)
          .set({
            isActive: false,
            lastSeenAt: new Date(),
          })
          .where(
            and(
              eq(userPresence.sessionId, sessionId),
              eq(userPresence.userId, userId)
            )
          );

        // Get remaining active users
        const activeUsers = await db.query.userPresence.findMany({
          where: and(
            eq(userPresence.sessionId, sessionId),
            eq(userPresence.isActive, true)
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

        // Broadcast updated presence
        io?.to(`session:${sessionId}`).emit("presence:update", {
          sessionId,
          activeUsers: activeUsers.map((p) => ({
            id: p.user.id,
            name: p.user.name,
            image: p.user.image,
            lastSeenAt: p.lastSeenAt,
          })),
          count: activeUsers.length,
        });

        console.log(`User left session ${sessionId}`);
      } catch (error) {
        console.error("Error leaving session:", error);
      }
    });

    // Presence heartbeat
    socket.on("presence:heartbeat", async (data: { sessionId: string; userId: string }) => {
      const { sessionId, userId } = data;
      try {
        await db
          .update(userPresence)
          .set({ lastSeenAt: new Date() })
          .where(
            and(
              eq(userPresence.sessionId, sessionId),
              eq(userPresence.userId, userId)
            )
          );
      } catch (error) {
        console.error("Error updating heartbeat:", error);
      }
    });

    // Stage change
    socket.on("stage:change", (data: StageChangedEvent) => {
      const { sessionId, newStage, changedBy } = data;
      io?.to(`session:${sessionId}`).emit("stage:changed", {
        sessionId,
        newStage,
        changedBy,
      });
      console.log(`Stage changed to ${newStage} in session ${sessionId}`);
    });

    // Idea events
    socket.on("idea:created", (data: IdeaCreatedEvent) => {
      const { sessionId, idea } = data;
      socket.to(`session:${sessionId}`).emit("idea:created", {
        sessionId,
        idea,
      });
    });

    socket.on("idea:updated", (data: IdeaUpdatedEvent) => {
      const { sessionId, ideaId, updates } = data;
      socket.to(`session:${sessionId}`).emit("idea:updated", {
        sessionId,
        ideaId,
        updates,
      });
    });

    socket.on("idea:deleted", (data: { sessionId: string; ideaId: string }) => {
      const { sessionId, ideaId } = data;
      socket.to(`session:${sessionId}`).emit("idea:deleted", {
        sessionId,
        ideaId,
      });
    });

    socket.on("idea:moved", (data: IdeaMovedEvent) => {
      const { sessionId, ideaId, categoryId, groupId, order } = data;
      socket.to(`session:${sessionId}`).emit("idea:moved", {
        sessionId,
        ideaId,
        categoryId,
        groupId,
        order,
      });
    });

    // Group events
    socket.on("group:created", (data: GroupCreatedEvent) => {
      const { sessionId, group } = data;
      socket.to(`session:${sessionId}`).emit("group:created", {
        sessionId,
        group,
      });
    });

    socket.on("group:updated", (data: GroupUpdatedEvent) => {
      const { sessionId, groupId, updates } = data;
      socket.to(`session:${sessionId}`).emit("group:updated", {
        sessionId,
        groupId,
        updates,
      });
    });

    socket.on("group:deleted", (data: { sessionId: string; groupId: string }) => {
      const { sessionId, groupId } = data;
      socket.to(`session:${sessionId}`).emit("group:deleted", {
        sessionId,
        groupId,
      });
    });

    // Comment events
    socket.on("comment:created", (data: CommentCreatedEvent) => {
      const { sessionId, comment } = data;
      socket.to(`session:${sessionId}`).emit("comment:created", {
        sessionId,
        comment,
      });
    });

    // Vote events
    socket.on("vote:cast", (data: VoteCastEvent) => {
      const { sessionId, vote } = data;
      socket.to(`session:${sessionId}`).emit("vote:cast", {
        sessionId,
        vote,
      });
    });

    socket.on("vote:removed", (data: VoteRemovedEvent) => {
      const { sessionId, voteId } = data;
      socket.to(`session:${sessionId}`).emit("vote:removed", {
        sessionId,
        voteId,
      });
    });

    // Settings update
    socket.on("settings:updated", (data: { sessionId: string }) => {
      const { sessionId } = data;
      io?.to(`session:${sessionId}`).emit("settings:updated", {
        sessionId,
      });
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  console.log("Socket.io server initialized");
  return io;
};

export const getSocketServer = () => {
  if (!io) {
    throw new Error("Socket.io server not initialized");
  }
  return io;
};
