import { EffectService } from "./Effects";
const ClientService = {};

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
    Character.DashTimer = ClientService.Shared.DASH_TIME;
    Character.Cooldowns.DashCooldown = DASH_COOLDOWN;

    if (Type === "Forwards") {
        Character.vel.y = 0;
        Character.vel.x = ClientService.Shared.DASH_SPEED;
    } else if (Type === "Backwards") {
        Character.vel.y = 0;
        Character.vel.x = ClientService.Shared.BACKDASH_SPEED;
    } else if (Type === "Upwards") {
        Character.vel.x = 0;
        Character.vel.y = ClientService.Shared.UPDASH_FORCE;
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

ClientService.Shared = {
    PLAYER_SPEED: 640,
    JUMP_FORCE: 700,

    DASH_SPEED: 1400,
    DASH_TIME: 0.15,
    BACKDASH_SPEED: -1000,
    UPDASH_FORCE: -1000,
    DASH_COOLDOWN: 0.25,

    MAX_INPUT: 10,
    INPUT_TIME: 0.4,
};

export { ClientService };
