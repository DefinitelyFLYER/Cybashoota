import { DRONE_TYPES } from '../data/DroneTypes.js';
import { GLITCH_PHASES } from '../data/HackData.js';

export default class DroneManager {
    constructor() {
        this.drones = [];
        this.sprites = new Map();
        
        this.testSpawnCooldown = 0;
        this.droneMods = {
            'ALL': { damageBonus: 0, speedMulti: 1.0 },
            'RANGED': { fireRateMulti: 1.0, rangeMulti: 1.0, damageBonus: 0 },
            'INTERCEPTOR': { blockRadiusMulti: 1.0, cooldownMulti: 1.0, speedMulti: 1.0 },
            'DEBUFF': { actionRateMulti: 1.0, rangeMulti: 1.0 },
            'TESLA': { actionRateMulti: 1.0, rangeMulti: 1.0, chainBonus: 0, damageBonus: 0 },
            'SUPPORT': { actionRateMulti: 1.0, rangeMulti: 1.0, speedMulti: 1.0 },
            'MELEE': { actionRateMulti: 1.0, speedMulti: 1.0, damageBonus: 0 }
        };
    }

    init(game) {
        this.game = game;
        this._preloadSprites();
    }

    reset() {
        this.drones = [];
        this.testSpawnCooldown = 0;
        this.droneMods = {
            'ALL': { damageBonus: 0, speedMulti: 1.0 },
            'RANGED': { fireRateMulti: 1.0, rangeMulti: 1.0, damageBonus: 0 },
            'INTERCEPTOR': { blockRadiusMulti: 1.0, cooldownMulti: 1.0, speedMulti: 1.0 },
            'DEBUFF': { actionRateMulti: 1.0, rangeMulti: 1.0 },
            'TESLA': { actionRateMulti: 1.0, rangeMulti: 1.0, chainBonus: 0, damageBonus: 0 },
            'SUPPORT': { actionRateMulti: 1.0, rangeMulti: 1.0, speedMulti: 1.0 },
            'MELEE': { actionRateMulti: 1.0, speedMulti: 1.0, damageBonus: 0 }
        };
    }

    _preloadSprites() {
        for (const key in DRONE_TYPES) {
            const config = DRONE_TYPES[key];
            if (config.sprite) {
                const img = new Image();
                img.src = config.sprite;
                this.sprites.set(key, img);
            }
        }
    }

    /**
     * @param {string} typeId
     */
    spawnDrone(typeId) {
        const config = DRONE_TYPES[typeId];
        if (!config) return;

        const player = this.game ? this.game.getModule('player') : null;
        if (player && this.drones.length >= player.stats.maxDrones && this.drones.length > 0) {
            this.drones.shift();
        }

        const startX = player ? player.pos.x : 0;
        const startY = player ? player.pos.y : 0;

        this.drones.push({
            ...config,
            currentAngle: Math.random() * Math.PI * 2,
            actionTimer: 0,
            x: startX,
            y: startY,
            vx: 0,
            vy: 0
        });
        const codex = this.game?.getModule('codex');
        if (codex) codex.discover('drones', typeId);
        console.log(`Spawned Drone: ${config.name}`);
    }

    removeDrone(typeId) {
        const idx = this.drones.findIndex(d => d.id === typeId);
        if (idx === -1) return null;
        return this.drones.splice(idx, 1)[0];
    }

