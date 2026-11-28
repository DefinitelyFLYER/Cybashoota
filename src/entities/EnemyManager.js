import { ENEMY_TYPES } from '../data/EnemyTypes.js';
import { GLITCH_EFFECT_CONFIG, GLITCH_PHASES } from '../data/HackData.js';

export default class EnemyManager {
    constructor() {
        this.enemies = [];
        this.virusProjectiles = [];
        this.empWaves = [];
        this.spawnTimer = 0;
        this.spawnRate = 1500;
        this.sprites = new Map();
        this.outlineWidth = 3;
        this.bossWarningTimer = 0;
        this.bossWarningText = '';
        this.bossArenaCenter = null;
        this.freezeSpawns = false;
    }

    init(game) {
        this.game = game;
        this._preloadSprites();
    }

    reset() {
        this.enemies = [];
        this.virusProjectiles = [];
        this.empWaves = [];
        this.spawnTimer = 0;
        this.spawnRate = 1500;
        this.activePhase = null;
        this.bossWarningTimer = 0;
        this.bossWarningText = '';
        this.bossArenaCenter = null;
        this.freezeSpawns = false;
    }

    getActiveBoss() {
        return this.enemies.find(e => e.isBoss && e.currentHp > 0) || null;
    }

    hasActiveBoss() {
        return Boolean(this.getActiveBoss());
    }

    _preloadSprites() {
        for (const key in ENEMY_TYPES) {
            const config = ENEMY_TYPES[key];
            if (config.renderType === 'sprite' && config.sprite) {
                const img = new Image();
                img.src = config.sprite;
                this.sprites.set(config.type, img);
            }
        }
    }

    update(deltaTime) {
        const player = this.game.getModule('player');
        if (!player) return;

        const augmentMgr = this.game.getModule('augments');
        const enemyDt = deltaTime * (augmentMgr ? augmentMgr.timeSlowFactor : 1);
        if (this.bossWarningTimer > 0) {
            this.bossWarningTimer = Math.max(0, this.bossWarningTimer - deltaTime);
        }

        this._handleSpawning(deltaTime);
        this._updateEmpWaves(enemyDt);
        this._updateVirusProjectiles(enemyDt);
        const activeBoss = this.getActiveBoss();
        const bossActive = Boolean(activeBoss);
        if (bossActive) {
            const unitSize = this.game.UNIT_SIZE || 100;
            const arenaRadius = 7.0 * unitSize;
            if (!this.bossArenaCenter) {
                this.bossArenaCenter = { x: player.pos.x, y: player.pos.y };
            } else {
                const midX = (player.pos.x + activeBoss.x) * 0.5;
                const midY = (player.pos.y + activeBoss.y) * 0.5;
                const playerDist = Math.hypot(player.pos.x - this.bossArenaCenter.x, player.pos.y - this.bossArenaCenter.y);
                const outsideArena = playerDist > arenaRadius;
                const targetX = outsideArena ? player.pos.x : midX;
                const targetY = outsideArena ? player.pos.y : midY;
                const slideRate = outsideArena ? 0.0022 : 0.00022;
                const t = Math.min(1, slideRate * enemyDt);
                this.bossArenaCenter.x += (targetX - this.bossArenaCenter.x) * t;
                this.bossArenaCenter.y += (targetY - this.bossArenaCenter.y) * t;
            }
        } else if (this.bossArenaCenter) {
            this.bossArenaCenter = null;
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            const isSpectator = bossActive && !e.isBoss && !e.isBossMinion;

            this._updateEnemyTimers(e, enemyDt);
            if (!isSpectator) {
                this._handleSpecialEnemyBehavior(e, player, enemyDt);
            }
            this._applyPhysics(e, player, enemyDt, isSpectator);
            if (!isSpectator) {
                this._handleRangedAttack(e, player, enemyDt);
            }
            this._checkPlayerCollision(e, player);
            
            this._checkDroneCollisions(e, player);
            
            this._checkProjectileCollisions(e);

            if (e.glitchPhase === GLITCH_PHASES.PRIMARY || e.glitchPhase === GLITCH_PHASES.SECONDARY) {
                const particles = this.game.getModule('particles');
                const phaseMultiplier = e.glitchPhase === GLITCH_PHASES.SECONDARY ? 0.5 : 1;
                const dotDamage = GLITCH_EFFECT_CONFIG.carrierDotDamagePerMs * deltaTime * phaseMultiplier;
                e.currentHp = Math.max(0, e.currentHp - dotDamage);
                if (particles) particles.spawnGlitchTick(e.x, e.y, e.size * GLITCH_EFFECT_CONFIG.carrierTickRadiusScale);
            }

            if (e.currentHp <= 0) {
                this._handleEnemyDeath(e, i);
            }
        }
    }

    _updateEnemyTimers(e, deltaTime) {
        if (e.turboCooldown === undefined) e.turboCooldown = 0;
        if (e.turboCooldown > 0) e.turboCooldown -= deltaTime;
        if (e.hackDebuffTimer > 0) {
            e.hackDebuffTimer -= deltaTime;
            if (e.hackDebuffTimer < 0) e.hackDebuffTimer = 0;
        }
    }

