// ============================================================
// enemies.js — Enemy classes and enemy manager
// ============================================================

class Enemy {
    constructor(type, path, hpMultiplier = 1) {
        const def = CONFIG.ENEMIES[type];
        this.type = type;
        this.name = def.name;
        this.maxHp = Math.round(def.hp * hpMultiplier);
        this.hp = this.maxHp;
        this.baseSpeed = def.speed;
        this.speed = def.speed;
        this.gold = def.gold;
        this.flying = def.flying;
        this.color = def.color;
        this.size = def.size;
        this.path = path;
        this.distance = 0;
        this.alive = true;
        this.reachedEnd = false;
        this.slowTimer = 0;
        this.slowFactor = 0;

        // Graphics
        this.container = new PIXI.Container();
        this._buildGraphics();

        // Initial position
        const pos = path.getPositionAt(0);
        this.container.x = pos.x;
        this.container.y = pos.y;
    }

    _buildGraphics() {
        // Body
        this.body = new PIXI.Graphics();
        if (this.type === 'golem') {
            this.body.rect(-this.size, -this.size, this.size * 2, this.size * 2);
        } else if (this.type === 'wraith') {
            this.body.poly([
                0, -this.size,
                this.size, this.size * 0.6,
                0, this.size * 0.3,
                -this.size, this.size * 0.6,
            ]);
        } else {
            this.body.circle(0, 0, this.size);
        }
        this.body.fill(this.color);
        this.container.addChild(this.body);

        // Flying indicator — shadow below
        if (this.flying) {
            this.shadow = new PIXI.Graphics();
            this.shadow.ellipse(0, this.size + 6, this.size * 0.7, 3);
            this.shadow.fill({ color: 0x000000, alpha: 0.3 });
            this.container.addChild(this.shadow);
            // Shift body up for flying effect
            this.body.y = -8;
        }

        // HP bar background
        this.hpBarBg = new PIXI.Graphics();
        this.hpBarBg.rect(-15, -this.size - 14, 30, 4);
        this.hpBarBg.fill(0x333333);
        this.container.addChild(this.hpBarBg);

        // HP bar fill
        this.hpBarFill = new PIXI.Graphics();
        this.container.addChild(this.hpBarFill);
        this._updateHpBar();
    }

    _updateHpBar() {
        this.hpBarFill.clear();
        const ratio = this.hp / this.maxHp;
        const barColor = ratio > 0.5 ? 0x2ecc71 : ratio > 0.25 ? 0xf39c12 : 0xe74c3c;
        this.hpBarFill.rect(-15, -this.size - 14, 30 * ratio, 4);
        this.hpBarFill.fill(barColor);
        if (this.flying) {
            this.hpBarBg.y = -8;
            this.hpBarFill.y = -8;
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
        this._updateHpBar();
    }

    applySlow(factor, duration) {
        this.slowFactor = factor;
        this.slowTimer = duration;
    }

    update(dt) {
        if (!this.alive) return;

        // Slow effect
        if (this.slowTimer > 0) {
            this.slowTimer -= dt;
            this.speed = this.baseSpeed * (1 - this.slowFactor);
        } else {
            this.speed = this.baseSpeed;
            this.slowFactor = 0;
        }

        this.distance += this.speed * dt * 60;
        const pos = this.path.getPositionAt(this.distance);
        this.container.x = pos.x;
        this.container.y = pos.y;

        // Floating animation for wraith
        if (this.flying) {
            this.body.y = -8 + Math.sin(Date.now() * 0.005) * 3;
        }

        if (this.path.isFinished(this.distance)) {
            this.reachedEnd = true;
            this.alive = false;
        }
    }

    destroy() {
        if (this.container.parent) {
            this.container.parent.removeChild(this.container);
        }
        this.container.destroy({ children: true });
    }
}

class EnemyManager {
    constructor(gameLayer) {
        this.enemies = [];
        this.gameLayer = gameLayer;
    }

    spawn(type, path, hpMultiplier) {
        const enemy = new Enemy(type, path, hpMultiplier);
        this.enemies.push(enemy);
        this.gameLayer.addChild(enemy.container);
        return enemy;
    }

    update(dt) {
        for (const enemy of this.enemies) {
            enemy.update(dt);
        }
    }

    getAliveEnemies() {
        return this.enemies.filter(e => e.alive);
    }

    cleanup() {
        const dead = this.enemies.filter(e => !e.alive);
        for (const enemy of dead) {
            enemy.destroy();
        }
        this.enemies = this.enemies.filter(e => e.alive);
        return dead;
    }

    clear() {
        for (const enemy of this.enemies) {
            enemy.destroy();
        }
        this.enemies = [];
    }
}
