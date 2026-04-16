import { ENEMY_TYPES } from '../data/EnemyTypes.js';
import { GLITCH_EFFECT_CONFIG, GLITCH_PHASES } from '../data/HackData.js';

export default class EnemyManager {
    constructor() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnRate = 1500;
        this.sprites = new Map();
        this.outlineWidth = 3;
    }

    init(game) {
        this.game = game;
        this._preloadSprites();
    }

    reset() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnRate = 1500;
        this.activePhase = null;
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

        this._handleSpawning(deltaTime);

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];

            this._updateEnemyTimers(e, deltaTime);
            this._applyPhysics(e, player, deltaTime);
            this._handleRangedAttack(e, player, deltaTime);
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
    }

    _applyPhysics(e, player, deltaTime) {
        const stopMargin = 80;
        const innerW = (this.game.canvas.width / 2) - stopMargin;
        const innerH = (this.game.canvas.height / 2) - stopMargin;
        const turboMultiplier = 3;
        const COOLDOWN_TIME = 5000;
        
        const TELEPORT_THRESHOLD = 200; 

        const dxP = player.pos.x - e.x;
        const dyP = player.pos.y - e.y;
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
        if (e.speedModifier < 1) {
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

        if (!isAttackingAndStopping && distP > 1) {
            let currentSpeed = e.speed;
            
            if (isOutsideView && e.turboCooldown <= 0) {
                if (isDeepInFog && Math.random() < 0.5) {
                    const margin = 100;
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
            
            e.x += moveX * deltaTime;
            e.y += moveY * deltaTime;
        } else {
            e.x += sep.x * deltaTime;
            e.y += sep.y * deltaTime;
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
        const dxP = player.pos.x - e.x;
        const dyP = player.pos.y - e.y;
        const distP = Math.sqrt(dxP * dxP + dyP * dyP);
        const collisionDistPlayer = (e.size + player.size) * 0.4;

        if (distP < collisionDistPlayer && player.invulnerable <= 0) {
            player.takeDamage(1);
            
            if (e.isSuicidal) {
                e.currentHp = 0;
            } else {
                const dirX = (e.x - player.pos.x) / distP;
                const dirY = (e.y - player.pos.y) / distP;

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
                    const pDist = Math.sqrt(pDx * pDx + pDy * pDy);

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
        let damage = playerMod ? playerMod.getStat('damage') : 1;

        if (p.isCrit) {
            damage *= (playerMod ? playerMod.getStat('critMultiplier') : 2);
            const particles = this.game.getModule('particles');
            if (particles) particles.emit(p.x, p.y, '#ffffff', 5);
        }

        if (e.isTagged && e.tagMultiplier) {
            damage *= e.tagMultiplier;
        }

        e.currentHp -= damage;

        if (p.bounces > 0) {
            const nextTarget = pm.findNextTarget(p, e);
            if (nextTarget) {
                p.bounces--;
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
        this.spawnTimer += deltaTime;
        if (this.spawnTimer > this.spawnRate) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }
    }

    _handleEnemyDeath(e, index) {
        const ui = this.game.getModule('ui');
        const particles = this.game.getModule('particles');
        const xpMgr = this.game.getModule('experience');
        const director = this.game.getModule('director');
        const powerUpMgr = this.game.getModule('powerups');

        if (e.glitchPhase === GLITCH_PHASES.PRIMARY) {
            const radiusPx = GLITCH_EFFECT_CONFIG.spreadRadiusPx;
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
        }

        if (ui) ui.addScore(e.scoreValue);
        if (particles) particles.emit(e.x, e.y, e.color || '#ffffff', 15);
        if (xpMgr && director && director.currentPhase) {
            const drop = director.currentPhase.xpDrop;
            xpMgr.spawnOrb(e.x, e.y, drop.value, drop.color);
        }
        if (powerUpMgr) powerUpMgr.trySpawn(e.x, e.y);

        this.enemies.splice(index, 1);
    }

    spawnEnemy() {
        const director = this.game.getModule('director');
        if (!director || !director.currentPhase) return;
        
        const activePhase = director.currentPhase;
        const player = this.game.getModule('player');
        const center = this.game.center;
        const allowedTypes = this.activePhase.types;
        const typeKey = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
        const baseConfig = ENEMY_TYPES[typeKey];

        const margin = 100;
        let spawnX = Math.random() < 0.5 ? -margin : this.game.canvas.width + margin;
        let spawnY = Math.random() * this.game.canvas.height;
        const worldX = spawnX + player.pos.x - center.x;
        const worldY = spawnY + player.pos.y - center.y;

        this.enemies.push({
            ...baseConfig,
            x: worldX,
            y: worldY,
            maxHp: Math.ceil(baseConfig.hp * this.activePhase.hpMultiplier),
            currentHp: Math.ceil(baseConfig.hp * this.activePhase.hpMultiplier),
            speed: baseConfig.speed * this.activePhase.speedMultiplier,
            glitchPhase: GLITCH_PHASES.NORMAL
        });
    }

    _handleRangedAttack(e, player, deltaTime) {
        if (!e.ranged) return;
        
        if (e.shootTimer === undefined) e.shootTimer = 0;
        e.shootTimer += deltaTime;

        const dx = player.pos.x - e.x;
        const dy = player.pos.y - e.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        const rangePx = e.ranged.range * this.game.UNIT_SIZE;

        if (distPx < rangePx && e.shootTimer >= e.ranged.fireRate) {
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

        for (const e of this.enemies) {
            const drawX = e.x - player.pos.x + this.game.center.x;
            const drawY = e.y - player.pos.y + this.game.center.y;

            ctx.save();
            const isGlitch1 = e.glitchPhase === GLITCH_PHASES.PRIMARY;
            const isGlitch2 = e.glitchPhase === GLITCH_PHASES.SECONDARY;

            if (isGlitch1 || isGlitch2) {
                const alphaScale = isGlitch2 ? 0.75 : 1;
                this._drawGlitchPhaseOne(ctx, drawX, drawY, e, alphaScale);
            } else if (e.renderType === 'sprite' && this.sprites.has(e.type)) {
                const img = this.sprites.get(e.type);
                ctx.drawImage(img, drawX - e.size/2, drawY - e.size/2, e.size, e.size);
            } else {
                ctx.shadowBlur = 15;
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