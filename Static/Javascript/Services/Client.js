import { PhysicsService } from "./Physics.js";
import { EffectService } from "./Effects.js";

const ClientService = {
    Clients: {},
};

ClientService.InitiateClient = function () {
    const id = localStorage.getItem("ClientId");
    if (!id) throw new Error("No ClientId found!");

    if (!this.Clients[id]) {
        const socket = io();

        this.Clients[id] = {
            Id: id,
            Socket: socket,
        };

        socket.on("Packet", (packet) => {
            this.HandlePacket(packet);
        });
    }

    return this.Clients[id];
};

// Unified packet sender
ClientService.SendPacket = function (name, data = {}) {
    const id = localStorage.getItem("ClientId");
    const client = this.Clients[id];
    if (client && client.Socket && client.Socket.connected) {
        client.Socket.emit("Packet", {
            Name: name,
            SpriteTag: id,
            ...data,
        });
    }
};

// Handle packets from server
ClientService.HandlePacket = function (packet) {
    if (!packet || !packet.Name) return;

    switch (packet.Name) {
        case "RefreshClientSprites": {
            const ClientSprites = get("Client");
            for (const Sprite of ClientSprites) destroy(Sprite);

            for (const OtherId of packet.Clients || []) {
                add([
                    sprite("bean"),
                    area(),
                    anchor("center"),
                    pos(120, 80),
                    body(),
                    color(rgb(255, 255, 255)),
                    rotate(0),
                    state("Idle", ["Idle", "Dashing", "Stunned", "TrueStunned", "Moving"]),
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
                state("Idle", ["Idle", "Dashing", "Stunned", "TrueStunned", "Moving"]),
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
            if (packet.SpriteTag !== localStorage.getItem("ClientId")) {
                for (const Sprite of get(packet.SpriteTag)) {
                    this.Dash(Sprite, packet.Type);
                }
            }
            break;
        }

        case "MoveSprite": {
            if (packet.SpriteTag !== localStorage.getItem("ClientId")) {
                for (const Sprite of get(packet.SpriteTag)) {
                    Sprite.move(packet.Speed, 0);
                }
            }
            break;
        }

        case "JumpSprite": {
            if (packet.SpriteTag !== localStorage.getItem("ClientId")) {
                for (const Sprite of get(packet.SpriteTag)) {
                    if (Sprite.pos) Sprite.jump(packet.Force);
                }
            }
            break;
        }

        case "PosSprite": {
            if (packet.SpriteTag !== localStorage.getItem("ClientId")) {
                for (const Sprite of get(packet.SpriteTag)) {
                    if (Sprite.pos) {
                        Sprite.pos = vec2(packet.X, packet.Y);
                    }
                }
            }
            break;
        }

        default:
            console.warn("Unhandled packet:", packet.Name, packet);
    }
};

// Dash helper
ClientService.Dash = function (character, type) {
    if (!character) return;

    switch (type) {
        case "Forwards":
            character.move(300, 0);
            break;
        case "Backwards":
            character.move(-300, 0);
            break;
        case "Upwards":
            character.jump(500);
            break;
    }
};

export { ClientService };
