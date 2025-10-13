const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
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
  const io = new Server(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: dev ? "http://localhost:3000" : process.env.NEXTAUTH_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Session join/leave
    socket.on("session:join", ({ sessionId, userId }) => {
      socket.join(`session:${sessionId}`);
      console.log(`User ${userId} joined session ${sessionId}`);
      io.to(`session:${sessionId}`).emit("user:joined", { userId });
    });

    socket.on("session:leave", ({ sessionId, userId }) => {
      socket.leave(`session:${sessionId}`);
      console.log(`User ${userId} left session ${sessionId}`);
      io.to(`session:${sessionId}`).emit("user:left", { userId });
    });

    // Forward all session events to the room
    const forwardEvents = [
      "stage:change",
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
