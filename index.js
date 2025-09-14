var Express = require("express");

var Application = Express();
var Path = require("path");

var HTTPs = require("http").createServer(Application);
var IO = require("socket.io")(HTTPs);

var StaticPath = Path.join(__dirname, "Static");
Application.use(Express.static(StaticPath));

const ServerState = {
  ActiveClients: new Set(),
  ActiveMatches: {},
  Port: process.env.PORT || 3000,
};

IO.on("connection", (Socket) => {
  const Client = Socket.handshake.auth.Client;
  let ClientId = Client.ClientId;

  if (!ClientId) {
    console.log(`Client ${ClientId} disconnected`);
    Socket.disconnect(true);
    return;
  } else {
    console.log(`Client ${ClientId} Connected`);
  }

  if (ServerState.ActiveClients.has(ClientId)) {
    Socket.emit("ConnectionError", "SingleTab");
    Socket.disconnect(true);
    return;
  }

  ServerState.ActiveClients.add(ClientId);

  Socket.on("ServerPacket", (Packet) => {
    if (!Packet || !Packet["Name"]) {
      return;
    };
  };

  Socket.on("disconnect", () => {
    ServerState.ActiveClients.delete(ClientId);
    console.log(`Client ${ClientId} disconnected`);
  });
});

HTTPs.listen(ServerState.Port, () => {
  console.log("PORT OPENED ON : " + ServerState.Port);
});
