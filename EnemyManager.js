/**
 * EnemyManager.js - Správa nepřátel a AI
 */
export default class EnemyManager {
    constructor() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnRate = 1500;
        this.maxEnemyHP = 3; // Zvýšeno ze 2 na 3
    }

    init(game) {
        this.game = game;
    }

    spawnEnemy() {
        const player = this.game.getModule('player');
        if (!player) return;

        const canvas = this.game.canvas;
        const center = this.game.center;
        
        // Určíme náhodný bod na okraji VIDITELNÉ oblasti
        let spawnX, spawnY;
        const margin = 100; // Jak daleko za okrajem obrazovky se mají objevit

        if (Math.random() < 0.5) {
            // Spawn vlevo nebo vpravo od hráče
            spawnX = Math.random() < 0.5 ? -margin : canvas.width + margin;
            spawnY = Math.random() * canvas.height;
        } else {
            // Spawn nad nebo pod hráčem
            spawnX = Math.random() * canvas.width;
            spawnY = Math.random() < 0.5 ? -margin : canvas.height + margin;
        }

        // KLÍČOVÝ KROK: Převod ze souřadnic obrazovky do souřadnic SVĚTA
        // Vezmeme bod na obrazovce a přičteme k němu aktuální posun hráče
        const worldX = spawnX + player.pos.x - center.x;
        const worldY = spawnY + player.pos.y - center.y;

        this.enemies.push({
            x: worldX,
            y: worldY,
            size: 40,
            speed: 0.15,
            hp: this.maxEnemyHP
        });
    }

    update(deltaTime) {
        const player = this.game.getModule('player');
        if (!player) return;

        // Parametry pro pohyb
        const catchUpSpeed = player.speed * 2; // 2x rychlejší než hráč (cca 0.4)
        const normalSpeed = 0.15;              // Původní rychlost
        const screenThreshold = 1000;          // Vzdálenost, kdy se považuje za "mimo obrazovku"

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            
            // Logický výpočet směru k hráči ve světě
            const dx = player.pos.x - e.x;
            const dy = player.pos.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // --- DYNAMICKÁ RYCHLOST ---
            // Pokud je nepřítel moc daleko, zapne "turbo"
            if (dist > screenThreshold) {
                e.speed = catchUpSpeed;
            } else {
                // Jakmile se přiblíží, zpomalí na útočnou rychlost
                e.speed = normalSpeed;
            }

            // Pohyb (normalizace vektoru a aplikace rychlosti)
            if (dist > 1) {
                e.x += (dx / dist) * e.speed * deltaTime;
                e.y += (dy / dist) * e.speed * deltaTime;
            }

            // --- KOLIZE S PROJEKTILY (stávající kód) ---
            const pm = this.game.getModule('projectiles');
            if (pm) {
                for (let j = pm.projectiles.length - 1; j >= 0; j--) {
                    const p = pm.projectiles[j];
                    const pdx = p.x - e.x;
                    const pdy = p.y - e.y;
                    const pDist = Math.sqrt(pdx * pdx + pdy * pdy);

                    if (pDist < e.size / 2) {
                        e.hp--;
                        pm.projectiles.splice(j, 1);
                        if (e.hp <= 0) break;
                    }
                }
            }

            // --- SMRT NEPŘÍTELE ---
            if (e.hp <= 0) {
                const ui = this.game.getModule('ui');
                const particles = this.game.getModule('particles');
                if (ui) ui.addScore(100);
                if (particles) particles.emit(e.x, e.y, '#ff0000', 15);
                this.enemies.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        const player = this.game.getModule('player');
        const center = this.game.center; // Střed z Core.js
        if (!player) return;

        for (const e of this.enemies) {
            ctx.save();

            // VÝPOČET RELATIVNÍ POZICE NA OBRAZOVCE
            const drawX = e.x - player.pos.x + center.x;
            const drawY = e.y - player.pos.y + center.y;

            // 1. Tělo nepřítele (používáme drawX/drawY)
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff0000';
            ctx.fillStyle = '#660000';
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.moveTo(drawX, drawY - 20);
            ctx.lineTo(drawX + 20, drawY + 20);
            ctx.lineTo(drawX - 20, drawY + 20);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 2. HP Bar (předáme drawX/drawY do pomocné metody)
            if (e.hp < this.maxEnemyHP) {
                this._drawHealthBar(ctx, drawX, drawY, e.hp);
            }

            ctx.restore();
        }
    }

    // Pomocnou metodu upravíme, aby brala už vypočítané souřadnice
    _drawHealthBar(ctx, x, y, currentHp) {
        const barWidth = 40;
        const barHeight = 4;
        const drawX = x - barWidth / 2;
        const drawY = y - 35;

        ctx.shadowBlur = 0; 
        ctx.fillStyle = '#333';
        ctx.fillRect(drawX, drawY, barWidth, barHeight);

        const hpPercent = currentHp / this.maxEnemyHP;
        ctx.fillStyle = hpPercent > 0.5 ? '#00ffcc' : '#ff0055'; 
        ctx.fillRect(drawX, drawY, barWidth * hpPercent, barHeight);
    }
}