    update(deltaTime) {
        const player = this.game.getModule('player');
        const input = this.game.getModule('input');
        if (!player) return;

        const isEmpDisrupted = (player.empDisruptedTimer || 0) > 0;

        for (const drone of this.drones) {
            if (!isEmpDisrupted) {
                drone.actionTimer += deltaTime;
            }

            let isIntercepting = false;
            if (!isEmpDisrupted) {
                switch (drone.behavior) {
                    case 'RANGED':
                        this._handleRangedBehavior(drone, deltaTime);
                        break;
                    case 'INTERCEPTOR':
                        isIntercepting = this._handleInterceptorBehavior(drone, deltaTime);
                        break;
                    case 'DEBUFF':
                        this._handleDebuffBehavior(drone, deltaTime);
                        break;
                    case 'TESLA':
                        this._handleTeslaBehavior(drone, deltaTime);
                        break;
                    case 'SUPPORT':
                        isIntercepting = this._handleSupportBehavior(drone, deltaTime);
                        break;
                    case 'MELEE':
                        isIntercepting = this._handleMeleeBehavior(drone, deltaTime);
                        break;
                }
            }

            if (!isIntercepting) {
                const speedMulti = this._getStat(drone, 'speedMulti', player);
                if (drone.movement === 'ORBIT') {
                    drone.currentAngle += drone.orbitSpeed * speedMulti * deltaTime;
                    
                    const radiusPx = drone.orbitRadius * this.game.UNIT_SIZE;
                    const targetX = player.pos.x + Math.cos(drone.currentAngle) * radiusPx;
                    const targetY = player.pos.y + Math.sin(drone.currentAngle) * radiusPx;
                    
                    const orbitLerpBase = Math.min(0.95, 0.03 * speedMulti);
                    const lerpFactor = 1 - Math.pow(1 - orbitLerpBase, deltaTime / 16);
                    drone.x += (targetX - drone.x) * lerpFactor;
                    drone.y += (targetY - drone.y) * lerpFactor;

                } else if (drone.movement === 'FOLLOW') {
                    const offsetX = drone.followOffset.x * this.game.UNIT_SIZE;
                    const offsetY = drone.followOffset.y * this.game.UNIT_SIZE;
                    
                    const targetX = player.pos.x + (offsetX * player.facing);
                    const targetY = player.pos.y + offsetY;
                    
                    const followLerpBase = Math.min(0.95, drone.followSpeed * speedMulti);
                    const lerpFactor = 1 - Math.pow(1 - followLerpBase, deltaTime / 16);
                    drone.x += (targetX - drone.x) * lerpFactor;
                    drone.y += (targetY - drone.y) * lerpFactor;
                }
            }
        }
    }

    _handleInterceptorBehavior(drone, deltaTime) {
        const projMgr = this.game.getModule('projectiles');
        const player = this.game.getModule('player');
        
        if (!projMgr || projMgr.enemyProjectiles.length === 0 || !player) {
            drone.vx = 0;
            drone.vy = 0;
            drone.interceptTarget = null;
            return false;
        }

        if (drone.interceptTarget && !projMgr.enemyProjectiles.includes(drone.interceptTarget)) {
            drone.vx = 0;
            drone.vy = 0;
            drone.interceptTarget = null;
        }

        let bestTarget = null;
        let highestDanger = -1;
        
        const patrolRange = (this._getStat(drone, 'patrolRadius', player) || 4) * this.game.UNIT_SIZE;

        for (const p of projMgr.enemyProjectiles) {
            let isClaimed = false;
            for (const other of this.drones) {
                if (other !== drone && other.interceptTarget === p) isClaimed = true;
            }
            if (isClaimed) continue;

            const vpx = player.pos.x - p.x;
            const vpy = player.pos.y - p.y;
            const distToPlayer = Math.sqrt(vpx * vpx + vpy * vpy);
            
            if (distToPlayer > patrolRange) continue;

            const pMag = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (pMag === 0) continue;
            const pnx = p.vx / pMag;
            const pny = p.vy / pMag;
            
            const dot = vpx * pnx + vpy * pny;

            if (dot > 0) { 
                const closestPointX = p.x + pnx * dot;
                const closestPointY = p.y + pny * dot;
                const distToPath = Math.sqrt(Math.pow(player.pos.x - closestPointX, 2) + Math.pow(player.pos.y - closestPointY, 2));

                let danger = 0;
                const hitThreshold = player.size * 0.8;

                if (distToPath < hitThreshold) {
                    danger = 1000 / (dot + 1); 
                }

                if (danger > highestDanger) {
                    highestDanger = danger;
                    bestTarget = p;
                }
            }
        }

        if (bestTarget) {
            drone.interceptTarget = bestTarget;

            const tx = bestTarget.x - drone.x;
            const ty = bestTarget.y - drone.y;
            const tDist = Math.sqrt(tx * tx + ty * ty);
            const nx = tDist > 0 ? tx / tDist : 0;
            const ny = tDist > 0 ? ty / tDist : 0;

            let boostFactor = 1.0;
            if (highestDanger > 0) {
                const maxBoost = this._getStat(drone, 'maxBoost', player) || 1.0;
                boostFactor = Math.min(maxBoost, 1.0 + (highestDanger / 100));
            }

            const speedMulti = this._getStat(drone, 'speedMulti', player);
            const baseAccel = this._getStat(drone, 'droneAccuracy', player) * 0.8;
            const finalAccel = baseAccel * boostFactor * speedMulti;
            
            drone.vx += nx * finalAccel * deltaTime;
            drone.vy += ny * finalAccel * deltaTime;

            drone.vx *= 0.90;
            drone.vy *= 0.90;

            const baseMaxSpeed = 1.5 * this.game.UNIT_SIZE;
            const currentMaxSpeed = baseMaxSpeed * boostFactor * speedMulti;

            const speed = Math.sqrt(drone.vx * drone.vx + drone.vy * drone.vy);
            if (speed > currentMaxSpeed) {
                drone.vx = (drone.vx / speed) * currentMaxSpeed;
                drone.vy = (drone.vy / speed) * currentMaxSpeed;
            }

            drone.x += drone.vx * (deltaTime / 16);
            drone.y += drone.vy * (deltaTime / 16);
            return true;
        }

        drone.vx = 0;
        drone.vy = 0;
        return false;
    }

