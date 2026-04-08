export default class ProjectileManager {
    constructor() {
        this.projectiles = [];
        this.lastFireTime = 0;
        this.fireRate = 400;
        
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;

        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
        window.addEventListener('mousedown', () => this.isMouseDown = true);
        window.addEventListener('mouseup', () => this.isMouseDown = false);
    }

    init(game) {
        this.game = game;
    }

    update(deltaTime) {
        const player = this.game.getModule('player');
        if (!player) return;

        if (this.isMouseDown) {
            const now = Date.now();
            if (now - this.lastFireTime >= player.stats.fireRate) {
                const center = player.getCenter();
                const worldMouseX = this.mouseX + player.pos.x - this.game.center.x;
                const worldMouseY = this.mouseY + player.pos.y - this.game.center.y;
                const baseAngle = Math.atan2(worldMouseY - center.y, worldMouseX - center.x);

                const count = player.stats.projectileCount;
                const spread = player.stats.projectileSpread * (Math.PI / 180);

                for (let i = 0; i < count; i++) {
                    let offset = 0;
                    if (count > 1) {
                        offset = (i - (count - 1) / 2) * spread;
                    }
                    const finalAngle = baseAngle + offset;

                    this.projectiles.push({
                        x: center.x,
                        y: center.y,
                        vx: Math.cos(finalAngle) * player.stats.bulletSpeed,
                        vy: Math.sin(finalAngle) * player.stats.bulletSpeed,
                        life: 2000,
                        isCrit: Math.random() < player.stats.critChance,
                        bounces: player.stats.ricochetCount,
                        lastHitEnemy: null
                    });
                }
                this.lastFireTime = now;
            }
        }

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime;

            if (p.life <= 0) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    findNextTarget(projectile, currentEnemy) {
        const enemyMgr = this.game.getModule('enemies');
        if (!enemyMgr) return null;

        let closest = null;
        let minDist = 800;

        for (const enemy of enemyMgr.enemies) {
            if (enemy === currentEnemy) continue;

            const dx = enemy.x - projectile.x;
            const dy = enemy.y - projectile.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDist) {
                minDist = dist;
                closest = enemy;
            }
        }
        return closest;
    }

    draw(ctx) {
        const player = this.game.getModule('player');
        if (!player) return;

        ctx.save();
        ctx.fillStyle = '#00ffcc';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffcc';

        for (const p of this.projectiles) {
            const screenX = p.x - player.pos.x + this.game.center.x;
            const screenY = p.y - player.pos.y + this.game.center.y;

            ctx.beginPath();
            ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}