/**
 * ExperienceManager.js - Správa XP orbů
 */
export default class ExperienceManager {
    constructor() {
        this.orbs = [];
        this.totalXp = 0;
    }

    init(game) {
        this.game = game;
    }

    /**
     * Vytvoří XP orb na pozici zemřelého nepřítele
     */
    spawnOrb(x, y, value, color) {
        this.orbs.push({
            x: x,
            y: y,
            value: value,
            color: color,
            size: 6 + (value / 20), // Velikost podle hodnoty
            pulse: 0, // Pro animaci
            seed: Math.random() * Math.PI * 2 // Náhodný start animace
        });
    }

    update(deltaTime) {
        // Zatím jen animujeme pulzování orbů
        for (let orb of this.orbs) {
            orb.pulse += deltaTime * 0.005;
        }

        // Tady později přibude logika magnetu k hráči
    }

    draw(ctx) {
        const player = this.game.getModule('player');
        if (!player) return;

        ctx.save();
        for (const orb of this.orbs) {
            const drawX = orb.x - player.pos.x + this.game.center.x;
            const drawY = orb.y - player.pos.y + this.game.center.y;

            // Efekt jemného pulzování velikosti a jasu
            const pulseScale = Math.sin(orb.pulse + orb.seed) * 2;
            
            ctx.shadowBlur = 10 + pulseScale;
            ctx.shadowColor = orb.color;
            ctx.fillStyle = orb.color;

            ctx.beginPath();
            ctx.arc(drawX, drawY, orb.size + pulseScale/2, 0, Math.PI * 2);
            ctx.fill();

            // Malý bílý odlesk uprostřed pro "skleněný" vzhled
            ctx.fillStyle = '#ffffffaa';
            ctx.beginPath();
            ctx.arc(drawX - orb.size/4, drawY - orb.size/4, orb.size/4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}