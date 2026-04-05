/**
 * ProjectileManager.js - Aktualizováno o Cooldown (kadenci)
 */
export default class ProjectileManager {
    constructor() {
        this.projectiles = [];
        this.lastFireTime = 0;
        this.fireRate = 400; // Výstřel každých 400ms (0.4 sekundy)
        this.isMouseDown = false;

        // Sledování stavu myši pro budoucí auto-fire
        window.addEventListener('mousedown', () => this.isMouseDown = true);
        window.addEventListener('mouseup', () => this.isMouseDown = false);
    }

    init(game) {
        this.game = game;
    }

    spawnProjectile(targetX, targetY) {
        const now = Date.now();
        
        // KONTROLA COOLDOWNU
        if (now - this.lastFireTime < this.fireRate) return;

        const player = this.game.getModule('player');
        if (!player) return;

        const originX = player.pos.x + player.size / 2;
        const originY = player.pos.y + player.size / 2;
        const angle = Math.atan2(targetY - originY, targetX - originX);
        
        this.projectiles.push({
            x: originX,
            y: originY,
            vx: Math.cos(angle) * 0.8, // Trošku jsme zrychlili projektil pro lepší pocit
            vy: Math.sin(angle) * 0.8,
            life: 2000 
        });

        this.lastFireTime = now; // Uložíme čas posledního výstřelu
    }

    update(deltaTime) {
        // Logika pohybu projektilů (stávající)
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

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#ff00ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff00ff';
        
        for (const p of this.projectiles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}