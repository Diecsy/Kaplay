import { PhysicsService } from "./Physics.js";
import { EffectService } from "./Effects.js";
import { ClientService } from "./Client.js";
const SceneService = {};

SceneService.LoadScenes = function () {
    scene("Testing", () => {
        setGravity(1600);

        const Client = ClientService.GetClient(localStorage.getItem("ClientId"));
        const Socket = Client.Socket;

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
            "LocalClient",
        ]);

        add([
            rect(width(), 24),
            area(),
            outline(1),
            pos(0, height() - 24),
            body({ isStatic: true }),
        ]);

        add([
            rect(300, 70),
            area(),
            outline(1),
            pos(400, height() - 300),
            body({ isStatic: true }),
        ]);

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
                    const Direction = isKeyDown("a") ? -1 : 1;

                    EffectService.SpawnDust(Character.pos.add(vec2(0, Character.height / 2)), {
                        Count: 4,
                        SpeedRange: [40, 90],
                        AngleRange: Direction > 0 ? [170, 190] : [-10, 10],
                        SizeRange: [2, 4],
                        LifeRange: [0.2, 0.35],
                    });

                    DustCooldown = 0.1;
                }
            }
        });

        onUpdate(() => {
            if (Character.Cooldowns.DashCooldown > 0) {
                Character.Cooldowns.DashCooldown -= dt();
            }

            if (Character.state == "Dashing" || Character.Dashing == true) {
                Character.DashTimer -= dt();

                if (Character.DashTimer <= 0) {
                    Character.state = "Idle";
                    Character.Dashing = false;
                    Character.vel.x = 0;
                }
            }
        });

        let InputBuffer = [];

        const SkillCombinations = {
            "WDD": () => debug.log("Sample1"),
            "SDS": () => debug.log("Sanple2"),
        };

        const DashCombinations = {
            "DD": () => ClientService.Dash(Character, "Forwards"),
            "AA": () => ClientService.Dash(Character, "Backwards"),
            "WW": () => ClientService.Dash(Character, "Upwards"),
        };

        onKeyPress((Key) => {
            InputBuffer.push({ KeyCode: Key.toUpperCase(), Time: time() });

            if (InputBuffer.length > PhysicsService.Shared.MAX_INPUT) {
                InputBuffer.shift();
            };

            InputBuffer = InputBuffer.filter(Index => time() - Index.Time <= PhysicsService.Shared.INPUT_TIME);

            const Sequence = InputBuffer.map(Index => Index.KeyCode).join("");

            if (!Character.Dashing && Character.state !== "Dashing") {
                for (const Combination in SkillCombinations) {
                    if (Sequence.endsWith(Combination)) {
                        SkillCombinations[Combination]();
                        InputBuffer = [];
                        return;
                    }
                }
            }

            for (const Combination in DashCombinations) {
                if (Sequence.endsWith(Combination)) {
                    DashCombinations[Combination]();
                    InputBuffer = [];
                    return;
                }
            }
        });

        onKeyDown("a", () => {
            if (!Character.Dashing && Character.state !== "Dashing") {
                Character.move(-PhysicsService.Shared.PLAYER_SPEED, 0);
                Character.Facing = -1;
            }
        });

        onKeyDown("d", () => {
            if (!Character.Dashing && Character.state !== "Dashing") {
                Character.move(PhysicsService.Shared.PLAYER_SPEED, 0);
                Character.Facing = 1;
            }
        });

        onKeyPress("w", () => {
            if (Character.isGrounded() && !Character.Dashing && Character.state !== "Dashing") {
                Character.jump(PhysicsService.Shared.JUMP_FORCE);
            }
        });

        setInterval(() => {
            if (Socket && Socket.connected) {
                Socket.emit("ServerPacket", { Name: "MoveSprite", SpriteTag: localStorage.getItem("ClientId").toString(), X: Character.pos.x, Y: Character.pos.y });
            }
        }, 1000 / 60);

        if (Socket && Socket.connected) {
            Socket.emit("ServerPacket", { Name: "FetchClients", Type: "CreateSprites" });
        }
    });
};

export { SceneService }