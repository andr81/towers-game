// ============================================================
// towers.js — Tower classes and tower manager
// ============================================================

class Tower {
    constructor(type, spot) {
        const def = CONFIG.TOWERS[type];
        this.type = type;
        this.spot = spot;
        this.x = spot.x;
        this.y = spot.y;
        this.level = 1;
        this.name = def.name;
        this.range = def.range;
        this.damage = def.damage;
        this.attackSpeed = def.attackSpeed;
        this.canHitFlying = def.canHitFlying;
        this.color = def.color;
        this.cooldown = 0;
        this.target = null;

        // Type-specific
        this.aoeRadius = def.aoeRadius || 0;
        this.chainTargets = def.chainTargets || 0;
        this.slowFactor = def.slowFactor || 0;
        this.projectileSpeed = def.projectileSpeed || 6;
        this.projectileColor = def.projectileColor;
        this.multishot = def.multishot || 1;

        // Total gold invested (for sell calculation)
        this.totalInvested = def.cost;

        // Graphics
        this.container = new PIXI.Container();
        this.container.x = this.x;
        this.container.y = this.y;

        // Range indicator — always visible (subtle), brighter on select
        this.rangeCircle = new PIXI.Graphics();
        this.rangeCircle.eventMode = 'none';
        this._drawRangeCircle(false);
        this.container.addChild(this.rangeCircle);

        this._buildGraphics();
    }

    _drawRangeCircle(selected) {
        this.rangeCircle.clear();
        this.rangeCircle.circle(0, 0, this.range);
        this.rangeCircle.fill({ color: this.color, alpha: selected ? 0.12 : 0.04 });
        this.rangeCircle.circle(0, 0, this.range);
        this.rangeCircle.stroke({ width: 1, color: this.color, alpha: selected ? 0.4 : 0.12 });
    }

    _buildGraphics() {
        if (this.towerGraphics) {
            this.container.removeChild(this.towerGraphics);
            this.towerGraphics.destroy();
        }

        this.towerGraphics = new PIXI.Graphics();
        const s = 16 + this.level * 2;

        if (this.type === 'archer') {
            // Circular tower with pointed top
            this.towerGraphics.circle(0, 0, s);
            this.towerGraphics.fill(0x1a3a2a);
            this.towerGraphics.circle(0, 0, s);
            this.towerGraphics.stroke({ width: 2, color: this.color });
            // Arrow symbol
            this.towerGraphics.moveTo(0, -s * 0.5);
            this.towerGraphics.lineTo(0, s * 0.4);
            this.towerGraphics.stroke({ width: 2, color: this.color });
            this.towerGraphics.moveTo(-4, -s * 0.2);
            this.towerGraphics.lineTo(0, -s * 0.5);
            this.towerGraphics.lineTo(4, -s * 0.2);
            this.towerGraphics.stroke({ width: 2, color: this.color });
        } else if (this.type === 'cannon') {
            // Square tower
            this.towerGraphics.roundRect(-s, -s, s * 2, s * 2, 4);
            this.towerGraphics.fill(0x2a1a0a);
            this.towerGraphics.roundRect(-s, -s, s * 2, s * 2, 4);
            this.towerGraphics.stroke({ width: 2, color: this.color });
            // Cannon barrel
            this.towerGraphics.circle(0, 0, s * 0.5);
            this.towerGraphics.fill(this.color);
        } else if (this.type === 'mage') {
            // Diamond/crystal tower
            this.towerGraphics.poly([0, -s, s * 0.7, 0, 0, s, -s * 0.7, 0]);
            this.towerGraphics.fill(0x1a0a2a);
            this.towerGraphics.poly([0, -s, s * 0.7, 0, 0, s, -s * 0.7, 0]);
            this.towerGraphics.stroke({ width: 2, color: this.color });
            // Crystal glow
            this.towerGraphics.circle(0, 0, s * 0.3);
            this.towerGraphics.fill({ color: this.color, alpha: 0.6 });
        }

        // Level indicator
        if (this.level > 1) {
            for (let i = 0; i < this.level - 1; i++) {
                const starX = -6 + i * 12;
                this.towerGraphics.star(starX, s + 8, 5, 4, 2);
                this.towerGraphics.fill(0xf1c40f);
            }
        }

        this.container.addChild(this.towerGraphics);
    }

    getUpgradeCost() {
        const def = CONFIG.TOWERS[this.type];
        if (this.level > def.upgrades.length) return null; // max level
        return def.upgrades[this.level - 1].cost;
    }

