"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const drizzle_orm_1 = require("drizzle-orm");
const http_1 = require("http");
const next_1 = __importDefault(require("next"));
const socket_io_1 = require("socket.io");
const url_1 = require("url");
const env_mjs_1 = require("@/env.mjs");
const index_1 = require("@/lib/db/index");
const schema_1 = require("@/lib/db/schema");
const dev = env_mjs_1.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = (0, next_1.default)({ dev, hostname, port });
const handle = app.getRequestHandler();
app.prepare().then(() => {
    var _a;
    const httpServer = (0, http_1.createServer)(async (req, res) => {
        try {
            const parsedUrl = (0, url_1.parse)(req.url, true);
            await handle(req, res, parsedUrl);
        }
        catch (err) {
            console.error("Error occurred handling", req.url, err);
            res.statusCode = 500;
            res.end("internal server error");
        }
    });
    // Initialize Socket.io
    const io = new socket_io_1.Server(httpServer, {
        path: "/api/socket",
        addTrailingSlash: false,
        cors: {
            origin: dev
                ? "http://localhost:3000"
                : ((_a = env_mjs_1.env.NEXTAUTH_URL) !== null && _a !== void 0 ? _a : "http://localhost:3000"),
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);
        // Session join/leave with presence tracking
        socket.on("session:join", async (data) => {
            const { sessionId, userId } = data;
            try {
                await socket.join(`session:${sessionId}`);
                console.log(`User ${userId} joined session ${sessionId}`);
                // Update presence in database
                await index_1.db
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
                const activeUsersData = await index_1.db
                    .select({
                    userId: schema_1.userPresence.userId,
                    lastSeenAt: schema_1.userPresence.lastSeenAt,
                    userName: schema_1.users.name,
                    userImage: schema_1.users.image,
                })
                    .from(schema_1.userPresence)
                    .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.userPresence.userId, schema_1.users.id))
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userPresence.sessionId, sessionId), (0, drizzle_orm_1.eq)(schema_1.userPresence.isActive, true)));
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
            }
            catch (error) {
                console.error("Error joining session:", error);
            }
        });
        socket.on("session:leave", async (data) => {
            const { sessionId, userId } = data;
            try {
                await socket.leave(`session:${sessionId}`);
                console.log(`User ${userId} left session ${sessionId}`);
                // Update presence
                await index_1.db
                    .update(schema_1.userPresence)
                    .set({
                    isActive: false,
                    lastSeenAt: new Date(),
                })
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userPresence.sessionId, sessionId), (0, drizzle_orm_1.eq)(schema_1.userPresence.userId, userId)));
                // Get remaining active users
                const activeUsersData = await index_1.db
                    .select({
                    userId: schema_1.userPresence.userId,
                    lastSeenAt: schema_1.userPresence.lastSeenAt,
                    userName: schema_1.users.name,
                    userImage: schema_1.users.image,
                })
                    .from(schema_1.userPresence)
                    .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.userPresence.userId, schema_1.users.id))
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userPresence.sessionId, sessionId), (0, drizzle_orm_1.eq)(schema_1.userPresence.isActive, true)));
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
            }
            catch (error) {
                console.error("Error leaving session:", error);
            }
        });
        // Stage change - transform to "stage:changed" for clients
        socket.on("stage:change", (data) => {
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
            socket.on(event, (data) => {
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
