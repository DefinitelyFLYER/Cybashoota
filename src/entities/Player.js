import { HACK_DATA } from '../data/HackData.js';

export default class Player {
    constructor(x, y) {
        this.pos = { x: x, y: y };
        this.size = 64;
        this.facing = 1;
        this.invulnerable = 0;
        this.ghostActive = false;
        this.ghostTimer = 0;
        this.level = 1;
        this.xp = 0;
        this.xpNextLevel = 100;

        this.baseStats = {
            moveSpeed: 0.22,
            maxHp: 3,
            fireRate: 500,
            bulletSpeed: 0.9,
            projectileSize: 1.1,
            critMultiplier: 2.2,
            magnetRange: 0.85,
            xpMultiplier: 1.0,
            luck: 1.0
        };

        this.multipliers = {
            moveSpeed: 1.0,
            fireRate: 1.0, 
            bulletSpeed: 1.0,
            projectileSize: 1.0,
            critMultiplier: 1.0,
            magnetRange: 1.0,
            xpMultiplier: 1.0,
            luck: 1.0
        };

        this.stats = {
            hp: 3,
            maxHp: 3, 
            defense: 0,
            damage: 1,
            dodgeChance: 0.08,
            projectileCount: 1,
            projectileSpread: 5,
            aimAssist: 0,
            critChance: 0.08,
            penetration: 0,
            ricochetCount: 0,
            upgradeOptions: 3,
            rerolls: 3,
            maxDrones: 1,
            maxHackSlots: 1
        };

        this.armorCharges = 0;
        this._lastKnownDefense = 0;
        this.armorRechargeTimer = 0;
        this.armorRechargeDuration = 20000;

        this.augments = {
            head: null,
            arms: null,
            legs: null,
            core: null
        };
        
        this.sprite = new Image();
        this.sprite.src = 'assets/characters/player.png';
        this.isLoaded = false;
        this.sprite.onload = () => { this.isLoaded = true; };

        this.weaponSprite = new Image();
        this.weaponSprite.src = 'assets/weapons/weapon.png';
        this.isWeaponLoaded = false;
        this.weaponSprite.onload = () => this.isWeaponLoaded = true;
        
        this.weaponAnchorDist = 5;
        this.weaponAngle = 0;

        this.shockwaveActive = false;
        this.shockwaveRadius = 0;
        this.shockwaveMaxRadius = 400;
        this.shockwaveDuration = 1400;
        this.shockwaveTimer = 0;
        this.shockwaveDamage = 0;
        this.shockwaveColor = '#00ffcc';
        this.shockwaveHitEnemies = new Set();
    }

    equipAugment(augmentOrId) {
        const augmentMgr = this.game?.getModule('augments');
        if (!augmentMgr) return false;
        return augmentMgr.equipAugment(augmentOrId);
    }

    unequipAugment(slot) {
        const augmentMgr = this.game?.getModule('augments');
        if (!augmentMgr) return null;
        return augmentMgr.unequipSlot(slot);
    }

    getStat(name) {
        if (name === 'damage') {
            return Math.max(0.1, this.stats.damage);
        }

        if (this.baseStats[name] !== undefined) {
            const mult = Math.max(0.1, this.multipliers[name]);
            if (name === 'fireRate') return this.baseStats[name] / mult;
            return this.baseStats[name] * mult;
        }
        return this.stats[name];
    }

    getCenter() {
        return { x: this.pos.x, y: this.pos.y };
    }

    init(game) {
        this.game = game;
    }

