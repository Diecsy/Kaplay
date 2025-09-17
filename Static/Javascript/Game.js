import { LoadService } from "./Load.js";
import { SceneService } from "./Scenes.js";
import { ClientService } from "./Client.js";
import { DebugService } from "./Debug.js";
import { EffectService } from "./Effects.js";

let ClientId = localStorage.getItem("ClientId");
if (!ClientId) {
    ClientId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("ClientId", ClientId);
}

// Init client + socket
const Client = ClientService.InitateClient();
const Socket = Client.Socket;

// Debug + load Kaplay
DebugService.ErudaConsole();
LoadService.LoadKaplay();

// ✅ Register scenes BEFORE entering one
SceneService.LoadScenes();

// ✅ Enter scene AFTER scenes are registered
setTimeout(() => {
    console.log("Going to Testing scene");
    go("Testing");
}, 1500);

// Socket events...
Socket.on("connect", () => console.log("Socket connected:", Socket.id));
Socket.on("connect_error", (err) => console.error("Socket connect_error:", err));
Socket.on("disconnect", (reason) => console.log("Socket disconnected:", reason));

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
