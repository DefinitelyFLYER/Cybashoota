export default class ProjectileManager {
    constructor() {
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.lastFireTime = 0;
        
        this.mouseX = 0;
        this.mouseY = 0;
        this.crosshairX = 0;
        this.crosshairY = 0;
        this.crosshairRadius = 160;
        this.isMouseDown = false;
        this.gamepadAimX = 0;
        this.gamepadAimY = 0;
        this.gamepadFire = false;
        this.menuCursorSpeed = 0.55;
        this.lastMouseMoveTime = 0;
        this.lastGamepadInputTime = 0;

        this.HOMING_RANGE = 4.5;
        this.RICOCHET_RANGE = 8;
        this.NEARBY_LIMIT = 0.5;

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
        this.gamepadAimX = 0;
        this.gamepadAimY = 0;
        this.gamepadFire = false;
        this.crosshairPulse = 0;
        if (this.game) {
            this.crosshairX = this.game.center.x;
            this.crosshairY = this.game.center.y;
        }
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
        const input = this.game.getModule('input');
        if (input) {
            this.mouseX = input.mouseX;
            this.mouseY = input.mouseY;
            this.isMouseDown = input.isMouseDown;
            this.lastMouseMoveTime = input.lastMouseMoveTime || this.lastMouseMoveTime;
        }

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
        const input = this.game.getModule('input');
        if (input) {
            this.mouseX = input.mouseX;
            this.mouseY = input.mouseY;
            this.isMouseDown = input.isMouseDown;
            this.lastMouseMoveTime = input.lastMouseMoveTime || this.lastMouseMoveTime;
        }

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
        const hasPad = gamepad && gamepad.gamepadIndex !== null;
        const useGamepad = hasPad && this.lastGamepadInputTime >= this.lastMouseMoveTime;

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
        } else {
            this.crosshairX = this.mouseX;
            this.crosshairY = this.mouseY;
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
        const hasGamepad = gamepad && gamepad.gamepadIndex !== null;
        const useGamepad = hasGamepad && this.lastGamepadInputTime >= this.lastMouseMoveTime;

        if (useGamepad && (this.gamepadAimX !== 0 || this.gamepadAimY !== 0)) {
            const angle = Math.atan2(this.gamepadAimY, this.gamepadAimX);
            this.crosshairX = this.game.center.x + Math.cos(angle) * this.crosshairRadius;
            this.crosshairY = this.game.center.y + Math.sin(angle) * this.crosshairRadius;
        } else if (useGamepad) {
            if (this.crosshairX === 0 && this.crosshairY === 0) {
                this.crosshairX = this.game.center.x + this.crosshairRadius;
                this.crosshairY = this.game.center.y;
            }
        } else {
            this.crosshairX = this.mouseX;
            this.crosshairY = this.mouseY;
        }
    }

    _updateEnemyProjectiles(player, deltaTime) {
        const particles = this.game.getModule('particles');
        const augmentMgr = this.game.getModule('augments');
        const projDt = deltaTime * (augmentMgr ? augmentMgr.timeSlowFactor : 1);

        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            const p = this.enemyProjectiles[i];
            
            p.x += p.vx * projDt;
            p.y += p.vy * projDt;
            p.life -= projDt;

            const trailsEnabled = this.game?.settings?.performance?.projectileTrails !== false;
            if (particles && trailsEnabled && Math.random() > 0.3) {
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
                            const cooldown = droneMgr._getStat(drone, 'cooldown', player) || 0;
                            const blockRadius = droneMgr._getStat(drone, 'blockRadius', player);
                            isReady = drone.actionTimer >= cooldown;
                            effectiveRadius = blockRadius ? (blockRadius * this.game.UNIT_SIZE) : (drone.size / 2);
                        }

                        if (isReady && dist < (effectiveRadius + p.size / 2)) {
                            hitDrone = true;
                            if (particles) particles.emit(p.x, p.y, drone.color, 10);
                            
                            if (drone.behavior === 'INTERCEPTOR') {
                                drone.actionTimer = 0;

                                const synergyMgr = this.game.getModule('synergies');
                                if (synergyMgr && synergyMgr.hasSynergy('guardian_relay')) {
                                    for (const other of droneMgr.drones) {
                                        if (other.id === 'HARVESTER_DRONE') {
                                            other.actionTimer += 2500;
                                        }
                                    }
                                }
                                if (synergyMgr && synergyMgr.hasSynergy('solar_aegis')) {
                                    synergyMgr.onAegisIntercept();
                                    const speed = Math.max(0.75, player.getStat('bulletSpeed'));
                                    const target = this.findNextTarget({ x: drone.x, y: drone.y }, null);
                                    const angle = target
                                        ? Math.atan2(target.y - drone.y, target.x - drone.x)
                                        : Math.atan2(-p.vy, -p.vx);
                                    this.projectiles.push({
                                        x: drone.x,
                                        y: drone.y,
                                        vx: Math.cos(angle) * speed,
                                        vy: Math.sin(angle) * speed,
                                        size: 14,
                                        life: 2200,
                                        isCrit: true,
                                        bounces: 0,
                                        penetration: 0,
                                        isHoming: true,
                                        color: '#ff9900',
                                        damage: player.getStat('damage') * 3,
                                        hitEnemies: new Set(),
                                        lastHitEnemy: null
                                    });
                                }
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

            if (!player.ghostActive && dist < (player.size / 2 + p.size / 2) * 0.8) {
                player.takeDamage(p.damage);
                this.enemyProjectiles.splice(i, 1);
                continue;
            }

            if (p.life <= 0) this.enemyProjectiles.splice(i, 1);
        }
    }

    _handlePlayerFiring(player) {
        const autoFire = this.game?.settings?.gameplay?.autoFire;
        const input = this.game.getModule('input');
        const fireRequested = autoFire || (input && input.isActionDown && input.isActionDown('shoot')) || this.gamepadFire;
        if (!fireRequested) return;

        let fireRate = player.getStat('fireRate');
        const synergyMgr = this.game?.getModule('synergies');
        if (synergyMgr) {
            let bonus = 1.0;
            if (this.game.isSignalJammed && synergyMgr.hasSynergy('blackout_matrix')) {
                bonus += 0.5;
            }
            if (synergyMgr.juggernautBuffTimer > 0) {
                bonus += 0.35;
            }
            fireRate /= bonus;
        }

        const now = Date.now();
        if (now - this.lastFireTime >= fireRate) {
            this._spawnBurst(player);
            this.lastFireTime = now;
        }
    }

    _spawnBurst(player) {
        const center = player.getCenter();
        let baseAngle;

        if (this.gamepadAimX !== 0 || this.gamepadAimY !== 0) {
            baseAngle = Math.atan2(this.gamepadAimY, this.gamepadAimX);
        } else {
            const worldMouseX = this.mouseX + player.pos.x - this.game.center.x;
            const worldMouseY = this.mouseY + player.pos.y - this.game.center.y;
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

        // Synergy: Chrono-Mirage (2 phantom turret clones mirror shots while Ghost Protocol is active)
        const synergyMgr = this.game?.getModule('synergies');
        if (player.ghostActive && synergyMgr && synergyMgr.hasSynergy('chrono_mirage')) {
            const cloneOffsets = [
                { x: -46, y: -22 },
                { x: 46, y: -22 }
            ];
            for (const off of cloneOffsets) {
                this.projectiles.push({
                    x: center.x + off.x,
                    y: center.y + off.y,
                    vx: Math.cos(baseAngle) * bulletSpeed,
                    vy: Math.sin(baseAngle) * bulletSpeed,
                    size: 8 * projectileSize,
                    life: 1800,
                    isCrit: Math.random() < player.getStat('critChance'),
                    bounces: 0,
                    penetration: player.getStat('penetration') || 0,
                    color: '#00ffcc',
                    damage: player.getStat('damage') * 0.5,
                    hitEnemies: new Set(),
                    lastHitEnemy: null
                });
            }
        }

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

        const rawAimAssist = player.getStat('aimAssist') || 0;
        const settingScale = Number(this.game?.settings?.gameplay?.aimAssistStrength ?? 1.0);
        const effectiveAimAssist = Math.max(0, rawAimAssist * settingScale);

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];

            if (p.isHoming) {
                const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || player.getStat('bulletSpeed');
                this._applyHoming(p, 1.2, currentSpeed, enemyMgr, deltaTime);
            } else if (effectiveAimAssist > 0 && p.damage === undefined) {
                const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || player.getStat('bulletSpeed');
                this._applyHoming(p, effectiveAimAssist, currentSpeed, enemyMgr, deltaTime);
            }

            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime;

            const trailsEnabled = this.game?.settings?.performance?.projectileTrails !== false;
            if (particles && trailsEnabled && Math.random() > 0.3) {
                particles.emitTrail(p.x, p.y, p.color || '#00ffcc');
            }

            if (p.life <= 0) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    _applyHoming(p, intensity, speed, enemyMgr, deltaTime) {
        if (!enemyMgr || !enemyMgr.enemies || enemyMgr.enemies.length === 0) return;
        if (speed <= 0) return;

        const target = this._findHomingTarget(p, speed, intensity, enemyMgr);
        if (!target) return;

        const dx = target.x - p.x;
        const dy = target.y - p.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        if (distPx <= 0) return;

        const currentAngle = Math.atan2(p.vy, p.vx);
        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // Smooth angular turn rate that snaps cleanly without overshooting or orbiting
        const clampedIntensity = Math.min(1.5, intensity);
        const maxTurnRad = clampedIntensity * 0.0028 * deltaTime;
        const turn = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), maxTurnRad);
        const nextAngle = currentAngle + turn;

        p.vx = Math.cos(nextAngle) * speed;
        p.vy = Math.sin(nextAngle) * speed;
    }

    _findHomingTarget(p, speed, intensity, enemyMgr) {
        const dirX = p.vx / speed;
        const dirY = p.vy / speed;
        const maxRangePx = this.HOMING_RANGE * this.game.UNIT_SIZE;

        // 1. First check if the projectile is ALREADY on a direct collision path with an enemy.
        // If so, never pull it away toward another enemy!
        let directHitEnemy = null;
        let closestDirectDot = Infinity;

        for (const e of enemyMgr.enemies) {
            if (e.currentHp <= 0) continue;
            if (p.lastHitEnemy === e || (p.hitEnemies && p.hitEnemies.has(e))) continue;

            const dx = e.x - p.x;
            const dy = e.y - p.y;
            const dot = dx * dirX + dy * dirY;
            if (dot <= 0 || dot > maxRangePx) continue;

            const perpDist = Math.abs(dx * dirY - dy * dirX);
            const hitRadius = (e.size * 0.48) + (p.size * 0.48);

            if (perpDist <= hitRadius && dot < closestDirectDot) {
                closestDirectDot = dot;
                directHitEnemy = e;
            }
        }

        if (directHitEnemy) {
            return directHitEnemy;
        }

        // 2. Otherwise, search strictly within a forward cone around the aim line,
        // prioritizing enemies closest to the projectile's line of fire.
        const coneDeg = Math.min(42, 18 + intensity * 20);
        const minCos = Math.cos((coneDeg * Math.PI) / 180);

        let bestTarget = null;
        let bestScore = Infinity;

        for (const e of enemyMgr.enemies) {
            if (e.currentHp <= 0) continue;
            if (p.lastHitEnemy === e || (p.hitEnemies && p.hitEnemies.has(e))) continue;

            const dx = e.x - p.x;
            const dy = e.y - p.y;
            const distSq = dx * dx + dy * dy;
            if (distSq <= 0 || distSq > maxRangePx * maxRangePx) continue;

            const dist = Math.sqrt(distSq);
            const dot = dx * dirX + dy * dirY;
            const cosAngle = dot / dist;

            // Ignore enemies outside the forward cone
            if (cosAngle < minCos) continue;

            const perpDist = Math.abs(dx * dirY - dy * dirX);
            // Weight perpendicular distance to the aim ray much higher than forward distance
            const score = perpDist * 2.5 + dot * 0.35;

            if (score < bestScore) {
                bestScore = score;
                bestTarget = e;
            }
        }

        return bestTarget;
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

        const glowEnabled = this.game?.settings?.performance?.glowEffects !== false;
        ctx.save();
        ctx.shadowBlur = glowEnabled ? 15 : 0;
        for (const p of this.projectiles) {
            const color = p.color || '#00ffcc';
            ctx.fillStyle = color;
            if (glowEnabled) ctx.shadowColor = color;
            const screenX = p.x - player.pos.x + this.game.center.x;
            const screenY = p.y - player.pos.y + this.game.center.y;
            ctx.beginPath();
            ctx.arc(screenX, screenY, Math.max(1, p.size / 2), 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = glowEnabled ? 10 : 0;
        for (const p of this.enemyProjectiles) {
            const screenX = p.x - player.pos.x + this.game.center.x;
            const screenY = p.y - player.pos.y + this.game.center.y;
            ctx.fillStyle = p.color;
            if (glowEnabled) ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(screenX, screenY, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}