    getSellValue() {
        return Math.floor(this.totalInvested * CONFIG.SELL_RATE);
    }

    canUpgrade() {
        return this.level <= CONFIG.TOWERS[this.type].upgrades.length;
    }

    upgrade() {
        const def = CONFIG.TOWERS[this.type];
        if (this.level > def.upgrades.length) return false;

        const upg = def.upgrades[this.level - 1];
        this.level++;
        this.damage = upg.damage;
        this.range = upg.range || this.range;
        this.attackSpeed = upg.attackSpeed || this.attackSpeed;
        this.totalInvested += upg.cost;

        if (upg.aoeRadius !== undefined) this.aoeRadius = upg.aoeRadius;
        if (upg.chainTargets !== undefined) this.chainTargets = upg.chainTargets;
        if (upg.slowFactor !== undefined) this.slowFactor = upg.slowFactor;
        if (upg.multishot !== undefined) this.multishot = upg.multishot;

        this._buildGraphics();
        this._drawRangeCircle(false);
        return true;
    }

    findTarget(enemies) {
        let best = null;
        let bestDist = Infinity;

        for (const e of enemies) {
            if (!e.alive) continue;
            if (e.flying && !this.canHitFlying) continue;
            const dx = e.container.x - this.x;
            const dy = e.container.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= this.range && dist < bestDist) {
                best = e;
                bestDist = dist;
            }
        }
        return best;
    }

    findChainTargets(enemies, primary, maxTargets) {
        const targets = [primary];
        const used = new Set([primary]);
        let current = primary;

        for (let i = 1; i < maxTargets; i++) {
            let best = null;
            let bestDist = Infinity;
            for (const e of enemies) {
                if (!e.alive || used.has(e)) continue;
                const dx = e.container.x - current.container.x;
                const dy = e.container.y - current.container.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100 && dist < bestDist) {
                    best = e;
                    bestDist = dist;
                }
            }
            if (!best) break;
            targets.push(best);
            used.add(best);
            current = best;
        }
        return targets;
    }

    update(dt, enemies, projectileManager) {
        this.cooldown -= dt;
        if (this.cooldown > 0) return;

        const target = this.findTarget(enemies);
        if (!target) return;

        this.cooldown = this.attackSpeed;
        const from = { x: this.x, y: this.y };

        if (this.type === 'archer') {
            projectileManager.spawnArrow(from, target, this.damage);
            if (this.multishot > 1) {
                const used = new Set([target]);
                for (let i = 1; i < this.multishot; i++) {
                    let best = null;
                    let bestDist = Infinity;
                    for (const e of enemies) {
                        if (!e.alive || used.has(e)) continue;
                        if (e.flying && !this.canHitFlying) continue;
                        const dx = e.container.x - this.x;
                        const dy = e.container.y - this.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist <= this.range && dist < bestDist) {
                            best = e;
                            bestDist = dist;
                        }
                    }
                    if (!best) break;
                    used.add(best);
                    projectileManager.spawnArrow(from, best, this.damage);
                }
            }
        } else if (this.type === 'cannon') {
            projectileManager.spawnCannonball(from, target, this.damage, this.aoeRadius);
        } else if (this.type === 'mage') {
            const chainEnemies = this.findChainTargets(enemies, target, this.chainTargets);
            projectileManager.spawnLightning(from, chainEnemies, this.damage, this.slowFactor);
        }
    }

    showRange(show) {
        this._drawRangeCircle(show);
    }

    destroy() {
        if (this.container.parent) {
            this.container.parent.removeChild(this.container);
        }
        this.container.destroy({ children: true });
    }
}

class TowerManager {
    constructor(gameLayer) {
        this.towers = [];
        this.gameLayer = gameLayer;
    }

    build(type, spot) {
        const tower = new Tower(type, spot);
        this.towers.push(tower);
        this.gameLayer.addChild(tower.container);
        return tower;
    }

    sell(tower) {
        const value = tower.getSellValue();
        const idx = this.towers.indexOf(tower);
        if (idx !== -1) this.towers.splice(idx, 1);
        tower.destroy();
        return value;
    }

    update(dt, enemies, projectileManager) {
        for (const tower of this.towers) {
            tower.update(dt, enemies, projectileManager);
        }
    }

    getTowerAtSpot(spot) {
        return this.towers.find(t => t.spot === spot) || null;
    }

    clear() {
        for (const t of this.towers) t.destroy();
        this.towers = [];
    }
}
