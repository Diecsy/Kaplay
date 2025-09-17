import { PhysicsService } from "./Physics.js";
import { EffectService } from "./Effects.js";
import { ClientService } from "./Client.js";

const SceneService = {};

SceneService.LoadScenes = function () {
    scene("Testing", () => {
        setGravity(1600);

        const localId = localStorage.getItem("ClientId");
        const Client = ClientService.GetClient ? ClientService.GetClient(localId) : null;
        const Socket = Client ? Client.Socket : ClientService.Socket;

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

        // Ground + platform
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

        // Dash cooldown + reset
        onUpdate(() => {
            if (Character.Cooldowns.DashCooldown > 0) Character.Cooldowns.DashCooldown -= dt();
            if (Character.state === "Dashing" || Character.Dashing) {
                Character.DashTimer -= dt();
                if (Character.DashTimer <= 0) {
                    Character.state = "Idle";
                    Character.Dashing = false;
                    Character.vel.x = 0;
                }
            }
        });

        // Buffer + combos
        let InputBuffer = [];
        const DashCombinations = {
            "DD": () => {
                ClientService.SendPacket("DashSprite", { SpriteTag: localId, Type: "Forwards" });
                ClientService.Dash(Character, "Forwards");
            },
            "AA": () => {
                ClientService.SendPacket("DashSprite", { SpriteTag: localId, Type: "Backwards" });
                ClientService.Dash(Character, "Backwards");
            },
            "WW": () => {
                ClientService.SendPacket("DashSprite", { SpriteTag: localId, Type: "Upwards" });
                ClientService.Dash(Character, "Upwards");
            },
        };

        onKeyPress((Key) => {
            InputBuffer.push({ KeyCode: Key.toUpperCase(), Time: time() });
            if (InputBuffer.length > PhysicsService.Shared.MAX_INPUT) InputBuffer.shift();
            InputBuffer = InputBuffer.filter((i) => time() - i.Time <= PhysicsService.Shared.INPUT_TIME);

            const Sequence = InputBuffer.map((i) => i.KeyCode).join("");
            for (const Combo in DashCombinations) {
                if (Sequence.endsWith(Combo)) {
                    DashCombinations[Combo]();
                    InputBuffer = [];
                    return;
                }
            }
        });

        // Movement
        onKeyDown("a", () => {
            if (!Character.Dashing) {
                ClientService.SendPacket("MoveSprite", { SpriteTag: localId, Speed: -PhysicsService.Shared.PLAYER_SPEED });
                Character.move(-PhysicsService.Shared.PLAYER_SPEED, 0);
                Character.Facing = -1;
            }
        });
        onKeyDown("d", () => {
            if (!Character.Dashing) {
                ClientService.SendPacket("MoveSprite", { SpriteTag: localId, Speed: PhysicsService.Shared.PLAYER_SPEED });
                Character.move(PhysicsService.Shared.PLAYER_SPEED, 0);
                Character.Facing = 1;
            }
        });

        // Jump
        onKeyPress("w", () => {
            if (Character.isGrounded() && !Character.Dashing) {
                Character.jump(PhysicsService.Shared.JUMP_FORCE);
                ClientService.SendPacket("JumpSprite", { SpriteTag: localId, Force: PhysicsService.Shared.JUMP_FORCE });
            }
        });

        // Position sync
        Character.onUpdate(() => {
            if (Character.vel.x === 0 && Character.vel.y === 0) {
                ClientService.SendPacket("PosSprite", { SpriteTag: localId, X: Character.pos.x, Y: Character.pos.y });
            }
        });

        // Request sync from server
        ClientService.SendPacket("FetchClients");
    });
};

export { SceneService };