    _applyPhysics(e, player, deltaTime, isSpectator = false) {
        const unitSize = this.game.UNIT_SIZE || 100;
        const unitScale = this.game.getUnitScale ? this.game.getUnitScale() : 1;
        const scaledDt = deltaTime * unitScale;

        if (isSpectator) {
            const center = this.bossArenaCenter || player.pos;
            const arenaRadius = 7.0 * unitSize;
            const dxC = center.x - e.x;
            const dyC = center.y - e.y;
            const distC = Math.hypot(dxC, dyC) || 1;
            const inX = dxC / distC;
            const inY = dyC / distC;

            // Strong inward pull toward the arena
            let moveX = inX * e.speed * 1.15;
            let moveY = inY * e.speed * 1.15;

            // Sideways-biased crowd repulsion so layers stack and slide around gaps
            let repX = 0;
            let repY = 0;
            for (const other of this.enemies) {
                if (other === e || other.currentHp <= 0 || other.isBoss || other.isBossMinion) continue;
                const ox = e.x - other.x;
                const oy = e.y - other.y;
                const minSep = (e.size + other.size) * 0.56;
                const dSq = ox * ox + oy * oy;
                if (dSq > 0 && dSq < minSep * minSep) {
                    const d = Math.sqrt(dSq);
                    const strength = ((minSep - d) / minSep) * 0.22;
                    repX += (ox / d) * strength;
                    repY += (oy / d) * strength;
                }
            }
            // Dampen outward push so back rows don't get shoved away, preserving tangential slide
            const radialDot = repX * inX + repY * inY;
            if (radialDot < 0) {
                repX -= inX * radialDot * 0.72;
                repY -= inY * radialDot * 0.72;
            }
            moveX += repX;
            moveY += repY;

            e.x += moveX * scaledDt;
            e.y += moveY * scaledDt;

            // Hard no-entry circular barrier at 7.0 units
            const postDx = e.x - center.x;
            const postDy = e.y - center.y;
            const postDist = Math.hypot(postDx, postDy) || 1;
            if (postDist < arenaRadius) {
                e.x = center.x + (postDx / postDist) * arenaRadius;
                e.y = center.y + (postDy / postDist) * arenaRadius;
            }
            return;
        }
        const stopMargin = 0.8 * unitSize;
        const innerW = (this.game.canvas.width / 2) - stopMargin;
        const innerH = (this.game.canvas.height / 2) - stopMargin;
        const turboMultiplier = 3;
        const COOLDOWN_TIME = 5000;
        
        const TELEPORT_THRESHOLD = 2.0 * unitSize; 

        const hackMgr = this.game.getModule('hack');
        const decoy = hackMgr?.activeDecoy;
        let targetX = player.pos.x;
        let targetY = player.pos.y;
        if (decoy) {
            const dDecoy = Math.hypot(decoy.x - e.x, decoy.y - e.y);
            if (dDecoy < 520) {
                targetX = decoy.x;
                targetY = decoy.y;
            }
        }

        const dxP = targetX - e.x;
        const dyP = targetY - e.y;
        const distP = Math.sqrt(dxP * dxP + dyP * dyP);
        
        const isOutsideView = Math.abs(dxP) > innerW || Math.abs(dyP) > innerH;
        
        const isDeepInFog = Math.abs(dxP) > (innerW + TELEPORT_THRESHOLD) || 
                            Math.abs(dyP) > (innerH + TELEPORT_THRESHOLD);

        if (e.kbX || e.kbY) {
            e.x += (e.kbX || 0) * deltaTime;
            e.y += (e.kbY || 0) * deltaTime;
            e.kbX *= Math.pow(0.9, deltaTime / 16);
            e.kbY *= Math.pow(0.9, deltaTime / 16);
        }

        if (e.speedModifier === undefined) e.speedModifier = 1;
        if (e.speedModifier < 1 && !(e.hackDebuffTimer > 0)) {
            e.speedModifier += deltaTime * 0.002; 
            if (e.speedModifier > 1) e.speedModifier = 1;
        }

        let isAttackingAndStopping = false;
        if (e.ranged && e.ranged.stopToShoot) {
            const rangePx = e.ranged.range * this.game.UNIT_SIZE;
            if (distP < rangePx) isAttackingAndStopping = true;
        }

        const sep = this._calculateSeparation(e);
        const soft = this._calculateSoftPlayerCollision(e, player);

        // Dasher or Boss charge override movement
        if (e.dashState === 'charging' || e.bossChargeState === 'charging' || e.bossOverloadTimer > 0) {
            e.x += sep.x * deltaTime;
            e.y += sep.y * deltaTime;
            return;
        }
        if (e.dashState === 'dashing') {
            const dSpeed = e.dasher.dashSpeed;
            e.x += e.dashDirX * dSpeed * scaledDt;
            e.y += e.dashDirY * dSpeed * scaledDt;
            return;
        }
        if (e.bossChargeState === 'dashing') {
            const bSpeed = e.bossConfig?.dashSpeed || 0.78;
            e.x += e.bossChargeDirX * bSpeed * scaledDt;
            e.y += e.bossChargeDirY * bSpeed * scaledDt;
            return;
        }

        // Virus wanders instead of chasing the player directly
        if (e.specialType === 'VIRUS') {
            if (e.wanderAngle === undefined) e.wanderAngle = Math.random() * Math.PI * 2;
            const moveX = Math.cos(e.wanderAngle) * e.speed + sep.x + soft.x;
            const moveY = Math.sin(e.wanderAngle) * e.speed + sep.y + soft.y;
            e.x += moveX * scaledDt;
            e.y += moveY * scaledDt;
            return;
        }

        if (!isAttackingAndStopping && distP > 1) {
            let currentSpeed = e.speed;
            
            if (isOutsideView && e.turboCooldown <= 0) {
                if (isDeepInFog && Math.random() < 0.5) {
                    const margin = 1.0 * unitSize;
                    const distXP = Math.abs(dxP);
                    const distYP = Math.abs(dyP);

                    if (distXP > distYP) {
                        e.x = player.pos.x + (dxP > 0 ? (innerW + margin) : -(innerW + margin));
                        e.y = player.pos.y + (Math.random() - 0.5) * (innerH * 2);
                    } else {
                        e.y = player.pos.y + (dyP > 0 ? (innerH + margin) : -(innerH + margin));
                        e.x = player.pos.x + (Math.random() - 0.5) * (innerW * 2);
                    }

                    const particles = this.game.getModule('particles');
                    if (particles) particles.emit(e.x, e.y, e.color, 10);
                    
                    e.turboCooldown = COOLDOWN_TIME;
                } else {
                    currentSpeed = player.getStat('moveSpeed') * turboMultiplier;
                }
            } else if (!isOutsideView && e.turboCooldown <= 0) {
                e.turboCooldown = COOLDOWN_TIME;
            }

            const finalSpeed = currentSpeed * e.speedModifier;
            const moveX = (dxP / distP) * finalSpeed + sep.x + soft.x;
            const moveY = (dyP / distP) * finalSpeed + sep.y + soft.y;
            
            e.x += moveX * scaledDt;
            e.y += moveY * scaledDt;
        } else {
            e.x += sep.x * scaledDt;
            e.y += sep.y * scaledDt;
        }
    }

    _calculateSeparation(e) {
        let sx = 0, sy = 0;
        for (const other of this.enemies) {
            if (e === other) continue;
            const dx = e.x - other.x;
            const dy = e.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = (e.size + other.size) * 0.5;

            if (dist < minDist && dist > 0) {
                const force = (minDist - dist) / minDist;
                sx += (dx / dist) * force * 0.1;
                sy += (dy / dist) * force * 0.1;
            }
        }
        return { x: sx, y: sy };
    }

    _calculateSoftPlayerCollision(e, player) {
        if (player.ghostActive) return { x: 0, y: 0 };
        const dx = player.pos.x - e.x;
        const dy = player.pos.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const softDist = (e.size + player.size) * 0.35;

        if (dist < softDist && dist > 0) {
            const force = (softDist - dist) / softDist;
            const strength = 0.4;
            return {
                x: -(dx / dist) * force * strength,
                y: -(dy / dist) * force * strength
            };
        }
        return { x: 0, y: 0 };
    }

    _checkPlayerCollision(e, player) {
        if (player.ghostActive) return;

        const dxP = player.pos.x - e.x;
        const dyP = player.pos.y - e.y;
        const distP = Math.sqrt(dxP * dxP + dyP * dyP);
        const collisionDistPlayer = (e.size + player.size) * 0.4;

        if (distP < collisionDistPlayer && player.invulnerable <= 0) {
            player.takeDamage(1);
            
            if (e.isSuicidal) {
                e.currentHp = 0;
            } else {
                const safeDist = distP || 1;
                const dirX = (e.x - player.pos.x) / safeDist;
                const dirY = (e.y - player.pos.y) / safeDist;

                const knockbackPower = 0.5;
                e.kbX = dirX * knockbackPower;
                e.kbY = dirY * knockbackPower;
                
                e.speedModifier = 0;
                e.turboCooldown = 2000;
            }
        }
    }

    _checkDroneCollisions(e, player) {
        const droneMgr = this.game.getModule('drones');
        if (!droneMgr || !droneMgr.drones || !player) return;

        for (const drone of droneMgr.drones) {
            if (drone.hasCollision) {
                const dx = e.x - drone.x;
                const dy = e.y - drone.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                const collisionDist = (e.size + drone.size) * 0.45;

                if (dist < collisionDist && e.speedModifier > 0.1) {
                    
                    const pDx = e.x - player.pos.x;
                    const pDy = e.y - player.pos.y;
                    const pDist = Math.sqrt(pDx * pDx + pDy * pDy) || 1;

                    const dirX = pDx / pDist;
                    const dirY = pDy / pDist;

                    const knockbackPower = drone.pushbackForce || 0.5;
                    e.kbX = dirX * knockbackPower;
                    e.kbY = dirY * knockbackPower;
                    
                    e.speedModifier = 0;
                    e.turboCooldown = 1500;

                    let dmg = droneMgr._getStat(drone, 'collisionDamage', player);

                    if (e.isTagged && e.tagMultiplier) {
                        dmg *= e.tagMultiplier;
                    }

                    if (dmg > 0) {
                        e.currentHp -= dmg;
                        
                        const particles = this.game.getModule('particles');
                        if (particles) particles.emit(e.x, e.y, drone.color, 5);
                    }
                }
            }
        }
    }