    _handleRangedBehavior(drone, deltaTime) {
        const player = this.game.getModule('player');
        if (!player) return;

        const currentFireRate = this._getStat(drone, 'fireRate', player);

        if (drone.actionTimer < currentFireRate) return;

        let target = null;
        const currentRangePx = this._getStat(drone, 'range', player) * this.game.UNIT_SIZE;

        if (drone.targeting === 'CURSOR') {
            const projMgr = this.game.getModule('projectiles');
            if (projMgr) {
                const aimX = projMgr.crosshairX ?? projMgr.mouseX;
                const aimY = projMgr.crosshairY ?? projMgr.mouseY;
                target = {
                    x: aimX + player.pos.x - this.game.center.x,
                    y: aimY + player.pos.y - this.game.center.y
                };
            }
        } else {
            const enemyMgr = this.game.getModule('enemies');
            if (!enemyMgr || enemyMgr.enemies.length === 0) return;

            if (drone.targeting === 'CLOSEST_ENEMY') {
                let minDist = currentRangePx;
                for (const e of enemyMgr.enemies) {
                    const dx = e.x - drone.x;
                    const dy = e.y - drone.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDist) {
                        minDist = dist;
                        target = e;
                    }
                }
            } else if (drone.targeting === 'RANDOM_ENEMY') {
                const inRange = enemyMgr.enemies.filter(e => {
                    const dx = e.x - drone.x;
                    const dy = e.y - drone.y;
                    return Math.sqrt(dx * dx + dy * dy) < currentRangePx;
                });
                if (inRange.length > 0) {
                    target = inRange[Math.floor(Math.random() * inRange.length)];
                }
            }
        }

