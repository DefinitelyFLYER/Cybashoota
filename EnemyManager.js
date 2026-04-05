/**
 * EnemyManager.js - Správa nepřátel a AI
 */
export default class EnemyManager {
    constructor() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnRate = 1500;
        this.maxEnemyHP = 3; // Základní životy nepřítele
    }

    init(game) {
        this.game = game;
    }

    spawnEnemy() {
        const canvas = this.game.canvas;
        let x, y;

        // Náhodný spawn na okraji obrazovky
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? -30 : canvas.width + 30;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? -30 : canvas.height + 30;
        }

        this.enemies.push({
            x: x,
            y: y,
            size: 40,
            speed: 0.15,
            hp: 3
        });
    }

    update(deltaTime) {
        const player = this.game.getModule('player');
        if (!player) return;

        // Časovač pro spawn
        this.spawnTimer += deltaTime;
        if (this.spawnTimer > this.spawnRate) {
            this.spawnEnemy();
            this.spawnTimer = 0;
            // Postupné zrychlování hry
            if (this.spawnRate > 500) this.spawnRate -= 10;
        }

        // Pohyb nepřátel směrem k hráči
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            
            const dx = (player.pos.x + player.size / 2) - e.x;
            const dy = (player.pos.y + player.size / 2) - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Normalizace směru a pohyb
            if (dist > 1) {
                e.x += (dx / dist) * e.speed * deltaTime;
                e.y += (dy / dist) * e.speed * deltaTime;
            }

            // Kolize s projektily (přístup přes Core)
            const pm = this.game.getModule('projectiles');
            if (pm) {
                for (let j = pm.projectiles.length - 1; j >= 0; j--) {
                    const p = pm.projectiles[j];
                    const pdx = p.x - e.x;
                    const pdy = p.y - e.y;
                    const pDist = Math.sqrt(pdx * pdx + pdy * pdy);

                    if (pDist < e.size / 2) {
                        e.hp--;
                        pm.projectiles.splice(j, 1); // Odstranit kulku
                        if (e.hp <= 0) break;
                    }
                }
            }

            // Odstranění mrtvých nepřátel
            if (e.hp <= 0) {
                const ui = this.game.getModule('ui');
                const particles = this.game.getModule('particles'); // Získáme přístup k částicím
                
                if (ui) ui.addScore(100);
                
                // VYTVOŘENÍ EXPLOZE
                if (particles) {
                    particles.emit(e.x, e.y, '#ff0000', 15); // Červená exploze pro nepřítele
                }

                this.enemies.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff0000';
        ctx.fillStyle = '#660000';
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;

        for (const e of this.enemies) {
            // 1. Vykreslení těla nepřítele
            ctx.beginPath();
            ctx.moveTo(e.x, e.y - 20);
            ctx.lineTo(e.x + 20, e.y + 20);
            ctx.lineTo(e.x - 20, e.y + 20);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 2. Vykreslení HP Baru (pouze pokud nepřítel ztratil HP)
            if (e.hp < this.maxEnemyHP) {
                this._drawHealthBar(ctx, e);
            }
        }
        ctx.shadowBlur = 0;
    }

    // Pomocná soukromá metoda pro vykreslení baru
    _drawHealthBar(ctx, e) {
        const barWidth = 40;
        const barHeight = 4;
        const x = e.x - barWidth / 2;
        const y = e.y - 35; // Pozice nad nepřítelem

        // Pozadí baru (tmavé)
        ctx.shadowBlur = 0; // Vypneme stín pro bar, aby byl čitelný
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Výplň baru (červená/zelená podle HP)
        const hpPercent = e.hp / this.maxEnemyHP;
        ctx.fillStyle = hpPercent > 0.5 ? '#00ffcc' : '#ff0055'; 
        ctx.fillRect(x, y, barWidth * hpPercent, barHeight);
    }
}