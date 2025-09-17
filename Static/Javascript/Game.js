import { EffectService } from './Services/Effects.js';
import { ClientService } from './Services/Client.js';
import { SceneService } from './Services/Scenes.js';
import { DebugService } from './Services/Debug.js';
import { LoadService } from './Services/Load.js';

let ClientId = localStorage.getItem("ClientId");
if (!ClientId) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    ClientId = crypto.randomUUID();
  } else {
    ClientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  localStorage.setItem("ClientId", ClientId);
}

const Client = ClientService.InitateClient();
console.log(Client);
const Socket = Client.Socket;

DebugService.ErudaConsole();
LoadService.LoadKaplay();

setTimeout(() => {
  go("Testing");
}, 1500);

Socket.on("connect", () => {
  console.log("Socket connected, id:", Socket.id);
});

Socket.on("connect_error", (err) => {
  console.error("Socket connect_error:", err);
});

Socket.on("ConnectionError", (errorMessage) => {
  console.warn("ConnectionError:", errorMessage);
  if (errorMessage === "SingleTab") {
    alert("You may only have one tab open at once.")
    window.close();
  } else {
    document.body.innerHTML = `<h2>Connection error: ${String(errorMessage)}</h2>`;
  }
});

Socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});

Socket.on("ClientPacket", (Packet) => {
  if (Packet == undefined) {
    return;
  }

  console.log(Packet);
  if (Packet.Name == "RefreshClientSprites") {
    const ClientSprites = get("Client")

    for (const Sprite of ClientSprites) {
      destroy(Sprite);
    }

    for (const ClientInstance of ClientService.GetAllClients()) {
      if (ClientInstance.ClientId.toString() !== ClientId.toString()) {
        const Character = add([
          sprite("bean"),
          area(),
          anchor("center"),
          pos(120, 80),
          body(),
          color(rgb(255, 255, 255)),
          rotate(0),
          state("Idle", [
            "Idle",
            "Dashing",
            "Stunned",
            "TrueStunned",
            "Moving"
          ]),
          {
            CanUpDash: true,
            Dashing: false,
            DashTimer: 0,
            Facing: 1,
            Cooldowns: {
              DashCooldown: 0
            }
          },

          ClientInstance.toString(),
          "Client"
        ]);
      }
    }

  } else if (Packet.Name == "CreatePlayerSprite") {
    const Character = add([
      sprite("bean"),
      area(),
      anchor("center"),
      pos(120, 80),
      body(),
      color(rgb(255, 255, 255)),
      rotate(0),
      state("Idle", [
        "Idle",
        "Dashing",
        "Stunned",
        "TrueStunned",
        "Moving"
      ]),
      {
        CanUpDash: true,
        Dashing: false,
        DashTimer: 0,
        Facing: 1,
        Cooldowns: {
          DashCooldown: 0
        }
      },

      Packet.SpriteTag,
      "Client"
    ]);
  } else if (Packet.Name == "DashSprite") {
    const Sprites = get(Packet.SpriteTag);

    if (Packet.SpriteTag !== ClientId) {
      for (const Sprite of Sprites) {
        ClientService.Dash(Sprite, Packet.Type);
      }
    }
  } else if (Packet.Name == "MoveSprite") {
    const Sprites = get(Packet.SpriteTag);

    if (Packet.SpriteTag !== ClientId) {
      for (const Sprite of Sprites) {
        Sprite.move(Packet.Speed, 0);
      }
    }
  } else if (Packet.Name == "JumpSprite") {
    const Sprites = get(Packet.SpriteTag);

    if (Packet.SpriteTag !== ClientId) {
      for (const Sprite of Sprites) {
        if (Sprite.pos !== undefined) {
          Sprite.jump(Packet.Force);
        }
      }
    }
  } else if (Packet.Name == "PosSprite") {
    const Sprites = get(Packet.SpriteTag);

    if (Packet.SpriteTag !== ClientId) {
      for (const Sprite of Sprites) {
        if (Sprite.pos !== undefined) {
          Sprite.pos = vec2(Packet.x, Packet.y);
        }
      }
    }
  }
})

setInterval(() => {
  if (Socket && Socket.connected) {
    //Socket.emit("ServerPacket", { Name: "PlayerInput" });
  }
}, Math.round(1000 / 60));