        if (target) {
            this._shootAtTarget(drone, target, player);
            drone.actionTimer = 0; 
        }
    }

    _handleDebuffBehavior(drone, deltaTime) {
        const player = this.game.getModule('player');
        if (!player) return;

        const currentActionRate = this._getStat(drone, 'actionRate', player);
        if (drone.actionTimer < currentActionRate) return;

        const enemyMgr = this.game.getModule('enemies');
        if (!enemyMgr || enemyMgr.enemies.length === 0) return;

        const currentRangePx = this._getStat(drone, 'range', player) * this.game.UNIT_SIZE;
        const targetCount = this._getStat(drone, 'debuffTargets', player);

        const validTargets = enemyMgr.enemies.filter(e => {
            if (e.isTagged) return false; 
            const dx = e.x - drone.x;
            const dy = e.y - drone.y;
            return Math.sqrt(dx * dx + dy * dy) < currentRangePx;
        });

        if (validTargets.length === 0) return;

        let taggedAny = false;
        const particles = this.game.getModule('particles');
        const synergyMgr = this.game.getModule('synergies');
        const applyViralGlitch = synergyMgr && synergyMgr.hasSynergy('viral_swarm');

        for (let i = 0; i < targetCount; i++) {
            if (validTargets.length === 0) break;
            
            const randomIndex = Math.floor(Math.random() * validTargets.length);
            const target = validTargets.splice(randomIndex, 1)[0]; 

            target.isTagged = true;
            target.tagMultiplier = this._getStat(drone, 'debuffMultiplier', player);
            target.tagAnimationTimer = 0;

            if (applyViralGlitch) {
                target.glitchPhase = GLITCH_PHASES.PRIMARY;
            }

            if (particles) {
                particles.emit(target.x, target.y, drone.color, 15);
            }
            taggedAny = true;
        }

        if (taggedAny) {
            drone.actionTimer = 0;
        }
    }

    _handleTeslaBehavior(drone, deltaTime) {
        const player = this.game.getModule('player');
        const enemyMgr = this.game.getModule('enemies');
        const synergyMgr = this.game.getModule('synergies');
        const particles = this.game.getModule('particles');
        if (!player || !enemyMgr || enemyMgr.enemies.length === 0) return;

        const actionRate = this._getStat(drone, 'actionRate', player);
        if (drone.actionTimer < actionRate) return;

        const rangePx = this._getStat(drone, 'range', player) * this.game.UNIT_SIZE;
        let firstTarget = null;
        let minDist = rangePx;

        for (const e of enemyMgr.enemies) {
            if (e.currentHp <= 0) continue;
            const dx = e.x - drone.x;
            const dy = e.y - drone.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                firstTarget = e;
            }
        }

        if (!firstTarget) return;

        drone.actionTimer = 0;
        const dmg = this._getStat(drone, 'damage', player);
        const upgrades = this.game.getModule('upgrades');
        const chainBonus = upgrades?.droneMods?.TESLA?.chainBonus || 0;
        const hasStormConduit = synergyMgr && synergyMgr.hasSynergy('storm_conduit');
        const totalChains = (drone.chainCount || 3) + chainBonus + (hasStormConduit ? 3 : 0);

        let originX = drone.x;
        let originY = drone.y;
        let current = firstTarget;
        const hit = new Set();

        for (let c = 0; c < totalChains && current; c++) {
            hit.add(current);
            const dealt = (current.isTagged && current.tagMultiplier) ? dmg * current.tagMultiplier : dmg;
            current.currentHp -= dealt;
            current.speedModifier = Math.min(current.speedModifier ?? 1, 0.55);

            if (hasStormConduit && current.glitchPhase === GLITCH_PHASES.NORMAL) {
                current.glitchPhase = GLITCH_PHASES.SECONDARY;
            }

            if (synergyMgr) {
                synergyMgr.addLightningArc(originX, originY, current.x, current.y, '#00bcff');
            }
            if (particles) {
                particles.emit(current.x, current.y, '#00bcff', 5);
            }

            originX = current.x;
            originY = current.y;

            // Find next nearest unhit enemy
            let nextEnemy = null;
            let nextMin = 240;
            for (const other of enemyMgr.enemies) {
                if (hit.has(other) || other.currentHp <= 0) continue;
                const d = Math.hypot(other.x - originX, other.y - originY);
                if (d < nextMin) {
                    nextMin = d;
                    nextEnemy = other;
                }
            }
            current = nextEnemy;
        }
    }

    _handleSupportBehavior(drone, deltaTime) {
        const player = this.game.getModule('player');
        if (!player) return false;

        const expMgr = this.game.getModule('experience');
        const powerMgr = this.game.getModule('powerups');
        const augmentMgr = this.game.getModule('augments');
        const synergyMgr = this.game.getModule('synergies');
        const particles = this.game.getModule('particles');

        // Periodic Nano-Pulse repair
        const actionRate = this._getStat(drone, 'actionRate', player);
        if (drone.actionTimer >= actionRate) {
            drone.actionTimer = 0;
            let healed = false;
            if (player.stats.hp < player.stats.maxHp) {
                player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + 1);
                healed = true;
            } else if (typeof player.getMaxArmor === 'function' && player.armorCharges < player.getMaxArmor()) {
                player.armorCharges += 1;
                healed = true;
            } else if (synergyMgr && synergyMgr.hasSynergy('nano_harvest')) {
                player.stats.hp += 1; // +1 Shield HP
                healed = true;
            }
            if (healed && particles) {
                particles.emit(player.pos.x, player.pos.y, '#00ff66', 16);
            }
        }

        // Fly toward nearest collectible within range
        const rangePx = this._getStat(drone, 'range', player) * this.game.UNIT_SIZE;
        let targetDrop = null;
        let minDist = rangePx;

        const checkList = (arr) => {
            if (!arr) return;
            for (const item of arr) {
                const d = Math.hypot(item.x - drone.x, item.y - drone.y);
                if (d < minDist) {
                    minDist = d;
                    targetDrop = item;
                }
            }
        };

        checkList(expMgr?.orbs);
        checkList(powerMgr?.drops);
        checkList(augmentMgr?.scrapDrops);
        if (augmentMgr && augmentMgr.getStoredCount() < augmentMgr.maxStorage) {
            checkList(augmentMgr.drops);
        }

        if (targetDrop && minDist > 2) {
            const speedMulti = this._getStat(drone, 'speedMulti', player);
            const step = (drone.collectSpeed || 0.45) * speedMulti * deltaTime;
            drone.x += ((targetDrop.x - drone.x) / minDist) * step;
            drone.y += ((targetDrop.y - drone.y) / minDist) * step;

            // Pull collected orbs/scrap toward player once touched
            if (minDist < 28) {
                targetDrop.x = player.pos.x;
                targetDrop.y = player.pos.y;
                if (synergyMgr && synergyMgr.hasSynergy('nano_harvest') && Math.random() < 0.03) {
                    augmentMgr.scrap += 1;
                }
            }
            return true;
        }
        return false;
    }

    _handleMeleeBehavior(drone, deltaTime) {
        const player = this.game.getModule('player');
        const enemyMgr = this.game.getModule('enemies');
        const synergyMgr = this.game.getModule('synergies');
        const particles = this.game.getModule('particles');
        if (!player || !enemyMgr || enemyMgr.enemies.length === 0) return false;

        const hasBloodGrinder = synergyMgr && synergyMgr.hasSynergy('blood_grinder');
        const rangePx = this._getStat(drone, 'range', player) * this.game.UNIT_SIZE * (hasBloodGrinder ? 1.35 : 1);

        let target = null;
        let minDist = rangePx;
        for (const e of enemyMgr.enemies) {
            if (e.currentHp <= 0) continue;
            const d = Math.hypot(e.x - drone.x, e.y - drone.y);
            if (d < minDist) {
                minDist = d;
                target = e;
            }
        }

        if (!target) return false;

        const speedMulti = this._getStat(drone, 'speedMulti', player) * (hasBloodGrinder ? 1.4 : 1);
        const step = (drone.dashSpeed || 0.48) * speedMulti * deltaTime;
        if (minDist > 1) {
            drone.x += ((target.x - drone.x) / minDist) * step;
            drone.y += ((target.y - drone.y) / minDist) * step;
        }

        const hitInterval = this._getStat(drone, 'actionRate', player);
        const sawRadius = (drone.size * (hasBloodGrinder ? 1.8 : 1.0)) * 0.55;
        const hasShredder = synergyMgr && synergyMgr.hasSynergy('shredder_protocol');
        if (drone.actionTimer >= hitInterval) {
            let hitAny = false;
            const dmg = this._getStat(drone, 'damage', player) * (hasBloodGrinder ? 2 : 1);
            for (const e of enemyMgr.enemies) {
                if (e.currentHp <= 0) continue;
                const d = Math.hypot(e.x - drone.x, e.y - drone.y);
                if (d <= sawRadius + e.size * 0.5) {
                    if (hasShredder && !e.isTagged) {
                        e.isTagged = true;
                        e.tagMultiplier = 2.5;
                        e.tagAnimationTimer = 0;
                    }
                    let dealt = (e.isTagged && e.tagMultiplier) ? dmg * e.tagMultiplier : dmg;
                    if (hasShredder && e.isTagged) {
                        dealt *= 2.0;
                    }
                    e.currentHp -= dealt;
                    hitAny = true;
                    if (particles) particles.emit(e.x, e.y, '#ff2244', 4);
                    if (synergyMgr && synergyMgr.hasSynergy('tesla_saw')) {
                        const arcRange = 1.8 * (this.game.UNIT_SIZE || 100);
                        let arcTarget = null;
                        let bestArcD = arcRange * arcRange;
                        for (const other of enemyMgr.enemies) {
                            if (other === e || other.currentHp <= 0) continue;
                            const dSq = (other.x - e.x) ** 2 + (other.y - e.y) ** 2;
                            if (dSq < bestArcD) {
                                bestArcD = dSq;
                                arcTarget = other;
                            }
                        }
                        if (arcTarget) {
                            arcTarget.currentHp -= 3;
                            if (synergyMgr.addLightningArc) {
                                synergyMgr.addLightningArc(e.x, e.y, arcTarget.x, arcTarget.y, '#00e5ff');
                            }
                        }
                    }
                    if (hasBloodGrinder) {
                        drone.sawHitCount = (drone.sawHitCount || 0) + 1;
                        if (drone.sawHitCount >= 25) {
                            drone.sawHitCount = 0;
                            player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + 1);
                        }
                    }
                }
            }
            if (hitAny) drone.actionTimer = 0;
        }
        return true;
    }

    _shootAtTarget(drone, target, player) {
        const projMgr = this.game.getModule('projectiles');
        const particles = this.game.getModule('particles');
        const synergyMgr = this.game.getModule('synergies');
        if (!projMgr) return;

        const dx = target.x - drone.x;
        const dy = target.y - drone.y;
        const angle = Math.atan2(dy, dx);

        const speed = this._getStat(drone, 'projectileSpeed', player);
        const dmg = this._getStat(drone, 'damage', player);

        // Synergy: Orbital Railcannon (Sniper Drone fires piercing rail-beam across screen)
        if (drone.id === 'SNIPER_DRONE' && synergyMgr && synergyMgr.hasSynergy('orbital_railcannon')) {
            const beamLen = 1400;
            const endX = drone.x + Math.cos(angle) * beamLen;
            const endY = drone.y + Math.sin(angle) * beamLen;
            synergyMgr.addRailBeam(drone.x, drone.y, endX, endY, '#ff0055');

            const enemyMgr = this.game.getModule('enemies');
            const beamDmg = dmg * 3;
            const dirX = Math.cos(angle);
            const dirY = Math.sin(angle);

            if (enemyMgr && enemyMgr.enemies) {
                for (const e of enemyMgr.enemies) {
                    if (e.currentHp <= 0) continue;
                    const ex = e.x - drone.x;
                    const ey = e.y - drone.y;
                    const dot = ex * dirX + ey * dirY;
                    if (dot < 0 || dot > beamLen) continue;
                    const perpDist = Math.abs(ex * dirY - ey * dirX);
                    if (perpDist <= e.size * 0.65 + 10) {
                        const dealt = (e.isTagged && e.tagMultiplier) ? beamDmg * e.tagMultiplier : beamDmg;
                        e.currentHp -= dealt;
                        if (particles) particles.emit(e.x, e.y, '#ff0055', 8);
                    }
                }
            }
            if (particles) particles.emitMuzzle(drone.x, drone.y, angle, '#ff0055', 6);
            return;
        }

        // Synergy: Bullet Choir & Tesla Coil for Assault Drone
        const isAssault = drone.id === 'BASIC_SHOOTER';
        const isSniper = drone.id === 'SNIPER_DRONE';
        const hackMgr = this.game.getModule('hack');
        const hasBulletChoir = isAssault && synergyMgr && synergyMgr.hasSynergy('bullet_choir');
        const hasTeslaCoil = isAssault && synergyMgr && synergyMgr.hasSynergy('tesla_coil');
        const hasIonBarrage = isAssault && synergyMgr && synergyMgr.hasSynergy('ion_barrage');
        const hasSpotterCrit = isSniper && synergyMgr && synergyMgr.hasSynergy('spotter_beam') && Boolean(hackMgr?.activeDecoy);
        const sniperExecuteBonus = (isSniper && synergyMgr && synergyMgr.hasSynergy('grim_reaper') && target.maxHp > 0 && (target.currentHp / target.maxHp) <= 0.60) ? 1.5 : 1.0;

        const shotCount = hasBulletChoir ? 3 : 1;
        const spreadRad = 12 * (Math.PI / 180);
        const bounces = hasBulletChoir ? (player.getStat('ricochetCount') || 0) : 0;
        const critChance = hasBulletChoir ? (player.getStat('critChance') || 0) : 0;

        for (let i = 0; i < shotCount; i++) {
            const offset = shotCount > 1 ? (i - (shotCount - 1) / 2) * spreadRad : 0;
            const finalAngle = angle + offset;
            const chainRoll = hasTeslaCoil ? 2 : (hasIonBarrage && Math.random() < 0.30 ? 2 : 0);
            projMgr.projectiles.push({
                x: drone.x,
                y: drone.y,
                vx: Math.cos(finalAngle) * speed,
                vy: Math.sin(finalAngle) * speed,
                size: hasBulletChoir ? 8 : 6,
                life: 1500,
                isCrit: hasSpotterCrit || (critChance > 0 && Math.random() < critChance),
                bounces,
                penetration: 0,
                chainLightning: chainRoll,
                color: chainRoll > 0 ? '#00bcff' : drone.color,
                damage: dmg * sniperExecuteBonus,
                hitEnemies: new Set(),
                lastHitEnemy: null
            });
        }

        if (particles) {
            particles.emitMuzzle(drone.x, drone.y, angle, drone.color, 3);
        }
    }

    _getStat(drone, statName, player) {
        let baseVal = drone[statName];
        if (typeof baseVal === 'function') baseVal = baseVal(player);

        const upgrades = this.game.getModule('upgrades');
        const augmentMgr = this.game.getModule('augments');
        const synergyMgr = this.game.getModule('synergies');
        if (!upgrades) return baseVal;

        const globalMods = upgrades.droneMods['ALL'] || {};
        const specificMods = upgrades.droneMods[drone.behavior] || {};
        const setDmgBonus = augmentMgr ? augmentMgr.getDroneDamageBonus() : 0;
        let setRateMulti = augmentMgr ? augmentMgr.getDroneRateMultiplier() : 1.0;
        if (synergyMgr && synergyMgr.cyberOverloadTimer > 0) {
            setRateMulti *= 0.45;
        }

        switch(statName) {
            case 'damage':
            case 'collisionDamage': {
                let dmgBonus = (globalMods.damageBonus || 0) + (specificMods.damageBonus || 0) + setDmgBonus;
                if (synergyMgr) {
                    if (synergyMgr.hasSynergy('swarm_protocol')) dmgBonus += 2;
                    if (drone.id === 'SAW_DRONE' && synergyMgr.hasSynergy('tesla_saw')) dmgBonus += 3;
                    if (drone.id === 'SNIPER_DRONE' && synergyMgr.hasSynergy('aegis_sniper')) dmgBonus += 2;
                    if (drone.id === 'ARC_DRONE' && synergyMgr.hasSynergy('emp_harvester')) dmgBonus += 3;
                }
                return baseVal + dmgBonus;
            }
                
            case 'blockRadius': {
                let blockMulti = specificMods.blockRadiusMulti || 1;
                return baseVal * blockMulti;
            }

            case 'range': {
                let rangeMulti = specificMods.rangeMulti || 1;
                if (drone.id === 'HARVESTER_DRONE' && synergyMgr && synergyMgr.hasSynergy('emp_harvester')) {
                    rangeMulti *= 1.6;
                }
                return baseVal * rangeMulti;
            }

            case 'speedMulti': {
                let baseSpeedMulti = (globalMods.speedMulti || 1) + ((specificMods.speedMulti || 1) - 1);
                if (drone.id === 'SAW_DRONE' && synergyMgr && synergyMgr.hasSynergy('saw_assault')) {
                    baseSpeedMulti *= 1.35;
                }
                return baseSpeedMulti * (1 / setRateMulti);
            }
                
            case 'fireRate':
            case 'cooldown':
            case 'actionRate': {
                let timeMulti = (specificMods[`${statName}Multi`] || 1) * setRateMulti;
                if (synergyMgr) {
                    if (synergyMgr.hasSynergy('swarm_protocol')) timeMulti *= 0.8;
                    if (drone.id === 'ARC_DRONE' && synergyMgr.hasSynergy('ion_barrage')) {
                        timeMulti *= 0.7;
                    }
                    if (drone.id === 'SNIPER_DRONE' && synergyMgr.hasSynergy('aegis_sniper')) {
                        timeMulti *= 0.71;
                    }
                    if (drone.id === 'BASIC_SHOOTER' && synergyMgr.hasSynergy('saw_assault')) {
                        timeMulti *= 0.8;
                    }
                    if (drone.id === 'HARVESTER_DRONE' && synergyMgr.hasSynergy('blood_tax')) {
                        timeMulti *= 0.5;
                    }
                    if (drone.id === 'SNIPER_DRONE' && synergyMgr.hasSynergy('spotter_beam')) {
                        const hackMgr = this.game.getModule('hack');
                        if (hackMgr?.activeDecoy) timeMulti *= 0.5;
                    }
                }
                return baseVal * timeMulti;
            }
                
            default:
                return baseVal;
        }
    }

    draw(ctx) {
        const player = this.game.getModule('player');
        if (!player) return;

        ctx.save();
        for (const drone of this.drones) {
            const screenX = drone.x - player.pos.x + this.game.center.x;
            const screenY = drone.y - player.pos.y + this.game.center.y;

            const sprite = this.sprites.get(drone.id);
            const synergyMgr = this.game.getModule('synergies');
            const scale = (drone.id === 'SAW_DRONE' && synergyMgr && synergyMgr.hasSynergy('blood_grinder')) ? 1.8 : 1;
            const drawSize = drone.size * scale;

            if (sprite && sprite.complete && sprite.naturalWidth > 0) {
                ctx.drawImage(sprite, screenX - drawSize / 2, screenY - drawSize / 2, drawSize, drawSize);
            } else {
                const glowEnabled = this.game?.settings?.performance?.glowEffects !== false;
                ctx.shadowBlur = glowEnabled ? 10 : 0;
                ctx.shadowColor = drone.color;
                ctx.fillStyle = drone.color;
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;

                ctx.beginPath();
                ctx.moveTo(screenX, screenY - drone.size / 2);
                ctx.lineTo(screenX + drone.size / 2, screenY);
                ctx.lineTo(screenX, screenY + drone.size / 2);
                ctx.lineTo(screenX - drone.size / 2, screenY);
                ctx.closePath();
                
                ctx.fill();
                ctx.stroke();
                
                ctx.shadowBlur = 0; 
            }
        }
        ctx.restore();
    }
}
