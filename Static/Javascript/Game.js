import { ClientService } from './Services/Client.js';
import { SceneService } from './Services/Scenes.js';
import { DebugService } from './Services/Debug.js';
import { LoadService } from './Services/Load.js';

let ClientId = localStorage.getItem("ClientId");
if (!ClientId) {
  ClientId = crypto.randomUUID();
  localStorage.setItem("ClientId", ClientId);
}

const Socket = io("https://kaplay.onrender.com/", {
  reconnectionDelayMax: 10000,
  auth: {
    Client: {
      Name: "CustomReplicatedClient",
      ClientId: localStorage.getItem("ClientId")
    }
  },
});

DebugService.ErudaConsole();
LoadService.LoadKaplay();
SceneService.LoadScenes();

Socket.on("ConnectionError", (ErrorMessage) => {
  if (ErrorMessage == "SingleTab") {
    alert("You already have this app open in another tab.");
    window.close();
  }
});

setInterval(() => {
    Socket.emit('ServerPacket', { Name = "Player" });
}, 1000 / 60);