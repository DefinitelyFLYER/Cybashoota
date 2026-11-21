import { HACK_DATA, getUnlockedHackIds, resetHacks, GLITCH_PHASES } from '../data/HackData.js';

export default class HackManager {
    constructor() {
        this.signalJammerTimeout = null;
        this.activeDecoy = null;
        this.overloadFlashTimer = 0;
        this.HACK_TYPES = {
            [HACK_DATA.OVERLOAD.id]: {
                id: HACK_DATA.OVERLOAD.id,
                name: HACK_DATA.OVERLOAD.name,
                execute: (game) => {
                    const enemyManager = game.getModule('enemies');
                    if (!enemyManager || !enemyManager.enemies) return false;

                    const synergyMgr = game.getModule('synergies');
                    const player = game.getModule('player');
                    const particles = game.getModule('particles');
                    const hasOverloadBarrage = synergyMgr && synergyMgr.hasSynergy('overload_barrage');
                    const overloadDmg = hasOverloadBarrage ? 10 : 5;

                    let fxCount = 0;
                    for (const enemy of enemyManager.enemies) {
                        enemy.currentHp = Math.max(0, (enemy.currentHp || 0) - overloadDmg);
                        enemy.speedModifier = 0.3;
                        enemy.hackDebuffTimer = 4000;
                        if (particles && fxCount < 30) {
                            particles.emit(enemy.x, enemy.y, '#ff0055', 6);
                            fxCount++;
                        }
                    }
                    this.overloadFlashTimer = 380;
                    if (player && typeof player.triggerShockwave === 'function') {
                        player.triggerShockwave({ maxRadius: 950, duration: 550, damage: 0, color: '#ff0055' });
                    }
                    if (hasOverloadBarrage && player) {
                        player.overloadBarrageTimer = 4000;
                    }

                    // Synergy: EMP Singularity (pull enemies toward cursor & detonate 12 DMG nova)
                    if (synergyMgr && synergyMgr.hasSynergy('emp_singularity') && player) {
                        const proj = game.getModule('projectiles');
                        const input = game.getModule('input');
                        const screenX = proj && typeof proj.crosshairX === 'number' ? proj.crosshairX : (input?.mouseX || game.center.x);
                        const screenY = proj && typeof proj.crosshairY === 'number' ? proj.crosshairY : (input?.mouseY || game.center.y);
                        const cursorWorldX = screenX + player.pos.x - game.center.x;
                        const cursorWorldY = screenY + player.pos.y - game.center.y;

                        for (const enemy of enemyManager.enemies) {
                            if (enemy.currentHp <= 0) continue;
                            const dx = cursorWorldX - enemy.x;
                            const dy = cursorWorldY - enemy.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist < 420 && dist > 1) {
                                enemy.x += dx * 0.45;
                                enemy.y += dy * 0.45;
                            }
                            if (dist < 200) {
                                enemy.currentHp = Math.max(0, enemy.currentHp - 12);
                            }
                        }
                        if (particles) {
                            particles.emit(cursorWorldX, cursorWorldY, '#ff55aa', 35);
                        }
                    }

                    // Synergy: Tesla Coil (lightning storm from player & Assault Drone)
                    if (synergyMgr && synergyMgr.hasSynergy('tesla_coil') && player) {
                        const droneMgr = game.getModule('drones');
                        const origins = [{ x: player.pos.x, y: player.pos.y }];
                        if (droneMgr && droneMgr.drones) {
                            for (const d of droneMgr.drones) {
                                if (d.id === 'BASIC_SHOOTER') origins.push({ x: d.x, y: d.y });
                            }
                        }
                        for (const origin of origins) {
                            const nearby = enemyManager.enemies
                                .filter(e => e.currentHp > 0 && ((e.x - origin.x) ** 2 + (e.y - origin.y) ** 2) <= 350 * 350)
                                .slice(0, 4);
                            for (const target of nearby) {
                                target.currentHp = Math.max(0, target.currentHp - 4);
                                synergyMgr.addLightningArc(origin.x, origin.y, target.x, target.y, '#00bcff');
                            }
                        }
                    }

                    return true;
                }
            },
            [HACK_DATA.GLITCH_EM.id]: {
                id: HACK_DATA.GLITCH_EM.id,
                name: HACK_DATA.GLITCH_EM.name,
                execute: (game) => {
                    const enemyManager = game.getModule('enemies');
                    const input = game.getModule('input');
                    const proj = game.getModule('projectiles');
                    const player = game.getModule('player');
                    if (!enemyManager || !enemyManager.enemies || enemyManager.enemies.length === 0 || !input || !player) return false;

                    const targetX = proj && typeof proj.crosshairX === 'number' ? proj.crosshairX : (input.mouseX || 0);
                    const targetY = proj && typeof proj.crosshairY === 'number' ? proj.crosshairY : (input.mouseY || 0);
                    let closestEnemy = null;
                    let closestDistance = Infinity;

                    for (const enemy of enemyManager.enemies) {
                        if (enemy.currentHp <= 0) continue;

                        const screenX = enemy.x - player.pos.x + game.center.x;
                        const screenY = enemy.y - player.pos.y + game.center.y;
                        const dx = screenX - targetX;
                        const dy = screenY - targetY;
                        const distance = dx * dx + dy * dy;

                        if (distance < closestDistance) {
                            closestDistance = distance;
                            closestEnemy = enemy;
                        }
                    }

                    if (!closestEnemy) return false;
                    closestEnemy.glitchPhase = GLITCH_PHASES.PRIMARY;
                    return true;
                }
            },
            [HACK_DATA.SIGNAL_JAMMER.id]: {
                id: HACK_DATA.SIGNAL_JAMMER.id,
                name: HACK_DATA.SIGNAL_JAMMER.name,
                execute: (game) => {
                    if (!game) return false;
                    const projectileManager = game.getModule('projectiles');
                    if (projectileManager) {
                        projectileManager.projectiles = [];
                        projectileManager.enemyProjectiles = [];
                    }
                    game.isSignalJammed = true;
                    if (this.signalJammerTimeout) {
                        clearTimeout(this.signalJammerTimeout);
                    }
                    this.signalJammerTimeout = setTimeout(() => {
                        if (game) game.isSignalJammed = false;
                        this.signalJammerTimeout = null;
                    }, HACK_DATA.SIGNAL_JAMMER.durationMs);
                    return true;
                }
            },
            [HACK_DATA.GHOST_PROTOCOL.id]: {
                id: HACK_DATA.GHOST_PROTOCOL.id,
                name: HACK_DATA.GHOST_PROTOCOL.name,
                execute: (game) => {
                    const player = game.getModule('player');
                    if (!player) return false;

                    player.ghostActive = true;
                    player.ghostTimer = HACK_DATA.GHOST_PROTOCOL.durationMs;
                    return true;
                }
            },
            [HACK_DATA.DATA_SIPHON.id]: {
                id: HACK_DATA.DATA_SIPHON.id,
                name: HACK_DATA.DATA_SIPHON.name,
                execute: (game) => {
                    const player = game.getModule('player');
                    if (!player) return false;

                    const expMgr = game.getModule('experience');
                    const powerMgr = game.getModule('powerups');
                    const augmentMgr = game.getModule('augments');
                    const enemyMgr = game.getModule('enemies');
                    const synergyMgr = game.getModule('synergies');
                    const particles = game.getModule('particles');

                    const hasNanoHarvest = synergyMgr && synergyMgr.hasSynergy('nano_harvest');
                    if (synergyMgr && synergyMgr.hasSynergy('scrap_alchemist') && augmentMgr) {
                        augmentMgr.scrap += 2;
                    }

                    if (expMgr && expMgr.orbs) {
                        for (const orb of expMgr.orbs) {
                            orb.x = player.pos.x;
                            orb.y = player.pos.y;
                            if (hasNanoHarvest && augmentMgr && Math.random() < 0.03) {
                                augmentMgr.scrap += 1;
                            }
                        }
                    }
                    if (powerMgr && powerMgr.drops) {
                        for (const d of powerMgr.drops) {
                            d.x = player.pos.x;
                            d.y = player.pos.y;
                        }
                    }
                    if (augmentMgr && augmentMgr.scrapDrops) {
                        for (const s of augmentMgr.scrapDrops) {
                            s.x = player.pos.x;
                            s.y = player.pos.y;
                        }
                    }

                    if (enemyMgr && enemyMgr.enemies) {
                        const bonusXp = enemyMgr.enemies.length * HACK_DATA.DATA_SIPHON.xpPerEnemy;
                        if (bonusXp > 0) player.addXp(bonusXp);
                    }

                    if (particles) {
                        particles.emit(player.pos.x, player.pos.y, '#00ff66', 25);
                    }
                    return true;
                }
            },
            [HACK_DATA.HOLO_DECOY.id]: {
                id: HACK_DATA.HOLO_DECOY.id,
                name: HACK_DATA.HOLO_DECOY.name,
                execute: (game) => {
                    const player = game.getModule('player');
                    const proj = game.getModule('projectiles');
                    const input = game.getModule('input');
                    if (!player) return false;

                    const screenX = proj && typeof proj.crosshairX === 'number' ? proj.crosshairX : (input?.mouseX || game.center.x);
                    const screenY = proj && typeof proj.crosshairY === 'number' ? proj.crosshairY : (input?.mouseY || game.center.y);
                    const worldX = screenX + player.pos.x - game.center.x;
                    const worldY = screenY + player.pos.y - game.center.y;

                    this.activeDecoy = {
                        x: worldX,
                        y: worldY,
                        remaining: HACK_DATA.HOLO_DECOY.durationMs,
                        duration: HACK_DATA.HOLO_DECOY.durationMs,
                        fireTimer: 0,
                        pulse: 0
                    };
                    return true;
                }
            }
        };

