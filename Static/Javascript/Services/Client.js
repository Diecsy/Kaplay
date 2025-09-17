const ClientService = {};

/**
 * Initialize the client and socket connection
 */
ClientService.InitateClient = function () {
    const Socket = io({
        auth: {
            Client: {
                ClientId: localStorage.getItem("ClientId"),
            },
        },
    });

    this.Socket = Socket;
    return { Socket };
};

/**
 * Helper to send packets to the server
 */
ClientService.SendPacket = function (name, data = {}) {
    if (!this.Socket || !this.Socket.connected) return;
    this.Socket.emit("Packet", { Name: name, Data: data });
};

/**
 * Spawn a remote player sprite
 */
ClientService.SpawnRemoteSprite = function (id) {
    const spriteObj = add([
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
        id,
        "Client",
    ]);
    return spriteObj;
};

/**
 * Destroy a remote sprite
 */
ClientService.DestroyRemoteSprite = function (id) {
    get(id).forEach((s) => destroy(s));
};

/**
 * Dash helper (used by remote packets too)
 */
ClientService.Dash = function (sprite, type) {
    if (!sprite) return;
    sprite.state = "Dashing";
    sprite.Dashing = true;
    sprite.DashTimer = 0.25;

    switch (type) {
        case "Forwards":
            sprite.vel.x = 800 * sprite.Facing;
            break;
        case "Backwards":
            sprite.vel.x = -800 * sprite.Facing;
            break;
        case "Upwards":
            if (sprite.CanUpDash) {
                sprite.vel.y = -800;
                sprite.CanUpDash = false;
            }
            break;
    }
};

/**
 * Handle all packets coming from the server
 */
ClientService.HandlePacket = function (packet) {
    const { Name, Clients, Data } = packet;
    const localId = localStorage.getItem("ClientId");

    switch (Name) {
        case "RefreshClientSprites": {
            // Remove all existing remote sprites
            get("Client").forEach((s) => destroy(s));

            Clients.forEach((clientId) => {
                if (clientId !== localId) {
                    this.SpawnRemoteSprite(clientId);
                }
            });
            break;
        }

        case "ClientLeft": {
            this.DestroyRemoteSprite(packet.ClientId);
            break;
        }

        case "MoveSprite": {
            if (Data.SpriteTag !== localId) {
                let sprite = get(Data.SpriteTag)[0];
                if (!sprite) sprite = this.SpawnRemoteSprite(Data.SpriteTag);
                sprite.move(Data.Speed, 0);
            }
            break;
        }

        case "JumpSprite": {
            if (Data.SpriteTag !== localId) {
                let sprite = get(Data.SpriteTag)[0];
                if (!sprite) sprite = this.SpawnRemoteSprite(Data.SpriteTag);
                sprite.jump(Data.Force);
            }
            break;
        }

        case "DashSprite": {
            if (Data.SpriteTag !== localId) {
                let sprite = get(Data.SpriteTag)[0];
                if (!sprite) sprite = this.SpawnRemoteSprite(Data.SpriteTag);
                this.Dash(sprite, Data.Type);
            }
            break;
        }

        case "PosSprite": {
            if (Data.SpriteTag !== localId) {
                let sprite = get(Data.SpriteTag)[0];
                if (!sprite) sprite = this.SpawnRemoteSprite(Data.SpriteTag);
                sprite.pos = vec2(Data.X, Data.Y);
            }
            break;
        }
    }
};

export { ClientService };
