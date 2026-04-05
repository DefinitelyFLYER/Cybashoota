/**
 * ProjectileManager.js - Správa střelby
 */
export default class ProjectileManager {
    constructor() {
        this.projectiles = [];
    }

    init(game) {
        this.game = game;
        
        // Střelba na kliknutí myši
        window.addEventListener('mousedown', (e) => {
            this.spawnProjectile(e.clientX, e.clientY);
        });
    }

    spawnProjectile(targetX, targetY) {
        const player = this.game.getModule('player');
        if (!player) return;

        // Výpočet směru k myši
        const originX = player.pos.x + player.size / 2;
        const originY = player.pos.y + player.size / 2;
        
        const angle = Math.atan2(targetY - originY, targetX - originX);
        
        this.projectiles.push({
            x: originX,
            y: originY,
            vx: Math.cos(angle) * 0.6, // Rychlost střely
            vy: Math.sin(angle) * 0.6,
            life: 2000 // Životnost střely v ms
        });
    }

    update(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime;

            // Odstranění starých střel
            if (p.life <= 0) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#ff00ff'; // Neonově růžové střely
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff00ff';
        
        for (const p of this.projectiles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.shadowBlur = 0; // Reset stínu pro ostatní objekty
    }
}