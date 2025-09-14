import { ClientService } from './Services/Client.js';
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
    ClientId: localStorage.getItem("ClientId")
  },
});

Socket.on("ConnectionError", (ErrorMessage) => {
  if (ErrorMessage == "SingleTab") {
    alert("You already have this app open in another tab.");
    window.close();
  }
});

DebugService.ErudaConsole();
LoadService.LoadKaplay();