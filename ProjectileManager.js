export default class ProjectileManager {
    constructor() {
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.lastFireTime = 0;
        
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;

        this.HOMING_RANGE = 3;
        this.RICOCHET_RANGE = 8;
        this.NEARBY_LIMIT = 0.5;

        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
        window.addEventListener('mousedown', () => this.isMouseDown = true);
        window.addEventListener('mouseup', () => this.isMouseDown = false);
        this.crosshairPulse = 0;
    }

    init(game) {
        this.game = game;
    }

    spawnEnemyProjectile(config) {
        this.enemyProjectiles.push({
            x: config.x,
            y: config.y,
            vx: config.vx,
            vy: config.vy,
            size: config.size,
            color: config.color,
            damage: config.damage || 1,
            life: 3000
        });
    }

    update(deltaTime) {
        const player = this.game.getModule('player');
        if (!player) return;

        this._handlePlayerFiring(player);
        this._updateProjectiles(player, deltaTime);
        this._updateEnemyProjectiles(player, deltaTime);
        if (this.crosshairPulse > 0) {
            this.crosshairPulse -= deltaTime * 0.0025;
            if (this.crosshairPulse < 0) this.crosshairPulse = 0;
        }
    }

    _updateEnemyProjectiles(player, deltaTime) {
        const particles = this.game.getModule('particles');

        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            const p = this.enemyProjectiles[i];
            
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime;

            if (particles && Math.random() > 0.3) {
                particles.emitTrail(p.x, p.y, p.color || '#ff0055'); 
            }

            const droneMgr = this.game.getModule('drones');
            let hitDrone = false;

            if (droneMgr && droneMgr.drones) {
                for (const drone of droneMgr.drones) {
                    if (drone.hasCollision || drone.behavior === 'INTERCEPTOR') {
                        const dx = drone.x - p.x;
                        const dy = drone.y - p.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        let isReady = true;
                        let effectiveRadius = drone.size / 2;

                        if (drone.behavior === 'INTERCEPTOR') {
                            isReady = drone.actionTimer >= (drone.cooldown || 0);
                            effectiveRadius = drone.blockRadius ? (drone.blockRadius * this.game.UNIT_SIZE) : (drone.size / 2);
                        }

                        if (isReady && dist < (effectiveRadius + p.size / 2)) {
                            hitDrone = true;
                            if (particles) particles.emit(p.x, p.y, drone.color, 10);
                            
                            if (drone.behavior === 'INTERCEPTOR') {
                                drone.actionTimer = 0;
                            }
                            break; 
                        }
                    }
                }
            }

            if (hitDrone) {
                this.enemyProjectiles.splice(i, 1);
                continue;
            }

            const dx = player.pos.x - p.x;
            const dy = player.pos.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < (player.size / 2 + p.size / 2) * 0.8) {
                player.takeDamage(p.damage);
                this.enemyProjectiles.splice(i, 1);
                continue;
            }

            if (p.life <= 0) this.enemyProjectiles.splice(i, 1);
        }
    }

    _handlePlayerFiring(player) {
        if (!this.isMouseDown) return;

        const now = Date.now();
        if (now - this.lastFireTime >= player.getStat('fireRate')) {
            this._spawnBurst(player);
            this.lastFireTime = now;
        }
    }

    _spawnBurst(player) {
        const center = player.getCenter();
        const worldMouseX = this.mouseX + player.pos.x - this.game.center.x;
        const worldMouseY = this.mouseY + player.pos.y - this.game.center.y;
        const baseAngle = Math.atan2(worldMouseY - center.y, worldMouseX - center.x);

        const count = player.getStat('projectileCount'); 
        const spread = player.getStat('projectileSpread') * (Math.PI / 180);
        const bulletSpeed = player.getStat('bulletSpeed');
        const projectileSize = player.getStat('projectileSize');

        for (let i = 0; i < count; i++) {
            let offset = 0;
            if (count > 1) {
                offset = (i - (count - 1) / 2) * spread;
            }

            const finalAngle = baseAngle + offset;
            
            this.projectiles.push({
                x: center.x,
                y: center.y,
                vx: Math.cos(finalAngle) * bulletSpeed,
                vy: Math.sin(finalAngle) * bulletSpeed,
                size: 10 * projectileSize,
                life: 2000,
                isCrit: Math.random() < player.getStat('critChance'),
                bounces: player.getStat('ricochetCount'),
                penetration: player.getStat('penetration') || 0,
                hitEnemies: new Set(),
                lastHitEnemy: null
            });
        }
        this.crosshairPulse = 1.0;

        const particles = this.game.getModule('particles');
        if (particles && player.weaponAngle !== undefined) {
            const barrelDist = player.weaponAnchorDist + 32; 
            
            const barrelX = center.x + Math.cos(player.weaponAngle) * barrelDist;
            const barrelY = center.y + Math.sin(player.weaponAngle) * barrelDist;
            
            particles.emitMuzzle(barrelX, barrelY, player.weaponAngle, '#00ffcc', 5);
        }
    }

    _updateProjectiles(player, deltaTime) {
        const enemyMgr = this.game.getModule('enemies');
        const particles = this.game.getModule('particles'); 

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];

            const currentBulletSpeed = player.getStat('bulletSpeed');
            const aimAssist = player.getStat('aimAssist');

            if (aimAssist > 0) {
                this._applyHoming(p, aimAssist, currentBulletSpeed, enemyMgr, deltaTime);
            }

            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime;

            if (particles && Math.random() > 0.3) {
                particles.emitTrail(p.x, p.y, p.color || '#00ffcc');
            }

            if (p.life <= 0) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    _applyHoming(p, intensity, speed, enemyMgr, deltaTime) {
        if (!enemyMgr) return;

        const target = this._findHomingTarget(p, enemyMgr);
        if (target) {
            const dx = target.x - p.x;
            const dy = target.y - p.y;
            const distPx = Math.sqrt(dx * dx + dy * dy);
            
            const distUnits = distPx / this.game.UNIT_SIZE;

            const targetDirX = dx / distPx;
            const targetDirY = dy / distPx;
            const steerStrength = intensity * 0.01 * deltaTime;

            if (distUnits < this.NEARBY_LIMIT && intensity > 0.8) {
                p.vx = targetDirX * speed;
                p.vy = targetDirY * speed;
            } else {
                p.vx += (targetDirX - p.vx / speed) * steerStrength;
                p.vy += (targetDirY - p.vy / speed) * steerStrength;
            }

            const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            p.vx = (p.vx / currentSpeed) * speed;
            p.vy = (p.vy / currentSpeed) * speed;
        }
    }

    _findHomingTarget(p, enemyMgr) {
        let closest = null;
        let minDistPx = this.HOMING_RANGE * this.game.UNIT_SIZE;

        for (const e of enemyMgr.enemies) {
            if (p.lastHitEnemy === e || (p.hitEnemies && p.hitEnemies.has(e))) continue;

            const dx = e.x - p.x;
            const dy = e.y - p.y;
            const dSq = dx * dx + dy * dy;
            if (dSq < minDistPx * minDistPx) {
                minDistPx = Math.sqrt(dSq);
                closest = e;
            }
        }
        return closest;
    }

    findNextTarget(projectile, currentEnemy) {
        const enemyMgr = this.game.getModule('enemies');
        if (!enemyMgr) return null;

        let closest = null;
        let minDist = this.RICOCHET_RANGE * this.game.UNIT_SIZE;

        for (const enemy of enemyMgr.enemies) {
            if (enemy === currentEnemy) continue;

            const dx = enemy.x - projectile.x;
            const dy = enemy.y - projectile.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDist) {
                minDist = dist;
                closest = enemy;
            }
        }
        return closest;
    }

    draw(ctx) {
        const player = this.game.getModule('player');
        if (!player) return;

        ctx.save();
        ctx.fillStyle = '#00ffcc';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffcc';
        for (const p of this.projectiles) {
            const screenX = p.x - player.pos.x + this.game.center.x;
            const screenY = p.y - player.pos.y + this.game.center.y;
            ctx.beginPath();
            ctx.arc(screenX, screenY, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 10;
        for (const p of this.enemyProjectiles) {
            const screenX = p.x - player.pos.x + this.game.center.x;
            const screenY = p.y - player.pos.y + this.game.center.y;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(screenX, screenY, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}