export default class ExperienceManager {
    constructor() {
        this.orbs = [];
        this.totalXp = 0;
    }

    init(game) {
        this.game = game;
    }

    reset() {
        this.orbs = [];
        this.totalXp = 0;
    }

    spawnOrb(x, y, value, color) {
        this.orbs.push({
            x: x,
            y: y,
            value: value,
            color: color,
            size: 6 + (value / 20),
            pulse: 0,
            seed: Math.random() * Math.PI * 2
        });
    }

    update(deltaTime) {
        const player = this.game.getModule('player');
        if (!player) return;

        const center = player.getCenter();
        
        const magnetRangePx = player.getStat('magnetRange') * this.game.UNIT_SIZE;
        const pickupRangePx = 0.25 * this.game.UNIT_SIZE;
        const magnetSpeed = 0.6;

        for (let i = this.orbs.length - 1; i >= 0; i--) {
            const orb = this.orbs[i];
            orb.pulse += deltaTime * 0.005;

            const dx = center.x - orb.x;
            const dy = center.y - orb.y;
            const distPx = Math.sqrt(dx * dx + dy * dy);

            if (distPx < magnetRangePx) {
                orb.x += (dx / distPx) * magnetSpeed * deltaTime;
                orb.y += (dy / distPx) * magnetSpeed * deltaTime;
            }

            if (distPx < pickupRangePx) {
                player.addXp(orb.value);
                this.orbs.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        const player = this.game.getModule('player');
        if (!player) return;

        ctx.save();
        for (const orb of this.orbs) {
            const drawX = orb.x - player.pos.x + this.game.center.x;
            const drawY = orb.y - player.pos.y + this.game.center.y;

            const pulseScale = Math.sin(orb.pulse + orb.seed) * 2;
            
            ctx.shadowBlur = 10 + pulseScale;
            ctx.shadowColor = orb.color;
            ctx.fillStyle = orb.color;

            ctx.beginPath();
            ctx.arc(drawX, drawY, orb.size + pulseScale/2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffffaa';
            ctx.beginPath();
            ctx.arc(drawX - orb.size/4, drawY - orb.size/4, orb.size/4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}