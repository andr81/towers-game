// ============================================================
// config.js — All game constants and balance parameters
// ============================================================

const CONFIG = {
    // Canvas
    WIDTH: 1024,
    HEIGHT: 640,
    BG_COLOR: 0x1a1a2e,

    // Starting resources
    START_GOLD: 200,
    START_LIVES: 5,

    // Wave timing
    WAVE_COUNTDOWN: 5, // seconds between waves
    FIRST_WAVE_COUNTDOWN: 5, // seconds before first wave
    TOTAL_WAVES: 10,

    // Tower sell return rate
    SELL_RATE: 0.5,

    // Upgrade cost multiplier (60% of base)
    UPGRADE_COST_MULTIPLIER: 0.6,

    // Path waypoints for zigzag (in pixels)
    PATH_WAYPOINTS: [
        { x: -30, y: 80 },
        { x: 800, y: 80 },
        { x: 800, y: 260 },
        { x: 200, y: 260 },
        { x: 200, y: 440 },
        { x: 800, y: 440 },
        { x: 900, y: 440 },
        { x: 960, y: 500 },
    ],

    // Tower placement spots
    TOWER_SPOTS: [
        { x: 400, y: 150 },
        { x: 650, y: 150 },
        { x: 700, y: 190 },
        { x: 350, y: 190 },
        { x: 500, y: 330 },
        { x: 300, y: 330 },
        { x: 600, y: 370 },
        { x: 700, y: 510 },
    ],

    // Castle position
    CASTLE: { x: 960, y: 500 },

    // Road
    ROAD_WIDTH: 40,
    ROAD_COLOR: 0x8B7355,
    ROAD_BORDER_COLOR: 0x6B5335,

    // Tower definitions
    TOWERS: {
        archer: {
            name: 'Лучники',
            cost: 55,
            range: 130,
            damage: 10,
            attackSpeed: 0.3, // seconds between shots
            canHitFlying: true,
            color: 0x2ecc71,
            projectileSpeed: 8,
            projectileColor: 0xf1c40f,
            upgrades: [
                { damage: 15, attackSpeed: 0.25, range: 140, cost: 33 },
                { damage: 22, attackSpeed: 0.2, range: 150, cost: 50 },
            ],
        },
        cannon: {
            name: 'Пушка',
            cost: 83,
            range: 110,
            damage: 60,
            attackSpeed: 1.5,
            canHitFlying: false,
            color: 0xe67e22,
            projectileSpeed: 5,
            projectileColor: 0xe74c3c,
            aoeRadius: 0, // level 1: no AoE
            upgrades: [
                { damage: 90, range: 132, cost: 50, aoeRadius: 0 },
                { damage: 130, range: 145, cost: 77, aoeRadius: 40 },
            ],
        },
        mage: {
            name: 'Маг',
            cost: 132,
            range: 160,
            damage: 25,
            attackSpeed: 0.8,
            canHitFlying: true,
            color: 0x9b59b6,
            chainTargets: 3,
            projectileColor: 0x8e44ad,
            slowFactor: 0, // level 1: no slow
            upgrades: [
                { damage: 35, chainTargets: 4, range: 170, cost: 79, slowFactor: 0 },
                { damage: 50, chainTargets: 5, range: 180, cost: 121, slowFactor: 0.4 },
            ],
        },
    },

    // Enemy definitions
    ENEMIES: {
        grunt: {
            name: 'Рядовой',
            hp: 60,
            speed: 3.0,
            gold: 10,
            flying: false,
            color: 0xe74c3c,
            size: 10,
        },
        golem: {
            name: 'Голем',
            hp: 468,
            speed: 1.3,
            gold: 35,
            flying: false,
            color: 0xd35400,
            size: 16,
        },
        wraith: {
            name: 'Призрак',
            hp: 96,
            speed: 2.2,
            gold: 20,
            flying: true,
            color: 0x7f8cff,
            size: 12,
        },
    },

    // Wave definitions
    WAVES: [
        // Wave 1: 6 grunts
        { groups: [{ type: 'grunt', count: 6, interval: 0.7 }] },
        // Wave 2: 8 grunts
        { groups: [{ type: 'grunt', count: 8, interval: 0.6 }] },
        // Wave 3: 12 grunts
        { groups: [{ type: 'grunt', count: 12, interval: 0.5 }] },
        // Wave 4: 6 grunts + 2 golems
        { groups: [
            { type: 'grunt', count: 6, interval: 0.6 },
            { type: 'golem', count: 2, interval: 1.8 },
        ]},
        // Wave 5: 5 grunts + 4 golems
        { groups: [
            { type: 'grunt', count: 5, interval: 0.5 },
            { type: 'golem', count: 4, interval: 1.5 },
        ]},
        // Wave 6: 7 grunts + 3 golems + 4 wraiths
        { groups: [
            { type: 'grunt', count: 7, interval: 0.5 },
            { type: 'golem', count: 3, interval: 1.8 },
            { type: 'wraith', count: 4, interval: 1.0 },
        ]},
        // Wave 7: 10 grunts + 3 golems + 6 wraiths
        { groups: [
            { type: 'grunt', count: 10, interval: 0.4 },
            { type: 'golem', count: 3, interval: 1.5 },
            { type: 'wraith', count: 6, interval: 0.8 },
        ]},
        // Wave 8: enhanced (hp x1.5) — 10 grunts + 4 golems + 5 wraiths
        { groups: [
            { type: 'grunt', count: 10, interval: 0.4 },
            { type: 'golem', count: 4, interval: 1.3 },
            { type: 'wraith', count: 5, interval: 0.8 },
        ], hpMultiplier: 1.5 },
        // Wave 9: enhanced — 12 grunts + 5 golems + 7 wraiths
        { groups: [
            { type: 'grunt', count: 12, interval: 0.35 },
            { type: 'golem', count: 5, interval: 1.3 },
            { type: 'wraith', count: 7, interval: 0.7 },
        ], hpMultiplier: 1.5 },
        // Wave 10: FINAL — mass attack + boss golem
        { groups: [
            { type: 'grunt', count: 18, interval: 0.3 },
            { type: 'golem', count: 6, interval: 1.0 },
            { type: 'wraith', count: 10, interval: 0.6 },
            { type: 'golem', count: 1, interval: 0, hpMultiplier: 3 }, // boss
        ], hpMultiplier: 1.8 },
    ],
};
