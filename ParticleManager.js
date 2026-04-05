/**
 * ParticleManager.js - Vizuální efekty a exploze
 */
export default class ParticleManager {
    constructor() {
        this.particles = [];
    }

    init(game) {
        this.game = game;
    }

    /**
     * Vytvoří explozi na daných souřadnicích
     * @param {number} x - pozice X
     * @param {number} y - pozice Y
     * @param {string} color - barva částic (hex)
     * @param {number} count - počet částic
     */
    emit(x, y, color = '#ff0055', count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 0.4, // Náhodná rychlost X
                vy: (Math.random() - 0.5) * 0.4, // Náhodná rychlost Y
                life: 1.0, // Životnost (1.0 = 100%)
                decay: 0.002 + Math.random() * 0.003, // Jak rychle mizí
                color: color,
                size: 1 + Math.random() * 3
            });
        }
    }

    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Pohyb
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            
            // Stárnutí
            p.life -= p.decay * deltaTime;

            // Odstranění mrtvých částic
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save(); // Uložíme stav kontextu
        for (const p of this.particles) {
            ctx.globalAlpha = p.life; // Částice postupně zprůhlední
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 5;
            ctx.shadowColor = p.color;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore(); // Vrátíme stav (reset alpha a stínů)
    }
}