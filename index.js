const Express = require("express");
const Path = require("path");
const HTTP = require("http");
const { Server } = require("socket.io");

const Application = Express();
const HTTPServer = HTTP.createServer(Application);

const IO = new Server(Server, {
  cors: {
    origin: ["https://kaplay.onrender.com", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const StaticPath = Path.join(__dirname, "Static");
Application.use(Express.static(StaticPath));

const ServerState = {
  ActiveClients: new Set(),
  ActiveMatches: new Set(),
  Port: process.env.PORT || 3000,
};

IO.on("connection", (Socket) => {
  console.log("Socket connected:", Socket.id);

  // safe access to handshake auth
  const ClientInfo = socket.handshake?.auth?.Client;
  const ClientId = ClientInfo?.ClientId;

  if (!ClientId) {
    console.log(`Connection rejected (missing ClientId) - socket: ${Socket.id}`);
    Socket.emit("ConnectionError", "MissingClientId");
    Socket.disconnect(true);
    return;
  }

  // deny duplicate clientId (single tab)
  if (ServerState.ActiveClients.has(ClientId)) {
    console.log(`Duplicate ClientId ${ClientId} attempted connection; rejecting.`);
    socket.emit("ConnectionError", "SingleTab");
    socket.disconnect(true);
    return;
  }

  ServerState.ActiveClients.add(ClientId);
  console.log(`Client ${ClientId} connected (socket ${Socket.id})`);

  Socket.on("ServerPacket", (Packet) => {
    if (!Packet || typeof Packet.Name !== "string") {
      return;
    }
  });

  Socket.on("disconnect", (Reason) => {
    ServerState.ActiveClients.delete(ClientId);
    console.log(`Client ${ClientId} disconnected (socket ${Socket.id}). Reason: ${Reason}`);
  });

  Socket.on("error", (Error) => {
    console.error("Socket error:", Error);
  });
});

HTTPServer.listen(ServerState.Port, () => {
  console.log(`Server listening on port ${ServerState.Port}`);
});
