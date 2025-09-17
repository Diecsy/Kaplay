const Express = require("express");
const Path = require("path");
const HTTP = require("http");
const { Server } = require("socket.io");

const Application = Express();
const HTTPServer = HTTP.createServer(Application);

const IO = new Server(HTTPServer, {
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

IO.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  const ClientInfo = socket.handshake?.auth?.Client;
  const ClientId = ClientInfo?.ClientId;

  if (!ClientId) {
    console.log(`Connection rejected (missing ClientId) - socket: ${socket.id}`);
    socket.emit("ConnectionError", "MissingClientId");
    socket.disconnect(true);
    return;
  }

  if (ServerState.ActiveClients.has(ClientId)) {
    console.log(`Duplicate ClientId ${ClientId} attempted connection; rejecting.`);
    socket.emit("ConnectionError", "SingleTab");
    socket.disconnect(true);
    return;
  }

  ServerState.ActiveClients.add(ClientId);
  console.log(`Client ${ClientId} connected (socket ${socket.id})`);

  // Refresh all of the client's to add a new sprite, etc

  IO.emit("ClientPacket", { Name: "RefreshClientSprites", Clients: ServerState.ActiveClients });
  
  socket.on("ServerPacket", (Packet) => {
    if (!Packet || typeof Packet.Name !== "string" || Packet == undefined || Packet["Name"] == undefined) {
      return;
    };

    // Packet info yeah

    if (Packet.Name == "FetchClients") {
      // Fetchs all clients and creates a sprite accordinglly as long as they aren't the local client

      for (const Client of ServerState.ActiveClients) {
        if (Client !== ClientId) {
          IO.emit("ClientPacket", { Name: "CreatePlayerSprite", SpriteTag: Client });
        }
      }
    } else if (Packet.Name == "MoveSprite") {
      // Moves a specific sprite between the whole server

      if (Packet.Type !== undefined) {
        IO.emit("ClientPacket", { Name: "MoveSprite", SpriteTag: Packet.SpriteTag, X: Packet.X, Y: Packet.Y });
      }
    }
  });

  socket.on("disconnect", (Reason) => {
    ServerState.ActiveClients.delete(ClientId);
    console.log(`Client ${ClientId} disconnected (socket ${socket.id}). Reason: ${Reason}`);
    IO.emit("ClientPacket", { Name: "RefreshClientSprites" });
  });

  socket.on("error", (Error) => {
    console.error("Socket error:", Error);
  });
});

HTTPServer.listen(ServerState.Port, () => {
  console.log(`Server listening on port ${ServerState.Port}`);
});
