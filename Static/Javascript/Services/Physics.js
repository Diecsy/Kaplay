const PhysicsService = {};

PhysicsService.Shared = {
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

export { PhysicsService }