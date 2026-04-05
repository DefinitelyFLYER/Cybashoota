/**
 * ProjectileManager.js - Opravená verze s autodetekcí myši
 */
export default class ProjectileManager {
    constructor() {
        this.projectiles = [];
        this.lastFireTime = 0;
        this.fireRate = 400; // Prodleva mezi výstřely v ms
        
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;

        // Sledování myši přímo v modulu
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

    // Interní metoda pro vytvoření střely
    _fire() {
        const now = Date.now();
        if (now - this.lastFireTime < this.fireRate) return;

        const player = this.game.getModule('player');
        if (!player) return;

        const originX = player.pos.x + player.size / 2;
        const originY = player.pos.y + player.size / 2;
        const angle = Math.atan2(this.mouseY - originY, this.mouseX - originX);
        
        this.projectiles.push({
            x: originX,
            y: originY,
            vx: Math.cos(angle) * 0.8,
            vy: Math.sin(angle) * 0.8,
            life: 2000 
        });

        this.lastFireTime = now;
    }

    update(deltaTime) {
        // Pokud hráč drží myš (nebo jen klikne), zkusíme vystřelit
        if (this.isMouseDown) {
            this._fire();
        }

        // Pohyb střel
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