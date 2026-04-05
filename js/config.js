// ============================================================
// config.js — All game constants and balance parameters
// ============================================================

// ---- Progress (localStorage) ----
const Progress = {
    _key: 'chaos_castle_progress',
    load() {
        try {
            const data = JSON.parse(localStorage.getItem(this._key));
            return data && data.completedLevels ? data : { completedLevels: [] };
        } catch { return { completedLevels: [] }; }
    },
    save(data) {
        localStorage.setItem(this._key, JSON.stringify(data));
    },
    isLevelUnlocked(levelId) {
        if (levelId === 1) return true;
        return this.load().completedLevels.includes(levelId - 1);
    },
    completeLevel(levelId) {
        const data = this.load();
        if (!data.completedLevels.includes(levelId)) {
            data.completedLevels.push(levelId);
            this.save(data);
        }
    },
    isLevelCompleted(levelId) {
        return this.load().completedLevels.includes(levelId);
    },
};

const CONFIG = {
    // Canvas (portrait orientation for mobile)
    WIDTH: 400,
    HEIGHT: 800,
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

    // Path waypoints for vertical zigzag (top to bottom)
    PATH_WAYPOINTS: [
        { x: 200, y: -20 },
        { x: 200, y: 90 },
        { x: 350, y: 90 },
        { x: 350, y: 250 },
        { x: 50, y: 250 },
        { x: 50, y: 410 },
        { x: 350, y: 410 },
        { x: 350, y: 570 },
        { x: 50, y: 570 },
        { x: 50, y: 670 },
        { x: 200, y: 730 },
    ],

    // Tower placement spots
    TOWER_SPOTS: [
        { x: 280, y: 55 },
        { x: 120, y: 160 },
        { x: 200, y: 170 },
        { x: 200, y: 330 },
        { x: 280, y: 325 },
        { x: 120, y: 480 },
        { x: 200, y: 490 },
        { x: 280, y: 630 },
    ],

    // Castle position
    CASTLE: { x: 200, y: 730 },

    // Road
    ROAD_WIDTH: 32,
    ROAD_COLOR: 0x8B7355,
    ROAD_BORDER_COLOR: 0x6B5335,

    // Tower definitions
    TOWERS: {
        archer: {
            name: 'Пиу-пиу',
            cost: 55,
            range: 95,
            damage: 10,
            attackSpeed: 0.3, // seconds between shots
            canHitFlying: true,
            color: 0x2ecc71,
            projectileSpeed: 8,
            projectileColor: 0xf1c40f,
            upgrades: [
                { damage: 15, attackSpeed: 0.25, range: 105, cost: 33 },
                { damage: 22, attackSpeed: 0.16, range: 138, cost: 50, multishot: 2 },
            ],
        },
        cannon: {
            name: 'Бабах',
            cost: 83,
            range: 110,
            damage: 66,
            attackSpeed: 1.5,
            canHitFlying: false,
            color: 0xe67e22,
            projectileSpeed: 5,
            projectileColor: 0xe74c3c,
            aoeRadius: 0, // level 1: no AoE
            upgrades: [
                { damage: 99, range: 125, cost: 50, aoeRadius: 0 },
                { damage: 172, range: 140, cost: 77, aoeRadius: 35 },
            ],
        },
        mage: {
            name: 'Вжух',
            cost: 132,
            range: 120,
            damage: 25,
            attackSpeed: 0.72,
            canHitFlying: true,
            color: 0x9b59b6,
            chainTargets: 3,
            projectileColor: 0x8e44ad,
            slowFactor: 0, // level 1: no slow
            upgrades: [
                { damage: 35, chainTargets: 4, range: 130, cost: 91, attackSpeed: 0.72, slowFactor: 0 },
                { damage: 50, chainTargets: 5, range: 140, cost: 139, slowFactor: 0.55 },
            ],
        },
    },

    // Enemy definitions
    ENEMIES: {
        grunt: {
            name: 'Торопыга',
            hp: 60,
            speed: 3.0,
            gold: 10,
            flying: false,
            color: 0xe74c3c,
            size: 10,
        },
        golem: {
            name: 'Шкаф',
            hp: 468,
            speed: 1.3,
            gold: 35,
            flying: false,
            color: 0xd35400,
            size: 16,
        },
        wraith: {
            name: 'Летун',
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

// ---- Level definitions ----
const LEVELS = [
    {
        id: 1,
        name: 'Первый рубеж',
        mapX: 200, mapY: 620,
        startGold: 200,
        startLives: 5,
        waveCountdown: 5,
        firstWaveCountdown: 5,
        castle: { x: 200, y: 730 },
        pathWaypoints: [
            { x: 200, y: -20 },
            { x: 200, y: 90 },
            { x: 350, y: 90 },
            { x: 350, y: 250 },
            { x: 50, y: 250 },
            { x: 50, y: 410 },
            { x: 350, y: 410 },
            { x: 350, y: 570 },
            { x: 50, y: 570 },
            { x: 50, y: 670 },
            { x: 200, y: 730 },
        ],
        towerSpots: [
            { x: 280, y: 55 },
            { x: 120, y: 160 },
            { x: 200, y: 170 },
            { x: 200, y: 330 },
            { x: 280, y: 325 },
            { x: 120, y: 480 },
            { x: 200, y: 490 },
            { x: 280, y: 630 },
        ],
        waves: [
            { groups: [{ type: 'grunt', count: 6, interval: 0.7 }] },
            { groups: [{ type: 'grunt', count: 8, interval: 0.6 }] },
            { groups: [{ type: 'grunt', count: 12, interval: 0.5 }] },
            { groups: [
                { type: 'grunt', count: 6, interval: 0.6 },
                { type: 'golem', count: 2, interval: 1.8 },
            ]},
            { groups: [
                { type: 'grunt', count: 5, interval: 0.5 },
                { type: 'golem', count: 4, interval: 1.5 },
            ]},
            { groups: [
                { type: 'grunt', count: 7, interval: 0.5 },
                { type: 'golem', count: 3, interval: 1.8 },
                { type: 'wraith', count: 4, interval: 1.0 },
            ]},
            { groups: [
                { type: 'grunt', count: 10, interval: 0.4 },
                { type: 'golem', count: 3, interval: 1.5 },
                { type: 'wraith', count: 6, interval: 0.8 },
            ]},
            { groups: [
                { type: 'grunt', count: 10, interval: 0.4 },
                { type: 'golem', count: 4, interval: 1.3 },
                { type: 'wraith', count: 5, interval: 0.8 },
            ], hpMultiplier: 1.5 },
            { groups: [
                { type: 'grunt', count: 12, interval: 0.35 },
                { type: 'golem', count: 5, interval: 1.3 },
                { type: 'wraith', count: 7, interval: 0.7 },
            ], hpMultiplier: 1.5 },
            { groups: [
                { type: 'grunt', count: 18, interval: 0.3 },
                { type: 'golem', count: 6, interval: 1.0 },
                { type: 'wraith', count: 10, interval: 0.6 },
                { type: 'golem', count: 1, interval: 0, hpMultiplier: 3 },
            ], hpMultiplier: 1.8 },
        ],
    },
    {
        id: 2,
        name: 'Тёмный лес',
        mapX: 100, mapY: 500,
        startGold: 360,
        startLives: 4,
        waveCountdown: 5,
        firstWaveCountdown: 5,
        castle: { x: 200, y: 730 },
        paths: [
            // Left branch
            [
                { x: 200, y: -20 },
                { x: 200, y: 100 },
                { x: 70, y: 150 },
                { x: 70, y: 350 },
                { x: 140, y: 450 },
                { x: 70, y: 550 },
                { x: 200, y: 660 },
                { x: 200, y: 730 },
            ],
            // Right branch
            [
                { x: 200, y: -20 },
                { x: 200, y: 100 },
                { x: 330, y: 150 },
                { x: 330, y: 350 },
                { x: 260, y: 450 },
                { x: 330, y: 550 },
                { x: 200, y: 660 },
                { x: 200, y: 730 },
            ],
        ],
        towerSpots: [
            // Top — shared entry
            { x: 120, y: 55 },
            { x: 280, y: 55 },
            // Center top — at the fork, covers both paths
            { x: 200, y: 130 },
            // Left branch (upper moved closer to path)
            { x: 130, y: 230 },
            { x: 155, y: 400 },
            { x: 155, y: 520 },
            // Right branch (upper moved closer to path)
            { x: 270, y: 230 },
            { x: 245, y: 400 },
            { x: 245, y: 520 },
            // Center bottom — between paths at the bend, covers both
            { x: 200, y: 440 },
            // Bottom — convergence
            { x: 120, y: 640 },
            { x: 280, y: 640 },
        ],
        waves: [
            // Wave 1: 5 grunts
            { groups: [{ type: 'grunt', count: 5, interval: 0.7 }] },
            // Wave 2: 7 grunts
            { groups: [{ type: 'grunt', count: 7, interval: 0.6 }] },
            // Wave 3: 5 grunts + 2 golems
            { groups: [
                { type: 'grunt', count: 5, interval: 0.6 },
                { type: 'golem', count: 2, interval: 1.8 },
            ]},
            // Wave 4: 6 grunts + 3 golems
            { groups: [
                { type: 'grunt', count: 6, interval: 0.5 },
                { type: 'golem', count: 3, interval: 1.5 },
            ]},
            // Wave 5: 9 grunts + 3 golems + 4 wraiths
            { groups: [
                { type: 'grunt', count: 9, interval: 0.4 },
                { type: 'golem', count: 3, interval: 1.5 },
                { type: 'wraith', count: 4, interval: 0.8 },
            ]},
            // Wave 6: hp x1.3 — 6 grunts + 4 golems + 4 wraiths
            { groups: [
                { type: 'grunt', count: 6, interval: 0.4 },
                { type: 'golem', count: 4, interval: 1.2 },
                { type: 'wraith', count: 4, interval: 0.7 },
            ], hpMultiplier: 1.3 },
            // Wave 7: hp x1.5 — 10 grunts + 4 golems + 6 wraiths
            { groups: [
                { type: 'grunt', count: 10, interval: 0.35 },
                { type: 'golem', count: 4, interval: 1.0 },
                { type: 'wraith', count: 6, interval: 0.6 },
            ], hpMultiplier: 1.5 },
            // Wave 8: FINAL — hp x2.0, boss golem x3
            { groups: [
                { type: 'grunt', count: 13, interval: 0.3 },
                { type: 'golem', count: 3, interval: 1.0 },
                { type: 'wraith', count: 6, interval: 0.5 },
                { type: 'golem', count: 1, interval: 0, hpMultiplier: 3 },
            ], hpMultiplier: 2.0 },
        ],
    },
    {
        id: 3,
        name: 'Мост отчаяния',
        mapX: 300, mapY: 400,
        startGold: 280,
        startLives: 3,
        waveCountdown: 3,
        firstWaveCountdown: 4,
        castle: { x: 200, y: 750 },
        pathWaypoints: [
            { x: 200, y: -20 },
            { x: 200, y: 750 },
        ],
        towerSpots: [
            // Left side of the bridge
            { x: 120, y: 80 },
            { x: 120, y: 200 },
            { x: 120, y: 330 },
            { x: 120, y: 460 },
            { x: 120, y: 590 },
            { x: 120, y: 700 },
            // Right side of the bridge
            { x: 280, y: 80 },
            { x: 280, y: 200 },
            { x: 280, y: 330 },
            { x: 280, y: 460 },
            { x: 280, y: 590 },
            { x: 280, y: 700 },
        ],
        waves: [
            // Wave 1: light rush
            { groups: [{ type: 'grunt', count: 10, interval: 0.4 }] },
            // Wave 2: more grunts
            { groups: [{ type: 'grunt', count: 14, interval: 0.35 }] },
            // Wave 3: grunts + wraiths rush
            { groups: [
                { type: 'grunt', count: 10, interval: 0.35 },
                { type: 'wraith', count: 5, interval: 0.6 },
            ]},
            // Wave 4: first golems — slow wall
            { groups: [
                { type: 'golem', count: 4, interval: 1.2 },
                { type: 'grunt', count: 8, interval: 0.3 },
            ]},
            // Wave 5: wraith swarm
            { groups: [
                { type: 'wraith', count: 12, interval: 0.4 },
            ]},
            // Wave 6: mixed rush
            { groups: [
                { type: 'grunt', count: 12, interval: 0.25 },
                { type: 'golem', count: 3, interval: 1.5 },
                { type: 'wraith', count: 6, interval: 0.5 },
            ]},
            // Wave 7: golem wall + grunt flood
            { groups: [
                { type: 'golem', count: 6, interval: 0.8 },
                { type: 'grunt', count: 15, interval: 0.2 },
            ], hpMultiplier: 1.2 },
            // Wave 8: flying assault
            { groups: [
                { type: 'wraith', count: 14, interval: 0.35 },
                { type: 'grunt', count: 8, interval: 0.3 },
            ], hpMultiplier: 1.3 },
            // Wave 9: heavy mixed
            { groups: [
                { type: 'grunt', count: 16, interval: 0.2 },
                { type: 'golem', count: 5, interval: 1.0 },
                { type: 'wraith', count: 8, interval: 0.4 },
            ], hpMultiplier: 1.4 },
            // Wave 10: double rush
            { groups: [
                { type: 'grunt', count: 20, interval: 0.15 },
                { type: 'wraith', count: 10, interval: 0.3 },
            ], hpMultiplier: 1.5 },
            // Wave 11: golem stampede
            { groups: [
                { type: 'golem', count: 10, interval: 0.6 },
                { type: 'grunt', count: 12, interval: 0.2 },
                { type: 'wraith', count: 8, interval: 0.4 },
            ], hpMultiplier: 1.7 },
            // Wave 12: FINAL — everything at once
            { groups: [
                { type: 'grunt', count: 25, interval: 0.12 },
                { type: 'golem', count: 8, interval: 0.7 },
                { type: 'wraith', count: 12, interval: 0.3 },
                { type: 'golem', count: 2, interval: 0, hpMultiplier: 3 },
            ], hpMultiplier: 2.0 },
        ],
    },
    { id: 4, name: 'Пустошь',       mapX: 100, mapY: 290, locked: true },
    { id: 5, name: 'Логово босса',  mapX: 300, mapY: 180, locked: true },
    { id: 6, name: '???',           mapX: 200, mapY: 80,  locked: true },
];
