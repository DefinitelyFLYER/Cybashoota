import { SYNERGIES, getSynergyById } from '../data/SynergyData.js';

export default class SynergyManager {
    constructor() {
        this.discoveryStorageKey = 'cyberpunk_discovered_synergies';
        this.activeSynergies = new Set();
        this.discoveredSynergies = new Set(this._loadDiscovered());

        // Runtime state for synergy effects
        this.aegisInterceptCount = 0;
        this.juggernautBuffTimer = 0;
        this.cyberOverloadTimer = 0;
        this.ghostwireTimer = 0;
        this.ghostwireDodgeApplied = false;
        this.bunkerBusterApplied = false;

        // Visual effects
        this.railBeams = [];
        this.lightningArcs = [];
    }

    init(game) {
        this.game = game;
    }

    reset() {
        const player = this.game?.getModule('player');
        if (player) {
            if (this.bunkerBusterApplied) {
                player.stats.defense = Math.max(0, player.stats.defense - 1);
            }
            if (this.ghostwireDodgeApplied) {
                player.stats.dodgeChance = Math.max(0, player.stats.dodgeChance - 0.25);
            }
        }
        this.activeSynergies.clear();
        this.aegisInterceptCount = 0;
        this.juggernautBuffTimer = 0;
        this.cyberOverloadTimer = 0;
        this.ghostwireTimer = 0;
        this.ghostwireDodgeApplied = false;
        this.bunkerBusterApplied = false;
        this.railBeams = [];
        this.lightningArcs = [];
    }

    _loadDiscovered() {
        try {
            const raw = localStorage.getItem(this.discoveryStorageKey);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    _saveDiscovered() {
        try {
            localStorage.setItem(this.discoveryStorageKey, JSON.stringify([...this.discoveredSynergies]));
        } catch {
            // ignore storage errors
        }
    }

    _buildContext() {
        const augmentMgr = this.game?.getModule('augments');
        const droneMgr = this.game?.getModule('drones');
        const hackMgr = this.game?.getModule('hack');
        const upgradeMgr = this.game?.getModule('upgrades');

        return {
            augmentMgr,
            typeCounts: augmentMgr ? augmentMgr.getActiveTypes() : {},
            drones: droneMgr?.drones || [],
            hacks: hackMgr?.unlockedHacks || [],
            inventory: upgradeMgr?.inventory || {}
        };
    }

    evaluateSynergies(notify = true) {
        if (!this.game) return;
        const ctx = this._buildContext();
        const ui = this.game.getModule('ui');
        const particles = this.game.getModule('particles');
        const player = this.game.getModule('player');

        for (const syn of SYNERGIES) {
            const met = syn.requirements.every(req => req.check(ctx));
            const wasActive = this.activeSynergies.has(syn.id);

            if (met && !wasActive) {
                this.activeSynergies.add(syn.id);
                if (!this.discoveredSynergies.has(syn.id)) {
                    this.discoveredSynergies.add(syn.id);
                    this._saveDiscovered();
                }
                const codex = this.game.getModule('codex');
                if (codex) codex.discover('synergies', syn.id);
                if (notify && ui && ui.showNotification) {
                    ui.showNotification(`SYNERGY ACTIVE: ${syn.name.toUpperCase()}!`, syn.color);
                }
                if (notify && particles && player) {
                    particles.emit(player.pos.x, player.pos.y, syn.color, 22);
                }
            } else if (!met && wasActive) {
                this.activeSynergies.delete(syn.id);
            }
        }

        // Sync Bunker Buster +1 Defense
        if (player) {
            const hasBunker = this.activeSynergies.has('bunker_buster');
            if (hasBunker && !this.bunkerBusterApplied) {
                player.stats.defense += 1;
                this.bunkerBusterApplied = true;
            } else if (!hasBunker && this.bunkerBusterApplied) {
                player.stats.defense = Math.max(0, player.stats.defense - 1);
                this.bunkerBusterApplied = false;
            }
        }
    }

    hasSynergy(id) {
        return this.activeSynergies.has(id);
    }

    isDiscovered(id) {
        return this.discoveredSynergies.has(id);
    }

    getActiveSynergyList() {
        return SYNERGIES.filter(s => this.activeSynergies.has(s.id));
    }

    getRequirementStatuses(synergy) {
        const ctx = this._buildContext();
        return synergy.requirements.map(req => ({
            label: req.label,
            revealedInHint: req.revealedInHint,
            met: req.check(ctx)
        }));
    }

    update(deltaTime) {
        this.evaluateSynergies(true);

        if (this.juggernautBuffTimer > 0) {
            this.juggernautBuffTimer = Math.max(0, this.juggernautBuffTimer - deltaTime);
        }
        if (this.cyberOverloadTimer > 0) {
            this.cyberOverloadTimer = Math.max(0, this.cyberOverloadTimer - deltaTime);
        }
        if (this.ghostwireTimer > 0) {
            this.ghostwireTimer = Math.max(0, this.ghostwireTimer - deltaTime);
            if (this.ghostwireTimer === 0 && this.ghostwireDodgeApplied) {
                const player = this.game?.getModule('player');
                if (player) {
                    player.stats.dodgeChance = Math.max(0, player.stats.dodgeChance - 0.25);
                }
                this.ghostwireDodgeApplied = false;
            }
        }

        for (let i = this.railBeams.length - 1; i >= 0; i--) {
            this.railBeams[i].life -= deltaTime;
            if (this.railBeams[i].life <= 0) {
                this.railBeams.splice(i, 1);
            }
        }

        for (let i = this.lightningArcs.length - 1; i >= 0; i--) {
            this.lightningArcs[i].life -= deltaTime;
            if (this.lightningArcs[i].life <= 0) {
                this.lightningArcs.splice(i, 1);
            }
        }
    }

    addRailBeam(x1, y1, x2, y2, color = '#ff0055') {
        this.railBeams.push({
            x1, y1, x2, y2, color,
            life: 260,
            maxLife: 260
        });
    }

    addLightningArc(x1, y1, x2, y2, color = '#00bcff') {
        const segments = 5;
        const points = [{ x: x1, y: y1 }];
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const jitter = 18;
            points.push({
                x: x1 + (x2 - x1) * t + (Math.random() - 0.5) * jitter,
                y: y1 + (y2 - y1) * t + (Math.random() - 0.5) * jitter
            });
        }
        points.push({ x: x2, y: y2 });

        this.lightningArcs.push({
            points,
            color,
            life: 180,
            maxLife: 180
        });
    }

    triggerCyberOverload() {
        if (!this.hasSynergy('cyber_overload')) return;
        const hackMgr = this.game?.getModule('hack');
        if (hackMgr) {
            hackMgr.cooldownTimer = 0;
        }
        this.cyberOverloadTimer = 5000;
    }

    triggerGhostwire() {
        if (!this.hasSynergy('ghostwire')) return;
        const player = this.game?.getModule('player');
        if (player && !this.ghostwireDodgeApplied) {
            player.stats.dodgeChance += 0.25;
            this.ghostwireDodgeApplied = true;
        }
        this.ghostwireTimer = 4000;
    }

    onAegisIntercept() {
        if (!this.hasSynergy('solar_aegis')) return;
        this.aegisInterceptCount += 1;
        if (this.aegisInterceptCount >= 4) {
            this.aegisInterceptCount = 0;
            const player = this.game?.getModule('player');
            if (player && typeof player.getMaxArmor === 'function') {
                const maxArmor = player.getMaxArmor();
                if (maxArmor > 0 && player.armorCharges < maxArmor) {
                    player.armorCharges += 1;
                    const particles = this.game?.getModule('particles');
                    if (particles) {
                        particles.emit(player.pos.x, player.pos.y, '#ff9900', 12);
                    }
                }
            }
        }
    }

    onArmorBroken(player) {
        if (!this.hasSynergy('juggernaut_fortress') || !player) return;

        this.juggernautBuffTimer = 3000;
        const projMgr = this.game?.getModule('projectiles');
        if (projMgr) {
            const count = 12;
            const speed = player.getStat('bulletSpeed') * 1.1;
            const dmg = Math.max(2, player.getStat('damage') * 1.5);
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i;
                projMgr.projectiles.push({
                    x: player.pos.x,
                    y: player.pos.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 12,
                    life: 1400,
                    isCrit: false,
                    bounces: 0,
                    penetration: 1,
                    color: '#ff7b00',
                    damage: dmg,
                    hitEnemies: new Set(),
                    lastHitEnemy: null
                });
            }
        }
    }

