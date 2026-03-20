// ============================================================
// ui.js — HUD, build menu, tower info panel, game screens
// ============================================================

class UI {
    constructor(app, game) {
        this.app = app;
        this.game = game;
        this.uiLayer = new PIXI.Container();
        app.stage.addChild(this.uiLayer);

        this.selectedSpot = null;
        this.selectedTower = null;

        this._buildHUD();
        this._buildBuildMenu();
        this._buildTowerPanel();
        this._buildScreens();
    }

    // ---- HUD ----
    _buildHUD() {
        this.hudContainer = new PIXI.Container();
        this.uiLayer.addChild(this.hudContainer);

        // Background bar
        const bar = new PIXI.Graphics();
        bar.rect(0, 0, CONFIG.WIDTH, 36);
        bar.fill({ color: 0x0a0a1a, alpha: 0.85 });
        bar.rect(0, 36, CONFIG.WIDTH, 1);
        bar.fill({ color: 0x333366, alpha: 0.5 });
        this.hudContainer.addChild(bar);

        // Gold
        this.goldText = new PIXI.Text({
            text: '💰 200',
            style: { fontFamily: 'monospace', fontSize: 14, fill: 0xf1c40f, fontWeight: 'bold' },
        });
        this.goldText.x = 8;
        this.goldText.y = 8;
        this.hudContainer.addChild(this.goldText);

        // Lives
        this.livesText = new PIXI.Text({
            text: '❤️ 5',
            style: { fontFamily: 'monospace', fontSize: 14, fill: 0xe74c3c, fontWeight: 'bold' },
        });
        this.livesText.x = 120;
        this.livesText.y = 8;
        this.hudContainer.addChild(this.livesText);

        // Wave
        this.waveText = new PIXI.Text({
            text: '0/10',
            style: { fontFamily: 'monospace', fontSize: 14, fill: 0xcccccc },
        });
        this.waveText.x = 210;
        this.waveText.y = 8;
        this.hudContainer.addChild(this.waveText);

        // Timer
        this.timerText = new PIXI.Text({
            text: '',
            style: { fontFamily: 'monospace', fontSize: 13, fill: 0xaaaaff },
        });
        this.timerText.x = 300;
        this.timerText.y = 9;
        this.hudContainer.addChild(this.timerText);
    }

    updateHUD(gold, lives, wave, timer) {
        this.goldText.text = `💰 ${gold}`;
        this.livesText.text = `❤️ ${lives}`;
        this.waveText.text = `${wave}/${CONFIG.TOTAL_WAVES}`;
        if (timer > 0) {
            this.timerText.text = `⏱${Math.ceil(timer)}с`;
        } else {
            this.timerText.text = '';
        }
    }

    // ---- Build Menu ----
    _buildBuildMenu() {
        this.buildMenu = new PIXI.Container();
        this.buildMenu.visible = false;
        this.uiLayer.addChild(this.buildMenu);

        // Background panel
        this.buildMenuBg = new PIXI.Graphics();
        this.buildMenu.addChild(this.buildMenuBg);

        const types = ['archer', 'cannon', 'mage'];
        this.buildButtons = [];

        types.forEach((type, i) => {
            const def = CONFIG.TOWERS[type];
            const btn = new PIXI.Container();
            btn.x = i * 78;
            btn.y = 0;

            // Button background
            const bg = new PIXI.Graphics();
            bg.roundRect(0, 0, 70, 62, 6);
            bg.fill({ color: 0x1a1a2e, alpha: 0.95 });
            bg.roundRect(0, 0, 70, 62, 6);
            bg.stroke({ width: 2, color: def.color, alpha: 0.6 });
            btn.addChild(bg);

            // Tower icon
            const icon = new PIXI.Graphics();
            icon.circle(35, 18, 10);
            icon.fill(def.color);
            btn.addChild(icon);

            // Name
            const nameText = new PIXI.Text({
                text: def.name,
                style: { fontFamily: 'monospace', fontSize: 10, fill: 0xcccccc },
            });
            nameText.x = 35 - nameText.width / 2;
            nameText.y = 32;
            btn.addChild(nameText);

            // Cost
            const costText = new PIXI.Text({
                text: `💰${def.cost}`,
                style: { fontFamily: 'monospace', fontSize: 11, fill: 0xf1c40f, fontWeight: 'bold' },
            });
            costText.x = 35 - costText.width / 2;
            costText.y = 46;
            btn.addChild(costText);

            btn.eventMode = 'static';
            btn.cursor = 'pointer';
            btn.hitArea = new PIXI.Rectangle(0, 0, 70, 62);
            btn.towerType = type;
            btn.bgGraphics = bg;

            btn.on('pointerdown', () => this._onBuildClick(type));

            this.buildMenu.addChild(btn);
            this.buildButtons.push(btn);
        });

        // Panel background
        this.buildMenuBg.roundRect(-10, -10, 254, 82, 8);
        this.buildMenuBg.fill({ color: 0x0a0a1a, alpha: 0.9 });
        this.buildMenuBg.roundRect(-10, -10, 254, 82, 8);
        this.buildMenuBg.stroke({ width: 1, color: 0x333366, alpha: 0.5 });
    }

