import { DRONE_TYPES } from './DroneTypes.js';

export default class DroneManager {
    constructor() {
        this.drones = [];
        this.sprites = new Map();
        
        this.testSpawnCooldown = 0; 
    }

    init(game) {
        this.game = game;
        this._preloadSprites();
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
            y: 0
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
        if (!projMgr || projMgr.enemyProjectiles.length === 0 || !player) return false;

        let closestProj = null;
        let minDist = (drone.blockRadius || 4) * this.game.UNIT_SIZE;

        const droneToPlayerDist = Math.sqrt(Math.pow(player.pos.x - drone.x, 2) + Math.pow(player.pos.y - drone.y, 2));
        const tolerancePx = 0.15 * this.game.UNIT_SIZE;

        for (const p of projMgr.enemyProjectiles) {
            const toPlayerX = player.pos.x - p.x;
            const toPlayerY = player.pos.y - p.y;
            
            const isApproaching = (p.vx * toPlayerX) + (p.vy * toPlayerY);
            if (isApproaching <= 0) continue; 

            const dist = Math.sqrt(toPlayerX * toPlayerX + toPlayerY * toPlayerY);
            
            if (dist < droneToPlayerDist - tolerancePx) continue;
            
            if (dist < minDist) {
                minDist = dist;
                closestProj = p;
            }
        }

        if (closestProj) {
            const accuracy = this._getStat(drone, 'droneAccuracy', player);
            const lerpFactor = 1 - Math.pow(1 - accuracy, deltaTime / 16);
            
            drone.x += (closestProj.x - drone.x) * lerpFactor;
            drone.y += (closestProj.y - drone.y) * lerpFactor;
            
            return true;
        }

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
        const val = drone[statName];
        if (typeof val === 'function') {
            return val(player);
        }
        return val;
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