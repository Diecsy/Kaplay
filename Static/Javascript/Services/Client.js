import { PhysicsService } from "./Physics.js";

const ClientService = {
    Clients: new Map(),
};

ClientService.InitiateClient = function () {
    const socket = io();

    const client = {
        Id: localStorage.getItem("ClientId"),
        Socket: socket,
    };

    this.Clients.set(client.Id, client);
    return client;
};

ClientService.GetClient = function (id) {
    return this.Clients.get(id);
};

ClientService.SendPacket = function (name, data) {
    const client = this.GetClient(localStorage.getItem("ClientId"));
    if (client && client.Socket) {
        client.Socket.emit("Packet", {
            Name: name,
            Data: data,
        });
    }
};

ClientService.HandlePacket = function (packet) {
    const { Name, Data } = packet;
    const id = Data?.SpriteTag;

    switch (Name) {
        case "MoveSprite": {
            let sprite = get(id)[0];
            if (!sprite) {
                sprite = this.SpawnRemoteSprite(id);
            }
            sprite.move(Data.Speed, 0);
            break;
        }

        case "JumpSprite": {
            let sprite = get(id)[0];
            if (!sprite) {
                sprite = this.SpawnRemoteSprite(id);
            }
            sprite.jump(Data.Force);
            break;
        }

        case "DashSprite": {
            let sprite = get(id)[0];
            if (!sprite) {
                sprite = this.SpawnRemoteSprite(id);
            }
            this.Dash(sprite, Data.Type);
            break;
        }

        case "PosSprite": {
            let sprite = get(id)[0];
            if (!sprite) {
                sprite = this.SpawnRemoteSprite(id);
            }
            sprite.pos = vec2(Data.X, Data.Y);
            break;
        }

        case "FetchClients": {
            // Server sends back all known clients
            Data.Clients.forEach((clientId) => {
                if (!get(clientId)[0]) {
                    this.SpawnRemoteSprite(clientId);
                }
            });
            break;
        }
    }
};

ClientService.SpawnRemoteSprite = function (id) {
    const sprite = add([
        sprite("bean"),
        area(),
        anchor("center"),
        pos(rand(100, 500), rand(100, 300)),
        body(),
        color(rgb(200, 200, 200)),
        { Remote: true },
        id,
    ]);
    return sprite;
};

ClientService.Dash = function (character, type) {
    character.state = "Dashing";
    character.Dashing = true;
    character.DashTimer = 0.2;

    switch (type) {
        case "Forwards":
            character.vel.x = PhysicsService.Shared.DASH_SPEED * character.Facing;
            break;
        case "Backwards":
            character.vel.x = -PhysicsService.Shared.DASH_SPEED * character.Facing;
            break;
        case "Upwards":
            if (character.CanUpDash) {
                character.vel.y = -PhysicsService.Shared.DASH_SPEED;
                character.CanUpDash = false;
            }
            break;
    }
};

export { ClientService };
