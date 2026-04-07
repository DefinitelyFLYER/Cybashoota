// PowerUpManager.js
import { POWER_UPS } from './PowerUpData.js';

export default class PowerUpManager {
    constructor() {
        this.drops = [];          // Předměty na zemi
        this.activeEffects = [];  // To, co právě teď boostuje hráče
    }

    init(game) {
        this.game = game;
    }

    // Volá se z EnemyManageru, když někdo umře
    trySpawn(x, y) {
        const player = this.game.getModule('player');
        // Šance na drop se může zvyšovat s Luckem hráče
        const luck = player ? player.stats.luck : 1;
        const dropChance = 0.1 * luck; 

        if (Math.random() < dropChance) {
            const keys = Object.keys(POWER_UPS);
            const randomKey = keys[Math.floor(Math.random() * keys.length)];
            const config = POWER_UPS[randomKey];

            this.drops.push({
                ...config,
                x, y,
                spawnTime: Date.now(),
                bobbing: 0 // Pro animaci levitace
            });
        }
    }

    update(deltaTime) {
        const player = this.game.getModule('player');
        if (!player) return;

        // 1. Logika předmětů na zemi (Sběr)
        for (let i = this.drops.length - 1; i >= 0; i--) {
            const d = this.drops[i];
            d.bobbing += deltaTime * 0.005;

            const dist = Math.sqrt((d.x - player.pos.x)**2 + (d.y - player.pos.y)**2);
            if (dist < 30) { // Kolize s hráčem
                this.applyEffect(d);
                this.drops.splice(i, 1);
            }
        }

        // 2. Logika aktivních efektů (Odpočet a konec)
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
        
        // Pokud už efekt stejného typu běží, jen resetujeme čas (Stack Strategy: RENEW)
        const existing = this.activeEffects.find(e => e.id === config.id);
        if (existing) {
            existing.remaining = config.duration;
            return;
        }

        // Aplikace modifikátorů
        if (config.statModifiers) {
            for (let stat in config.statModifiers) {
                // Tady si musíme dát pozor, zda stat přičítáme nebo násobíme
                // Pro jednoduchost teď budeme staty jen dočasně přepisovat/přidávat
                player.stats[stat] += config.statModifiers[stat];
            }
        }

        if (config.onPickup) config.onPickup(this.game);

        this.activeEffects.push({
            id: config.id,
            remaining: config.duration,
            modifiers: config.statModifiers
        });
    }

    removeEffect(effect) {
        const player = this.game.getModule('player');
        if (effect.modifiers) {
            for (let stat in effect.modifiers) {
                player.stats[stat] -= effect.modifiers[stat];
            }
        }
    }

    draw(ctx) {
        const player = this.game.getModule('player');
        for (const d of this.drops) {
            const drawX = d.x - player.pos.x + this.game.center.x;
            const drawY = d.y - player.pos.y + this.game.center.y + Math.sin(d.bobbing) * 5;

            ctx.fillStyle = d.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = d.color;
            
            // Nakreslíme kosočtverec nebo ikonu
            ctx.beginPath();
            ctx.arc(drawX, drawY, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}