import { SceneService }} from './Scenes.js';
const LoadService = {};

LoadService.LoadAssets = function () {
    loadBean();
    SceneService.LoadScenes();
};

LoadService.LoadKaplay = function () {
    kaplay({
        crisp: true,
        canvas: document.getElementById("KaplayCanvas"),
        background: [141, 183, 255],
        debugKey: "`",
        global: true,
        letterBox: true,
        maxFPS: 60,
    });

    console.log("loaded");

    LoadService.LoadAssets();
};

export { LoadService };
