import "dotenv/config";

import { and, eq } from "drizzle-orm";
import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { parse } from "url";
import { env } from "@/env.mjs";
import { db } from "@/lib/db/index";
import { userPresence, users } from "@/lib/db/schema";

const dev = env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

interface SessionJoinData {
  sessionId: string;
  userId: string;
}

interface StageChangeData {
  sessionId: string;
  newStage: string;
  changedBy: string;
}

interface SocketEventData {
  sessionId: string;
  [key: string]: unknown;
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Initialize Socket.io
  const io = new Server(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: dev
        ? "http://localhost:3000"
        : (env.NEXTAUTH_URL ?? "http://localhost:3000"),
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Session join/leave with presence tracking
    socket.on("session:join", async (data: SessionJoinData) => {
      const { sessionId, userId } = data;
      try {
        await socket.join(`session:${sessionId}`);
        console.log(`User ${userId} joined session ${sessionId}`);

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
        const activeUsersData = await db
          .select({
            userId: userPresence.userId,
            lastSeenAt: userPresence.lastSeenAt,
            userName: users.name,
            userImage: users.image,
          })
          .from(userPresence)
          .leftJoin(users, eq(userPresence.userId, users.id))
          .where(
            and(
              eq(userPresence.sessionId, sessionId),
              eq(userPresence.isActive, true),
            ),
          );

        // Broadcast updated presence to all users in room
        io.to(`session:${sessionId}`).emit("presence:update", {
          sessionId,
          activeUsers: activeUsersData.map((u) => ({
            id: u.userId,
            name: u.userName,
            image: u.userImage,
            lastSeenAt: u.lastSeenAt,
          })),
          count: activeUsersData.length,
        });
      } catch (error) {
        console.error("Error joining session:", error);
      }
    });

    socket.on("session:leave", async (data: SessionJoinData) => {
      const { sessionId, userId } = data;
      try {
        await socket.leave(`session:${sessionId}`);
        console.log(`User ${userId} left session ${sessionId}`);

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
              eq(userPresence.userId, userId),
            ),
          );

        // Get remaining active users
        const activeUsersData = await db
          .select({
            userId: userPresence.userId,
            lastSeenAt: userPresence.lastSeenAt,
            userName: users.name,
            userImage: users.image,
          })
          .from(userPresence)
          .leftJoin(users, eq(userPresence.userId, users.id))
          .where(
            and(
              eq(userPresence.sessionId, sessionId),
              eq(userPresence.isActive, true),
            ),
          );

        // Broadcast updated presence
        io.to(`session:${sessionId}`).emit("presence:update", {
          sessionId,
          activeUsers: activeUsersData.map((u) => ({
            id: u.userId,
            name: u.userName,
            image: u.userImage,
            lastSeenAt: u.lastSeenAt,
          })),
          count: activeUsersData.length,
        });
      } catch (error) {
        console.error("Error leaving session:", error);
      }
    });

    // Stage change - transform to "stage:changed" for clients
    socket.on("stage:change", (data: StageChangeData) => {
      console.log("Stage change:", data);
      if (data.sessionId) {
        // Emit to all clients in the room (including sender)
        io.to(`session:${data.sessionId}`).emit("stage:changed", {
          sessionId: data.sessionId,
          newStage: data.newStage,
          changedBy: data.changedBy,
        });
      }
    });

    // Forward other events to the room
    const forwardEvents = [
      "idea:created",
      "idea:updated",
      "idea:deleted",
      "idea:moved",
      "group:created",
      "group:updated",
      "group:deleted",
      "comment:created",
      "vote:cast",
      "vote:removed",
      "settings:updated",
    ];

    forwardEvents.forEach((event) => {
      socket.on(event, (data: SocketEventData) => {
        console.log(`Event ${event}:`, data);
        if (data.sessionId) {
          socket.to(`session:${data.sessionId}`).emit(event, data);
        }
      });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  console.log("Socket.io server initialized");

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
