import { ENEMY_TYPES } from './EnemyTypes.js';

export default class EnemyManager {
    constructor() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnRate = 1500;
        this.sprites = new Map(); // Cache pro načtené obrázky
    }

    init(game) {
        this.game = game;
        this._preloadSprites();
    }

    _preloadSprites() {
        // Automaticky načte všechny obrázky definované v EnemyTypes
        for (const key in ENEMY_TYPES) {
            const config = ENEMY_TYPES[key];
            if (config.renderType === 'sprite' && config.sprite) {
                const img = new Image();
                img.src = config.sprite;
                this.sprites.set(config.type, img);
            }
        }
    }

    spawnEnemy() {
        if (!this.activePhase) return;

        const player = this.game.getModule('player');
        const center = this.game.center;
        
        // 1. Výběr typu POUZE z povolených v aktuální fázi
        const allowedTypes = this.activePhase.types;
        const typeKey = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
        const baseConfig = ENEMY_TYPES[typeKey];

        // 2. Výpočet pozice (stejné jako minule)
        const margin = 100;
        let spawnX = Math.random() < 0.5 ? -margin : this.game.canvas.width + margin;
        let spawnY = Math.random() * this.game.canvas.height;
        
        const worldX = spawnX + player.pos.x - center.x;
        const worldY = spawnY + player.pos.y - center.y;

        // 3. Vytvoření nepřítele s násobiči z fáze
        this.enemies.push({
            ...baseConfig,
            x: worldX,
            y: worldY,
            // Aplikujeme násobiče obtížnosti z Timeline
            maxHp: Math.ceil(baseConfig.hp * this.activePhase.hpMultiplier),
            currentHp: Math.ceil(baseConfig.hp * this.activePhase.hpMultiplier),
            speed: baseConfig.speed * this.activePhase.speedMultiplier
        });
    }

    update(deltaTime) {
        const player = this.game.getModule('player');
        if (!player) return;

        const catchUpSpeed = player.speed * 2;
        const screenThreshold = 600;

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            const dx = player.pos.x - e.x;
            const dy = player.pos.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Dynamická rychlost (vychází ze základní rychlosti daného typu)
            let currentSpeed = (dist > screenThreshold) ? catchUpSpeed : e.speed;

            if (dist > 1) {
                e.x += (dx / dist) * currentSpeed * deltaTime;
                e.y += (dy / dist) * currentSpeed * deltaTime;
            }

            // Kolize s projektily
            const pm = this.game.getModule('projectiles');
            if (pm) {
                for (let j = pm.projectiles.length - 1; j >= 0; j--) {
                    const p = pm.projectiles[j];
                    const pdx = p.x - e.x;
                    const pdy = p.y - e.y;
                    if (Math.sqrt(pdx * pdx + pdy * pdy) < e.size / 2) {
                        e.currentHp--; // Úprava: používáme currentHp
                        pm.projectiles.splice(j, 1);
                        if (e.currentHp <= 0) break;
                    }
                }
            }

            if (e.currentHp <= 0) {
                const ui = this.game.getModule('ui');
                const particles = this.game.getModule('particles');
                if (ui) ui.addScore(e.scoreValue);
                if (particles) particles.emit(e.x, e.y, e.color || '#ffffff', 15);
                this.enemies.splice(i, 1);
            }
        }

        this.spawnTimer += deltaTime;
        if (this.spawnTimer > this.spawnRate) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }
    }

    draw(ctx) {
        const player = this.game.getModule('player');
        if (!player) return;

        for (const e of this.enemies) {
            const drawX = e.x - player.pos.x + this.game.center.x;
            const drawY = e.y - player.pos.y + this.game.center.y;

            ctx.save();
            
            if (e.renderType === 'sprite' && this.sprites.has(e.type)) {
                // Vykreslení obrázkem
                const img = this.sprites.get(e.type);
                ctx.drawImage(img, drawX - e.size/2, drawY - e.size/2, e.size, e.size);
            } else {
                // Vykreslení tvarem (fallback na tvůj kód)
                ctx.shadowBlur = 15;
                ctx.shadowColor = e.color;
                ctx.fillStyle = e.color + '66'; // Přidáme průhlednost
                ctx.strokeStyle = e.color;
                ctx.lineWidth = 3;

                this._drawShape(ctx, drawX, drawY, e);
            }

            if (e.currentHp < e.maxHp) {
                this._drawHealthBar(ctx, drawX, drawY, e);
            }
            ctx.restore();
        }
    }

    _drawShape(ctx, x, y, e) {
        ctx.beginPath();
        if (e.type === 'TRIANGLE') {
            ctx.moveTo(x, y - e.size/2);
            ctx.lineTo(x + e.size/2, y + e.size/2);
            ctx.lineTo(x - e.size/2, y + e.size/2);
        } else if (e.type === 'SQUARE') {
            ctx.rect(x - e.size/2, y - e.size/2, e.size, e.size);
        } else if (e.type === 'HEXAGON') {
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const px = x + (e.size / 2) * Math.cos(angle);
                const py = y + (e.size / 2) * Math.sin(angle);
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    _drawHealthBar(ctx, x, y, e) {
        const barWidth = e.size;
        const drawX = x - barWidth / 2;
        const drawY = y - (e.size / 2 + 15);
        ctx.fillStyle = '#333';
        ctx.fillRect(drawX, drawY, barWidth, 4);
        const hpPercent = e.currentHp / e.maxHp;
        ctx.fillStyle = hpPercent > 0.5 ? '#00ffcc' : '#ff0055'; 
        ctx.fillRect(drawX, drawY, barWidth * hpPercent, 4);
    }
}