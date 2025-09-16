const EffectService = {};

EffectService.SpawnAfterImage = function (Object) {
    if (Object == undefined || Object["pos"] == undefined || Object["sprite"] == undefined) {
        return;
    };

    let SpriteName = Object["sprite"]

    add([
        sprite(SpriteName),
        pos(Object["pos"]),
        anchor("center"),
        opacity(0.6),
        scale(1),
        lifespan(0.15, { fade: 0.15 }),
        color(255, 255, 255),
    ]);
}

EffectService.SpawnDust = function (Position, Parameters = {}) {
    if (Parameters == undefined) {
        return;
    };

    const Count = Parameters.Count ?? 6;
    const SizeRange = Parameters.SizeRange ?? [3, 6];
    const SpeedRange = Parameters.SpeedRange ?? [60, 140];
    const AngleRange = Parameters.AngleRange ?? [0, 360];
    const LifeRange = Parameters.LifeRange ?? [0.3, 0.5];

    for (let Index = 0; Index < Count; Index++) {
        const Angle = rand(AngleRange[0], AngleRange[1]);
        const Speed = rand(SpeedRange[0], SpeedRange[1]);
        const Life = rand(LifeRange[0], LifeRange[1]);

        add([
            pos(Position),
            circle(rand(SizeRange[0], SizeRange[1])),
            color(rgb(255, 255, 255)),
            opacity(0.9),
            anchor("center"),
            lifespan(Life, { fade: Life }),
            move(Angle, Speed),
            scale(rand(0.6, 1.0)),
        ]);
    }
}

export { EffectService };