var Express = require("express");

var Application = Express();
var Path = require("path");

var HTTPs = require("http").createServer(Application);
var IO = require("socket.io")(HTTPs);

var StaticPath = Path.join(__dirname, "Static");
Application.use(Express.static(StaticPath));

const ActiveClients = new Set();
const ServerState = {};

IO.on("connection", (Socket) => {
  const ClientId = Socket.handshake.auth.ClientId;

  if (!ClientId) {
    console.log(`Client ${ClientId} disconnected`);
    Socket.disconnect(true);
    return;
  }
  console.log(`Client ${ClientId} connected`);
  ActiveClients.add(ClientId);
  Socket.on("disconnect", () => {
    ActiveClients.delete(ClientId);
    console.log(`Client ${ClientId} disconnected`);
  });
});

HTTPs.listen(3000, () => {
  console.log("port open");
});
