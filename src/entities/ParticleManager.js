import { GLITCH_EFFECT_CONFIG } from '../data/HackData.js';

export default class ParticleManager {
    constructor() {
        this.particles = [];
        this.enabled = true;
    }

    init(game) {
        this.game = game;
    }

    reset() {
        this.particles = [];
    }

    isEnabled() {
        return !this.game || !this.game.settings || this.game.settings.performance.particles;
    }

    /**
     * 
     * @param {number} x
     * @param {number} y
     * @param {string} color
     * @param {number} count
     */
    emit(x, y, color = '#ff0055', count = 10) {
        if (!this.isEnabled()) return;
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
        if (!this.isEnabled()) return;
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
        if (!this.isEnabled()) return;
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

    /**
     * Create a quick glitch burst effect at a position.
     * @param {number} x
     * @param {number} y
     */
    createGlitchEffect(x, y) {
        if (!this.isEnabled()) return;
        const conf = GLITCH_EFFECT_CONFIG.burstParticles;
        const count = conf.countMin + Math.floor(Math.random() * (conf.countMax - conf.countMin + 1));

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 0.1,
                vy: (Math.random() - 0.5) * 0.1,
                life: conf.lifeMin + Math.random() * (conf.lifeMax - conf.lifeMin),
                decay: conf.decayMin + Math.random() * (conf.decayMax - conf.decayMin),
                color: conf.colors[Math.floor(Math.random() * conf.colors.length)],
                width: conf.sizeMin + Math.random() * (conf.sizeMax - conf.sizeMin),
                height: conf.sizeMin + Math.random() * (conf.sizeMax - conf.sizeMin),
                type: 'glitch'
            });
        }
    }

    /**
     * Spawn a continuous glitch tick particle cluster around a position.
     * @param {number} x
     * @param {number} y
     * @param {number} radius
     */
    spawnGlitchTick(x, y, radius) {
        if (!this.isEnabled()) return;
        const conf = GLITCH_EFFECT_CONFIG.tickParticles;
        const count = conf.countMin + Math.floor(Math.random() * (conf.countMax - conf.countMin + 1));

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            const px = x + Math.cos(angle) * distance;
            const py = y + Math.sin(angle) * distance;

            this.particles.push({
                x: px,
                y: py,
                vx: 0,
                vy: 0,
                life: conf.life,
                decay: conf.decayMin + Math.random() * (conf.decayMax - conf.decayMin),
                color: conf.colors[Math.floor(Math.random() * conf.colors.length)],
                size: conf.sizeMin + Math.random() * (conf.sizeMax - conf.sizeMin),
                type: 'glitchTick'
            });
        }
    }

    update(deltaTime) {
        if (!this.isEnabled()) {
            this.particles = [];
            return;
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            if (p.type === 'glitch' || p.type === 'glitchTick') {
                p.x += (p.vx || 0) * deltaTime + (Math.random() - 0.5) * 2;
                p.y += (p.vy || 0) * deltaTime + (Math.random() - 0.5) * 2;
            } else {
                p.x += p.vx * deltaTime;
                p.y += p.vy * deltaTime;
            }

            p.life -= p.decay * deltaTime;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        if (!this.isEnabled()) {
            return;
        }

        const player = this.game.getModule('player');
        const center = this.game.center;
        if (!player) return;

        ctx.save();
        for (const p of this.particles) {
            const drawX = p.x - player.pos.x + center.x;
            const drawY = p.y - player.pos.y + center.y;

            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;

            if (p.type === 'glitch' || p.type === 'glitchTick') {
                const w = p.width || p.size || 2;
                const h = p.height || p.size || 2;
                ctx.fillRect(drawX - w * 0.5, drawY - h * 0.5, w, h);
            } else {
                ctx.beginPath();
                ctx.arc(drawX, drawY, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }
}