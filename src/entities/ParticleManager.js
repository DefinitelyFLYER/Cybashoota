export default class ParticleManager {
    constructor() {
        this.particles = [];
    }

    init(game) {
        this.game = game;
    }

    /**
     * 
     * @param {number} x
     * @param {number} y
     * @param {string} color
     * @param {number} count
     */
    emit(x, y, color = '#ff0055', count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                life: 1.0,
                decay: 0.002 + Math.random() * 0.003,
                color: color,
                size: 1 + Math.random() * 3
            });
        }
    }

    /**
     * 
     * @param {number} x
     * @param {number} y
     * @param {number} angle
     * @param {string} color
     * @param {number} count
     */
    emitMuzzle(x, y, angle, color = '#00ffcc', count = 15) {
        for (let i = 0; i < count; i++) {
            const spread = (Math.random() - 0.5) * 0.5;
            const finalAngle = angle + spread;
            
            const speed = 0.14 + Math.random() * 0.2;

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(finalAngle) * speed,
                vy: Math.sin(finalAngle) * speed,
                life: 0.6 + Math.random() * 0.4,
                decay: 0.001 + Math.random() * 0.006,
                color: Math.random() > 0.5 ? color : '#ff9d00',
                size: 0.5 + Math.random() * 1.5
            });
        }
    }


    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {string} color
     */
    emitTrail(x, y, color = '#00ffcc') {
        this.particles.push({
            x: x + (Math.random() - 0.5) * 4,
            y: y + (Math.random() - 0.5) * 4,
            vx: (Math.random() - 0.5) * 0.02,
            vy: (Math.random() - 0.5) * 0.02,
            life: 0.5 + Math.random() * 0.2,
            decay: 0.002 + Math.random() * 0.002,
            color: color,
            size: 0.5 + Math.random() * 1.5
        });
    }

    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            
            p.life -= p.decay * deltaTime;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        const player = this.game.getModule('player');
        const center = this.game.center;
        if (!player) return;

        ctx.save();
        for (const p of this.particles) {
            const drawX = p.x - player.pos.x + center.x;
            const drawY = p.y - player.pos.y + center.y;

            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(drawX, drawY, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}