    reset() {
        const center = this.game ? this.game.center : { x: this.pos.x, y: this.pos.y };
        this.pos = { x: center.x, y: center.y };
        this.size = 64;
        this.facing = 1;
        this.invulnerable = 0;
        this.ghostActive = false;
        this.ghostTimer = 0;
        this.level = 1;
        this.xp = 0;
        this.xpNextLevel = 100;
        this.multipliers = {
            moveSpeed: 1.0,
            fireRate: 1.0, 
            bulletSpeed: 1.0,
            projectileSize: 1.0,
            critMultiplier: 1.0,
            magnetRange: 1.0,
            xpMultiplier: 1.0,
            luck: 1.0
        };
        this.stats = {
            hp: 3,
            maxHp: 3, 
            defense: 0,
            damage: 1,
            dodgeChance: 0.08,
            projectileCount: 1,
            projectileSpread: 5,
            aimAssist: 0,
            critChance: 0.08,
            penetration: 0,
            ricochetCount: 0,
            upgradeOptions: 3,
            rerolls: 3,
            maxDrones: 1,
            maxHackSlots: 1
        };

        this.armorCharges = 0;
        this._lastKnownDefense = 0;
        this.armorRechargeTimer = 0;
        this.armorRechargeDuration = 20000;

        this.augments = {
            head: null,
            arms: null,
            legs: null,
            core: null
        };
        this.weaponAnchorDist = 5;
        this.weaponAngle = 0;
        this.shockwaveActive = false;
        this.shockwaveRadius = 0;
        this.shockwaveMaxRadius = 400;
        this.shockwaveDuration = 1400;
        this.shockwaveTimer = 0;
        this.shockwaveDamage = 0;
        this.shockwaveColor = '#00ffcc';
        this.shockwaveHitEnemies = new Set();
    }

    triggerShockwave(options = {}) {
        this.shockwaveActive = true;
        this.shockwaveRadius = 0;
        this.shockwaveTimer = 0;
        this.shockwaveMaxRadius = options.maxRadius || 400;
        this.shockwaveDuration = options.duration || 1400;
        this.shockwaveDamage = options.damage || 0;
        this.shockwaveColor = options.color || '#00ffcc';
        this.shockwaveHitEnemies = new Set();
    }

    getMaxArmor() {
        return Math.max(0, Math.floor(this.stats.defense || 0));
    }

    _syncArmorWithDefense() {
        const maxArmor = this.getMaxArmor();
        if (maxArmor > this._lastKnownDefense) {
            const gained = maxArmor - this._lastKnownDefense;
            this.armorCharges = Math.min(maxArmor, this.armorCharges + gained);
        } else if (this.armorCharges > maxArmor) {
            this.armorCharges = maxArmor;
        }
        this._lastKnownDefense = maxArmor;
    }

    _updateArmor(deltaTime) {
        this._syncArmorWithDefense();
        const maxArmor = this.getMaxArmor();
        if (maxArmor <= 0 || this.armorCharges >= maxArmor) {
            this.armorRechargeTimer = 0;
            return;
        }

        this.armorRechargeTimer += deltaTime;
        if (this.armorRechargeTimer >= this.armorRechargeDuration) {
            this.armorRechargeTimer = 0;
            this.armorCharges = Math.min(maxArmor, this.armorCharges + 1);
            const particles = this.game?.getModule('particles');
            if (particles) {
                particles.emit(this.pos.x, this.pos.y, '#ff9900', 10);
            }
        }
    }

    takeDamage(amount = 1) {
        if (this.ghostActive) return;
        if (this.invulnerable > 0) return;

        this._syncArmorWithDefense();
        const augmentMgr = this.game?.getModule('augments');

        if (Math.random() < this.stats.dodgeChance) {
            this.invulnerable = 500;
            const synergyMgr = this.game?.getModule('synergies');
            if (this.ghostActive && synergyMgr && synergyMgr.hasSynergy('chrono_mirage')) {
                this.ghostTimer += 1500;
            }
            if (augmentMgr) augmentMgr.onPlayerDamagedOrDodged(true);
            return;
        }

        // Rechargeable Armor Charge blocks 1 hit completely
        if (this.armorCharges > 0) {
            this.armorCharges -= 1;
            this.armorRechargeTimer = 0;
            this.invulnerable = 1000;
            const particles = this.game?.getModule('particles');
            if (particles) {
                particles.emit(this.pos.x, this.pos.y, '#ff9900', 14);
            }
            const synergyMgr = this.game?.getModule('synergies');
            if (synergyMgr) synergyMgr.onArmorBroken(this);
            if (augmentMgr) augmentMgr.onPlayerDamagedOrDodged(false);
            return;
        }

        this.armorRechargeTimer = 0;
        const finalDamage = Math.max(1, amount);
        
        this.stats.hp -= finalDamage;
        
        this.invulnerable = 1500;
        if (augmentMgr) augmentMgr.onPlayerDamagedOrDodged(false);

        if (this.stats.hp <= 0) {
            this.stats.hp = 0;
            if (this.game.gameOver) {
                this.game.gameOver();
            } else {
                console.log("GAME OVER - the player died");
            }
        }
    }

