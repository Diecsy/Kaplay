import { EffectService } from './Services/Effects.js';
import { ClientService } from './Services/Client.js';
import { SceneService } from './Services/Scenes.js';
import { DebugService } from './Services/Debug.js';
import { LoadService } from './Services/Load.js';

// Ensure ClientId exists
let ClientId = localStorage.getItem("ClientId");
if (!ClientId) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    ClientId = crypto.randomUUID();
  } else {
    ClientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  localStorage.setItem("ClientId", ClientId);
}

// Initialize client + socket
const Client = ClientService.InitiateClient();
const Socket = Client.Socket;

// Debug and load game engine
DebugService.ErudaConsole();
LoadService.LoadKaplay();

// Start scene after short delay
setTimeout(() => {
  go("Testing");
}, 1500);

// --- Socket events ---

Socket.on("connect", () => {
  console.log("✅ Socket connected:", Socket.id);
});

Socket.on("connect_error", (err) => {
  console.error("❌ Socket connect_error:", err);
});

Socket.on("disconnect", (reason) => {
  console.warn("⚠️ Socket disconnected:", reason);
});

// All packets now routed through ClientService
Socket.on("Packet", (packet) => {
  if (!packet) return;
  console.log("📦 Received packet:", packet);
  ClientService.HandlePacket(packet);
});

// Heartbeat
setInterval(() => {
  if (Socket && Socket.connected) {
    ClientService.SendPacket("Heartbeat", {
      Time: Date.now(),
    });
  }
}, Math.round(1000 / 60));
