const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server: SocketIOServer } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Initialize Socket.io
  const io = new SocketIOServer(server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: dev ? ["http://localhost:3000"] : false,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
  });

  io.on("connection", (socket) => {
    console.log("✅ Client connected:", socket.id);

    // Join session room
    socket.on("session:join", async (data) => {
      const { sessionId, userId } = data;
      await socket.join(`session:${sessionId}`);
      console.log(`👤 User ${userId} joined session ${sessionId}`);

      // Emit a simple confirmation
      socket.emit("session:joined", { sessionId, userId });

      // Broadcast user count update (client will fetch actual presence)
      io.to(`session:${sessionId}`).emit("presence:changed", { sessionId });
    });

    // Leave session room
    socket.on("session:leave", async (data) => {
      const { sessionId, userId } = data;
      await socket.leave(`session:${sessionId}`);
      console.log(`👋 User ${userId} left session ${sessionId}`);

      // Broadcast user count update
      io.to(`session:${sessionId}`).emit("presence:changed", { sessionId });
    });

    // Stage change events
    socket.on("stage:change", async (data) => {
      const { sessionId, newStage, userId } = data;
      console.log(`🎬 Stage changed to ${newStage} in session ${sessionId}`);
      io.to(`session:${sessionId}`).emit("stage:changed", {
        sessionId,
        newStage,
        changedBy: userId,
      });
    });

    // Idea events - just relay them
    socket.on("idea:created", (data) => {
      console.log(`💡 Idea created in session ${data.sessionId}`);
      io.to(`session:${data.sessionId}`).emit("idea:created", data);
    });

    socket.on("idea:updated", (data) => {
      console.log(`✏️  Idea updated in session ${data.sessionId}`);
      io.to(`session:${data.sessionId}`).emit("idea:updated", data);
    });

    socket.on("idea:moved", (data) => {
      console.log(`🔄 Idea moved in session ${data.sessionId}`);
      io.to(`session:${data.sessionId}`).emit("idea:moved", data);
    });

    socket.on("idea:deleted", (data) => {
      console.log(`🗑️  Idea deleted in session ${data.sessionId}`);
      io.to(`session:${data.sessionId}`).emit("idea:deleted", data);
    });

    // Group events
    socket.on("group:created", (data) => {
      console.log(`📦 Group created in session ${data.sessionId}`);
      io.to(`session:${data.sessionId}`).emit("group:created", data);
    });

    socket.on("group:updated", (data) => {
      console.log(`✏️  Group updated in session ${data.sessionId}`);
      io.to(`session:${data.sessionId}`).emit("group:updated", data);
    });

    socket.on("group:deleted", (data) => {
      console.log(`🗑️  Group deleted in session ${data.sessionId}`);
      io.to(`session:${data.sessionId}`).emit("group:deleted", data);
    });

    // Comment events
    socket.on("comment:created", (data) => {
      console.log(`💬 Comment created in session ${data.sessionId}`);
      io.to(`session:${data.sessionId}`).emit("comment:created", data);
    });

    // Vote events
    socket.on("vote:cast", (data) => {
      console.log(`👍 Vote cast in session ${data.sessionId}`);
      io.to(`session:${data.sessionId}`).emit("vote:cast", data);
    });

    socket.on("vote:removed", (data) => {
      console.log(`👎 Vote removed in session ${data.sessionId}`);
      io.to(`session:${data.sessionId}`).emit("vote:removed", data);
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`\n🚀 Ready on http://${hostname}:${port}`);
    console.log(`⚡ Socket.io server running on path: /api/socket\n`);
  });
});