    addXp(amount) {
        const bonusXp = amount * this.getStat('xpMultiplier');
        this.xp += bonusXp;
        
        while (this.xp >= this.xpNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.xp -= this.xpNextLevel;
        this.level++;
        this.xpNextLevel = Math.floor(this.xpNextLevel * 1.2 + 50);

        this.triggerShockwave({ maxRadius: 400, duration: 1400, damage: 0, color: '#00ffcc' });

        const upgrades = this.game.getModule('upgrades');
        if (upgrades) {
            const reachedLevel = this.level;
            setTimeout(() => {
                if (this.game && (this.game.isGameOver || this.game.gameState !== 'PLAYING')) return;
                if (upgrades.addLevelUp) upgrades.addLevelUp(reachedLevel);
                else upgrades.showSelection(); 
            }, 200);
        }
    }

    updateMaxHp() {
        if (this.stats.hp > this.stats.maxHp) {
            this.stats.hp = this.stats.maxHp;
        }
    }

    _handleMovement(deltaTime, input) {
        let moveX = 0;
        let moveY = 0;

        if (input) {
            if (input.isActionDown('moveUp')) moveY -= 1;
            if (input.isActionDown('moveDown')) moveY += 1;
            if (input.isActionDown('moveLeft')) {
                moveX -= 1;
                this.facing = -1;
            }
            if (input.isActionDown('moveRight')) {
                moveX += 1;
                this.facing = 1;
            }
        }

        const gamepad = this.game.getModule('gamepad');
        if (gamepad) {
            const padX = gamepad.axes[0] || 0;
            const padY = gamepad.axes[1] || 0;
            if (Math.abs(padX) > 0.2 || Math.abs(padY) > 0.2) {
                moveX += padX;
                moveY += padY;
                if (padX !== 0) this.facing = padX > 0 ? 1 : -1;
            }
            if (gamepad.buttons.left) moveX -= 1;
            if (gamepad.buttons.right) moveX += 1;
            if (gamepad.buttons.up) moveY -= 1;
            if (gamepad.buttons.down) moveY += 1;
        }

        const mag = Math.sqrt(moveX * moveX + moveY * moveY);
        if (mag > 1) {
            moveX /= mag;
            moveY /= mag;
        }

        const synergyMgr = this.game?.getModule('synergies');
        const juggernautSpeed = synergyMgr && synergyMgr.juggernautBuffTimer > 0 ? 1.25 : 1;
        const ghostwireSpeed = synergyMgr && synergyMgr.ghostwireTimer > 0 ? 1.2 : 1;
        const speedMultiplier = (this.ghostActive ? HACK_DATA.GHOST_PROTOCOL.speedBoostMultiplier : 1) * juggernautSpeed * ghostwireSpeed;
        this.pos.x += moveX * this.getStat('moveSpeed') * speedMultiplier * deltaTime;
        this.pos.y += moveY * this.getStat('moveSpeed') * speedMultiplier * deltaTime;
    }

    _handleWeaponAim(projMgr) {
        const gamepad = this.game.getModule('gamepad');
        if (gamepad) {
            const aimX = gamepad.axes[2] || 0;
            const aimY = gamepad.axes[3] || 0;
            if (Math.abs(aimX) > 0.2 || Math.abs(aimY) > 0.2) {
                this.weaponAngle = Math.atan2(aimY, aimX);
                return;
            }
        }

        if (projMgr) {
            const dx = projMgr.mouseX - this.game.center.x;
            const dy = projMgr.mouseY - this.game.center.y;
            this.weaponAngle = Math.atan2(dy, dx);
        }
    }

    _updateInvulnerability(deltaTime) {
        if (this.invulnerable > 0) {
            this.invulnerable -= deltaTime;
        }
    }

    _updateGhostState(deltaTime) {
        if (!this.ghostActive) return;

        this.ghostTimer -= deltaTime;
        if (this.ghostTimer <= 0) {
            this.ghostActive = false;
            this.ghostTimer = 0;
        }
    }

    _updateShockwave(deltaTime, enemyMgr, projMgr, particles) {
        this.shockwaveTimer += deltaTime;
        const progress = this.shockwaveTimer / this.shockwaveDuration;
        this.shockwaveRadius = progress * this.shockwaveMaxRadius;

        if (progress >= 1) {
            this.shockwaveActive = false;
        }

        if (enemyMgr) {
            for (const e of enemyMgr.enemies) {
                const dx = e.x - this.pos.x;
                const dy = e.y - this.pos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 0 && Math.abs(dist - this.shockwaveRadius) < 40) {
                    const pushForce = 1.0; 
                    e.x += (dx / dist) * pushForce * deltaTime;
                    e.y += (dy / dist) * pushForce * deltaTime;
                    e.turboCooldown = 2000;
                    if (this.shockwaveDamage > 0 && !this.shockwaveHitEnemies.has(e)) {
                        this.shockwaveHitEnemies.add(e);
                        e.currentHp -= this.shockwaveDamage;
                        if (particles) {
                            particles.emit(e.x, e.y, this.shockwaveColor || '#ff7b00', 8);
                        }
                    }
                }
            }
        }

        if (projMgr && projMgr.enemyProjectiles) {
            for (let i = projMgr.enemyProjectiles.length - 1; i >= 0; i--) {
                const p = projMgr.enemyProjectiles[i];
                const dx = p.x - this.pos.x;
                const dy = p.y - this.pos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (Math.abs(dist - this.shockwaveRadius) < 30) {
                    if (particles) {
                        particles.emit(p.x, p.y, p.color, 4);
                    }
                    projMgr.enemyProjectiles.splice(i, 1);
                }
            }
        }
    }

