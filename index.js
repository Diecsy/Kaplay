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
  // Map ClientId -> socket.id
  ClientMap: new Map(),
  // Map socket.id -> ClientId
  SocketMap: new Map(),
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

  // If this clientId is already connected, disconnect the previous socket and replace it
  const prevSocketId = ServerState.ClientMap.get(ClientId);
  if (prevSocketId && prevSocketId !== socket.id) {
    console.log(`Replacing previous connection for ClientId ${ClientId} (old socket ${prevSocketId})`);
    const prevSocket = IO.sockets.sockets.get(prevSocketId);
    if (prevSocket) {
      try {
        prevSocket.emit("ConnectionError", "ReplacedByNewConnection");
        prevSocket.disconnect(true);
      } catch (e) {
        console.warn("Could not disconnect previous socket:", e);
      }
    }
  }

  // Save mapping
  ServerState.ClientMap.set(ClientId, socket.id);
  ServerState.SocketMap.set(socket.id, ClientId);
  socket.data.clientId = ClientId; // convenient on the socket

  console.log(`Client ${ClientId} connected (socket ${socket.id})`);

  // Tell everyone (including this socket) the current client list (array form)
  const clientsArray = Array.from(ServerState.ClientMap.keys());
  IO.emit("ClientPacket", { Name: "RefreshClientSprites", Clients: clientsArray });

  // Handle incoming packets from clients
  socket.on("ServerPacket", (Packet) => {
    if (!Packet || typeof Packet.Name !== "string") return;

    switch (Packet.Name) {
      case "FetchClients": {
        // Send back the full client list only to requester (no broadcasting required)
        const clients = Array.from(ServerState.ClientMap.keys());
        socket.emit("ClientPacket", { Name: "FetchClientsResponse", Clients: clients });
        break;
      }

      // Movement commands -> broadcast to everyone else (not the origin)
      case "MoveSprite": {
        if (typeof Packet.SpriteTag === "string" && typeof Packet.Speed === "number") {
          socket.broadcast.emit("ClientPacket", {
            Name: "MoveSprite",
            SpriteTag: Packet.SpriteTag,
            Speed: Packet.Speed,
            T: Date.now(),
          });
        }
        break;
      }

      case "JumpSprite": {
        if (typeof Packet.SpriteTag === "string" && typeof Packet.Force === "number") {
          socket.broadcast.emit("ClientPacket", {
            Name: "JumpSprite",
            SpriteTag: Packet.SpriteTag,
            Force: Packet.Force,
            T: Date.now(),
          });
        }
        break;
      }

      case "DashSprite": {
        if (typeof Packet.SpriteTag === "string" && typeof Packet.Type === "string") {
          socket.broadcast.emit("ClientPacket", {
            Name: "DashSprite",
            SpriteTag: Packet.SpriteTag,
            Type: Packet.Type,
            T: Date.now(),
          });
        }
        break;
      }

      case "PosSprite": {
        // Position broadcasting can be very spammy — keep it if you need it, but broadcast only to others
        if (typeof Packet.SpriteTag === "string" && typeof Packet.X === "number" && typeof Packet.Y === "number") {
          socket.broadcast.emit("ClientPacket", {
            Name: "PosSprite",
            SpriteTag: Packet.SpriteTag,
            X: Packet.X,
            Y: Packet.Y,
            T: Date.now(),
          });
        }
        break;
      }

      default:
        // Unknown packet name
        break;
    }
  });

  // Clean disconnect: only remove mapping if the mapping is still pointing to this socket
  socket.on("disconnect", (reason) => {
    const storedClientId = ServerState.SocketMap.get(socket.id);
    if (storedClientId) {
      // Only delete if the map still points to this socket id (prevents removing replaced connection)
      if (ServerState.ClientMap.get(storedClientId) === socket.id) {
        ServerState.ClientMap.delete(storedClientId);
      }
      ServerState.SocketMap.delete(socket.id);
      console.log(`Client ${storedClientId} disconnected (socket ${socket.id}). Reason: ${reason}`);
      // Tell everyone who left and send updated list
      const clientsArray2 = Array.from(ServerState.ClientMap.keys());
      IO.emit("ClientPacket", { Name: "ClientLeft", ClientId: storedClientId });
      IO.emit("ClientPacket", { Name: "RefreshClientSprites", Clients: clientsArray2 });
    } else {
      console.log(`Unknown socket disconnected: ${socket.id}. Reason: ${reason}`);
    }
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });
});

HTTPServer.listen(ServerState.Port, () => {
  console.log(`Server listening on port ${ServerState.Port}`);
});
