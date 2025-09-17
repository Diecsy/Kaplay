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
  console.log("🔌 Socket connected:", socket.id);

  const ClientInfo = socket.handshake?.auth?.Client;
  const ClientId = ClientInfo?.ClientId;

  if (!ClientId) {
    console.log(`❌ Connection rejected (missing ClientId) - socket: ${socket.id}`);
    socket.emit("Packet", { Name: "ConnectionError", Error: "MissingClientId" });
    socket.disconnect(true);
    return;
  }

  // Single-tab enforcement
  const prevSocketId = ServerState.ClientMap.get(ClientId);
  if (prevSocketId && prevSocketId !== socket.id) {
    console.log(`⚠️ Replacing previous connection for ClientId ${ClientId} (old socket ${prevSocketId})`);
    const prevSocket = IO.sockets.sockets.get(prevSocketId);
    if (prevSocket) {
      try {
        prevSocket.emit("Packet", { Name: "ConnectionError", Error: "SingleTab" });
        prevSocket.disconnect(true);
      } catch (e) {
        console.warn("Could not disconnect previous socket:", e);
      }
    }
  }

  // Save mapping
  ServerState.ClientMap.set(ClientId, socket.id);
  ServerState.SocketMap.set(socket.id, ClientId);
  socket.data.clientId = ClientId;

  console.log(`✅ Client ${ClientId} connected (socket ${socket.id})`);

  // Sync clients for everyone
  const clientsArray = Array.from(ServerState.ClientMap.keys());
  IO.emit("Packet", { Name: "RefreshClientSprites", Clients: clientsArray });

  // Handle incoming packets
  socket.on("Packet", (Packet) => {
    if (!Packet || typeof Packet.Name !== "string") return;

    switch (Packet.Name) {
      case "FetchClients": {
        const clients = Array.from(ServerState.ClientMap.keys());
        socket.emit("Packet", { Name: "FetchClientsResponse", Clients: clients });
        break;
      }

      case "MoveSprite": {
        if (typeof Packet.SpriteTag === "string" && typeof Packet.Speed === "number") {
          socket.broadcast.emit("Packet", {
            ...Packet,
            T: Date.now(),
          });
        }
        break;
      }

      case "JumpSprite": {
        if (typeof Packet.SpriteTag === "string" && typeof Packet.Force === "number") {
          socket.broadcast.emit("Packet", {
            ...Packet,
            T: Date.now(),
          });
        }
        break;
      }

      case "DashSprite": {
        if (typeof Packet.SpriteTag === "string" && typeof Packet.Type === "string") {
          socket.broadcast.emit("Packet", {
            ...Packet,
            T: Date.now(),
          });
        }
        break;
      }

      case "PosSprite": {
        if (typeof Packet.SpriteTag === "string" && typeof Packet.X === "number" && typeof Packet.Y === "number") {
          socket.broadcast.emit("Packet", {
            ...Packet,
            T: Date.now(),
          });
        }
        break;
      }

      case "Heartbeat": {
        // Optional: heartbeat tracking for latency/pings
        break;
      }

      default:
        console.log("ℹ️ Unhandled packet:", Packet);
        break;
    }
  });

  socket.on("disconnect", (reason) => {
    const storedClientId = ServerState.SocketMap.get(socket.id);
    if (storedClientId) {
      if (ServerState.ClientMap.get(storedClientId) === socket.id) {
        ServerState.ClientMap.delete(storedClientId);
      }
      ServerState.SocketMap.delete(socket.id);

      console.log(`❌ Client ${storedClientId} disconnected (socket ${socket.id}). Reason: ${reason}`);

      const clientsArray2 = Array.from(ServerState.ClientMap.keys());
      IO.emit("Packet", { Name: "ClientLeft", ClientId: storedClientId });
      IO.emit("Packet", { Name: "RefreshClientSprites", Clients: clientsArray2 });
    } else {
      console.log(`⚠️ Unknown socket disconnected: ${socket.id}. Reason: ${reason}`);
    }
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });
});

HTTPServer.listen(ServerState.Port, () => {
  console.log(`🚀 Server listening on port ${ServerState.Port}`);
});