    showBuildMenu(spot) {
        this.closePanels();
        this.selectedSpot = spot;

        // Position menu near spot
        let menuX = spot.x - 117;
        let menuY = spot.y + 30;
        if (menuY + 82 > CONFIG.HEIGHT) menuY = spot.y - 92;
        if (menuX < 10) menuX = 10;
        if (menuX + 254 > CONFIG.WIDTH) menuX = CONFIG.WIDTH - 264;

        this.buildMenu.x = menuX;
        this.buildMenu.y = menuY;

        // Update button states based on gold
        for (const btn of this.buildButtons) {
            const cost = CONFIG.TOWERS[btn.towerType].cost;
            const canAfford = this.game.gold >= cost;
            btn.alpha = canAfford ? 1 : 0.4;
            btn.eventMode = canAfford ? 'static' : 'none';
        }

        this.buildMenu.visible = true;
    }

    _onBuildClick(type) {
        if (!this.selectedSpot) return;
        const cost = CONFIG.TOWERS[type].cost;
        if (this.game.gold < cost) return;

        this.game.buildTower(type, this.selectedSpot);
        this.closePanels();
    }

    // ---- Tower Info Panel ----
    _buildTowerPanel() {
        this.towerPanel = new PIXI.Container();
        this.towerPanel.visible = false;
        this.uiLayer.addChild(this.towerPanel);

        // Background
        this.towerPanelBg = new PIXI.Graphics();
        this.towerPanel.addChild(this.towerPanelBg);

        // Tower name
        this.towerNameText = new PIXI.Text({
            text: '',
            style: { fontFamily: 'monospace', fontSize: 14, fill: 0xffffff, fontWeight: 'bold' },
        });
        this.towerNameText.x = 0;
        this.towerNameText.y = 0;
        this.towerPanel.addChild(this.towerNameText);

        // Stats
        this.towerStatsText = new PIXI.Text({
            text: '',
            style: { fontFamily: 'monospace', fontSize: 11, fill: 0xaaaaaa },
        });
        this.towerStatsText.x = 0;
        this.towerStatsText.y = 20;
        this.towerPanel.addChild(this.towerStatsText);

        // Upgrade button
        this.upgradeBtn = new PIXI.Container();
        const upgBg = new PIXI.Graphics();
        upgBg.roundRect(0, 0, 110, 28, 4);
        upgBg.fill(0x1a3a1a);
        upgBg.roundRect(0, 0, 110, 28, 4);
        upgBg.stroke({ width: 1, color: 0x2ecc71 });
        this.upgradeBtn.addChild(upgBg);
        this.upgradeBtnText = new PIXI.Text({
            text: 'Улучшить 💰30',
            style: { fontFamily: 'monospace', fontSize: 11, fill: 0x2ecc71 },
        });
        this.upgradeBtnText.x = 6;
        this.upgradeBtnText.y = 6;
        this.upgradeBtn.addChild(this.upgradeBtnText);
        this.upgradeBtn.x = 0;
        this.upgradeBtn.y = 50;
        this.upgradeBtn.eventMode = 'static';
        this.upgradeBtn.cursor = 'pointer';
        this.upgradeBtn.hitArea = new PIXI.Rectangle(0, 0, 110, 28);
        this.upgradeBtn.on('pointerdown', () => this._onUpgradeClick());
        this.towerPanel.addChild(this.upgradeBtn);

        // Sell button
        this.sellBtn = new PIXI.Container();
        const sellBg = new PIXI.Graphics();
        sellBg.roundRect(0, 0, 100, 28, 4);
        sellBg.fill(0x3a1a1a);
        sellBg.roundRect(0, 0, 100, 28, 4);
        sellBg.stroke({ width: 1, color: 0xe74c3c });
        this.sellBtn.addChild(sellBg);
        this.sellBtnText = new PIXI.Text({
            text: 'Продать 💰25',
            style: { fontFamily: 'monospace', fontSize: 11, fill: 0xe74c3c },
        });
        this.sellBtnText.x = 6;
        this.sellBtnText.y = 6;
        this.sellBtn.addChild(this.sellBtnText);
        this.sellBtn.x = 0;
        this.sellBtn.y = 80;
        this.sellBtn.eventMode = 'static';
        this.sellBtn.cursor = 'pointer';
        this.sellBtn.hitArea = new PIXI.Rectangle(0, 0, 100, 28);
        this.sellBtn.on('pointerdown', () => this._onSellClick());
        this.towerPanel.addChild(this.sellBtn);
    }

