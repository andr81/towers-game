// ============================================================
// main.js — Game initialization, state machine, game loop
// ============================================================

const STATES = { MENU: 'menu', LEVEL_SELECT: 'level_select', PLAYING: 'playing', WON: 'won', LOST: 'lost' };

class Game {
    constructor() {
        this.app = null;
        this.state = STATES.MENU;
        this.gold = CONFIG.START_GOLD;
        this.lives = CONFIG.START_LIVES;
        this.currentWave = 0;
        this.waveTimer = 0;
        this.waveSpawning = false;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.allWavesSpawned = false;
        this.currentLevelId = null;

        // Layers and managers
        this.mapRenderer = null;
        this.gameLayer = null;
        this.effectsLayer = null;
        this.enemyManager = null;
        this.towerManager = null;
        this.projectileManager = null;
        this.path = null;
        this.paths = [];
        this.ui = null;
    }

    async init() {
        this.app = new PIXI.Application();
        await this.app.init({
            width: CONFIG.WIDTH,
            height: CONFIG.HEIGHT,
            backgroundColor: CONFIG.BG_COLOR,
            antialias: true,
        });
        const container = document.getElementById('game-container');
        container.appendChild(this.app.canvas);

        // Responsive scaling
        this._resize();
        window.addEventListener('resize', () => this._resize());

        // Paths will be created per level in loadLevel()
        this.path = null;
        this.paths = [];

        // Set up map renderer (don't draw yet — drawn on level load)
        this.mapRenderer = new MapRenderer(this.app);

        // Game layer (enemies, towers, projectiles)
        this.gameLayer = new PIXI.Container();
        this.app.stage.addChild(this.gameLayer);

        // Effects layer (AoE, etc)
        this.effectsLayer = new PIXI.Container();
        this.app.stage.addChild(this.effectsLayer);

        // Hide game layers until a level is loaded
        this.mapRenderer.mapLayer.visible = false;
        this.gameLayer.visible = false;
        this.effectsLayer.visible = false;

        // Managers
        this.enemyManager = new EnemyManager(this.gameLayer);
        this.towerManager = new TowerManager(this.gameLayer);
        this.projectileManager = new ProjectileManager(this.gameLayer);

        // UI (must be last — on top)
        this.ui = new UI(this.app, this);
        this.ui.showStart();

        // Make game/effects layers transparent to clicks
        this.gameLayer.eventMode = 'none';
        this.effectsLayer.eventMode = 'none';

        // Use canvas DOM click for spot/tower interaction
        this._uiClicked = false;
        this.app.canvas.addEventListener('pointerdown', (e) => {
            // Delay slightly so Pixi UI buttons fire first and set the flag
            requestAnimationFrame(() => {
                if (this._uiClicked) {
                    this._uiClicked = false;
                    return;
                }
                this._onCanvasClick(e);
            });
        });

        // Game loop
        this.app.ticker.add((ticker) => this._update(ticker.deltaTime / 60));

        // Make game globally accessible for projectile AoE
        window.game = this;
    }

