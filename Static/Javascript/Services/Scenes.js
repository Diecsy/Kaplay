import { PhysicsService } from "./Physics.js";
import { EffectService } from "./Effects.js";
import { ClientService } from "./Client.js";

const SceneService = {};

SceneService.LoadScenes = function () {
    scene("Testing", () => {
        setGravity(1600);

        const localId = localStorage.getItem("ClientId");

        // Local character
        const Character = add([
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
            "LocalClient",
        ]);

        // Platforms
        add([rect(width(), 24), area(), outline(1), pos(0, height() - 24), body({ isStatic: true })]);
        add([rect(300, 70), area(), outline(1), pos(400, height() - 300), body({ isStatic: true })]);

        // Landing effects
        Character.onGround(() => {
            Character.CanUpDash = true;
            EffectService.SpawnDust(Character.pos.add(vec2(0, Character.height / 2)), {
                Count: 12,
                SpeedRange: [80, 180],
                AngleRange: [160, 200],
                SizeRange: [4, 8],
            });
        });

        let DustCooldown = 0;

        onUpdate(() => {
            if (Character.isGrounded() && !Character.Dashing && Character.state !== "Dashing" && (isKeyDown("a") || isKeyDown("d"))) {
                DustCooldown -= dt();
                if (DustCooldown <= 0) {
                    const dir = isKeyDown("a") ? -1 : 1;
                    EffectService.SpawnDust(Character.pos.add(vec2(0, Character.height / 2)), {
                        Count: 4,
                        SpeedRange: [40, 90],
                        AngleRange: dir > 0 ? [170, 190] : [-10, 10],
                        SizeRange: [2, 4],
                        LifeRange: [0.2, 0.35],
                    });
                    DustCooldown = 0.1;
                }
            }

            // Dash cooldown + timer
            if (Character.Cooldowns.DashCooldown > 0) {
                Character.Cooldowns.DashCooldown -= dt();
            }
            if (Character.state === "Dashing" || Character.Dashing) {
                Character.DashTimer -= dt();
                if (Character.DashTimer <= 0) {
                    Character.state = "Idle";
                    Character.Dashing = false;
                    Character.vel.x = 0;
                }
            }
        });

        // Movement
        onKeyDown("a", () => {
            if (!Character.Dashing && Character.state !== "Dashing") {
                ClientService.SendPacket("MoveSprite", {
                    SpriteTag: localId,
                    Speed: -PhysicsService.Shared.PLAYER_SPEED,
                });
                Character.move(-PhysicsService.Shared.PLAYER_SPEED, 0);
                Character.Facing = -1;
            }
        });

        onKeyDown("d", () => {
            if (!Character.Dashing && Character.state !== "Dashing") {
                ClientService.SendPacket("MoveSprite", {
                    SpriteTag: localId,
                    Speed: PhysicsService.Shared.PLAYER_SPEED,
                });
                Character.move(PhysicsService.Shared.PLAYER_SPEED, 0);
                Character.Facing = 1;
            }
        });

        // Jump
        onKeyPress("w", () => {
            if (Character.isGrounded() && !Character.Dashing && Character.state !== "Dashing") {
                Character.jump(PhysicsService.Shared.JUMP_FORCE);
                ClientService.SendPacket("JumpSprite", {
                    SpriteTag: localId,
                    Force: PhysicsService.Shared.JUMP_FORCE,
                });
            }
        });

        // Dash combos
        onKeyPress("a", () => checkDash("AA"));
        onKeyPress("d", () => checkDash("DD"));
        onKeyPress("w", () => checkDash("WW"));

        let inputBuffer = [];
        function checkDash(seq) {
            inputBuffer.push({ key: seq[0], time: time() });
            inputBuffer = inputBuffer.filter((i) => time() - i.time <= PhysicsService.Shared.INPUT_TIME);

            const bufferStr = inputBuffer.map((i) => i.key).join("");
            if (bufferStr.endsWith(seq)) {
                const dashType =
                    seq === "AA" ? "Backwards" : seq === "DD" ? "Forwards" : "Upwards";
                ClientService.SendPacket("DashSprite", { SpriteTag: localId, Type: dashType });
                ClientService.Dash(Character, dashType);
                inputBuffer = [];
            }
        }

        // Idle position sync
        Character.onUpdate(() => {
            if (Character.vel.x === 0 && Character.vel.y === 0) {
                ClientService.SendPacket("PosSprite", {
                    SpriteTag: localId,
                    X: Character.pos.x,
                    Y: Character.pos.y,
                });
            }
        });

        // Ask server for other clients
        ClientService.SendPacket("FetchClients", { Type: "CreateSprites" });
    });
};

export { SceneService };
