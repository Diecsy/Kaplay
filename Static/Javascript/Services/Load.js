const LoadService = {};

LoadService.LoadAssets = function () {
    loadBean();
};

LoadService.LoadKaplay = function () {
    kaplay({
        crisp: true,
        canvas: document.getElementById("KaplayCanvas"),
        background: [141, 183, 255],
        debugKey: "`",
        global: true,
        letterBox: true,
    });

    console.log("loaded");

    LoadService.LoadAssets();
};

export { LoadService };
