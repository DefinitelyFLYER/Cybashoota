/**
 * ProjectileManager.js - Obnovená stabilní verze
 */
export default class ProjectileManager {
    constructor() {
        this.projectiles = [];
        this.lastFireTime = 0;
        this.fireRate = 400; // VRÁCENO: 2.5 střely za vteřinu (1000/2.5 = 400)
        
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

        // STŘELBA MYŠÍ
        if (this.isMouseDown) {
            const now = Date.now();
            // Používáme fireRate z Player statistik
            if (now - this.lastFireTime >= player.stats.fireRate) {
                const center = player.getCenter();
                const worldMouseX = this.mouseX + player.pos.x - this.game.center.x;
                const worldMouseY = this.mouseY + player.pos.y - this.game.center.y;
                const baseAngle = Math.atan2(worldMouseY - center.y, worldMouseX - center.x);

                const count = player.stats.projectileCount;
                const spread = player.stats.projectileSpread * (Math.PI / 180); // Převod na radiány

                for (let i = 0; i < count; i++) {
                    // Výpočet úhlu pro každou střelu (vycentrovaný rozptyl)
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
                        // Přidáme informaci o kritickém zásahu přímo k projektilu
                        isCrit: Math.random() < player.stats.critChance
                    });
                }
                this.lastFireTime = now;
            }
        }

        // POHYB PROJEKTILŮ
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
        const player = this.game.getModule('player');
        if (!player) return;

        ctx.save();
        ctx.fillStyle = '#00ffcc'; // VRÁCENO: Neonová azurová
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffcc';

        for (const p of this.projectiles) {
            // Správné vykreslení relativně k hráči (střed obrazovky)
            const screenX = p.x - player.pos.x + this.game.center.x;
            const screenY = p.y - player.pos.y + this.game.center.y;

            ctx.beginPath();
            ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}