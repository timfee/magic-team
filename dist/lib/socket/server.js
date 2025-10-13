"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketServer = exports.initSocketServer = void 0;
const socket_io_1 = require("socket.io");
const db_1 = require("@/lib/db");
const schema_1 = require("@/lib/db/schema");
const drizzle_orm_1 = require("drizzle-orm");
let io = null;
const initSocketServer = (httpServer) => {
    if (io) {
        return io;
    }
    io = new socket_io_1.Server(httpServer, {
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
        socket.on("session:join", async (data) => {
            const { sessionId, userId, userName } = data;
            try {
                // Join the room
                await socket.join(`session:${sessionId}`);
                // Update presence in database
                await db_1.db
                    .insert(schema_1.userPresence)
                    .values({
                    sessionId,
                    userId,
                    isActive: true,
                    lastSeenAt: new Date(),
                })
                    .onConflictDoUpdate({
                    target: [schema_1.userPresence.sessionId, schema_1.userPresence.userId],
                    set: {
                        isActive: true,
                        lastSeenAt: new Date(),
                    },
                });
                // Get all active users
                const activeUsers = await db_1.db.query.userPresence.findMany({
                    where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userPresence.sessionId, sessionId), (0, drizzle_orm_1.eq)(schema_1.userPresence.isActive, true)),
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
                io === null || io === void 0 ? void 0 : io.to(`session:${sessionId}`).emit("presence:update", {
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
            }
            catch (error) {
                console.error("Error joining session:", error);
                socket.emit("error", { message: "Failed to join session" });
            }
        });
        // Leave session room
        socket.on("session:leave", async (data) => {
            const { sessionId, userId } = data;
            try {
                // Leave the room
                await socket.leave(`session:${sessionId}`);
                // Update presence
                await db_1.db
                    .update(schema_1.userPresence)
                    .set({
                    isActive: false,
                    lastSeenAt: new Date(),
                })
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userPresence.sessionId, sessionId), (0, drizzle_orm_1.eq)(schema_1.userPresence.userId, userId)));
                // Get remaining active users
                const activeUsers = await db_1.db.query.userPresence.findMany({
                    where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userPresence.sessionId, sessionId), (0, drizzle_orm_1.eq)(schema_1.userPresence.isActive, true)),
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
                io === null || io === void 0 ? void 0 : io.to(`session:${sessionId}`).emit("presence:update", {
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
            }
            catch (error) {
                console.error("Error leaving session:", error);
            }
        });
        // Presence heartbeat
        socket.on("presence:heartbeat", async (data) => {
            const { sessionId, userId } = data;
            try {
                await db_1.db
                    .update(schema_1.userPresence)
                    .set({ lastSeenAt: new Date() })
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userPresence.sessionId, sessionId), (0, drizzle_orm_1.eq)(schema_1.userPresence.userId, userId)));
            }
            catch (error) {
                console.error("Error updating heartbeat:", error);
            }
        });
        // Stage change
        socket.on("stage:change", (data) => {
            const { sessionId, newStage, changedBy } = data;
            io === null || io === void 0 ? void 0 : io.to(`session:${sessionId}`).emit("stage:changed", {
                sessionId,
                newStage,
                changedBy,
            });
            console.log(`Stage changed to ${newStage} in session ${sessionId}`);
        });
        // Idea events
        socket.on("idea:created", (data) => {
            const { sessionId, idea } = data;
            socket.to(`session:${sessionId}`).emit("idea:created", {
                sessionId,
                idea,
            });
        });
        socket.on("idea:updated", (data) => {
            const { sessionId, ideaId, updates } = data;
            socket.to(`session:${sessionId}`).emit("idea:updated", {
                sessionId,
                ideaId,
                updates,
            });
        });
        socket.on("idea:deleted", (data) => {
            const { sessionId, ideaId } = data;
            socket.to(`session:${sessionId}`).emit("idea:deleted", {
                sessionId,
                ideaId,
            });
        });
        socket.on("idea:moved", (data) => {
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
        socket.on("group:created", (data) => {
            const { sessionId, group } = data;
            socket.to(`session:${sessionId}`).emit("group:created", {
                sessionId,
                group,
            });
        });
        socket.on("group:updated", (data) => {
            const { sessionId, groupId, updates } = data;
            socket.to(`session:${sessionId}`).emit("group:updated", {
                sessionId,
                groupId,
                updates,
            });
        });
        socket.on("group:deleted", (data) => {
            const { sessionId, groupId } = data;
            socket.to(`session:${sessionId}`).emit("group:deleted", {
                sessionId,
                groupId,
            });
        });
        // Comment events
        socket.on("comment:created", (data) => {
            const { sessionId, comment } = data;
            socket.to(`session:${sessionId}`).emit("comment:created", {
                sessionId,
                comment,
            });
        });
        // Vote events
        socket.on("vote:cast", (data) => {
            const { sessionId, vote } = data;
            socket.to(`session:${sessionId}`).emit("vote:cast", {
                sessionId,
                vote,
            });
        });
        socket.on("vote:removed", (data) => {
            const { sessionId, voteId } = data;
            socket.to(`session:${sessionId}`).emit("vote:removed", {
                sessionId,
                voteId,
            });
        });
        // Settings update
        socket.on("settings:updated", (data) => {
            const { sessionId } = data;
            io === null || io === void 0 ? void 0 : io.to(`session:${sessionId}`).emit("settings:updated", {
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
exports.initSocketServer = initSocketServer;
const getSocketServer = () => {
    if (!io) {
        throw new Error("Socket.io server not initialized");
    }
    return io;
};
exports.getSocketServer = getSocketServer;