    showTowerPanel(tower) {
        this.closePanels();
        this.selectedTower = tower;
        tower.showRange(true);

        this.towerNameText.text = `${tower.name} (Ур. ${tower.level})`;
        this.towerStatsText.text = `Урон:${tower.damage} Скор:${tower.attackSpeed}с`;

        // Upgrade button
        if (tower.canUpgrade()) {
            const cost = tower.getUpgradeCost();
            this.upgradeBtnText.text = `Улучшить 💰${cost}`;
            this.upgradeBtn.visible = true;
            this.upgradeBtn.alpha = this.game.gold >= cost ? 1 : 0.4;
            this.upgradeBtn.eventMode = this.game.gold >= cost ? 'static' : 'none';
        } else {
            this.upgradeBtn.visible = false;
        }

        // Sell button
        this.sellBtnText.text = `Продать 💰${tower.getSellValue()}`;

        // Background
        this.towerPanelBg.clear();
        this.towerPanelBg.roundRect(-10, -10, 140, 125, 8);
        this.towerPanelBg.fill({ color: 0x0a0a1a, alpha: 0.9 });
        this.towerPanelBg.roundRect(-10, -10, 140, 125, 8);
        this.towerPanelBg.stroke({ width: 1, color: 0x333366, alpha: 0.5 });

        // Position
        let px = tower.x + 30;
        let py = tower.y - 60;
        if (px + 140 > CONFIG.WIDTH) px = tower.x - 160;
        if (py < 45) py = tower.y + 30;
        if (py + 125 > CONFIG.HEIGHT) py = CONFIG.HEIGHT - 130;
        this.towerPanel.x = px;
        this.towerPanel.y = py;
        this.towerPanel.visible = true;
    }

    _onUpgradeClick() {
        if (!this.selectedTower) return;
        const cost = this.selectedTower.getUpgradeCost();
        if (cost === null || this.game.gold < cost) return;
        this.game.upgradeTower(this.selectedTower, cost);
        this.showTowerPanel(this.selectedTower); // refresh
    }

    _onSellClick() {
        if (!this.selectedTower) return;
        this.game.sellTower(this.selectedTower);
        this.closePanels();
    }

