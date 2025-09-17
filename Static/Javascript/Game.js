import { EffectService } from "./Effects.js";
import { ClientService } from "./Client.js";
import { SceneService } from "./Scenes.js";
import { DebugService } from "./Debug.js";
import { LoadService } from "./Load.js";

// Ensure clientId
let ClientId = localStorage.getItem("ClientId");
if (!ClientId) {
    ClientId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("ClientId", ClientId);
}

// Init client + socket
const Client = ClientService.InitateClient();
const Socket = Client.Socket;

// Debug + load kaplay
DebugService.ErudaConsole();
LoadService.LoadKaplay();

// Enter scene
setTimeout(() => {
    go("Testing");
}, 1500);

// Connection events
Socket.on("connect", () => console.log("Socket connected:", Socket.id));
Socket.on("connect_error", (err) => console.error("Socket connect_error:", err));
Socket.on("disconnect", (reason) => console.log("Socket disconnected:", reason));

// Handle packets
Socket.on("Packet", (packet) => {
    if (!packet) return;
    ClientService.HandlePacket(packet);
});

// Heartbeat
setInterval(() => {
    if (Socket && Socket.connected) {
        ClientService.SendPacket("Heartbeat", { ClientId, Time: Date.now() });
    }
}, Math.round(1000 / 60));