    _checkProjectileCollisions(e) {
        const pm = this.game.getModule('projectiles');
        if (!pm) return;

        for (let j = pm.projectiles.length - 1; j >= 0; j--) {
            const p = pm.projectiles[j];
            if (p.lastHitEnemy === e || p.hitEnemies.has(e)) continue;

            let isHit = false;
            const strokeOffset = this.outlineWidth / 2;
            const totalHalf = (e.size / 2) + strokeOffset;
            const pR = p.size / 2;

            switch(e.type) {
                case 'SQUARE': {
                    const closestX = Math.max(e.x - totalHalf, Math.min(p.x, e.x + totalHalf));
                    const closestY = Math.max(e.y - totalHalf, Math.min(p.y, e.y + totalHalf));
                    const dX = p.x - closestX;
                    const dY = p.y - closestY;
                    isHit = (dX * dX + dY * dY) < (pR * pR);
                    break;
                }
                case 'CIRCLE': {
                    const dX = p.x - e.x;
                    const dY = p.y - e.y;
                    const minDist = totalHalf + pR;
                    isHit = (dX * dX + dY * dY) < (minDist * minDist);
                    break;
                }
                case 'TRIANGLE': {
                    const vertices = [
                        { x: e.x, y: e.y - totalHalf },
                        { x: e.x + totalHalf, y: e.y + totalHalf },
                        { x: e.x - totalHalf, y: e.y + totalHalf }
                    ];
                    isHit = this._circlePolyCollision(p.x, p.y, pR, vertices);
                    break;
                }
                case 'RHOMBUS': {
                    const vertices = [
                        { x: e.x, y: e.y - totalHalf },
                        { x: e.x + totalHalf, y: e.y },
                        { x: e.x, y: e.y + totalHalf },
                        { x: e.x - totalHalf, y: e.y }
                    ];
                    isHit = this._circlePolyCollision(p.x, p.y, pR, vertices);
                    break;
                }
                case 'HEXAGON': {
                    const vertices = [];
                    for (let i = 0; i < 6; i++) {
                        const angle = (Math.PI / 3) * i;
                        vertices.push({
                            x: e.x + totalHalf * Math.cos(angle),
                            y: e.y + totalHalf * Math.sin(angle)
                        });
                    }
                    isHit = this._circlePolyCollision(p.x, p.y, pR, vertices);
                    break;
                }
            }

            if (isHit) {
                this._applyProjectileDamage(e, p, j, pm);
                if (e.currentHp <= 0) break;
            }
        }
    }

    _applyProjectileDamage(e, p, projectileIndex, pm) {
        const playerMod = this.game.getModule('player');
        let damage = p.damage !== undefined ? p.damage : (playerMod ? playerMod.getStat('damage') : 1);

        const synergyMgr = this.game.getModule('synergies');
        const audio = this.game.getModule('audio');
        if (p.isCrit) {
            damage *= (playerMod ? playerMod.getStat('critMultiplier') : 2);
            const particles = this.game.getModule('particles');
            if (particles) particles.emit(p.x, p.y, '#ffffff', 5);
            if (audio) audio.play('crit');
            if (synergyMgr && synergyMgr.hasSynergy('crit_overload')) {
                const hackMgr = this.game.getModule('hack');
                if (hackMgr && hackMgr.cooldownTimer > 0) {
                    hackMgr.cooldownTimer = Math.max(0, hackMgr.cooldownTimer - 250);
                }
            }
        } else if (audio) {
            audio.play('hit');
        }

        if (e.isTagged && e.tagMultiplier) {
            damage *= e.tagMultiplier;
        }

        if (playerMod && (playerMod.stats.executeBonus || 0) > 0 && e.maxHp > 0) {
            const hasGrimReaper = synergyMgr && synergyMgr.hasSynergy('grim_reaper');
            const hasJammerExecute = synergyMgr && synergyMgr.hasSynergy('jammer_execute') && this.game.isSignalJammed;
            const execThreshold = hasGrimReaper ? 0.60 : 0.45;
            if (hasJammerExecute || (e.currentHp / e.maxHp) <= execThreshold) {
                damage *= (1 + playerMod.stats.executeBonus);
            }
        }

        if (synergyMgr && synergyMgr.hasSynergy('rail_piercer') && p.hitEnemies && p.hitEnemies.size > 0) {
            damage *= (1 + Math.min(1.0, p.hitEnemies.size * 0.25));
        }

        if (synergyMgr && synergyMgr.hasSynergy('glass_vampire')) {
            damage *= 1.30;
        }

        if (this.game.isSignalJammed && synergyMgr && synergyMgr.hasSynergy('blackout_matrix')) {
            damage *= 1.75;
        }
        if (playerMod && (playerMod.armorCharges || 0) > 0 && synergyMgr && synergyMgr.hasSynergy('bunker_buster')) {
            damage *= 1.35;
        }

        // Shield Bearer protective aura reduces damage to nearby non-Shield-Bearer enemies
        if (e.specialType !== 'SHIELD_BEARER') {
            const unitSize = this.game.UNIT_SIZE || 100;
            for (const other of this.enemies) {
                if (other.specialType === 'SHIELD_BEARER' && other.currentHp > 0 && other.shieldAura) {
                    const auraR = other.shieldAura.radius * unitSize;
                    const dSq = (other.x - e.x) ** 2 + (other.y - e.y) ** 2;
                    if (dSq <= auraR * auraR) {
                        damage *= (1 - other.shieldAura.damageReduction);
                        break;
                    }
                }
            }
        }

        e.currentHp -= damage;

        const augmentMgr = this.game.getModule('augments');
        const triggerExplosiveCrit = p.isCrit && augmentMgr && augmentMgr.hasExplosiveCrits();
        const triggerExplosiveRound = playerMod && (playerMod.stats.explosiveChance || 0) > 0 && Math.random() < playerMod.stats.explosiveChance;
        const triggerPyroRicochet = Boolean(p.hasBounced && p.bounces === 0 && synergyMgr && synergyMgr.hasSynergy('pyro_ricochet'));
        if (triggerExplosiveCrit || triggerExplosiveRound || triggerPyroRicochet) {
            const unitSize = this.game.UNIT_SIZE || 100;
            const hasCluster = synergyMgr && synergyMgr.hasSynergy('cluster_munitions');
            const explosionRadius = ((triggerExplosiveCrit ? 1.2 : 1.05) + (hasCluster ? 0.35 : 0)) * unitSize;
            const aoeDamage = damage * (triggerExplosiveCrit ? 0.5 : 0.6) * (hasCluster ? 1.6 : 1.0);
            const particles = this.game.getModule('particles');
            if (particles) {
                particles.emit(e.x, e.y, triggerExplosiveCrit ? '#ff0055' : '#ff8800', 14);
            }
            for (const other of this.enemies) {
                if (other === e || other.currentHp <= 0) continue;
                const dx = other.x - e.x;
                const dy = other.y - e.y;
                if (dx * dx + dy * dy <= explosionRadius * explosionRadius) {
                    other.currentHp -= aoeDamage;
                }
            }
        }

        // Synergy: Tesla Coil (Assault Drone projectiles chain lightning to 2 nearby enemies)
        if (p.chainLightning > 0 && synergyMgr) {
            let chainsLeft = p.chainLightning;
            let lastOrigin = e;
            const visited = new Set([e]);
            const chainRangeSq = 220 * 220;

            while (chainsLeft > 0) {
                let nearest = null;
                let nearestDistSq = chainRangeSq;
                for (const other of this.enemies) {
                    if (visited.has(other) || other.currentHp <= 0) continue;
                    const dx = other.x - lastOrigin.x;
                    const dy = other.y - lastOrigin.y;
                    const dSq = dx * dx + dy * dy;
                    if (dSq < nearestDistSq) {
                        nearestDistSq = dSq;
                        nearest = other;
                    }
                }
                if (!nearest) break;
                visited.add(nearest);
                nearest.currentHp -= damage * 0.75;
                synergyMgr.addLightningArc(lastOrigin.x, lastOrigin.y, nearest.x, nearest.y, '#00bcff');
                lastOrigin = nearest;
                chainsLeft -= 1;
            }
        }

        // Synergy: Phantom Barrage (Crits have 25% chance to fire a bonus homing dagger)
        if (p.isCrit && !p.isBonusDagger && synergyMgr && synergyMgr.hasSynergy('phantom_barrage') && Math.random() < 0.25) {
            const nextTarget = pm.findNextTarget({ x: e.x, y: e.y }, e);
            const speed = playerMod ? playerMod.getStat('bulletSpeed') * 1.25 : 1.1;
            const angle = nextTarget
                ? Math.atan2(nextTarget.y - e.y, nextTarget.x - e.x)
                : Math.random() * Math.PI * 2;
            pm.projectiles.push({
                x: e.x,
                y: e.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 8,
                life: 1600,
                isCrit: false,
                isHoming: true,
                isBonusDagger: true,
                bounces: 0,
                penetration: 0,
                color: '#00ffcc',
                damage: (playerMod ? playerMod.getStat('damage') : 1) * 1.2,
                hitEnemies: new Set([e]),
                lastHitEnemy: e
            });
        }

        if (p.bounces > 0) {
            const nextTarget = pm.findNextTarget(p, e);
            if (nextTarget) {
                // Synergy: Glitch Nova (35% chance on bounce to infect with Secondary Glitch)
                if (synergyMgr && synergyMgr.hasSynergy('glitch_nova') && Math.random() < 0.35) {
                    if (nextTarget.glitchPhase === GLITCH_PHASES.NORMAL) {
                        nextTarget.glitchPhase = GLITCH_PHASES.SECONDARY;
                    }
                }
                p.bounces--;
                p.hasBounced = true;
                p.lastHitEnemy = e;
                p.hitEnemies.clear();
                const angle = Math.atan2(nextTarget.y - p.y, nextTarget.x - p.x);
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                p.vx = Math.cos(angle) * speed;
                p.vy = Math.sin(angle) * speed;
                return;
            }
        }

        if (p.penetration > 0) {
            p.penetration--;
            p.hitEnemies.add(e);
        } else {
            pm.projectiles.splice(projectileIndex, 1);
        }
    }

