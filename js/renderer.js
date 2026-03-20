// ============================================================
// renderer.js — Map rendering: background, road, spots, castle
// ============================================================

class MapRenderer {
    constructor(app) {
        this.app = app;
        this.mapLayer = new PIXI.Container();
        app.stage.addChild(this.mapLayer);
    }

    drawMap() {
        this._drawBackground();
        this._drawDecoration();
        this._drawRoad();
        this._drawTowerSpots();
        this._drawCastle();
    }

    _drawBackground() {
        const bg = new PIXI.Graphics();
        // Gradient-like background using rectangles
        const steps = 20;
        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const r = Math.round(0x1a + (0x16 - 0x1a) * t);
            const g = Math.round(0x1a + (0x21 - 0x1a) * t);
            const b = Math.round(0x2e + (0x3e - 0x2e) * t);
            const color = (r << 16) | (g << 8) | b;
            const y = (CONFIG.HEIGHT / steps) * i;
            bg.rect(0, y, CONFIG.WIDTH, CONFIG.HEIGHT / steps + 1);
            bg.fill(color);
        }
        this.mapLayer.addChild(bg);
    }

    _drawDecoration() {
        const deco = new PIXI.Graphics();
        // Dark trees/bushes scattered around
        const treePositions = [
            { x: 80, y: 30 }, { x: 150, y: 180 }, { x: 50, y: 350 },
            { x: 900, y: 30 }, { x: 950, y: 200 }, { x: 100, y: 500 },
            { x: 500, y: 500 }, { x: 400, y: 50 }, { x: 700, y: 340 },
            { x: 850, y: 550 }, { x: 300, y: 490 }, { x: 150, y: 440 },
        ];
        for (const pos of treePositions) {
            // Trunk
            deco.rect(pos.x - 2, pos.y, 4, 12);
            deco.fill(0x3d2817);
            // Foliage
            deco.circle(pos.x, pos.y - 4, 10 + Math.random() * 6);
            deco.fill({ color: 0x0d3320, alpha: 0.7 });
        }
        // Grass patches
        for (let i = 0; i < 30; i++) {
            const gx = Math.random() * CONFIG.WIDTH;
            const gy = Math.random() * CONFIG.HEIGHT;
            deco.circle(gx, gy, 2 + Math.random() * 3);
            deco.fill({ color: 0x1a4a30, alpha: 0.3 });
        }
        this.mapLayer.addChild(deco);
    }

    _drawRoad() {
        const road = new PIXI.Graphics();
        const wp = CONFIG.PATH_WAYPOINTS;

        // Road border (wider, darker)
        road.moveTo(wp[0].x, wp[0].y);
        for (let i = 1; i < wp.length; i++) {
            road.lineTo(wp[i].x, wp[i].y);
        }
        road.stroke({ width: CONFIG.ROAD_WIDTH + 6, color: CONFIG.ROAD_BORDER_COLOR, join: 'round', cap: 'round' });

        // Road main
        road.moveTo(wp[0].x, wp[0].y);
        for (let i = 1; i < wp.length; i++) {
            road.lineTo(wp[i].x, wp[i].y);
        }
        road.stroke({ width: CONFIG.ROAD_WIDTH, color: CONFIG.ROAD_COLOR, join: 'round', cap: 'round' });

        // Road center line (dashes simulated with dots)
        for (let seg = 0; seg < wp.length - 1; seg++) {
            const a = wp[seg];
            const b = wp[seg + 1];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const steps = Math.floor(len / 20);
            for (let i = 0; i < steps; i += 2) {
                const t = i / steps;
                const px = a.x + dx * t;
                const py = a.y + dy * t;
                road.circle(px, py, 1.5);
                road.fill({ color: 0xA09060, alpha: 0.4 });
            }
        }

        this.mapLayer.addChild(road);
    }

    _drawTowerSpots() {
        this.spotGraphics = [];
        for (const spot of CONFIG.TOWER_SPOTS) {
            const g = new PIXI.Graphics();
            // Outer glow
            g.circle(0, 0, 22);
            g.fill({ color: 0x2ecc71, alpha: 0.08 });
            // Dashed circle
            g.circle(0, 0, 20);
            g.stroke({ width: 2, color: 0x2ecc71, alpha: 0.4 });
            // Plus sign
            g.moveTo(-6, 0);
            g.lineTo(6, 0);
            g.moveTo(0, -6);
            g.lineTo(0, 6);
            g.stroke({ width: 2, color: 0x2ecc71, alpha: 0.3 });

            g.x = spot.x;
            g.y = spot.y;
            g.eventMode = 'static';
            g.cursor = 'pointer';
            g.hitArea = new PIXI.Circle(0, 0, 22);
            g.spot = spot;

            this.mapLayer.addChild(g);
            this.spotGraphics.push(g);
        }
    }

    _drawCastle() {
        const castle = new PIXI.Graphics();
        const cx = CONFIG.CASTLE.x;
        const cy = CONFIG.CASTLE.y;

        // Castle base
        castle.roundRect(cx - 30, cy - 35, 60, 50, 4);
        castle.fill(0x2c3e50);
        castle.roundRect(cx - 30, cy - 35, 60, 50, 4);
        castle.stroke({ width: 2, color: 0x3498db });

        // Towers (turrets)
        castle.rect(cx - 32, cy - 50, 12, 20);
        castle.fill(0x2c3e50);
        castle.rect(cx - 32, cy - 50, 12, 20);
        castle.stroke({ width: 1, color: 0x3498db });

        castle.rect(cx + 20, cy - 50, 12, 20);
        castle.fill(0x2c3e50);
        castle.rect(cx + 20, cy - 50, 12, 20);
        castle.stroke({ width: 1, color: 0x3498db });

        // Gate
        castle.roundRect(cx - 8, cy - 5, 16, 20, 8);
        castle.fill(0x1a252f);

        // Flag
        castle.moveTo(cx, cy - 55);
        castle.lineTo(cx, cy - 75);
        castle.stroke({ width: 2, color: 0x95a5a6 });
        castle.poly([cx, cy - 75, cx + 14, cy - 70, cx, cy - 65]);
        castle.fill(0xe74c3c);

        // Glow effect
        castle.circle(cx, cy - 10, 40);
        castle.fill({ color: 0x3498db, alpha: 0.05 });

        this.mapLayer.addChild(castle);
    }

    hideSpot(spot) {
        const sg = this.spotGraphics.find(g => g.spot === spot);
        if (sg) sg.visible = false;
    }

    showSpot(spot) {
        const sg = this.spotGraphics.find(g => g.spot === spot);
        if (sg) sg.visible = true;
    }
}
