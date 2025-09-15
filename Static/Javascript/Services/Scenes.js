const SceneService = {};

const PLAYER_SPEED = 640;

SceneService.LoadScenes = function () {
    setGravity(4000);

    scene("Testing", () => {
        const bean = add([
            sprite("bean"),
            area(),
            anchor("center"),
            pos(0, 0),
            body(),
            rotate(0),
        ]);

        onKeyDown("a", () => {
            bean.move(-PLAYER_SPEED, 0);
        });

        onKeyDown("d", () => {
            bean.move(PLAYER_SPEED, 0);
        });
    });
};

export { SceneService }