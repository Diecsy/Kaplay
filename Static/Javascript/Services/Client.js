import { PhysicsService } from "./Physics.js";
import { EffectService } from "./Effects.js";
const ClientService = {};

const Clients = []

ClientService.InitateClient = function () {
    const ClientId = localStorage.getItem("ClientId");

    if (!ClientId) {
        return;
    }

    const ClientInfo = {
        Socket: io("https://kaplay.onrender.com", {
            reconnectionDelayMax: 10000,
            auth: {
                Client: {
                    Name: "CustomReplicatedClient",
                    ClientId: ClientId
                }
            }
        }),

        ClientId: ClientId,
    };

    console.log(ClientInfo);

    Clients.push(ClientInfo);

    return ClientInfo;
}

ClientService.GetAllClients = function() {
    return Clients;
}

ClientService.GetClient = function(ClientId) {
    if (!ClientId) {
        return;
    }

    for (let Index = 0; Index < Clients.length; Index++) {
        if (Clients[Index] !== undefined && Clients[Index]["ClientId"] == ClientId) {
            console.log(Clients[Index]);
            return Clients[Index]
        }
    }
}

ClientService.Dash = function (Character, Type) {
    if (Character == undefined || Character["Cooldowns"] == undefined) {
        return;
    }

    if (Character.state == "Dashing" || Character.Dashing == true || Character.state == "Stunned" || Character.State == "TrueStunned" || Character.Cooldowns.DashCooldown > 0) {
        return;
    };

    if (Type === "Upwards" && !Character.isGrounded() && !Character.CanUpDash) {
        return;
    };

    if (Type === "Upwards" && !Character.isGrounded()) {
        Character.CanUpDash = false;
    };

    Character.state = "Dashing";
    Character.Dashing = true;
    Character.DashTimer = PhysicsService.Shared.DASH_TIME;
    Character.Cooldowns.DashCooldown = PhysicsService.Shared.DASH_COOLDOWN;

    if (Type === "Forwards") {
        Character.vel.y = 0;
        Character.vel.x = PhysicsService.Shared.DASH_SPEED;
    } else if (Type === "Backwards") {
        Character.vel.y = 0;
        Character.vel.x = PhysicsService.Shared.BACKDASH_SPEED;
    } else if (Type === "Upwards") {
        Character.vel.x = 0;
        Character.vel.y = PhysicsService.Shared.UPDASH_FORCE;
    };

    EffectService.SpawnAfterImage(Character);

    wait(0.05, () => EffectService.SpawnAfterImage(Character));
    wait(0.1, () => EffectService.SpawnAfterImage(Character));

    EffectService.SpawnDust(Character.pos.add(vec2(0, Character.height / 2)), {
        Count: 16,
        SpeedRange: [80, 200],
        AngleRange: Type === "Upwards" ? [80, 100] : [160, 200],
        SizeRange: [3, 6],
        LifeRange: [0.15, 0.4],
    });
};

export { ClientService };
