var Application = require("express")();
var Express = require("express");
var Path = require("path");

var HTTPs = require("http").createServer(Application);
var IO = require("socket.io")(HTTPs);

var StaticPath = Path.join(__dirname, "Static");
Application.use(Express.static(StaticPath));

const ServerState = {
    Clients: {},
};

IO.on("connection", (Socket) => {
    Socket.on("disconnect", () => {
        delete ServerState.Clients[Socket.id];
    });
});

HTTPs.listen(3000, () => {
    console.log("port open");
});