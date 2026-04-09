import { POWER_UPS } from './PowerUpData.js';

export default class PowerUpManager {
    constructor() {
        this.drops = [];
        this.activeEffects = [];
        this.sprites = new Map();
    }

    init(game) {
        this.game = game;
        this._preloadSprites();
    }

    _preloadSprites() {
        for (const key in POWER_UPS) {
            const config = POWER_UPS[key];
            if (config.sprite) {
                const img = new Image();
                img.src = config.sprite;
                
                img.isReady = false; 
                img.onload = () => { img.isReady = true; };
                img.onerror = () => { 
                    console.warn(`Chyba při načítání spritu pro: ${config.id}`);
                    img.isError = true; 
                };
                
                this.sprites.set(config.id, img);
            }
        }
    }


    trySpawn(x, y) {
        const player = this.game.getModule('player');
        const luck = player ? player.stats.luck : 1;
        
        const dropChance = 0.02 * luck;

        if (Math.random() < dropChance) {
            let totalWeight = 0;
            for (const key in POWER_UPS) {
                totalWeight += POWER_UPS[key].weight || 50;
            }

            let random = Math.random() * totalWeight;

            for (const key in POWER_UPS) {
                const config = POWER_UPS[key];
                const weight = config.weight || 50;
                
                random -= weight;
                if (random <= 0) {
                    this._spawnSpecific(config, x, y);
                    break;
                }
            }
        }
    }

    _spawnSpecific(config, x, y) {
        this.drops.push({
            ...config,
            x, y,
            bobbing: Math.random() * Math.PI * 2,
            spawnTime: Date.now()
        });
    }

    update(deltaTime) {
        const player = this.game.getModule('player');
        if (!player) return;

        const magnetRangePx = player.stats.magnetRange * this.game.UNIT_SIZE;
        const pickupRangePx = 0.3 * this.game.UNIT_SIZE;

        for (let i = this.drops.length - 1; i >= 0; i--) {
            const d = this.drops[i];
            d.bobbing += deltaTime * 0.003;

            const dx = player.pos.x - d.x;
            const dy = player.pos.y - d.y;
            const distPx = Math.sqrt(dx * dx + dy * dy);

            if (distPx < magnetRangePx) {
                const magnetSpeed = 0.5; 
                d.x += (dx / distPx) * magnetSpeed * deltaTime;
                d.y += (dy / distPx) * magnetSpeed * deltaTime;
            }

            if (distPx < pickupRangePx) {
                this.applyEffect(d);
                this.drops.splice(i, 1);
            }
        }

        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            effect.remaining -= deltaTime;

            if (effect.remaining <= 0) {
                this.removeEffect(effect);
                this.activeEffects.splice(i, 1);
            }
        }
    }

    applyEffect(config) {
        const player = this.game.getModule('player');
        const ui = this.game.getModule('ui');
        
        if (ui && ui.showNotification && config.infoText) {
            ui.showNotification(config.infoText, config.color);
        }

        const existing = this.activeEffects.find(e => e.id === config.id);
        if (existing) {
            existing.remaining = config.duration;
            return;
        }

        if (config.statModifiers) {
            for (let stat in config.statModifiers) {
                player.stats[stat] += config.statModifiers[stat];
            }
        }

        if (config.onPickup) config.onPickup(this.game);

        if (config.duration) {
            this.activeEffects.push({
                id: config.id,
                name: config.name,
                color: config.color,
                duration: config.duration,
                remaining: config.duration,
                modifiers: config.statModifiers,
                onExpire: config.onExpire
            });
        }
    }

    removeEffect(effect) {
        const player = this.game.getModule('player');
        
        if (effect.modifiers) {
            for (let stat in effect.modifiers) {
                player.stats[stat] -= effect.modifiers[stat];
            }
        }

        if (effect.onExpire) effect.onExpire(this.game);
    }

    draw(ctx) {
        const player = this.game.getModule('player');
        if (!player) return;

        for (const d of this.drops) {
            const drawX = d.x - player.pos.x + this.game.center.x;
            const drawY = d.y - player.pos.y + this.game.center.y + Math.sin(d.bobbing) * 8;

            ctx.save();
            
            ctx.shadowBlur = 20;
            ctx.shadowColor = d.color;

            const img = this.sprites.get(d.id);

            if (img && img.isReady && !img.isError) {
                const size = 48; 
                ctx.drawImage(img, drawX - size/2, drawY - size/2, size, size);
            } else {
                // fallback to a shape if sprite is missing or not loaded
                ctx.fillStyle = d.color;
                ctx.beginPath();
                ctx.arc(drawX, drawY, 10, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = "rgba(255,255,255,0.5)";
                ctx.beginPath();
                ctx.arc(drawX - 3, drawY - 3, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }
}