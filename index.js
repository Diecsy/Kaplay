// index.js
const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["https://kaplay.onrender.com", "http://localhost:3000"], // adjust as needed
    methods: ["GET", "POST"],
    credentials: true
  }
});

// serve static files from ./Static
const staticPath = path.join(__dirname, "Static");
app.use(express.static(staticPath));

const ServerState = {
  ActiveClients: new Set(),
  ActiveMatches: new Set(),
  Port: process.env.PORT || 3000,
};

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // safe access to handshake auth
  const clientInfo = socket.handshake?.auth?.Client;
  const clientId = clientInfo?.ClientId;

  if (!clientId) {
    console.log(`Connection rejected (missing ClientId) - socket: ${socket.id}`);
    socket.emit("ConnectionError", "MissingClientId");
    socket.disconnect(true);
    return;
  }

  // deny duplicate clientId (single tab)
  if (ServerState.ActiveClients.has(clientId)) {
    console.log(`Duplicate ClientId ${clientId} attempted connection; rejecting.`);
    socket.emit("ConnectionError", "SingleTab");
    socket.disconnect(true);
    return;
  }

  // accept the client
  ServerState.ActiveClients.add(clientId);
  console.log(`Client ${clientId} connected (socket ${socket.id})`);

  // Example packet handler
  socket.on("ServerPacket", (packet) => {
    // basic validation
    if (!packet || typeof packet.Name !== "string") {
      // ignore malformed packets
      return;
    }
    // handle other packet names here
    // e.g. if (packet.Name === "Player") { ... }
  });

  socket.on("disconnect", (reason) => {
    ServerState.ActiveClients.delete(clientId);
    console.log(`Client ${clientId} disconnected (socket ${socket.id}). Reason: ${reason}`);
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });
});

server.listen(ServerState.Port, () => {
  console.log(`Server listening on port ${ServerState.Port}`);
});