        this.unlockedHacks = getUnlockedHackIds();
        this.activeHack = this.unlockedHacks.length > 0 ? this.unlockedHacks[0] : null;

        this.cooldownTimer = 0;
        this.cooldownDuration = 20000;
    }

    init(game) {
        this.game = game;
    }

    reset() {
        resetHacks();
        this.unlockedHacks = [];
        this.activeHack = null;
        this.cooldownTimer = 0;
        this.activeDecoy = null;
        if (this.signalJammerTimeout) {
            clearTimeout(this.signalJammerTimeout);
            this.signalJammerTimeout = null;
        }
    }

    unlockHack(hackId) {
        if (!HACK_DATA[hackId]) return;

        const player = this.game?.getModule('player');
        const maxSlots = player ? Math.max(1, Math.floor(player.getStat('maxHackSlots'))) : 1;

        if (!this.unlockedHacks.includes(hackId)) {
            while (this.unlockedHacks.length >= maxSlots && this.unlockedHacks.length > 0) {
                const replaceIdx = this.activeHack && this.unlockedHacks.includes(this.activeHack)
                    ? this.unlockedHacks.indexOf(this.activeHack)
                    : 0;
                const removedId = this.unlockedHacks.splice(replaceIdx, 1)[0];
                if (HACK_DATA[removedId]) {
                    HACK_DATA[removedId].unlocked = false;
                }
                this._clearUnlockUpgradeFromInventory(removedId);
            }
            this.unlockedHacks.push(hackId);
        }

        HACK_DATA[hackId].unlocked = true;
        this.activeHack = hackId;
        const codex = this.game?.getModule('codex');
        if (codex) codex.discover('hacks', hackId);
    }

    removeHack(hackId) {
        const idx = this.unlockedHacks.indexOf(hackId);
        if (idx === -1) return false;

        this.unlockedHacks.splice(idx, 1);
        if (HACK_DATA[hackId]) {
            HACK_DATA[hackId].unlocked = false;
        }
        this._clearUnlockUpgradeFromInventory(hackId);

        if (this.activeHack === hackId) {
            this.activeHack = this.unlockedHacks.length > 0 ? this.unlockedHacks[0] : null;
        }
        return true;
    }

    _clearUnlockUpgradeFromInventory(hackId) {
        const upgrades = this.game?.getModule('upgrades');
        if (!upgrades || !upgrades.inventory) return;
        const map = {
            OVERLOAD: 'unlock_overload',
            GLITCH_EM: 'unlock_glitch_em',
            SIGNAL_JAMMER: 'unlock_signal_jammer',
            GHOST_PROTOCOL: 'unlock_ghost_protocol',
            DATA_SIPHON: 'unlock_data_siphon',
            HOLO_DECOY: 'unlock_holo_decoy'
        };
        const upgId = map[hackId];
        if (upgId && upgrades.inventory[upgId]) {
            delete upgrades.inventory[upgId];
        }
    }

    update(deltaTime) {
        const player = this.game.getModule('player');
        if (player) {
            const maxSlots = Math.max(1, Math.floor(player.getStat('maxHackSlots')));
            while (this.unlockedHacks.length > maxSlots) {
                const removedId = this.unlockedHacks.pop();
                if (HACK_DATA[removedId]) {
                    HACK_DATA[removedId].unlocked = false;
                }
                this._clearUnlockUpgradeFromInventory(removedId);
            }
            if (this.unlockedHacks.length > 0) {
                if (!this.unlockedHacks.includes(this.activeHack)) {
                    this.activeHack = this.unlockedHacks[0];
                }
            } else {
                this.activeHack = null;
            }
        }

        const input = this.game.getModule('input');
        const gamepad = this.game.getModule('gamepad');
        const hackPressed = (input && input.isHackPressed) || (gamepad && gamepad.justPressed && gamepad.justPressed.X);
        const cyclePressed = (input && input.isHackCyclePressed) || (gamepad && gamepad.justPressed && gamepad.justPressed.Y);

        if (hackPressed) {
            this.executeHack();
            if (input) input.isHackPressed = false;
        }

        if (cyclePressed) {
            if (input) input.isHackCyclePressed = false;
            if (this.unlockedHacks.length > 0) {
                const currentIndex = this.unlockedHacks.indexOf(this.activeHack);
                const nextIndex = (currentIndex + 1) % this.unlockedHacks.length;
                this.activeHack = this.unlockedHacks[nextIndex];
            }
        }

        if (this.overloadFlashTimer > 0) {
            this.overloadFlashTimer = Math.max(0, this.overloadFlashTimer - deltaTime);
        }
        if (this.cooldownTimer > 0) {
            this.cooldownTimer -= deltaTime;
            if (this.cooldownTimer <= 0) {
                this.cooldownTimer = 0;
            }
        }

        if (this.activeDecoy) {
            this._updateDecoy(deltaTime);
        }
    }

    _updateDecoy(deltaTime) {
        const d = this.activeDecoy;
        d.remaining -= deltaTime;
        d.pulse += deltaTime * 0.008;

        const synergyMgr = this.game?.getModule('synergies');
        const hasMirageDetonator = synergyMgr && synergyMgr.hasSynergy('mirage_detonator');

        // Synergy: Mirage Detonator fires 8 homing Glitch bullets every 1.5s
        if (hasMirageDetonator) {
            d.fireTimer += deltaTime;
            if (d.fireTimer >= 1500) {
                d.fireTimer = 0;
                const pm = this.game?.getModule('projectiles');
                const player = this.game?.getModule('player');
                if (pm) {
                    const speed = player ? player.getStat('bulletSpeed') : 0.9;
                    const dmg = Math.max(1.5, (player ? player.getStat('damage') : 1) * 1.2);
                    for (let i = 0; i < 8; i++) {
                        const a = (Math.PI * 2 / 8) * i;
                        pm.projectiles.push({
                            x: d.x,
                            y: d.y,
                            vx: Math.cos(a) * speed,
                            vy: Math.sin(a) * speed,
                            size: 8,
                            life: 1600,
                            isCrit: false,
                            isHoming: true,
                            bounces: 0,
                            penetration: 0,
                            color: '#ff00ff',
                            damage: dmg,
                            hitEnemies: new Set(),
                            lastHitEnemy: null
                        });
                    }
                }
            }
        }

        if (d.remaining <= 0) {
            const enemyMgr = this.game?.getModule('enemies');
            const particles = this.game?.getModule('particles');
            const radius = HACK_DATA.HOLO_DECOY.explosionRadius;
            const hasDecoySynergy = synergyMgr && synergyMgr.hasSynergy('decoys_from_hell');
            const dmg = (hasMirageDetonator ? 30 : HACK_DATA.HOLO_DECOY.explosionDamage) * (hasDecoySynergy ? 2 : 1);

            if (enemyMgr && enemyMgr.enemies) {
                for (const e of enemyMgr.enemies) {
                    if (e.currentHp <= 0) continue;
                    const dist = Math.hypot(e.x - d.x, e.y - d.y);
                    if (dist <= radius) {
                        e.currentHp = Math.max(0, e.currentHp - dmg);
                        if (hasMirageDetonator) {
                            e.glitchPhase = GLITCH_PHASES.PRIMARY;
                        }
                    }
                }
            }
            if (particles) {
                particles.emit(d.x, d.y, '#00ffcc', 35);
            }
            this.activeDecoy = null;
        }
    }

    draw(ctx) {
        if (this.overloadFlashTimer > 0 && this.game?.canvas) {
            const alpha = Math.min(0.42, (this.overloadFlashTimer / 380) * 0.42);
            const w = this.game.canvas.width;
            const h = this.game.canvas.height;
            ctx.save();
            ctx.fillStyle = `rgba(255, 0, 85, ${alpha * 0.55})`;
            ctx.fillRect(0, 0, w, h);
            ctx.strokeStyle = `rgba(0, 255, 204, ${alpha * 1.4})`;
            ctx.lineWidth = 6;
            ctx.strokeRect(3, 3, w - 6, h - 6);
            ctx.restore();
        }
        if (!this.activeDecoy) return;
        const player = this.game?.getModule('player');
        if (!player) return;

        const d = this.activeDecoy;
        const sx = d.x - player.pos.x + this.game.center.x;
        const sy = d.y - player.pos.y + this.game.center.y;
        const secs = Math.ceil(d.remaining / 1000);
        const r = 24 + Math.sin(d.pulse) * 3;

        ctx.save();
        ctx.globalAlpha = 0.75;
        ctx.strokeStyle = '#00ffcc';
        ctx.fillStyle = 'rgba(0, 255, 204, 0.18)';
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#00ffcc';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "VT323", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`DECOY ${secs}s`, sx, sy - r - 8);
        ctx.restore();
    }

    executeHack() {
        const player = this.game?.getModule('player');
        if (player && (player.empDisruptedTimer || 0) > 0) {
            return false;
        }
        if (this.cooldownTimer > 0 || !this.activeHack) {
            return false;
        }

        const hack = this.HACK_TYPES[this.activeHack];
        if (!hack || typeof hack.execute !== 'function') {
            return false;
        }

        const result = hack.execute(this.game);
        if (!result) {
            return false;
        }

        const augmentMgr = this.game?.getModule('augments');
        const synergyMgr = this.game?.getModule('synergies');
        let cdMulti = augmentMgr ? augmentMgr.getHackCooldownMultiplier() : 1.0;
        if (this.activeHack === 'GLITCH_EM' && synergyMgr && synergyMgr.hasSynergy('glitch_nova')) {
            cdMulti *= 0.6;
        }
        if (synergyMgr && synergyMgr.hasSynergy('ghostwire')) {
            cdMulti *= 0.75;
            synergyMgr.triggerGhostwire();
        }
        if (player && player.stats.hackCooldownMulti !== undefined) {
            cdMulti *= Math.max(0.25, player.stats.hackCooldownMulti);
        }
        this.cooldownTimer = this.cooldownDuration * cdMulti;
        const audio = this.game?.getModule('audio');
        if (audio) audio.play(this.activeHack === 'OVERLOAD' ? 'overload' : 'hack');
        if (augmentMgr) {
            augmentMgr.onHackExecuted();
        }
        return true;
    }
}