    _resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const scale = Math.min(w / CONFIG.WIDTH, h / CONFIG.HEIGHT);
        const canvas = this.app.canvas;
        canvas.style.width = Math.floor(CONFIG.WIDTH * scale) + 'px';
        canvas.style.height = Math.floor(CONFIG.HEIGHT * scale) + 'px';
    }

    _onCanvasClick(e) {
        if (this.state !== STATES.PLAYING) return;

        // Convert DOM coordinates to game coordinates
        const rect = this.app.canvas.getBoundingClientRect();
        const scaleX = CONFIG.WIDTH / rect.width;
        const scaleY = CONFIG.HEIGHT / rect.height;
        const gx = (e.clientX - rect.left) * scaleX;
        const gy = (e.clientY - rect.top) * scaleY;

        // Check if clicked on a tower
        for (const tower of this.towerManager.towers) {
            const dx = gx - tower.x;
            const dy = gy - tower.y;
            if (Math.sqrt(dx * dx + dy * dy) < 28) {
                this.ui.showTowerPanel(tower);
                return;
            }
        }

        // Check if clicked on a tower spot
        for (const spot of CONFIG.TOWER_SPOTS) {
            const dx = gx - spot.x;
            const dy = gy - spot.y;
            if (Math.sqrt(dx * dx + dy * dy) < 28) {
                const existing = this.towerManager.getTowerAtSpot(spot);
                if (existing) {
                    this.ui.showTowerPanel(existing);
                } else {
                    this.ui.showBuildMenu(spot);
                }
                return;
            }
        }

        // Otherwise close panels
        this.ui.closePanels();
    }

    goToLevelSelect() {
        // Clear game entities
        this.enemyManager.clear();
        this.towerManager.clear();
        this.projectileManager.clear();
        this.ui.closePanels();

        // Hide game layers
        this.mapRenderer.mapLayer.visible = false;
        this.gameLayer.visible = false;
        this.effectsLayer.visible = false;
        this.ui.hudContainer.visible = false;

        this.state = STATES.LEVEL_SELECT;
        this.ui.hideScreens();
        this.ui.showLevelSelect();
    }

    loadLevel(levelId) {
        const level = LEVELS.find(l => l.id === levelId);
        if (!level || level.locked) return;

        // Copy level data into CONFIG
        CONFIG.TOWER_SPOTS = level.towerSpots;
        CONFIG.CASTLE = level.castle;
        CONFIG.WAVES = level.waves;
        CONFIG.TOTAL_WAVES = level.waves.length;
        CONFIG.START_GOLD = level.startGold;
        CONFIG.START_LIVES = level.startLives;
        CONFIG.WAVE_COUNTDOWN = level.waveCountdown;
        CONFIG.FIRST_WAVE_COUNTDOWN = level.firstWaveCountdown;

        // Normalize paths: support single path (pathWaypoints) or multiple (paths)
        const pathArrays = level.paths || [level.pathWaypoints];
        CONFIG.ALL_PATHS = pathArrays;
        CONFIG.PATH_WAYPOINTS = pathArrays[0];

        // Rebuild paths
        this.paths = pathArrays.map(wp => new Path(wp));
        this.path = this.paths[0];

        // Redraw map
        this.mapRenderer.drawMap();

        this.currentLevelId = levelId;
    }

    selectLevel(levelId) {
        const level = LEVELS.find(l => l.id === levelId);
        if (!level || level.locked || !Progress.isLevelUnlocked(levelId)) return;

        this.ui.hideLevelSelect();
        this.loadLevel(levelId);
        this.startGame();
    }

    startGame() {
        // Show game layers
        this.mapRenderer.mapLayer.visible = true;
        this.gameLayer.visible = true;
        this.effectsLayer.visible = true;
        this.ui.hudContainer.visible = true;

        this.state = STATES.PLAYING;
        this.ui.hideScreens();
        this.gold = CONFIG.START_GOLD;
        this.lives = CONFIG.START_LIVES;
        this.waveTimer = CONFIG.FIRST_WAVE_COUNTDOWN;
        this.currentWave = 0;
        this.allWavesSpawned = false;
        this.waveSpawning = false;
        this.spawnQueue = [];
    }

    restart() {
        // Clear everything
        this.enemyManager.clear();
        this.towerManager.clear();
        this.projectileManager.clear();
        this.ui.closePanels();

        // Show all spots again
        for (const spot of CONFIG.TOWER_SPOTS) {
            this.mapRenderer.showSpot(spot);
        }

        // Ensure game layers visible
        this.mapRenderer.mapLayer.visible = true;
        this.gameLayer.visible = true;
        this.effectsLayer.visible = true;
        this.ui.hudContainer.visible = true;

        // Reset state
        this.gold = CONFIG.START_GOLD;
        this.lives = CONFIG.START_LIVES;
        this.currentWave = 0;
        this.waveTimer = CONFIG.FIRST_WAVE_COUNTDOWN;
        this.waveSpawning = false;
        this.spawnQueue = [];
        this.allWavesSpawned = false;
        this.state = STATES.PLAYING;
        this.ui.hideScreens();
    }

    buildTower(type, spot) {
        const cost = CONFIG.TOWERS[type].cost;
        if (this.gold < cost) return;
        this.gold -= cost;
        this.towerManager.build(type, spot);
        this.mapRenderer.hideSpot(spot);
    }

    upgradeTower(tower, cost) {
        if (this.gold < cost) return;
        this.gold -= cost;
        tower.upgrade();
    }

    sellTower(tower) {
        const spot = tower.spot;
        const value = this.towerManager.sell(tower);
        this.gold += value;
        this.mapRenderer.showSpot(spot);
    }

    spawnAoeEffect(x, y, radius) {
        const g = new PIXI.Graphics();
        g.circle(0, 0, radius);
        g.fill({ color: 0xff6600, alpha: 0.3 });
        g.x = x;
        g.y = y;
        this.effectsLayer.addChild(g);

        let life = 0.3;
        const fade = (ticker) => {
            life -= ticker.deltaTime / 60;
            g.alpha = life / 0.3;
            if (life <= 0) {
                this.effectsLayer.removeChild(g);
                g.destroy();
                this.app.ticker.remove(fade);
            }
        };
        this.app.ticker.add(fade);
    }

    _startNextWave() {
        if (this.currentWave >= CONFIG.TOTAL_WAVES) {
            this.allWavesSpawned = true;
            return;
        }

        const waveDef = CONFIG.WAVES[this.currentWave];
        this.currentWave++;
        this.waveSpawning = true;
        this.spawnQueue = [];

        const globalHpMult = waveDef.hpMultiplier || 1;

        for (const group of waveDef.groups) {
            const groupHpMult = group.hpMultiplier || 1;
            for (let i = 0; i < group.count; i++) {
                this.spawnQueue.push({
                    type: group.type,
                    delay: i * group.interval,
                    hpMultiplier: globalHpMult * groupHpMult,
                });
            }
        }

        // Sort by delay so they interleave naturally
        this.spawnQueue.sort((a, b) => a.delay - b.delay);

        // Make delays relative
        let prevDelay = 0;
        for (const entry of this.spawnQueue) {
            const abs = entry.delay;
            entry.delay = abs - prevDelay;
            prevDelay = abs;
        }

        this.spawnTimer = 0;
    }

    _updateWaveSpawning(dt) {
        if (!this.waveSpawning || this.spawnQueue.length === 0) return;

        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            const entry = this.spawnQueue.shift();
            const spawnPath = this.paths[Math.floor(Math.random() * this.paths.length)];
            this.enemyManager.spawn(entry.type, spawnPath, entry.hpMultiplier);

            if (this.spawnQueue.length > 0) {
                this.spawnTimer = this.spawnQueue[0].delay;
            } else {
                this.waveSpawning = false;
                // Start countdown for next wave
                if (this.currentWave < CONFIG.TOTAL_WAVES) {
                    this.waveTimer = CONFIG.WAVE_COUNTDOWN;
                } else {
                    this.allWavesSpawned = true;
                }
            }
        }
    }

    _update(dt) {
        if (this.state !== STATES.PLAYING) return;

        // Wave countdown
        if (!this.waveSpawning && !this.allWavesSpawned && this.waveTimer > 0) {
            this.waveTimer -= dt;
            if (this.waveTimer <= 0) {
                this._startNextWave();
            }
        }

        // Spawn enemies
        this._updateWaveSpawning(dt);

        // Update enemies
        this.enemyManager.update(dt);

        // Update towers
        const aliveEnemies = this.enemyManager.getAliveEnemies();
        this.towerManager.update(dt, aliveEnemies, this.projectileManager);

        // Update projectiles
        this.projectileManager.update(dt);

        // Cleanup dead enemies, award gold
        const dead = this.enemyManager.cleanup();
        for (const enemy of dead) {
            if (enemy.reachedEnd) {
                this.lives--;
                if (this.lives <= 0) {
                    this.state = STATES.LOST;
                    this.ui.showGameOver();
                    return;
                }
            } else {
                // Killed — award gold
                this.gold += enemy.gold;
            }
        }

        // Check victory: all waves spawned and no enemies left
        if (this.allWavesSpawned && !this.waveSpawning && this.enemyManager.enemies.length === 0) {
            this.state = STATES.WON;
            Progress.completeLevel(this.currentLevelId);
            this.ui.showVictory();
            return;
        }

        // Update HUD
        const timerDisplay = (!this.waveSpawning && !this.allWavesSpawned) ? this.waveTimer : 0;
        this.ui.updateHUD(this.gold, this.lives, this.currentWave, timerDisplay);
    }
}

// ---- Bootstrap ----
(async () => {
    const game = new Game();
    await game.init();
})();
