// ============================================================
// projectiles.js — Arrow, Cannonball, Lightning
// ============================================================

class Projectile {
    constructor(from, target, damage, speed, color) {
        this.x = from.x;
        this.y = from.y;
        this.target = target;
        this.damage = damage;
        this.speed = speed;
        this.alive = true;

        this.graphics = new PIXI.Graphics();
        this.graphics.circle(0, 0, 3);
        this.graphics.fill(color);
        this.graphics.x = this.x;
        this.graphics.y = this.y;
    }

    update(dt) {
        if (!this.alive) return;

        // If target is dead, just die
        if (!this.target.alive) {
            this.alive = false;
            return;
        }

        const tx = this.target.container.x;
        const ty = this.target.container.y;
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 8) {
            this.hit();
            return;
        }

        const step = this.speed * dt * 60;
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
        this.graphics.x = this.x;
        this.graphics.y = this.y;
    }

    hit() {
        this.target.takeDamage(this.damage);
        this.alive = false;
    }

    destroy() {
        if (this.graphics.parent) {
            this.graphics.parent.removeChild(this.graphics);
        }
        this.graphics.destroy();
    }
}

class Arrow extends Projectile {
    constructor(from, target, damage) {
        super(from, target, damage, 10, CONFIG.TOWERS.archer.projectileColor);
        // Make arrow shape
        this.graphics.clear();
        this.graphics.rect(-4, -1.5, 8, 3);
        this.graphics.fill(CONFIG.TOWERS.archer.projectileColor);
    }

    update(dt) {
        if (!this.alive || !this.target.alive) {
            this.alive = false;
            return;
        }
        const tx = this.target.container.x;
        const ty = this.target.container.y;
        const dx = tx - this.x;
        const dy = ty - this.y;
        const angle = Math.atan2(dy, dx);
        this.graphics.rotation = angle;
        super.update(dt);
    }
}

class Cannonball extends Projectile {
    constructor(from, target, damage, aoeRadius) {
        super(from, target, damage, 6, CONFIG.TOWERS.cannon.projectileColor);
        this.aoeRadius = aoeRadius;
        // Bigger ball
        this.graphics.clear();
        this.graphics.circle(0, 0, 5);
        this.graphics.fill(CONFIG.TOWERS.cannon.projectileColor);
    }

    hit() {
        if (this.aoeRadius > 0 && this.target.alive) {
            // AoE damage
            const tx = this.target.container.x;
            const ty = this.target.container.y;
            const enemies = window.game.enemyManager.getAliveEnemies();
            for (const e of enemies) {
                if (e.flying) continue;
                const dx = e.container.x - tx;
                const dy = e.container.y - ty;
                if (Math.sqrt(dx * dx + dy * dy) <= this.aoeRadius) {
                    e.takeDamage(this.damage);
                }
            }
            // Spawn AoE visual
            window.game.spawnAoeEffect(tx, ty, this.aoeRadius);
        } else {
            this.target.takeDamage(this.damage);
        }
        this.alive = false;
    }
}

class Lightning {
    constructor(source, targets, damage, slowFactor) {
        this.alive = true;
        this.timer = 0.3; // visual duration

        this.graphics = new PIXI.Graphics();
        // Draw chain lightning between targets
        if (targets.length > 0) {
            this.graphics.moveTo(source.x, source.y);
            let prevX = source.x;
            let prevY = source.y;

            for (const target of targets) {
                const tx = target.container.x;
                const ty = target.container.y;

                // Jagged lightning line
                const dx = tx - prevX;
                const dy = ty - prevY;
                const steps = 4;
                for (let i = 1; i <= steps; i++) {
                    const t = i / steps;
                    let px = prevX + dx * t;
                    let py = prevY + dy * t;
                    if (i < steps) {
                        px += (Math.random() - 0.5) * 20;
                        py += (Math.random() - 0.5) * 20;
                    }
                    this.graphics.lineTo(px, py);
                }

                target.takeDamage(damage);
                if (slowFactor > 0) {
                    target.applySlow(slowFactor, 1.5);
                }

                prevX = tx;
                prevY = ty;
            }
            this.graphics.stroke({ width: 3, color: 0xbb86fc, alpha: 0.9 });

            // Second thinner bright line
            this.graphics.moveTo(source.x, source.y);
            prevX = source.x;
            prevY = source.y;
            for (const target of targets) {
                const tx = target.container.x;
                const ty = target.container.y;
                this.graphics.lineTo(tx, ty);
                prevX = tx;
                prevY = ty;
            }
            this.graphics.stroke({ width: 1, color: 0xe0d0ff, alpha: 0.7 });
        }
    }

    update(dt) {
        this.timer -= dt;
        if (this.timer <= 0) {
            this.alive = false;
            this.graphics.alpha = 0;
        } else {
            this.graphics.alpha = this.timer / 0.3;
        }
    }

    destroy() {
        if (this.graphics.parent) {
            this.graphics.parent.removeChild(this.graphics);
        }
        this.graphics.destroy();
    }
}

class ProjectileManager {
    constructor(gameLayer) {
        this.projectiles = [];
        this.lightnings = [];
        this.gameLayer = gameLayer;
    }

    spawnArrow(from, target, damage) {
        const p = new Arrow(from, target, damage);
        this.projectiles.push(p);
        this.gameLayer.addChild(p.graphics);
    }

    spawnCannonball(from, target, damage, aoeRadius) {
        const p = new Cannonball(from, target, damage, aoeRadius);
        this.projectiles.push(p);
        this.gameLayer.addChild(p.graphics);
    }

    spawnLightning(source, targets, damage, slowFactor) {
        const l = new Lightning(source, targets, damage, slowFactor);
        this.lightnings.push(l);
        this.gameLayer.addChild(l.graphics);
    }

    update(dt) {
        for (const p of this.projectiles) {
            p.update(dt);
        }
        for (const l of this.lightnings) {
            l.update(dt);
        }
        this._cleanup();
    }

    _cleanup() {
        const deadP = this.projectiles.filter(p => !p.alive);
        for (const p of deadP) p.destroy();
        this.projectiles = this.projectiles.filter(p => p.alive);

        const deadL = this.lightnings.filter(l => !l.alive);
        for (const l of deadL) l.destroy();
        this.lightnings = this.lightnings.filter(l => l.alive);
    }

    clear() {
        for (const p of this.projectiles) p.destroy();
        for (const l of this.lightnings) l.destroy();
        this.projectiles = [];
        this.lightnings = [];
    }
}
