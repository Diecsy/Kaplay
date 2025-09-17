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

Socket.on("Packet", (packet) => {
  if (!packet) return;
  console.log("Received packet:", packet);

  switch (packet.Name) {
    case "ConnectionError": {
      console.warn("ConnectionError:", packet.Error);
      if (packet.Error === "SingleTab") {
        alert("You may only have one tab open at once.");
        window.close();
      } else {
        document.body.innerHTML = `<h2>Connection error: ${String(packet.Error)}</h2>`;
      }
      break;
    }

    case "RefreshClientSprites": {
      const ClientSprites = get("Client");
      for (const Sprite of ClientSprites) {
        destroy(Sprite);
      }

      for (const OtherId of packet.Clients) {
        if (OtherId.toString() !== ClientId.toString()) {
          add([
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
              "Moving",
            ]),
            {
              CanUpDash: true,
              Dashing: false,
              DashTimer: 0,
              Facing: 1,
              Cooldowns: { DashCooldown: 0 },
            },
            OtherId,
            "Client",
          ]);
        }
      }
      break;
    }

    case "CreatePlayerSprite": {
      add([
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
          "Moving",
        ]),
        {
          CanUpDash: true,
          Dashing: false,
          DashTimer: 0,
          Facing: 1,
          Cooldowns: { DashCooldown: 0 },
        },
        packet.SpriteTag,
        "Client",
      ]);
      break;
    }

    case "DashSprite": {
      if (packet.SpriteTag !== ClientId) {
        for (const Sprite of get(packet.SpriteTag)) {
          ClientService.Dash(Sprite, packet.Type);
        }
      }
      break;
    }

    case "MoveSprite": {
      if (packet.SpriteTag !== ClientId) {
        for (const Sprite of get(packet.SpriteTag)) {
          Sprite.move(packet.Speed, 0);
        }
      }
      break;
    }

    case "JumpSprite": {
      if (packet.SpriteTag !== ClientId) {
        for (const Sprite of get(packet.SpriteTag)) {
          if (Sprite.pos) {
            Sprite.jump(packet.Force);
          }
        }
      }
      break;
    }

    case "PosSprite": {
      if (packet.SpriteTag !== ClientId) {
        for (const Sprite of get(packet.SpriteTag)) {
          if (Sprite.pos) {
            Sprite.pos = vec2(packet.X, packet.Y);
          }
        }
      }
      break;
    }
  }
});

setInterval(() => {
  if (Socket && Socket.connected) {
    Socket.emit("Packet", {
      Name: "Heartbeat",
      ClientId: ClientId,
      Time: Date.now(),
    });
  }
}, Math.round(1000 / 60));
