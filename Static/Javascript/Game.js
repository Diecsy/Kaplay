import { ClientService } from './Services/Client.js';
import { SceneService } from './Services/Scenes.js';
import { DebugService } from './Services/Debug.js';
import { LoadService } from './Services/Load.js';

let ClientId = localStorage.getItem("ClientId");
if (!ClientId) {
  ClientId = (crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem("ClientId", ClientId);
}


const Socket = io("https://kaplay.onrender.com", {
  reconnectionDelayMax: 10000,
  auth: {
    Client: {
      Name: "CustomReplicatedClient",
      ClientId: ClientId
    }
  },
});

DebugService.ErudaConsole();
LoadService.LoadKaplay();
SceneService.LoadScenes();

go("Testing");

Socket.on("connect", () => {
  console.log("Socket connected, id:", Socket.id);
});

Socket.on("connect_error", (err) => {
  console.error("Socket connect_error:", err);
});

Socket.on("ConnectionError", (errorMessage) => {
  console.warn("ConnectionError:", errorMessage);
  if (errorMessage === "SingleTab") {
    window.close();
  } else {
    document.body.innerHTML = `<h2>Connection error: ${String(errorMessage)}</h2>`;
  }
});

Socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});

setInterval(() => {
  if (Socket && Socket.connected) {
    Socket.emit("ServerPacket", { Name: "Player" });
  }
}, Math.round(1000 / 60));
