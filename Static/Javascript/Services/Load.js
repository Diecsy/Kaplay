const LoadService = {};

LoadService.LoadAssets = function () {
    loadBean();
    go("Testing");
};

LoadService.LoadKaplay = function () {
    kaplay({
        crisp: true,
        background: [255, 255, 255],
        canvas: document.getElementById("KaplayCanvas"),
        letterBox: true,
        maxFPS: 60,
    });

    LoadService.LoadAssets();
};

export { LoadService };
