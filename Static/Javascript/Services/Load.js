const LoadService = {};

LoadService.LoadAssets = function () {
    alert('Loading');
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