    draw(ctx) {
        const player = this.game?.getModule('player');
        if (!player) return;

        // Draw Orbital Railcannon beams
        for (const beam of this.railBeams) {
            const alpha = Math.max(0, beam.life / beam.maxLife);
            const sx1 = beam.x1 - player.pos.x + this.game.center.x;
            const sy1 = beam.y1 - player.pos.y + this.game.center.y;
            const sx2 = beam.x2 - player.pos.x + this.game.center.x;
            const sy2 = beam.y2 - player.pos.y + this.game.center.y;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = beam.color;
            ctx.shadowBlur = 22;
            ctx.shadowColor = beam.color;
            ctx.lineWidth = 10 * alpha;
            ctx.beginPath();
            ctx.moveTo(sx1, sy1);
            ctx.lineTo(sx2, sy2);
            ctx.stroke();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3 * alpha;
            ctx.beginPath();
            ctx.moveTo(sx1, sy1);
            ctx.lineTo(sx2, sy2);
            ctx.stroke();
            ctx.restore();
        }

        // Draw Tesla Coil lightning arcs
        for (const arc of this.lightningArcs) {
            const alpha = Math.max(0, arc.life / arc.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = arc.color;
            ctx.shadowBlur = 14;
            ctx.shadowColor = arc.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            arc.points.forEach((pt, idx) => {
                const sx = pt.x - player.pos.x + this.game.center.x;
                const sy = pt.y - player.pos.y + this.game.center.y;
                if (idx === 0) ctx.moveTo(sx, sy);
                else ctx.lineTo(sx, sy);
            });
            ctx.stroke();
            ctx.restore();
        }

        // Draw Chrono-Mirage phantom turret clones when Ghost Protocol is active
        if (player.ghostActive && this.hasSynergy('chrono_mirage')) {
            const offsets = [
                { x: -46, y: -22 },
                { x: 46, y: -22 }
            ];
            for (const off of offsets) {
                const sx = this.game.center.x + off.x;
                const sy = this.game.center.y + off.y;
                ctx.save();
                ctx.globalAlpha = 0.55;
                ctx.shadowBlur = 14;
                ctx.shadowColor = '#00ffcc';
                ctx.strokeStyle = '#00ffcc';
                ctx.fillStyle = 'rgba(0, 255, 204, 0.25)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(sx, sy, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        }
    }
}
