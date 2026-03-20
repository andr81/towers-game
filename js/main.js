// ============================================================
// main.js — Game initialization, state machine, game loop
// ============================================================

const STATES = { MENU: 'menu', PLAYING: 'playing', WON: 'won', LOST: 'lost' };

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

        // Layers and managers
        this.mapRenderer = null;
        this.gameLayer = null;
        this.effectsLayer = null;
        this.enemyManager = null;
        this.towerManager = null;
        this.projectileManager = null;
        this.path = null;
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

        // Set up path
        this.path = new Path(CONFIG.PATH_WAYPOINTS);

        // Set up map renderer
        this.mapRenderer = new MapRenderer(this.app);
        this.mapRenderer.drawMap();

        // Game layer (enemies, towers, projectiles)
        this.gameLayer = new PIXI.Container();
        this.app.stage.addChild(this.gameLayer);

        // Effects layer (AoE, etc)
        this.effectsLayer = new PIXI.Container();
        this.app.stage.addChild(this.effectsLayer);

        // Managers
        this.enemyManager = new EnemyManager(this.gameLayer);
        this.towerManager = new TowerManager(this.gameLayer);
        this.projectileManager = new ProjectileManager(this.gameLayer);

        // UI (must be last — on top)
        this.ui = new UI(this.app, this);
        this.ui.showStart();

        // Click handler for empty spots and towers
        this.app.stage.eventMode = 'static';
        this.app.stage.hitArea = new PIXI.Rectangle(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        this.app.stage.on('pointerdown', (e) => this._onStageClick(e));

        // Spot click handlers
        for (const sg of this.mapRenderer.spotGraphics) {
            sg.on('pointerdown', (e) => {
                e.stopPropagation();
                this._onSpotClick(sg.spot);
            });
        }

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

    _onStageClick(e) {
        if (this.state !== STATES.PLAYING) return;

        // Check if clicked on a tower
        const pos = e.global;
        for (const tower of this.towerManager.towers) {
            const dx = pos.x - tower.x;
            const dy = pos.y - tower.y;
            if (Math.sqrt(dx * dx + dy * dy) < 25) {
                e.stopPropagation();
                this.ui.showTowerPanel(tower);
                return;
            }
        }

        // Otherwise close panels
        this.ui.closePanels();
    }

    _onSpotClick(spot) {
        if (this.state !== STATES.PLAYING) return;
        const existingTower = this.towerManager.getTowerAtSpot(spot);
        if (existingTower) {
            this.ui.showTowerPanel(existingTower);
        } else {
            this.ui.showBuildMenu(spot);
        }
    }

    startGame() {
        this.state = STATES.PLAYING;
        this.ui.hideScreens();
        this.waveTimer = CONFIG.FIRST_WAVE_COUNTDOWN;
        this.currentWave = 0;
        this.allWavesSpawned = false;
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
        const value = this.towerManager.sell(tower);
        this.gold += value;
        this.mapRenderer.showSpot(tower.spot);
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
            this.enemyManager.spawn(entry.type, this.path, entry.hpMultiplier);

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