    closePanels() {
        this.buildMenu.visible = false;
        this.towerPanel.visible = false;
        if (this.selectedTower) {
            this.selectedTower.showRange(false);
            this.selectedTower = null;
        }
        this.selectedSpot = null;
    }

    // ---- Game Screens ----
    _buildScreens() {
        // Start screen
        this.startScreen = this._createScreen(
            'Защита Замка',
            'Защити замок от волн врагов!\nСтавь башни вдоль дороги и уничтожай монстров.',
            'Играть',
            () => this.game.startGame()
        );

        // Victory screen
        this.victoryScreen = this._createScreen(
            'Победа!',
            'Все волны врагов отбиты!\nЗамок защищён!',
            'Играть снова',
            () => this.game.restart()
        );
        this.victoryScreen.visible = false;

        // Game over screen
        this.gameOverScreen = this._createScreen(
            'Поражение',
            'Замок пал...\nВраги прорвались сквозь оборону.',
            'Попробовать снова',
            () => this.game.restart()
        );
        this.gameOverScreen.visible = false;
    }

    _createScreen(title, subtitle, btnText, onClick) {
        const screen = new PIXI.Container();

        // Overlay
        const overlay = new PIXI.Graphics();
        overlay.rect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        overlay.fill({ color: 0x000000, alpha: 0.7 });
        screen.addChild(overlay);

        // Title
        const titleText = new PIXI.Text({
            text: title,
            style: {
                fontFamily: 'monospace',
                fontSize: 32,
                fill: 0xffffff,
                fontWeight: 'bold',
                dropShadow: { color: 0x000000, blur: 4, distance: 2 },
            },
        });
        titleText.anchor.set(0.5);
        titleText.x = CONFIG.WIDTH / 2;
        titleText.y = CONFIG.HEIGHT / 2 - 80;
        screen.addChild(titleText);

        // Subtitle
        const subText = new PIXI.Text({
            text: subtitle,
            style: {
                fontFamily: 'monospace',
                fontSize: 14,
                fill: 0xaaaaaa,
                align: 'center',
                lineHeight: 22,
                wordWrap: true,
                wordWrapWidth: 340,
            },
        });
        subText.anchor.set(0.5);
        subText.x = CONFIG.WIDTH / 2;
        subText.y = CONFIG.HEIGHT / 2 - 10;
        screen.addChild(subText);

        // Button
        const btn = new PIXI.Container();
        const btnBg = new PIXI.Graphics();
        btnBg.roundRect(-90, -18, 180, 36, 8);
        btnBg.fill(0x2c3e50);
        btnBg.roundRect(-90, -18, 180, 36, 8);
        btnBg.stroke({ width: 2, color: 0x3498db });
        btn.addChild(btnBg);

        const btnLabel = new PIXI.Text({
            text: btnText,
            style: { fontFamily: 'monospace', fontSize: 16, fill: 0x3498db, fontWeight: 'bold' },
        });
        btnLabel.anchor.set(0.5);
        btn.addChild(btnLabel);

        btn.x = CONFIG.WIDTH / 2;
        btn.y = CONFIG.HEIGHT / 2 + 60;
        btn.eventMode = 'static';
        btn.cursor = 'pointer';
        btn.hitArea = new PIXI.Rectangle(-90, -18, 180, 36);

        btn.on('pointerover', () => { btnBg.tint = 0x44aaff; });
        btn.on('pointerout', () => { btnBg.tint = 0xffffff; });
        btn.on('pointerdown', onClick);

        screen.addChild(btn);
        this.uiLayer.addChild(screen);
        return screen;
    }

    showStart() {
        this.startScreen.visible = true;
        this.victoryScreen.visible = false;
        this.gameOverScreen.visible = false;
    }

    showVictory() {
        this.victoryScreen.visible = true;
    }

    showGameOver() {
        this.gameOverScreen.visible = true;
    }

    hideScreens() {
        this.startScreen.visible = false;
        this.victoryScreen.visible = false;
        this.gameOverScreen.visible = false;
    }
}