    _handleSpawning(deltaTime) {
        if (this.freezeSpawns) return;
        if (this.hasActiveBoss() && this.enemies.length >= 90) return;
        this.spawnTimer += deltaTime;
        if (this.spawnTimer > this.spawnRate) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }
    }

    spawnBoss(bossId, extraHpScale = 1) {
        const baseConfig = ENEMY_TYPES[bossId];
        if (!baseConfig) return null;
        const player = this.game.getModule('player');
        const director = this.game.getModule('director');
        const center = this.game.center;
        if (!player) return null;

        const phaseHpMult = director?.currentPhase?.hpMultiplier || 1;
        const phaseSpdMult = director?.currentPhase?.speedMultiplier || 1;
        const margin = 120;
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.max(this.game.canvas.width, this.game.canvas.height) * 0.55 + margin;
        const worldX = player.pos.x + Math.cos(angle) * dist;
        const worldY = player.pos.y + Math.sin(angle) * dist;

        const bossHp = Math.ceil(baseConfig.hp * Math.max(1, phaseHpMult * 0.65) * extraHpScale);
        const boss = {
            ...baseConfig,
            codexId: bossId,
            x: worldX,
            y: worldY,
            maxHp: bossHp,
            currentHp: bossHp,
            speed: baseConfig.speed * Math.min(1.5, Math.max(1, phaseSpdMult * 0.8)),
            glitchPhase: GLITCH_PHASES.NORMAL,
            skillTimer: 1600,
            skillIndex: 0
        };
        this.enemies.push(boss);

        this.bossWarningTimer = 3500;
        this.bossWarningText = `WARNING: ${(baseConfig.codexName || bossId).toUpperCase()} DETECTED`;
        const audio = this.game.getModule('audio');
        if (audio) audio.play('bossAlert');
        const ui = this.game.getModule('ui');
        if (ui && ui.showNotification) {
            ui.showNotification(this.bossWarningText, baseConfig.color || '#ff4400');
        }
        return boss;
    }

    _spawnEscort(typeKey, nearX, nearY, hpScale = 0.8) {
        const cfg = ENEMY_TYPES[typeKey];
        if (!cfg) return;
        const director = this.game.getModule('director');
        const phaseHpMult = director?.currentPhase?.hpMultiplier || 1;
        const angle = Math.random() * Math.PI * 2;
        const dist = 65 + Math.random() * 45;
        const spawned = {
            ...cfg,
            codexId: typeKey,
            isBossMinion: true,
            x: nearX + Math.cos(angle) * dist,
            y: nearY + Math.sin(angle) * dist,
            maxHp: Math.ceil(cfg.hp * phaseHpMult * hpScale),
            currentHp: Math.ceil(cfg.hp * phaseHpMult * hpScale),
            speed: cfg.speed,
            glitchPhase: GLITCH_PHASES.NORMAL
        };
        if (spawned.isVirusGlitched) {
            this._applyVirusGlitch(spawned, false);
        }
        this.enemies.push(spawned);
    }

    spawnSpecificEnemy(typeKey, count = 1) {
        const cfg = ENEMY_TYPES[typeKey];
        if (!cfg) return 0;
        if (cfg.isBoss) {
            for (let i = 0; i < count; i++) this.spawnBoss(typeKey, 1);
            return count;
        }
        const player = this.game?.getModule('player');
        if (!player) return 0;
        const director = this.game?.getModule('director');
        const hpMult = director?.currentPhase?.hpMultiplier || 1;
        const spdMult = director?.currentPhase?.speedMultiplier || 1;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / Math.max(1, count)) * i + Math.random() * 0.4;
            const dist = 210 + Math.random() * 60;
            const spawned = {
                ...cfg,
                codexId: typeKey === 'MINI_SHARD' ? null : typeKey,
                x: player.pos.x + Math.cos(angle) * dist,
                y: player.pos.y + Math.sin(angle) * dist,
                maxHp: Math.ceil(cfg.hp * hpMult),
                currentHp: Math.ceil(cfg.hp * hpMult),
                speed: cfg.speed * spdMult,
                glitchPhase: GLITCH_PHASES.NORMAL
            };
            if (spawned.isVirusGlitched) this._applyVirusGlitch(spawned, false);
            this.enemies.push(spawned);
        }
        return count;
    }

    _handleEnemyDeath(e, index) {
        const ui = this.game.getModule('ui');
        const particles = this.game.getModule('particles');
        const xpMgr = this.game.getModule('experience');
        const director = this.game.getModule('director');
        const powerUpMgr = this.game.getModule('powerups');
        const augmentMgr = this.game.getModule('augments');
        const synergyMgr = this.game.getModule('synergies');
        const hasViralSwarm = synergyMgr && synergyMgr.hasSynergy('viral_swarm');
        const isGlitched = e.glitchPhase === GLITCH_PHASES.PRIMARY || e.glitchPhase === GLITCH_PHASES.SECONDARY;

        if (e.glitchPhase === GLITCH_PHASES.PRIMARY || (hasViralSwarm && isGlitched)) {
            const radiusPx = hasViralSwarm ? 220 : GLITCH_EFFECT_CONFIG.spreadRadiusPx;
            for (const other of this.enemies) {
                if (other === e || other.currentHp <= 0) continue;

                const dx = other.x - e.x;
                const dy = other.y - e.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= radiusPx) {
                    other.currentHp = Math.max(0, other.currentHp - GLITCH_EFFECT_CONFIG.spreadDamage);
                    other.glitchPhase = GLITCH_PHASES.SECONDARY;
                    if (particles) particles.createGlitchEffect(other.x, other.y);
                }
            }

            if (hasViralSwarm) {
                const pm = this.game.getModule('projectiles');
                const playerMod = this.game.getModule('player');
                if (pm) {
                    const shardSpeed = playerMod ? playerMod.getStat('bulletSpeed') : 0.9;
                    const shardDmg = Math.max(1.5, (playerMod ? playerMod.getStat('damage') : 1) * 1.2);
                    for (let s = 0; s < 3; s++) {
                        const angle = (Math.PI * 2 / 3) * s + Math.random() * 0.5;
                        pm.projectiles.push({
                            x: e.x,
                            y: e.y,
                            vx: Math.cos(angle) * shardSpeed,
                            vy: Math.sin(angle) * shardSpeed,
                            size: 8,
                            life: 1600,
                            isCrit: false,
                            isHoming: true,
                            bounces: 0,
                            penetration: 0,
                            color: '#bc00ff',
                            damage: shardDmg,
                            hitEnemies: new Set([e]),
                            lastHitEnemy: e
                        });
                    }
                }
            }
        }

        const codex = this.game.getModule('codex');
        if (codex && e.codexId) codex.recordEnemyKill(e.codexId);
        const audio = this.game.getModule('audio');
        if (audio) audio.play('kill');
        const playerMod = this.game.getModule('player');
        if (playerMod) {
            const synergyMgr = this.game.getModule('synergies');
            const lifeStealMult = (synergyMgr && synergyMgr.hasSynergy('glass_vampire')) ? 2 : 1;
            if ((playerMod.stats.lifeStealChance || 0) > 0 && Math.random() < (playerMod.stats.lifeStealChance * lifeStealMult)) {
                if (playerMod.stats.hp < playerMod.stats.maxHp) {
                    playerMod.stats.hp = Math.min(playerMod.stats.maxHp, playerMod.stats.hp + 1);
                } else if (playerMod.armorCharges < (playerMod.stats.defense || 0)) {
                    playerMod.armorRechargeTimer += 4000;
                }
                if (synergyMgr && synergyMgr.hasSynergy('blood_tax') && augmentMgr && Math.random() < 0.35) {
                    augmentMgr.spawnScrapDrop(e.x, e.y, 1);
                }
            }
            if ((playerMod.stats.deathBlastDamage || 0) > 0) {
                const blastR = 0.95 * (this.game.UNIT_SIZE || 100);
                if (particles) particles.emit(e.x, e.y, '#ff7722', 12);
                for (const other of this.enemies) {
                    if (other === e || other.currentHp <= 0) continue;
                    const dx = other.x - e.x;
                    const dy = other.y - e.y;
                    if (dx * dx + dy * dy <= blastR * blastR) {
                        other.currentHp -= playerMod.stats.deathBlastDamage;
                    }
                }
            }
        }
        if (e.isBoss) {
            if (particles) particles.emit(e.x, e.y, e.color || '#ffcc00', 40);
            if (audio) audio.play('synergy');
            if (xpMgr) xpMgr.spawnOrb(e.x, e.y, 400, '#ffcc00');
            if (playerMod) playerMod.stats.rerolls = (playerMod.stats.rerolls || 0) + 1;
            if (augmentMgr) {
                for (let s = 0; s < 5; s++) {
                    augmentMgr.spawnScrapDrop(e.x + (Math.random() - 0.5) * 50, e.y + (Math.random() - 0.5) * 50, 1);
                }
                const bossAug = augmentMgr._rollRandomAugment(2.5);
                if (bossAug) augmentMgr.spawnPod(bossAug, e.x, e.y);
            }
            if (ui && ui.showNotification) {
                ui.showNotification(`${(e.codexName || 'BOSS').toUpperCase()} DEFEATED! +1 REROLL & LOOT`, '#ffcc00');
            }
        }
        if (ui) ui.addScore(e.scoreValue);
        if (particles) particles.emit(e.x, e.y, e.color || '#ffffff', 15);
        if (xpMgr && director && director.currentPhase) {
            const drop = director.currentPhase.xpDrop;
            xpMgr.spawnOrb(e.x, e.y, drop.value, drop.color);
        }
        if (powerUpMgr) powerUpMgr.trySpawn(e.x, e.y);
        if (augmentMgr) augmentMgr.trySpawn(e.x, e.y, e);

        // Splitter spawns mini-shards on death
        if (e.splitCount && e.splitCount > 0) {
            const shardConfig = ENEMY_TYPES.MINI_SHARD;
            const hpMult = director?.currentPhase?.hpMultiplier || 1;
            const spdMult = director?.currentPhase?.speedMultiplier || 1;
            for (let s = 0; s < e.splitCount; s++) {
                const angle = (Math.PI * 2 / e.splitCount) * s + Math.random() * 0.4;
                this.enemies.push({
                    ...shardConfig,
                    x: e.x + Math.cos(angle) * 18,
                    y: e.y + Math.sin(angle) * 18,
                    maxHp: Math.ceil(shardConfig.hp * hpMult),
                    currentHp: Math.ceil(shardConfig.hp * hpMult),
                    speed: shardConfig.speed * spdMult,
                    kbX: Math.cos(angle) * 0.35,
                    kbY: Math.sin(angle) * 0.35,
                    glitchPhase: GLITCH_PHASES.NORMAL
                });
            }
        }

        this.enemies.splice(index, 1);
    }

    spawnEnemy() {
        const director = this.game.getModule('director');
        if (!director || !director.currentPhase) return;
        
        const activePhase = director.currentPhase;
        const player = this.game.getModule('player');
        const center = this.game.center;
        const allowedTypes = activePhase.types;
        const typeKey = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
        const baseConfig = ENEMY_TYPES[typeKey];

        const margin = 100;
        let spawnX;
        let spawnY;
        if (Math.random() < 0.5) {
            // Left or right edge
            spawnX = Math.random() < 0.5 ? -margin : this.game.canvas.width + margin;
            spawnY = Math.random() * this.game.canvas.height;
        } else {
            // Top or bottom edge
            spawnX = Math.random() * this.game.canvas.width;
            spawnY = Math.random() < 0.5 ? -margin : this.game.canvas.height + margin;
        }
        const worldX = spawnX + player.pos.x - center.x;
        const worldY = spawnY + player.pos.y - center.y;

        const spawned = {
            ...baseConfig,
            codexId: typeKey,
            x: worldX,
            y: worldY,
            maxHp: Math.ceil(baseConfig.hp * activePhase.hpMultiplier),
            currentHp: Math.ceil(baseConfig.hp * activePhase.hpMultiplier),
            speed: baseConfig.speed * activePhase.speedMultiplier,
            glitchPhase: GLITCH_PHASES.NORMAL
        };

        if (spawned.isVirusGlitched) {
            this._applyVirusGlitch(spawned, false);
        }

        this.enemies.push(spawned);
    }

    _applyVirusGlitch(e, allowRangedMutation = true) {
        e.isVirusGlitched = true;
        // Randomize 1 or 2 stats
        const statRolls = Math.random() < 0.5 ? 1 : 2;
        const pool = ['speed', 'hp', 'size'];
        for (let r = 0; r < statRolls; r++) {
            const pickIdx = Math.floor(Math.random() * pool.length);
            const stat = pool.splice(pickIdx, 1)[0];
            if (stat === 'speed') {
                e.speed *= (0.65 + Math.random() * 1.05);
            } else if (stat === 'hp') {
                const mult = 0.7 + Math.random() * 0.9;
                e.maxHp = Math.max(1, Math.ceil(e.maxHp * mult));
                e.currentHp = Math.max(1, Math.min(e.maxHp, Math.ceil(e.currentHp * mult)));
            } else if (stat === 'size') {
                e.size = Math.max(16, Math.round(e.size * (0.75 + Math.random() * 0.6)));
            }
        }

        // Rare chance for melee enemies infected by a Virus to gain ranged shots
        if (allowRangedMutation && !e.ranged && Math.random() < 0.18) {
            e.ranged = {
                fireRate: 2600,
                projectileSpeed: 0.45,
                projectileSize: 12,
                range: 5,
                stopToShoot: false,
                color: '#b4ff00'
            };
        }
    }

    _updateBossBehavior(e, player, deltaTime) {
        if (this.game.isSignalJammed) return;
        const cfg = e.bossConfig || {};
        const pm = this.game.getModule('projectiles');
        const particles = this.game.getModule('particles');
        const dx = player.pos.x - e.x;
        const dy = player.pos.y - e.y;
        const dist = Math.hypot(dx, dy) || 1;

        // Active Siege Charge (Warden)
        if (e.bossChargeState === 'charging') {
            e.bossChargeTimer -= deltaTime;
            if (e.bossChargeTimer <= 0) {
                e.bossChargeState = 'dashing';
                e.bossChargeTimer = cfg.dashTime || 650;
            }
            return;
        }
        if (e.bossChargeState === 'dashing') {
            e.bossChargeTimer -= deltaTime;
            if (e.bossChargeTimer <= 0) {
                e.bossChargeState = 'idle';
            }
            return;
        }

        // Active Blink Strike (Null-Pointer)
        if (e.bossBlinkTarget) {
            e.bossBlinkTarget.timer -= deltaTime;
            if (e.bossBlinkTarget.timer <= 0) {
                if (particles) particles.emit(e.x, e.y, '#ff00ff', 18);
                e.x = e.bossBlinkTarget.x;
                e.y = e.bossBlinkTarget.y;
                if (particles) particles.emit(e.x, e.y, '#ff00ff', 22);
                if (pm) {
                    const baseAngle = e.bossBlinkTarget.angle ?? Math.atan2(player.pos.y - e.y, player.pos.x - e.x);
                    for (let i = -2; i <= 2; i++) {
                        const a = baseAngle + i * 0.22;
                        pm.spawnEnemyProjectile({
                            x: e.x, y: e.y,
                            vx: Math.cos(a) * 0.48, vy: Math.sin(a) * 0.48,
                            size: 13, color: '#ff00ff', damage: 1
                        });
                    }
                }
                e.bossBlinkTarget = null;
            }
            return;
        }

        // Active Spiral Barrage (Overmind)
        if (e.bossSpiralTimer > 0) {
            e.bossSpiralTimer -= deltaTime;
            e.bossSpiralTick = (e.bossSpiralTick || 0) + deltaTime;
            e.bossSpiralAngle = (e.bossSpiralAngle || 0) + deltaTime * 0.0045;
            if (e.bossSpiralTick >= 130 && pm) {
                e.bossSpiralTick = 0;
                for (let arm = 0; arm < 2; arm++) {
                    const a = e.bossSpiralAngle + arm * Math.PI;
                    pm.spawnEnemyProjectile({
                        x: e.x, y: e.y,
                        vx: Math.cos(a) * 0.4, vy: Math.sin(a) * 0.4,
                        size: 12, color: '#ffcc00', damage: 1
                    });
                }
            }
        }

        // Active Overload Ring (Overmind)
        if (e.bossOverloadTimer > 0) {
            e.bossOverloadTimer -= deltaTime;
            if (e.bossOverloadTimer <= 0) {
                const rad = (cfg.overloadRadius || 2.2) * (this.game.UNIT_SIZE || 100);
                if (particles) particles.emit(e.x, e.y, '#ff3300', 30);
                if (dist <= rad && !player.ghostActive) {
                    player.takeDamage(1);
                }
            }
            return;
        }

        e.skillTimer = (e.skillTimer ?? 2000) - deltaTime;
        if (e.skillTimer > 0) return;
        e.skillTimer = cfg.skillCooldown || 3000;
        const skill = (e.skillIndex || 0) % 3;
        e.skillIndex = (e.skillIndex || 0) + 1;

        if (e.specialType === 'BOSS_WARDEN') {
            if (skill === 0 && pm) {
                const count = cfg.novaCount || 14;
                const spd = cfg.novaSpeed || 0.42;
                for (let i = 0; i < count; i++) {
                    const a = (Math.PI * 2 / count) * i;
                    pm.spawnEnemyProjectile({
                        x: e.x, y: e.y,
                        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
                        size: 13, color: '#ff5500', damage: 1
                    });
                }
            } else if (skill === 1) {
                e.bossChargeState = 'charging';
                e.bossChargeTimer = cfg.chargeTime || 900;
                e.bossChargeDirX = dx / dist;
                e.bossChargeDirY = dy / dist;
            } else {
                this._spawnEscort('SENTRY', e.x, e.y, 0.7);
                this._spawnEscort('SHIELD_BEARER', e.x, e.y, 0.7);
            }
        } else if (e.specialType === 'BOSS_PHANTOM') {
            const unitSize = this.game.UNIT_SIZE || 100;
            if (skill === 0) {
                const offA = Math.random() * Math.PI * 2;
                const tx = player.pos.x + Math.cos(offA) * (1.6 * unitSize);
                const ty = player.pos.y + Math.sin(offA) * (1.6 * unitSize);
                e.bossBlinkTarget = {
                    x: tx,
                    y: ty,
                    angle: Math.atan2(player.pos.y - ty, player.pos.x - tx),
                    timer: cfg.blinkDelay || 850
                };
            } else if (skill === 1) {
                this._spawnEscort('GLITCHED', e.x, e.y, 0.55);
                this._spawnEscort('GLITCHED', e.x, e.y, 0.55);
            } else {
                const empRad = (cfg.empRadius || 2.8) * unitSize;
                this.empWaves.push({ x: e.x, y: e.y, radius: 10, maxRadius: empRad, life: 450, maxLife: 450 });
                if (dist <= empRad && !player.ghostActive) {
                    player.empDisruptedTimer = Math.max(player.empDisruptedTimer || 0, cfg.empDuration || 2500);
                    const audio = this.game.getModule('audio');
                    if (audio) audio.play('emp');
                }
            }
        } else if (e.specialType === 'BOSS_OVERMIND') {
            if (skill === 0) {
                e.bossSpiralTimer = 1600;
                e.bossSpiralTick = 0;
            } else if (skill === 1) {
                e.bossOverloadTimer = cfg.overloadDelay || 1200;
            } else {
                this._spawnEscort('DASHER', e.x, e.y, 0.75);
                this._spawnEscort('DASHER', e.x, e.y, 0.75);
                this._spawnEscort('VIRUS', e.x, e.y, 0.75);
            }
        }
    }

    _handleSpecialEnemyBehavior(e, player, deltaTime) {
        if (e.isBoss) {
            this._updateBossBehavior(e, player, deltaTime);
            return;
        }
        // 1. EMP Disrupter
        if (e.emp) {
            const empRadiusPx = e.emp.radius * (this.game.UNIT_SIZE || 100);
            if (e.empTimer === undefined) e.empTimer = Math.random() * 2000;
            e.empTimer += deltaTime;
            if (e.empTimer >= e.emp.cooldown) {
                e.empTimer = 0;
                this.empWaves.push({
                    x: e.x,
                    y: e.y,
                    radius: 10,
                    maxRadius: empRadiusPx,
                    life: 450,
                    maxLife: 450
                });

                const distToPlayer = Math.hypot(player.pos.x - e.x, player.pos.y - e.y);
                if (distToPlayer <= empRadiusPx && !player.ghostActive) {
                    player.empDisruptedTimer = Math.max(player.empDisruptedTimer || 0, e.emp.disableDuration);
                    const audio = this.game.getModule('audio');
                    if (audio) audio.play('emp');
                    const ui = this.game.getModule('ui');
                    if (ui && ui.showNotification) {
                        ui.showNotification('EMP PULSE: DRONES & HACKS DISRUPTED!', '#00e5ff');
                    }
                }
            }
        }

        // 2. Dasher
        if (e.dasher) {
            if (e.dashCooldown === undefined) e.dashCooldown = 800;
            if (e.dashState === 'charging') {
                e.dashTimer -= deltaTime;
                if (e.dashTimer <= 0) {
                    e.dashState = 'dashing';
                    e.dashTimer = e.dasher.dashDuration;
                }
            } else if (e.dashState === 'dashing') {
                e.dashTimer -= deltaTime;
                if (e.dashTimer <= 0) {
                    e.dashState = 'idle';
                    e.dashCooldown = e.dasher.cooldown;
                }
            } else {
                if (e.dashCooldown > 0) e.dashCooldown -= deltaTime;
                const dx = player.pos.x - e.x;
                const dy = player.pos.y - e.y;
                const dist = Math.hypot(dx, dy);
                const triggerPx = e.dasher.triggerRange * (this.game.UNIT_SIZE || 100);
                if (e.dashCooldown <= 0 && dist > 30 && dist <= triggerPx) {
                    e.dashState = 'charging';
                    e.dashTimer = e.dasher.chargeDuration;
                    e.dashDirX = dx / dist;
                    e.dashDirY = dy / dist;
                }
            }
        }

        // 3. Virus (wanders & shoots other enemies)
        if (e.virus) {
            e.wanderTimer = (e.wanderTimer || 0) + deltaTime;
            if (e.wanderTimer >= 1600) {
                e.wanderTimer = 0;
                e.wanderAngle = (e.wanderAngle || 0) + (Math.random() - 0.5) * 2.2;
            }

            e.virusShootTimer = (e.virusShootTimer || 0) + deltaTime;
            if (e.virusShootTimer >= e.virus.fireRate) {
                let target = null;
                let minDist = e.virus.range * (this.game.UNIT_SIZE || 100);
                for (const other of this.enemies) {
                    if (other === e || other.currentHp <= 0 || other.specialType === 'VIRUS') continue;
                    const d = Math.hypot(other.x - e.x, other.y - e.y);
                    if (d < minDist) {
                        minDist = d;
                        target = other;
                    }
                }
                if (target && minDist > 0) {
                    e.virusShootTimer = 0;
                    const vx = ((target.x - e.x) / minDist) * e.virus.projectileSpeed;
                    const vy = ((target.y - e.y) / minDist) * e.virus.projectileSpeed;
                    this.virusProjectiles.push({
                        x: e.x,
                        y: e.y,
                        vx,
                        vy,
                        life: 1600,
                        source: e,
                        virusConfig: e.virus
                    });
                }
            }
        }

        // 4. Virus-Glitched erratic micro-teleport
        if (e.isVirusGlitched && Math.random() < 0.005 * (deltaTime / 16)) {
            e.x += (Math.random() - 0.5) * 44;
            e.y += (Math.random() - 0.5) * 44;
        }
    }

    _updateEmpWaves(deltaTime) {
        for (let i = this.empWaves.length - 1; i >= 0; i--) {
            const w = this.empWaves[i];
            w.life -= deltaTime;
            const prog = 1 - Math.max(0, w.life / w.maxLife);
            w.radius = prog * w.maxRadius;
            if (w.life <= 0) {
                this.empWaves.splice(i, 1);
            }
        }
    }

    _updateVirusProjectiles(deltaTime) {
        const particles = this.game.getModule('particles');
        for (let i = this.virusProjectiles.length - 1; i >= 0; i--) {
            const vp = this.virusProjectiles[i];
            vp.x += vp.vx * deltaTime;
            vp.y += vp.vy * deltaTime;
            vp.life -= deltaTime;

            let hit = false;
            for (const other of this.enemies) {
                if (other === vp.source || other.currentHp <= 0 || other.specialType === 'VIRUS') continue;
                const d = Math.hypot(other.x - vp.x, other.y - vp.y);
                if (d <= other.size * 0.55 + 6) {
                    hit = true;
                    other.currentHp = Math.max(1, other.currentHp - 0.5);
                    const roll = Math.random();
                    if (roll < vp.virusConfig.virusCloneChance) {
                        // Extremely rare: convert enemy into another VIRUS
                        const vConf = ENEMY_TYPES.VIRUS;
                        other.type = vConf.type;
                        other.specialType = 'VIRUS';
                        other.codexId = 'VIRUS';
                        other.color = vConf.color;
                        other.virus = { ...vConf.virus };
                        other.ranged = undefined;
                    } else if (!other.isVirusGlitched && roll < vp.virusConfig.glitchChance) {
                        this._applyVirusGlitch(other, true);
                    }
                    if (particles) {
                        particles.emit(other.x, other.y, '#b4ff00', 8);
                    }
                    break;
                }
            }

            if (hit || vp.life <= 0) {
                this.virusProjectiles.splice(i, 1);
            }
        }
    }

    _handleRangedAttack(e, player, deltaTime) {
        if (!e.ranged) return;
        if (this.game.isSignalJammed) return;
        
        if (e.shootTimer === undefined) e.shootTimer = 0;
        e.shootTimer += deltaTime;

        const dx = player.pos.x - e.x;
        const dy = player.pos.y - e.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        const rangePx = e.ranged.range * this.game.UNIT_SIZE;

        if (distPx > 0 && distPx < rangePx && e.shootTimer >= e.ranged.fireRate) {
            this._enemyShoot(e, player, dx, dy, distPx);
            e.shootTimer = 0;
        }
    }

    _enemyShoot(e, player, dx, dy, dist) {
        const pm = this.game.getModule('projectiles');
        if (!pm) return;

        const vx = (dx / dist) * e.ranged.projectileSpeed;
        const vy = (dy / dist) * e.ranged.projectileSpeed;

        pm.spawnEnemyProjectile({
            x: e.x,
            y: e.y,
            vx: vx,
            vy: vy,
            size: e.ranged.projectileSize,
            color: e.ranged.color,
            damage: 1
        });
    }

    draw(ctx) {
        const player = this.game.getModule('player');
        if (!player) return;

        // Draw Boss telegraphs & off-screen indicator
        for (const e of this.enemies) {
            if (!e.isBoss) continue;
            const drawX = e.x - player.pos.x + this.game.center.x;
            const drawY = e.y - player.pos.y + this.game.center.y;

            if (e.bossChargeState === 'charging') {
                const laneLen = 6.5 * (this.game.UNIT_SIZE || 100);
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 68, 0, 0.65)';
                ctx.lineWidth = e.size * 0.85;
                ctx.setLineDash([14, 10]);
                ctx.beginPath();
                ctx.moveTo(drawX, drawY);
                ctx.lineTo(drawX + (e.bossChargeDirX || 0) * laneLen, drawY + (e.bossChargeDirY || 0) * laneLen);
                ctx.stroke();
                ctx.restore();
            }
            if (e.bossBlinkTarget) {
                const bx = e.bossBlinkTarget.x - player.pos.x + this.game.center.x;
                const by = e.bossBlinkTarget.y - player.pos.y + this.game.center.y;
                const aimAngle = e.bossBlinkTarget.angle ?? Math.atan2(this.game.center.y - by, this.game.center.x - bx);
                const sightLen = 2.6 * (this.game.UNIT_SIZE || 100);
                ctx.save();
                ctx.strokeStyle = '#ff00ff';
                ctx.fillStyle = 'rgba(255, 0, 255, 0.16)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(bx, by, 44, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // 5-way shot direction telegraph lines
                ctx.strokeStyle = 'rgba(255, 0, 255, 0.65)';
                ctx.lineWidth = 2;
                ctx.setLineDash([8, 6]);
                for (let i = -2; i <= 2; i++) {
                    const a = aimAngle + i * 0.22;
                    ctx.beginPath();
                    ctx.moveTo(bx, by);
                    ctx.lineTo(bx + Math.cos(a) * sightLen, by + Math.sin(a) * sightLen);
                    ctx.stroke();
                }
                ctx.restore();
            }
            if (e.bossOverloadTimer > 0) {
                const rad = (e.bossConfig?.overloadRadius || 2.2) * (this.game.UNIT_SIZE || 100);
                const pct = 1 - Math.max(0, e.bossOverloadTimer / (e.bossConfig?.overloadDelay || 1200));
                ctx.save();
                ctx.strokeStyle = '#ff3300';
                ctx.fillStyle = 'rgba(255, 51, 0, 0.15)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(drawX, drawY, rad, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(drawX, drawY, rad * pct, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Off-screen boss arrow
            const w = this.game.canvas.width;
            const h = this.game.canvas.height;
            if (drawX < 0 || drawX > w || drawY < 0 || drawY > h) {
                const ang = Math.atan2(drawY - this.game.center.y, drawX - this.game.center.x);
                const pad = 34;
                const ax = Math.max(pad, Math.min(w - pad, drawX));
                const ay = Math.max(pad, Math.min(h - pad, drawY));
                ctx.save();
                ctx.translate(ax, ay);
                ctx.rotate(ang);
                ctx.fillStyle = e.color || '#ff4400';
                ctx.beginPath();
                ctx.moveTo(14, 0);
                ctx.lineTo(-10, -9);
                ctx.lineTo(-10, 9);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }

        // Draw Shield Bearer protective auras underneath enemies
        for (const e of this.enemies) {
            if (e.specialType === 'SHIELD_BEARER' && e.shieldAura) {
                const drawX = e.x - player.pos.x + this.game.center.x;
                const drawY = e.y - player.pos.y + this.game.center.y;
                ctx.save();
                ctx.strokeStyle = 'rgba(68, 136, 255, 0.35)';
                ctx.fillStyle = 'rgba(68, 136, 255, 0.06)';
                ctx.lineWidth = 2;
                ctx.setLineDash([10, 8]);
                ctx.beginPath();
                ctx.arc(drawX, drawY, e.shieldAura.radius * (this.game.UNIT_SIZE || 100), 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        }

        // Draw expanding EMP waves
        for (const w of this.empWaves) {
            const drawX = w.x - player.pos.x + this.game.center.x;
            const drawY = w.y - player.pos.y + this.game.center.y;
            const alpha = Math.max(0, w.life / w.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(drawX, drawY, w.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Draw Virus projectiles
        for (const vp of this.virusProjectiles) {
            const drawX = vp.x - player.pos.x + this.game.center.x;
            const drawY = vp.y - player.pos.y + this.game.center.y;
            ctx.save();
            ctx.fillStyle = '#b4ff00';
            ctx.beginPath();
            ctx.arc(drawX, drawY, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        for (const e of this.enemies) {
            const drawX = e.x - player.pos.x + this.game.center.x;
            const drawY = e.y - player.pos.y + this.game.center.y;

            ctx.save();
            const isGlitch1 = e.glitchPhase === GLITCH_PHASES.PRIMARY;
            const isGlitch2 = e.glitchPhase === GLITCH_PHASES.SECONDARY;

            // Dasher telegraph line
            if (e.dashState === 'charging') {
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 85, 0, 0.75)';
                ctx.lineWidth = 3;
                ctx.setLineDash([10, 8]);
                ctx.beginPath();
                ctx.moveTo(drawX, drawY);
                ctx.lineTo(drawX + e.dashDirX * 360, drawY + e.dashDirY * 360);
                ctx.stroke();
                ctx.restore();
            }

            // EMP charge telegraph ring
            if (e.emp && e.empTimer >= e.emp.cooldown - e.emp.chargeDuration) {
                const chargeProg = (e.empTimer - (e.emp.cooldown - e.emp.chargeDuration)) / e.emp.chargeDuration;
                ctx.save();
                ctx.strokeStyle = `rgba(0, 229, 255, ${0.25 + chargeProg * 0.55})`;
                ctx.lineWidth = 2;
                ctx.setLineDash([8, 6]);
                ctx.beginPath();
                ctx.arc(drawX, drawY, e.emp.radius * (this.game.UNIT_SIZE || 100) * chargeProg, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            if (isGlitch1 || isGlitch2) {
                const alphaScale = isGlitch2 ? 0.75 : 1;
                this._drawGlitchPhaseOne(ctx, drawX, drawY, e, alphaScale);
            } else if (e.isVirusGlitched) {
                this._drawGlitchPhaseOne(ctx, drawX, drawY, e, 0.9);
            } else if (e.renderType === 'sprite' && this.sprites.has(e.type)) {
                const img = this.sprites.get(e.type);
                ctx.drawImage(img, drawX - e.size/2, drawY - e.size/2, e.size, e.size);
            } else {
                const glowEnabled = this.game?.settings?.performance?.glowEffects !== false;
                ctx.shadowBlur = glowEnabled ? 15 : 0;
                ctx.shadowColor = e.color;
                ctx.fillStyle = e.color + '66';
                ctx.strokeStyle = e.color;
                ctx.lineWidth = this.outlineWidth;
                this._drawShape(ctx, drawX, drawY, e);
            }

            if (e.currentHp < e.maxHp && this.game.settings.performance.enemyHealthBars) {
                this._drawHealthBar(ctx, drawX, drawY, e);
            }
            
            if (e.isTagged) {
                this._drawTag(ctx, drawX, drawY, e);
            }
            ctx.restore();
        }
    }

    _circlePolyCollision(cx, cy, radius, vertices) {
        let inside = false;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            if (((vertices[i].y > cy) !== (vertices[j].y > cy)) &&
                (cx < (vertices[j].x - vertices[i].x) * (cy - vertices[i].y) / (vertices[j].y - vertices[i].y) + vertices[i].x)) {
                inside = !inside;
            }
        }
        if (inside) return true;

        for (let i = 0; i < vertices.length; i++) {
            const v1 = vertices[i];
            const v2 = vertices[(i + 1) % vertices.length];
            const l2 = Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2);
            let t = ((cx - v1.x) * (v2.x - v1.x) + (cy - v1.y) * (v2.y - v1.y)) / l2;
            t = Math.max(0, Math.min(1, t));
            const closestX = v1.x + t * (v2.x - v1.x);
            const closestY = v1.y + t * (v2.y - v1.y);
            const distSq = Math.pow(cx - closestX, 2) + Math.pow(cy - closestY, 2);
            if (distSq < radius * radius) return true;
        }
        return false;
    }

    _drawGlitchPhaseOne(ctx, x, y, e, alphaScale = 1) {
        const visual = GLITCH_EFFECT_CONFIG.visual.primary;
        const colors = GLITCH_EFFECT_CONFIG.visual.colors;
        const jitter1 = (Math.random() - 0.5) * visual.jitter;
        const jitter2 = (Math.random() - 0.5) * visual.jitter;

        ctx.save();
        ctx.globalAlpha = visual.alpha * alphaScale;
        ctx.fillStyle = colors.cyan;
        ctx.strokeStyle = colors.cyan;
        ctx.lineWidth = this.outlineWidth;
        this._drawShape(ctx, x + jitter1, y + jitter1, e);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = visual.alpha * alphaScale;
        ctx.fillStyle = colors.magenta;
        ctx.strokeStyle = colors.magenta;
        ctx.lineWidth = this.outlineWidth;
        this._drawShape(ctx, x + jitter2, y + jitter2, e);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = (Math.random() > visual.whiteFlashChance ? 1 : 0.4) * alphaScale;
        ctx.fillStyle = colors.white;
        ctx.strokeStyle = colors.white;
        ctx.lineWidth = this.outlineWidth;
        this._drawShape(ctx, x, y, e);
        ctx.restore();
    }

    _drawShape(ctx, x, y, e) {
        ctx.beginPath();
        if (e.type === 'TRIANGLE') {
            ctx.moveTo(x, y - e.size / 2);
            ctx.lineTo(x + e.size / 2, y + e.size / 2);
            ctx.lineTo(x - e.size / 2, y + e.size / 2);
        } else if (e.type === 'SQUARE') {
            ctx.rect(x - e.size / 2, y - e.size / 2, e.size, e.size);
        } else if (e.type === 'HEXAGON') {
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const px = x + (e.size / 2) * Math.cos(angle);
                const py = y + (e.size / 2) * Math.sin(angle);
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
        } else if (e.type === 'CIRCLE') {
            ctx.arc(x, y, e.size / 2, 0, Math.PI * 2);
        } else if (e.type === 'RHOMBUS') {
            ctx.moveTo(x, y - e.size / 2);
            ctx.lineTo(x + e.size / 2, y);
            ctx.lineTo(x, y + e.size / 2);
            ctx.lineTo(x - e.size / 2, y);
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

    _drawTag(ctx, x, y, e) {
        e.tagAnimationTimer = (e.tagAnimationTimer || 0) + 0.015; 
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(e.tagAnimationTimer);
        
        ctx.strokeStyle = '#bc00ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#bc00ff';

        const r = (e.size / 2) * 1.25;
        
        ctx.beginPath();
        ctx.setLineDash([8, 8]);
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.setLineDash([]);
        const stickLength = 16;
        ctx.beginPath();
        ctx.moveTo(-r - stickLength, 0); ctx.lineTo(-r, 0);
        ctx.moveTo(r, 0); ctx.lineTo(r + stickLength, 0);
        ctx.moveTo(0, -r - stickLength); ctx.lineTo(0, -r);
        ctx.moveTo(0, r); ctx.lineTo(0, r + stickLength);
        ctx.stroke();

        ctx.restore();
    }
}