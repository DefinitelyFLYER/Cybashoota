export default class ProjectileManager {
    constructor() {
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.lastFireTime = 0;
        
        this.mouseX = 0;
        this.mouseY = 0;
        this.touchX = 0;
        this.touchY = 0;
        this.crosshairX = 0;
        this.crosshairY = 0;
        this.crosshairRadius = 160;
        this.isMouseDown = false;
        this.isTouching = false;
        this.gamepadAimX = 0;
        this.gamepadAimY = 0;
        this.gamepadFire = false;
        this.menuCursorSpeed = 0.55;
        this.lastMouseMoveTime = 0;
        this.lastTouchInputTime = 0;
        this.lastGamepadInputTime = 0;

        this.HOMING_RANGE = 3;
        this.RICOCHET_RANGE = 8;
        this.NEARBY_LIMIT = 0.5;

        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.lastMouseMoveTime = Date.now();
        });
        window.addEventListener('mousedown', () => this.isMouseDown = true);
        window.addEventListener('mouseup', () => this.isMouseDown = false);

        window.addEventListener('touchstart', (e) => {
            if (e.cancelable) e.preventDefault();
            const touch = e.changedTouches[0];
            if (!touch) return;
            this.touchX = touch.clientX;
            this.touchY = touch.clientY;
            this.isTouching = true;
            this.lastTouchInputTime = Date.now();
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (e.cancelable) e.preventDefault();
            const touch = e.changedTouches[0];
            if (!touch) return;
            this.touchX = touch.clientX;
            this.touchY = touch.clientY;
            this.lastTouchInputTime = Date.now();
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
            if (e.cancelable) e.preventDefault();
            this.isTouching = false;
            this.lastTouchInputTime = Date.now();
        }, { passive: false });

        window.addEventListener('touchcancel', (e) => {
            if (e.cancelable) e.preventDefault();
            this.isTouching = false;
            this.lastTouchInputTime = Date.now();
        }, { passive: false });

        this.crosshairPulse = 0;
    }

    init(game) {
        this.game = game;
    }

    reset() {
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.lastFireTime = 0;
        this.isMouseDown = false;
        this.isTouching = false;
        this.gamepadAimX = 0;
        this.gamepadAimY = 0;
        this.gamepadFire = false;
        this.crosshairPulse = 0;
        if (this.game) {
            this.crosshairX = this.game.center.x;
            this.crosshairY = this.game.center.y;
            this.touchX = this.game.center.x;
            this.touchY = this.game.center.y;
            this.mouseX = this.game.center.x;
            this.mouseY = this.game.center.y;
        }
    }

    _getPointerTime() {
        return Math.max(this.lastMouseMoveTime, this.lastTouchInputTime);
    }

    _getPointerCoords() {
        if (this.lastTouchInputTime >= this.lastMouseMoveTime) {
            return { x: this.touchX, y: this.touchY };
        }
        return { x: this.mouseX, y: this.mouseY };
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

        this._updateGamepadState();
        this._updateCrosshairPosition(player);
        this._handlePlayerFiring(player);
        this._updateProjectiles(player, deltaTime);
        this._updateEnemyProjectiles(player, deltaTime);
        if (this.crosshairPulse > 0) {
            this.crosshairPulse -= deltaTime * 0.0025;
            if (this.crosshairPulse < 0) this.crosshairPulse = 0;
        }
    }

    updateMenu(deltaTime) {
        const player = this.game.getModule('player');
        if (!player) return;

        this._updateGamepadState();
        this._updateMenuCrosshairPosition(deltaTime);
        if (this.crosshairPulse > 0) {
            this.crosshairPulse -= deltaTime * 0.0025;
            if (this.crosshairPulse < 0) this.crosshairPulse = 0;
        }
    }

    _updateMenuCrosshairPosition(deltaTime) {
        const gamepad = this.game.getModule('gamepad');
        const touch = this.game.getModule('touch');
        const hasPad = gamepad && gamepad.gamepadIndex !== null;
        const lastPointerTime = Math.max(this._getPointerTime(), touch?.lastInputTime || 0);
        const useGamepad = hasPad && this.lastGamepadInputTime >= lastPointerTime;

        if (useGamepad) {
            if (this.crosshairX === 0 && this.crosshairY === 0) {
                this.crosshairX = this.game.center.x;
                this.crosshairY = this.game.center.y;
            }

            this.crosshairX += this.gamepadAimX * this.menuCursorSpeed * deltaTime;
            this.crosshairY += this.gamepadAimY * this.menuCursorSpeed * deltaTime;

            const canvas = this.game.canvas;
            this.crosshairX = Math.max(0, Math.min(this.crosshairX, canvas.width));
            this.crosshairY = Math.max(0, Math.min(this.crosshairY, canvas.height));
        } else if (touch && touch.isAiming) {
            this.crosshairX = this.game.center.x + touch.aimVector.x * this.crosshairRadius;
            this.crosshairY = this.game.center.y + touch.aimVector.y * this.crosshairRadius;
        } else {
            const pointer = this._getPointerCoords();
            this.crosshairX = pointer.x;
            this.crosshairY = pointer.y;
        }
    }

    _updateGamepadState() {
        const gamepad = this.game.getModule('gamepad');
        if (!gamepad) {
            this.gamepadAimX = 0;
            this.gamepadAimY = 0;
            this.gamepadFire = false;
            return;
        }

        const rawAimX = gamepad.axes[2] || 0;
        const rawAimY = gamepad.axes[3] || 0;
        const magnitude = Math.sqrt(rawAimX * rawAimX + rawAimY * rawAimY);
        const deadzone = 0.2;

        if (magnitude > deadzone) {
            this.gamepadAimX = rawAimX;
            this.gamepadAimY = rawAimY;
            this.lastGamepadInputTime = Date.now();
        } else {
            this.gamepadAimX = 0;
            this.gamepadAimY = 0;
        }

        this.gamepadFire = gamepad.buttons.RT;
        if (this.gamepadFire) {
            this.lastGamepadInputTime = Date.now();
        }

        const buttonUsed = gamepad.buttons.A || gamepad.buttons.B || gamepad.buttons.X || gamepad.buttons.Y ||
                           gamepad.buttons.up || gamepad.buttons.down || gamepad.buttons.left || gamepad.buttons.right ||
                           gamepad.buttons.menu;
        if (buttonUsed) {
            this.lastGamepadInputTime = Date.now();
        }
    }

    _updateCrosshairPosition(player) {
        const gamepad = this.game.getModule('gamepad');
        const touch = this.game.getModule('touch');
        const hasGamepad = gamepad && gamepad.gamepadIndex !== null;
        const lastPointerTime = Math.max(this._getPointerTime(), touch?.lastInputTime || 0);
        const useGamepad = hasGamepad && this.lastGamepadInputTime >= lastPointerTime;

        if (useGamepad && (this.gamepadAimX !== 0 || this.gamepadAimY !== 0)) {
            const angle = Math.atan2(this.gamepadAimY, this.gamepadAimX);
            this.crosshairX = this.game.center.x + Math.cos(angle) * this.crosshairRadius;
            this.crosshairY = this.game.center.y + Math.sin(angle) * this.crosshairRadius;
        } else if (useGamepad) {
            if (this.crosshairX === 0 && this.crosshairY === 0) {
                this.crosshairX = this.game.center.x + this.crosshairRadius;
                this.crosshairY = this.game.center.y;
            }
        } else if (touch && touch.isAiming) {
            this.crosshairX = this.game.center.x + touch.aimVector.x * this.crosshairRadius;
            this.crosshairY = this.game.center.y + touch.aimVector.y * this.crosshairRadius;
        } else {
            const pointer = this._getPointerCoords();
            this.crosshairX = pointer.x;
            this.crosshairY = pointer.y;
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
        const touch = this.game.getModule('touch');
        const autoFire = this.game?.settings?.gameplay?.autoFire;
        const fireRequested = autoFire || this.isMouseDown || this.isTouching || this.gamepadFire || (touch && touch.isShooting);
        if (!fireRequested) return;

        const now = Date.now();
        if (now - this.lastFireTime >= player.getStat('fireRate')) {
            this._spawnBurst(player);
            this.lastFireTime = now;
        }
    }

    _spawnBurst(player) {
        const center = player.getCenter();
        let baseAngle;
        const touch = this.game.getModule('touch');

        if (this.gamepadAimX !== 0 || this.gamepadAimY !== 0) {
            baseAngle = Math.atan2(this.gamepadAimY, this.gamepadAimX);
        } else if (touch && touch.isAiming) {
            baseAngle = Math.atan2(touch.aimVector.y, touch.aimVector.x);
        } else {
            const pointer = this._getPointerCoords();
            const worldMouseX = pointer.x + player.pos.x - this.game.center.x;
            const worldMouseY = pointer.y + player.pos.y - this.game.center.y;
            baseAngle = Math.atan2(worldMouseY - center.y, worldMouseX - center.x);
        }

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
            const color = this.game?.settings?.gameplay?.crosshairColor || '#00ffcc';
            const barrelDist = player.weaponAnchorDist + 32; 
            
            const barrelX = center.x + Math.cos(player.weaponAngle) * barrelDist;
            const barrelY = center.y + Math.sin(player.weaponAngle) * barrelDist;
            
            particles.emitMuzzle(barrelX, barrelY, player.weaponAngle, color, 5);
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