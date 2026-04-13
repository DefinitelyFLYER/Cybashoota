import { DRONE_TYPES } from '../data/DroneTypes.js';

export default class DroneManager {
    constructor() {
        this.drones = [];
        this.sprites = new Map();
        
        this.testSpawnCooldown = 0;
        this.droneMods = {
            'ALL': { damageBonus: 0, speedMulti: 1.0 },
            'RANGED': { fireRateMulti: 1.0, rangeMulti: 1.0, damageBonus: 0 },
            'INTERCEPTOR': { blockRadiusMulti: 1.0, cooldownMulti: 1.0, speedMulti: 1.0 },
            'DEBUFF': { actionRateMulti: 1.0, rangeMulti: 1.0 }
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
            'DEBUFF': { actionRateMulti: 1.0, rangeMulti: 1.0 }
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

        this.drones.push({
            ...config,
            currentAngle: Math.random() * Math.PI * 2,
            actionTimer: 0,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0
        });
        console.log(`Spawned Drone: ${config.name}`);
    }

    update(deltaTime) {
        const player = this.game.getModule('player');
        const input = this.game.getModule('input');
        if (!player) return;

        for (const drone of this.drones) {
            drone.actionTimer += deltaTime;

            let isIntercepting = false;
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
            }

            if (!isIntercepting) {
                if (drone.movement === 'ORBIT') {
                    drone.currentAngle += drone.orbitSpeed * deltaTime;
                    
                    const radiusPx = drone.orbitRadius * this.game.UNIT_SIZE;
                    const targetX = player.pos.x + Math.cos(drone.currentAngle) * radiusPx;
                    const targetY = player.pos.y + Math.sin(drone.currentAngle) * radiusPx;
                    
                    const lerpFactor = 1 - Math.pow(1 - 0.03, deltaTime / 16);
                    drone.x += (targetX - drone.x) * lerpFactor;
                    drone.y += (targetY - drone.y) * lerpFactor;

                } else if (drone.movement === 'FOLLOW') {
                    const offsetX = drone.followOffset.x * this.game.UNIT_SIZE;
                    const offsetY = drone.followOffset.y * this.game.UNIT_SIZE;
                    
                    const targetX = player.pos.x + (offsetX * player.facing);
                    const targetY = player.pos.y + offsetY;
                    
                    const lerpFactor = 1 - Math.pow(1 - drone.followSpeed, deltaTime / 16);
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
            const nx = tx / tDist;
            const ny = ty / tDist;

            let boostFactor = 1.0;
            if (highestDanger > 0) {
                const maxBoost = this._getStat(drone, 'maxBoost', player) || 1.0;
                boostFactor = Math.min(maxBoost, 1.0 + (highestDanger / 100));
            }

            const baseAccel = this._getStat(drone, 'droneAccuracy', player) * 0.8;
            const finalAccel = baseAccel * boostFactor;
            
            drone.vx += nx * finalAccel * deltaTime;
            drone.vy += ny * finalAccel * deltaTime;

            drone.vx *= 0.90;
            drone.vy *= 0.90;

            const baseMaxSpeed = 1.5 * this.game.UNIT_SIZE;
            const currentMaxSpeed = baseMaxSpeed * boostFactor;

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
                target = {
                    x: projMgr.mouseX + player.pos.x - this.game.center.x,
                    y: projMgr.mouseY + player.pos.y - this.game.center.y
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

        for (let i = 0; i < targetCount; i++) {
            if (validTargets.length === 0) break;
            
            const randomIndex = Math.floor(Math.random() * validTargets.length);
            const target = validTargets.splice(randomIndex, 1)[0]; 

            target.isTagged = true;
            target.tagMultiplier = this._getStat(drone, 'debuffMultiplier', player);
            target.tagAnimationTimer = 0;

            if (particles) {
                particles.emit(target.x, target.y, drone.color, 15);
            }
            taggedAny = true;
        }

        if (taggedAny) {
            drone.actionTimer = 0;
        }
    }

    _shootAtTarget(drone, target, player) {
        const projMgr = this.game.getModule('projectiles');
        const particles = this.game.getModule('particles');
        if (!projMgr) return;

        const dx = target.x - drone.x;
        const dy = target.y - drone.y;
        const angle = Math.atan2(dy, dx);

        const speed = this._getStat(drone, 'projectileSpeed', player);
        const dmg = this._getStat(drone, 'damage', player);

        projMgr.projectiles.push({
            x: drone.x,
            y: drone.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 6,
            life: 1500,
            isCrit: false,
            bounces: 0,
            penetration: 0,
            color: drone.color,
            damage: dmg,
            hitEnemies: new Set(),
            lastHitEnemy: null
        });

        if (particles) {
            particles.emitMuzzle(drone.x, drone.y, angle, drone.color, 3);
        }
    }

    _getStat(drone, statName, player) {
        let baseVal = drone[statName];
        if (typeof baseVal === 'function') baseVal = baseVal(player);

        const upgrades = this.game.getModule('upgrades');
        if (!upgrades) return baseVal;

        const globalMods = upgrades.droneMods['ALL'] || {};
        const specificMods = upgrades.droneMods[drone.behavior] || {};

        switch(statName) {
            case 'damage':
                let dmgBonus = (globalMods.damageBonus || 0) + (specificMods.damageBonus || 0);
                return baseVal + dmgBonus;
                
            case 'blockRadius':
                let blockMulti = specificMods.blockRadiusMulti || 1;
                return baseVal * blockMulti;
                
            case 'fireRate':
            case 'cooldown':
            case 'actionRate':
                let timeMulti = specificMods[`${statName}Multi`] || 1;
                return baseVal * timeMulti;
                
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

            if (sprite && sprite.complete && sprite.naturalWidth > 0) {
                ctx.drawImage(sprite, screenX - drone.size / 2, screenY - drone.size / 2, drone.size, drone.size);
            } else {
                ctx.shadowBlur = 10;
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