    update(deltaTime) {
        const input = this.game.getModule('input');
        const projMgr = this.game.getModule('projectiles');
        const enemyMgr = this.game.getModule('enemies');
        const particles = this.game.getModule('particles');

        this._handleMovement(deltaTime, input);
        this._handleWeaponAim(projMgr);
        this._updateInvulnerability(deltaTime);
        this._updateGhostState(deltaTime);
        this._updateArmor(deltaTime);

        if (this.shockwaveActive) {
            this._updateShockwave(deltaTime, enemyMgr, projMgr, particles);
        }
    }

    draw(ctx) {
        const screenX = this.game.center.x;
        const screenY = this.game.center.y;

        this._syncArmorWithDefense();

        if (!this.ghostActive && this.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0) return;

        if (this.armorCharges > 0) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 153, 0, 0.55)';
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff9900';
            ctx.beginPath();
            const r = this.size * 0.62;
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI / 3) * i - Math.PI / 6;
                const px = screenX + r * Math.cos(a);
                const py = screenY + r * Math.sin(a);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }

        if (this.game.isSignalJammed) {
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 255, 204, 0.18)';
            ctx.lineWidth = 10;
            ctx.setLineDash([18, 14]);
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size * 0.9, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.scale(this.facing, 1);
        if (this.ghostActive) {
            ctx.globalAlpha = HACK_DATA.GHOST_PROTOCOL.alpha;
        }

        if (this.isLoaded) {
            ctx.drawImage(this.sprite, -this.size / 2, -this.size / 2, this.size, this.size);
        } else {
            ctx.fillStyle = '#00ffcc';
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        }
        ctx.restore();

        if (this.isWeaponLoaded) {
            this._drawWeapon(ctx, screenX, screenY);
        }

        if (this.shockwaveActive) {
            this._drawShockwave(ctx);
        }
    }

    _drawWeapon(ctx, screenX, screenY) {
        ctx.save();
        
        ctx.translate(screenX, screenY);
        
        ctx.rotate(this.weaponAngle);
        
        ctx.translate(this.weaponAnchorDist, 0);

        if (Math.abs(this.weaponAngle) > Math.PI / 2) {
            ctx.scale(1, -1); 
        }

        const wWidth = 32;
        const wHeight = 16;
        
        ctx.drawImage(this.weaponSprite, 0, -wHeight / 2, wWidth, wHeight);
        
        ctx.restore();
    }

    _drawShockwave(ctx) {
        const progress = this.shockwaveTimer / this.shockwaveDuration;
        const waveColor = this.shockwaveColor || '#00ffcc';
        ctx.save();
        
        ctx.beginPath();
        ctx.arc(this.game.center.x, this.game.center.y, this.shockwaveRadius, 0, Math.PI * 2);
        
        ctx.globalAlpha = Math.max(0, 1 - progress);
        ctx.strokeStyle = waveColor;
        ctx.lineWidth = 15 * (1 - progress);
        ctx.shadowBlur = 25;
        ctx.shadowColor = waveColor;

        ctx.setLineDash([20, 15]);
        
        ctx.stroke();

        ctx.setLineDash([]); 
        
        ctx.restore();
    }
}