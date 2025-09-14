const Express = require("express");
const Path = require("path");
const HTTP = require("http").createServer;
const SocketIO = require("socket.io");

const Application = Express();
const Server = HTTP(Application);
const IO = SocketIO(Server);

const StaticPath = Path.join(__dirname, "Static");
Application.use(Express.static(StaticPath));

const ServerState = {
  ActiveClients: new Set(),
  ActiveMatches: new Set(),
  Port: process.env.PORT || 3000, // safer default than 80
};

IO.on("connection", (Socket) => {
  const Client = Socket.handshake.auth?.Client;
  const ClientId = Client?.ClientId;

  if (!ClientId) {
    console.log(`Client missing ClientId, disconnecting`);
    Socket.disconnect(true);
    return;
  }

  if (ServerState.ActiveClients.has(ClientId)) {
    console.log(`Duplicate ClientId ${ClientId}, rejecting connection`);
    Socket.emit("ConnectionError", "SingleTab");
    Socket.disconnect(true);
    return;
  }

  console.log(`Client ${ClientId} connected`);
  ServerState.ActiveClients.add(ClientId);

  Socket.on("ServerPacket", (Packet) => {
    if (!Packet?.Name) return;
    // Handle packet here
  });

  Socket.on("disconnect", () => {
    ServerState.ActiveClients.delete(ClientId);
    console.log(`Client ${ClientId} disconnected`);
  });
});

Server.listen(ServerState.Port, () => {
  console.log(`PORT OPENED ON: *${ServerState.Port}`);
});
