import { ClientService } from './Services/Client.js';
import { DebugService } from './Services/Debug.js';
import { io } from "socket.io-client";

let ClientId = localStorage.getItem("ClientId");
if (!ClientId) {
  ClientId = crypto.randomUUID();
  localStorage.setItem("ClientId", ClientId);
}

const Socket = io("35.160.120.126:3000", {
  Auth: { ClientId }
});

kaplay({
    crisp: true,
    background: [0, 255, 0],
    canvas: document.getElementById("KaplayCanvas"),
    letterBox: true,
    maxFPS: 60,
});

Socket.on("ConnectionError", (Error) => {
  if (Error.message === "SingleTab") {
    alert("You already have this app open in another tab.");
  }
});

DebugService.ErudaConsole();