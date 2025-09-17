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
    console.log(`Rejecting socket ${socket.id}: Missing ClientId`);
    socket.emit("Packet", { Name: "ConnectionError", Error: "MissingClientId" });
    socket.disconnect(true);
    return;
  }

  // Handle duplicate connections (replace old one)
  const prevSocketId = ServerState.ClientMap.get(ClientId);
  if (prevSocketId && prevSocketId !== socket.id) {
    console.log(`Replacing connection for ClientId ${ClientId} (old socket ${prevSocketId})`);
    const prevSocket = IO.sockets.sockets.get(prevSocketId);
    if (prevSocket) {
      try {
        prevSocket.emit("Packet", { Name: "ConnectionError", Error: "ReplacedByNewConnection" });
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

  console.log(`Client ${ClientId} connected.`);

  // Send full client list to everyone
  const clientsArray = Array.from(ServerState.ClientMap.keys());
  IO.emit("Packet", { Name: "RefreshClientSprites", Clients: clientsArray });

  // Handle incoming packets
  socket.on("Packet", (Packet) => {
    if (!Packet || typeof Packet.Name !== "string") return;
    const { Name, Data } = Packet;

    switch (Name) {
        case "MoveSprite":
            socket.broadcast.emit("Packet", { Name: "MoveSprite", Data });
            break;
        case "JumpSprite":
            socket.broadcast.emit("Packet", { Name: "JumpSprite", Data });
            break;
        case "DashSprite":
            socket.broadcast.emit("Packet", { Name: "DashSprite", Data });
            break;
        case "PosSprite":
            socket.broadcast.emit("Packet", { Name: "PosSprite", Data });
            break;
    }
});


  // Handle disconnect
  socket.on("disconnect", (reason) => {
    const storedClientId = ServerState.SocketMap.get(socket.id);
    if (storedClientId) {
      if (ServerState.ClientMap.get(storedClientId) === socket.id) {
        ServerState.ClientMap.delete(storedClientId);
      }
      ServerState.SocketMap.delete(socket.id);

      console.log(`Client ${storedClientId} disconnected. Reason: ${reason}`);

      // Tell everyone the client left
      IO.emit("Packet", { Name: "ClientLeft", ClientId: storedClientId });

      // Send updated list
      const clientsArray2 = Array.from(ServerState.ClientMap.keys());
      IO.emit("Packet", { Name: "RefreshClientSprites", Clients: clientsArray2 });
    }
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });
});

HTTPServer.listen(ServerState.Port, () => {
  console.log(`Server listening on port ${ServerState.Port}`);
});
